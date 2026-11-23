import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import approvedArt from "../assets/joint-certificate-approved.webp";
import blackBoxOriginal from "../assets/blackbox-original-brand.webp";
import cyberTraceOriginal from "../assets/cybertrace-original-brand.webp";
import "./JointCertificatePreview.css";

// Approved reference is displayed directly, not approximated with CSS.
// no reads/writes of progress, ownership, scoring, identities, issuance or verification.
export default function JointCertificatePreview({ embedded = false, onCertificates, onHome }) {
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
  const [display, setDisplay] = useState({ scale: 1, height: 747 });

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
    {!embedded && <header className="joint-page-nav">
      <button type="button" onClick={onCertificates}>العودة إلى مركز الشهادات</button>
      <button type="button" onClick={onHome}>الرئيسية</button>
    </header>}
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
      <section ref={folioRef} className="joint-folio joint-approved-template"
        aria-label="معاينة التصميم الأصلي للشهادة المشتركة دون إصدار أو توثيق">
        <img src={approvedArt} className="joint-approved-image" alt=""
          draggable="false" />
        {/* Exact original logos supplied by the owner. They replace the old cube
            and stylized fingerprint embedded in the approved unsigned artwork. */}
        <div className="joint-brand-swaps" aria-hidden="true">
          <span className="joint-brand-swap joint-swap-bb-header"><img src={blackBoxOriginal} alt="" /></span>
          <span className="joint-brand-swap joint-swap-ct-header"><img src={cyberTraceOriginal} alt="" /></span>
          <span className="joint-brand-swap joint-swap-bb-crest"><img src={blackBoxOriginal} alt="" /></span>
          <span className="joint-brand-swap joint-swap-ct-crest"><img src={cyberTraceOriginal} alt="" /></span>
          <span className="joint-brand-swap joint-swap-bb-milestone"><img src={blackBoxOriginal} alt="" /></span>
          <span className="joint-brand-swap joint-swap-ct-milestone"><img src={cyberTraceOriginal} alt="" /></span>
          <span className="joint-brand-swap joint-swap-bb-medallion"><img src={blackBoxOriginal} alt="" /></span>
          <span className="joint-brand-swap joint-swap-ct-medallion"><img src={cyberTraceOriginal} alt="" /></span>
        </div>
        <div className="joint-template-name" aria-label="الاسم التجريبي">
          <span>{displayName}</span>
        </div>
        <div className="joint-template-score joint-template-score-bb" aria-label="نتيجة BLACKBOX غير متحققة">— / —</div>
        <div className="joint-template-score joint-template-score-ct" aria-label="نتيجة CyberTrace غير متحققة">— / —</div>
        <div className="joint-template-qr-placeholder" role="note" aria-label="التحقق غير متاح">
          <span className="joint-lock-icon" aria-hidden="true">⌁</span>
          <strong>غير متاح</strong>
        </div>
        <span className="joint-template-qr-caption">التحقق غير متاح</span>
        <span className="joint-template-issued-number">غير صادر</span>
        <span className="joint-template-issued-date">—</span>
        <div className="joint-template-status" role="note">نموذج غير صادر</div>
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
