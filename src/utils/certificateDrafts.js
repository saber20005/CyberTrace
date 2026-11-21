import { CATEGORIES, getCaseDetails } from "../data/caseCatalog.js";
// Read-only record of client-declared training progress; never an official certificate.
export const DRAFT_NOTICE = "إفادة إتمام تدريب غير موثّقة. تعتمد على بيانات تدريب من المتصفح ولا تمثل تقييمًا خادميًا أو اعتمادًا مهنيًا.";
export function buildCaseDrafts(cases, results) {
  if (!Array.isArray(cases) || !results || typeof results !== "object" || Array.isArray(results)) return [];
  const seen = new Set();
  return cases.flatMap(item => {
    if (!item || typeof item.id !== "string" || seen.has(item.id)) return [];
    seen.add(item.id);
    const result = Object.hasOwn(results, item.id) ? results[item.id] : null;
    if (!result || !Number.isSafeInteger(result.attempts) || result.attempts < 1 ||
      !Number.isInteger(result.bestScore) || result.bestScore < 0 || result.bestScore > 70 ||
      typeof result.lastCompletedAt !== "string" || !Number.isFinite(Date.parse(result.lastCompletedAt))) return [];
    return [{ id: item.id, score: result.bestScore, at: new Date(result.lastCompletedAt).toISOString() }];
  });
}
// Group-level self-reported training records. Categories are the existing
// investigation-library taxonomy, not invented award criteria.
export function buildCaseGroupRecords(cases, results) {
  if (!Array.isArray(cases)) return [];
  const unique = new Map();
  for (const item of cases) {
    if (item && typeof item.id === "string" && !unique.has(item.id)) unique.set(item.id, item);
  }
  const all = [...unique.values()];
  const completed = new Map(buildCaseDrafts(all, results).map(item => [item.id, item]));
  return CATEGORIES.flatMap(category => {
    const members = all.filter(item => getCaseDetails(item).category === category.id);
    if (!members.length) return [];
    const records = members.map(item => completed.get(item.id)).filter(Boolean);
    const complete = records.length === members.length;
    return [{
      id: category.id, title: category.label,
      caseCount: members.length, completedCases: records.length, complete,
      score: complete ? records.reduce((sum, record) => sum + record.score, 0) : null,
      at: complete ? new Date(Math.max(...records.map(record => Date.parse(record.at)))).toISOString() : null,
    }];
  });
}

export function validLearnerName(name) {
  return typeof name === "string" && name.trim().length >= 2 && name.trim().length <= 70 &&
    [...name].every(character => { const point = character.codePointAt(0); return point >= 32 && point !== 127 && character !== '<' && character !== '>'; });
}
