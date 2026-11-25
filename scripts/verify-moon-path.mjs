// Bonus "달빛 길 따라가기": plays the 3D hill path to the end with the keyboard and with two fingers on the
// on-screen buttons, then checks wrong doors, the saved record, the card way, a device without WebGL and old saves.
// Usage: PLAYWRIGHT_MODULE=<playwright-core/index.mjs> BROWSER_EXECUTABLE=<chrome> TEST_URL=http://127.0.0.1:5183 node scripts/verify-moon-path.mjs
// TEST_ONLY=live skips everything that needs local fixtures except the two full runs. SHOT_DIR keeps screenshots.
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { mkdir, readdir } from 'node:fs/promises';
import { SAVE_KEY } from '../src/state.js';
import { phase } from '../src/drawing.js';
import { pathDays } from '../src/moon-path.js';
import { gateS, doorXs, slabAt, stones } from '../src/moon-run-course.js';
import { completedState } from './shot-fixture.mjs';

const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const base = process.env.TEST_URL || 'http://127.0.0.1:5183';
const shots = process.env.SHOT_DIR || '';
if (shots) await mkdir(shots, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXECUTABLE, headless: true, args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const errors = [];
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function finished(change = () => {}) {
  const s = completedState(5);
  Object.assign(s, { scene: 'results', resume: 'results' });
  s.settings.bgm = false;
  Object.assign(s.core, { connections: { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 }, angle: 180, restored: true, reportSeen: true });
  change(s);
  return s;
}
async function open(save, { width = 1280, height = 800, hasTouch = false, init = null } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, hasTouch });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  // Without WebGL three.js logs that it could not make a context; that one line is the expected outcome there.
  page.on('console', message => { if (message.type() === 'error' && !/Failed to load resource/.test(message.text()) && !(init && /Error creating WebGL context/.test(message.text()))) errors.push(message.text()); });
  await page.addInitScript(([key, value]) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem(key, value); sessionStorage.setItem('seeded', '1'); } }, [SAVE_KEY, JSON.stringify(save)]);
  if (init) await page.addInitScript(init);
  await page.goto(base);
  await page.locator('[data-action="bonus-path"]').waitFor();
  return page;
}
const stored = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
const shot = async (page, name) => { if (shots) await page.screenshot({ path: `${shots}/${name}.png` }); };
const view = page => page.locator('.moon-run').getAttribute('data-view');
// Two drawings with the same clip id would show a wrong moon shape, so ids must stay unique.
const repeatedIds = page => page.evaluate(() => { const ids = [...document.querySelectorAll('#dialog [id]')].map(item => item.id); return ids.filter((id, index) => ids.indexOf(id) !== index); });
const tipText = page => page.locator('.moon-run-tip').textContent();
async function startRun(page, button = '[data-run-start="run"]') {
  await page.click('[data-action="bonus-path"]');
  await page.click(button);
  await page.locator('.moon-run-stage[data-ready="true"]').waitFor({ timeout: 20000 });
}
/** Reads which door of the next gate shows phase(day), the same way a learner compares the moons. */
async function doorsOf(page, gate) {
  const labels = await page.evaluate(() => [...document.querySelectorAll('.moon-run-labels > .moon-run-moon svg.moon-art, .moon-run-door svg.moon-art')].map(svg => svg.getAttribute('aria-label')));
  const counts = [2, 2, 2, 2, 3, 3], from = labels.length > 3 ? counts.slice(0, gate).reduce((a, b) => a + b, 0) : 0;
  const answer = phase(pathDays[gate]), mine = labels.slice(from, from + counts[gate]);
  const right = mine.findIndex(text => text.includes(`밝은 부분 ${Math.round(answer.amount)}%`) && text.includes(answer.side === 'right' ? '오른쪽' : '왼쪽'));
  assert.ok(right >= 0, `${pathDays[gate]}일째 정답 문이 화면에 있다`);
  return { right, wrong: (right + 1) % counts[gate], xs: doorXs(counts[gate]) };
}
const ground = s => slabAt(s) || stones.find(stone => s >= stone.s0 && s <= stone.s1);
/** Drives Lumi from the current place. `hands` presses and releases; decisions come from the stage state only. */
async function drive(page, hands, { until = state => state.arrived, wrongAt = -1, wrongTimes = 0, limit = 150000 } = {}) {
  const started = Date.now(), tips = new Set();
  let misses = 0, last = null;
  while (Date.now() - started < limit) {
    const state = await page.evaluate(() => window.__moonRun?.state || null);
    if (!state) break;
    last = state;
    if (until(state)) break;
    const gate = state.passed;
    let targetX = 0;
    // Line up with a door only on the last stretch before it, after the stream is behind.
    if (gate < gateS.length && gateS[gate] - state.s < 5) {
      const doors = await doorsOf(page, gate);
      const useWrong = gate === wrongAt && misses < wrongTimes;
      targetX = doors.xs[useWrong ? doors.wrong : doors.right];
    }
    const stone = stones.find(item => item.s0 - state.s < 3 && item.s1 > state.s);
    if (stone) targetX = stone.x;
    const here = ground(state.s), next = ground(state.s + 0.55);
    await hands.steer({ left: state.x - targetX > 0.25, right: targetX - state.x > 0.25, up: true });
    if (state.onFloor && here && (!next || next.top > here.top + 0.1)) await hands.jump();
    tips.add(await tipText(page));
    // Each wrong door shows a new hint line, so the hint lines seen so far count the misses.
    if (gate === wrongAt) misses = [...tips].filter(text => /어느 쪽이 밝은지|보름 전후|커졌는지|밝은 부분만 비교/.test(text)).length;
    await sleep(25);
  }
  await hands.steer({});
  return { state: last, tips: [...tips], seconds: (Date.now() - started) / 1000 };
}
function keyboard(page) {
  const held = new Set(), keys = { left: 'ArrowLeft', right: 'KeyD', up: 'KeyW' };
  return {
    async steer(want) { for (const [name, key] of Object.entries(keys)) { if (want[name] && !held.has(key)) { held.add(key); await page.keyboard.down(key); } if (!want[name] && held.has(key)) { held.delete(key); await page.keyboard.up(key); } } },
    async jump() { await page.keyboard.press('Space'); },
  };
}
/** Finger 1 stays on the direction pad and slides between arrows; finger 2 taps jump. */
async function fingers(page) {
  const client = await page.context().newCDPSession(page);
  const center = async selector => { const box = await page.locator(selector).boundingBox(); return { x: box.x + box.width / 2, y: box.y + box.height / 2 }; };
  const pad = { up: await center('[data-run-dir="up"]'), left: await center('[data-run-dir="left"]'), right: await center('[data-run-dir="right"]') }, jumpAt = await center('.moon-run-jump');
  let on = null;
  const send = (type, points) => client.send('Input.dispatchTouchEvent', { type, touchPoints: points.map(point => ({ x: Math.round(point.x), y: Math.round(point.y), id: point.id, radiusX: 8, radiusY: 8, force: 1 })) });
  return {
    async steer(want) {
      // One finger gives one direction at a time: line up first, then run forward.
      const next = want.left ? 'left' : want.right ? 'right' : want.up ? 'up' : null;
      if (next === on) return;
      if (!next) await send('touchEnd', []);
      else if (!on) await send('touchStart', [{ ...pad[next], id: 1 }]);
      else await send('touchMove', [{ ...pad[next], id: 1 }]);
      on = next;
    },
    async jump() {
      const first = on ? [{ ...pad[on], id: 1 }] : [];
      await send('touchStart', [...first, { ...jumpAt, id: 2 }]);
      await sleep(40);
      // This input channel can only lift every finger at once, so the pad finger goes straight back down.
      await send('touchEnd', []);
      if (on) await send('touchStart', first);
    },
  };
}

// 1. Keyboard, 1280x800: two wrong doors first, then the whole path.
{
  const page = await open(finished());
  assert.equal(await page.locator('.bonus-card').count(), 3);
  await page.click('[data-action="bonus-path"]');
  assert.equal(await view(page), 'intro');
  assert.equal(await page.locator('.moon-run-intro .moon-run-record figure').count(), 6);
  assert.match(await page.locator('.moon-run-intro').textContent(), /우리나라에서 본 모양을 단순하게 나타냈어요 · 학습용 날짜/);
  assert.deepEqual(await repeatedIds(page), []);
  await shot(page, 'intro-1280x800');
  await page.click('[data-run-start="run"]');
  await page.locator('.moon-run-stage[data-ready="true"]').waitFor({ timeout: 20000 });
  // Every painted file in the project is served; a missing one would silently fall back to the code-drawn look.
  const art = (await readdir(new URL('../public/assets/generated/run-stage/', import.meta.url)).catch(() => [])).filter(name => name.endsWith('.webp') && !name.startsWith('.'));
  assert.deepEqual(await page.evaluate(names => Promise.all(names.map(name => fetch(`/assets/generated/run-stage/${name}`).then(response => response.ok && /image\/webp/.test(response.headers.get('content-type'))))), art), art.map(() => true), `그림 ${art.length}장이 열린다`);
  const before = (await stored(page)).stats.retries;
  await shot(page, 'start-1280x800');
  const hands = keyboard(page);
  const tried = await drive(page, hands, { wrongAt: 0, wrongTimes: 2, until: state => state.passed >= 1 });
  assert.ok(tried.tips.some(text => /어느 쪽이 밝은지/.test(text)), '첫 힌트는 밝은 쪽을 묻는다');
  assert.ok(tried.tips.some(text => /보름 전후/.test(text)), '두 번째 힌트는 달 모양 변화를 떠올리게 한다');
  assert.equal(await page.locator('.moon-run-moon.is-lit').count(), 0);
  const saved = await stored(page);
  assert.ok(saved.stats.retries >= before + 2, '다른 문은 다시 생각한 횟수로 남는다');
  assert.equal(saved.bonus.path, '', '문 하나로는 완료가 기록되지 않는다');
  await shot(page, 'gate-1-open-1280x800');
  const run = await drive(page, hands);
  assert.equal(run.state.arrived, true, `키보드로 관측소에 도착 (${JSON.stringify(run.state)})`);
  assert.equal(run.state.passed, 6);
  await page.locator('.moon-run[data-view="done"]').waitFor({ timeout: 5000 });
  await shot(page, 'done-1280x800');
  assert.deepEqual(await repeatedIds(page), []);
  assert.deepEqual(await page.locator('.moon-run-done .moon-run-record svg.moon-art').evaluateAll(items => items.map(item => item.getAttribute('aria-label').replace(/ 달 학습 모형/, ''))), pathDays.map(day => `밝은 부분 ${Math.round(phase(day).amount)}%, ${phase(day).side === 'right' ? '오른쪽' : '왼쪽'}`));
  assert.equal((await stored(page)).bonus.path, 'done');
  assert.match(await page.locator('.moon-run-reward').textContent(), /달빛 길잡이 카드를 연구 키트에 담았어요/);
  assert.equal(await page.locator('.moon-run-canvas').count(), 0, '도착하면 3D 화면을 해제한다');
  await page.click('.moon-run-done [data-action="close-modal"]');
  assert.match(await page.locator('[data-action="bonus-path"]').textContent(), /달빛 길잡이 카드 획득/);
  await page.reload();
  await page.locator('[data-action="bonus-path"]').waitFor();
  const again = await stored(page);
  assert.equal(again.bonus.path, 'done', '새로고침 뒤에도 기록이 남는다');
  assert.equal(again.core.restored, true);
  assert.equal(Object.keys(again.evidence).length, 5);
  console.log(`PASS keyboard 1280x800: wrong doors, six gates, saved (${Math.round(tried.seconds + run.seconds)}s)`);
  await page.context().close();
}

// 2. On-screen buttons with two fingers, 1024x768.
{
  const page = await open(finished(), { width: 1024, height: 768, hasTouch: true });
  await startRun(page);
  for (const selector of ['.moon-run-pad button', '.moon-run-jump']) for (const box of await page.locator(selector).evaluateAll(items => items.map(item => { const r = item.getBoundingClientRect(); return [r.width, r.height, r.right, r.bottom]; }))) {
    assert.ok(box[0] >= 52 && box[1] >= 52, `${selector} 52px 이상`);
    assert.ok(box[2] <= 1024 && box[3] <= 768, `${selector} 화면 안`);
  }
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await shot(page, 'start-1024x768');
  const run = await drive(page, await fingers(page));
  assert.equal(run.state.arrived, true, `화면 버튼으로 관측소에 도착 (${JSON.stringify(run.state)})`);
  await page.locator('.moon-run[data-view="done"]').waitFor({ timeout: 5000 });
  assert.equal((await stored(page)).bonus.path, 'done');
  await shot(page, 'done-1024x768');
  console.log(`PASS touch buttons 1024x768: six gates, saved (${Math.round(run.seconds)}s)`);
  await page.context().close();
}

if (process.env.TEST_ONLY !== 'live') {
  // 3. Card way (shown first when motion is reduced): three misses without a marked answer, then all six.
  {
    const page = await open(finished(s => { s.settings.reducedMotion = true; }));
    await page.click('[data-action="bonus-path"]');
    assert.match(await page.locator('.moon-run-intro .btn.primary').textContent(), /달 카드로 문 고르기/);
    await page.click('[data-run-start="cards"]');
    assert.equal(await view(page), 'cards');
    assert.equal(await page.locator('.moon-run-canvas').count(), 0);
    const first = await doorsOf(page, 0);
    for (let i = 0; i < 3; i++) await page.click(`.moon-run-door[data-door="${first.wrong}"]`);
    assert.match(await tipText(page), /보름 전후/);
    assert.equal(await page.locator('.moon-run-door.is-lit').count(), 0);
    assert.equal((await stored(page)).bonus.path, '');
    await shot(page, 'cards-1280x800');
    for (let gate = 0; gate < 6; gate++) { const doors = await doorsOf(page, gate); await page.click(`.moon-run-door[data-door="${doors.right}"]`); }
    assert.equal(await view(page), 'done');
    assert.equal((await stored(page)).bonus.path, 'done');
    console.log('PASS cards (reduced motion): neutral hints, six gates, saved');
    await page.context().close();
  }
  // 4. No WebGL: the bonus falls back to cards, and the other bonuses and the rest of the page still work.
  {
    const page = await open(finished(), { init: () => { const real = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (kind, ...rest) { return /webgl/.test(kind) ? null : real.call(this, kind, ...rest); }; } });
    await page.click('[data-action="bonus-path"]');
    await page.click('[data-run-start="run"]');
    await page.locator('.moon-run[data-view="cards"]').waitFor({ timeout: 20000 });
    assert.match(await tipText(page), /이 기기에서는 3D 길을 열 수 없어요/);
    const doors = await doorsOf(page, 0);
    await page.click(`.moon-run-door[data-door="${doors.right}"]`);
    assert.match(await tipText(page), /3일째 달의 문이 열렸어요/);
    await page.click('.dialog-heading [data-action="close-modal"]');
    await page.click('[data-action="bonus-cloudy"]');
    assert.equal(await page.locator('#cloudy-check').count(), 1);
    await page.click('.dialog-footer [data-action="close-modal"]');
    await page.click('[data-action="bonus-planet"]');
    assert.equal(await page.locator('#planet-check').count(), 1);
    await page.click('.dialog-footer [data-action="close-modal"]');
    await page.click('[data-action="map"]');
    await page.locator('#world').waitFor({ timeout: 20000 });
    console.log('PASS no WebGL: card fallback, other bonuses and the map open');
    await page.context().close();
  }
  // 5. A save written before this bonus existed keeps its other rewards; closing mid-run frees the scene.
  {
    const page = await open(finished(s => { s.bonus = { cloudy: 'done', planet: '' }; }));
    assert.match(await page.locator('[data-action="bonus-cloudy"]').textContent(), /획득/);
    assert.doesNotMatch(await page.locator('[data-action="bonus-path"]').textContent(), /획득/);
    await startRun(page);
    await page.keyboard.press('Escape');
    await sleep(300);
    assert.equal(await page.locator('.moon-run-canvas').count(), 0);
    assert.equal(await page.evaluate(() => window.__moonRun), undefined);
    await page.click('[data-action="bonus-cloudy"]');
    await page.click('.dialog-footer [data-action="close-modal"]');
    await page.click('[data-action="map"]');
    await page.locator('#world').waitFor({ timeout: 20000 });
    const save = await stored(page);
    assert.deepEqual(save.bonus, { cloudy: 'done', planet: '', path: '' });
    console.log('PASS old save: rewards kept, scene freed on close');
    await page.context().close();
  }
}
await browser.close();
assert.deepEqual(errors, [], 'no page or console errors');
console.log('PASS no page or console errors');
