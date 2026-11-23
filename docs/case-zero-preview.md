# CyberTrace Case Zero — preview-only interactive onboarding

This draft replaces the two multiple-choice demos in the existing first-visit tour with an in-memory incident workflow. It does **not** change the true investigation library, SOC assignments, certificates, accounts, synchronized progress, or Firebase.

## Demonstration
1. Open mock incident CT-DEMO-001, filter and expand synthetic auth/session log entries (RFC 5737 documentation addresses).
2. Review at least two entries, write an analyst interpretation (min. 25 characters) and file a local-only demo report.
3. Open a simulated SOC ticket and choose escalation or ordinary review, with contextual feedback.
4. Watch the right-side case board update in real time, then continue to the existing information and navigation sections.
5. Compare the preview with the published tour using an explicit link.

Data lives **only in React memory**. Nothing is persisted to browser storage, sent over a network, added to a real case, or treated as a grade or training certificate. Existing deep links, replay, skip, and auto-first-visit behavior remain intact.

## Release gates
- [ ] Unit tests, ESLint, and production build green in GitHub Actions
- [ ] Chromium at 320, 390 and 1440 px: open logs, submit notes, triage SOC, replay and skip
- [ ] Vercel preview READY for the exact head commit
- [ ] Responsive usability checked on actual mobile and desktop
- [ ] **Explicit user approval** before any main merge; keep this PR draft until then

Only a protected preview is authorized. Do not release to production through this PR.