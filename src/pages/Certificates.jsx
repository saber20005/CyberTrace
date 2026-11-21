import { useState } from "react";
import { getCaseResults } from "../utils/caseProgress";
import { getCaseDetails } from "../data/caseCatalog";
import { buildCaseDrafts, validLearnerName, DRAFT_NOTICE } from "../utils/certificateDrafts";
import logo from "../assets/logo.svg";
import "./Certificates.css";

export default function Certificates({ cases, onHome, onLibrary, onPro, onJointPreview }) {
  const [name, setName] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const drafts = buildCaseDrafts(cases, getCaseResults());
  const chosen = drafts.find(item => item.id === selectedId);
  const caseData = cases.find(item => item.id === chosen?.id);
  const ready = Boolean(chosen && caseData && validLearnerName(name));
  const date = chosen ? new Intl.DateTimeFormat("ar", { dateStyle: "long" }).format(new Date(chosen.at)) : "";

  return <div className="ct-certificate-page" dir="rtl">
    <header className="ct-cert-nav ct-cert-screen">
      <button type="button" onClick={onHome}><img src={logo} alt="" /> CyberTrace</button>
      <nav aria-label="التنقل من الشهادات">
        <button type="button" onClick={onLibrary}>مكتبة التحقيقات</button>
        <button type="button" onClick={onPro}>الخطة الموحدة</button>
      </nav>
    </header>
    <main className="ct-cert-main">
      <section className="ct-cert-intro ct-cert-screen">
        <span className="ct-cert-eyebrow">CYBERTRACE / CERTIFICATE CENTER</span>
        <h1>مركز الشهادات</h1>
        <p>استعرض تحقيقاتك المكتملة واطبع إفادة إتمام تدريب قابلة للحفظ بصيغة PDF. هذه المرحلة ليست نظام شهادات موثقة.</p>
        <p className="ct-cert-warning" role="note">{DRAFT_NOTICE}</p>
      </section>
      <div className="ct-cert-layout">
        <section className="ct-cert-controls ct-cert-screen" aria-label="خيارات الإفادة">
          <h2>إفادات الإتمام</h2>
          <p>التحقيقات ذات نتيجة مكتملة مسجلة: <strong>{drafts.length}</strong></p>
          {drafts.length ? <label>اختر التحقيق
            <select value={selectedId} onChange={event => setSelectedId(event.target.value)}>
              <option value="">— اختر تحقيقًا —</option>
              {drafts.map(item => <option key={item.id} value={item.id}>
                {getCaseDetails(cases.find(c => c.id === item.id)).title} — {item.id}
              </option>)}
            </select>
          </label> : <p role="status">لا توجد نتائج مكتملة مسجلة هنا. أكمل تحقيقًا أولًا؛ إنجازات المشاهدة القديمة وحدها لا تؤهل لإفادة إتمام.</p>}
          <label>الاسم للطباعة فقط
            <input type="text" autoComplete="name" maxLength={70} value={name} onChange={event => setName(event.target.value)} placeholder="اسم المتدرّب" />
          </label>
          <p className="ct-cert-small">لن يُحفظ هذا الاسم في المنصة أو يُرسل إلى الخادم.</p>
          <button type="button" className="ct-cert-action" disabled={!ready} onClick={() => { if (ready) window.print(); }}>طباعة / حفظ PDF</button>
          <p className="ct-cert-small">في نافذة الطباعة اختر «حفظ بتنسيق PDF» إذا كان متصفحك يدعم ذلك.</p>
          <div className="ct-cert-upcoming"><h3>الشهادة المشتركة والموثقة</h3><p>قيد التطوير. تتطلب تقييمًا خادميًا وإصدارًا يمكن التحقق منه؛ لا تُمنح بناءً على XP.</p><button type="button" className="ct-cert-joint-preview-link" onClick={onJointPreview}>معاينة التصميم المشترك ←</button></div>
        </section>
        <section className="ct-cert-display" aria-label="معاينة إفادة التدريب">
          <h2 className="ct-cert-screen">المعاينة</h2>
          {ready ? <article className="ct-cert-paper" aria-label="إفادة إتمام تحقيق تدريبي من CyberTrace">
            <div className="ct-cert-paper-heading">
              <div className="ct-cert-paper-brand">
                <img className="ct-cert-logo" src={logo} alt="" />
                <div><strong>CYBERTRACE</strong><span>INCIDENT INVESTIGATION LAB</span></div>
              </div>
              <span className="ct-cert-series" dir="ltr">TRAINING RECORD / CT</span>
            </div>
            <div className="ct-cert-paper-body">
              <div className="ct-cert-emblem" aria-hidden="true"><img src={logo} alt="" /></div>
              <p className="ct-cert-eng" dir="ltr">CERTIFICATE OF TRAINING COMPLETION</p>
              <h2>إفادة إتمام تدريب</h2>
              <p className="ct-cert-lead">إفادة تعليمية لإكمال تحقيق في تحليل الحوادث الأمنية</p>
              <span className="ct-cert-name-label">اسم المتدرّب</span>
              <strong className="ct-cert-name">{name.trim()}</strong>
              <span className="ct-cert-section-label">التحقيق المُنجَز</span>
              <h3>{getCaseDetails(caseData).title}</h3>
              <div className="ct-cert-facts">
                <div><span>معرّف التحقيق</span><strong dir="ltr">{chosen.id}</strong></div>
                <div><span>أفضل نتيجة مسجّلة</span><strong dir="ltr">{chosen.score} / 70</strong></div>
                <div><span>تاريخ الإنجاز المسجّل</span><strong>{date}</strong></div>
              </div>
            </div>
            <div className="ct-cert-disclaimer" role="note"><strong>إفادة تعليمية غير موثّقة</strong><p>{DRAFT_NOTICE}</p><small>لا رقم شهادة · لا رمز QR · لا توقيع رقمي</small></div>
          </article> : <div className="ct-cert-empty ct-cert-screen">اختر تحقيقًا مكتملًا، ثم أدخل اسمك لمعاينة الإفادة.</div>}
        </section>
      </div>
    </main>
  </div>;
}
