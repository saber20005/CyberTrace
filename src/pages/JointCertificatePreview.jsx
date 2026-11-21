import logo from "../assets/logo.svg";
import blackBoxLogo from "../assets/blackbox-partner.svg";
import "./JointCertificatePreview.css";

// This is a design mockup only, deliberately isolated from user progress/auth,
// callable evaluators, issuance records and any PDF/verification service.
export default function JointCertificatePreview({ onCertificates, onHome }) {
  return <div className="joint-preview-page" dir="rtl">
    <header className="joint-page-nav">
      <button type="button" onClick={onCertificates}>العودة إلى مركز الشهادات</button>
      <button type="button" onClick={onHome}>الرئيسية</button>
    </header>
    <main className="joint-preview-main">
      <section className="joint-preview-intro" aria-labelledby="joint-title">
        <span className="joint-kicker" dir="ltr">CYBERTRACE × BLACKBOX / JOINT PATHWAY</span>
        <h1 id="joint-title">الشهادة المشتركة — معاينة التصميم</h1>
        <p>قالب ثالث مستقل يجمع الهوية الذهبية لـCyberTrace والهوية الزرقاء لـBLACKBOX. هذه معاينة للتصميم فقط، وليست شهادة صادرة أو إثباتًا لإنجاز مستخدم.</p>
        <p className="joint-release-status" role="note"><strong>الإصدار غير متاح حاليًا.</strong> لا توجد شهادة مشتركة موثّقة قبل تشغيل تقييم خادمي آمن والتحقق من إنجازات الحسابين.</p>
      </section>

      <section className="joint-folio" aria-label="النموذج البصري للشهادة المشتركة غير الصادرة">
        <div className="joint-folio-topline" aria-hidden="true"><span></span><span></span></div>
        <header className="joint-brand-bar">
          <div className="joint-brand joint-brand-ct"><img src={logo} alt="" /><div><strong>CYBERTRACE</strong><small>INCIDENT INVESTIGATION</small></div></div>
          <span className="joint-brand-bridge" aria-hidden="true">×</span>
          <div className="joint-brand joint-brand-bb"><img src={blackBoxLogo} alt="" /><div><strong>BLACKBOX <em>LAB</em></strong><small>HANDS-ON TRAINING</small></div></div>
        </header>

        <div className="joint-folio-body">
          <div className="joint-seal" aria-hidden="true"><span>CT</span><b>×</b><span>BB</span></div>
          <p className="joint-eyebrow" dir="ltr">INTEGRATED CYBERSECURITY TRAINING</p>
          <h2>الشهادة المشتركة</h2>
          <p className="joint-en-title" dir="ltr">JOINT TRAINING ACHIEVEMENT CERTIFICATE</p>
          <p className="joint-honoree-label">يُخصّص حقل الاسم بعد إصدار شهادة موثّقة</p>
          <div className="joint-honoree-placeholder">اسم المتدرّب بعد الاعتماد</div>
          <p className="joint-description">المسار المقترح يجمع تحليل الحوادث الأمنية في CyberTrace والتطبيق العملي داخل BLACKBOX.</p>
          <div className="joint-pillars" aria-label="المكوّنان المطلوبان للشهادة مستقبلًا">
            <div><span className="joint-pillar-accent gold"></span><strong>التحقيق والاستجابة</strong><small>CyberTrace / تقييم خادمي مطلوب</small></div>
            <div><span className="joint-pillar-accent blue"></span><strong>المهارات العملية</strong><small>BLACKBOX / تحقق خادمي مطلوب</small></div>
          </div>
          <div className="joint-reference-fields">
            <span>حالة الشهادة: <b>غير صادرة</b></span>
            <span>تاريخ الإصدار: <b>—</b></span>
            <span>رقم الشهادة: <b>غير متاح</b></span>
          </div>
        </div>
        <footer className="joint-folio-footer" role="note">
          <strong>نموذج تصميم غير صادر • غير صالح للتحقق أو إثبات المهارة</strong>
          <span>لا توقيع رقمي · لا رقم تحقق · لا رمز QR · لا اعتماد مهني خارجي</span>
        </footer>
        <div className="joint-watermark" aria-hidden="true">نموذج غير صادر</div>
      </section>

      <div className="joint-preview-postnote" role="note">
        <strong>متى نصدرها فعليًا؟</strong>
        <p>فقط بعد ربط الحسابين بهوية مثبتة، واجتياز تقييمات موثوقة لا يستطيع المتدرّب تعديل نتائجها، وحفظ سجل إصدار قابل للإلغاء والتحقق. لا تمنح XP أو المزامنة الحالية هذه الشهادة.</p>
      </div>
    </main>
  </div>;
}
