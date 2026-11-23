import assert from "node:assert/strict";
import process from "node:process";
import { mkdir,writeFile } from "node:fs/promises";
import { createPresentationServer } from "./test-support/presentation-fixture.mjs";
const {chromium}=await import(process.env.CYBERTRACE_PLAYWRIGHT_MODULE||"playwright");
const artifacts=process.env.CYBERTRACE_BROWSER_ARTIFACTS||"/tmp/cybertrace-page-presentation";
const server=await createPresentationServer();
let browser,activePage;
const report=[];
try{
 await server.listen();const origin="http://127.0.0.1:"+server.httpServer.address().port;
 browser=await chromium.launch({executablePath:process.env.CYBERTRACE_CHROMIUM_PATH||undefined,headless:true,args:["--no-sandbox"]});
 await mkdir(artifacts,{recursive:true});
 for(const width of [320,390,768,1440]){
  const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:"reduce"});
  const errors=[],external=[];const page=await context.newPage();activePage=page;page.setDefaultTimeout(18000);
  page.on("pageerror",error=>errors.push(error.message));
  await context.route("**/*",route=>{if(new URL(route.request().url()).origin===origin)return route.continue();external.push(new URL(route.request().url()).hostname);return route.abort("blockedbyclient");});
  await context.addInitScript(()=>{
   localStorage.setItem("cybertrace_completed_cases:v2:presentation-a",JSON.stringify(["INC-0417"]));
   localStorage.setItem("cybertrace_completed_cases:v2:presentation-b",JSON.stringify(["INC-1201","INC-1202"]));
   localStorage.setItem("presentation-private-draft","PRIVATE_KEEP_EXACTLY");
  });
  const fixture=origin+"/tests/fixtures/page-presentation.html";
  await page.goto(fixture,{waitUntil:"domcontentloaded"});
  await page.getByRole("button",{name:/تخطي الجولة/}).click();
  await page.locator(".ct-site-shell").waitFor({state:"visible"});
  await page.locator("h1").first().waitFor({state:"visible"});
  const navigate=async(view,extra={})=>{
   await page.evaluate(({view,extra})=>{const u=new URL(location.href);u.pathname=view==="admin"?"/admin":"/";u.search="";if(view!=="home")u.searchParams.set("view",view);for(const [key,value]of Object.entries(extra))u.searchParams.set(key,value);history.pushState({},"",u);dispatchEvent(new PopStateEvent("popstate"));},{view,extra});
   await page.waitForFunction(view=>document.querySelector('.ct-site-shell')?.dataset.ctView===view,view);
   await page.locator("#ct-page-content h1").first().waitFor({state:"visible"});
  };
  for(const theme of ["dark","light","midnight","gold"]){
   await page.evaluate(async theme=>{const p=await import('/src/utils/uiPreferences.js');const prefs={...p.DEFAULT_UI_PREFERENCES,theme,motion:"reduce",...(theme==="light"?{textSize:"xlarge",contrast:"high"}:{})};p.saveUIPreferences(prefs);p.applyUIPreferences(prefs);},theme);
   for(const view of ["home","library","journeys","soc","certificates","joint-certificate","verify-certificate","pro","verified-soc","settings","auth","admin"]){
    await navigate(view);
    assert.equal(await page.locator('.ct-home-navbar').count(),1,view+' has one shared navigation');
    assert.equal(await page.locator('main').count(),1,view+' keeps one main landmark');
    assert.equal(await page.locator('.ct-site-footer').count(),1,view+' keeps one shared footer');
    assert.equal(await page.locator('.library-footer').count(),0,view+' has no duplicated library footer');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,view+' fits '+width+'px '+theme);
    if([390,1440].includes(width)&&theme==="dark"&&["home","library","journeys","settings","auth"].includes(view))await page.screenshot({path:artifacts+'/'+view+'-'+width+'.png',fullPage:true});
    if(width===390&&theme==="light"&&["library","settings"].includes(view))await page.screenshot({path:artifacts+'/'+view+'-light-'+width+'.png',fullPage:true});
   }
  }
  await navigate('home');
  await page.locator('.ct-more>summary').click();
  await page.getByRole('button',{name:'الدليل التفاعلي للمستخدم الجديد',exact:true}).click();
  await page.locator('#ct-tour-heading').waitFor({state:'visible'});
  await page.getByRole('button',{name:/تخطي الجولة/}).click();
  await page.locator('.ct-site-shell[data-ct-view=home]').waitFor({state:'visible'});
  const dock = page.locator('.ct-quick-dock');
  await dock.locator('summary').focus(); await page.keyboard.press('Enter');
  assert.equal(await dock.evaluate(node => node.open), true);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'expanded shortcut panel fits large text');
  await page.keyboard.press('Escape');
  assert.equal(await dock.evaluate(node => node.open), false);
  assert.equal(await dock.locator('summary').evaluate(node => node === document.activeElement), true, 'Escape restores the shortcut opener');
  // Actual navigation controls exercise the centralized callbacks, including
  // the formerly missing settings and journeys actions from the library.
  await navigate('library');
  await page.locator('.ct-more>summary').click();await page.getByRole('button',{name:'إعدادات العرض',exact:true}).click();
  await page.locator('.ct-studio-preview').waitFor({state:'visible'});
  await page.getByRole('button',{name:/وضع التركيز/}).click();
  assert.equal(await page.evaluate(()=>document.documentElement.dataset.ctTheme),'midnight');
  await page.getByRole('button',{name:/قراءة مريحة/}).click();
  assert.equal(await page.evaluate(()=>document.documentElement.dataset.ctTheme),'light');
  await page.reload({waitUntil:'domcontentloaded'});await page.locator('.ct-studio-preview').waitFor({state:'visible'});
  assert.equal(await page.evaluate(()=>document.documentElement.dataset.ctTheme),'light');
  await page.locator('.ct-more>summary').click();await page.getByRole('button',{name:'المسارات المشتركة',exact:true}).click();
  await page.locator('#ct-suite-title').waitFor({state:'visible'});
  const panel=page.locator('details.ct-suite-card').nth(1);await panel.locator('summary').focus();await page.keyboard.press('Enter');assert.equal(await panel.evaluate(el=>el.open),true);
  await navigate('library');await page.evaluate(()=>window.__pagePresentation.setUser('presentation-a'));
  await page.waitForFunction(()=>document.querySelector('[data-testid="completed-count"]')?.textContent.trim().startsWith('1'));
  await page.evaluate(()=>window.__pagePresentation.setUser('presentation-b'));
  await page.waitForFunction(()=>document.querySelector('[data-testid="completed-count"]')?.textContent.trim().startsWith('2'));
  await page.evaluate(()=>window.__pagePresentation.setUser(null));
  await page.waitForFunction(()=>document.querySelector('[data-testid="completed-count"]')?.textContent.trim().startsWith('0'));
  await navigate('investigation',{case:'INC-0417'});
  assert.equal(await page.locator('.ct-home-navbar').count(),0,'focus mode leaves case tools in control');
  await page.getByRole('button',{name:/ابدأ التحليل/}).click();await page.locator('.inv-options').waitFor({state:'visible'});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'evidence fits expanded text');
  await page.locator('.inv-back').click();await page.locator('.ct-home-navbar').waitFor({state:'visible'});
  assert.equal(await page.evaluate(()=>localStorage.getItem('presentation-private-draft')),'PRIVATE_KEEP_EXACTLY');
  assert.deepEqual(await page.evaluate(()=>window.__pagePresentation.calls()),[],'no authentication submissions in display checks');
  assert.deepEqual(errors,[]);assert.deepEqual(external,[],'all services remain local');
  report.push({width,themes:['dark','light','midnight','gold'],routes:12,ownerIsolation:true,settingsPersistence:true,errors,external});
  console.log('PASS professional pages '+width+'px: 12 routes × 4 themes, shared navigation, settings, focus investigation and owner boundaries');
  await context.close();
 }
 await writeFile(artifacts+'/results.json',JSON.stringify(report,null,2));
}catch(error){if(activePage&&!activePage.isClosed())await activePage.screenshot({path:artifacts+'/failure.png',fullPage:true}).catch(()=>{});throw error;}
finally{if(browser)await browser.close();await server.close();}
