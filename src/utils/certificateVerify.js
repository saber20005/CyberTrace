// Public read-only verification client. Only server-assessed records may be marked valid.
// Existing self-reported completion records never produce a certificate ID.
export const VERIFY_URL = "https://us-central1-black-box-lab.cloudfunctions.net/verifyIssuedCertificate";
export const CERTIFICATE_ID = /^[0-9a-f]{32}$/;
export const normalizeCertificateId = value => typeof value === "string" ? value.trim() : "";

export function parseVerification(status, payload, requestedId) {
  if (!CERTIFICATE_ID.test(requestedId)) return { state: "bad-id" };
  if (status === 404 && payload?.status === "not-found" && payload?.valid === false) return { state: "not-found" };
  if (status !== 200 || !payload || Array.isArray(payload) || typeof payload !== "object" ||
      payload.certificateId !== requestedId || !["blackbox", "cybertrace"].includes(payload.issuer) ||
      typeof payload.groupTitle !== "string" || payload.groupTitle.trim().length < 2 ||
      payload.groupTitle.length > 120 || !/^[a-z][a-z0-9-]{1,63}$/.test(payload.groupId) ||
      typeof payload.issuedAt !== "string" || !Number.isFinite(Date.parse(payload.issuedAt)) ||
      payload.evidence !== "server-assessed") return { state: "unavailable" };
  if (payload.status === "verified" && payload.valid === true) return { state: "verified", record: payload };
  if (payload.status === "revoked" && payload.valid === false) return { state: "revoked", record: payload };
  return { state: "unavailable" };
}

export async function lookupCertificate(input, fetcher = fetch) {
  const id = normalizeCertificateId(input);
  if (!CERTIFICATE_ID.test(id)) return { state: "bad-id" };
  try {
    const response = await fetcher(VERIFY_URL + "?id=" + encodeURIComponent(id), {
      method: "GET", cache: "no-store", credentials: "omit", mode: "cors",
      headers: { Accept: "application/json" },
    });
    return parseVerification(response.status, await response.json(), id);
  } catch {
    // A disabled server, CORS failure, timeout or malformed JSON is NOT evidence
    // that the certificate is forged or authentic.
    return { state: "unavailable" };
  }
}
