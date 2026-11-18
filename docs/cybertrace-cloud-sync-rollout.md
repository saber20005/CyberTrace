# CyberTrace cloud progress rollout

**Target Firebase project:** cybertrace-48ab0 (not black-box-lab).

1. Obtain and back up the actual currently deployed CyberTrace Firestore rules. The proposed security/firestore.cybertrace-progress.rules is a **fragment/template**, not safe to replace existing production rules with.
2. Integrate the owner-only match into the existing deployed rules and test authorized own-UID read/write, denied other-UID read/write and denied deletion in Firebase Emulator.
3. Deploy integrated rules to cybertrace-48ab0; verify with real authenticated accounts and a second device before enabling for general users.
4. Users must opt in individually on each device. This feature does not import legacy unowned data or BLACKBOX receipts. Sign in with the exact same CyberTrace UID.
5. Current merge uses max(bestScore), max(attempts), latest lastScore timestamp, union(completed), and max(XP). XP is not additive across devices. Treat these as best-effort historical aggregates, not server-verified awards.
6. Do not merge this PR to production until Firestore rules are deployed and E2E tests pass. The app does not modify BLACKBOX data.
