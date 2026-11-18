import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import { verifyAdminToken } from "../api/_lib/firebaseToken.mjs";
import handler from "../api/admin/summary.mjs";

test("rejects malformed and unsigned tokens", async () => {
  await assert.rejects(verifyAdminToken("abc.def.ghi"));
  await assert.rejects(verifyAdminToken("a.b"));
});

test("verifies signed Firebase admin claims, and rejects wrong audience", async () => {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const pem = publicKey.export({ type: "spki", format: "pem" });
  const now = 1795000000000, sec = Math.floor(now / 1000);
  const make = (aud, admin) => {
    const h = Buffer.from(JSON.stringify({ alg: "RS256", kid: "test-key", typ: "JWT" })).toString("base64url");
    const p = Buffer.from(JSON.stringify({ aud, iss: "https://securetoken.google.com/cybertrace-48ab0", sub: "uid1", iat: sec - 10, exp: sec + 3600, auth_time: sec - 20, admin })).toString("base64url");
    return h + "." + p + "." + sign("RSA-SHA256", Buffer.from(h + "." + p), privateKey).toString("base64url");
  };
  const fetchCerts = async () => ({ ok: true, json: async () => ({ "test-key": pem }), headers: { get: () => "max-age=60" } });
  assert.deepEqual(await verifyAdminToken(make("cybertrace-48ab0", true), { now, fetchCerts }), { uid: "uid1", admin: true });
  assert.deepEqual(await verifyAdminToken(make("cybertrace-48ab0", false), { now, fetchCerts }), { uid: "uid1", admin: false });
  await assert.rejects(verifyAdminToken(make("wrong-project", true), { now, fetchCerts }));
});

test("endpoint rejects missing authorization and unsupported methods", async () => {
  const request = (method, authorization) => {
    const result = { code: null, headers: {}, body: null };
    const res = { setHeader(k,v) { result.headers[k]=v; }, status(n) { result.code=n; return this; }, json(data) { result.body=data; return this; } };
    return handler({ method, headers: { authorization } }, res).then(() => result);
  };
  assert.equal((await request("GET")).code, 401);
  assert.equal((await request("POST")).code, 405);
});
