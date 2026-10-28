import { pathToFileURL } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { freshState, SAVE_KEY } from '../src/state.js';
import { planets, bodies, solarOrder, patternRegions } from '../src/data.js';
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
console.log('Starting browser playthrough');
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, hasTouch: true });
const page = await context.newPage();
const touch = await context.newCDPSession(page);
const errors = [], passed = [];
const pass = message => { passed.push(message); console.log('PASS: ' + message); };
page.on('pageerror', error => errors.push(error.message));
page.setDefaultTimeout(12000);
const base = process.env.TEST_URL || 'http://127.0.0.1:4183';
const click = action => page.locator(`[data-action="${action}"]`).click();
const learn = action => page.locator(`[data-learning="${action}"]`).click();
const stored = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
const scene = name => page.locator(`[data-scene="${name}"]`).waitFor();
const nextActivity = () => page.locator('#stage-next').click();
async function setRange(id, value) { await page.locator('#' + id).evaluate((element, value) => { element.value = value; element.dispatchEvent(new Event('input', { bubbles: true })); }, value); }
async function drag(source, target, touchscreen = false) {
  const first = await source.boundingBox(), last = await target.boundingBox();
  if (touchscreen) {
    const start = { x: first.x + first.width / 2, y: first.y + first.height / 2 };
    const finish = { x: last.x + last.width / 2, y: last.y + last.height / 2 };
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
    for (let step = 1; step <= 12; step++) await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: start.x + (finish.x - start.x) * step / 12, y: start.y + (finish.y - start.y) * step / 12 }] });
    await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(90); return;
  }
  await page.mouse.move(first.x + first.width / 2, first.y + first.height / 2);
  await page.mouse.down(); await page.mouse.move(last.x + last.width / 2, last.y + last.height / 2, { steps: 12 }); await page.mouse.up();
  await page.waitForTimeout(90);
}
async function complete(number) {
  await nextActivity(); await page.locator('[data-action="reward-video-' + number + '"]').waitFor();
  await click('reward-video-' + number); await page.waitForFunction(() => document.querySelector('video')?.readyState >= 2);
  await page.keyboard.press('Escape'); await page.locator('[data-action="reward-video-' + number + '"]').waitFor();
  await click('continue-stage-' + number);
  if (number < 5) await scene(`s${number + 1}a`); else await page.locator('.core-v3').waitFor();
  pass('Stage ' + number + ': real completion, optional concept, direct continuation');
}
await mkdir(new URL('../.cache/classroom-qa/', import.meta.url), { recursive: true });
try {
  await page.goto(base);
  const initial = freshState(); initial.settings.reducedMotion = true; initial.settings.muted = true;
  await page.evaluate(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key: SAVE_KEY, state: initial });
  await page.reload(); await click('start'); await page.locator('#next-destination').click(); await scene('s1a');
  assert.equal(await page.locator('#enter-room').count(), 0);
  pass('Unfinished map destination enters directly without an entry confirmation');
  for (let count = 0; count < 4; count++) await learn('pan-left');
  for (let count = 0; count < 2; count++) await learn('pan-down');
  await setRange('moon-focus', 72); await setRange('moon-zoom', 1.5); await learn('capture-moon');
  await setRange('moon-zoom', 2); await learn('capture-moon');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await nextActivity(); await scene('s1b');
  assert.equal(await page.evaluate(() => window.scrollY), 0);
  pass('A new mobile activity starts at the top after continuing from the bottom');
  await page.setViewportSize({ width: 1280, height: 800 });
  for (const point of ['26-27', '67-29']) await learn('spot-' + point);
  await page.locator('#moon-observation').fill('밝은 부분과 어두운 부분의 구덩이 모양이 달라요.');
  const firstComparison = (await stored()).drafts.moon.comparisons[0];
  await page.reload(); await scene('s1b');
  assert.deepEqual((await stored()).drafts.moon.comparisons[0], firstComparison);
  await nextActivity();
  assert.equal(await page.locator('[data-learning="round-1"]').getAttribute('aria-pressed'), 'true');
  for (const point of ['32-68', '69-65']) await learn('spot-' + point);
  await page.locator('#moon-observation').fill('두 곳의 밝기와 구덩이 모습을 비교했어요.');
  pass('Partial observations survive reload; primary action opens the unfinished comparison');
  await complete(1);
  await learn('play-time'); await page.waitForTimeout(1000); await learn('play-time');
  pass('Time playback starts and pauses');
  for (const day of [3, 7, 10, 17, 21, 25]) await learn('day-' + day);
  const phaseCaptures = (await stored()).drafts.phases.captures;
  assert.deepEqual([...phaseCaptures].sort((a, b) => a - b), [3, 7, 10, 17, 21, 25]);
  const recordedDay = page.locator('[data-learning="day-3"]');
  if (!await recordedDay.isDisabled()) await recordedDay.dblclick();
  assert.deepEqual((await stored()).drafts.phases.captures, phaseCaptures);
  await nextActivity(); await scene('s2b');
  for (const round of [0, 1]) {
    const day = round ? 24 : 14;
    await setRange('prediction-amount', round ? 40 : 95); await learn(round ? 'side-left' : 'side-right');
    await learn('reveal-phase');
    const firstPrediction = (await stored()).drafts.phases.predictions[day].original;
    assert.equal((await stored()).drafts.phases.predictions[day].overlay, true);
    await setRange('prediction-amount', round ? 45 : 90);
    await learn('overlay-phase'); await learn('overlay-phase');
    assert.deepEqual((await stored()).drafts.phases.predictions[day].original, firstPrediction);
    await page.locator('#phase-reflection').fill('기록을 겹쳐 보니 밝은 부분의 크기가 예상과 달라요.');
    if (!round) { await nextActivity(); assert.equal(await page.locator('[data-learning="round-1"]').getAttribute('aria-pressed'), 'true'); }
  }
  pass('Date shortcuts capture once; reveal compares immediately and preserves the initial prediction');
  await complete(2);
  await learn('planet-mercury');
  await page.locator('#planet-feature').selectOption({ label: planets[1].feature });
  assert.equal((await stored()).drafts.planets.records.mercury, undefined);
  await page.locator('#planet-feature').selectOption({ label: planets[0].feature });
  assert.equal((await stored()).drafts.planets.records.mercury.feature, planets[0].feature);
  await click('home'); await page.locator('.home-v2').waitFor(); await page.waitForTimeout(1200);
  assert.equal((await stored()).scene, 'home');
  assert.equal((await stored()).drafts.planets.selected, 'mercury');
  await click('start'); await scene('s3a');
  for (const planet of planets.slice(1, 6)) {
    await learn('planet-' + planet.id);
    await page.locator('#planet-feature').selectOption({ label: planet.feature });
    await page.waitForTimeout(1200);
    assert.equal((await stored()).drafts.planets.records[planet.id].feature, planet.feature);
    if (planet.id === 'venus') assert.equal((await stored()).drafts.planets.selected, 'earth');
  }
  assert.equal(Object.keys((await stored()).drafts.planets.records).length, 6);
  assert.equal(await page.locator('#planet-candidate').count(), 0);
  pass('Planet feature mistakes remain editable; correct evidence records once and advances; leaving cancels advance');
  await learn('toggle-three'); await page.locator('#planet-viewer canvas').waitFor();
  await drag(page.locator('#planet-viewer canvas'), page.locator('#planet-viewer canvas'));
  await learn('toggle-three'); await nextActivity(); await scene('s3b');
  for (const [index, id] of solarOrder.entries()) await drag(page.locator(`[data-piece="${id}"]`), page.locator(`[data-slot="${index}"]`), id === 'sun');
  await nextActivity(); assert.equal(await page.locator('[data-learning="round-1"]').getAttribute('aria-pressed'), 'true');
  await page.locator('[data-piece="earth"]').click();
  await page.locator('[data-group="gas"]').focus(); await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(() => document.activeElement?.dataset.group), 'gas');
  assert.ok((await page.locator('#solar-feedback').textContent()).includes('지구'));
  await page.locator('[data-group="rock"]').click();
  assert.equal(await page.locator('[data-piece="mercury"]').getAttribute('aria-pressed'), 'true');
  pass('Keyboard placement keeps focus, wrong groups identify the planet, and grouping selects the next piece');
  for (const planet of planets) await drag(page.locator(`[data-piece="${planet.id}"]`), page.locator(`[data-group="${planet.group}"]`));
  assert.deepEqual((await stored()).drafts.planets.order, solarOrder);
  assert.deepEqual((await stored()).drafts.planets.groups, Object.fromEntries(planets.map(planet => [planet.id, planet.group])));
  pass('All nine solar pieces and eight groups use pointer drag, including a touch drag');
  await complete(3);
  await learn('light-toggle'); assert.equal(await page.locator('[data-learning="light-toggle"]').getAttribute('aria-pressed'), 'true');
  for (const round of [0, 1]) {
    for (const body of bodies.slice(round * 4, round * 4 + 4)) {
      await learn('body-' + body.id);
      assert.equal(await page.locator('dialog[open]').count(), 0);
      assert.ok((await stored()).drafts.classification.viewed.includes(body.id));
    }
    await nextActivity();
  }
  await scene('s4b');
  const firstBody = bodies[0];
  await learn('kind-' + (firstBody.kind === 'star' ? 'planet' : 'star')); await learn('reason-color');
  assert.notEqual((await stored()).drafts.classification.answers[firstBody.id].kind, firstBody.kind);
  await learn('kind-' + firstBody.kind); await learn('reason-' + firstBody.evidence);
  await click('settings'); await page.waitForTimeout(1200);
  assert.equal(await page.locator('dialog[open]').count(), 1);
  assert.ok((await page.locator('#screen-title').textContent()).includes(firstBody.name));
  await page.keyboard.press('Escape');
  await learn('bodytab-1');
  for (const [index, body] of bodies.slice(1).entries()) {
    await page.waitForFunction(name => document.querySelector('.classification-exhibit h2')?.textContent === name, body.name);
    await drag(page.locator(`[data-claim="${body.kind}"]`), page.locator('[data-claim-target]'));
    if (!index) await page.locator(`[data-learning="reason-${body.evidence}"]`).dblclick();
    else await learn('reason-' + body.evidence);
    await page.waitForTimeout(1200);
    assert.deepEqual((await stored()).drafts.classification.answers[body.id], { kind: body.kind, reason: body.evidence });
  }
  assert.equal(Object.values((await stored()).drafts.classification.answers).filter(answer => answer.kind && answer.reason).length, 8);
  pass('Inline science cards, correction after a wrong claim, no advance behind settings, rapid reason input, all eight automatic checks');
  await complete(4);
  for (const [round, region] of Object.values(patternRegions).entries()) {
    for (const [index, id] of region.stars.slice(0, 3).entries()) {
      const star = page.locator(`[data-star="${id}"]`);
      if (!round && !index) { await star.focus(); await page.keyboard.press('Enter'); } else await star.click();
    }
    await nextActivity();
  }
  await scene('s5b');
  for (const [round, region] of Object.values(patternRegions).entries()) {
    await drag(page.locator(`[data-star="${region.stars[0]}"]`), page.locator(`[data-star="${region.stars[1]}"]`));
    await page.locator(`[data-star="${region.stars[2]}"]`).click();
    const key = Object.keys(patternRegions)[round];
    assert.equal((await stored()).drafts.pattern.cases[key].lines.length, 2);
    await learn('compare-pattern'); await page.locator('#pattern-reflection').fill('같은 별을 다른 선으로 이어도 별의 위치는 같아요.');
    if (!round) await nextActivity();
  }
  pass('Keyboard star observation and continuous star lines without reselecting the shared endpoint');
  await complete(5);
  for (let number = 1; number <= 5; number++) { await click('record-' + number); await click('socket-' + number); }
  await setRange('core-angle', 180); await click('restore'); await click('results');
  assert.equal(await page.locator('.certificate').count(), 1);
  const finalState = await stored();
  assert.equal(finalState.core.restored, true); assert.equal(Object.keys(finalState.evidence).length, 5); assert.equal(finalState.settings.adminUnlock, false);
  await page.reload(); await page.locator('.certificate').waitFor();
  pass('Five real records, restored core, certificate, and reload persistence in normal student mode');
  assert.deepEqual(errors, []);
  await writeFile(new URL('../.cache/classroom-qa/playthrough.json', import.meta.url), JSON.stringify({ passed, errors }, null, 2));
  console.log(JSON.stringify({ passed, errors }, null, 2));
} catch (error) {
  await page.screenshot({ path: new URL('../.cache/classroom-qa/playthrough-failure.png', import.meta.url).pathname.replace(/^\/(\w:)/, '$1').replaceAll('%20', ' ') });
  throw error;
} finally { await browser.close(); }
