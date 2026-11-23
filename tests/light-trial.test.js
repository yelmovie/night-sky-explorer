import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLightTrial, lightTrialReady, predictLight, observeLight } from '../src/light-trial.js';
import { freshState, firstReady, completeStage, restore } from '../src/state.js';
import { bodies } from '../src/data.js';
import { completedState } from '../scripts/shot-fixture.mjs';

test('새 학생은 예상 후 가림·치움을 모두 관찰해야 4장 다음 활동이 열린다',()=>{
  const s=freshState(), trial=s.drafts.classification.lightTrial;
  s.drafts.classification.viewed=bodies.map(b=>b.id);
  assert.equal(firstReady(s,4),false);
  assert.equal(observeLight(trial,true),false);
  assert.equal(predictLight(trial,'same'),true);
  observeLight(trial,true);observeLight(trial,true);
  assert.deepEqual(trial.observations,['covered']);
  assert.equal(firstReady(s,4),false);
  assert.equal(predictLight(trial,'darker'),false,'첫 관측 뒤 처음 예상은 바꾸지 않는다');
  observeLight(trial,false);observeLight(trial,false);
  assert.equal(trial.prediction,'same');
  assert.deepEqual(trial.observations,['covered','uncovered']);
  assert.equal(firstReady(s,4),true);
  assert.equal(completeStage(s,4),false,'관측만으로 천체 판별을 생략하지 않는다');
  s.drafts.classification.answers=Object.fromEntries(bodies.map(b=>[b.id,{kind:b.kind,reason:b.evidence}]));
  assert.equal(completeStage(s,4),true);
  assert.deepEqual(s.evidence[4].data.lightTrial,trial);
  assert.deepEqual(restore(s).evidence[4].data.lightTrial,trial);
});

test('첫 가림 관측·예상은 새로고침해도 유지하고 아직 치움 완료로 세지 않는다',()=>{
  const s=freshState(),trial=s.drafts.classification.lightTrial;
  predictLight(trial,'darker');observeLight(trial,true);
  const restored=restore(s).drafts.classification.lightTrial;
  assert.deepEqual(restored,{prediction:'darker',observations:['covered'],blocked:true});
});

test('이전 버전의 실제 4장 기록·코어·인증서 자격은 가림판 관측을 만들어내지 않고 보존한다',()=>{
  const old=completedState(5);delete old.drafts.classification.lightTrial;delete old.evidence[4].data.lightTrial;
  Object.assign(old.core,{connections:{1:1,2:2,3:3,4:4,5:5},angle:180,restored:true});
  old.scene='results';old.resume='results';
  const restored=restore(old);
  assert.equal(restored.drafts.classification.lightTrial,null);
  assert.equal(restored.evidence[4].data.lightTrial,null);
  assert.equal(restored.evidence[4].date,old.evidence[4].date);
  assert.equal(restored.scene,'results');assert.equal(restored.core.restored,true);
});

test('잘못된 관측 목록·예상으로 새 실험을 완료 처리하지 않는다',()=>{
  for(const raw of [undefined,'yes',{prediction:'other',observations:['covered','uncovered']},{prediction:'same',observations:'uncovered'}])
    assert.equal(lightTrialReady(normalizeLightTrial(raw)),false);
  assert.deepEqual(normalizeLightTrial({prediction:'same',observations:['uncovered'],blocked:true}),{prediction:'same',observations:[],blocked:false});
});
