let owner = null;
let ready = false;
export function setProgressOwner(uid) { if (uid !== null && (typeof uid !== "string" || !uid.trim())) throw Error("Invalid owner"); owner = uid; ready = true; }
export function progressReady() { return ready; }
export function progressKey(base) { return !ready ? base : base + ":v2:" + (owner === null ? "guest" : encodeURIComponent(owner)); }
export function legacyProgressAvailable() { try { return ["cybertrace_case_results","cybertrace_completed_cases","cybertrace_seen_cases","cybertrace_xp"].some(key => localStorage.getItem(key) !== null); } catch { return false; } }
export function importLegacyProgress() {
  if (!ready || owner === null) return false;
  const keys = ["cybertrace_case_results","cybertrace_completed_cases","cybertrace_seen_cases","cybertrace_xp"];
  try {
    const rows = keys.map(key => [key, localStorage.getItem(key), progressKey(key)]);
    if (rows.some(([, , scoped]) => localStorage.getItem(scoped) !== null)) return false;
    for (const [, value, scoped] of rows) if (value !== null) localStorage.setItem(scoped, value);
    return true;
  } catch { return false; }
}
