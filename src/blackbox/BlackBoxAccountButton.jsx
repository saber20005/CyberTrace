import { useBlackBox } from "./useBlackBox";
import "./BlackBoxLink.css";

export default function BlackBoxAccountButton() {
  const { status, openLink } = useBlackBox();
  if (!status.enabled) return null;
  const connected = Boolean(status.user);
  const needsAttention = Boolean(status.memoryOnly || status.pending || status.error);
  const message = status.memoryOnly ? "نتائج مؤقتة · أبقِ التبويب مفتوحًا"
    : status.syncing ? "جارٍ المزامنة…"
    : status.pending ? `${status.pending} نتائج تنتظر المزامنة`
    : status.error ? "راجع حالة الربط"
    : connected ? "الحساب مرتبط" : "ربط حساب BlackBox";
  const description = connected ? `إدارة الربط مع BlackBox — ${message}`
    : status.error ? `ربط BlackBox — ${message}` : "ربط BlackBox لمتابعة مهاراتك";

  return <div className="bb-account-control">
    <button type="button" id="blackboxLinkButton"
      className={`bb-account-button${connected ? " is-connected" : ""}${needsAttention ? " needs-attention" : ""}`}
      data-link-state={connected ? "connected" : "guest"}
      aria-label={description} title={description}
      aria-haspopup="dialog" aria-controls="blackboxLinkDialog" onClick={openLink}>
      {connected ? "إدارة الربط" : "ربط BlackBox"}
    </button>
    <span className="bb-link-mini-status bb-account-status" role="status" aria-live="polite">{message}</span>
  </div>;
}
