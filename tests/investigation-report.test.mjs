import assert from "node:assert/strict";
import { test } from "node:test";
import { CASES } from "../src/data/cases.js";
import { createInvestigationReport, getInvestigationReview } from "../src/utils/investigationReport.js";

const caseData = CASES[0];
const correctEvidence = caseData.evidenceOptions.find(item => item.correct);
const wrongEvidence = caseData.evidenceOptions.find(item => !item.correct);
const goodDecision = caseData.decisions.find(item => item.points === 40);
const poorDecision = caseData.decisions.find(item => item.points === 0);
const completedAt = "2026-11-12T10:05:30.123Z";
const result = (score, bestScore = score) => ({ lastScore: score, bestScore, attempts: 2, lastCompletedAt: completedAt });

test("review and report describe only the selected completed attempt and its score breakdown", () => {
  const info = result(70);
  const before = JSON.stringify({ caseData, info });
  const review = getInvestigationReview(caseData, correctEvidence.id, goodDecision.id, info);
  assert.equal(review.evidence.points, 30);
  assert.equal(review.decision.points, 40);
  assert.equal(review.totalScore, 70);
  assert.equal(review.bestScore, 70);
  assert.equal(review.completedAt, completedAt);
  const report = createInvestigationReport(caseData, correctEvidence.id, goodDecision.id, info);
  for (const expected of [caseData.id, review.title, review.categoryLabel, review.difficultyLabel, correctEvidence.label, caseData.evidenceFeedbackCorrect, goodDecision.label, goodDecision.outcome, completedAt, "30 / 30", "40 / 40", "70 / 70", "https://blackboxlab.dev/"]) assert.ok(report.includes(expected), expected);
  assert.equal(report.includes(wrongEvidence.label), false);
  assert.equal(report.includes(poorDecision.label), false);
  assert.equal(report.includes(caseData.meta), false);
  assert.equal(report.includes(caseData.logLines[0]), false);
  assert.equal(JSON.stringify({ caseData, info }), before);
});

test("partial performance preserves the current score and best score with targeted review steps", () => {
  const info = result(10, 70);
  const review = getInvestigationReview(caseData, wrongEvidence.id, poorDecision.id, info);
  assert.equal(review.evidence.points, 10);
  assert.equal(review.decision.points, 0);
  assert.equal(review.evidence.feedback, caseData.evidenceFeedbackIncorrect);
  assert.equal(review.nextSteps.length, 2);
  const report = createInvestigationReport(caseData, wrongEvidence.id, poorDecision.id, info);
  assert.ok(report.includes("نتيجة هذه المحاولة: 10 / 70"));
  assert.ok(report.includes("أفضل نتيجة مسجّلة لهذه القضية: 70 / 70"));
  assert.ok(report.includes("محاكاة تعليمية"));
  assert.ok(report.includes("بيانات هذا المتصفح أو الجلسة"));
});

test("missing selections, foreign choice ids, and incomplete records cannot create fictitious reports", () => {
  for (const [evidenceId, decisionId, info] of [
    [null, goodDecision.id, result(70)],
    [correctEvidence.id, undefined, result(70)],
    ["not-in-this-case", goodDecision.id, result(70)],
    [correctEvidence.id, "not-in-this-case", result(70)],
    [correctEvidence.id, goodDecision.id, null],
    [correctEvidence.id, goodDecision.id, result(10)],
    [correctEvidence.id, goodDecision.id, { ...result(70), bestScore: 40 }],
    [correctEvidence.id, goodDecision.id, { ...result(70), attempts: 0 }],
    [correctEvidence.id, goodDecision.id, { ...result(70), lastCompletedAt: "2026-02-30T10:05:30.123Z" }],
    [correctEvidence.id, goodDecision.id, { ...result(70), lastCompletedAt: null }],
  ]) assert.equal(createInvestigationReport(caseData, evidenceId, decisionId, info), null);
  assert.equal(createInvestigationReport(null, correctEvidence.id, goodDecision.id, result(70)), null);
});

test("report completion time stays fixed when downloaded later or more than once", () => {
  const info = result(70);
  const first = createInvestigationReport(caseData, correctEvidence.id, goodDecision.id, info);
  const second = createInvestigationReport(caseData, correctEvidence.id, goodDecision.id, info);
  assert.equal(first, second);
  assert.ok(first.includes(completedAt));
});

test("every catalogue case can produce an accurate completed review and appropriate practice link", () => {
  for (const entry of CASES) {
    const evidence = entry.evidenceOptions.find(item => item.correct);
    const decision = entry.decisions.find(item => item.points === 40);
    const review = getInvestigationReview(entry, evidence.id, decision.id, result(70));
    assert.equal(review.totalScore, 70, entry.id);
    assert.equal(review.nextSteps.length, 1, entry.id);
    const url = new URL(review.practice.url);
    assert.equal(url.origin, "https://blackboxlab.dev");
    if (["INC-1101", "INC-0701"].includes(entry.id)) assert.equal(url.searchParams.get("track"), "webgoat");
    if (["INC-1104", "INC-0944"].includes(entry.id)) assert.equal(url.searchParams.get("track"), "network");
  }
});

test("malformed and duplicated selected options do not generate ambiguous results", () => {
  for (const malformed of [
    { ...caseData, evidenceOptions: null },
    { ...caseData, decisions: [] },
    { ...caseData, evidenceOptions: [...caseData.evidenceOptions, correctEvidence] },
    { ...caseData, decisions: caseData.decisions.map(item => item.id === goodDecision.id ? { ...item, points: 200 } : item) },
  ]) assert.equal(getInvestigationReview(malformed, correctEvidence.id, goodDecision.id, result(70)), null);
});
