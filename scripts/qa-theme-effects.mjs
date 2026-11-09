import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import assert from 'node:assert/strict';
const root='/Volumes/T7 Shield/iscreammedia_sc34';
const {chromium}=createRequire(import.meta.url)(root+'/16 weatherchange/.tools/node_modules/playwright-core');
const configs=[['13 nightsky',5183,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5183']],['14 environments',4184,['scripts/serve.mjs']],['15 gas',4176,['scripts/serve.mjs']],['16 weatherchange',4175,['scripts/dev.mjs']]];
const servers=configs.map(([dir,port,args])=>spawn(process.execPath,args,{cwd:root+'/'+dir,env:{...process.env,PORT:String(port)},stdio:'ignore'}));
let browser;
try {
 await delay(2000); browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 for(const [dir,port] of configs){
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+port);
  await page.evaluate(async()=>{
   const Native=window.AudioContext;window.__oscs=[];window.__contexts=[];
   window.AudioContext=class extends Native{constructor(){super();this.__test=window.__recordEffects;if(this.__test)__contexts.push(this);}createOscillator(){const o=super.createOscillator(),stop=o.stop.bind(o);o.stop=(...a)=>{o.__stopped=true;return stop(...a);};if(this.__test)__oscs.push(o);return o;}};
   const {createThemeEffects}=await import('./src/theme-effects.js');window.__settings={muted:false,enabled:true,volume:.4};window.__fx=createThemeEffects('gas',()=>__settings);
   const button=document.createElement('button');button.id='test-sound';button.textContent='test sound';button.style='position:fixed;top:0;left:0;z-index:999999';button.onclick=()=>{window.__recordEffects=true;__fx.play('pump');window.__recordEffects=false;};document.body.append(button);
  });
  assert.equal(await page.evaluate(()=>__contexts.length),0,'no autoplay');await page.click('#test-sound');await page.waitForTimeout(60);
  console.log(dir,await page.evaluate(()=>({contexts:__contexts.length,states:__contexts.map(c=>c.state),oscillators:__oscs.length})));assert(await page.evaluate(()=>__contexts.length>=1&&__contexts.every(c=>c.state==='running')&&__oscs.length>=1),'real context unlocked');
  await page.evaluate(()=>{__fx.play('success');__settings.muted=true;__fx.sync();});assert(await page.evaluate(()=>__oscs.every(o=>o.__stopped)),'mute stops');
  const count=await page.evaluate(()=>__oscs.length);await page.click('#test-sound');assert.equal(await page.evaluate(()=>__oscs.length),count,'mute prevents new effects');
  await page.evaluate(()=>{__settings.muted=false;__fx.play('pump');Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  assert(await page.evaluate(()=>__oscs.every(o=>o.__stopped)),'hidden stops');
  await page.evaluate(()=>{delete document.hidden;__fx.dispose();});await page.waitForTimeout(30);assert.equal(await page.evaluate(()=>__contexts[0].state),'closed');assert.deepEqual(errors,[]);
  console.log(dir,'PASS real Web Audio gesture unlock, mute, hidden, dispose; no page errors');await page.close();
 }
}finally{await browser?.close();servers.forEach(p=>p.kill());}
