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
const unusedOriginals = ['assets/observatory.png', 'assets/logo.png', 'assets/rabbit.png', 'assets/fox.png', 'assets/fonts/jua-*.woff2'];
await writeFile(join(dist, '.assetsignore'), ['**/._*', '**/.DS_Store', ...unusedOriginals].join('\n') + '\n');
console.log(`Build metadata: ${removed} generated sidecars removed; deployment exclusions written.`);
