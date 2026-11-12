import assert from "node:assert/strict";
import { test } from "node:test";
import { CASES } from "../src/data/cases.js";
import { CATEGORIES } from "../src/data/caseCatalog.js";
import { buildLearningPlan } from "../src/utils/learningPlan.js";

const today = () => new Date(2026, 10, 12, 12);
const caseById = id => CASES.find(item => item.id === id);
const rec = (plan, type) => plan.recommendations.find(item => item.type === type);
const skill = (plan, id) => plan.skills.find(item => item.id === id);

function assertUniqueRecommendations(plan) {
  const ids = plan.recommendations.map(item => item.caseData.id);
  assert.equal(new Set(ids).size, ids.length, "one case must not fill several recommendation cards");
  for (const item of plan.recommendations) assert(item.reason.trim().length > 0);
}

test("fresh learners receive an easier-first next case without changing equal-level catalogue order", () => {
  const pool = ["INC-1104", "INC-1101", "INC-0512", "INC-0417"].map(caseById);
  const plan = buildLearningPlan(pool, {}, [], today());
  assert.equal(rec(plan, "new").caseData, pool[2]);
  assert.equal(rec(plan, "review"), undefined);
  assert.equal(rec(plan, "record"), undefined);
  assert(rec(plan, "daily"));
  assertUniqueRecommendations(plan);
  assert.equal(plan.allScoredPerfect, false);
  assert.equal(plan.skills.length, CATEGORIES.length);
  assert(plan.skills.every(item => item.points === 0 && item.scoredCount === 0));
});

test("the lowest recorded best score is reviewed before a stronger score or a perfect result", () => {
  const pool = ["INC-0417", "INC-0512", "INC-0633", "INC-0701", "INC-0755"].map(caseById);
  const results = {
    "INC-0417": { bestScore: 50 },
    "INC-0512": { bestScore: 20 },
    "INC-0633": { bestScore: 70 },
  };
  const plan = buildLearningPlan(pool, results, [], today());
  assert.equal(rec(plan, "review").caseData.id, "INC-0512");
  assert.equal(rec(plan, "new").caseData.id, "INC-0701");
  assert.equal(skill(plan, "email").completedCount, 1, "a valid score is an actual completion");
  assert.equal(skill(plan, "email").points, 20);
  assertUniqueRecommendations(plan);
});

test("legacy completions stay unscored and are offered a first recorded attempt", () => {
  const pool = ["INC-0417", "INC-0512", "INC-0633"].map(caseById);
  const plan = buildLearningPlan(pool, {}, ["INC-0417", "INC-0417"], today());
  assert.equal(rec(plan, "record").caseData.id, "INC-0417");
  assert.equal(rec(plan, "new").caseData.id, "INC-0512");
  assert.equal(rec(plan, "daily").caseData.id, "INC-0633");
  const identity = skill(plan, "identity");
  assert.equal(identity.completedCount, 1);
  assert.equal(identity.scoredCount, 0);
  assert.equal(identity.unscoredCount, 1);
  assert.equal(identity.points, 0);
  assert.equal(identity.maxPoints, 70);
  assert.equal(identity.percent, 0);
  assert.equal(plan.allScoredPerfect, false);
  assertUniqueRecommendations(plan);
});

test("score coverage uses each catalogue case once and the best score rather than attempt totals", () => {
  const pool = ["INC-0417", "INC-0812", "INC-1002", "INC-1102"].map(caseById);
  const plan = buildLearningPlan(pool, {
    "INC-0417": { bestScore: 70, attempts: 100 },
    "INC-0812": { bestScore: 0, attempts: 3 },
    "INC-1002": { bestScore: 42, attempts: 20 },
  }, ["INC-1102"], today());
  const identity = skill(plan, "identity");
  assert.equal(identity.caseCount, 4);
  assert.equal(identity.completedCount, 4);
  assert.equal(identity.scoredCount, 3);
  assert.equal(identity.unscoredCount, 1);
  assert.equal(identity.points, 112);
  assert.equal(identity.maxPoints, 280);
  assert.equal(identity.percent, 40);
  assert.equal(rec(plan, "review").caseData.id, "INC-0812", "a real zero result is still reviewable");
});

test("all-perfect learners retain a usable daily revisit without a false improvement or new card", () => {
  const results = Object.fromEntries(CASES.map(item => [item.id, { bestScore: 70 }]));
  const plan = buildLearningPlan(CASES, results, [], today());
  assert.equal(plan.allScoredPerfect, true);
  assert.equal(plan.recommendations.length, 1);
  assert.equal(plan.recommendations[0].type, "daily");
  assert(plan.skills.every(item => item.percent === 100 && item.scoredCount === item.caseCount));
});

test("daily suggestions remain stable within a date and rotate on the next date", () => {
  const morning = new Date(2026, 10, 12, 1);
  const evening = new Date(2026, 10, 12, 23);
  const tomorrow = new Date(2026, 10, 13, 1);
  const first = buildLearningPlan(CASES, {}, [], morning);
  const same = buildLearningPlan(CASES, {}, [], evening);
  const next = buildLearningPlan(CASES, {}, [], tomorrow);
  assert.equal(rec(first, "daily").caseData.id, rec(same, "daily").caseData.id);
  assert.notEqual(rec(first, "daily").caseData.id, rec(next, "daily").caseData.id);
  assertUniqueRecommendations(first);
  assertUniqueRecommendations(next);
});

test("duplicates and invalid entries never inflate coverage or produce invalid case actions", () => {
  const first = caseById("INC-0417");
  const duplicate = { ...first, brief: "duplicate must not replace original" };
  const pool = [null, {}, { id: "__proto__" }, { id: "constructor" }, { id: "prototype" }, first, duplicate, caseById("INC-0512")];
  const plan = buildLearningPlan(pool, {}, [], today());
  assert.equal(skill(plan, "identity").caseCount, 1);
  assert.equal(rec(plan, "new").caseData, first);
  assert(plan.recommendations.every(item => ["INC-0417", "INC-0512"].includes(item.caseData.id)));
  assertUniqueRecommendations(plan);
});

test("malformed scores and scores from outside the catalogue contribute no recorded progress", () => {
  const results = {
    "INC-0417": { bestScore: NaN },
    "INC-0512": { bestScore: "70" },
    "INC-0633": { bestScore: 71 },
    "INC-0701": { bestScore: -1 },
    "INC-0755": { bestScore: 3.5 },
    "INC-0812": null,
    "INC-0890": Object.create({ bestScore: 70 }),
    "UNKNOWN": { bestScore: 70 },
  };
  const plan = buildLearningPlan(CASES, results, ["UNKNOWN"], today());
  assert(plan.skills.every(item => item.points === 0 && item.scoredCount === 0));
  assert.equal(rec(plan, "review"), undefined);
  for (const malformed of [null, [], "not a result map", 42]) {
    const recovered = buildLearningPlan(CASES, malformed, null, today());
    assert(recovered.skills.every(item => item.points === 0));
    assertUniqueRecommendations(recovered);
  }
});

test("empty or unusable catalogues produce zero coverage and no dead recommendation cards", () => {
  for (const empty of [[], null, {}, [null, {}, { id: "__proto__" }]]) {
    const plan = buildLearningPlan(empty, { "INC-0417": { bestScore: 70 } }, ["INC-0417"], today());
    assert.deepEqual(plan.recommendations, []);
    assert.equal(plan.allScoredPerfect, false);
    assert.equal(plan.skills.length, CATEGORIES.length);
    assert(plan.skills.every(item => item.caseCount === 0 && item.maxPoints === 0 && item.percent === 0 && item.completedCount === 0));
  }
});

test("planning is read-only even with frozen inputs and retains original case references", () => {
  const pool = Object.freeze([caseById("INC-0417"), caseById("INC-0512"), caseById("INC-0633")].map(item => Object.freeze({ ...item })));
  const results = Object.freeze({ "INC-0417": Object.freeze({ bestScore: 20 }) });
  const completed = Object.freeze(["INC-0417"]);
  const date = today();
  const before = JSON.stringify({ pool, results, completed, date });
  const plan = buildLearningPlan(pool, results, completed, date);
  assert.equal(rec(plan, "review").caseData, pool[0]);
  assert.equal(JSON.stringify({ pool, results, completed, date }), before);
  assertUniqueRecommendations(plan);
});
