// Playback owns timing only. The learning screen applies observation steps through
// its existing actions; this module never fills an answer or a written record.
export const PLAYBACK_SPEEDS = Object.freeze([0.5, 1, 2]);
const scenes = new Set(['s1a', 's1b', 's2a', 's2b', 's3a', 's4a', 's5a', 's5b']);
const activePlayers = new WeakMap();
const validSpeed = value => PLAYBACK_SPEEDS.includes(Number(value)) ? Number(value) : 1;

export function playbackAvailability(state, ui = {}) {
  const scene = state.scene;
  if (!scenes.has(scene)) return { supported: false, enabled: false, reason: '' };
  if (scene === 's2b') {
    const prediction = state.drafts.phases.predictions[ui.round === 1 ? 24 : 14];
    if (!prediction.revealed) return { supported: true, enabled: false, reason: '예상을 먼저 저장해요' };
  }
  if (scene === 's5b') {
    const pattern = state.drafts.pattern.cases[ui.round === 1 ? 'dipper' : 'cassiopeia'];
    if (!pattern.original || pattern.original.length < 2)
      return { supported: true, enabled: false, reason: '내 패턴을 먼저 저장해요' };
  }
  return { supported: true, enabled: true, reason: '' };
}

function playbackState(ui, scene) {
  const previous = ui.playback;
  if (previous?.scene !== scene) {
    ui.playback = { scene, playing: false, speed: validSpeed(previous?.speed), step: 0, finished: false };
  } else {
    previous.playing = previous.playing === true;
    previous.speed = validSpeed(previous.speed);
    previous.step = Number.isSafeInteger(previous.step) && previous.step >= 0 ? previous.step : 0;
    previous.finished = previous.finished === true;
  }
  return ui.playback;
}

const playbackIcon = playing => `<svg class="playback-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${playing ? '<path d="M8 5v14M16 5v14"/>' : '<path d="m8 4 12 8-12 8Z"/>'}</svg>`;

export function playbackMarkup(state, ui = {}) {
  const availability = playbackAvailability(state, ui);
  if (!availability.supported) return '';
  const playback = ui.playback?.scene === state.scene ? ui.playback : {};
  const playing = availability.enabled && playback.playing === true;
  const label = playing ? '직접 해보기' : playback.finished ? '다시 보기' : '자동 관찰';
  const disabled = availability.enabled ? '' : ' disabled';
  return `<div class="observation-playback playback-controls" data-playback-scene="${state.scene}"><button type="button" class="btn secondary playback-toggle" id="play-time" data-learning="play-time" aria-pressed="${playing}"${availability.reason ? ` aria-describedby="playback-reason"` : ''}${disabled}>${playbackIcon(playing)}<span>${label}</span></button><label class="playback-speed"><span class="sr-only">자동 관찰 속도</span><select id="playback-speed" aria-label="자동 관찰 속도"${disabled}>${PLAYBACK_SPEEDS.map(speed => `<option value="${speed}"${speed === validSpeed(playback.speed) ? ' selected' : ''}>${speed}×</option>`).join('')}</select></label>${availability.reason ? `<small id="playback-reason" class="playback-reason">${availability.reason}</small>` : ''}</div>`;
}

/**
 * onStep(step, playback) is synchronous. Return true or {done:true} to finish.
 * step is incremented before onStep, so a render during onStep resumes correctly.
 * dispose removes this mount's timer while retaining logical playback state.
 */
export function createObservationPlayer({
  state,
  scene = state.scene,
  ui,
  onStep,
  onState = () => {},
  canRun = () => true,
  baseDelay = 1200,
  setTimer = (callback, delay) => setTimeout(callback, delay),
  clearTimer = timer => clearTimeout(timer),
}) {
  activePlayers.get(ui)?.dispose();
  const playback = playbackState(ui, scene);
  const stepDelay = Number.isFinite(baseDelay) && baseDelay > 0 ? baseDelay : 1200;
  let timer = null, disposed = false;
  const enabled = () => state.scene === scene && playbackAvailability(state, ui).enabled;
  const clear = () => { if (timer !== null) clearTimer(timer), timer = null; };
  const snapshot = () => ({ ...playback });
  function notify() { onState(snapshot()); }
  function syncOtherMount() {
    const current = activePlayers.get(ui);
    if (current && current !== api) current.sync();
  }
  function finish() {
    clear();
    playback.playing = false;
    playback.finished = true;
    if (ui.playback === playback) notify(), syncOtherMount();
  }
  function pause() {
    clear();
    playback.playing = false;
    if (ui.playback === playback) notify(), syncOtherMount();
  }
  function schedule() {
    if (disposed || timer !== null || !playback.playing) return;
    if (!enabled()) { pause(); return; }
    timer = setTimer(tick, stepDelay / playback.speed);
  }
  function tick() {
    timer = null;
    if (disposed || !playback.playing) return;
    if (!enabled()) { pause(); return; }
    if (!canRun()) { schedule(); return; }
    const step = playback.step++;
    let result;
    try { result = onStep(step, playback); }
    catch (error) { pause(); throw error; }
    if (result === true || result?.done === true) finish();
    if (!disposed) schedule();
  }
  const api = {
    play() {
      if (disposed || !enabled()) return false;
      if (playback.finished) playback.step = 0, playback.finished = false;
      playback.playing = true;
      notify(); schedule();
      return true;
    },
    pause,
    toggle() { if (playback.playing) { pause(); return false; } return api.play(); },
    setSpeed(value) {
      const speed = Number(value);
      if (disposed || !PLAYBACK_SPEEDS.includes(speed)) return false;
      playback.speed = speed;
      clear(); notify(); schedule();
      return true;
    },
    finish,
    reset() {
      clear(); playback.playing = false; playback.step = 0; playback.finished = false;
      if (ui.playback === playback) notify(), syncOtherMount();
    },
    sync() { if (disposed) return; if (!playback.playing || !enabled()) clear(); else schedule(); },
    dispose() {
      disposed = true; clear();
      if (activePlayers.get(ui) === api) activePlayers.delete(ui);
    },
    get snapshot() { return snapshot(); },
  };
  activePlayers.set(ui, api);
  api.sync();
  return api;
}
