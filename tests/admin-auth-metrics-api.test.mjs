import test from 'node:test';
import assert from 'node:assert/strict';
import {makeAuthMetricsHandler} from '../api/admin/auth-metrics.mjs';
const mock=()=>({code:0,body:null,setHeader(){},status(code){this.code=code;return this;},json(body){this.body=body;return this;}});
const auth={authorization:'Bearer a.b.c'};
test('rejects method, missing token, invalid token and non-admin before upstream calls',async()=>{
 let calls=0;const fetcher=async()=>{calls++;throw Error('unexpected');};
 const handler=makeAuthMetricsHandler({env:{},fetcher,verify:async()=>({uid:'user',admin:false})});
 for(const [method,headers,code] of [['POST',auth,405],['GET',{},401],['GET',auth,403]]){
  const res=mock();await handler({method,headers},res);assert.equal(res.code,code);
 }
 const invalid=makeAuthMetricsHandler({env:{},fetcher,verify:async()=>{throw Error('invalid');}});
 const res=mock();await invalid({method:'GET',headers:auth},res);assert.equal(res.code,401);assert.equal(calls,0);
});
test('admin with no production flag gets unavailable rather than fake data',async()=>{
 const handler=makeAuthMetricsHandler({env:{VERCEL_ENV:'production'},verify:async()=>({uid:'admin',admin:true}),fetcher:async()=>{throw Error('unexpected');}});
 const res=mock();await handler({method:'GET',headers:auth},res);assert.equal(res.code,200);assert.equal(res.body.status,'data_source_not_configured');assert.equal(res.body.metrics,null);
});
test('missing WIF setup fails closed even when enabled',async()=>{
 const handler=makeAuthMetricsHandler({env:{VERCEL_ENV:'production',ADMIN_AUTH_METRICS_ENABLED:'true'},verify:async()=>({uid:'admin',admin:true})});
 const res=mock();await handler({method:'GET',headers:auth},res);assert.equal(res.code,503);assert.equal(res.body.metrics,null);
});
