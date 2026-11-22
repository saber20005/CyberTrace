import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";

const pageUrl = new URL("../src/pages/JointCertificatePreview.jsx", import.meta.url);
const cssUrl = new URL("../src/pages/JointCertificatePreview.css", import.meta.url);
const assetUrl = new URL("../src/assets/joint-certificate-approved.webp", import.meta.url);

test("approved user-selected image is shipped as a genuine WebP asset, not an HTML approximation", async () => {
  const asset = await readFile(assetUrl);
  const info = await stat(assetUrl);
  assert.equal(asset.toString("ascii", 0, 4), "RIFF");
  assert.equal(asset.toString("ascii", 8, 12), "WEBP");
  assert(info.size > 40_000 && info.size < 500_000);
  const page = await readFile(pageUrl, "utf8");
  assert(page.includes('import approvedArt from "../assets/joint-certificate-approved.webp"'));
  assert(page.includes('src={approvedArt}'));
  assert(page.includes("joint-approved-template"));
  assert(!page.includes("joint-crest-ribbon"));
  assert(!page.includes("joint-brand-bar"));
});

test("the user's name is only an editable preview and never stored or sent", async () => {
  const page = await readFile(pageUrl, "utf8");
  assert(page.includes("const [sampleName, setSampleName] = useState"));
  assert(page.includes("const displayName = sampleName.trim()"));
  assert(page.includes("maxLength={70}"));
  assert(page.includes(">{displayName}</span>"));
  assert(!/localStorage|sessionStorage|fetch\(|setDoc\(|addDoc\(|getCaseResults\(|getXP\(|cloudSync\(/.test(page));
});

test("no fake valid QR, 3/3 results, certificate number or issuance time is shown", async () => {
  const page = await readFile(pageUrl, "utf8");
  assert(page.includes("نتيجة BLACKBOX غير متحققة"));
  assert(page.includes("نتيجة CyberTrace غير متحققة"));
  assert(page.includes("التحقق غير متاح"));
  assert(page.includes("غير صادر"));
  assert(page.includes("نموذج غير صادر"));
  assert(!page.includes("CT-BB-"));
  assert(!page.includes("3 / 3"));
  assert(!page.includes("verify?id="));
  assert(!page.includes("window.print("));
});

test("mobile viewer can show the landscape source legibly without modifying its layout", async () => {
  const page = await readFile(pageUrl, "utf8");
  const css = await readFile(cssUrl, "utf8");
  assert(page.includes("ResizeObserver"));
  assert(page.includes("useLayoutEffect"));
  assert(page.includes("عرض الشهادة بملء الشاشة"));
  assert(page.includes('aria-modal={immersive || undefined}'));
  assert(page.includes('event.key === "Escape"'));
  assert(page.includes("document.body.style.overflow = previousOverflow"));
  assert(css.includes("width:1120px;min-width:1120px"));
  assert(css.includes("height:747px"));
  assert(css.includes("transform:scale(var(--joint-fit-scale,1))"));
  assert(css.includes("rotate(90deg)"));
  assert(css.includes("overflow-x:auto"));
  assert(css.includes("@media print"));
  assert(css.includes("print-color-adjust:exact"));
});

test("personal certificate pages and route hooks remain separate from this non-issued visual template", async () => {
  const hub = await readFile(new URL("../src/pages/Certificates.jsx", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
  assert(hub.includes("onJointPreview"));
  assert(hub.includes("معاينة التصميم المشترك"));
  assert(app.includes('view === "joint-certificate"'));
  assert(app.includes('onCertificates={() => navigate({ view: "certificates" })}'));
});

test("both owner-supplied original logos replace embedded symbols at four positions each", async () => {
  const page = await readFile(pageUrl, "utf8");
  const css = await readFile(cssUrl, "utf8");
  const bb = await readFile(new URL("../src/assets/blackbox-original-brand.webp", import.meta.url));
  const ct = await readFile(new URL("../src/assets/cybertrace-original-brand.webp", import.meta.url));
  for (const asset of [bb, ct]) {
    assert.equal(asset.toString("ascii", 0, 4), "RIFF");
    assert.equal(asset.toString("ascii", 8, 12), "WEBP");
  }
  assert(page.includes('import blackBoxOriginal from "../assets/blackbox-original-brand.webp"'));
  assert(page.includes('import cyberTraceOriginal from "../assets/cybertrace-original-brand.webp"'));
  assert.equal((page.match(/src={blackBoxOriginal}/g) || []).length, 4);
  assert.equal((page.match(/src={cyberTraceOriginal}/g) || []).length, 4);
  assert(page.includes('className="joint-brand-swaps"'));
  for (const side of ["bb", "ct"]) {
    for (const place of ["header", "crest", "milestone", "medallion"]) {
      assert(css.includes(`.joint-swap-${side}-${place}{`));
      assert(page.includes(`joint-swap-${side}-${place}`));
    }
  }
  assert(page.includes("joint-template-qr-placeholder"));
  assert(page.includes("التحقق غير متاح"));
  assert(!page.includes("3 / 3"));
  assert(!page.includes("CT-BB-"));
  assert(!/setDoc\(|addDoc\(|window\.print\(/.test(page));
});

test("the extra English preview line is absent while non-issued status remains visible", async () => {
  const page = await readFile(pageUrl, "utf8");
  const css = await readFile(cssUrl, "utf8");
  assert(!page.includes("joint-template-preview-en"));
  assert(!css.includes(".joint-template-preview-en"));
  assert(!page.includes("VISUAL PREVIEW ONLY."));
  assert(page.includes("نموذج غير صادر"));
  assert(page.includes("غير صادرة."));
  assert(page.includes("التحقق غير متاح"));
});
