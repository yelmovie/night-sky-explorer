const files = { click: 'click.ogg', capture: 'capture.ogg', place: 'place.ogg', discover: 'discover.ogg', success: 'success.ogg', hint: 'hint.ogg' };
export function createSound(getSettings) {
  let context, bgmGain, timer, activeEffect, disposed = false, ducked = false, lastEffect = 0;
  const players = new Map();
  function ensure() { context ||= new AudioContext(); if (!bgmGain) { bgmGain = context.createGain(); bgmGain.connect(context.destination); } return context; }
  function quiet() { return disposed || ducked || document.hidden || getSettings().muted; }
  function chord() {
    if (!context || quiet() || !getSettings().bgm) return;
    const notes = [[130.81, 196, 261.63], [146.83, 220, 293.66], [164.81, 246.94, 329.63], [130.81, 196, 293.66]][Math.floor(context.currentTime / 4) % 4];
    for (const frequency of notes) {
      const oscillator = context.createOscillator(), gain = context.createGain();
      oscillator.frequency.value = frequency; oscillator.connect(gain); gain.connect(bgmGain);
      gain.gain.setValueAtTime(0, context.currentTime); gain.gain.linearRampToValueAtTime(.2, context.currentTime + .5); gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + 3.8);
      oscillator.start(); oscillator.stop(context.currentTime + 4);
    }
  }
  function stopEffect() { activeEffect?.pause(); if (activeEffect) activeEffect.currentTime = 0; activeEffect = null; }
  function sync() { const settings = getSettings(); if (bgmGain) bgmGain.gain.value = quiet() || !settings.bgm ? 0 : settings.bgmVolume / 100 * .035; if (quiet() || !settings.sfx) stopEffect(); }
  function play(name = 'click') {
    if (quiet() || !getSettings().sfx || !files[name]) return;
    const now = performance.now(); if (now - lastEffect < 65 && name === 'click') return;
    lastEffect = now; stopEffect();
    let player = players.get(name);
    if (!player) { player = new Audio('/assets/audio/' + files[name]); player.preload = 'auto'; players.set(name, player); }
    player.volume = name === 'success' ? .35 : .24; activeEffect = player; player.play().catch(() => {});
  }
  document.addEventListener('visibilitychange', sync);
  return {
    start() { if (disposed) return; try { ensure().resume().catch(() => {}); sync(); if (!timer) { chord(); timer = setInterval(chord, 4000); } } catch {} },
    sync, play, tap(success = false) { play(success ? 'success' : 'click'); },
    setDucked(value) { ducked = !!value; sync(); },
    dispose() { disposed = true; clearInterval(timer); document.removeEventListener('visibilitychange', sync); sync(); context?.close().catch(() => {}); },
  };
}
