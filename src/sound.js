import { createThemeEffects } from './theme-effects.js';
// 모든 효과음은 theme-effects.js가 합성한다. retry는 오답·다시 생각해 볼 때 쓰는 낮고 부드러운 소리다.
const kinds = new Set(['click', 'capture', 'place', 'discover', 'success', 'hint', 'retry']);
// 배경음은 사용자가 Suno로 만든 두 곡이다(원본 references/suno). 메인 테마는 반복, 파이널은 한 번 재생 뒤 쉰다.
const musicFiles = { main: '/assets/audio/bgm/main-theme.mp3', finale: '/assets/audio/bgm/final-theme.mp3' };
export function createSound(getSettings) {
  let music, track = 'main', finaleDone = false, started = false, disposed = false, ducked = false, lastEffect = 0;
  const effects = createThemeEffects('sky', () => ({ muted: quiet(), enabled: getSettings().sfx, volume: .8 }));
  function quiet() { return disposed || ducked || document.hidden || getSettings().muted; }
  function musicLevel() {
    const settings = getSettings();
    if (disposed || !started || document.hidden || settings.muted || !settings.bgm || !settings.bgmVolume || (track === 'finale' && finaleDone)) return 0;
    // 인물 목소리·내레이션·개념영상이 나오는 동안에는 멈추지 않고 1/4로 줄인다.
    return Math.min(1, settings.bgmVolume / 100 * 1.2) * (ducked ? .25 : 1);
  }
  function syncMusic() {
    const level = musicLevel();
    if (!level) { music?.pause(); return; }
    if (!music || music.dataset.track !== track) {
      music?.pause();
      music = new Audio(musicFiles[track]); music.dataset.track = track; music.loop = track === 'main'; music.preload = 'auto';
      music.onended = () => { if (music?.dataset.track === 'finale') finaleDone = true; };
    }
    music.volume = level;
    if (music.paused) music.play().catch(() => {});
  }
  function stopEffect() { effects.stop(); }
  function sync() {
    syncMusic();
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
    start() { if (disposed) return; started = true; try { effects.unlock(); } catch {} sync(); },
    sync, play, tap(success = false) { play(success ? 'success' : 'click'); },
    setDucked(value) { ducked = !!value; sync(); },
    setMusic(next) { if (next === track) return; track = next; if (next === 'finale') finaleDone = false; sync(); },
    dispose() { disposed = true; effects.dispose(); document.removeEventListener('visibilitychange', sync); sync(); music = null; },
  };
}
