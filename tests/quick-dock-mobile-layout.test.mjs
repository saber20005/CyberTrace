import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = file => readFileSync(new URL(file, import.meta.url), "utf8");

test("CyberTrace quick dock is 2x2 and text wraps on phone instead of overflowing", () => {
  const css = read("../src/components/QuickDock.css");
  const mobile = css.slice(css.lastIndexOf("@media (max-width: 640px)"));
  assert.match(mobile, /left:max\(12px,env\(safe-area-inset-left,0px\)\)/);
  assert.match(mobile, /\.ct-quick-dock:not\(\[open\]\) \{width:max-content\}/);
  assert.match(mobile, /\.ct-quick-dock\[open\] \{width:min\(274px,calc\(100vw - 24px\)\)\}/);
  assert.match(mobile, /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(mobile, /min-width:0;width:100%/);
  assert.match(mobile, /white-space:normal;overflow-wrap:anywhere/);
});
test("open CyberTrace dock dismisses via outside click, Escape, scroll and route choice", () => {
  const jsx=read("../src/components/QuickDock.jsx");
  for(const event of ['"pointerdown"', '"keydown"', '"scroll"']) assert(jsx.includes(event));
  assert.match(jsx, /if \(details\.current\?\.open && !details\.current\.contains\(event\.target\)\)/);
  assert.match(jsx, /event\.key !== "Escape"/);
  assert.match(jsx, /details\.current\.querySelector\("summary"\)\?\.focus\(\)/);
  assert.match(jsx, /if \(details\.current\) details\.current\.open = false/);
  assert.match(jsx, /onClick=\{\(\) => visit\(link\.action\)\}/);
  assert.doesNotMatch(jsx, /setDoc\(|signOut\(|getDoc\(/);
});
