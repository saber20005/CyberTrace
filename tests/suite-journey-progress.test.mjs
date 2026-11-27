import assert from 'node:assert/strict';
import test from 'node:test';
import { projectPracticalDocument, normalizePracticalCompleted } from '../src/blackbox/practicalProgress.js';
import { cyberJourneyProgress } from '../src/utils/suiteJourneyProgress.js';
import { SUITE_PATHWAYS } from '../src/data/unifiedPathways.js';
const now='2026-11-26T14:00:00.000Z';
const track=id=>Object.fromEntries([0,1,2].map(index=>[`${id}-${index}`,now]));
const linked=(completed,extra={})=>({user:{uid:'owner-A'},practical:{ownerUid:'owner-A',phase:'ready',fromCache:false,completed,...extra}});

test('practical projection reads only validated stage completions, never private lab content',()=>{
 const raw={schemaVersion:1,revision:3,progress:{completed:track('logs'),get notes(){throw Error('Private notes must not be projected');},results:'PRIVATE_RESULTS',logs:'PRIVATE_LOGS'}};
 assert.deepEqual(projectPracticalDocument(raw),{completed:track('logs')});
 assert.equal(JSON.stringify(projectPracticalDocument(raw)).includes('PRIVATE'),false);
 for(const completed of [null,[],{'unknown-0':now},{'logs-0':true},{'logs-0':'yesterday'},{'logs-0':'2026-02-30T00:00:00Z'}])assert.equal(normalizePracticalCompleted(completed),null);
 for(const raw of [{schemaVersion:2,revision:1,progress:{completed:{}}},{schemaVersion:1,revision:0,progress:{completed:{}}},null])assert.equal(projectPracticalDocument(raw),null);
});
test('shared journey shows both sites and advances to the first unfinished real step',()=>{
 const summary=cyberJourneyProgress(SUITE_PATHWAYS[0],id=>id==='INC-0417'?'scored':'not-started',linked(track('logs')));
 assert.equal(summary.done,2);assert.equal(summary.total,4);assert.equal(summary.unknown,0);
 assert.equal(summary.next.id,'INC-1201');assert.equal(summary.credentialEligible,false);
 const done=cyberJourneyProgress(SUITE_PATHWAYS[0],()=> 'historical',linked({...track('logs'),...track('integrity')}));
 assert.equal(done.done,4);assert.equal(done.next,null);
});
test('investigation result never completes practical work; partial stages stay unfinished',()=>{
 const scored=cyberJourneyProgress(SUITE_PATHWAYS[0],()=> 'scored',linked({'logs-0':now,'logs-1':now}));
 assert.equal(scored.done,2);assert.equal(scored.steps[1].done,false);assert.equal(scored.next.id,'logs');
 assert.equal(scored.steps[3].done,false);
});
test('guest, loading, errors and another owner remain unknown rather than falsely unfinished',()=>{
 for(const status of [{},{user:{uid:'B'},practical:{ownerUid:'A',phase:'ready',completed:track('logs')}},linked(track('logs'),{phase:'loading'}),linked(track('logs'),{phase:'error'}),linked({'logs-0':true})]){
  const summary=cyberJourneyProgress(SUITE_PATHWAYS[0],()=> 'historical',status);
  assert.equal(summary.done,2);assert.equal(summary.unknown,2);assert.equal(summary.next.status,'unknown');
 }
});
test('validated cached progress is visibly distinguished from fresh account data',()=>{
 const cached=cyberJourneyProgress(SUITE_PATHWAYS[0],()=> 'not-started',linked(track('logs'),{fromCache:true}));
 assert.equal(cached.fromCache,true);assert.equal(cached.done,1);
 assert.equal(cyberJourneyProgress(SUITE_PATHWAYS[0],()=> 'not-started',linked({}, {phase:'unknown',fromCache:true})).unknown,2);
});
