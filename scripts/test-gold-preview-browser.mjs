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
    const page=await context.newPage(),errors=[],external=[];
    page.on("pageerror",err=>errors.push(err.message));
    await context.route("**/*",route=>{
      if(new URL(route.request().url()).origin===origin)return route.continue();
      external.push(route.request().url());
      return route.abort("blockedbyclient");
    });
    try {
      await page.goto(origin+"/tests/fixtures/gold-preview.html",{waitUntil:"domcontentloaded"});
      const panel=page.locator(".ct-amber-compare");
      await panel.waitFor({state:"visible"});
      const toggler=panel.getByRole("button",{name:viewport.width<=600?"فتح خيارات المقارنة":"طي المقارنة"});
      assert.equal(await page.evaluate(()=>document.documentElement.dataset.cybertracePreview),"gold");
      const selectors=[".inv-review",".inv-review-choices>div",".soc-learning-feedback"];
      async function colors() {return page.evaluate(ss=>ss.map(s=>{
        const el=document.querySelector(s),cs=getComputedStyle(el);
        return [s,cs.backgroundImage,cs.backgroundColor,cs.borderTopColor];
      }),selectors)}
      const before=await colors();
      const indicator=await page.locator(".ct-studio-preview-indicator").evaluate(x=>getComputedStyle(x).backgroundColor);
      assert.equal(indicator,"rgb(235, 184, 74)","green status dot becomes gold");
      if(viewport.width<=600){
        assert.equal(await toggler.getAttribute("aria-expanded"),"false");
        const rect=await panel.boundingBox();
        assert(rect.height<110,"collapsed mobile toolbar must be compact");
        await toggler.click();
      }
      assert.equal(await panel.getByRole("button",{name:"الذهبي الجديد"}).getAttribute("aria-pressed"),"true");
      await panel.getByRole("button",{name:"التصميم الحالي"}).click();
      assert.equal(await page.evaluate(()=>document.documentElement.dataset.cybertracePreview),undefined);
      const reverted=await colors();
      assert.notDeepEqual(reverted,before,"switching to current removes preview CSS");
      await panel.getByRole("button",{name:"الذهبي الجديد"}).click();
      assert.equal(await page.evaluate(()=>document.documentElement.dataset.cybertracePreview),"gold");
      assert.deepEqual(await colors(),before,"gold styles restored after comparison");
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false,"no page overflow at "+viewport.width+"px");
      if(viewport.width<=600){
        await panel.getByRole("button",{name:"طي المقارنة"}).click();
        assert.equal(await panel.getByRole("button",{name:"فتح خيارات المقارنة"}).getAttribute("aria-expanded"),"false");
      }
      assert.deepEqual(errors,[]);
      assert.deepEqual(external,[]);
      console.log("PASS gold palette / collapsible toolbar "+viewport.width+"px");
    }finally{await context.close();}
  }
}finally{
  if(browser)await browser.close();
  await server.close();
}
