import { useRef } from "react";
import "./QuickDock.css";

// Navigation only: no Firebase requests, progress updates or access control.
export default function QuickDock({ onHome, onLibrary, onSoc, onCertificates, active = "home" }) {
  const details = useRef(null);
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
