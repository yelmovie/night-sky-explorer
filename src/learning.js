import { representativeDays, recordCountLabel } from './observation-records.js';
import { chapters,planets,requiredPlanets,solarOrder,bodies,planetGroups,patternRegions } from './data.js';
import { firstReady,stageReady,photoReady,clone,track } from './state.js';
import { missionTag } from './quest.js';
import { moonSVG,dayMoon } from './drawing.js';
import { button,planetImage,celestialImage,esc,icon } from './ui.js';
import { mountLessonViewport } from './stage-viewport.js';
import { playbackMarkup, createObservationPlayer } from './observation-player.js';
import { mountTouchDrag } from './touch-drag.js';
import { getStageAction } from './progression.js';
import './flow.css';
import './concept-art.css';
import { renderMoonStage } from './moon-stages.js';
import { renderSpaceStage } from './space-stages.js';
import { recordPhase, recordPlanet, nextPlanet, classificationFeedback, nextBody, solarFeedback, connectStars } from './learning-flow.js';

export const learningUI={round:0,selectedStar:null,piece:null,body:0,three:false,rotation:0,zoom:1,lightBlocked:false,inspectedBody:null,pendingAdvance:null};
const round=()=>learningUI.round;
const regions=['cassiopeia','dipper'];
const tabs=(names,done=[])=>`<div class="case-tabs" role="group" aria-label="활동 묶음">${names.map((n,i)=>`<button class="case-tab ${round()===i?'active':''}" data-learning="round-${i}" aria-pressed="${round()===i}">${n} ${done[i]?'✓':''}</button>`).join('')}</div>`;
const strip=days=>`<div class="record-strip">${[...days].sort((a,b)=>a-b).map(d=>`<div>${dayMoon(d)}<small>${d}일째</small></div>`).join('')}</div>`;
const title=t=>`<h2 class="tool-title">${t}</h2>`;
const feedback=(id,status)=>`<p id="${id}" class="inline-feedback" role="status" data-tone="${status.tone}">${status.text}</p>`;
function content(s,scene){const i=round(),helpers={tabs,title,strip,feedback,token};return renderMoonStage(s,scene,i,learningUI,helpers)||renderSpaceStage(s,scene,i,learningUI,helpers);}
export function token(id){if(!id)return '<span class="slot-plus">+</span>';return `${id==='sun'?celestialImage('sun','','sun-token'):planetImage(id,'')}<strong>${id==='sun'?'태양':planets.find(v=>v.id===id)?.name}</strong>`;}
export function learningView(s,chrome=''){
  const n=+s.scene[1],part=s.scene.at(-1),c=chapters[n-1],v=content(s,s.scene),next=getStageAction(s,round());
  return `<main class="experience learning-v2" data-scene="${s.scene}"><div class="room-bg"></div>${chrome}<div class="activity-heading"><p><b class="mission-tag">${missionTag(n)}</b> ${c.steps[part==='a'?0:1]}</p><h1 id="screen-title" tabindex="-1">${v.instruction}</h1></div><div class="activity-layout"><section class="experiment-zone" aria-label="실험 화면">${v.main}</section><aside class="toolbox" aria-label="실험 조작">${v.tools}</aside></div><footer class="activity-footer"><div class="lesson-help">${button('힌트','hint','ghost')}${button(`${icon('book',18)} 기록`,'kit','ghost')}</div>${playbackMarkup(s,learningUI)}<div class="activity-action">${button(next.label,next.action,'primary',`id="stage-next" ${next.disabled?'disabled':''}`)}</div></footer></main>`;
}

export function mountLearning(root,ctx){const {state:s,save,render,notify,dialog,on,refresh,sound}=ctx,d=s.drafts,scene=s.scene;let viewer=null,disposed=false,advanceTimer=null,advancing=false,touchCleanup=()=>{},starDrag=null,player;
  const releaseViewport=mountLessonViewport(root.querySelector('.learning-v2'));
  const $=selector=>root.querySelector(selector),$$=selector=>[...root.querySelectorAll(selector)];
  function commit(){save();refresh();guide();}
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
  function updateScope(){const m=d.moon,same=m.photos.some((p,j)=>j!==round()&&Math.abs(p.zoom-m.zoom)<.09),ready=photoReady(m)&&!same&&(round()===0||!!m.photos[0]);$('#scope-moon').style.cssText=`transform:translate(${m.x}%,${m.y}%) scale(${m.zoom*.65});filter:blur(${Math.abs(m.focus-72)/9}px)`;$('#focus-status').textContent=same?'배율을 바꿔요':ready?'촬영 준비 완료':Math.abs(m.x)>10||Math.abs(m.y)>10?'달을 가운데로 옮겨요':'초점을 맞춰요';$('#capture-moon').disabled=!ready;}
  function pan(dx,dy){d.moon.x=Math.max(-80,Math.min(80,d.moon.x+dx));d.moon.y=Math.max(-80,Math.min(80,d.moon.y+dy));updateScope();commit();}
  function spot(x,y){const c=d.moon.comparisons[round()];if(Math.hypot(x-50,y-50)>48)return;if(d.moon.comparisons.some(other=>other.spots.some(p=>Math.hypot(x-p.x,y-p.y)<10)))return notify('앞서 고른 곳과 조금 떨어진 다른 표면을 골라 봐.');if(c.spots.length===2)c.spots.shift();c.spots.push({x,y});track(s,'observations');redraw();}
  function answer(){const id=selectedBody().id;return d.classification.answers[id]||=( {kind:'',reason:''} );}
  function showFeedback(id,status){const element=$('#'+id);if(element){element.textContent=status.text;element.dataset.tone=status.tone;}}
  function queueNext(kind,id){learningUI.pendingAdvance={scene,kind,id};redraw();}
  function judgeClassification(){const body=selectedBody(),status=classificationFeedback(body,answer());if(!status.correct&&answer().kind&&answer().reason)track(s,'retries');if(status.correct){sound?.play('success');if(nextBody(d.classification.answers,body.id)!==-1)return queueNext('body',body.id);}redraw();}
  function choosePlanet(id){d.planets.selected=id;d.planets.feature=d.planets.records[id]?.feature||'';d.planets.candidate=id;learningUI.zoom=1;learningUI.rotation=0;}
  function captureDay(day){const added=recordPhase(d.phases,day);if(added){sound?.play('capture');track(s,'observations');}redraw();}
  function guide(){
    $$('.is-next').forEach(element=>element.classList.remove('is-next'));
    const next=getStageAction(s,round());
    let target=next&&!next.disabled?'#stage-next':null;
    if(!target)switch(scene){
      case 's1a':{const m=d.moon;target=!$('#capture-moon')?.disabled?'#capture-moon':Math.abs(m.x)>12?`[data-learning="pan-${m.x>0?'left':'right'}"]`:Math.abs(m.y)>12?`[data-learning="pan-${m.y>0?'up':'down'}"]`:Math.abs(m.focus-72)>12?'#moon-focus':'#moon-zoom';break;}
      case 's1b':target=d.moon.comparisons[round()].spots.length<2?'.surface-targets':'#moon-observation';break;
      case 's2a':target='#play-time';break;
      case 's2b':target=prediction().revealed?'#phase-reflection':'[data-learning="reveal-phase"]';break;
      case 's3a':target='#planet-feature';break;
      case 's3b':target=learningUI.piece?(round()?'.group-targets':'.order-slots'):'.piece-tray';break;
      case 's4a':target=learningUI.inspectedBody?'[data-learning="light-toggle"]':'.sky-bodies';break;
      case 's4b':target=selectedBody()&&d.classification.answers[selectedBody().id]?.kind?'.reason-choices':'.claim-tray';break;
      case 's5a':target='#star-view';break;
      case 's5b':target=pattern().original?'#pattern-reflection':pattern().lines.length>=2?'[data-learning="compare-pattern"]':'#star-view';break;
    }
    $(target||'#stage-next')?.classList.add('is-next');
  }
  function playbackStateChanged(playback){
    const control=$('#play-time');
    if(control){control.setAttribute('aria-pressed',String(playback.playing));const label=control.querySelector('span');if(label)label.textContent=playback.playing?'직접 해보기':playback.finished?'다시 보기':'자동 관찰';const path=control.querySelector('svg');if(path)path.innerHTML=playback.playing?'<path d="M8 5v14M16 5v14"/>':'<path d="m8 4 12 8-12 8Z"/>';}
    if($('#playback-speed'))$('#playback-speed').value=playback.speed;
    $('.learning-v2')?.setAttribute('data-playing',String(playback.playing));
  }
  let automaticStep=false;
  function observeStep(step){
    automaticStep=true;
    try{
      if(scene==='s1a'){
        const run=learningUI.observationRun||{startRound:round(),x:d.moon.x,y:d.moon.y,focus:d.moon.focus,zoom:d.moon.zoom};
        const slot=run.startRound===0&&step>=10?1:run.startRound,local=step%10,m=d.moon;
        learningUI.round=slot;
        const progress=Math.min(1,(local+1)/7),targetZoom=slot?2.2:1.5;
        m.x=run.x*(1-progress);m.y=run.y*(1-progress);m.focus=run.focus+(72-run.focus)*progress;m.zoom=run.zoom+(targetZoom-run.zoom)*progress;
        for(const [id,value,unit]of[['moon-focus',m.focus,''],['moon-zoom',m.zoom,'×']]){if($('#'+id))$('#'+id).value=value;if($('#'+id+'-value'))$('#'+id+'-value').textContent=(id==='moon-focus'?Math.round(value):value.toFixed(1))+unit;}
        updateScope();commit();
        if(local===9){if(slot===1)player.finish();action('capture-moon');}
        return false;
      }
      if(scene==='s1b'){
        const card=d.moon.comparisons[round()];
        if(card.spots.length<2){const used=d.moon.comparisons.flatMap(value=>value.spots);const point=[[26,27],[67,29],[32,68],[69,65],[48,24],[50,74]].find(([x,y])=>!used.some(p=>Math.hypot(x-p.x,y-p.y)<10));if(point)spot(...point);}
        $$('.lunar-detail').forEach((element,index)=>element.classList.toggle('is-observing',index===step%2));
        return step>=3;
      }
      if(scene==='s2a'){
        d.phases.day=step%30;updateDay();
        if([3,7,10,17,21,25].includes(d.phases.day)&&recordPhase(d.phases,d.phases.day)){track(s,'observations');$('#capture-strip').innerHTML=`<section class="lunar-records">${strip(representativeDays(d.phases.captures))}</section>`;}
        if($('#phase-count'))$('#phase-count').textContent=recordCountLabel(d.phases.captures);
        commit();return step>=29;
      }
      if(scene==='s2b'){if(step===3)player.finish();action('overlay-phase');return false;}
      if(scene==='s3a'){
        learningUI.rotation=-180+(step%73)*5;viewer?.setView(learningUI.rotation,learningUI.zoom);
        if($('#planet-rotation'))$('#planet-rotation').value=learningUI.rotation;
        if($('#planet-rotation-value'))$('#planet-rotation-value').textContent=learningUI.rotation+'°';
        return step>=72;
      }
      if(scene==='s4a'){
        if(step<8){const first=learningUI.observationRun?.startRound||0;learningUI.round=(first+Math.floor(step/4))%2;action('body-'+bodies[learningUI.round*4+step%4].id);}
        else{if(step>=11)player.finish();learningUI.lightBlocked=step%2===0;render();}
        return false;
      }
      if(scene==='s5a'){
        const order=learningUI.observationRun?.startRound===1?[1,0]:[0,1];
        const observations=order.flatMap(index=>patternRegions[regions[index]].stars.map(id=>({id,round:index})));
        const observation=observations[step];if(!observation)return true;
        if(step===observations.length-1)player.finish();
        learningUI.round=observation.round;learningUI.selectedStar=observation.id;
        if(!d.pattern.observed.includes(observation.id)){d.pattern.observed.push(observation.id);track(s,'observations');}
        redraw();return false;
      }
      if(scene==='s5b'){if(step===3)player.finish();action('toggle-reference');return false;}
      return true;
    }finally{automaticStep=false;}
  }
  function action(a){
    if(a!=='play-time'&&!automaticStep)player?.pause();
    if(advancing&&(a.startsWith('kind-')||a.startsWith('reason-')))return;
    if(a!=='capture-phase'&&!a.startsWith('day-'))sound?.play(a.startsWith('capture-')?'capture':a.startsWith('record-')?'discover':'click');
    if(a==='light-toggle'){learningUI.lightBlocked=!learningUI.lightBlocked;render();return;}
    if(a==='play-time'){
      if(!player.snapshot.playing&&(player.snapshot.step===0||player.snapshot.finished))learningUI.observationRun={scene,startRound:round(),x:d.moon.x,y:d.moon.y,focus:d.moon.focus,zoom:d.moon.zoom};
      if(scene==='s3a'&&!learningUI.three&&!player.snapshot.playing){player.play();learningUI.three=true;render();return;}
      player.toggle();guide();return;
    }
    if(a.startsWith('round-')){player?.reset();learningUI.round=+a.at(-1);learningUI.body=0;learningUI.selectedStar=null;learningUI.inspectedBody=null;learningUI.piece=null;learningUI.overlayVisible=false;redraw();return;}
    if(a.startsWith('pan-')){pan(...{up:[0,-8],down:[0,8],left:[-8,0],right:[8,0]}[a.slice(4)]);return;}
    if(a==='capture-moon'){const m=d.moon;if(!photoReady(m))return;if(round()===1&&!m.photos[0])return notify('먼저 전체 모습 사진을 한 장 담아 줘.');if(m.photos.some((p,j)=>j!==round()&&Math.abs(p.zoom-m.zoom)<.09))return notify('이번에는 배율을 조금 바꾸어서 촬영해 줘.');m.photos[round()]={x:m.x,y:m.y,zoom:m.zoom,focus:m.focus};track(s,'observations');if(round()===0)learningUI.round=1;redraw();notify('관측사진을 연구 노트에 담았어.');return;}
    if(a.startsWith('spot-')){const [,x,y]=a.split('-');spot(+x,+y);return;}
    if(a.startsWith('day-')){captureDay(+a.slice(4));return;}
    if(a==='capture-phase'){captureDay(d.phases.day);return;}
    if(a.startsWith('side-')){prediction().side=a.slice(5);redraw();return;}
    if(a==='reveal-phase'){const p=prediction();p.original||={amount:p.amount,side:p.side};p.revealed=true;p.overlay=true;learningUI.overlayVisible=true;redraw();return;}
    if(a==='overlay-phase'){prediction().overlay=true;track(s,'reviews');learningUI.overlayVisible=!learningUI.overlayVisible;redraw();return;}
    if(a.startsWith('planet-')){choosePlanet(a.slice(7));track(s,'observations');redraw();return;}
    if(a==='toggle-three'){learningUI.three=!learningUI.three;if(learningUI.three)track(s,'observations');commit();render();return;}
    if(a==='phase-note'){const p=prediction();dialog(scene==='s2b'?'앞선 달 관측 기록':'모은 달 관측 기록',`<p>북반구에서 본 학습용 모형이에요. 학습용 날짜는 실제 달력과 달라요.</p>${strip(d.phases.captures)}${scene==='s2b'&&p.original?`<p>처음 예상: 밝은 부분 ${p.original.amount}% · ${p.original.side==='right'?'오른쪽':'왼쪽'}</p>`:''}`);return;}
    if(a==='body-note'){const body=selectedBody();dialog(body.name+' · 과학 자료',`<p>${body.info}</p>`);return;}
    if(a==='solar-note'){track(s,'reviews');commit();dialog('내 조사 노트와 태양계 자료',`<p class="order-note">태양 → ${planets.map(v=>v.name).join(' → ')}</p><h3>행성을 묶는 참고 자료</h3>${planetGroups.map(g=>`<p><b>${g.name}</b> · ${g.info}<br>${planets.filter(v=>v.group===g.id).map(v=>v.name).join(', ')}</p>`).join('')}<h3>직접 조사한 근거</h3>${Object.entries(d.planets.records).map(([id,v])=>`<p><b>${planets.find(x=>x.id===id)?.name}</b> · ${esc(v.feature)}</p>`).join('')}`);return;}
    if(a.startsWith('body-')){const id=a.slice(5);learningUI.inspectedBody=id;if(!d.classification.viewed.includes(id)){d.classification.viewed.push(id);sound?.play('discover');track(s,'observations');}redraw();return;}
    if(a.startsWith('bodytab-')){learningUI.body=+a.at(-1);render();return;}
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
  if(scene==='s1b'){text('#moon-observation',d.moon.comparisons[round()],'observation');on($('#surface-moon'),'click',e=>{const r=e.currentTarget.getBoundingClientRect();spot((e.clientX-r.left)/r.width*100,(e.clientY-r.top)/r.height*100);});}
  function updateDay(){$('#phase-day-value').textContent=d.phases.day+'일째';$('#day-label').textContent=d.phases.day+'일째';$('#phase-moon').innerHTML=dayMoon(d.phases.day);$('#capture-phase').disabled=d.phases.captures.includes(d.phases.day);}
  if(scene==='s2a')on($('#phase-day'),'input',e=>{d.phases.day=+e.target.value;updateDay();commit();});
  if(scene==='s2b'){on($('#prediction-amount'),'input',e=>{prediction().amount=+e.target.value;$('#prediction-amount-value').textContent=e.target.value+'%';$('#prediction-moon').innerHTML=moonSVG(prediction().amount,prediction().side);commit();});text('#phase-reflection',prediction(),'reflection');}
  if(scene==='s3a'){
    on($('#planet-feature'),'change',event=>{
      player?.pause();
      if(advancing)return;
      const correct=recordPlanet(d.planets,event.target.value,{rotation:learningUI.rotation,zoom:learningUI.zoom},learningUI.three?'3d':'illustration');
      if(!correct){track(s,'retries');commit();showFeedback('planet-feedback',{tone:'hint',text:'무늬·표면·고리를 그림과 다시 비교해 봐.'});return;}
      sound?.play('discover');
      if(nextPlanet(d.planets))queueNext('planet',d.planets.selected);else redraw();
    });
    if(learningUI.three)import('./planet.js').then(({mountPlanet})=>{if(disposed)return;viewer=mountPlanet($('#planet-viewer'),planets.find(v=>v.id===d.planets.selected));viewer.setView(learningUI.rotation,learningUI.zoom);}).catch(()=>{if(!disposed)$('#planet-viewer').innerHTML='<p>입체 모형을 열지 못했어. 그림으로도 조사할 수 있어.</p>';});
    on($('#planet-zoom'),'input',event=>{learningUI.zoom=+event.target.value;$('#planet-zoom-value').textContent=event.target.value+'×';if(viewer)viewer.setView(learningUI.rotation,learningUI.zoom);else if($('.planet-portrait'))$('.planet-portrait').style.transform=`scale(${learningUI.zoom})`;});
    on($('#planet-rotation'),'input',event=>{learningUI.rotation=+event.target.value;$('#planet-rotation-value').textContent=event.target.value+'°';viewer?.setView(learningUI.rotation,learningUI.zoom);});
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
        if(scene==='s5a'){if(!d.pattern.observed.includes(id)){d.pattern.observed.push(id);sound?.play('discover');track(s,'observations');}learningUI.selectedStar=id;}
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
  player=createObservationPlayer({state:s,scene,ui:learningUI,onStep:observeStep,onState:playbackStateChanged,baseDelay:({s1a:170,s1b:900,s2a:300,s2b:1300,s3a:100,s4a:1500,s5a:900,s5b:1300})[scene]||1200,canRun:()=>!document.hidden&&!document.querySelector('dialog[open]')&&(scene!=='s3a'||!!viewer)});
  on($('#playback-speed'),'change',event=>player.setSpeed(event.target.value));
  on(root,'pointerdown',event=>{if(event.target.closest('.learning-v2')&&!event.target.closest('.observation-playback'))player.pause();});
  on(root,'input',event=>{if(event.target.id!=='playback-speed')player.pause();});
  on(root,'keydown',event=>{if(event.key!=='Tab'&&event.target.closest('.learning-v2')&&!event.target.closest('.observation-playback'))player.pause();});
  playbackStateChanged(player.snapshot);guide();
  return ()=>{disposed=true;player?.dispose();releaseViewport();clearTimeout(advanceTimer);starResize?.disconnect();touchCleanup();viewer?.dispose();};
}
