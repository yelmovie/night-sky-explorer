import test from 'node:test';
import assert from 'node:assert/strict';
import { freshState, firstReady, canAccess, restore, completeStage } from '../src/state.js';
import { patternRegions } from '../src/data.js';
import { getStageAction } from '../src/progression.js';

// 5단원 「북극성 찾기」(2026-11-21 A17): 북두칠성 국자 끝 두 별(메라크 → 두베)을 잇고 그 간격의 약 5배를 늘여 북극성을 찾는다.
const sixStars = () => [...patternRegions.cassiopeia.stars.slice(0, 2), ...patternRegions.dipper.stars.slice(0, 4)];

test('새 기록에는 북극성 찾기 칸이 비어 있다', () => {
  assert.deepEqual(freshState().drafts.pattern.polaris, { pointers: [], found: false });
});

test('별 여섯 개를 관찰해도 북극성을 찾기 전에는 첫 활동이 끝나지 않고, 찾으면 끝난다', () => {
  const s = freshState(); s.scene = 's5a';
  s.drafts.pattern.observed = sixStars();
  assert.equal(firstReady(s, 5), false);
  assert.deepEqual(getStageAction(s, 1), { label: '북극성 찾기로', action: 'activity-round-2', disabled: false, round: 2 });
  s.drafts.pattern.polaris = { pointers: ['Merak', 'Dubhe'], found: true };
  assert.equal(firstReady(s, 5), true);
  assert.equal(getStageAction(s, 2).action, 'next');
  assert.equal(getStageAction(s, 2).disabled, false);
});

test('지금 운영 형식의 옛 저장(북극성 칸 없음)은 그대로 복원되고 빈 북극성 칸이 생긴다', () => {
  const old = freshState(); old.drafts.pattern.observed = sixStars(); delete old.drafts.pattern.polaris; old.scene = 's5a'; old.resume = 's5a'; old.evidence = {};
  const raw = JSON.parse(JSON.stringify({ ...old, version: 2 }));
  const s = restore(raw);
  assert.deepEqual(s.drafts.pattern.observed, sixStars());
  assert.deepEqual(s.drafts.pattern.polaris, { pointers: [], found: false });
});

test('이미 5단원 두 번째 활동을 하던 옛 저장은 막히지 않는다(해금이 줄지 않음)', () => {
  const s = freshState(); s.evidence = { 1: {}, 2: {}, 3: {}, 4: {} };
  s.drafts.pattern.observed = sixStars();
  const stars = patternRegions.cassiopeia.stars, lines = [[stars[0], stars[1]], [stars[1], stars[2]]];
  s.drafts.pattern.cases.cassiopeia = { lines, original: structuredClone(lines), compared: true, showReference: true, reflection: '기준과 연결 모양이 달라요.' };
  assert.equal(firstReady(s, 5), true);
  assert.equal(canAccess(s, 's5b'), true);
});

test('깨진 북극성 값은 빈 화면 없이 안전한 값으로 바뀐다', () => {
  for (const polaris of ['yes', null, { pointers: ['Dubhe', 'Merak'], found: true }, { pointers: ['Merak', 'Nope', 'Dubhe'], found: 'true' }, { pointers: 'Merak', found: 1 }]) {
    const raw = JSON.parse(JSON.stringify({ ...freshState(), version: 2 }));
    raw.drafts.pattern.polaris = polaris;
    const s = restore(raw);
    assert.ok(Array.isArray(s.drafts.pattern.polaris.pointers));
    assert.equal(typeof s.drafts.pattern.polaris.found, 'boolean');
    assert.equal(s.drafts.pattern.polaris.found, false, JSON.stringify(polaris));
  }
  const raw = JSON.parse(JSON.stringify({ ...freshState(), version: 2 }));
  raw.drafts.pattern.polaris = { pointers: ['Merak', 'Dubhe'], found: true };
  assert.deepEqual(restore(raw).drafts.pattern.polaris, { pointers: ['Merak', 'Dubhe'], found: true });
});

test('잠긴 버튼에는 열리는 조건 한 줄이 붙고, 열린 버튼과 s5a에는 붙지 않는다', () => {
  const s = freshState();
  const expect = {
    s1a: '배율을 바꿔 사진 2장을 담으면 열려요.',
    s2a: '보름 전과 보름 뒤 날을 섞어 달을 6번 담으면 열려요.',
    s3a: '여섯 행성의 특징을 모두 찾아 기록하면 열려요.',
    s4a: '여덟 천체를 보고, 예상한 뒤 가림판을 가렸다 치우며 비교하면 열려요.',
    s1b: '비교 카드 두 장에 서로 다른 곳 두 군데를 누르고 문장을 고르면 열려요.',
    s2b: '14일째와 24일째 모두 예상하고, 관측과 비교한 문장을 고르면 열려요.',
    s3b: '행성을 태양에서 가까운 순서대로 모두 놓으면 열려요.',
    s4b: '천체마다 종류와 근거를 골라 모두 맞히면 열려요.',
    s5b: '두 별 무리에서 선을 두 개 이상 저장하고 기준과 비교해요. 다시 잇기는 선택이에요.',
  };
  for (const [scene, text] of Object.entries(expect)) { s.scene = scene; const a = getStageAction(s, 0); assert.equal(a.disabled, true, scene); assert.equal(a.reason, text, scene); }
  s.scene = 's5a'; assert.equal(getStageAction(s, 0).reason, undefined);
  s.scene = 's5a'; s.drafts.pattern.observed = sixStars(); s.drafts.pattern.polaris = { pointers: ['Merak', 'Dubhe'], found: true };
  assert.equal(getStageAction(s, 2).reason, undefined);
});
