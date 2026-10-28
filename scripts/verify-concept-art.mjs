import { pathToFileURL, fileURLToPath } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { freshState, completeStage, SAVE_KEY } from '../src/state.js';
import { planets, bodies, solarOrder, patternRegions } from '../src/data.js';
import { conceptArt } from '../src/concept-assets.js';

// These fixtures inspect art and controls. They are not evidence of a real playthrough.
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const base = process.env.TEST_URL || 'http://127.0.0.1:5183';
const output = new URL('../.cache/concept-art-qa/', import.meta.url);
const sizes = process.env.TEST_SIZES
  ? process.env.TEST_SIZES.split(',').map(value => value.split('x').map(Number))
  : [[1280, 800], [1024, 600], [375, 812]];
const scenes = process.env.TEST_FOCUS ? process.env.TEST_FOCUS.split(',')
  : [...[1, 2, 3, 4, 5].flatMap(number => [`s${number}a`, `s${number}b`]), 'core', 'results'];
const generatedPaths = Object.values(conceptArt).map(asset => asset.src);
const errors = [], layouts = [], phases = [], lights = [], screenshots = [], decoded = new Set(), responses = new Set();
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.BROWSER_EXECUTABLE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, hasTouch: true });
const page = await context.newPage();
page.setDefaultTimeout(12000);
page.on('pageerror', error => errors.push(error.message));
page.on('response', response => {
  if (response.status() >= 400) errors.push(`${response.status()}: ${response.url()}`);
  if (response.ok()) responses.add(new URL(response.url()).pathname);
});
page.on('requestfailed', request => {
  // Scene changes may cancel an old document; failed art requests must still be reported.
  if (request.resourceType() === 'image') errors.push(`${request.failure()?.errorText}: ${request.url()}`);
});

function fixture(scene) {
  const state = freshState();
  state.started = true; state.settings.adminUnlock = true; state.settings.muted = true; state.settings.reducedMotion = true;
  state.scene = scene; state.resume = scene;
  Object.assign(state.drafts.moon, { x: 0, y: 0, zoom: 1.5, focus: 72 });
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
    state.drafts.pattern.cases[id] = { lines, original: structuredClone(lines), compared: true, showReference: true, reflection: '같은 별을 다른 선으로 이어도 별의 위치는 같아요.' };
  }
  for (let number = 1; number <= 5; number++) assert.ok(completeStage(state, number));
  state.core = { connections: { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 }, angle: 180, restored: scene === 'results' };
  return state;
}

async function openScene(scene) {
  await page.evaluate(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key: SAVE_KEY, state: fixture(scene) });
  await page.reload();
  await page.locator('main').waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => window.scrollTo(0, 0));
}

async function verifyImages(label) {
  await page.evaluate(async () => {
    await Promise.all([...document.images].map(image => image.decode()));
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  const urls = await page.evaluate(() => [...new Set([
    ...[...document.querySelectorAll('img')].map(image => image.currentSrc || image.src),
    ...[...document.querySelectorAll('svg image')].map(image => image.href?.baseVal || image.getAttribute('href')),
  ].filter(Boolean))].map(value => new URL(value, document.baseURI).href));
  for (const url of urls.filter(url => !decoded.has(url))) {
    const result = await page.evaluate(src => new Promise(resolve => {
      const image = new Image();
      const timer = setTimeout(() => resolve({ ok: false, error: 'decode timeout' }), 10000);
      image.onload = () => { clearTimeout(timer); resolve({ ok: image.naturalWidth > 0, width: image.naturalWidth, height: image.naturalHeight }); };
      image.onerror = () => { clearTimeout(timer); resolve({ ok: false, error: 'image load failed' }); };
      image.src = src;
    }), url);
    assert.ok(result.ok, `${label}: ${url} (${result.error || 'invalid dimensions'})`);
    decoded.add(url);
  }
}

async function layout(label) {
  const result = await page.evaluate(label => {
    const clipped = (element, x, y) => {
      for (let parent = element.parentElement; parent; parent = parent.parentElement) {
        const style = getComputedStyle(parent), box = parent.getBoundingClientRect();
        if (/(auto|scroll|hidden|clip)/.test(style.overflowX) && (x < box.left || x > box.right)) return true;
        if (/(auto|scroll|hidden|clip)/.test(style.overflowY) && (y < box.top || y > box.bottom)) return true;
      }
      return false;
    };
    const controls = [...document.querySelectorAll('main button, main input, main select, main textarea, main [data-star]')]
      .filter(element => element.checkVisibility() && !element.closest('details:not([open])'));
    const outside = [], blocked = [];
    for (const element of controls) {
      const box = element.getBoundingClientRect(), x = box.left + box.width / 2, y = box.top + box.height / 2;
      const name = element.getAttribute('aria-label') || element.textContent.trim().slice(0, 55) || element.id;
      if (box.left < -1 || box.right > innerWidth + 1) outside.push(name);
      if (element.disabled || !box.width || !box.height || x < 0 || x >= innerWidth || y < 0 || y >= innerHeight || clipped(element, x, y)) continue;
      const top = document.elementFromPoint(x, y);
      if (top && top !== element && !element.contains(top)) blocked.push({ control: name, by: top.className?.baseVal || top.className || top.tagName });
    }
    return { label, width: innerWidth, height: innerHeight, horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1, outside, blocked };
  }, label);
  layouts.push(result);
  assert.equal(result.horizontalOverflow, false, label + ': horizontal overflow');
  assert.deepEqual(result.outside, [], label + ': offscreen controls');
  assert.deepEqual(result.blocked, [], label + ': pointer targets covered');
}

async function shot(label, locator = page) {
  const filename = `${page.viewportSize().width}-${label}.png`;
  await locator.screenshot({ path: fileURLToPath(new URL(filename, output)), animations: 'disabled', timeout: 30000, ...(locator === page ? { fullPage: page.viewportSize().width < 700 } : {}) });
  screenshots.push(filename);
}

async function lightState(label) {
  const value = await page.locator('.light-lab-art').evaluate(svg => {
    const shown = element => element && !element.closest('[hidden]') && getComputedStyle(element).display !== 'none' && Number(getComputedStyle(element).opacity) !== 0;
    return { label: svg.getAttribute('aria-label'), incoming: shown(svg.querySelector('[data-light-ray="incoming"]')), reflected: shown(svg.querySelector('[data-light-ray="reflected"]')) };
  });
  assert.ok(value.label, 'light experiment needs an accessible explanation');
  lights.push({ state: label, ...value });
  assert.equal(value.incoming, true, 'sunlight still reaches the blocker');
  assert.equal(value.reflected, label === 'open', 'blocking sunlight removes the reflected ray');
}

try {
  await page.goto(base);
  await page.locator('.home-v2').waitFor();
  await page.waitForLoadState('networkidle');
  const homeNewImages = generatedPaths.filter(path => responses.has(path));
  assert.deepEqual(homeNewImages, [], 'new stage illustrations should not preload on home');
  console.log('PASS: new concept art is not requested on home');

  for (const [width, height] of sizes) {
    console.log(`Concept art screens ${width}×${height}`);
    await page.setViewportSize({ width, height });
    for (const scene of scenes) {
      await openScene(scene);
      if (scene === 's4a') await page.locator('[data-learning="body-sun"]').click();
      await verifyImages(scene); await layout(scene); await shot(scene);
      if (scene === 's4a') {
        await lightState('open');
        await page.locator('[data-learning="light-toggle"]').click();
        await verifyImages('light-blocked'); await lightState('blocked'); await layout('light-blocked'); await shot('light-blocked');
      }
      if (scene === 's5a' || scene === 's5b') {
        const nodes = await page.locator('[data-star]').evaluateAll(elements => elements.map(element => {
          const hit = element.querySelector('circle'), image = element.querySelector('use, image');
          return { id: element.dataset.star, hitRadius: +hit?.getAttribute('r'), dx: image ? +image.getAttribute('x') + +image.getAttribute('width') / 2 - +hit.getAttribute('cx') : null, dy: image ? +image.getAttribute('y') + +image.getAttribute('height') / 2 - +hit.getAttribute('cy') : null };
        }));
        assert.ok(nodes.length > 0);
        for (const node of nodes) { assert.ok(node.hitRadius >= 10, node.id + ' hit area'); assert.ok(node.dx !== null && Math.abs(node.dx) < .01 && Math.abs(node.dy) < .01, node.id + ' art center matches catalog center'); }
      }
      if (scene === 'core') assert.equal(await page.locator('.calibration-art').getAttribute('src'), conceptArt.coreDial.src);
    }
  }

  // The same lunar texture must stay upright while only the lit mask changes sides.
  await page.setViewportSize({ width: 1280, height: 800 }); await openScene('s2b');
  for (const side of ['right', 'left']) {
    await page.locator(`[data-learning="side-${side}"]`).click();
    for (const amount of [0, 25, 50, 75, 100]) {
      await page.locator('#prediction-amount').evaluate((input, amount) => { input.value = amount; input.dispatchEvent(new Event('input', { bubbles: true })); }, amount);
      const texture = await page.locator('#prediction-moon svg image').evaluateAll(images => images.map(image => {
        const transforms = []; for (let node = image; node && node.id !== 'prediction-moon'; node = node.parentElement) transforms.push(node.getAttribute('transform') || '');
        return { href: image.href.baseVal, transforms };
      }));
      assert.ok(texture.length > 0);
      for (const image of texture) { assert.ok(image.href.endsWith(conceptArt.moon.src)); assert.ok(image.transforms.every(value => !/scale\(\s*-/.test(value)), 'phase switch must not mirror lunar markings'); }
      phases.push({ side, amount, textureCount: texture.length });
      await shot(`moon-${side}-${amount}`, page.locator('#prediction-moon'));
    }
  }
  for (const path of generatedPaths) assert.ok([...decoded].some(url => new URL(url).pathname === path), path + ' was displayed and decoded');
  assert.deepEqual(errors, []);
  await writeFile(new URL('report.json', output), JSON.stringify({ kind: 'fixture-based art and layout inspection, not real completion', homePreload: false, layouts, phases, lights, decoded: [...decoded], screenshots, errors }, null, 2));
  console.log(JSON.stringify({ layoutChecks: layouts.length, phaseChecks: phases.length, decodedImages: decoded.size, screenshots: screenshots.length, errors }, null, 2));
} catch (error) {
  await writeFile(new URL('failure.json', output), JSON.stringify({ error: String(error), layouts, phases, lights, errors }, null, 2));
  await page.screenshot({ path: fileURLToPath(new URL('failure.png', output)), timeout: 10000 }).catch(() => {});
  throw error;
} finally { await browser.close(); }
