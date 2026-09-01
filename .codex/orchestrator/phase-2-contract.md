# Phase 2 Authentication Operating Contract

This contract removes ambiguity for the Phase 2 implementation. It is intentionally narrow and applies only to authentication/account bootstrap behavior needed for this phase.

## Account provisioning
- There is no public self-registration.
- Existing unauthenticated `POST /api/users` must not remain a public account-creation path after Phase 2.
- User creation is a SUPER_ADMIN-only operation backed by PostgreSQL for the account/auth domain.
- A newly provisioned account is always created as `USER`, `api_access=false`, `monthly_quota=0`, `status=PENDING`, and `must_change_password=true` regardless of client-supplied privilege fields.
- The accepted provisioning fields are limited to username, email, display name, and optional department. Role/API access/quota/status/session-version values from the request body are ignored or rejected.

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
- Use Node's built-in `crypto.scrypt`/`scryptSync` with a unique random salt and a versioned/parameterized stored encoding.
- Password verification must use constant-time comparison.
- Minimum accepted password length is 12 characters. Enforce a reasonable maximum input length to avoid abuse.

## Sessions
- Session cookies are opaque cryptographically-random values; store only a SHA-256 hash in the `sessions` table.
- Cookie name: `radmehr_session`.
- Cookie attributes: HttpOnly, SameSite=Lax, Path=/; Secure in production and explicitly non-Secure in local development.
- Use the Phase 1 application policy of 8-hour idle expiry and 7-day absolute expiry.
- Successful authenticated requests refresh idle expiry but never extend absolute expiry.
- Disabled/non-active users, revoked sessions, expired sessions, and session-version mismatches are rejected.
- Login errors are generic and do not disclose whether username/email exists.

## Phase boundary
- It is acceptable to migrate only the user/account endpoints required for secure authentication from JSON persistence to PostgreSQL in this phase.
- Do not migrate templates, assets, generation/quota/provider behavior, backups, or unrelated JSON persistence yet.
- Broader RBAC enforcement over unrelated application routes remains Phase 3, except the minimum SUPER_ADMIN check required to prevent public account provisioning/reset-token issuance in Phase 2.
