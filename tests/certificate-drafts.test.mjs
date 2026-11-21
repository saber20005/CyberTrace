import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildCaseDrafts, buildCaseGroupRecords, validLearnerName, DRAFT_NOTICE } from "../src/utils/certificateDrafts.js";
import { CASES } from "../src/data/cases.js";
import { CATEGORIES, getCaseDetails } from "../src/data/caseCatalog.js";

test("only current cases with explicitly recorded results qualify for drafts", () => {
  const cases = [{id:"INC-0417"}, {id:"INC-0512"}];
  assert.deepEqual(buildCaseDrafts(cases, {}), []);
  assert.deepEqual(buildCaseDrafts(cases, {"INC-0417":{attempts:1,bestScore:60,lastCompletedAt:"2026-11-20T10:00:00Z"}}),
    [{id:"INC-0417",score:60,at:"2026-11-20T10:00:00.000Z"}]);
  assert.deepEqual(buildCaseDrafts(cases, {"INC-0512":{attempts:1,bestScore:999,lastCompletedAt:"2026-11-20T10:00:00Z"}}), []);
  assert.deepEqual(buildCaseDrafts(cases, {"UNKNOWN":{attempts:1,bestScore:60,lastCompletedAt:"2026-11-20T10:00:00Z"}}), []);
});
test("names cannot contain control characters or unsafe markup", () => {
  assert(validLearnerName("متدرّب تجريبي"));
  assert(!validLearnerName(" "));
  assert(!validLearnerName("<script>"));
  assert(!validLearnerName("A".repeat(71)));
});
test("printable records disclose no certification, numbers or fake verification", async () => {
  const page = await readFile(new URL("../src/pages/Certificates.jsx", import.meta.url), "utf8");
  assert(page.includes("window.print()"));
  assert(page.includes("لا رقم شهادة · لا رمز QR · لا توقيع رقمي"));
  assert(page.includes("validLearnerName(name)"));
  assert(!page.includes("setDoc(") && !page.includes("addDoc(") && !page.includes("verify?id="));
  assert(DRAFT_NOTICE.includes("غير موثّقة"));
});

test("CyberTrace uses its own forensic gold brand and explicit printable facts", async () => {
  const page = await readFile(new URL("../src/pages/Certificates.jsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../src/pages/Certificates.css", import.meta.url), "utf8");
  assert(page.includes("ct-cert-paper-brand"));
  assert(page.includes("src={logo}"));
  assert(page.includes("ct-cert-facts"));
  assert(page.includes('dir="ltr">{chosen.score} / {chosen.caseCount * 70}'));
  assert(!page.includes("BLACKBOX LAB"));
  assert(css.includes("#d5a56c"));
  assert(css.includes("@media print"));
  assert(css.includes("print-color-adjust:exact"));
});

test("group folios require every investigation in an existing topic category", () => {
  const before = {};
  const records = buildCaseGroupRecords(CASES, before);
  assert.equal(records.length, CATEGORIES.length);
  assert(records.every(group => group.caseCount >= 2 && !group.complete && group.score === null));
  const emailCases = CASES.filter(item => getCaseDetails(item).category === "email");
  assert(emailCases.length >= 2);
  const initial = Object.fromEntries(emailCases.slice(0, -1).map(item =>
    [item.id, { attempts: 1, bestScore: 55, lastCompletedAt: "2026-11-20T10:00:00Z" }]));
  const partial = buildCaseGroupRecords(CASES, initial).find(group => group.id === "email");
  assert.equal(partial.completedCases, emailCases.length - 1);
  assert.equal(partial.complete, false);
  assert.equal(partial.score, null);

  const completed = { ...initial, [emailCases.at(-1).id]: {
    attempts: 1, bestScore: 70, lastCompletedAt: "2026-11-21T10:00:00Z",
  }};
  const awarded = buildCaseGroupRecords(CASES, completed);
  const group = awarded.find(item => item.id === "email");
  assert(group.complete);
  assert.equal(group.completedCases, group.caseCount);
  assert.equal(group.score, 55 * (emailCases.length - 1) + 70);
  assert.equal(group.at, "2026-11-21T10:00:00.000Z");
  assert.equal(awarded.filter(item => item.complete).length, 1, "one completed category cannot award other categories");
  assert.equal(Object.keys(completed).length, emailCases.length, "group computation never changes local results");
});

test("the CyberTrace UI prints only complete topic groups, not individual cases", async () => {
  const page = await readFile(new URL("../src/pages/Certificates.jsx", import.meta.url), "utf8");
  assert(page.includes("buildCaseGroupRecords(cases, getCaseResults())"));
  assert(page.includes("const chosen = selected?.complete ? selected : null"));
  assert(page.includes("chosen.caseCount * 70"));
  assert(page.includes("المجموعة غير مكتملة"));
  assert(page.includes("إفادة إتمام مجموعة تحقيقات"));
  assert(!page.includes("buildCaseDrafts(cases, getCaseResults())"));
});
