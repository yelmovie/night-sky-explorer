import { bodies, planets, requiredPlanets, solarOrder } from './data.js';

export function recordPhase(phases, day) {
  if (!Number.isInteger(day) || day < 0 || day > 29) return false;
  phases.day = day;
  if (phases.captures.includes(day)) return false;
  phases.captures.push(day);
  return true;
}

export function recordPlanet(draft, feature, view, mode) {
  const planet = planets.find(item => item.id === draft.selected);
  draft.feature = feature;
  draft.candidate = planet.id;
  if (feature !== planet.feature) return false;
  draft.records[planet.id] = { feature, candidate: planet.id, view: { ...view }, mode };
  return true;
}

export function nextPlanet(draft) {
  return requiredPlanets.find(id => draft.records[id]?.feature !== planets.find(p => p.id === id).feature || draft.records[id]?.candidate !== id);
}

export function classificationFeedback(body, answer = {}) {
  if (!answer.kind || !answer.reason) return { tone: 'hint', correct: false, text: '이름표와 빛의 근원을 하나씩 골라 줘.' };
  const correct = answer.kind === body.kind && answer.reason === body.evidence;
  return { correct, tone: correct ? 'success' : 'hint', text: correct
    ? `${body.name}: ${body.kind === 'star' ? '스스로 빛나는 별' : '태양빛을 반사하는 행성'}! 근거를 연결했어.`
    : answer.reason === 'bright' || answer.reason === 'color'
      ? '밝기와 색만으로는 알 수 없어. 자료에서 빛의 근원을 찾아봐.'
      : `${body.name}의 자료를 다시 읽고 이름표와 빛의 근원을 연결해 봐.` };
}

export function nextBody(answers, currentId) {
  const start = bodies.findIndex(body => body.id === currentId);
  for (let offset = 1; offset <= bodies.length; offset++) {
    const index = (start + offset) % bodies.length;
    if (!classificationFeedback(bodies[index], answers[bodies[index].id]).correct) return index;
  }
  return -1;
}

export function solarFeedback(draft, round) {
  const items = round === 0 ? solarOrder : planets.map(p => p.id);
  const placed = items.filter((id, index) => round === 0 ? draft.order[index] : draft.groups[id]);
  const correct = items.filter((id, index) => round === 0 ? draft.order[index] === id : draft.groups[id] === planets.find(p => p.id === id).group);
  const misplaced = planets.find(planet => draft.groups[planet.id] && draft.groups[planet.id] !== planet.group);
  const retry = round === 0 ? '점선 테두리의 자리를 자료와 다시 비교해 봐.' : `${misplaced?.name}이 놓인 무리를 자료와 다시 비교해 봐.`;
  return { tone: placed.length === correct.length && correct.length ? 'success' : 'hint', text:
    correct.length === items.length ? '모두 연결했어! 자료와 일치하는 모형이야.' : `${correct.length}/${items.length} 연결 완료 · ${placed.length > correct.length ? retry : '행성을 고르고 자리를 눌러도 돼.'}` };
}

export function connectStars(pattern, from, to) {
  if (!from || from === to || pattern.lines.some(line => line.includes(from) && line.includes(to))) return false;
  pattern.lines.push([from, to]);
  return true;
}
