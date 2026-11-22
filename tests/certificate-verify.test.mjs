import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CERTIFICATE_ID, normalizeCertificateId, parseVerification, lookupCertificate } from "../src/utils/certificateVerify.js";
import { createRouteURL, readRoute } from "../src/utils/routes.js";
const id = "0123456789abcdef0123456789abcdef";
const record = { certificateId: id, issuer: "cybertrace", groupId: "email",
  groupTitle: "أمن البريد", issuedAt: "2026-11-21T12:00:00Z",
  status: "verified", valid: true, evidence: "server-assessed" };

test("only valid 128-bit IDs are eligible for a public read", async () => {
  assert(CERTIFICATE_ID.test(id));
  assert.equal(normalizeCertificateId(" " + id + " "), id);
  assert.deepEqual(await lookupCertificate("INC-1203", () => { throw Error("not called"); }), { state: "bad-id" });
  let requestedUrl;
  assert.equal((await lookupCertificate(id, async (url, options) => {
    requestedUrl = url;
    assert.equal(options.credentials, "omit");
    assert.equal(options.cache, "no-store");
    return { status: 200, json: async () => record };
  })).state, "verified");
  assert(requestedUrl.endsWith("?id=" + id));
});

test("reject forged and unverifiable responses, permit revoked but not valid", async () => {
  for (const invalid of [
    { ...record, evidence: "browser-completion" },
    { ...record, certificateId: "f".repeat(32) },
    { ...record, status: "verified", valid: false },
    { ...record, issuer: "untrusted" },
    { ...record, groupId: "other/path" },
  ]) assert.equal(parseVerification(200, invalid, id).state, "unavailable");
  assert.equal(parseVerification(200, { ...record, status: "revoked", valid: false }, id).state, "revoked");
  assert.equal(parseVerification(404, { status: "not-found", valid: false }, id).state, "not-found");
  assert.equal((await lookupCertificate(id, async () => { throw Error("no server"); })).state, "unavailable");
});

test("verification view and links preserve the certificate ID without declaring client awards", () => {
  const url = createRouteURL({ view: "verify-certificate", certificateId: id }, "https://cybertracelab.dev/");
  assert.equal(readRoute(url.href).view, "verify-certificate");
  assert.equal(readRoute(url.href).certificateId, id);
  const page = readFileSync(new URL("../src/pages/CertificateVerification.jsx", import.meta.url), "utf8");
  assert(page.includes("lookupCertificate"));
  assert(page.includes("إفادات التدريب القديمة"));
  assert(!page.includes("setDoc("));
  assert(!page.includes("dangerouslySetInnerHTML"));
});
