import { createHash, randomBytes } from 'crypto';
import { hashPassword, verifyPassword } from './password';

export const SESSION_COOKIE_NAME = 'radmehr_session';
export const DEFAULT_IDLE_SECONDS = 28_800;
export const DEFAULT_ABSOLUTE_SECONDS = 604_800;

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  department: string | null;
  avatarLocation: string | null;
  passwordHash: string | null;
  role: 'SUPER_ADMIN' | 'USER';
  apiAccess: boolean;
  monthlyQuota: number;
  status: 'PENDING' | 'ACTIVE' | 'DISABLED';
  mustChangePassword: boolean;
  sessionVersion: number;
}

export interface AuthSession {
  id: string;
  userId: string;
  sessionVersion: number;
  createdAt: Date;
  lastSeenAt: Date;
  idleExpiresAt: Date;
  absoluteExpiresAt: Date;
  revokedAt: Date | null;
}

export interface SessionContext {
  session: AuthSession;
  user: AuthUser;
}

export interface RequestContext {
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

export interface AuditEvent extends RequestContext {
  actorUserId?: string;
  subjectUserId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  outcome: 'SUCCESS' | 'FAILURE' | 'DENIED';
  metadata?: Record<string, unknown>;
}

export interface CreateSessionInput extends RequestContext {
  tokenHash: string;
  userId: string;
  sessionVersion: number;
  now: Date;
  idleExpiresAt: Date;
  absoluteExpiresAt: Date;
}

export interface BootstrapAdminInput {
  username: string;
  email: string;
  displayName: string;
  passwordHash: string;
}

export interface AuthRepository {
  countUsers(): Promise<number>;
  createBootstrapAdmin(input: BootstrapAdminInput): Promise<AuthUser>;
  findUserByIdentity(identity: string): Promise<AuthUser | null>;
  getSessionDurations(): Promise<{ idleSeconds: number; absoluteSeconds: number }>;
  createSessionAndRecordLogin(input: CreateSessionInput): Promise<AuthSession>;
  findSessionByTokenHash(tokenHash: string): Promise<SessionContext | null>;
  touchSession(sessionId: string, lastSeenAt: Date, idleExpiresAt: Date): Promise<void>;
  revokeSessionByTokenHash(tokenHash: string, revokedAt: Date): Promise<SessionContext | null>;
  appendAudit(event: AuditEvent): Promise<void>;
}

export interface BootstrapEnvironment {
  RADMEHR_BOOTSTRAP_ADMIN_USERNAME?: string;
  RADMEHR_BOOTSTRAP_ADMIN_EMAIL?: string;
  RADMEHR_BOOTSTRAP_ADMIN_DISPLAY_NAME?: string;
  RADMEHR_BOOTSTRAP_ADMIN_PASSWORD?: string;
}

export interface SafeAuthResult {
  account: {
    id: string;
    username: string;
    email: string;
    displayName: string;
    department: string | null;
    avatarLocation: string | null;
    role: 'SUPER_ADMIN' | 'USER';
    apiAccess: boolean;
    monthlyQuota: number;
    status: 'ACTIVE';
    mustChangePassword: boolean;
  };
  session: {
    id: string;
    createdAt: string;
    lastSeenAt: string;
    idleExpiresAt: string;
    absoluteExpiresAt: string;
  };
}

export class AuthenticationError extends Error {
  constructor() {
    super('Authentication required.');
  }
}

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

function isValidOpaqueToken(token: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(token);
}

function safeResult(context: SessionContext): SafeAuthResult {
  const { user, session } = context;
  return {
    account: {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      department: user.department,
      avatarLocation: user.avatarLocation,
      role: user.role,
      apiAccess: user.apiAccess,
      monthlyQuota: user.monthlyQuota,
      status: 'ACTIVE',
      mustChangePassword: user.mustChangePassword,
    },
    session: {
      id: session.id,
      createdAt: session.createdAt.toISOString(),
      lastSeenAt: session.lastSeenAt.toISOString(),
      idleExpiresAt: session.idleExpiresAt.toISOString(),
      absoluteExpiresAt: session.absoluteExpiresAt.toISOString(),
    },
  };
}

export function readBootstrapConfiguration(env: BootstrapEnvironment): Omit<BootstrapAdminInput, 'passwordHash'> & { password: string } | null {
  const values = {
    username: env.RADMEHR_BOOTSTRAP_ADMIN_USERNAME?.trim(),
    email: env.RADMEHR_BOOTSTRAP_ADMIN_EMAIL?.trim(),
    displayName: env.RADMEHR_BOOTSTRAP_ADMIN_DISPLAY_NAME?.trim(),
    password: env.RADMEHR_BOOTSTRAP_ADMIN_PASSWORD,
  };
  const presentCount = Object.values(values).filter((value) => Boolean(value)).length;
  if (presentCount === 0) return null;
  if (presentCount !== 4) {
    throw new Error('Bootstrap configuration is incomplete. Supply all four RADMEHR_BOOTSTRAP_ADMIN_* variables together.');
  }
  return values as Omit<BootstrapAdminInput, 'passwordHash'> & { password: string };
}

export async function bootstrapFirstSuperAdmin(
  repository: AuthRepository,
  env: BootstrapEnvironment = process.env,
): Promise<'not-configured' | 'created' | 'refused-existing-users'> {
  const configuration = readBootstrapConfiguration(env);
  if (!configuration) return 'not-configured';
  if (await repository.countUsers() !== 0) return 'refused-existing-users';

  const passwordHash = await hashPassword(configuration.password);
  await repository.createBootstrapAdmin({
    username: configuration.username,
    email: configuration.email,
    displayName: configuration.displayName,
    passwordHash,
  });
  return 'created';
}

export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async login(identity: unknown, password: unknown, context: RequestContext = {}): Promise<{ token: string; auth: SafeAuthResult }> {
    const normalizedIdentity = typeof identity === 'string' ? identity.trim() : '';
    const suppliedPassword = typeof password === 'string' ? password : '';
    const user = normalizedIdentity ? await this.repository.findUserByIdentity(normalizedIdentity) : null;
    const passwordAccepted = await verifyPassword(suppliedPassword, user?.passwordHash ?? null);

    if (!user || !passwordAccepted || user.status !== 'ACTIVE') {
      await this.repository.appendAudit({
        ...context,
        subjectUserId: user?.id,
        action: 'AUTH_LOGIN',
        entityType: 'session',
        outcome: 'DENIED',
        metadata: { reason: 'INVALID_CREDENTIALS_OR_ACCOUNT_STATE' },
      });
      throw new AuthenticationError();
    }

    const now = this.now();
    const durations = await this.repository.getSessionDurations();
    const token = randomBytes(32).toString('base64url');
    const absoluteExpiresAt = new Date(now.getTime() + durations.absoluteSeconds * 1000);
    const idleExpiresAt = new Date(Math.min(
      now.getTime() + durations.idleSeconds * 1000,
      absoluteExpiresAt.getTime(),
    ));
    const session = await this.repository.createSessionAndRecordLogin({
      ...context,
      tokenHash: hashSessionToken(token),
      userId: user.id,
      sessionVersion: user.sessionVersion,
      now,
      idleExpiresAt,
      absoluteExpiresAt,
    });
    await this.repository.appendAudit({
      ...context,
      actorUserId: user.id,
      subjectUserId: user.id,
      action: 'AUTH_LOGIN',
      entityType: 'session',
      entityId: session.id,
      outcome: 'SUCCESS',
    });

    return { token, auth: safeResult({ user, session }) };
  }

  async authenticate(token: string | undefined): Promise<SessionContext> {
    if (!token || !isValidOpaqueToken(token)) throw new AuthenticationError();
    const context = await this.repository.findSessionByTokenHash(hashSessionToken(token));
    const now = this.now();
    if (
      !context ||
      context.session.revokedAt ||
      context.session.idleExpiresAt.getTime() <= now.getTime() ||
      context.session.absoluteExpiresAt.getTime() <= now.getTime() ||
      context.session.sessionVersion !== context.user.sessionVersion ||
      context.user.status !== 'ACTIVE'
    ) {
      throw new AuthenticationError();
    }

    const durations = await this.repository.getSessionDurations();
    const nextIdleExpiry = new Date(Math.min(
      now.getTime() + durations.idleSeconds * 1000,
      context.session.absoluteExpiresAt.getTime(),
    ));
    await this.repository.touchSession(context.session.id, now, nextIdleExpiry);
    context.session.lastSeenAt = now;
    context.session.idleExpiresAt = nextIdleExpiry;
    return context;
  }

  async currentSession(token: string | undefined): Promise<SafeAuthResult> {
    return safeResult(await this.authenticate(token));
  }

  async logout(token: string | undefined, context: RequestContext = {}): Promise<void> {
    if (!token || !isValidOpaqueToken(token)) return;
    const revoked = await this.repository.revokeSessionByTokenHash(hashSessionToken(token), this.now());
    if (!revoked) return;
    await this.repository.appendAudit({
      ...context,
      actorUserId: revoked.user.id,
      subjectUserId: revoked.user.id,
      action: 'AUTH_LOGOUT',
      entityType: 'session',
      entityId: revoked.session.id,
      outcome: 'SUCCESS',
    });
  }
}
