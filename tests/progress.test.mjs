import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { CASES } from "../src/data/cases.js";
import { CATEGORIES, DIFFICULTIES, getCaseDetails } from "../src/data/caseCatalog.js";

let imports = 0;
const freshProgress = () => import(`../src/utils/caseProgress.js?scenario=${++imports}`);
const freshXP = () => import(`../src/utils/xp.js?scenario=${++imports}`);
const originalRandom = Math.random;
const originalStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");

function storage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  };
}

function useStorage(store) {
  Object.defineProperty(globalThis, "localStorage", { configurable: true, writable: true, value: store });
  Math.random = () => 0;
}

afterEach(() => {
  Math.random = originalRandom;
  if (originalStorage) Object.defineProperty(globalThis, "localStorage", originalStorage);
  else delete globalThis.localStorage;
});

test("legacy completions keep their status without invented scores or attempts", async () => {
  const store = storage({ cybertrace_seen_cases: JSON.stringify(["INC-0417", "INC-0512", "INC-0417", null, 3, {}]) });
  useStorage(store);
  const api = await freshProgress();
  assert.deepEqual(api.getCompletedCaseIds(), ["INC-0417", "INC-0512"]);
  assert.deepEqual(api.getCaseResults(), {});
  api.markCaseSeen("INC-0633");
  assert.deepEqual(JSON.parse(store.getItem("cybertrace_completed_cases")), ["INC-0417", "INC-0512", "INC-0633"]);
  assert.equal(api.pickRandomCase(CASES).id, "INC-0701");
});

test("repeat attempts update last result while preserving best result and completion time", async () => {
  const store = storage(); useStorage(store);
  const api = await freshProgress();
  const first = api.recordCaseResult("INC-1101", 70);
  assert.equal(first.attempts, 1);
  assert.equal(first.lastScore, 70);
  assert.equal(first.bestScore, 70);
  assert.equal(new Date(first.lastCompletedAt).toISOString(), first.lastCompletedAt);
  const second = api.recordCaseResult("INC-1101", 10);
  assert.equal(second.attempts, 2);
  assert.equal(second.lastScore, 10);
  assert.equal(second.bestScore, 70);
  assert(api.getCompletedCaseIds().includes("INC-1101"));
  assert(JSON.parse(store.getItem("cybertrace_seen_cases")).includes("INC-1101"));
  assert.equal(api.recordCaseResult("INC-1102", 500).lastScore, 70);
  assert.equal(api.recordCaseResult("INC-1102", -5).lastScore, 0);
  assert.equal(api.recordCaseResult("INC-1102", NaN), null);
  assert.equal(api.recordCaseResult("__proto__", 70), null);
  assert.equal(api.getCaseResults()["INC-1102"].attempts, 2);
});

test("a full rotation resets only selection history and retains lifetime completions", async () => {
  const store = storage({ cybertrace_seen_cases: JSON.stringify(CASES.map(c => c.id)) });
  useStorage(store);
  const api = await freshProgress();
  assert.equal(api.pickRandomCase(CASES).id, CASES[0].id);
  assert.deepEqual(JSON.parse(store.getItem("cybertrace_seen_cases")), []);
  assert.deepEqual(api.getCompletedCaseIds().sort(), CASES.map(c => c.id).sort());
  assert.deepEqual(api.getCaseResults(), {});
  api.recordCaseResult(CASES[0].id, 50);
  assert.equal(api.getCaseResults()[CASES[0].id].attempts, 1);
  assert.equal(api.getCompletedCaseIds().length, CASES.length);
});

test("malformed JSON and invalid stored shapes recover without breaking the next attempt", async () => {
  const store = storage({
    cybertrace_seen_cases: '{"wrong":"shape"}',
    cybertrace_completed_cases: "null",
    cybertrace_case_results: '[{"wrong":"shape"}]',
  });
  useStorage(store);
  const api = await freshProgress();
  assert.deepEqual(api.getCompletedCaseIds(), []);
  assert.deepEqual(api.getCaseResults(), {});
  assert.equal(api.pickRandomCase(CASES).id, CASES[0].id);
  store.setItem("cybertrace_seen_cases", "{");
  store.setItem("cybertrace_case_results", "{");
  assert.doesNotThrow(() => api.markCaseSeen("INC-0417"));
  assert.equal(api.recordCaseResult("INC-0417", 50).lastScore, 50);
});

test("invalid records and unsafe object keys cannot damage valid history", async () => {
  useStorage(storage({ cybertrace_case_results: '{"INC-0417":{"attempts":2,"lastScore":40,"bestScore":30,"lastCompletedAt":"2026-11-09T08:00:00Z"},"INC-0512":{"attempts":-3,"lastScore":70,"bestScore":70,"lastCompletedAt":"invalid"},"__proto__":{"attempts":1,"lastScore":70,"bestScore":70,"lastCompletedAt":"2026-11-09T08:00:00Z"},"INC-0633":null}' }));
  const api = await freshProgress();
  assert.deepEqual(Object.keys(api.getCaseResults()), ["INC-0417"]);
  assert.equal(api.getCaseResults()["INC-0417"].bestScore, 40);
  assert.equal(Object.getPrototypeOf(api.getCaseResults()), Object.prototype);
});

test("blocked storage retains progress and XP during the current session", async () => {
  useStorage({ getItem() { throw new Error("Storage unavailable"); }, setItem() { throw new Error("Storage unavailable"); } });
  const api = await freshProgress();
  const xp = await freshXP();
  assert.deepEqual(api.getCompletedCaseIds(), []);
  assert.equal(api.recordCaseResult("INC-0417", 70).attempts, 1);
  assert.equal(api.recordCaseResult("INC-0417", 10).attempts, 2);
  assert.equal(api.getCaseResults()["INC-0417"].bestScore, 70);
  assert.deepEqual(api.getCompletedCaseIds(), ["INC-0417"]);
  assert.equal(api.pickRandomCase(CASES).id, "INC-0512");
  assert.equal(xp.addXP(70).newXP, 70);
  assert.equal(xp.addXP(10).newXP, 80);
  assert.equal(xp.getXP(), 80);
});

test("quota failures do not expose stale stored progress or XP over newer session values", async () => {
  const old = storage({ cybertrace_seen_cases: JSON.stringify(["INC-0417"]), cybertrace_xp: "140" });
  useStorage({ getItem: old.getItem, setItem() { throw new Error("Quota exceeded"); } });
  const api = await freshProgress();
  const xp = await freshXP();
  api.recordCaseResult("INC-0512", 60);
  assert.deepEqual(api.getCompletedCaseIds(), ["INC-0417", "INC-0512"]);
  assert.equal(api.pickRandomCase(CASES).id, "INC-0633");
  assert.equal(api.recordCaseResult("INC-0512", 40).attempts, 2);
  assert.equal(xp.addXP(70).newXP, 210);
  assert.equal(xp.addXP(10).newXP, 220);
  assert.equal(xp.getXP(), 220);
});

test("legacy XP remains intact while invalid balances and awards cannot produce NaN", async () => {
  const store = storage({ cybertrace_xp: "140" }); useStorage(store);
  const xp = await freshXP();
  assert.equal(xp.getXP(), 140);
  assert.equal(xp.addXP(70).newXP, 210);
  for (const invalid of ["13bad", "Infinity", "-1", "1.5"]) {
    store.setItem("cybertrace_xp", invalid);
    assert.equal(xp.getXP(), 0);
  }
  assert.equal(xp.addXP(NaN).newXP, 0);
  assert.equal(xp.addXP(-50).newXP, 0);
});

test("empty or invalid case pools return null", async () => {
  useStorage(storage()); const api = await freshProgress();
  assert.equal(api.pickRandomCase([]), null);
  assert.equal(api.pickRandomCase(null), null);
  assert.equal(api.pickRandomCase([null, {}, { id: "__proto__" }]), null);
});

test("every current case has Arabic catalog labels and a valid category and difficulty", () => {
  for (const c of CASES) {
    const details = getCaseDetails(c);
    assert(/[\u0600-\u06ff]/.test(details.title), `${c.id} Arabic title`);
    assert(CATEGORIES.some(category => category.id === details.category));
    assert(DIFFICULTIES.some(difficulty => difficulty.id === details.difficulty));
    assert(details.categoryLabel && details.difficultyLabel);
  }
  for (const id of ["INC-1101", "INC-1102", "INC-1103"]) assert.equal(getCaseDetails({ id }).difficulty, "intermediate");
  for (const id of ["INC-1104", "INC-1105", "INC-1106"]) assert.equal(getCaseDetails({ id }).difficulty, "advanced");
  assert.equal(getCaseDetails(undefined).categoryLabel, "تحقيقات عامة");
  assert.equal(getCaseDetails({ id: "__proto__" }).title, "تحقيق أمني");
});
