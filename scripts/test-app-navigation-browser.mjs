import assert from "node:assert/strict";
import process from "node:process";
import { mkdir, writeFile } from "node:fs/promises";
import { createPresentationServer } from "./test-support/presentation-fixture.mjs";

const { chromium } = await import(process.env.CYBERTRACE_PLAYWRIGHT_MODULE || "playwright");
const artifacts = process.env.CYBERTRACE_NAVIGATION_ARTIFACTS || "/tmp/cybertrace-app-navigation";
const widths = process.env.CYBERTRACE_NAVIGATION_MOTION_ONLY === '1' ? [] : [320, 390, 1440];
const server = await createPresentationServer();
const report = [];
let browser;
let activePage;

async function assertFits(page, label) {
  const layout = await page.evaluate(() => ({
    width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    dock: (() => {
      const box = document.querySelector(".ct-app-dock")?.getBoundingClientRect();
      return box ? { left: box.left, right: box.right, bottom: box.bottom } : null;
    })(),
  }));
  assert.equal(layout.scrollWidth <= layout.width, true, label + ": " + JSON.stringify(layout));
  if (layout.dock) {
    assert.equal(layout.dock.left >= -1 && layout.dock.right <= layout.width + 1, true, label + " dock fits viewport");
  }
}

async function waitForView(page, view, heading) {
  await page.locator(`.ct-site-shell[data-ct-view="${view}"]`).waitFor({ state: "visible" });
  await page.locator(heading).waitFor({ state: "visible" });
}

async function assertShell(page, activeLabel) {
  const dock = page.locator(".ct-app-dock");
  await dock.waitFor({ state: "visible" });
  assert.equal(await dock.getByRole("button").count(), 5, "four destinations and one persistent search action");
  assert.equal(await page.locator(".ct-home-navbar").count(), 1, "one shared top header");
  assert.equal(await page.locator(".ct-site-footer").count(), 1, "one shared footer");
  assert.equal(await page.locator(".ct-quick-dock:visible").count(), 0, "no competing floating shortcut control");
  if (activeLabel) {
    assert.equal(await dock.getByRole("button", { name: activeLabel, exact: true }).getAttribute("aria-current"), "page");
    assert.equal(await dock.locator('[aria-current="page"]').count(), 1, "one active destination");
  }
  const targets = await dock.getByRole("button").evaluateAll(buttons => buttons.map(button => {
    const rect = button.getBoundingClientRect();
    return { width: rect.width, height: rect.height, label: parseFloat(getComputedStyle(button.querySelector('.ct-dock-label')).fontSize), svg: Boolean(button.querySelector('svg')) };
  }));
  assert.equal(targets.every(target => target.width >= 44 && target.height >= 44), true, "navigation has touch-sized targets");
  assert.equal(targets.every(target => target.label >= 10 && target.svg), true, "dock labels remain readable and use actual vector icons");
}

try {
  await mkdir(artifacts, { recursive: true });
  await server.listen();
  const origin = "http://127.0.0.1:" + server.httpServer.address().port;
  browser = await chromium.launch({ executablePath: process.env.CYBERTRACE_CHROMIUM_PATH || undefined, headless: true, args: ["--no-sandbox"] });
  for (const width of widths) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: "reduce" });
    const errors = [];
    const external = [];
    const mutations = [];
    await context.route("**/*", route => {
      const request = route.request();
      if (new URL(request.url()).origin !== origin) {
        external.push(new URL(request.url()).hostname);
        return route.abort("blockedbyclient");
      }
      if (!["GET", "HEAD"].includes(request.method())) {
        mutations.push(request.method() + " " + new URL(request.url()).pathname);
        return route.abort("blockedbyclient");
      }
      return route.continue();
    });
    await context.addInitScript(() => {
      localStorage.setItem("cybertrace_completed_cases:v2:presentation-a", JSON.stringify(["INC-0417"]));
      localStorage.setItem("cybertrace_completed_cases:v2:presentation-b", JSON.stringify(["INC-1201", "INC-1202"]));
      localStorage.setItem("navigation-private-draft", "PRIVATE_KEEP_EXACTLY");
    });
    const page = await context.newPage();
    activePage = page;
    page.setDefaultTimeout(18000);
    page.on("pageerror", error => errors.push(error.message));
    try {
      await page.goto(origin + "/tests/fixtures/page-presentation.html", { waitUntil: "domcontentloaded" });
      await page.locator("#ct-tour-heading").waitFor({ state: "visible" });
      assert.equal(await page.locator(".ct-app-dock:visible").count(), 0, "onboarding keeps its focused navigation");
      await page.getByRole("button", { name: /تخطي الجولة/ }).click();
      await waitForView(page, "home", ".hero h1");
      await assertShell(page, "الرئيسية");
      await assertFits(page, "home at " + width);

      const dock = page.locator(".ct-app-dock");
      const searchOpener = page.locator(".ct-app-search-open");
      const search = page.locator("dialog.ct-search-dialog");
      const query = page.getByLabel("ابحث في التحقيقات والأقسام", { exact: true });
      await searchOpener.focus();
      await page.keyboard.press("Enter");
      await search.waitFor({ state: "visible" });
      assert.equal(await search.evaluate(node => node.open), true, "search is a native open dialog");
      assert.equal(await query.evaluate(node => node === document.activeElement), true, "search receives initial focus");
      await query.fill("PRIVATE_KEEP_EXACTLY");
      await page.waitForFunction(() => document.querySelectorAll("dialog.ct-search-dialog [data-search-case-id], dialog.ct-search-dialog [data-search-view]").length === 0);
      assert.equal(await search.locator("[data-search-case-id], [data-search-view]").count(), 0, "private local draft contents are never searchable public navigation data");
      await query.fill("INC-0417");
      await search.locator('[data-search-case-id="INC-0417"]').waitFor({ state: "visible" });
      await assertFits(page, "search at " + width);
      await page.keyboard.press("Tab");
      assert.equal(await search.evaluate(node => node.contains(document.activeElement)), true, "search keyboard navigation remains in the modal");
      await dock.getByRole("button", { name: "الرئيسية", exact: true }).evaluate(node => node.focus());
      assert.equal(await search.evaluate(node => node.contains(document.activeElement)), true, "native modality prevents focusing the page behind search");
      await page.keyboard.press("Escape");
      await search.waitFor({ state: "hidden" });
      assert.equal(await searchOpener.evaluate(node => node === document.activeElement), true, "Escape restores search opener focus");
      await searchOpener.click();
      await search.waitFor({ state: "visible" });
      await search.getByRole("button", { name: "إغلاق البحث", exact: true }).click();
      await search.waitFor({ state: "hidden" });
      assert.equal(await searchOpener.evaluate(node => node === document.activeElement), true, "Close restores search opener focus");

      await dock.getByRole("button", { name: "التحقيقات", exact: true }).click();
      await waitForView(page, "library", "#library-title");
      await assertShell(page, "التحقيقات");
      await dock.getByRole("button", { name: "مناوبات SOC", exact: true }).click();
      await waitForView(page, "soc", ".soc-heading h1");
      await assertShell(page, "مناوبات SOC");
      await page.locator('.soc-shift-card').filter({ hasText: 'SOC-SHIFT-02' }).click();
      await page.waitForFunction(() => new URL(location.href).searchParams.get('shift') === 'SOC-SHIFT-02' && document.querySelector('.soc-heading')?.textContent.includes('SOC-SHIFT-02'));
      await page.goBack();
      await page.waitForFunction(() => document.querySelector('.soc-heading')?.textContent.includes('SOC-SHIFT-01'));
      await page.goBack();
      await waitForView(page, "library", "#library-title");
      assert.equal(new URL(page.url()).searchParams.get("view"), "library", "browser Back restores the real route");

      // Returning from a detail must preserve the actual source card and query,
      // rather than rebuilding an unfiltered catalogue at its top.
      const libraryQuery = page.getByRole("searchbox", { name: /ابحث عن تحقيق/ });
      await libraryQuery.fill("INC-0417");
      await page.getByLabel('المستوى', { exact: true }).selectOption('beginner');
      await page.getByLabel('المجال', { exact: true }).selectOption('identity');
      await page.getByLabel('حالة الإنجاز', { exact: true }).selectOption('new');
      const card = page.locator('.case-card[data-case-id="INC-0417"]');
      const start = card.locator(".case-start");
      await start.scrollIntoViewIfNeeded();
      await start.focus();
      const previousScroll = await page.evaluate(() => scrollY);
      await page.evaluate(async () => {
        window.dispatchEvent(new Event('cybertrace-progress-synced'));
        await new Promise(requestAnimationFrame);
        await new Promise(requestAnimationFrame);
      });
      assert.equal(await start.evaluate(node => node === document.activeElement), true, "background progress refresh preserves current focus");
      assert.equal(await page.evaluate(() => scrollY), previousScroll, "background progress refresh preserves current scroll");
      await start.click();
      await waitForView(page, "investigation", ".inv-title");
      assert.equal(await page.locator(".ct-app-dock:visible").count(), 0, "investigation remains in focus mode");
      assert.equal(await page.locator(".ct-quick-dock:visible").count(), 0);
      await page.locator(".inv-back").click();
      await waitForView(page, "library", "#library-title");
      assert.equal(await libraryQuery.inputValue(), "INC-0417", "Back preserves the library query");
      assert.equal(await page.getByLabel('المستوى', { exact: true }).inputValue(), 'beginner');
      assert.equal(await page.getByLabel('المجال', { exact: true }).inputValue(), 'identity');
      assert.equal(await page.getByLabel('حالة الإنجاز', { exact: true }).inputValue(), 'new');
      await page.waitForFunction(() => document.activeElement?.closest('[data-case-id="INC-0417"]'));
      assert.equal(Math.abs((await page.evaluate(() => scrollY)) - previousScroll) < 140, true, "Back returns near the source card");
      // Test the decorative pointer glow only AFTER the Back/focus restoration assertion.
      // An earlier hover auto-scrolls the case card and changes the scroll baseline.
      await card.hover({position:{x:40,y:48}});
      const glow = await card.evaluate(el => ({
        pseudo:getComputedStyle(el,'::before').content,
        pointer:getComputedStyle(el,'::before').pointerEvents,
        position:getComputedStyle(el).position,
        x:el.style.getPropertyValue('--ct-case-glow-x')
      }));
      assert.notEqual(glow.pseudo,'none','case card renders a soft decorative spotlight');
      assert.equal(glow.pointer,'none','case glow never intercepts clicks');
      assert.equal(glow.position,'relative','glow does not alter card layout');
      assert.ok(Math.abs(parseFloat(glow.x) - 40) <= 2,'pointer-following glow tolerates card border and fractional CSS pixels');


      await searchOpener.click();
      await search.waitFor({ state: "visible" });
      await query.fill("INC-0417");
      await search.locator('[data-search-case-id="INC-0417"]').click();
      await waitForView(page, "investigation", ".inv-title");
      assert.equal(new URL(page.url()).searchParams.get("case"), "INC-0417", "search selects a real existing case URL");
      assert.equal(await page.locator(".ct-app-dock:visible").count(), 0);
      await page.locator(".inv-back").click();
      await waitForView(page, "library", "#library-title");

      await searchOpener.click();
      await search.waitFor({ state: "visible" });
      await query.fill("العرض");
      await search.locator('[data-search-view="settings"]').click();
      await waitForView(page, "settings", ".ct-studio-heading h1");
      assert.equal(new URL(page.url()).searchParams.get("view"), "settings", "search route selection updates history");
      await page.evaluate(async () => {
        const prefs = await import("/src/utils/uiPreferences.js");
        const next = { ...prefs.DEFAULT_UI_PREFERENCES, theme: "light", textSize: "xlarge", motion: "reduce" };
        prefs.saveUIPreferences(next);
        prefs.applyUIPreferences(next);
      });
      await assertFits(page, "light extra-large dock at " + width);
      await searchOpener.click();
      await search.waitFor({ state: "visible" });
      await query.fill("INC-0417");
      await assertFits(page, "light extra-large search at " + width);
      await page.screenshot({ path: `${artifacts}/search-light-${width}.png`, fullPage: true });
      await page.keyboard.press("Escape");
      await search.waitFor({ state: "hidden" });
      await searchOpener.click();
      await search.waitFor({ state: 'visible' });
      await query.fill('INC-0417');
      await page.goBack();
      await waitForView(page, 'library', '#library-title');
      await search.waitFor({ state: 'hidden' });
      assert.notEqual(await page.evaluate(() => document.body.style.overflow), 'hidden', 'browser Back releases modal scrolling');
      assert.equal(await searchOpener.evaluate(node => node === document.activeElement), false, 'a late close event does not steal route focus');

      await dock.getByRole("button", { name: "الشهادات", exact: true }).click();
      await waitForView(page, "certificates", ".ct-cert-main h1");
      await assertShell(page, "الشهادات");
      await page.emulateMedia({ media: "print" });
      assert.equal(await dock.isVisible(), false, "floating navigation is excluded from certificate printing");
      await page.emulateMedia({ media: "screen" });
      await dock.getByRole("button", { name: "التحقيقات", exact: true }).click();
      await waitForView(page, "library", "#library-title");
      await libraryQuery.fill("");
      for (const [owner, count] of [["presentation-a", "1"], ["presentation-b", "2"], [null, "0"]]) {
        await page.evaluate(owner => window.__pagePresentation.setUser(owner), owner);
        await page.waitForFunction(count => document.querySelector('[data-testid="completed-count"]')?.textContent.trim().startsWith(count), count);
      }
      assert.equal(await page.evaluate(() => localStorage.getItem("navigation-private-draft")), "PRIVATE_KEEP_EXACTLY");
      assert.equal(await page.evaluate(() => localStorage.getItem("cybertrace_completed_cases:v2:presentation-a")), '["INC-0417"]');
      assert.equal(await page.evaluate(() => localStorage.getItem("cybertrace_completed_cases:v2:presentation-b")), '["INC-1201","INC-1202"]');
      assert.deepEqual(await page.evaluate(() => window.__pagePresentation.calls()), [], "navigation never submits authentication");
      assert.deepEqual(errors, []);
      assert.deepEqual(external, [], "all search/navigation data stays local");
      assert.deepEqual(mutations, [], "navigation performs no server mutation");
      await assertFits(page, "final library at " + width);
      await page.screenshot({ path: `${artifacts}/library-${width}.png`, fullPage: true });
      await page.goto(origin + "/?case=INC-0417&spotlight-preview=1", { waitUntil: "domcontentloaded" });
      await waitForView(page, "investigation", ".inv-title");
      assert.equal(await page.locator(".ct-app-dock:visible").count(), 0, "existing direct investigation URLs keep focus mode");
      assert.equal(await page.locator('[data-ct-spotlight-preview], .ct-sp-replay').count(), 0, 'investigation also suppresses opt-in tutorial chrome');
      await page.evaluate(() => history.replaceState({ cybertraceHasReturnEntry: true, cybertraceNavigationSession: 'unknown-external-state' }, '', location.href));
      await page.locator(".inv-back").click();
      await waitForView(page, "library", "#library-title");
      await assertShell(page, "التحقيقات");
      await assertFits(page, "direct link return at " + width);
      if (width === 390) {
        // The upstream opt-in spotlight must target the real visible mobile
        // dock when its desktop header shortcut is intentionally hidden.
        await page.goto(origin + '/?view=library&spotlight-preview=1', { waitUntil: 'domcontentloaded' });
        await page.locator('[data-ct-spotlight-preview]').waitFor({ state: 'visible' });
        await page.locator('.ct-app-dock [data-dock-view="library"]').click();
        await page.getByText('ابحث في ملفات الحوادث', { exact: true }).waitFor();
        await page.locator('.library-filters input[type="search"]').click();
        await page.getByText('افتح قائمة العمليات', { exact: true }).waitFor();
        await page.locator('.ct-more > summary').click();
        await page.getByText('انتقل إلى مركز SOC', { exact: true }).waitFor();
        await page.locator('[data-ct-spotlight="soc"]').click();
        await page.getByText('اكتشفت طريقك في مركز التحقيق', { exact: true }).waitFor();
        await page.getByRole('button', { name: 'إغلاق الجولة', exact: true }).click();
        await waitForView(page, 'soc', '.soc-heading h1');
      }
      assert.deepEqual(errors, []);
      assert.deepEqual(external, []);
      assert.deepEqual(mutations, []);
      report.push({ width, primaryNavigation: true, nativeSearch: true, realCaseSelection: true, libraryReturn: true, browserBack: true, printBoundary: true, ownerIsolation: true, errors, external, mutations });
      console.log(`PASS app navigation ${width}px: persistent dock, local search, details/back, focus, large text, printing and owner isolation`);
    } finally {
      await context.close();
    }
  }
  // Exercise the optional motion boundary with real route DOM, including a
  // never-loaded detail chunk, native snapshot rejection, and reduced motion.
  for (const scenario of ['native', 'os-reduce', 'explicit-reduce', 'unsupported', 'snapshot-failure', 'superseded', 'direct-os-reduce', 'direct-unsupported']) {
    const direct = scenario.startsWith('direct-');
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: scenario.endsWith('os-reduce') ? 'reduce' : 'no-preference' });
    const errors = [], external = [], mutations = [];
    const page = await context.newPage(); activePage = page;
    page.on('pageerror', error => errors.push(error.message));
    await context.route('**/*', route => {
      const request = route.request();
      if (new URL(request.url()).origin !== origin) { external.push(request.url()); return route.abort('blockedbyclient'); }
      if (!['GET', 'HEAD'].includes(request.method())) { mutations.push(request.method()); return route.abort('blockedbyclient'); }
      return route.continue();
    });
    try {
      if (scenario === 'direct-unsupported') await context.addInitScript(() => { document.startViewTransition = undefined; });
      await page.goto(origin + (direct ? '/?case=INC-0417' : '/?view=library'), { waitUntil: 'domcontentloaded' });
      await waitForView(page, direct ? 'investigation' : 'library', direct ? '.inv-title' : '#library-title');
      await page.evaluate(async scenario => {
        const preferences = await import('/src/utils/uiPreferences.js');
        preferences.applyUIPreferences({ ...preferences.DEFAULT_UI_PREFERENCES, motion: scenario === 'explicit-reduce' ? 'reduce' : 'system' });
        const original = document.startViewTransition?.bind(document);
        window.__navigationSnapshots = []; window.__navigationTransitionCalls = 0;
        if (scenario.endsWith('unsupported')) { document.startViewTransition = undefined; return; }
        if (!original) throw new Error('Native View Transitions required by this browser regression');
        document.startViewTransition = callback => {
          window.__navigationTransitionCalls++;
          if (scenario === 'snapshot-failure') throw new Error('Simulated unavailable snapshot');
          return original(async () => {
            await callback();
            window.__navigationSnapshots.push({ view: document.querySelector('.ct-site-shell')?.dataset.ctView, detail: Boolean(document.querySelector('.inv-card')) });
          });
        };
      }, scenario);
      if (!direct) await page.getByRole('searchbox', { name: /ابحث عن تحقيق/ }).fill('INC-0417');
      const historyLength = await page.evaluate(() => history.length);
      if (scenario === 'superseded') {
        await page.evaluate(() => {
          document.querySelector('.case-card[data-case-id="INC-0417"] .case-start').click();
          document.querySelector('.ct-app-dock [data-dock-view="soc"]').click();
        });
        await waitForView(page, 'soc', '.soc-heading h1');
        await page.waitForFunction(() => !document.documentElement.dataset.ctTransition);
        assert.equal(new URL(page.url()).searchParams.get('view'), 'soc', 'pending detail cannot replace a newer route');
      } else {
        if (!direct) await page.locator('.case-card[data-case-id="INC-0417"] .case-start').click();
        await waitForView(page, 'investigation', '.inv-title');
        assert.equal(await page.evaluate(() => history.length), historyLength + (direct ? 0 : 1), 'snapshot/fallback route commits once');
        if (scenario === 'native') {
          await page.waitForFunction(() => window.__navigationSnapshots.length > 0);
          assert.deepEqual(await page.evaluate(() => window.__navigationSnapshots[0]), { view: 'investigation', detail: true }, 'first motion snapshot contains the real cold-loaded detail');
          await page.screenshot({ path: artifacts + '/detail-motion-390.png', fullPage: true });
        }
        if (['os-reduce', 'explicit-reduce', 'unsupported', 'direct-os-reduce', 'direct-unsupported'].includes(scenario)) assert.equal(await page.evaluate(() => window.__navigationTransitionCalls), 0, 'motion preference/capability bypasses snapshots');
        await page.getByRole('button', { name: /ابدأ التحليل/ }).click();
        await page.locator('.inv-options').waitFor({ state: 'visible' });
        await page.locator('.inv-option').first().click();
        const activeStep = await page.locator('.inv-progress-step[aria-current="step"]').innerText();
        const evidenceChoice = await page.locator('.inv-option[aria-pressed="true"]').innerText();
        await page.evaluate(async () => {
          window.dispatchEvent(new Event('cybertrace-progress-synced'));
          await new Promise(requestAnimationFrame);
          await new Promise(requestAnimationFrame);
        });
        assert.equal(await page.locator('.inv-progress-step[aria-current="step"]').innerText(), activeStep, 'background progress preserves a cold-loaded attempt step');
        assert.equal(await page.locator('.inv-option[aria-pressed="true"]').innerText(), evidenceChoice, 'background progress preserves the current evidence choice');
      }
      assert.deepEqual(errors, []); assert.deepEqual(external, []); assert.deepEqual(mutations, []);
      report.push({ scenario, motionBoundary: true, errors, external, mutations });
      console.log('PASS navigation motion ' + scenario);
    } finally { await context.close(); }
  }
  await writeFile(artifacts + "/results.json", JSON.stringify(report, null, 2));
} catch (error) {
  if (activePage && !activePage.isClosed()) await activePage.screenshot({ path: artifacts + "/failure.png", fullPage: true }).catch(() => {});
  await writeFile(artifacts + "/failure.json", JSON.stringify({ results: report, error: error.message }, null, 2));
  throw error;
} finally {
  if (browser) await browser.close();
  await server.close();
}
