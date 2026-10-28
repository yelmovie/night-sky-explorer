import { firstReady, stageReady } from './state.js';
import { planets, solarOrder, bodies } from './data.js';

export function nextTask(state) {
  const scene = state.scene, drafts = state.drafts;
  if (!/^s[1-5][ab]$/.test(scene)) return '지도에서 빛나는 다음 시설로 함께 가요.';
  const number = +scene[1], part = scene.at(-1);
  if (part === 'a' ? firstReady(state, number) : stageReady(state, number)) return part === 'a' ? '준비됐어요! 오른쪽 아래에서 다음 활동을 열어요.' : '완성됐어요! 오른쪽 아래에서 연구 기록을 받아요.';
  switch (scene) {
    case 's1a': return drafts.moon.photos.length ? '배율을 바꾸어 두 번째 사진을 담아요.' : '달을 가운데로 옮기고, 초점을 선명하게 맞춰요.';
    case 's1b': return `${drafts.moon.comparisons.filter(card => card.spots.length === 2 && card.observation.trim().length >= 3).length}/2 비교 완료 · 표면 두 곳을 고르고 차이를 기록해요.`;
    case 's2a': return `${drafts.phases.captures.length}/6 시점 기록 · 날짜 버튼을 누르면 그 모습이 바로 담겨요.`;
    case 's2b': return '예상을 공개하면 겹쳐 볼 수 있어요. 두 날짜의 차이를 기록해요.';
    case 's3a': return `${planets.find(planet => planet.id === drafts.planets.selected)?.name || '행성'}의 특징을 골라요. 근거가 맞으면 다음 행성이 이어져요.`;
    case 's3b': return solarOrder.every((id, index) => drafts.planets.order[index] === id) ? '행성을 특징별로 묶어요. 놓을 때마다 근거를 확인해 줘요.' : '행성을 끌거나, 고른 뒤 자리를 눌러요. 배치는 바로 확인돼요.';
    case 's4a': return `${drafts.classification.viewed.length}/8 자료 비교 · 천체 카드를 누르면 자료가 펼쳐지고 기록돼요.`;
    case 's4b': return `${bodies.filter(body => drafts.classification.answers[body.id]?.kind === body.kind && drafts.classification.answers[body.id]?.reason === body.evidence).length}/8 판별 · 이름표와 근거를 고르면 다음 천체가 이어져요.`;
    case 's5a': return '두 구역에서 별을 관찰해요. 한쪽을 살펴보면 아래 버튼으로 옮겨요.';
    case 's5b': return '별을 차례로 누르면 선이 이어져요. 두 패턴을 만들고 기준과 비교해요.';
    default: return '';
  }
}

export function hints(state) {
  const common = nextTask(state);
  const details = {
    s1a: ['달을 손가락으로 끌거나 방향 버튼을 눌러요.', '초점 막대를 움직일 때 달의 테두리를 봐요. 사진 둘은 배율이 달라야 해요.'],
    s1b: ['밝은 곳과 어두운 곳을 하나씩 골라요.', '확대된 두 그림에서 색과 둥근 구덩이 모양을 비교해요. 두 번째 탭도 완성해요.'],
    s2a: ['날짜 버튼 하나로 관찰과 기록을 함께 해요. 시간 막대로 다른 날도 살펴봐요.', '15일보다 앞선 날과 뒤의 날이 모두 있어야 해요. 날짜가 다른 사진 여섯 장을 모아요.'],
    s2b: ['앞서 모은 사진에서 밝은 부분이 커지는지 작아지는지 봐요.', '예상을 저장한 뒤 겹쳐서 비교해요. 맞히는 것보다 차이를 설명하는 것이 중요해요.'],
    s3a: ['모형을 돌리고 확대해서 무늬나 고리를 살펴봐요.', '지금 고른 행성에 맞는 특징을 찾으면 자동으로 기록돼요. 수성부터 토성까지 조사해요.'],
    s3b: ['행성을 고르고 자리를 눌러도, 끌어 놓아도 돼요. 배치 뒤 안내를 보고 수정해요.', '순서는 겉모습만으로 알 수 없어요. 조사 노트에서 순서와 세 무리의 자료를 확인해요.'],
    s4a: ['빛 실험에서 태양빛을 가렸다가 다시 켜 보세요.', '모형에서 태양빛을 막으면 행성의 반사광이 사라져요. 별은 스스로 빛나요.'],
    s4b: ['아주 밝게 보인다는 말만으로 별이라고 정할 수 있을까요?', '자료에서 스스로 빛을 내는지, 태양빛을 반사하는지 확인해요. 근거까지 고르면 바로 확인돼요.'],
    s5a: ['멀리 떨어진 별과 가까이 모인 별을 비교해요.', '위쪽과 아래쪽 별 무리 탭을 바꿔 가며 모두 관찰해요.'],
    s5b: ['별을 차례로 누르면 마지막 별에서 계속 이어져요. 새 연결 시작으로 끊을 수 있어요.', '두 선 이상 만든 뒤 내 패턴을 저장해요. 기준과 다른 선도 좋아요. 같은 점이나 다른 점을 설명해요.'],
  };
  return [common, ...(details[state.scene] || ['빛나는 시설을 누르면 내가 뒤따라가요.', '시설마다 관찰과 비교를 마치면 불빛이 돌아와요.'])];
}

export function companionMarkup(state) {
  return `<aside class="companion-dock" aria-label="탐구 동행 루미"><button class="companion-button" data-action="hint" aria-label="달토끼 루미에게 힌트 받기"><i class="rabbit-portrait" aria-hidden="true"></i><span>루미 · 힌트</span></button><p id="companion-task" role="status">${nextTask(state)}</p></aside>`;
}
