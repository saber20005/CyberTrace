import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildCaseDrafts, validLearnerName, DRAFT_NOTICE } from "../src/utils/certificateDrafts.js";

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
  assert(!/setDoc\\(|addDoc\\(|verify\\?id=/.test(page));
  assert(DRAFT_NOTICE.includes("غير موثّقة"));
});
