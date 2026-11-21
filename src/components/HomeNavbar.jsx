import { useEffect, useRef } from "react";
import XPBadge from "./XPBadge";
import BlackBoxAccountButton from "../blackbox/BlackBoxAccountButton";
import logo from "../assets/logo.svg";
import "./HomeNavbar.css";

// The visible home header is navigation only. Identity, training results and
// subscriptions remain controlled by their existing Firebase controllers.
export default function HomeNavbar({
  user, onHome, onLibrary, onSoc, onCertificates, onPro,
  onAuth, onLogout, onBlackBoxLink, blackBoxEnabled, blackBoxConnected,
}) {
  const more = useRef(null);
  const account = useRef(null);
  const closeMenus = () => {
    if (more.current) more.current.open = false;
    if (account.current) account.current.open = false;
  };
  const go = action => {
    closeMenus();
    action();
  };
  useEffect(() => {
    const onPointer = event => {
      if (!more.current?.contains(event.target) && !account.current?.contains(event.target)) closeMenus();
    };
    const onKey = event => {
      if (event.key === "Escape") closeMenus();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);
  const displayName = user?.displayName || user?.email?.split("@")[0] || "حسابي";
  const connect = () => go(onBlackBoxLink);
  return <nav className="navbar ct-home-navbar" aria-label="التنقل الرئيسي">
    <button type="button" className="logo logo-button" onClick={() => go(onHome)} aria-label="CyberTrace — الرئيسية">
      <img src={logo} alt="" className="logo-mark" />
      <span>CyberTrace</span>
    </button>
    <div className="nav-right ct-nav-actions">
      <button type="button" className="nav-library ct-primary-route" onClick={() => go(onLibrary)}>التحقيقات</button>
      <details className="ct-nav-dropdown ct-more" ref={more}>
        <summary aria-label="فتح قائمة المزيد من الأقسام" aria-haspopup="true">المزيد <span aria-hidden="true">⌄</span></summary>
        <div className="ct-nav-dropdown-panel" role="group" aria-label="أقسام CyberTrace">
          <button type="button" onClick={() => go(onSoc)}>مناوبات SOC</button>
          <button type="button" onClick={() => go(onCertificates)}>شهاداتي</button>
          <button type="button" className="ct-pro-link" onClick={() => go(onPro)}>Suite Pro <small>قريبًا</small></button>
          <a href="#about" onClick={closeMenus}>عن المنصة</a>
          <a href="#how" onClick={closeMenus}>كيف تعمل؟</a>
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
      <details className="ct-nav-dropdown ct-account-menu" ref={account}>
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
