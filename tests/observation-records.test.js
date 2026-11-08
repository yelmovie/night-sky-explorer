import test from 'node:test';
import assert from 'node:assert/strict';
import { representativeDays, recordCountLabel } from '../src/observation-records.js';
test('일곱 번 이상 관측해도 앞부분 달과 뒷부분 달을 함께 보여 준다', () => {
  const days = [29, 3, 7, 10, 14, 17, 21, 25]; const original = [...days];
  const shown = representativeDays(days);
  assert.equal(shown.length, 6); assert.equal(shown[0], 3); assert.equal(shown.at(-1), 29);
  assert.ok(shown.some(day => day < 15)); assert.ok(shown.some(day => day >= 15));
  assert.deepEqual(days, original);
});
test('기록은 날짜순으로 중복 없이 표시하고 빈 기록도 안전하다', () => {
  assert.deepEqual(representativeDays([7, 3, 7]), [3, 7]);
  assert.deepEqual(representativeDays([]), []);
  assert.equal(recordCountLabel([3, 7, 7]), '관측 기록 2개 보기');
});
