import test from 'node:test';
import assert from 'node:assert/strict';
import { createThemeEffects } from '../src/theme-effects.js';
test('procedural effects respect mute, volume, priority, hidden and disposal', () => {
 const doc = new EventTarget(); doc.hidden = false; globalThis.document = doc;
 const oscillators = []; let created = 0;
 const param = () => ({ setValueAtTime(){}, linearRampToValueAtTime(){}, exponentialRampToValueAtTime(){} });
 globalThis.AudioContext = class { constructor(){created++;this.state='running';this.currentTime=0;this.destination={};} createGain(){return {gain:param(),connect(){},disconnect(){}};} createOscillator(){const o={frequency:param(),connect(){},disconnect(){},start(){this.started=true;},stop(){this.stopped=true;}};oscillators.push(o);return o;} suspend(){this.state='suspended';return Promise.resolve();} resume(){this.state='running';return Promise.resolve();} close(){return Promise.resolve();} };
 const settings={muted:true,enabled:true,volume:.25};
 const effect=createThemeEffects('gas',()=>settings);effect.play('pump');assert.equal(created,0);
 settings.muted=false;effect.play('pump');assert.equal(oscillators.length,1);assert(oscillators[0].started);
 effect.play('success');assert(oscillators[0].stopped);assert.equal(oscillators.length,4);
 settings.muted=true;effect.sync();assert(oscillators.every(o=>o.stopped));
 settings.muted=false;settings.enabled=false;effect.play('pump');assert.equal(oscillators.length,4);
 settings.enabled=true;doc.hidden=true;effect.play('pump');assert.equal(oscillators.length,4);
 doc.hidden=false;effect.play('pump');doc.hidden=true;doc.dispatchEvent(new Event('visibilitychange'));assert(oscillators.every(o=>o.stopped));
 doc.hidden=false;effect.dispose();effect.play('pump');assert.equal(oscillators.length,5);
 delete globalThis.AudioContext; delete globalThis.document;
});
