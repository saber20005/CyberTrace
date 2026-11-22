import test from "node:test";
import assert from "node:assert/strict";
import { setProgressOwner, progressKey } from "../src/utils/progressScope.js";
import { getCaseResults, getCompletedCaseIds } from "../src/utils/caseProgress.js";
import { SUITE_PATHWAYS, localJourneyProgress } from "../src/data/unifiedPathways.js";

test("journey progress remains isolated per account, with legacy completions retained",()=>{
 const original=globalThis.localStorage;
 const saved=new Map();
 globalThis.localStorage={getItem:key=>saved.get(key)??null,setItem:(key,value)=>saved.set(key,String(value)),removeItem:key=>saved.delete(key)};
 try{
  setProgressOwner("account-A");
  const resultKey=progressKey("cybertrace_case_results"),completedKey=progressKey("cybertrace_completed_cases");
  saved.set(resultKey,JSON.stringify({"INC-0417":{attempts:1,lastScore:55,bestScore:55,lastCompletedAt:"2026-11-20T08:00:00.000Z"}}));
  saved.set(completedKey,JSON.stringify(["INC-1201"]));
  assert.equal(getCaseResults()["INC-0417"].bestScore,55);
  assert.deepEqual(localJourneyProgress(SUITE_PATHWAYS[0],"cybertrace",id=>getCompletedCaseIds().includes(id)),{done:2,total:2,remoteKnown:false,credentialEligible:false});
  setProgressOwner("account-B");
  assert.deepEqual(getCaseResults(),{});
  assert.deepEqual(getCompletedCaseIds(),[]);
  setProgressOwner(null);
  assert.deepEqual(getCompletedCaseIds(),[]);
  setProgressOwner("account-A");
  assert.equal(getCaseResults()["INC-0417"].bestScore,55);
  assert.equal(getCompletedCaseIds().includes("INC-1201"),true);
  assert.equal(saved.has(resultKey),true);
  assert.equal(saved.has(completedKey),true);
 }finally{
  setProgressOwner(null);
  if(original===undefined)delete globalThis.localStorage;else globalThis.localStorage=original;
 }
});
