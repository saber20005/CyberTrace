import { useState } from "react";
import "./ShareLink.css";

function ShareLink({ url, label = "نسخ الرابط" }) {
  const [feedback, setFeedback] = useState(null);
  const current = feedback?.url === url ? feedback : null;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setFeedback({ url, message: "نُسخ الرابط" });
    } catch {
      setFeedback({ url, message: "تعذّر النسخ التلقائي؛ انسخ الرابط من الحقل", fallback: true });
    }
  };
  return <div className="share-link">
    <button type="button" className="share-link-button" onClick={copy} aria-label={label}><span aria-hidden="true">↗</span> {label}</button>
    <span className="share-link-status" role="status" aria-live="polite">{current?.message || ""}</span>
    {current?.fallback && <input className="share-link-fallback" value={url} readOnly aria-label={`رابط للمشاركة: ${label}`} onFocus={event => event.currentTarget.select()} dir="ltr" />}
  </div>;
}

export default ShareLink;
