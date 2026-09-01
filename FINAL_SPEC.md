# RadmehrAI Studio — Final Product Target

This file is the product source of truth for the development supervisor. The supervisor must inspect the current repository on every run, compare it with this target, and choose the next highest-value implementation task. Do not treat milestone checkboxes as proof; the code and tests are the actual state.

## Product purpose
RadmehrAI Studio is a private internal company web application for employees to generate and manage AI images. It is not a public consumer product and does not need public self-registration.

## Target stack
- React 19 + TypeScript frontend
- Vite build
- Express backend
- PostgreSQL + Drizzle for persistent application data
- Server-side integration with image-generation providers
- Server-controlled authentication, authorization, quota, usage, and provider credentials

## Core user experience

### Employee
- Log in with a company-managed account.
- See only features allowed for that account.
- Generate images when the account is active, generation access is enabled, and quota is available.
- Use approved templates/prompts and generation options.
- View generated assets/history and relevant metadata.
- Bookmark/manage assets where supported by the product design.
- See clear quota/usage and useful error states.

### SUPER_ADMIN
- Bootstrap the first administrator safely.
- Provision and manage employee accounts.
- Activate/disable accounts and reset credentials.
- Grant/revoke generation access independently from account role.
- Set monthly quota and inspect usage.
- Manage templates and template access.
- Manage application/provider settings that belong on the server.
- Inspect meaningful audit/activity information.

## Authentication and account rules
- No public self-registration.
- Authentication is server-side and PostgreSQL-backed.
- Passwords are stored only as secure hashes.
- Browser sessions use opaque cookies/tokens and server-side session records.
- New employee accounts do not receive generation access by default.
- New normal accounts default to USER, no API/generation access, zero quota until explicitly configured, and an activation/credential setup state.
- Logout, password reset/change, disabled accounts, expired sessions, and session invalidation must behave predictably.

## Authorization
- Backend routes enforce authorization; frontend checks are UX only and are never the security boundary.
- SUPER_ADMIN-only operations are enforced on the server.
- Generation permission is independent from role and must be checked server-side.
- Legacy routes must not provide anonymous or weaker bypasses around the current authorization model.

## Generation and quota flow
The target request flow is:

browser → authenticated backend → account/access/quota checks → atomic quota reservation → provider call → success/failure settlement → asset + usage/audit persistence → response

Requirements:
- Provider credentials never live in browser code.
- The server verifies active account, generation access, and quota before paid generation work.
- Concurrent requests must not overspend quota.
- Successful generation consumes quota and persists the asset/usage record.
- Failed provider work releases or correctly settles reservations.
- Retry/idempotency behavior must avoid accidental double charging where practical.

## Data and persistence
PostgreSQL is the long-term source of truth for account/authentication, permissions, quota/usage, generation jobs, assets, settings, and audit data that belong to the production application.

Legacy JSON/disk persistence may remain temporarily while features are migrated, but the final application must not rely on client-side or ad-hoc JSON state for security-critical account, authorization, or quota decisions.

## UI / UX target
- Professional internal dashboard, not a developer demo.
- Responsive on desktop and tablet/mobile where practical.
- Clear navigation between generation, assets/history, templates, account/usage, and administration according to permission.
- Consistent loading, empty, success, and error states.
- No visible dead controls or fake functionality in the final product.
- Preserve the existing visual direction unless a deliberate redesign is requested.

## Quality target
Before a milestone is considered complete:
- TypeScript passes.
- ESLint passes.
- Relevant automated tests pass.
- Production build passes.
- New backend behavior has focused tests where failure would be costly.
- Existing working functionality is preserved unless the target explicitly replaces it.
- No secrets or credentials are committed.

## Development sequence
The supervisor should use repository reality, not blindly follow this order, but the intended progression is:

1. Quality/test baseline.
2. PostgreSQL foundation and schema.
3. Real authentication and server-side sessions.
4. Authorization and account-domain migration from legacy/client-side controls.
5. Atomic quota/usage and paid generation backend flow.
6. Asset/storage and remaining persistence migration.
7. Admin workflows, templates/settings, and audit completeness.
8. Frontend integration and removal of obsolete client-side security/business logic.
9. UX polish, responsive behavior, error states, performance, and production readiness.

## Definition of done
RadmehrAI Studio v1 is done when an administrator can provision an employee, configure that employee's generation access/quota, the employee can authenticate and generate an image through a server-enforced paid-generation flow, usage/assets persist correctly, unauthorized or over-quota requests are rejected by the backend, administration works without legacy bypasses, and the application passes its quality checks and production build.

## Supervisor rules
- Inspect the repository before choosing work.
- Choose one coherent development task at a time.
- Prefer completing an incomplete product milestone over creating orchestration/meta infrastructure.
- Give Codex a concrete implementation goal and acceptance criteria, not a giant rewrite request.
- After Codex edits, review the actual diff and validation results.
- If the implementation is wrong or incomplete, issue a focused correction and re-review.
- Do not commit, push, deploy, delete major functionality, or change production credentials unless the user explicitly asks.
- Stop and ask the user only for genuine product decisions, credentials/access, destructive actions, or architectural choices that cannot be safely inferred from this file and the existing repository.
