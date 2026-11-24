import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Isolated manifest/lockfile guard; no runtime network calls.
// Keep in place until Firestore updates stop pulling vulnerable transitive versions.
const manifest = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const lock = JSON.parse(readFileSync(new URL("../package-lock.json", import.meta.url), "utf8"));
const installed = name => lock.packages?.["node_modules/" + name]?.version;
const parts = version => {
  assert.match(version ?? "", /^\d+\.\d+\.\d+$/, "must have resolved semver");
  return version.split(".").map(Number);
};
const atLeast = (installedVersion, minimum) => {
  const actual = parts(installedVersion), safe = parts(minimum);
  for (let i=0;i<3;i++) {
    if (actual[i] > safe[i]) return true;
    if (actual[i] < safe[i]) return false;
  }
  return true;
};

test("security: patched re2js is enforced and recorded in npm lockfile", () => {
  assert.equal(manifest.overrides?.re2js, "2.8.7");
  assert.ok(atLeast(installed("re2js"), "2.8.7"), "RE2JS quadratic-time lookbehind DoS must remain fixed");
});

test("security: patched gRPC dependency cannot silently regress", () => {
  assert.equal(manifest.overrides?.["@grpc/grpc-js"], "1.13.7");
  const version = installed("@grpc/grpc-js");
  const [major, minor] = parts(version);
  assert.equal(major, 1);
  assert.ok(minor === 13 ? atLeast(version, "1.13.7") : atLeast(version, "1.14.6"),
    "gRPC certificate authentication and error-disclosure fixes must remain installed");
});

test("security: Firebase stays within intended major and no forced downgrade was applied", () => {
  assert.match(installed("firebase"), /^12\./);
  assert.equal(lock.packages[""].dependencies?.firebase, manifest.dependencies.firebase);
});

test("security: patched Zod is enforced for development/build dependencies", () => {
  assert.equal(manifest.overrides?.zod, "4.6.6");
  assert.ok(atLeast(installed("zod"), "4.6.6"), "Zod oversized collection memory-exhaustion fix must remain installed");
});
