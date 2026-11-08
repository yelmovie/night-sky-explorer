import test from 'node:test';
import assert from 'node:assert/strict';
import { lessonViewport } from '../src/stage-viewport.js';

test('실험판과 조작은 작은 가로·세로 화면에서도 전체 뷰포트 안에 들어간다', () => {
  for (const [w, h] of [[1920,1080],[1280,800],[1024,600],[873,412],[740,360],[800,270],[360,740],[320,568],[768,1024]]) {
    const fit = lessonViewport(w, h);
    assert.ok(Math.abs(fit.width * fit.scale - w) < .001);
    assert.ok(Math.abs(fit.height * fit.scale - h) < .001);
    assert.ok(fit.scale > 0 && fit.scale <= 1);
    assert.ok(fit.height >= (fit.layout === 'portrait' ? 740 : 480));
    assert.ok(fit.width >= (fit.layout === 'portrait' ? 360 : 960));
  }
});

test('태블릿과 큰 화면은 사용 가능한 화면 전체를 원래 크기로 사용한다', () => {
  assert.deepEqual(lessonViewport(1024,600), {width:1024,height:600,scale:1,layout:'wide'});
  assert.deepEqual(lessonViewport(360,740), {width:360,height:740,scale:1,layout:'portrait'});
});
