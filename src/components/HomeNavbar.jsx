import { useCallback, useEffect, useRef } from "react";
import XPBadge from "./XPBadge";
import BlackBoxAccountButton from "../blackbox/BlackBoxAccountButton";
import logo from "../assets/logo.svg";
import "./HomeNavbar.css";

// The visible home header is navigation only. Identity, training results and
// subscriptions remain controlled by their existing Firebase controllers.
export default function HomeNavbar({
  user, onHome, onLibrary, onSoc, onCertificates, onPro, onJourneys, active = "home",
  onAuth, onLogout, onSettings, onTour, onBlackBoxLink, blackBoxEnabled, blackBoxConnected,
}) {
  const more = useRef(null);
  const account = useRef(null);
  const closeMenus = useCallback((restoreFocus = false) => {
    const opened = [more.current, account.current].find(menu => menu?.open);
    if (more.current) more.current.open = false;
    if (account.current) account.current.open = false;
    if (restoreFocus) opened?.querySelector("summary")?.focus();
  }, []);
  const go = action => {
    closeMenus(true);
    if (typeof action === "function") action();
  };
  useEffect(() => {
    const onPointer = event => {
      if (document.querySelector("dialog[open]")) return;
      if (!more.current?.contains(event.target) && !account.current?.contains(event.target)) closeMenus();
    };
    const onKey = event => {
      if (event.key === "Escape" && !document.querySelector("dialog[open]")) closeMenus(true);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [closeMenus]);
  const displayName = user?.displayName || user?.email?.split("@")[0] || "حسابي";
  // Keep the opener visible behind the native dialog for focus restoration.
  const connect = () => { if (typeof onBlackBoxLink === "function") onBlackBoxLink(); };
  return <nav className="navbar ct-home-navbar" aria-label="التنقل الرئيسي">
    <button type="button" className="logo logo-button" onClick={() => go(onHome)} aria-label="CyberTrace — الرئيسية">
      <img src={logo} alt="" className="logo-mark" />
      <span>CyberTrace</span>
    </button>
    <div className="nav-right ct-nav-actions">
      <button type="button" className="nav-library ct-primary-route" aria-current={active === "library" ? "page" : undefined} onClick={() => go(onLibrary)}>التحقيقات</button>
      <details className="ct-nav-dropdown ct-more" ref={more} data-active={["journeys", "soc", "certificates", "settings", "pro", "verified-soc", "verify-certificate", "joint-certificate"].includes(active) || undefined} onToggle={() => { if (more.current?.open && account.current) account.current.open = false; }}>
        <summary aria-label="فتح قائمة المزيد من الأقسام" aria-haspopup="true">المزيد <span aria-hidden="true">⌄</span></summary>
        <div className="ct-nav-dropdown-panel" role="group" aria-label="أقسام CyberTrace">
          <button type="button" aria-current={active === "journeys" ? "page" : undefined} onClick={() => go(onJourneys)}>المسارات المشتركة</button>
          <button type="button" data-ct-spotlight="soc" aria-current={active === "soc" ? "page" : undefined} onClick={() => go(onSoc)}>مناوبات SOC</button>
          <button type="button" aria-current={active === "certificates" ? "page" : undefined} onClick={() => go(onCertificates)}>شهاداتي</button>
          <button type="button" aria-current={active === "settings" ? "page" : undefined} onClick={() => go(onSettings)}>إعدادات العرض</button>
          <button type="button" onClick={() => go(onTour)}>الدليل التفاعلي للمستخدم الجديد</button>
          <button type="button" className="ct-pro-link" onClick={() => go(onPro)}>Suite Pro <small>قريبًا</small></button>
          {active === "home" && <><a href="#about" onClick={() => closeMenus(true)}>عن المنصة</a>
          <a href="#how" onClick={() => closeMenus(true)}>كيف تعمل؟</a></>}
          <div className="ct-mobile-account">
            <div className="ct-menu-divider" aria-hidden="true" />
            {user ? <>
              <span className="ct-user-label" title={displayName}>حساب: {displayName}</span>
              <XPBadge />
              <button type="button" className="ct-signout" onClick={() => go(onLogout)}>تسجيل الخروج</button>
            </> : <button type="button" onClick={() => go(onAuth)}>تسجيل الدخول</button>}
            {blackBoxEnabled && <button type="button" onClick={connect}>
              {blackBoxConnected ? "إدارة ربط BLACKBOX" : "ربط حساب BLACKBOX"}
            </button>}
          </div>
        </div>
      </details>
      <details className="ct-nav-dropdown ct-account-menu" ref={account} onToggle={() => { if (account.current?.open && more.current) more.current.open = false; }}>
        <summary aria-label={user ? "إدارة حساب CyberTrace" : "الحساب وتسجيل الدخول"}>
          <span aria-hidden="true">◯</span> <span>{user ? "حسابي" : "دخول"}</span>
        </summary>
        <div className="ct-nav-dropdown-panel ct-account-panel" role="group" aria-label="حساب المستخدم">
          {user ? <>
            <span className="ct-user-label" title={displayName}>{displayName}</span>
            <XPBadge />
            {blackBoxEnabled && <div className="ct-account-integration"><BlackBoxAccountButton /></div>}
            <button type="button" className="ct-signout" onClick={() => go(onLogout)}>تسجيل الخروج</button>
          </> : <>
            <button type="button" onClick={() => go(onAuth)}>تسجيل الدخول</button>
            {blackBoxEnabled && <div className="ct-account-integration"><BlackBoxAccountButton /></div>}
          </>}
        </div>
      </details>
    </div>
  </nav>;
}
