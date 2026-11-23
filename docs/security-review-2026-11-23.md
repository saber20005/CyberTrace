# CyberTrace security review — 2026-11-23

## Scope and evidence
Source-review of main-branch `security/firestore.cybertrace-progress.rules`, `src/utils/cloudProgress.js`, `api/_lib/firebaseToken.mjs`, `api/admin/summary.mjs`, `src/pages/Admin.jsx`, and `tests/admin-api.test.mjs`. Added a **Firestore emulator-only** regression in `tests/cybertrace-firestore.emulator.mjs`. Also reviewed the BLACKBOX repo's Firestore and certificate separation. No live account, real user data, real external target, or production Firestore write was touched.

**Critical distinction:** `security/firestore.cybertrace-progress.rules` is explicitly labeled a *reference* ruleset. Running it in the emulator does **not** prove that its current version has been deployed to Firebase project `cybertrace-48ab0`.

## Findings

| ID | Severity | Observation / proof | Implication |
|---|---|---|---|
| CT-01 | High **integrity limitation**, not verified privilege escalation | Under the checked-in reference rules, an authenticated owner is allowed to submit their own arbitrary in-range XP and score for a known investigation. The new `security finding: owner can self-report` emulator test demonstrates this without hitting production. | XP, case completion and client-issued PDFs are self-reported; never use them as *verified* awards, competitive rankings, paid qualifications or prerequisites for trusted certificates. |
| CT-02 | High **verification gap** | Deployed Firebase Auth/App Check settings and deployed Firestore rules have not been inspected via an authorized Firebase admin connection. Checked-in rules are only references; ownership checks and deny-by-default are evidenced in the emulator alone. | Production security claims remain unproven; compare deployed rulesets and publish only after backup and administrator review. |
| CT-03 | Needs dependency triage | GitHub Actions `npm ci` on 2026-11-23 (quality checks run `45238547673`) reported **12 advisories: 3 moderate, 9 high**. The log does not establish runtime exposure or exact vulnerable packages. | Run `npm audit --json` and `npm audit --omit=dev --json` in a trusted CI sandbox; identify dependency paths and patch individually without `npm audit fix --force`. |
| CT-04 | Hardened in code / deployment unverified | The read-only admin summary rejects missing Bearer tokens and method misuse, verifies Firebase RS256 signature/audience/issuer/expiry and requires `admin === true`. Tests cover incorrect audience and unsigned input. | This is better than hiding an admin page client-side. Check actual Firebase claim provisioning, revocation procedures and callable/IAM policies separately; don't infer security from page appearance. |

## Positive controls supported by source
- `cloudProgress.js` scopes progress to signed-in UID; a second account is denied by the *reference* Firestore rule. Its cloud merges are user preferences/progress, not proof of assessment.
- CyberTrace Firebase web API keys in the frontend are **public identifiers**, not inherently secret credentials. Review their permitted API/service restrictions, but do not describe their mere presence as key theft.
- `api/admin/summary.mjs` fails closed to `metrics:null` until trusted aggregates exist, rather than treating untrusted client scores as an admin KPI.
- `security/firestore.cybertrace-progress.rules` is owner-scoped, schema constrained, and default-denies undeclared collections in the isolated emulator.

## Release/verification gates before calling the platform secure
1. With authorized Firebase admin access, export **deployed** rules for both distinct projects and compare with repo rules. Run the same two-user/guest denial tests in an isolated emulator using exported production rules; do not overwrite live rules blindly.
2. Run the new emulator proof in CI; require that user A cannot access user B, unknown paths are denied, and client self-scores remain labeled unverified.
3. Confirm every certificate or premium entitlement is derived exclusively from backend-owned assessments, not `cybertraceUsers/*/state/progress`, localStorage, client-supplied grade or email. Keep issuance disabled until reviewed.
4. Inspect App Check enforcement, Firebase Auth authorized domains, custom admin-claim lifecycle, Cloud Functions IAM, Vercel environment exposure, logging, alerting and quotas in owner consoles. Source alone cannot verify these.
5. Generate a dependency advisory inventory with versions, reachable runtime paths and remediation PRs. If deploying an automated pentest tool (such as Strix), use a local disposable test deployment with synthetic data, strict scope/rate caps, and explicit approval before any active tests on production.

## Current audit status
**Code review and draft test coverage:** completed. **Live-production authorization proof, dependency triage and active pentesting:** not completed. No production security changes or exploits are claimed.
