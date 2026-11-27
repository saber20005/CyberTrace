import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CASES } from "../src/data/cases.js";
import { getWorkspaceCase } from "../src/data/investigationWorkspace.js";
import { createInvestigationReport } from "../src/utils/investigationReport.js";

const firstCase = CASES.find(item => item.id === "INC-0417");

test("first-case accepted evidence follows the logged MFA and financial-access chain, with IP uncertainty intact", () => {
  const accepted = firstCase.evidenceOptions.filter(item => item.correct);
  assert.equal(accepted.length, 1);
  assert.equal(accepted[0].id, "ip-jump", "existing attempt and grading option IDs remain stable");
  assert.deepEqual(firstCase.evidenceOptions.map(item => item.id), ["ip-jump", "file-size", "mfa-retry"]);
  assert.deepEqual(firstCase.decisions.map(({ id, points }) => ({ id, points })), [
    { id: "lock", points: 40 }, { id: "escalate", points: 20 },
    { id: "monitor", points: 5 }, { id: "ignore", points: 0 },
  ]);

  const denied = firstCase.logLines.flatMap((line, index) => line.includes("mfa_denied") ? [index] : []);
  const success = firstCase.logLines.findIndex(line => line.includes("mfa_success"));
  const download = firstCase.logLines.findIndex(line => line.includes("download") && line.includes("payroll_2026.xlsx"));
  assert.equal(denied.length, 2);
  assert(denied.every(index => index < success));
  assert(success < download);
  assert.match(accepted[0].label, /MFA/);
  assert.match(accepted[0].label, /الرواتب/);
  assert.match(accepted[0].label, /مصدر جديد/);
  assert.match(firstCase.evidenceQuestion, /الاشتباه/);

  const workspace = getWorkspaceCase(firstCase.id);
  assert(workspace.events.some(event => event.source === "vpn"));
  assert.match(workspace.caution, /جغرافيا IP/);
  assert.match(firstCase.evidenceFeedbackCorrect, /جغرافيا IP وحدها لا تثبت/);
  assert.match(firstCase.evidenceFeedbackCorrect, /VPN/);
  assert.match(firstCase.evidenceFeedbackCorrect, /التحقق من المستخدم والجلسة/);

  const report = createInvestigationReport(firstCase, accepted[0].id, "lock", {
    attempts: 1, lastScore: 70, bestScore: 70, lastCompletedAt: "2026-11-26T12:00:00.000Z",
  });
  assert.match(report, /70 \/ 70/);
  assert.match(report, /جغرافيا IP وحدها لا تثبت/);
  assert.match(report, /أبطل الجلسات/);
  assert.doesNotMatch(report, /قفزة الموقع الجغرافي خلال ثوانٍ مستحيلة|يوقف أي نشاط إضافي فورًا/);
});

test("welcome investigation step distinguishes the open-ended Case Zero demo from choice-based library cases", () => {
  const tour = readFileSync(new URL("../src/pages/WelcomeTour.jsx", import.meta.url), "utf8");
  const lead = tour.match(/id:"investigate"[^\n]*lead:"([^"]+)"/)?.[1];
  assert(lead, "the investigation introduction is present");
  assert.match(lead, /محاكاة Case Zero داخل هذه الجولة/);
  assert.match(lead, /اكتب استنتاجك بحرية/);
  assert.match(lead, /التحقيقات الفعلية في المكتبة/);
  assert.match(lead, /خيارات/);
  assert.doesNotMatch(lead, /لا توجد أسئلة اختيار/);
});
