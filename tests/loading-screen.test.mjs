import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
test('initial loader appears before module and preserves analytics',()=>{const html=read('../index.html');assert.ok(html.indexOf('class="ct-loading"')<html.indexOf('type="module"'));assert.match(html,/\/_vercel\/insights\/script\.js/);});
test('all lazy routes use accessible loading component',()=>{const app=read('../src/App.jsx');assert.match(app,/import LoadingScreen/);assert.equal((app.match(/<LoadingScreen inline/g)||[]).length,11);assert.match(app,/view === "pro"/);assert.match(app,/view === "settings"/);assert.match(app,/view === "certificates"/);assert.match(app,/view === "verify-certificate"/);assert.match(app,/view === "joint-certificate"/);assert.match(app,/view === "soc"/);assert.match(app,/view === "verified-soc"/);assert.match(read('../src/components/LoadingScreen.jsx'),/role="status"/);});
test('no artificial waiting and reduced-motion supported',()=>{const css=read('../src/components/LoadingScreen.css');assert.match(css,/prefers-reduced-motion:reduce/);assert.doesNotMatch(read('../src/components/LoadingScreen.jsx'),/setTimeout|setInterval/);});

test('Cyber Scanner uses CSS-only radar on both startup and lazy routes',()=>{
 const html=read('../index.html');
 const component=read('../src/components/LoadingScreen.jsx');
 const css=read('../src/components/LoadingScreen.css');
 assert.match(html,/ct-loading__scanner/);
 assert.match(component,/ct-loading__scanner/);
 assert.match(css,/@keyframes ct-radar/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.doesNotMatch(component,/setTimeout|setInterval|requestAnimationFrame/);
 assert.doesNotMatch(css,/url\(/);
});
