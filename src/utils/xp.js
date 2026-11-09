const STORAGE_KEY = "cybertrace_xp";
let sessionXP = 0;
let pendingWrite = false;

// Career-ladder levels for a security analyst. Adjust thresholds as more
// investigations get added — these assume ~30-70 XP per case.
export const LEVELS = [
  { level: 1, title: "متدرب أمني", minXP: 0 },
  { level: 2, title: "محلل مبتدئ", minXP: 500 },
  { level: 3, title: "محلل أمن سيبراني", minXP: 1000 },
  { level: 4, title: "محلل أول", minXP: 1500 },
  { level: 5, title: "خبير استجابة للحوادث", minXP: 2000 },
  { level: 6, title: "صائد التهديدات", minXP: 2500 },
];

export function getXP() {
  if (pendingWrite) return sessionXP;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const value = raw === null ? 0 : Number(raw);
    sessionXP = Number.isSafeInteger(value) && value >= 0 ? value : 0;
    return sessionXP;
  } catch {
    // Keep the current session usable when browser storage is unavailable.
    return sessionXP;
  }
}

function setXP(value) {
  sessionXP = value;
  try {
    localStorage.setItem(STORAGE_KEY, String(value));
    pendingWrite = false;
  } catch {
    pendingWrite = true;
  }
}

export function getLevelInfo(xp) {
  let current = LEVELS[0];
  let next = LEVELS[1] || null;

  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].minXP) {
      current = LEVELS[i];
      next = LEVELS[i + 1] || null;
    }
  }

  const floor = current.minXP;
  const ceiling = next ? next.minXP : floor;
  const span = ceiling - floor || 1;
  const progress = next
    ? Math.min(100, Math.max(0, Math.round(((xp - floor) / span) * 100)))
    : 100;

  return {
    level: current.level,
    title: current.title,
    xp,
    next,
    progress,
    xpForNext: next ? ceiling - xp : 0,
  };
}

// Adds XP, persists it, and reports whether the user crossed a level threshold.
export function addXP(amount) {
  const previousXP = getXP();
  const points = Number.isFinite(amount) ? Math.max(0, Math.round(amount)) : 0;
  const newXP = Math.min(Number.MAX_SAFE_INTEGER, previousXP + points);
  setXP(newXP);

  const previousLevel = getLevelInfo(previousXP);
  const newLevel = getLevelInfo(newXP);

  return {
    previousXP,
    newXP,
    previousLevel,
    newLevel,
    leveledUp: newLevel.level > previousLevel.level,
  };
}
