// films/stage-N → HyperFrames 렌더(1920×1080 30fps) → 앱 경로·형식으로 게시.
// public/assets/concepts/stage-N.mp4 (1280×720 H.264 + AAC, faststart)
// public/assets/concepts/stage-N.webm (1280×720 VP9 + Opus) · stage-N.webp (마지막 장면 = 포스터·동작 줄이기 대체 그림)
// 실행: node films/build.mjs && node films/render.mjs [번호...]
//   RENDER_DIR=<외장 SSD 폴더> 필수(렌더 원본·임시 프레임을 저장소 밖에 둔다). SKIP_RENDER=1이면 기존 원본으로 게시만.
import { execFileSync } from 'node:child_process';
import { statSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { films } from './films.data.mjs';
import { DURATION } from './kit/kit.mjs';

const sharp = createRequire(import.meta.url)('sharp');
const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', 'public', 'assets', 'concepts');
const renders = process.env.RENDER_DIR;
if (!renders) throw Error('RENDER_DIR를 외장 SSD 폴더로 지정해 줘.');
mkdirSync(renders, { recursive: true });
const LIMIT = 2.5 * 1024 * 1024;
const only = process.argv.slice(2).map(Number);
const probe = file => +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString();

for (const f of films.filter(f => !only.length || only.includes(f.id))) {
  const dir = join(here, `stage-${f.id}`), src = join(renders, `stage-${f.id}-1080.mp4`);
  if (process.env.SKIP_RENDER !== '1') {
    execFileSync('hyperframes', ['render', '--quality', 'delivery', '-o', src], { cwd: dir, stdio: 'inherit' });
  }
  const length = probe(src);
  if (Math.abs(length - DURATION) > .1) throw Error(`stage-${f.id}: 렌더 길이 ${length}s ≠ ${DURATION}s`);
  const mp4 = join(out, `stage-${f.id}.mp4`), webm = join(out, `stage-${f.id}.webm`);
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', src, '-vf', 'scale=1280:720:flags=lanczos', '-r', '30', '-c:v', 'libx264', '-profile:v', 'main', '-pix_fmt', 'yuv420p', '-crf', '24', '-preset', 'slow',
    '-af', 'volume=-3dB', '-c:a', 'aac', '-b:a', '64k', '-ac', '1', '-movflags', '+faststart', mp4]);
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', src, '-vf', 'scale=1280:720:flags=lanczos', '-r', '30', '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '36', '-row-mt', '1', '-cpu-used', '2',
    '-af', 'volume=-3dB', '-c:a', 'libopus', '-b:a', '48k', '-ac', '1', webm]);
  for (const file of [mp4, webm]) if (statSync(file).size > LIMIT) throw Error(`${file}: ${statSync(file).size}B > 2.5MB`);
  const still = join(renders, `stage-${f.id}-poster.png`);
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-ss', String(DURATION - .1), '-i', src, '-frames:v', '1', '-vf', 'scale=1280:720:flags=lanczos', still]);
  await sharp(still).webp({ quality: 84 }).toFile(join(out, `stage-${f.id}.webp`));
  console.log(`stage-${f.id}: mp4 ${statSync(mp4).size}B, webm ${statSync(webm).size}B, ${probe(mp4).toFixed(2)}s`);
}
