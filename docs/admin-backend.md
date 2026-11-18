# CyberTrace admin backend — initial secure boundary

## Current state

PR #23 introduced a client-side claim-gated admin shell. This branch adds `GET /api/admin/summary`, a server-side Firebase ID token signature and claim check with Google's Secure Token public signing certificates. This endpoint **does not** return real statistics yet: it returns `metrics: null` deliberately.

## Calling the endpoint

The authenticated browser must request a fresh Firebase ID token and send `Authorization: Bearer <ID_TOKEN>` over HTTPS. Do not store tokens in URLs or logs. The server rejects missing, expired, incorrectly signed, wrong-project, and non-admin tokens; it never trusts client-supplied UID or role fields. No permissive CORS headers are set.

## Missing trusted data sources

CyberTrace's investigation progress and scores are currently stored locally in the browser. These values cannot support trustworthy aggregate completion counts, score averages, or audit trails. Google Analytics and Vercel traffic counts are not substitutes for authenticated investigation results.

Before displaying real metrics, implement server-side result submissions validated against canonical case IDs and scoring rules, persist append-only completion records in a protected Firestore collection, and aggregate server-side. For user counts use a privileged Firebase Admin SDK service credential on Vercel (environment secret or workload identity, never VITE_ variables). For audit records use server-generated timestamps, actor UID, action, target, and outcome; never accept arbitrary actor fields from the browser.

Do not ship write operations or user-level records until authorization, rate limiting, privacy retention, and Firestore Security Rules have been tested. Revalidate admin claims on every privileged request. Revocation-aware checks require additional design: this first stage checks signature and token expiry but does not query revoked-token state.

## Tests

`npm test` includes negative authorization checks and an RSA-signed token fixture with injected public certificate retrieval. Run tests and Vercel preview deployment before merging. The endpoint has not been validated against live Firebase credentials in this branch.
