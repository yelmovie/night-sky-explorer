import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createSound, stepCue } from '../src/sound.js';

// 소리 갈래: UI 합성음은 앞 UI 소리만 끊고, 지도 전투·카드 샘플과 발자국은 끝까지 울린다.
function fakeAudio() {
  const sources = [], param = () => ({ value: 1, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} });
  globalThis.AudioContext = class {
    constructor() { this.state = 'running'; this.currentTime = 0; this.destination = {}; }
    createGain() { return { gain: param(), connect() {}, disconnect() {} }; }
    createOscillator() { return { frequency: param(), connect() {}, disconnect() {}, start() {}, stop() { this.stopped = true; } }; }
    createBufferSource() { const s = { playbackRate: param(), connect() {}, disconnect() {}, start() { this.started = true; }, stop() { this.stopped = true; } }; sources.push(s); return s; }
    decodeAudioData(data, done) { done({ duration: .4 }); }
    resume() { this.state = 'running'; return Promise.resolve(); } suspend() { return Promise.resolve(); } close() { return Promise.resolve(); }
  };
  globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) });
  globalThis.Audio = class { constructor() { this.dataset = {}; this.paused = true; } play() { this.paused = false; return Promise.resolve(); } pause() { this.paused = true; } };
  const doc = new EventTarget(); doc.hidden = false; globalThis.document = doc;
  return sources;
}
function cleanupAudio() { for (const key of ['AudioContext', 'fetch', 'Audio', 'document']) delete globalThis[key]; }
const settle = () => new Promise(done => setTimeout(done, 5));

test('a UI tap does not cut battle, card or footstep samples', async () => {
  const sources = fakeAudio();
  const settings = { muted: false, sfx: true, bgm: false, bgmVolume: 50 };
  const sound = createSound(() => settings);
  sound.start();
  sound.mapCue('heavy'); sound.mapCue('cardComplete'); sound.step();
  await settle();
  assert.equal(sources.length, 3);
  sound.play('click'); sound.play('success'); sound.tap();
  assert.ok(sources.every(source => source.started && !source.stopped), 'samples ring on after UI sounds');
  // 효과음을 끄면 카드 소리와 발자국은 멈춘다.
  settings.sfx = false; sound.sync();
  assert.ok(sources.every(source => source.stopped));
  sound.dispose(); cleanupAudio();
});

test('footsteps alternate files, stay inside ±6 % of the night-sky rate and follow the effects switch', async () => {
  const sources = fakeAudio();
  const settings = { muted: false, sfx: true, bgm: false, bgmVolume: 50 };
  const sound = createSound(() => settings);
  sound.start();
  for (let i = 0; i < 6; i++) { sound.step(); await settle(); }
  assert.equal(sources.length, 6);
  for (const source of sources) {
    const rate = source.playbackRate.value;
    assert.ok(rate >= stepCue.rate * .94 - 1e-9 && rate <= stepCue.rate * 1.06 + 1e-9, 'rate ' + rate);
  }
  assert.ok(stepCue.gain >= .12 && stepCue.gain <= .18);
  settings.sfx = false; sound.step(); await settle();
  assert.equal(sources.length, 6, 'no footstep with effects off');
  settings.sfx = true; settings.muted = true; sound.step(); await settle();
  assert.equal(sources.length, 6, 'no footstep when muted');
  sound.dispose(); cleanupAudio();
});

test('the stage-open sound is an unlock and a sparkle 0.12 s later', async () => {
  const sources = fakeAudio();
  const sound = createSound(() => ({ muted: false, sfx: true, bgm: false, bgmVolume: 50 }));
  sound.start();
  sound.stageOpen(); await settle();
  assert.equal(sources.length, 1);
  await new Promise(done => setTimeout(done, 160));
  assert.equal(sources.length, 2);
  sound.dispose(); cleanupAudio();
});

test('footstep files are shipped and credited', () => {
  const credits = readFileSync(new URL('../public/assets/CREDITS.md', import.meta.url), 'utf8');
  for (const file of stepCue.files) {
    assert.ok(existsSync(new URL('../public/assets/audio/sfx/' + file, import.meta.url)), file);
    assert.ok(credits.includes('audio/sfx/' + file), file + ' credit');
  }
});

test('a completion tone is not cut when the next voice ducks the music', async () => {
  fakeAudio();
  const oscillators = [];
  const Base = globalThis.AudioContext;
  globalThis.AudioContext = class extends Base { createOscillator() { const o = super.createOscillator(); o.disconnect = () => { o.cut = true; }; oscillators.push(o); return o; } };
  const settings = { muted: false, sfx: true, bgm: false, bgmVolume: 50 };
  const sound = createSound(() => settings);
  sound.start(); sound.play('success');
  assert.ok(oscillators.length > 0);
  sound.setDucked(true);
  assert.ok(oscillators.every(o => !o.cut), 'the success tone rings on under the voice'); // stop(t) at creation only schedules its natural end
  settings.muted = true; sound.sync();
  assert.ok(oscillators.every(o => o.cut), 'mute still stops it');
  sound.dispose(); cleanupAudio();
});

test('the finale theme rises from 0 while the card set jingle still rings, and the jingle is not cut', async t => {
  const sources = fakeAudio();
  const players = [];
  globalThis.Audio = class { constructor(src) { this.src = src; this.dataset = {}; this.paused = true; this.volume = 1; players.push(this); } play() { this.paused = false; return Promise.resolve(); } pause() { this.paused = true; } };
  const sound = createSound(() => ({ muted: false, sfx: true, bgm: true, bgmVolume: 50 }));
  sound.start();
  sound.mapCue('cardComplete'); await settle();
  t.mock.timers.enable({ apis: ['setInterval'] });
  sound.setMusic('finale');
  const finale = players.at(-1);
  assert.match(finale.src, /final-theme/); assert.equal(finale.volume, 0);
  t.mock.timers.tick(600); assert.ok(finale.volume > .2 && finale.volume < .4);
  t.mock.timers.tick(600); assert.equal(+finale.volume.toFixed(4), .6);
  assert.ok(sources.every(source => !source.stopped), 'jingle rings on');
  sound.dispose(); cleanupAudio();
});
