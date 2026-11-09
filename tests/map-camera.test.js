import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../src/world.js',import.meta.url),'utf8');
function fn(name){const start=source.indexOf('function '+name+'(');assert.ok(start>=0);let i=source.indexOf('{',start),depth=1;for(let j=i+1;j<source.length;j++){if(source[j]==='{')depth++;if(source[j]==='}'&&!--depth)return source.slice(start,j+1);}}
const setup='let scale=1,free=null;const WORLD={width:1672,height:941},layer={style:{}},root={getBoundingClientRect:()=>({width:w,height:h})};FN;resize();result={width:WORLD.width*scale,height:WORLD.height*scale};';
test('overview fits the complete world and exploration remains zoomed',()=>{
 for(const [w,h] of [[1024,768],[768,1024],[1280,800],[390,844],[1920,1080]]){
  for(const overview of [true,false]){
   const context={w,h,overview};vm.createContext(context);vm.runInContext(setup.replace('FN',fn('resize')),context);
   const r=context.result;assert.ok(Number.isFinite(r.width)&&Number.isFinite(r.height));
   if(overview){assert.ok(r.width<=w+0.001);assert.ok(r.height<=h+0.001);if('x' in r){assert.ok(Math.abs(r.x-(w-r.width)/2)<0.001);assert.ok(Math.abs(r.y-(h-r.height)/2)<0.001);}}
   else assert.ok(r.width>w&&r.height>h);
  }
 }
});
test('hand controls pan by pointer without treating small taps as drags',()=>{
 const handlers=new Map(),viewport={classList:{add(){},remove(){},toggle(){}},setPointerCapture(){captures++;}},handButton={setAttribute(k,v){pressed=v;}},overviewButton={setAttribute(){}};
 let captures=0,pressed;
 const context={viewport,handButton,overviewButton,on:(el,type,cb)=>handlers.set((el===viewport?'view':el===handButton?'hand':'overview')+type,cb),document:{querySelector:()=>null},cancelMovement(){},resize(){},offset:{x:-300,y:-200},hand:false,overview:false,grab:null,suppressClick:false,free:null};
 vm.createContext(context);
 vm.runInContext(source.slice(source.indexOf("  on(handButton,'click'"),source.indexOf('  return {travel,dispose()')),context);
 const e=(x,y)=>({button:0,pointerId:1,clientX:x,clientY:y,target:{closest:()=>null}});
 handlers.get('viewpointerdown')(e(100,100));handlers.get('viewpointermove')(e(102,102));assert.equal(captures,0);assert.equal(context.suppressClick,false);
 handlers.get('viewpointermove')(e(140,125));assert.equal(captures,1);assert.equal(context.free.x,-260);assert.equal(context.free.y,-175);assert.equal(context.suppressClick,true);
 handlers.get('viewpointercancel')(e(140,125));assert.equal(context.grab,null);
 handlers.get('handclick')();assert.equal(pressed,'true');handlers.get('handclick')();assert.equal(pressed,'false');
});
