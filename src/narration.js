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
  async function play(id) {
    const line = voiceLines.find(item => item.id === id);
    stop();
    if (!line || disposed) return false;
    if (doc.hidden || isMuted()) { state = { id, status: 'muted' }; emit(); return false; }
    const token = request, audio = makeAudio(); player = audio;
    audio.preload = 'none'; audio.src = line.src;
    const finish = () => { if (token === request) stop(); };
    const fail = () => { if (token !== request) return; stop(); state = { id, status: 'error' }; emit(); };
    audio.addEventListener('ended', finish, { once: true });
    audio.addEventListener('error', fail, { once: true });
    state = { id, status: 'playing' }; duck(true); emit();
    try {
      await audio.play();
      if (token !== request) return false;
      if (disposed || doc.hidden || isMuted()) { stop(); return false; }
      return true;
    } catch { fail(); return false; }
  }
  const hidden = () => { if (doc.hidden) stop(); };
  const muted = () => { if (isMuted()) stop(); };
  doc.addEventListener('visibilitychange', hidden); doc.addEventListener('change', muted);
  page.addEventListener('pagehide', stop); page.addEventListener('popstate', stop); page.addEventListener('hashchange', stop);
  return {
    play, stop, get state() { return state; },
    subscribe(listener) { listeners.add(listener); listener(state); return () => listeners.delete(listener); },
    dispose() { disposed = true; stop(); listeners.clear(); doc.removeEventListener('visibilitychange', hidden); doc.removeEventListener('change', muted); page.removeEventListener('pagehide', stop); page.removeEventListener('popstate', stop); page.removeEventListener('hashchange', stop); }
  };
}

export function mountNarrationControl(host, id, narration, { autoplay = true, compact = false } = {}) {
  const line = voiceLines.find(item => item.id === id);
  if (!host || !line) return () => {};
  const row = document.createElement('span'); row.className = 'npc-dialogue-voice'; row.dataset.voiceId = id;
  row.style.cssText = 'display:inline-flex;align-items:center;flex-wrap:wrap;gap:6px;max-width:100%;';
  const button = document.createElement('button'); button.type = 'button'; button.className = 'btn secondary';
  const status = document.createElement('span'); status.setAttribute('role', 'status'); status.style.cssText = 'font-size:14px;line-height:1.4;';
  if (compact) status.className = 'sr-only';
  row.append(button, status); host.append(row);
  const unsubscribe = narration.subscribe(state => {
    const active = state.id === id && state.status === 'playing';
    row.dataset.state = state.id === id ? state.status : 'idle';
    button.textContent = compact ? (active ? '멈춤' : '듣기') : (active ? '음성 멈추기' : '다시 듣기');
    button.setAttribute('aria-label', `${line.speaker} 대사 ${active ? '멈추기' : '다시 듣기'}`);
    button.setAttribute('aria-pressed', String(active));
    status.textContent = state.id !== id ? '' : state.status === 'muted' ? '소리를 켜면 들을 수 있어요.' : state.status === 'error' ? '음성을 재생하지 못했어요. 글을 읽고 계속할 수 있어요.' : '';
    button.title = status.textContent || `${line.speaker} 대사`;
  });
  button.addEventListener('click', () => narration.state.id === id && narration.state.status === 'playing' ? narration.stop() : narration.play(id));
  if (autoplay) narration.play(id);
  return () => { unsubscribe(); row.remove(); };
}
