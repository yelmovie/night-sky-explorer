import { bodies, patternRegions, planets, solarOrder } from './data.js';
import { firstReady, stageReady, photoReady } from './state.js';

const regions = ['cassiopeia', 'dipper'];
const hasText = value => typeof value === 'string' && value.trim().length >= 3;
const comparisonReady = card => hasText(card.observation) && new Set(card.spots
  .filter(spot => Number.isFinite(spot.x) && Number.isFinite(spot.y) && Math.hypot(spot.x - 50, spot.y - 50) < 49)
  .map(spot => `${spot.x}:${spot.y}`)).size >= 2;
const predictionReady = value => value.original && Number.isFinite(value.original.amount) &&
  value.original.amount >= 0 && value.original.amount <= 100 && ['left', 'right'].includes(value.original.side) &&
  value.revealed && value.overlay && hasText(value.reflection);
const lineCount = (lines, stars) => new Set((lines || []).filter(line => line.length === 2 &&
  line[0] !== line[1] && line.every(id => stars.includes(id))).map(line => [...line].sort().join(':'))).size;

// This only chooses the next useful UI action. State remains the authority for completion.
export function getStageAction(state, round = 0) {
  if (!/^s[1-5][ab]$/.test(state.scene)) return null;
  const number = +state.scene[1], first = state.scene.endsWith('a'), drafts = state.drafts;
  const ready = first ? firstReady(state, number) : stageReady(state, number);
  const result = { label: first ? '다음 활동으로' : '연구 기록 완성', action: first ? 'next' : 'complete', disabled: !ready };
  if (ready) return result;
  let done, labels;
  switch (state.scene) {
    case 's1b':
      done = drafts.moon.comparisons.map(comparisonReady);
      labels = ['첫 비교 카드로', '다음 비교 카드로'];
      break;
    case 's2b':
      done = [14, 24].map(day => predictionReady(drafts.phases.predictions[day]));
      labels = ['14일째 예상으로', '24일째 예상으로'];
      break;
    case 's3b':
      done = [solarOrder.every((id, index) => drafts.planets.order[index] === id), true];
      labels = ['행성 순서 맞추기', '선택 탐구'];
      break;
    case 's4a':
      done = [0, 1].map(group => bodies.slice(group * 4, group * 4 + 4).every(body => drafts.classification.viewed.includes(body.id)));
      labels = ['천체 묶음 하나 살펴보기', '천체 묶음 둘 살펴보기'];
      break;
    case 's5a':
      done = regions.map(region => patternRegions[region].stars.filter(id => drafts.pattern.observed.includes(id)).length >= 3);
      labels = ['위쪽 별 무리로', '아래쪽 별 무리로'];
      break;
    case 's5b':
      done = regions.map(region => {
        const value = drafts.pattern.cases[region], stars = patternRegions[region].stars;
        return lineCount(value.original, stars) >= 2 && lineCount(value.lines, stars) >= 2 && value.compared && hasText(value.reflection);
      });
      labels = ['위쪽 별 패턴으로', '아래쪽 별 패턴으로'];
      break;
    default: return result;
  }
  const current = round === 1 ? 1 : 0, other = 1 - current;
  return done[current] && !done[other]
    ? { label: labels[other], action: `activity-round-${other}`, disabled: false, round: other }
    : result;
}

export function getLearningGuide(state, ui) {
  const round = ui.round || 0, d = state.drafts;
  const next = getStageAction(state, round);
  if (next && !next.disabled) return { target: '#stage-next', text: next.round === undefined ? `준비됐어요! ‘${next.label}’를 눌러요.` : `이제 ‘${next.label}’를 눌러요.` };
  switch (state.scene) {
    case 's1a': {
      const m = d.moon;
      if (Math.abs(m.x) > 12) return { target: `[data-learning="pan-${m.x > 0 ? 'left' : 'right'}"]`, text: '방향 버튼으로 달을 가운데에 놓아요.' };
      if (Math.abs(m.y) > 12) return { target: `[data-learning="pan-${m.y > 0 ? 'up' : 'down'}"]`, text: '방향 버튼으로 달을 가운데에 놓아요.' };
      if (Math.abs(m.focus - 72) > 12) return { target: '#moon-focus', text: '초점 막대로 달을 선명하게 맞춰요.' };
      const sameZoom = m.photos.some((p, index) => index !== round && Math.abs(p.zoom - m.zoom) < .09);
      if (!photoReady(m) || sameZoom) return { target: '#moon-zoom', text: '배율 막대를 움직여 크기를 바꿔요.' };
      if (round === 1 && !m.photos[0]) return { target: '[data-learning="round-0"]', text: '‘전체 모습’에서 첫 사진을 담아요.' };
      return { target: '#capture-moon', text: '선명해졌어요! ‘사진 담기’를 눌러요.' };
    }
    case 's1b':
      return d.moon.comparisons[round].spots.length < 2
        ? { target: '.surface-targets', text: '서로 다른 위치 두 곳을 눌러요.' }
        : { target: '#moon-observation', text: '두 그림에서 발견한 차이를 써요.' };
    case 's2a': {
      if (!d.phases.captures.includes(d.phases.day)) return { target: '#capture-phase', text: `${d.phases.day}일째 달을 보고 ‘이 모습 기록’을 눌러요.` };
      const day = [3, 7, 10, 17, 21, 25].find(value => !d.phases.captures.includes(value));
      return { target: `[data-learning="seek-day-${day}"]`, text: `잘 담았어요! 다음은 ${day}일째를 눌러요.` };
    }
    case 's2b':
      return d.phases.predictions[round ? 24 : 14].revealed
        ? { target: '#phase-reflection', text: '예상과 자료를 비교하고 생각을 써요.' }
        : { target: '[data-learning="reveal-phase"]', text: '밝은 부분을 예상하고 ‘예상 저장 · 관측’을 눌러요.' };
    case 's3a':
      return { target: '#planet-feature', text: `${planets.find(p => p.id === d.planets.selected)?.name}의 그림을 보고 특징을 골라요.` };
    case 's3b':
      return ui.piece
        ? { target: round ? '.group-targets' : '.order-slots', text: round ? '조사 자료를 보고 어울리는 무리를 눌러요.' : '조사 자료를 보고 놓을 자리를 눌러요.' }
        : { target: '.piece-tray', text: '아래에서 놓고 싶은 천체를 골라요.' };
    case 's4a': {
      const body = bodies.slice(round * 4, round * 4 + 4).find(item => !d.classification.viewed.includes(item.id));
      return { target: `[data-learning="body-${body.id}"]`, text: `‘${body.name}’을 눌러 빛이 어디서 오는지 봐요.` };
    }
    case 's4b': {
      const body = bodies[round * 4 + (ui.body || 0) % 4];
      return d.classification.answers[body.id]?.kind
        ? { target: '.reason-choices', text: '빛이 어디서 오는지 근거를 골라요.' }
        : { target: '.claim-tray', text: `${body.name}은 별일까요, 행성일까요? 이름표를 골라요.` };
    }
    case 's5a':
      return { target: '#star-view', text: '별을 하나씩 눌러요. 두 구역에서 여섯 개를 살펴봐요.' };
    case 's5b': {
      const card = d.pattern.cases[regions[round]];
      if (card.lines.length < 2) return { target: '#star-view', text: '별을 차례로 눌러 나만의 선 두 개를 이어요.' };
      if (card.original) return { target: '#pattern-reflection', text: '내 선과 기준선을 비교해 같은 점·다른 점을 써요.' };
      return { target: '[data-learning="compare-pattern"]', text: '‘패턴 저장 · 기준 비교’를 눌러요.' };
    }
    default: return null;
  }
}
