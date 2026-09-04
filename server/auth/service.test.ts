// @vitest-environment node

import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password';
import {
  AuditEvent,
  AuthenticationError,
  AuthRepository,
  AuthService,
  AuthSession,
  AuthUser,
  BootstrapAdminInput,
  bootstrapFirstSuperAdmin,
  CreateSessionInput,
  DEFAULT_ABSOLUTE_SECONDS,
  DEFAULT_IDLE_SECONDS,
  hashSessionToken,
  readBootstrapConfiguration,
  SessionContext,
} from './service';

const NOW = new Date('2026-09-01T12:00:00.000Z');

function user(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 'user-1',
    username: 'Admin.User',
    email: 'Admin@Example.test',
    displayName: 'Admin User',
    department: null,
    avatarLocation: null,
    passwordHash: null,
    role: 'SUPER_ADMIN',
    apiAccess: false,
    monthlyQuota: 0,
    status: 'ACTIVE',
    mustChangePassword: false,
    sessionVersion: 1,
    ...overrides,
  };
}

class MemoryRepository implements AuthRepository {
  users: AuthUser[] = [];
  sessions = new Map<string, SessionContext>();
  audits: AuditEvent[] = [];

  async countUsers() { return this.users.length; }
  async createBootstrapAdmin(input: BootstrapAdminInput) {
    if (this.users.length) throw new Error('not empty');
    const created = user({ username: input.username, email: input.email, displayName: input.displayName, passwordHash: input.passwordHash });
    this.users.push(created);
    return created;
  }
  async findUserByIdentity(identity: string) {
    const normalized = identity.toLowerCase();
    return this.users.find((entry) => entry.username.toLowerCase() === normalized || entry.email.toLowerCase() === normalized) ?? null;
  }
  async getSessionDurations() { return { idleSeconds: DEFAULT_IDLE_SECONDS, absoluteSeconds: DEFAULT_ABSOLUTE_SECONDS }; }
  async createSessionAndRecordLogin(input: CreateSessionInput): Promise<AuthSession> {
    const session: AuthSession = {
      id: `session-${this.sessions.size + 1}`,
      userId: input.userId,
      sessionVersion: input.sessionVersion,
      createdAt: input.now,
      lastSeenAt: input.now,
      idleExpiresAt: input.idleExpiresAt,
      absoluteExpiresAt: input.absoluteExpiresAt,
      revokedAt: null,
    };
    const matched = this.users.find((entry) => entry.id === input.userId)!;
    this.sessions.set(input.tokenHash, { session, user: matched });
    return session;
  }
  async findSessionByTokenHash(tokenHash: string) { return this.sessions.get(tokenHash) ?? null; }
  async touchSession(sessionId: string, lastSeenAt: Date, idleExpiresAt: Date) {
    const context = [...this.sessions.values()].find((entry) => entry.session.id === sessionId);
    if (context) Object.assign(context.session, { lastSeenAt, idleExpiresAt });
  }
  async revokeSessionByTokenHash(tokenHash: string, revokedAt: Date) {
    const context = this.sessions.get(tokenHash) ?? null;
    if (context) context.session.revokedAt ??= revokedAt;
    return context;
  }
  async appendAudit(event: AuditEvent) { this.audits.push(event); }
}

const completeEnvironment = {
  RADMEHR_BOOTSTRAP_ADMIN_USERNAME: 'root.admin',
  RADMEHR_BOOTSTRAP_ADMIN_EMAIL: 'root@example.test',
  RADMEHR_BOOTSTRAP_ADMIN_DISPLAY_NAME: 'Root Admin',
  RADMEHR_BOOTSTRAP_ADMIN_PASSWORD: 'A strong bootstrap password!',
};

describe('password hashing', () => {
  it('stores a salted scrypt hash and verifies without plaintext persistence', async () => {
    const first = await hashPassword('correct horse battery staple');
    const second = await hashPassword('correct horse battery staple');
    expect(first).not.toBe(second);
    expect(first).not.toContain('correct horse battery staple');
    await expect(verifyPassword('correct horse battery staple', first)).resolves.toBe(true);
    await expect(verifyPassword('wrong password', first)).resolves.toBe(false);
    await expect(verifyPassword('password', 'malformed')).resolves.toBe(false);
  });
});

describe('SUPER_ADMIN bootstrap', () => {
  it('rejects partial configuration', () => {
    expect(() => readBootstrapConfiguration({ RADMEHR_BOOTSTRAP_ADMIN_EMAIL: 'admin@example.test' }))
      .toThrow(/all four/i);
  });

  it('creates exactly one secure ACTIVE SUPER_ADMIN only in an empty repository', async () => {
    const repository = new MemoryRepository();
    await expect(bootstrapFirstSuperAdmin(repository, completeEnvironment)).resolves.toBe('created');
    expect(repository.users).toHaveLength(1);
    expect(repository.users[0]).toMatchObject({ role: 'SUPER_ADMIN', status: 'ACTIVE', apiAccess: false, monthlyQuota: 0 });
    expect(repository.users[0].passwordHash).not.toContain(completeEnvironment.RADMEHR_BOOTSTRAP_ADMIN_PASSWORD);
    await expect(verifyPassword(completeEnvironment.RADMEHR_BOOTSTRAP_ADMIN_PASSWORD, repository.users[0].passwordHash)).resolves.toBe(true);
    await expect(bootstrapFirstSuperAdmin(repository, completeEnvironment)).resolves.toBe('refused-existing-users');
    expect(repository.users).toHaveLength(1);
  });
});

describe('authentication sessions', () => {
  it('logs in case-insensitively, authenticates the hashed token, and logs out idempotently', async () => {
    const repository = new MemoryRepository();
    repository.users.push(user({ passwordHash: await hashPassword('Secret password 123!') }));
    const service = new AuthService(repository, () => NOW);

    const login = await service.login('ADMIN@EXAMPLE.TEST', 'Secret password 123!');
    expect(login.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(repository.sessions.has(hashSessionToken(login.token))).toBe(true);
    expect(JSON.stringify(login.auth)).not.toContain('passwordHash');
    await expect(service.currentSession(login.token)).resolves.toMatchObject({ account: { id: 'user-1', status: 'ACTIVE' } });

    await service.logout(login.token);
    await expect(service.currentSession(login.token)).rejects.toBeInstanceOf(AuthenticationError);
    await expect(service.logout(login.token)).resolves.toBeUndefined();
    expect(repository.audits.map((entry) => [entry.action, entry.outcome])).toEqual([
      ['AUTH_LOGIN', 'SUCCESS'],
      ['AUTH_LOGOUT', 'SUCCESS'],
      ['AUTH_LOGOUT', 'SUCCESS'],
    ]);
  });

  it('denies disabled accounts without distinguishing them from bad credentials', async () => {
    const repository = new MemoryRepository();
    repository.users.push(user({ status: 'DISABLED', passwordHash: await hashPassword('Secret password 123!') }));
    const service = new AuthService(repository, () => NOW);
    await expect(service.login('Admin.User', 'Secret password 123!')).rejects.toBeInstanceOf(AuthenticationError);
    await expect(service.login('missing', 'wrong')).rejects.toBeInstanceOf(AuthenticationError);
    expect(repository.audits.every((entry) => entry.outcome === 'DENIED')).toBe(true);
    expect(JSON.stringify(repository.audits)).not.toContain('Secret password');
  });

  it('rejects expiry, revocation, malformed tokens, and session-version invalidation', async () => {
    const repository = new MemoryRepository();
    repository.users.push(user({ passwordHash: await hashPassword('Secret password 123!') }));
    const service = new AuthService(repository, () => NOW);

    const expired = await service.login('Admin.User', 'Secret password 123!');
    repository.sessions.get(hashSessionToken(expired.token))!.session.idleExpiresAt = new Date(NOW.getTime() - 1);
    await expect(service.currentSession(expired.token)).rejects.toBeInstanceOf(AuthenticationError);

    const revoked = await service.login('Admin.User', 'Secret password 123!');
    repository.sessions.get(hashSessionToken(revoked.token))!.session.revokedAt = NOW;
    await expect(service.currentSession(revoked.token)).rejects.toBeInstanceOf(AuthenticationError);

    const invalidated = await service.login('Admin.User', 'Secret password 123!');
    repository.users[0].sessionVersion += 1;
    await expect(service.currentSession(invalidated.token)).rejects.toBeInstanceOf(AuthenticationError);
    await expect(service.currentSession('not-a-token')).rejects.toBeInstanceOf(AuthenticationError);
  });
});
