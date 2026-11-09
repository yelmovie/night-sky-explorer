// 개념영상은 films/의 HyperFrames 원본에서 만든다(2026-11-09). 예전 SVG→sharp→FFmpeg 렌더러를 대체했다.
// 사용: RENDER_DIR=<외장 SSD 렌더 폴더> npm run concepts:render [-- 번호...]
// 결과: public/assets/concepts/stage-N.{mp4,webm,webp} (같은 경로·파일명). 자세한 흐름은 films/REVIEW.md.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
for (const step of ['../films/build.mjs', '../films/render.mjs'])
  execFileSync(process.execPath, [fileURLToPath(new URL(step, import.meta.url)), ...process.argv.slice(2)], { stdio: 'inherit' });
