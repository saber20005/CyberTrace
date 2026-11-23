import assert from "node:assert/strict";
import process from "node:process";
import { createServer } from "vite";

const { chromium } = await import(process.env.CYBERTRACE_PLAYWRIGHT_MODULE || "playwright");
const server = await createServer({ server: { host: "127.0.0.1", port: 0, strictPort: false }, logLevel: "silent" });
let browser;
try {
  await server.listen();
  const origin = "http://127.0.0.1:" + server.httpServer.address().port;
  browser = await chromium.launch({ executablePath: process.env.CYBERTRACE_CHROMIUM_PATH || undefined, headless: true, args: ["--no-sandbox"] });
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 } });
    try {
      const page = await context.newPage();
      const errors = [], external = [];
      page.on("pageerror", error => errors.push(error.message));
      await context.route("**/*", route => {
        if (new URL(route.request().url()).origin === origin) return route.continue();
        external.push(route.request().url());
        return route.abort("blockedbyclient");
      });
      await page.goto(origin + "/tests/fixtures/home-navbar.html", { waitUntil: "domcontentloaded" });
      const menu = page.locator(width < 680 ? ".ct-more" : ".ct-account-menu");
      const summary = menu.locator("summary");
      const opener = width < 680
        ? menu.getByRole("button", { name: "ربط حساب BLACKBOX", exact: true })
        : menu.locator(".bb-account-button");
      const dialog = page.getByRole("dialog", { name: "نافذة اختبار محلية" });

      await summary.focus();
      await page.keyboard.press("Enter");
      await opener.click();
      await dialog.getByRole("textbox").click();
      await dialog.getByRole("textbox").fill("LOCAL_ONLY");
      assert.equal(await menu.evaluate(node => node.open), true, "dialog pointer interaction keeps its opener visible");
      await dialog.getByRole("button", { name: "إغلاق نافذة الاختبار" }).click();
      await dialog.waitFor({ state: "hidden" });
      assert.equal(await opener.evaluate(node => node === document.activeElement), true, "closing by pointer restores focus to the visible opener");

      await opener.click();
      await dialog.waitFor({ state: "visible" });
      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "hidden" });
      assert.equal(await menu.evaluate(node => node.open), true, "dialog Escape leaves the navigation menu open");
      assert.equal(await opener.evaluate(node => node === document.activeElement), true, "dialog Escape restores opener focus");
      await page.keyboard.press("Escape");
      assert.equal(await menu.evaluate(node => node.open), false, "navigation Escape closes its menu");
      assert.equal(await summary.evaluate(node => node === document.activeElement), true, "navigation Escape restores summary focus");

      await summary.click();
      await page.getByRole("button", { name: "خارج القائمة" }).click();
      assert.equal(await menu.evaluate(node => node.open), false, "outside pointer interaction still closes navigation");
      assert.deepEqual(errors, []);
      assert.deepEqual(external, [], "navigation mock makes no external requests");
      console.log("PASS header dialog focus " + width + "px: pointer, Escape, visible opener and outside dismissal");
    } finally {
      await context.close();
    }
  }
} finally {
  if (browser) await browser.close();
  await server.close();
}
