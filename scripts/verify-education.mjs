// Regression for standards, visible guidance, deliberate capture and optional extension.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { completedState } from './shot-fixture.mjs';
import { SAVE_KEY } from '../src/state.js';
import { pageConcepts } from '../src/curriculum.js';
import { solarOrder } from '../src/data.js';

const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXECUTABLE, headless: true });
const page = await browser.newPage({ viewport: { width: 768, height: 1024 }, hasTouch: true });
page.setDefaultNavigationTimeout(60000);
const errors = [], checks = [];
page.on('pageerror', error => errors.push(error.message));
const stored = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
const learn = action => page.locator(`[data-learning="${action}"]`).click();
async function seed(scene, prepare = () => {}) {
  const state = completedState(Number(scene[1]) - 1);
  Object.assign(state, { scene, resume: scene, started: true, intro: true });
  Object.assign(state.settings, { muted: true, bgm: false, reducedMotion: true, adminUnlock: false });
  prepare(state);
  await page.evaluate(([key, value]) => localStorage.setItem(key, JSON.stringify(value)), [SAVE_KEY, state]);
  await page.reload();
  await page.locator(`[data-scene="${scene}"]`).waitFor();
}
try {
  await page.goto(process.env.TEST_URL);
  for (const [scene, lesson] of Object.entries(pageConcepts)) {
    await seed(scene);
    assert.equal(await page.locator('.learning-v2').getAttribute('data-standard'), lesson.standard);
    await page.locator('.lesson-concept').waitFor({ state: 'visible' });
    assert.equal((await page.locator('.learning-v2').innerText()).includes(lesson.concept), false);
    assert.equal(await page.locator('.is-next').count(), 1);
  }
  checks.push('10 pages retain their standard, show one current target, and avoid showing the concept as the answer');
  await seed('s2a', state => { state.drafts.phases.captures = []; });
  // One tap on a date observes and records that day's Moon.
  await learn('seek-day-3');
  assert.deepEqual((await stored()).drafts.phases.captures, [3]);
  assert.equal(await page.locator('[data-learning="seek-day-7"].is-next').count(), 1);
  assert.match(await page.locator('#screen-title').textContent(), /날짜를 눌러/);
  assert.equal(await page.locator('#phase-moon image').getAttribute('href'), '/assets/generated/moon-surface-v4.webp');
  checks.push('Tapping a date records it, then next-date guidance and the Moon art agree');
  await seed('s4a', state => { state.drafts.classification.viewed = []; });
  await learn('body-sun');
  assert.equal(await page.locator('[data-learning="body-sirius"].is-next').count(), 1);
  checks.push('Reading a body advances the highlighted target to unread evidence');
  await seed('s3b', state => { state.drafts.planets.order = Array(9).fill(null); state.drafts.planets.groups = {}; });
  await learn('solar-note');
  const distanceRows = page.locator('.distance-row');
  assert.equal(await distanceRows.count(), 8);
  const distances = (await distanceRows.locator('b').allTextContents()).map(text => Number(text.replaceAll(',', '')));
  assert.notDeepEqual(distances, [...distances].sort((a, b) => a - b));
  await page.keyboard.press('Escape');
  for (const [index, id] of solarOrder.entries()) {
    await page.locator(`[data-piece="${id}"]`).click();
    await page.locator(`[data-slot="${index}"]`).click();
  }
  assert.equal(await page.locator('#stage-next').isEnabled(), true);
  assert.deepEqual((await stored()).drafts.planets.groups, {});
  await page.locator('#stage-next').click();
  assert.deepEqual((await stored()).evidence[3].data.groups, {});
  await page.reload();
  assert.ok((await stored()).evidence[3]);
  checks.push('Planet placement has unsorted distance evidence, completes without optional sorting, and survives reload');
  await seed('s4b', state => { state.drafts.classification.answers = {}; });
  assert.equal(await page.locator('.claim-tray.is-next').count(), 1);
  assert.equal(await page.locator('.reason-choices button').count(), 0);
  await learn('kind-star');
  assert.equal(await page.locator('.reason-choices.is-next').count(), 1);
  assert.equal(await page.locator('.reason-choices button.is-next').count(), 0);
  await learn('body-note');
  assert.doesNotMatch(await page.locator('dialog .dialog-body').innerText(), /스스로 빛을 내는|태양빛을 반사/);
  await page.keyboard.press('Escape');
  checks.push('Classification highlights each set of choices and offers observation evidence without revealing the selection');
  assert.deepEqual(errors, []);
  const output = process.env.QA_OUTPUT;
  if (!output) throw Error('QA_OUTPUT must point to the verified external SSD');
  await fs.mkdir(output, { recursive: true });
  await fs.writeFile(`${output}/report.json`, JSON.stringify({ checks, errors }, null, 2));
  console.log(JSON.stringify({ checks, errors }));
} finally { await browser.close(); }
