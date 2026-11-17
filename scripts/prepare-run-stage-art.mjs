// Turns the generated originals of the 3D hill path into the WebP files the stage loads.
// Originals: asset-bank/original/run-stage-20261117/*.png (not in the repository; prompts are in the plan document).
// Usage: node scripts/prepare-run-stage-art.mjs   (missing originals are skipped; the stage then draws that part by code)
import sharp from 'sharp';
import { existsSync, statSync, mkdirSync } from 'node:fs';

const src = 'asset-bank/original/run-stage-20261117/', out = 'public/assets/generated/run-stage/';
mkdirSync(out, { recursive: true });
const has = name => existsSync(`${src}${name}.png`);
const done = name => console.log(`${name}.webp ${Math.round(statSync(`${out}${name}.webp`).size / 1024)} KiB`);

// Seamless floor and wall tiles.
for (const [from, to] of [['grass', 'night-grass'], ['path', 'night-path'], ['wall', 'stone-wall'], ['water', 'stream'], ['door', 'door']]) {
  if (!has(from)) { console.log('missing', from); continue; }
  await sharp(`${src}${from}.png`).resize(512, 512, { fit: 'cover' }).webp({ quality: 82 }).toFile(`${out}${to}.webp`);
  done(to);
}
// Far hills: keep the band with the hills and let the flat sky above them fade to nothing,
// so the scene's own sky colour and the code-drawn stars continue behind it.
if (has('backdrop')) {
  const meta = await sharp(`${src}backdrop.png`).metadata(), top = Math.round(meta.height * 0.36), height = meta.height - top, width = 2048, tall = Math.round(height * width / meta.width);
  const { data } = await sharp(`${src}backdrop.png`).extract({ left: 0, top, width: meta.width, height }).resize(width, tall).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const fade = Math.round(tall * 0.22);
  for (let y = 0; y < fade; y++) { const alpha = Math.round(255 * (y / fade) ** 1.5); for (let x = 0; x < width; x++) data[(y * width + x) * 4 + 3] = alpha; }
  await sharp(data, { raw: { width, height: tall, channels: 4 } }).webp({ quality: 80, alphaQuality: 90 }).toFile(`${out}night-ridge.webp`);
  done('night-ridge');
}
/** Bounding box of the visible pixels. */
async function bounds(image, threshold = 40) {
  const { data, info } = await image.clone().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let left = info.width, right = -1, top = info.height, bottom = -1;
  const columns = new Uint32Array(info.width);
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) if (data[(y * info.width + x) * 4 + 3] > threshold) { columns[x]++; if (x < left) left = x; if (x > right) right = x; if (y < top) top = y; if (y > bottom) bottom = y; }
  return { left, top, width: right - left + 1, height: bottom - top + 1, columns, info };
}
if (has('observatory')) {
  const image = sharp(`${src}observatory.png`), box = await bounds(image);
  if (!box.info.channels || box.width <= 0) throw new Error('observatory: no visible pixels');
  await image.extract({ left: box.left, top: box.top, width: box.width, height: box.height }).resize({ height: 768 }).webp({ quality: 86, alphaQuality: 92 }).toFile(`${out}observatory.webp`);
  done('observatory');
}
// Four props drawn in one row become four equal cells, each prop centred and standing on the bottom edge.
if (has('props')) {
  const image = sharp(`${src}props.png`), box = await bounds(image), runs = [];
  for (let x = 0, start = -1; x <= box.info.width; x++) {
    const filled = x < box.info.width && box.columns[x] > 2;
    if (filled && start < 0) start = x;
    if (!filled && start >= 0) { if (x - start > 12) runs.push([start, x - 1]); start = -1; }
  }
  if (runs.length !== 4) throw new Error(`props: expected 4 separate props, found ${runs.length}`);
  const cellWidth = 384, cellHeight = 512, layers = [];
  for (const [index, [left, right]] of runs.entries()) {
    // Materialise the column first: sharp treats a second extract() on one pipeline as a post-resize crop.
    const part = sharp(await image.clone().extract({ left, top: 0, width: right - left + 1, height: box.info.height }).png().toBuffer()), inner = await bounds(part);
    const piece = await part.extract({ left: 0, top: inner.top, width: right - left + 1, height: inner.height }).resize(cellWidth - 16, cellHeight - 8, { fit: 'inside' }).png().toBuffer({ resolveWithObject: true });
    layers.push({ input: piece.data, left: index * cellWidth + Math.round((cellWidth - piece.info.width) / 2), top: cellHeight - piece.info.height - 4 });
  }
  await sharp({ create: { width: cellWidth * 4, height: cellHeight, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(layers).webp({ quality: 88, alphaQuality: 92 }).toFile(`${out}props.webp`);
  done('props');
}
if (has('intro')) {
  await sharp(`${src}intro.png`).resize({ width: 1280 }).webp({ quality: 80 }).toFile(`${out}start-card.webp`);
  done('start-card');
}
