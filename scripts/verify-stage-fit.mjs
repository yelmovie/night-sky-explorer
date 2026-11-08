// Strict single-screen stage sweep. Browser execution belongs to the main agent.
// PLAYWRIGHT_MODULE=<absolute index.mjs> BROWSER_EXECUTABLE=<absolute browser>
// TEST_URL=http://127.0.0.1:5183 STAGE_FIT_QA_DIR=<verified external SSD directory>
// Optional: TEST_SIZES=1024x600,360x740 QA_SCENES=s1a,s3b QA_SCREENSHOTS=all
import { mkdir, writeFile } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { freshState, SAVE_KEY } from '../src/state.js';
import { completedState } from './shot-fixture.mjs';

const base = process.env.TEST_URL || 'http://127.0.0.1:5183';
const output = resolve(process.env.STAGE_FIT_QA_DIR || '.tmp/stage-fit-qa');
for (const name of ['PLAYWRIGHT_MODULE', 'BROWSER_EXECUTABLE'])
  if (!process.env[name] || !isAbsolute(process.env[name])) throw Error(`${name} must name an existing absolute local path.`);
await mkdir(join(output, 'browser-tmp'), { recursive: true });
process.env.TMPDIR = process.env.TMP = process.env.TEMP = join(output, 'browser-tmp');
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const sizes = (process.env.TEST_SIZES || '1920x1080,1366x768,1280x800,1024x600,960x540,873x412,740x360,360x740,768x1024,800x270').split(',').map(size => size.split('x').map(Number));
const allowed = process.env.QA_SCENES?.split(',');
const scenarios = [];
for (const scene of Array.from({ length: 5 }, (_, i) => [`s${i + 1}a`, `s${i + 1}b`]).flat())
  for (const draft of ['empty', 'filled'])
    for (const round of ['s2a', 's3a'].includes(scene) ? [0] : [0, 1]) scenarios.push({ scene, draft, round });
for (const round of [0, 1]) scenarios.push({ scene: 's2b', draft: 'filled', round, variant: 'overlay' });
scenarios.push({ scene: 's4a', draft: 'filled', round: 1, variant: 'blocked' });
for (const variant of ['zoom2x', 'three']) scenarios.push({ scene: 's3a', draft: 'filled', round: 0, variant });
const cases = scenarios.filter(item => !allowed || allowed.includes(item.scene));

function fixture({ scene, draft }) {
  const state = completedState(Number(scene[1]) - 1);
  if (draft === 'empty') {
    const observed = state.drafts; state.drafts = freshState().drafts;
    if (scene.endsWith('b')) {
      const preserve = { 1: ['moon', 'photos'], 2: ['phases', 'captures'], 3: ['planets', 'records'], 4: ['classification', 'viewed'], 5: ['pattern', 'observed'] }[scene[1]];
      state.drafts[preserve[0]][preserve[1]] = observed[preserve[0]][preserve[1]];
    }
  }
  Object.assign(state, { scene, resume: scene, started: true, intro: true });
  Object.assign(state.settings, { muted: true, bgm: false, reducedMotion: true, adminUnlock: false });
  return state;
}

async function settleMedia() {
  await document.fonts.ready;
  await Promise.all([...document.images].map(async image => {
    delete image.__fitDecodeError;
    const source = image.currentSrc || image.src;
    try { await image.decode(); }
    catch (error) { if (image.isConnected && (image.currentSrc || image.src) === source) image.__fitDecodeError = error.message; }
  }));
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

function inspectStage() {
  const stage = document.querySelector('.learning-v2'), issues = [], keys = new Set();
  if (!stage) return { issues: [{ type: 'missing-stage' }] };
  const label = el => el?.getAttribute?.('aria-label') || el?.id || el?.textContent?.trim().replace(/\s+/g, ' ').slice(0, 70) || el?.tagName;
  const add = (type, el, detail = '') => {
    const item = { type, element: label(el), detail }, key = JSON.stringify(item);
    if (!keys.has(key)) keys.add(key), issues.push(item);
  };
  const visible = el => {
    if (el.closest('[hidden],[aria-hidden="true"],.sr-only')) return false;
    for (let p = el; p; p = p.parentElement) {
      const style = getComputedStyle(p);
      if (style.display === 'none' || style.visibility === 'hidden' || +style.opacity === 0) return false;
      if (p.matches('details:not([open])') && !p.querySelector(':scope > summary')?.contains(el)) return false;
    }
    const r = el.getBoundingClientRect(); return r.width > .5 && r.height > .5;
  };
  const outside = (r, box, gap = 2) => r.left < box.left - gap || r.top < box.top - gap || r.right > box.right + gap || r.bottom > box.bottom + gap;
  const bounds = stage.getBoundingClientRect(), viewport = { left: 0, top: 0, right: innerWidth, bottom: innerHeight };
  if (outside(bounds, viewport)) add('stage-outside-viewport', stage, JSON.stringify(bounds.toJSON()));
  for (const el of [document.documentElement, document.body, stage, ...stage.querySelectorAll('*')]) {
    if (![document.documentElement, document.body].includes(el) && !visible(el)) continue;
    const cs = getComputedStyle(el), required = el === stage || el === document.body || el === document.documentElement || el.matches('.experiment-zone,.toolbox');
    if (!required && !/auto|scroll/.test(cs.overflowX + cs.overflowY)) continue;
    const x = el.scrollWidth - el.clientWidth, y = el.scrollHeight - el.clientHeight;
    if (x > 2 || y > 2) add('scroll-required', el, `overflow ${x}px horizontal / ${y}px vertical (logical pixels)`);
    if (el.scrollTop > 1 || el.scrollLeft > 1) add('unexpected-scroll-position', el, `${el.scrollLeft},${el.scrollTop}`);
  }
  const documentOffset = { x: scrollX, y: scrollY };
  if (scrollX || scrollY) add('document-scrolled', document.documentElement, JSON.stringify(documentOffset));
  for (const image of stage.querySelectorAll('img'))
    if (visible(image) && (image.complete && !image.naturalWidth || image.__fitDecodeError)) add('broken-image', image, image.getAttribute('src'));
  for (const el of stage.querySelectorAll('button,input,select,textarea,a[href],[role="slider"]')) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    if (outside(r, bounds) || outside(r, viewport)) add('control-outside-screen', el, JSON.stringify(r.toJSON()));
    for (let p = el.parentElement; p && p !== stage; p = p.parentElement) {
      if (/hidden|clip|auto|scroll/.test(getComputedStyle(p).overflowX + getComputedStyle(p).overflowY) && outside(r, p.getBoundingClientRect(), 3))
        add('clipped-control', el, `by ${label(p)}`);
    }
    if (el.disabled || el.getAttribute('aria-disabled') === 'true') continue;
    if (getComputedStyle(el).pointerEvents === 'none') add('inactive-control', el, 'Enabled control has pointer-events:none');
    const hits = [[.5, .5], [.25, .5], [.75, .5], [.5, .25], [.5, .75]].map(([x, y]) => document.elementFromPoint(r.left + x * r.width, r.top + y * r.height));
    if (!hits.some(hit => hit && (el === hit || el.contains(hit)))) add('covered-control', el, `by ${label(hits[0])}`);
  }
  const walker = document.createTreeWalker(stage, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode, el = node.parentElement;
    if (!node.textContent.trim() || !visible(el) || el.closest('svg,script,style,textarea,select,option')) continue;
    const range = document.createRange(); range.selectNodeContents(node);
    for (const r of range.getClientRects()) {
      if (r.width < .5 || r.height < .5) continue;
      if (outside(r, bounds, 3) || outside(r, viewport, 3)) add('text-outside-screen', el, node.textContent.trim().slice(0, 60));
      for (let p = el; p && p !== stage; p = p.parentElement) {
        const cs = getComputedStyle(p), box = p.getBoundingClientRect();
        if ((/hidden|clip|auto|scroll/.test(cs.overflowX) && (r.left < box.left - 3 || r.right > box.right + 3)) ||
            (/hidden|clip|auto|scroll/.test(cs.overflowY) && (r.top < box.top - 3 || r.bottom > box.bottom + 3)))
          add('clipped-text', el, `${node.textContent.trim().slice(0, 60)} by ${label(p)}`);
      }
    }
  }
  const heading = stage.querySelector('.activity-heading'), layout = stage.querySelector('.activity-layout'), footer = stage.querySelector('.activity-footer');
  if (heading && layout && heading.getBoundingClientRect().bottom > layout.getBoundingClientRect().top + 2) add('heading-content-overlap', heading);
  if (layout && footer && layout.getBoundingClientRect().bottom > footer.getBoundingClientRect().top + 2) add('content-footer-overlap', footer);
  const paragraphs = new Map();
  for (const el of stage.querySelectorAll('p,h1,h2,.field-label')) {
    const text = el.textContent.trim().replace(/\s+/g, ' ');
    if (visible(el) && text.length >= 14) paragraphs.set(text, (paragraphs.get(text) || 0) + 1);
  }
  for (const [text, count] of paragraphs) if (count > 1) add('duplicate-copy', stage, `${count}× ${text}`);
  const isAnswer = ['s3b', 's4b'].includes(stage.dataset.scene), play = stage.querySelector('#play-time'), speed = stage.querySelector('#playback-speed');
  if (!isAnswer && (!play || !speed)) add('missing-playback-controls', stage);
  if (isAnswer && play) add('answer-autoplay-present', play);
  if (speed && !['0.5', '1', '2'].every(value => [...speed.options].some(option => option.value === value))) add('missing-playback-speeds', speed);
  return { issues, stage: bounds.toJSON(), logicalSize: { width: stage.clientWidth, height: stage.clientHeight }, document: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight } };
}

const summary = report => ({ scenarios: report.results.length, scenariosWithIssues: report.results.filter(r => r.issues.length).length, issues: report.results.reduce((sum, r) => sum + r.issues.length, 0), pageErrors: report.pageErrors.length });
const report = { base, sizes, limitations: ['Chromium viewport emulation, not physical tablet or Safari.', 'SVG internal glyph collisions and the quality of scientific artwork need visual review.', 'Intentional artwork clipping during zoom is allowed; no scrolling or clipped controls/text is allowed.'], results: [], pageErrors: [] };
const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXECUTABLE, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows', `--disk-cache-dir=${join(output, 'browser-cache')}`] });
try {
  const context = await browser.newContext({ reducedMotion: 'reduce', hasTouch: true });
  const page = await context.newPage(); page.setDefaultTimeout(12000); let current = '';
  page.on('pageerror', error => report.pageErrors.push({ case: current, message: error.message }));
  page.on('response', response => { if (response.status() >= 400) report.pageErrors.push({ case: current, message: `${response.status()} ${response.url()}` }); });
  await page.goto(base);
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    for (const item of cases) {
      const name = `${item.scene}-${item.draft}-round${item.round}${item.variant ? '-' + item.variant : ''}`; current = `${name}-${width}x${height}`;
      try {
        await page.evaluate(({ key, state }) => { localStorage.clear(); localStorage.setItem(key, JSON.stringify(state)); }, { key: SAVE_KEY, state: fixture(item) });
        await page.reload(); await page.locator(`[data-scene="${item.scene}"]`).waitFor(); await page.evaluate(settleMedia);
        const before = await page.evaluate(inspectStage);
        const click = async selector => page.locator(selector).first().evaluate(el => el.click()); // Never scroll a hidden control into view.
        if (item.round) await click(`[data-learning="round-${item.round}"]`);
        if (item.scene === 's4a' && item.draft === 'filled') await click('.sky-body');
        if (item.variant === 'overlay') await click('[data-learning="overlay-phase"]');
        if (item.variant === 'blocked') await click('[data-learning="light-toggle"]');
        if (item.variant === 'three') { await click('[data-learning="toggle-three"]'); await page.locator('#planet-viewer canvas').waitFor(); }
        if (item.variant === 'zoom2x') await page.locator('#planet-zoom').evaluate(input => { input.value = '2'; input.dispatchEvent(new Event('input', { bubbles: true })); });
        await page.evaluate(settleMedia);
        if (item.round && await page.locator(`[data-learning="round-${item.round}"]`).getAttribute('aria-pressed') !== 'true') throw Error('Requested activity tab is not active.');
        const after = await page.evaluate(inspectStage);
        const issues = [...new Map([...before.issues, ...after.issues].map(issue => [JSON.stringify(issue), issue])).values()];
        const screenshot = process.env.QA_SCREENSHOTS === 'all' || issues.length || item.draft === 'filled' && item.round === 0 && [1280, 1024, 360].includes(width) ? join(output, `${current}.png`) : undefined;
        if (screenshot) await page.screenshot({ path: screenshot });
        report.results.push({ case: name, viewport: `${width}x${height}`, ...after, issues, screenshot });
      } catch (error) { report.results.push({ case: name, viewport: `${width}x${height}`, issues: [{ type: 'scenario-error', detail: error.message }] }); }
    }
    await writeFile(join(output, 'report.partial.json'), JSON.stringify({ ...report, summary: summary(report) }, null, 2));
    console.log(`Stage fit ${width}x${height}: ${cases.length} scenarios checked`);
  }
  await context.close();
} finally {
  await browser.close(); report.summary = summary(report);
  await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ...report.summary, report: join(output, 'report.json') }));
}
if (report.summary.issues || report.summary.pageErrors) process.exitCode = 1;
