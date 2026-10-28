import test from 'node:test';
import assert from 'node:assert/strict';
import { freshState, firstReady, stageReady } from '../src/state.js';
import { bodies, planets, requiredPlanets, solarOrder, patternRegions } from '../src/data.js';
import { recordPhase, recordPlanet, nextPlanet, classificationFeedback, nextBody, solarFeedback, connectStars } from '../src/learning-flow.js';

const matchingAnswer = body => ({ kind: body.kind, reason: body.evidence });
const view = () => ({ rotation: 30, zoom: 1.5 });

function investigate(draft, id) {
  const planet = planets.find(item => item.id === id);
  draft.selected = id;
  return recordPlanet(draft, planet.feature, view(), 'illustration');
}

test('날짜 바로가기는 한 번만 기록하고 유효하지 않은 입력은 현재 날짜도 바꾸지 않는다', () => {
  const state = freshState(), phases = state.drafts.phases;
  for (const day of [0, 3, 7, 10, 14, 29]) assert.equal(recordPhase(phases, day), true);
  assert.equal(firstReady(state, 2), true);
  assert.equal(recordPhase(phases, 3), false);
  assert.equal(phases.day, 3, '이미 기록한 날짜도 다시 관찰할 수 있다');
  assert.equal(phases.captures.length, 6);
  const before = structuredClone(phases);
  for (const day of [-1, 30, 3.5, NaN, Infinity, '7', null]) assert.equal(recordPhase(phases, day), false);
  assert.deepEqual(phases, before);
  assert.equal(stageReady(state, 2), false, '날짜 수집만으로 예상·비교 활동을 완료하지 않는다');
});

test('빠른 날짜 기록도 전반과 후반을 모두 관찰해야 준비된다', () => {
  const state = freshState();
  for (const day of [1, 2, 3, 4, 5, 6]) recordPhase(state.drafts.phases, day);
  assert.equal(firstReady(state, 2), false);
  recordPhase(state.drafts.phases, 20);
  assert.equal(firstReady(state, 2), true);
});

test('행성 특징은 맞을 때만 기록하고 재탐색 오답이 저장된 근거를 지우지 않는다', () => {
  const state = freshState(), draft = state.drafts.planets;
  const mars = planets.find(planet => planet.id === 'mars');
  const camera = view();
  assert.equal(recordPlanet(draft, '고른 특징이 맞지 않음', camera, '3d'), false);
  assert.deepEqual(draft.records, {});
  assert.equal(recordPlanet(draft, mars.feature, camera, '3d'), true);
  const stored = structuredClone(draft.records.mars);
  camera.rotation = 180; camera.zoom = 2;
  assert.deepEqual(draft.records.mars.view, { rotation: 30, zoom: 1.5 }, '관찰 당시 시점을 별도로 보존한다');
  assert.equal(draft.records.mars.candidate, 'mars');
  assert.equal(draft.records.mars.mode, '3d');
  assert.equal(recordPlanet(draft, planets[0].feature, camera, 'illustration'), false);
  assert.deepEqual(draft.records.mars, stored);
  assert.equal(firstReady(state, 3), false);
});

test('자동 행성 탐색은 미완료 필수 조사를 찾고 선택 조사 둘을 강제하지 않는다', () => {
  const state = freshState(), draft = state.drafts.planets;
  investigate(draft, 'uranus'); investigate(draft, 'neptune');
  assert.equal(nextPlanet(draft), requiredPlanets[0]);
  assert.equal(firstReady(state, 3), false);
  for (const id of requiredPlanets) {
    assert.equal(nextPlanet(draft), id);
    investigate(draft, id);
  }
  delete draft.records.uranus; delete draft.records.neptune;
  assert.equal(nextPlanet(draft), undefined);
  assert.equal(firstReady(state, 3), true);
  assert.equal(stageReady(state, 3), false, '조사 완료와 태양계 모형 완료는 분리한다');
  draft.records.earth.candidate = 'mars';
  assert.equal(nextPlanet(draft), 'earth');
  assert.equal(firstReady(state, 3), false);
});

test('이름표와 근거를 모두 연결해야 자동 판별이 성공한다', () => {
  for (const body of bodies) {
    const wrongKind = body.kind === 'star' ? 'planet' : 'star';
    for (const answer of [{}, { kind: body.kind }, { reason: body.evidence }, { kind: wrongKind, reason: body.evidence }, { kind: body.kind, reason: 'bright' }, { kind: body.kind, reason: 'color' }]) {
      const before = structuredClone(answer);
      assert.equal(classificationFeedback(body, answer).correct, false);
      assert.equal(classificationFeedback(body, answer).tone, 'hint');
      assert.deepEqual(answer, before, '오답을 덮어쓰지 않아 수정할 수 있다');
    }
    assert.equal(classificationFeedback(body, matchingAnswer(body)).correct, true);
    assert.equal(classificationFeedback(body, matchingAnswer(body)).tone, 'success');
  }
});

test('천체 자동 탐색은 맞힌 항목을 건너뛰고 다른 묶음과 앞쪽 미완료도 찾는다', () => {
  const state = freshState(), draft = state.drafts.classification;
  draft.answers = Object.fromEntries(bodies.map(body => [body.id, matchingAnswer(body)]));
  draft.viewed = bodies.map(body => body.id);
  assert.equal(nextBody(draft.answers, bodies[3].id), -1);
  assert.equal(stageReady(state, 4), true);
  draft.answers[bodies[5].id].reason = 'bright';
  assert.equal(nextBody(draft.answers, bodies[3].id), 5);
  assert.equal(stageReady(state, 4), false);
  draft.answers[bodies[5].id] = matchingAnswer(bodies[5]);
  delete draft.answers[bodies[0].id];
  assert.equal(nextBody(draft.answers, bodies[7].id), 0);
  assert.equal(nextBody(draft.answers, bodies[0].id), 0, '다른 항목이 모두 끝나도 현재 오답을 완료 처리하지 않는다');
  draft.answers[bodies[0].id] = matchingAnswer(bodies[0]);
  draft.viewed.pop();
  assert.equal(nextBody(draft.answers, bodies[0].id), -1);
  assert.equal(stageReady(state, 4), false, '판별 정답만으로 읽지 않은 자료를 대신하지 않는다');
});

test('배치 즉시 피드백은 순서와 묶기의 실제 정답 수를 따로 반영한다', () => {
  const state = freshState(), draft = state.drafts.planets;
  for (const id of requiredPlanets) investigate(draft, id);
  assert.equal(solarFeedback(draft, 0).tone, 'hint');
  assert.match(solarFeedback(draft, 0).text, /0\/9/);
  draft.order[0] = 'sun';
  assert.equal(solarFeedback(draft, 0).tone, 'success');
  assert.match(solarFeedback(draft, 0).text, /1\/9/);
  draft.order[1] = 'neptune';
  assert.equal(solarFeedback(draft, 0).tone, 'hint');
  assert.match(solarFeedback(draft, 0).text, /1\/9/);
  draft.order = [...solarOrder];
  assert.equal(solarFeedback(draft, 0).tone, 'success');
  assert.equal(stageReady(state, 3), false);
  assert.match(solarFeedback(draft, 1).text, /0\/8/);
  draft.groups = Object.fromEntries(planets.map(planet => [planet.id, planet.group]));
  assert.equal(solarFeedback(draft, 1).tone, 'success');
  assert.equal(stageReady(state, 3), true);
  draft.groups.earth = 'gas';
  assert.equal(solarFeedback(draft, 1).tone, 'hint');
  assert.match(solarFeedback(draft, 1).text, /7\/8/);
  assert.equal(stageReady(state, 3), false);
});

test('연속 별 연결은 끝점을 이어 쓰되 자기 연결과 역방향 중복은 선 수에 넣지 않는다', () => {
  const state = freshState(), draft = state.drafts.pattern;
  draft.observed = Object.values(patternRegions).flatMap(region => region.stars.slice(0, 3));
  assert.equal(firstReady(state, 5), true);
  for (const [id, region] of Object.entries(patternRegions)) {
    const pattern = draft.cases[id], [a, b, c] = region.stars;
    assert.equal(connectStars(pattern, null, a), false);
    assert.equal(connectStars(pattern, a, a), false);
    assert.equal(connectStars(pattern, a, b), true);
    assert.equal(connectStars(pattern, a, b), false);
    assert.equal(connectStars(pattern, b, a), false);
    assert.equal(connectStars(pattern, b, c), true);
    assert.deepEqual(pattern.lines, [[a, b], [b, c]]);
    pattern.original = structuredClone(pattern.lines);
    pattern.compared = true;
    pattern.reflection = '내 선과 기준선은 모양이 달라도 별의 위치는 같아요.';
  }
  assert.equal(stageReady(state, 5), true);
  draft.cases.dipper.original = null;
  assert.equal(stageReady(state, 5), false, '연결만으로 최초 패턴 저장을 대신하지 않는다');
});
