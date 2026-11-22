import assert from "node:assert/strict";
import process from "node:process";
import {createServer} from "vite";
const {chromium}=await import(process.env.CYBERTRACE_PLAYWRIGHT_MODULE||"playwright");
const server=await createServer({server:{host:"127.0.0.1",port:0,strictPort:false},logLevel:"silent"});
let browser;
try{
 await server.listen();
 const origin="http://127.0.0.1:"+server.httpServer.address().port;
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 for(const viewport of [{width:320,height:740},{width:390,height:844},{width:1440,height:1000}]){
  const context=await browser.newContext({viewport});
  const errors=[],external=[];
  await context.route("**/*",route=>{
   if(new URL(route.request().url()).origin===origin)return route.continue();
   external.push(route.request().url());
   return route.abort("blockedbyclient");
  });
  const page=await context.newPage();
  page.on("pageerror",error=>errors.push(error.message));
  try{
   await page.goto(origin+"/tests/fixtures/experience-studio.html",{waitUntil:"domcontentloaded"});
   await page.locator(".ct-studio-preview").waitFor({state:"visible"});
   assert.equal(await page.locator(".ct-studio-preset").count(),3);
   assert.equal(await page.locator(".ct-studio-theme").count(),3);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false,"initial studio fits "+viewport.width+"px");
   const original=await page.locator(".ct-studio-preview").evaluate(el=>getComputedStyle(el).backgroundColor);
   await page.getByRole("button",{name:/Midnight/}).click();
   assert.equal(await page.evaluate(()=>document.documentElement.dataset.ctTheme),"midnight");
   const changed=await page.locator(".ct-studio-preview").evaluate(el=>getComputedStyle(el).backgroundColor);
   assert.notEqual(original,changed,"live preview changes with actual theme");
   await page.getByRole("button",{name:"البنفسجي"}).click();
   assert.equal(await page.evaluate(()=>document.documentElement.dataset.ctAccent),"violet");
   await page.getByRole("button",{name:/قراءة مريحة/}).click();
   assert.equal(await page.evaluate(()=>document.documentElement.dataset.ctTheme),"light");
   assert.equal(await page.evaluate(()=>document.documentElement.dataset.ctContrast),"high");
   await page.getByRole("combobox",{name:"مستوى التعلم الذي اخترته لنفسك"}).selectOption("advanced");
   await page.getByRole("button",{name:/وضع التركيز/}).click();
   assert.equal(await page.getByRole("combobox",{name:"مستوى التعلم الذي اخترته لنفسك"}).inputValue(),"advanced","preset does not change skill level");
   assert.equal(await page.evaluate(()=>document.documentElement.dataset.ctMotion),"reduce");
   assert.equal(await page.evaluate(()=>document.documentElement.dataset.ctDensity),"compact");
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false,"compact studio remains responsive");
   await page.reload({waitUntil:"domcontentloaded"});
   await page.locator(".ct-studio-preview").waitFor({state:"visible"});
   assert.equal(await page.evaluate(()=>document.documentElement.dataset.ctTheme),"midnight","settings persist across reload");
   assert.equal(await page.getByRole("combobox",{name:"مستوى التعلم الذي اخترته لنفسك"}).inputValue(),"advanced");
   await page.getByRole("button",{name:"استعادة الإعدادات الأصلية"}).click();
   assert.equal(await page.evaluate(()=>document.documentElement.dataset.ctTheme),"dark");
   assert.deepEqual(errors,[],"no browser exceptions");
   assert.deepEqual(external,[],"no third party or Firebase requests");
   console.log("PASS studio "+viewport.width+"px: real controls, preview, presets, persistence, reset");
  }finally{await context.close();}
 }
}finally{
 if(browser)await browser.close();
 await server.close();
}
