const SEEN_KEY = "cybertrace_seen_cases";
const COMPLETED_KEY = "cybertrace_completed_cases";
const RESULTS_KEY = "cybertrace_case_results";

// Keep progress usable during this session when browser storage is unavailable.
const memory = new Map();
const pendingWrites = new Set();

function readJSON(key, fallback) {
  let raw;
  if (pendingWrites.has(key)) {
    raw = memory.get(key);
  } else {
    try {
      raw = localStorage.getItem(key);
      if (raw === null) memory.delete(key);
      else memory.set(key, raw);
    } catch {
      raw = memory.get(key);
    }
  }

  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  const raw = JSON.stringify(value);
  memory.set(key, raw);
  try {
    localStorage.setItem(key, raw);
    pendingWrites.delete(key);
  } catch {
    pendingWrites.add(key);
  }
}

function validId(id) {
  return typeof id === "string" && id.trim() === id && id.length > 0 &&
    id.length <= 128 && !["__proto__", "constructor", "prototype"].includes(id);
}

function idsFrom(value) {
  return Array.isArray(value) ? [...new Set(value.filter(validId))] : [];
}

function getSeenIds() {
  return idsFrom(readJSON(SEEN_KEY, []));
}

// Historical completions survive rotation resets. Legacy completions retain
// their status without assigning a score or attempt count that was never saved.
export function getCompletedCaseIds() {
  return [...new Set([
    ...idsFrom(readJSON(COMPLETED_KEY, [])),
    ...getSeenIds(),
    ...Object.keys(getCaseResults()),
  ])];
}

export function getCaseResults() {
  const stored = readJSON(RESULTS_KEY, {});
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) return {};

  const entries = Object.entries(stored).flatMap(([id, result]) => {
    if (!validId(id) || !result || typeof result !== "object" || Array.isArray(result)) return [];
    const { attempts, lastScore, bestScore, lastCompletedAt } = result;
    if (!Number.isSafeInteger(attempts) || attempts < 1 ||
      !Number.isFinite(lastScore) || lastScore < 0 || lastScore > 70 ||
      !Number.isFinite(bestScore) || bestScore < 0 || bestScore > 70 ||
      typeof lastCompletedAt !== "string" || !Number.isFinite(Date.parse(lastCompletedAt))) return [];

    return [[id, {
      attempts,
      lastScore,
      bestScore: Math.max(bestScore, lastScore),
      lastCompletedAt: new Date(lastCompletedAt).toISOString(),
    }]];
  });
  return Object.fromEntries(entries);
}

export function markCaseSeen(id) {
  if (!validId(id)) return;
  const completed = getCompletedCaseIds();
  writeJSON(SEEN_KEY, [...new Set([...getSeenIds(), id])]);
  writeJSON(COMPLETED_KEY, [...new Set([...completed, id])]);
}

// Called once by the explicit completion handler, never by a render/effect.
export function recordCaseResult(id, score) {
  if (!validId(id) || typeof score !== "number" || !Number.isFinite(score)) return null;
  const results = getCaseResults();
  const previous = results[id];
  const normalizedScore = Math.min(70, Math.max(0, Math.round(score)));
  const result = {
    attempts: Math.min(Number.MAX_SAFE_INTEGER, (previous?.attempts ?? 0) + 1),
    lastScore: normalizedScore,
    bestScore: Math.max(previous?.bestScore ?? 0, normalizedScore),
    lastCompletedAt: new Date().toISOString(),
  };
  writeJSON(RESULTS_KEY, { ...results, [id]: result });
  markCaseSeen(id);
  return result;
}

// Prefer unfinished cases in the current rotation; a completed rotation starts
// again without clearing historical completion status or detailed results.
export function pickRandomCase(cases) {
  const available = Array.isArray(cases)
    ? cases.filter((item) => item && validId(item.id))
    : [];
  if (available.length === 0) return null;

  const seen = getSeenIds();
  let pool = available.filter((item) => !seen.includes(item.id));
  if (pool.length === 0) {
    writeJSON(COMPLETED_KEY, getCompletedCaseIds());
    writeJSON(SEEN_KEY, []);
    pool = available;
  }
  return pool[Math.min(pool.length - 1, Math.floor(Math.random() * pool.length))];
}
