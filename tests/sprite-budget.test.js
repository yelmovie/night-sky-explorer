import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
test('home fox is a lightweight crop with unchanged visible pixels and alpha', async () => {
  const source = await readFile(new URL('../public/assets/fox.webp', import.meta.url));
  const output = await readFile(new URL('../public/assets/home-fox.webp', import.meta.url));
  const metadata = await sharp(output).metadata();
  assert.equal(metadata.width, 334);
  assert.equal(metadata.height, 470);
  assert.ok(output.length < source.length / 2);
  const frame = await sharp(source).extract({ left: 0, top: 0, width: 334, height: 470 }).ensureAlpha().raw().toBuffer();
  const pixels = await sharp(output).ensureAlpha().raw().toBuffer();
  assert.equal(pixels.length, frame.length);
  for (let offset = 0; offset < frame.length; offset += 4) {
    assert.equal(pixels[offset + 3], frame[offset + 3]);
    if (frame[offset + 3] > 0) assert.deepEqual(pixels.subarray(offset, offset + 3), frame.subarray(offset, offset + 3));
  }
});

test('rabbit walk atlas keeps sixteen valid alpha frames within the web asset budget',async()=>{
  const image=await readFile(new URL('../public/assets/generated/rabbit-walk.webp',import.meta.url));
  const meta=await sharp(image).metadata();
  const atlas=JSON.parse(await readFile(new URL('../public/assets/generated/sprites.json',import.meta.url),'utf8'))['rabbit-walk'];
  const report=JSON.parse(await readFile(new URL('../docs/reviews/SPRITE-ENCODING-20261110.json',import.meta.url),'utf8'));
  assert.equal(meta.width,1254);assert.equal(meta.height,1254);assert.equal(meta.hasAlpha,true);
  assert.equal(atlas.frames.length,16);assert.ok(image.length<500000);
  for(const f of atlas.frames){assert.ok(f.x>=0&&f.y>=0&&f.x+f.width<=meta.width&&f.y+f.height<=meta.height);assert.equal(f.pivot.length,2);}
  assert.equal(createHash('sha256').update(image).digest('hex'),report.outputSha256);
  assert.equal(report.alphaPixelsChanged,0);assert.equal(report.atlasChanged,false);
});
