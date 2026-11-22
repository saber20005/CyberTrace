// Pure, deterministic progress normalization used by the cloud-sync boundary.
// These browser-saved results are NEVER evidence of server-graded achievement.
const safeId = id => /^INC-[0-9]{4}$/.test(id);
const validResult = r => r && Number.isSafeInteger(r.attempts) && r.attempts > 0 &&
  Number.isInteger(r.lastScore) && r.lastScore >= 0 && r.lastScore <= 70 &&
  Number.isInteger(r.bestScore) && r.bestScore >= 0 && r.bestScore <= 70 &&
  typeof r.lastCompletedAt === "string" && Number.isFinite(Date.parse(r.lastCompletedAt));
const cleanResults = input => Object.fromEntries(Object.entries(input && typeof input === "object" && !Array.isArray(input) ? input : {})
  .filter(([id, r]) => safeId(id) && validResult(r))
  .map(([id, r]) => [id, { attempts: r.attempts, lastScore: r.lastScore, bestScore: Math.max(r.bestScore, r.lastScore), lastCompletedAt: new Date(r.lastCompletedAt).toISOString() }]));
const cleanIds = ids => Array.isArray(ids) ? [...new Set(ids.filter(safeId))].slice(0, 100) : [];

export function mergeCloudProgress(a, b) {
  const left = cleanResults(a?.results), right = cleanResults(b?.results);
  const results = { ...left };
  for (const [id, r] of Object.entries(right)) {
    const previous = results[id];
    if (!previous) { results[id] = r; continue; }
    const newer = Date.parse(r.lastCompletedAt) >= Date.parse(previous.lastCompletedAt) ? r : previous;
    results[id] = { ...newer, attempts: Math.max(previous.attempts, r.attempts), bestScore: Math.max(previous.bestScore, r.bestScore) };
  }
  const xp = Math.max(...[a?.xp, b?.xp, 0].filter(n => Number.isSafeInteger(n) && n >= 0));
  return { schemaVersion: 1, results, completed: cleanIds([...(cleanIds(a?.completed)), ...(cleanIds(b?.completed)), ...Object.keys(results)]), xp };
}

// Compare normalized data semantically: Firestore key ordering and completion
// array ordering must not trigger extra read transactions or redundant writes.
export function sameCloudProgress(a, b) {
  if (!a || !b || a.xp !== b.xp || a.schemaVersion !== b.schemaVersion) return false;
  const ca = [...(a.completed ?? [])].sort(), cb = [...(b.completed ?? [])].sort();
  if (ca.length !== cb.length || ca.some((id, i) => id !== cb[i])) return false;
  const ar = a.results ?? {}, br = b.results ?? {};
  const ak = Object.keys(ar).sort(), bk = Object.keys(br).sort();
  if (ak.length !== bk.length || ak.some((id, i) => id !== bk[i])) return false;
  return ak.every(id => ['attempts', 'lastScore', 'bestScore', 'lastCompletedAt']
    .every(field => ar[id]?.[field] === br[id]?.[field]));
}

// A missing doc still receives the initial opt-in snapshot, consistent with
// the old sync behavior. Otherwise only new, owner-scoped progress is uploaded.
export function needsCloudWrite(remoteExists, remote, local) {
  if (!remoteExists) return true;
  const before = mergeCloudProgress(remote, {});
  const after = mergeCloudProgress(remote, local);
  return !sameCloudProgress(before, after);
}
