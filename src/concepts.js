import { lunarModelVoice } from './lunar-model.js';
import { mountNarrationControl } from './narration.js';
import {bindConceptFocus} from './concept-focus.js';
// 영상 원본: films/ (HyperFrames). 자막 시각 = 영상 장면 경계(films/kit/kit.mjs CUES), tests/concept-films.test.js가 일치를 확인한다.
export const concepts = {
  1: { title: '같은 달, 더 자세히 보기', seconds: 16, cues: [
    [0, '배율을 높이면 달이 더 커지는 걸까요?'],
    [3.6, '같은 달을 1배와 2배로 찍어 비교해요.'],
    [8, '어두운 곳, 밝은 곳, 둥근 구덩이가 자세히 보여요.'],
    [12.2, '달이 커진 것이 아니라, 원래 있던 무늬가 자세히 보이는 거예요.'],
  ], steps: ['질문', '배율 비교', '표면의 특징', '같은 달'], terms: ['배율', '어두운 곳', '밝은 곳', '구덩이', '무늬', '달'] },
  2: { title: '여러 날의 달을 이어 보면', seconds: 16, cues: [
    [0, '여러 날 관찰한 달은 어떻게 달라질까요?'],
    [3.6, '처음에는 오른쪽이 밝고, 밝은 부분이 점점 커져요.'],
    [8, '보름달 뒤에는 왼쪽이 밝고, 밝은 부분이 작아져요.'],
    [12.2, '달 모양은 약 30일마다 같은 순서로 바뀌어서 다음 모습을 예상할 수 있어요.'],
  ], steps: ['질문', '차오르는 달', '줄어드는 달', '되풀이'], terms: ['오른쪽', '왼쪽', '밝은 부분', '보름달', '30일', '예상'] },
  3: { title: '태양과 여덟 행성', seconds: 16, cues: [
    [0, '태양 둘레에는 어떤 천체들이 있을까요?'],
    [3.6, '태양에서 가까운 순서로 여덟 행성이 있어요. 지구도 행성이에요.'],
    [8, '표면, 줄무늬, 고리처럼 행성마다 특징이 달라요.'],
    [12.2, '태양과 그 둘레를 도는 행성 등을 태양계라고 해요. 크기와 거리는 모형이에요.'],
  ], steps: ['질문', '가까운 순서', '행성의 특징', '태양계'], terms: ['태양', '행성', '태양계', '줄무늬', '고리', '모형'] },
  4: { title: '빛은 어디에서 올까?', seconds: 16, cues: [
    [0, '밤하늘에서 밝게 보이면 모두 별일까요?'],
    [3.6, '태양빛을 가리면 행성도 어둡게 보여요.'],
    [8, '태양 같은 별은 스스로 빛을 내고, 행성은 태양빛을 반사해요.'],
    [12.2, '밝기나 색이 아니라, 빛이 어디에서 오는지로 판단해요.'],
  ], steps: ['질문', '빛 가리기', '빛의 근원', '판단 근거'], terms: ['별', '스스로 빛', '행성', '반사', '빛'] },
  5: { title: '같은 별, 다양한 패턴', seconds: 16, cues: [
    [0, '북극성 주변의 별들은 어떻게 알아볼까요?'],
    [3.6, '밝은 별들을 선으로 이으면 모양이 보여요.'],
    [8, '북두칠성과 카시오페이아자리 사이에 북극성이 있어요.'],
    [12.2, '선은 사람이 이어 그린 표현이에요. 별의 배열을 보고 패턴을 찾아요.'],
  ], steps: ['질문', '별 잇기', '북극성 주변', '사람이 그은 선'], terms: ['북극성', '북두칠성', '카시오페이아자리', '선', '배열', '패턴'] },
};

export function mountConcept(host, number, { reduced = false, sound, onClose, audible = false, volume = 1, narration = null } = {}) {
  const clip = concepts[number];
  const base = `/assets/concepts/stage-${number}`;
  host.innerHTML = `${number === 2 ? `<aside class="phase-model-scope"><p>${lunarModelVoice.text}</p><span data-phase-model-voice></span></aside>` : ''}<div class="concept-picture"><video playsinline controls preload="metadata" poster="${base}.webp" aria-label="${clip.title} · 개념영상 ${clip.seconds}초"><source src="${base}.webm" type="video/webm"><source src="${base}.mp4" type="video/mp4"></video><img class="concept-end" src="${base}.webp" alt="${clip.title} 정리 장면" hidden></div><p class="concept-caption" role="status" aria-live="polite"></p><div class="concept-dots" aria-hidden="true">${clip.cues.map(() => '<i></i>').join('')}</div><ol class="concept-fallback" hidden>${clip.cues.map(([, text]) => `<li>${text}</li>`).join('')}</ol><button class="btn primary concept-play">${reduced ? '영상 재생' : '다시 보기'}</button>`;
  const video = host.querySelector('video');
  const scopeVoiceCleanup=number===2&&narration?mountNarrationControl(host.querySelector('[data-phase-model-voice]'),lunarModelVoice.id,narration,{autoplay:false,compact:true}):()=>{};
  host.querySelector('[data-phase-model-voice]')?.addEventListener('click',()=>video.pause(),{capture:true});
  // 효과음 설정이 켜져 있을 때만 영상 효과음을 낸다(Kenney 효과음뿐, 음악·대사 없음). 크기는 효과음 크기 설정을 따른다.
  video.muted = !audible;
  video.volume = volume;
  const end = host.querySelector('.concept-end');
  const play = host.querySelector('.concept-play');
  let lastCue = -1, closed = false, failed = false, pendingCue = -1;
  // 자막은 영상 그림 안에 입혀 두었다(docs/concept-captions-20261118). 줄마다 루미 음성(concept-N-M)이 나오고,
  // 앞 줄 음성이 아직 나오는 중에 다음 자막 경계(또는 영상 끝)에 닿으면 영상을 잠깐 멈춰 음성이 끝날 때까지 기다린다.
  let hold = false, selfPause = false, releasing = false, watching = false, skipHold = -1, holdTimer = 0, awakeTimer = 0;
  // 재생 중에는 기본 조작 막대가 그림 속 자막을 덮지 않게 숨기고, 멈춤·끝·화면을 건드릴 때만 보인다.
  const live = on => { host.classList.toggle('film-live', on); syncControls(); };
  const syncControls = () => { video.controls = !host.classList.contains('film-live') || host.classList.contains('film-awake'); };
  const cueVoice = index => `concept-${number}-${index + 1}`;
  const voiceBusy = () => !!narration && String(narration.state.id).startsWith(`concept-${number}-`) && ['loading', 'playing'].includes(narration.state.status);
  const speak = () => { if (narration && !closed && (!video.paused || video.ended) && lastCue >= 0) narration.play(cueVoice(lastCue)); };
  let releaseFocus=()=>{};
  reduced=reduced||matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cueAt = time => Math.max(0, clip.cues.findLastIndex(([at]) => at <= time));
  function guard() {
    if (closed || failed || hold || video.paused || video.ended || !voiceBusy()) return;
    const index = cueAt(video.currentTime), boundary = index + 1 < clip.cues.length ? clip.cues[index + 1][0] : (video.duration || clip.seconds);
    if (index !== lastCue || skipHold === index + 1 || video.currentTime < boundary - 0.4) return;
    hold = true; selfPause = true; video.pause();
    holdTimer = setTimeout(release, 9000); // 음성이 멈춰 버려도 영상이 계속 서 있지 않게
  }
  function release() {
    clearTimeout(holdTimer);
    if (!hold) return;
    hold = false;
    if (closed || failed || document.hidden) return;
    releasing = true;
    video.play().catch(() => { releasing = false; });
  }
  function watchFrames() { if (watching || closed || !video.requestVideoFrameCallback) return; watching = true; video.requestVideoFrameCallback(() => { watching = false; guard(); if (!video.paused) watchFrames(); }); }
  function caption() {
    guard();
    const index = cueAt(video.currentTime);
    if (index === lastCue) return;
    if (index > lastCue && lastCue >= 0 && voiceBusy()) { pendingCue = index; return; }
    showCue(index);
  }
  function showCue(index) {
    pendingCue = -1;
    lastCue = index;
    host.querySelector('.concept-caption').textContent = clip.cues[lastCue][1];
    host.querySelectorAll('.concept-dots i').forEach((dot, position) => dot.classList.toggle('on', position === lastCue));
    speak();
  }
  // 자막 음성(목소리 스위치)이 나오는 동안 영상 소리를 ×0.3으로 줄이고, 끝나면 0.2초에 걸쳐 되돌린다.
  let duckFade = 0;
  function duckVideo() {
    const target = volume * (voiceBusy() ? .3 : 1), from = video.volume;
    clearInterval(duckFade); duckFade = 0;
    if (closed || Math.abs(from - target) < .001) return;
    let step = 0;
    duckFade = setInterval(() => { step++; video.volume = step >= 8 ? target : from + (target - from) * step / 8; if (step >= 8) { clearInterval(duckFade); duckFade = 0; } }, 25);
  }
  const unsubscribeVoice = narration?.subscribe(state => {
    duckVideo();
    if (closed || voiceBusy()) return;
    if (state.status === 'idle' && pendingCue >= 0) showCue(pendingCue);
    if (hold) release();
  }) || (() => {});
  function fallback() {
    if (closed || failed) return;
    failed = true;releaseFocus();clearTimeout(holdTimer);hold = false;host.classList.remove('film-frames');live(false);
    video.pause();
    video.querySelectorAll('source').forEach(source => source.removeAttribute('src'));
    video.load();
    video.hidden = true;
    end.hidden = false;
    play.hidden = true;
    host.querySelector('.concept-caption').hidden = true;
    host.querySelector('.concept-fallback').hidden = false;
  }
  async function start() {
    if (closed || failed) return;
    end.hidden = true;
    if (video.ended) video.currentTime = 0;
    try { await video.play(); play.hidden = true; }
    catch {
      if (!closed && !video.muted) { video.muted = true; try { await video.play(); play.hidden = true; return; } catch {} }
      if (!closed) { play.hidden = false; play.textContent = '영상 재생'; }
    }
  }
  const timer = setTimeout(() => { if (video.readyState < 1) fallback(); }, 7000);
  video.addEventListener('loadedmetadata', () => { clearTimeout(timer); if (!reduced) start(); }, { once: true });
  video.addEventListener('timeupdate', caption);
  video.addEventListener('play', () => {
    if (releasing) { releasing = false; return; }
    // 기다리는 중에 직접 재생을 누르면 이번 경계는 기다리지 않고 넘어간다(음성은 그대로).
    if (hold) { hold = false; clearTimeout(holdTimer); skipHold = cueAt(video.currentTime) + 1; return; }
    if (!voiceBusy()) speak();
  });
  video.addEventListener('pause', () => { if (selfPause) { selfPause = false; return; } live(false); if (!video.ended && voiceBusy()) narration.stop(); });
  video.addEventListener('playing', () => { live(true); watchFrames(); });
  video.addEventListener('loadeddata', () => { if (!failed) host.classList.add('film-frames'); }, { once: true });
  video.addEventListener('seeking', () => { skipHold = -1; if (hold) { hold = false; clearTimeout(holdTimer); if (voiceBusy()) narration.stop(); } });
  video.addEventListener('seeked', caption);
  video.addEventListener('ended', () => { live(false); skipHold = -1; end.hidden = false; play.hidden = false; play.textContent = '다시 보기'; });
  const wake = () => { host.classList.add('film-awake'); syncControls(); clearTimeout(awakeTimer); awakeTimer = setTimeout(() => { host.classList.remove('film-awake'); syncControls(); }, 2500); };
  for (const type of ['pointermove', 'pointerdown', 'focusin']) host.addEventListener(type, wake);
  video.addEventListener('error', fallback);
  play.addEventListener('click', start);
  function visibility() { if (document.hidden) { video.pause(); play.hidden = false; play.textContent = '이어서 재생'; } }
  document.addEventListener('visibilitychange', visibility);
  sound?.setDucked(true, 'concept'); // 자막 음성이 한 줄 끝나도 영상이 열려 있는 동안은 줄인 채로 둔다
  caption();
  releaseFocus=bindConceptFocus(host,video,{steps:clip.cues.map(([at],i)=>({at,term:clip.steps[i]})),terms:clip.terms,caption:host.querySelector('.concept-caption'),anchor:host.querySelector('.concept-picture'),controls:false,reduced});
  return () => {
    scopeVoiceCleanup();if(narration?.state.id===lunarModelVoice.id)narration.stop();releaseFocus();closed = true;clearInterval(duckFade);unsubscribeVoice();if (voiceBusy()) narration.stop();
    clearTimeout(timer);clearTimeout(holdTimer);clearTimeout(awakeTimer);
    for (const type of ['pointermove', 'pointerdown', 'focusin']) host.removeEventListener(type, wake);
    document.removeEventListener('visibilitychange', visibility);
    video.pause();
    video.querySelectorAll('source').forEach(source => source.removeAttribute('src'));
    video.removeAttribute('src');
    video.load();
    sound?.setDucked(false, 'concept');
    onClose?.();
  };
}
