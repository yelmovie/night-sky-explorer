// The route reads existing observations, so old research logs remain valid.
export const discoveryDays=[3,7,10,17,21,25];
export const discoveryStopLabel = (day, found) => `${day}일째 · ${found ? '사진 확보' : '달 관측해 담기'}`;
export function discoveryProgress(captures=[]){const found=discoveryDays.filter(d=>captures.includes(d));return {found,next:discoveryDays.find(d=>!captures.includes(d)),complete:found.length===discoveryDays.length};}
export function discoveryRoute(captures = [], currentDay = null) {
  const stops = discoveryDays.map(day => {
    const found = captures.includes(day);
    return `<button data-learning="seek-day-${day}" class="${found ? 'discovered' : ''}" aria-label="${discoveryStopLabel(day, found)}" aria-pressed="${day === currentDay}"><span aria-hidden="true">${found ? '✓' : '◌'}</span><b>${day}일째</b></button>`;
  }).join('');
  return `<div class="discovery-route" role="group" aria-label="관측 날짜"><div class="discovery-stops">${stops}</div></div>`;
}
