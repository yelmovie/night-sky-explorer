export const concepts = {
  1: { title: '같은 달, 더 자세히 보기', seconds: 10, cues: [
    [0, '배율을 높이면 같은 달의 표면이 더 크게 보여요.'],
    [3.3, '밝은 곳과 어두운 곳, 둥근 구덩이를 비교해요.'],
    [6.6, '달이 커진 것이 아니라, 원래 있던 무늬가 자세히 보이는 거예요.'],
  ] },
  2: { title: '여러 날의 달을 이어 보면', seconds: 10, cues: [
    [0, '여러 날 관찰한 달을 날짜 순서로 놓아요.'],
    [3.3, '밝게 보이는 부분이 커졌다가 작아져요.'],
    [6.6, '앞의 기록을 비교하면 다음 모습을 예상할 수 있어요.'],
  ] },
  3: { title: '태양과 여덟 행성', seconds: 10, cues: [
    [0, '태양 주위를 여덟 행성이 돌아요. 지구도 행성이에요.'],
    [3.3, '태양에서 가까운 순서와 각 행성의 특징을 함께 살펴봐요.'],
    [6.6, '표면·줄무늬·고리 같은 근거로 행성을 비교해요. 크기와 거리는 모형이에요.'],
  ] },
  4: { title: '빛은 어디에서 올까?', seconds: 10, cues: [
    [0, '태양과 다른 별은 스스로 빛을 내요.'],
    [3.3, '행성은 별에서 온 빛을 반사해서 보여요.'],
    [6.6, '밝기나 색만 보지 말고, 빛의 근원을 근거로 판단해요.'],
  ] },
  5: { title: '같은 별, 다양한 패턴', seconds: 10, cues: [
    [0, '먼저 별 사이의 간격과 방향을 관찰해요.'],
    [3.3, '같은 별을 서로 다르게 이어 볼 수 있어요.'],
    [6.6, '선은 사람이 더한 표현이에요. 별의 배열과 내 패턴을 비교해요.'],
  ] },
};

export function mountConcept(host, number, { reduced = false, sound, onClose } = {}) {
  const clip = concepts[number];
  const base = `/assets/concepts/stage-${number}`;
  host.innerHTML = `<div class="concept-picture"><video playsinline muted controls preload="metadata" poster="${base}.webp" aria-label="${clip.title} · 소리 없는 개념영상"><source src="${base}.webm" type="video/webm"><source src="${base}.mp4" type="video/mp4"></video><img class="concept-end" src="${base}.webp" alt="${clip.title} 정리 장면" hidden></div><p class="concept-caption" role="status" aria-live="polite"></p><div class="concept-dots" aria-hidden="true">${clip.cues.map(() => '<i></i>').join('')}</div><ol class="concept-fallback" hidden>${clip.cues.map(([, text]) => `<li>${text}</li>`).join('')}</ol><button class="btn primary concept-play">${reduced ? '영상 재생' : '다시 보기'}</button>`;
  const video = host.querySelector('video');
  const end = host.querySelector('.concept-end');
  const play = host.querySelector('.concept-play');
  let lastCue = -1, closed = false, failed = false;
  function caption() {
    const index = clip.cues.findLastIndex(([at]) => at <= video.currentTime);
    if (index === lastCue) return;
    lastCue = Math.max(0, index);
    host.querySelector('.concept-caption').textContent = clip.cues[lastCue][1];
    host.querySelectorAll('.concept-dots i').forEach((dot, position) => dot.classList.toggle('on', position === lastCue));
  }
  function fallback() {
    if (closed || failed) return;
    failed = true;
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
    catch { if (!closed) { play.hidden = false; play.textContent = '영상 재생'; } }
  }
  const timer = setTimeout(() => { if (video.readyState < 1) fallback(); }, 7000);
  video.addEventListener('loadedmetadata', () => { clearTimeout(timer); if (!reduced) start(); }, { once: true });
  video.addEventListener('timeupdate', caption);
  video.addEventListener('seeked', caption);
  video.addEventListener('ended', () => { end.hidden = false; play.hidden = false; play.textContent = '다시 보기'; });
  video.addEventListener('error', fallback);
  play.addEventListener('click', start);
  function visibility() { if (document.hidden) { video.pause(); play.hidden = false; play.textContent = '이어서 재생'; } }
  document.addEventListener('visibilitychange', visibility);
  sound?.setDucked(true);
  caption();
  return () => {
    closed = true;
    clearTimeout(timer);
    document.removeEventListener('visibilitychange', visibility);
    video.pause();
    video.querySelectorAll('source').forEach(source => source.removeAttribute('src'));
    video.removeAttribute('src');
    video.load();
    sound?.setDucked(false);
    onClose?.();
  };
}
