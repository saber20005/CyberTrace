import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { CASES } from "../src/data/cases.js";
import { getCaseDetails } from "../src/data/caseCatalog.js";
import { describePage, applyPageMetadata, SITE_ORIGIN } from "../src/utils/pageMetadata.js";

test("metadata gives each known case an Arabic title and a stable production canonical", () => {
  for (const caseData of CASES) {
    const page = describePage({ view: "investigation", caseId: caseData.id, utm_source: "community" }, CASES);
    assert.equal(page.title, `${getCaseDetails(caseData).title} | CyberTrace`);
    assert.equal(page.url, `${SITE_ORIGIN}/?case=${caseData.id}`);
    assert(!page.url.includes("utm_"));
    assert(page.description.length <= 180);
    assert.equal(page.noindex, false);
  }
});

test("invalid cases have library metadata and auth never creates an indexable duplicate", () => {
  const library = describePage({ view: "library" }, CASES);
  assert.equal(library.url, `${SITE_ORIGIN}/?view=library`);
  assert(library.description.includes(String(CASES.length)));
  assert.deepEqual(describePage({ view: "investigation", caseId: "UNKNOWN" }, CASES), library);
  const auth = describePage({ view: "auth" }, CASES);
  assert.equal(auth.noindex, true);
  assert.equal(auth.url, `${SITE_ORIGIN}/`);
  assert.equal(describePage({ view: "anything" }, CASES).noindex, false);
  assert.doesNotThrow(() => applyPageMetadata(library));
});

test("sitemap contains exactly the real home, library and sixteen case URLs", async () => {
  const xml = await readFile(new URL("../public/sitemap.xml", import.meta.url), "utf8");
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  assert.equal(urls.length, CASES.length + 2);
  assert.equal(new Set(urls).size, urls.length);
  assert.deepEqual(urls, [`${SITE_ORIGIN}/`, `${SITE_ORIGIN}/?view=library`, ...CASES.map(c => `${SITE_ORIGIN}/?case=${c.id}`)]);
  const robots = await readFile(new URL("../public/robots.txt", import.meta.url), "utf8");
  assert(robots.includes(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`));
});

test("static sharing tags provide a PNG card for crawlers that do not execute JavaScript", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert(html.includes('property="og:image" content="https://cyber-trace-psi.vercel.app/social-preview.png"'));
  assert(html.includes('property="og:image:width" content="1200"'));
  assert(html.includes('property="og:image:height" content="630"'));
  assert(html.includes('name="twitter:card" content="summary_large_image"'));
  assert(html.includes('rel="canonical" href="https://cyber-trace-psi.vercel.app/"'));
});
