import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, Timestamp, serverTimestamp } from "firebase/firestore";

let env;
const path = (uid, id = "INC-0417") => `blackboxUsers/${uid}/cybertrace/${id}`;
const receipt = (id = "INC-0417", score = 25) => ({
  schemaVersion: 1, source: "cybertrace", caseId: id, bestScore: score,
  firstSyncedAt: serverTimestamp(), updatedAt: serverTimestamp(),
});
before(async () => {
  assert.ok(process.env.FIRESTORE_EMULATOR_HOST, "Start tests with Firebase Firestore emulator");
  env = await initializeTestEnvironment({
    projectId: "demo-blackbox-security",
    firestore: { rules: await readFile(new URL("../security/firestore.current.rules", import.meta.url), "utf8") },
  });
});
after(async () => { await env?.cleanup(); });

test("owner can create and read a legacy receipt", async () => {
  const db = env.authenticatedContext("alice").firestore();
  await assertSucceeds(setDoc(doc(db, path("alice")), receipt()));
  await assertSucceeds(getDoc(doc(db, path("alice"))));
});
test("other users and unauthenticated clients cannot read or write", async () => {
  await env.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), path("alice")), {
      schemaVersion: 1, source: "cybertrace", caseId: "INC-0417", bestScore: 20,
      firstSyncedAt: Timestamp.now(), updatedAt: Timestamp.now(),
    });
  });
  const bob = env.authenticatedContext("bob").firestore();
  const guest = env.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(bob, path("alice"))));
  await assertFails(getDoc(doc(guest, path("alice"))));
  await assertFails(setDoc(doc(bob, path("alice")), receipt("INC-0417", 70)));
  await assertFails(getDocs(collection(bob, "blackboxUsers/alice/cybertrace")));
  await assertFails(deleteDoc(doc(env.authenticatedContext("alice").firestore(), path("alice"))));
});
test("owner can list own receipts; invalid IDs and extra fields are rejected", async () => {
  const db = env.authenticatedContext("alice").firestore();
  await assertSucceeds(getDocs(collection(db, "blackboxUsers/alice/cybertrace")));
  await assertFails(setDoc(doc(db, path("alice", "INC-9999")), receipt("INC-9999")));
  await assertFails(setDoc(doc(db, path("alice", "INC-0512")), { ...receipt("INC-0512"), isAdmin: true }));
});
test("legacy client can self-assert a perfect score: known trust gap", async () => {
  const db = env.authenticatedContext("alice").firestore();
  // This is intentionally allowed by CURRENT rules: score is not server-verified.
  await assertSucceeds(setDoc(doc(db, path("alice", "INC-0633")), receipt("INC-0633", 70)));
});
test("current allowlist rejects new catalogue cases", async () => {
  const db = env.authenticatedContext("alice").firestore();
  await assertFails(setDoc(doc(db, path("alice", "INC-1201")), receipt("INC-1201", 20)));
});
