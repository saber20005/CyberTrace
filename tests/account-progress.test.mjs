import test from "node:test";
import assert from "node:assert/strict";
import { setProgressOwner, progressKey, importLegacyProgress, legacyProgressNeedsImport } from "../src/utils/progressScope.js";
const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
test("progress keys are isolated across accounts and guests", () => {
  setProgressOwner("account-A"); const a=progressKey("cybertrace_xp");
  setProgressOwner("account-B"); const b=progressKey("cybertrace_xp");
  setProgressOwner(null); const guest=progressKey("cybertrace_xp");
  assert.equal(new Set([a,b,guest]).size,3);
});
test("legacy data is never imported without explicit invocation and existing account data is not overwritten", () => {
  const data=new Map([["cybertrace_xp","310"]]);
  Object.defineProperty(globalThis,"localStorage",{configurable:true,value:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}});
  try {
    setProgressOwner("A"); const key=progressKey("cybertrace_xp");
    assert.equal(data.get(key),undefined);
    assert.equal(legacyProgressNeedsImport(),true, "unclaimed legacy progress must prompt for explicit import");
    assert.equal(importLegacyProgress(),true);
    assert.equal(legacyProgressNeedsImport(),false, "imported progress must not show the banner again");
    assert.equal(data.get(key),"310");
    data.set("cybertrace_xp","999");
    assert.equal(importLegacyProgress(),false);
    assert.equal(data.get(key),"310");
    setProgressOwner("B");
    assert.equal(data.get(progressKey("cybertrace_xp")),undefined);
    assert.equal(legacyProgressNeedsImport(),true, "another account is not assumed to own the old data");
  } finally { if(original) Object.defineProperty(globalThis,"localStorage",original); else delete globalThis.localStorage; }
});
