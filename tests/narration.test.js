import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createNarration } from '../src/narration.js';
import { voiceLines, voiceForText } from '../src/voice-lines.js';
function fixture(firstPlay) {
 const doc=new EventTarget(),page=new EventTarget();doc.hidden=false;
 let muted=false;const audios=[],duck=[];
 class FakeAudio extends EventTarget { play(){this.playing=true;return this.pending||Promise.resolve();} pause(){this.playing=false;} removeAttribute(){this.src='';} load(){} }
 const player=createNarration({doc,page,isMuted:()=>muted,duck:value=>duck.push(value),makeAudio:()=>{const a=new FakeAudio();if(!audios.length&&firstPlay)a.pending=firstPlay;audios.push(a);return a;}});
 return {player,doc,page,audios,duck,setMuted:value=>muted=value};
}
test('새 대사는 이전 음성을 멈추고 끝나면 배경음 억제를 해제한다', async()=>{
 const f=fixture();await f.player.play('intro-fox');assert.equal(f.audios[0].playing,true);assert.equal(f.duck.at(-1),true);
 await f.player.play('intro-lumi');assert.equal(f.audios[0].playing,false);assert.equal(f.audios[1].playing,true);
 f.audios[1].dispatchEvent(new Event('ended'));assert.equal(f.player.state.status,'idle');assert.equal(f.duck.at(-1),false);f.player.dispose();
});
test('음소거·숨긴 탭·화면 이동은 재생을 중단하고 새 재생도 막는다',async()=>{
 const f=fixture();f.setMuted(true);assert.equal(await f.player.play('map-1'),false);assert.equal(f.audios.length,0);
 f.setMuted(false);await f.player.play('map-1');f.doc.hidden=true;f.doc.dispatchEvent(new Event('visibilitychange'));assert.equal(f.audios[0].playing,false);assert.equal(await f.player.play('map-2'),false);
 f.doc.hidden=false;await f.player.play('map-2');f.setMuted(true);f.doc.dispatchEvent(new Event('change'));assert.equal(f.audios.at(-1).playing,false);
 f.setMuted(false);await f.player.play('map-3');f.page.dispatchEvent(new Event('pagehide'));assert.equal(f.audios.at(-1).playing,false);f.player.dispose();
});
test('늦은 play 완료와 실패는 새 대사의 상태를 덮어쓰지 않는다',async()=>{
 let resolve;const f=fixture(new Promise(r=>resolve=r));const first=f.player.play('intro-fox');
 const old=f.audios[0];await f.player.play('intro-lumi');resolve();assert.equal(await first,false);
 old.dispatchEvent(new Event('error'));assert.equal(f.player.state.id,'intro-lumi');assert.equal(f.player.state.status,'playing');f.player.dispose();
});
test('자동재생 차단은 오류 상태로 돌아오고 글의 진행을 막지 않는다',async()=>{
 const f=fixture(Promise.reject(new Error('NotAllowedError')));assert.equal(await f.player.play('intro-fox'),false);assert.equal(f.player.state.status,'error');assert.equal(f.duck.at(-1),false);f.player.dispose();
});
test('초상 말하기 상태는 실제 재생 시작과 버퍼링·일시정지를 따른다', async()=>{
 let resolve;const f=fixture(new Promise(r=>resolve=r));const pending=f.player.play('intro-fox');
 assert.equal(f.player.state.status,'loading');resolve();await pending;
 assert.equal(f.player.state.status,'playing');
 f.audios[0].dispatchEvent(new Event('waiting'));assert.equal(f.player.state.status,'loading');
 f.audios[0].dispatchEvent(new Event('playing'));assert.equal(f.player.state.status,'playing');
 f.audios[0].dispatchEvent(new Event('pause'));assert.equal(f.player.state.status,'paused');
 f.player.stop();f.audios[0].dispatchEvent(new Event('playing'));assert.equal(f.player.state.status,'idle');f.player.dispose();
});
test('모든 대사 음성 파일의 출처·SHA와 화면 대사 카탈로그가 일치한다',()=>{
 const read=name=>JSON.parse(readFileSync(new URL('../docs/'+name,import.meta.url),'utf8'));
 const fill=read('VOICE-FILL-20261118.json');
 const older=[...read('VOICE-PROVENANCE-20261110.json').lines,...read('VOICE-PROVENANCE-20261112.json').lines,...read('NPC-DIALOGUE-20261112.json').lines,...read('VOICE-PROVENANCE-20261117.json').lines];
 const filled=new Set(fill.lines.map(line=>line.key));
 assert.equal(voiceLines.length,new Set(voiceLines.map(line=>line.id)).size);
 // 2026-11-18: 모든 연결 음성은 ElevenLabs(el-*) 파일이다.
 for(const line of voiceLines){assert.match(line.src,/\/assets\/audio\/voices\/el-[\w-]+\.mp3$/,line.id);readFileSync(new URL('../public'+line.src,import.meta.url));}
 for(const line of fill.lines){
  const data=readFileSync(new URL('../'+line.file,import.meta.url));
  assert.equal(createHash('sha256').update(data).digest('hex'),line.sha256,line.key);
  const wired=voiceLines.find(x=>x.id===line.key);assert.equal(wired.text,line.text,line.key);assert.equal('public'+wired.src,line.file,line.key);
 }
 for(const line of older.filter(line=>!filled.has(line.id)&&voiceLines.some(x=>x.id===line.id&&x.src==='/'+String(line.target).replace(/^public\//,'')))){
  const data=readFileSync(new URL('../'+line.target,import.meta.url));
  assert.equal(createHash('sha256').update(data).digest('hex'),line.sha256,line.id);
 }
 for(const line of voiceLines)assert.equal(voiceForText('안내자 '+line.text)?.id,line.id,line.id);
});
