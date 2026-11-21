import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import logo from "../assets/logo.svg";
import blackBoxLogo from "../assets/joint-blackbox-cube.svg";
import "./JointCertificatePreview.css";

// Approved reference visual. This is a DESIGN MOCKUP, not an issued certificate:
// no reads/writes of progress, ownership, scoring, identities, issuance or verification.
export default function JointCertificatePreview({ onCertificates, onHome }) {
  const [sampleName, setSampleName] = useState("");
  const displayName = sampleName.trim() || "اسم المتدرّب";
  const viewportRef = useRef(null);
  const folioRef = useRef(null);
  const stageRef = useRef(null);
  const closeButtonRef = useRef(null);
  const openButtonRef = useRef(null);
  const [immersive, setImmersive] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const closeImmersive = useCallback(() => {
    setImmersive(false);
    setZoomed(false);
    openButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!immersive) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const onKeyDown = event => {
      if (event.key === "Escape") closeImmersive();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [immersive, closeImmersive]);
  const [display, setDisplay] = useState({ scale: 1, height: 730 });

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const folio = folioRef.current;
    if (!viewport || !folio) return undefined;
    const measure = () => {
      const availableHeight = immersive ? (stageRef.current?.clientHeight || folio.offsetHeight) : folio.offsetHeight;
      const scale = zoomed ? 1 : Math.min(1, (viewport.clientWidth || 1120) / 1120,
        availableHeight / folio.offsetHeight);
      const height = Math.ceil(folio.offsetHeight * scale);
      setDisplay(previous => previous.scale === scale && previous.height === height
        ? previous : { scale, height });
    };
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    observer?.observe(viewport);
    observer?.observe(folio);
    if (stageRef.current) observer?.observe(stageRef.current);
    window.addEventListener("resize", measure);
    measure();
    return () => { observer?.disconnect(); window.removeEventListener("resize", measure); };
  }, [zoomed, sampleName, immersive]);

  return <div className="joint-preview-page" dir="rtl">
    <header className="joint-page-nav">
      <button type="button" onClick={onCertificates}>العودة إلى مركز الشهادات</button>
      <button type="button" onClick={onHome}>الرئيسية</button>
    </header>
    <main className="joint-preview-main">
      <section className="joint-preview-intro" aria-labelledby="joint-title">
        <span className="joint-kicker" dir="ltr">BLACKBOX LAB × CYBERTRACE / JOINT PATHWAY</span>
        <h1 id="joint-title">معاينة الشهادة المشتركة</h1>
        <p>التصميم المعتمد لـ BLACKBOX × CyberTrace، بدون إصدار أو توثيق فعلي.</p>
        <label className="joint-sample-label" htmlFor="joint-sample-name">جرّب عرض اسم على النموذج
          <input id="joint-sample-name" type="text" maxLength={70} autoComplete="off"
            value={sampleName} onChange={event => setSampleName(event.target.value)}
            placeholder="اسم المتدرّب (اختياري)" />
        </label>
        <p className="joint-release-status" role="note"><strong>غير صادرة.</strong> الاسم تجريبي ولا يُحفظ، ولا توجد نتائج موثقة لهذه المعاينة.</p>
      </section>
      <div className="joint-preview-controls">
        <p>الشهادة أفقية. للقراءة افتح العرض الكبير أو أدر هاتفك أفقيًا.</p>
        <div className="joint-preview-actions">
          <button ref={openButtonRef} className="joint-fullscreen-action" type="button"
            onClick={() => { setImmersive(true); setZoomed(false); }}>
            عرض الشهادة بملء الشاشة
          </button>
          <button type="button" aria-pressed={zoomed} onClick={() => setZoomed(value => !value)}>
            {zoomed ? "إظهار الشهادة كاملة" : "تكبير لقراءة التفاصيل"}
          </button>
        </div>
      </div>

      <div className={`joint-presentation-shell${immersive ? " is-immersive" : ""}`}
        role={immersive ? "dialog" : undefined} aria-modal={immersive || undefined}
        aria-label={immersive ? "عرض كبير للشهادة المشتركة" : undefined}>
        {immersive && <div className="joint-immersive-toolbar">
          <button ref={closeButtonRef} type="button" onClick={closeImmersive}
            aria-label="إغلاق العرض الكبير">إغلاق ✕</button>
          <span>أدر هاتفك أفقيًا للقراءة المريحة</span>
          <button type="button" aria-pressed={zoomed} onClick={() => setZoomed(value => !value)}>
            {zoomed ? "احتواء الصورة" : "تكبير"}
          </button>
        </div>}
        <div className="joint-presentation-stage" ref={stageRef}>
      <div ref={viewportRef} className={`joint-folio-viewport${zoomed ? " is-zoomed" : ""}`}
        style={{ height: `${display.height}px`, "--joint-fit-scale": display.scale }}
        role="region"
        aria-label={zoomed ? "الشهادة المشتركة بالحجم الكامل: حرّكها أفقيًا لقراءة التفاصيل" : "الشهادة المشتركة بالحجم الملائم للشاشة"}
        tabIndex={zoomed ? 0 : undefined}>
      <section ref={folioRef} className="joint-folio" aria-label="النموذج البصري للشهادة المشتركة غير الصادرة">
        <div className="joint-folio-frame" aria-hidden="true"></div>
        <div className="joint-folio-topline" aria-hidden="true"><span></span><span></span></div>
        <header className="joint-brand-bar">
          <div className="joint-brand joint-brand-bb">
            <img src={blackBoxLogo} alt="" />
            <div><strong>BLACK<span>BOX</span></strong><small>LAB / PENETRATION TESTING</small></div>
          </div>
          <div className="joint-crest" aria-label="وسام الشهادة المشتركة">
            <div className="joint-crest-laurel joint-crest-laurel-left" aria-hidden="true">❧</div>
            <div className="joint-seal" aria-label="شعار BLACKBOX وشعار CyberTrace معًا">
              <img src={blackBoxLogo} alt="BLACKBOX" /><b aria-hidden="true">×</b><img src={logo} alt="CyberTrace" />
            </div>
            <div className="joint-crest-laurel joint-crest-laurel-right" aria-hidden="true">❧</div>
            <span className="joint-crest-ribbon" dir="ltr">JOINT CERTIFICATION</span>
          </div>
          <div className="joint-brand joint-brand-ct">
            <img src={logo} alt="" />
            <div><strong>Cyber<span>Trace</span></strong><small>INVESTIGATION & INCIDENT RESPONSE</small></div>
          </div>
        </header>

        <div className="joint-folio-body">
          <h2>الشهادة المشتركة للتدريب والتحقيق</h2>
          <p className="joint-en-title" dir="ltr">JOINT TRAINING ACHIEVEMENT CERTIFICATE</p>
          <div className="joint-stars" aria-hidden="true"><span></span>✦ ★ ✦<span></span></div>
          <p className="joint-honoree-label">معاينة تصميمية باسم تجريبي — لا تمثل إثبات إنجاز</p>
          <div className="joint-honoree-placeholder"><span>{displayName}</span></div>
          <p className="joint-description">تصوّر للشهادة التي ستجمع مستقبلًا استكمال المسارات العملية في مختبر BLACKBOX والتحقيقات الأمنية في CyberTrace، بعد اجتياز تقييمات خادمية موثوقة.</p>

          <div className="joint-pillars" aria-label="المكوّنان المطلوبان للشهادة مستقبلًا">
            <div className="joint-pillar-bb">
              <span className="joint-pillar-icon"><img src={blackBoxLogo} alt="" /></span>
              <div><strong>مسارات BLACKBOX</strong><small>تقييم خادمي مطلوب · لا نتائج مؤهلة معروضة</small></div>
            </div>
            <div className="joint-pillar-ct">
              <span className="joint-pillar-icon"><img src={logo} alt="" /></span>
              <div><strong>تحقيقات CyberTrace</strong><small>تقييم خادمي مطلوب · لا نتائج مؤهلة معروضة</small></div>
            </div>
          </div>
          <div className="joint-reference-fields" aria-label="حقول الشهادة المستقبلية">
            <div><span>نوع الشهادة</span><strong>مشتركة — معاينة</strong></div>
            <div><span>تاريخ الإصدار</span><strong>—</strong></div>
            <div><span>حالة الشهادة:</span><strong>غير صادرة</strong></div>
            <div><span>رقم الشهادة:</span><strong>غير متاح</strong></div>
          </div>
        </div>
        <footer className="joint-folio-footer" role="note">
          <strong>نموذج تصميم غير صادر • غير صالح للتحقق أو إثبات المهارة</strong>
          <span>لا توقيع رقمي · لا رقم تحقق · لا رمز QR · لا اعتماد مهني خارجي</span>
        </footer>
        <div className="joint-watermark" aria-hidden="true">نموذج غير صادر</div>
      </section>
        </div>
      </div>
      </div>
      <details className="joint-preview-postnote">
        <summary>ما شروط إصدار الشهادة الفعلية؟</summary>
        <p>توثيق ملكية الحسابين، وتقييم نتائج التدريب على الخادم، ثم توفير سجل إصدار قابل للإلغاء والتحقق بموافقة المستخدم. لا تكفي نتائج المتصفح أو نقاط XP وحدها.</p>
      </details>
    </main>
  </div>;
}
