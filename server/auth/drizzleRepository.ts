import { and, eq, or, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import {
  AuditEvent,
  AuthRepository,
  AuthSession,
  AuthUser,
  BootstrapAdminInput,
  CreateSessionInput,
  DEFAULT_ABSOLUTE_SECONDS,
  DEFAULT_IDLE_SECONDS,
  SessionContext,
} from './service';

type Database = NodePgDatabase<typeof schema>;

function mapUser(user: typeof schema.users.$inferSelect): AuthUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    department: user.department,
    avatarLocation: user.avatarLocation,
    passwordHash: user.passwordHash,
    role: user.role,
    apiAccess: user.apiAccess,
    monthlyQuota: user.monthlyQuota,
    status: user.status,
    mustChangePassword: user.mustChangePassword,
    sessionVersion: user.sessionVersion,
  };
}

function mapSession(session: typeof schema.sessions.$inferSelect): AuthSession {
  return {
    id: session.id,
    userId: session.userId,
    sessionVersion: session.sessionVersion,
    createdAt: session.createdAt,
    lastSeenAt: session.lastSeenAt,
    idleExpiresAt: session.idleExpiresAt,
    absoluteExpiresAt: session.absoluteExpiresAt,
    revokedAt: session.revokedAt,
  };
}

export class DrizzleAuthRepository implements AuthRepository {
  constructor(private readonly db: Database) {}

  async countUsers(): Promise<number> {
    const [result] = await this.db.select({ count: sql<number>`count(*)::int` }).from(schema.users);
    return result.count;
  }

  async createBootstrapAdmin(input: BootstrapAdminInput): Promise<AuthUser> {
    return this.db.transaction(async (transaction) => {
      await transaction.execute(sql`LOCK TABLE ${schema.users} IN SHARE ROW EXCLUSIVE MODE`);
      const [existing] = await transaction.select({ id: schema.users.id }).from(schema.users).limit(1);
      if (existing) throw new Error('Bootstrap refused because the users table is no longer empty.');

      const [created] = await transaction.insert(schema.users).values({
        username: input.username,
        email: input.email,
        displayName: input.displayName,
        passwordHash: input.passwordHash,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        apiAccess: false,
        monthlyQuota: 0,
        mustChangePassword: false,
      }).returning();
      return mapUser(created);
    });
  }

  async findUserByIdentity(identity: string): Promise<AuthUser | null> {
    const normalized = identity.toLowerCase();
    const [user] = await this.db.select().from(schema.users).where(or(
      sql`lower(${schema.users.username}) = ${normalized}`,
      sql`lower(${schema.users.email}) = ${normalized}`,
    )).limit(1);
    return user ? mapUser(user) : null;
  }

  async getSessionDurations(): Promise<{ idleSeconds: number; absoluteSeconds: number }> {
    const [settings] = await this.db.select({
      idleSeconds: schema.applicationSettings.sessionIdleSeconds,
      absoluteSeconds: schema.applicationSettings.sessionAbsoluteSeconds,
    }).from(schema.applicationSettings).where(eq(schema.applicationSettings.id, 1)).limit(1);
    return settings ?? { idleSeconds: DEFAULT_IDLE_SECONDS, absoluteSeconds: DEFAULT_ABSOLUTE_SECONDS };
  }

  async createSessionAndRecordLogin(input: CreateSessionInput): Promise<AuthSession> {
    return this.db.transaction(async (transaction) => {
      const [session] = await transaction.insert(schema.sessions).values({
        tokenHash: input.tokenHash,
        userId: input.userId,
        sessionVersion: input.sessionVersion,
        createdAt: input.now,
        lastSeenAt: input.now,
        idleExpiresAt: input.idleExpiresAt,
        absoluteExpiresAt: input.absoluteExpiresAt,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      }).returning();
      await transaction.update(schema.users).set({
        lastLoginAt: input.now,
        updatedAt: input.now,
      }).where(eq(schema.users.id, input.userId));
      return mapSession(session);
    });
  }

  async findSessionByTokenHash(tokenHash: string): Promise<SessionContext | null> {
    const [row] = await this.db.select({
      session: schema.sessions,
      user: schema.users,
    }).from(schema.sessions).innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
      .where(eq(schema.sessions.tokenHash, tokenHash)).limit(1);
    return row ? { session: mapSession(row.session), user: mapUser(row.user) } : null;
  }

  async touchSession(sessionId: string, lastSeenAt: Date, idleExpiresAt: Date): Promise<void> {
    await this.db.update(schema.sessions).set({ lastSeenAt, idleExpiresAt }).where(and(
      eq(schema.sessions.id, sessionId),
      sql`${schema.sessions.revokedAt} is null`,
    ));
  }

  async revokeSessionByTokenHash(tokenHash: string, revokedAt: Date): Promise<SessionContext | null> {
    return this.db.transaction(async (transaction) => {
      const [row] = await transaction.select({ session: schema.sessions, user: schema.users })
        .from(schema.sessions)
        .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
        .where(eq(schema.sessions.tokenHash, tokenHash))
        .limit(1);
      if (!row) return null;
      if (!row.session.revokedAt) {
        await transaction.update(schema.sessions).set({ revokedAt }).where(and(
          eq(schema.sessions.id, row.session.id),
          sql`${schema.sessions.revokedAt} is null`,
        ));
        row.session.revokedAt = revokedAt;
      }
      return { session: mapSession(row.session), user: mapUser(row.user) };
    });
  }

  async appendAudit(event: AuditEvent): Promise<void> {
    await this.db.insert(schema.auditLogs).values({
      actorUserId: event.actorUserId,
      subjectUserId: event.subjectUserId,
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId,
      outcome: event.outcome,
      metadata: event.metadata ?? {},
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      requestId: event.requestId,
    });
  }
}
