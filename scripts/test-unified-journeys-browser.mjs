import assert from "node:assert/strict";
import process from "node:process";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";
import { mkdir } from "node:fs/promises";
const artifacts=process.env.CYBERTRACE_BROWSER_ARTIFACTS||"/tmp/cybertrace-suite-artifacts";
await mkdir(artifacts,{recursive:true});
const mockSDK=fileURLToPath(new URL("../tests/fixtures/journey-firebase-sdk.js",import.meta.url));

const driver=await import(process.env.CYBERTRACE_PLAYWRIGHT_MODULE || "playwright");
const { chromium } = driver;
const vite=await createServer({plugins:[{name:"read-only-journey-transport",enforce:"pre",resolveId(source,importer){
 if(["firebase/app","firebase/auth","firebase/firestore"].includes(source))return mockSDK;
 if(importer?.includes("/src/")&&/^\.\.\/firebase(?:\.js)?$/.test(source))return mockSDK;
}}],server:{host:"127.0.0.1",port:0,strictPort:false},logLevel:"silent"});
let browser;
try {
 await vite.listen();
 const origin="http://127.0.0.1:"+vite.httpServer.address().port;
 browser=await chromium.launch({executablePath:process.env.CYBERTRACE_CHROMIUM_PATH||undefined,headless:true,args:["--no-sandbox"]});
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

   const urls=await page.locator(".ct-suite-card ol a[href]").evaluateAll(links=>links.map(a=>a.href));
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
   await page.waitForFunction(()=>document.querySelector(".ct-suite-status")?.textContent.includes("2 / 4"));
   assert.match(await page.locator(".ct-suite-card").first().innerText(),/إكمال سابق محفوظ دون درجة/);
   await page.evaluate(()=>window.__suiteFixture.setOwner("account-B"));
   await page.waitForFunction(()=>document.querySelector(".ct-suite-status")?.textContent.includes("0 / 4"));
   await page.evaluate(()=>window.__suiteFixture.setOwner(null));
   await page.waitForFunction(()=>document.querySelector(".ct-suite-status")?.textContent.includes("0 / 4"));
   await page.evaluate(()=>window.__suiteFixture.setOwner("account-A"));
   await page.waitForFunction(()=>document.querySelector(".ct-suite-status")?.textContent.includes("2 / 4"));
   await page.waitForFunction(()=>Boolean(window.__suiteFixture.bridge));
   await page.evaluate(()=>window.__suiteFixture.bridge.signInEmail("linked-A@example.test","fixture-only"));
   await page.waitForFunction(()=>window.__journeySDK.reads.some(r=>r.kind==="doc"&&!r.stopped));
   const firstRead=await page.evaluate(()=>window.__journeySDK.reads.findIndex(r=>r.kind==="doc"&&!r.stopped));
   const envelope={schemaVersion:1,revision:2,progress:{completed:Object.fromEntries([0,1,2].map(i=>["logs-"+i,"2026-11-26T14:00:00Z"])),notes:{"logs-0":"PRIVATE_LAB_NOTE"},results:{"logs-0":"PRIVATE_LAB_RESULT"},logs:["PRIVATE_ACTIVITY"]}};
   await page.evaluate(({firstRead,envelope})=>window.__journeySDK.emit(firstRead,envelope),{firstRead,envelope});
   await page.waitForFunction(()=>document.querySelector(".ct-suite-status")?.textContent.includes("3 / 4"));
   assert.match(await panels.first().locator(".ct-suite-next").innerText(),/التحقق من سلامة الأدلة/);
   assert.equal(await page.locator("[data-suite-state=completed]").count(),2,"only matching practical track steps complete; no score-based lab credit");
   await page.screenshot({path:artifacts+"/suite-linked-"+viewport.width+".png",fullPage:true});
   assert.equal((await page.locator("body").innerText()).includes("PRIVATE_"),false,"lab private fields never rendered");
   assert.equal(await page.evaluate(()=>JSON.stringify(window.__suiteFixture.bridge.status.practical).includes("PRIVATE_")),false,"private lab fields stay outside bridge state");
   await page.evaluate(({firstRead,envelope})=>window.__journeySDK.emit(firstRead,envelope,{fromCache:true}),{firstRead,envelope});
   await page.waitForFunction(()=>document.querySelector(".ct-suite-connection")?.textContent.includes("نسخة محفوظة"));
   await page.evaluate(firstRead=>window.__journeySDK.fail(firstRead),firstRead);
   await page.waitForFunction(()=>document.querySelector(".ct-suite-connection")?.textContent.includes("تعذّر تحميل"));
   assert.match(await panels.first().locator(".ct-suite-next").innerText(),/تحقّق من هذه الخطوة/);
   await page.getByRole("button",{name:"إعادة تحميل التقدم"}).click();
   await page.waitForFunction(firstRead=>window.__journeySDK.reads.some((r,i)=>i>firstRead&&r.kind==="doc"&&!r.stopped),firstRead);
   const retried=await page.evaluate(()=>window.__journeySDK.reads.findLastIndex(r=>r.kind==="doc"&&!r.stopped));
   await page.evaluate(({retried,envelope})=>window.__journeySDK.emit(retried,envelope),{retried,envelope});
   await page.waitForFunction(()=>document.querySelector(".ct-suite-status")?.textContent.includes("3 / 4"));
   await page.evaluate(()=>window.__suiteFixture.setOwner("account-B"));
   await page.waitForFunction(()=>document.querySelector(".ct-suite-status")?.textContent.includes("0 / 4"));
   assert.equal(await page.locator("[data-suite-state=completed]").count(),0,"switching primary identity clears linked practical progress");
   await page.evaluate(({firstRead,retried,envelope})=>{window.__journeySDK.emit(firstRead,envelope);window.__journeySDK.emit(retried,envelope);},{firstRead,retried,envelope});
   assert.equal(await page.locator("[data-suite-state=completed]").count(),0,"old callbacks never restore another identity's practical progress");
   await page.evaluate(()=>window.__suiteFixture.bridge.signInEmail("linked-B@example.test","fixture-only"));
   await page.waitForFunction(()=>window.__journeySDK.reads.some(r=>r.kind==="doc"&&!r.stopped&&r.path[1]==="linked-B"));
   const secondRead=await page.evaluate(()=>window.__journeySDK.reads.findLastIndex(r=>r.kind==="doc"&&!r.stopped));
   await page.evaluate(secondRead=>window.__journeySDK.emit(secondRead,null,{fromCache:true,exists:false}),secondRead);
   await page.waitForFunction(()=>document.querySelector(".ct-suite-connection")?.textContent.includes("لا تتوفر نسخة مؤكدة"));
   await page.evaluate(secondRead=>window.__journeySDK.emit(secondRead,null,{fromCache:false,exists:false}),secondRead);
   await page.waitForFunction(()=>document.querySelector(".ct-suite-card")?.textContent.includes("لم تؤكد جميع مراحل"));
   await page.evaluate(()=>window.__suiteFixture.hide());
   await page.waitForFunction(()=>window.__journeySDK.reads.filter(r=>r.kind==="doc").every(r=>r.stopped));
   assert.deepEqual(await page.evaluate(()=>window.__journeySDK.writes),[],"viewing shared journeys never writes cloud data");
   assert.deepEqual(leaked,[],"no external data calls from the learning component");
   assert.deepEqual(errors,[],"no browser runtime errors");
   console.log("PASS CyberTrace suite journeys "+viewport.width+"px: layout, keyboard, real provider/backend read boundary, shared next step, cache/error/retry, identity isolation and lazy cleanup");
  } finally { await context.close(); }
 }
} finally {
 if(browser)await browser.close();
 await vite.close();
}
