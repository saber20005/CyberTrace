import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from "node:fs";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {fileURLToPath} from "node:url";
import {auditFirebaseRuleSources} from "../scripts/firebase-rule-source-guard.mjs";

const repository=fileURLToPath(new URL("../",import.meta.url));
function fixtures(){
 const root=mkdtempSync(join(tmpdir(),"cybertrace-rules-guard-"));
 const put=(path,content)=>{const full=join(root,path);mkdirSync(join(full,".."),{recursive:true});writeFileSync(full,content);};
 put("security/firestore.current.rules","// LEGACY REFERENCE ONLY — DO NOT DEPLOY\nrules_version='2';");
 put("security/firestore.cybertrace-progress.rules","// This is a reference ruleset\nrules_version='2';");
 put("security/firebase.emulator.json",JSON.stringify({firestore:{rules:"security/firestore.current.rules"},emulators:{firestore:{host:"127.0.0.1"},ui:{enabled:false}}}));
 put("security/firebase.cybertrace-emulator.json",JSON.stringify({firestore:{rules:"security/firestore.cybertrace-progress.rules"},emulators:{firestore:{host:"127.0.0.1"},ui:{enabled:false}}}));
 return {root,put,done:()=>rmSync(root,{recursive:true,force:true})};
}
test("checked-in CyberTrace legacy and reference rules stay clearly non-deployable",()=>{
 assert.deepEqual(auditFirebaseRuleSources(repository),[]);
});
test("root Firebase deploy config cannot silently adopt old rules",()=>{
 const f=fixtures();
 try{
  assert.deepEqual(auditFirebaseRuleSources(f.root),[]);
  f.put("firebase.json",JSON.stringify({firestore:{rules:"security/firestore.current.rules"}}));
  assert.match(auditFirebaseRuleSources(f.root).join("\n"),/Production firebase\.json/);
 }finally{f.done();}
});
test("emulator configs cannot be changed to remote hosts or unexpected rules",()=>{
 const f=fixtures();
 try {
  f.put("security/firebase.emulator.json",JSON.stringify({firestore:{rules:"firestore.rules"},emulators:{firestore:{host:"0.0.0.0"},ui:{enabled:true}}}));
  const failures=auditFirebaseRuleSources(f.root).join("\n");
  assert.match(failures,/Unexpected rules source/);
  assert.match(failures,/localhost/);
  assert.match(failures,/UI must remain off/);
 }finally{f.done();}
});
test("a CI workflow cannot publish Firebase rules accidentally",()=>{
 const f=fixtures();
 try{
  f.put(".github/workflows/publish.yml","name: publish\njobs:\n  deploy:\n    steps:\n      - run: firebase deploy --only firestore:rules\n");
  assert.match(auditFirebaseRuleSources(f.root).join("\n"),/may not deploy/);
 }finally{f.done();}
});
