import { doc, onSnapshot, runTransaction } from "firebase/firestore";
import { db, auth } from "../firebase.js";
import { getCaseResults, getCompletedCaseIds } from "./caseProgress.js";
import { getXP } from "./xp.js";
import { progressKey } from "./progressScope.js";

const KEY = "cybertrace_cloud_sync_opt_in";
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
function localSnapshot() { return { results: getCaseResults(), completed: getCompletedCaseIds(), xp: getXP() }; }
function storeLocal(data) {
  const current = localSnapshot();
  const merged = mergeCloudProgress(current, data);
  try {
    localStorage.setItem(progressKey("cybertrace_case_results"), JSON.stringify(merged.results));
    localStorage.setItem(progressKey("cybertrace_completed_cases"), JSON.stringify(merged.completed));
    localStorage.setItem(progressKey("cybertrace_xp"), String(merged.xp));
    window.dispatchEvent(new Event("cybertrace-progress-synced"));
  } catch { throw new Error("تعذّر حفظ النسخة السحابية محليًا؛ لم تُحذف بياناتك."); }
}
export function cloudSyncEnabled(uid) {
  try { return localStorage.getItem(KEY + ":" + encodeURIComponent(uid)) === "yes"; } catch { return false; }
}
export function enableCloudSync(uid) {
  if (!auth.currentUser || auth.currentUser.uid !== uid) throw new Error("تغيّر الحساب.");
  localStorage.setItem(KEY + ":" + encodeURIComponent(uid), "yes");
}
export function startCloudSync(uid, onStatus) {
  if (!uid || !cloudSyncEnabled(uid)) return () => {};
  const owner = () => auth.currentUser?.uid === uid;
  const ref = doc(db, "cybertraceUsers", uid, "state", "progress");
  let active = true, remoteReady = false, busy = false, queued = false;
  const publish = async () => {
    if (!active || !owner() || !remoteReady) return;
    if (busy) { queued = true; return; }
    busy = true;
    try {
      await runTransaction(db, async tx => {
        if (!owner()) throw new Error("تغيّر الحساب أثناء المزامنة.");
        const snap = await tx.get(ref);
        const merged = mergeCloudProgress(snap.exists() ? snap.data() : {}, localSnapshot());
        if (!snap.exists() || JSON.stringify(mergeCloudProgress(snap.data(), {})) !== JSON.stringify(merged)) tx.set(ref, merged);
      });
      if (active && owner()) onStatus("تم حفظ التقدم في حساب CyberTrace.");
    } catch (error) { if (active) onStatus("فشلت المزامنة: " + error.message); }
    finally { busy = false; if (queued) { queued = false; void publish(); } }
  };
  const changed = () => { if (remoteReady) void publish(); };
  window.addEventListener("cybertrace-progress-changed", changed);
  const unsubscribe = onSnapshot(ref, { includeMetadataChanges: false }, snap => {
    if (!active || !owner()) return;
    try {
      if (snap.exists()) storeLocal(snap.data());
      remoteReady = true;
      onStatus("المزامنة السحابية مفعّلة لهذا الحساب.");
      void publish();
    } catch (error) { onStatus(error.message); }
  }, error => { if (active) onStatus("تعذّر قراءة التقدم السحابي: " + error.message); });
  return () => { active = false; unsubscribe(); window.removeEventListener("cybertrace-progress-changed", changed); };
}
