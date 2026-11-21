import { useEffect, useRef } from "react";
import "./QuickDock.css";

// Navigation only: no Firebase requests, progress updates or access control.
export default function QuickDock({ onHome, onLibrary, onSoc, onCertificates, active = "home" }) {
  const details = useRef(null);
  useEffect(() => {
    // Do not leave the expanded menu covering content during navigation.
    const closeOutside = event => {
      if (details.current?.open && !details.current.contains(event.target)) details.current.open = false;
    };
    const closeOnEscape = event => {
      if (event.key !== "Escape" || !details.current?.open) return;
      details.current.open = false;
      details.current.querySelector("summary")?.focus();
    };
    const closeOnScroll = () => {
      if (details.current?.open) details.current.open = false;
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("scroll", closeOnScroll, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("scroll", closeOnScroll);
    };
  }, []);
  const links = [
    { key: "home", label: "الرئيسية", icon: "⌂", action: onHome },
    { key: "library", label: "التحقيقات", icon: "▦", action: onLibrary },
    { key: "soc", label: "مناوبات SOC", icon: "◉", action: onSoc },
    { key: "certificates", label: "الشهادات", icon: "▤", action: onCertificates },
  ];
  const visit = action => {
    if (details.current) details.current.open = false;
    action();
  };
  return <details className="ct-quick-dock" ref={details}>
    <summary aria-label="فتح شريط الاختصارات السريعة"><span aria-hidden="true">⌘</span> اختصارات</summary>
    <nav aria-label="اختصارات CyberTrace" className="ct-quick-dock-items">
      {links.map(link => <button key={link.key} type="button" title={link.label}
        aria-label={link.label} aria-current={active === link.key ? "page" : undefined}
        onClick={() => visit(link.action)}><span aria-hidden="true">{link.icon}</span><small>{link.label}</small></button>)}
    </nav>
  </details>;
}
