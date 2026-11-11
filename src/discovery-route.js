// The route reads existing observations, so old research logs remain valid.
export const discoveryDays=[3,7,10,17,21,25];
export function discoveryProgress(captures=[]){const found=discoveryDays.filter(d=>captures.includes(d));return {found,next:discoveryDays.find(d=>!captures.includes(d)),complete:found.length===discoveryDays.length};}
export function discoveryRoute(captures = [], currentDay = null) {
  const progress = discoveryProgress(captures);
  const stops = discoveryDays.map(day => {
    const found = captures.includes(day);
    return `<button data-learning="seek-day-${day}" class="${found ? 'discovered' : ''}" aria-label="학습용 ${day}일째로 이동" aria-pressed="${day === currentDay}"><span>${found ? '✓' : '◌'}</span><b>${day}일째</b><small>${found ? '사진 확보' : progress.next === day ? '다음 관측' : '다른 시점'}</small></button>`;
  }).join('');
  return `<section class="discovery-route" aria-label="달 관측 탐험"><b>${progress.complete ? '여섯 시점의 달을 발견했어요!' : '달의 변화를 찾아 떠나요'}</b><div class="discovery-stops">${stops}</div><p>${progress.complete ? '사진을 비교하고 다음 장소에서 달 모습을 예상해요.' : '관측 지점을 고른 뒤 직접 사진을 담아 길을 완성해요.'}</p></section>`;
}
