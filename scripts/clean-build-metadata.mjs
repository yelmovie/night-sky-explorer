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
await writeFile(join(dist, '.assetsignore'), '**/._*\n**/.DS_Store\n');
console.log(`Build metadata: ${removed} generated sidecars removed; deployment exclusions written.`);
