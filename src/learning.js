import { freshLightTrial, predictLight, observeLight } from './light-trial.js';
import { mountNarrationControl } from './narration.js';
import { lunarModelVoice } from './lunar-model.js';
import { nearestStar } from './star-hit.js';
import { chapters,planets,solarOrder,bodies,planetGroups } from './data.js';
import { photoReady,clone,track } from './state.js';
import { moonSVG,dayMoon } from './drawing.js';
import { button,esc,icon,token } from './ui.js';
import { learningUI } from './learning-ui.js';
import { mountLessonViewport } from './stage-viewport.js';
import { mountTouchDrag } from './touch-drag.js';
import { getStageAction, getLearningGuide } from './progression.js';
import { pageConcepts } from './curriculum.js';
import { renderMoonStage } from './moon-stages.js';
import { renderSpaceStage } from './space-stages.js';
import { moonSurfaceChoices, phaseChoices, patternChoices, composeReflection } from './reflection-chips.js';
import { mountFogWipe, mountShieldDrag, snapDay } from './stage-gestures.js';
import { discoveryDays } from './discovery-route.js';
import { recordPhase, recordPlanet, nextPlanet, classificationFeedback, nextBody, solarFeedback, connectStars } from './learning-flow.js';
import './activity-design.css';

const round=()=>learningUI.round;
const regions=['cassiopeia','dipper'];
// NASA GSFC Planetary Fact Sheet, mean distance from the Sun in million km.
// The reading order follows neither distance nor the order in the placement tray.
const planetDistances = [
  ['earth', 149.6], ['uranus', 2867], ['mercury', 57.9], ['jupiter', 778.5],
  ['venus', 108.2], ['neptune', 4515], ['saturn', 1432], ['mars', 228],
];
const distanceFormat = new Intl.NumberFormat('ko-KR');
function solarReference(records) {
  const distanceRows = planetDistances.map(([id, distance]) => `<div class="distance-row">${token(id)}<b>${distanceFormat.format(distance)}</b></div>`).join('');
  const writtenRecords = Object.entries(records).map(([id, record]) => `<p><b>${planets.find(planet => planet.id === id)?.name}</b> · ${esc(record.feature)}</p>`).join('');
  return `<p>태양에서 떨어진 평균 거리 · 백만 km</p><div class="distance-rows">${distanceRows}</div>
    <p class="data-source"><a href="https://nssdc.gsfc.nasa.gov/planetary/factsheet/" target="_blank" rel="noopener noreferrer">자료 출처 · NASA</a></p>
    <details><summary>크기와 성분</summary><p>지름을 지구와 비교하면 ${planets.map(planet => `${planet.name} ${planet.size}배`).join(', ')}예요.</p>${planetGroups.map(group => `<p><b>${group.name}</b> · ${group.info}</p>`).join('')}</details>
    ${writtenRecords ? `<details><summary>직접 조사한 근거</summary>${writtenRecords}</details>` : ''}`;
}
const tabs=(names,done=[])=>`<div class="case-tabs" role="group" aria-label="활동 묶음">${names.map((n,i)=>`<button class="case-tab ${round()===i?'active':''}" data-learning="round-${i}" aria-pressed="${round()===i}">${n} ${done[i]?'✓':''}</button>`).join('')}</div>`;
const strip=days=>`<div class="record-strip">${[...days].sort((a,b)=>a-b).map(d=>`<div>${dayMoon(d)}<small>${d}일째</small></div>`).join('')}</div>`;
const title=t=>`<h2 class="tool-title">${t}</h2>`;
const feedback=(id,status)=>`<p id="${id}" class="inline-feedback" role="status" data-tone="${status.tone}">${status.text}</p>`;
function content(s,scene){const i=round(),helpers={tabs,title,strip,feedback,token};return renderMoonStage(s,scene,i,learningUI,helpers)||renderSpaceStage(s,scene,i,learningUI,helpers);}
export function learningView(s,chrome=''){
  const n=+s.scene[1],part=s.scene.at(-1),c=chapters[n-1],v=content(s,s.scene),next=getStageAction(s,round());
  const concept=pageConcepts[s.scene],guide=getLearningGuide(s,learningUI);
  const stepName=c.steps[part==='a'?0:1],finished=next.disabled?'is-pending':'is-ready';
  const tools=v.tools ? `<aside class="toolbox" aria-label="실험 조작">${v.tools}</aside>` : '';
  return `<main class="experience learning-v2" data-scene="${s.scene}" aria-label="${stepName}" data-standard="${concept.standard}"><div class="room-bg"></div>${chrome}
    <div class="activity-heading"><p class="lesson-concept"><span>${stepName}</span></p>
      <h1 id="screen-title" tabindex="-1" aria-live="polite"><span ${s.scene==='s5a'&&round()===2?'id="star-observation"':''} class="activity-instruction">${guide.text}</span></h1>
    </div>
    <div class="activity-layout ${tools?'':'single-stage'}"><section class="experiment-zone" aria-label="${v.instruction}">${v.main}</section>${tools}</div>
    <footer class="activity-footer"><div class="lesson-help">${button('힌트','hint','ghost')}${button(`${icon('book',18)} 기록`,'kit','ghost')}</div>
      <div class="activity-action">${button(next.label,next.action,`primary ${finished}`,`id="stage-next" ${next.disabled?'disabled':''}`)}</div>
    </footer></main>`;
}

export function mountLearning(root,ctx){const {state:s,save,render,notify,dialog,on,refresh,sound}=ctx,d=s.drafts,scene=s.scene;const gestures=new AbortController();let scopeVoiceCleanup=()=>{},viewer=null,disposed=false,advanceTimer=null,roundTimer=null,advancing=false,touchCleanup=()=>{},starDrag=null;
  const releaseViewport=mountLessonViewport(root.querySelector('.learning-v2'));
  const $=selector=>root.querySelector(selector),$$=selector=>[...root.querySelectorAll(selector)];
  function commit(){save();refresh();guide();}
  const redraw=()=>{
    const active=document.activeElement,attribute=['learning','star','piece','slot','group'].find(key=>active?.hasAttribute('data-'+key));
    const selector=active?.id?`#${active.id}`:attribute?`[data-${attribute}="${active.dataset[attribute]}"]`:null;
    commit();render();
    if(selector){const target=root.querySelector(selector);if(target&&!target.disabled)target.focus({preventScroll:true});else $('#screen-title')?.focus({preventScroll:true});}
  };
  if(scene.startsWith('s2'))scopeVoiceCleanup=mountNarrationControl($('[data-phase-model-voice]'),lunarModelVoice.id,ctx.narration,{autoplay:false,compact:true});
  const day=()=>round()===0?14:24;
  const prediction=()=>d.phases.predictions[day()];
  const pattern=()=>d.pattern.cases[regions[round()]];
  const selectedBody=()=>bodies.slice(round()*4,round()*4+4)[learningUI.body%4];
  function updateScope(){
    const m=d.moon,same=m.photos.some((p,j)=>j!==round()&&Math.abs(p.zoom-m.zoom)<.09);
    const ready=photoReady(m)&&!same&&(round()===0||!!m.photos[0]);
    $('#scope-moon').style.cssText=`transform:translate(${m.x}%,${m.y}%) scale(${m.zoom*.65});filter:blur(${Math.abs(m.focus-72)/9}px)`;
    $('#capture-moon').disabled=!ready;
  }
  function pan(dx,dy){d.moon.x=Math.max(-80,Math.min(80,d.moon.x+dx));d.moon.y=Math.max(-80,Math.min(80,d.moon.y+dy));updateScope();commit();}
  function spot(x,y){const c=d.moon.comparisons[round()];if(Math.hypot(x-50,y-50)>48)return;if(d.moon.comparisons.some(other=>other.spots.some(p=>Math.hypot(x-p.x,y-p.y)<10)))return notify('앞서 고른 곳과 조금 떨어진 다른 표면을 골라 봐.');if(c.spots.length===2)c.spots.shift();c.spots.push({x,y});track(s,'observations');redraw();}
  function answer(){const id=selectedBody().id;return d.classification.answers[id]||=( {kind:'',reason:''} );}
  function showFeedback(id,status){const element=$('#'+id);if(element){element.textContent=status.text;element.dataset.tone=status.tone;ctx.onFeedback?.(element);}}
  function queueNext(kind,id){learningUI.pendingAdvance={scene,kind,id};redraw();}
  function judgeClassification(){const body=selectedBody(),status=classificationFeedback(body,answer());if(!status.correct&&answer().kind&&answer().reason)track(s,'retries');if(status.correct){sound?.play('success');if(nextBody(d.classification.answers,body.id)!==-1)return queueNext('body',body.id);}else if(answer().kind&&answer().reason)sound?.play('retry');redraw();}
  function choosePlanet(id){d.planets.selected=id;d.planets.feature=d.planets.records[id]?.feature||'';d.planets.candidate=id;learningUI.zoom=1;learningUI.rotation=0;}
  function chooseFeature(value){
    if(advancing)return;
    const correct=recordPlanet(d.planets,value,{rotation:learningUI.rotation,zoom:learningUI.zoom},learningUI.three?'3d':'illustration');
    if(!correct){track(s,'retries');sound?.play('retry');redraw();showFeedback('planet-feedback',{tone:'hint',text:'무늬·표면·고리를 그림과 다시 비교해 봐.'});return;}
    sound?.play('discover');
    if(nextPlanet(d.planets))queueNext('planet',d.planets.selected);else redraw();
  }
  function reflectionTarget(){
    if(scene==='s1b')return {groups:moonSurfaceChoices(),obj:d.moon.comparisons[round()],key:'observation'};
    if(scene==='s2b')return {groups:phaseChoices(day(),prediction().original),obj:prediction(),key:'reflection'};
    if(scene==='s5b')return {groups:patternChoices(regions[round()],pattern().lines),obj:pattern(),key:'reflection'};
    return null;
  }
  function pickSentence(value){
    const target=reflectionTarget();if(!target)return;
    const [group,...rest]=value.split('-'),id=rest.join('-'),store=(learningUI.picks||={}),picks=(store[scene+'-'+round()]||={});
    picks[group]=id;
    const option=target.groups.find(item=>item.key===group)?.options.find(item=>item.id===id);
    if(option&&!option.ok){track(s,'retries');sound?.play('retry');}
    const sentence=composeReflection(target.groups,picks);
    target.obj[target.key]=sentence;
    if(sentence){sound?.play('success');track(s,'reviews');}
    redraw();
  }
  function captureDay(day){const added=recordPhase(d.phases,day);if(added){sound?.play('capture');track(s,'observations');}redraw();}
  function guide(){
    const next=getLearningGuide(s,learningUI);
    const target=$(next.target);
    $$('.is-next').filter(element=>element!==target).forEach(element=>element.classList.remove('is-next'));
    target?.classList.add('is-next');
    const instruction=$('.activity-instruction');
    if(instruction.textContent!==next.text)instruction.textContent=next.text;
    const advance=$('#stage-next');
    advance.classList.toggle('is-pending',advance.disabled);
    advance.classList.toggle('is-ready',!advance.disabled);
  }
  function action(a){
    if(advancing&&(a.startsWith('kind-')||a.startsWith('reason-')))return;
    if(a!=='capture-phase'&&!a.startsWith('day-'))sound?.play(a.startsWith('capture-')?'capture':a.startsWith('record-')?'discover':'click');
    if(a.startsWith('round-')){learningUI.round=+a.at(-1);learningUI.body=0;learningUI.selectedStar=null;learningUI.inspectedBody=null;learningUI.piece=null;learningUI.overlayVisible=false;redraw();return;}
    if(a.startsWith('pan-')){pan(...{up:[0,-8],down:[0,8],left:[-8,0],right:[8,0]}[a.slice(4)]);return;}
    if(a==='capture-moon'){const m=d.moon;if(!photoReady(m))return;if(round()===1&&!m.photos[0])return notify('먼저 전체 모습 사진을 한 장 담아 줘.');if(m.photos.some((p,j)=>j!==round()&&Math.abs(p.zoom-m.zoom)<.09))return notify('이번에는 배율을 조금 바꾸어서 촬영해 줘.');m.photos[round()]={x:m.x,y:m.y,zoom:m.zoom,focus:m.focus};track(s,'observations');if(round()===0)learningUI.round=1;redraw();return;}
    if(a.startsWith('spot-')){const [,x,y]=a.split('-');spot(+x,+y);return;}
    if(a.startsWith('seek-day-')){const value=Number(a.split('-').at(-1));d.phases.day=value;if(d.phases.captures.includes(value))redraw();else captureDay(value);return;}
    if(a.startsWith('day-')){d.phases.day=Number(a.split('-').at(-1));redraw();return;}
    if(a==='capture-phase'){captureDay(d.phases.day);return;}
    if(a.startsWith('side-')){
      prediction().side=a.slice(5);
      (learningUI.predictionAdjusted||={})[round()]=true;
      redraw();return;
    }
    if(a==='reveal-phase'){const p=prediction();p.original||={amount:p.amount,side:p.side};p.revealed=true;p.overlay=true;learningUI.overlayVisible=true;redraw();return;}
    if(a==='overlay-phase'){prediction().overlay=true;track(s,'reviews');learningUI.overlayVisible=!learningUI.overlayVisible;redraw();return;}
    if(a.startsWith('planet-')){choosePlanet(a.slice(7));track(s,'observations');redraw();return;}
    if(a==='clear-cloud'){learningUI.revealed[d.planets.selected]=true;sound?.play('discover');redraw();return;}
    if(a==='toggle-three'){learningUI.three=!learningUI.three;learningUI.threeUnavailable=false;if(learningUI.three)track(s,'observations');commit();render();return;}
    if(a==='phase-note'){const p=prediction();dialog(scene==='s2b'?'앞선 달 관측 기록':'모은 달 관측 기록',`<p>북반구에서 본 학습용 모형이에요. 학습용 날짜는 실제 달력과 달라요.</p>${strip(d.phases.captures)}${scene==='s2b'&&p.original?`<p>처음 예상: 밝은 부분 ${p.original.amount}% · ${p.original.side==='right'?'오른쪽':'왼쪽'}</p>`:''}`);return;}
    if(a==='body-note'){
      const body=selectedBody();
      dialog(body.name+' · 관측 기록',`<p>${body.look}</p><p>‘밝게 보인다’는 점과 빛이 어디서 오는지를 따로 생각해 봐요.</p>`);
      return;
    }
    if(a==='solar-note'){track(s,'reviews');commit();dialog('태양계 조사 자료',solarReference(d.planets.records));return;}
    if(a.startsWith('feature-')){chooseFeature(planets[+a.slice(8)].feature);return;}
    if(a.startsWith('pick-')){pickSentence(a.slice(5));return;}
    if(a.startsWith('predict-light-')){d.classification.lightTrial ||= freshLightTrial();predictLight(d.classification.lightTrial,a.slice(14));redraw();return;}
    if(a.startsWith('body-')){const id=a.slice(5);learningUI.inspectedBody=id;if(!d.classification.viewed.includes(id)){d.classification.viewed.push(id);sound?.play('discover');track(s,'observations');}redraw();return;}
    if(a.startsWith('bodytab-')){const index=+a.slice(8);learningUI.round=Math.floor(index/4);learningUI.body=index%4;render();return;}
    if(a.startsWith('kind-')){answer().kind=a.slice(5);judgeClassification();return;}
    if(a.startsWith('reason-')){answer().reason=a.slice(7);judgeClassification();return;}
    if(a==='undo-line'){pattern().lines.pop();track(s,'retries');learningUI.selectedStar=null;redraw();return;}
    if(a==='cancel-line'){learningUI.selectedStar=null;render();return;}
    if(a==='compare-pattern'){const c=pattern();if(c.lines.length<2)return;c.original||=clone(c.lines);c.compared=true;c.showReference=true;learningUI.selectedStar=null;redraw();return;}
    if(a==='toggle-reference'){pattern().showReference=!pattern().showReference;track(s,'reviews');redraw();return;}
  }
  $$('[data-learning]').forEach(el=>on(el,'click',()=>action(el.dataset.learning)));
  const text=(id,obj,key)=>on($(id),'input',e=>{obj[key]=e.target.value.slice(0,240);commit();});
  if(scene==='s1a'){updateScope();for(const [id,key,unit]of[['moon-zoom','zoom','×'],['moon-focus','focus','']])on($('#'+id),'input',e=>{d.moon[key]=+e.target.value;$('#'+id+'-value').textContent=e.target.value+unit;updateScope();commit();});let drag=null;on($('#scope-drag'),'pointerdown',e=>{drag=[e.clientX,e.clientY];e.currentTarget.setPointerCapture(e.pointerId);});on($('#scope-drag'),'pointermove',e=>{if(!drag)return;const r=e.currentTarget.getBoundingClientRect();pan((e.clientX-drag[0])/r.width*100,(e.clientY-drag[1])/r.height*100);drag=[e.clientX,e.clientY];});for(const type of ['pointerup','pointercancel'])on($('#scope-drag'),type,()=>drag=null);on($('#scope-drag'),'keydown',e=>{const v={ArrowUp:[0,-8],ArrowDown:[0,8],ArrowLeft:[-8,0],ArrowRight:[8,0]}[e.key];if(v){e.preventDefault();pan(...v);}});}
  if(scene==='s1b'){on($('#surface-moon'),'click',e=>{const r=e.currentTarget.getBoundingClientRect();spot((e.clientX-r.left)/r.width*100,(e.clientY-r.top)/r.height*100);});}
  function updateDay(){
    $('#phase-day').value=d.phases.day;
    $('#phase-day-value').textContent=d.phases.day+'일째';
    $('#day-label').textContent=d.phases.day+'일째';
    $('#phase-moon').innerHTML=dayMoon(d.phases.day);
    if($('#capture-phase'))$('#capture-phase').disabled=d.phases.captures.includes(d.phases.day);
    $$('.discovery-stops button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.learning===`seek-day-${d.phases.day}`)));
  }
  if(scene==='s2a'){on($('#phase-day'),'input',e=>{d.phases.day=+e.target.value;updateDay();commit();});on($('#phase-day'),'change',e=>{const target=snapDay(+e.target.value,discoveryDays,d.phases.captures);if(target!==undefined){d.phases.day=target;captureDay(target);}});}
  if(scene==='s3a'&&$('.planet-fog')){const id=d.planets.selected;requestAnimationFrame(()=>{if(!disposed)mountFogWipe($('.planet-fog'),{signal:gestures.signal,onReveal(){if(disposed||d.planets.selected!==id)return;learningUI.revealed[id]=true;sound?.play('discover');redraw();}});});}
  if(scene==='s4a')mountShieldDrag($('.light-lab-art'),{blocked:d.classification.lightTrial?.blocked??learningUI.lightBlocked,signal:gestures.signal,onChange(value,byKey){if(d.classification.lightTrial&&!observeLight(d.classification.lightTrial,value))return notify('가리기 전에 행성이 어떻게 보일지 먼저 예상해 주세요.');learningUI.lightBlocked=value;sound?.play(value?'place':'click');track(s,'reviews');redraw();if(byKey)document.querySelector('.light-lab [data-shield]')?.focus({preventScroll:true});}});
  if(scene==='s2b'){
    const adjustment=$('.prediction-disclosure');
    if(adjustment){
      adjustment.open=learningUI.predictionDisclosure===day();
      on(adjustment,'toggle',()=>learningUI.predictionDisclosure=adjustment.open?day():null);
    }
    on($('#prediction-amount'),'input',e=>{
      prediction().amount=+e.target.value;
      (learningUI.predictionAdjusted||={})[round()]=true;
      $('#prediction-amount-value').textContent=e.target.value+'%';
      $('#prediction-moon').innerHTML=moonSVG(prediction().amount,prediction().side);
      commit();
    });
  }
  if(scene==='s3a'){
    const fallback=()=>{if(disposed)return;learningUI.three=false;learningUI.threeUnavailable=true;learningUI.revealed[d.planets.selected]=true;redraw();notify('같은 행성의 그림으로 바꿨어요. 관찰과 기록을 계속할 수 있어요.');};
    if(learningUI.three)import('./planet.js').then(({mountPlanet})=>{if(disposed)return;viewer=mountPlanet($('#planet-viewer'),planets.find(v=>v.id===d.planets.selected),undefined,fallback);if(!viewer.available)return fallback();viewer.setView(learningUI.rotation,learningUI.zoom);}).catch(fallback);
    on($('#planet-zoom'),'input',event=>{learningUI.zoom=+event.target.value;$('#planet-zoom-value').textContent=event.target.value+'×';if(viewer)viewer.setView(learningUI.rotation,learningUI.zoom);else if($('.planet-portrait'))$('.planet-portrait').style.transform=`scale(${learningUI.zoom}) rotate(${learningUI.rotation}deg)`;});
    on($('#planet-rotation'),'input',event=>{learningUI.rotation=+event.target.value;$('#planet-rotation-value').textContent=event.target.value+'°';if(viewer)viewer.setView(learningUI.rotation,learningUI.zoom);else if($('.planet-portrait'))$('.planet-portrait').style.transform=`scale(${learningUI.zoom}) rotate(${learningUI.rotation}deg)`;});
  }
  if(scene==='s3b'){
    function selectPiece(id){learningUI.piece=id;$$('[data-piece]').forEach(element=>{const selected=element.dataset.piece===id;element.classList.toggle('selected',selected);element.setAttribute('aria-pressed',selected);});guide();}
    function place(slot,group){
      if(!learningUI.piece){if(slot!==undefined){d.planets.order[slot]=null;redraw();}else notify('아래에서 행성을 먼저 골라 줘.');return;}
      const id=learningUI.piece;
      if(group)d.planets.groups[id]=group;else{d.planets.order=d.planets.order.map(value=>value===id?null:value);d.planets.order[slot]=id;}
      const correct=group?planets.find(p=>p.id===id).group===group:solarOrder[slot]===id;
      learningUI.piece=group?(correct?planets.find(p=>!d.planets.groups[p.id])?.id||null:id):null;
      if(!correct)track(s,'retries');
      sound?.play(correct?'place':'retry');redraw();
      if(group&&learningUI.piece)showFeedback('solar-feedback',{...solarFeedback(d.planets,1),text:`${solarFeedback(d.planets,1).text} · 선택: ${planets.find(p=>p.id===learningUI.piece).name}`});
    }
    $$('[data-piece]').forEach(element=>on(element,'click',()=>selectPiece(learningUI.piece===element.dataset.piece?null:element.dataset.piece)));
    $$('[data-slot],[data-group]').forEach(element=>on(element,'click',()=>place(element.hasAttribute('data-slot')?+element.dataset.slot:undefined,element.dataset.group)));
    touchCleanup=mountTouchDrag(root,{sources:'[data-piece]',targets:'[data-slot],[data-group]',on,onDrop(source,target){learningUI.piece=source.dataset.piece;place(target.hasAttribute('data-slot')?+target.dataset.slot:undefined,target.dataset.group);}});
  }
  if(scene==='s4b')touchCleanup=mountTouchDrag(root,{sources:'[data-claim]',targets:'[data-claim-target]',on,onDrop(source){if(advancing)return;answer().kind=source.dataset.claim;judgeClassification();}});
  if(scene==='s5a'||scene==='s5b'){
    // 북극성 찾기: 국자 끝 두 별(메라크 → 두베)을 차례로 누른 뒤, 그 선을 다섯 배쯤 늘인 곳의 북극성을 누른다. 틀리면 방법을 다시 알려 준다.
    const polarisPick=id=>{
      const p=d.pattern.polaris;if(p.found)return;
      if(p.pointers.length<2){
        const want=['Merak','Dubhe'][p.pointers.length];
        if(id===want){p.pointers.push(id);sound?.play('place');track(s,'observations');}
        else{track(s,'retries');sound?.play('retry');learningUI.polarisHint=p.pointers.length?'메라크에서 두베 쪽으로 향해요. 두베를 눌러요.':'손잡이 반대쪽 국자 끝의 메라크부터 눌러요.';return;}
        learningUI.polarisHint='';return;
      }
      if(id==='Polaris'){p.found=true;learningUI.polarisHint='';if(!d.pattern.observed.includes(id))d.pattern.observed.push(id);sound?.play('discover');track(s,'observations');}
      else{track(s,'retries');sound?.play('retry');learningUI.polarisHint='두베에서 이어지는 방향과 두 별 사이 간격을 다시 살펴봐요.';}
    };
    const pointerStar=event=>{
      const stars=$$('[data-star]'),id=nearestStar(stars.map(star=>{const r=star.querySelector('circle').getBoundingClientRect();return {id:star.dataset.star,x:r.x+r.width/2,y:r.y+r.height/2,radius:r.width/2};}),event.clientX,event.clientY);
      return stars.find(star=>star.dataset.star===id);
    };
    $$('[data-star]').forEach(element=>{
      function pick(event){
        const id=(event?.detail ? pointerStar(event) : element)?.dataset.star;
        if(!id)return;
        if(scene==='s5a'&&round()===2){polarisPick(id);learningUI.selectedStar=id;}
        else if(scene==='s5a'){if(!d.pattern.observed.includes(id)){d.pattern.observed.push(id);sound?.play('discover');track(s,'observations');}learningUI.selectedStar=id;}
        else{if(connectStars(pattern(),learningUI.selectedStar,id))sound?.play('place');learningUI.selectedStar=learningUI.selectedStar===id?null:id;}
        redraw();
      }
      on(element,'click',pick);on(element,'keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();pick();}});
    });
    if(scene==='s5b'){
      on($('#star-view'),'pointerdown',event=>{const source=pointerStar(event);if(source&&event.button===0)starDrag={id:source.dataset.star,x:event.clientX,y:event.clientY};});
      on($('#star-view'),'pointerup',event=>{
        if(!starDrag)return;const target=pointerStar(event),start=starDrag;starDrag=null;
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
    const controls=pending.kind==='planet'?$$('.feature-choices button'):$$('[data-claim],.reason-choices button');controls.forEach(element=>element.disabled=true);
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
  const autoRound=getStageAction(s,round());
  if(autoRound&&autoRound.round!==undefined&&scene!=='s3b'&&scene!=='s2b'&&!advancing){
    roundTimer=setTimeout(()=>{if(disposed||s.scene!==scene||document.querySelector('dialog[open]'))return;action('round-'+autoRound.round);},1300);
  }
  guide();
  return ()=>{disposed=true;scopeVoiceCleanup();gestures.abort();clearTimeout(roundTimer);releaseViewport();clearTimeout(advanceTimer);starResize?.disconnect();touchCleanup();viewer?.dispose();};
}
