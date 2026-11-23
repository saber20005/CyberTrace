import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const get=p=>readFileSync(new URL(p,import.meta.url),"utf8");
test("preview includes the exact amber tones and the real CyberTrace entrypoint",()=>{
 const css=get("../src/styles/gold-preview.css");
 for(const swatch of ["#5A4A0D","#7A5E12","#A67917","#CC961F","#EBB84A","#F3D789","#FFF3D8"])
   assert(css.includes(swatch),"missing color "+swatch);
 assert.match(css,/html\[data-cybertrace-preview="gold"\]/);
 assert.match(get("../src/main.jsx"),/import '.\/goldPreview.js'/);
 assert.match(get("../src/main.jsx"),/import '.\/styles\/gold-preview.css'/);
});
test("preview comparator does not modify progress, account data or user preferences",()=>{
 const script=get("../src/goldPreview.js");
 assert.match(script,/dataset\[key\] = "gold"/);
 assert.match(script,/aria-pressed/);
 assert.match(script,/الموقع الرسمي/);
 assert.doesNotMatch(script,/localStorage|sessionStorage|fetch\(|firebase|firestore|createRouteURL/);
});

test("gold comparison is collapsible on mobile and does not write account preferences",()=>{
  const js=get("../src/goldPreview.js");
  assert.match(js,/setExpanded\(!compact\)/);
  assert.match(js,/aria-expanded/);
  assert.match(js,/aria-controls/);
  assert.match(js,/controls\.hidden/);
  assert.match(js,/setGold\(true\)/);
  assert.doesNotMatch(js,/localStorage|sessionStorage|fetch\(|firebase|firestore/);
  const css=get("../src/styles/gold-preview.css");
  for(const selector of [".ct-studio-local span",".ct-studio-live i",".ct-studio-preview-indicator",
      ".ct-amber-compare-actions[hidden]",".ct-amber-compare.is-collapsed"]) {
    assert(css.includes(selector),"Missing palette/overlay fix: "+selector);
  }
});
