import { useEffect, useRef } from "react";
import HomeNavbar from "./HomeNavbar";
import SpotlightPreview from "./SpotlightPreview";
import AppNavigation from "./AppNavigation";
import { trackEvent } from "../utils/analytics";
import { getBlackBoxLearningLink } from "../utils/routes";
import "./SiteShell.css";

const PAGE_LABELS = Object.freeze({
  library: "مكتبة التحقيقات", journeys: "المسارات المشتركة", soc: "مناوبات SOC",
  "verified-soc": "التقييم الخادمي", certificates: "شهاداتي",
  "verify-certificate": "التحقق من شهادة", "joint-certificate": "نموذج الشهادة المشتركة",
  settings: "إعدادات العرض", auth: "الحساب", admin: "الإدارة", pro: "Suite Pro",
});

// Shared presentation only. Route ownership, authentication and results stay in App.
export default function SiteShell({ view, children, ...navigation }) {
  const content = useRef(null);
  const focusMode = view === "investigation";
  const currentLabel = Object.hasOwn(PAGE_LABELS, view) ? PAGE_LABELS[view] : "مساحة التدريب";
  useEffect(() => {
    // Route changes restore a useful focus target after a navigation menu closes.
    // Appearance, account and background result updates must not steal focus.
    content.current?.focus({ preventScroll: true });
  }, [view]);
  return <div className="ct-site-shell" data-ct-view={view} data-app-navigation={!focusMode || undefined} data-focus-mode={focusMode || undefined} dir="rtl">
    <a className="ct-skip-link" href="#ct-page-content">تجاوز إلى محتوى الصفحة</a>
    {!focusMode && <HomeNavbar {...navigation} active={view} />}
    {!focusMode && <AppNavigation {...navigation} view={view} />}
    {!focusMode && view !== "home" && <nav className="ct-page-breadcrumb" aria-label="مسار الصفحة">
      <button type="button" onClick={navigation.onHome}>الرئيسية</button><span aria-hidden="true">/</span>
      {["verify-certificate", "joint-certificate"].includes(view) && <><button type="button" onClick={navigation.onCertificates}>شهاداتي</button><span aria-hidden="true">/</span></>}
      {view === "verified-soc" && <><button type="button" onClick={navigation.onSoc}>مناوبات SOC</button><span aria-hidden="true">/</span></>}
      <span aria-current="page">{currentLabel}</span>
    </nav>}
    <div id="ct-page-content" className="ct-page-content" data-route={view} key={view} tabIndex={-1} ref={content}>{children}</div>
    {!focusMode && <footer className="ct-site-footer"><strong>CyberTrace</strong><span>تعلّم. حلّل. اتخذ القرار.</span><a href={getBlackBoxLearningLink().url} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent("partner_click", { destination: "blackbox", context: view })}>التدريب العملي في BLACKBOX ↗</a><small>مساحة تدريب على تحليل الحوادث الأمنية</small></footer>}
    {!focusMode && <SpotlightPreview view={view} />}
  </div>;
}
