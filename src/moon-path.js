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
/** After this many misses at one gate Lumi lights the right door. */
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
const sideName = side => (side === 'right' ? '오른쪽' : '왼쪽');
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
  if (doorMatches(candidate, gate.day)) return { ok: true, reason: '', hint: '', reveal: false };
  const reason = candidate && candidate.side === answer.side ? 'size' : 'side';
  const reveal = misses + 1 >= pathHelpAfter;
  let hint;
  if (reason === 'side') {
    hint = misses < 1
      ? `어느 쪽이 밝은지 먼저 봐요. 내 기록의 ${gate.day}일째 달은 어느 쪽이 밝았나요?`
      : `${gate.day}일째 달은 ${sideName(answer.side)}이 밝아요. 밝은 쪽이 같은 문을 찾아봐요.`;
  } else if (gate.prev === null) {
    hint = misses < 1
      ? `밝은 쪽은 맞아요. ${gate.day}일째에는 밝은 부분이 얼마나 가늘었는지 떠올려 봐요.`
      : `${gate.day}일째 달은 밝은 부분이 가느다래요.`;
  } else {
    const bigger = answer.amount > phase(gate.prev).amount;
    hint = misses < 1
      ? `밝은 쪽은 맞아요. 밝은 부분이 ${gate.prev}일째보다 커졌는지 작아졌는지 봐요.`
      : `${gate.day}일째 달은 ${gate.prev}일째보다 밝은 부분이 ${bigger ? '커요' : '작아요'}.`;
  }
  if (reveal) hint += ' 루미가 알맞은 문에 등불을 켰어요.';
  return { ok: false, reason, hint, reveal };
}
/** Records the reward once. Returns true only for a new record. Mission completion is untouched. */
export function finishPath(state, passed) {
  if (passed < pathDays.length || state.bonus.path === 'done') return false;
  state.bonus.path = 'done';
  return true;
}
