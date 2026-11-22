import assert from "node:assert/strict";
import process from "node:process";
import { createServer } from "vite";
import { buildCatalogOverview } from "../api/admin/summary.mjs";

const { chromium }=await import(process.env.CYBERTRACE_PLAYWRIGHT_MODULE||"playwright");
const vite=await createServer({server:{host:"127.0.0.1",port:0,strictPort:false},logLevel:"silent"});
let browser;
const catalog=buildCatalogOverview();
const sample={schemaVersion:1,status:"catalog_only",catalog,metrics:null,availability:{
 userTotals:"not_configured",investigationOutcomes:"not_verified",revenue:"not_configured",
 auditEvents:"not_configured",revocationAwareAdmin:"not_enabled"
}};
try{
 await vite.listen();
 const origin="http://127.0.0.1:"+vite.httpServer.address().port;
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 for(const viewport of [{width:320,height:740},{width:390,height:844},{width:1440,height:1000}]){
  const context=await browser.newContext({viewport});
  const errors=[],thirdParty=[],requestAuth=[];
  let signalLate;
  const lateRequested = new Promise(resolve => { signalLate = resolve; });
  let releaseLate;
  const lateResponse = new Promise(resolve => { releaseLate = resolve; });
  await context.route("**/*",async route=>{
   const request=route.request(),url=new URL(request.url());
   if(url.origin!==origin){
    thirdParty.push(url.hostname);
    return route.abort("blockedbyclient");
   }
   if(url.pathname==="/api/admin/summary"){
    const auth=request.headers()["authorization"]||"";
    requestAuth.push(auth);
    if(auth==="Bearer fixture-slowadmin") {
     signalLate();
     await lateResponse;
     try { return await route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(sample)}); }
     catch { return; } // prior request was cancelled when identity changed
    }
    if(auth==="Bearer fixture-manager")return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(sample)});
    if(auth==="Bearer fixture-revoked")return route.fulfill({status:401,contentType:"application/json",body:'{"error":"unauthorized"}'});
    if(auth==="Bearer fixture-offline")return route.fulfill({status:503,contentType:"application/json",body:'{"error":"unavailable"}'});
    return route.fulfill({status:403,contentType:"application/json",body:'{"error":"forbidden"}'});
   }
   return route.continue();
  });
  const page=await context.newPage();
  page.on("pageerror",err=>errors.push(err.message));
  const checkFit=async ()=>assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false,"no horizontal overflow "+viewport.width);
  const owner=async uid=>page.evaluate(next=>window.__adminTest.setIdentity(next),uid);
  try{
   await page.goto(origin+"/tests/fixtures/admin-operations.html",{waitUntil:"domcontentloaded"});
   await page.getByRole("heading",{name:"مركز إدارة CyberTrace"}).waitFor();
   await page.getByRole("alert").getByText("سجّل الدخول بحساب إداري مخوّل لعرض هذه الصفحة.").waitFor();
   assert.equal(await page.locator(".admin-kpis").count(),0,"guest sees no privileged data");
   assert.equal(requestAuth.length,0,"guest sends no auth request");
   await checkFit();

   await owner("ordinary");
   await page.getByRole("alert").getByText("الوصول مرفوض من الخادم. هذا الحساب لا يحمل صلاحية الإدارة.").waitFor();
   assert.equal(await page.locator(".admin-kpis").count(),0,"ordinary account sees no cards");

   await owner("manager");
   await page.locator(".admin-kpis").waitFor({state:"visible"});
   assert.match(await page.locator(".admin-kpis").innerText(),new RegExp(String(catalog.cases)));
   assert.match(await page.locator(".admin-kpis").innerText(),/غير متاح/);
   assert.equal(await page.locator(".admin-kpis article").count(),4);
   await checkFit();

   await page.getByRole("button",{name:"محتوى التدريب"}).click();
   const filter=page.getByRole("combobox",{name:"المجال"});
   await filter.selectOption("web");
   assert.equal(await page.locator(".admin-list").first().locator(":scope > div").count(),1,"category filter shows the selected category");
   await page.getByRole("button",{name:"الأمان والجاهزية"}).click();
   assert.match(await page.locator(".admin-surface").innerText(),/التحقق من إلغاء الجلسات/);
   assert.match(await page.locator(".admin-surface").innerText(),/غير مفعّل/);
   await checkFit();

   await owner("revoked");
   await page.getByRole("alert").getByText("انتهت صلاحية التحقق أو رُفض الرمز. أعد تسجيل الدخول.").waitFor();
   assert.equal(await page.locator(".admin-tabs").count(),0,"revoked token hides previous manager dashboard");
   await owner("offline");
   await page.getByRole("alert").getByText("تعذّر التحقق من واجهة الإدارة. لا تُعرض بيانات مخزنة أو افتراضية بدل النتيجة الخادمية.").waitFor();
   assert.equal(await page.locator(".admin-kpis").count(),0,"failed request does not show prior data");

   // A delayed response from a previous admin must never reveal its data
   // after another account has been selected. Keep the same component mounted.
   await owner("slowadmin");
   await lateRequested;
   await owner("ordinary");
   await page.getByRole("alert").getByText("الوصول مرفوض من الخادم. هذا الحساب لا يحمل صلاحية الإدارة.").waitFor();
   releaseLate();
   await page.waitForTimeout(60);
   assert.equal(await page.locator(".admin-kpis").count(),0,"late privileged response must not leak into the next account");
   await owner(null);
   await page.getByRole("alert").getByText("سجّل الدخول بحساب إداري مخوّل لعرض هذه الصفحة.").waitFor();
   assert.equal(await page.locator(".admin-tabs").count(),0);
   assert.deepEqual(thirdParty,[],"no requests to other websites");
   assert.deepEqual(errors,[],"no runtime browser errors");
   assert.equal(requestAuth.every(x=>/^Bearer fixture-/.test(x)),true,"only simulated test token used");
   assert(requestAuth.includes("Bearer fixture-slowadmin"),"slow auth request was exercised");
   console.log("PASS admin "+viewport.width+"px: guest denied, non-admin denied, admin data scoped, filter, revoked/offline deny, logout");
  }finally{await context.close();}
 }
}finally{
 if(browser)await browser.close();
 await vite.close();
}
