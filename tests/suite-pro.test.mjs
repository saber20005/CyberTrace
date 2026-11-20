import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CASES } from "../src/data/cases.js";
import { createRouteURL, readRoute } from "../src/utils/routes.js";
import { describePage } from "../src/utils/pageMetadata.js";

test("Suite Pro is a public informational route with canonical metadata", () => {
  assert.deepEqual(readRoute("https://cybertracelab.dev/?view=pro", CASES), { view: "pro" });
  const url = createRouteURL({ view: "pro" }, "https://cybertracelab.dev/?email=sensitive%40test.tld&utm_source=linkedin");
  assert.equal(url.pathname, "/");
  assert.equal(url.searchParams.get("view"), "pro");
  assert.equal(url.searchParams.has("email"), false);
  assert.equal(url.searchParams.get("utm_source"), "linkedin");
  const page = describePage({ view: "pro" }, CASES);
  assert.equal(page.url, "https://www.cybertracelab.dev/?view=pro");
  assert.equal(page.noindex, false);
  assert(page.title.includes("BLACKBOX Pro"));
});
test("investigations, identity and library routes are unchanged", () => {
  assert.deepEqual(readRoute("https://cybertracelab.dev/?view=auth", CASES), { view: "auth" });
  assert.deepEqual(readRoute("https://cybertracelab.dev/?view=library", CASES), { view: "library" });
  assert.deepEqual(readRoute("https://cybertracelab.dev/?case=INC-0417", CASES), { view: "investigation", caseId: "INC-0417" });
  assert.deepEqual(readRoute("https://cybertracelab.dev/?view=pro&view=auth", CASES), { view: "home" });
});
test("Pro page promises no active billing and does not hide existing content", () => {
  const page = readFileSync(new URL("../src/pages/Pro.jsx", import.meta.url), "utf8");
  const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
  assert(page.includes("لا توجد مدفوعات"));
  assert(page.includes("مشروعَي Firebase مستقلين"));
  assert(page.includes("onLibrary"));
  assert(app.includes('view === "pro"'));
  assert(app.includes('view === "investigation"'));
  assert(app.includes("startInvestigation"));
  assert(!/checkout\.stripe\.com|paypal\.com|payment_intent/.test(page));
});
