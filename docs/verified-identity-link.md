# Verified dual-account attestation UI

When signed into BLACKBOX from the CyberTrace integration modal, a new
**optional**, explicit-consent block allows users to verify the current link,
link two recently authenticated accounts, and unlink without losing training
progress. A CyberTrace ID token is freshly requested and sent only to the
authenticated BLACKBOX Cloud Function; email and display name are never an
identity criterion.

The feature stays unavailable until the public
`VITE_BLACKBOX_APPCHECK_ENTERPRISE_SITE_KEY` is configured and the BLACKBOX
Functions + Firestore rules are separately deployed. Signing into both
accounts earlier than 10 minutes may require reauthentication; refreshing an
ID token alone does **not** change the sign-in `auth_time`.

The user can continue all FREE lessons and local sync even if this independent
certificate identity-check service is unavailable. This UI never mints
certificates, grants premium access or changes saved scores.
