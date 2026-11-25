import { bodies, patternRegions, solarOrder } from './data.js';
import { firstReady, stageReady, photoReady } from './state.js';

const regions = ['cassiopeia', 'dipper'];
const hasFinal = word => (word.charCodeAt(word.length - 1) - 0xac00) % 28 > 0;
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
const lockedReasons = {
  s1a: '배율을 바꿔 사진 2장을 담으면 열려요.',
  s1b: '비교 카드 두 장에 서로 다른 곳 두 군데를 누르고 문장을 고르면 열려요.',
  s2a: '보름 전과 보름 뒤 날을 섞어 달을 6번 담으면 열려요.',
  s2b: '14일째와 24일째 모두 예상하고, 관측과 비교한 문장을 고르면 열려요.',
  s3a: '여섯 행성의 특징을 모두 찾아 기록하면 열려요.',
  s3b: '행성을 태양에서 가까운 순서대로 모두 놓으면 열려요.',
  s4a: '여덟 천체를 보고, 예상한 뒤 가림판을 가렸다 치우며 비교하면 열려요.',
  s4b: '천체마다 종류와 근거를 골라 모두 맞히면 열려요.',
  s5b: '두 별 무리에서 선을 두 개 이상 저장하고 기준과 비교해요. 다시 잇기는 선택이에요.',
};
export function getStageAction(state, round = 0) {
  if (!/^s[1-5][ab]$/.test(state.scene)) return null;
  const number = +state.scene[1], first = state.scene.endsWith('a'), drafts = state.drafts;
  const ready = first ? firstReady(state, number) : stageReady(state, number);
  const result = { label: first ? '다음 활동으로' : '연구 기록 완성', action: first ? 'next' : 'complete', disabled: !ready };
  if (ready) return result;
  // 잠긴 버튼 옆 이유 한 줄(B15, docs/reviews/COPY-DRAFT-20261121.md 제안 1). s5a는 조건이 북극성 찾기로 바뀌어 넣지 않았다.
  if (lockedReasons[state.scene]) result.reason = lockedReasons[state.scene];
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
    case 's5a':
    {
      // 두 무리에서 각각 2개 이상, 모두 6개를 채웠으면 남은 북극성 찾기로 바로 안내한다.
      const counts = regions.map(region => patternRegions[region].stars.filter(id => drafts.pattern.observed.includes(id)).length);
      const enough = counts.every(count => count >= 2) && counts[0] + counts[1] >= 6;
      done = [enough || counts[0] >= 3, enough || counts[1] >= 3, !!drafts.pattern.polaris?.found];
    }
      labels = ['위쪽 별 무리로', '아래쪽 별 무리로', '북극성 찾기로'];
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
  const current = Math.max(0, Math.min(done.length - 1, round || 0)), other = done.findIndex((value, index) => !value && index !== current);
  if (done[current] && other >= 0) { delete result.reason; return { label: labels[other], action: `activity-round-${other}`, disabled: false, round: other }; }
  return result;
}

export function getLearningGuide(state, ui) {
  const round = ui.round || 0, d = state.drafts;
  const next = getStageAction(state, round);
  if (state.scene === 's5a' && round === 2) {
    const p = d.pattern.polaris;
    if (p.found) return { target: next.disabled ? '#star-view' : '#stage-next', text: '북극성은 거의 움직이지 않아 북쪽을 알려 줘요.' };
    if (ui.polarisHint) return { target: '#star-view', text: ui.polarisHint };
    if (p.pointers.length < 2) return { target: '#star-view', text: '국자 끝의 메라크를 누른 뒤 두베를 눌러 이어요.' };
    return { target: '#star-view', text: '메라크에서 두베 쪽으로, 두베를 지나 두 별 간격의 약 5배를 더 가요.' };
  }
  if (next && !next.disabled) return { target: '#stage-next', text: next.round === undefined ? '관측을 마쳤어요.' : '이번 관측을 기록했어요.' };
  switch (state.scene) {
    case 's1a': {
      const m = d.moon;
      if (Math.abs(m.x) > 12 || Math.abs(m.y) > 12) return { target: '#scope-drag', text: '달을 손가락으로 끌어 가운데 원에 놓아요.' };
      if (Math.abs(m.focus - 72) > 12) return { target: '#moon-focus', text: '초점 막대로 달을 선명하게 맞춰요.' };
      const sameZoom = m.photos.some((p, index) => index !== round && Math.abs(p.zoom - m.zoom) < .09);
      if (!photoReady(m) || sameZoom) return { target: '#moon-zoom', text: '배율 막대를 움직여 크기를 바꿔요.' };
      if (round === 1 && !m.photos[0]) return { target: '[data-learning="round-0"]', text: '‘전체 모습’에서 첫 사진을 담아요.' };
      return { target: '#capture-moon', text: '선명해진 달을 사진으로 남겨요.' };
    }
    case 's1b':
      return d.moon.comparisons[round].spots.length < 2
        ? { target: '#surface-moon', text: '달 표면에서 서로 다른 두 곳을 눌러요.' }
        : { target: '.reflection-choices', text: '두 확대 그림을 비교하고 맞는 문장을 골라요.' };
    case 's2a': {
      const day = [3, 7, 10, 17, 21, 25].find(value => !d.phases.captures.includes(value));
      if (day === undefined) return { target: '#capture-phase', text: '막대로 다른 날도 살펴보고 담아 봐요.' };
      return { target: `[data-learning="seek-day-${day}"]`, text: '날짜를 눌러 그날의 달을 담아요.' };
    }
    case 's2b':
      return d.phases.predictions[round ? 24 : 14].revealed
        ? { target: '.reflection-choices', text: '겹친 그림을 보고 맞는 문장을 하나씩 골라요.' }
        : { target: ui.predictionAdjusted?.[round] ? '[data-learning="reveal-phase"]' : '.prediction-adjust', text: ui.predictionAdjusted?.[round] ? '예상과 실제 달을 비교해요.' : '달의 밝은 부분과 방향을 조절해요.' };
    case 's3a':
      if (!ui.three && !d.planets.records[d.planets.selected] && !ui.revealed?.[d.planets.selected]) return { target: '.planet-fog', text: '구름을 문질러 행성을 드러내요.' };
      return { target: '#planet-feature', text: '행성 그림에서 보이는 특징을 골라요.' };
    case 's3b':
      if (round === 0 && d.planets.order.every(Boolean) && !ui.piece)
        return { target: '.order-slots', text: '다시 살펴볼 자리를 눌러 천체를 꺼내요.' };
      return ui.piece
        ? { target: round ? '.group-targets' : '.order-slots', text: round ? '어울리는 무리를 골라요.' : '태양과의 거리를 비교해 놓을 자리를 골라요.' }
        : { target: '.piece-tray', text: '아래에서 놓을 천체를 골라요.' };
    case 's4a': {
      const body = bodies.find(item => !d.classification.viewed.includes(item.id));
      if (!body) {
        const trial=d.classification.lightTrial;
        if(!trial?.prediction)return {target:'.light-predictions',text:'태양빛을 가리기 전, 행성의 밝기를 예상해요.'};
        return {target:'[data-shield]',text:trial.observations.includes('covered')?'가림판을 치우고 밝기를 비교해요.':'가림판을 움직여 밝기를 살펴봐요.'};
      }
      return { target: `[data-learning="body-${body.id}"]`, text: `‘${body.name}’${hasFinal(body.name) ? '을' : '를'} 눌러 빛이 어디서 오는지 봐요.` };
    }
    case 's4b': {
      const body = bodies[round * 4 + (ui.body || 0) % 4];
      return d.classification.answers[body.id]?.kind
        ? { target: '.reason-choices', text: '빛이 어디서 오는지 근거를 골라요.' }
        : { target: '.claim-tray', text: `${body.name}${hasFinal(body.name) ? '은' : '는'} 별일까요, 행성일까요? 이름표를 골라요.` };
    }
    case 's5a':
      return { target: '#star-view', text: '별을 하나씩 눌러요. 두 구역에서 여섯 개를 살펴봐요.' };
    case 's5b': {
      const card = d.pattern.cases[regions[round]];
      if (card.lines.length < 2) return { target: '#star-view', text: '별을 차례로 눌러 나만의 선 두 개를 이어요.' };
      if (card.original) return { target: '.reflection-choices', text: '내 선과 노란 기준선을 비교하고 맞는 문장을 골라요.' };
      return { target: '[data-learning="compare-pattern"]', text: '완성한 패턴을 기준선과 비교해요.' };
    }
    default: return null;
  }
}
