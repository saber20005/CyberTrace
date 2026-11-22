# CyberTrace Experience Studio V2

This release replaces the bare preference form with an **interactive preview-first customization studio**: three real theme modes (signature, midnight, daylight), accent palette, typography scale, density, contrast, motion, three one-click presets and self-reported training level. Controls update the live page state immediately and use the already established device-local `cybertrace.ui-preferences.v1` key.

**Safety contract**: Reads and writes only allowlisted presentation values; legacy `theme`, `textSize`, `motion`, `level` are preserved on upgrade. Presets never override the self-reported skill level. No auth, Firebase, progress, XP, shared pathways, scoring, subscriptions or certificates are changed. Preview cards are explicitly marked demo and never claim stored or verified activity. On blocked storage, UI reports session-only change.

**Acceptance**: test 320/390/1440 responsive; keyboard and focus; all 3 themes and 3 accents; high contrast and reduce motion; old settings migration and cross-account no data leakage. Validate production typography and color contrast in browser before merge. This page is not an admin authorization page.
