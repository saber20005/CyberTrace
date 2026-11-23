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
   assert.equal(await page.locator(".ct-studio-preset").count(),4);
   assert.equal(await page.locator(".ct-studio-theme").count(),4);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false,"initial studio fits "+viewport.width+"px");

   await page.getByRole("button",{name:/Royal Gold/}).click();
   assert.equal(await page.evaluate(()=>document.documentElement.dataset.ctTheme),"gold");
   assert.equal(await page.getByRole("button",{name:"البنفسجي"}).isDisabled(),true);
   assert.equal(await page.getByRole("button",{name:"السيان"}).isDisabled(),true);
   assert.equal(await page.evaluate(()=>document.documentElement.dataset.ctAccent),"brand");
   const goldBg=await page.locator(".ct-studio-preview").evaluate(el=>getComputedStyle(el).backgroundColor);
   await page.reload({waitUntil:"domcontentloaded"});
   await page.locator(".ct-studio-preview").waitFor({state:"visible"});
   assert.equal(await page.evaluate(()=>document.documentElement.dataset.ctTheme),"gold","gold persists across reload");
   assert.equal(await page.locator(".ct-studio-preview").evaluate(el=>getComputedStyle(el).backgroundColor),goldBg);
   await page.evaluate(()=>{
     const wrap=document.createElement("div");
     wrap.setAttribute("data-gold-test-fixture","");
     wrap.style.cssText="position:fixed;left:0;top:0;opacity:0;pointer-events:none;width:100px;height:100px;overflow:hidden;";
     wrap.innerHTML='<div class="inv-screen"><section class="inv-review"><div class="inv-review-choices"><div>test</div></div></section></div><div class="soc-page"><section class="soc-learning-feedback">test</section></div>';
     document.body.append(wrap);
   });
   const currentGold=await page.evaluate(()=>{
      const names=[".inv-review",".inv-review-choices > div",".soc-learning-feedback"];
      return names.map(selector=>{const cs=getComputedStyle(document.querySelector(selector));return {selector,bg:cs.backgroundColor,image:cs.backgroundImage};});
   });
   assert(currentGold[0].image!=="none","analyst review uses gold gradient instead of original green");
   for(const item of currentGold.slice(1)){
     const rgb=item.bg.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/);
     const color4=item.bg.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
     assert(rgb||color4,"computed background missing: "+JSON.stringify(item));
     const [red,green,blue]=(rgb||color4).slice(1).map(Number);
     // Computed CSS Color 4 may report normalized 0..1 components.
     assert(red>green&&green>blue,"unexpected teal/green card: "+JSON.stringify(item));
   }
   await page.evaluate(()=>document.querySelector("[data-gold-test-fixture]")?.remove());
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false,"Royal Gold fits "+viewport.width+"px");
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
