import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("a single canonical joint design is explicitly a non-issued demonstration", async () => {
  const source = await readFile(new URL("../src/pages/JointCertificatePreview.jsx", import.meta.url), "utf8");
  assert(source.includes("نموذج غير صادر"));
  assert(source.includes("نموذج تصميم غير صادر"));
  assert(source.includes("حالة الشهادة:"));
  assert(source.includes("غير صادرة"));
  assert(source.includes("لا توقيع رقمي · لا رقم تحقق · لا رمز QR"));
  assert(source.includes("blackBoxLogo"));
  assert(source.includes("logo"));
  assert(source.includes("JOINT TRAINING ACHIEVEMENT CERTIFICATE"));
  assert(!source.includes("setDoc(") && !source.includes("addDoc("));
  assert(!source.includes("window.print(") && !source.includes("getCaseResults("));
  assert(!source.includes("getXP(") && !source.includes("cloudSync("));
});

test("joint demo has responsive styles, persistent non-issued watermark and print-safe labeling", async () => {
  const css = await readFile(new URL("../src/pages/JointCertificatePreview.css", import.meta.url), "utf8");
  assert(css.includes("#3988ff"));
  assert(css.includes("#bf965f"));
  assert(css.includes("@media(max-width:680px)"));
  assert(css.includes("@media print"));
  assert(css.includes(".joint-watermark"));
  assert(css.includes("opacity:.28!important"));
  assert(css.includes("print-color-adjust:exact"));
});

test("preview only opens from the certificate hub and is not a real issued award", async () => {
  const hub = await readFile(new URL("../src/pages/Certificates.jsx", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
  assert(hub.includes("onJointPreview"));
  assert(hub.includes("معاينة التصميم المشترك"));
  assert(app.includes('view === "joint-certificate"'));
  assert(app.includes('onCertificates={() => navigate({ view: "certificates" })}'));
});

test("premium mockup uses both real brand SVGs inside the central seal and an in-memory name", async () => {
  const source = await readFile(new URL("../src/pages/JointCertificatePreview.jsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../src/pages/JointCertificatePreview.css", import.meta.url), "utf8");
  assert(source.includes('<img src={blackBoxLogo} alt="BLACKBOX" />'));
  assert(source.includes('<img src={logo} alt="CyberTrace" />'));
  assert(source.includes("const [sampleName, setSampleName] = useState"));
  assert(source.includes("const displayName = sampleName.trim()"));
  assert(source.includes("maxLength={70}"));
  assert(source.includes("نموذج عرض باسم تجريبي لا يمثل إثبات إنجاز"));
  assert(!/localStorage|sessionStorage|fetch\(|setDoc\(|addDoc\(|getCaseResults\(|getXP\(|window\.print\(/.test(source));
  assert(css.includes("linear-gradient(130deg,#070e1b"));
  assert(css.includes("#3988ff"));
  assert(css.includes("#bf965f"));
  assert(css.includes("joint-folio-footer"));
});

test("mobile viewer preserves landscape aspect and allows keyboard-accessible full-size pan", async () => {
  const source = await readFile(new URL("../src/pages/JointCertificatePreview.jsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../src/pages/JointCertificatePreview.css", import.meta.url), "utf8");
  assert(source.includes("ResizeObserver"));
  assert(source.includes("useLayoutEffect"));
  assert(source.includes("joint-folio-viewport"));
  assert(source.includes("aria-pressed={zoomed}"));
  assert(source.includes("setZoomed(value => !value)"));
  assert(source.includes("tabIndex={zoomed ? 0 : undefined}"));
  assert(source.includes("تكبير لقراءة التفاصيل"));
  assert(css.includes("width:1120px;min-width:1120px"));
  assert(css.includes("transform:scale(var(--joint-fit-scale,1))"));
  assert(css.includes("overflow-x:auto"));
  assert(css.includes("@media print"));
  assert(css.includes("transform:none!important"));
  assert(!source.includes("localStorage") && !source.includes("getCaseResults("));
});
