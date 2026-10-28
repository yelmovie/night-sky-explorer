import { pathToFileURL } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { freshState, completeStage, SAVE_KEY } from '../src/state.js';
import { planets, bodies, solarOrder, patternRegions } from '../src/data.js';

const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const base = process.env.TEST_URL || 'http://127.0.0.1:4183';
const output = new URL('../.cache/classroom-qa/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();
const errors = [], layouts = [], media = [];
page.on('pageerror', error => errors.push(error.message));
page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()}: ${response.url()}`); });
page.setDefaultTimeout(12000);
function fixture() {
  const state = freshState(); state.started = true; state.settings.adminUnlock = true; state.settings.muted = true;
  state.drafts.moon.photos = [1.5, 2].map(zoom => ({ x: 0, y: 0, zoom, focus: 72 }));
  state.drafts.moon.comparisons = [0, 1].map(index => ({ spots: [{ x: 25 + index * 10, y: 25 }, { x: 65, y: 60 + index * 10 }], observation: '밝은 곳과 어두운 곳의 무늬를 비교했어요.' }));
  state.drafts.phases.captures = [3, 7, 10, 17, 21, 25];
  for (const day of [14, 24]) state.drafts.phases.predictions[day] = { amount: 65, side: 'right', original: { amount: 40, side: 'right' }, revealed: true, overlay: true, reflection: '처음 예상과 관측의 밝은 부분을 비교했어요.' };
  state.drafts.planets.records = Object.fromEntries(planets.map(planet => [planet.id, { feature: planet.feature, candidate: planet.id }]));
  state.drafts.planets.order = [...solarOrder];
  state.drafts.planets.groups = Object.fromEntries(planets.map(planet => [planet.id, planet.group]));
  state.drafts.classification.viewed = bodies.map(body => body.id);
  state.drafts.classification.answers = Object.fromEntries(bodies.map(body => [body.id, { kind: body.kind, reason: body.evidence }]));
  state.drafts.pattern.observed = Object.values(patternRegions).flatMap(region => region.stars);
  for (const [id, region] of Object.entries(patternRegions)) {
    const lines = [[region.stars[0], region.stars[1]], [region.stars[1], region.stars[2]]];
    state.drafts.pattern.cases[id] = { lines, original: lines, compared: true, showReference: true, reflection: '같은 별을 다르게 연결했지만 별의 위치는 같아요.' };
  }
  for (let number = 1; number <= 5; number++) assert.ok(completeStage(state, number));
  return state;
}
try {
await page.goto(base);
async function openScene(scene, state = fixture()) {
  state.scene = scene; state.resume = scene;
  await page.evaluate(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key: SAVE_KEY, state });
  await page.reload(); await page.locator('main').waitFor(); await page.evaluate(() => document.fonts.ready);
}
async function layout(label) {
  const result = await page.evaluate(label => {
    const visible = element => element.checkVisibility() && !element.closest('details:not([open])');
    const nodes = [...document.querySelectorAll('main button, main input, main select, main textarea, dialog[open] button')].filter(element => visible(element) && !element.closest('.world-layer'));
    const outside = nodes.filter(element => { const box = element.getBoundingClientRect(); return box.left < -1 || box.right > innerWidth + 1 || (element.closest('.dialog-heading,.dialog-footer') && (box.top < 0 || box.bottom > innerHeight + 1)); }).map(element => element.textContent.trim().slice(0, 50));
    const dialog = document.querySelector('dialog[open]'), box = dialog?.getBoundingClientRect();
    const toolbox = document.querySelector('.toolbox');
    return { label, width: innerWidth, height: innerHeight, pageOverflow: document.documentElement.scrollWidth > innerWidth + 1, outside, dialogCenterDelta: box ? Math.abs(box.top + box.height / 2 - innerHeight / 2) : 0, toolboxScroll: toolbox ? toolbox.scrollHeight - toolbox.clientHeight : 0 };
  }, label);
  layouts.push(result);
  assert.equal(result.pageOverflow, false, label + ' horizontal overflow');
  assert.deepEqual(result.outside, [], label + ' offscreen controls');
  assert.ok(result.dialogCenterDelta < 4, label + ' dialog not centered');
}
const sizes = process.env.TEST_SIZES ? process.env.TEST_SIZES.split(',').map(value => value.split('x').map(Number)) : [[1280, 800], [1024, 768], [1920, 1080], [1440, 900], [1024, 600], [375, 812]];
for (const [width, height] of sizes) {
  console.log(`Checking layout ${width}×${height}`);
  await page.setViewportSize({ width, height });
  for (const scene of (process.env.TEST_FOCUS ? process.env.TEST_FOCUS.split(',') : ['home', 'map', ...[1, 2, 3, 4, 5].flatMap(number => [`s${number}a`, `s${number}b`]), 'core', 'results'])) {
    await openScene(scene);
    if (scene === 's4a') await page.locator('[data-learning="body-sun"]').click();
    await layout(scene);
    if (scene.startsWith('s') && await page.locator('[data-learning="round-1"]').count()) { await page.locator('[data-learning="round-1"]').click(); await layout(scene + '-tab2'); }
    if (scene === 's4a') { await page.locator('[data-learning="body-polaris"]').click(); await layout(scene + '-fact'); }
    if (width === 1280 || width === 1920) await page.screenshot({ animations: 'disabled', timeout: 30000, path: new URL(`${width}-${scene}.png`, output).pathname.replace(/^\/(\w:)/, '$1').replaceAll('%20', ' ') });
  }
  await page.locator('[data-action="settings"]').click(); await layout('settings');
  await page.locator('summary').filter({ hasText: '완료한 개념영상' }).click();
  await page.locator('[data-action="library-1"]').click(); await layout('concept');
  await page.locator('[data-action="close-modal"]').last().click();
  await page.locator('summary').filter({ hasText: '완료한 개념영상' }).waitFor();
  await page.locator('[data-action="close-modal"]').last().click();
  await openScene('s1b'); await page.locator('[data-action="hint"]').click(); await layout('hint');
}
await page.setViewportSize({ width: 1280, height: 800 });
await openScene('s1b');
await page.locator('[data-action="complete"]').click(); await layout('reward');
await page.locator('[data-action="reward-video-1"]').click();
await page.waitForFunction(() => document.querySelector('video')?.readyState >= 2);
await page.locator('video').evaluate(video => { video.currentTime = 7; });
await page.waitForFunction(() => document.querySelector('.concept-caption')?.textContent.includes('원래'));
await page.screenshot({ path: new URL('1280-concept.png', output).pathname.replace(/^\/(\w:)/, '$1').replaceAll('%20', ' ') });
await page.keyboard.press('Escape');
await page.locator('[data-action="reward-video-1"]').waitFor();
for (let number = 1; number <= 5; number++) {
  const info = await page.evaluate(async number => {
    const video = document.createElement('video'); video.muted = true; video.src = `/assets/concepts/stage-${number}.mp4`;
    await new Promise((resolve, reject) => { video.onloadeddata = resolve; video.onerror = reject; });
    const info = { number, duration: video.duration, width: video.videoWidth, height: video.videoHeight };
    video.removeAttribute('src'); video.load(); return info;
  }, number);
  media.push(info); assert.equal(info.duration, 10); assert.equal(info.width, 1280); assert.equal(info.height, 720);
}
const audioFiles = ['click', 'capture', 'place', 'discover', 'success', 'hint'];
for (const name of audioFiles) {
  const duration = await page.evaluate(async name => {
    const audio = new Audio(`/assets/audio/${name}.ogg`);
    await new Promise((resolve, reject) => { audio.onloadedmetadata = resolve; audio.onerror = reject; });
    const duration = audio.duration; audio.removeAttribute('src'); audio.load(); return duration;
  }, name);
  assert.ok(duration > 0 && duration < 5, name + ' sound decode');
}
await page.keyboard.press('Escape');
await page.locator('[data-action="settings"]').click();
await page.locator('summary').filter({ hasText: '완료한 개념영상' }).click();
await page.route('**/assets/concepts/stage-3.webm', route => route.abort());
await page.route('**/assets/concepts/stage-3.mp4', route => route.abort());
await page.locator('[data-action="library-3"]').click();
await page.locator('.concept-fallback').waitFor({ state: 'visible' });
assert.equal(await page.locator('.concept-fallback li').count(), 3);
await page.keyboard.press('Escape'); await page.locator('[data-action="library-1"]').waitFor();
await page.emulateMedia({ reducedMotion: 'reduce' });
await page.locator('[data-action="library-1"]').click();
await page.waitForFunction(() => document.querySelector('video')?.readyState >= 2);
assert.equal(await page.locator('video').evaluate(video => video.paused), true);
await page.locator('.concept-play').click();
await page.waitForFunction(() => document.querySelector('video')?.paused === false);
await context.close(); await browser.close();
await writeFile(new URL(process.env.TEST_FOCUS ? 'focused-report.json' : 'report.json', output), JSON.stringify({ layouts, media, audioFiles, fallback: true, reducedMotion: true, errors }, null, 2));
assert.deepEqual(errors, []);
console.log(JSON.stringify({ layoutChecks: layouts.length, media, errors, maxToolboxScroll: Math.max(...layouts.map(layout => layout.toolboxScroll)) }, null, 2));
} finally { await browser.close(); }
