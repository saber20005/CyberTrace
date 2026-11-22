import test from "node:test";
import assert from "node:assert/strict";
import { readRoute, createRouteURL } from "../src/utils/routes.js";
import { UI_PREFERENCES_KEY, DEFAULT_UI_PREFERENCES, normalizeUIPreferences, readUIPreferences, saveUIPreferences, applyUIPreferences } from "../src/utils/uiPreferences.js";

const memory=()=>{const store=new Map();return {getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),get keys(){return [...store.keys()];}};};
test("settings route resolves and generates canonical query without relying on login",()=>{
  assert.equal(readRoute("https://cybertracelab.dev/?view=settings").view,"settings");
  assert.equal(createRouteURL({view:"settings"},"https://cybertracelab.dev/").searchParams.get("view"),"settings");
});
test("preferences read/write are device only and never include identity or progress",()=>{
  const storage=memory();
  const next={theme:"light",textSize:"large",motion:"reduce",level:"intermediate",uid:"foreign-uid",xp:900,progress:{fake:true}};
  assert.equal(saveUIPreferences(next,storage),true);
  assert.deepEqual(readUIPreferences(storage),{theme:"light",textSize:"large",motion:"reduce",level:"intermediate"});
  assert.deepEqual(storage.keys,[UI_PREFERENCES_KEY]);
  assert.equal(storage.getItem(UI_PREFERENCES_KEY).includes("foreign-uid"),false);
  assert.equal(storage.getItem(UI_PREFERENCES_KEY).includes("xp"),false);
});
test("corrupt or unavailable browser storage cannot block the website",()=>{
  const broken={getItem:()=>"{bad-json",setItem:()=>{throw Error("quota");}};
  assert.deepEqual(readUIPreferences(broken),DEFAULT_UI_PREFERENCES);
  assert.equal(saveUIPreferences({theme:"light"},broken),false);
  assert.deepEqual(normalizeUIPreferences({theme:"invalid",motion:"fake",level:"advanced"}),{...DEFAULT_UI_PREFERENCES,level:"advanced"});
});
test("presentation toggles only on supplied root and respect reduced motion",()=>{
  const root={dataset:{}};
  applyUIPreferences({theme:"light",textSize:"large",motion:"reduce"},root);
  assert.deepEqual(root.dataset,{ctTheme:"light",ctText:"large",ctMotion:"reduce"});
});
