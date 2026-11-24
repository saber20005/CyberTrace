import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = p => readFileSync(new URL(p, import.meta.url), 'utf8');

test('Home navbar groups route actions and does not lose the identity or logout flows', () => {
  const nav=read('../src/components/HomeNavbar.jsx');
  for (const key of ['onLibrary','onSoc','onCertificates','onPro','onAuth','onLogout','onBlackBoxLink']) {
    assert(nav.includes(key), key);
  }
  assert.match(nav,/className="nav-library ct-primary-route"/);
  assert.match(nav,/className="ct-nav-dropdown ct-more"/);
  assert.match(nav,/className="ct-nav-dropdown ct-account-menu"/);
  assert.match(nav,/className="ct-mobile-account"/);
  assert.match(nav,/BlackBoxAccountButton/);
  assert.match(nav,/XPBadge/);
  assert.match(nav,/مناوبات SOC/);
  assert.match(nav,/شهاداتي/);
  assert.match(nav,/Suite Pro/);
  assert.match(nav,/عن المنصة/);
  assert.match(nav,/كيف تعمل/);
  assert.match(nav,/تسجيل الخروج/);
  assert.doesNotMatch(nav,/getDoc|signOut\(auth\)|setDoc|localStorage/);
});

test('mobile navbar does not scroll sideways and restores account access through More', () => {
  const css=read('../src/components/HomeNavbar.css');
  assert.match(css,/max-width:\s*680px/);
  assert.match(css,/\.ct-home-navbar \.ct-account-menu\s*\{\s*display:\s*none;?\s*\}/);
  assert.match(css,/\.ct-mobile-account\s*\{\s*display:\s*grid/);
  assert.match(css,/overflow:\s*visible/);
  assert.match(css,/prefers-reduced-motion:\s*reduce/);
  const nav=read('../src/components/HomeNavbar.jsx');
  assert.match(nav,/document\.addEventListener\("pointerdown"/);
  assert.match(nav,/event\.key === "Escape"/);
});

test('home integration uses one navbar component, keeping existing auth and routes intact', () => {
  const app=read('../src/App.jsx');
  assert.match(app,/<SiteShell view=\{view\} user=\{user\}/);
  assert.match(app,/onLogout=\{handleLogout\}/);
  assert.match(app,/onBlackBoxLink=\{blackBox\.openLink\}/);
  assert.match(app,/onAuth=\{\(\) => navigate\(\{ view: "auth" \}\)\}/);
  const shell=read('../src/components/SiteShell.jsx');
  assert.match(shell,/<AppNavigation/);
  assert.doesNotMatch(app,/<QuickDock/);
  assert.match(app,/signOut\(auth\)/);
});

test('investigation library uses the SAME compact accessible header as home',()=>{
  const library=read('../src/pages/InvestigationLibrary.jsx');
  const app=read('../src/App.jsx');
  const nav=read('../src/components/HomeNavbar.jsx');
  assert.match(library,/<HomeNavbar active="library"/);
  assert.match(library,/onBlackBoxLink=\{onBlackBoxLink\}/);
  assert.match(library,/onLogout=\{onLogout\}/);
  assert.match(app,/blackBoxConnected=\{Boolean\(blackBox\.status\.user\)\}/);
  assert.match(nav,/aria-current=\{active === "library" \? "page" : undefined\}/);
  assert.doesNotMatch(library,/className="navbar library-nav"/);
});
