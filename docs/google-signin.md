# Google sign-in for CyberTrace — release checklist

CyberTrace uses its own Firebase project (`cybertrace-48ab0`). Its Google sign-in is **not** a BlackBox account link, and a matching email alone is not proof of account ownership across the two Firebase projects.

## Required Firebase Console settings

1. Open [CyberTrace Firebase Authentication](https://console.firebase.google.com/project/cybertrace-48ab0/authentication/providers) as an administrator.
2. Under **Sign-in method**, enable **Google** and save the provider configuration. Do not disable the existing Email/Password provider.
3. Under **Authentication → Settings → Authorized domains**, confirm `www.cybertracelab.dev` is present; keep `cybertracelab.dev` if used for redirects. Add a domain only if missing.
4. Test the button on the canonical live site in a normal browser with pop-ups allowed; verify the user is the intended CyberTrace UID and existing progress remains accessible after re-login.
5. Test a fresh account and an existing email/password account using test users (never production admin), including cancel, blocked pop-ups, disabled provider, logout and second-device reload.

## Account safety

- Google sign-in uses `src/firebase.js` (CyberTrace Firebase Auth) only. It does not sign into BlackBox automatically or migrate BlackBox results.
- Firebase Authentication chooses/creates the account. CyberTrace's existing `onAuthStateChanged` scopes training data by Firebase `uid`. Never use an email match as a reason to merge progress.
- For an existing email/password identity, first confirm the same CyberTrace UID will be retained. If Firebase reports `auth/account-exists-with-different-credential`, sign in with the original method. **Do not create another account or copy results.** Adding Google to an existing Firebase account must be a separate authenticated provider-linking flow.
- This feature does not request extra Google API scopes, passwords, OAuth tokens, or cross-project access.
- The site remains usable with email/password if Google sign-in is not yet configured.

## Verify before closing maintenance

- CI `verify` and `firestore-owner-boundary` pass.
- Browser smoke test confirms the button is visible on CyberTrace's login and signup tabs, not password-reset tab.
- Authorized domain and Google provider setup must be verified in Firebase Console; a green CI run does **not** prove this.
- Confirm no lost progress, UID switching, or cross-account cloud writes during test-user journeys.
