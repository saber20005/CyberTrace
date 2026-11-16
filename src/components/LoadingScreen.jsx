import "./LoadingScreen.css";
export default function LoadingScreen({ message = "جارٍ تجهيز المنصة...", inline = false }) {
  return <div className={inline ? "ct-loading ct-loading--inline" : "ct-loading"} role="status" aria-live="polite" dir="rtl">
    <div className="ct-loading__scanner" aria-hidden="true">
      <span className="ct-loading__orbit ct-loading__orbit--outer" />
      <span className="ct-loading__orbit ct-loading__orbit--inner" />
      <span className="ct-loading__sweep" />
      <span className="ct-loading__crosshair" />
      <span className="ct-loading__core">CT</span>
    </div>
    <div className="ct-loading__name">CyberTrace</div>
    <div className="ct-loading__bar" aria-hidden="true" />
    <div className="ct-loading__detail">{message}</div>
  </div>;
}
