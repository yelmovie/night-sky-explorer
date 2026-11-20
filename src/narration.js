import { voiceLines } from './voice-lines.js';

// One active dialogue at a time. Late play promises must never restart a disposed line.
export function createNarration({ isMuted, duck = () => {}, makeAudio = () => new Audio(), doc = document, page = window }) {
  let player = null, request = 0, disposed = false, state = { id: null, status: 'idle' };
  const listeners = new Set();
  const emit = () => listeners.forEach(listener => listener(state));
  function stop() {
    request++;
    const previous = player; player = null;
    if (previous) { previous.pause(); previous.removeAttribute('src'); previous.load(); }
    duck(false); state = { id: null, status: 'idle' }; emit();
  }
  // 지도 악당의 짧은 대사가 나오는 중에 다른 인물의 안내 음성이 오면 끊지 않고 그 대사 뒤로(최대 2초) 미룬다.
  let asks = 0;
  const villainSpeaking = () => !!player && String(state.id).startsWith('villain-') && ['loading', 'playing'].includes(state.status);
  function villainDone(limit = 2000) {
    const audio = player;
    return new Promise(done => {
      const end = () => { clearTimeout(timer); done(); }, timer = setTimeout(done, limit);
      for (const type of ['ended', 'error', 'pause']) audio.addEventListener(type, end, { once: true });
    });
  }
  // 새로고침 직후 아직 아무 입력이 없으면 브라우저가 재생을 거부한다(NotAllowedError). 그때는 시도하지 않고 첫 입력 뒤에 한 번 낸다.
  // 그 입력이 화면을 바꾸거나 다른 대사를 틀면(stop·play로 차례가 바뀌면) 생략한다. 거부된 줄을 「읽은 줄」로 소모하지 않는다.
  const activated = () => { const user = globalThis.navigator?.userActivation; return !user || user.hasBeenActive; };
  let waitInput = null;
  function afterFirstInput(ticket, id) {
    waitInput?.abort(); waitInput = new AbortController();
    const signal = waitInput.signal;
    const go = () => setTimeout(() => {
      if (ticket !== asks || disposed) { waitInput?.abort(); return; }
      if (!activated()) return; // Esc 같은 입력은 재생 허락이 아니다. 다음 입력을 기다린다.
      waitInput?.abort(); play(id);
    }, 0);
    for (const type of ['pointerup', 'keydown']) doc.addEventListener(type, go, { capture: true, signal });
  }
  /** Public stop. spareVillain leaves a villain line playing (a dialog opening on the map waits for it instead). */
  function cancel({ spareVillain = false } = {}) { if (spareVillain && villainSpeaking()) return; asks++; stop(); }
  async function play(id) {
    const ticket = ++asks;
    if (!String(id).startsWith('villain-') && villainSpeaking()) { await villainDone(); if (ticket !== asks || disposed) return false; }
    const line = voiceLines.find(item => item.id === id);
    stop();
    if (!line || disposed) return false;
    if (doc.hidden || isMuted()) { state = { id, status: 'muted' }; emit(); return false; }
    if (!activated()) { afterFirstInput(ticket, id); return false; }
    const token = request, audio = makeAudio(); player = audio;
    audio.preload = 'none'; audio.src = line.src;
    const finish = () => { if (token === request) stop(); };
    const fail = () => { if (token !== request) return; stop(); state = { id, status: 'error' }; emit(); };
    audio.addEventListener('ended', finish, { once: true });
    audio.addEventListener('error', fail, { once: true });
    const updateStatus = status => { if (token === request && player === audio) { state = { id, status }; emit(); } };
    audio.addEventListener('playing', () => updateStatus('playing'));
    audio.addEventListener('waiting', () => updateStatus('loading'));
    audio.addEventListener('pause', () => updateStatus('paused'));
    state = { id, status: 'loading' }; duck(true); emit();
    try {
      await audio.play();
      if (token !== request) return false;
      if (disposed || doc.hidden || isMuted()) { stop(); return false; }
      updateStatus('playing');
      return true;
    } catch { fail(); return false; }
  }
  const hidden = () => { if (doc.hidden) cancel(); };
  const muted = () => { if (isMuted()) cancel(); };
  doc.addEventListener('visibilitychange', hidden); doc.addEventListener('change', muted);
  page.addEventListener('pagehide', cancel); page.addEventListener('popstate', cancel); page.addEventListener('hashchange', cancel);
  return {
    play, stop: cancel, get state() { return state; },
    subscribe(listener) { listeners.add(listener); listener(state); return () => listeners.delete(listener); },
    dispose() { disposed = true; waitInput?.abort(); cancel(); listeners.clear(); doc.removeEventListener('visibilitychange', hidden); doc.removeEventListener('change', muted); page.removeEventListener('pagehide', cancel); page.removeEventListener('popstate', cancel); page.removeEventListener('hashchange', cancel); }
  };
}

export function mountNarrationControl(host, id, narration, { autoplay = true, compact = false } = {}) {
  const line = voiceLines.find(item => item.id === id);
  if (!host || !line) return () => {};
  const row = document.createElement('span'); row.className = 'npc-dialogue-voice'; row.dataset.voiceId = id;
  row.style.cssText = 'display:inline-flex;align-items:center;flex-wrap:wrap;gap:6px;max-width:100%;';
  const button = document.createElement('button'); button.type = 'button'; button.className = 'btn secondary';
  const status = document.createElement('span'); status.setAttribute('role', 'status'); status.style.cssText = 'font-size:var(--classroom-small,18px);line-height:1.4;';
  if (compact) status.className = 'sr-only';
  row.append(button, status); host.append(row);
  const unsubscribe = narration.subscribe(state => {
    const active = state.id === id && ['loading', 'playing'].includes(state.status);
    row.dataset.state = state.id === id ? state.status : 'idle';
    button.textContent = compact ? (active ? '멈춤' : '듣기') : (active ? '음성 멈추기' : '다시 듣기');
    button.setAttribute('aria-label', `${line.speaker} 대사 ${active ? '멈추기' : '다시 듣기'}`);
    button.setAttribute('aria-pressed', String(active));
    status.textContent = state.id !== id ? '' : state.status === 'muted' ? '소리를 켜면 들을 수 있어요.' : state.status === 'error' ? '음성을 재생하지 못했어요. 글을 읽고 계속할 수 있어요.' : '';
    button.title = status.textContent || `${line.speaker} 대사`;
  });
  button.addEventListener('click', () => narration.state.id === id && ['loading', 'playing'].includes(narration.state.status) ? narration.stop() : narration.play(id));
  if (autoplay) narration.play(id);
  return () => { unsubscribe(); row.remove(); };
}
