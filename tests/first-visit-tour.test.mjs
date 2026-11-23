import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {FIRST_VISIT_TOUR_KEY,FIRST_VISIT_TOUR_DONE,hasFinishedFirstVisitTour,shouldOpenFirstVisitTour,finishFirstVisitTour} from "../src/utils/firstVisitTour.js";

const store=()=>{const values=new Map();return {getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),snapshot:()=>Object.fromEntries(values)}};
test("first visit is shown only for a new visitor at the home page",()=>{
  const local=store(),session=store();
  assert.equal(shouldOpenFirstVisitTour({view:"home"},local,session),true);
  for(const view of ["auth","investigation","library","soc","settings","certificates","verify-certificate","journeys","welcome"]){
    assert.equal(shouldOpenFirstVisitTour({view},local,session),false,"must not hijack direct "+view+" links");
  }
  assert.equal(hasFinishedFirstVisitTour(local,session),false);
});
test("skip and completion preserve progress, account and appearance keys",()=>{
  const local=store(),session=store();
  for(const [key,val] of [["cybertrace.ui-preferences.v1",'{"theme":"gold"}'],["cybertrace-progress",'{"case":"INC-1101"}'],["other-account-token","unchanged"]])local.setItem(key,val);
  assert.equal(finishFirstVisitTour(local,session),true);
  assert.equal(shouldOpenFirstVisitTour({view:"home"},local,session),false);
  assert.equal(local.getItem(FIRST_VISIT_TOUR_KEY),FIRST_VISIT_TOUR_DONE);
  assert.equal(local.getItem("cybertrace.ui-preferences.v1"),'{"theme":"gold"}');
  assert.equal(local.getItem("cybertrace-progress"),'{"case":"INC-1101"}');
  assert.equal(local.getItem("other-account-token"),"unchanged");
  assert.equal(session.getItem(FIRST_VISIT_TOUR_KEY),FIRST_VISIT_TOUR_DONE);
});
test("blocked local storage falls back to session, both failures do not throw",()=>{
  const bad={getItem(){throw Error("SecurityError")},setItem(){throw Error("SecurityError")}};
  const session=store();
  assert.equal(finishFirstVisitTour(bad,session),true);
  assert.equal(hasFinishedFirstVisitTour(bad,session),true);
  assert.equal(finishFirstVisitTour(bad,bad),false);
  assert.equal(hasFinishedFirstVisitTour(bad,bad),false);
});
test("intro page is explicitly routed, skippable, and not an authentication gate",()=>{
  const app=readFileSync(new URL("../src/App.jsx",import.meta.url),"utf8");
  const nav=readFileSync(new URL("../src/components/HomeNavbar.jsx",import.meta.url),"utf8");
  const component=readFileSync(new URL("../src/pages/WelcomeTour.jsx",import.meta.url),"utf8");
  assert.match(app,/view === "welcome"/);
  assert.match(app,/shouldOpenFirstVisitTour/);
  assert.match(app,/finishFirstVisitTour/);
  assert.match(nav,/الدليل التفاعلي/);
  assert.match(component,/تخطي الجولة/);
  assert.match(component,/لا تُحفظ نقاط/);
  assert.match(component,/ليست شهادات موثّقة خادميًا/);
  assert.match(component,/onLibrary/);
  assert.match(component,/CaseZero mode="investigate"/);
  assert.match(component,/CaseZero mode="soc"/);
  assert.doesNotMatch(component,/TrainingChoice|ct-tour-choice/);
  const simulator=readFileSync(new URL("../src/pages/CaseZero.jsx",import.meta.url),"utf8");
  assert.match(simulator,/EV-01/);
  assert.match(simulator,/SOC-101/);
  assert.match(simulator,/data-ct-report-submit/);
  assert.doesNotMatch(simulator,/fetch\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage|firebase/);
  assert.doesNotMatch(component,/localStorage|onAuthStateChanged|Firebase|fetch\(/);
});
