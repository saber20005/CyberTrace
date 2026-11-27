import assert from "node:assert/strict";
import test from "node:test";
import { CASES } from "../src/data/cases.js";
import { setProgressOwner, progressKey } from "../src/utils/progressScope.js";
import { createPendingAttempt, createPendingAttemptStore, pendingAttemptKey, validatePendingAttempt } from "../src/utils/pendingInvestigation.js";

const first = CASES[0];
function storage() {
  const rows = new Map();
  return { rows, getItem: key => rows.get(key) ?? null, setItem: (key, value) => rows.set(key, value), removeItem: key => rows.delete(key) };
}
const decision = () => ({ ...createPendingAttempt(first), step: 2,
  selectedEvidenceId: first.evidenceOptions.find(row => row.correct).id, evidenceChecked: true,
  selectedDecisionId: first.decisions[0].id, wrongEvidenceIds: [first.evidenceOptions.find(row => !row.correct).id] });

test("pending choices, checked evidence, mistakes and shuffled orders survive local reload without scores", () => {
  setProgressOwner("draft-restoration");
  const db = storage();
  const before = decision();
  const store = createPendingAttemptStore(first, { storage: db, now: () => 2000, completionStamp: () => null });
  assert(store.save(before));
  const saved = createPendingAttemptStore(first, { storage: db, now: () => 2500, completionStamp: () => null }).load();
  assert.deepEqual(saved, before);
  const raw = [...db.rows.values()][0];
  assert(!raw.includes("bestScore"));
  assert(!raw.includes("payroll_2026"));
  assert(!raw.includes(first.decisions[0].label));
  assert(!db.rows.has(progressKey("cybertrace_xp")));
  assert(!db.rows.has(progressKey("cybertrace_case_results")));
});

test("owner switch and case switch cannot inherit or overwrite another pending attempt", () => {
  setProgressOwner("draft-owner-a");
  const db = storage();
  const old = createPendingAttemptStore(first, { storage: db });
  const attempt = decision();
  old.save(attempt);
  const bytes = db.rows.get(old.key);
  setProgressOwner("draft-owner-b");
  assert.equal(old.isCurrent(), false);
  assert.equal(old.load(), null);
  assert.equal(old.save(createPendingAttempt(first)), false);
  assert.equal(old.clear(), false);
  assert.equal(createPendingAttemptStore(first, { storage: db }).load(), null);
  assert.equal(db.rows.get(old.key), bytes);
  setProgressOwner(null);
  assert.equal(createPendingAttemptStore(first, { storage: db }).load(), null);
  setProgressOwner("draft-owner-a");
  assert.deepEqual(createPendingAttemptStore(first, { storage: db }).load(), attempt);
  // Compare state without independently reshuffled order.
  assert.equal(createPendingAttemptStore(CASES[1], { storage: db }).load(), null);
  assert.throws(() => pendingAttemptKey("__proto__"));
});

test("malformed, impossible and completed snapshots are discarded instead of executing a result", () => {
  setProgressOwner("draft-corruption");
  const db = storage();
  const store = createPendingAttemptStore(first, { storage: db });
  store.save(decision());
  const original = JSON.parse(db.rows.get(store.key));
  const bad = [
    { ...original, schemaVersion: 99 },
    { ...original, caseId: CASES[1].id },
    { ...original, signature: "old answer key" },
    { ...original, updatedAt: 1 },
    { ...original, updatedAt: Date.now() + 3600000 },
    { ...original, attempt: { ...original.attempt, step: 3 } },
    { ...original, attempt: { ...original.attempt, evidenceChecked: false } },
    { ...original, attempt: { ...original.attempt, selectedEvidenceId: "unknown" } },
    { ...original, attempt: { ...original.attempt, evidenceOrder: ["ip-jump"] } },
    { ...original, attempt: { ...original.attempt, wrongEvidenceIds: ["ip-jump"] } },
  ];
  for (const value of ["{invalid", ...bad.map(value => JSON.stringify(value))]) {
    db.rows.set(store.key, value);
    assert.equal(store.load(), null);
    assert.equal(db.rows.has(store.key), false);
  }
  assert.equal(validatePendingAttempt({ ...createPendingAttempt(first), step: 0, selectedEvidenceId: "ip-jump" }, first), null);
  assert.equal(validatePendingAttempt({ ...decision(), selectedEvidenceId: first.evidenceOptions.find(row => !row.correct).id }, first), null);
  assert.equal(validatePendingAttempt({ ...decision(), wrongEvidenceIds: ["file-size", "file-size"] }, first), null);
});

test("a newer completion invalidates old persisted attempts even if deletion previously failed", () => {
  setProgressOwner("draft-after-completion");
  const db = storage();
  let completed = null;
  const options = { storage: db, completionStamp: () => completed };
  const stale = createPendingAttemptStore(first, options);
  stale.save(decision());
  const raw = db.rows.get(stale.key);
  completed = "2026-11-26T12:00:00.000Z";
  assert.equal(stale.save(decision()), false, "a stale mounted tab must not stamp an old attempt as newly completed");
  const restored = createPendingAttemptStore(first, options);
  assert.equal(restored.load(), null);
  assert.equal(db.rows.has(stale.key), false);
  db.rows.set(stale.key, raw);
  assert.equal(createPendingAttemptStore(first, options).load(), null);
  assert(restored.clear());
  assert(restored.save(createPendingAttempt(first)), "explicit restart may begin a new pending attempt after completion");
});

test("storage quota failure keeps session state and a failed deletion remains a tombstone", () => {
  setProgressOwner("draft-quota");
  const broken = { getItem() { throw Error("denied"); }, setItem() { throw Error("quota"); }, removeItem() { throw Error("denied"); } };
  const options = { storage: broken, completionStamp: () => null };
  const attempt = decision();
  const store = createPendingAttemptStore(first, options);
  assert.equal(store.save(attempt), false);
  assert.deepEqual(createPendingAttemptStore(first, options).load(), attempt);
  assert.equal(store.clear(), false);
  assert.equal(createPendingAttemptStore(first, options).load(), null);
});


test("a canonical evidence revision invalidates the previous pending choices", () => {
  setProgressOwner("draft-revised-content");
  const db = storage();
  createPendingAttemptStore(first, { storage: db }).save(decision());
  const revised = { ...first, logLines: [...first.logLines, "10:44:00 new supporting event"] };
  assert.equal(createPendingAttemptStore(revised, { storage: db }).load(), null);
  assert.equal(db.rows.size, 0);
});
