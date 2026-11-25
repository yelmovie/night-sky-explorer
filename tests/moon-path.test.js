import test from 'node:test';
import assert from 'node:assert/strict';
import { freshState, restore, completeStage, SAVE_KEY } from '../src/state.js';
import { restorePercent } from '../src/quest.js';
import { bonusQuests } from '../src/bonus.js';
import { phase } from '../src/drawing.js';
import { discoveryDays } from '../src/discovery-route.js';
import { pathDays, pathGates, doorMatches, judgeDoor, finishPath, pathHelpAfter } from '../src/moon-path.js';

test('달빛 길 보너스는 세 번째 선택 보너스이고 저장 키를 바꾸지 않는다', () => {
  assert.deepEqual(Object.keys(bonusQuests), ['cloudy', 'planet', 'path']);
  assert.equal(bonusQuests.path.title, '달빛 길 따라가기');
  assert.equal(SAVE_KEY, 'starlight-lab:v1');
  assert.deepEqual(freshState().bonus, { cloudy: '', planet: '', path: '' });
});

test('path 키가 없는 기존 저장은 다른 보너스 기록을 그대로 두고 열린다', () => {
  const old = JSON.parse(JSON.stringify(freshState()));
  old.bonus = { cloudy: 'done', planet: '' };
  assert.deepEqual(restore(old).bonus, { cloudy: 'done', planet: '', path: '' });
  const broken = JSON.parse(JSON.stringify(freshState()));
  broken.bonus = { cloudy: '', planet: 'done', path: 'yes', extra: 'done' };
  assert.deepEqual(restore(broken).bonus, { cloudy: '', planet: 'done', path: '' });
  const done = JSON.parse(JSON.stringify(freshState()));
  done.bonus.path = 'done';
  assert.equal(restore(done).bonus.path, 'done');
});

test('문은 2장의 여섯 시점을 날짜 순서대로 지난다', () => {
  assert.deepEqual(pathDays, discoveryDays);
  const gates = pathGates();
  assert.deepEqual(gates.map(gate => gate.day), [3, 7, 10, 17, 21, 25]);
  assert.deepEqual(gates.map(gate => gate.prev), [null, 3, 7, 10, 17, 21]);
  assert.deepEqual(gates.map(gate => gate.section), [0, 0, 1, 1, 2, 2]);
});

test('문마다 정답은 하나이고 기존 phase()가 정한다', () => {
  for (const gate of pathGates()) {
    const right = gate.doors.filter(door => doorMatches(door, gate.day));
    assert.equal(right.length, 1, `${gate.day}일째`);
    assert.equal(right[0].kind, 'answer');
    assert.deepEqual({ amount: right[0].amount, side: right[0].side }, phase(gate.day));
  }
});

test('헷갈리는 문은 밝은 쪽이 반대인 달과 크기가 다른 달이고 차이가 뚜렷하다', () => {
  const gates = pathGates();
  assert.deepEqual(gates.map(gate => gate.doors.map(door => door.kind).sort().join()), [
    'answer,mirror', 'answer,mirror', 'answer,size', 'answer,size', 'answer,mirror,size', 'answer,mirror,size',
  ]);
  for (const gate of gates) {
    const answer = phase(gate.day);
    for (const door of gate.doors) {
      if (door.kind === 'mirror') { assert.notEqual(door.side, answer.side); assert.equal(door.amount, answer.amount); }
      if (door.kind === 'size') { assert.equal(door.side, answer.side); assert.deepEqual({ amount: door.amount, side: door.side }, phase(door.day)); }
    }
    // 14일째·17일째처럼 비슷한 달이 나란히 서지 않는다: 같은 쪽이 밝은 문끼리는 30%p 넘게 다르다.
    for (const a of gate.doors) for (const b of gate.doors) {
      if (a !== b && a.side === b.side) assert.ok(Math.abs(a.amount - b.amount) >= 30, `${gate.day}일째 ${a.kind}/${b.kind}`);
    }
  }
});

test('문 순서를 섞어도 문 구성과 정답은 같다', () => {
  let seed = 7;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const fixed = pathGates(), mixed = pathGates(random);
  mixed.forEach((gate, index) => {
    assert.deepEqual(gate.doors.map(door => door.kind).sort(), fixed[index].doors.map(door => door.kind).sort());
    assert.equal(gate.doors.filter(door => doorMatches(door, gate.day)).length, 1);
  });
});

test('다른 문은 열리지 않고 여러 번 틀려도 정답 표시 없이 관찰 단서를 준다', () => {
  const gates = pathGates();
  const pick = (gate, kind) => gate.doors.findIndex(door => door.kind === kind);
  assert.deepEqual(judgeDoor(gates[1], pick(gates[1], 'answer'), 0), { ok: true, reason: '', hint: '' });
  const side1 = judgeDoor(gates[1], pick(gates[1], 'mirror'), 0);
  assert.equal(side1.ok, false); assert.equal(side1.reason, 'side'); assert.match(side1.hint, /어느 쪽/); assert.doesNotMatch(side1.hint, /오른쪽|왼쪽/);
  const side2 = judgeDoor(gates[1], pick(gates[1], 'mirror'), 1);
  assert.match(side2.hint, /보름 전후/);
  const size1 = judgeDoor(gates[2], pick(gates[2], 'size'), 0);
  assert.equal(size1.reason, 'size'); assert.match(size1.hint, /7일째보다/); assert.doesNotMatch(size1.hint, /커요|작아요/);
  assert.match(judgeDoor(gates[2], pick(gates[2], 'size'), 1).hint, /밝은 부분만 비교/);
  const third = judgeDoor(gates[4], pick(gates[4], 'mirror'), pathHelpAfter - 1);
  assert.equal(third.ok, false);
  assert.equal('reveal' in third, false);
  assert.doesNotMatch(third.hint, /오른쪽|왼쪽|정답/);
  assert.equal(judgeDoor(gates[4], 9, 0).ok, false);
});

test('여섯 문을 모두 지나야 완료가 기록되고 미션 완료 조건은 바뀌지 않는다', () => {
  const s = freshState();
  assert.equal(finishPath(s, 5), false);
  assert.equal(s.bonus.path, '');
  assert.equal(finishPath(s, 6), true);
  assert.equal(s.bonus.path, 'done');
  assert.equal(finishPath(s, 6), false, '두 번째부터는 새 기록이 아니다');
  assert.equal(completeStage(s, 1), false);
  assert.equal(restorePercent(s), 0);
  assert.equal(restore(JSON.parse(JSON.stringify(s))).bonus.path, 'done');
});

test('언덕길은 평범한 점프로 건널 수 있고 문은 길 안에 선다', async () => {
  const { slabs, stones, gateS, streams, slabAt, doorXs, HALF, DOOR_HALF, JUMP_REACH, checkpointFor, arriveS } = await import('../src/moon-run-course.js');
  assert.equal(gateS.length, pathDays.length);
  for (const s of gateS) {
    const slab = slabAt(s);
    assert.ok(slab, `${s}m 문은 바닥 위에 있다`);
    assert.ok(s - slab.s0 >= 4 && slab.s1 - s >= 3, `${s}m 문 앞뒤에 설 자리가 있다`);
  }
  for (const count of [2, 3]) {
    const xs = doorXs(count);
    assert.equal(xs.length, count);
    assert.ok(xs[0] - DOOR_HALF > -HALF && xs.at(-1) + DOOR_HALF < HALF);
    for (let i = 1; i < xs.length; i++) assert.ok(xs[i] - xs[i - 1] > DOOR_HALF * 2 + 0.6, '문 사이에 기둥이 있다');
  }
  for (const [from, to] of streams()) {
    const edges = [from, ...stones.filter(stone => stone.s0 > from && stone.s1 < to).flatMap(stone => [stone.s0, stone.s1]), to];
    for (let i = 0; i < edges.length; i += 2) assert.ok(edges[i + 1] - edges[i] <= JUMP_REACH * 0.6, `${edges[i]}m 틈은 여유 있게 건넌다`);
  }
  for (let i = 1; i < slabs.length; i++) assert.ok(slabs[i].top - slabs[i - 1].top <= 0.5, '턱은 낮다');
  assert.deepEqual(checkpointFor(-3), { s: 0, top: 0 });
  assert.deepEqual(checkpointFor(43), { s: 37.2, top: 0.45 });
  assert.ok(arriveS > gateS.at(-1) && slabAt(arriveS));
});
