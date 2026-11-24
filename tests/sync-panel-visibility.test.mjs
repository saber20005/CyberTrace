import test from "node:test";
import assert from "node:assert/strict";
import { nextSyncVerified, showSyncPrompt } from "../src/utils/cloudSyncPresentation.js";

test("sync panel remains for guests, disabled sync, or until server confirms",()=>{
  assert.equal(showSyncPrompt(null, false),false);
  assert.equal(showSyncPrompt({uid:"alice"},false),true);
  assert.equal(nextSyncVerified(false,{}),false);
  assert.equal(nextSyncVerified(false,{verified:true}),true);
  assert.equal(showSyncPrompt({uid:"alice"},nextSyncVerified(false,{verified:true})),false);
});

test("cache/connection statuses cannot falsely complete sync; failures reopen it",()=>{
  assert.equal(nextSyncVerified(false,{fromCache:true}),false);
  assert.equal(nextSyncVerified(true,{}),true);
  assert.equal(nextSyncVerified(true,{failed:true}),false);
  assert.equal(nextSyncVerified(true,{failed:true,verified:true}),false);
  assert.equal(showSyncPrompt({uid:"alice"},nextSyncVerified(true,{failed:true})),true);
});
