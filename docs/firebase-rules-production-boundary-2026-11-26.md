# Firebase rules source-of-truth — production release boundary (26 Nov 2026)

**Project:** CyberTrace Auth/Firestore belongs to Firebase project `cybertrace-48ab0`, not BLACKBOX project `black-box-lab`.

## Critical distinction
- `security/firestore.current.rules` is a **legacy BLACKBOX-like snapshot** used for offline regression testing only. It is NOT the current CyberTrace source of truth and must never be used for Firebase production deployment.
- `security/firestore.cybertrace-progress.rules` is a **CyberTrace progress reference** for emulator unit tests. It is a fragment and must not replace the deployed ruleset.
- `security/firebase.emulator.json` and `security/firebase.cybertrace-emulator.json` are **emulator test configurations**, not approved deployment configurations.
- This repository does **not** contain an authoritative export of the full deployed Firebase rules for `cybertrace-48ab0`. **Do not infer that a checked-in reference file matches production.**

## CI guard
`scripts/firebase-rule-source-guard.mjs`, invoked by the existing repository structure gate, rejects:
- a new root `firebase.json` until a complete exported, reviewed production ruleset is approved;
- changing emulator rule inputs or exposing their emulator endpoint beyond localhost;
- removing the "reference only" / "DO NOT DEPLOY" warnings;
- Firebase rules deployment commands embedded in GitHub Actions before release approval.

**Limitations:** This guard checks repository contents only. It cannot prevent an administrator from manually deploying a reference file through a local Firebase CLI or console. It does not inspect live Firebase rules, IAM, App Check, or deployed Functions.

## Production evidence needed before release
1. With authorized Firebase administrator access, export the entire **deployed** `cloud.firestore` rules release from project `cybertrace-48ab0` and retain its ruleset ID, timestamp and backup.
2. Reconcile the owner-scoped `cybertraceUsers/{uid}/state/progress` contract against the live rule set **without deleting other collection rules**. Never upload either reference file wholesale.
3. Load the reconciled rules into a standalone Firestore emulator and test account A -> A (expected allowed on intended paths), A -> B and guest (expected denied), and default-deny for privileged/certificate paths.
4. Separately inspect Firebase Auth custom admin claims, App Check enforcement, IAM privileges, live Functions versions and certificate trust chain.
5. Only after review, create a separate explicit production release PR and record before/after ruleset IDs, test logs and rollback procedure. **Do not publish rules as part of a Vercel UI deployment.**

This release boundary protects **against accidental repository-based deployments**; it is not a production security attestation.
