import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(new URL(path, import.meta.url), "utf8");

test("Pro offers two separate full-width mobile actions and honest free/paid states", () => {
  const jsx = read("../src/pages/Pro.jsx");
  const css = read("../src/pages/Pro.css");
  assert(jsx.includes('className="suite-pro-card-actions"'));
  assert(jsx.includes("suite-pro-button-primary"));
  assert(jsx.includes("suite-pro-button-secondary"));
  assert(jsx.includes("onClick={onLibrary}"));
  assert(jsx.includes("onClick={onSoc}"));
  assert(jsx.includes("لا توجد مدفوعات"));
  assert(jsx.includes("مشروعَي Firebase مستقلين"));
  assert.match(css, /\.suite-pro-card-actions\s*\{[\s\S]*?display:\s*grid;[\s\S]*?gap:\s*12px;/);
  assert.match(css, /\.suite-pro-card-actions \.suite-pro-button\s*\{[\s\S]*?width:\s*100%/);
  assert.match(css, /@media\s*\(max-width:\s*560px\)/);
  assert.match(css, /\.suite-pro-hero-actions\s*\{\s*display:\s*grid;/);
  assert(!/checkout\.stripe\.com|payment_intent|paypal\.com/i.test(jsx));
});

test("sitewide tokens and responsive layouts cover all main training routes", () => {
  const design = read("../src/styles/design-system.css");
  const app = read("../src/App.jsx");
  const home = read("../src/App.css");
  const library = read("../src/pages/InvestigationLibrary.css");
  const auth = read("../src/pages/Auth.css");
  const investigation = read("../src/pages/Investigation.css");
  const soc = read("../src/pages/SocShift.css");
  const workspace = read("../src/components/InvestigationWorkspace.css");
  assert(app.includes('import "./styles/design-system.css"'));
  assert(design.includes("--ct-page-gutter"));
  assert(design.includes(":focus-visible"));
  assert(design.includes("prefers-reduced-motion"));
  assert(home.includes("ct-learning-hub"));
  assert(home.includes("overflow-x: auto"));
  assert.match(home, /flex-wrap: nowrap; justify-content: flex-start; direction: rtl; width: 100%; overflow-x: auto;/);
  assert(home.includes("overscroll-behavior-x: contain"));
  assert(library.includes(".library-page .case-actions"));
  assert(library.includes(".library-page .library-filters"));
  assert(auth.includes(".auth-screen .auth-form input"));
  assert(investigation.includes(".inv-screen .inv-log"));
  assert(soc.includes(".soc-page .soc-report-actions"));
  assert(workspace.includes(".iw-workspace .iw-pin-button"));
});

test("training and original navigation remain wired and no scoring code was touched", () => {
  const app = read("../src/App.jsx");
  const library = read("../src/pages/InvestigationLibrary.jsx");
  assert(app.includes("startInvestigation"));
  assert(app.includes("onSelectShift={shiftId"));
  assert(app.includes("onSoc={() => navigate({ view: \"soc\" })}"));
  assert(app.includes("onPro={() => navigate({ view: \"pro\" })}"));
  assert(library.includes('onSoc, onPro'));
  assert(library.includes('onClick={onSoc}'));
  assert(library.includes('onClick={onPro}'));
  assert(!app.includes("getSuiteMembership("));
});
