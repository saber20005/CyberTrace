import { useState } from "react";
import { getCaseResults } from "../utils/caseProgress";
import { getCaseDetails } from "../data/caseCatalog";
import { buildCaseDrafts, validLearnerName, DRAFT_NOTICE } from "../utils/certificateDrafts";
import logo from "../assets/logo.svg";
import "./Certificates.css";

export default function Certificates({ cases, onHome, onLibrary, onPro }) {
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
          <div className="ct-cert-upcoming"><h3>الشهادة المشتركة والموثقة</h3><p>قيد التطوير. تتطلب تقييمًا خادميًا وإصدارًا يمكن التحقق منه؛ لا تُمنح بناءً على XP.</p></div>
        </section>
        <section className="ct-cert-display" aria-label="معاينة إفادة التدريب">
          <h2 className="ct-cert-screen">المعاينة</h2>
          {ready ? <article className="ct-cert-paper">
            <span className="ct-cert-monogram" aria-hidden="true">CT</span>
            <p className="ct-cert-brand">CYBERTRACE</p>
            <p className="ct-cert-eng">TRAINING COMPLETION RECORD</p>
            <h2>إفادة إتمام تدريب</h2>
            <p>سجل شخصي لإكمال نشاط تدريبي مسجل داخل المنصة</p>
            <strong className="ct-cert-name">{name.trim()}</strong>
            <p>أنهى التحقيق التدريبي التالي:</p>
            <h3>{getCaseDetails(caseData).title}</h3>
            <p className="ct-cert-detail">رقم التحقيق: {chosen.id} · أفضل نتيجة مسجلة: {chosen.score} / 70</p>
            <p className="ct-cert-detail">تاريخ الإنجاز المسجّل: {date}</p>
            <p className="ct-cert-disclaimer">{DRAFT_NOTICE}<br />لا رقم شهادة · لا رمز QR · لا توقيع رقمي</p>
          </article> : <div className="ct-cert-empty ct-cert-screen">اختر تحقيقًا مكتملًا، ثم أدخل اسمك لمعاينة الإفادة.</div>}
        </section>
      </div>
    </main>
  </div>;
}
