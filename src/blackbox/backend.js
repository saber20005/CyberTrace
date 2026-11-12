import { blackBoxConfig } from "./config.js";
import { CASE_IDS, MAX_CASE_SCORE, normalizeReceipt } from "../data/linkedSkills.js";

const knownCases = new Set(CASE_IDS);
const problem = (code, message) => Object.assign(new Error(message), { code });

export async function createBlackBoxBackend(config = blackBoxConfig) {
  if (!config.enabled || !config.firebase?.apiKey || !config.firebase?.projectId) {
    throw problem("bridge/disabled", "ربط BlackBox قيد الإعداد. يبقى تدريبك محفوظًا في CyberTrace.");
  }
  const [appSDK, authSDK, storeSDK] = await Promise.all([
    import("firebase/app"), import("firebase/auth"), import("firebase/firestore"),
  ]);
  const name = "cybertrace-blackbox-link";
  const existing = appSDK.getApps().find(candidate => candidate.name === name);
  if (existing && existing.options.projectId !== config.firebase.projectId) throw problem("bridge/configuration", "إعداد حساب BlackBox غير متوافق.");
  const app = existing ?? appSDK.initializeApp(config.firebase, name);
  const auth = authSDK.getAuth(app);
  const database = storeSDK.getFirestore(app);
  const local = typeof location !== "undefined" && ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
  if (config.emulators && local && !existing) {
    authSDK.connectAuthEmulator(auth, config.emulators.authURL, { disableWarnings: true });
    storeSDK.connectFirestoreEmulator(database, config.emulators.firestoreHost, config.emulators.firestorePort);
  }
  await authSDK.setPersistence(auth, authSDK.browserLocalPersistence);
  function checkOwner(uid) {
    if (!auth.currentUser || auth.currentUser.uid !== uid) throw problem("bridge/session-changed", "تغيّر حساب BlackBox المستخدم. أعد الاتصال قبل المزامنة.");
  }
  return {
    onUserChanged: callback => authSDK.onAuthStateChanged(auth, callback),
    signInEmail: (email, password) => authSDK.signInWithEmailAndPassword(auth, email, password),
    signInGoogle() {
      const provider = new authSDK.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      return authSDK.signInWithPopup(auth, provider);
    },
    signOut: () => authSDK.signOut(auth),
    watchReceipts(uid, onData, onError) {
      checkOwner(uid);
      const reference = storeSDK.collection(database, "blackboxUsers", uid, "cybertrace");
      return storeSDK.onSnapshot(reference, { includeMetadataChanges: true }, snapshot => {
        if (snapshot.metadata.hasPendingWrites) return;
        try {
          const receipts = {};
          for (const document of snapshot.docs) {
            const receipt = normalizeReceipt(document.data(), document.id);
            if (!receipt) throw problem("bridge/invalid-receipt", "تعذّر التحقق من إنجازات الحساب. لم يتغيّر تقدم CyberTrace المحلي.");
            receipts[document.id] = receipt;
          }
          onData({ receipts, fromCache: snapshot.metadata.fromCache });
        } catch (error) { onError(error); }
      }, onError);
    },
    async writeReceipt(uid, caseId, bestScore) {
      checkOwner(uid);
      if (!knownCases.has(caseId) || !Number.isInteger(bestScore) || bestScore < 0 || bestScore > MAX_CASE_SCORE) throw problem("bridge/invalid-result", "نتيجة التحقيق غير صالحة للمزامنة.");
      const reference = storeSDK.doc(database, "blackboxUsers", uid, "cybertrace", caseId);
      return storeSDK.runTransaction(database, async transaction => {
        checkOwner(uid);
        const snapshot = await transaction.get(reference);
        const raw = snapshot.exists() ? snapshot.data() : null;
        const existingReceipt = raw ? normalizeReceipt(raw, caseId) : null;
        if (raw && !existingReceipt) throw problem("bridge/invalid-receipt", "تعذّر قراءة إنجاز الحساب الحالي. احتُفظ بنتيجتك لإعادة المحاولة.");
        if (existingReceipt && existingReceipt.bestScore >= bestScore) return { caseId, bestScore: existingReceipt.bestScore, changed: false };
        transaction.set(reference, {
          schemaVersion: 1, source: "cybertrace", caseId, bestScore,
          firstSyncedAt: raw?.firstSyncedAt ?? storeSDK.serverTimestamp(),
          updatedAt: storeSDK.serverTimestamp(),
        });
        return { caseId, bestScore, changed: true };
      });
    },
  };
}
