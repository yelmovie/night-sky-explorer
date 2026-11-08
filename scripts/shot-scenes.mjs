// Screenshot scenes for visual QA. Fixtures fill real drafts and pass the normal completion rules.
// Usage: PLAYWRIGHT_MODULE=<playwright-core/index.mjs> BROWSER_EXECUTABLE=<chrome> TEST_URL=http://127.0.0.1:5183 node scripts/shot-scenes.mjs [shot...]
// A shot is `scene`, `scene@N` (first N missions really completed) or one of the named shots below.
import { pathToFileURL } from 'node:url';
import { mkdir } from 'node:fs/promises';
import { SAVE_KEY } from '../src/state.js';
import { completedState } from './shot-fixture.mjs';

const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const base = process.env.TEST_URL || 'http://127.0.0.1:5183';
const out = process.env.SHOT_DIR || '.cache/shots';
const sizes = (process.env.TEST_SIZES || '1280x800').split(',').map(size => size.split('x').map(Number));
const defaults = ['home', 'intro', 'map@2', 's1a', 's1b', 's2a', 's2b', 's3a', 's3b', 's4a', 's4b', 's5a', 's5b', 'reward@1', 'kit@3', 'report', 'core-half', 'core-ready', 'movie', 'movie-end', 'results-done', 'bonus-cloudy', 'bonus-planet'];
const shots = process.argv.slice(2).length ? process.argv.slice(2) : defaults;

function fixture(shot) {
  const [name, count] = shot.split('@');
  const done = count ? +count : ['report', 'core-half', 'core-ready', 'movie', 'movie-end', 'results-done', 'bonus-cloudy', 'bonus-planet'].includes(name) ? 5 : 0;
  const s = completedState(done);
  const scene = { intro: 'home', report: 'core', 'core-half': 'core', 'core-ready': 'core', movie: 'core', 'movie-end': 'core', 'results-done': 'results', 'bonus-cloudy': 'results', 'bonus-planet': 'results', reward: 's1b', kit: 'map', hint: 's1a' }[name] || name;
  Object.assign(s, { scene, resume: scene });
  s.settings.bgm = false;
  if (name === 'intro') s.started = false, s.intro = false;
  if (!count && !done && !['home', 'intro', 'map'].includes(name)) s.settings.adminUnlock = true;
  if (['core-half', 'core-ready', 'movie', 'movie-end'].includes(name)) s.core.reportSeen = true;
  if (name === 'core-half') s.core.connections = { 1: 1, 2: 2, 3: 3 };
  if (['core-ready', 'movie', 'movie-end'].includes(name)) Object.assign(s.core, { connections: { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 }, angle: 180 });
  if (['results-done', 'bonus-cloudy', 'bonus-planet'].includes(name)) Object.assign(s.core, { connections: { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 }, angle: 180, restored: true, reportSeen: true });
  return { name, s };
}
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXECUTABLE, headless: true });
const errors = [];
for (const [width, height] of sizes) {
  for (const shot of shots) {
    const { name, s } = fixture(shot);
    const page = await browser.newPage({ viewport: { width, height }, hasTouch: true });
    page.on('pageerror', error => errors.push(`${shot}: ${error.message}`));
    await page.addInitScript(([key, value]) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem(key, value); sessionStorage.setItem('seeded', '1'); } }, [SAVE_KEY, JSON.stringify(s)]);
    await page.goto(base);
    await page.waitForTimeout(s.scene === 'map' ? 2500 : 900);
    const click = async selector => { await page.locator(selector).first().click(); await page.waitForTimeout(500); };
    if (name === 'intro') await click('[data-action="start"]');
    if (name === 'reward') await click('#stage-next');
    if (name === 'kit') { await click('[data-action="kit"]'); await page.locator('.kit-item summary').first().click(); }
    if (name === 'movie' || name === 'movie-end') { await click('#restore-core'); await page.waitForTimeout(name === 'movie' ? 4500 : 25500); }
    if (name.startsWith('bonus-')) await click(`[data-action="${name}"]`);
    if (name === 'hint') await click('[data-action="hint"]');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    if (overflow) errors.push(`${shot} ${width}x${height}: horizontal overflow`);
    await page.screenshot({ path: `${out}/${shot.replace('@', '-')}-${width}x${height}.png` });
    await page.close();
  }
}
await browser.close();
console.log(errors.length ? errors.join('\n') : 'no page errors');
