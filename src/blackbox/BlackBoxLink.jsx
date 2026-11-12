import { useEffect, useRef, useState } from "react";
import { getCaseResults, getCompletedCaseIds } from "../utils/caseProgress";
import { CASE_META, MAX_CASE_SCORE } from "../data/linkedSkills";
import { useBlackBox } from "./useBlackBox";
import "./BlackBoxLink.css";

function friendlyError(error) {
  const code = String(error?.code || error || "");
  if (code === "bridge/session-changed") return "تغيّر حساب CyberTrace أثناء الربط. اختر حساب BlackBox من جديد قبل نقل النتائج.";
  if (["auth/invalid-credential", "auth/invalid-login-credentials", "auth/wrong-password", "auth/user-not-found"].includes(code)) return "تعذّر الدخول بهذه البيانات. راجع بريد حساب BlackBox وكلمة المرور.";
  if (code === "auth/invalid-email") return "اكتب عنوان بريد إلكتروني صالحًا.";
  if (code === "auth/too-many-requests") return "تكررت المحاولات خلال وقت قصير. انتظر قليلًا ثم حاول مجددًا.";
  if (["auth/popup-closed-by-user", "auth/cancelled-popup-request"].includes(code)) return "أُغلقت نافذة Google قبل إكمال الربط. يمكنك المحاولة مجددًا.";
  if (code === "auth/popup-blocked") return "اسمح بنافذة Google المنبثقة لهذا الموقع ثم حاول مجددًا.";
  if (["auth/unauthorized-domain", "auth/operation-not-allowed"].includes(code)) return "ربط Google غير مهيّأ لهذا النطاق حاليًا. يمكنك استخدام حساب BlackBox بالبريد وكلمة المرور.";
  if (["permission-denied", "unauthenticated"].includes(code)) return "تعذّر الوصول إلى نتائج الحساب. احتفظ بالتقدّم المحلي وأعد المحاولة لاحقًا.";
  if (["auth/network-request-failed", "unavailable"].includes(code)) return "تعذّر الاتصال. يمكنك مواصلة التحقيق ثم إعادة المزامنة عند عودة الشبكة.";
  if (code === "bridge/session-changed") return "تغيّر الحساب أثناء الربط. اختر حساب BlackBox الذي تريد إرسال النتائج إليه.";
  if (code === "bridge/auth-busy") return "توجد محاولة دخول جارية. أكملها أو أغلق نافذتها ثم حاول مجددًا.";
  return "تعذّر إكمال العملية الآن. راجع حالة الربط وحاول مجددًا.";
}

export default function BlackBoxLink({ dialogRef }) {
  const bridge = useBlackBox();
  const { status } = bridge;
  const [busy, setBusy] = useState(false);
  const [operation, setOperation] = useState(null);
  const form = useRef(null);
  const uid = status.user?.uid ?? null;
  const connected = Boolean(status.user);
  const ready = status.phase !== "loading";
  const results = getCaseResults();
  const scoredCount = Object.entries(results).filter(([id, result]) => Object.hasOwn(CASE_META, id) && Number.isSafeInteger(result.bestScore) && result.bestScore >= 0 && result.bestScore <= MAX_CASE_SCORE).length;
  const unscoredCount = getCompletedCaseIds().filter(id => Object.hasOwn(CASE_META, id) && !Object.hasOwn(results, id)).length;
  const visibleOperation = operation?.uid === uid ? operation : null;

  useEffect(() => { form.current?.reset(); }, [uid]);

  const close = () => { dialogRef.current?.close(); form.current?.reset(); };
  async function run(action, successText = "") {
    if (busy) return;
    const actionUid = uid;
    setBusy(true);
    setOperation(null);
    try {
      const result = await action();
      if (successText) setOperation({ uid: actionUid, text: typeof successText === "function" ? successText(result) : successText, error: false });
      form.current?.reset();
    } catch (error) { setOperation({ uid: actionUid, text: friendlyError(error), error: true }); }
    finally { setBusy(false); }
  }

  return <>
    <dialog ref={dialogRef} id="blackboxLinkDialog" className="bb-link-dialog" dir="rtl" aria-labelledby="blackboxLinkTitle" aria-describedby="blackboxLinkDescription" aria-busy={busy} onClose={() => form.current?.reset()}>
      <header className="bb-link-dialog-head"><span>CYBERTRACE / BLACKBOX</span><button type="button" id="blackboxLinkClose" className="bb-link-close" onClick={close} aria-label="إغلاق نافذة ربط BlackBox">×</button></header>
      <h2 id="blackboxLinkTitle">{connected ? "حساب BlackBox المرتبط" : "اربط التحقيقات برحلة مهاراتك"}</h2>
      <p id="blackboxLinkDescription">تزيد أفضل نتيجة لكل تحقيق تقدّم مهارته في BlackBox. إعادة التحقيق لا تكرر النقاط؛ تحسين النتيجة يرفعها.</p>
      {visibleOperation && <p className={`bb-link-message ${visibleOperation.error ? "has-error" : ""}`} role={visibleOperation.error ? "alert" : "status"}>{visibleOperation.text}</p>}
      <p id="blackboxLinkStatus" className={`bb-link-service ${status.error ? "has-error" : ""}`} role="status" aria-live="polite">{status.memoryOnly ? "بعض النتائج في ذاكرة التبويب فقط. أبقِ هذا التبويب مفتوحًا وأعد المزامنة قبل إغلاقه." : status.error ? friendlyError(status.error) : status.message || (status.phase === "loading" ? "جارٍ تجهيز الربط…" : "يمكنك مواصلة التدريب دون ربط حساب.")}</p>
      {connected ? <section className="bb-link-account">
        <div className="bb-link-identity"><span>تُرسل التحقيقات الجديدة إلى</span><strong dir="ltr">{status.user.email || status.user.displayName || "حساب BlackBox"}</strong></div>
        <p className="bb-link-note">تبدأ المزامنة التلقائية من التحقيقات التي تكملها أثناء الربط. يمكنك نقل النتائج المسجّلة على هذا المتصفح إلى الحساب المعروض باختيارك.</p>
        <div className="bb-link-history"><h3>نتائج هذا المتصفح</h3><p>{scoredCount ? `${scoredCount} تحقيقات لها نتائج مسجّلة قابلة للنقل.` : "لا توجد نتائج مسجّلة قابلة للنقل على هذا المتصفح بعد."}</p>
          {unscoredCount > 0 && <p className="bb-link-note">{unscoredCount} تحقيقات قديمة دون نتيجة محفوظة. أعدها لتسجيل نقاط للمهارة.</p>}
          <button type="button" id="blackboxImportHistory" className="bb-link-secondary" disabled={busy || !ready || !scoredCount} onClick={() => run(() => bridge.importHistory(getCaseResults()), result => result.pending ? "نُقلت النتائج إلى قائمة انتظار هذا الحساب؛ راجع حالة المزامنة." : "اكتملت معالجة النتائج. تُحتسب أفضل نتيجة لكل تحقيق مرة واحدة.")}>نقل نتائجي المسجّلة إلى هذا الحساب</button>
        </div>
        <div className="bb-link-action-row"><button type="button" id="blackboxRetryPending" className="bb-link-secondary" disabled={busy} onClick={() => run(bridge.retryPending)}>إعادة المزامنة</button><button type="button" id="blackboxDisconnect" className="bb-link-secondary" disabled={busy} onClick={() => run(bridge.disconnect)}>إلغاء الربط</button></div>
        {status.pending > 0 && <p className="bb-link-note">{status.memoryOnly ? "أبقِ التبويب مفتوحًا حتى تكتمل مزامنة النتائج المؤقتة." : "نتائج الانتظار تخص هذا الحساب، وتستأنف مزامنتها عند إعادة ربطه."}</p>}
        <a className="bb-link-destination" href="https://blackboxlab.dev/?view=skills&utm_source=cybertrace&utm_medium=referral&utm_campaign=linked_skills" target="_blank" rel="noopener noreferrer">عرض تقدّم المهارات في BlackBox ↗</a>
      </section> : <section>
        <p className="bb-link-note">استخدم حساب BlackBox الذي تريد متابعة المهارات فيه.</p>
        <form ref={form} id="blackboxLinkForm" onSubmit={event => {
          event.preventDefault();
          if (!event.currentTarget.reportValidity()) return;
          const data = new FormData(event.currentTarget);
          void run(() => bridge.signInEmail(String(data.get("email") || "").trim(), String(data.get("password") || "")));
        }}>
          <label htmlFor="blackboxLinkEmail">بريد حساب BlackBox</label><input id="blackboxLinkEmail" name="email" type="email" autoComplete="email" inputMode="email" dir="ltr" required disabled={busy || !ready} placeholder="name@example.com" />
          <label htmlFor="blackboxLinkPassword">كلمة المرور</label><input id="blackboxLinkPassword" name="password" type="password" autoComplete="current-password" dir="ltr" required maxLength={4096} disabled={busy || !ready} />
          <button type="submit" id="blackboxLinkSubmit" className="bb-link-button bb-link-full" disabled={busy || !ready}>ربط حساب BlackBox</button>
        </form>
        <button type="button" id="blackboxLinkGoogle" className="bb-link-secondary bb-link-full" disabled={busy || !ready} onClick={() => run(bridge.signInGoogle)}>المتابعة بحساب Google</button>
        <a className="bb-link-destination" href="https://blackboxlab.dev/" target="_blank" rel="noopener noreferrer">إنشاء حساب أو استعادة كلمة المرور في BlackBox ↗</a>
        <button type="button" className="bb-link-guest" onClick={close}>متابعة التحقيق دون ربط</button>
      </section>}
    </dialog>
  </>;
}
