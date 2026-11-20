import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// Uses CyberTrace's own Firebase Auth instance. BlackBox linking stays independent.
export async function signInToCyberTraceWithGoogle(cyberTraceAuth, popupSignIn = signInWithPopup) {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const credential = await popupSignIn(cyberTraceAuth, provider);
  if (!credential?.user?.uid) {
    throw Object.assign(new Error("Google authentication did not return a user"), {
      code: "auth/invalid-user-token",
    });
  }
  return credential.user;
}

const errorMessages = Object.freeze({
  "auth/popup-blocked": "المتصفح منع نافذة Google. اسمح بالنوافذ المنبثقة لهذا الموقع ثم حاول مجددًا.",
  "auth/operation-not-supported-in-this-environment": "تعذّر فتح Google في هذا المتصفح. افتح الموقع في Chrome أو متصفح عادي.",
  "auth/operation-not-allowed": "تسجيل الدخول عبر Google غير مفعّل في إعدادات Firebase الخاصة بـCyberTrace.",
  "auth/unauthorized-domain": "عنوان CyberTrace غير مضاف إلى النطاقات المصرّح بها في Firebase Authentication.",
  "auth/account-exists-with-different-credential": "البريد مرتبط بحساب يستخدم طريقة دخول أخرى. ادخل بالطريقة الأصلية حفاظًا على تقدمك؛ لن ندمج حسابين تلقائيًا.",
  "auth/credential-already-in-use": "حساب Google مرتبط بحساب CyberTrace آخر. لن ننقل التقدم أو ندمج الحسابات تلقائيًا.",
  "auth/user-disabled": "هذا الحساب معطّل. تواصل مع مسؤول المنصة.",
  "auth/network-request-failed": "تعذّر الاتصال بخدمة تسجيل الدخول. تحقق من الإنترنت ثم أعد المحاولة.",
  "auth/too-many-requests": "محاولات كثيرة جدًا. حاول مجددًا لاحقًا.",
  "auth/invalid-credential": "تعذّر التحقق من بيانات Google. أعد المحاولة.",
});

export function googleSignInErrorMessage(error) {
  if (error?.code === "auth/popup-closed-by-user" || error?.code === "auth/cancelled-popup-request") return "";
  return errorMessages[error?.code] ?? "تعذّر تسجيل الدخول عبر Google. حاول مجددًا أو استخدم البريد الإلكتروني.";
}
