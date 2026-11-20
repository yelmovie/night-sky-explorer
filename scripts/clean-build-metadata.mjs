// Remove only generated macOS metadata from this repository's dist directory.
// Source assets and user files outside dist are never visited.
import { readdir, rm, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
const dist = resolve(import.meta.dirname, '../dist');
let removed = 0;
async function clean(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isFile() && (entry.name.startsWith('._') || entry.name === '.DS_Store')) {
      await rm(path); removed++;
    } else if (entry.isDirectory()) await clean(path);
  }
}
await clean(dist);
// Also guard against exFAT sidecars being regenerated after the build.
// The large PNG originals and the Jua font are never requested (the app loads the WebP copies and NanumSquareNeo),
// so they stay out of the upload.
const unusedOriginals = ['assets/observatory.png', 'assets/logo.png', 'assets/rabbit.png', 'assets/fox.png', 'assets/fonts/jua-*.woff2',
  // 앱이 부르지 않는 옛 파일(2026-11-21 D6 전수 검색): 합성음으로 바뀐 .ogg 효과음, 예전 환영 음성, 다시 녹음 전 힌트 음성,
  // v4로 바뀐 달 표면, -redraw로 바뀐 지도 인물 그림. 이름을 조합해 쓰는 경로(stage-N, card-·thumb-, badge-, 행성 id)는 넣지 않았다.
  'assets/audio/*.ogg', 'assets/audio/npc-welcome.m4a', 'assets/audio/voices/hint-s1a-v2.mp3', 'assets/audio/voices/hint-s2a-v2.mp3', 'assets/audio/voices/hint-s2a-v3.mp3',
  'assets/generated/moon-surface-v3.webp', 'assets/map-encounters/ally.png', 'assets/map-encounters/hero.png', 'assets/map-encounters/villain-left.png'];
await writeFile(join(dist, '.assetsignore'), ['**/._*', '**/.DS_Store', ...unusedOriginals].join('\n') + '\n');
console.log(`Build metadata: ${removed} generated sidecars removed; deployment exclusions written.`);
