import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
test('initial loader appears before module and preserves analytics',()=>{const html=read('../index.html');assert.ok(html.indexOf('class="ct-loading"')<html.indexOf('type="module"'));assert.match(html,/\/_vercel\/insights\/script\.js/);});
test('all lazy routes use accessible loading component',()=>{const app=read('../src/App.jsx');assert.match(app,/import LoadingScreen/);assert.equal((app.match(/<LoadingScreen inline/g)||[]).length,3);assert.match(read('../src/components/LoadingScreen.jsx'),/role="status"/);});
test('no artificial waiting and reduced-motion supported',()=>{const css=read('../src/components/LoadingScreen.css');assert.match(css,/prefers-reduced-motion:reduce/);assert.doesNotMatch(read('../src/components/LoadingScreen.jsx'),/setTimeout|setInterval/);});
