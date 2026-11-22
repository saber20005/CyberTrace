import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { doc, getDoc, getDocs, collection, setDoc, deleteDoc } from "firebase/firestore";
import { mergeCloudProgress } from "../src/utils/cloudProgressModel.js";

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

test("two devices restore and merge one owner's progress; same email cannot bypass UID isolation",async()=>{
  // Two distinct client contexts with the SAME auth UID emulate a new device.
  const first=env.authenticatedContext("suite-two-device-owner",{email:"suite@example.test"}).firestore();
  const second=env.authenticatedContext("suite-two-device-owner",{email:"suite@example.test"}).firestore();
  const stranger=env.authenticatedContext("suite-other-owner",{email:"suite@example.test"}).firestore();
  const guest=env.unauthenticatedContext().firestore();
  const firstRef=ref(first,"suite-two-device-owner");
  const secondRef=ref(second,"suite-two-device-owner");
  const initial=record({xp:160});
  await assertSucceeds(setDoc(firstRef,initial));
  const restored=(await assertSucceeds(getDoc(secondRef))).data();
  assert.equal(restored.results["INC-0417"].bestScore,70);
  assert.deepEqual(restored.completed,["INC-0417"]);
  // Device B trains locally, then merges rather than replacing Device A's result.
  const extraCase={attempts:1,lastScore:45,bestScore:45,lastCompletedAt:"2026-11-20T09:00:00.000Z"};
  const merged=mergeCloudProgress(restored,{
    results:{"INC-0512":extraCase},completed:["INC-0512"],xp:180
  });
  await assertSucceeds(setDoc(secondRef,merged));
  const after=(await assertSucceeds(getDoc(firstRef))).data();
  assert.deepEqual(new Set(after.completed),new Set(["INC-0417","INC-0512"]));
  assert.equal(after.results["INC-0417"].bestScore,70);
  assert.equal(after.results["INC-0512"].bestScore,45);
  assert.equal(after.xp,180);
  await assertFails(getDoc(ref(stranger,"suite-two-device-owner")));
  await assertFails(setDoc(ref(stranger,"suite-two-device-owner"),record({xp:9999})));
  await assertFails(getDoc(ref(guest,"suite-two-device-owner")));
  await assertFails(setDoc(ref(guest,"suite-two-device-owner"),record()));
  const final=(await assertSucceeds(getDoc(firstRef))).data();
  assert.equal(final.xp,180,"unauthorized attempts must not alter the owner state");
});
