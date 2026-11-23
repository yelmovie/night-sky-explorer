// Focused delivery regressions; every seeded fixture is separate from a user's browser.
// PLAYWRIGHT_MODULE=<index.mjs> BROWSER_EXECUTABLE=<Chrome> TEST_URL=<local preview>
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { freshState, SAVE_KEY } from '../src/state.js';
import { completedState } from './shot-fixture.mjs';
import { bodies, patternRegions } from '../src/data.js';
import { patternChoices } from '../src/reflection-chips.js';
import { lunarModelVoice } from '../src/lunar-model.js';
const output=resolve(process.env.DELIVERY_QA_DIR||'.cache/review13-after/regressions');
await mkdir(join(output,'browser-tmp'),{recursive:true});
process.env.TMPDIR=join(output,'browser-tmp');
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const base=process.env.TEST_URL||'http://127.0.0.1:5193';
const results=[],errors=[],httpErrors=[];
const browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE,headless:true,args:['--disable-webgl']});
async function seed(page,scene,count,edit=()=>{}){
  const s=completedState(count);Object.assign(s,{scene,resume:scene});
  Object.assign(s.settings,{muted:true,bgm:false,sfx:false,reducedMotion:true});s.core.reportSeen=true;edit(s);
  await page.goto(base);await page.evaluate(([k,v])=>localStorage.setItem(k,JSON.stringify(v)),[SAVE_KEY,s]);await page.reload();
  await page.locator(scene==='core'?'.core-v3':`[data-scene="${scene}"]`).waitFor();
}
const stored=page=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),SAVE_KEY);
const learn=(page,action)=>page.locator(`[data-learning="${action}"]`).click();
async function input(page,id,value){await page.locator('#'+id).evaluate((el,v)=>{el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));},value);}
try{
  for(const [width,height] of [[1280,800],[1024,768]]){
    const context=await browser.newContext({viewport:{width,height},hasTouch:true});const page=await context.newPage();page.setDefaultTimeout(12000);
    page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)httpErrors.push({url:r.url(),status:r.status()});});
    await seed(page,'s1b',0,s=>s.drafts.moon.comparisons=freshState().drafts.moon.comparisons);
    const boxes=await page.locator('.surface-targets button').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,hit:el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))};}));
    assert.equal(boxes.length,4);for(const b of boxes){assert.ok(b.width>=44&&b.height>=44);assert.equal(b.hit,true);}
    const first=boxes[0];await page.touchscreen.tap(first.x+first.width/2,first.y+first.height/2);
    await page.locator('[data-learning="spot-67-29"]').focus();await page.keyboard.press('Enter');
    const observations=(await stored(page)).stats.observations;
    await learn(page,'spot-67-29');assert.equal((await stored(page)).stats.observations,observations);assert.match(await page.locator('#toast').innerText(),/다른 표면/);
    assert.equal(await page.locator('.surface-crop > svg').count(),2);assert.equal(await page.locator('.spot-marker').count(),2);
    await page.screenshot({path:join(output,`surface-buttons-${width}.png`)});
    results.push({width,test:'44px unobscured surface buttons, emulated touch, keyboard, duplicate rejection',boxes});

    await seed(page,'s2b',1,s=>{s.drafts.phases.predictions=freshState().drafts.phases.predictions;Object.assign(s.settings,{muted:false,voice:true});});
    assert.equal(await page.locator('.phase-model-scope p').innerText(),lunarModelVoice.text);
    await page.locator('[data-phase-model-voice] button').click();
    await page.locator(`[data-voice-id="${lunarModelVoice.id}"][data-state="playing"]`).waitFor();
    await page.locator('[data-phase-model-voice] button').click();
    await input(page,'prediction-amount',25);await learn(page,'side-left');await learn(page,'reveal-phase');
    await learn(page,'pick-size-smaller');assert.equal((await stored(page)).drafts.phases.predictions[14].reflection,'');
    await learn(page,'pick-size-bigger');await learn(page,'pick-side-other-side');await page.waitForTimeout(1700);
    assert.equal(await page.locator('[data-learning="round-0"]').getAttribute('aria-pressed'),'true');
    assert.match(await page.locator('.phase-result').innerText(),/처음 예상 25%/);
    await page.screenshot({path:join(output,`phase-comparison-${width}.png`)});
    await page.locator('#stage-next').click();assert.equal(await page.locator('[data-learning="round-1"]').getAttribute('aria-pressed'),'true');
    results.push({width,test:'same text/voice playback, incorrect answer correction, visible result, explicit next'});
    await seed(page,'s2b',1,s=>{s.drafts.phases.predictions[14].original=null;s.drafts.phases.predictions[14].reflection='이전의 부분 기록';});
    assert.equal(await page.locator('.phase-result').count(),0,'partial legacy prediction has no fabricated comparison');

    await seed(page,'s3a',2,s=>{s.drafts.planets.records={};s.drafts.planets.selected='mars';});
    assert.match(await page.locator('.planet-exhibit .model-note').innerText(),/8개 중.*6개/);
    await learn(page,'clear-cloud');assert.equal(await page.locator('.planet-fog').count(),0);
    await learn(page,'toggle-three');await page.locator('.planet-portrait').waitFor();
    assert.match(await page.locator('.planet-portrait').getAttribute('alt'),/화성/);
    await input(page,'planet-zoom',1.4);await input(page,'planet-rotation',45);
    assert.match(await page.locator('.planet-portrait').getAttribute('style'),/scale\(1.4\) rotate\(45deg\)/);
    await page.screenshot({path:join(output,`webgl-fallback-${width}.png`)});
    await learn(page,'feature-3');assert.equal((await stored(page)).drafts.planets.records.mars.mode,'illustration');
    results.push({width,test:'one-press fog clear, WebGL disabled same-planet 2D fallback, view controls, observation saved'});

    await seed(page,'s4a',3,s=>s.drafts.classification=freshState().drafts.classification);
    for(const b of bodies)await learn(page,'body-'+b.id);
    assert.equal(await page.locator('#stage-next').isDisabled(),true);
    await page.locator('[data-shield]').focus();await page.keyboard.press('Enter');
    assert.deepEqual((await stored(page)).drafts.classification.lightTrial.observations,[]);
    await learn(page,'predict-light-same');await page.locator('[data-shield]').focus();await page.keyboard.press(' ');
    assert.deepEqual((await stored(page)).drafts.classification.lightTrial.observations,['covered']);
    await page.reload();await page.locator('[data-shield][aria-pressed="true"]').waitFor();
    assert.equal(await page.locator('#stage-next').isDisabled(),true);
    await page.locator('[data-shield]').focus();await page.keyboard.press('Enter');
    assert.deepEqual((await stored(page)).drafts.classification.lightTrial.observations,['covered','uncovered']);
    assert.equal((await stored(page)).drafts.classification.lightTrial.prediction,'same');
    assert.equal(await page.locator('#stage-next').isEnabled(),true);
    assert.match(await page.locator('.light-conclusion').innerText(),/달과 행성은 태양빛/);
    await page.screenshot({path:join(output,`light-comparison-${width}.png`)});
    results.push({width,test:'prediction before cover, both observations, reload midway, first prediction preserved'});

    await seed(page,'s5b',4,s=>{s.drafts.pattern.polaris={pointers:['Merak','Dubhe'],found:true};for(const [key,region] of Object.entries(patternRegions)){const a=region.stars;s.drafts.pattern.cases[key]={lines:[[a[0],a[1]],[a[1],a[2]],[a[2],a[3]]],original:null,compared:false,showReference:false,reflection:''};}});
    for(const [i,region] of Object.keys(patternRegions).entries()){
      await learn(page,'round-'+i);await learn(page,'undo-line');await learn(page,'compare-pattern');await learn(page,'toggle-reference');
      const card=(await stored(page)).drafts.pattern.cases[region];
      for(const group of patternChoices(region,card.lines))await learn(page,`pick-${group.key}-${group.options.find(x=>x.ok).id}`);
      assert.deepEqual((await stored(page)).drafts.pattern.cases[region].original,(await stored(page)).drafts.pattern.cases[region].lines);
    }
    assert.equal(await page.locator('#stage-next').isEnabled(),true);
    results.push({width,test:'undo and reference hide remain, both initial comparisons complete without reconnection'});

    await seed(page,'s5a',4,s=>{s.drafts.pattern.polaris={pointers:[],found:false};});
    await learn(page,'round-2');assert.match(await page.locator('#star-observation').innerText(),/메라크.*두베/);
    await page.locator('[data-star="Dubhe"]').focus();await page.keyboard.press('Enter');assert.match(await page.locator('#star-observation').innerText(),/메라크/);
    for(const id of ['Merak','Dubhe']){await page.locator(`[data-star="${id}"]`).focus();await page.keyboard.press('Enter');}
    assert.match(await page.locator('#star-observation').innerText(),/약 5배/);
    results.push({width,test:'named pointer stars and approximate five-gap direction'});
    await context.close();
  }
  assert.deepEqual(errors,[]);assert.deepEqual(httpErrors,[]);
  await writeFile(join(output,'report.json'),JSON.stringify({results,errors,httpErrors},null,2));
  console.log(JSON.stringify({checks:results.length,errors,httpErrors,output}));
}finally{await browser.close();}
// Real WebGL context loss follows the same fallback, in a separately launched browser.
const gpu=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE,headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
  const p=await gpu.newPage({viewport:{width:1280,height:800}});
  await seed(p,'s3a',2);await learn(p,'toggle-three');await p.locator('#planet-viewer canvas').waitFor();
  await p.locator('#planet-viewer canvas').evaluate(canvas=>canvas.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
  await p.locator('.planet-portrait').waitFor();assert.match(await p.locator('.planet-portrait').getAttribute('alt'),/화성/);
  await writeFile(join(output,'context-loss.json'),JSON.stringify({samePlanet2D:true,selected:(await stored(p)).drafts.planets.selected}));
  console.log('PASS real WebGL context loss -> same-planet 2D');
}finally{await gpu.close();}
