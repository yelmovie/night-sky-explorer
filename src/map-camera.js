// Offsets are in viewport pixels; hand and overview bookmarks are in world units.
export function createMapCamera({width,height,baseZoom=1.35,focusY=.54,reduced=()=>false}){
 let w=0,h=0,scale=1,x=0,y=0,mode='follow',zoom=null,point=null,bookmark=null,ready=false;
 const clampAxis=(v,view,size)=>size<=view?(view-size)/2:Math.max(view-size,Math.min(0,v));
 const center=()=>({x:(w/2-x)/scale,y:(h/2-y)/scale});
 const bounded=(u,v)=>({x:clampAxis(u,w,width*scale),y:clampAxis(v,h,height*scale)});
 const cover=()=>Math.max(w/width,h/height,.0001);
 function update(player,dt=0,snap=false){
  if(mode==='overview')scale=Math.min(w/width,h/height)||1;
  else scale=cover()*(zoom??(typeof baseZoom==='function'?baseZoom(w):baseZoom));
  const aim=mode==='overview'?{x:(w-width*scale)/2,y:(h-height*scale)/2}:
   mode==='hand'&&point?bounded(w/2-point.x*scale,h/2-point.y*scale):
   bounded(w/2-player.x*scale,h*focusY-player.y*scale);
  const k=(!ready||snap||mode!=='follow'||reduced())?1:1-Math.exp(-Math.max(0,dt)*9);
  x+=(aim.x-x)*k;y+=(aim.y-y)*k;ready=true;
  if(Math.abs(x-aim.x)<.03)x=aim.x;
  if(Math.abs(y-aim.y)<.03)y=aim.y;
  if(mode==='hand')point=center();
 }
 function follow(player){
  if(mode==='follow')return;
  const before=mode==='overview'&&bookmark ? bookmark.center : center();
  if(mode==='overview'&&bookmark)zoom=bookmark.zoom;
  mode='follow';point=null;bookmark=null;
  scale=cover()*(zoom??(typeof baseZoom==='function'?baseZoom(w):baseZoom));
  ({x,y}=bounded(w/2-before.x*scale,h/2-before.y*scale));
  update(player,0,reduced());
 }
 return {
  get mode(){return mode;},get x(){return x;},get y(){return y;},get scale(){return scale;},
  update,
  resize(wide,tall,player){if(w===wide&&h===tall&&ready)return;w=wide;h=tall;update(player,0,true);},
  follow,
  hand(player){
   if(mode==='hand'){follow(player);return;}
   if(mode==='overview'){const b=bookmark;bookmark=null;mode='hand';zoom=b?.zoom??zoom;point=b?.point??b?.center??center();}
   else{point=center();mode='hand';}
   update(player,0,true);
  },
  overview(player){
   if(mode==='overview'){
    const old=bookmark;mode=old.mode;zoom=old.zoom;point=old.point;bookmark=null;
    // Resume follow from the prior center before easing toward any new player position.
    if(mode==='follow'){scale=cover()*(zoom??(typeof baseZoom==='function'?baseZoom(w):baseZoom));({x,y}=bounded(w/2-old.center.x*scale,h/2-old.center.y*scale));update(player,0,reduced());return;}
   }else{
    bookmark={mode,zoom,point,center:center()};mode='overview';
   }
   update(player,0,true);
  },
  pan(from,dx,dy,player){
   if(mode==='overview')return;
   mode='hand';point={x:(w/2-from.x-dx)/scale,y:(h/2-from.y-dy)/scale};update(player,0,true);
  },
  world(at){return{x:(at.x-x)/scale,y:(at.y-y)/scale};},
  zoomAt(absolute,world,at,player){
   mode='hand';bookmark=null;
   zoom=Math.max(1,Math.min(2.75,absolute/cover()));
   const next=cover()*zoom;
   point={x:world.x+(w/2-at.x)/next,y:world.y+(h/2-at.y)/next};update(player,0,true);
  }
 };
}

// Keep gestures on the map. A pinch or drag never produces a walk/marker click.
export function bindMapCameraPointer(surface,{camera,player,blocked,control=()=>false,onStart,onMove,onTap,signal}){
 const pointers=new Map();let drag=null,pinch=null,moved=false,ignoreClick=false;
 const on=(target,type,fn,extra)=>target.addEventListener(type,fn,{signal,...extra});
 const local=(x,y)=>{const r=surface.getBoundingClientRect();return{x:x-r.left,y:y-r.top};};
 const split=()=>{const [a,b]=pointers.values();return {mid:local((a.x+b.x)/2,(a.y+b.y)/2),gap:Math.hypot(a.x-b.x,a.y-b.y)};};
 const grab=id=>{try{surface.setPointerCapture?.(id);}catch{/* A pointer can already have been cancelled. */}};
 const mark=()=>{if(!moved)onStart();moved=true;ignoreClick=true;surface.classList.add('grabbing');};
 function clear(){drag=null;pinch=null;pointers.clear();moved=false;surface.classList.remove('grabbing');}
 on(surface,'pointerdown',e=>{
  if(e.button>0||blocked()||control(e.target)||pointers.size>=2)return;
  if(!pointers.size){ignoreClick=false;moved=false;drag={x:e.clientX,y:e.clientY,from:{x:camera.x,y:camera.y}};}
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pointers.size===2){const {mid,gap}=split();pinch={world:camera.world(mid),gap:Math.max(1,gap),scale:camera.scale};mark();for(const id of pointers.keys())grab(id);}
 });
 on(surface,'pointermove',e=>{
  if(!pointers.has(e.pointerId)||blocked())return;
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pinch&&pointers.size===2){const {mid,gap}=split();camera.zoomAt(pinch.scale*gap/pinch.gap,pinch.world,mid,player());onMove();return;}
  if(!drag||camera.mode==='overview')return;
  const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
  if(!moved&&Math.hypot(dx,dy)<8)return;
  if(!moved){mark();grab(e.pointerId);}
  camera.pan(drag.from,dx,dy,player());onMove();
 });
 function release(e){
  if(!pointers.delete(e.pointerId))return;
  if(pinch){pinch=null;drag=null;}
  if(pointers.size)return;
  const tap=!moved&&e.type==='pointerup'&&e.target instanceof Node&&surface.contains(e.target);clear();
  if(tap&&!blocked())onTap?.(e);
 }
 for(const type of ['pointerup','pointercancel','lostpointercapture'])on(window,type,release);
 on(surface,'click',e=>{if(ignoreClick&&e.detail&&!control(e.target)){ignoreClick=false;e.preventDefault();e.stopPropagation();}},{capture:true});
 on(surface,'wheel',e=>{
  if(blocked()||control(e.target))return;
  e.preventDefault();const at=local(e.clientX,e.clientY),point=camera.world(at),step=e.deltaMode===1?16:e.deltaMode===2?surface.clientHeight:1;
  onStart();camera.zoomAt(camera.scale*Math.exp(-e.deltaY*step*.00125),point,at,player());onMove();
 },{passive:false});
 on(window,'blur',clear);
 on(document,'visibilitychange',clear);
 return clear;
}

// Screen controls stay in front. Hide only the labels they cover while the map moves.
export function mapLabelGuard(surface,labelSelector,controlSelector){
 let scheduled=false;
 return ()=>{
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(()=>{
   scheduled=false;
   if(!surface.isConnected)return;
   const controls=[...document.querySelectorAll(controlSelector)].map(el=>el.getBoundingClientRect()).filter(r=>r.width&&r.height);
   const collisions=[...surface.querySelectorAll(labelSelector)].map(el=>{
    const a=el.getBoundingClientRect();
    return [el,controls.some(b=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top)];
   });
   for(const [el,covered] of collisions)el.toggleAttribute('data-map-label-covered',covered);
  });
 };
}
