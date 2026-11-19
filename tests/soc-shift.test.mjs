import test from "node:test";
import assert from "node:assert/strict";
import { SOC_SHIFT_ID, SOC_ALERTS, SOC_PRIORITIES, SOC_LINK_CHOICES, SOC_SHIFT_MAX_SCORE } from "../src/data/socShift.js";
import { setProgressOwner, progressKey } from "../src/utils/progressScope.js";
import { normalizeSocSession, commitSocAlert, finalizeSocShift, gradeSocSession, socSessionKey, loadSocSession, saveSocSession, makeSocShiftReport } from "../src/utils/socShiftSession.js";
import { CASES } from "../src/data/cases.js";
import { createRouteURL, readRoute } from "../src/utils/routes.js";
import { describePage } from "../src/utils/pageMetadata.js";

const blank = () => ({ version: 1, responses: {}, correlationId: null });
function storage() {
  const data = new Map();
  return { data, getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}
function completeShift(actionIndex = 0, priorityOverride = null, linkId = "possible-link") {
  let state = blank();
  for (const alert of SOC_ALERTS) {
    state = commitSocAlert(state, alert.id, priorityOverride || alert.priority, alert.actions[actionIndex].id, "محاكاة فقط");
    assert(state, alert.id);
  }
  return finalizeSocShift(state, linkId);
}

test("shift is distinct from canonical cases and contains four credible synthetic alerts", () => {
  assert.equal(SOC_SHIFT_ID, "SOC-SHIFT-01");
  assert.equal(SOC_SHIFT_MAX_SCORE, 100);
  assert.equal(SOC_ALERTS.length, 4);
  assert.equal(new Set(SOC_ALERTS.map(alert => alert.id)).size, 4);
  assert(SOC_ALERTS.every(alert => !CASES.some(item => item.id === alert.id)));
  const knownPriorities = new Set(SOC_PRIORITIES.map(item => item.id));
  for (const alert of SOC_ALERTS) {
    assert(knownPriorities.has(alert.priority));
    assert(alert.evidence.length >= 5);
    assert(alert.evidence.every(line => /^\d{2}:\d{2}:\d{2} /u.test(line)));
    assert.equal(new Set(alert.actions.map(item => item.id)).size, 3);
    assert.equal(alert.actions.some(action => action.points === 12), true);
    assert(alert.actions.every(action => Number.isInteger(action.points) && action.points >= 0 && action.points <= 12));
    assert(alert.priorityExplanation.length > 45);
  }
  assert.equal(SOC_LINK_CHOICES.length, 3);
});

test("valid completed shift grants the exact 100/100 client-only training score", () => {
  const s = completeShift();
  const grade = gradeSocSession(s);
  assert.equal(grade.complete, true);
  assert.equal(grade.score, 100);
  assert.equal(grade.maxScore, 100);
  assert.equal(grade.handled, 4);
  assert.equal(grade.correlationPoints, 20);
  assert.equal(grade.level, "ممتاز");
  assert(grade.assessments.every(item => item.total === 20));
  assert(grade.assessments.every(item => item.priorityPoints === 8 && item.actionPoints === 12));
  assert.equal(makeSocShiftReport(s).includes("100 / 100"), true);
  assert.equal(makeSocShiftReport(s).includes("محاكاة تعليمية"), true);
  assert.equal(makeSocShiftReport(s).includes("لا تُمنح XP"), true);
});

test("poor priority and response choices produce partial score, never assumed success", () => {
  const s = completeShift(1, "p4", "certain-cause");
  const grade = gradeSocSession(s);
  assert.equal(grade.score, 5 + 4 + 0 + 2 + 4);
  assert.equal(grade.level, "يحتاج مراجعة");
  assert(grade.assessments.every(item => item.priorityPoints === 0 || item.expectedPriority === "p4"));
  assert(grade.assessments.every(item => item.actionFeedback.length > 15));
  assert.equal(grade.correlationPoints, 4);
});

test("one alert can only be committed once, and link requires four valid decisions", () => {
  let s = blank();
  assert.equal(finalizeSocShift(s, "possible-link"), null);
  assert.equal(commitSocAlert(s, "INC-0417", "p1", "contain"), null);
  assert.equal(commitSocAlert(s, "SOC-A14", "invalid", "contain"), null);
  assert.equal(commitSocAlert(s, "SOC-A14", "p1", "not-an-action"), null);
  s = commitSocAlert(s, "SOC-A14", "p1", "contain", "a".repeat(800));
  assert.equal(s.responses["SOC-A14"].note.length, 350);
  assert.equal(commitSocAlert(s, "SOC-A14", "p3", "monitor"), null);
  assert.equal(finalizeSocShift(s, "possible-link"), null);
  assert.equal(gradeSocSession(s).complete, false);
  assert.equal(gradeSocSession(s).score, null);
  assert.equal(makeSocShiftReport(s), null);
  assert.equal(finalizeSocShift(completeShift(), "possible-link"), null);
});

test("foreign injected choices cannot turn corrupted data into rewarded completions", () => {
  const bad = { version: 1, responses: {
    "SOC-A14": { priorityId: "p1", actionId: "contain", note: "yes" },
    "SOC-B08": { priorityId: "p2", actionId: "contain", note: "not an action for B" },
    "SOC-C03": { priorityId: "p3", actionId: "verify-owner", note: [] },
    "SOC-D01": { priorityId: "p4", actionId: "validate", note: "s" },
    "__proto__": { priorityId: "p1", actionId: "contain" },
  }, correlationId: "possible-link" };
  const normalized = normalizeSocSession(bad);
  assert.equal(Object.keys(normalized.responses).length, 3);
  assert.equal(normalized.correlationId, null);
  assert.equal(normalized.responses["SOC-C03"].note, "");
  assert.equal(gradeSocSession(bad).complete, false);
  assert.equal(gradeSocSession(bad).score, null);
  assert.equal(normalizeSocSession({ version: 99, responses: {} }).correlationId, null);
});

test("SOC state is isolated by account and never touches XP, cases or BlackBox records", () => {
  const local = storage();
  const session = completeShift();
  setProgressOwner("analyst-one");
  const keyOne = socSessionKey();
  saveSocSession(session, local);
  assert.equal(loadSocSession(local).correlationId, "possible-link");
  assert.equal(local.data.size, 1);
  assert.equal(local.data.has(progressKey("cybertrace_xp")), false);
  assert.equal(local.data.has(progressKey("cybertrace_case_results")), false);
  setProgressOwner("analyst-two");
  assert.notEqual(socSessionKey(), keyOne);
  assert.equal(gradeSocSession(loadSocSession(local)).handled, 0);
  setProgressOwner(null);
  assert.equal(gradeSocSession(loadSocSession(local)).handled, 0);
  setProgressOwner("analyst-one");
  assert.equal(gradeSocSession(loadSocSession(local)).score, 100);
});

test("storage failure and malformed JSON never block new training sessions", () => {
  setProgressOwner("test-storage");
  const broken = { getItem: () => "{invalid-json", setItem: () => { throw Error("storage full"); } };
  assert.deepEqual(loadSocSession(broken), blank());
  assert.throws(() => saveSocSession(blank(), broken), /storage full/);
});

test("public SOC route is clean, shareable and independent of subscription claims", () => {
  assert.deepEqual(readRoute("https://cybertracelab.dev/?view=soc", CASES), { view: "soc" });
  assert.deepEqual(readRoute("https://cybertracelab.dev/?view=soc&view=auth", CASES), { view: "home" });
  const url = createRouteURL({ view: "soc" }, "https://cybertracelab.dev/?email=private%40example.com&utm_source=linkedin");
  assert.equal(url.searchParams.get("view"), "soc");
  assert.equal(url.searchParams.has("email"), false);
  assert.equal(url.searchParams.get("utm_source"), "linkedin");
  const page = describePage({ view: "soc" }, CASES);
  assert.equal(page.url, "https://cybertracelab.dev/?view=soc");
  assert(page.title.includes("SOC"));
  assert(page.description.includes("غير موثق"));
});
