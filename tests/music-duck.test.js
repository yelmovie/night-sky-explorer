import test from 'node:test';
import assert from 'node:assert/strict';
import { createSound } from '../src/sound.js';

// 배경음 줄임은 이유별 이름표로 모은다. 개념영상이 열려 있는 동안 자막 음성이 한 줄 끝나도 줄인 채로 남는다.
test('background music stays ducked until every reason is released', t => {
  // 줄임·되돌림은 0.2초(25ms × 8)에 걸쳐 바뀐다. 가짜 시계로 끝까지 돌린 뒤 크기를 본다.
  t.mock.timers.enable({ apis: ['setInterval'] });
  const doc = new EventTarget(); doc.hidden = false; globalThis.document = doc;
  const players = [];
  globalThis.Audio = class { constructor(src) { this.src = src; this.dataset = {}; this.paused = true; this.volume = 1; players.push(this); } play() { this.paused = false; return Promise.resolve(); } pause() { this.paused = true; } };
  const settings = { muted: false, sfx: true, bgm: true, bgmVolume: 50 };
  const sound = createSound(() => settings);
  sound.start();
  const music = players[0], normal = .6, low = normal * .25;
  const level = () => { t.mock.timers.tick(200); return +music.volume.toFixed(4); };
  assert.equal(level(), normal); assert.equal(music.paused, false);

  // 일반 대사: 시작하면 줄이고 끝나면 되돌린다.
  sound.setDucked(true); assert.equal(level(), low);
  sound.setDucked(false); assert.equal(level(), normal);

  // 개념영상: 자막 음성이 줄마다 시작·끝나도 영상을 닫을 때까지 줄인 크기다.
  sound.setDucked(true, 'concept'); assert.equal(level(), low);
  for (let line = 0; line < 4; line++) {
    sound.setDucked(false); sound.setDucked(true); assert.equal(level(), low);
    sound.setDucked(false); assert.equal(level(), low, 'a finished caption voice keeps the film duck');
  }
  sound.setDucked(false, 'concept'); assert.equal(level(), normal);

  // 환영 음성과 대사도 서로의 줄임을 풀지 않고, 같은 이름표를 두 번 빼도 엇갈리지 않는다.
  sound.setDucked(true, 'welcome'); sound.setDucked(false); assert.equal(level(), low);
  sound.setDucked(false, 'welcome'); sound.setDucked(false, 'welcome'); assert.equal(level(), normal);
  assert.equal(music.paused, false, 'ducking never pauses the music');
  assert.equal(players.length, 1);
  sound.dispose();
  delete globalThis.Audio; delete globalThis.document;
});

test('ducking glides over 0.2 s instead of jumping', t => {
  t.mock.timers.enable({ apis: ['setInterval'] });
  const doc = new EventTarget(); doc.hidden = false; globalThis.document = doc;
  const players = [];
  globalThis.Audio = class { constructor(src) { this.src = src; this.dataset = {}; this.paused = true; this.volume = 1; players.push(this); } play() { this.paused = false; return Promise.resolve(); } pause() { this.paused = true; } };
  const settings = { muted: false, sfx: true, bgm: true, bgmVolume: 50 };
  const sound = createSound(() => settings);
  sound.start();
  const music = players[0];
  sound.setDucked(true);
  assert.equal(music.volume, .6, 'nothing changes in the same instant');
  t.mock.timers.tick(100); assert.ok(music.volume < .6 && music.volume > .15, 'halfway down after 0.1 s');
  t.mock.timers.tick(100); assert.equal(+music.volume.toFixed(4), .15);
  sound.dispose();
  delete globalThis.Audio; delete globalThis.document;
});

test('when the finale theme ends on a finale screen, the main theme carries on at 0.45 and returns to full on leaving', t => {
  t.mock.timers.enable({ apis: ['setInterval'] });
  const doc = new EventTarget(); doc.hidden = false; globalThis.document = doc;
  const players = [];
  globalThis.Audio = class { constructor(src) { this.src = src; this.dataset = {}; this.paused = true; this.volume = 1; players.push(this); } play() { this.paused = false; return Promise.resolve(); } pause() { this.paused = true; } };
  const settings = { muted: false, sfx: true, bgm: true, bgmVolume: 50 };
  const sound = createSound(() => settings);
  sound.start();
  sound.setMusic('finale');
  const finale = players.at(-1);
  assert.match(finale.src, /final-theme/); assert.equal(finale.loop, false); assert.equal(finale.paused, false);
  finale.paused = true; finale.onended();
  const main = players.at(-1);
  assert.match(main.src, /main-theme/); assert.equal(main.loop, true); assert.equal(main.paused, false);
  assert.equal(+main.volume.toFixed(4), +(.6 * .45).toFixed(4), 'low main theme after the finale');
  sound.setMusic('main'); t.mock.timers.tick(200);
  assert.equal(players.at(-1), main, 'the same main theme keeps playing');
  assert.equal(+main.volume.toFixed(4), .6);
  sound.dispose();
  delete globalThis.Audio; delete globalThis.document;
});
