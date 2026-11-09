// Original procedural sound design. No samples, network requests, or microphone.
export function createThemeEffects(theme, getSettings = () => ({})) {
  let context, disposed = false, last = -Infinity;
  const voices = new Set();
  const scales = { sky: [523.25, 783.99, 1046.5], ecosystem: [587.33, 880, 1174.66], gas: [196, 293.66, 392], climate: [392, 523.25, 783.99] };
  function stop() { for (const voice of voices) { try { voice.stop(); voice.disconnect(); } catch {} } voices.clear(); }
  function unlock() {
    if (disposed) return;
    try { const Audio = globalThis.AudioContext || globalThis.webkitAudioContext; if (!Audio) return; context ||= new Audio(); if (context.state === 'suspended') context.resume().catch(() => {}); } catch {}
  }
  function sync() { const s = getSettings(); if (s.muted || s.enabled === false || document.hidden) stop(); }
  function play(kind = 'tap') {
    const s = getSettings();
    if (disposed || document.hidden || s.muted || s.enabled === false) return;
    const now = performance.now(); if (now - last < 65 && ['click','tap'].includes(kind)) return; last = now;
    unlock(); if (!context || context.state !== 'running') return;
    stop();
    const notes = scales[theme] || scales.sky, success = ['success','award','discover','collect'].includes(kind), soft = ['error','retry'].includes(kind);
    const count = success ? 3 : 1, volume = Math.max(0, Math.min(1, Number.isFinite(s.volume) ? s.volume : 1));
    for (let i = 0; i < count; i++) {
      const o = context.createOscillator(), g = context.createGain(), t = context.currentTime + i * .075;
      const airy = theme === 'gas' && ['pump','rotate','experiment'].includes(kind);
      const f = soft ? notes[0] * .55 : notes[i];
      o.type = theme === 'gas' ? 'triangle' : 'sine';
      o.frequency.setValueAtTime(airy ? 110 : f, t);
      o.frequency.exponentialRampToValueAtTime(airy ? 440 : f * (theme === 'ecosystem' ? 1.3 : 1.04), t + .09);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.045 * volume, t + .012); g.gain.exponentialRampToValueAtTime(.0001, t + (success ? .32 : .18));
      o.connect(g); g.connect(context.destination); voices.add(o);
      o.onended = () => { voices.delete(o); o.disconnect(); g.disconnect(); };
      o.start(t); o.stop(t + (success ? .35 : .21));
    }
  }
  const hide = () => { if (document.hidden) { stop(); context?.suspend().catch(() => {}); } };
  const leave = () => { stop(); context?.suspend().catch(() => {}); };
  document.addEventListener('visibilitychange', hide); globalThis.addEventListener?.('pagehide', leave);
  return { unlock, play, stop, sync, dispose() { if (disposed) return; disposed = true; stop(); document.removeEventListener('visibilitychange', hide); globalThis.removeEventListener?.('pagehide', leave); context?.close().catch(() => {}); } };
}
