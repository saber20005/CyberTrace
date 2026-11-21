import { useLayoutEffect, useRef, useState } from "react";
import logo from "../assets/logo.svg";
import blackBoxLogo from "../assets/blackbox-partner.svg";
import "./JointCertificatePreview.css";

// A DESIGN PREVIEW ONLY. No assessment claims, progress reads, credentials,
// certificate issuance, cloud writes, registration, or verification links.
export default function JointCertificatePreview({ onCertificates, onHome }) {
  const [sampleName, setSampleName] = useState("");
  const displayName = sampleName.trim() || "اسم المتدرّب";
  const viewportRef = useRef(null);
  const folioRef = useRef(null);
  const [zoomed, setZoomed] = useState(false);
  const [display, setDisplay] = useState({ scale: 1, height: 740 });

  // Keep the certificate's desktop landscape composition on narrow screens.
  // Only the outside viewport scales; the document and its print layout do not reflow.
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const folio = folioRef.current;
    if (!viewport || !folio) return undefined;
    const measure = () => {
      const scale = zoomed ? 1 : Math.min(1, (viewport.clientWidth || 1120) / 1120);
      const height = Math.ceil(folio.offsetHeight * scale);
      setDisplay(previous => previous.scale === scale && previous.height === height
        ? previous : { scale, height });
    };
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    observer?.observe(viewport);
    observer?.observe(folio);
    window.addEventListener("resize", measure);
    measure();
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [zoomed, sampleName]);

  return <div className="joint-preview-page" dir="rtl">
    <header className="joint-page-nav">
      <button type="button" onClick={onCertificates}>العودة إلى مركز الشهادات</button>
      <button type="button" onClick={onHome}>الرئيسية</button>
    </header>

    <main className="joint-preview-main">
      <section className="joint-preview-intro" aria-labelledby="joint-title">
        <span className="joint-kicker" dir="ltr">BLACKBOX LAB × CYBERTRACE / JOINT PATHWAY</span>
        <h1 id="joint-title">الشهادة المشتركة — معاينة التصميم</h1>
        <p>الهوية المشتركة تجمع لون BLACKBOX الأزرق مع ذهب CyberTrace. هذه معاينة للشكل فقط، وليست شهادة مُصدَرة أو دليلًا على اجتياز أي تقييم.</p>
        <label className="joint-sample-label" htmlFor="joint-sample-name">
          جرّب عرض اسم على النموذج
          <input id="joint-sample-name" type="text" maxLength={70} autoComplete="off"
            value={sampleName} onChange={event => setSampleName(event.target.value)}
            placeholder="اسم المتدرّب (اختياري)" />
        </label>
        <p className="joint-privacy-note">الاسم للعرض المؤقت داخل المتصفح فقط؛ لا يُحفظ في الحساب ولا يُرسل للخادم.</p>
        <p className="joint-release-status" role="note"><strong>الإصدار غير متاح حاليًا.</strong> لا تُمنح شهادة مشتركة موثّقة قبل تشغيل تقييم خادمي آمن والتحقق من إنجازات الحسابين.</p>
      </section>

      <div className="joint-preview-controls">
        <p>عرض أفقي ثابت يحافظ على مقاسات الشهادة. على الهاتف يمكنك تكبيرها ثم تحريكها لقراءة التفاصيل.</p>
        <button type="button" aria-pressed={zoomed} onClick={() => setZoomed(value => !value)}>
          {zoomed ? "إظهار الشهادة كاملة" : "تكبير لقراءة التفاصيل"}
        </button>
      </div>
      <div
        ref={viewportRef}
        className={`joint-folio-viewport${zoomed ? " is-zoomed" : ""}`}
        style={{ height: `${display.height}px`, "--joint-fit-scale": display.scale }}
        role="region"
        aria-label={zoomed ? "الشهادة المشتركة بالحجم الكامل: حرّكها أفقيًا لقراءة التفاصيل" : "الشهادة المشتركة بالحجم الملائم للشاشة"}
        tabIndex={zoomed ? 0 : undefined}
      >
      <section ref={folioRef} className="joint-folio" aria-label="النموذج البصري للشهادة المشتركة غير الصادرة">
        <div className="joint-folio-frame" aria-hidden="true"></div>
        <div className="joint-folio-topline" aria-hidden="true"><span></span><span></span></div>
        <header className="joint-brand-bar">
          <div className="joint-brand joint-brand-bb">
            <img src={blackBoxLogo} alt="" />
            <div><strong>BLACKBOX <em>LAB</em></strong><small>HANDS-ON CYBERSECURITY TRAINING</small></div>
          </div>
          <span className="joint-brand-bridge" aria-hidden="true">×</span>
          <div className="joint-brand joint-brand-ct">
            <img src={logo} alt="" />
            <div><strong>CyberTrace</strong><small>DIGITAL FORENSICS & INVESTIGATION</small></div>
          </div>
        </header>

        <div className="joint-folio-body">
          <div className="joint-seal" aria-label="شعار BLACKBOX وشعار CyberTrace معًا">
            <img src={blackBoxLogo} alt="BLACKBOX" /><b aria-hidden="true">×</b><img src={logo} alt="CyberTrace" />
          </div>
          <p className="joint-eyebrow" dir="ltr">INTEGRATED CYBERSECURITY TRAINING</p>
          <h2>الشهادة المشتركة للتدريب والتحقيق</h2>
          <p className="joint-en-title" dir="ltr">JOINT TRAINING ACHIEVEMENT CERTIFICATE</p>
          <p className="joint-honoree-label">نموذج عرض باسم تجريبي لا يمثل إثبات إنجاز</p>
          <div className="joint-honoree-placeholder">{displayName}</div>
          <p className="joint-description">لتوضيح الشكل المستقبلي لشهادة تجمع بين التدريب العملي في BLACKBOX وتحليل الحوادث والتحقيق في CyberTrace، بعد اجتياز شروط التقييم الموثوق.</p>

          <div className="joint-pillars" aria-label="المكوّنان المطلوبان للشهادة مستقبلًا">
            <div className="joint-pillar-bb">
              <span className="joint-pillar-icon"><img src={blackBoxLogo} alt="" /></span>
              <strong>BLACKBOX Lab</strong>
              <span>مسارات المهارات العملية</span>
              <small>تقييم خادمي مطلوب · لم يُتحقق منه</small>
            </div>
            <div className="joint-pillar-ct">
              <span className="joint-pillar-icon"><img src={logo} alt="" /></span>
              <strong>CyberTrace</strong>
              <span>التحقيق والاستجابة للحوادث</span>
              <small>تقييم خادمي مطلوب · لم يُتحقق منه</small>
            </div>
          </div>
          <div className="joint-reference-fields" aria-label="حقول الشهادة المستقبلية">
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
      </div>
      <div className="joint-preview-postnote" role="note">
        <strong>متى نصدرها فعليًا؟</strong>
        <p>بعد توثيق ملكية الحسابين، والتحقق من إنجازات مصححة على الخادم، وتوفير سجل إصدار قابل للإلغاء والتحقق بموافقة المستخدم. نقاط XP والنتائج المحلية وحدها لا تصلح لإصدار شهادة موثّقة.</p>
      </div>
    </main>
  </div>;
}
