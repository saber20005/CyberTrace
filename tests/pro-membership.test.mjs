import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseSuiteMembership, ALLOWED_FEATURES, PLAN_ID } from "../src/blackbox/suiteMembershipCore.js";
const read = path => readFileSync(new URL(path, import.meta.url), "utf8");
const now = Date.parse("2026-11-21T12:00:00.000Z");
const free = {schemaVersion:1,plan:"free",active:false,features:[],expiresAt:null};
const paid = {schemaVersion:1,plan:PLAN_ID,active:true,features:[...ALLOWED_FEATURES],expiresAt:"2026-12-21T12:00:00.000Z"};

test("pure membership reader only accepts the exact server-owned Free envelope",()=>{
  const value=parseSuiteMembership(free,now);
  assert.equal(value.active,false);
  assert.deepEqual(value.features,[]);
  for(const other of [{...free,active:true},{...free,expiresAt:"2026-12-01"},
    {...free,features:["advanced-soc"]},{...free,owner:"another-user"}]){
    assert.throws(()=>parseSuiteMembership(other,now));
  }
});

test("future Pro status requires valid expiration, exact plan and known feature set",()=>{
  const result=parseSuiteMembership(paid,now);
  assert.equal(result.active,true);
  assert.equal(result.expiresAt,paid.expiresAt);
  for(const other of [{...paid,expiresAt:"2026-11-20T10:00:00.000Z"},
    {...paid,expiresAt:"invalid-date"},{...paid,plan:"admin"},
    {...paid,features:["admin"]},{...paid,features:[]},{...paid,active:false}]){
    assert.throws(()=>parseSuiteMembership(other,now));
  }
});

test("no browser check may grant Pro, create a membership, or identify owner by email",()=>{
  const backend=read("../src/blackbox/suiteMembership.js");
  const panel=read("../src/components/ProMembershipPanel.jsx");
  const page=read("../src/pages/Pro.jsx");
  assert.match(backend,/getAuth\(app\)\.currentUser\?\.uid !== uid/);
  assert.match(backend,/getFunctions\(app, "us-central1"\), "getSuiteMembership"/);
  assert.match(backend,/ReCaptchaEnterpriseProvider/);
  assert.match(backend,/requireConnectedBlackBox\(uid\);\n  return parseSuiteMembership/);
  assert.doesNotMatch(backend,/setDoc\(|updateDoc\(|signInWithEmailAndPassword|email ===/);
  assert.match(panel,/key=\{uid \?\? "unlinked"\}/);
  assert.match(page,/لا توجد مدفوعات|لا يوجد دفع/);
  assert.match(page,/ProMembershipPanel/);
});
