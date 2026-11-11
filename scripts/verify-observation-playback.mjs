import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { freshState, SAVE_KEY } from '../src/state.js';
import { completedState } from './shot-fixture.mjs';

const output = process.env.PLAYBACK_QA_DIR || '.tmp/stage-fit/playback';
await mkdir(`${output}/tmp`, { recursive: true });
process.env.TMPDIR = process.env.TMP = process.env.TEMP = `${output}/tmp`;
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXECUTABLE, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', `--disk-cache-dir=${output}/cache`] });
const page = await browser.newPage({ viewport: { width: 1024, height: 600 }, hasTouch: true });
const passed = [], errors = [];
page.on('pageerror', error => errors.push(error.message));
const pass = text => { passed.push(text); console.log(`PASS ${text}`); };
const stored = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
const learn = action => page.locator(`[data-learning="${action}"]`).click();
async function seed(scene, empty = true) {
  const state = completedState(Number(scene[1]) - 1), observed = state.drafts;
  if (empty) {
    state.drafts = freshState().drafts;
    if (scene.endsWith('b')) {
      const [part, field] = { 1: ['moon','photos'], 2: ['phases','captures'], 3: ['planets','records'], 4: ['classification','viewed'], 5: ['pattern','observed'] }[scene[1]];
      state.drafts[part][field] = observed[part][field];
    }
  }
  Object.assign(state, { scene, resume: scene, started: true, intro: true });
  Object.assign(state.settings, { muted: true, bgm: false, reducedMotion: true });
  await page.evaluate(([key, value]) => { localStorage.clear(); localStorage.setItem(key, JSON.stringify(value)); }, [SAVE_KEY, state]);
  await page.reload(); await page.locator(`[data-scene="${scene}"]`).waitFor();
  const speed=page.locator('#playback-speed');
  if(await speed.count()&&await speed.isEnabled())await speed.selectOption('2');
  return state;
}
async function finished(timeout = 30000) {
  await page.waitForFunction(() => document.querySelector('#play-time')?.getAttribute('aria-pressed') === 'false' && document.querySelector('#play-time span')?.textContent === '다시 보기', null, { timeout });
}
try {
  await page.goto(process.env.TEST_URL || 'http://127.0.0.1:5183');
  await seed('s1a'); await learn('play-time'); await finished();
  let state = await stored();
  assert.equal(state.drafts.moon.photos.length, 2);
  assert.notEqual(state.drafts.moon.photos[0].zoom, state.drafts.moon.photos[1].zoom);
  assert.equal(Object.keys(state.evidence).length, 0);
  assert.equal(state.scene, 's1a');
  pass('망원경 자동 정렬·초점·서로 다른 배율 촬영, 자동 단계 완료 없음');

  await seed('s1b'); await learn('play-time'); await finished();
  state = await stored();
  assert.equal(state.drafts.moon.comparisons[0].spots.length, 2);
  assert.equal(state.drafts.moon.comparisons[0].observation, '');
  assert.equal(await page.locator('#stage-next').isDisabled(), true);
  pass('표면 관찰은 재생하되 발견한 차이는 대신 작성하지 않음');

  await seed('s2a'); await learn('play-time'); await finished();
  state = await stored();
  assert.deepEqual([...state.drafts.phases.captures].sort((a,b) => a-b), [3,7,10,17,21,25]);
  assert.equal(state.drafts.phases.day, 29);
  assert.equal(await page.locator('#phase-day').inputValue(), '29', 'The day slider must follow playback');
  assert.equal(await page.locator('.discovery-stops .discovered').count(), 6, 'The discovery route must reflect recorded evidence');
  assert.match(await page.locator('.discovery-route > b').textContent(), /여섯 시점/);
  assert.equal(state.drafts.phases.predictions[14].original, null);
  pass('속도 2배로 달 변화 전체 재생·여섯 시점 관찰, 예상은 보존');
  await learn('play-time'); await page.waitForTimeout(400);
  await page.locator('#phase-day').evaluate(input => { input.value = '12'; input.dispatchEvent(new Event('input', { bubbles: true })); });
  assert.equal(await page.locator('#play-time').getAttribute('aria-pressed'), 'false');
  await page.waitForTimeout(450); assert.equal((await stored()).drafts.phases.day, 12);
  await learn('seek-day-7');
  assert.equal(await page.locator('[data-learning="seek-day-7"]').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('#capture-phase').isDisabled(), true);
  pass('수동 조절은 자동재생을 즉시 멈춤');

  await seed('s2b'); assert.equal(await page.locator('#play-time').isDisabled(), true);
  await learn('reveal-phase'); const original = (await stored()).drafts.phases.predictions[14].original;
  await learn('play-time'); await finished(); state = await stored();
  assert.deepEqual(state.drafts.phases.predictions[14].original, original);
  assert.equal(state.drafts.phases.predictions[14].reflection, '');
  pass('예상 저장 전 자동 비교 잠금, 저장 뒤에도 최초 예상과 성찰 보존');

  await seed('s3a'); await learn('play-time'); await page.locator('#planet-viewer canvas').waitFor();
  await page.waitForFunction(() => document.querySelector('#planet-rotation-value')?.textContent !== '0°');
  await learn('play-time'); assert.equal(await page.locator('#play-time').getAttribute('aria-pressed'), 'false');
  assert.deepEqual((await stored()).drafts.planets.records, {});
  assert.equal((await stored()).drafts.planets.feature, '');
  pass('실제 3D 행성 회전 재생·일시정지, 특징 정답 자동 선택 없음');

  await seed('s4a'); await learn('play-time'); await finished(); state = await stored();
  assert.equal(state.drafts.classification.viewed.length, 8);
  assert.ok(Object.values(state.drafts.classification.answers).every(answer=>!answer.kind&&!answer.reason));
  assert.equal(await page.locator('[data-learning="light-toggle"]').getAttribute('aria-pressed'), 'false');
  pass('천체 자료와 가림판 실험 순차 재생, 판별 답안은 비어 있음');

  await seed('s5a'); await learn('play-time'); await finished(); state = await stored();
  assert.ok(state.drafts.pattern.observed.length >= 6);
  assert.deepEqual(state.drafts.pattern.cases.cassiopeia.lines, []);
  assert.deepEqual(state.drafts.pattern.cases.dipper.lines, []);
  pass('두 별 무리 자동 관찰, 학습자 연결선 자동 작성 없음');

  await seed('s5b'); assert.equal(await page.locator('#play-time').isDisabled(), true);
  await seed('s5b', false); const pattern = structuredClone((await stored()).drafts.pattern.cases.cassiopeia);
  await learn('play-time'); await finished(); state = await stored();
  assert.deepEqual(state.drafts.pattern.cases.cassiopeia.original, pattern.original);
  assert.deepEqual(state.drafts.pattern.cases.cassiopeia.lines, pattern.lines);
  assert.equal(state.drafts.pattern.cases.cassiopeia.reflection, pattern.reflection);
  pass('패턴 저장 후 비교만 재생, 내 선·처음 패턴·기록은 보존');

  for (const scene of ['s3b','s4b']) { await seed(scene); assert.equal(await page.locator('#play-time').count(), 0); }
  pass('순서·분류 정답 활동에는 자동재생 버튼 없음');

  await seed('s2a'); await learn('play-time'); await page.waitForTimeout(400);
  await page.locator('[data-action="hint"]').click(); const held = (await stored()).drafts.phases.day;
  await page.waitForTimeout(450); assert.equal((await stored()).drafts.phases.day, held);
  await page.keyboard.press('Escape');
  await learn('play-time'); await page.locator('[data-action="home"]').click(); const left = await stored();
  await page.waitForTimeout(500); assert.equal((await stored()).drafts.phases.day, left.drafts.phases.day);
  pass('힌트·화면 이동 뒤 타이머가 학습 데이터를 계속 바꾸지 않음');
  assert.deepEqual(errors, []);
  await writeFile(`${output}/report.json`, JSON.stringify({ passed, errors }, null, 2));
} catch (error) {
  await page.screenshot({ path: `${output}/failure.png` }); throw error;
} finally { await browser.close(); }
