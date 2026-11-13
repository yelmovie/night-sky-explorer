import test from 'node:test';
import assert from 'node:assert/strict';
import {createMapCamera} from '../src/map-camera.js';
const player={x:840,y:470},bounds={width:1672,height:941},size=[1280,800];
const see=(c,p)=>({x:c.x+p.x*c.scale,y:c.y+p.y*c.scale});
const close=(a,b)=>assert.ok(Math.abs(a-b)<.05,`${a} versus ${b}`);
const same=(a,b)=>{close(a.x,b.x);close(a.y,b.y);};

test('overview fits the map; hand framing and magnification survive overview and a viewport resize',()=>{
 const c=createMapCamera(bounds);c.resize(...size,player);
 assert.ok(c.scale*bounds.width>size[0]&&c.scale*bounds.height>size[1]);
 const point={x:665,y:412};
 c.zoomAt(c.scale*1.4,point,{x:640,y:400},player);
 const center=c.world({x:640,y:400}),zoom=c.scale/Math.max(1280/1672,800/941);
 c.overview(player);
 assert.equal(c.mode,'overview');
 assert.ok(c.scale*bounds.width<=size[0]+.001&&c.scale*bounds.height<=size[1]+.001);
 c.resize(1050,760,player);
 c.overview(player);
 assert.equal(c.mode,'hand');same(c.world({x:525,y:380}),center);
 close(c.scale/Math.max(1050/1672,760/941),zoom);
 c.overview(player);c.follow(player);assert.equal(c.mode,'follow');
});

test('zoom holds the centered point between fingers and hand movement is immediate',()=>{
 const c=createMapCamera(bounds);c.resize(...size,player);
 const anchor={x:575,y:359},target={x:595,y:371},point=c.world(anchor);
 c.zoomAt(c.scale*1.4,point,target,player);
 same(see(c,point),target);
 const old={x:c.x,y:c.y};
 c.pan(old,26,-16,player);same(c,{x:old.x+26,y:old.y-16});
});

test('follow easing is frame-rate independent and reduced motion snaps immediately',()=>{
 const a=createMapCamera(bounds);const b=createMapCamera(bounds);const c=createMapCamera({...bounds,reduced:()=>true});
 for(const x of [a,b,c])x.resize(...size,player);
 const goal={x:956,y:530},start=a.x;
 a.update(goal,.04);b.update(goal,.02);b.update(goal,.02);c.update(goal,.001);
 same(a,b);assert.ok(a.x<start&&a.x>c.x);
 a.update(goal,3);same(a,c);
});
