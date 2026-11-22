import assert from "node:assert/strict";
import { createServer } from "vite";

const driver=await import(process.env.CYBERTRACE_PLAYWRIGHT_MODULE || "playwright");
const { chromium } = driver;
const vite=await createServer({server:{host:"127.0.0.1",port:0,strictPort:false},logLevel:"silent"});
let browser;
try {
 await vite.listen();
 const origin="http://127.0.0.1:"+vite.httpServer.address().port;
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 for(const viewport of [{width:320,height:740},{width:390,height:844},{width:1440,height:1000}]) {
  const context=await browser.newContext({viewport});
  const leaked=[],errors=[];
  await context.route("**/*",route=>{
   const href=new URL(route.request().url());
   if(href.origin===origin)return route.continue();
   if(!["fonts.googleapis.com","fonts.gstatic.com"].includes(href.hostname))leaked.push(href.href);
   return route.abort("blockedbyclient");
  });
  const page=await context.newPage();
  page.on("pageerror",error=>errors.push(error.message));
  try {
   await page.goto(origin+"/tests/fixtures/unified-journeys.html",{waitUntil:"domcontentloaded"});
   const panels=page.locator("details.ct-suite-card");
   await panels.first().waitFor({state:"visible"});
   assert.equal(await panels.count(),4,"all four journeys exist");
   assert.equal(await page.locator(".ct-suite-card li").count(),16,"all public steps are present");
   assert.equal(await panels.first().evaluate(node=>node.open),true,"first journey open by default");
   assert.equal(await panels.nth(1).evaluate(node=>node.open),false,"other journeys collapsed");
   const summary=panels.nth(1).locator("summary");
   await summary.focus();
   await summary.press("Enter");
   assert.equal(await panels.nth(1).evaluate(node=>node.open),true,"keyboard can expand");
   await summary.press("Enter");
   assert.equal(await panels.nth(1).evaluate(node=>node.open),false,"keyboard can close");
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,"no horizontal overflow");

   const urls=await page.locator(".ct-suite-card a[href]").evaluateAll(links=>links.map(a=>a.href));
   assert.equal(urls.length,16);
   urls.forEach(href=>{
    const url=new URL(href);
    assert(["https://blackboxlab.dev","https://www.cybertracelab.dev"].includes(url.origin));
    for(const key of ["uid","email","token","score"])assert.equal(url.searchParams.has(key),false);
   });

   await page.evaluate(()=>{
    localStorage.setItem("cybertrace_completed_cases:v2:account-A",JSON.stringify(["INC-0417","INC-1201"]));
    window.__suiteFixture.setOwner("account-A");
   });
   await page.waitForFunction(()=>document.querySelector(".ct-suite-status")?.textContent.includes("2 / 2"));
   assert.match(await page.locator(".ct-suite-card").first().innerText(),/إكمال سابق محفوظ دون درجة/);
   await page.evaluate(()=>window.__suiteFixture.setOwner("account-B"));
   await page.waitForFunction(()=>document.querySelector(".ct-suite-status")?.textContent.includes("0 / 2"));
   await page.evaluate(()=>window.__suiteFixture.setOwner(null));
   await page.waitForFunction(()=>document.querySelector(".ct-suite-status")?.textContent.includes("0 / 2"));
   await page.evaluate(()=>window.__suiteFixture.setOwner("account-A"));
   await page.waitForFunction(()=>document.querySelector(".ct-suite-status")?.textContent.includes("2 / 2"));
   assert.deepEqual(leaked,[],"no external data calls from the learning component");
   assert.deepEqual(errors,[],"no browser runtime errors");
   console.log("PASS CyberTrace suite journeys "+viewport.width+"px: layout, keyboard, link privacy, identity isolation");
  } finally { await context.close(); }
 }
} finally {
 if(browser)await browser.close();
 await vite.close();
}
