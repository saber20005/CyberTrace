import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');

test('explicit dual Firebase identity client never treats matching email as authority',()=>{
 const api=read('../src/blackbox/verifiedIdentityBackend.js');
 assert.match(api,/getAuth\(app\)\.currentUser\?\.uid !== blackboxUid/);
 assert.match(api,/auth\.currentUser\?\.uid !== cybertraceUid/);
 assert.match(api,/getIdToken\(user,true\)/);
 assert.match(api,/linkVerifiedCyberTraceAccount/);
 assert.match(api,/getVerifiedCyberTraceLink/);
 assert.match(api,/unlinkVerifiedCyberTraceAccount/);
 assert.match(api,/ReCaptchaEnterpriseProvider/);
 assert.doesNotMatch(api,/localStorage|sessionStorage|updateDoc|setDoc|\.email ===|email==/);
});

test('opt-in identity panel stays closed before App Check and explicit user consent',()=>{
 const panel=read('../src/blackbox/VerifiedIdentityPanel.jsx');
 const modal=read('../src/blackbox/BlackBoxLink.jsx');
 assert.match(modal,/<VerifiedIdentityPanel blackboxUid=\{uid\}/);
 assert.match(panel,/!identityLinkConfigured/);
 assert.match(panel,/type="checkbox" checked=\{consent\}/);
 assert.match(panel,/disabled=\{!consent\|\|phase==="loading"\}/);
 assert.match(panel,/window\.confirm\(/);
 assert.match(panel,/setLinked\(null\);setPhase\("error"\)/);
 assert.match(panel,/onAuthStateChanged/);
 assert.match(panel,/لا يمنح هذا الربط وحده شهادة أو وصول Pro/);
 const css=read('../src/blackbox/VerifiedIdentityPanel.css');
 assert.match(css,/prefers-reduced-motion:reduce/);
});
