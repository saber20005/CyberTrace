import test from "node:test";
import assert from "node:assert/strict";
import { SOC_SHIFT_ID, SOC_ALERTS } from "../src/data/socShift.js";
import { SOC_SHIFTS, SOC_SHIFT_IDS, SOC_PRIORITIES, getSocShift, isSocShiftId, socShiftMaxScore } from "../src/data/socShiftCatalog.js";
import { setProgressOwner, progressKey } from "../src/utils/progressScope.js";
import { normalizeSocSession, commitSocAlert, finalizeSocShift, gradeSocSession, socSessionKey, loadSocSession, saveSocSession, makeSocShiftReport } from "../src/utils/socShiftSession.js";
import { readRoute, createRouteURL } from "../src/utils/routes.js";
import { describePage } from "../src/utils/pageMetadata.js";
import { readFileSync } from "node:fs";

const blank = () => ({version:1,responses:{},correlationId:null});
const storage = () => {
  const data = new Map();
  return { data, getItem: key => data.get(key) ?? null, setItem: (key,value) => { data.set(key,value); } };
};

function perfect(shift) {
  let state = blank();
  for (const alert of shift.alerts) {
    const best = alert.actions.find(action => action.points === 12);
    assert(best, "Every alert needs a defensible top response.");
    state = commitSocAlert(state, alert.id, alert.priority, best.id, "أدلة اصطناعية", shift.id);
    assert(state, "Valid decision must succeed.");
  }
  const bestLink = shift.links.find(choice => choice.points === 20);
  return finalizeSocShift(state,bestLink.id,shift.id);
}

test("three SOC tiers are real distinct, calibrated cases with defensible responses", () => {
  assert.deepEqual(SOC_SHIFT_IDS, ["SOC-SHIFT-01","SOC-SHIFT-02","SOC-SHIFT-03"]);
  assert.equal(new Set(SOC_SHIFTS.map(shift => shift.title)).size, 3);
  assert.equal(getSocShift("invalid").id, SOC_SHIFT_ID);
  assert.equal(isSocShiftId("INVALID"),false);
  assert.equal(getSocShift(SOC_SHIFT_ID).alerts,SOC_ALERTS);
  const known = new Set(SOC_PRIORITIES.map(item => item.id));
  const alertIds = new Set();
  for (const shift of SOC_SHIFTS) {
    assert.equal(shift.alerts.length,4);
    assert.equal(socShiftMaxScore(shift),100);
    assert(shift.focus.length > 25);
    assert(shift.estimatedMinutes >= 12);
    assert.equal(shift.links.filter(c => c.points === 20).length,1);
    assert.equal(new Set(shift.links.map(x => x.id)).size,3);
    for (const alert of shift.alerts) {
      assert(!alertIds.has(alert.id),alert.id);
      alertIds.add(alert.id);
      assert(known.has(alert.priority),alert.id);
      assert.equal(alert.evidence.length,5);
      assert(alert.evidence.every(line => /^\d{2}:\d{2}:\d{2} /u.test(line)));
      assert.equal(alert.actions.filter(a => a.points === 12).length,1);
      assert.equal(new Set(alert.actions.map(a => a.id)).size,3);
      assert(alert.actions.every(a => a.feedback.length > 20 && a.label.length > 15));
      assert(alert.priorityExplanation.length > 35);
    }
  }
  assert(alertIds.size === 12);
  // In new levels the correct option isn't always the first option.
  for (const shift of SOC_SHIFTS.slice(1)) {
    assert(shift.alerts.some(alert => alert.actions.findIndex(a=>a.points===12) !== 0));
  }
});

test("all tiers score independently to 100 and provide concrete coaching and honest reports", () => {
  for(const shift of SOC_SHIFTS) {
    const state=perfect(shift);
    assert(state);
    const grade=gradeSocSession(state,shift.id);
    assert.equal(grade.complete,true);
    assert.equal(grade.score,100);
    assert.equal(grade.maxScore,100);
    assert.equal(grade.priorityScore,32);
    assert.equal(grade.responseScore,48);
    assert.equal(grade.correlationPoints,20);
    assert.deepEqual(grade.coaching,{missedPriority:0,weakResponse:0,correlationNeedsWork:false});
    const report=makeSocShiftReport(state,shift.id);
    assert(report.includes(shift.id));
    assert(report.includes(shift.title));
    assert(report.includes("الأولويات: 32 / 32"));
    assert(report.includes("محاكاة تعليمية"));
    assert(report.includes("لا تُمنح XP"));
  }
});

test("weak responses get feedback and never count as verified performance", () => {
  const shift=SOC_SHIFTS[2];
  let state=blank();
  for(const alert of shift.alerts) {
    const worst=alert.actions.find(a => a.points === 0);
    state=commitSocAlert(state,alert.id,"p4",worst.id,"",shift.id);
    assert(state);
  }
  state=finalizeSocShift(state,shift.links.find(c=>c.points===0).id,shift.id);
  const grade=gradeSocSession(state,shift.id);
  assert(grade.complete);
  assert(grade.score < 20);
  assert.equal(grade.responseScore,0);
  assert.equal(grade.coaching.weakResponse,4);
  assert.equal(grade.coaching.correlationNeedsWork,true);
  assert.equal(makeSocShiftReport(state,shift.id).includes("راجع 4 إجراءات"),true);
  assert.equal(grade.level,"يحتاج مراجعة");
});

test("earlier free SOC-01 key and score stay intact while levels use separate per-user storage", () => {
  const db=storage();
  setProgressOwner("analyst-A");
  const originalKey=progressKey("cybertrace_soc_shift:SOC-SHIFT-01");
  assert.equal(socSessionKey(),originalKey);
  const pilot=perfect(SOC_SHIFTS[0]);
  saveSocSession(pilot,db);
  const intermediate=perfect(SOC_SHIFTS[1]);
  const advanced=perfect(SOC_SHIFTS[2]);
  saveSocSession(intermediate,db,SOC_SHIFTS[1].id);
  saveSocSession(advanced,db,SOC_SHIFTS[2].id);
  assert.equal(db.data.size,3);
  assert.equal(gradeSocSession(loadSocSession(db),"SOC-SHIFT-01").score,100);
  assert.equal(gradeSocSession(loadSocSession(db,"SOC-SHIFT-02"),"SOC-SHIFT-02").score,100);
  assert.equal(gradeSocSession(loadSocSession(db,"SOC-SHIFT-03"),"SOC-SHIFT-03").score,100);
  setProgressOwner("analyst-B");
  assert.equal(gradeSocSession(loadSocSession(db,"SOC-SHIFT-03"),"SOC-SHIFT-03").handled,0);
  setProgressOwner(null);
  assert.equal(gradeSocSession(loadSocSession(db,"SOC-SHIFT-02"),"SOC-SHIFT-02").handled,0);
  setProgressOwner("analyst-A");
  assert.equal(gradeSocSession(loadSocSession(db)).score,100);
  for(const sensitiveKey of ["cybertrace_case_results","cybertrace_xp"]) assert(!db.data.has(progressKey(sensitiveKey)));
});

test("cross-scenario injection cannot forge score, replay choices or complete other sessions", () => {
  const shift=SOC_SHIFTS[1], attacker=SOC_SHIFTS[2];
  const first=shift.alerts[0], second=attacker.alerts[0];
  const bad=commitSocAlert(blank(),second.id,second.priority,second.actions[0].id,"",shift.id);
  assert.equal(bad,null);
  let state=commitSocAlert(blank(),first.id,first.priority,first.actions[1].id,"n".repeat(800),shift.id);
  assert.equal(state.responses[first.id].note.length,350);
  assert.equal(commitSocAlert(state,first.id,"p4",first.actions[0].id,"",shift.id),null);
  const foreign={version:1,responses:{...state.responses,[second.id]:{priorityId:"p1",actionId:second.actions[0].id}},correlationId:attacker.links[0].id};
  const cleaned=normalizeSocSession(foreign,shift.id);
  assert.equal(Object.keys(cleaned.responses).length,1);
  assert.equal(cleaned.correlationId,null);
  assert.equal(makeSocShiftReport(foreign,shift.id),null);
});

test("level-specific links survive route parsing and strip garbage or personal data",()=>{
  assert.deepEqual(readRoute("https://cybertracelab.dev/?view=soc"),{view:"soc"});
  assert.deepEqual(readRoute("https://cybertracelab.dev/?view=soc&shift=invalid"),{view:"soc"});
  assert.deepEqual(readRoute("https://cybertracelab.dev/?view=soc&shift=SOC-SHIFT-02&shift=SOC-SHIFT-03"),{view:"soc"});
  for(const shift of SOC_SHIFTS) {
    const url="https://www.cybertracelab.dev/?view=soc&shift="+shift.id;
    assert.deepEqual(readRoute(url),{view:"soc",shiftId:shift.id});
    const generated=createRouteURL({view:"soc",shiftId:shift.id},"https://cybertracelab.dev/?email=private%40test.org&utm_source=ref");
    assert.equal(generated.searchParams.get("shift"),shift.id);
    assert.equal(generated.searchParams.has("email"),false);
    assert.equal(generated.searchParams.get("utm_source"),"ref");
    assert.equal(describePage({view:"soc",shiftId:shift.id}).url,url);
  }
});

test("UI only stores local practice; no new XP, trust or paywall APIs",()=>{
  const page=readFileSync(new URL("../src/pages/SocShift.jsx",import.meta.url),"utf8");
  const app=readFileSync(new URL("../src/App.jsx",import.meta.url),"utf8");
  assert(page.includes("soc-shift-cards"));
  assert(page.includes("soc-score-breakdown"));
  assert(page.includes("onSelectShift"));
  assert(page.includes("لا تُرسل بيانات هذه المناوبة إلى BLACKBOX"));
  assert(!page.includes("recordCaseResult("));
  assert(!page.includes("addXP("));
  assert(!page.includes("getSuiteMembership("));
  assert(app.includes("route.shiftId"));
});
