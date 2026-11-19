import test from 'node:test';
import assert from 'node:assert/strict';
import { freshState, restore } from '../src/state.js';
import { createSound, mapCues, stepCue } from '../src/sound.js';

// 소리 3차(2026-11-20): 목소리 스위치와 효과음 크기. 3차 전 저장은 목소리 = 그때의 효과음 스위치로 이어받는다.
test('3차 전 저장: 목소리는 효과음 스위치 값을, 효과음 크기는 100%를 이어받는다', () => {
  for (const [sfx, voice] of [[false, false], [true, true], [undefined, true]]) {
    const raw = freshState(); delete raw.settings.voice; delete raw.settings.sfxVolume;
    if (sfx === undefined) delete raw.settings.sfx; else raw.settings.sfx = sfx;
    const s = restore(JSON.parse(JSON.stringify(raw)));
    assert.equal(s.settings.voice, voice, 'sfx ' + sfx);
    assert.equal(s.settings.sfx, sfx ?? true);
    assert.equal(s.settings.sfxVolume, 100);
  }
  const raw = freshState(); Object.assign(raw.settings, { sfx: false, voice: true, sfxVolume: 37 });
  const s = restore(JSON.parse(JSON.stringify(raw)));
  assert.equal(s.settings.voice, true, '저장된 목소리 값은 그대로');
  assert.equal(s.settings.sfxVolume, 35, '5% 단위');
  raw.settings.sfxVolume = 400; assert.equal(restore(JSON.parse(JSON.stringify(raw))).settings.sfxVolume, 100);
});

function fakeAudio() {
  const gains = [], param = () => ({ value: 1, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} });
  globalThis.AudioContext = class {
    constructor() { this.state = 'running'; this.currentTime = 0; this.destination = {}; }
    createGain() { const g = { gain: param(), connect() {}, disconnect() {} }; gains.push(g); return g; }
    createOscillator() { return { frequency: param(), connect() {}, disconnect() {}, start() {}, stop() {} }; }
    createBufferSource() { return { playbackRate: param(), connect() {}, disconnect() {}, start() {}, stop() {} }; }
    decodeAudioData(data, done) { done({ duration: .4 }); }
    resume() { return Promise.resolve(); } suspend() { return Promise.resolve(); } close() { return Promise.resolve(); }
  };
  globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) });
  globalThis.Audio = class { constructor() { this.dataset = {}; this.paused = true; } play() { this.paused = false; return Promise.resolve(); } pause() { this.paused = true; } };
  const doc = new EventTarget(); doc.hidden = false; globalThis.document = doc;
  return gains;
}
const settle = () => new Promise(done => setTimeout(done, 5));

test('효과음 크기는 전투·카드 샘플과 발자국 gain에 곱하고, 값이 없으면 이전과 같은 크기다', async () => {
  for (const [sfxVolume, scale] of [[undefined, 1], [100, 1], [50, .5], [0, 0]]) {
    const gains = fakeAudio();
    const sound = createSound(() => ({ muted: false, sfx: true, bgm: false, bgmVolume: 50, sfxVolume }));
    sound.start(); sound.mapCue('heavy'); await settle(); sound.step(); await settle();
    assert.equal(gains.length, 2, 'heavy + step');
    assert.ok(Math.abs(gains[0].gain.value - mapCues.heavy[1] * scale) < 1e-9, 'heavy ' + sfxVolume);
    assert.ok(Math.abs(gains[1].gain.value - stepCue.gain * scale) < 1e-9, 'step ' + sfxVolume);
    sound.dispose();
  }
  for (const key of ['AudioContext', 'fetch', 'Audio', 'document']) delete globalThis[key];
});

// 1-3: 첫 입력 전에는 재생을 시도하지 않고, 첫 입력 뒤 한 번 낸다. 그 입력이 화면을 바꾸면(stop) 생략한다.
import { createNarration } from '../src/narration.js';
test('첫 입력 전 대사는 거부되지 않게 미뤘다가 첫 입력 뒤 한 번 재생한다', async () => {
  const user = { hasBeenActive: false };
  Object.defineProperty(globalThis.navigator, 'userActivation', { value: user, configurable: true });
  try {
    const doc = new EventTarget(), page = new EventTarget(); doc.hidden = false;
    const audios = [];
    class FakeAudio extends EventTarget { play() { this.playing = true; return Promise.resolve(); } pause() { this.playing = false; } removeAttribute() {} load() {} }
    const player = createNarration({ doc, page, isMuted: () => false, makeAudio: () => { const a = new FakeAudio(); audios.push(a); return a; } });
    assert.equal(await player.play('report'), false);
    assert.equal(audios.length, 0, '입력 전에는 재생 시도 없음');
    assert.equal(player.state.status, 'idle', '오류로 소모하지 않음');
    doc.dispatchEvent(new Event('keydown')); await settle();
    assert.equal(audios.length, 0, '재생 허락이 없는 입력(Esc 등)은 넘긴다');
    user.hasBeenActive = true; doc.dispatchEvent(new Event('pointerup')); await settle();
    assert.equal(audios.length, 1); assert.equal(audios[0].playing, true); assert.equal(player.state.id, 'report');
    doc.dispatchEvent(new Event('pointerup')); await settle();
    assert.equal(audios.length, 1, '한 번만');
    // 입력이 화면을 바꾸면(대사 멈춤) 생략한다.
    user.hasBeenActive = false; await player.play('map-1'); player.stop();
    user.hasBeenActive = true; doc.dispatchEvent(new Event('pointerup')); await settle();
    assert.equal(audios.length, 1, '화면이 바뀐 입력 뒤에는 내지 않음');
    player.dispose();
  } finally { delete globalThis.navigator.userActivation; }
});
