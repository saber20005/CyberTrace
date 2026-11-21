# Certificate Center — implementation phase 1

This release provides **read-only, locally generated training-completion records** for cases with recorded completion results. Learners may enter a display name and use browser print / Save as PDF.

**Important:** local progress and scores are client-controlled. Therefore, these records must be prominently labelled **غير موثقة** in the printable certificate. No public verification, QR, certificate number, digital signature, trusted skill assertion, user profile write, or official accreditation is provided in this phase.

Existing CyberTrace login, Firebase, XP, cloud sync, and BlackBox bridge must remain unchanged. Do not treat a legacy seen case without a recorded result as eligible.

Phase 2 (not live): server-side validated assessment and protected issuance, non-guessable verification IDs, revocation, privacy-consent controls, and linked BlackBox completion proof from separately authenticated accounts.

Free completion records remain free. Advanced verified joint certification may be a future Pro feature, subject to a separately reviewed secure backend.


## Third joint design preview (phase 1.5)
The canonical **CyberTrace × BLACKBOX** visual template is available as a demonstration only at `https://www.cybertracelab.dev/?view=joint-certificate`. Both certificate centers may link there. It uses actual logo artwork from both projects, a distinctive split gold/blue identity, and a permanent `نموذج غير صادر` watermark, including when printed from the browser.

This route deliberately performs no data reads/writes, login linking, assessment, issuance, scoring, signature, QR or verification. It is marked `noindex` and cannot be used as evidence of a user's achievement.

To issue real joint certificates: require the server to validate ownership of both identities and separate trusted assessment receipts, issue uniquely verifiable revocable records with consent-sensitive verification pages, and log all lifecycle transitions. Only then replace demonstration placeholders with backed certificate attributes.

## Premium joint-preview refinement
The joint preview is now a dark graphite/navy **blue-and-gold** interactive layout matching the approved concept, with the original CyberTrace and BLACKBOX SVG marks **both in the center seal**. A user may enter a temporary display name for layout testing. This input is held only in component memory; it is not tied to account identity, passed to the URL or saved.

The preview continues to show **نموذج غير صادر** on screen and in print, and does not issue identifiers, QR codes, verification links or claimed results. Its component is intentionally independent of progress, auth and backend. Its CSS supports smartphone view and A4 landscape printing, though printing from actual completed-account data is **not** a feature of this mockup. This is not a professional certification.
