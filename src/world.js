import { createMapCamera, bindMapCameraPointer, mapLabelGuard } from './map-camera.js';
import { buildingReveal, paintRestoredBuildings } from './building-restoration.js';
import { drawMapSprite } from './map-sprite.js';
import {bindDirectionPad,assistMapStep,mapKeyDirection,MAP_VECTORS} from './map-controls.js';
import { chapters } from './data.js';
import { stageOpen,completedCount } from './state.js';
import { imageFor,icon } from './ui.js';
import { WORLD, nodes, edges, siteNodes, routeBetween, nearestNode, nearestEdgePoint, returnPosition, doorAt } from './world-path.js';
export { WORLD, nodes, edges, siteNodes, routeBetween } from './world-path.js';
export function worldMarkup(state){const next=chapters.find(c=>!state.evidence[c.id])?.id||0;return `<main class="world-screen" id="world" tabindex="0" aria-label="별빛 연구소 지도. 건물을 누르면 걸어가고, 방향키나 WASD로도 움직일 수 있어."><div class="world-viewport"><div class="world-layer" id="world-layer"><img class="world-terrain" src="${imageFor('world')}" alt="숲길과 계단으로 연결된 다섯 연구 시설과 중앙 돔"/><canvas id="world-canvas" width="1672" height="941" aria-label="학생 연구원과 길을 따라오는 달토끼" role="img"></canvas>${[0,...chapters.map(c=>c.id)].map(n=>{const [x,y]=nodes[siteNodes[n]],open=n?stageOpen(state,n):completedCount(state)===5||state.settings.adminUnlock,done=n?!!state.evidence[n]:state.core.restored;return `<button class="world-pin ${done?'done':!open?'locked':n===next?'current':''}" data-site="${n}" style="left:${x/WORLD.width*100}%;top:${(y-80)/WORLD.height*100}%" aria-label="${n?chapters[n-1].place:'중앙 코어'} · ${open?'열림':'잠김'}"><svg class="map-lock-icon" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="${open?'M8 11V7a4 4 0 0 1 7.5-2':'M8 11V7a4 4 0 0 1 8 0v4'}"/></svg>${n?chapters[n-1].place:'중앙 코어'}</button>`;}).join('')}<button class="map-companion" id="map-companion" aria-label="달토끼에게 다음 목표 묻기"><span>…</span></button></div></div><div class="world-controls" aria-label="지도 방향 조절">${[['up','↑'],['left','←'],['down','↓'],['right','→']].map(([dir,label])=>`<button class="btn chip" data-direction="${dir}" aria-label="지도 ${ {up:'위로',left:'왼쪽으로',down:'아래로',right:'오른쪽으로'}[dir]}">${label}</button>`).join('')}</div><div class="activity-action"><div class="world-map-tools" role="group" aria-label="지도 보기"><button class="btn chip" data-world-hand aria-label="손으로 지도 이동" title="손으로 지도 이동" aria-pressed="false">${icon('hand')}</button><button class="btn chip" data-world-overview aria-label="지도 전체 보기" title="지도 전체 보기" aria-pressed="false">${icon('fit')}</button></div><button class="btn primary${state.settings.reducedMotion||state.core.restored?'':' map-next-cue'}" id="next-destination" data-site="${next}">${next?chapters[next-1].place:'중앙 코어'}로 가기 ${icon('arrow')}</button></div><div id="world-loading" class="world-loading">숲길을 준비하고 있어…</div></main>`;}
export function mountWorld(root,state,{onSite,onHint,onStatus,lastSite=null,restoredSites=[]}){const canvas=root.querySelector('#world-canvas'),ctx=canvas.getContext('2d'),layer=root.querySelector('#world-layer'),companion=root.querySelector('#map-companion');let stop=false,raf,route=[],dest=null,keys=new Set(),heldCodes=new Set(),pointerDirections=new Set(),last=0,frame=0,wasPaused=false;const start=returnPosition(lastSite);let player={...start,dir:0},trail=[{...player}],rabbit={...player,x:player.x-45,y:player.y+25},images={},atlas={},assetRevision=0,lastPaintKey='',lastTransform='',lastScale=0;
  const reduced=state.settings.reducedMotion||matchMedia('(prefers-reduced-motion: reduce)').matches, reveal=buildingReveal(reduced,restoredSites);
  const nextButton=root.querySelector('#next-destination'), nextLabel=nextButton.innerHTML;
  const events=new AbortController(),on=(el,type,fn)=>el?.addEventListener(type,fn,{signal:events.signal});
  const keyDirections={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',KeyW:'up',KeyS:'down',KeyA:'left',KeyD:'right'};
  function updateKeys(){keys=new Set([...heldCodes].map(code=>keyDirections[code]).concat([...pointerDirections]));}
  function clear(){keys.clear();heldCodes.clear();pointerDirections.clear();}
  function guideBusy(busy){
    if(nextButton.hasAttribute('aria-busy')===busy)return;
    if(busy){nextButton.setAttribute('aria-disabled','true');nextButton.setAttribute('aria-busy','true');}
    else{nextButton.removeAttribute('aria-disabled');nextButton.removeAttribute('aria-busy');}
    nextButton.innerHTML=busy?'길을 따라 이동 중…':nextLabel;
  }
  function cancelMovement(){clear();route=[];dest=null;guideBusy(false);}
  function arrive(n){route=[];dest=null;guideBusy(false);onSite(n);}
  function loadImage(id){return new Promise((resolve,reject)=>{const image=new Image();const timer=setTimeout(()=>reject(Error(id)),20000);image.onload=()=>{clearTimeout(timer);images[id]=image;assetRevision++;resolve();};image.onerror=()=>{clearTimeout(timer);reject(Error(id));};image.src=imageFor(id);});}
  Promise.all([loadImage('world'),loadImage('student'),loadImage('rabbit-walk'),fetch('/assets/generated/sprites.json').then(r=>{if(!r.ok)throw Error('sprites');return r.json();}).then(v=>{atlas=v;assetRevision++;})]).then(()=>{if(!stop)root.querySelector('#world-loading').remove();}).catch(()=>{if(!stop){const loading=root.querySelector('#world-loading');loading.innerHTML='숲 그림을 불러오지 못했어. 기록은 그대로야. <button class="btn" id="retry-map">다시 열기</button>';on(loading.querySelector('button'),'click',()=>onStatus('retry'));}});
  const viewport=root.querySelector('.world-viewport'),handButton=root.querySelector('[data-world-hand]'),overviewButton=root.querySelector('[data-world-overview]');
  const blocked=()=>stop||document.hidden||!!document.querySelector('dialog[open]')||!!root.querySelector('.map-repair[open]');
  const camera=createMapCamera({width:WORLD.width,height:WORLD.height,baseZoom:w=>w<700?1.25:1.35,focusY:.55,reduced:()=>state.settings.reducedMotion||matchMedia('(prefers-reduced-motion: reduce)').matches});
  const guardLabels=mapLabelGuard(viewport,'.world-pin','.floating-controls button,#world .world-controls button,#world .activity-action button,#world .map-repair summary');
  function apply(dt=0){
    camera.update(player,dt);
    if(camera.scale!==lastScale){guardLabels();lastScale=camera.scale;layer.style.width=WORLD.width*lastScale+'px';layer.style.height=WORLD.height*lastScale+'px';}
    const transform=`translate3d(${camera.x}px,${camera.y}px,0)`;
    if(transform!==lastTransform){layer.style.transform=transform;lastTransform=transform;guardLabels();}
  }
  function syncTools(){
    const hand=camera.mode==='hand',overview=camera.mode==='overview';
    handButton.setAttribute('aria-pressed',String(hand));overviewButton.setAttribute('aria-pressed',String(overview));
    overviewButton.setAttribute('aria-label',overview?'이전 지도 보기':'지도 전체 보기');overviewButton.title=overviewButton.getAttribute('aria-label');
    viewport.classList.toggle('hand-on',hand);
  }
  function follow(){clearPointer();if(camera.mode!=='follow'){camera.follow(player);apply();syncTools();}}
  function resize(){camera.resize(viewport.clientWidth,viewport.clientHeight,player);apply();guardLabels();}
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(viewport);resize();
  function travel(n,guided=false){
    if(stop||!Number.isInteger(n)||!siteNodes[n]||document.querySelector('dialog[open]')||(guided&&nextButton.hasAttribute('aria-busy')))return;
    cancelMovement();
    if(n?!stageOpen(state,n):completedCount(state)<5&&!state.settings.adminUnlock){onStatus('앞선 관측을 마치면 이 문이 열려요.');return;}
    follow();
    dest=n;route=routeBetween(nearestNode(player),siteNodes[n]).map(id=>nodes[id]);
    if(!route.length){cancelMovement();onStatus('이곳까지 가는 길을 찾지 못했어요.');return;}
    if(state.settings.reducedMotion||matchMedia('(prefers-reduced-motion: reduce)').matches){
      const [x,y]=nodes[siteNodes[n]];player={...player,x,y};rabbit={...player,x:x-42,y:y+28};trail=[{...rabbit},{...player}];arrive(n);
    }else if(guided)guideBusy(true);
  }
  function drawSprite(id,p,time,moving){const img=images[id];if(!img)return;const cells=atlas[id]?.frames,cell=cells?.[p.dir*4+(moving&&!state.settings.reducedMotion?Math.floor(time/150)%4:0)],sx=cell?.x??(moving?Math.floor(time/150)%4:0)*img.width/4,sy=cell?.y??p.dir*img.height/4,sw=cell?.width??img.width/4,sh=cell?.height??img.height/4,h=id==='student'?87:67,w=sw/sh*h,pivot=cell?.pivot||[sw/2,sh*.92];drawMapSprite(ctx,img,sx,sy,sw,sh,p.x-pivot[0]/sw*w,p.y-pivot[1]/sh*h,w,h);}
  function tick(time){if(stop)return;const dt=Math.min((time-last)/1000,.04);last=time;const paused=document.hidden||!!document.querySelector('dialog[open]')||!!root.querySelector('.map-repair[open]');if(paused&&!wasPaused)cancelMovement();wasPaused=paused;let walking=false;if(!paused){let dx=(keys.has('right')?1:0)-(keys.has('left')?1:0),dy=(keys.has('down')?1:0)-(keys.has('up')?1:0);if(dx||dy){const len=Math.hypot(dx,dy);dx/=len;dy/=len;const before={x:player.x,y:player.y},next=assistMapStep(before,{x:dx*150*dt,y:dy*150*dt},p=>nearestEdgePoint(p).dist<=34);player.x=next.x;player.y=next.y;walking=Math.hypot(next.x-before.x,next.y-before.y)>.01;player.dir=Math.abs(dx)>Math.abs(dy)?dx<0?1:2:dy<0?3:0;}else if(route.length){const [x,y]=route[0],dx=x-player.x,dy=y-player.y,distance=Math.hypot(dx,dy),step=190*dt;if(distance<=step){player.x=x;player.y=y;route.shift();if(!route.length&&dest!==null){arrive(dest);if(stop)return;}}else{player.x+=dx/distance*step;player.y+=dy/distance*step;player.dir=Math.abs(dx)>Math.abs(dy)?dx<0?1:2:dy<0?3:0;}walking=true;}if(walking){const prev=trail.at(-1);if(Math.hypot(prev.x-player.x,prev.y-player.y)>3)trail.push({...player});while(trail.length>32)trail.shift();const target=trail[Math.max(0,trail.length-17)];rabbit.x+=(target.x-rabbit.x)*Math.min(1,dt*8);rabbit.y+=(target.y-rabbit.y)*Math.min(1,dt*8);rabbit.dir=target.dir;}}
    if(!paused)apply(dt);
    const progress=images.world?reveal(time):()=>0;
    // Preserve a still frame except while the newly recorded building lights up.
    const paintKey=[player.x,player.y,player.dir,rabbit.x,rabbit.y,rabbit.dir,walking&&!state.settings.reducedMotion?Math.floor(time/150)%4:0,chapters.map(c=>!!state.evidence[c.id]).join(','),state.core.restored,restoredSites.map(id=>progress(id)).join(','),assetRevision].join('|');
    if(paintKey===lastPaintKey){raf=requestAnimationFrame(tick);return;}lastPaintKey=paintKey;
    ctx.clearRect(0,0,WORLD.width,WORLD.height);ctx.imageSmoothingEnabled=false;paintRestoredBuildings(ctx,{width:WORLD.width,height:WORLD.height,completed:id=>id===0?state.core.restored:!!state.evidence[id],progress});
    [ {id:'student',p:player}, {id:'rabbit-walk',p:rabbit} ].sort((a,b)=>a.p.y-b.p.y).forEach(({id,p})=>{ctx.fillStyle='#06112466';ctx.beginPath();ctx.ellipse(p.x,p.y+1,id==='student'?14:12,5,0,0,Math.PI*2);ctx.fill();drawSprite(id,p,time,walking);});companion.style.left=(rabbit.x/WORLD.width*100)+'%';companion.style.top=((rabbit.y-62)/WORLD.height*100)+'%';frame++;raf=requestAnimationFrame(tick);}
  on(window,'keydown',e=>{if(document.hidden||document.querySelector('dialog[open]')||root.querySelector('.map-repair[open]')||e.ctrlKey||e.altKey||e.metaKey||e.target?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"])'))return;const k=mapKeyDirection(e);if(k){e.preventDefault();if(dest!==null||route.length)cancelMovement();follow();heldCodes.add(e.code);updateKeys();}if(e.code==='Enter'&&!e.repeat&&!e.target.closest('button,a')){const n=doorAt(player,45);if(n>=0)onSite(n);}});on(window,'keyup',e=>{if(keyDirections[e.code]){heldCodes.delete(e.code);updateKeys();}});on(window,'blur',cancelMovement);on(document,'visibilitychange',cancelMovement);
  root.querySelectorAll('[data-site]').forEach(el=>on(el,'click',()=>travel(+el.dataset.site,el===nextButton)));bindDirectionPad(root,'[data-direction]',b=>b.dataset.direction,{signal:events.signal,blocked:()=>stop||document.hidden||!!document.querySelector('dialog[open]'),press:d=>{if(dest!==null||route.length)cancelMovement();follow();pointerDirections.add(d);updateKeys();},release:d=>{pointerDirections.delete(d);updateKeys();},tap:d=>{cancelMovement();follow();const v=MAP_VECTORS[d],p=assistMapStep(player,{x:v.x*10,y:v.y*10},q=>nearestEdgePoint(q).dist<=34);player.x=p.x;player.y=p.y;}});on(companion,'click',()=>{cancelMovement();onHint();});on(canvas,'click',e=>{if(camera.mode==='hand'||blocked())return;const r=canvas.getBoundingClientRect(),p={x:(e.clientX-r.left)/r.width*WORLD.width,y:(e.clientY-r.top)/r.height*WORLD.height},near=nearestEdgePoint(p);if(near.dist>70)return onStatus('흙길을 따라 걸어가 보자. 건물을 눌러도 안내해 줄게.');cancelMovement();follow();route=routeBetween(nearestNode(player),nearestNode(near)).map(id=>nodes[id]);});raf=requestAnimationFrame(tick);

  const afterGesture=()=>{apply();syncTools();};
  const clearPointer=bindMapCameraPointer(viewport,{camera,player:()=>player,blocked,control:el=>!!el.closest('#map-companion'),onStart:cancelMovement,onMove:afterGesture,signal:events.signal});
  on(handButton,'click',()=>{clearPointer();cancelMovement();camera.hand(player);afterGesture();});
  on(overviewButton,'click',()=>{clearPointer();cancelMovement();camera.overview(player);afterGesture();});
  return {travel,dispose(){stop=true;cancelAnimationFrame(raf);resizeObserver.disconnect();events.abort();clear();}};
}
