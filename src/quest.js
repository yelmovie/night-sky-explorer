import { chapters, bodies } from './data.js';
import { completedCount } from './state.js';
import { esc, icon, moonSVG, dayMoon, starChart } from './drawing.js';
import { planetImage, celestialImage } from './ui.js';

// Quest layer of design v2: incident → missions → evidence → world change → final mission → movie → certificate.
export const missionTag = n => `탐구 ${String(n).padStart(2, '0')}`;
export const evidenceTag = n => `관측 기록 ${String(n).padStart(2, '0')}`;
export const restorePercent = s => completedCount(s) * 18 + (s.core.restored && completedCount(s) === 5 ? 10 : 0);
export const npc = {
  start: '관측 데이터가 서로 맞지 않아 중앙 돔을 열 수 없어. 직접 관찰해서 기록을 다시 검증해 줄래?',
  report: '다섯 기록이 모두 확인됐어. 이제 이 자료를 중앙 관측 코어에 직접 연결해야 해.',
  ending: '연구소가 다시 정확한 밤하늘을 기록하기 시작했어. 이건 네가 직접 관찰하고 검증한 결과야.',
  keeper: '나는 기록원 루미야. 네가 만든 관측 기록은 내가 연구 키트에 차곡차곡 보관할게.',
};
export const inquiryStyles = {
  observer: { name: '꼼꼼한 관찰자', text: '확대하고, 여러 지점과 시점을 살피며 관측 기록을 모았어요.' },
  analyst: { name: '증거 분석가', text: '자료를 다시 열고 겹쳐 비교하며 근거를 확인했어요.' },
  persistent: { name: '끈질긴 연구원', text: '예상과 다른 결과를 보고 다시 관찰하고 고쳐 나갔어요.' },
  independent: { name: '스스로 해결한 연구원', text: '힌트를 거의 쓰지 않고 필요한 관찰을 스스로 해냈어요.' },
};
// Styles describe how a student worked; they are never ranked or graded.
export function inquiryStyle(stats = {}) {
  const value = key => Math.max(0, Number(stats[key]) || 0);
  const scores = [
    ['observer', value('observations') / 30],
    ['analyst', value('reviews') / 8],
    ['persistent', value('retries') / 6],
    ['independent', value('hints') <= 1 && value('observations') >= 20 ? 1.15 : 0],
  ];
  const [key] = scores.reduce((best, item) => item[1] > best[1] ? item : best);
  return { key, ...inquiryStyles[key] };
}
const list = value => Array.isArray(value) ? value : [];
// One short fact per evidence, read from the student's own saved record (v1 records included).
export function evidenceFact(n, data) {
  if (!data) return '';
  if (n === 1) return `관측사진 ${list(data.photos).length || (data.photo ? 1 : 0)}장 · 표면 비교 ${list(data.comparisons).length || 1}개`;
  if (n === 2) return `달 모습 ${list(data.captures).length}개 시점 · ${data.predictions ? '14·24일째' : '한 날짜'} 예상 검증`;
  if (n === 3) return `행성 ${Object.keys(data.records || {}).length}개 조사 · 태양과 8행성 모형`;
  if (n === 4) return `천체 ${bodies.filter(body => data.answers?.[body.id]?.kind === body.kind && data.answers?.[body.id]?.reason === body.evidence).length || list(data.viewed).length}개 근거 판별`;
  const lines = data.cases ? Object.values(data.cases).reduce((sum, item) => sum + list(item?.lines).length, 0) : list(data.lines).length;
  return `내 패턴 선 ${lines}개 · 기준 레이어와 비교`;
}
// A small picture of the record for the core replay, the movie and the final report.
export function evidenceVisual(n, data) {
  if (n === 1) return `<div class="ev-visual ev-moon">${moonSVG()}</div>`;
  if (n === 2) {
    const days = [...list(data?.captures)].sort((a, b) => a - b);
    const shown = days.length >= 3 ? [days[0], days[Math.floor(days.length / 2)], days.at(-1)] : [3, 10, 21];
    return `<div class="ev-visual ev-phases">${shown.map(day => dayMoon(day)).join('')}</div>`;
  }
  if (n === 3) return `<div class="ev-visual ev-planets">${celestialImage('sun', '', 'ev-sun')}${['earth', 'jupiter', 'saturn'].map(id => planetImage(id)).join('')}</div>`;
  if (n === 4) return `<div class="ev-visual ev-light">${celestialImage('sun', '')}${planetImage('venus')}</div>`;
  const lines = data?.cases?.cassiopeia?.lines || [];
  return `<div class="ev-visual ev-stars">${starChart({ lines, region: 'cassiopeia', interactive: false })}</div>`;
}
// fox.webp and rabbit.webp are pose sheets laid out on a 5×2 grid; a pose is picked by its cell.
const poses = {
  fox: { neutral: [0, 0], point: [2, 0], map: [3, 0], think: [4, 0], surprise: [0, 1], cheer: [1, 1], welcome: [2, 1] },
  // The rabbit sheet's lower row holds six uneven poses, so only its even top row is used.
  rabbit: { neutral: [0, 0], wave: [1, 0], point: [2, 0], write: [3, 0], scope: [4, 0], cheer: [1, 0] },
};
export const sprite = (who, pose = 'neutral', cls = '') => { const [col, row] = poses[who][pose] || poses[who].neutral; return `<i class="sprite sprite-${who} ${cls}" style="--col:${col};--row:${row}" aria-hidden="true"></i>`; };
export const npcLine = (who, text, pose = 'neutral') => `<div class="npc-line npc-${who}"><span class="npc-portrait">${sprite(who, pose)}</span><p><b>${who === 'fox' ? '별여우 연구관' : '달토끼 기록원 루미'}</b>${esc(text)}</p></div>`;
export const kitMeter = s => {
  const count = completedCount(s);
  return `<div class="kit-meter"><span>관측 데이터 확보</span><b>${count} / 5</b><div class="meter" role="progressbar" aria-label="관측 데이터 확보" aria-valuemin="0" aria-valuemax="5" aria-valuenow="${count}"><i style="width:${count * 20}%"></i></div></div>`;
};
export function introPanel(step, name) {
  if (step === 0) return {
    title: '연구소 경보 · 관측 데이터 충돌',
    body: `<div class="incident-board" role="list">${chapters.map(chapter => `<p role="listitem"><span class="incident-icon">${icon(chapter.icon, 24)}</span><span><b>${chapter.system}</b>${chapter.incident}</span><em>오류</em></p>`).join('')}</div><p class="incident-note">밤하늘에는 아무 문제가 없어요. 고장 난 것은 <b>연구소의 관측 데이터 시스템</b>이에요. 검증된 관측 기록 다섯 개가 모여야 중앙 천문 돔이 열려요.</p>`,
  };
  if (step === 1) return {
    title: '별여우 연구관의 의뢰',
    body: `${npcLine('fox', npc.start, 'think')}<div class="role-card"><small>오늘의 역할</small><strong>신입 별빛 관측 연구원</strong><span>${esc(name)}</span><p>관측하고, 비교하고, 예상하고, 근거를 찾아 기록을 다시 검증해요.</p></div>`,
  };
  return {
    title: '연구 키트를 받았어요',
    body: `${npcLine('rabbit', npc.keeper, 'wave')}<ol class="quest-steps">${chapters.map(chapter => `<li><b>${missionTag(chapter.id)}</b> ${chapter.title}<small>${evidenceTag(chapter.id)} · ${chapter.record}</small></li>`).join('')}</ol><p class="incident-note">다섯 기록을 모으면 중앙 관측 코어에서 마지막 미션이 열려요.</p>`,
  };
}
const movieScenes = [
  { at: 0, caption: '중앙 관측 코어에 오류가 났던 밤. 다섯 기록 시스템이 서로 다른 데이터를 보냈어요.' },
  { at: 3000, caption: '연구원이 직접 관찰하고 검증한 다섯 개의 관측 기록이 모였어요.' },
  { at: 8000, caption: '다섯 기록이 중앙 관측 코어의 알맞은 채널로 들어가요.' },
  { at: 13000, caption: '보정 링이 기준에 맞춰지자 코어가 빛나고 천문 돔이 열려요.' },
  { at: 18000, caption: '' },
];
export const MOVIE_LENGTH = 24000;
export function movieMarkup(s) {
  const records = chapters.map(chapter => `<figure class="movie-card" style="--i:${chapter.id - 1}">${evidenceVisual(chapter.id, s.evidence[chapter.id]?.data)}<figcaption><small>${evidenceTag(chapter.id)}</small>${chapter.record}<span>${evidenceFact(chapter.id, s.evidence[chapter.id]?.data)}</span></figcaption></figure>`).join('');
  return `<div class="final-movie" data-scene="0">
    <div class="movie-stage">
      <section class="movie-scene scene-error" aria-hidden="true"><div class="movie-room"></div><div class="error-lines">${chapters.map(chapter => `<p style="--i:${chapter.id - 1}">${icon(chapter.icon, 20)} ${chapter.system} · 데이터 충돌</p>`).join('')}</div></section>
      <section class="movie-scene scene-evidence" aria-hidden="true"><div class="movie-room dim"></div><div class="movie-cards">${records}</div></section>
      <section class="movie-scene scene-connect" aria-hidden="true"><div class="movie-room dim"></div><div class="movie-core"><img src="/assets/generated/core-dial-v3.webp" alt=""/><i class="movie-needle"></i></div>${chapters.map(chapter => `<span class="movie-channel" style="--i:${chapter.id - 1}">${icon(chapter.icon, 26)}</span>`).join('')}</section>
      <section class="movie-scene scene-dome" aria-hidden="true"><div class="movie-room"></div><img class="movie-dome" src="/assets/generated/dome-restored.webp" alt=""/><div class="movie-flash"></div></section>
      <section class="movie-scene scene-restored" aria-hidden="true"><img class="movie-dome" src="/assets/generated/dome-restored.webp" alt=""/><div class="movie-title"><small>관측 시스템 복구 완료</small><strong>탐구 완료</strong><span>연구소 복구 100%</span></div>${npcLine('fox', npc.ending, 'cheer')}${sprite('rabbit', 'cheer', 'movie-rabbit')}</section>
    </div>
    <p class="movie-caption" aria-live="polite">${movieScenes[0].caption}</p>
    <div class="movie-progress" aria-hidden="true"><i></i></div>
  </div>`;
}
// Timed playback; reduced motion shows the same scenes one step at a time.
export function mountMovie(host, { reduced, onEnd }) {
  const root = host.querySelector('.final-movie'), caption = host.querySelector('.movie-caption');
  let scene = 0, timers = [], ended = false;
  function show(index) {
    scene = index;
    root.dataset.scene = index;
    caption.textContent = movieScenes[index].caption || npc.ending;
  }
  function finish() { if (ended) return; ended = true; root.classList.add('is-ended'); onEnd?.(); }
  if (reduced) {
    root.classList.add('is-stepwise');
    show(0);
    return { next() { if (scene < movieScenes.length - 1) show(scene + 1); if (scene === movieScenes.length - 1) finish(); }, dispose() {} };
  }
  root.style.setProperty('--movie-length', MOVIE_LENGTH + 'ms');
  root.classList.add('is-playing');
  movieScenes.forEach((item, index) => timers.push(setTimeout(() => show(index), item.at)));
  timers.push(setTimeout(finish, MOVIE_LENGTH));
  return { next() { timers.forEach(clearTimeout); show(movieScenes.length - 1); root.classList.remove('is-playing'); finish(); }, dispose() { timers.forEach(clearTimeout); } };
}
