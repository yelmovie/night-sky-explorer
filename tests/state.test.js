import test from "node:test";
import assert from "node:assert/strict";
import {
  freshState,
  firstReady,
  stageReady,
  completeStage,
  canAccess,
  coreReady,
  restore,
  load,
  save,
  SAVE_KEY,
  completedCount,
  photoReady,
} from "../src/state.js";
import { planets, solarOrder, bodies, patternRegions } from "../src/data.js";

function studied() {
  const s = freshState();
  Object.assign(s.drafts.moon, {
    photos: [
      { x: 0, y: 0, zoom: 1.6, focus: 72 },
      { x: 0, y: 0, zoom: 2.2, focus: 72 },
    ],
    comparisons: [0, 1].map(() => ({
      spots: [{ x: 28, y: 28 }, { x: 65, y: 30 }],
      observation: "밝은 부분과 둥근 구덩이가 보여.",
    })),
  });
  Object.assign(s.drafts.phases, {
    captures: [3, 7, 10, 17, 21, 27],
    predictions: Object.fromEntries([14, 24].map((day) => [day, {
      amount: day === 14 ? 99 : 35,
      side: day === 14 ? "right" : "left",
      original: { amount: 40, side: "right" },
      revealed: true,
      overlay: true,
      reflection: "관측과 예상의 밝은 부분을 비교했어.",
    }])),
  });
  for (const p of planets)
    s.drafts.planets.records[p.id] = { feature: p.feature, candidate: p.id };
  s.drafts.planets.order = [...solarOrder];
  s.drafts.planets.groups = Object.fromEntries(planets.map((p) => [p.id, p.group]));
  s.drafts.classification.viewed = bodies.map((b) => b.id);
  s.drafts.classification.answers = Object.fromEntries(
    bodies.map((b) => [b.id, { kind: b.kind, reason: b.evidence }]),
  );
  Object.assign(s.drafts.pattern, {
    observed: ["Caph", "Schedar", "Segin", "Dubhe", "Merak", "Alioth"],
    cases: Object.fromEntries(Object.entries(patternRegions).map(([id, r]) => [id, {
      lines: [[r.stars[0], r.stars[2]], [r.stars[0], r.stars[3]]],
      original: [[r.stars[0], r.stars[2]], [r.stars[0], r.stars[3]]],
      compared: true,
      showReference: true,
      reflection: "기준과 다른 선으로 같은 별을 이었어.",
    }])),
  });
  return s;
}
test("처음에는 1A만 열리고 모든 B·코어·결과는 잠긴다", () => {
  const s = freshState();
  assert.equal(canAccess(s, "s1a"), true);
  for (const scene of ["s1b", "s2a", "s3b", "core", "results", "unknown"])
    assert.equal(canAccess(s, scene), false);
});
test("초점·중심·배율을 함께 맞춰야 촬영할 수 있다", () => {
  assert.equal(photoReady({ x: 0, y: 0, zoom: 1.6, focus: 72 }), true);
  for (const m of [
    { x: 50, y: 0, zoom: 1.6, focus: 72 },
    { x: 0, y: 0, zoom: 1, focus: 72 },
    { x: 0, y: 0, zoom: 1.6, focus: 20 },
  ])
    assert.equal(photoReady(m), false);
});
test("화면 B 접근과 장 완료는 서로 다른 조건이다", () => {
  const s = studied();
  s.drafts.moon.comparisons[1].observation = "";
  assert.equal(firstReady(s, 1), true);
  assert.equal(canAccess(s, "s1b"), true);
  assert.equal(completeStage(s, 1), false);
  s.drafts.moon.comparisons[1].observation = "표면에 구덩이가 보여.";
  assert.equal(completeStage(s, 1), true);
  assert.equal(canAccess(s, "s2a"), true);
});
test("같은 시점 반복 기록은 여섯 시점 관찰로 세지 않는다", () => {
  const s = freshState();
  s.drafts.phases.captures = [3, 3, 3];
  assert.equal(firstReady(s, 2), false);
});
test("행성의 이름만 맞아도 관찰 근거가 다르면 완료할 수 없다", () => {
  const s = studied();
  s.drafts.planets.records.mars.feature = "넓고 뚜렷한 고리";
  assert.equal(firstReady(s, 3), false);
  assert.equal(stageReady(s, 3), false);
});
test("태양과 8행성 순서가 맞아야 기록을 완성한다", () => {
  const s = studied();
  [s.drafts.planets.order[1], s.drafts.planets.order[2]] = [
    s.drafts.planets.order[2],
    s.drafts.planets.order[1],
  ];
  assert.equal(stageReady(s, 3), false);
  s.drafts.planets.order = [...solarOrder];
  assert.equal(stageReady(s, 3), true);
});
test("분류만 맞고 밝기 근거를 고른 경우 완료되지 않는다", () => {
  const s = studied();
  s.drafts.classification.answers.venus.reason = "bright";
  assert.equal(stageReady(s, 4), false);
  s.drafts.classification.answers.venus.reason = "reflect";
  assert.equal(stageReady(s, 4), true);
});
test("자유 패턴은 기준선 일치가 아니라 비교와 설명으로 완료한다", () => {
  const s = studied();
  assert.equal(stageReady(s, 5), true);
  s.drafts.pattern.cases.dipper.compared = false;
  assert.equal(stageReady(s, 5), false);
});
test("관리자 전체 해금은 실제 완료와 코어 조건을 우회하지 않는다", () => {
  const s = freshState();
  s.settings.adminUnlock = true;
  for (const scene of ["s1b", "s5a", "s5b", "core", "results"])
    assert.equal(canAccess(s, scene), true);
  assert.equal(completedCount(s), 0);
  assert.equal(coreReady(s), false);
  assert.equal(completeStage(s, 5), false);
  s.settings.adminUnlock = false;
  assert.equal(canAccess(s, "s5b"), false);
});
test("완료 증거는 재탐구 중 초안 변경과 분리된다", () => {
  const s = studied();
  completeStage(s, 1);
  s.drafts.moon.comparisons[0].observation = "수정 중";
  s.drafts.moon.comparisons[0].spots.pop();
  assert.equal(s.evidence[1].data.comparisons[0].spots.length, 2);
  assert.notEqual(s.evidence[1].data.comparisons[0].observation, s.drafts.moon.comparisons[0].observation);
});
test("다섯 실제 기록·정확한 연결·보정을 모두 해야 코어가 복구된다", () => {
  const s = studied();
  [1, 2, 3, 4, 5].forEach((n) => completeStage(s, n));
  s.core.connections = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 };
  assert.equal(coreReady(s), false);
  s.core.angle = 180;
  assert.equal(coreReady(s), true);
  s.core.connections[1] = 2;
  assert.equal(coreReady(s), false);
});
test("실제 전체 완료·설정·개인 기록을 저장하고 복원한다", () => {
  const s = studied();
  s.name = "테스트 연구원";
  s.settings.muted = true;
  [1, 2, 3, 4, 5].forEach((n) => completeStage(s, n));
  s.core = {
    connections: { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 },
    angle: 180,
    restored: true,
  };
  s.scene = "results";
  s.resume = "results";
  let value;
  const storage = {
    setItem(k, v) {
      value = v;
    },
    getItem() {
      return value;
    },
  };
  assert.equal(save(storage, s), true);
  const restored = load(storage).state;
  assert.equal(restored.scene, "results");
  assert.equal(restored.core.restored, true);
  assert.equal(completedCount(restored), 5);
  assert.deepEqual(restored.evidence, s.evidence);
  assert.equal(restored.settings.muted, true);
});
test("손상 JSON은 가능한 원본을 보관하고 앱을 열 수 있다", () => {
  const m = new Map([[SAVE_KEY, "{broken"]]);
  const storage = { getItem: (k) => m.get(k), setItem: (k, v) => m.set(k, v) };
  const out = load(storage);
  assert.ok(out.warning);
  assert.equal(m.get(SAVE_KEY + ":recovery"), "{broken");
  assert.equal(out.state.scene, "home");
});
test("범위 밖 설정·저장값과 조작된 완료 상태를 복구한다", () => {
  const raw = freshState();
  raw.drafts.moon.zoom = 1000;
  raw.drafts.phases.captures = [-1, 3, 3, 70, "7"];
  raw.evidence = { 1: { data: {}, date: "invalid" } };
  raw.core.restored = true;
  raw.scene = "results";
  raw.drafts.planets.records = JSON.parse('{"__proto__":{"polluted":true}}');
  const s = restore(raw);
  assert.equal(s.drafts.moon.zoom, 3);
  assert.deepEqual(s.drafts.phases.captures, [3]);
  assert.equal(s.core.restored, false);
  assert.equal(s.scene, "map");
  assert.equal({}.polluted, undefined);
});
test("브라우저 저장 금지에서도 상태 저장 실패를 반환한다", () => {
  assert.equal(
    save(
      {
        setItem() {
          throw Error("quota");
        },
      },
      freshState(),
    ),
    false,
  );
  const result = load({
    getItem() {
      throw Error("blocked");
    },
  });
  assert.equal(result.state.scene, "home");
  assert.ok(result.warning);
});
test("손상된 사전 항목을 정리하고 나머지 유효한 증거는 유지한다", () => {
  const raw = studied();
  raw.drafts.planets.records.invalid = null;
  completeStage(raw, 3);
  raw.core.connections = { 1: 99, 2: "2", constructor: 1 };
  const s = restore(raw);
  assert.ok(s.evidence[3]);
  assert.equal(s.evidence[3].data.records.invalid, undefined);
  assert.deepEqual(s.core.connections, { 2: 2 });
  raw.drafts.classification.answers = [null];
  assert.doesNotThrow(() => restore(raw));
});
