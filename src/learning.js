import { chapters,planets,requiredPlanets,solarOrder,bodies,reasons,starNames,patternRegions,planetGroups } from './data.js';
import { firstReady,stageReady,photoReady,clone } from './state.js';
import { moonSVG,dayMoon,starChart } from './drawing.js';
import { learnButton as b,button,range,field,planetImage,celestialImage,imageFor,esc,icon } from './ui.js';
import { conceptArt } from './concept-assets.js';
import { mountTouchDrag } from './touch-drag.js';
import { getStageAction } from './progression.js';
import './flow.css';
import './concept-art.css';
import { recordPhase, recordPlanet, nextPlanet, classificationFeedback, nextBody, solarFeedback, connectStars } from './learning-flow.js';

export const learningUI={round:0,selectedStar:null,piece:null,body:0,three:false,rotation:0,zoom:1,lightBlocked:false,inspectedBody:null,pendingAdvance:null};
const round=()=>learningUI.round;
const regions=['cassiopeia','dipper'];
const doneCompare=c=>c.spots.length>=2&&c.observation.trim().length>=3;
const tabs=(names,done=[])=>`<div class="case-tabs" role="group" aria-label="활동 묶음">${names.map((n,i)=>`<button class="case-tab ${round()===i?'active':''}" data-learning="round-${i}" aria-pressed="${round()===i}">${n} ${done[i]?'✓':''}</button>`).join('')}</div>`;
const strip=days=>`<div class="record-strip">${[...days].sort((a,b)=>a-b).map(d=>`<div>${dayMoon(d)}<small>${d}일째</small></div>`).join('')}</div>`;
const title=t=>`<h2 class="tool-title">${t}</h2>`;
const feedback=(id,status)=>`<p id="${id}" class="inline-feedback" role="status" data-tone="${status.tone}">${status.text}</p>`;
function lightExperiment(blocked){
  return `<svg class="light-lab-art" viewBox="0 0 360 200" role="img" aria-label="${blocked?'가림판이 태양빛을 막아 행성에서 관찰자로 오는 반사광도 사라진 모형':'태양빛이 행성에 닿은 뒤 관찰자 쪽으로 반사되는 모형'}" data-light-blocked="${blocked}">
    <defs><marker id="light-incoming-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#dca645"/></marker><marker id="light-reflected-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#8fd5d2"/></marker></defs>
    <image href="${conceptArt.sun.src}" x="4" y="22" width="100" height="100"/>
    <path data-light-ray="incoming" d="M100 70H${blocked?167:250}" fill="none" stroke="#dca645" stroke-width="4" marker-end="url(#light-incoming-arrow)"/>
    ${blocked?'<rect x="174" y="29" width="12" height="83" rx="3" fill="#5d7787" stroke="#bed1da" stroke-width="2"/>':''}
    <image href="${imageFor('earth')}" x="246" y="27" width="92" height="92" opacity="${blocked?.12:1}"/>
    <path data-light-ray="reflected" d="M265 99L218 145" fill="none" stroke="#8fd5d2" stroke-width="4" marker-end="url(#light-reflected-arrow)" opacity="${blocked?0:1}"/>
    <g fill="none" stroke="#c6e2eb" stroke-width="2.5"><path d="M172 158Q194 134 216 158Q194 182 172 158Z"/><circle cx="194" cy="158" r="7"/></g>
    <g fill="#e5f0ee" text-anchor="middle" font-size="17"><text x="54" y="137">태양</text><text x="292" y="137">행성</text><text x="194" y="192">관찰자</text></g>
  </svg>`;
}
function content(s,scene){const d=s.drafts,i=round();let main='',tools='',instruction='';
  switch(scene){
    case 's1a':{const m=d.moon;instruction=i===0?'달을 가운데 맞추고 선명한 사진을 찍어 줘.':'배율을 바꾸어 달의 표면을 한 번 더 찍어 줘.';
      main=`${tabs(['전체 모습','다른 배율'],m.photos.map(Boolean))}<div class="scope-v2" id="scope-drag" tabindex="0" aria-label="망원경 시야: 드래그나 방향키로 달 이동"><div class="scope-lens"><div id="scope-moon">${moonSVG()}</div><div class="crosshair"></div></div><img class="scope-housing" src="${imageFor('telescope-frame')}" alt=""/></div><p id="focus-status" class="feedback">시야와 초점을 조절해 봐.</p>`;
      tools=`${title('망원경 조절')}<div class="pan-controls">${b('↑','pan-up','chip','aria-label="시야 위로"')}${b('←','pan-left','chip','aria-label="시야 왼쪽으로"')}${b('→','pan-right','chip','aria-label="시야 오른쪽으로"')}${b('↓','pan-down','chip','aria-label="시야 아래로"')}</div>${range('배율','moon-zoom',1,3,m.zoom,.1,'×')}${range('초점','moon-focus',0,100,m.focus)}${b(`${icon('camera')} 사진 담기`,'capture-moon','primary','id="capture-moon"')}<div class="photo-grid">${m.photos.map((p,j)=>`<div class="photo-mini">${moonSVG()}<span>사진 ${j+1} · ${p.zoom}×</span></div>`).join('')}</div><p class="progress-hint">서로 다른 배율로 선명한 사진 두 장을 모아 줘.</p>`;break;}
    case 's1b':{const c=d.moon.comparisons[i];instruction='달 표면의 두 곳을 골라, 무엇이 다른지 비교해 줘.';
      main=`${tabs(['비교 카드 하나','비교 카드 둘'],d.moon.comparisons.map(doneCompare))}<div class="surface-v2" id="surface-moon">${moonSVG()}${c.spots.map((p,j)=>`<span class="spot-marker" style="left:${p.x}%;top:${p.y}%">${j+1}</span>`).join('')}</div><div class="surface-targets">${[[26,27,'왼쪽 위'],[67,29,'오른쪽 위'],[32,68,'왼쪽 아래'],[69,65,'오른쪽 아래']].map(([x,y,name])=>b(name,`spot-${x}-${y}`,'chip')).join('')}</div>`;
      tools=`${title('두 곳을 나란히')}<div class="comparison-grid">${c.spots.map((p,j)=>`<div class="observation-card"><div class="surface-crop">${moonSVG(100,'right','',`style="transform:scale(3);transform-origin:${p.x}% ${p.y}%"`)}</div><small>관찰 ${j+1}</small></div>`).join('')||'<p>위치를 고르면 확대해서 볼 수 있어.</p>'}</div>${field('내가 발견한 차이','moon-observation',c.observation,'밝은 부분, 어두운 부분, 둥근 구덩이를 비교해 봐.')}<p class="progress-hint">다른 두 곳으로 비교 카드 두 개를 완성해 줘.</p>`;break;}
    case 's2a':{const p=d.phases;instruction='시간을 움직이며 서로 다른 달 모습 여섯 장을 모아 줘.';
      main=`<div class="phase-display"><span class="date-tag" id="day-label">${p.day}일째</span><div id="phase-moon">${dayMoon(p.day)}</div></div><div id="capture-strip">${strip(p.captures)}</div><p class="model-note">실제 날짜의 하늘이 아닌 학습용 시간 흐름이야.</p>`;
      tools=`${title('달빛 기록 장치')}${range('관찰 시점','phase-day',0,29,p.day,1,'일째')}${b('시간 흐름 재생','play-time','secondary','id="play-time" aria-pressed="false"')}<p class="progress-hint">날짜를 누르면 그날의 달을 바로 기록해.</p><div class="day-shortcuts">${[3,7,10,17,21,25].map(day=>b(`${day}일째${p.captures.includes(day)?' ✓':''}`,`day-${day}`,`chip ${p.captures.includes(day)?'recorded':''}`,`aria-pressed="${p.captures.includes(day)}"`)).join('')}</div>${b(`${icon('camera')} 이 모습 기록`,'capture-phase','primary',`id="capture-phase" ${p.captures.includes(p.day)?'disabled':''}`)}<p class="feedback" id="phase-count">${p.captures.length}/6 모습 기록 · 전반과 후반을 함께 모아 줘.</p>`;break;}
    case 's2b':{const day=i===0?14:24,p=d.phases.predictions[day];instruction=`앞의 기록을 보고 ${day}일째의 달을 예상해 줘.`;
      main=`${tabs(['14일째 예상','24일째 예상'],[14,24].map(day=>{const v=d.phases.predictions[day];return v.revealed&&v.overlay&&v.reflection.trim().length>=3;}))}<div class="prediction-board ${learningUI.overlayVisible?'is-overlay':''}"><div><h3>내 예상</h3><div id="prediction-moon">${moonSVG(p.amount,p.side)}</div></div><div><h3>관측 자료</h3>${p.revealed?dayMoon(day):'<div class="unknown-moon">?</div>'}</div></div>${p.original?`<div class="first-thought">처음 생각 ${moonSVG(p.original.amount,p.original.side)}<span>${p.original.amount}% · ${p.original.side==='right'?'오른쪽':'왼쪽'}</span></div>`:''}${strip(d.phases.captures)}<p class="model-note">북반구 관찰 방향을 예로 든 학습 모형이야.</p>`;
      tools=`${title('예상 모양 만들기')}${range('밝은 부분','prediction-amount',0,100,p.amount,1,'%')}<div class="choice-grid two">${b('오른쪽이 밝아','side-right',p.side==='right'?'choice-card selected':'choice-card')}${b('왼쪽이 밝아','side-left',p.side==='left'?'choice-card selected':'choice-card')}</div>${!p.revealed?b('내 예상 저장 · 관측하기','reveal-phase','primary'):`${b(learningUI.overlayVisible?'나란히 보기':'겹쳐서 비교','overlay-phase','secondary')}${field('관측한 뒤 달라진 생각','phase-reflection',p.reflection,'어떤 부분이 같거나 달랐어? 예상도 고쳐 봐.')}<p class="progress-hint">${p.overlay?'✓ 두 모습을 겹쳐 비교했어.':'두 모습을 겹쳐서도 비교해 줘.'}</p>`}`;break;}
    case 's3a':{const p=d.planets,current=planets.find(v=>v.id===p.selected);instruction='행성의 모습을 살펴보고 이름을 뒷받침하는 특징을 기록해 줘.';
      main=`<div class="planet-choices">${planets.map(v=>`<button class="planet-choice ${p.selected===v.id?'selected':''}" data-learning="planet-${v.id}" aria-label="${v.name} 조사">${planetImage(v.id,'')}<span>${v.name}${p.records[v.id]?' ✓':''}</span></button>`).join('')}</div><div class="planet-exhibit">${learningUI.three?'<div id="planet-viewer" class="planet-viewer"></div>':planetImage(current.id,`${current.name} 학습용 외형 그림`,'planet-portrait')}<span class="model-note">학습용 외형 모형 · 행성 간 실제 크기 비율은 달라</span></div><div class="viewer-toolbar">${b(learningUI.three?'그림으로 관찰':'입체 모형 돌려보기','toggle-three','chip')}${range('확대','planet-zoom',.5,2,learningUI.zoom,.1,'×')}${learningUI.three?range('회전','planet-rotation',-180,180,learningUI.rotation,5,'°'):''}</div>`;
      tools=`${title(`${current.name} 관찰 노트`)}<label class="field-label" for="planet-feature">${current.name}에서 찾은 특징</label><select id="planet-feature"><option value="">특징을 연결해 줘</option>${planets.map(v=>`<option ${p.feature===v.feature?'selected':''}>${v.feature}</option>`).join('')}</select>${feedback('planet-feedback',{tone:p.records[current.id]?'success':'hint',text:p.records[current.id]?`${current.name}의 관찰 근거가 노트에 담겼어.`:'그림의 특징을 고르면 바로 기록하고 다음 행성을 살펴봐.'})}<p class="flow-progress">필수 조사 ${requiredPlanets.filter(id=>p.records[id]).length} / 6</p><details class="science-note"><summary>행성 참고 자료</summary>${planets.map(v=>`<p><b>${v.name}</b> · ${v.feature}</p>`).join('')}</details><p class="progress-hint">수성부터 토성까지 조사해 줘. 나머지도 자유롭게 볼 수 있어.</p>`;break;}
    case 's3b':{const p=d.planets;instruction=i===0?'자료를 참고해 태양과 여덟 행성의 자리를 정해 줘.':'자료의 특징을 참고해 여덟 행성을 세 무리로 묶어 줘.';
      main=`${tabs(['태양에서의 순서','행성의 특징 묶기'],[solarOrder.every((id,j)=>p.order[j]===id),planets.every(v=>p.groups[v.id]===v.group)])}${i===0?`<div class="order-slots">${solarOrder.map((id,j)=>`<button class="answer-target ${p.order[j]?(p.order[j]===id?'is-correct':'needs-review'):''}" data-slot="${j}" aria-label="${j===0?'태양 자리':j+'번째 행성 자리'}"><small>${j===0?'중심':j+'번째'}</small>${token(p.order[j])}</button>`).join('')}</div>`:`<div class="group-targets">${planetGroups.map(g=>`<button class="answer-target group-target" data-group="${g.id}"><strong>${g.name}</strong><small>${g.info}</small><div>${planets.filter(v=>p.groups[v.id]===g.id).map(v=>planetImage(v.id,v.name)).join('')}</div></button>`).join('')}</div>`}<div class="piece-tray">${planetsForTask(i).map(id=>`<button class="planet-chip ${learningUI.piece===id?'selected':''} ${i===1&&p.groups[id]?'is-placed':''}" aria-pressed="${learningUI.piece===id}" data-piece="${id}" draggable="true" ${i===0&&p.order.includes(id)?'disabled':''}>${token(id)}</button>`).join('')}</div><p class="model-note">선택 후 놓기 · 끌어 놓기도 가능 · 실제 비율과 달라.</p>`;
      tools=`${title('내 연구 자료 활용')}${b(`${icon('book')} 조사 노트 열기`,'solar-note','primary')}<p>${i===0?'겉모습만으로 순서를 알 수는 없어. 순서 자료를 활용해 줘.':'암석·가스·얼음형의 특징을 자료에서 비교해 줘.'}</p>${feedback('solar-feedback',solarFeedback(p,i))}<p class="progress-hint">${i===0?'놓은 자리를 누르면 비울 수 있어.':'한 행성을 놓으면 다음 행성이 선택돼. 무리만 눌러 이어서 분류해 봐.'}</p>`;break;}
    case 's4a':{const subset=bodies.slice(i*4,i*4+4),inspected=subset.find(v=>v.id===learningUI.inspectedBody);instruction='보이는 모습과 과학 자료를 함께 읽어, 빛이 어디서 오는지 찾아 줘.';
      main=`${tabs(['가까운 하늘','더 넓은 하늘'],[bodies.slice(0,4),bodies.slice(4)].map(group=>group.every(v=>d.classification.viewed.includes(v.id))))}<div class="sky-bodies">${subset.map(v=>`<button class="sky-body ${d.classification.viewed.includes(v.id)?'viewed':''} ${inspected===v?'selected':''}" data-learning="body-${v.id}" aria-pressed="${inspected===v}">${bodyPicture(v)}<strong>${v.name}</strong><span>${v.look}</span><small>${d.classification.viewed.includes(v.id)?'✓ 자료를 비교했어':'과학 자료 살펴보기'}</small></button>`).join('')}</div><p class="model-note">태양을 직접 보면 위험해. 그림의 크기·색·빛은 학습용 표현이야.</p>`;
      tools=`<section class="body-fact" aria-live="polite">${inspected?`<h3>${inspected.name} · 빛의 근원</h3><p>${inspected.info}</p>`:'<p>천체를 누르면 여기서 자료를 읽고 기록해.</p>'}</section>${title('빛의 근원 실험')}<div class="light-lab">${lightExperiment(learningUI.lightBlocked)}${b(learningUI.lightBlocked?'가림판 치우기':'태양빛 가려 보기','light-toggle','secondary',`aria-pressed="${learningUI.lightBlocked}"`)}<p>${learningUI.lightBlocked?'가림판이 빛을 막아 반사광도 사라졌어요. 태양은 계속 빛나요.':'금빛은 태양빛, 청록색은 행성에서 우리에게 오는 반사광이에요.'}</p></div><p class="feedback">${d.classification.viewed.length}/8 자료 비교</p><p class="progress-hint">천체를 눌러 빛의 근원을 기록해요.</p>`;break;}
    case 's4b':{const subset=bodies.slice(i*4,i*4+4),v=subset[learningUI.body%4],a=d.classification.answers[v.id]||{};instruction=`${v.name}의 이름표와, 그 판단을 뒷받침하는 근거를 연결해 줘.`;
      main=`${tabs(['판별 기록 하나','판별 기록 둘'],[bodies.slice(0,4),bodies.slice(4)].map(group=>group.every(v=>d.classification.answers[v.id]?.kind===v.kind&&d.classification.answers[v.id]?.reason===v.evidence)))}<div class="body-tabs">${subset.map((x,j)=>b(`${x.name}${d.classification.answers[x.id]?.kind===x.kind&&d.classification.answers[x.id]?.reason===x.evidence?' ✓':''}`,'bodytab-'+j,j===learningUI.body?'chip selected':'chip')).join('')}</div><div class="classification-exhibit">${bodyPicture(v)}<h2>${v.name}</h2><div class="claim-target answer-target" data-claim-target>${a.kind?a.kind==='star'?'별':'행성':'이름표를 여기에 붙여 줘'}</div><div class="claim-tray">${b('별','kind-star',a.kind==='star'?'choice-card selected':'choice-card','draggable="true" data-claim="star"')}${b('행성','kind-planet',a.kind==='planet'?'choice-card selected':'choice-card','draggable="true" data-claim="planet"')}</div></div><p class="model-note">천체의 빛을 확대한 학습용 그림 · 실제 크기 비교가 아니야.</p>`;
      tools=`${title('그렇게 생각한 근거')}<div class="reason-choices">${reasons.map(([id,label])=>b(label,'reason-'+id,a.reason===id?'choice-card selected':'choice-card')).join('')}</div>${feedback('classification-feedback',classificationFeedback(v,a))}<p class="flow-progress">${bodies.filter(x=>classificationFeedback(x,d.classification.answers[x.id]).correct).length}/8 근거 연결</p><details class="science-note"><summary>${v.name} 자료 다시 읽기</summary><p>${v.info}</p></details>`;break;}
    case 's5a':{const region=regions[i];instruction='두 구역의 별을 살펴보며, 별 사이의 간격과 방향을 관찰해 줘.';
      main=`${tabs(['위쪽 별 무리','아래쪽 별 무리'],regions.map(k=>patternRegions[k].stars.filter(id=>d.pattern.observed.includes(id)).length>=2))}<div id="star-view">${starChart({observed:d.pattern.observed,selected:learningUI.selectedStar,region})}</div><p class="model-note">주어진 북극성 주변의 배열을 확대한 학습 지도야.</p>`;
      tools=`${title('선을 보기 전에 관찰')}<p>별을 눌러 보면서 연결하고 싶은 모양을 생각해 봐.</p><div id="star-observation" class="observation-card">${learningUI.selectedStar?starNames[learningUI.selectedStar]+'를 살펴봤어.':'별을 누르면 관찰 기록이 남아.'}</div><p class="feedback">서로 다른 별 ${d.pattern.observed.filter(id=>id!=='Polaris').length}개 관찰</p><p class="progress-hint">각 구역에서 두 별 이상, 모두 여섯 별을 관찰해 줘.</p>`;break;}
    case 's5b':{const region=regions[i],c=d.pattern.cases[region];instruction='네가 먼저 별을 이어 본 뒤, 기준 패턴과 비교해 줘.';
      main=`${tabs(['위쪽 별 패턴','아래쪽 별 패턴'],regions.map(k=>{const c=d.pattern.cases[k];return c.original?.length>=2&&c.compared&&c.reflection.trim().length>=3;}))}<div id="star-view">${starChart({lines:c.lines,reference:c.showReference,selected:learningUI.selectedStar,region})}</div><div class="chart-actions">${b('선 하나 되돌리기','undo-line','chip',c.lines.length?'':'disabled')}${b('새 연결 시작','cancel-line','chip',learningUI.selectedStar?'':'disabled')}</div><p class="model-note">${c.showReference?'청록색: 내 선 · 금빛 점선: 기준':'별을 차례로 누르면 선이 계속 이어져. 같은 별을 다시 누르면 연결을 마쳐.'}</p>`;
      tools=`${title('나만의 별 배열')}<p>선 두 개 이상으로 네 패턴을 만들어 봐. 기준과 달라도 괜찮아.</p>${!c.original?b('내 패턴 저장 · 기준 비교','compare-pattern','primary',c.lines.length<2?'disabled':''):`${b(c.showReference?'기준선 숨기기':'기준선 보기','toggle-reference','secondary')}<p class="progress-hint">기준은 ${i===0?'카시오페이아자리':'큰곰자리의 일부인 북두칠성'}이야. 선은 사람이 별에 덧붙인 표현이야.</p>${field('같거나 다른 점','pattern-reflection',c.reflection,'내 선과 기준선은 어떻게 달랐니?')}`}`;break;}
  }
  return {main,tools,instruction};
}
function planetsForTask(i){return i===0?['saturn','earth','sun','neptune','mars','mercury','jupiter','uranus','venus']:planets.map(v=>v.id);}
export function token(id){if(!id)return '<span class="slot-plus">+</span>';return `${id==='sun'?celestialImage('sun','','sun-token'):planetImage(id,'')}<strong>${id==='sun'?'태양':planets.find(v=>v.id===id)?.name}</strong>`;}
function bodyPicture(v){return v.kind==='planet'?planetImage(v.id,`${v.name} 외형 모형`):celestialImage(v.id==='sun'?'sun':'star',v.id==='sun'?'태양 표면을 표현한 학습용 그림':`${v.name}의 빛을 확대한 학습용 그림`,`star-orb ${v.id==='sun'?'sun-orb':''}`);}
export function learningView(s){const n=+s.scene[1],part=s.scene.at(-1),c=chapters[n-1],v=content(s,s.scene),next=getStageAction(s,round());return `<main class="experience learning-v2" data-scene="${s.scene}"><div class="room-bg"></div><div class="activity-heading"><p>${c.place} · ${c.steps[part==='a'?0:1]}</p><h1 id="screen-title" tabindex="-1">${v.instruction}</h1></div><div class="activity-layout"><section class="experiment-zone">${v.main}</section><aside class="toolbox">${v.tools}</aside></div><div class="activity-action">${button(next.label,next.action,'primary',`id="stage-next" ${next.disabled?'disabled':''}`)}<small id="completion-hint">${(part==='a'?firstReady(s,n):stageReady(s,n))?'관찰 기록이 준비됐어.':'두 활동 묶음의 기록을 모두 완성해 줘.'}</small></div></main>`;}

export function mountLearning(root,ctx){const {state:s,save,render,notify,dialog,on,refresh,sound}=ctx,d=s.drafts,scene=s.scene;let viewer=null,disposed=false,timeTimer=null,advanceTimer=null,advancing=false,touchCleanup=()=>{},starDrag=null;
  const $=selector=>root.querySelector(selector),$$=selector=>[...root.querySelectorAll(selector)];
  function commit(){save();refresh();}
  const redraw=()=>{
    const active=document.activeElement,attribute=['learning','star','piece','slot','group'].find(key=>active?.hasAttribute('data-'+key));
    const selector=active?.id?`#${active.id}`:attribute?`[data-${attribute}="${active.dataset[attribute]}"]`:null;
    commit();render();
    if(selector){const target=root.querySelector(selector);if(target&&!target.disabled)target.focus({preventScroll:true});else $('#screen-title')?.focus({preventScroll:true});}
  };
  const day=()=>round()===0?14:24;
  const prediction=()=>d.phases.predictions[day()];
  const pattern=()=>d.pattern.cases[regions[round()]];
  const selectedBody=()=>bodies.slice(round()*4,round()*4+4)[learningUI.body%4];
  function updateScope(){const m=d.moon,same=m.photos.some((p,j)=>j!==round()&&Math.abs(p.zoom-m.zoom)<.09),ready=photoReady(m)&&!same&&(round()===0||!!m.photos[0]);$('#scope-moon').style.cssText=`transform:translate(${m.x}%,${m.y}%) scale(${m.zoom*.65});filter:blur(${Math.abs(m.focus-72)/9}px)`;$('#focus-status').textContent=same?'첫 사진과 다른 배율로 바꿔 줘.':ready?'선명해! 사진을 담을 수 있어.':'달을 가운데 놓고, 가장 또렷한 초점을 찾아봐.';$('#capture-moon').disabled=!ready;}
  function pan(dx,dy){d.moon.x=Math.max(-80,Math.min(80,d.moon.x+dx));d.moon.y=Math.max(-80,Math.min(80,d.moon.y+dy));updateScope();commit();}
  function spot(x,y){const c=d.moon.comparisons[round()];if(Math.hypot(x-50,y-50)>48)return;if(d.moon.comparisons.some(other=>other.spots.some(p=>Math.hypot(x-p.x,y-p.y)<10)))return notify('앞서 고른 곳과 조금 떨어진 다른 표면을 골라 봐.');if(c.spots.length===2)c.spots.shift();c.spots.push({x,y});redraw();}
  function answer(){const id=selectedBody().id;return d.classification.answers[id]||=( {kind:'',reason:''} );}
  function showFeedback(id,status){const element=$('#'+id);if(element){element.textContent=status.text;element.dataset.tone=status.tone;}}
  function queueNext(kind,id){learningUI.pendingAdvance={scene,kind,id};redraw();}
  function judgeClassification(){const body=selectedBody(),status=classificationFeedback(body,answer());if(status.correct){sound?.play('success');if(nextBody(d.classification.answers,body.id)!==-1)return queueNext('body',body.id);}redraw();}
  function choosePlanet(id){d.planets.selected=id;d.planets.feature=d.planets.records[id]?.feature||'';d.planets.candidate=id;learningUI.zoom=1;learningUI.rotation=0;}
  function captureDay(day){if(timeTimer){clearInterval(timeTimer);timeTimer=null;}const added=recordPhase(d.phases,day);if(added)sound?.play('capture');redraw();}
  function action(a){
    if(advancing&&(a.startsWith('kind-')||a.startsWith('reason-')))return;
    if(a!=='capture-phase'&&!a.startsWith('day-'))sound?.play(a.startsWith('capture-')?'capture':a.startsWith('record-')?'discover':'click');
    if(a==='light-toggle'){learningUI.lightBlocked=!learningUI.lightBlocked;render();return;}
    if(a==='play-time'){if(timeTimer){clearInterval(timeTimer);timeTimer=null;}else{timeTimer=setInterval(()=>{if(document.hidden||document.querySelector('dialog[open]'))return;d.phases.day=(d.phases.day+1)%30;$('#phase-day').value=d.phases.day;updateDay();commit();},450);}$('#play-time').textContent=timeTimer?'시간 흐름 멈추기':'시간 흐름 재생';$('#play-time').setAttribute('aria-pressed',!!timeTimer);return;}
    if(a.startsWith('round-')){learningUI.round=+a.at(-1);learningUI.body=0;learningUI.selectedStar=null;learningUI.inspectedBody=null;learningUI.piece=null;learningUI.overlayVisible=false;redraw();return;}
    if(a.startsWith('pan-')){pan(...{up:[0,-8],down:[0,8],left:[-8,0],right:[8,0]}[a.slice(4)]);return;}
    if(a==='capture-moon'){const m=d.moon;if(!photoReady(m))return;if(round()===1&&!m.photos[0])return notify('먼저 전체 모습 사진을 한 장 담아 줘.');if(m.photos.some((p,j)=>j!==round()&&Math.abs(p.zoom-m.zoom)<.09))return notify('이번에는 배율을 조금 바꾸어서 촬영해 줘.');m.photos[round()]={x:m.x,y:m.y,zoom:m.zoom,focus:m.focus};if(round()===0)learningUI.round=1;redraw();notify('관측사진을 연구 노트에 담았어.');return;}
    if(a.startsWith('spot-')){const [,x,y]=a.split('-');spot(+x,+y);return;}
    if(a.startsWith('day-')){captureDay(+a.slice(4));return;}
    if(a==='capture-phase'){captureDay(d.phases.day);return;}
    if(a.startsWith('side-')){prediction().side=a.slice(5);redraw();return;}
    if(a==='reveal-phase'){const p=prediction();p.original||={amount:p.amount,side:p.side};p.revealed=true;p.overlay=true;learningUI.overlayVisible=true;redraw();return;}
    if(a==='overlay-phase'){prediction().overlay=true;learningUI.overlayVisible=!learningUI.overlayVisible;redraw();return;}
    if(a.startsWith('planet-')){choosePlanet(a.slice(7));redraw();return;}
    if(a==='toggle-three'){learningUI.three=!learningUI.three;render();return;}
    if(a==='solar-note'){dialog('내 조사 노트와 태양계 자료',`<p class="order-note">태양 → ${planets.map(v=>v.name).join(' → ')}</p><h3>행성을 묶는 참고 자료</h3>${planetGroups.map(g=>`<p><b>${g.name}</b> · ${g.info}<br>${planets.filter(v=>v.group===g.id).map(v=>v.name).join(', ')}</p>`).join('')}<h3>직접 조사한 근거</h3>${Object.entries(d.planets.records).map(([id,v])=>`<p><b>${planets.find(x=>x.id===id)?.name}</b> · ${esc(v.feature)}</p>`).join('')}`);return;}
    if(a.startsWith('body-')){const id=a.slice(5);learningUI.inspectedBody=id;if(!d.classification.viewed.includes(id)){d.classification.viewed.push(id);sound?.play('discover');}redraw();return;}
    if(a.startsWith('bodytab-')){learningUI.body=+a.at(-1);render();return;}
    if(a.startsWith('kind-')){answer().kind=a.slice(5);judgeClassification();return;}
    if(a.startsWith('reason-')){answer().reason=a.slice(7);judgeClassification();return;}
    if(a==='undo-line'){pattern().lines.pop();learningUI.selectedStar=null;redraw();return;}
    if(a==='cancel-line'){learningUI.selectedStar=null;render();return;}
    if(a==='compare-pattern'){const c=pattern();if(c.lines.length<2)return;c.original||=clone(c.lines);c.compared=true;c.showReference=true;learningUI.selectedStar=null;redraw();return;}
    if(a==='toggle-reference'){pattern().showReference=!pattern().showReference;redraw();return;}
  }
  $$('[data-learning]').forEach(el=>on(el,'click',()=>action(el.dataset.learning)));
  const text=(id,obj,key)=>on($(id),'input',e=>{obj[key]=e.target.value.slice(0,240);commit();});
  if(scene==='s1a'){updateScope();for(const [id,key,unit]of[['moon-zoom','zoom','×'],['moon-focus','focus','']])on($('#'+id),'input',e=>{d.moon[key]=+e.target.value;$('#'+id+'-value').textContent=e.target.value+unit;updateScope();commit();});let drag=null;on($('#scope-drag'),'pointerdown',e=>{drag=[e.clientX,e.clientY];e.currentTarget.setPointerCapture(e.pointerId);});on($('#scope-drag'),'pointermove',e=>{if(!drag)return;const r=e.currentTarget.getBoundingClientRect();pan((e.clientX-drag[0])/r.width*100,(e.clientY-drag[1])/r.height*100);drag=[e.clientX,e.clientY];});for(const type of ['pointerup','pointercancel'])on($('#scope-drag'),type,()=>drag=null);on($('#scope-drag'),'keydown',e=>{const v={ArrowUp:[0,-8],ArrowDown:[0,8],ArrowLeft:[-8,0],ArrowRight:[8,0]}[e.key];if(v){e.preventDefault();pan(...v);}});}
  if(scene==='s1b'){text('#moon-observation',d.moon.comparisons[round()],'observation');on($('#surface-moon'),'click',e=>{const r=e.currentTarget.getBoundingClientRect();spot((e.clientX-r.left)/r.width*100,(e.clientY-r.top)/r.height*100);});}
  function updateDay(){$('#phase-day-value').textContent=d.phases.day+'일째';$('#day-label').textContent=d.phases.day+'일째';$('#phase-moon').innerHTML=dayMoon(d.phases.day);$('#capture-phase').disabled=d.phases.captures.includes(d.phases.day);}
  if(scene==='s2a')on($('#phase-day'),'input',e=>{d.phases.day=+e.target.value;updateDay();commit();});
  if(scene==='s2b'){on($('#prediction-amount'),'input',e=>{prediction().amount=+e.target.value;$('#prediction-amount-value').textContent=e.target.value+'%';$('#prediction-moon').innerHTML=moonSVG(prediction().amount,prediction().side);commit();});text('#phase-reflection',prediction(),'reflection');}
  if(scene==='s3a'){
    on($('#planet-feature'),'change',event=>{
      if(advancing)return;
      const correct=recordPlanet(d.planets,event.target.value,{rotation:learningUI.rotation,zoom:learningUI.zoom},learningUI.three?'3d':'illustration');
      if(!correct){commit();showFeedback('planet-feedback',{tone:'hint',text:'무늬·표면·고리를 그림과 다시 비교해 봐.'});return;}
      sound?.play('discover');
      if(nextPlanet(d.planets))queueNext('planet',d.planets.selected);else redraw();
    });
    if(learningUI.three)import('./planet.js').then(({mountPlanet})=>{if(disposed)return;viewer=mountPlanet($('#planet-viewer'),planets.find(v=>v.id===d.planets.selected));viewer.setView(learningUI.rotation,learningUI.zoom);}).catch(()=>{if(!disposed)$('#planet-viewer').innerHTML='<p>입체 모형을 열지 못했어. 그림으로도 조사할 수 있어.</p>';});
    on($('#planet-zoom'),'input',event=>{learningUI.zoom=+event.target.value;$('#planet-zoom-value').textContent=event.target.value+'×';if(viewer)viewer.setView(learningUI.rotation,learningUI.zoom);else if($('.planet-portrait'))$('.planet-portrait').style.transform=`scale(${learningUI.zoom})`;});
    on($('#planet-rotation'),'input',event=>{learningUI.rotation=+event.target.value;$('#planet-rotation-value').textContent=event.target.value+'°';viewer?.setView(learningUI.rotation,learningUI.zoom);});
  }
  if(scene==='s3b'){
    function selectPiece(id){learningUI.piece=id;$$('[data-piece]').forEach(element=>{const selected=element.dataset.piece===id;element.classList.toggle('selected',selected);element.setAttribute('aria-pressed',selected);});}
    function place(slot,group){
      if(!learningUI.piece){if(slot!==undefined){d.planets.order[slot]=null;redraw();}else notify('아래에서 행성을 먼저 골라 줘.');return;}
      const id=learningUI.piece;
      if(group)d.planets.groups[id]=group;else{d.planets.order=d.planets.order.map(value=>value===id?null:value);d.planets.order[slot]=id;}
      const correct=group?planets.find(p=>p.id===id).group===group:solarOrder[slot]===id;
      learningUI.piece=group?(correct?planets.find(p=>!d.planets.groups[p.id])?.id||null:id):null;
      sound?.play(correct?'place':'click');redraw();
      if(group&&learningUI.piece)showFeedback('solar-feedback',{...solarFeedback(d.planets,1),text:`${solarFeedback(d.planets,1).text} · 선택: ${planets.find(p=>p.id===learningUI.piece).name}`});
    }
    $$('[data-piece]').forEach(element=>on(element,'click',()=>selectPiece(learningUI.piece===element.dataset.piece?null:element.dataset.piece)));
    $$('[data-slot],[data-group]').forEach(element=>on(element,'click',()=>place(element.hasAttribute('data-slot')?+element.dataset.slot:undefined,element.dataset.group)));
    touchCleanup=mountTouchDrag(root,{sources:'[data-piece]',targets:'[data-slot],[data-group]',on,onDrop(source,target){learningUI.piece=source.dataset.piece;place(target.hasAttribute('data-slot')?+target.dataset.slot:undefined,target.dataset.group);}});
  }
  if(scene==='s4b')touchCleanup=mountTouchDrag(root,{sources:'[data-claim]',targets:'[data-claim-target]',on,onDrop(source){if(advancing)return;answer().kind=source.dataset.claim;judgeClassification();}});
  if(scene==='s5a'||scene==='s5b'){
    $$('[data-star]').forEach(element=>{
      function pick(){
        const id=element.dataset.star;
        if(scene==='s5a'){if(!d.pattern.observed.includes(id)){d.pattern.observed.push(id);sound?.play('discover');}learningUI.selectedStar=id;}
        else{if(connectStars(pattern(),learningUI.selectedStar,id))sound?.play('place');learningUI.selectedStar=learningUI.selectedStar===id?null:id;}
        redraw();
      }
      on(element,'click',pick);on(element,'keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();pick();}});
    });
    if(scene==='s5b'){
      text('#pattern-reflection',pattern(),'reflection');
      on($('#star-view'),'pointerdown',event=>{const source=event.target.closest('[data-star]');if(source&&event.button===0)starDrag={id:source.dataset.star,x:event.clientX,y:event.clientY};});
      on($('#star-view'),'pointerup',event=>{
        if(!starDrag)return;const target=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-star]'),start=starDrag;starDrag=null;
        if(target&&target.dataset.star!==start.id&&Math.hypot(event.clientX-start.x,event.clientY-start.y)>10){
          // The pointer's click arrives after redraw, so suppress just that click across mounts.
          const suppress=click=>{click.preventDefault();click.stopImmediatePropagation();document.removeEventListener('click',suppress,true);};
          document.addEventListener('click',suppress,true);setTimeout(()=>document.removeEventListener('click',suppress,true),100);
          if(connectStars(pattern(),start.id,target.dataset.star))sound?.play('place');learningUI.selectedStar=target.dataset.star;redraw();
        }
      });
      on($('#star-view'),'pointercancel',()=>starDrag=null);
    }
  }
  const pending=learningUI.pendingAdvance;learningUI.pendingAdvance=null;
  if(pending?.scene===scene){
    advancing=true;$('.learning-v2').classList.add('is-advancing');
    const controls=pending.kind==='planet'?$$('#planet-feature'):$$('[data-claim],.reason-choices button');controls.forEach(element=>element.disabled=true);
    const advance=()=>{
      if(disposed||s.scene!==scene)return;
      if(document.hidden||document.querySelector('dialog[open]')){advanceTimer=setTimeout(advance,200);return;}
      if(pending.kind==='planet'&&d.planets.selected===pending.id){const id=nextPlanet(d.planets);if(id)choosePlanet(id);}
      if(pending.kind==='body'&&selectedBody().id===pending.id){const index=nextBody(d.classification.answers,pending.id);if(index>=0){learningUI.round=Math.floor(index/4);learningUI.body=index%4;}}
      advancing=false;redraw();$('#screen-title')?.focus({preventScroll:true});
    };
    advanceTimer=setTimeout(advance,900);
  }
  let starResize;
  if($('#star-view')){starResize=new ResizeObserver(()=>{const svg=$('#star-view svg'),scale=svg?.getScreenCTM()?.a;if(scale)$$('[data-star]').forEach(star=>star.querySelector('circle').setAttribute('r',Math.max(10,24/Math.abs(scale))));});starResize.observe($('#star-view'));}
  return ()=>{disposed=true;clearInterval(timeTimer);clearTimeout(advanceTimer);starResize?.disconnect();touchCleanup();viewer?.dispose();};
}
