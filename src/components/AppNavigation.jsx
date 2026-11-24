import { useEffect, useRef, useState } from "react";
import { CASES } from "../data/cases";
import { CATEGORIES, getCaseDetails } from "../data/caseCatalog";
import "./AppNavigation.css";

function Icon({ name, ...props }) {
  const paths = {
    home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v12h5v-7h4v7h5V9"/></>,
    library: <><rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>,
    soc: <><path d="M12 3 3 7v5c0 5 9 9 9 9s9-4 9-9V7Z"/><path d="m8 12 3 3 5-6"/></>,
    certificates: <><circle cx="12" cy="9" r="6"/><path d="m8 14-1 8 5-3 5 3-1-8"/></>,
    close: <path d="m6 6 12 12M18 6 6 18"/>,
    arrow: <path d="M20 12H4m6-6-6 6 6 6"/>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name] || paths.library}</svg>;
}

const DESTINATIONS = [
  { view: "library", label: "مكتبة التحقيقات", description: "تصفّح الحالات واختر المهمة التالية", icon: "library" },
  { view: "journeys", label: "المسارات المشتركة", description: "رحلتك بين التحقيق والتدريب العملي", icon: "library" },
  { view: "soc", label: "مناوبات SOC", description: "ترتيب التنبيهات وتحليلها", icon: "soc" },
  { view: "certificates", label: "الشهادات", description: "إفادات إكمال التدريب وحالتها", icon: "certificates" },
  { view: "settings", label: "إعدادات العرض", description: "المظهر وحجم النص وتفضيلات القراءة", icon: "home" },
];

// Search is an ephemeral view over public learning content. It never indexes
// saved notes, identities, private results, or account/cloud data.
export default function AppNavigation({ view, onHome, onLibrary, onSoc, onCertificates, onSearchNavigate, onSearchCase }) {
  const dialog = useRef(null);
  const input = useRef(null);
  const opener = useRef(null);
  const bodyOverflow = useRef(null);
  const restoreOnClose = useRef(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const normalized = query.trim().toLocaleLowerCase("ar");
  const results = CASES.filter(item => {
    const details = getCaseDetails(item);
    return (category === "all" || details.category === category)
      && (!normalized || `${item.id} ${details.title} ${details.categoryLabel} ${item.brief}`.toLocaleLowerCase("ar").includes(normalized));
  });
  const destinations = category === "all" ? DESTINATIONS.filter(item => !normalized || `${item.label} ${item.description}`.includes(normalized)) : [];
  const releaseScroll = () => {
    if (bodyOverflow.current !== null) document.body.style.setProperty("overflow", bodyOverflow.current);
    bodyOverflow.current = null;
  };
  const close = () => dialog.current?.close();
  const finishClose = () => {
    if (dialog.current?.open) return;
    releaseScroll();
    const target = opener.current;
    if (restoreOnClose.current && target?.isConnected) target.focus({ preventScroll: true });
    else if (target === document.activeElement) {
      // The browser may restore its native dialog opener after the router's
      // commit. Only replace that stale focus; never interrupt a new input.
      document.getElementById("ct-page-content")?.focus({ preventScroll: true });
    }
  };
  const open = event => {
    if (!dialog.current || dialog.current.open) return;
    opener.current = event.currentTarget;
    restoreOnClose.current = true;
    setQuery(""); setCategory("all");
    bodyOverflow.current = document.body.style.overflow;
    document.body.style.setProperty("overflow", "hidden");
    dialog.current.showModal();
    input.current?.focus({ preventScroll: true });
  };
  const choose = action => {
    // Close synchronously before invoking the existing router. Navigation owns
    // focus after a selection; Escape/Close keep the source route unchanged.
    restoreOnClose.current = false;
    dialog.current?.close(); releaseScroll();
    action?.();
  };
  useEffect(() => {
    const historyChanged = () => {
      if (!dialog.current?.open) return;
      restoreOnClose.current = false;
      dialog.current.close();
      if (bodyOverflow.current !== null) document.body.style.setProperty("overflow", bodyOverflow.current);
      bodyOverflow.current = null;
    };
    // Close before App's history router commits: an open native dialog would
    // otherwise block its new focus target and restore focus to the old opener.
    window.addEventListener("popstate", historyChanged, true);
    return () => {
      window.removeEventListener("popstate", historyChanged, true);
      if (bodyOverflow.current !== null) document.body.style.setProperty("overflow", bodyOverflow.current);
    };
  }, []);
  const links = [
    { view: "home", label: "الرئيسية", icon: "home", action: onHome },
    { view: "library", label: "التحقيقات", icon: "library", action: onLibrary },
    { view: "search", label: "البحث", icon: "search" },
    { view: "soc", label: "مناوبات SOC", shortLabel: "SOC", icon: "soc", action: onSoc },
    { view: "certificates", label: "الشهادات", icon: "certificates", action: onCertificates },
  ];
  return <>
    {["home", "library"].includes(view) && <div className="ct-discovery-search">
      <button type="button" className="ct-discovery-search-open" onClick={open} aria-haspopup="dialog" aria-controls="ct-content-search">
        <span className="ct-discovery-search-icon"><Icon name="search"/></span>
        <span><strong>ما الذي تريد التحقيق فيه؟</strong><small>ابحث عن حالة، مهارة أو قسم</small></span>
        <span className="ct-discovery-search-arrow"><Icon name="arrow"/></span>
      </button>
    </div>}
    <nav className="ct-app-dock" aria-label="التنقل السريع في CyberTrace">
      {links.map(link => <button key={link.view} type="button" data-dock-view={link.view}
        className={link.view === "search" ? "ct-app-search-open" : undefined}
        aria-label={link.label} aria-current={view === link.view ? "page" : undefined}
        aria-haspopup={link.view === "search" ? "dialog" : undefined}
        aria-controls={link.view === "search" ? "ct-content-search" : undefined}
        onClick={event => { if (link.view === "search") open(event); else link.action?.(); }}>
        <span className="ct-dock-icon"><Icon name={link.icon}/></span><span className="ct-dock-label">{link.shortLabel || link.label}</span>
      </button>)}
    </nav>
    <dialog ref={dialog} id="ct-content-search" className="ct-search-dialog" aria-labelledby="ct-search-title" onClose={finishClose}
      onKeyDown={event => { if (event.key === "Escape" && !event.nativeEvent.isComposing) { event.preventDefault(); event.stopPropagation(); close(); } }}
      onClick={event => { if (event.target === event.currentTarget) { const rect=event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close(); } }}>
      <div className="ct-search-sheet" dir="rtl">
        <header className="ct-search-heading"><div><span>CYBERTRACE / EXPLORE</span><h2 id="ct-search-title">إلى أين تريد أن تنتقل؟</h2></div><button type="button" className="ct-search-close" aria-label="إغلاق البحث" onClick={close}><Icon name="close"/></button></header>
        <label className="ct-search-field"><Icon name="search"/><span className="ct-sr-only">ابحث في التحقيقات والأقسام</span><input ref={input} type="search" placeholder="اسم الحالة، رقمها، أو المهارة…" value={query} onChange={event => setQuery(event.target.value)} autoComplete="off" /></label>
        <div className="ct-search-categories" role="group" aria-label="تصفية حسب المجال"><button type="button" aria-pressed={category === "all"} onClick={() => setCategory("all")}>الكل</button>{CATEGORIES.map(item => <button type="button" key={item.id} aria-pressed={category === item.id} onClick={() => setCategory(item.id)}>{item.label}</button>)}</div>
        <div className="ct-search-results" tabIndex={-1}>
          <p className="ct-search-count" role="status" aria-live="polite">{normalized || category !== "all" ? `${results.length} تحقيقات · ${destinations.length} أقسام` : "اختر وجهتك، أو اكتشف حالة جديدة"}</p>
          {destinations.length > 0 && <section aria-label="أقسام المنصة" className="ct-search-destinations">{destinations.map(item => <button type="button" key={item.view} data-search-view={item.view} onClick={() => choose(() => onSearchNavigate(item.view))}><span className="ct-search-result-icon"><Icon name={item.icon}/></span><span><strong>{item.label}</strong><small>{item.description}</small></span><Icon name="arrow"/></button>)}</section>}
          <section aria-label="نتائج التحقيقات" className="ct-search-cases">{results.map(item => { const details = getCaseDetails(item); return <button type="button" key={item.id} data-search-case-id={item.id} onClick={() => choose(() => onSearchCase(item))}><span className="ct-search-case-mark"><Icon name="library"/></span><span><small dir="ltr">{item.id} · {details.difficultyLabel}</small><strong>{details.title}</strong><small>{details.categoryLabel}</small></span><Icon name="arrow"/></button>; })}</section>
          {results.length === 0 && destinations.length === 0 && <p className="ct-search-empty">لا توجد نتائج مطابقة. جرّب رقم القضية أو مجالًا آخر.</p>}
        </div>
        <p className="ct-search-note">تصفّح محتوى التدريب العام. ملاحظاتك ونتائج حسابك لا تدخل في البحث.</p>
      </div>
    </dialog>
  </>;
}
