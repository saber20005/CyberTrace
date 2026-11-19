import { getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

// A public reCAPTCHA Enterprise site key must be configured in Vercel and
// registered to the BLACKBOX Firebase Web app before this feature can start.
// No test/production key is guessed, embedded or silently bypassed.
const siteKey = String(import.meta.env.VITE_BLACKBOX_APPCHECK_ENTERPRISE_SITE_KEY || "").trim();
export const VERIFIED_SOC_SHIFT_ID = "SOC-VERIFY-01";
export const verifiedSocConfigured = Boolean(siteKey);

function requireBlackBoxApp(uid) {
  const app = getApps().find(value => value.name === "cybertrace-blackbox-link");
  if (!app || app.options.projectId !== "black-box-lab" || !uid ||
      getAuth(app).currentUser?.uid !== uid) {
    throw new Error("اربط حساب BLACKBOX الصحيح قبل بدء التقييم.");
  }
  return app;
}

async function callableFor(uid, name) {
  if (!verifiedSocConfigured) throw new Error("التقييم الخادمي قيد التجهيز ولم يُفعّل بعد.");
  const app = requireBlackBoxApp(uid);
  const { getAppCheck, initializeAppCheck, ReCaptchaEnterpriseProvider } = await import("firebase/app-check");
  try {
    getAppCheck(app);
  } catch {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
  }
  const { getFunctions, httpsCallable } = await import("firebase/functions");
  const invoke = httpsCallable(getFunctions(app, "us-central1"), name, { timeout: 30000 });
  return async data => {
    requireBlackBoxApp(uid);
    const response = await invoke(data);
    requireBlackBoxApp(uid);
    return response.data;
  };
}

export async function startServerVerifiedSoc(uid) {
  const call = await callableFor(uid, "startVerifiedSocShift");
  const response = await call({ shiftId: VERIFIED_SOC_SHIFT_ID });
  if (!response || response.shiftId !== VERIFIED_SOC_SHIFT_ID ||
      typeof response.sessionId !== "string" || !Number.isSafeInteger(response.expiresAtMs) ||
      response.challenge?.id !== VERIFIED_SOC_SHIFT_ID ||
      !Array.isArray(response.challenge?.alerts) || response.challenge.alerts.length !== 4) {
    throw new Error("رد جلسة التقييم غير متوافق. لم تُحتسب أي درجة.");
  }
  return response;
}

export async function submitServerVerifiedSoc(uid, sessionId, responses, correlationId) {
  const call = await callableFor(uid, "submitVerifiedSocShift");
  const result = await call({ shiftId: VERIFIED_SOC_SHIFT_ID, sessionId, responses, correlationId });
  if (!result || result.shiftId !== VERIFIED_SOC_SHIFT_ID ||
      result.verifiedByServer !== true || !Number.isInteger(result.score) ||
      result.score < 0 || result.score > 100 || result.maxScore !== 100 ||
      !Number.isInteger(result.bestScore) || result.bestScore < result.score || result.bestScore > 100 ||
      !Number.isInteger(result.priorityScore) || !Number.isInteger(result.responseScore) ||
      !Number.isInteger(result.correlationScore) ||
      result.priorityScore + result.responseScore + result.correlationScore !== result.score) {
    throw new Error("النتيجة الخادمية غير متوافقة؛ لم تُعرض نتيجة موثّقة.");
  }
  return {
    shiftId: result.shiftId, verifiedByServer: true, score: result.score, bestScore: result.bestScore,
    maxScore: 100, priorityScore: result.priorityScore, responseScore: result.responseScore,
    correlationScore: result.correlationScore,
  };
}
