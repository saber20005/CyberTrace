import test from "node:test";
import assert from "node:assert/strict";
import { verifyAdminIdentity } from "../api/_lib/adminAuth.mjs";

const provider = (claims, user = { disabled: false, customClaims: { admin: true } }) =>
  async () => ({
    verifyIdToken: async (_token, checkRevoked) => {
      assert.equal(checkRevoked, true);
      if (claims instanceof Error) throw claims;
      return claims;
    },
    getUser: async () => user,
  });

test("requires a token", async () => {
  await assert.rejects(verifyAdminIdentity(""));
  await assert.rejects(verifyAdminIdentity(null));
});

test("allows current admin claim after revocation-aware verification", async () => {
  assert.deepEqual(await verifyAdminIdentity("signed", {
    authProvider: provider({ uid: "u1", admin: true }),
  }), { uid: "u1", admin: true });
});

test("rejects non-admin, disabled, and removed admin claims", async () => {
  for (const [claims, user] of [
    [{ uid: "u1", admin: false }, undefined],
    [{ uid: "u1", admin: true }, { disabled: true, customClaims: { admin: true } }],
    [{ uid: "u1", admin: true }, { disabled: false, customClaims: {} }],
  ]) {
    const result = await verifyAdminIdentity("signed", { authProvider: provider(claims, user) });
    assert.equal(result.admin, false);
  }
});

test("rejects revoked or otherwise invalid tokens", async () => {
  await assert.rejects(verifyAdminIdentity("signed", {
    authProvider: provider(new Error("auth/id-token-revoked")),
  }));
});
