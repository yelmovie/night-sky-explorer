import {discoveryRoute} from './discovery-route.js';
import './discovery-route.css';
import { representativeDays } from './observation-records.js';
import { lunarModelVoice } from './lunar-model.js';
import { moonSVG, dayMoon, phase } from './drawing.js';
import { learnButton as b, range, imageFor, icon, esc } from './ui.js';
import './moon-stages.css';
import { moonSurfaceChoices, phaseChoices, choiceMarkup } from './reflection-chips.js';

const modelScope = () => `<aside class="phase-model-scope"><p>${lunarModelVoice.text}</p><span data-phase-model-voice></span></aside>`;

const comparisonReady = card => card.spots.length >= 2 && card.observation.trim().length >= 3;
const spotChoices = [[26, 27, '왼쪽 위'], [67, 29, '오른쪽 위'], [32, 68, '왼쪽 아래'], [69, 65, '오른쪽 아래']];

// Center the selected surface coordinate in the magnifier, rather than enlarging
// the whole disk around a transform origin that leaves the target off-center.
function surfaceDetail(point) {
  return moonSVG().replace('viewBox="0 0 100 100"', `viewBox="${point.x - 17} ${point.y - 17} 34 34"`);
}

const recordCollection = (days, strip) => `<section class="lunar-records" aria-label="날짜순 달 관측 기록">${strip(representativeDays(days))}</section>`;

export function renderMoonStage(s, scene, i, ui, helpers) {
  const { tabs, strip } = helpers;
  const d = s.drafts;
  let main, tools, instruction;

  switch (scene) {
    case 's1a': {
      const m = d.moon;
      instruction = i === 0 ? '달을 선명하게 맞춰 촬영해요.' : '배율을 바꿔 한 장 더 촬영해요.';
      main = `${tabs(['전체 모습', '다른 배율'], m.photos.map(Boolean))}
        <div class="scope-stage"><div class="scope-v2" id="scope-drag" tabindex="0" aria-label="망원경 시야: 드래그나 방향키로 달 이동">
          <div class="scope-lens"><div id="scope-moon">${moonSVG()}</div><div class="crosshair"></div></div>
          <img class="scope-housing" src="${imageFor('telescope-frame')}" alt="" draggable="false"/>
        </div></div>
        <span class="scope-gesture" aria-hidden="true">${icon('hand', 28)}</span>
`;
      tools = `
        ${range('배율', 'moon-zoom', 1, 3, m.zoom, .1, '×')}${range('초점', 'moon-focus', 0, 100, m.focus)}
        ${b(`${icon('camera')} <span>사진 담기</span>`, 'capture-moon', 'secondary', 'id="capture-moon"')}
        <div class="photo-grid">${[0, 1].map(j => {
          const photo = m.photos[j];
          return `<div class="photo-mini ${photo ? 'is-recorded' : 'is-empty'}" aria-label="${j + 1}번 사진 ${photo ? '저장됨' : '촬영 전'}">${photo ? moonSVG() : `<span class="photo-placeholder" aria-hidden="true">${icon('camera', 24)}</span>`}<b>${photo ? photo.zoom + '×' : j + 1}</b></div>`;
        }).join('')}</div>
`;
      break;
    }
    case 's1b': {
      const card = d.moon.comparisons[i];
      instruction = '두 곳의 무늬와 밝기를 비교해요.';
      main = `${tabs(['비교 카드 하나', '비교 카드 둘'], d.moon.comparisons.map(comparisonReady))}
        <div class="lunar-surface-stage"><div class="surface-v2" id="surface-moon" aria-label="달 표면의 관찰 위치. 아래 위치 버튼으로도 고를 수 있어요.">${moonSVG()}${card.spots.map((point, j) => `<span class="spot-marker lunar-spot-${j + 1}" style="left:${point.x}%;top:${point.y}%">${j + 1}</span>`).join('')}</div></div>
        <div class="surface-targets" role="group" aria-label="달 표면 관찰 위치">${spotChoices.map(([x, y, label]) => b(label, `spot-${x}-${y}`, 'chip')).join('')}</div>
`;
      tools = `
        <div class="comparison-grid">${[0, 1].map(j => {
          const point = card.spots[j];
          return `<div class="observation-card lunar-detail lunar-detail-${j + 1}"><span class="lunar-detail-label" aria-label="${j+1}번 확대"><b>${j + 1}</b></span><div class="surface-crop ${point ? '' : 'is-empty'}">${point ? surfaceDetail(point) : icon('fit', 28)}</div></div>`;
        }).join('')}</div>
        ${card.spots.length >= 2 ? choiceMarkup(moonSurfaceChoices(), ui.picks?.['s1b-' + i], card.observation) : ''}
`;
      break;
    }
    case 's2a': {
      const p = d.phases;
      instruction = '여러 날의 달 모습을 모아요.';
      main = `<div class="phase-display"><span class="date-tag" id="day-label">${p.day}일째</span><div id="phase-moon">${dayMoon(p.day)}</div></div>
        <div id="capture-strip">${recordCollection(p.captures, strip)}</div>
        ${modelScope()}`;
      tools = `${discoveryRoute(p.captures, p.day)}${range('관찰 시점', 'phase-day', 0, 29, p.day, 1, '일째')}
        ${b(`${icon('camera')} <span>이 모습 기록</span>`, 'capture-phase', 'secondary', `id="capture-phase" ${p.captures.includes(p.day) ? 'disabled' : ''}`)}`;
      break;
    }
    case 's2b': {
      const day = i === 0 ? 14 : 24, p = d.phases.predictions[day];
      const result = p.reflection && p.original ? `<p class="phase-result" role="status"><b>처음 예상 ${p.original.amount}% · 관측 약 ${Math.round(phase(day).amount)}%</b><br>${esc(p.reflection)}</p>` : '';
      instruction = `${day}일째 달을 예상하고 비교해요.`;
      main = `${tabs(['14일째 예상', '24일째 예상'], [14, 24].map(day => {
        const prediction = d.phases.predictions[day];
        return prediction.revealed && prediction.overlay && prediction.reflection.trim().length >= 3;
      }))}
        <div class="prediction-board ${ui.overlayVisible ? 'is-overlay' : ''} ${p.revealed ? '' : 'is-predicting'}">
          <figure class="prediction-card prediction-mine"><h3><i aria-hidden="true"></i>내 예상</h3><div class="prediction-visual" id="prediction-moon">${moonSVG(p.amount, p.side)}</div></figure>
          ${p.revealed ? `<figure class="prediction-card prediction-evidence"><h3><i aria-hidden="true"></i>관측 자료</h3><div class="prediction-visual">${dayMoon(day)}</div></figure>` : ''}
        </div>${modelScope()}
`;
      const adjust = `<div class="prediction-adjust">${range('밝은 부분', 'prediction-amount', 0, 100, p.amount, 1, '%')}
        <div class="choice-grid two" role="group" aria-label="밝은 쪽 고르기">${['left','right'].map(side => {
          const label = side === 'left' ? '왼쪽' : '오른쪽';
          return b(`${moonSVG(50, side)} ${label}`, 'side-' + side, p.side === side ? 'choice-card selected' : 'choice-card', `aria-pressed="${p.side === side}" aria-label="${label}이 밝은 달"`);
        }).join('')}</div></div>`;
      const reference = b(`${icon('book')} 관측 기록`, 'phase-note', 'secondary');
      const choices = choiceMarkup(phaseChoices(day, p.original), ui.picks?.['s2b-' + i], p.reflection, {compact: true});
      tools = p.revealed
        ? `${result ? `${result}<details class="prediction-review"><summary>다시 비교하기</summary>${choices}</details>` : choices}
          <div class="phase-comparison-actions">${b(ui.overlayVisible ? '나란히 보기' : '겹쳐서 비교', 'overlay-phase', 'secondary')}${reference}</div>
          <details class="prediction-disclosure"><summary>내 모형 더 조절하기</summary>${adjust}</details>`
        : `${adjust}${b('예상 저장 · 관측', 'reveal-phase', 'secondary')}${reference}`;
      break;
    }
    default: return null;
  }
  return { main, tools, instruction };
}
