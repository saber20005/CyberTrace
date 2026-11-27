// Read-only projection of the existing BLACKBOX owner progress document.
// Notes, results, device state and activity logs never enter bridge state.
export const PRACTICAL_TRACK_IDS = Object.freeze(['recon', 'nmap', 'network', 'webgoat', 'proxy', 'metasploit', 'logs', 'integrity', 'headers', 'email']);
const stageKeys = new Set(PRACTICAL_TRACK_IDS.flatMap(id => [0, 1, 2].map(index => `${id}-${index}`)));
const plainMap = value => value !== null && typeof value === 'object' && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const timestamp = value => {
  if (typeof value !== 'string' || value.length > 40 || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return false;
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  const calendar = new Date(0); calendar.setUTCFullYear(year, month - 1, day);
  return calendar.getUTCFullYear() === year && calendar.getUTCMonth() === month - 1 && calendar.getUTCDate() === day && Number.isFinite(Date.parse(value));
};
export function normalizePracticalCompleted(value) {
  if (!plainMap(value) || Object.keys(value).length > stageKeys.size) return null;
  const result = {};
  for (const [key, at] of Object.entries(value)) {
    if (!stageKeys.has(key) || !timestamp(at)) return null;
    result[key] = at;
  }
  return result;
}
export function projectPracticalDocument(value) {
  if (!plainMap(value) || value.schemaVersion !== 1 || !Number.isSafeInteger(value.revision) || value.revision < 1 || value.revision > 2147483647 || !plainMap(value.progress)) return null;
  const completed = normalizePracticalCompleted(value.progress.completed);
  return completed === null ? null : { completed };
}
export function emptyPracticalProgress() {
  return { ownerUid: null, phase: 'idle', fromCache: false, completed: {}, error: null };
}
