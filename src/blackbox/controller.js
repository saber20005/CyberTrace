import { blackBoxConfig } from "./config.js";
import { createBlackBoxBackend } from "./backend.js";
import { CASE_IDS, MAX_CASE_SCORE, normalizeReceipt } from "../data/linkedSkills.js";

const knownCases = new Set(CASE_IDS);
const prefix = uid => `cybertrace-blackbox-pending-v1:${encodeURIComponent(uid)}:`;
const queueKey = (uid, caseId, bestScore) => `${prefix(uid)}${caseId}:${bestScore}`;
const clone = value => JSON.parse(JSON.stringify(value));
const problem = (code, message) => Object.assign(new Error(message), { code });
const validScore = value => Number.isInteger(value) && value >= 0 && value <= MAX_CASE_SCORE;
const validResult = (caseId, score) => knownCases.has(caseId) && validScore(score);

/** Optional BlackBox connection. Legacy CyberTrace accounts and guest XP stay separate. */
export function createBlackBoxBridge(options = {}) {
  const config = options.config ?? blackBoxConfig;
  const enabled = config.enabled === true;
  let storage;
  try { storage = options.storage ?? globalThis.localStorage; } catch { storage = undefined; }
  const memory = new Map();
  const undurable = new Set();
  let backend, initializing, started = false, disposed = false, generation = 0;
  let authStop, receiptStop, receiptGeneration = 0, user = null, receipts = {}, phase = enabled ? "loading" : "disabled";
  let syncing = false, error = null, errorSource = null, message = enabled ? "جارٍ إعداد الربط مع BlackBox…" : "ربط التقدم مع BlackBox قيد الإعداد. يمكنك مواصلة التدريب.";
  let syncTask, acceptingUsers = true, authEpoch = 0, authInFlight;

  function entriesFor(uid) {
    const entries = new Map();
    try {
      for (let index = 0; index < (storage?.length ?? 0); index += 1) {
        const key = storage.key(index);
        if (key?.startsWith(prefix(uid))) entries.set(key, storage.getItem(key));
      }
    } catch { /* In-memory pending results remain available in this tab. */ }
    for (const [key, raw] of memory) if (key.startsWith(prefix(uid))) entries.set(key, raw);
    return [...entries].flatMap(([key, raw]) => {
      try {
        const entry = JSON.parse(raw);
        if (!entry || Object.keys(entry).some(field => !["uid", "caseId", "bestScore"].includes(field)) || entry.uid !== uid || !validResult(entry.caseId, entry.bestScore) || queueKey(uid, entry.caseId, entry.bestScore) !== key) return [];
        return [{ key, raw, ...entry }];
      } catch { return []; }
    });
  }
  const pendingCount = uid => uid ? new Set(entriesFor(uid).map(entry => entry.caseId)).size : 0;
  const snapshot = () => ({ enabled, user: user ? { uid: user.uid, email: user.email ?? "", displayName: user.displayName ?? "" } : null, phase, pending: pendingCount(user?.uid), memoryOnly: Boolean(user && entriesFor(user.uid).some(entry => undurable.has(entry.key))), syncing, error, message, receipts: clone(receipts) });
  const notify = () => { if (!disposed) options.onStatus?.(snapshot()); };
  function fail(reason, source, fallback) {
    error = reason?.code || "bridge/unavailable";
    errorSource = source;
    message = fallback || reason?.message || "تعذّرت مزامنة إنجازات BlackBox. بقي تقدم CyberTrace محفوظًا.";
    notify();
  }
  function clearFailure(source) {
    if (!source || source === errorSource) { error = null; errorSource = null; }
  }
  function enqueue(uid, caseId, bestScore) {
    const key = queueKey(uid, caseId, bestScore);
    const raw = JSON.stringify({ uid, caseId, bestScore });
    memory.set(key, raw);
    try {
      if (!storage?.setItem) throw new Error("Storage unavailable");
      storage.setItem(key, raw);
      undurable.delete(key);
    } catch { undurable.add(key); }
  }
  function clearEntries(entries) {
    for (const entry of entries) {
      try { if (storage?.getItem?.(entry.key) === entry.raw) storage.removeItem(entry.key); } catch { /* Replaying a committed result is idempotent. */ }
      if (memory.get(entry.key) === entry.raw) memory.delete(entry.key);
      undurable.delete(entry.key);
    }
  }
  function stopReceipts() {
    receiptGeneration += 1;
    const stop = receiptStop;
    receiptStop = undefined;
    try { stop?.(); } catch { /* Optional listener cleanup cannot prevent switching accounts. */ }
  }
  function current(scope, uid) { return !disposed && scope === generation && user?.uid === uid; }
  async function ensureBackend() {
    if (!enabled) throw problem("bridge/disabled", "ربط BlackBox قيد الإعداد.");
    if (backend) return backend;
    if (!initializing) initializing = Promise.resolve().then(() => options.backendFactory ? options.backendFactory(config) : createBlackBoxBackend(config)).then(service => { backend = service; return service; }).finally(() => { initializing = undefined; });
    return initializing;
  }
  function observeReceipts(scope, uid) {
    if (!backend.watchReceipts) return;
    const subscription = ++receiptGeneration;
    const isCurrent = () => current(scope, uid) && subscription === receiptGeneration;
    try {
      const stop = backend.watchReceipts(uid, data => {
        if (!isCurrent()) return;
        try {
          if (!data || !data.receipts || typeof data.receipts !== "object" || Array.isArray(data.receipts)) throw problem("bridge/invalid-receipt", "تعذّر التحقق من إنجازات الحساب.");
          const next = {};
          for (const [caseId, raw] of Object.entries(data.receipts)) {
            const receipt = normalizeReceipt(raw, caseId);
            if (!receipt) throw problem("bridge/invalid-receipt", "تعذّر التحقق من إنجازات الحساب.");
            next[caseId] = receipt;
          }
          receipts = next;
          if (!data.fromCache) clearEntries(entriesFor(uid).filter(entry => receipts[entry.caseId]?.bestScore >= entry.bestScore));
          clearFailure("watch");
          if (!error) message = pendingCount(uid) ? "توجد نتائج تنتظر المزامنة مع BlackBox." : "حساب BlackBox متصل. ستُحفظ أفضل نتيجة لكل تحقيق.";
          notify();
        } catch (reason) { fail(reason, "watch", "تعذّر التحقق من إنجازات الحساب؛ لم تتغيّر نتائجك المحلية."); }
      }, reason => { if (isCurrent()) fail(reason, "watch", "تعذّر تحميل إنجازات BlackBox. يمكنك إعادة المحاولة مع بقاء التدريب متاحًا."); });
      if (isCurrent()) receiptStop = stop;
      else stop?.();
    } catch (reason) { if (isCurrent()) fail(reason, "watch", "تعذّر تحميل إنجازات BlackBox."); }
  }
  function scopeChanged(nextUser) {
    if (disposed) return;
    if (nextUser && !acceptingUsers) { void Promise.resolve(backend?.signOut?.()).catch(() => {}); return; }
    const nextUid = nextUser?.uid ?? null;
    if (nextUid === (user?.uid ?? null) && phase !== "loading") { if (nextUser) user = nextUser; notify(); return; }
    generation += 1;
    stopReceipts();
    user = nextUser;
    receipts = {};
    syncing = false;
    clearFailure();
    phase = user ? "ready" : "guest";
    message = user ? "حساب BlackBox متصل. ستُحفظ أفضل نتيجة لكل تحقيق." : "اربط حساب BlackBox لمزامنة التحقيقات التي تنجزها.";
    notify();
    if (user) {
      observeReceipts(generation, user.uid);
      void retryPending();
    }
  }
  async function retryPending() {
    if (!enabled || disposed) return false;
    if (!started) await api.start();
    if (!user) return false;
    const scope = generation, uid = user.uid;
    if (syncTask?.scope === scope) return syncTask.promise;
    const task = { scope, promise: null };
    syncTask = task;
    task.promise = (async () => {
      const service = await ensureBackend();
      if (!current(scope, uid)) return false;
      syncing = true;
      clearFailure("write");
      notify();
      try {
        while (current(scope, uid)) {
          const captured = entriesFor(uid);
          if (!captured.length) break;
          const byCase = new Map();
          for (const entry of captured) if ((byCase.get(entry.caseId)?.bestScore ?? -1) < entry.bestScore) byCase.set(entry.caseId, entry);
          for (const entry of byCase.values()) {
            if (!current(scope, uid)) return false;
            const result = await service.writeReceipt(uid, entry.caseId, entry.bestScore);
            if (!current(scope, uid)) return false;
            if (result?.caseId !== entry.caseId || !validScore(result.bestScore) || result.bestScore < entry.bestScore) throw problem("bridge/invalid-write-result", "تعذّر التحقق من تأكيد المزامنة.");
            clearEntries(captured.filter(copy => copy.caseId === entry.caseId && copy.bestScore <= result.bestScore));
          }
        }
        if (!current(scope, uid)) return false;
        clearFailure("write");
        clearFailure("queue");
        if (!error) message = "تمت مزامنة أفضل نتائجك مع BlackBox.";
        return pendingCount(uid) === 0;
      } catch (reason) {
        if (current(scope, uid)) {
          const memoryOnly = entriesFor(uid).some(entry => undurable.has(entry.key));
          fail(reason, "write", memoryOnly ? "النتائج معلّقة في ذاكرة التبويب فقط. أبقِه مفتوحًا وأعد المزامنة قبل إغلاقه." : "تعذّرت المزامنة. احتُفظ بالنتائج لهذا الحساب على المتصفح لإعادة المحاولة.");
        }
        return false;
      } finally {
        if (syncTask === task) syncTask = undefined;
        if (current(scope, uid)) { syncing = false; notify(); }
      }
    })();
    return task.promise;
  }
  async function authAction(method, ...args) {
    if (disposed) throw problem("bridge/disposed", "أُغلق اتصال BlackBox.");
    if (authInFlight) throw problem("bridge/auth-busy", "توجد محاولة دخول جارية. أكملها أو أغلق نافذتها ثم حاول مجددًا.");
    const intent = ++authEpoch;
    acceptingUsers = true;
    const operation = (async () => {
      if (!started) await api.start();
      if (!started) throw problem(error || "bridge/unavailable", "تعذّر إعداد اتصال BlackBox. أعد المحاولة بعد التحقق من الشبكة.");
      if (disposed || intent !== authEpoch || !acceptingUsers) throw problem("bridge/session-changed", "تغيّر الحساب أثناء محاولة الربط. أعد الاتصال بالحساب المطلوب.");
      const service = await ensureBackend();
      if (disposed || intent !== authEpoch || !acceptingUsers) throw problem("bridge/session-changed", "أُلغيت محاولة الربط السابقة.");
      const result = await service[method](...args);
      if (disposed || intent !== authEpoch || !acceptingUsers) {
        await service.signOut();
        throw problem("bridge/session-changed", "أُلغيت محاولة الربط السابقة بعد تغيّر الحساب.");
      }
      return result;
    })();
    authInFlight = operation;
    try { return await operation; }
    catch (reason) { if (!disposed && intent === authEpoch) fail(reason, "auth", "تعذّر تسجيل الدخول إلى BlackBox. تحقق من البيانات وحاول مجددًا."); throw reason; }
    finally { if (authInFlight === operation) authInFlight = undefined; }
  }
  const online = () => { if (user) { stopReceipts(); observeReceipts(generation, user.uid); void retryPending(); } };
  const api = {
    async start() {
      if (started || disposed) return;
      if (!enabled) { notify(); return; }
      started = true;
      phase = "loading"; notify();
      try {
        const service = await ensureBackend();
        if (disposed) return;
        authStop = service.onUserChanged(scopeChanged);
        globalThis.addEventListener?.("online", online);
      } catch (reason) { started = false; phase = "guest"; fail(reason, "init", "تعذّر إعداد اتصال BlackBox. يمكنك مواصلة التدريب وإعادة المحاولة لاحقًا."); }
    },
    signInEmail: (email, password) => authAction("signInEmail", email, password),
    signInGoogle: () => authAction("signInGoogle"),
    async disconnect() {
      authEpoch += 1;
      acceptingUsers = false;
      if (!enabled || disposed) return;
      scopeChanged(null);
      if (!backend && !initializing) return;
      const service = await ensureBackend();
      try { await service.signOut(); }
      catch (reason) { fail(reason, "auth", "تعذّر إتمام فصل الحساب. بقيت النتائج المعلّقة محفوظة لحسابها."); throw reason; }
    },
    async recordCompletion(caseId, score) {
      if (!validResult(caseId, score)) throw problem("bridge/invalid-result", "نتيجة التحقيق غير صالحة للمزامنة.");
      if (!enabled || disposed || !user) return false;
      const scope = generation, uid = user.uid;
      if ((receipts[caseId]?.bestScore ?? -1) >= score) return true;
      enqueue(uid, caseId, score);
      if (undurable.has(queueKey(uid, caseId, score))) fail(problem("bridge/local-storage", ""), "queue", "حُفظت النتيجة في ذاكرة التبويب فقط. أبقِه مفتوحًا حتى المزامنة.");
      else { message = "حُفظت النتيجة لهذا الحساب وتنتظر المزامنة."; notify(); }
      const result = await retryPending();
      return current(scope, uid) && result;
    },
    async importHistory(results) {
      if (!enabled || !user || disposed) throw problem("bridge/not-linked", "اربط حساب BlackBox أولًا لنقل النتائج السابقة.");
      if (!results || typeof results !== "object" || Array.isArray(results)) throw problem("bridge/invalid-history", "سجل النتائج غير صالح للنقل.");
      const scope = generation, uid = user.uid;
      let imported = 0, skipped = 0;
      for (const [caseId, result] of Object.entries(results)) {
        if (!result || !validResult(caseId, result.bestScore) || !Number.isInteger(result.attempts) || result.attempts < 1 || !validScore(result.lastScore) || result.bestScore < result.lastScore || typeof result.lastCompletedAt !== "string" || !Number.isFinite(Date.parse(result.lastCompletedAt)) || (receipts[caseId]?.bestScore ?? -1) >= result.bestScore) { skipped += 1; continue; }
        enqueue(uid, caseId, result.bestScore);
        imported += 1;
      }
      if (entriesFor(uid).some(entry => undurable.has(entry.key))) fail(problem("bridge/local-storage", ""), "queue", "النتائج السابقة في ذاكرة التبويب فقط. أبقِه مفتوحًا حتى تكتمل المزامنة.");
      else { message = "تنتظر النتائج السابقة المزامنة مع حساب BlackBox الذي اخترته."; notify(); }
      await retryPending();
      if (!current(scope, uid)) throw problem("bridge/session-changed", "تغيّر الحساب أثناء نقل النتائج. بقيت النتائج محفوظة للحساب الذي اخترته أولًا.");
      return { imported, skipped, pending: pendingCount(uid) };
    },
    retryPending: () => {
      if (user && errorSource === "watch") {
        stopReceipts();
        observeReceipts(generation, user.uid);
      }
      return retryPending();
    },
    getStatus: snapshot,
    dispose() { disposed = true; acceptingUsers = false; authEpoch += 1; generation += 1; authStop?.(); stopReceipts(); globalThis.removeEventListener?.("online", online); },
  };
  return api;
}
