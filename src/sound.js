import { createThemeEffects } from './theme-effects.js';
// 모든 효과음은 theme-effects.js가 합성한다. retry는 오답·다시 생각해 볼 때 쓰는 낮고 부드러운 소리다.
const kinds = new Set(['click', 'capture', 'place', 'discover', 'success', 'hint', 'retry']);
// 배경음은 사용자가 Suno로 만든 두 곡이다(원본 references/suno). 메인 테마는 반복, 파이널은 한 번 재생 뒤 쉰다.
const musicFiles = { main: '/assets/audio/bgm/main-theme.mp3', finale: '/assets/audio/bgm/final-theme.mp3' };
// 지도 악당 전투 효과음은 CC0 녹음 파일이다(출처 public/assets/CREDITS.md). 이름 → [파일, 음량, 재생 속도].
const SFX_BASE = '/assets/audio/sfx/';
export const mapCues = {
  swing: ['twinkle-02.mp3', .35, 1],        // 별빛 공격이 날아가는 반짝임
  hit1: ['bell-ding-03.mp3', .35, 1],       // 1타: 맑은 종소리
  hit2: ['bell-ding-03.mp3', .42, .89],     // 2타: 같은 종을 조금 낮고 세게
  heavy: ['hit-heavy-02.mp3', .5, 1],       // 3타: 가장 강한 한 방
  exit: ['villain-exit-01.mp3', .45, 1],    // 악당이 별똥처럼 날아가며 퇴장
  appear: ['villain-appear-02.mp3', .22, 1],// 악당이 처음 보일 때 작게 '퐁'
  contact: ['hurt-bump-01.mp3', .3, 1],     // 아군이 악당에 닿아 움찔
  victory: ['reward-01.mp3', .45, 1],       // 모두 격퇴: 피날레 배경음 전에 끝나는 짧은 반짝 차임
  // 성취 카드(map-reward-cards.js): 같은 CC0 라이브러리 파일이고, 카드 공개는 격퇴 차임과 같은 파일을 쓴다.
  cardWhoosh: ['wind-whoosh-03.mp3', .3, 1],       // 카드가 날아올 때·보관함 칸으로 날아갈 때
  cardReveal: ['reward-01.mp3', .45, 1],           // 카드 공개(브론즈·실버·골드)
  cardEpic: ['reward-03.mp3', .45, 1],             // 카드 공개(홀로·레전드): 긴 징글
  cardSlot: ['pickup-01.mp3', .4, 1],              // 카드가 칸에 들어갈 때
  cardComplete: ['victory-jingle-01.mp3', .45, 1], // 다섯 장 완성
};
// 지도 전투 효과음(휘두르기·명중·퇴장·등장·접촉)은 인물 목소리 덕킹으로 꺼지거나 막히지 않는다. 음소거·효과음 끄기·숨은 탭은 그대로 따른다.
// 격퇴 차임과 성취 카드 효과음은 이 예외에 넣지 않는다.
const combatCues = new Set(['swing', 'hit1', 'hit2', 'heavy', 'exit', 'appear', 'contact']);
/** Map encounter kinds (swing, hit, heavy, exit, appear, contact, victory) → cue names; hit 2 is a lower, stronger take. */
export function mapCueName(kind, hits = 0) { return kind === 'hit' ? (hits === 2 ? 'hit2' : 'hit1') : mapCues[kind] ? kind : null; }
export function createSound(getSettings) {
  let music, track = 'main', finaleDone = false, started = false, disposed = false, ducked = false, lastEffect = 0;
  // 배경음을 줄이는 이유별 이름표(대사 'voice', 환영 음성 'welcome', 개념영상 'concept'). 전부 빠져야 평소 크기로 돌아간다.
  const duckers = new Set();
  const effects = createThemeEffects('sky', () => ({ muted: quiet(), enabled: getSettings().sfx, volume: .8 }));
  function quiet() { return disposed || ducked || document.hidden || getSettings().muted; }
  function silent(name) { return combatCues.has(name) ? disposed || document.hidden || getSettings().muted : quiet(); }
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
  let sampleContext; const raw = new Map(), decoded = new Map(), voices = new Map();
  function samples() {
    if (sampleContext) return sampleContext;
    const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
    try { sampleContext = Context ? new Context() : null; } catch { sampleContext = null; }
    return sampleContext;
  }
  function fetchCue(name) {
    const file = mapCues[name]?.[0]; if (!file) return Promise.resolve(null);
    if (!raw.has(file)) raw.set(file, fetch(SFX_BASE + file).then(r => r.ok ? r.arrayBuffer() : null).catch(() => null));
    return raw.get(file);
  }
  function bufferFor(name) {
    const file = mapCues[name]?.[0], context = sampleContext; if (!file || !context) return Promise.resolve(null);
    if (!decoded.has(file)) decoded.set(file, fetchCue(name).then(data => data && new Promise(done => context.decodeAudioData(data.slice(0), done, () => done(null)))).catch(() => null));
    return decoded.get(file);
  }
  function stopSamples(keepCombat = false) { for (const [name, voice] of voices) { if (keepCombat && combatCues.has(name)) continue; try { voice.stop(); } catch {} voices.delete(name); } }
  function cue(name) {
    const entry = mapCues[name];
    if (!entry || silent(name) || !getSettings().sfx || !started) return;
    const context = samples(); if (!context) return;
    if (context.state === 'suspended') context.resume().catch(() => {});
    const asked = performance.now();
    bufferFor(name).then(buffer => {
      // A cue that arrives late (first download) is dropped rather than heard out of sync.
      if (!buffer || silent(name) || !getSettings().sfx || context.state !== 'running' || performance.now() - asked > 250) return;
      voices.get(name)?.stop?.();
      const source = context.createBufferSource(), gain = context.createGain();
      source.buffer = buffer; source.playbackRate.value = entry[2]; gain.gain.value = entry[1];
      source.connect(gain); gain.connect(context.destination);
      source.onended = () => { source.disconnect(); gain.disconnect(); if (voices.get(name) === source) voices.delete(name); };
      voices.set(name, source); source.start();
    }).catch(() => {});
  }
  function stopEffect() { effects.stop(); stopSamples(); }
  function sync() {
    syncMusic();
    // 목소리 덕킹만으로는 울리고 있는 전투 효과음을 끊지 않는다.
    if (quiet() || !getSettings().sfx) { effects.stop(); stopSamples(getSettings().sfx && !silent('hit1')); }
  }
  function play(name = 'click') {
    if (quiet() || !getSettings().sfx || !kinds.has(name)) return;
    const now = performance.now(); if (now - lastEffect < 65 && name === 'click') return;
    lastEffect = now; stopEffect();
    effects.play(name);
  }
  document.addEventListener('visibilitychange', sync);
  return {
    start() { if (disposed) return; started = true; try { effects.unlock(); const context = samples(); if (context?.state === 'suspended') context.resume().catch(() => {}); } catch {} sync(); },
    /** Download the map cues while the map is open, before the first attack. */
    preload() { for (const name of Object.keys(mapCues)) { if (sampleContext) bufferFor(name); else fetchCue(name); } },
    mapCue(kind, hits) { const name = mapCueName(kind, hits); if (name) cue(name); },
    /** Cut the map cues still ringing (the card set jingle) when the finale theme takes over. */
    stopCues: stopSamples,
    sync, play, tap(success = false) { play(success ? 'success' : 'click'); },
    setDucked(value, reason = 'voice') { if (value) duckers.add(reason); else duckers.delete(reason); ducked = duckers.size > 0; sync(); },
    setMusic(next) { if (next === track) return; track = next; if (next === 'finale') finaleDone = false; sync(); },
    dispose() { disposed = true; effects.dispose(); stopSamples(); sampleContext?.close().catch(() => {}); document.removeEventListener('visibilitychange', sync); sync(); music = null; },
  };
}
