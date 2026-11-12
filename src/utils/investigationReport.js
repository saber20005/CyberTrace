import { getCaseDetails } from "../data/caseCatalog.js";
import { getBlackBoxLearningLink } from "./routes.js";

function nonemptyText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

// Resolve choices from the case itself. A report represents an actual completed
// attempt, so missing choices, invented scores, or a missing completion date do
// not produce a downloadable result.
export function getInvestigationReview(caseData, evidenceId, decisionId, resultInfo) {
  if (!nonemptyText(caseData?.id) || !Array.isArray(caseData.evidenceOptions) ||
    !Array.isArray(caseData.decisions) || !resultInfo) return null;
  const evidenceMatches = caseData.evidenceOptions.filter(item => item?.id === evidenceId);
  const decisionMatches = caseData.decisions.filter(item => item?.id === decisionId);
  if (evidenceMatches.length !== 1 || decisionMatches.length !== 1) return null;
  const evidence = evidenceMatches[0];
  const decision = decisionMatches[0];
  if (typeof evidence.correct !== "boolean" || !nonemptyText(evidence.label) ||
    !Number.isInteger(decision.points) || decision.points < 0 || decision.points > 40 ||
    !nonemptyText(decision.label) || !nonemptyText(decision.outcome)) return null;
  const evidenceFeedback = evidence.correct ? caseData.evidenceFeedbackCorrect : caseData.evidenceFeedbackIncorrect;
  if (!nonemptyText(evidenceFeedback)) return null;
  const evidencePoints = evidence.correct ? 30 : 10;
  const totalScore = evidencePoints + decision.points;
  const { lastScore, bestScore, attempts, lastCompletedAt } = resultInfo;
  if (lastScore !== totalScore || !Number.isInteger(bestScore) || bestScore < totalScore || bestScore > 70 ||
    !Number.isSafeInteger(attempts) || attempts < 1 || typeof lastCompletedAt !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(lastCompletedAt) ||
    !Number.isFinite(Date.parse(lastCompletedAt)) || new Date(lastCompletedAt).toISOString() !== lastCompletedAt) return null;

  const nextSteps = [];
  if (!evidence.correct) nextSteps.push("عُد إلى السجلات وحدّد السطر الذي يدعم المؤشر الأقوى، ثم قارن به الدليل الذي اخترته.");
  if (decision.points < 40) nextSteps.push("راجع أثر قرارك على استمرار الحادثة، وحدّد ما يحتاج إلى احتواء أو تحقق أسرع قبل إعادة المحاولة.");
  if (nextSteps.length === 0) nextSteps.push("اشرح سبب استبعاد مؤشر بديل، ثم واصل التدريب العملي المرتبط بهذه المهارة في مختبرك المحلي.");

  return {
    caseId: caseData.id,
    ...getCaseDetails(caseData),
    completedAt: lastCompletedAt,
    evidence: { label: evidence.label, correct: evidence.correct, feedback: evidenceFeedback, points: evidencePoints },
    decision: { label: decision.label, outcome: decision.outcome, points: decision.points },
    totalScore,
    bestScore,
    attempts,
    nextSteps,
    practice: getBlackBoxLearningLink(caseData.id),
  };
}

export function createInvestigationReport(caseData, evidenceId, decisionId, resultInfo) {
  const review = getInvestigationReview(caseData, evidenceId, decisionId, resultInfo);
  if (!review) return null;
  const lines = [
    "# مراجعة المحلّل — CyberTrace", "",
    `القضية: ${review.caseId} — ${review.title}`,
    `المجال: ${review.categoryLabel}`,
    `المستوى: ${review.difficultyLabel}`,
    `وقت إكمال المحاولة (UTC): ${review.completedAt}`, "",
    "## ملخص النتيجة", "",
    `- نتيجة هذه المحاولة: ${review.totalScore} / 70 XP`,
    `- تحليل الدليل: ${review.evidence.points} / 30`,
    `- قرار الاستجابة: ${review.decision.points} / 40`,
    `- أفضل نتيجة مسجّلة لهذه القضية: ${review.bestScore} / 70`,
    `- عدد المحاولات المسجّلة: ${review.attempts}`, "",
    "## الدليل الذي اخترته", "", review.evidence.label, "",
    `التقييم: ${review.evidence.correct ? "الدليل الأقوى في هذا السيناريو" : "يحتاج إلى مراجعة"}`,
    review.evidence.feedback, "",
    "## القرار الذي اتخذته", "", review.decision.label, "", review.decision.outcome, "",
    "## خطوتك التالية", "", ...review.nextSteps.map(step => `- ${step}`), "",
    `التدريب العملي في BlackBox Lab: ${review.practice.url}`, "",
    "هذا التقرير يصف محاولة ضمن محاكاة تعليمية، ولا يمثّل تقرير حادثة حقيقية أو شهادة كفاءة.",
    "سجل المحاولة وأفضل نتيجة مأخوذان من بيانات هذا المتصفح أو الجلسة؛ لا يتضمن التقرير بيانات حسابك.",
    "تُنفّذ التدريبات العملية في مختبرك المحلي، ويُنظّم BlackBox خطواتها وتوثيقها.", "",
  ];
  return lines.join("\n");
}
