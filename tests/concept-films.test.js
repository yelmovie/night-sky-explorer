import test from 'node:test';
import assert from 'node:assert/strict';
import { concepts } from '../src/concepts.js';
import { films, CUES, DURATION } from '../films/films.data.mjs';
import { phase } from '../src/drawing.js';

test('앱 자막·장면 버튼 시각이 개념영상 장면 경계와 같다', () => {
  assert.deepEqual(Object.keys(concepts).map(Number), films.map(f => f.id));
  for (const f of films) {
    const clip = concepts[f.id];
    assert.equal(clip.seconds, DURATION, `stage-${f.id} 길이`);
    assert.deepEqual(clip.cues.map(([at]) => at), CUES, `stage-${f.id} 시각`);
    assert.deepEqual(clip.cues.map(([, text]) => text), f.captions, `stage-${f.id} 자막`);
    assert.deepEqual(clip.steps, f.steps, `stage-${f.id} 장면 버튼`);
    assert.equal(clip.title, f.title);
    assert.equal(clip.steps.length, clip.cues.length);
  }
});

test('달 영상의 날짜별 모양은 북반구 관찰 순서(차오를 때 오른쪽, 줄어들 때 왼쪽)를 따른다', () => {
  const days = [3, 7, 15, 22, 27].map(phase);
  assert.deepEqual([days[0], days[1], days[3], days[4]].map(d => d.side), ['right', 'right', 'left', 'left']);
  assert.ok(days[0].amount < days[1].amount && days[1].amount < days[2].amount, '보름달까지 밝은 부분이 커진다');
  assert.ok(days[2].amount > 99, '15일째는 보름달');
  assert.ok(days[3].amount > days[4].amount, '보름달 뒤 밝은 부분이 작아진다');
});
