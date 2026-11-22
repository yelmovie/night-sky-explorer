// 설정 창의 「안내 목소리 듣기」 한 줄(2026-11-22 첫 화면에서 옮김). 재생은 늘 버튼을 눌러야 시작한다.
export function mountWelcomeVoice(host, { isMuted, duck = () => {} }) {
  if (!host) return () => {};
  const panel = document.createElement('div');
  panel.className = 'setting-row settings-welcome-voice';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn secondary';
  const label = document.createElement('small');
  label.textContent = 'AI 생성 음성';
  const status = document.createElement('span');
  status.setAttribute('role', 'status');
  panel.append(button, label, status);
  host.append(panel);
  const events = new AbortController();
  const player = new Audio('./assets/audio/voices/el-welcome.mp3');
  player.preload = 'none';
  let active = false, disposed = false, serial = 0;
  const paint = () => { button.textContent = active ? '안내 목소리 멈추기' : '안내 목소리 듣기'; button.setAttribute('aria-pressed', String(active)); };
  function stop() {
    serial++;
    player.pause();
    try { player.currentTime = 0; } catch {}
    if (active) duck(false);
    active = false;
    paint();
  }
  function fail() { stop(); status.textContent = '음성을 불러오지 못했어요.'; }
  button.addEventListener('click', async () => {
    if (active) { stop(); return; }
    if (disposed || document.hidden || !panel.isConnected) return;
    if (isMuted()) { status.textContent = '소리와 목소리를 켜면 들을 수 있어요.'; return; }
    status.textContent = '';
    active = true; const request = ++serial;
    duck(true); paint();
    try {
      await player.play();
      if (request !== serial) return;
      if (disposed || document.hidden || isMuted()) stop();
    } catch { if (request === serial && !disposed) fail(); }
  }, { signal: events.signal });
  player.addEventListener('ended', stop, { signal: events.signal });
  player.addEventListener('error', fail, { signal: events.signal });
  document.addEventListener('click', event => { if (!panel.contains(event.target)) stop(); }, { capture: true, signal: events.signal });
  document.addEventListener('change', () => { if (isMuted()) stop(); }, { signal: events.signal });
  document.addEventListener('play', event => { if (event.target !== player) stop(); }, { capture: true, signal: events.signal });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); }, { signal: events.signal });
  window.addEventListener('pagehide', stop, { signal: events.signal });
  window.addEventListener('popstate', stop, { signal: events.signal });
  window.addEventListener('hashchange', stop, { signal: events.signal });
  paint();
  return () => { disposed = true; stop(); events.abort(); player.removeAttribute('src'); player.load(); panel.remove(); };
}
