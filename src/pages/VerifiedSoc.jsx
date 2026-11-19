import { useState } from "react";
import { useBlackBox } from "../blackbox/useBlackBox.js";
import { VERIFIED_SOC_SHIFT_ID, verifiedSocConfigured, startServerVerifiedSoc, submitServerVerifiedSoc } from "../blackbox/verifiedSocBackend.js";
import "./VerifiedSoc.css";

export default function VerifiedSoc({ onHome, onSoc, onPro }) {
  const { status: bridge, openLink } = useBlackBox();
  const uid = bridge.user?.uid || null;
  const [run, setRun] = useState(null);
  const [answers, setAnswers] = useState({});
  const [linkChoice, setLinkChoice] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const challenge = run?.challenge;
  const allAnswered = Boolean(challenge && challenge.alerts.every(a =>
    challenge.priorityChoices.some(p => p.id === answers[a.id]?.priorityId) &&
    a.actions.some(option => option.id === answers[a.id]?.actionId)
  ) && challenge.correlations.some(option => option.id === linkChoice));

  const changeAnswer = (alertId, field, value) => {
    setAnswers(old => ({ ...old, [alertId]: { ...old[alertId], [field]: value } }));
  };

  const start = async () => {
    if (!uid || !verifiedSocConfigured || busy) return;
    setBusy(true); setMessage("");
    try {
      const started = await startServerVerifiedSoc(uid);
      setRun(started);
      setAnswers({});
      setLinkChoice("");
      setResult(null);
      setMessage("بدأت جلسة التقييم. تستند النتيجة إلى تصحيح خادمي واحد بعد الإرسال.");
    } catch (error) {
      setMessage("تعذّر فتح التقييم الموثق: " + (error.message || "الخدمة غير متاحة حاليًا."));
    } finally { setBusy(false); }
  };

  const submit = async () => {
    if (!uid || !run || !allAnswered || result || busy) return;
    setBusy(true); setMessage("");
    try {
      const submitted = await submitServerVerifiedSoc(uid, run.sessionId,
        challenge.alerts.map(a => ({ alertId: a.id, priorityId: answers[a.id].priorityId, actionId: answers[a.id].actionId })),
        linkChoice);
      setResult(submitted);
      setMessage("تلقى الخادم الإجابات واحتسب النتيجة بصورة مستقلة.");
    } catch (error) {
      setMessage("لم تُعتمد النتيجة: " + (error.message || "تحقق من اتصالك وابدأ جلسة جديدة عند الحاجة."));
    } finally { setBusy(false); }
  };

  return <div className="verified-soc-page" dir="rtl">
    <header className="verified-soc-nav">
      <button type="button" onClick={onHome}>CyberTrace</button>
      <nav aria-label="التنقل">
        <button type="button" onClick={onSoc}>المناوبات المجانية</button>
        <button type="button" onClick={onPro}>عن Pro</button>
      </nav>
    </header>
    <main className="verified-soc-shell">
      <section className="verified-soc-hero">
        <span className="verified-soc-overline">SERVER-VERIFIED ASSESSMENT / {VERIFIED_SOC_SHIFT_ID}</span>
        <h1>محرك تقييم SOC الخادمي</h1>
        <p>نطوّر تقييمًا مستقلًا عن درجات المتصفح: الأسئلة والاختيارات تُقدّم من خادم BLACKBOX، ومفاتيح التصحيح تبقى خاصة على الخادم، ولا تُمنح النتيجة إلا بعد التحقق من الجلسة.</p>
        <span className="verified-soc-state">{verifiedSocConfigured ? "بوابة التقييم قيد الاختبار — تعتمد على جاهزية Firebase" : "واجهة تجريبية — التقييم الموثق غير مفعّل بعد"}</span>
      </section>

      <div className="verified-soc-layout">
        <section className="verified-soc-card" aria-labelledby="verified-soc-start">
          <h2 id="verified-soc-start">حالة التقييم</h2>
          <p>لن نستخدم نتائج المناوبات المجانية السابقة لإصدار درجات موثقة. هذا تقييم جديد مستقل ولا يغيّر XP أو تقدمك أو سجلات CyberTrace الحالية.</p>
          <div className="verified-soc-facts">
            <span>جلسة خادمية تستخدم مرة واحدة</span>
            <span>هوية BLACKBOX موثقة</span>
            <span>100 نقطة — دون نقاط XP</span>
          </div>

          {!verifiedSocConfigured ? <div className="verified-soc-notice" role="status">
            لم يتم إعداد App Check وتفعيل التحدي الخادمي في الإنتاج بعد. لذلك لا يوجد زر بدء فعّال أو درجة موثقة معروضة. يمكنك مواصلة التدريب المجاني الآن.
          </div> : !uid ? <div className="verified-soc-notice">
            <p>يلزم ربط حساب BLACKBOX قبل فتح جلسة موثقة. لا نربط حساب Firebase في CyberTrace بالبريد الإلكتروني تلقائيًا.</p>
            <button type="button" className="verified-soc-primary" onClick={openLink}>اربط حساب BLACKBOX</button>
          </div> : !run ? <div className="verified-soc-notice">
            <p>حساب BLACKBOX متصل. يُسمح ببدء التقييم فقط إذا نشر المشرف التحدي ومفتاح التصحيح الخاص على الخادم.</p>
            <button type="button" className="verified-soc-primary" disabled={busy} onClick={start}>{busy ? "جارٍ طلب جلسة..." : "طلب جلسة تقييم خادمية"}</button>
          </div> : null}

          {challenge && <div className="verified-soc-challenge">
            <div className="verified-soc-challenge-head">
              <strong>{challenge.title}</strong>
              <span>{challenge.id} · الإصدار {challenge.version}</span>
            </div>
            <p>{challenge.description}</p>
            <p className="verified-soc-session-note">تُستخدم جلسة التقييم مرة واحدة وتنتهي خلال 20 دقيقة. لا تُحتسب درجة محلية عند فقد الاتصال بالخادم.</p>
            {challenge.alerts.map(alert => <fieldset key={alert.id} className="verified-soc-alert" disabled={Boolean(result) || busy}>
              <legend>{alert.id} — {alert.title}</legend>
              <p>{alert.description}</p>
              <div className="verified-soc-evidence" role="region" tabIndex={0} aria-label={"سجلات " + alert.id}>
                {alert.evidence.map((entry,index) => <code dir="ltr" key={index}>{entry}</code>)}
              </div>
              <strong>تقدير الأولوية</strong>
              <div className="verified-soc-options">
                {challenge.priorityChoices.map(option => <label key={option.id}>
                  <input type="radio" name={"priority-" + alert.id} checked={answers[alert.id]?.priorityId === option.id} onChange={() => changeAnswer(alert.id,"priorityId",option.id)} />
                  <span>{option.label}</span>
                </label>)}
              </div>
              <strong>الإجراء الأنسب</strong>
              <div className="verified-soc-options">
                {alert.actions.map(option => <label key={option.id}>
                  <input type="radio" name={"action-" + alert.id} checked={answers[alert.id]?.actionId === option.id} onChange={() => changeAnswer(alert.id,"actionId",option.id)} />
                  <span>{option.label}</span>
                </label>)}
              </div>
            </fieldset>)}
            <fieldset className="verified-soc-alert" disabled={Boolean(result) || busy}>
              <legend>التحليل الختامي للارتباط</legend>
              <p>ما الاستنتاج الذي تدعمه السجلات؟</p>
              <div className="verified-soc-options">
                {challenge.correlations.map(option => <label key={option.id}>
                  <input type="radio" name="verified-soc-correlation" checked={linkChoice === option.id} onChange={() => setLinkChoice(option.id)} />
                  <span>{option.label}</span>
                </label>)}
              </div>
            </fieldset>
            {!result && <button type="button" className="verified-soc-primary" disabled={busy || !allAnswered} onClick={submit}>
              {busy ? "جارٍ التحقق من الإجابات..." : "إرسال الإجابات للتقييم الخادمي"}
            </button>}
          </div>}

          {result && <section className="verified-soc-result" aria-label="النتيجة المحتسبة على الخادم">
            <strong>نتيجة احتسبها خادم BLACKBOX</strong>
            <div className="verified-soc-score">{result.score} / {result.maxScore}</div>
            <p>الأولويات: {result.priorityScore}/32 · الاستجابة: {result.responseScore}/48 · ربط الأحداث: {result.correlationScore}/20</p>
            <p>أفضل نتيجة محفوظة على الخادم: {result.bestScore}/100. هذه نتيجة جلسة تدريبية موثقة من خدمة التصحيح، وليست شهادة مهنية.</p>
            <button type="button" onClick={() => { setRun(null); setResult(null); setAnswers({}); setLinkChoice(""); }}>العودة لبدء محاولة جديدة</button>
          </section>}

          <p className="verified-soc-message" role="status" aria-live="polite">{message}</p>
        </section>

        <aside className="verified-soc-side">
          <h2>لماذا لا نكتفي بالدرجات القديمة؟</h2>
          <p>مفاتيح إجابات المناوبات المجانية موجودة في JavaScript بالمتصفح. إرسال درجتها إلى الخادم لا يجعلها صحيحة أو غير قابلة للتلاعب.</p>
          <p>المحرك الجديد يتطلب توثيق الحساب، وجلسة محددة المدة، ومفتاح تصحيح غير متاح للمتصفح، وكتابة النتيجة بمعاملة آمنة.</p>
          <h3>ما المتاح الآن؟</h3>
          <button type="button" onClick={onSoc}>ابدأ مناوبات SOC المجانية ←</button>
          <small>لا يتطلب التدريب المجاني حسابًا مدفوعًا، ولا يتأثر بتفعيل هذا المحرك لاحقًا.</small>
        </aside>
      </div>
    </main>
  </div>;
}
