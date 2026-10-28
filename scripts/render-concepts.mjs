import sharp from 'sharp';
import { spawn } from 'node:child_process';
import { mkdir, readFile, access, copyFile } from 'node:fs/promises';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { concepts } from '../src/concepts.js';
import { moonSVG, phase } from '../src/drawing.js';
import { conceptArt } from '../src/concept-assets.js';
import { planets } from '../src/data.js';
sharp.cache(false);
sharp.concurrency(1);

const ffmpeg = process.env.FFMPEG || 'F:/DevCaches/python-media/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe';
await access(ffmpeg);
const output = new URL('../public/assets/concepts/', import.meta.url);
const working = new URL('../.cache/concept-render/', import.meta.url);
const width = 1280, height = 720, fps = 24;
const ease = value => { const bounded = Math.max(0, Math.min(1, value)); return bounded * bounded * (3 - 2 * bounded); };
const circle = (x, y, radius, fill, extra = '') => `<circle cx="${x}" cy="${y}" r="${radius}" fill="${fill}" ${extra}/>`;
const line = (x1, y1, x2, y2, color = '#9bdfc9', extra = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="7" stroke-linecap="round" ${extra}/>`;
const assetURL = src => new URL('../public' + src, import.meta.url);
const pngURI = async (src, size) => 'data:image/png;base64,' + (await sharp(await readFile(assetURL(src))).resize({ width: size, withoutEnlargement: true }).png().toBuffer()).toString('base64');
const moonHref = await pngURI(conceptArt.moon.src, 768);
const sprites = [['sun', conceptArt.sun.src, 384], ['star', conceptArt.star.src, 128], ...planets.map(planet => [planet.id, `/assets/generated/${planet.id}.webp`, 256])];
const spriteDefs = Object.fromEntries(await Promise.all(sprites.map(async ([id, src, size]) => [id, `<symbol id="body-${id}" viewBox="0 0 ${size} ${size}"><image href="${await pngURI(src, size)}" width="${size}" height="${size}"/></symbol>`])));
const picture = (id, x, y, size, extra = '') => `<use href="#body-${id}" x="${x - size / 2}" y="${y - size / 2}" width="${size}" height="${size}" ${extra}/>`;
const moon = (x, y, size, amount = 100, side = 'right') => `<g transform="translate(${x} ${y}) scale(${size / 100})">${moonSVG(amount, side, '', '', { moonHref: 'video-moon-texture' }).replace('<svg ', '<svg width="100" height="100" ').replace('<image href="video-moon-texture"', '<use href="#video-moon-texture"')}</g>`;
const moonDef = `<symbol id="video-moon-texture" viewBox="0 0 ${conceptArt.moon.width} ${conceptArt.moon.height}"><image href="${moonHref}" width="${conceptArt.moon.width}" height="${conceptArt.moon.height}"/></symbol>`;
// Each magnifier shows the same exact patch of the shared disk, not a second drawing.
const lunarDetail = (id, cx, cy, point, stroke) => {
  const size = 1260, radius = 109;
  return `<defs><clipPath id="detail-${id}">${circle(cx, cy, radius, '#fff')}</clipPath></defs><g clip-path="url(#detail-${id})">${moon(cx - point[0] * size / 100, cy - point[1] * size / 100, size)}</g>${circle(cx, cy, radius, 'none', `stroke="${stroke}" stroke-width="4"`)}`;
};
const starfield = Array.from({ length: 60 }, (_, index) => circle((index * 193 + 51) % width, (index * 109 + 42) % height, index % 4 === 0 ? 2.3 : 1.2, '#c6dfed', 'opacity=".4"')).join('');
function scene(number, time) {
  let art = '';
  if (number === 1) {
    const zoom = 1 + ease(time / 3.3) * .28;
    art = `<g transform="translate(${320 - 320 * zoom} ${360 - 360 * zoom}) scale(${zoom})">${moon(110, 150, 420)}</g>`;
    const reveal = ease((time - 3.3) / 1.5);
    for (const [id, point, cy, stroke] of [['mare', [64, 33], 225, '#f5cf7b'], ['highland', [40, 76], 490, '#9bdfc9']]) {
      const x = 320 + (110 + point[0] * 4.2 - 320) * zoom;
      const y = 360 + (150 + point[1] * 4.2 - 360) * zoom;
      art += `<g opacity="${reveal}">${line(x, y, 781, cy, stroke, 'stroke-dasharray="10 12"')}${circle(x, y, 18, 'none', `stroke="${stroke}" stroke-width="4"`)}${lunarDetail(id, 900, cy, point, stroke)}</g>`;
    }
  }
  if (number === 2) {
    const days = [3, 7, 10, 14, 17, 21, 25];
    art = line(140, 530, 1140, 530, '#547a94');
    days.forEach((day, index) => {
      const appearance = ease((time - index * .4) / .55);
      const shape = phase(day);
      art += `<g opacity="${appearance}">${moon(65 + index * 167, 395, 145, shape.amount, shape.side)}${circle(137 + index * 167, 573, 6, '#f5cf7b')}</g>`;
    });
    const day = 3 + 22 * ease((time - 2.4) / 4.4), shape = phase(day);
    art += moon(510, 80, 255, shape.amount, shape.side);
    art += circle(137 + ease((time - 2.4) / 4.4) * 1002, 573, 15, 'none', 'stroke="#f5cf7b" stroke-width="5"');
  }
  if (number === 3) {
    art = picture('sun', 120, 340, 180);
    planets.forEach((planet, index) => {
      const progress = ease((time - .4 - index * .25) / 1.8);
      const x = 280 + index * 125, y = 340 + Math.sin(time * .3 + index) * 30 * (1 - ease((time - 5) / 1.6));
      art += `<g opacity="${progress}">${line(x, 180, x, 520, '#486882', 'stroke-dasharray="6 12"')}${picture(planet.id, x, y, planet.id === 'saturn' ? 140 : index < 4 ? 90 : 115)}</g>`;
    });
    art += `<path d="M250 570H1190l-20 -12m20 12 -20 12" fill="none" stroke="#f5cf7b" stroke-width="5" opacity="${ease((time - 3.3) / 2)}"/>`;
  }
  if (number === 4) {
    art = picture('sun', 270, 350, 245) + picture('earth', 885, 350, 235, 'opacity=".12"');
    const rays = ease(time / 1.8);
    for (let index = 0; index < 12; index++) {
      const angle = index * Math.PI / 6;
      art += line(270 + Math.cos(angle) * 118, 350 + Math.sin(angle) * 118, 270 + Math.cos(angle) * (118 + 80 * rays), 350 + Math.sin(angle) * (118 + 80 * rays), '#f5cf7b');
    }
    const transfer = ease((time - 3.3) / 1.6);
    art += line(470, 320, 470 + 330 * transfer, 320, '#f5cf7b');
    art += `<path d="M${470 + 330 * transfer - 16} 310l16 10 -16 10" fill="none" stroke="#f5cf7b" stroke-width="5" opacity="${transfer}"/>`;
    art += `<defs><clipPath id="planet-lit"><rect x="760" y="200" width="125" height="300"/></clipPath></defs><g clip-path="url(#planet-lit)" opacity="${transfer}">${picture('earth', 885, 350, 235)}</g>`;
    const reflection = ease((time - 4.9) / 1.5);
    art += line(835, 400, 835 - 275 * reflection, 400 + 145 * reflection, '#9bdfc9');
    art += `<path d="M${835 - 275 * reflection + 4} ${400 + 145 * reflection - 18}l-4 18 18 3" fill="none" stroke="#9bdfc9" stroke-width="5" opacity="${reflection}"/>`;
    art += `<g opacity="${reflection}"><path d="M450 558q65 -80 130 0q-65 80 -130 0Z" fill="none" stroke="#d7e6ec" stroke-width="5"/>${circle(515, 558, 16, '#9bdfc9')}</g>`;
  }
  if (number === 5) {
    const points = [[170, 250], [390, 455], [590, 220], [790, 440], [1080, 240]];
    const progress = ease((time - 3.3) / 2);
    points.slice(0, -1).forEach((point, index) => {
      const next = points[index + 1];
      art += line(point[0], point[1], point[0] + (next[0] - point[0]) * progress, point[1] + (next[1] - point[1]) * progress);
    });
    const other = ease((time - 6.6) / 1.6);
    for (const [first, second] of [[0, 2], [2, 4], [1, 3]]) {
      const start = points[first], finish = points[second];
      art += line(start[0], start[1], start[0] + (finish[0] - start[0]) * other, start[1] + (finish[1] - start[1]) * other, '#f5cf7b', 'stroke-dasharray="12 15"');
    }
    art += points.map(([x, y]) => picture('star', x, y, 180) + circle(x, y, 47, 'none', 'stroke="#b9d9e1" stroke-width="2" opacity=".35"')).join('');
  }
  const assets = number <= 2 ? moonDef : number === 3 ? ['sun', ...planets.map(planet => planet.id)].map(id => spriteDefs[id]).join('') : number === 4 ? spriteDefs.sun + spriteDefs.earth : spriteDefs.star;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><radialGradient id="bg"><stop stop-color="#243d53"/><stop offset="1" stop-color="#0b1b30"/></radialGradient>${assets}</defs><rect width="100%" height="100%" fill="url(#bg)"/>${starfield}${art}</svg>`;
}
await mkdir(output, { recursive: true });
await mkdir(working, { recursive: true });
for (const number of Object.keys(concepts).map(Number).filter(number => !process.argv[2] || number === +process.argv[2])) {
  const clip = concepts[number];
  const filename = extension => fileURLToPath(new URL(`stage-${number}.${extension}`, output));
  const pending = extension => fileURLToPath(new URL(`stage-${number}.${extension}`, working));
  await sharp(Buffer.from(scene(number, clip.seconds - 1 / fps))).webp({ quality: 85 }).toFile(pending('webp'));
  if (process.env.CONCEPT_POSTERS_ONLY === '1') { await copyFile(pending('webp'), filename('webp')); console.log(`Stage ${number}: poster`); continue; }
  const encoder = spawn(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${width}x${height}`, '-r', `${fps}`, '-i', '-', '-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', '24', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', pending('mp4')], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = once(encoder, 'close');
  encoder.stdin.on('error', () => {});
  for (let frame = 0; frame < clip.seconds * fps; frame++) {
    const buffer = await sharp(Buffer.from(scene(number, frame / fps))).ensureAlpha().raw().toBuffer().catch(error => { throw new Error(`Stage ${number}, frame ${frame}: ${error.message}`, { cause: error }); });
    if (!encoder.stdin.write(buffer)) await once(encoder.stdin, 'drain');
    if ((frame + 1) % 60 === 0) console.log(`Stage ${number}: ${frame + 1}/${clip.seconds * fps} frames`);
  }
  encoder.stdin.end();
  const [code] = await done;
  if (code) throw Error(`FFmpeg stage ${number}: ${code}`);
  const webm = spawn(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-i', pending('mp4'), '-an', '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '34', '-cpu-used', '5', pending('webm')], { stdio: 'inherit' });
  const [webmCode] = await once(webm, 'close');
  if (webmCode) throw Error(`FFmpeg WebM stage ${number}: ${webmCode}`);
  for (const extension of ['mp4', 'webm', 'webp']) await copyFile(pending(extension), filename(extension));
  console.log(`Stage ${number}: MP4 + WebM + poster (${clip.seconds}s)`);
}
