import { createThemeEffects } from './theme-effects.js';
// 모든 효과음은 theme-effects.js가 합성한다. retry는 오답·다시 생각해 볼 때 쓰는 낮고 부드러운 소리다.
const kinds = new Set(['click', 'capture', 'place', 'discover', 'success', 'hint', 'retry']);
export function createSound(getSettings) {
  let context, bgmGain, timer, activeEffect, disposed = false, ducked = false, storyMix = false, lastEffect = 0;
  const effects = createThemeEffects('sky', () => ({ muted: quiet(), enabled: getSettings().sfx, volume: .8 }));
  function ensure() { context ||= new AudioContext(); if (!bgmGain) { bgmGain = context.createGain(); bgmGain.connect(context.destination); } return context; }
  function quiet() { return disposed || ducked || document.hidden || getSettings().muted; }
  function musicLevel() {
    const settings = getSettings();
    if (disposed || document.hidden || settings.muted || !settings.bgm || (ducked && !storyMix)) return 0;
    return settings.bgmVolume / 100 * .035 * (ducked ? .25 : 1);
  }
  function chord() {
    if (!context || !musicLevel()) return;
    const notes = [[130.81, 196, 261.63], [146.83, 220, 293.66], [164.81, 246.94, 329.63], [130.81, 196, 293.66]][Math.floor(context.currentTime / 4) % 4];
    for (const frequency of notes) {
      const oscillator = context.createOscillator(), gain = context.createGain();
      oscillator.frequency.value = frequency; oscillator.connect(gain); gain.connect(bgmGain);
      gain.gain.setValueAtTime(0, context.currentTime); gain.gain.linearRampToValueAtTime(.2, context.currentTime + .5); gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + 3.8);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      oscillator.start(); oscillator.stop(context.currentTime + 4);
    }
  }
  function stopEffect() { effects.stop(); }
  function sync() {
    if (bgmGain) {
      const level = musicLevel();
      bgmGain.gain.cancelScheduledValues(context.currentTime);
      if (!level) bgmGain.gain.value = 0;
      else bgmGain.gain.setTargetAtTime(level, context.currentTime, .08);
    }
    if (quiet() || !getSettings().sfx) stopEffect();
  }
  function play(name = 'click') {
    if (quiet() || !getSettings().sfx || !kinds.has(name)) return;
    const now = performance.now(); if (now - lastEffect < 65 && name === 'click') return;
    lastEffect = now; stopEffect();
    effects.play(name);
  }
  document.addEventListener('visibilitychange', sync);
  return {
    start() { if (disposed) return; try { ensure().resume().catch(() => {}); effects.unlock(); sync(); if (!timer) { chord(); timer = setInterval(chord, 4000); } } catch {} },
    sync, play, tap(success = false) { play(success ? 'success' : 'click'); },
    setDucked(value) { ducked = !!value; sync(); },
    setStoryMix(value) { storyMix = !!value; sync(); },
    dispose() { disposed = true; effects.dispose(); clearInterval(timer); document.removeEventListener('visibilitychange', sync); sync(); context?.close().catch(() => {}); },
  };
}
