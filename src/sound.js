import { createThemeEffects } from './theme-effects.js';
// 모든 효과음은 theme-effects.js가 합성한다. retry는 오답·다시 생각해 볼 때 쓰는 낮고 부드러운 소리다.
const kinds = new Set(['click', 'capture', 'place', 'discover', 'success', 'hint', 'retry']);
// 배경음은 사용자가 Suno로 만든 두 곡이다(원본 references/suno). 메인 테마는 반복, 파이널은 한 번 재생한다.
// 파이널이 끝난 뒤에도 파이널 화면(엔딩·인증서·지도 피날레 창)에 머물면 메인 테마를 낮게(×0.45) 잇는다.
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
  // 스테이지 열림(application.js): 잠금이 풀리는 소리에 작은 종 반짝임을 0.12초 뒤 겹친다.
  open: ['open-01.mp3', .4, 1],
  openSparkle: ['twinkle-03.mp3', .35, 1],
  // 달빛 길 3D(moon-path-ui.js): 점프와 개울에 빠질 때. 틀린 문에 부딪힐 때는 contact를 쓴다.
  jump: ['wind-whoosh-03.mp3', .2, 1],
  splash: ['water-splash-02.mp3', .4, 1],
};
// 지도·달빛 길 발자국: 두 파일을 번갈아, 밤하늘이라 조금 높게(×1.1) 내고 걸음마다 ±6% 안에서 바꾼다.
// 음량은 대사(1.0) 기준 0.15, 대사가 나오는 동안에는 그 절반이다.
export const stepCue = { files: ['step-01.mp3', 'step-02.mp3'], gain: .15, rate: 1.1, spread: .06 };
// 지도 전투 효과음(휘두르기·명중·퇴장·등장·접촉)은 인물 목소리 덕킹으로 꺼지거나 막히지 않는다. 음소거·효과음 끄기·숨은 탭은 그대로 따른다.
// 격퇴 차임과 성취 카드 효과음은 이 예외에 넣지 않는다.
const combatCues = new Set(['swing', 'hit1', 'hit2', 'heavy', 'exit', 'appear', 'contact']);
/** Map encounter kinds (swing, hit, heavy, exit, appear, contact, victory) → cue names; hit 2 is a lower, stronger take. */
export function mapCueName(kind, hits = 0) { return kind === 'hit' ? (hits === 2 ? 'hit2' : 'hit1') : mapCues[kind] ? kind : null; }
export function createSound(getSettings) {
  let music, track = 'main', finaleDone = false, started = false, disposed = false, ducked = false, lastEffect = 0, fade = 0;
  // 배경음을 줄이는 이유별 이름표(대사 'voice', 환영 음성 'welcome', 개념영상 'concept'). 전부 빠져야 평소 크기로 돌아간다.
  const duckers = new Set();
  const effects = createThemeEffects('sky', () => ({ muted: quiet(), enabled: getSettings().sfx, volume: .8 }));
  function quiet() { return disposed || ducked || document.hidden || getSettings().muted; }
  function silent(name) { return combatCues.has(name) ? disposed || document.hidden || getSettings().muted : quiet(); }
  function musicLevel() {
    const settings = getSettings();
    if (disposed || !started || document.hidden || settings.muted || !settings.bgm || !settings.bgmVolume) return 0;
    // 인물 목소리·내레이션·개념영상이 나오는 동안에는 멈추지 않고 1/4로 줄인다.
    return Math.min(1, settings.bgmVolume / 100 * 1.2) * (ducked ? .25 : 1) * (track === 'finale' && finaleDone ? .45 : 1);
  }
  function stopFade() { clearInterval(fade); fade = 0; }
  // 줄이고 되돌릴 때는 0.2초에 걸쳐 바꾼다. 처음 틀 때, 곡이 바뀔 때, 멈췄다 다시 틀 때는 바로 맞춘다.
  function glide(level) {
    stopFade();
    const player = music, from = player.volume; if (from === level) return;
    let step = 0;
    fade = setInterval(() => { step++; player.volume = step >= 8 ? level : from + (level - from) * step / 8; if (step >= 8) stopFade(); }, 25);
  }
  function syncMusic() {
    const level = musicLevel(), file = track === 'finale' && finaleDone ? 'main' : track;
    if (!level) { stopFade(); music?.pause(); return; }
    if (!music || music.dataset.track !== file) {
      stopFade(); music?.pause();
      music = new Audio(musicFiles[file]); music.dataset.track = file; music.loop = file === 'main'; music.preload = 'auto';
      music.onended = () => { if (track === 'finale' && music?.dataset.track === 'finale') { finaleDone = true; syncMusic(); } };
      music.volume = level;
    } else if (music.paused) { stopFade(); music.volume = level; }
    else glide(level);
    if (music.paused) music.play().catch(() => {});
  }
  let sampleContext; const raw = new Map(), decoded = new Map(), voices = new Map();
  function samples() {
    if (sampleContext) return sampleContext;
    const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
    try { sampleContext = Context ? new Context() : null; } catch { sampleContext = null; }
    return sampleContext;
  }
  function fetchFile(file) {
    if (!file) return Promise.resolve(null);
    if (!raw.has(file)) raw.set(file, fetch(SFX_BASE + file).then(r => r.ok ? r.arrayBuffer() : null).catch(() => null));
    return raw.get(file);
  }
  function bufferFor(file) {
    const context = sampleContext; if (!file || !context) return Promise.resolve(null);
    if (!decoded.has(file)) decoded.set(file, fetchFile(file).then(data => data && new Promise(done => context.decodeAudioData(data.slice(0), done, () => done(null)))).catch(() => null));
    return decoded.get(file);
  }
  function stopSamples(keepCombat = false) { for (const [name, voice] of voices) { if (keepCombat && combatCues.has(name)) continue; try { voice.stop(); } catch {} voices.delete(name); } }
  function cue(name) {
    const entry = mapCues[name];
    if (!entry || silent(name) || !getSettings().sfx || !started) return;
    const context = samples(); if (!context) return;
    if (context.state === 'suspended') context.resume().catch(() => {});
    const asked = performance.now();
    bufferFor(entry[0]).then(buffer => {
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
  // 발자국은 따로 한 줄이다. 다른 소리를 끊지 않고, UI 소리나 전투·카드 소리에 끊기지도 않는다.
  let stepCount = 0, stepVoice = null;
  const stepSilent = () => disposed || !started || document.hidden || getSettings().muted || !getSettings().sfx;
  function stopStep() {
    const voice = stepVoice; stepVoice = null; if (!voice) return;
    // 앞 걸음의 꼬리는 0.03초에 걸쳐 줄여 딱 끊기는 소리가 나지 않게 한다.
    try { const now = sampleContext.currentTime; voice.gain.gain.setValueAtTime(voice.gain.gain.value, now); voice.gain.gain.linearRampToValueAtTime(0, now + .03); voice.source.stop(now + .04); } catch {}
  }
  function step() {
    if (stepSilent()) return;
    const context = samples(); if (!context) return;
    if (context.state === 'suspended') context.resume().catch(() => {});
    const file = stepCue.files[stepCount++ % stepCue.files.length], asked = performance.now();
    bufferFor(file).then(buffer => {
      // 늦게 도착한 걸음(첫 내려받기)은 다음 걸음과 겹치지 않게 버린다.
      if (!buffer || stepSilent() || context.state !== 'running' || performance.now() - asked > 150) return;
      stopStep();
      const source = context.createBufferSource(), gain = context.createGain();
      source.buffer = buffer; source.playbackRate.value = stepCue.rate * (1 + (Math.random() * 2 - 1) * stepCue.spread);
      gain.gain.value = stepCue.gain * (ducked ? .5 : 1);
      source.connect(gain); gain.connect(context.destination);
      const voice = { source, gain };
      source.onended = () => { source.disconnect(); gain.disconnect(); if (stepVoice === voice) stepVoice = null; };
      stepVoice = voice; source.start();
    }).catch(() => {});
  }
  function sync() {
    syncMusic();
    // 목소리 덕킹만으로는 울리고 있는 전투 효과음을 끊지 않는다.
    if (quiet() || !getSettings().sfx) { effects.stop(); stopSamples(getSettings().sfx && !silent('hit1')); }
    if (stepSilent()) stopStep();
  }
  function play(name = 'click') {
    if (quiet() || !getSettings().sfx || !kinds.has(name)) return;
    const now = performance.now(); if (now - lastEffect < 65 && name === 'click') return;
    // UI 소리는 앞선 UI 소리만 끊는다(theme-effects의 play가 한다). 전투·카드 샘플과 발자국은 끝까지 울린다.
    lastEffect = now; effects.play(name);
  }
  document.addEventListener('visibilitychange', sync);
  return {
    start() { if (disposed) return; started = true; try { effects.unlock(); const context = samples(); if (context?.state === 'suspended') context.resume().catch(() => {}); for (const file of raw.keys()) bufferFor(file); } catch {} sync(); },
    /** Download the footsteps and the stage-open sound while the map is open, and the battle and card cues too while villains remain. */
    preload(combat = true) {
      const files = combat ? Object.values(mapCues).map(entry => entry[0]) : [mapCues.open[0], mapCues.openSparkle[0]];
      for (const file of new Set([...files, ...stepCue.files])) { if (sampleContext) bufferFor(file); else fetchFile(file); }
    },
    mapCue(kind, hits) { const name = mapCueName(kind, hits); if (name) cue(name); },
    /** One footstep of the walking hero (map, moon path). */
    step,
    /** A newly opened facility on the map: the unlock, then a small bell sparkle 0.12 s later. */
    stageOpen() { cue('open'); setTimeout(() => cue('openSparkle'), 120); },
    /** Cut the map cues still ringing (the card set jingle) when the finale theme takes over. */
    stopCues: stopSamples,
    sync, play, tap(success = false) { play(success ? 'success' : 'click'); },
    setDucked(value, reason = 'voice') { if (value) duckers.add(reason); else duckers.delete(reason); ducked = duckers.size > 0; sync(); },
    setMusic(next) { if (next === track) return; track = next; if (next === 'finale') finaleDone = false; sync(); },
    dispose() { disposed = true; stopFade(); effects.dispose(); stopSamples(); stopStep(); sampleContext?.close().catch(() => {}); document.removeEventListener('visibilitychange', sync); sync(); music = null; },
  };
}
