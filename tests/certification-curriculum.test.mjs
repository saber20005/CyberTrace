import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CASES} from '../src/data/cases.js';
import {buildCertificateTrainingCurriculum,CERTIFICATE_PREPARATION} from '../src/data/certificationCurriculum.js';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');

test('all eight existing investigation categories have grounded, distinct skill outcomes',()=>{
 const data=buildCertificateTrainingCurriculum(CASES);
 assert.equal(data.length,8);
 assert.deepEqual(data.map(x=>x.id),['identity','email','malware','web','data','cloud','network','supply-chain']);
 assert.deepEqual(data.map(x=>x.count),[6,3,3,3,3,3,4,3]);
 const all=data.flatMap(x=>x.caseIds);
 assert.equal(all.length,28);
 assert.equal(new Set(all).size,28);
 assert.equal(Object.keys(CERTIFICATE_PREPARATION).length,8);
 for(const row of data){
   assert(row.goals.outcome.length>30);
   assert(row.goals.practice.length>30);
   assert.equal(row.goals.steps.length,3);
   assert.equal(new Set(row.goals.steps).size,3);
   for(const step of row.goals.steps)assert(step.length>50);
   assert(row.goals.deliverable.length>45);
   assert(row.goals.acceptance.length>45);
   assert.equal(row.count,row.cases.length);
 }
});
test('learning preparation does not become a new client certificate authority',()=>{
 const app=read('../src/pages/Certificates.jsx');
 assert.match(app,/buildCertificateTrainingCurriculum\(cases\)/);
 assert.match(app,/ct-cert-curriculum-grid/);
 assert.match(app,/فتح مكتبة التحقيقات/);
 assert.match(app,/إصدار شهادة موثّقة يتطلب تقييمًا مستقلًا على الخادم/);
 assert.match(app,/blackboxlab\.dev\/evidence-labs\.html/);
 assert.match(app,/onLibrary/);
 assert.match(app,/item\.goals\.steps\.map/);
 assert.match(app,/item\.goals\.deliverable/);
 assert.match(app,/item\.goals\.acceptance/);
 assert.match(app,/ليست فحصًا خادميًا أو قبولًا مستقلًا للأدلة/);
 assert.doesNotMatch(read('../src/data/certificationCurriculum.js'),/setDoc\(|localStorage|certificateId:|verifiedByServer: true/);
});
