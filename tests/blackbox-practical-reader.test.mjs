import test from 'node:test';
import assert from 'node:assert/strict';
import {createBlackBoxBridge} from '../src/blackbox/controller.js';
const now='2026-11-26T14:00:00.000Z';
const completed=Object.fromEntries([0,1,2].map(i=>['logs-'+i,now]));
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
async function setup(t){
 let auth;const reads=[],writes=[];
 const backend={onUserChanged(cb){auth=cb;cb(null);return()=>{};},watchPracticalProgress(uid,next,error){const read={uid,next,error,stopped:false};reads.push(read);return()=>{read.stopped=true;};},async writeReceipt(){writes.push('unexpected');},async signOut(){auth(null);}};
 const bridge=createBlackBoxBridge({config:{enabled:true},backendFactory:async()=>backend,storage:{length:0}});
 t.after(()=>bridge.dispose());await bridge.start();await tick();
 return{bridge,reads,writes,setUser:uid=>auth(uid?{uid}:null)};
}
test('practical reads are lazy, owner-scoped and removed when the page stops watching',async t=>{
 const {bridge,reads,writes,setUser}=await setup(t);setUser('A');await tick();assert.equal(reads.length,0);
 const stop=bridge.watchPracticalProgress();assert.equal(reads.length,1);assert.equal(reads[0].uid,'A');assert.equal(bridge.getStatus().practical.phase,'loading');
 reads[0].next({completed,fromCache:false,exists:true,notes:'PRIVATE'});
 assert.deepEqual(bridge.getStatus().practical.completed,completed);assert.equal(JSON.stringify(bridge.getStatus().practical).includes('PRIVATE'),false);
 stop();stop();assert.equal(reads[0].stopped,true);assert.equal(bridge.getStatus().practical.ownerUid,null);
 reads[0].next({completed,fromCache:false,exists:true});assert.deepEqual(bridge.getStatus().practical.completed,{});assert.deepEqual(writes,[]);
});
test('account switching clears prior practical progress and ignores late callbacks/errors',async t=>{
 const {bridge,reads,setUser}=await setup(t);bridge.watchPracticalProgress();setUser('A');reads[0].next({completed,fromCache:false,exists:true});
 setUser('B');assert.equal(reads[0].stopped,true);assert.equal(reads[1].uid,'B');assert.equal(bridge.getStatus().practical.phase,'loading');assert.deepEqual(bridge.getStatus().practical.completed,{});
 reads[0].next({completed,fromCache:false,exists:true});reads[0].error({code:'permission-denied'});
 assert.equal(bridge.getStatus().practical.ownerUid,'B');assert.equal(bridge.getStatus().practical.error,null);
 reads[1].next({completed:{},fromCache:false,exists:false});assert.equal(bridge.getStatus().practical.phase,'ready');assert.deepEqual(bridge.getStatus().practical.completed,{});
 await bridge.disconnect();assert.equal(reads[1].stopped,true);assert.equal(bridge.getStatus().practical.ownerUid,null);
});
test('offline missing snapshots stay unknown, cache labels survive, and retry clears invalid data',async t=>{
 const {bridge,reads,setUser}=await setup(t);bridge.watchPracticalProgress();setUser('A');
 reads[0].next({completed:{},fromCache:true,exists:false});assert.equal(bridge.getStatus().practical.phase,'unknown');
 reads[0].next({completed,fromCache:true,exists:true});assert.equal(bridge.getStatus().practical.fromCache,true);
 reads[0].error({code:'unavailable'});assert.equal(bridge.getStatus().practical.phase,'error');assert.deepEqual(bridge.getStatus().practical.completed,{});
 bridge.retryPracticalProgress();assert.equal(reads[0].stopped,true);assert.equal(reads.length,2);
 reads[1].next({completed:{'logs-0':true},fromCache:false,exists:true});assert.equal(bridge.getStatus().practical.phase,'error');
 assert.deepEqual(bridge.getStatus().practical.completed,{});
});
test('multiple consumers share one subscription; disposing rejects all later data',async t=>{
 const {bridge,reads,setUser}=await setup(t);setUser('A');const one=bridge.watchPracticalProgress(),two=bridge.watchPracticalProgress();assert.equal(reads.length,1);
 one();assert.equal(reads[0].stopped,false);two();assert.equal(reads[0].stopped,true);
 bridge.watchPracticalProgress();assert.equal(reads.length,2);bridge.dispose();assert.equal(reads[1].stopped,true);
 reads[1].next({completed,fromCache:false,exists:true});assert.deepEqual(bridge.getStatus().practical.completed,{});
});
