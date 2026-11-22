import { getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { parseSuiteMembership } from "./suiteMembershipCore.js";

// Must be configured on the legitimate CyberTrace domain for the existing
// BLACKBOX Firebase app, or the lookup stays unavailable (never "Free").
const siteKey = String(import.meta.env?.VITE_BLACKBOX_APPCHECK_ENTERPRISE_SITE_KEY ?? "").trim();
export const suiteMembershipConfigured = Boolean(siteKey);

function requireConnectedBlackBox(uid) {
  const app = getApps().find(item => item.name === "cybertrace-blackbox-link");
  if (!app || app.options.projectId !== "black-box-lab" ||
      typeof uid !== "string" || !uid ||
      getAuth(app).currentUser?.uid !== uid) {
    throw new Error("يجب ربط حساب BLACKBOX الصحيح قبل التحقق من العضوية.");
  }
  return app;
}

export async function readSuiteMembership(uid) {
  if (!suiteMembershipConfigured) {
    throw new Error("فحص العضوية قيد التجهيز. لم يبدأ بيع الاشتراكات بعد.");
  }
  const app = requireConnectedBlackBox(uid);
  const { getAppCheck, initializeAppCheck, ReCaptchaEnterpriseProvider } =
    await import("firebase/app-check");
  try {
    getAppCheck(app);
  } catch {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
  }
  const { getFunctions, httpsCallable } = await import("firebase/functions");
  const read = httpsCallable(getFunctions(app, "us-central1"), "getSuiteMembership", { timeout: 30000 });
  requireConnectedBlackBox(uid);
  const response = await read({});
  requireConnectedBlackBox(uid);
  return parseSuiteMembership(response.data);
}
