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
    assert.equal(await page.locator('.lesson-concept strong').textContent(), lesson.concept);
    assert.equal(await page.locator('.is-next').count(), 1);
  }
  checks.push('10 pages show their standard, highlighted concept and one current action');
  await seed('s2a', state => { state.drafts.phases.captures = []; });
  await learn('seek-day-3');
  assert.equal((await stored()).drafts.phases.captures.length, 0);
  assert.equal(await page.locator('#capture-phase.is-next').count(), 1);
  await learn('capture-phase');
  assert.deepEqual((await stored()).drafts.phases.captures, [3]);
  assert.equal(await page.locator('[data-learning="seek-day-7"].is-next').count(), 1);
  assert.match(await page.locator('#screen-title').textContent(), /7일째/);
  assert.equal(await page.locator('#phase-moon image').getAttribute('href'), '/assets/generated/moon-surface-v4.webp');
  checks.push('Date selection, explicit capture, next-date guidance and new Moon art agree');
  await seed('s4a', state => { state.drafts.classification.viewed = []; });
  await learn('body-sun');
  assert.equal(await page.locator('[data-learning="body-sirius"].is-next').count(), 1);
  checks.push('Reading a body advances the highlighted target to unread evidence');
  await seed('s3b', state => { state.drafts.planets.order = Array(9).fill(null); state.drafts.planets.groups = {}; });
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
  checks.push('Core planetary investigation completes and survives reload without optional composition sorting');
  assert.deepEqual(errors, []);
  const output = process.env.QA_OUTPUT;
  if (!output) throw Error('QA_OUTPUT must point to the verified external SSD');
  await fs.mkdir(output, { recursive: true });
  await fs.writeFile(`${output}/report.json`, JSON.stringify({ checks, errors }, null, 2));
  console.log(JSON.stringify({ checks, errors }));
} finally { await browser.close(); }
