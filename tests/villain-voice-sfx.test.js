import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createSound, mapCues } from '../src/sound.js';

const tick = () => new Promise(r => setTimeout(r, 0));

// 별빛 가림이 대사(setDucked)가 지도 전투 효과음을 막지 않는다. 격퇴 차임·카드 효과음은 예외에 넣지 않는다.
test('map combat cues play at their own level while a villain voice ducks', async () => {
  const doc = new EventTarget(); doc.hidden = false; globalThis.document = doc;
  const sources = [];
  globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) });
  const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} });
  globalThis.AudioContext = class {
    constructor() { this.state = 'running'; this.currentTime = 0; this.destination = {}; }
    createGain() { return { gain: param(), connect() {}, disconnect() {} }; }
    createBufferSource() { const s = { playbackRate: { value: 1 }, connect(g) { s.gain = g; }, disconnect() {}, start() { s.started = true; }, stop() { s.stopped = true; } }; sources.push(s); return s; }
    createOscillator() { return { frequency: param(), connect() {}, disconnect() {}, start() {}, stop() {} }; }
    decodeAudioData(data, done) { done({ decoded: true }); }
    suspend() { return Promise.resolve(); } resume() { return Promise.resolve(); } close() { return Promise.resolve(); }
  };
  const settings = { muted: false, sfx: true, bgm: false, bgmVolume: 0 };
  const sound = createSound(() => settings);
  sound.start(); sound.preload(); await tick(); await tick();

  sound.setDucked(true); // villain voice starts
  for (const kind of ['swing', 'hit', 'heavy', 'exit', 'appear', 'contact']) sound.mapCue(kind, 1);
  await tick(); await tick();
  assert.equal(sources.length, 6, 'every combat cue starts under the voice');
  assert(sources.every(s => s.started && !s.stopped && s.gain.gain.value > 0));
  assert.equal(sources[1].gain.gain.value, mapCues.hit1[1], 'not ducked');
  sound.setDucked(true); sound.sync(); // the voice (re)starting does not cut ringing combat cues
  assert(sources.every(s => !s.stopped));

  // The victory chime and the card cues keep the voice rule.
  sound.mapCue('victory', 3); sound.mapCue('cardReveal'); await tick(); await tick();
  assert.equal(sources.length, 6);

  // Mute and the sound-effects switch still stop them.
  settings.sfx = false; sound.sync(); assert(sources.every(s => s.stopped));
  sound.mapCue('hit', 1); await tick(); await tick(); assert.equal(sources.length, 6);
  settings.sfx = true; settings.muted = true; sound.mapCue('hit', 1); await tick(); await tick(); assert.equal(sources.length, 6);
  sound.dispose();
  delete globalThis.AudioContext; delete globalThis.document; delete globalThis.fetch;
});

test('hit and exit lines speak ~300 ms after the combat cue; taunts speak at once', () => {
  const source = readFileSync(new URL('../src/map-encounters.js', import.meta.url), 'utf8');
  assert.match(source, /time\+\(n===HITS\?2750:1800\),300\);/);
  assert.match(source, /if\(voiceDelay\)\(view\?\?globalThis\)\.setTimeout\(/);
  assert.match(source, /speak\(current,message,now\+2200\);/);
});
