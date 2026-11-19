import test from 'node:test';
import assert from 'node:assert/strict';
import { createSound } from '../src/sound.js';

// 배경음 줄임은 이유별 이름표로 모은다. 개념영상이 열려 있는 동안 자막 음성이 한 줄 끝나도 줄인 채로 남는다.
test('background music stays ducked until every reason is released', () => {
  const doc = new EventTarget(); doc.hidden = false; globalThis.document = doc;
  const players = [];
  globalThis.Audio = class { constructor(src) { this.src = src; this.dataset = {}; this.paused = true; this.volume = 1; players.push(this); } play() { this.paused = false; return Promise.resolve(); } pause() { this.paused = true; } };
  const settings = { muted: false, sfx: true, bgm: true, bgmVolume: 50 };
  const sound = createSound(() => settings);
  sound.start();
  const music = players[0], normal = .6, low = normal * .25;
  const level = () => +music.volume.toFixed(4);
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
