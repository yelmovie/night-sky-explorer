import test from 'node:test';
import assert from 'node:assert/strict';
import { nearestStar } from '../src/star-hit.js';
test('겹친 48px 별 터치 영역에서도 가까운 별을 고른다', () => {
  const stars=[{id:'Cih',x:459,y:182,radius:24},{id:'Ruchbah',x:482,y:187,radius:24}];
  assert.equal(nearestStar(stars,459,182),'Cih');
  assert.equal(nearestStar(stars,482,187),'Ruchbah');
  assert.equal(nearestStar([...stars].reverse(),459,182),'Cih');
  assert.equal(nearestStar(stars,460,183),'Cih');
  assert.equal(nearestStar(stars,800,400),null);
});
