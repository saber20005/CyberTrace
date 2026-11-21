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
