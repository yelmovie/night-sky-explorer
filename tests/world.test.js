import test from 'node:test';
import assert from 'node:assert/strict';
import { freshState } from '../src/state.js';
import { worldMarkup } from '../src/world.js';
import { nodes, edges, siteNodes, routeBetween, nearestEdgePoint, returnPosition, doorAt } from '../src/world-path.js';

test('지도 방향 버튼은 받침에 맞는 이동 안내를 읽어 준다', () => {
  const markup = worldMarkup(freshState());
  for (const direction of ['위로', '왼쪽으로', '아래로', '오른쪽으로']) {
    assert.ok(markup.includes(`aria-label="지도 ${direction}"`));
  }
});

test('출발점과 모든 시설 문 사이에 실제 길 간선으로 이어지는 왕복 경로가 있다', () => {
  for (const site of siteNodes) {
    const path = routeBetween('spawn', site);
    assert.equal(path[0], 'spawn');
    assert.equal(path.at(-1), site);
    for (let i = 1; i < path.length; i++)
      assert.ok(edges.some(([a, b]) => a === path[i - 1] && b === path[i] || b === path[i - 1] && a === path[i]));
    assert.deepEqual(routeBetween(site, 'spawn'), path.toReversed());
  }
  assert.deepEqual(routeBetween('invalid', 'invalid'), []);
});

test('시설에서 나오면 길 위이면서 문 자동 재입장 반경 밖에 선다', () => {
  for (const [site, id] of siteNodes.entries()) {
    const position = returnPosition(site);
    assert.ok(nearestEdgePoint(position).dist < .001, id);
    assert.equal(doorAt(position), -1, id);
    assert.equal(doorAt({ x: nodes[id][0], y: nodes[id][1] }), site);
    assert.ok(Math.hypot(position.x - nodes[id][0], position.y - nodes[id][1]) < 45);
  }
  assert.deepEqual(returnPosition(null), { x: nodes.spawn[0], y: nodes.spawn[1] });
});

test('모든 길의 중간점은 보행 영역으로 다시 투영할 때 위치가 바뀌지 않는다', () => {
  for (const [a, b] of edges) {
    const point = { x: (nodes[a][0] + nodes[b][0]) / 2, y: (nodes[a][1] + nodes[b][1]) / 2 };
    const nearest = nearestEdgePoint(point);
    assert.ok(nearest.dist < .001);
    assert.ok(Math.hypot(point.x - nearest.x, point.y - nearest.y) < .001);
  }
});
