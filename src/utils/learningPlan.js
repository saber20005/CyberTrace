import { CATEGORIES, DIFFICULTIES, getCaseDetails } from "../data/caseCatalog.js";

const MAX_SCORE = 70;
const difficultyOrder = new Map(DIFFICULTIES.map((item, index) => [item.id, index]));

function validId(id) {
  return typeof id === "string" && id.trim() === id && id.length > 0 && id.length <= 128 &&
    !["__proto__", "constructor", "prototype"].includes(id);
}

function catalogueFrom(cases) {
  const seen = new Set();
  return (Array.isArray(cases) ? cases : []).filter(item => {
    if (!item || typeof item !== "object" || Array.isArray(item) || !validId(item.id) || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  }).map((caseData, index) => ({ caseData, index, details: getCaseDetails(caseData) }))
    .sort((a, b) => (difficultyOrder.get(a.details.difficulty) ?? 1) - (difficultyOrder.get(b.details.difficulty) ?? 1) || a.index - b.index);
}

function scoreFrom(results, id) {
  if (!results || typeof results !== "object" || Array.isArray(results) || !Object.hasOwn(results, id)) return null;
  const result = results[id];
  if (!result || typeof result !== "object" || Array.isArray(result) || !Object.hasOwn(result, "bestScore")) return null;
  return Number.isInteger(result.bestScore) && result.bestScore >= 0 && result.bestScore <= MAX_SCORE ? result.bestScore : null;
}

function dayIndex(date) {
  const value = date instanceof Date ? date : new Date(date);
  return Number.isFinite(value.getTime()) ? Math.floor(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()) / 86400000) : 0;
}

/** Suggestions describe existing progress; reading this plan never awards XP or changes it. */
export function buildLearningPlan(cases, results = {}, completedIds = [], date = new Date()) {
  const catalogue = catalogueFrom(cases);
  const knownIds = new Set(catalogue.map(item => item.caseData.id));
  const completed = new Set((Array.isArray(completedIds) ? completedIds : []).filter(id => knownIds.has(id)));
  const scores = new Map();
  for (const { caseData } of catalogue) {
    const score = scoreFrom(results, caseData.id);
    if (score !== null) {
      scores.set(caseData.id, score);
      completed.add(caseData.id);
    }
  }

  const recommendations = [];
  const next = catalogue.find(item => !completed.has(item.caseData.id));
  if (next) recommendations.push({
    type: "new", caseData: next.caseData,
    reason: "تحقيق لم تكمله بعد؛ نبدأ بالأيسر بين التحقيقات المتاحة لك.",
  });

  const review = catalogue.filter(item => scores.has(item.caseData.id) && scores.get(item.caseData.id) < MAX_SCORE)
    .sort((a, b) => scores.get(a.caseData.id) - scores.get(b.caseData.id) || a.index - b.index)[0];
  const unscored = catalogue.find(item => completed.has(item.caseData.id) && !scores.has(item.caseData.id));
  if (review) recommendations.push({
    type: "review", caseData: review.caseData, bestScore: scores.get(review.caseData.id),
    reason: `أفضل نتيجتك ${scores.get(review.caseData.id)} من ${MAX_SCORE}، وهي الأقل بين نتائجك القابلة للتحسين. راجع الأدلة وأسباب قرارك.`,
  });
  else if (unscored) recommendations.push({
    type: "record", caseData: unscored.caseData,
    reason: "أكملت هذا التحقيق سابقًا دون نتيجة مسجّلة. أعده لبناء سجل يمكنك مراجعته.",
  });

  const recommendedIds = new Set(recommendations.map(item => item.caseData.id));
  const dailyPool = catalogue.filter(item => !recommendedIds.has(item.caseData.id));
  if (dailyPool.length) {
    const index = ((dayIndex(date) % dailyPool.length) + dailyPool.length) % dailyPool.length;
    recommendations.push({
      type: "daily", caseData: dailyPool[index].caseData,
      reason: "اقتراح من المكتبة يتغيّر كل يوم. يمكنك تنفيذه في الوقت المناسب لك، باحتساب النقاط المعتاد.",
    });
  }

  const skills = CATEGORIES.map(category => {
    const entries = catalogue.filter(item => item.details.category === category.id);
    const scoredCount = entries.filter(item => scores.has(item.caseData.id)).length;
    const completedCount = entries.filter(item => completed.has(item.caseData.id)).length;
    const points = entries.reduce((sum, item) => sum + (scores.get(item.caseData.id) ?? 0), 0);
    const maxPoints = entries.length * MAX_SCORE;
    return {
      ...category, caseCount: entries.length, completedCount, scoredCount,
      unscoredCount: completedCount - scoredCount, points, maxPoints,
      percent: maxPoints ? Math.floor(points * 100 / maxPoints) : 0,
    };
  });

  return {
    recommendations, skills,
    allScoredPerfect: catalogue.length > 0 && catalogue.every(item => scores.get(item.caseData.id) === MAX_SCORE),
  };
}
