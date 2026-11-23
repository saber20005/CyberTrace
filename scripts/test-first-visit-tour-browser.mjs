import assert from "node:assert/strict";
import process from "node:process";
import {createServer} from "vite";
const {chromium}=await import(process.env.CYBERTRACE_PLAYWRIGHT_MODULE||"playwright");
const vite=await createServer({server:{host:"127.0.0.1",port:0,strictPort:false},logLevel:"silent"});
let browser;
try{
 await vite.listen();
 const origin="http://127.0.0.1:"+vite.httpServer.address().port;
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 for(const viewport of [{width:320,height:740},{width:390,height:844},{width:1440,height:1000}]){
  const context=await browser.newContext({viewport});
  const page=await context.newPage(),errors=[],leaks=[];
  page.on("pageerror",error=>errors.push(error.message));
  await context.route("**/*",route=>{
    const url=new URL(route.request().url());
    if(url.origin===origin)return route.continue();
    if(!["fonts.googleapis.com","fonts.gstatic.com"].includes(url.hostname))leaks.push(url.href);
    return route.abort("blockedbyclient");
  });
  try{
   await page.goto(origin+"/tests/fixtures/first-visit-tour.html",{waitUntil:"domcontentloaded"});
   const heading=page.locator("#ct-tour-heading");
   await heading.waitFor({state:"visible"});
   assert.match(await heading.innerText(),/غرفة التحقيق/);
   assert.equal(await page.locator(".ct-tour-progress button").count(),5);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,"initial welcome fits "+viewport.width+"px");
   await page.getByRole("button",{name:/التالي/}).click();
   assert.match(await heading.innerText(),/افحص الدليل/);
   assert.equal(await heading.evaluate(el=>document.activeElement===el),true,"new section focus moves to heading");
   assert.equal(await page.locator(".ct-tour-choice").count(),0,"no multiple-choice onboarding");
   await page.locator('[data-ct-log="EV-01"]').click();
   await page.locator('[data-ct-log="EV-02"]').click();
   assert.equal(await page.locator('[data-ct-log="EV-01"]').getAttribute("aria-expanded"),"true");
   await page.locator("#ct-case-zero-finding").fill("تتابع محاولات فاشلة ثم دخول ناجح من المصدر نفسه؛ سأراجع ملكية الحساب وسجلات الجهاز.");
   await page.locator("[data-ct-report-submit]").click();
   assert.match(await page.locator(".ct-case-zero-feedback").innerText(),/تم حفظ التقرير/);
   assert.match(await page.locator(".ct-case-zero-stats").innerText(),/مكتمل/);
   await page.getByRole("button",{name:/التالي/}).click();
   await page.locator('[data-ct-alert="SOC-102"]').click();
   await page.locator('[data-ct-triage="escalate"]').click();
   assert.match(await page.locator(".ct-case-zero-feedback").innerText(),/غير مدعوم/,"wrong-priority escalation is challenged");
   await page.locator('[data-ct-alert="SOC-101"]').click();
   await page.locator('[data-ct-triage="escalate"]').click();
   assert.match(await page.locator(".ct-case-zero-feedback").innerText(),/تصعيد مبرر/);
   assert.match(await page.locator(".ct-case-zero-live").innerText(),/SOC-101/);
   await page.getByRole("button",{name:/التالي/}).click();
   assert.match(await heading.innerText(),/تقدّمك/);
   assert.match(await page.locator(".ct-tour-clarity").innerText(),/ليست شهادة|ليست شهادات|ليست شهادة خادمية/);
   await page.getByRole("button",{name:/التالي/}).click();
   assert.match(await page.locator(".ct-case-zero-debrief-head").innerText(),/3 \/ 3/,"evidence summary complete");
   assert.match(await page.locator(".ct-case-zero-debrief").innerText(),/SOC-101/);
   assert.equal(await page.locator(".ct-tour-destinations button").count(),5);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,"last tour step fits "+viewport.width+"px");
   await page.getByRole("button",{name:/ابدأ أول تحقيق/}).click();
   assert.equal(await page.locator("[data-test-view]").getAttribute("data-test-view"),"library");
   assert.equal(await page.evaluate(()=>localStorage.getItem("cybertrace.first-visit-tour.v1")),"done");
   await page.reload({waitUntil:"domcontentloaded"});
   await page.locator("[data-test-view=home]").waitFor();
   assert.equal(await page.locator(".ct-tour").count(),0,"no forced repeat for returning browser");
   await page.locator("[data-replay-tour]").click();
   await heading.waitFor();
   assert.match(await heading.innerText(),/غرفة التحقيق/);
   await page.getByRole("button",{name:/تخطي الجولة/}).click();
   assert.equal(await page.locator("[data-test-view=home]").count(),1);
   await page.goto(origin+"/tests/fixtures/first-visit-tour.html?view=welcome",{waitUntil:"domcontentloaded"});
   await heading.waitFor();
   assert.match(await heading.innerText(),/غرفة التحقيق/,"explicit replay link bypasses visited flag");
   await page.getByRole("button",{name:/تخطي الجولة/}).click();
   await page.goto(origin+"/tests/fixtures/first-visit-tour.html?view=auth",{waitUntil:"domcontentloaded"});
   await page.locator("[data-test-view=auth]").waitFor();
   assert.equal(await page.locator(".ct-tour").count(),0,"login deep link never intercepted");
   assert.deepEqual(errors,[],"no unexpected errors");
   assert.deepEqual(leaks,[],"onboarding never requests external data/APIs");
   console.log("PASS CyberTrace welcome tour "+viewport.width+"px: first visit, decisions, replay, skip, focus, direct routes");
  }finally{await context.close();}
 }
}finally{
 if(browser)await browser.close();
 await vite.close();
}
