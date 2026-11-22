# Firebase Admin revocation-aware rollout (draft)

This branch introduces a revocation-aware authorization module, but **does not activate it** in the live API yet.

## Required before activation

1. Install `firebase-admin` as a server-side dependency and commit the updated `package.json` and `package-lock.json` together. Do not merge an incomplete dependency update.
2. Provision a narrowly scoped service account via Vercel's server-only environment variable `FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON` for the relevant environments. Never use `VITE_` prefix, commit credentials, or expose them to client code. Rotate if exposed.
3. Replace the current manual verifier import in `api/admin/summary.mjs` with `verifyAdminIdentity` after testing with live Firebase credentials on a protected preview.
4. Verify authorized admin, non-admin, disabled account, revoked token, and unavailable credentials. All unavailable verification must fail closed.
5. Review Firestore rules and implement a trusted server-owned data model before returning any metrics. Browser-local investigation scores cannot be accepted as authoritative.
6. Implement append-only server-written audit events (actor UID, action, target ID, outcome, server timestamp) with retention controls; do not log raw tokens or private user records.

## Current behavior

The production summary endpoint is unchanged. This module calls `verifyIdToken(token, true)` and checks current Firebase user status and current custom admin claim, but only when wired in after the prerequisites above.


## Defensive test coverage (2026-11-22)
- The helper now rejects missing/invalid/foreign-project server credentials **before** dynamic SDK import.
- Signed token must contain a valid UID and admin claim, and current user record must match the same UID, be enabled and retain the current admin claim.
- The credential provider, revoked-token verification, and current-user lookup all fail closed on errors.
- Test fixtures use dependency injection and never contact the live Firebase project; they **cannot** certify actual revocation until the SDK, Vercel secret, and protected-preview server requests have been deployed and exercised.
- Official reference: https://firebase.google.com/docs/auth/admin/manage-sessions (pass `checkRevoked: true` to detect revoked sessions and disabled users).
