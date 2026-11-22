# Shared learning-pathway center

This read-only learning center at `?view=journeys` uses the exact 2026-11-22.v1 manifest mirrored in BLACKBOX. Four paths, 16 steps total, alternating 8 synthetic CyberTrace investigations and 8 references to existing BLACKBOX tracks (some tracks reused). No enrollment or certificate data is created.

CyberTrace only reads `getCaseResults()` which uses the existing current-account scoped progress storage; legacy completions without scores are not turned into fictitious scores. No attempt to read BLACKBOX progress or silently link two Firebase accounts. URLs contain only publicly known incident IDs and track IDs.

Release gate: verify CI lint/test/build and Firebase rules, check mobile 360px and RTL, confirm username changes reset scope, no new XP or progress mutations, verify matching manifest versions/steps in BLACKBOX PR, and avoid manual Vercel deployments while quota is exceeded.
