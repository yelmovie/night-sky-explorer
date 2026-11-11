import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {mkdir,writeFile} from 'node:fs/promises';
import {completedState} from './shot-fixture.mjs';
import {SAVE_KEY} from '../src/state.js';
import {planets,bodies} from '../src/data.js';
import {voiceLines} from '../src/voice-lines.js';
if(!process.env.PLAYWRIGHT_MODULE)throw Error('Set PLAYWRIGHT_MODULE to the installed Playwright index.mjs.');
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const base=process.env.TEST_URL||'http://127.0.0.1:5213',out=process.env.VOICE_QA_DIR||'.tmp/voice-qa';await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const context=await browser.newContext({viewport:{width:1280,height:800},hasTouch:true}),page=await context.newPage(),errors=[],checks=[],heard=new Set();
page.setDefaultNavigationTimeout(60000);
await context.addInitScript(()=>{
 window.qaVoices=[];window.qaAudioEvents=[];window.qaMaxVoices=0;window.qaGains=[];
 const Native=window.Audio;
 window.Audio=class extends Native{constructor(...args){super(...args);window.qaVoices.push(this);for(const type of ['playing','ended','error'])this.addEventListener(type,()=>{const id=this.src.match(/\/voices\/([^/.]+)\.mp3/)?.[1];if(id)window.qaAudioEvents.push({type,id,time:this.currentTime});const playing=window.qaVoices.filter(a=>!a.paused&&!a.ended&&a.src.includes('/voices/')).length;window.qaMaxVoices=Math.max(window.qaMaxVoices,playing);});}};
 const original=AudioContext.prototype.createGain;AudioContext.prototype.createGain=function(...args){const g=original.apply(this,args);window.qaGains.push(g);return g;};
});
page.on('pageerror',e=>errors.push(e.message));
async function seed(scene,count=5,edit=()=>{}){
 const s=completedState(count);s.scene=scene;s.resume=scene;s.started=true;s.intro=true;Object.assign(s.settings,{muted:false,sfx:true,bgm:true,reducedMotion:true,adminUnlock:false});edit(s);if(s.core.restored){s.core.connections={1:1,2:2,3:3,4:4,5:5};s.core.angle=180;}
 await page.goto(base);await page.evaluate(([key,s])=>localStorage.setItem(key,JSON.stringify(s)),[SAVE_KEY,s]);await page.reload();await page.locator('main').waitFor();await page.evaluate(()=>document.fonts.ready);
 if(scene==='map')await page.locator('#world-loading').waitFor({state:'detached',timeout:90000});
 await page.mouse.click(1,1);
}
const click=a=>page.locator(`[data-action="${a}"]`).first().click();
async function listen(id){
 const line=voiceLines.find(x=>x.id===id),control=page.locator(`[data-voice-id="${id}"]`);
 if(id==='welcome'){assert.match(await page.locator('.npc-welcome-voice').textContent(),new RegExp(line.text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));}
 else{await control.waitFor();assert.ok((await page.locator('body').textContent()).includes(line.text),'visible text matches '+id);}
 if(id!=='welcome'&&await control.getAttribute('data-state')==='error'){await control.locator('button').click();checks.push(id+' replay button recovered an unavailable autoplay attempt');}
 await page.waitForFunction(id=>window.qaAudioEvents.some(e=>e.id===id&&e.type==='playing'),id,{timeout:20000});
 const during=await page.evaluate(()=>window.qaGains[0]?.gain.value);assert.equal(during,0,'BGM ducked for '+id);
 await page.waitForFunction(id=>window.qaAudioEvents.some(e=>e.id===id&&e.type==='ended'),id,{timeout:22000});
 assert.ok(await page.evaluate(()=>window.qaGains[0]?.gain.value>0),'BGM restored after '+id);
 assert.equal(await page.evaluate(()=>window.qaMaxVoices),1);heard.add(id);console.log('PASS',id);checks.push(id+' played to ended with matching text and BGM duck');
}
try{
 await seed('home',0);await page.locator('.npc-welcome-voice button').click();await listen('welcome');
 await seed('home',0,s=>{s.started=false;s.intro=false;});await click('start');await click('story-next-1-0');await listen('intro-fox');await click('story-next-2-0');await listen('intro-lumi');await click('story-done');
 await seed('map',0);await page.locator('#map-companion').click();await listen('map-1');await click('more-hint');await listen('map-2');await click('more-hint');await listen('map-3');await click('close-modal');
 for(const scene of Array.from({length:5},(_,i)=>[`s${i+1}a`,`s${i+1}b`]).flat()){
  await seed(scene);await click('hint');await click('more-hint');await listen('hint-'+scene);await click('close-modal');
 }
 await seed('s3a',2);await page.locator('#planet-feature').selectOption({label:planets.find(x=>x.id!=='mercury').feature});await listen('retry-planet');
 await seed('s4b',3,s=>{s.drafts.classification.answers={};});await page.locator(`[data-learning="kind-${bodies[0].kind==='star'?'planet':'star'}"]`).click();await page.locator('[data-learning="reason-bright"]').click();await listen('retry-light');
 await page.locator(`[data-learning="kind-${bodies[0].kind}"]`).click();await listen('retry-half');
 for(let n=1;n<=5;n++){await seed(`s${n}b`,n,s=>{delete s.evidence[n];});await click('complete');await listen('reward-'+n);await click('close-modal');}
 for(const [id,count,restored] of [['kit-progress',0,false],['kit-ready',5,false],['kit-restored',5,true]]){await seed('home',count,s=>{s.core.restored=restored;});await click('kit');await listen(id);await click('close-modal');}
 await seed('core',5,s=>{s.core.restored=false;s.core.reportSeen=false;});await listen('report');await click('close-modal');
 await seed('results',5,s=>{s.core.restored=true;});await click('movie');for(let i=0;i<4;i++)await page.locator('#movie-skip').click();await listen('ending');await click('close-modal');
 assert.deepEqual([...heard].sort(),voiceLines.map(x=>x.id).sort());
 // A welcome line and dialog cannot overlap; Escape and failed-media recovery stay usable.
 await seed('home',0);await page.locator('.npc-welcome-voice button').click();await page.waitForFunction(()=>window.qaAudioEvents.some(e=>e.id==='welcome'&&e.type==='playing'));await click('kit');await page.waitForFunction(()=>window.qaAudioEvents.some(e=>e.id==='kit-progress'&&e.type==='playing'));assert.equal(await page.evaluate(()=>window.qaMaxVoices),1);await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>window.qaVoices.some(a=>!a.paused&&!a.ended&&a.src.includes('/voices/'))),false);
 await page.route('**/voices/map-1.mp3',route=>route.abort());await seed('map',0);await page.locator('#map-companion').click();await page.locator('[data-voice-id="map-1"][data-state="error"]').waitFor();assert.match(await page.locator('[data-voice-id="map-1"]').textContent(),/글을 읽고 계속/);await click('more-hint');await page.waitForFunction(()=>window.qaAudioEvents.some(e=>e.id==='map-2'&&e.type==='playing'));await click('close-modal');await page.unroute('**/voices/map-1.mp3');
 checks.push('welcome-to-dialog overlap, Escape stop, failed media text fallback and next hint recovery');
 // Replay replacement, close, mute and hidden-page cancellation.
 await seed('home',5);await click('kit');await page.waitForTimeout(150);for(let i=0;i<6;i++)await page.locator('[data-voice-id] button').click();await click('close-modal');assert.equal(await page.evaluate(()=>window.qaVoices.some(a=>!a.paused&&!a.ended&&a.src.includes('/voices/'))),false);
 await click('sound');await click('kit');assert.equal(await page.evaluate(()=>window.qaVoices.some(a=>!a.paused&&!a.ended&&a.src.includes('/voices/'))),false);await page.locator('[data-voice-id] button').click();assert.match(await page.locator('[data-voice-id]').textContent(),/소리를 켜면/);await click('close-modal');
 await click('sound');await click('kit');await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});assert.equal(await page.evaluate(()=>window.qaVoices.some(a=>!a.paused&&!a.ended&&a.src.includes('/voices/'))),false);await page.evaluate(()=>{delete document.hidden;});
 checks.push('rapid replay, dialog close, mute and hidden page stop active narration');
 for(const [width,height] of [[1280,800],[1920,1080],[915,412],[360,740]]){
  await page.setViewportSize({width,height});await seed('s3a',2);await page.locator('#planet-feature').selectOption({label:planets.find(x=>x.id!=='mercury').feature});
  for(const kind of ['feedback','hint']){
   if(kind==='hint'){await click('hint');await click('more-hint');}
   const issues=await page.locator(kind==='hint'?'dialog[open] .npc-dialogue-voice button':'.activity-footer button').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect(),top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {outside:r.left<0||r.right>innerWidth||r.top<0||r.bottom>innerHeight,covered:!top||!(top===n||n.contains(top))};}).filter(x=>x.outside||x.covered));assert.deepEqual(issues,[],`${width} ${kind} controls`);
   await page.screenshot({path:`${out}/${kind}-${width}.png`});
  }
 }
 assert.deepEqual(errors,[]);await writeFile(out+'/result.json',JSON.stringify({lines:heard.size,checks,errors,scope:'fixture-based line connections and actual playback, not a full learning completion or human listening assessment'},null,2));console.log(JSON.stringify({lines:heard.size,checks,errors},null,2));
}catch(error){await page.screenshot({path:out+'/failure.png'});await writeFile(out+'/failure.json',JSON.stringify({heard:[...heard],checks,errors,error:String(error)},null,2));throw error;}finally{await browser.close();}
