import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {CASES} from "../src/data/cases.js";
import {SUITE_PATHWAYS,SUITE_PATHWAYS_VERSION,suiteStepURL,localJourneyProgress} from "../src/data/unifiedPathways.js";
import {readRoute,createRouteURL} from "../src/utils/routes.js";
test("the suite curriculum is composed of existing CyberTrace incidents and stable public BlackBox links",()=>{
 assert.equal(SUITE_PATHWAYS_VERSION,"2026-11-22.v1");
 assert.equal(SUITE_PATHWAYS.length,4);
 assert.equal(new Set(SUITE_PATHWAYS.map(x=>x.id)).size,4);
 for(const path of SUITE_PATHWAYS){
  assert.equal(path.steps.length,4);
  path.steps.forEach((step,i)=>{
   assert.equal(step.site,i%2===0?"cybertrace":"blackbox");
   if(step.site==="cybertrace")assert(CASES.some(c=>c.id===step.id));
   const url=new URL(suiteStepURL(step));
   assert.equal(url.origin,step.site==="blackbox"?"https://blackboxlab.dev":"https://www.cybertracelab.dev");
   assert.deepEqual([...url.searchParams.keys()],step.site==="blackbox"?["view","track"]:["case"]);
  });
 }
 assert.throws(()=>suiteStepURL({site:"blackbox",id:"tampered"}));
});
test("journey route and UI use only current account's already scoped local investigation records",()=>{
 assert.deepEqual(readRoute("https://www.cybertracelab.dev/?view=journeys",CASES),{view:"journeys"});
 assert.equal(createRouteURL({view:"journeys"},"https://www.cybertracelab.dev/?email=secret@example.com").search,"?view=journeys");
 assert.deepEqual(localJourneyProgress(SUITE_PATHWAYS[0],"cybertrace",id=>id==="INC-0417"),{done:1,total:2,remoteKnown:false,credentialEligible:false});
 const source=readFileSync(new URL("../src/pages/UnifiedJourneys.jsx",import.meta.url),"utf8");
 assert.match(source,/getCaseResults\(\)/);
 assert.match(source,/حالة الإكمال غير معروفة هنا/);
 assert.doesNotMatch(source,/localStorage\.setItem|setDoc\(|certificateEligible:true/);
});
