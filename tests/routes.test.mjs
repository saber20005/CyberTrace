import assert from "node:assert/strict";
import test from "node:test";
import { CASES } from "../src/data/cases.js";
import { createRouteURL, getBlackBoxLearningLink, getShareURL, readRoute } from "../src/utils/routes.js";

test("all public case links resolve the intended case without relying on a previous session", () => {
  for (const item of CASES) {
    assert.deepEqual(readRoute(`https://example.test/?case=${item.id}&utm_source=linkedin`, CASES), { view: "investigation", caseId: item.id });
  }
  assert.deepEqual(readRoute("https://example.test/?view=library", CASES), { view: "library" });
  assert.deepEqual(readRoute("https://example.test/?view=auth", CASES), { view: "auth" });
  assert.deepEqual(readRoute("https://example.test/?case=INC-1101&view=library", CASES), { view: "investigation", caseId: "INC-1101" });
});

test("unknown, empty and ambiguous case links fall back to the library safely", () => {
  for (const query of ["case=unknown", "case=", "case=INC-1101&case=INC-1104", "case=%3Cscript%3E"]) {
    assert.deepEqual(readRoute(`https://example.test/?${query}`, CASES), { view: "library" });
  }
  assert.deepEqual(readRoute("https://example.test/?case=INC-1101", null), { view: "library" });
  assert.deepEqual(readRoute("https://example.test/?view=library&view=auth", CASES), { view: "home" });
  assert.deepEqual(readRoute("https://example.test/?view=unknown", CASES), { view: "home" });
});

test("navigation retains bounded campaign data while dropping unrelated query strings", () => {
  const current = "http://localhost:5173/?view=auth&utm_source=linkedin&utm_campaign=launch30&email=private%40example.com&filter=foo#about";
  const next = createRouteURL({ view: "investigation", caseId: "INC-1104" }, current);
  assert.equal(next.origin, "http://localhost:5173");
  assert.equal(next.searchParams.get("case"), "INC-1104");
  assert.equal(next.searchParams.get("utm_source"), "linkedin");
  assert.equal(next.searchParams.get("utm_campaign"), "launch30");
  assert.equal(next.searchParams.has("email"), false);
  assert.equal(next.searchParams.has("view"), false);
  assert.equal(next.hash, "");
  assert.equal(createRouteURL({ view: "home" }, current, { preserveHash: true }).hash, "#about");
  assert.equal(createRouteURL({ view: "library" }, `https://example.test/?utm_content=${"a".repeat(400)}`).searchParams.get("utm_content").length, 200);
});

test("shared links are canonical production links without personal or campaign query data", () => {
  assert.equal(getShareURL({ view: "library" }), "https://cyber-trace-psi.vercel.app/?view=library");
  assert.equal(getShareURL({ view: "investigation", caseId: "INC-1101" }), "https://cyber-trace-psi.vercel.app/?case=INC-1101");
});

test("partner journeys use existing BlackBox track routes and explicit referral attribution", () => {
  for (const [caseId, track] of [["INC-1101", "webgoat"], ["INC-0701", "webgoat"], ["INC-1104", "network"], ["INC-0944", "network"]]) {
    const link = getBlackBoxLearningLink(caseId);
    const url = new URL(link.url);
    assert.equal(url.origin, "https://blackboxlab.dev");
    assert.equal(url.searchParams.get("view"), "tracks");
    assert.equal(url.searchParams.get("track"), track);
    assert.equal(url.searchParams.get("utm_source"), "cybertrace");
    assert.equal(url.searchParams.get("utm_medium"), "referral");
    assert(link.label.includes("BlackBox-Lab"));
  }
  assert.equal(new URL(getBlackBoxLearningLink("INC-1102").url).searchParams.has("track"), false);
});
