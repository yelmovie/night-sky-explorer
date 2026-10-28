import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';
import { conceptArt } from '../src/concept-assets.js';
import { moonSVG, dayMoon, phase, starChart, projectedStars } from '../src/drawing.js';
import stars from '../src/stars.json' with { type: 'json' };
import { patternRegions, referenceLines } from '../src/data.js';

const dataSVG = body => `data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">${body}</svg>`).toString('base64')}`;
const whiteSurface = dataSVG('<rect width="1024" height="1024" fill="white"/>');
const asymmetricalSurface = dataSVG('<rect width="512" height="1024" fill="#ff0000"/><rect x="512" width="512" height="1024" fill="#0000ff"/>');
async function renderMoon(amount, side, moonHref = whiteSurface) {
  const svg = moonSVG(amount, side, '', '', { moonHref }).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" ');
  const { data, info } = await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const pixel = (x, y) => [...data.subarray((y * info.width + x) * info.channels, (y * info.width + x) * info.channels + 4)];
  return { data, info, pixel };
}
const attribute = (markup, name) => markup.match(new RegExp(`(?:^|\\s)${name}="([^"]*)"`))?.[1];

test('생성 개념 그림은 프로젝트 안에 있으며 실제 크기와 투명 채널을 갖는다', async () => {
  for (const art of Object.values(conceptArt)) {
    const file = new URL(`../public${art.src}`, import.meta.url);
    const buffer = await readFile(file);
    const metadata = await sharp(buffer).metadata();
    assert.equal(metadata.width, art.width, art.src);
    assert.equal(metadata.height, art.height, art.src);
    assert.equal(metadata.hasAlpha, true, art.src);
  }
});

test('달 0·50·100%의 실제 렌더된 밝은 면적과 좌우 방향이 기존 수학 모형을 따른다', async () => {
  for (const side of ['left', 'right']) {
    const counts = [];
    for (const amount of [0, 50, 100]) {
      const { data, info, pixel } = await renderMoon(amount, side);
      let lit = 0;
      for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
        if (Math.hypot(x + .5 - 50, y + .5 - 50) < 47 && data[(y * info.width + x) * info.channels] > 220) lit++;
      }
      counts.push(lit);
      if (amount === 50) {
        const brightX = side === 'right' ? 75 : 25, darkX = 100 - brightX;
        assert.ok(pixel(brightX, 50)[0] > 220);
        assert.ok(pixel(darkX, 50)[0] < 100);
      }
    }
    assert.equal(counts[0], 0);
    assert.ok(counts[2] > 6800);
    assert.ok(Math.abs(counts[1] / counts[2] - .5) < .02);
  }
});

test('달이 차고 기울어도 비대칭 표면 무늬는 좌우로 뒤집히지 않는다', async () => {
  const left = await renderMoon(100, 'left', asymmetricalSurface);
  const right = await renderMoon(100, 'right', asymmetricalSurface);
  assert.deepEqual(left.pixel(25, 50), right.pixel(25, 50));
  assert.deepEqual(left.pixel(75, 50), right.pixel(75, 50));
  assert.ok(left.pixel(25, 50)[0] > 240 && left.pixel(25, 50)[2] < 10);
  assert.ok(left.pixel(75, 50)[2] > 240 && left.pixel(75, 50)[0] < 10);
  const waning = await renderMoon(50, 'left', asymmetricalSurface);
  assert.ok(waning.pixel(25, 50)[0] > 240 && waning.pixel(25, 50)[2] < 10);
});

test('여러 달을 함께 렌더해도 클립 ID가 겹치지 않고 날짜별 위상과 오프라인 그림 입력을 유지한다', () => {
  const first = moonSVG(), second = moonSVG();
  const ids = [...(first + second).matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, new Set(ids).size);
  for (const day of [0, 7, 14, 21, 29]) {
    const p = phase(day), markup = dayMoon(day, 'record', { moonHref: whiteSurface });
    assert.ok(markup.includes(`밝은 부분 ${Math.round(p.amount)}%`));
    assert.ok(markup.includes(whiteSurface));
    assert.ok(markup.includes('달 학습 모형'));
    assert.equal(markup.includes('transform="translate(100 0) scale(-1 1)"'), p.side === 'left');
  }
});

test('별 그림은 원래 좌표 중심과 등급별 크기를 사용하고 첫 투명 원의 터치 영역을 보존한다', () => {
  const markup = starChart({ selected: 'Caph', observed: ['Schedar'], starHref: whiteSurface });
  assert.equal([...markup.matchAll(/<image\b/g)].length, 1, '한 지도 안에서 공용 이미지 한 개를 참조한다');
  const nodes = [...markup.matchAll(/<g role="button"[^>]*data-star="([^"]+)"[^>]*>([\s\S]*?)<\/g>/g)];
  assert.equal(nodes.length, stars.length);
  for (const [, id, body] of nodes) {
    const original = stars.find(star => star.id === id), radius = (90 - original.dec) * 4.45, angle = original.ra / 24 * Math.PI * 2;
    const x = 300 + Math.sin(angle) * radius, y = 220 - Math.cos(angle) * radius;
    const hit = body.match(/^<circle\b[^>]*>/)?.[0];
    assert.ok(hit, 'ResizeObserver가 조절하는 첫 요소는 투명 circle이다');
    assert.equal(+attribute(hit, 'cx'), x); assert.equal(+attribute(hit, 'cy'), y);
    assert.equal(+attribute(hit, 'r'), 10); assert.equal(attribute(hit, 'fill'), 'transparent');
    const image = body.match(/<use\b[^>]*>/)?.[0], size = +attribute(image, 'width');
    assert.equal(size, (id === 'Polaris' ? 7 : Math.max(3, 7 - original.mag)) * 4);
    assert.ok(Math.abs(+attribute(image, 'x') + size / 2 - x) < 1e-9);
    assert.ok(Math.abs(+attribute(image, 'y') + size / 2 - y) < 1e-9);
    if (id === 'Caph') assert.ok(body.includes('stroke="#ffd771"'));
    if (id === 'Schedar') assert.ok(body.includes('stroke="#80e0c577"'));
  }
});

test('별 그림 교체가 관측 영역이나 내 선·기준선 끝점을 바꾸지 않는다', () => {
  for (const [region, { stars: expected }] of Object.entries(patternRegions)) {
    const markup = starChart({ region });
    assert.deepEqual([...markup.matchAll(/data-star="([^"]+)"/g)].map(match => match[1]).sort(), [...expected].sort());
  }
  const pair = ['Caph', 'Schedar'], markup = starChart({ lines: [pair], reference: true, interactive: false });
  assert.equal(markup.includes('role="button"'), false);
  const lines = [...markup.matchAll(/<line\b[^>]*>/g)].map(match => match[0]);
  assert.equal(lines.filter(line => attribute(line, 'class') === 'reference-line').length, referenceLines.length);
  const mine = lines.find(line => attribute(line, 'class') === 'my-line');
  const [from, to] = pair.map(id => projectedStars.find(star => star.id === id));
  assert.equal(+attribute(mine, 'x1'), from.x); assert.equal(+attribute(mine, 'y1'), from.y);
  assert.equal(+attribute(mine, 'x2'), to.x); assert.equal(+attribute(mine, 'y2'), to.y);
});
