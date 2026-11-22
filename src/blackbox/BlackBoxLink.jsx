import { useEffect, useRef, useState } from "react";
import { getCaseResults, getCompletedCaseIds } from "../utils/caseProgress";
import { CASE_META, MAX_CASE_SCORE } from "../data/linkedSkills";
import { useBlackBox } from "./useBlackBox";
import VerifiedIdentityPanel from "./VerifiedIdentityPanel.jsx";
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
  const linkedCount = Object.keys(status.receipts || {}).length;
  const localCompletedCount = getCompletedCaseIds().filter(id => Object.hasOwn(CASE_META, id)).length;
  const linkedOnlyCount = Object.keys(status.receipts || {}).filter(id => !getCompletedCaseIds().includes(id)).length;
  const alreadyLinkedCount = Object.entries(results).filter(([id, result]) =>
    Object.hasOwn(CASE_META, id) && Number.isSafeInteger(result.bestScore) &&
    (status.receipts?.[id]?.bestScore ?? -1) >= result.bestScore
  ).length;
  const toSendCount = Math.max(0, scoredCount - alreadyLinkedCount);
  const importFeedback = visibleOperation?.kind === "import" ? visibleOperation : null;
  const retryFeedback = visibleOperation?.kind === "retry" ? visibleOperation : null;

  useEffect(() => { form.current?.reset(); }, [uid]);

  const close = () => { dialogRef.current?.close(); form.current?.reset(); };
  async function run(action, successText = "", kind = "general") {
    if (busy) return;
    const actionUid = uid;
    setBusy(true);
    setOperation({ uid: actionUid, kind, text: "جارٍ تنفيذ الطلب...", error: false });
    try {
      const result = await action();
      if (successText) setOperation({ uid: actionUid, kind, text: typeof successText === "function" ? successText(result) : successText, error: false });
      else setOperation(null);
      form.current?.reset();
    } catch (error) { setOperation({ uid: actionUid, kind, text: friendlyError(error), error: true }); }
    finally { setBusy(false); }
  }

  return <>
    <dialog ref={dialogRef} id="blackboxLinkDialog" className="bb-link-dialog" dir="rtl" aria-labelledby="blackboxLinkTitle" aria-describedby="blackboxLinkDescription" aria-busy={busy} onClose={() => form.current?.reset()}>
      <header className="bb-link-dialog-head"><span>CYBERTRACE / BLACKBOX</span><button type="button" id="blackboxLinkClose" className="bb-link-close" onClick={close} aria-label="إغلاق نافذة ربط BlackBox">×</button></header>
      <h2 id="blackboxLinkTitle">{connected ? "حساب BlackBox المرتبط" : "اربط التحقيقات برحلة مهاراتك"}</h2>
      <p id="blackboxLinkDescription">تزيد أفضل نتيجة لكل تحقيق تقدّم مهارته في BlackBox. إعادة التحقيق لا تكرر النقاط؛ تحسين النتيجة يرفعها.</p>
      {visibleOperation && visibleOperation.kind === "general" && <p className={`bb-link-message ${visibleOperation.error ? "has-error" : ""}`} role={visibleOperation.error ? "alert" : "status"}>{visibleOperation.text}</p>}
      <p id="blackboxLinkStatus" className={`bb-link-service ${status.error ? "has-error" : ""}`} role="status" aria-live="polite">{status.memoryOnly ? "بعض النتائج في ذاكرة التبويب فقط. أبقِ هذا التبويب مفتوحًا وأعد المزامنة قبل إغلاقه." : status.error ? friendlyError(status.error) : status.message || (status.phase === "loading" ? "جارٍ تجهيز الربط…" : "يمكنك مواصلة التدريب دون ربط حساب.")}</p>
      {connected ? <section className="bb-link-account">
        <VerifiedIdentityPanel blackboxUid={uid} />
        <div className="bb-link-identity"><span>تُرسل التحقيقات الجديدة إلى</span><strong dir="ltr">{status.user.email || status.user.displayName || "حساب BlackBox"}</strong></div>
        <p className="bb-link-note">تبدأ المزامنة التلقائية من التحقيقات التي تكملها أثناء الربط. يمكنك نقل النتائج المسجّلة على هذا المتصفح إلى الحساب المعروض باختيارك.</p>
        <div className="bb-link-history" aria-label="مقارنة سجل التحقيقات"><h3>توضيح اختلاف الإنجازات</h3><p>التحقيقات المكتملة على هذا المتصفح: {localCompletedCount}. سجلات الإنجازات المرتبطة بحساب BlackBox: {linkedCount}.</p>{linkedOnlyCount > 0 && <p className="bb-link-note" role="status">يوجد {linkedOnlyCount} إنجازات في BlackBox لا تظهر كمكتملة على هذا المتصفح. قد تكون نتائج قديمة من جهاز أو جلسة ربط سابقة؛ لا يعني ظهورها أنها أُنجزت على حساب CyberTrace الحالي.</p>}<p className="bb-link-note">حساب CyberTrace وحساب BlackBox يعملان على مشروعي Firebase مستقلين. تطابق بريد Google لا يثبت تطابق سجل التحقيقات. لا تُستعاد الإنجازات من BlackBox تلقائيًا، ولن تُنقل أو تُحذف أي بيانات دون اختيارك.</p></div>
        <div className="bb-link-history"><h3>نتائج هذا المتصفح</h3><p>{scoredCount ? `لديك ${scoredCount} نتائج مسجّلة على هذا المتصفح؛ ${alreadyLinkedCount} نتائجها موجودة بالفعل في BLACKBOX، و${toSendCount} قد تحتاج إلى إرسال أو تحديث.` : "لا توجد نتائج مسجّلة قابلة للإرسال من هذا المتصفح بعد."}</p>
          {unscoredCount > 0 && <p className="bb-link-note">{unscoredCount} تحقيقات قديمة دون نتيجة محفوظة. أعدها لتسجيل نقاط للمهارة.</p>}
          <button type="button" id="blackboxImportHistory" className="bb-link-secondary" disabled={busy || !ready || !scoredCount} onClick={() => run(() => bridge.importHistory(getCaseResults()), result => result.pending
            ? `أُضيفت ${result.imported} نتائج إلى قائمة الإرسال، وما زالت ${result.pending} نتائج تنتظر تأكيد BLACKBOX. ${status.message || "تحقق من الاتصال وقواعد Firestore."}`
            : result.imported
              ? `عولج إرسال ${result.imported} نتائج إلى BLACKBOX، وتم تجاوز ${result.skipped} نتائج لأنها موجودة مسبقًا أو غير مؤهلة.`
              : `لم تُرسَل نتائج جديدة: تم تجاوز ${result.skipped} نتائج لأنها موجودة مسبقًا أو غير مؤهلة. السجلان الإضافيان في BLACKBOX لا يمكن استعادتهما إلى CyberTrace بهذا الزر.`, "import")}>إرسال نتائج هذا المتصفح إلى BLACKBOX</button>
          {importFeedback && <p className={`bb-link-message bb-link-inline-feedback ${importFeedback.error ? "has-error" : ""}`} role={importFeedback.error ? "alert" : "status"} aria-live="polite">{importFeedback.text}</p>}
        </div>
        <div className="bb-link-action-row"><button type="button" id="blackboxRetryPending" className="bb-link-secondary" disabled={busy} onClick={() => run(bridge.retryPending, result => result
          ? (status.pending ? "تمت معالجة النتائج المعلّقة في BLACKBOX." : "لا توجد نتائج معلّقة لإعادة إرسالها إلى BLACKBOX. هذا الزر لا يستعيد السجلات القديمة إلى CyberTrace.")
          : "لم تنجح إعادة إرسال النتائج المعلّقة؛ تحقق من الرسالة أدناه.", "retry")}>إعادة إرسال نتائج BLACKBOX</button><button type="button" id="blackboxDisconnect" className="bb-link-secondary" disabled={busy} onClick={() => run(bridge.disconnect)}>إلغاء الربط</button></div>
        {retryFeedback && <p className={`bb-link-message bb-link-inline-feedback ${retryFeedback.error ? "has-error" : ""}`} role={retryFeedback.error ? "alert" : "status"} aria-live="polite">{retryFeedback.text}</p>}
        {status.error && <p className="bb-link-message has-error bb-link-inline-feedback" role="alert">فشل الاتصال بحساب BLACKBOX: {friendlyError(status.error)} ({String(status.error)}) — {status.message}</p>}
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
