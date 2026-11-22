import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

test("rendered suite cards and owner switching stay private, accessible and read-only", async () => {
 const prior=globalThis.localStorage;
 const store=new Map();
 globalThis.localStorage={getItem:key=>store.get(key)??null,setItem:(key,val)=>store.set(key,String(val)),removeItem:key=>store.delete(key)};
 const vite=await createServer({server:{middlewareMode:true},appType:"custom",logLevel:"silent"});
 try{
  const [{default:UnifiedJourneys},{setProgressOwner,progressKey}]=await Promise.all([
   vite.ssrLoadModule("/src/pages/UnifiedJourneys.jsx"),
   vite.ssrLoadModule("/src/utils/progressScope.js"),
  ]);
  const render=()=>renderToStaticMarkup(createElement(UnifiedJourneys,{onHome:()=>{},onLibrary:()=>{}}));
  setProgressOwner("render-A");
  store.set(progressKey("cybertrace_completed_cases"),JSON.stringify(["INC-0417","INC-1201"]));
  const a=render();
  assert.equal((a.match(/<details class="ct-suite-card"/g)||[]).length,4);
  assert.equal((a.match(/<li>/g)||[]).length,16);
  assert.equal((a.match(/open=""/g)||[]).length,1);
  assert.match(a,/2 \/ 2/);
  assert.match(a,/إكمال سابق محفوظ دون درجة/);
  assert.match(a,/حالة الإكمال غير معروفة هنا/);
  assert.doesNotMatch(a,/render-A|\buid=|token=|email=/);
  for(const [,href] of a.matchAll(/href="([^"]+)"/g)){
   const u=new URL(href.replaceAll("&amp;","&"));
   assert(["https://blackboxlab.dev","https://www.cybertracelab.dev"].includes(u.origin));
   assert(!["uid","email","token","score"].some(key=>u.searchParams.has(key)));
  }
  setProgressOwner("render-B");
  const b=render();
  assert.match(b,/0 \/ 2/);
  assert.doesNotMatch(b,/إكمال سابق محفوظ دون درجة/);
  setProgressOwner(null);
  assert.match(render(),/0 \/ 2/);
  setProgressOwner("render-A");
  assert.match(render(),/2 \/ 2/);
  assert.equal(store.size,1,"view rendering never writes to localStorage");
 }finally{
  await vite.close();
  if(prior===undefined)delete globalThis.localStorage;else globalThis.localStorage=prior;
 }
});
