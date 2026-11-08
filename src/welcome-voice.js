// Optional welcome narration. Playback always begins with a deliberate button press.
export function mountWelcomeVoice(host, { caption, isMuted, duck = () => {} }) {
  if (!host) return () => {};
  const panel = document.createElement('section');
  panel.className = 'npc-welcome-voice';
  panel.setAttribute('aria-label', '안내자 환영 인사');
  panel.style.cssText = 'max-width:480px;margin:12px 0;padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.94);color:#193d43;text-align:left;position:relative;z-index:2;';
  const button = document.createElement('button');
  button.type = 'button';
  button.style.cssText = 'min-width:48px;min-height:48px;padding:8px 16px;border:1px solid #527577;border-radius:12px;background:#fff;color:#193d43;font:inherit;font-weight:700;cursor:pointer;';
  const label = document.createElement('small');
  label.textContent = 'AI 생성 음성';
  label.style.cssText = 'display:inline-block;margin-left:10px;font-size:12px;';
  const subtitle = document.createElement('p');
  subtitle.textContent = caption;
  subtitle.style.cssText = 'margin:6px 0 0;font-size:14px;line-height:1.55;word-break:keep-all;';
  const status = document.createElement('span');
  status.setAttribute('role', 'status');
  status.style.cssText = 'display:block;font-size:13px;line-height:1.4;';
  panel.append(button, label, subtitle, status);
  host.append(panel);
  const events = new AbortController();
  const player = new Audio('./assets/audio/npc-welcome.m4a');
  player.preload = 'none';
  let active = false, disposed = false, serial = 0;
  const paint = () => { button.textContent = active ? '안내 음성 멈추기' : '안내 음성 듣기'; button.setAttribute('aria-pressed', String(active)); };
  function stop() {
    serial++;
    player.pause();
    try { player.currentTime = 0; } catch {}
    if (active) duck(false);
    active = false;
    paint();
  }
  function fail() { stop(); status.textContent = '음성을 불러오지 못했어요. 위의 글을 읽고 계속할 수 있어요.'; }
  button.addEventListener('click', async () => {
    if (active) { stop(); return; }
    if (disposed || document.hidden || !panel.isConnected) return;
    if (isMuted()) { status.textContent = '소리를 켜면 안내 음성을 들을 수 있어요.'; return; }
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
