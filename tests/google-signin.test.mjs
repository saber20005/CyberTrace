import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { signInToCyberTraceWithGoogle, googleSignInErrorMessage } from "../src/utils/googleAuth.js";

test("Google popup signs in only to the provided CyberTrace Firebase Auth instance", async () => {
  const cyberTraceAuth = { name: "cybertrace-auth" };
  const expectedUser = { uid: "cybertrace-user-1", displayName: "Analyst", email: "analyst@example.test" };
  const calls = [];
  const user = await signInToCyberTraceWithGoogle(cyberTraceAuth, async (auth, provider) => {
    calls.push({ auth, provider });
    return { user: expectedUser };
  });
  assert.equal(user, expectedUser);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].auth, cyberTraceAuth);
  assert.equal(calls[0].provider.providerId, "google.com");
  assert.deepEqual(calls[0].provider.getCustomParameters(), { prompt: "select_account" });
});

test("failed Google sign-in does not fall back to anonymous or BlackBox sign-in", async () => {
  const noProvider = Object.assign(new Error("provider disabled"), { code: "auth/operation-not-allowed" });
  const auth = {};
  let calls = 0;
  await assert.rejects(
    signInToCyberTraceWithGoogle(auth, async () => { calls++; throw noProvider; }),
    err => err === noProvider
  );
  assert.equal(calls, 1);
  assert.match(googleSignInErrorMessage(noProvider), /Firebase/);
});

test("no user identity is treated as an authentication failure", async () => {
  await assert.rejects(
    signInToCyberTraceWithGoogle({}, async () => ({ user: { email: "no-uid@example.test" } })),
    { code: "auth/invalid-user-token" }
  );
});

test("cancelled Google popup is quiet, configuration and collision errors are actionable", () => {
  for (const code of ["auth/popup-closed-by-user", "auth/cancelled-popup-request"]) {
    assert.equal(googleSignInErrorMessage({ code }), "");
  }
  for (const code of ["auth/popup-blocked", "auth/unauthorized-domain", "auth/operation-not-allowed", "auth/network-request-failed"]) {
    assert(googleSignInErrorMessage({ code }).length > 20);
  }
  const collision = googleSignInErrorMessage({ code: "auth/account-exists-with-different-credential" });
  assert.match(collision, /الطريقة الأصلية/);
  assert.match(collision, /لن ندمج حسابين تلقائيًا/);
  assert.match(googleSignInErrorMessage({ code: "auth/credential-already-in-use" }), /لن ننقل التقدم/);
  assert.match(googleSignInErrorMessage({ code: "unknown" }), /البريد الإلكتروني/);
});

test("login and sign-up both offer the Google action, but password recovery does not", async () => {
  const source = await readFile(new URL("../src/pages/Auth.jsx", import.meta.url), "utf8");
  assert(source.includes("signInToCyberTraceWithGoogle(auth)"));
  assert(source.includes("!isReset && <div className=\"auth-google-section\">"));
  assert(source.includes("onClick={handleGoogleSignIn}"));
  assert(source.includes("disabled={loading}"));
  assert(source.includes("ربط حساب BLACKBOX خطوة منفصلة"));
  assert(source.includes("signInWithEmailAndPassword"));
  assert(source.includes("createUserWithEmailAndPassword"));
});
