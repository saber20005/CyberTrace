# Verified results migration plan (BLACKBOX + CyberTrace)

## Current state and security boundary
The checked-in `security/firestore.current.rules` is a **snapshot supplied by the project owner**, not proof of the rules currently deployed in Firebase. Do not deploy it blindly. The existing client writes to `blackboxUsers/{uid}/cybertrace/{caseId}` directly using a score it computed in the browser. Ownership and monotonic scores do **not** establish authenticity. In addition, the current rules allowlist has 16 cases while the CyberTrace catalogue has 28: newer `INC-12xx` cases cannot sync under these rules.

## Phase 0 — regression testing, no production changes
Install the Firebase CLI and the test library locally, start the Firestore emulator using `security/firebase.emulator.json`, and run `tests/firestore-rules.emulator.test.mjs`. These tests intentionally document that a signed-in owner can submit a perfect score without proof. The emulator does not establish production deployment or client/server identity.

## Phase 1 — preserve legacy synchronization
Keep the current `blackboxUsers/{uid}/cybertrace/{caseId}` documents readable and writable as **unverified legacy records** during migration. In the UI label their scores **self-reported / unverified**. Never treat legacy scores as certificates, leaderboards or verified completion. Preserve existing timestamps and offline UX.

## Phase 2 — trusted verification service
Create a separate Firebase Cloud Functions (2nd gen) HTTPS callable or Cloud Run API with Firebase Auth verification and App Check (defense in depth, not proof of task completion). A client submits an attempt with case ID, version, answer choices and evidence references; never a trusted final score. A backend-controlled rubric scores the attempt and records the verified outcome using Admin SDK. Keep scoring rubrics and verification secrets server-side. If an answer can be inferred from publicly shipped frontend content, it cannot be used as strong evidence of mastery: redesign challenges to use server-issued unpredictable, short-lived, single-use tasks, or human-reviewed practical evidence for high-stakes certification.

## Phase 3 — verified data model
Write verified receipts only from the service to `blackboxUsers/{uid}/verifiedCybertrace/{caseId}` with fields such as `schemaVersion`, `caseId`, `bestScore`, `rubricVersion`, `verifiedAt`, `attemptId`, `verifierVersion`, `evidenceDigest`. Set Firestore client rules for this collection to `allow get, list: if isOwner(uid); allow create, update, delete: if false;`. The Admin SDK bypasses Firestore rules; authenticate, authorize, rate-limit and validate **every** request in the backend. Use transactions, idempotency keys, replay protection, per-user quotas, and server-side audit events. Never accept a user-supplied UID as authority.

## Phase 4 — migration and cutover
Dual-read verified and legacy collections. Display verified scores separately and prioritize verified receipts for certification; do not silently upgrade legacy scores. Roll out with feature flag and staged test users. After verified submissions work, restrict legacy client writes only after ensuring old clients and pending offline writes are handled. Avoid breaking existing BlackBox progress at `blackboxUsers/{uid}/state/progress`, which is independent of CyberTrace receipts.

## Release gates
1. Emulator ownership, denial, schema, and replay tests pass.
2. Cloud Function integration tests show another user's UID cannot be used; repeated attempt IDs cannot double-award; client writes to verified collection are denied.
3. Firebase Console deployed rules and actual production project IDs are independently confirmed.
4. Two real test accounts verify cross-account isolation in staging, with rollback prepared.
5. UI visibly distinguishes legacy from verified results; only verified results are eligible for certificates.

No Firebase production rules or Cloud Functions were deployed by this proposal.
