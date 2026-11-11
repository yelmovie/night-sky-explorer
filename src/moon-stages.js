import {discoveryRoute} from './discovery-route.js';
import './discovery-route.css';
import { representativeDays, recordCountLabel } from './observation-records.js';
import { moonSVG, dayMoon } from './drawing.js';
import { learnButton as b, range, field, imageFor, icon } from './ui.js';
import './moon-stages.css';

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
        <p id="focus-status" class="feedback" role="status">시야와 초점을 조절해 보세요.</p>
`;
      tools = `
        <div class="pan-controls" role="group" aria-label="망원경 시야 이동">${[['up', '위로'], ['left', '왼쪽으로'], ['right', '오른쪽으로'], ['down', '아래로']].map(([direction, label]) => b(icon('arrow', 22), 'pan-' + direction, 'chip pan-' + direction, `aria-label="시야 ${label}"`)).join('')}</div>
        ${range('배율', 'moon-zoom', 1, 3, m.zoom, .1, '×')}${range('초점', 'moon-focus', 0, 100, m.focus)}
        ${b(`${icon('camera')} <span>사진 담기</span>`, 'capture-moon', 'primary', 'id="capture-moon"')}
        <div class="photo-grid">${[0, 1].map(j => {
          const photo = m.photos[j];
          return `<div class="photo-mini ${photo ? 'is-recorded' : 'is-empty'}">${photo ? moonSVG() : `<span class="photo-placeholder" aria-hidden="true">${icon('camera', 24)}</span>`}<span><b>${j + 1}번</b><small>${photo ? photo.zoom + '× ✓' : '촬영 전'}</small></span></div>`;
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
          return `<div class="observation-card lunar-detail lunar-detail-${j + 1}"><span class="lunar-detail-label"><b>${j + 1}</b> 확대</span><div class="surface-crop ${point ? '' : 'is-empty'}">${point ? surfaceDetail(point) : '<span>위치를<br>골라요</span>'}</div></div>`;
        }).join('')}</div>
        ${field('발견한 차이', 'moon-observation', card.observation, '밝기, 무늬, 둥근 구덩이는 어떻게 다른가요?')}
`;
      break;
    }
    case 's2a': {
      const p = d.phases;
      instruction = '여러 날의 달 모습을 모아요.';
      main = `<div class="phase-display"><span class="date-tag" id="day-label">${p.day}일째</span><div id="phase-moon">${dayMoon(p.day)}</div></div>
        <div id="capture-strip">${recordCollection(p.captures, strip)}</div>
        <p class="model-note">학습용 날짜예요 · 실제 달력과 달라요</p>`;
      tools = `${discoveryRoute(p.captures, p.day)}${range('관찰 시점', 'phase-day', 0, 29, p.day, 1, '일째')}

        ${b(`${icon('camera')} <span>이 모습 기록</span>`, 'capture-phase', 'primary', `id="capture-phase" ${p.captures.includes(p.day) ? 'disabled' : ''}`)}
        ${b(recordCountLabel(p.captures), 'phase-note', 'secondary', 'id="phase-count" aria-label="전체 관측 기록 보기"')}`;
      break;
    }
    case 's2b': {
      const day = i === 0 ? 14 : 24, p = d.phases.predictions[day];
      instruction = `${day}일째 달을 예상하고 비교해요.`;
      main = `${tabs(['14일째 예상', '24일째 예상'], [14, 24].map(day => {
        const prediction = d.phases.predictions[day];
        return prediction.revealed && prediction.overlay && prediction.reflection.trim().length >= 3;
      }))}
        <div class="prediction-board ${ui.overlayVisible ? 'is-overlay' : ''}">
          <figure class="prediction-card prediction-mine"><h3><i aria-hidden="true"></i>내 예상</h3><div class="prediction-visual" id="prediction-moon">${moonSVG(p.amount, p.side)}</div></figure>
          <figure class="prediction-card prediction-evidence"><h3><i aria-hidden="true"></i>관측 자료</h3><div class="prediction-visual">${p.revealed ? dayMoon(day) : '<div class="unknown-moon" aria-label="예상을 저장하면 관측 자료가 나타나요">?</div>'}</div></figure>
        </div>
`;
      tools = `${range('밝은 부분', 'prediction-amount', 0, 100, p.amount, 1, '%')}
        <div class="choice-grid two">${b('오른쪽', 'side-right', p.side === 'right' ? 'choice-card selected' : 'choice-card', 'aria-label="오른쪽이 밝은 달"')}${b('왼쪽', 'side-left', p.side === 'left' ? 'choice-card selected' : 'choice-card', 'aria-label="왼쪽이 밝은 달"')}</div>
        <div class="phase-comparison-actions">${!p.revealed ? b('예상 저장 · 관측', 'reveal-phase', 'primary') : b(ui.overlayVisible ? '나란히 보기' : '겹쳐서 비교', 'overlay-phase', 'secondary')}${b('관측 기록', 'phase-note', 'secondary')}</div>${p.revealed ? field('관측 후 달라진 생각', 'phase-reflection', p.reflection, '밝은 부분의 크기와 방향은 어떻게 달랐나요?') : ''}`;
      break;
    }
    default: return null;
  }
  return { main, tools, instruction };
}
