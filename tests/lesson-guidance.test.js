import test from 'node:test';
import assert from 'node:assert/strict';
import { freshState } from '../src/state.js';
import { getLearningGuide } from '../src/progression.js';
import { pageConcepts, standards } from '../src/curriculum.js';
import { hints } from '../src/companion.js';
import { voiceLines } from '../src/voice-lines.js';

test('모든 학습 화면은 성취기준·핵심 개념·구체적인 다음 조작으로 연결된다', () => {
  for (const [scene, page] of Object.entries(pageConcepts)) {
    const state = freshState();
    state.scene = scene;
    assert.ok(standards.some(([code]) => code === page.standard));
    assert.ok(page.concept.length > 12);
    const before = structuredClone(state);
    const guide = getLearningGuide(state, { round: 0, body: 0 });
    assert.ok(guide.target && guide.text.length > 6, scene);
    assert.deepEqual(state, before);
  }
  assert.equal(Object.keys(pageConcepts).length, 10);
});

test('날짜 선택 후 기록 버튼을 안내하고, 저장 뒤에는 다음 미관찰 날짜로 안내한다', () => {
  const state = freshState();
  state.scene = 's2a';
  state.drafts.phases.day = 3;
  assert.equal(getLearningGuide(state, { round: 0 }).target, '#capture-phase');
  assert.match(getLearningGuide(state, { round: 0 }).text, /이 모습 기록/);
  state.drafts.phases.captures = [3];
  assert.equal(getLearningGuide(state, { round: 0 }).target, '[data-learning="seek-day-7"]');
  assert.ok(hints(state).some(text => text.includes('이 모습 기록')));
  assert.ok(hints(state).every(text => !text.includes('바로 담겨') && !text.includes('함께 해요')));
});

test('본 천체를 반복해서 빛 가리기로 안내하지 않고 아직 안 본 자료를 안내한다', () => {
  const state = freshState();
  state.scene = 's4a';
  state.drafts.classification.viewed = ['sun'];
  assert.equal(getLearningGuide(state, { round: 0, inspectedBody: 'sun' }).target, '[data-learning="body-sirius"]');
});

test('저장한 별 패턴에서 선을 되돌리면 필요한 연결을 다시 안내한다', () => {
  const state = freshState();
  state.scene = 's5b';
  state.drafts.pattern.cases.cassiopeia.original = [['Caph', 'Schedar'], ['Schedar', 'Cih']];
  assert.equal(getLearningGuide(state, { round: 0 }).target, '#star-view');
});

test('10개 활동 힌트의 표시 문구와 연결 음성 문구가 일치한다', () => {
  for (const scene of Object.keys(pageConcepts)) {
    const state = freshState();
    state.scene = scene;
    const line = voiceLines.find(item => item.id === `hint-${scene}`);
    assert.ok(hints(state).includes(line.text), scene);
  }
});
