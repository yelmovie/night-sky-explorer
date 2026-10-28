import { bodies, patternRegions, planets, solarOrder } from './data.js';
import { firstReady, stageReady } from './state.js';

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
      done = [solarOrder.every((id, index) => drafts.planets.order[index] === id), planets.every(planet => drafts.planets.groups[planet.id] === planet.group)];
      labels = ['행성 순서 맞추기', '행성 특징 묶기'];
      break;
    case 's4a':
      done = [0, 1].map(group => bodies.slice(group * 4, group * 4 + 4).every(body => drafts.classification.viewed.includes(body.id)));
      labels = ['가까운 하늘 살펴보기', '더 넓은 하늘 살펴보기'];
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
