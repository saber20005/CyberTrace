const STORAGE_KEY = "cybertrace_seen_cases";

function getSeenIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setSeenIds(ids) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // non-fatal — progress just won't persist across sessions
  }
}

// Marks a case as completed so it won't be picked again until the full
// rotation has been seen.
export function markCaseSeen(id) {
  const seen = getSeenIds();
  if (!seen.includes(id)) {
    setSeenIds([...seen, id]);
  }
}

// Picks a random case the user hasn't completed yet. Once every case in the
// list has been seen, the rotation resets and starts over.
export function pickRandomCase(cases) {
  const seen = getSeenIds();
  let pool = cases.filter((c) => !seen.includes(c.id));

  if (pool.length === 0) {
    setSeenIds([]);
    pool = cases;
  }

  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}