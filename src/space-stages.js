import { planets, requiredPlanets, solarOrder, bodies, reasons, starNames, patternRegions, planetGroups } from './data.js';
import { starChart } from './drawing.js';
import { learnButton as b, range, field, planetImage, celestialImage, imageFor, icon } from './ui.js';
import { conceptArt } from './concept-assets.js';
import { classificationFeedback, solarFeedback } from './learning-flow.js';
import './space-stages.css';

const regions = ['cassiopeia', 'dipper'];
const groupCues = {
  rock: '단단한 암석 표면',
  gas: '수소·헬륨이 주성분',
  ice: '물·암모니아·메테인 비중이 큼',
};
const bodyPicture = body => body.kind === 'planet'
  ? planetImage(body.id, `${body.name} 외형 모형`)
  : celestialImage(body.id === 'sun' ? 'sun' : 'star', body.id === 'sun' ? '태양 표면을 표현한 학습용 그림' : `${body.name}의 빛을 확대한 학습용 그림`, `star-orb ${body.id === 'sun' ? 'sun-orb' : ''}`);
const planetsForTask = i => i === 0
  ? ['saturn', 'earth', 'sun', 'neptune', 'mars', 'mercury', 'jupiter', 'uranus', 'venus']
  : planets.map(planet => planet.id);

function lightExperiment(blocked) {
  return `<svg class="light-lab-art" viewBox="0 0 360 218" role="img" aria-label="${blocked ? '가림판이 태양빛을 막아 행성에서 관찰자로 오는 반사광도 사라진 모형' : '태양빛이 행성에 닿은 뒤 관찰자 쪽으로 반사되는 모형'}" data-light-blocked="${blocked}">
    <defs><marker id="light-incoming-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#f5cc71"/></marker><marker id="light-reflected-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#94e1d9"/></marker></defs>
    <image href="${conceptArt.sun.src}" x="3" y="30" width="94" height="94"/>
    <path class="light-flow" data-light-ray="incoming" d="M100 78H${blocked ? 169 : 249}" fill="none" stroke="#f5cc71" stroke-width="4" marker-end="url(#light-incoming-arrow)"/>
    <text class="light-ray-label" x="173" y="58" fill="#ffe3a3" text-anchor="middle" font-size="17">태양빛</text>
    ${blocked ? '<rect x="176" y="34" width="12" height="88" rx="3" fill="#6c8395" stroke="#d0e0e7" stroke-width="2"/><text x="182" y="143" text-anchor="middle" fill="#e4edf1" font-size="16">가림판</text>' : ''}
    <image href="${imageFor('earth')}" x="250" y="35" width="88" height="88" opacity="${blocked ? .14 : 1}"/>
    <path class="light-flow" data-light-ray="reflected" d="M270 121L219 169" fill="none" stroke="#94e1d9" stroke-width="4" marker-end="url(#light-reflected-arrow)" opacity="${blocked ? 0 : 1}"/>
    ${blocked ? '' : '<text class="light-ray-label" x="281" y="181" fill="#b7f2e7" text-anchor="middle" font-size="17">반사광</text>'}
    <g fill="none" stroke="#e1eff4" stroke-width="2.5"><path d="M170 181Q193 157 216 181Q193 205 170 181Z"/><circle cx="193" cy="181" r="7"/></g>
    <g fill="#f0f6f1" text-anchor="middle" font-size="17"><text x="50" y="145">태양</text><text x="294" y="145">행성</text><text x="193" y="215">관찰자</text></g>
  </svg>`;
}

export function renderSpaceStage(s, scene, i, ui, helpers) {
  const { tabs, feedback, token } = helpers;
  const d = s.drafts;
  let main = '', tools = '', instruction = '';
  switch (scene) {
    case 's3a': {
      const p = d.planets, current = planets.find(planet => planet.id === p.selected);
      instruction = '행성의 특징을 찾아 기록해요.';
      main = `<div class="planet-choices" role="group" aria-label="조사할 행성">${planets.map(planet => `<button class="planet-choice ${p.selected === planet.id ? 'selected' : ''}" data-learning="planet-${planet.id}" aria-label="${planet.name} 조사" aria-pressed="${p.selected === planet.id}">${planetImage(planet.id, '')}<span>${planet.name}${p.records[planet.id] ? ' ✓' : ''}</span></button>`).join('')}</div><div class="planet-exhibit"><div class="planet-viewport">${ui.three ? '<div id="planet-viewer" class="planet-viewer"></div>' : planetImage(current.id, `${current.name} 학습용 외형 그림`, 'planet-portrait')}</div><span class="model-note">외형 모형 · 행성 간 실제 크기 비율과 달라요</span></div>`;
      tools = `<label class="field-label" for="planet-feature">관찰한 특징</label><select id="planet-feature"><option value="">특징을 골라요</option>${planets.map(planet => `<option ${p.feature === planet.feature ? 'selected' : ''}>${planet.feature}</option>`).join('')}</select>${feedback('planet-feedback', { tone: p.records[current.id] ? 'success' : 'hint', text: p.records[current.id] ? '✓ 관찰 근거 저장 완료' : '' })}<div class="viewer-toolbar">${b(ui.three ? '그림 보기' : '입체로 보기', 'toggle-three', 'chip')}<div class="viewer-settings"><div class="viewer-setting">${range('확대', 'planet-zoom', .5, 2, ui.zoom, .1, '×')}</div>${ui.three ? `<div class="viewer-setting">${range('회전', 'planet-rotation', -180, 180, ui.rotation, 5, '°')}</div>` : ''}</div></div><div class="planet-note-row">${b(`${icon('book')} <span>참고 자료</span>`, 'solar-note', 'secondary')}<span class="flow-progress">조사 ${requiredPlanets.filter(id => p.records[id]).length}/6</span></div>`;
      break;
    }
    case 's3b': {
      const p = d.planets;
      instruction = i === 0 ? '태양에서 가까운 순서로 놓아요.' : '비슷한 특징의 행성끼리 모아요.';
      const slots = `<div class="order-slots">${solarOrder.map((id, index) => `<button class="answer-target ${p.order[index] ? p.order[index] === id ? 'is-correct' : 'needs-review' : ''}" data-slot="${index}" aria-label="${index === 0 ? '태양 자리' : index + '번째 행성 자리'}"><small>${index === 0 ? '중심' : index + '번째'}</small>${token(p.order[index])}</button>`).join('')}</div>`;
      const groups = `<div class="group-targets">${planetGroups.map(group => `<button class="answer-target group-target group-${group.id}" data-group="${group.id}"><strong>${group.name}</strong><span class="group-cue">${groupCues[group.id]}</span><div class="placed-planets">${planets.filter(planet => p.groups[planet.id] === group.id).map(planet => `<span>${planetImage(planet.id, '')}<span>${planet.name}</span></span>`).join('') || '<span class="group-empty">이곳에 놓아요</span>'}</div></button>`).join('')}</div>`;
      main = `${tabs(['순서 맞추기', '특징 묶기'], [solarOrder.every((id, index) => p.order[index] === id), planets.every(planet => p.groups[planet.id] === planet.group)])}${i === 0 ? slots : groups}<div class="piece-tray" role="group" aria-label="놓을 천체 고르기">${planetsForTask(i).map(id => `<button class="planet-chip ${ui.piece === id ? 'selected' : ''} ${i === 1 && p.groups[id] ? 'is-placed' : ''}" aria-pressed="${ui.piece === id}" data-piece="${id}" draggable="true" ${i === 0 && p.order.includes(id) ? 'disabled' : ''}>${token(id)}</button>`).join('')}</div><p class="model-note">크기·간격은 실제 비율과 달라요${i ? ' · 얼음형은 겉이 얼음이라는 뜻이 아니에요' : ''}</p>`;
      tools = `${b(`${icon('book')} <span>조사 자료</span>`, 'solar-note', 'secondary')}${feedback('solar-feedback', solarFeedback(p, i))}`;
      break;
    }
    case 's4a': {
      const subset = bodies.slice(i * 4, i * 4 + 4), inspected = subset.find(body => body.id === ui.inspectedBody);
      instruction = '천체를 관찰하고 빛의 근원을 찾아요.';
      main = `${tabs(['가까운 하늘', '더 넓은 하늘'], [bodies.slice(0, 4), bodies.slice(4)].map(group => group.every(body => d.classification.viewed.includes(body.id))))}<div class="sky-bodies">${subset.map(body => `<button class="sky-body ${d.classification.viewed.includes(body.id) ? 'viewed' : ''} ${inspected === body ? 'selected' : ''}" data-learning="body-${body.id}" aria-pressed="${inspected === body}">${bodyPicture(body)}<strong>${body.name}</strong><span>${body.look}</span><small>${d.classification.viewed.includes(body.id) ? '✓ 관찰' : '자료 보기'}</small></button>`).join('')}</div><p class="model-note">학습 모형 · 태양을 직접 보지 않아요</p>`;
      tools = `<section class="body-fact" aria-live="polite">${inspected ? `<b>${inspected.name}</b><p>${inspected.kind === 'star' ? '스스로 빛을 내요.' : '태양빛을 반사해요.'}</p>` : '<p>천체를 고르면 빛의 근원을 볼 수 있어요.</p>'}</section><div class="light-lab">${lightExperiment(ui.lightBlocked)}${b(ui.lightBlocked ? '가림판 치우기' : '태양빛 가리기', 'light-toggle', 'secondary', `aria-pressed="${ui.lightBlocked}"`)}<p>${ui.lightBlocked ? '행성에 닿는 빛이 막혀 반사광도 사라져요.' : '태양빛이 행성에서 반사되어 눈에 들어와요.'}</p></div><p class="flow-progress">자료 ${d.classification.viewed.length}/8</p>`;
      break;
    }
    case 's4b': {
      const subset = bodies.slice(i * 4, i * 4 + 4), body = subset[ui.body % 4], answer = d.classification.answers[body.id] || {};
      instruction = `${body.name}의 이름표와 근거를 골라요.`;
      main = `${tabs(['판별 하나', '판별 둘'], [bodies.slice(0, 4), bodies.slice(4)].map(group => group.every(item => d.classification.answers[item.id]?.kind === item.kind && d.classification.answers[item.id]?.reason === item.evidence)))}<div class="body-tabs">${subset.map((item, index) => b(`${item.name}${d.classification.answers[item.id]?.kind === item.kind && d.classification.answers[item.id]?.reason === item.evidence ? ' ✓' : ''}`, 'bodytab-' + index, index === ui.body ? 'chip selected' : 'chip')).join('')}</div><div class="classification-exhibit">${bodyPicture(body)}<h2 class="sr-only">${body.name}</h2><div class="claim-target answer-target" data-claim-target>${answer.kind ? answer.kind === 'star' ? '별' : '행성' : '이름표를 놓아요'}</div><div class="claim-tray">${b('별', 'kind-star', answer.kind === 'star' ? 'choice-card selected' : 'choice-card', 'draggable="true" data-claim="star"')}${b('행성', 'kind-planet', answer.kind === 'planet' ? 'choice-card selected' : 'choice-card', 'draggable="true" data-claim="planet"')}</div></div><p class="model-note">천체의 빛을 확대한 학습 모형</p>`;
      tools = `<p class="field-label">판별 근거</p><div class="reason-choices">${reasons.map(([id, label]) => b(label, 'reason-' + id, answer.reason === id ? 'choice-card selected' : 'choice-card')).join('')}</div>${feedback('classification-feedback', classificationFeedback(body, answer))}<div class="body-note-row">${b(`${icon('book')} <span>자료 다시 보기</span>`, 'body-note', 'secondary')}<span class="flow-progress">${bodies.filter(item => classificationFeedback(item, d.classification.answers[item.id]).correct).length}/8</span></div>`;
      break;
    }
    case 's5a': {
      const region = regions[i], observed = d.pattern.observed.filter(id => id !== 'Polaris').length;
      instruction = '별 사이의 간격과 방향을 살펴봐요.';
      main = `${tabs(['위쪽 별 무리', '아래쪽 별 무리'], regions.map(key => patternRegions[key].stars.filter(id => d.pattern.observed.includes(id)).length >= 2))}<div id="star-view">${starChart({ observed: d.pattern.observed, selected: ui.selectedStar, region })}</div><div class="chart-legend"><span><i class="legend-observed" aria-hidden="true"></i>관찰한 별</span><span><i class="legend-selected" aria-hidden="true"></i>선택한 별</span></div>`;
      tools = `<div id="star-observation" class="observation-card">${ui.selectedStar ? starNames[ui.selectedStar] : '별을 눌러 관찰해요'}</div><span class="flow-progress">${observed}/6 관찰</span>`;
      break;
    }
    case 's5b': {
      const region = regions[i], card = d.pattern.cases[region];
      instruction = '나만의 별 패턴을 만들고 비교해요.';
      main = `${tabs(['위쪽 별 패턴', '아래쪽 별 패턴'], regions.map(key => { const item = d.pattern.cases[key]; return item.original?.length >= 2 && item.compared && item.reflection.trim().length >= 3; }))}<div id="star-view">${starChart({ lines: card.lines, reference: card.showReference, selected: ui.selectedStar, region })}</div><div class="chart-tools"><div class="chart-legend"><span><i class="legend-mine" aria-hidden="true"></i>내 선 ${card.lines.length}개</span>${card.showReference ? '<span><i class="legend-reference" aria-hidden="true"></i>기준선</span>' : ''}</div><div class="chart-actions">${b('되돌리기', 'undo-line', 'chip', `aria-label="선 하나 되돌리기" ${card.lines.length ? '' : 'disabled'}`)}${b('새 연결', 'cancel-line', 'chip', `aria-label="새 연결 시작" ${ui.selectedStar ? '' : 'disabled'}`)}</div></div>`;
      tools = `${!card.original ? `<p class="drawing-tip">별을 차례로 눌러 선을 이어요.</p>${b('패턴 저장 · 기준 비교', 'compare-pattern', 'primary', card.lines.length < 2 ? 'disabled' : '')}` : `${b(card.showReference ? '기준선 숨기기' : '기준선 보기', 'toggle-reference', 'secondary')}<p class="reference-name">${i === 0 ? '카시오페이아자리' : '북두칠성 · 큰곰자리의 일부'}</p>${field('같거나 다른 점', 'pattern-reflection', card.reflection, '별의 위치와 연결 방향을 비교해요.')}`}<p class="model-note">선은 사람이 별에 덧붙인 표현이에요.</p>`;
      break;
    }
    default: return null;
  }
  return { main, tools, instruction };
}
