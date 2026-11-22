import { getApps } from "firebase/app";
import { auth } from "../firebase";
import { getAuth, getIdToken } from "firebase/auth";

// This bridge verifies BOTH signed-in Firebase projects on the server.
// It does not transfer historical cases or grant certificates.
export const identityLinkConfigured = Boolean(String(import.meta.env.VITE_BLACKBOX_APPCHECK_ENTERPRISE_SITE_KEY || "").trim());

function assertDualIdentity(blackboxUid, cybertraceUid) {
  const app = getApps().find(a => a.name === "cybertrace-blackbox-link");
  if (!app || app.options.projectId !== "black-box-lab" || !blackboxUid ||
    getAuth(app).currentUser?.uid !== blackboxUid || !cybertraceUid ||
    auth.currentUser?.uid !== cybertraceUid) {
    throw new Error("تغيّر الحساب. سجّل الدخول مجددًا إلى كلا الموقعين.");
  }
  return app;
}

async function createCallable(blackboxUid, cybertraceUid, name) {
  if (!identityLinkConfigured) throw new Error("التحقق الموثّق من الربط غير مفعّل على الموقع حاليًا.");
  const app = assertDualIdentity(blackboxUid, cybertraceUid);
  const { initializeAppCheck, getAppCheck, ReCaptchaEnterpriseProvider } = await import("firebase/app-check");
  try { getAppCheck(app); }
  catch {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(import.meta.env.VITE_BLACKBOX_APPCHECK_ENTERPRISE_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });
  }
  const { getFunctions, httpsCallable } = await import("firebase/functions");
  const invoke=httpsCallable(getFunctions(app,"us-central1"),name,{timeout:30000});
  return async data => {
    assertDualIdentity(blackboxUid,cybertraceUid);
    const result=await invoke(data);
    assertDualIdentity(blackboxUid,cybertraceUid);
    return result.data;
  };
}

export async function checkVerifiedAccountLink(blackboxUid,cybertraceUid) {
  const invoke=await createCallable(blackboxUid,cybertraceUid,"getVerifiedCyberTraceLink");
  const result=await invoke({});
  if(!result||typeof result.linked!=="boolean")throw new Error("تعذّر التحقق من حالة الربط.");
  return {linked:result.linked};
}

export async function linkVerifiedAccounts(blackboxUid,cybertraceUid) {
  const invoke=await createCallable(blackboxUid,cybertraceUid,"linkVerifiedCyberTraceAccount");
  const user=auth.currentUser;
  assertDualIdentity(blackboxUid,cybertraceUid);
  // Refreshes the token, but not auth_time. The server requires the user to
  // reauthenticate both providers within 10 minutes for this sensitive link.
  const cybertraceIdToken=await getIdToken(user,true);
  assertDualIdentity(blackboxUid,cybertraceUid);
  const result=await invoke({cybertraceIdToken,consent:true});
  if(result?.linked!==true)throw new Error("لم يؤكد الخادم الربط.");
  return {linked:true,alreadyLinked:Boolean(result.alreadyLinked)};
}

export async function unlinkVerifiedAccounts(blackboxUid,cybertraceUid) {
  const invoke=await createCallable(blackboxUid,cybertraceUid,"unlinkVerifiedCyberTraceAccount");
  const result=await invoke({consent:true});
  if(result?.linked!==false)throw new Error("لم يؤكد الخادم إلغاء الربط.");
  return {linked:false,changed:Boolean(result.changed)};
}
