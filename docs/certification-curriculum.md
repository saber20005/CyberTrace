# CyberTrace: certificate preparation curriculum for 8 investigation groups

The existing CyberTrace catalog contains 28 synthetic incident cases across
8 categories (identity, email, malware, web, data, cloud, network and
supply-chain). The certificate center now describes the learning outcome and
practical triage task for every existing category, and lists its actual known
`INC-XXXX` case IDs. This is **a training syllabus only**; it does not add
new answers to the browser or change any investigation scoring.

Learners can open the case library or follow BLACKBOX's complementary
local evidence-analysis and isolated Nmap labs. Results from CyberTrace's
existing browser cases are still client-scored and cannot prove a trusted
credential, even when all cases in a group appear complete.

The future verified track requires independently graded evidence for every
case in the corresponding BLACKBOX issuance manifest, explicit link between
the two Firebase accounts, Auth + App Check validation, and a revocable
server-owned registry record. An independently verified SOC session may be
included as a supplementary assessment only under separately reviewed
policy. No requirement may be satisfied by browser XP, same email, or a
downloaded PDF alone.

The interface is read-only, and the printable training record remains
explicitly *not verified*. The new preparation matrix is hidden in print.

## Practical workshops (formative exercises only)

Each of the eight category cards now includes a three-step simulated evidence
exercise, a concrete report deliverable and a minimum interpretation checklist.
The practice uses the **existing synthetic incidents**; it does not create or
claim completion of extra cases. Learners should include an INC-XXXX case ID,
traceable evidence references, an alternative explanation, a scoped response
and a limitation. The case-library button still opens the existing catalog.

The exercises are deliberately **read-only and non-graded**: no new score, XP,
certificate status, or cross-product progress is created from opening or
reading them. Case answers and any future private grading rubric are not added
to public source code. The printable record remains an explicitly unverified
training record; a verified certificate still requires a separate trusted
assessment and revocable issuer-owned record.

### Release checks

- All eight topics retain their 28 existing case associations, with no new
  permissions or changed persisted-progress keys.
- Verify the category cards expand and the three numbered steps wrap on 360px
  mobile screens and in RTL; the whole preparation section stays hidden in print.
- Execute `npm run check:structure`, `npm run lint`, `npm test` and
  `npm run build`; only ship once those and the existing CI checks are green.
- Do not enable verified issuance, Firebase grading, or payments in this PR.
