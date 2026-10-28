import test from 'node:test';
import assert from 'node:assert/strict';
import { freshState, firstReady, stageReady } from '../src/state.js';
import { bodies, patternRegions, planets, solarOrder } from '../src/data.js';
import { getStageAction } from '../src/progression.js';

const comparison = () => ({ spots: [{ x: 25, y: 25 }, { x: 70, y: 35 }], observation: '밝은 곳과 어두운 곳이 보여요.' });
const prediction = () => ({ amount: 40, side: 'right', original: { amount: 40, side: 'right' }, revealed: true, overlay: true, reflection: '밝은 부분이 달라졌어요.' });

test('완료한 비교 카드에서 아직 쓰지 않은 카드로 안내하고 학습 기록은 변경하지 않는다', () => {
  const state = freshState();
  state.scene = 's1b';
  assert.equal(getStageAction(state, 0).disabled, true);
  state.drafts.moon.comparisons[0] = comparison();
  const before = structuredClone(state);
  assert.deepEqual(getStageAction(state, 0), { label: '다음 비교 카드로', action: 'activity-round-1', disabled: false, round: 1 });
  assert.equal(getStageAction(state, 1).disabled, true);
  assert.deepEqual(state, before);
  assert.equal(stageReady(state, 1), false);
});

test('두 번째 활동부터 해도 미완료 첫 활동으로 안내한다', () => {
  const state = freshState();
  state.scene = 's2b';
  state.drafts.phases.predictions[24] = prediction();
  assert.equal(getStageAction(state, 1).round, 0);
  state.drafts.phases.predictions[24].overlay = false;
  assert.equal(getStageAction(state, 1).disabled, true);
  state.drafts.phases.predictions[24] = prediction();
  state.drafts.phases.predictions[14] = prediction();
  // 비교 두 개만으로 앞 단계의 여섯 관찰 기록을 생략할 수 없다.
  assert.equal(getStageAction(state, 1).disabled, true);
  state.drafts.phases.captures = [3, 7, 10, 17, 21, 25];
  assert.equal(getStageAction(state, 1).action, 'complete');
  assert.equal(getStageAction(state, 1).disabled, false);
});

test('행성 순서와 묶기 사이를 안내하되 전체 조건이 맞아야 완료된다', () => {
  const state = freshState();
  state.scene = 's3b';
  state.drafts.planets.order = [...solarOrder];
  assert.equal(getStageAction(state, 0).round, 1);
  state.drafts.planets.groups = Object.fromEntries(planets.map(planet => [planet.id, planet.group]));
  assert.equal(getStageAction(state, 0).disabled, true);
  for (const planet of planets) state.drafts.planets.records[planet.id] = { feature: planet.feature, candidate: planet.id };
  assert.equal(getStageAction(state, 0).action, 'complete');
  assert.equal(getStageAction(state, 0).disabled, false);
  state.drafts.planets.order[1] = 'venus';
  assert.equal(getStageAction(state, 1).round, 0);
});

test('천체 자료 네 개를 읽으면 다른 하늘로, 여덟 개를 읽으면 다음 활동으로 안내한다', () => {
  const state = freshState();
  state.scene = 's4a';
  state.drafts.classification.viewed = bodies.slice(4).map(body => body.id);
  assert.equal(getStageAction(state, 1).round, 0);
  state.drafts.classification.viewed = bodies.map(body => body.id);
  assert.equal(getStageAction(state, 1).action, 'next');
  assert.equal(getStageAction(state, 1).disabled, false);
});

test('별 관찰은 세 별에서 구역 이동을 권하지만 기존 두 별과 네 별 완료도 유지한다', () => {
  const state = freshState();
  state.scene = 's5a';
  state.drafts.pattern.observed = patternRegions.cassiopeia.stars.slice(0, 3);
  assert.equal(getStageAction(state, 0).round, 1);
  state.drafts.pattern.observed = [...patternRegions.cassiopeia.stars.slice(0, 2), ...patternRegions.dipper.stars.slice(0, 4)];
  assert.equal(firstReady(state, 5), true);
  assert.equal(getStageAction(state, 1).action, 'next');
  assert.equal(getStageAction(state, 1).disabled, false);
});

test('별 패턴은 원래 선, 현재 선, 비교와 설명을 모두 마쳐야 다른 패턴을 안내한다', () => {
  const state = freshState();
  state.scene = 's5b';
  const stars = patternRegions.cassiopeia.stars, lines = [[stars[0], stars[1]], [stars[1], stars[2]]];
  state.drafts.pattern.cases.cassiopeia = { lines, original: structuredClone(lines), compared: true, reflection: '기준과 연결 모양이 달라요.' };
  assert.equal(getStageAction(state, 0).round, 1);
  state.drafts.pattern.cases.cassiopeia.lines = [lines[0], [...lines[0]].reverse()];
  assert.equal(getStageAction(state, 0).disabled, true);
});

test('교사 해금은 미완료 활동의 완료 버튼을 열지 않는다', () => {
  const state = freshState();
  state.settings.adminUnlock = true;
  for (const scene of ['s1a', 's1b', 's2a', 's2b', 's3a', 's3b', 's4a', 's4b', 's5a', 's5b']) {
    state.scene = scene;
    assert.equal(getStageAction(state, 0).disabled, true, scene);
  }
  state.scene = 'map';
  assert.equal(getStageAction(state), null);
});
