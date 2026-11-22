# CyberTrace admin operations dashboard — source-grounded pilot

This is **a read-only admin operations overview**, not user analytics or a certification/paid-service console.

## Deployment and authority
- Navigation: existing `/admin` route. Admin UI never displays protected content until `GET /api/admin/summary` responds 200 with a verified server-side authorization check.
- Firebase ID token comes from the currently signed-in account, refreshed on request, and is sent in an HTTPS same-origin Authorization header (never URL parameters, analytics or persistent browser storage).
- Server independently verifies Firebase token signature, issuer, audience, expiry and `admin: true` claim. No CORS wildcard and `Cache-Control: no-store`. Browsers with guest/non-admin/failed/expired identity get no dashboard data.
- Existing signed-token endpoint **does NOT check Firebase disabled-user status or token revocation**. PR #26 prepares a helper but is deliberately unactivated pending locked Firebase Admin SDK, server credentials and deployment tests. Since revocation checks are not ready, do not add any privileged user data or mutating admin operations.

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
