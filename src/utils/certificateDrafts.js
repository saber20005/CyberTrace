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
export function validLearnerName(name) {
  return typeof name === "string" && name.trim().length >= 2 && name.trim().length <= 70 &&
    [...name].every(character => { const point = character.codePointAt(0); return point >= 32 && point !== 127 && character !== '<' && character !== '>'; });
}
