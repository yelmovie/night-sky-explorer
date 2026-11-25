import { phase } from './drawing.js';
import { discoveryDays } from './discovery-route.js';

// Rules of the optional bonus "달빛 길 따라가기". No drawing and no 3D here:
// the running stage and the card fallback both ask these functions what happened.
// A door is right only when its moon equals the existing phase(day) model.
export const pathDays = discoveryDays;
export const pathSections = [
  { name: '연습', focus: '어느 쪽이 밝은지 봐요' },
  { name: '적용', focus: '밝은 부분의 크기를 비교해요' },
  { name: '도전', focus: '밝은 쪽과 크기를 함께 봐요' },
];
/** After this many misses the running route offers the card controls. */
export const pathHelpAfter = 3;
// A "different size" door shows another study day with the same bright side.
// Each differs from the answer by more than 30 points of lit area, so two
// near-identical moons (such as day 14 and day 17) never stand side by side.
const sizeDecoyDay = { 3: 8, 7: 11, 10: 5, 17: 22, 21: 26, 25: 20 };
const layouts = [
  ['mirror', 'answer'], ['answer', 'mirror'],
  ['answer', 'size'], ['size', 'answer'],
  ['size', 'answer', 'mirror'], ['mirror', 'size', 'answer'],
];
function door(kind, day) {
  const answer = phase(day);
  if (kind === 'mirror') return { kind, amount: answer.amount, side: answer.side === 'right' ? 'left' : 'right' };
  if (kind === 'size') return { kind, day: sizeDecoyDay[day], ...phase(sizeDecoyDay[day]) };
  return { kind, ...answer };
}
/** The six forks in date order. `random` only changes where the doors stand. */
export function pathGates(random = null) {
  return pathDays.map((day, index) => {
    const kinds = [...layouts[index]];
    if (random) for (let i = kinds.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [kinds[i], kinds[j]] = [kinds[j], kinds[i]]; }
    return { index, day, prev: index ? pathDays[index - 1] : null, section: Math.floor(index / 2), doors: kinds.map(kind => door(kind, day)) };
  });
}
export function doorMatches(candidate, day) {
  const answer = phase(day);
  return !!candidate && candidate.side === answer.side && Math.abs(candidate.amount - answer.amount) < 1;
}
/** misses: wrong doors already tried at this gate. Hints follow the other bonus: bright side first, then size. */
export function judgeDoor(gate, doorIndex, misses = 0) {
  const candidate = gate.doors[doorIndex], answer = phase(gate.day);
  if (doorMatches(candidate, gate.day)) return { ok: true, reason: '', hint: '' };
  const reason = candidate && candidate.side === answer.side ? 'size' : 'side';
  const retry = misses > 0;
  if (reason === 'side') {
    return { ok: false, reason, hint: retry ? '보름 전후에 밝은 쪽이 어떻게 바뀌었는지 떠올려요.' : '문의 달에서 어느 쪽이 밝은지 먼저 봐요.' };
  }
  const hint = retry || gate.prev === null
    ? '둥근 달 전체에서 밝은 부분만 비교해요.'
    : `밝은 부분이 ${gate.prev}일째보다 커졌는지 작아졌는지 비교해요.`;
  return { ok: false, reason, hint };
}
/** Records the reward once. Returns true only for a new record. Mission completion is untouched. */
export function finishPath(state, passed) {
  if (passed < pathDays.length || state.bonus.path === 'done') return false;
  state.bonus.path = 'done';
  return true;
}
