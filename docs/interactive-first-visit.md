# CyberTrace first-visit interactive introduction

## Purpose
On the first device-local visit to the plain home page (not while opening a deep link), guide the user through a five-step interactive, skippable onboarding page explaining the real features without pretending to execute security scans or issue verified awards.

## Steps
1. Welcome to investigations — how the platform teaches.
2. Sample investigation with a real choice and explanation; no saved grades/XP.
3. Sample SOC priority decision with immediate simulated feedback.
4. Local progress, user-enabled CyberTrace sync, and clarification that current completion certificates are not server-verified credentials.
5. Paths connecting CyberTrace and BLACKBOX, customization including Royal Gold, and real page navigation.

## Conditions and privacy
- Auto tour triggers only when reading simple homepage / for a browser without the cybertrace.first-visit-tour.v1 marker. The marker value is done. It is not Firestore or user profile state; it does not run scans or sync progress.
- Mark done on skip, completion, or navigating into any feature. The same key is written to localStorage and sessionStorage when possible. If localStorage is denied, sessionStorage suppresses immediate replay during the same browser session; if both unavailable the current React state still allows exit.
- Do not intercept view=auth, view=library, investigation deep links, case links, public certificate verification, or other direct links.
- Replay at ?view=welcome and through المزيد -> الدليل التفاعلي للمستخدم الجديد. Replays do not affect progress.
- Auth loader remains unchanged; no changes to cloud login, owner assignment, points, subscriptions, certificates, Vercel configuration or BLACKBOX.
- Tour is optional; users may skip, navigate, and return with normal controls. Focus moves to new step heading.

## QA
- Unit tests: storage keys, persistence, blocked storage, route parsing, no writing to progress, replay.
- Chromium at 320 / 390 / 1440: overflow, keyboard focus, next/back, interactive sample feedback, skip/finish, one-time behavior, reload, direct auth, replay.
- Manual on Android: ensure existing accounts can sign in, no loss of results, no claims of verified certificates.

This change covers CyberTrace only. BLACKBOX can receive a separate tailored tour.
