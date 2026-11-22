# CyberTrace compact navigation review

Current home and investigation-library top bars both displayed SOC, certificates,
Pro, XP, BLACKBOX connection, and account actions alongside core navigation,
and on mobile they allowed horizontal swiping. This can hide essential actions.

This PR consolidates **both** pages into one component:
- Visible logo + primary Investigations button.
- Desktop: More (SOC, certificates, Suite Pro roadmap, About/How) and Account
  (CyberTrace identity, XP, BLACKBOX link management, sign out).
- Mobile: logo + Investigations + More; the More menu additionally provides
  authenticated sign out, XP and the existing BLACKBOX link dialog action.
- Native details menus, Escape/outside click dismissal, keyboard focus, and
  no horizontal scrolling. Optional floating dock remains user-toggleable.
- The library primary action refocuses the current case library rather than
  reloading a route. Auth and logout callbacks remain those of App.

No changes to Firestore rules, auth claims, XP, history, scores, certificates,
Pro features or existing free content. Verify home + library in mobile/desktop,
signed in/out, Google login, independent BLACKBOX link, keyboard Esc and
mobile menus. Vercel production release is a separate check.
