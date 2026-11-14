# Production release and Firebase security checks

## Automated checks
The GitHub Actions workflow runs `npm ci`, `npm run lint`, `npm test`, and `npm run build` on PRs and main. A successful build is not a security audit.

## Firebase checks requiring project administrator access
CyberTrace uses Firebase Auth project `cybertrace-48ab0` and its BlackBox integration uses the separate `black-box-lab` project. Do not assume their rules or authorized domains are interchangeable.

1. In Firebase Console, verify Authentication > Settings > Authorized domains includes the actual production hostname for each relevant authentication flow.
2. Verify password-reset delivery and return URL with an account you own; do not use real user credentials in tests.
3. Inspect the **deployed** Firestore rules of `black-box-lab` for `blackboxUsers/{uid}/cybertrace/{caseId}`. Ensure reads/writes require `request.auth != null && request.auth.uid == uid`, and validate permitted document fields and score bounds. This is a review requirement, not a claim that those rules currently exist.
4. With two test users A and B, attempt A->A read/write (expected allowed under intended rules), A->B read/write (expected denied), and unauthenticated read/write (expected denied). Use the Firestore emulator or Firebase Rules unit tests; never target real users' data.
5. Verify that changing CyberTrace primary auth identity does not transfer pending BlackBox receipts to a different account. Confirm logout and reconnect behavior on two devices.
6. Confirm the public Firebase web API key is restricted appropriately at the service/project level where possible. A Firebase web API key being present in frontend source is normal; it is not a secret or proof of an exploit.

## Analytics
The GA4 adapter is disabled until a valid owner measurement ID is supplied in the HTML metadata. It now allowlists the canonical production domain; test consent/privacy behavior and analytics collection before enabling it. Vercel Web Analytics is a separate integration and must be verified in its dashboard.

## Performance
React route lazy-loading was merged separately. Review actual production chunk sizes and Core Web Vitals after deployment. Firebase SDK imports shared with the root provider may still remain in initial chunks; avoid claiming all bundle warnings have been eliminated.

## Release gate
Do not mark security or production acceptance as complete without saved CI run links, Firebase Rules test output, and browser checks for auth, library, investigations and mobile navigation.
