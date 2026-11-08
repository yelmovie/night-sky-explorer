// Bonus quests and ending movie controls on a completed fixture.
// Usage: PLAYWRIGHT_MODULE=<playwright-core/index.mjs> BROWSER_EXECUTABLE=<chrome> TEST_URL=http://127.0.0.1:5183 node scripts/verify-quest.mjs
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { SAVE_KEY } from '../src/state.js';
import { phase } from '../src/drawing.js';
import { completedState } from './shot-fixture.mjs';
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const b = await chromium.launch({ executablePath: process.env.BROWSER_EXECUTABLE });
const errors = [];
async function open(mutate, reduced = false) {
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  p.on('pageerror', e => errors.push(e.message));
  const s = completedState(5); s.settings.bgm = false; s.settings.reducedMotion = reduced; mutate(s);
  await p.addInitScript(([k, v]) => { if (!sessionStorage.getItem('x')) { localStorage.setItem(k, v); sessionStorage.setItem('x', 1); } }, [SAVE_KEY, JSON.stringify(s)]);
  await p.goto(process.env.TEST_URL || 'http://127.0.0.1:5183/'); await p.waitForTimeout(700); return p;
}
const stored = p => p.evaluate(k => JSON.parse(localStorage.getItem(k)), SAVE_KEY);
const done = s => Object.assign(s, { scene: 'results' }) && Object.assign(s.core, { connections: { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 }, angle: 180, restored: true, reportSeen: true });
let p = await open(done);
await p.click('[data-action="bonus-cloudy"]');
await p.click('[data-action="cloudy-right"]'); await p.click('#cloudy-check');
assert.equal((await stored(p)).bonus.cloudy, '');
const a = phase(7); await p.locator('#cloudy-amount').evaluate((e, v) => { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }, Math.round(a.amount));
await p.click(`[data-action="cloudy-${a.side}"]`); await p.click('#cloudy-check');
assert.equal((await stored(p)).bonus.cloudy, 'done'); console.log('PASS cloudy bonus: wrong then right');
await p.click('.dialog-footer [data-action="close-modal"]'); await p.waitForTimeout(200);
await p.click('[data-action="bonus-planet"]');
await p.selectOption('#mystery-feature', { label: '푸른 대기와 구름' }); await p.selectOption('#mystery-name', 'uranus'); await p.click('#planet-check');
assert.equal((await stored(p)).bonus.planet, '');
await p.selectOption('#mystery-feature', { label: '옅은 청록색 대기' }); await p.click('#planet-check');
assert.equal((await stored(p)).bonus.planet, 'done'); console.log('PASS planet bonus: wrong then right');
assert.ok((await stored(p)).stats.retries >= 5); console.log('PASS retries tracked');
await p.close();
// movie skip (motion) and stepwise (reduced)
const ready = s => Object.assign(s, { scene: 'core' }) && Object.assign(s.core, { connections: { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 }, angle: 180, reportSeen: true });
p = await open(ready);
await p.click('#restore-core'); await p.waitForTimeout(1500);
await p.click('#movie-skip');
assert.equal(await p.locator('.final-movie').getAttribute('data-scene'), '4'); assert.equal(await p.locator('#movie-skip').count(), 0);
await p.keyboard.press('Escape'); await p.locator('.results-v2').waitFor(); console.log('PASS movie skip, Esc goes to certificate');
await p.close();
p = await open(ready, true);
await p.click('#restore-core');
for (let i = 1; i <= 4; i++) { await p.click('#movie-skip').catch(() => {}); }
assert.equal(await p.locator('.final-movie').getAttribute('data-scene'), '4'); console.log('PASS reduced motion steps through scenes');
await p.close();
await b.close();
assert.deepEqual(errors, []); console.log('no page errors');
