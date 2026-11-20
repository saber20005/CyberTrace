import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "src");
function filesIn(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? filesIn(full)
      : entry.isFile() && /\.(?:js|jsx|ts|tsx|mjs)$/.test(entry.name) ? [full] : [];
  });
}

test("untrusted training notes cannot be interpreted as HTML/SVG by normal React rendering", () => {
  const text = '</textarea><svg onload="window.__cybertraceXss=1"></svg><img src=x onerror="window.__cybertraceXss=1">';
  const html = renderToStaticMarkup(createElement("p", null, text));
  assert(html.includes("&lt;/textarea&gt;"));
  assert(html.includes("&lt;svg"));
  assert(html.includes("&lt;img"));
  assert(!html.includes("<svg"));
  assert(!html.includes("<img"));
});

test("production React source does not introduce HTML parser or raw HTML rendering sinks", () => {
  const forbidden = [
    { name: "React raw HTML", expression: /\bdangerouslySetInnerHTML\b/ },
    { name: "DOM HTML assignment", expression: /\.(?:innerHTML|outerHTML)\s*(?:=|\+=)/ },
    { name: "HTML insertion", expression: /\b(?:insertAdjacentHTML|createContextualFragment|document\.write|document\.writeln)\s*\(/ },
  ];
  const sourceFiles = filesIn(src);
  assert(sourceFiles.length >= 15, "expected to scan the production application modules");
  for (const file of sourceFiles) {
    const code = readFileSync(file, "utf8");
    for (const check of forbidden) {
      assert.doesNotMatch(code, check.expression,
        check.name + " in " + relative(root, file) + "; add a security review before introducing this sink");
    }
  }
});
