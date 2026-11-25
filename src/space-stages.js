import { lightPredictions, lightTrialReady } from './light-trial.js';
import { planets, requiredPlanets, solarOrder, bodies, reasons, starNames, patternRegions, planetGroups } from './data.js';
import { starChart } from './drawing.js';
import { learnButton as b, range, field, planetImage, celestialImage, imageFor, icon } from './ui.js';
import { conceptArt } from './concept-assets.js';
import { classificationFeedback, solarFeedback } from './learning-flow.js';
import './space-stages.css';
import { patternChoices, choiceMarkup } from './reflection-chips.js';

const featureOrder = [2, 6, 0, 4, 7, 1, 5, 3];
const featureLabels = {
  mercury: '회색·구덩이',
  venus: '두꺼운 구름',
  earth: '바다·육지·구름',
  mars: '붉은 표면',
  jupiter: '줄무늬·소용돌이',
  saturn: '넓고 뚜렷한 고리',
  uranus: '옅은 청록색',
  neptune: '푸른 대기·구름',
};
export const fogged = (p, current, ui) => !ui.three && !p.records[current.id] && !ui.revealed?.[current.id];

const regions = ['cassiopeia', 'dipper'];
const groupCues = {
  rock: '단단한 암석 표면',
  gas: '수소와 헬륨이 많아요',
  ice: '물·암모니아 등의 성분이 더 많아요',
};
const bodyPicture = body => body.kind === 'planet'
  ? planetImage(body.id, `${body.name} 외형 모형`)
  : celestialImage(body.id === 'sun' ? 'sun' : 'star', body.id === 'sun' ? '태양 표면을 표현한 학습용 그림' : `${body.name}의 빛을 확대한 학습용 그림`, `star-orb ${body.id === 'sun' ? 'sun-orb' : 'star-glow'}`).replace('<img ', body.id === 'sun' ? '<img ' : `<img style="--star-color:${body.color || '#e0edff'}" `);
const planetsForTask = i => i === 0
  ? ['saturn', 'earth', 'sun', 'neptune', 'mars', 'mercury', 'jupiter', 'uranus', 'venus']
  : planets.map(planet => planet.id);

function lightExperiment(blocked) {
  return `<svg class="light-lab-art" viewBox="0 0 360 218" role="group" aria-label="${blocked ? '가림판이 태양빛을 막아 행성에서 관찰자로 오는 반사광도 사라진 모형' : '태양빛이 행성에 닿은 뒤 관찰자 쪽으로 반사되는 모형'}" data-light-blocked="${blocked}">
    <defs><marker id="light-incoming-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#f5cc71"/></marker><marker id="light-reflected-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#94e1d9"/></marker></defs>
    <image href="${conceptArt.sun.src}" x="3" y="30" width="94" height="94"/>
    <path class="light-flow" data-light-ray="incoming" d="M100 78H${blocked ? 169 : 249}" fill="none" stroke="#f5cc71" stroke-width="4" marker-end="url(#light-incoming-arrow)"/>
    <text class="light-ray-label" x="173" y="58" fill="#ffe3a3" text-anchor="middle" font-size="22">태양빛</text>
    <g class="light-shield ${blocked ? 'is-blocking' : 'is-parked'}" data-shield role="button" tabindex="0" aria-pressed="${blocked}" aria-label="${blocked ? '가림판 치우기' : '가림판으로 태양빛 가리기'}">${blocked ? '<rect x="166" y="26" width="32" height="104" fill="transparent"/><rect x="176" y="34" width="12" height="88" rx="3" fill="#6c8395" stroke="#d0e0e7" stroke-width="2"/><text x="182" y="143" text-anchor="middle" fill="#e4edf1" font-size="22">가림판</text>' : '<rect x="100" y="140" width="58" height="74" fill="transparent"/><rect x="122" y="150" width="12" height="52" rx="3" fill="#6c8395" stroke="#f7d17b" stroke-width="2.5"/><text x="128" y="146" text-anchor="middle" fill="#ffe3a3" font-size="22">가림판 ↑</text>'}</g>
    <image href="${imageFor('venus')}" x="250" y="35" width="88" height="88" opacity="${blocked ? .14 : 1}"/>
    <path class="light-flow" data-light-ray="reflected" d="M270 121L219 169" fill="none" stroke="#94e1d9" stroke-width="4" marker-end="url(#light-reflected-arrow)" opacity="${blocked ? 0 : 1}"/>
    ${blocked ? '' : '<text class="light-ray-label" x="281" y="181" fill="#b7f2e7" text-anchor="middle" font-size="22">반사광</text>'}
    <g fill="none" stroke="#e1eff4" stroke-width="2.5"><path d="M170 181Q193 157 216 181Q193 205 170 181Z"/><circle cx="193" cy="181" r="7"/></g>
    <g fill="#f0f6f1" text-anchor="middle" font-size="22"><text x="50" y="145">태양</text><text x="294" y="145">행성</text><text x="193" y="215">관찰자</text></g>
  </svg>`;
}

export function renderSpaceStage(s, scene, i, ui, helpers) {
  const { tabs, feedback, token } = helpers;
  const d = s.drafts;
  let main = '', tools = '', instruction = '';
  switch (scene) {
    case 's3a': {
      const p = d.planets, current = planets.find(planet => planet.id === p.selected);
      const cloud = fogged(p, current, ui);
      const found = requiredPlanets.filter(id => p.records[id]).length;
      const viewerSettings = ui.three || ui.threeUnavailable ? `<div class="viewer-settings"><div class="viewer-setting">${range('확대', 'planet-zoom', .5, 2, ui.zoom, .1, '×')}</div><div class="viewer-setting">${range('회전', 'planet-rotation', -180, 180, ui.rotation, 5, '°')}</div></div>` : '';
      instruction = '행성의 특징을 찾아 기록해요.';
      main = `<div class="planet-choices" role="group" aria-label="조사할 행성">${planets.map(planet => {
        const name = p.records[planet.id] ? `${planet.name} · 기록 완료` : planet.name;
        return `<button class="planet-choice ${p.selected === planet.id ? 'selected' : ''}" data-learning="planet-${planet.id}" aria-label="${name}" aria-pressed="${p.selected === planet.id}">${planetImage(planet.id, '')}<span>${planet.name}</span>${p.records[planet.id] ? icon('check',16) : ''}</button>`;
      }).join('')}</div><div class="planet-exhibit"><div class="planet-viewport">
        ${ui.three ? '<div id="planet-viewer" class="planet-viewer"></div>' : planetImage(current.id, `${current.name} 학습용 외형 그림`, 'planet-portrait').replace('<img ',`<img style="transform:scale(${ui.zoom}) rotate(${ui.rotation}deg)" `)}
        ${cloud ? `<canvas class="planet-fog" tabindex="0" role="button" aria-label="관측 구름을 문질러 행성 드러내기"></canvas><span class="fog-tip" aria-hidden="true">${icon('hand', 30)}</span>` : ''}
        </div><span class="model-note">8개 중 수성~토성 6개 조사</span></div>`;
      const choices = `<div class="feature-choices" id="planet-feature" role="group" aria-label="행성의 특징">${featureOrder.map(index => {
        const planet = planets[index], selected = p.feature === planet.feature;
        return b(featureLabels[planet.id], 'feature-' + index, `choice-card ${selected ? (planet.feature === current.feature ? 'is-right' : 'is-wrong') : ''}`, `aria-pressed="${selected}"`);
      }).join('')}</div>`;
      tools = `${cloud ? b(`${icon('hand')} 구름 걷기`, 'clear-cloud', 'secondary') : choices}
        ${feedback('planet-feedback', { tone: 'hint', text: '' })}
        <div class="planet-utilities">${b(ui.three ? '그림 보기' : '입체로 보기', 'toggle-three', 'chip')}${b(`${icon('book')} 참고 자료`, 'solar-note', 'secondary')}</div>
        ${viewerSettings || `<span class="flow-progress">조사 ${found}/6</span>`}`;
      break;
    }
    case 's3b': {
      const p = d.planets;
      instruction = i === 0 ? '태양에서 가까운 순서로 놓아요.' : '선택 탐구 · 자료를 보며 행성을 묶어요.';
      const slots = `<div class="order-slots">${solarOrder.map((id, index) => `<button class="answer-target ${p.order[index] ? p.order[index] === id ? 'is-correct' : 'needs-review' : ''}" data-slot="${index}" aria-label="${index === 0 ? '태양 자리' : index + '번째 행성 자리'}"><small>${index === 0 ? '중심' : index + '번째'}</small>${token(p.order[index])}</button>`).join('')}</div>`;
      const groups = `<div class="group-targets">${planetGroups.map(group => `<button class="answer-target group-target group-${group.id}" data-group="${group.id}"><strong>${group.name}</strong><span class="group-cue">${groupCues[group.id]}</span><div class="placed-planets">${planets.filter(planet => p.groups[planet.id] === group.id).map(planet => `<span>${planetImage(planet.id, '')}<span>${planet.name}</span></span>`).join('') || '<span class="slot-plus" aria-hidden="true">+</span>'}</div></button>`).join('')}</div>`;
      const available = planetsForTask(i).filter(id => i !== 0 || !p.order.includes(id));
      const tray = available.length ? `<div class="piece-tray" role="group" aria-label="놓을 천체 고르기">${available.map(id => `<button class="planet-chip ${ui.piece === id ? 'selected' : ''} ${i === 1 && p.groups[id] ? 'is-placed' : ''}" aria-pressed="${ui.piece === id}" data-piece="${id}" draggable="true">${token(id)}</button>`).join('')}</div>` : '';
      main = `${tabs(['순서 맞추기', '선택 · 특징 묶기'], [solarOrder.every((id, index) => p.order[index] === id), planets.every(planet => p.groups[planet.id] === planet.group)])}
        ${i === 0 ? slots : groups}${tray}<p class="model-note">크기·간격은 실제 비율과 달라요${i ? ' · 얼음형은 겉이 얼음이라는 뜻이 아니에요' : ''}</p>`;
      tools = `${b(`${icon('book')} <span>조사 자료</span>`, 'solar-note', 'secondary')}${feedback('solar-feedback', solarFeedback(p, i))}`;
      break;
    }
    case 's4a': {
      const { viewed, lightTrial: trial } = d.classification;
      const inspected = bodies.find(body => body.id === ui.inspectedBody);
      const blocked = trial?.blocked ?? ui.lightBlocked;
      const prediction = `<div class="light-predictions" role="group" aria-label="태양빛을 가렸을 때의 밝기">${Object.entries(lightPredictions).map(([id, text]) =>
        b(text, 'predict-light-' + id, 'choice-card' + (trial?.prediction === id ? ' selected' : ''), `aria-pressed="${trial?.prediction===id}"`)
      ).join('')}</div>`;
      const fact = inspected ? `<section class="body-fact" aria-live="polite"><b>${inspected.name}</b> <p>${inspected.kind === 'star' ? '스스로 빛을 내요.' : '태양빛을 반사해요.'}</p></section>` : '';
      instruction = '천체를 관찰하고 빛의 근원을 찾아요.';
      main = `<div class="sky-bodies all-bodies" role="group" aria-label="관측할 천체">${bodies.map(body => {
        const observed = viewed.includes(body.id);
        return `<button class="sky-body ${observed ? 'viewed' : ''} ${inspected === body ? 'selected' : ''}" data-learning="body-${body.id}" aria-label="${body.name}${observed?' · 관찰 완료':''}" aria-pressed="${inspected === body}">${bodyPicture(body)}<strong>${body.name}</strong>${observed ? icon('check', 20) : ''}</button>`;
      }).join('')}</div>${fact}<p class="model-note">학습 모형 · 태양을 직접 보지 않아요</p>`;
      tools = `<p class="flow-progress">관찰 ${viewed.length}/8</p>
        <div class="light-lab">
          ${trial && !trial.observations.length ? prediction : ''}
          ${lightExperiment(blocked)}
          ${lightTrialReady(trial) && trial ? '<p class="light-conclusion">별은 스스로 빛을 내요. 달과 행성은 태양빛을 반사해요.</p>' : ''}
        </div>`;
      break;
    }
    case 's4b': {
      const subset = bodies.slice(i * 4, i * 4 + 4), body = subset[ui.body % 4], answer = d.classification.answers[body.id] || {};
      instruction = `${body.name}의 이름표와 근거를 골라요.`;
      main = `<div class="body-tabs">${bodies.map((item, index) => b(`${item.name}${classificationFeedback(item, d.classification.answers[item.id]).correct ? ' ✓' : ''}`, 'bodytab-' + index, index === i * 4 + ui.body % 4 ? 'chip selected' : 'chip')).join('')}</div>
        <div class="classification-exhibit">${bodyPicture(body)}<h2 class="sr-only">${body.name}</h2>
          <div class="claim-target answer-target" data-claim-target aria-label="이름표를 놓는 곳">${answer.kind ? answer.kind === 'star' ? '별' : '행성' : '<span aria-hidden="true">+</span>'}</div>
          <div class="claim-tray" role="group" aria-label="이름표">${b('별', 'kind-star', answer.kind === 'star' ? 'choice-card selected' : 'choice-card', `draggable="true" data-claim="star" aria-pressed="${answer.kind==='star'}"`)}${b('행성', 'kind-planet', answer.kind === 'planet' ? 'choice-card selected' : 'choice-card', `draggable="true" data-claim="planet" aria-pressed="${answer.kind==='planet'}"`)}</div>
        </div><p class="model-note">천체의 빛을 확대한 학습 모형</p>`;
      tools = `${answer.kind ? `<div class="reason-choices" role="group" aria-label="빛의 근거">${reasons.map(([id, label]) => b(label, 'reason-' + id, answer.reason === id ? 'choice-card selected' : 'choice-card', `aria-pressed="${answer.reason===id}"`)).join('')}</div>` : ''}
        ${answer.kind && answer.reason ? feedback('classification-feedback', classificationFeedback(body, answer)) : ''}
        <div class="body-note-row">${b(`${icon('book')} 관측 기록`, 'body-note', 'secondary')}<span class="flow-progress">${bodies.filter(item => classificationFeedback(item, d.classification.answers[item.id]).correct).length}/8</span></div>`;
      break;
    }
    case 's5a': {
      const region = regions[i], observed = d.pattern.observed.filter(id => id !== 'Polaris').length, polaris = d.pattern.polaris;
      const roundTabs = tabs(['위쪽 별 무리', '아래쪽 별 무리', '북극성 찾기'], [...regions.map(key => patternRegions[key].stars.filter(id => d.pattern.observed.includes(id)).length >= 2), polaris.found]);
      if (i === 2) {
        // 북극성 찾기: 북두칠성 국자 끝 두 별을 이어 그 간격의 다섯 배쯤 늘이면 북극성이 있다(성취기준 [4과13-03] 북극성 주변 별자리 관찰).
        instruction = '북두칠성으로 북극성을 찾아요.';
        main = `${roundTabs}<div id="star-view" class="polaris-view">${starChart({ observed: d.pattern.observed, selected: ui.selectedStar, pointers: polaris.pointers, polarisFound: polaris.found })}</div>`;
        main += `<p class="flow-progress">${polaris.found ? '북극성 발견' : `기준별 ${polaris.pointers.length}/2`}</p>`;
        break;
      }
      instruction = '별 사이의 간격과 방향을 살펴봐요.';
      main = `${roundTabs}<div id="star-view">${starChart({ observed: d.pattern.observed, selected: ui.selectedStar, region })}</div>
        <div class="chart-legend"><span><i class="legend-observed" aria-hidden="true"></i>관찰 ${observed}개</span>${ui.selectedStar ? `<span><i class="legend-selected" aria-hidden="true"></i>${starNames[ui.selectedStar]}</span>` : ''}</div>`;
      break;
    }
    case 's5b': {
      const region = regions[i], card = d.pattern.cases[region];
      instruction = '나만의 별 패턴을 만들고 비교해요.';
      main = `${tabs(['위쪽 별 패턴', '아래쪽 별 패턴'], regions.map(key => { const item = d.pattern.cases[key]; return item.original?.length >= 2 && item.compared && item.reflection.trim().length >= 3; }))}<div id="star-view">${starChart({ lines: card.lines, reference: card.showReference, selected: ui.selectedStar, region })}</div><div class="chart-tools"><div class="chart-legend"><span><i class="legend-mine" aria-hidden="true"></i>내 선 ${card.lines.length}개</span>${card.showReference ? '<span><i class="legend-reference" aria-hidden="true"></i>기준선</span>' : ''}</div><div class="chart-actions">${b('되돌리기', 'undo-line', 'chip', `aria-label="선 하나 되돌리기" ${card.lines.length ? '' : 'disabled'}`)}${b('새 연결', 'cancel-line', 'chip', `aria-label="새 연결 시작" ${ui.selectedStar ? '' : 'disabled'}`)}</div></div>`;
      tools = !card.original ? b('패턴 저장 · 기준 비교', 'compare-pattern', 'secondary', card.lines.length < 2 ? 'disabled' : '')
        : `${choiceMarkup(patternChoices(region, card.lines), ui.picks?.['s5b-' + i], card.reflection, {compact:true})}
          ${b(card.showReference ? '기준선 숨기기' : '기준선 보기', 'toggle-reference', 'secondary')}
          <p class="reference-name">${i === 0 ? '카시오페이아자리' : '북두칠성 · 큰곰자리의 일부'}</p>`;
      break;
    }
    default: return null;
  }
  return { main, tools, instruction };
}
