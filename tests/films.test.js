import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { films, filmMarkup } from '../src/films.js';
import { freshState, restore } from '../src/state.js';
import { voiceLines } from '../src/voice-lines.js';

const cues = part => JSON.parse(readFileSync(new URL(`../docs/films-20261121/burn-${part}.json`, import.meta.url), 'utf8')).cues;
const plain = text => text.replace(/[[\]]/g, '');

test('영상 속 자막 글은 대사 글과 글자 그대로 같고, 읽기용 대사 목록과도 같다', () => {
  const plan = JSON.parse(readFileSync(new URL('../docs/films-20261121/voice-plan.json', import.meta.url), 'utf8'));
  const spoken = { intro: plan.map(line => line.text), final: ['movie-2', 'movie-4', 'ending'].map(id => voiceLines.find(line => line.id === id).text) };
  for (const part of ['intro', 'final']) {
    assert.deepEqual(cues(part).map(cue => plain(cue.text)), spoken[part], part);
    assert.deepEqual(films[part].transcript.map(line => line.split(': ').slice(1).join(': ')), spoken[part], part + ' transcript');
    assert.deepEqual(films[part].transcript.map(line => line.split(': ')[0]), cues(part).map(cue => cue.who), part + ' speakers');
  }
});

test('자막은 서로 겹치지 않고 키워드 강조가 줄마다 있다', () => {
  for (const part of ['intro', 'final']) {
    const list = cues(part);
    list.forEach((cue, i) => { assert.ok(cue.s < cue.e); assert.ok(/\[[^\]]+\]/.test(cue.text), cue.text); if (i) assert.ok(list[i - 1].e <= cue.s, `${part} ${i}`); });
  }
});

test('인트로는 처음 한 번만: 새 기록은 introFilm=false, 옛 저장도 false로 읽힌다', () => {
  assert.equal(freshState().introFilm, false);
  const old = JSON.parse(JSON.stringify({ ...freshState(), version: 2 })); delete old.introFilm;
  assert.equal(restore(old).introFilm, false);
  const seen = JSON.parse(JSON.stringify({ ...freshState(), version: 2, introFilm: true }));
  assert.equal(restore(seen).introFilm, true);
});

test('영상 창은 포스터·두 형식·읽기용 대사를 갖고, 파일은 각각 2MiB 아래', () => {
  for (const part of ['intro', 'final']) {
    const html = filmMarkup(part);
    for (const piece of [`/assets/films/${part}.webp`, `/assets/films/${part}.webm`, `/assets/films/${part}.mp4`, 'film-transcript', 'playsinline']) assert.ok(html.includes(piece), piece);
    for (const ext of ['webm', 'mp4']) assert.ok(statSync(new URL(`../public/assets/films/${part}.${ext}`, import.meta.url)).size < 2 * 1024 * 1024);
  }
});
