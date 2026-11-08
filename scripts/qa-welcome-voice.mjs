import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import assert from 'node:assert/strict';
const root='/Volumes/T7 Shield/iscreammedia_sc34';
const {chromium}=createRequire(import.meta.url)(root+'/16 weatherchange/.tools/node_modules/playwright-core');
const configs=[['13 nightsky',5183,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5183'],'[data-action="sound"]','[data-action="start"]'],['14 environments',4184,['scripts/serve.mjs'],'[data-action="mute"]','.hero-start'],['15 gas',4176,['scripts/serve.mjs'],'.sound-button','.start-button'],['16 weatherchange',4175,['scripts/dev.mjs'],'[data-sound]','#start']];
const servers=configs.map(([dir,port,args])=>spawn(process.execPath,args,{cwd:root+'/'+dir,env:{...process.env,PORT:String(port)},stdio:'ignore'}));
let browser;
try{
 await delay(2000);
 browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 for(const [dir,port,,mute,start] of configs){
  const context=await browser.newContext({viewport:{width:1024,height:768}}),page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{const Native=window.Audio;window.__voices=[];window.Audio=function(src){const a=new Native(src);if(src?.includes('npc-welcome'))window.__voices.push(a);return a;};window.Audio.prototype=Native.prototype;});
  await page.goto('http://127.0.0.1:'+port);const panel=page.locator('.npc-welcome-voice'),button=panel.locator('button');await panel.waitFor();
  assert.equal(await page.evaluate(()=>__voices.at(-1).paused),true,'no autoplay');
  const bounds=await button.boundingBox();assert(bounds.height>=48&&bounds.width>=48);
  await button.click();await page.waitForFunction(()=>__voices.at(-1).currentTime>.1);assert.equal(await button.getAttribute('aria-pressed'),'true');
  await button.click();assert.equal(await page.evaluate(()=>__voices.at(-1).paused),true);
  await button.click();await page.waitForFunction(()=>!__voices.at(-1).paused);await page.locator(mute).click();assert.equal(await page.evaluate(()=>__voices.every(a=>a.paused)),true,'mute stops');
  await page.locator(mute).click();await button.click();await page.waitForFunction(()=>!__voices.at(-1).paused);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));delete document.hidden;});assert.equal(await page.evaluate(()=>__voices.at(-1).paused),true,'hidden stops');
  await button.click();await page.waitForFunction(()=>!__voices.at(-1).paused);
  await page.evaluate(()=>{const video=document.createElement('video');document.body.append(video);video.dispatchEvent(new Event('play'));video.remove();});assert.equal(await page.evaluate(()=>__voices.at(-1).paused),true,'other media stops voice');
  await button.click();await button.click();await button.click();await page.waitForFunction(()=>__voices.at(-1).currentTime>.1);
  await page.locator(start).click();assert.equal(await page.evaluate(()=>__voices.every(a=>a.paused)),true,'navigation stops');
  await page.goto('http://127.0.0.1:'+port);await panel.waitFor();
  for(const [width,height] of [[1024,768],[873,580],[390,844]]){await page.setViewportSize({width,height});await page.waitForTimeout(1000);await page.screenshot({path:root+'/13 nightsky/.tmp/npc-qa/'+dir.split(' ')[0]+'-'+width+'.png'});const b=await panel.boundingBox();console.log(dir,'layout',width,height,JSON.stringify(b));}
  await context.close();
  const failContext=await browser.newContext(),failPage=await failContext.newPage();await failPage.route('**/npc-welcome.m4a',r=>r.abort());await failPage.goto('http://127.0.0.1:'+port);await failPage.locator('.npc-welcome-voice button').click();await failPage.getByText('음성을 불러오지 못했어요. 위의 글을 읽고 계속할 수 있어요.').waitFor();await failContext.close();
  assert.deepEqual(errors,[]);console.log(dir,'PASS real AAC playback, manual stop, mute, hidden, navigation, failed fetch, touch size, no page errors');
 }
}finally{await browser?.close();servers.forEach(p=>p.kill());}
