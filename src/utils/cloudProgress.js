import { doc, getDocFromServer, onSnapshot, runTransaction } from "firebase/firestore";
import { db, auth } from "../firebase.js";
import { getCaseResults, getCompletedCaseIds } from "./caseProgress.js";
import { getXP } from "./xp.js";
import { progressKey } from "./progressScope.js";
import { mergeCloudProgress, needsCloudWrite } from "./cloudProgressModel.js";
export { mergeCloudProgress } from "./cloudProgressModel.js";

const KEY = "cybertrace_cloud_sync_opt_in";
function localSnapshot() { return { results: getCaseResults(), completed: getCompletedCaseIds(), xp: getXP() }; }
function storeLocal(data) {
  const current = localSnapshot();
  const merged = mergeCloudProgress(current, data);
  const values = [
    ["cybertrace_case_results", JSON.stringify(merged.results)],
    ["cybertrace_completed_cases", JSON.stringify(merged.completed)],
    ["cybertrace_xp", String(merged.xp)],
  ];
  try {
    // Check actual persisted bytes, not only in-memory progress: failed local
    // writes must still be retried and never silently treated as saved.
    if (values.every(([name, value]) => localStorage.getItem(progressKey(name)) === value)) return false;
    for (const [name, value] of values) localStorage.setItem(progressKey(name), value);
    window.dispatchEvent(new Event("cybertrace-progress-synced"));
    return true;
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
    if (!active || !owner() || !remoteReady) return false;
    if (busy) { queued = true; onStatus("توجد مزامنة جارية؛ سيُعاد فحص تقدمك بعدها."); return false; }
    busy = true;
    try {
      await runTransaction(db, async tx => {
        if (!active || !owner()) throw new Error("تغيّر الحساب أثناء المزامنة.");
        const snap = await tx.get(ref);
        const latestLocal = localSnapshot();
        const remote = snap.exists() ? snap.data() : null;
        const merged = mergeCloudProgress(remote ?? {}, latestLocal);
        if (needsCloudWrite(snap.exists(), remote, latestLocal)) tx.set(ref, merged);
      });
      if (active && owner()) onStatus("تم التحقق من تقدم CyberTrace وحفظه في حسابك.", { verified: true });
      return active && owner();
    } catch (error) {
      if (active && owner()) onStatus("فشلت مزامنة CyberTrace: " + (error.code || error.message), { failed: true });
      return false;
    } finally {
      busy = false;
      if (queued) { queued = false; void publish(); }
    }
  };
  const syncNow = async () => {
    if (!active || !owner()) { onStatus("تغيّر حساب CyberTrace؛ سجّل الدخول ثم حاول مجددًا.", { failed: true }); return false; }
    onStatus("جارٍ فحص التقدم السحابي من الخادم...");
    try {
      // A manual retry must reach the server rather than silently using an offline cache.
      const snap = await getDocFromServer(ref);
      if (!active || !owner()) return false;
      if (snap.exists()) storeLocal(snap.data());
      remoteReady = true;
      // The explicit retry already performed an authoritative server read;
      // don't immediately buy another transaction read when nothing changed.
      if (snap.exists() && !needsCloudWrite(true, snap.data(), localSnapshot())) {
        onStatus("تقدّم CyberTrace محفوظ ومحدّث بالفعل على الخادم.", { verified: true });
        return true;
      }
      return await publish();
    } catch (error) {
      if (active && owner()) onStatus("تعذّر الاتصال بمزامنة CyberTrace: " + (error.code || error.message), { failed: true });
      return false;
    }
  };
  const changed = () => { if (remoteReady) void publish(); };
  window.addEventListener("cybertrace-progress-changed", changed);
  const unsubscribe = onSnapshot(ref, { includeMetadataChanges: true }, snap => {
    if (!active || !owner()) return;
    try {
      if (snap.exists()) storeLocal(snap.data());
      remoteReady = !snap.metadata.fromCache;
      onStatus(remoteReady ? "الاتصال السحابي جاهز؛ يمكنك مزامنة تقدمك الآن." : "تظهر نسخة محلية مؤقتًا؛ بانتظار تأكيد الاتصال بالخادم.", remoteReady ? {} : { failed: true });
      // Firestore can send metadata-only and local-echo snapshots. Do not
      // trigger a transaction when the server already holds the merged data.
      if (remoteReady && !snap.metadata.hasPendingWrites) {
        if (needsCloudWrite(snap.exists(), snap.exists() ? snap.data() : null, localSnapshot())) void publish();
        else if (snap.exists()) onStatus("تقدّم CyberTrace محفوظ ومحدّث بالفعل على الخادم.", { verified: true });
      }
    } catch (error) { onStatus(error.message, { failed: true }); }
  }, error => { if (active && owner()) onStatus("تعذّر قراءة تقدم CyberTrace: " + (error.code || error.message), { failed: true }); });
  const stop = () => {
    active = false;
    unsubscribe();
    window.removeEventListener("cybertrace-progress-changed", changed);
  };
  stop.syncNow = syncNow;
  return stop;
}
