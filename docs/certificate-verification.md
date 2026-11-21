# Trusted certificates — CyberTrace integration contract

## Current state

CyberTrace's eight completion-group PDFs are **self-reported educational records**, not server-verified skill certifications. `getCaseResults()` reads browser-controlled results; `markCaseSeen()` is not grading. Some historical completions have no score or attempt evidence. None can be silently migrated into verified certificates.

CyberTrace Firebase project: `cybertrace-48ab0`. BLACKBOX Firebase project: `black-box-lab`. The projects are separate authentication issuers; matching UID/email alone **does not** establish shared identity or a trusted grading result.

## Proposed shared authority (work starts in BLACKBOX)

- Server-only central `certificateRegistry` in BLACKBOX; browsers can neither read it directly nor write it.
- Public GET `verifyIssuedCertificate?id=<128-bit-random-hex>` endpoint will expose a minimal verified/revoked/not-found status when separately deployed with Cloud Functions.
- Never trust a CyberTrace client result, XP, imported receipt, browser claims, or form fields to issue credentials. A per-category authoritative rubric and independently server-graded evidence must be established for all required cases.
- Use an explicit secure account-linking exchange that proves ownership of both Firebase accounts; validate both project's Auth tokens on trusted servers, record a private cross-project mapping and require consent.
- Issue one certificate per completed category/version through a privileged transactional backend after every required assessment is verified. Maintain issuance and revocation audit; protect identities, hidden rubrics and individual answers.
- Only a real-issued record receives a unique ID/QR and a public verification page. Revocation must invalidate an otherwise authentic PDF. Keep legacy self-reported PDFs distinctly labelled and readable.

## Release gate

Do not add 'verified' labels, serial numbers or QR codes to existing certificates. Do not expose an auto-issuance button based on `buildCaseGroupRecords()`, Firestore owner-writable receipts, or historical `seen` cases. Cross-origin UI and true issuance will be added only after the central endpoint, safe account linking and verified category evaluations have been tested and deployed.
