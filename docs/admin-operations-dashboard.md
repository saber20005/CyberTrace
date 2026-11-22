# CyberTrace — revocation-aware admin backend pilot (2026-11-22)

The feature branch pins Firebase Admin SDK **14.5.1** in package.json and the generated package-lock.json. Unlike the earlier manual JWT verifier, GET /api/admin/summary now calls server-only verifyAdminIdentity: verifyIdToken(token, true) (revocation/disabled-user check), then getUser(uid) (matching UID, enabled status and current admin:true custom claim). Failed verification never falls back to the old verifier.

The API returns 401 for missing, invalid, revoked or expired tokens, 403 for current non-admin, 503 for missing or invalid server credentials/Firebase outage, and 200 only for a currently authorized administrator. It returns only reviewed public training-catalog counts; user totals, XP, scores, revenue and private records remain unconfigured. The API never accepts admin role or UID from client-supplied request bodies.

**Critical release blocker:** Vercel's CyberTrace project currently has no visible FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON configured. With no server-only credential this endpoint denies access with 503, not a fabricated 200. Do not merge to production or promote a preview until the owner provisions a narrowly scoped server-only credential for Firebase project cybertrace-48ab0 and tests the protected preview using an actual admin, non-admin, revoked/disabled account, and sign-out/account switch. Do not paste a service-account key into chats, GitHub or VITE_ variables. Review rotation/retention.

The one-time GitHub workflow used to generate the lockfile has been removed in this commit. Do not re-enable it or widen Vercel deployment protection.

Official: https://firebase.google.com/docs/auth/admin/manage-sessions
Release: https://firebase.google.com/support/release-notes/admin/node

# CyberTrace admin operations dashboard — source-grounded pilot

This is **a read-only admin operations overview**, not user analytics or a certification/paid-service console.

## Deployment and authority
- Navigation: existing `/admin` route. Admin UI never displays protected content until `GET /api/admin/summary` responds 200 with a verified server-side authorization check.
- Firebase ID token comes from the currently signed-in account, refreshed on request, and is sent in an HTTPS same-origin Authorization header (never URL parameters, analytics or persistent browser storage).
- Server independently verifies Firebase token signature, issuer, audience, expiry and `admin: true` claim. No CORS wildcard and `Cache-Control: no-store`. Browsers with guest/non-admin/failed/expired identity get no dashboard data.
- Revocation-aware verification is now integrated on this branch, but requires a real protected-preview test with server credentials before production approval. Since revocation checks are not ready, do not add any privileged user data or mutating admin operations.

## Sources and limits
- `catalog`: generated server-side from source-controlled `CASES` and `caseCatalog`. Counts are real published training incidents, categories and difficulty distribution. Integrity flags detect duplicate IDs, missing category metadata or unmatched difficulty labels.
- `metrics: null`: no valid user totals, verified grade averages, revenue or admin audit trail; these are displayed as **not configured**, never zero or estimated figures.
- The dashboard does **not** access Firebase user documents or browser localStorage, modify claims or user accounts, score cases, issue certificates or connect billing.

## Acceptance checks
- `npm run check:structure && npm run lint && npm test && npm run build`.
- API unit tests reject missing, forged and non-admin authorization; accepted admin receives only catalog summary.
- Manual browser: enter `/admin` as guest, ordinary user, authorized admin, then sign out and switch accounts; ensure no stale admin response leaks across identities. Verify 320px/390px mobile layout and that sections and refresh work.
- Before **production**: complete live Firebase Admin revocation-aware checks and secret provisioning (PR #26); validate Vercel backend on protected preview. The new dashboard must not be merged solely on green CI.

Roll out separately from BLACKBOX and the shared-pathway PRs. Do not attempt repeated Vercel deploys while quota-limited.

## Admin browser regression (local only)

GitHub Actions job `admin-browser` starts a localhost Vite fixture that renders the **real Admin React component** with simulated Firebase accounts and an intercepted localhost `GET /api/admin/summary`. This test never receives real Firebase credentials, calls Firebase projects or writes user data.

At viewport widths 320px, 390px and 1440px the test verifies:
- Guest and non-admin are denied without exposing any administration cards.
- An authorized simulated admin sees source-derived content metrics and functioning section tabs/category filter.
- A subsequent rejected/revoked token, backend failure and logout all clear the preceding account's protected dashboard.
- No unintended external network requests, browser runtime errors or horizontal overflow.
- Tokens stay in the same-origin Authorization header and never appear in URL fields.

**Limit**: client-side mocking does not validate live Firebase revoked-token checks. The protected Vercel preview still requires an authorized session to inspect it manually. PR #26 remains inactive until Firebase Admin SDK dependency is locked and server-only credentials are safely provisioned.
