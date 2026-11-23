import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readRoute, createRouteURL } from "../src/utils/routes.js";
import { UI_PREFERENCES_KEY,DEFAULT_UI_PREFERENCES,UI_PRESETS,applyUIPreset,normalizeUIPreferences,readUIPreferences,saveUIPreferences,applyUIPreferences } from "../src/utils/uiPreferences.js";
const memory=()=>{const map=new Map();return {getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),keys:()=>[...map.keys()]};};
test("settings remains a public route with existing navigation",()=>{
 assert.equal(readRoute("https://cybertracelab.dev/?view=settings").view,"settings");
 assert.equal(createRouteURL({view:"settings"},"https://cybertracelab.dev/").searchParams.get("view"),"settings");
});
test("old v1 settings migrate to v2 without overwriting progress or other keys",()=>{
 const storage=memory();
 const legacy={theme:"light",textSize:"large",motion:"reduce",level:"intermediate",uid:"foreign",xp:500};
 storage.setItem("cybertrace-progress","unchanged training record");
 storage.setItem(UI_PREFERENCES_KEY,JSON.stringify(legacy));
 assert.deepEqual(readUIPreferences(storage),{...DEFAULT_UI_PREFERENCES,theme:"light",textSize:"large",motion:"reduce",level:"intermediate"});
 assert.equal(saveUIPreferences({...readUIPreferences(storage),accent:"cyan",density:"compact",contrast:"high",uid:"intruder",xp:100},storage),true);
 assert.equal(storage.getItem("cybertrace-progress"),"unchanged training record");
 assert.deepEqual(storage.keys().sort(),[UI_PREFERENCES_KEY,"cybertrace-progress"].sort());
 assert.equal(storage.getItem(UI_PREFERENCES_KEY).includes("intruder"),false);
 assert.equal(storage.getItem(UI_PREFERENCES_KEY).includes("xp"),false);
});
test("presets are real, complete and preserve independent training level",()=>{
 assert.equal(UI_PRESETS.length,4);
 for(const preset of UI_PRESETS){
  const applied=applyUIPreset({level:"advanced"},preset.id);
  assert.equal(applied.level,"advanced");
  assert.equal(applied.theme,preset.theme);
  assert.equal(applied.density,preset.density);
 }
 assert.deepEqual(applyUIPreset({theme:"midnight"},"invalid"),normalizeUIPreferences({theme:"midnight"}));
});
test("unrecognized or malicious values and broken storage are safely rejected",()=>{
 assert.deepEqual(normalizeUIPreferences({theme:"evil",accent:"#abc; background:url()",density:"unlimited",level:"advanced"}),{...DEFAULT_UI_PREFERENCES,level:"advanced"});
 const broken={getItem:()=>"{bad",setItem:()=>{throw Error("quota")}};
 assert.deepEqual(readUIPreferences(broken),DEFAULT_UI_PREFERENCES);
 assert.equal(saveUIPreferences({theme:"light"},broken),false);
});
test("all controls update presentation-only root attributes",()=>{
 const root={dataset:{}};
 applyUIPreferences({theme:"midnight",accent:"violet",textSize:"xlarge",density:"compact",contrast:"high",motion:"reduce"},root);
 assert.deepEqual(root.dataset,{ctTheme:"midnight",ctAccent:"violet",ctText:"xlarge",ctDensity:"compact",ctContrast:"high",ctMotion:"reduce"});
});

test("Royal Gold is opt-in, saved with the existing display key and independent of training data",()=>{
 const storage=memory();
 storage.setItem("cybertrace-progress","original case activity");
 const previous={...DEFAULT_UI_PREFERENCES,theme:"midnight",accent:"violet",level:"advanced"};
 saveUIPreferences(previous,storage);
 assert.equal(readUIPreferences(storage).theme,"midnight","current appearance stays default until selected");
 const gold=applyUIPreset(readUIPreferences(storage),"royal-gold");
 assert.equal(gold.theme,"gold");
 assert.equal(gold.accent,"brand","gold palette never mixes violet/cyan");
 assert.equal(gold.level,"advanced","preset must preserve training level");
 assert.equal(saveUIPreferences(gold,storage),true);
 assert.equal(readUIPreferences(storage).theme,"gold");
 assert.equal(storage.getItem("cybertrace-progress"),"original case activity");
 const root={dataset:{}};
 applyUIPreferences(readUIPreferences(storage),root);
 assert.equal(root.dataset.ctTheme,"gold");
 assert.equal(root.dataset.ctAccent,"brand");
 assert.deepEqual(normalizeUIPreferences({...gold,accent:"cyan"}),gold,"gold forces correct accent on old devices");
 saveUIPreferences(previous,storage);
 assert.equal(readUIPreferences(storage).theme,"midnight","return to previous theme supported");
});
test("Royal Gold visual stylesheet excludes floating preview controls and preserves source swatches",()=>{
 const css=readFileSync(new URL("../src/styles/royal-gold-theme.css",import.meta.url),"utf8");
 for(const hex of ["#5A4A0D","#7A5E12","#A67917","#CC961F","#EBB84A","#F3D789","#FFF3D8"])
   assert(css.includes(hex),"missing color "+hex);
 assert(css.includes('html[data-ct-theme="gold"] .inv-screen .inv-review'));
 assert(css.includes('html[data-ct-theme="gold"] .soc-page'));
 assert(!css.includes(".ct-amber-compare"),"no floating comparison toolbar in permanent theme");
});
