import { pathToFileURL } from 'node:url';
if(!process.env.PLAYWRIGHT_MODULE)throw Error('Set PLAYWRIGHT_MODULE to an existing local Playwright index.mjs');
const { chromium }=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
import { mkdir, writeFile } from 'node:fs/promises';
import { freshState, SAVE_KEY } from '../src/state.js';
const output=process.env.QA_OUTPUT;
if(!output)throw Error('QA_OUTPUT must be an external SSD path');
await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE,headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader',`--disk-cache-dir=${output}/cache`]});
try{
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const state=freshState();Object.assign(state,{started:true,intro:true,scene:'map',resume:'map'});state.settings.muted=true;state.settings.reducedMotion=false;
 await page.addInitScript(({key,state})=>{localStorage.setItem(key,JSON.stringify(state));const clear=CanvasRenderingContext2D.prototype.clearRect;window.__mapPaints=0;CanvasRenderingContext2D.prototype.clearRect=function(...a){if(this.canvas.id==='world-canvas')window.__mapPaints++;return clear.apply(this,a);};},{key:SAVE_KEY,state});
 await page.goto(process.env.TEST_URL||'http://127.0.0.1:5283');
 await page.locator('#world-loading').waitFor({state:'detached'});
 await page.waitForTimeout(700);
 await page.evaluate(()=>window.__mapPaints=0);await page.waitForTimeout(2000);const idle=await page.evaluate(()=>window.__mapPaints);
 await page.locator('#world').focus();await page.evaluate(()=>window.__mapPaints=0);await page.keyboard.down('ArrowRight');await page.waitForTimeout(700);await page.keyboard.up('ArrowRight');const movement=await page.evaluate(()=>window.__mapPaints);
 await page.screenshot({path:`${output}/map.png`});
 await page.locator('[data-action="settings"]').click();await page.waitForTimeout(100);await page.evaluate(()=>window.__mapPaints=0);await page.waitForTimeout(1200);const modal=await page.evaluate(()=>window.__mapPaints);
 const result={idlePaintsPer2s:idle,movingPaintsPer700ms:movement,modalPaintsPer1200ms:modal,errors,environment:'Mac mini headless Chromium; desktop proxy, not school tablet FPS'};
 await writeFile(`${output}/result.json`,JSON.stringify(result,null,2));console.log(result);
 if(errors.length||movement<2||(!process.env.QA_BASELINE&&(idle>2||modal>2)))process.exitCode=1;
}finally{await browser.close();}
