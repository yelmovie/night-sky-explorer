import test from 'node:test';
import assert from 'node:assert/strict';
import { freshState } from '../src/state.js';
import { createObservationPlayer, playbackAvailability, playbackMarkup } from '../src/observation-player.js';

function clock() {
  let next = 1;
  const timers = new Map();
  return {
    timers,
    setTimer(callback, delay) { const id = next++; timers.set(id, { callback, delay }); return id; },
    clearTimer(id) { timers.delete(id); },
    next() {
      const [id, timer] = timers.entries().next().value || [];
      assert.ok(timer, 'a pending playback timer is required');
      timers.delete(id); timer.callback();
      return timer.delay;
    },
  };
}
const setup = (scene = 's1a') => {
  const state = freshState(); state.scene = scene;
  const ui = { round: 0 }, time = clock(), steps = [];
  const options = { state, ui, onStep: step => { steps.push(step); }, setTimer: time.setTimer, clearTimer: time.clearTimer };
  return { state, ui, time, steps, options };
};

test('정답 선택 화면은 자동 관찰을 제공하거나 실행하지 않는다', () => {
  for (const scene of ['s3b', 's4b', 'core', 'home']) {
    const { state, ui, time, options } = setup(scene);
    assert.equal(playbackMarkup(state, ui), '');
    assert.equal(playbackAvailability(state, ui).supported, false);
    const player = createObservationPlayer(options);
    assert.equal(player.play(), false);
    assert.equal(time.timers.size, 0);
    player.dispose();
  }
});

test('예상과 별 패턴을 먼저 저장해야 비교 재생을 열고 기존 답은 바꾸지 않는다', () => {
  const lunar = setup('s2b'), before = structuredClone(lunar.state);
  const player = createObservationPlayer(lunar.options);
  assert.equal(player.play(), false);
  assert.match(playbackMarkup(lunar.state, lunar.ui), /예상을 먼저 저장해요/);
  assert.deepEqual(lunar.state, before);
  lunar.state.drafts.phases.predictions[14].revealed = true;
  assert.equal(player.play(), true);
  player.dispose();
  lunar.ui.round = 1;
  assert.equal(playbackAvailability(lunar.state, lunar.ui).enabled, false);

  const stars = setup('s5b');
  assert.equal(playbackAvailability(stars.state, stars.ui).enabled, false);
  stars.state.drafts.pattern.cases.cassiopeia.original = [['Caph', 'Schedar'], ['Schedar', 'Navi']];
  assert.equal(playbackAvailability(stars.state, stars.ui).enabled, true);
  stars.ui.round = 1;
  assert.equal(playbackAvailability(stars.state, stars.ui).enabled, false);
});

test('재생 속도는 예약된 다음 단계를 즉시 바꾸고 지원하지 않는 값은 거부한다', () => {
  const { options, time, steps } = setup('s2a');
  const player = createObservationPlayer(options);
  player.play();
  assert.equal([...time.timers.values()][0].delay, 1200);
  assert.equal(player.setSpeed(2), true);
  assert.equal(time.timers.size, 1);
  assert.equal([...time.timers.values()][0].delay, 600);
  assert.equal(time.next(), 600);
  assert.deepEqual(steps, [0]);
  player.setSpeed('0.5');
  assert.equal([...time.timers.values()][0].delay, 2400);
  assert.equal(player.setSpeed(10), false);
  assert.equal(player.snapshot.speed, .5);
  player.pause();
  assert.equal(time.timers.size, 0);
  assert.equal(player.snapshot.step, 1);
  player.dispose();
});

test('가려진 화면이나 팝업에서는 관찰 단계가 진행되지 않는다', () => {
  const { options, time, steps } = setup('s4a');
  let canRun = false;
  const player = createObservationPlayer({ ...options, canRun: () => canRun });
  player.play();
  time.next(); time.next();
  assert.deepEqual(steps, []);
  assert.equal(player.snapshot.step, 0);
  assert.equal(time.timers.size, 1);
  canRun = true; time.next();
  assert.deepEqual(steps, [0]);
  player.pause();
  assert.equal(time.timers.size, 0);
  player.dispose();
});

test('관찰 후 화면을 다시 그려도 다음 단계부터 이어지고 타이머는 한 개다', () => {
  const { options, ui, time } = setup('s1a');
  let player, calls = [];
  const onStep = step => {
    calls.push(step);
    assert.equal(ui.playback.step, step + 1);
    player.dispose();
    player = createObservationPlayer({ ...options, onStep });
    player.sync(); player.sync();
  };
  player = createObservationPlayer({ ...options, onStep });
  player.play(); time.next(); time.next();
  assert.deepEqual(calls, [0, 1]);
  assert.equal(time.timers.size, 1);
  assert.equal(ui.playback.playing, true);
  player.dispose();
  assert.equal(time.timers.size, 0);
  assert.equal(ui.playback.playing, true, 'dispose preserves logical state for the next render');
});

test('관찰 중 새 컨트롤러가 생긴 직후 종료해도 예약된 다음 단계가 남지 않는다', () => {
  const { options, time, ui } = setup('s1b');
  let player;
  player = createObservationPlayer({ ...options, onStep() {
    player.dispose();
    player = createObservationPlayer(options);
    return { done: true };
  } });
  player.play(); time.next();
  assert.equal(ui.playback.finished, true);
  assert.equal(ui.playback.playing, false);
  assert.equal(time.timers.size, 0);
  assert.match(playbackMarkup(options.state, ui), /다시 보기/);
  player.play();
  assert.equal(player.snapshot.step, 0);
  assert.equal(time.timers.size, 1);
  player.dispose();
});

test('마지막 관찰을 렌더하기 전에 finish를 호출하면 재마운트도 멈춘다', () => {
  const { options, time, ui, state } = setup('s2a');
  const before = structuredClone(state);
  let player;
  player = createObservationPlayer({ ...options, onStep() {
    player.finish();
    player.dispose();
    player = createObservationPlayer(options);
  } });
  player.play(); time.next();
  assert.equal(time.timers.size, 0);
  assert.equal(ui.playback.finished, true);
  assert.deepEqual(state, before, 'the timer never changes a learner draft or evidence');
  player.reset();
  assert.equal(player.snapshot.step, 0);
  assert.equal(player.snapshot.finished, false);
  player.dispose();
});

test('장면을 바꾸면 재생은 멈추고 속도만 유지한다', () => {
  const { options, state, ui, time } = setup('s2a');
  const player = createObservationPlayer(options);
  player.setSpeed(2); player.play(); time.next();
  state.scene = 's3a';
  const next = createObservationPlayer({ ...options, scene: state.scene });
  assert.equal(time.timers.size, 0);
  assert.deepEqual(ui.playback, { scene: 's3a', playing: false, speed: 2, step: 0, finished: false });
  assert.equal(next.play(), true);
  assert.match(playbackMarkup(state, ui), /aria-pressed="true"/);
  assert.match(playbackMarkup(state, ui), /value="2" selected/);
  next.dispose();
});
