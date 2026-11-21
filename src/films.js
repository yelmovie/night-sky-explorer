// 인트로·엔딩 영상(2026-11-21): 구글 플로우(Veo) 장면 3개를 교차 페이드로 잇고 일레븐랩스 대사·자막을 입힌 24초 영상.
// 대사와 자막은 영상 안에 들어 있어 따로 재생하지 않는다. 영상이 나오는 동안 배경음은 1/4로 줄인다(소리 규칙과 같음).
export const films = {
  intro: {
    title: '프롤로그 · 별빛 관측 연구소',
    transcript: [
      '루미: 별빛 관측 연구소의 밤이에요. 오늘도 하늘은 맑고 고요해요.',
      '루미: 그런데 연구소 장치들이 엉뚱한 데이터를 보내기 시작했어요!',
      '별빛 가림이: 히히, 망원경 덮개를 꽉 닫아 놨지!',
      '별여우 연구관: 신입 연구원, 기다리고 있었어. 우리 연구소를 함께 고쳐 줄래?',
    ],
  },
  final: {
    title: '엔딩 · 연구소 복구',
    transcript: [
      '루미: 연구원이 직접 관찰하고 검증한 다섯 개의 관측 기록이 모였어요.',
      '루미: 보정 링이 기준에 맞춰지자 코어가 빛나고 천문 돔이 열려요.',
      '별여우 연구관: 연구소가 다시 정확한 밤하늘을 기록하기 시작했어. 이건 네가 직접 관찰하고 검증한 결과야.',
    ],
  },
};

const base = name => `/assets/films/${name}`;

export function filmMarkup(name) {
  const film = films[name];
  return `<div class="film-picture"><video playsinline preload="auto" poster="${base(name)}.webp" aria-label="${film.title} 영상 · 대사 자막 포함"><source src="${base(name)}.webm" type="video/webm"><source src="${base(name)}.mp4" type="video/mp4"></video><button class="btn primary film-play" type="button" hidden>영상 재생</button></div><details class="film-transcript"><summary>대사 글로 보기</summary><ol>${film.transcript.map(line => `<li>${line}</li>`).join('')}</ol></details>`;
}

// host 안의 영상을 재생한다. audible이 false(음소거·목소리 끔)면 소리 없이 자막만 본다.
export function mountFilm(host, { audible = true, volume = 1, sound, onEnd } = {}) {
  const video = host.querySelector('video'), play = host.querySelector('.film-play');
  let ended = false, disposed = false;
  video.muted = !audible;
  video.volume = Math.max(0, Math.min(1, volume));
  sound?.setDucked(true, 'film');
  const finish = () => { if (ended || disposed) return; ended = true; onEnd?.(); };
  const start = async () => {
    try { await video.play(); play.hidden = true; }
    catch {
      // 자동 재생이 막히면 소리를 끄고 다시 시도하고, 그래도 안 되면 재생 버튼을 보인다.
      if (!video.muted) { video.muted = true; try { await video.play(); return; } catch {} }
      play.hidden = false; play.focus({ preventScroll: true });
    }
  };
  play.addEventListener('click', () => { play.hidden = true; video.play().catch(() => { play.hidden = false; }); });
  video.addEventListener('ended', finish);
  // 영상 파일을 못 받으면 멈추지 않고 다음 화면으로 넘어간다.
  video.addEventListener('error', finish, true);
  video.querySelectorAll('source').forEach(source => source.addEventListener('error', () => { if (source === video.querySelector('source:last-of-type')) finish(); }));
  const hidden = () => { if (document.hidden) video.pause(); };
  document.addEventListener('visibilitychange', hidden);
  start();
  return {
    skip() { if (!ended) { video.pause(); finish(); } },
    dispose() {
      disposed = true;
      document.removeEventListener('visibilitychange', hidden);
      video.pause(); video.removeAttribute('src'); video.querySelectorAll('source').forEach(source => source.remove()); video.load();
      sound?.setDucked(false, 'film');
    },
  };
}
