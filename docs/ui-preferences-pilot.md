# CyberTrace settings and authentication polish
- Adds `?view=settings` from existing compact **More** menu, without introducing a crowded top navigation control.
- Supports local dark/light display preference, larger text, reduced motion, and optional self-selected training level. No user profile write, tracking, Firebase request, XP claim, account linking or verification is added.
- Settings use a dedicated `cybertrace.ui-preferences.v1` localStorage key, with tolerant parsing, allowlisted enumerations and gracefully handled quota/privacy errors. The key never intersects existing CyberTrace progress or cloud sync keys. Browser switching does not imply settings sync.
- Login retains the same Google/email Firebase workflows and reset password; only visual glass/card styles are changed.
- Do not present level selection as proof of expertise or certificate qualification.
- CI: `npm ci && npm run check:structure && npm run lint && npm test && npm run build`. Manually review mobile 320/390 and contrast in both themes on protected preview before merge. No production deploy authorized.
