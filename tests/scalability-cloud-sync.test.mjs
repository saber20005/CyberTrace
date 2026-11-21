import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mergeCloudProgress, sameCloudProgress, needsCloudWrite } from '../src/utils/cloudProgressModel.js';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const result=(score=70,at='2026-11-21T11:00:00.000Z')=>({
  attempts:1,lastScore:score,bestScore:score,lastCompletedAt:at,
});
const local=(data={})=>({results: {'INC-0417':result()},completed:['INC-0417'],xp:20,...data});
test('cloud merge preserves case results, cumulative XP and completion union',()=>{
  const cloud={results:{'INC-0512':result(45)},completed:['INC-0512'],xp:25};
  const merged=mergeCloudProgress(cloud,local());
  assert.deepEqual(merged.completed,['INC-0512','INC-0417']);
  assert.equal(merged.xp,25);
  assert.equal(merged.results['INC-0417'].bestScore,70);
  assert.equal(merged.results['INC-0512'].bestScore,45);
});
test('ordering alone is not a server write nor a local change',()=>{
  const a=mergeCloudProgress({
    results:{'INC-0417':result(),'INC-0512':result(50)},
    completed:['INC-0417','INC-0512'],xp:35,
  },{});
  const b=mergeCloudProgress({
    results:{'INC-0512':result(50),'INC-0417':result()},
    completed:['INC-0512','INC-0417'],xp:35,
  },{});
  assert.equal(sameCloudProgress(a,b),true);
  assert.equal(needsCloudWrite(true,a,b),false);
});
test('unchanged snapshots skip redundant transactions; missing doc keeps bootstrap',()=>{
  const remote=local();
  assert.equal(needsCloudWrite(true,remote,local()),false);
  assert.equal(needsCloudWrite(false,null,local()),true);
  assert.equal(needsCloudWrite(true,remote,local({xp:30})),true);
  assert.equal(needsCloudWrite(true,remote,local({results:{'INC-0417':result(70,'2026-11-21T12:00:00.000Z')}})),true);
});
test('cached progress never overrides newer verified-looking local training history',()=>{
  const remote=local({results:{'INC-0417':result(10,'2026-11-20T11:00:00.000Z')},xp:8});
  const current=local();
  const merged=mergeCloudProgress(remote,current);
  assert.equal(merged.results['INC-0417'].bestScore,70);
  assert.equal(merged.results['INC-0417'].lastScore,70);
  assert.equal(merged.xp,20);
  assert.equal(needsCloudWrite(true,remote,current),true);
  const client=read('../src/utils/cloudProgress.js');
  assert.match(client,/getDocFromServer\(ref\)/);
  assert.match(client,/snap\.metadata\.hasPendingWrites/);
  assert.match(client,/localStorage\.getItem\(progressKey\(name\)\) === value/);
  assert.match(client,/if \(snap\.exists\(\) && !needsCloudWrite/);
});
test('invalid, legacy and client-provided scores remain bounded training data',()=>{
  const dirty=local({results:{
    'INC-0417':result(50),
    'INC-0512':{...result(),bestScore:900},
    '__proto__':result(70),
  }});
  const merged=mergeCloudProgress({},dirty);
  assert.deepEqual(Object.keys(merged.results),['INC-0417']);
  assert.equal(merged.results['INC-0417'].bestScore,50);
  assert.equal(sameCloudProgress(merged,mergeCloudProgress({},dirty)),true);
});
