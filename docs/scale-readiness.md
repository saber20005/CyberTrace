# Scale readiness v1 — CyberTrace

## Evidenced bottleneck and change
`src/utils/cloudProgress.js` originally re-saved all three local progress
keys and dispatched `cybertrace-progress-synced` on every Firestore snapshot,
including metadata-only events. The listener also unconditionally entered a
Firestore transaction on each server snapshot; transactions can read even when
no write is needed. The filtered case library already displays nine local
case cards at a time; **it is not a paginated Firestore query**.

The new pure progress model preserves the previous merge rules. Browser data is
written and the UI refresh event fired only when the persisted values change.
An observed server snapshot already matching local progress no longer opens a
read transaction, and a manual sync still calls `getDocFromServer` before
deciding whether a follow-up transaction is necessary. When the remote record
is missing, the original opt-in bootstrap write remains in place.

## Privacy, durability and failover
- Existing account-scoped storage paths and Firestore document remain unchanged.
- No cache TTL, quota bypass, credential issuance or trusted-score logic added.
- No token, UID, local note or investigation answer enters telemetry.
- Stale cached snapshots still merge with local data. Errors still appear to
  the user; offline work is not discarded.
- Cross-account switching continues to depend on `auth.currentUser.uid`
  and guarded listeners. Test two tabs, offline/reconnect, import, sync retry,
  and sign-out before extending optimization further.

## Quantities to measure, not assume
Record before/after on a TEST account: Firestore reads and writes for
(i) initial sign-in, (ii) metadata-only callback, (iii) one new case,
(iv) user-triggered sync, and (v) reconnection. Compare browser interactions
and LCP/INP in Vercel analytics if enabled. The code removes known redundant
paths; it does **not** establish a numerical speed or cost reduction without
real measurements.

## Local-only smoke sampling
Run a local preview (e.g. `npm run dev -- --host 127.0.0.1`) then
`node scripts/local-load-smoke.mjs http://127.0.0.1:5173/`.
The script accepts only HTTP loopback, GET /, at most 16 requests and two
concurrent clients. It cannot and must never stress public Vercel/Firebase
services. A smoke run is NOT a capacity test and cannot prove a maximum user
count. Use Firebase emulators for stateful load scenarios, with test data only.
