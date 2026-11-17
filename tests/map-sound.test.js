import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { mapCues, mapCueName } from '../src/sound.js';

test('map encounter kinds map to their cues; hit 2 uses its own take', () => {
  assert.equal(mapCueName('swing', 1), 'swing');
  assert.equal(mapCueName('hit', 1), 'hit1');
  assert.equal(mapCueName('hit', 2), 'hit2');
  for (const kind of ['heavy', 'exit', 'appear', 'contact', 'victory']) assert.equal(mapCueName(kind, 3), kind);
  assert.equal(mapCueName('finish', 3), null);
});

test('every map cue file is shipped and credited', () => {
  const credits = readFileSync(new URL('../public/assets/CREDITS.md', import.meta.url), 'utf8');
  for (const [name, [file, gain, rate]] of Object.entries(mapCues)) {
    assert.ok(existsSync(new URL('../public/assets/audio/sfx/' + file, import.meta.url)), name + ' file');
    assert.ok(credits.includes('audio/sfx/' + file), name + ' credit');
    assert.ok(gain > 0 && gain <= .6 && rate > .8 && rate <= 1, name + ' level');
  }
});
