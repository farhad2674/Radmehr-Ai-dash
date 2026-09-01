# Phase 2 Authentication Operating Contract

This contract removes ambiguity for the Phase 2 implementation. It is intentionally narrow and applies only to authentication/account bootstrap behavior needed for this phase.

## Account provisioning
- There is no public self-registration.
- Existing unauthenticated `POST /api/users` must not remain a public account-creation path after Phase 2.
- User creation is a SUPER_ADMIN-only operation backed by PostgreSQL for the account/auth domain.
- A newly provisioned account is always created as `USER`, `api_access=false`, `monthly_quota=0`, `status=PENDING`, and `must_change_password=true` regardless of client-supplied privilege fields.
- The accepted provisioning fields are limited to username, email, display name, and optional department. Role/API access/quota/status/session-version values from the request body are ignored or rejected.
- All existing legacy `/api/users` routes must stop being anonymously callable during Phase 2. It is acceptable for quota-related handlers to remain backed by the legacy JSON store until their later migration, but the whole `/api/users` namespace must be protected by authenticated SUPER_ADMIN middleware before those handlers execute. This is a security boundary only, not a quota/domain migration.
- Authentication routes that must remain public for their intended purpose, such as login, activation, and reset-token consumption, must be registered before any `/api/users` SUPER_ADMIN guard. Protected auth routes such as provisioning/reset-token issuance must perform their own authenticated SUPER_ADMIN check.

## Activation and reset tokens
- Activation and password-reset tokens are opaque cryptographically-random 32-byte values.
- Store only a SHA-256 hash of each raw token in `account_tokens`; never persist or log the raw token.
- Activation/reset tokens expire after 24 hours and are single-use.
- Because Phase 2 does not add an email/SMS provider, a raw activation/reset token may be returned exactly once to the authenticated SUPER_ADMIN who requested it. Delivery to the employee is explicitly out-of-band and is not implemented in this phase.
- `POST /api/auth/activate` accepts an activation token plus the employee's chosen password. On success it consumes the token, stores a secure password hash, activates the account, and clears `must_change_password`.
- An authenticated user may change their own password by supplying the current password plus a new password. Password changes increment `session_version`, revoke existing sessions, and then may create/retain only the current replacement session as the implementation safely permits.
- A SUPER_ADMIN may issue a password-reset token for a user; consuming it sets the new password, consumes the token, increments `session_version`, and revokes existing sessions.

## First SUPER_ADMIN bootstrap
- Bootstrap is permitted only when the PostgreSQL `users` table contains zero users.
- Bootstrap is not an HTTP registration endpoint.
- Bootstrap is driven by deployment environment values: `RADMEHR_BOOTSTRAP_ADMIN_USERNAME`, `RADMEHR_BOOTSTRAP_ADMIN_EMAIL`, `RADMEHR_BOOTSTRAP_ADMIN_DISPLAY_NAME`, and `RADMEHR_BOOTSTRAP_ADMIN_PASSWORD`.
- All four bootstrap values are required together; partial configuration is a startup error rather than a guess.
- The bootstrap password is read from the environment, hashed immediately, never logged, and the in-process password environment value should be deleted after the bootstrap attempt.
- The bootstrap account is created as `SUPER_ADMIN`, `status=ACTIVE`, `api_access=false`, `monthly_quota=0`, and `must_change_password=true`.
- If any user already exists, bootstrap credentials are ignored and no additional SUPER_ADMIN is created.
- `.env.example` already documents these four bootstrap variable names with empty placeholder values. The Implementer must not edit `.env.example` during Phase 2 generation; it is reference context only.

## Passwords
- Do not add a dependency solely for password hashing in Phase 2.
- For this phase, use Node's built-in synchronous `crypto.scryptSync` for both password hashing and verification. Do not use `promisify(crypto.scrypt)` and do not mix asynchronous and synchronous password APIs.
- Fixed parameters for Phase 2: `N=16384`, `r=8`, `p=1`, derived key length `64` bytes, random salt length `16` bytes.
- Stored encoding must be exactly: `scrypt$v1$N=16384,r=8,p=1$<saltHex>$<digestHex>` where `saltHex` is 32 lowercase hex characters and `digestHex` is 128 lowercase hex characters.
- `hashPassword(password)` must: validate password bounds; generate `randomBytes(16)`; derive exactly 64 bytes using `scryptSync(password, saltBuffer, 64, { N: 16384, r: 8, p: 1 })`; and encode both salt and digest as lowercase hex in the exact format above.
- `verifyPassword(password, encoded)` must be synchronous and return boolean. It must fail closed on malformed input. Parse exactly five `$`-separated components: `scrypt`, `v1`, parameter string, saltHex, digestHex. Require the parameter string to equal `N=16384,r=8,p=1`; require salt/digest to match the exact lowercase-hex lengths above; decode with `Buffer.from(value, 'hex')`; derive 64 bytes with the same scrypt parameters; require equal buffer lengths; then use `timingSafeEqual`.
- The verification test is mandatory: a freshly generated hash must verify `true` for the original password, `false` for a wrong password, and `false` for malformed encodings. Two hashes of the same password must differ because of independent salts.
- Minimum accepted password length is 12 characters. Enforce a reasonable maximum input length to avoid abuse.

## Sessions
- Session cookies are opaque cryptographically-random values; store only a SHA-256 hash in the `sessions` table.
- Cookie name: `radmehr_session`.
- Cookie attributes: HttpOnly, SameSite=Lax, Path=/; Secure in production and explicitly non-Secure in local development.
- Use the Phase 1 application policy of 8-hour idle expiry and 7-day absolute expiry.
- Successful authenticated requests refresh idle expiry but never extend absolute expiry.
- Disabled/non-active users, revoked sessions, expired sessions, and session-version mismatches are rejected.
- Login errors are generic and do not disclose whether username/email exists.

## Last SUPER_ADMIN invariant
- Phase 1 already established a database-level invariant preventing demotion/disablement of the last active `SUPER_ADMIN`; Phase 2 must preserve and rely on that defense-in-depth rather than creating an application bypass.
- Phase 2 must not introduce any user-role or account-status mutation path that can bypass that database invariant.
- The existing PostgreSQL integration test covering prevention of demotion of the last active `SUPER_ADMIN` is required to pass before Phase 2 can receive Guardian PASS.

## Mandatory Phase 2 validation
- `TEST_DATABASE_URL` is mandatory for a Phase 2 acceptance run. If the safe local/test database gate cannot validate it, the run is incomplete and must not proceed to Guardian PASS.
- The existing PostgreSQL DB suite must pass, including user defaults, identity uniqueness, last-active-SUPER_ADMIN protection, and immutable audit behavior.
- A Phase 2 implementation is not COMPLETE if it only adds pure/unit tests for password hashing, token helpers, or session-expiry calculations. At least one generated `.test.ts` file must be a DB-backed authentication integration suite that uses `TEST_DATABASE_URL` and exercises the real PostgreSQL `users`, `sessions`, and `account_tokens` tables through the Phase 2 auth service/handlers.
- When `TEST_DATABASE_URL` is present, the generated DB-backed auth integration tests must execute rather than skip. They must clean up only their own disposable test records or use the existing disposable DB-test isolation strategy; they must never fall back to `DATABASE_URL`.
- The Implementer must return `BLOCK`, not `COMPLETE`, if it cannot provide DB-backed coverage for the mandatory flows within Phase 2 scope.
- Add focused authentication tests beyond password hashing. At minimum validate:
  - successful login creates a server-side session while persisting only the session-token hash;
  - invalid user and invalid password produce the same generic login failure;
  - logout revokes the current session;
  - idle expiry, absolute expiry, and idle refresh without extending absolute expiry;
  - disabled/non-active user rejection and `session_version` mismatch invalidation;
  - activation token expiry and single-use consumption;
  - password-reset token expiry/single-use, password update, session-version increment, and existing-session revocation;
  - SUPER_ADMIN-only provisioning and reset-token issuance;
  - provisioned-user forced defaults (`USER`, no API access, zero quota, `PENDING`, must-change-password);
  - bootstrap succeeds only on an empty users table, partial bootstrap configuration fails closed, and existing users prevent a second bootstrap admin;
  - the legacy `/api/users` namespace is rejected without authenticated SUPER_ADMIN access.
- Tests may use the disposable `TEST_DATABASE_URL` only. They must not call real model/provider APIs or production infrastructure.

## Phase boundary
- It is acceptable to migrate only the user/account endpoints required for secure authentication from JSON persistence to PostgreSQL in this phase.
- Do not migrate templates, assets, generation/quota/provider behavior, backups, or unrelated JSON persistence yet.
- Broader RBAC enforcement over unrelated application routes remains Phase 3. The Phase 2 exception is the minimum SUPER_ADMIN enforcement required around account provisioning/reset-token issuance and the existing legacy `/api/users` namespace so those account/quota mutation routes are no longer anonymous.
