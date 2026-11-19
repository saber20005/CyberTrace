import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CASES } from "../src/data/cases.js";
import { readRoute, createRouteURL } from "../src/utils/routes.js";
import { describePage } from "../src/utils/pageMetadata.js";

const read = path => readFileSync(new URL(path, import.meta.url), "utf8");

test("staged verified SOC route is public but intentionally noindex", () => {
  assert.deepEqual(readRoute("https://cybertracelab.dev/?view=verified-soc", CASES), {view:"verified-soc"});
  assert.deepEqual(readRoute("https://cybertracelab.dev/?view=verified-soc&view=soc", CASES), {view:"home"});
  const url = createRouteURL({view:"verified-soc"},"https://cybertracelab.dev/?email=person%40private.test&utm_source=developer");
  assert.equal(url.searchParams.get("view"),"verified-soc");
  assert.equal(url.searchParams.has("email"),false);
  const metadata=describePage({view:"verified-soc"}, CASES);
  assert.equal(metadata.noindex,true);
  assert(metadata.title.includes("قيد التجهيز"));
});

test("verified frontend never includes rubric or fabricated grades and fails closed without App Check", () => {
  const api=read("../src/blackbox/verifiedSocBackend.js");
  const ui=read("../src/pages/VerifiedSoc.jsx");
  const bridge=read("../src/blackbox/backend.js");
  assert(api.includes('VITE_BLACKBOX_APPCHECK_ENTERPRISE_SITE_KEY'));
  assert(api.includes('ReCaptchaEnterpriseProvider'));
  assert(api.includes('getFunctions(app, "us-central1")'));
  assert(api.includes('startVerifiedSocShift'));
  assert(api.includes('submitVerifiedSocShift'));
  assert(api.includes('getAuth(app).currentUser?.uid !== uid'));
  assert(api.includes('result.verifiedByServer !== true'));
  assert(ui.includes('!verifiedSocConfigured'));
  assert(ui.includes('لم يتم إعداد App Check'));
  assert(ui.includes('submitServerVerifiedSoc'));
  assert(ui.includes('getBlackBox')===false);
  assert(bridge.includes('name = "cybertrace-blackbox-link"'));
  assert(!ui.includes('gradeSocSession('));
  assert(!ui.includes('addXP('));
  assert(!ui.includes('recordCaseResult('));
  assert(!api.includes('acceptedAnswers'));
  assert(!api.includes('correctPriority'));
  assert(!api.includes('bestScore: 100'));
});

test("staged UI has a free escape path and no payment hooks", () => {
  const ui=read("../src/pages/VerifiedSoc.jsx");
  const app=read("../src/App.jsx");
  const pro=read("../src/pages/Pro.jsx");
  assert(ui.includes("onClick={onSoc}"));
  assert(ui.includes("openLink"));
  assert(ui.includes("onClick={submit}"));
  assert(app.includes('key={blackBox.status.user?.uid ?? "guest"}'));
  assert(pro.includes("onVerify"));
  assert(pro.includes("قيد التجهيز"));
  assert(!/payment_intent|checkout\.stripe\.com|subscribeNow\(/.test(ui+pro));
});
