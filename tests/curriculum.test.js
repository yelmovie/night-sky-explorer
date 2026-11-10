import test from 'node:test';
import assert from 'node:assert/strict';
import { standards, curriculumSource } from '../src/curriculum.js';
import { chapters } from '../src/data.js';
test('curriculum preserves verified codes, wording, source and pending teacher review',()=>{
  assert.equal(standards.length,3);
  assert.equal(new Set(standards.map(s=>s[0])).size,3);
  assert.ok(standards.every(([code,text])=>/^\[4과\d{2}-0[1-3]\]$/.test(code)&&text.endsWith('수 있다.')));
  assert.match(curriculumSource.url,/https:\/\/www\.moe\.go\.kr\//);
  assert.equal(curriculumSource.needsReview,true);
  assert.equal(curriculumSource.reviewer,null);
});
test('five chapters each connect evidence, misconception and assessment boundary',()=>{
  assert.equal(chapters.length,5);
  for(const c of chapters){
    const l=c.learning;assert.equal(l.chapter,c.id);
    assert.ok(l.standardCodes.every(code=>standards.some(s=>s[0]===code)));
    for(const field of ['objective','evidence','misconception','boundary'])assert.ok(l[field].length>15,field);
    assert.equal(l.needsReview,true);assert.equal(l.reviewer,null);
  }
});
