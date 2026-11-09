// Responsive regression sweep. Run against the local dev server or preview.
// PLAYWRIGHT_MODULE=<absolute index.mjs> BROWSER_EXECUTABLE=<browser>
// TEST_URL=http://127.0.0.1:5183 RESPONSIVE_QA_DIR=<external-SSD directory>
// Optional: TEST_SIZES=1024x600,360x740 QA_SCENES=s1a,s4a QA_SCREENSHOTS=all
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join, isAbsolute } from 'node:path';
import { pathToFileURL } from 'node:url';
import { SAVE_KEY, freshState } from '../src/state.js';
import { completedState } from './shot-fixture.mjs';

const base = process.env.TEST_URL || 'http://127.0.0.1:5183';
const output = resolve(process.env.RESPONSIVE_QA_DIR || '.tmp/responsive-qa');
if (!process.env.PLAYWRIGHT_MODULE || !process.env.BROWSER_EXECUTABLE)
  throw Error('Set PLAYWRIGHT_MODULE and BROWSER_EXECUTABLE to existing local files.');
if (!isAbsolute(process.env.PLAYWRIGHT_MODULE) || !isAbsolute(process.env.BROWSER_EXECUTABLE))
  throw Error('Browser and Playwright paths must be absolute.');
// Keep Chromium profiles/crash files on the same verified external SSD as the report.
const browserTemp = join(output, 'browser-tmp');
await mkdir(browserTemp, { recursive: true });
process.env.TMPDIR = browserTemp;
process.env.TMP = browserTemp;
process.env.TEMP = browserTemp;
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const sizes = (process.env.TEST_SIZES || '1920x1080,1366x768,1280x800,1024x600,873x412,740x360,360x740')
  .split(',').map(value => value.split('x').map(Number));
const scenes = Array.from({ length: 5 }, (_, i) => [`s${i + 1}a`, `s${i + 1}b`]).flat();
const allowed = process.env.QA_SCENES?.split(',');
const cases = [];
for (const scene of scenes) {
  for (const draft of ['empty', 'filled']) {
    for (const round of ['s2a', 's3a'].includes(scene) ? [0] : [0, 1])
      cases.push({ scene, draft, round });
  }
}
for (const round of [0, 1]) cases.push({ scene: 's2b', draft: 'filled', round, variant: 'overlay' });
for (const scene of ['home', 'map', 'core']) cases.push({ scene, draft: 'filled', round: 0 });
cases.push({ scene: 'core', draft: 'filled', round: 0, variant: 'connected' });
cases.push({ scene: 's3a', draft: 'filled', round: 0, variant: 'zoom2x' });
cases.push({ scene: 's3a', draft: 'filled', round: 0, variant: 'reference' });
if (process.env.QA_EXTENDED === '1') cases.push({ scene: 's3a', draft: 'filled', round: 0, variant: 'three' });
const selected = cases.filter(item => !allowed || allowed.includes(item.scene));

function fixture(item) {
  const stage = Number(item.scene[1]);
  const state = completedState(stage ? stage - 1 : item.scene === 'core' ? 5 : 2);
  if (item.draft === 'empty') {
    const observed = state.drafts;
    state.drafts = freshState().drafts;
    // B activities naturally open only after A is ready. Keep the observed A
    // material while leaving B's answer fields and comparison records empty.
    if (item.scene.endsWith('b')) {
      if (stage === 1) state.drafts.moon.photos = observed.moon.photos;
      if (stage === 2) state.drafts.phases.captures = observed.phases.captures;
      if (stage === 3) state.drafts.planets.records = observed.planets.records;
      if (stage === 4) state.drafts.classification.viewed = observed.classification.viewed;
      if (stage === 5) state.drafts.pattern.observed = observed.pattern.observed;
    }
  }
  Object.assign(state, { scene: item.scene, resume: item.scene, started: true, intro: true });
  Object.assign(state.settings, { muted: true, bgm: false, reducedMotion: true, adminUnlock: false });
  state.core.reportSeen = true;
  if (item.variant === 'connected') state.core.connections = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 }, state.core.angle = 180;
  return state;
}

async function settleMedia() {
  await document.fonts.ready;
  await Promise.all([...document.images].map(async image => {
    delete image.__responsiveDecodeError;
    const source = image.currentSrc || image.src;
    try {
      await image.decode();
    } catch (error) {
      // A rerender can detach/replace an image while its decode is pending.
      // Only preserve a failure belonging to the currently displayed source.
      if (image.isConnected && (image.currentSrc || image.src) === source)
        image.__responsiveDecodeError = `${error.name}: ${error.message}`;
    }
  }));
}

function reportSummary(report) {
  return {
    scenarios: report.results.length,
    scenariosWithIssues: report.results.filter(result => result.issues.length).length,
    issues: report.results.reduce((total, result) => total + result.issues.length, 0),
    pageErrors: report.pageErrors.length,
  };
}

// Range rectangles measure actual glyph lines rather than decorative pseudo-elements.
// Content inside a functioning scroll container can be reached and is not clipping.
function inspectLayout() {
  const issues = [];
  const unique = new Set();
  const issue = (type, element, detail) => {
    const label = element?.getAttribute?.('aria-label') || element?.id || element?.textContent?.trim().replace(/\s+/g, ' ').slice(0, 85) || element?.tagName;
    const entry = { type, element: label, detail };
    const key = JSON.stringify(entry);
    if (!unique.has(key)) unique.add(key), issues.push(entry);
  };
  const visible = element => {
    // Native modal dialogs make the background inert by design.
    const modal = document.querySelector('dialog:modal');
    if (modal && !modal.contains(element)) return false;
    if (element.closest('[hidden],[aria-hidden="true"],.sr-only')) return false;
    const closedDetails = element.closest('details:not([open])');
    if (closedDetails && !closedDetails.querySelector(':scope > summary')?.contains(element)) return false;
    const style = getComputedStyle(element), r = element.getBoundingClientRect();
    if (style.display === 'none' || style.visibility === 'hidden' || +style.opacity === 0 || r.width < .5 || r.height < .5) return false;
    for (let p = element.parentElement; p; p = p.parentElement) {
      const ps = getComputedStyle(p);
      if (ps.display === 'none' || ps.visibility === 'hidden' || +ps.opacity === 0) return false;
    }
    return true;
  };
  const scrolls = (element, axis) => {
    const style = getComputedStyle(element);
    return /auto|scroll/.test(axis === 'x' ? style.overflowX : style.overflowY)
      && (axis === 'x' ? element.scrollWidth > element.clientWidth + 2 : element.scrollHeight > element.clientHeight + 2);
  };
  const documentScrolls = axis => axis === 'x'
    ? document.documentElement.scrollWidth > innerWidth + 2
    : document.documentElement.scrollHeight > innerHeight + 2 && getComputedStyle(document.body).overflowY !== 'hidden';
  const outside = (a, b, axis, tolerance = 2) => axis === 'x'
    ? a.left < b.left - tolerance || a.right > b.right + tolerance
    : a.top < b.top - tolerance || a.bottom > b.bottom + tolerance;
  const viewport = { left: 0, top: 0, right: innerWidth, bottom: innerHeight };
  if (document.documentElement.scrollWidth > innerWidth + 2)
    issue('horizontal-overflow', document.documentElement, `${document.documentElement.scrollWidth - innerWidth}px`);
  for (const image of document.images) {
    if (image.complete && !image.naturalWidth || image.__responsiveDecodeError)
      issue('broken-image', image, `${image.getAttribute('src')}${image.__responsiveDecodeError ? ' · ' + image.__responsiveDecodeError : ''}`);
  }
  for (const element of document.querySelectorAll('button,a[href],input,select,textarea,[role="button"],[role="slider"]')) {
    if (!visible(element)) continue;
    const r = element.getBoundingClientRect();
    if (element.matches('.learning-v2 button, dialog:modal button') && (r.width < 43 || r.height < 43)) {
      // Scaled lessons widen the touch area with an invisible ::before (responsive.css). Measure what a finger
      // actually hits just outside each edge, not only the drawn box.
      const own = (x, y) => { const hit = document.elementFromPoint(x, y); return hit && (hit === element || element.contains(hit)); };
      const reach = probe => [6, 5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1, .5].find(probe) || 0;
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const h = r.height + reach(d => own(cx, r.top - d)) + reach(d => own(cx, r.bottom + d));
      const w = r.width + reach(d => own(r.left - d, cy)) + reach(d => own(r.right + d, cy));
      if (w < 43.5 || h < 43.5) issue('small-touch-control', element, `${Math.round(r.width)}x${Math.round(r.height)}px (touch ${Math.round(w)}x${Math.round(h)}px)`);
    }
    // Map pins are reached by the map's explicit panning controls. Their world
    // positions intentionally extend beyond the clipped camera viewport.
    for (const axis of element.matches('.world-pin,.map-companion') ? [] : ['x', 'y']) {
      let canScroll = false;
      for (let p = element.parentElement; p && p !== document.documentElement; p = p.parentElement) {
        const style = getComputedStyle(p), overflow = axis === 'x' ? style.overflowX : style.overflowY;
        if (scrolls(p, axis)) canScroll = true;
        if (/hidden|clip/.test(overflow) && outside(r, p.getBoundingClientRect(), axis) && !canScroll)
          issue('unreachable-control', element, `clipped-${axis} by ${p.className || p.tagName}`);
      }
      if (outside(r, viewport, axis) && !canScroll && !documentScrolls(axis))
        issue('unreachable-control', element, `outside-${axis} with no scrolling ancestor`);
    }
    if (element.disabled || element.getAttribute('aria-disabled') === 'true') continue;
    if (getComputedStyle(element).pointerEvents === 'none') {
      issue('inactive-control', element, 'Enabled control has pointer-events:none');
      continue;
    }
    // Only hit-test controls fully in view. Scrolling checks cover offscreen controls.
    if (r.left < 0 || r.top < 0 || r.right > innerWidth || r.bottom > innerHeight) continue;
    let inScrollClip = false;
    for (let p = element.parentElement; p; p = p.parentElement) {
      if ((scrolls(p, 'y') || scrolls(p, 'x')) && (outside(r, p.getBoundingClientRect(), 'x') || outside(r, p.getBoundingClientRect(), 'y'))) inScrollClip = true;
    }
    if (inScrollClip) continue;
    const points = [[.5, .5], [.25, .5], [.75, .5], [.5, .25], [.5, .75]];
    const hits = points.map(([x, y]) => document.elementFromPoint(r.left + r.width * x, r.top + r.height * y));
    const valid = hits.filter(hit => hit && (element === hit || element.contains(hit))).length;
    if (!valid) issue('covered-control', element, `covered by ${hits[0]?.id || hits[0]?.className || hits[0]?.tagName}`);
  }
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode, element = node.parentElement;
    if (!node.textContent.trim() || !element || !visible(element) || element.closest('svg,script,style,textarea,select,option,.world-layer')) continue;
    const range = document.createRange(); range.selectNodeContents(node);
    for (const r of range.getClientRects()) {
      if (r.width < .5 || r.height < .5) continue;
      for (const axis of ['x', 'y']) {
        let canScroll = false;
        for (let p = element; p && p !== document.documentElement; p = p.parentElement) {
          const style = getComputedStyle(p), overflow = axis === 'x' ? style.overflowX : style.overflowY;
          if (scrolls(p, axis)) canScroll = true;
          if (/hidden|clip/.test(overflow) && outside(r, p.getBoundingClientRect(), axis, 3) && !canScroll)
            issue('clipped-text', element, `${node.textContent.trim().slice(0, 65)} (${axis}, ${p.className || p.tagName})`);
        }
      }
      const button = element.closest('button');
      if (!button || button.closest('.prediction-board.is-overlay')) continue;
      for (const icon of button.querySelectorAll(':scope > svg,:scope > img,:scope > i')) {
        if (icon.contains(element)) continue;
        const ir = icon.getBoundingClientRect();
        const w = Math.min(r.right, ir.right) - Math.max(r.left, ir.left), h = Math.min(r.bottom, ir.bottom) - Math.max(r.top, ir.top);
        if (w > 3 && h > 3) issue('icon-text-overlap', button, node.textContent.trim().slice(0, 65));
      }
    }
  }
  const heading = document.querySelector('.learning-v2 .activity-heading'), layout = document.querySelector('.learning-v2 .activity-layout');
  if (heading && layout && heading.getBoundingClientRect().bottom > layout.getBoundingClientRect().top + 2)
    issue('heading-content-overlap', heading, `${Math.round(heading.getBoundingClientRect().bottom - layout.getBoundingClientRect().top)}px`);
  return { issues, document: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight } };
}

const browser = await chromium.launch({
  executablePath: process.env.BROWSER_EXECUTABLE,
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows'],
});
const report = { base, sizes, limitations: ['Automated Chromium layout checks; physical tablet/Safari are not measured.', 'Canvas/SVG internal label collisions require visual screenshot review.', 'Controls offscreen in working scroll containers are reachable and are allowed.', 'Map-world pins outside the camera are reachable through map panning and are excluded from reachability errors.'], results: [], pageErrors: [] };
try {
  const context = await browser.newContext({ reducedMotion: 'reduce', hasTouch: true });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  let current = '';
  page.on('pageerror', error => report.pageErrors.push({ case: current, message: error.message }));
  page.on('response', response => { if (response.status() >= 400) report.pageErrors.push({ case: current, message: `${response.status()} ${response.url()}` }); });
  await page.goto(base);
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    for (const item of selected) {
      const name = `${item.scene}-${item.draft}-round${item.round}${item.variant ? '-' + item.variant : ''}`;
      current = `${name}-${width}x${height}`;
      try {
        await page.evaluate(({ key, state }) => { localStorage.clear(); localStorage.setItem(key, JSON.stringify(state)); }, { key: SAVE_KEY, state: fixture(item) });
        await page.reload({ waitUntil: 'load' });
        await page.evaluate(settleMedia);
        if (/^s/.test(item.scene)) {
          await page.locator(`[data-scene="${item.scene}"]`).waitFor();
          const tab = page.locator(`[data-learning="round-${item.round}"]`);
          if (await tab.count()) {
            if (item.round) await tab.click();
            if (await tab.getAttribute('aria-pressed') !== 'true') throw Error('Requested activity round did not become active.');
          } else if (item.round) throw Error('Requested round has no matching activity tab.');
          if (item.scene === 's4a' && item.draft === 'filled') await page.locator('.sky-body').first().click();
          if (item.variant === 'overlay') await page.locator('[data-learning="overlay-phase"]').click();
          if (item.variant === 'three') { await page.locator('[data-learning="toggle-three"]').click(); await page.locator('#planet-viewer canvas').waitFor(); }
          if (item.variant === 'reference') await page.locator('[data-learning="solar-note"]').click();
          if (item.variant === 'zoom2x') await page.locator('#planet-zoom').evaluate(input => {
            input.value = '2'; input.dispatchEvent(new Event('input', { bubbles: true }));
          });
        } else await page.locator(item.scene === 'home' ? '.home-v2' : item.scene === 'map' ? '.world-screen' : '.core-v3').waitFor();
        // Tabs, selected celestial bodies, and view variants rerender images.
        // Wait for those new nodes, rather than measuring their loading state.
        await page.evaluate(settleMedia);
        await page.evaluate(() => { window.scrollTo(0, 0); for (const panel of document.querySelectorAll('.experiment-zone,.toolbox')) panel.scrollTop = 0; });
        await page.waitForTimeout(100);
        const result = await page.evaluate(inspectLayout);
        const shouldScreenshot = process.env.QA_SCREENSHOTS === 'all' || result.issues.length || item.draft === 'filled' && item.round === 0 && [1280, 1024, 360].includes(width);
        const screenshot = shouldScreenshot ? join(output, `${current}.png`) : undefined;
        if (screenshot) await page.screenshot({ path: screenshot, fullPage: true });
        report.results.push({ case: name, viewport: `${width}x${height}`, ...result, screenshot });
      } catch (error) {
        report.results.push({ case: name, viewport: `${width}x${height}`, issues: [{ type: 'scenario-error', detail: error.message }] });
      }
    }
    await writeFile(join(output, 'report.partial.json'), JSON.stringify({ ...report, summary: reportSummary(report) }, null, 2));
    console.log(`Responsive sweep ${width}x${height}: ${selected.length} scenarios checked`);
  }
  await context.close();
} finally {
  await browser.close();
  report.summary = reportSummary(report);
  await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ...report.summary, report: join(output, 'report.json') }));
}
if (report.summary.issues || report.summary.pageErrors) process.exitCode = 1;
