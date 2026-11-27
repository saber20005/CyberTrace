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
  assert.equal((a.match(/<li(?:\s|>)/g)||[]).length,16);
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

test('rendered combined journeys keep account source, unknown/cache states and practical independence explicit',async()=>{
 const prior=globalThis.localStorage;globalThis.localStorage={getItem:()=>null};
 const vite=await createServer({server:{middlewareMode:true},appType:'custom',logLevel:'silent'});
 try{
  const [{default:UnifiedJourneys},{BlackBoxContext}]=await Promise.all([vite.ssrLoadModule('/src/pages/UnifiedJourneys.jsx'),vite.ssrLoadModule('/src/blackbox/useBlackBox.js')]);
  const completed=Object.fromEntries([0,1,2].map(i=>['logs-'+i,'2026-11-26T14:00:00Z']));
  const render=practical=>renderToStaticMarkup(createElement(BlackBoxContext.Provider,{value:{status:{enabled:true,user:{uid:'current-owner'},practical},watchPracticalProgress:()=>()=>{},retryPracticalProgress(){},openLink(){}}},createElement(UnifiedJourneys,{})));
  const ready=render({ownerUid:'current-owner',phase:'ready',completed,fromCache:false});
  assert.match(ready.replace(/<[^>]+>/g,''),/خطوات مسجّلة: 1 \/ 4/);assert.match(ready,/جميع مراحل المسار مؤكدة من حسابك/);assert.doesNotMatch(ready,/current-owner|uid=|token=|email=/);
  const other=render({ownerUid:'previous-owner',phase:'ready',completed,fromCache:false});assert.doesNotMatch(other,/جميع مراحل المسار مؤكدة من حسابك/);assert.match(other,/حالة الإكمال غير معروفة هنا/);
  assert.match(render({ownerUid:'current-owner',phase:'ready',completed,fromCache:true}),/نسخة محفوظة/);
  const error=render({ownerUid:'current-owner',phase:'error',completed:{},fromCache:false});assert.match(error,/إعادة تحميل التقدم/);assert.match(error,/غير معروفة الآن/);
 }finally{await vite.close();if(prior===undefined)delete globalThis.localStorage;else globalThis.localStorage=prior;}
});
