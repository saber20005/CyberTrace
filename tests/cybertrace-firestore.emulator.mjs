import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { doc, getDoc, getDocs, collection, setDoc, deleteDoc } from "firebase/firestore";

let env;
const ref = (db, uid) => doc(db, "cybertraceUsers", uid, "state", "progress");
const record = (changes = {}) => ({
  schemaVersion: 1,
  results: { "INC-0417": { attempts: 2, lastScore: 50, bestScore: 70, lastCompletedAt: "2026-11-19T08:00:00.000Z" } },
  completed: ["INC-0417"],
  xp: 150,
  ...changes,
});
before(async () => {
  assert.ok(process.env.FIRESTORE_EMULATOR_HOST, "Run with Firestore emulator");
  env = await initializeTestEnvironment({
    projectId: "demo-cybertrace-progress",
    firestore: { rules: await readFile(new URL("../security/firestore.cybertrace-progress.rules", import.meta.url), "utf8") },
  });
});
after(async () => { await env?.cleanup(); });

test("account owner can save, update and read valid progress", async () => {
  const db = env.authenticatedContext("owner").firestore();
  await assertSucceeds(setDoc(ref(db, "owner"), record()));
  await assertSucceeds(setDoc(ref(db, "owner"), record({ xp: 200 })));
  const snap = await assertSucceeds(getDoc(ref(db, "owner")));
  assert.equal(snap.data().xp, 200);
});
test("another user and an unsigned guest cannot read or write an account", async () => {
  const other = env.authenticatedContext("attacker").firestore();
  const guest = env.unauthenticatedContext().firestore();
  await assertFails(getDoc(ref(other, "owner")));
  await assertFails(setDoc(ref(other, "owner"), record({ xp: 9999 })));
  await assertFails(getDoc(ref(guest, "owner")));
  await assertFails(setDoc(ref(guest, "owner"), record()));
});
test("owner cannot list or delete progress", async () => {
  const db = env.authenticatedContext("owner").firestore();
  await assertFails(getDocs(collection(db, "cybertraceUsers/owner/state")));
  await assertFails(deleteDoc(ref(db, "owner")));
});
test("deny forged schema, unknown cases and unsafe XP", async () => {
  const db = env.authenticatedContext("restricted").firestore();
  await assertFails(setDoc(ref(db, "restricted"), record({ admin: true })));
  await assertFails(setDoc(ref(db, "restricted"), record({ results: { "INC-9999": record().results["INC-0417"] } })));
  await assertFails(setDoc(ref(db, "restricted"), record({ completed: ["INC-9999"] })));
  await assertFails(setDoc(ref(db, "restricted"), record({ xp: 2000001 })));
  await assertFails(setDoc(ref(db, "restricted"), record({ results: { "INC-0417": { attempts: 1, bestScore: 900, lastScore: 50, lastCompletedAt: "2026-11-19T08:00:00.000Z" } } })));
  await assertFails(setDoc(ref(db, "restricted"), record({ results: { "INC-0417": { ...record().results["INC-0417"], isAdmin: true } } })));
});
test("owner can save a previously completed investigation without an invented score", async () => {
  const db = env.authenticatedContext("legacy").firestore();
  await assertSucceeds(setDoc(ref(db, "legacy"), record({ results: {}, completed: ["INC-0417"], xp: 0 })));
});
