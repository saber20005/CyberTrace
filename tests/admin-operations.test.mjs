import test from "node:test";
import assert from "node:assert/strict";
import { CASES } from "../src/data/cases.js";
import { buildCatalogOverview, createAdminSummaryHandler } from "../api/admin/summary.mjs";

function response() {
  return {
    statusCode: null, headers: {}, payload: null,
    setHeader(name,value) { this.headers[name]=value; },
    status(code) { this.statusCode=code; return this; },
    json(value) { this.payload=value; return this; },
  };
}
async function call(verify,method="GET",token="trusted-test-token") {
  const handler=createAdminSummaryHandler(verify);
  const res=response();
  await handler({method,headers:{authorization:token===null?undefined:"Bearer "+token}},res);
  return res;
}

test("catalog summary is grounded in published case content, not fabricated user metrics",()=>{
  const overview=buildCatalogOverview();
  assert.equal(overview.source,"published-case-catalog");
  assert.equal(overview.cases,CASES.length);
  assert.equal(overview.categories.length,8);
  assert.equal(overview.difficulties.length,3);
  assert.equal(overview.categories.reduce((n,row)=>n+row.count,0),CASES.length);
  assert.equal(overview.difficulties.reduce((n,row)=>n+row.count,0),CASES.length);
  assert.deepEqual(overview.integrity,{uniqueIds:true,mappedCategories:true,mappedDifficulties:true});
  assert.equal(Object.hasOwn(overview,"users"),false);
});

test("admin API is deny-by-default on missing token, invalid signature, wrong role and method",async()=>{
  const valid=async()=>({uid:"admin-A",admin:true});
  assert.equal((await call(valid,"GET",null)).statusCode,401);
  assert.equal((await call(async()=>{throw Error("forged");})).statusCode,401);
  assert.equal((await call(async()=>({uid:"user",admin:false}))).statusCode,403);
  assert.equal((await call(valid,"POST")).statusCode,405);
});

test("admin only receives read-only catalog and explicit unavailable trust boundaries",async()=>{
  const res=await call(async()=>({uid:"admin-A",admin:true}));
  assert.equal(res.statusCode,200);
  assert.equal(res.headers["Cache-Control"],"no-store");
  assert.equal(res.headers["X-Content-Type-Options"],"nosniff");
  assert.equal(res.payload.status,"catalog_only");
  assert.equal(res.payload.metrics,null);
  assert.equal(res.payload.catalog.cases,CASES.length);
  assert.equal(res.payload.availability.userTotals,"not_configured");
  assert.equal(res.payload.availability.revocationAwareAdmin,"not_enabled");
  assert.equal(Object.hasOwn(res.payload,"uid"),false);
  assert.equal(Object.hasOwn(res.payload,"email"),false);
  assert.equal(Object.hasOwn(res.payload,"users"),false);
  assert.equal(Object.hasOwn(res.payload,"uid"),false);
  assert.equal(Object.hasOwn(res.payload,"tokens"),false);
});
