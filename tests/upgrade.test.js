import test from "node:test";
import assert from "node:assert/strict";
import { freshState, firstReady, stageReady, completeStage, completedCount, restore, save, load, canAccess, coreReady, SAVE_KEY } from "../src/state.js";
import { planets, solarOrder, bodies, patternRegions } from "../src/data.js";

const photo = (zoom) => ({ x: 0, y: 0, zoom, focus: 72 });
const comparison = () => ({ spots: [{ x: 25, y: 25 }, { x: 70, y: 35 }], observation: "둥근 구덩이와 밝은 부분이 보여." });
const prediction = (side) => ({ amount: 40, side, original: { amount: 40, side }, revealed: true, overlay: true, reflection: "처음 예상과 실제 밝은 부분을 비교했어." });

function legacySave() {
  const drafts = {
    moon: { x: 1, y: -1, zoom: 1.6, focus: 72, photo: photo(1.6), ...comparison() },
    phases: { day: 10, captures: [3, 7, 10], ...prediction("right"), overlay: false },
    planets: {
      selected: "mars", records: Object.fromEntries(planets.filter((p) => ["mars", "jupiter", "saturn"].includes(p.id))
        .map((p) => [p.id, { candidate: p.id, feature: p.feature }])),
      order: [...solarOrder], feature: "", candidate: "",
    },
    classification: {
      viewed: ["sun", "sirius", "venus", "jupiter"],
      answers: Object.fromEntries(bodies.filter((b) => ["sun", "sirius", "venus", "jupiter"].includes(b.id))
        .map((b) => [b.id, { kind: b.kind, reason: b.evidence }])),
    },
    pattern: {
      observed: ["Caph", "Dubhe", "Polaris"],
      lines: [["Caph", "Segin"], ["Dubhe", "Polaris"]],
      original: [["Caph", "Segin"], ["Dubhe", "Polaris"]],
      compared: true, showReference: true, reflection: "기준과 다르게 별을 이어도 배열은 같았어.",
    },
  };
  return {
    version: 1, name: "이전 연구원", scene: "results", resume: "results", started: true,
    settings: { muted: true, reducedMotion: true, adminUnlock: false }, visited: [1, 2, 3, 4, 5], drafts,
    evidence: Object.fromEntries(Object.entries(drafts).map(([key, data], i) => [i + 1, { data: structuredClone(data), date: "2026-10-15T01:00:00.000Z" }])),
    core: { connections: { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 }, angle: 180, restored: true },
  };
}

test("v2는 기존 저장키를 유지하고 BGM·효과음·음량 기본값을 제공한다", () => {
  const s = freshState();
  assert.equal(s.version, 2);
  assert.equal(SAVE_KEY, "starlight-lab:v1");
  assert.deepEqual(s.settings, { muted: false, reducedMotion: false, adminUnlock: false, bgm: true, sfx: true, bgmVolume: 25 });
  assert.notEqual(s.drafts.phases.predictions[14], s.drafts.phases.predictions[24]);
  assert.notEqual(s.drafts.pattern.cases.cassiopeia, s.drafts.pattern.cases.dipper);
});

test("달은 다른 배율 사진 두 장과 두 비교 카드 모두가 필요하다", () => {
  const s = freshState();
  s.drafts.moon.photos = [photo(1.6), photo(1.6)];
  assert.equal(firstReady(s, 1), false);
  s.drafts.moon.photos[1] = photo(2.2);
  assert.equal(firstReady(s, 1), true);
  s.drafts.moon.comparisons[0] = comparison();
  assert.equal(stageReady(s, 1), false);
  s.drafts.moon.comparisons[1] = comparison();
  assert.equal(stageReady(s, 1), true);
  s.drafts.moon.comparisons[1].spots = [{ x: 25, y: 25 }, { x: 25, y: 25 }];
  assert.equal(stageReady(s, 1), false);
});

test("달 변화는 여섯 서로 다른 시점과 전반·후반의 관찰을 요구한다", () => {
  const s = freshState();
  for (const days of [[1, 2, 3, 4, 5, 5], [1, 2, 3, 4, 5, 6], [15, 16, 17, 18, 19, 20]]) {
    s.drafts.phases.captures = days;
    assert.equal(firstReady(s, 2), false);
  }
  s.drafts.phases.captures = [1, 4, 8, 16, 20, 27];
  assert.equal(firstReady(s, 2), true);
  s.drafts.phases.predictions[14] = prediction("right");
  assert.equal(stageReady(s, 2), false);
  s.drafts.phases.predictions[24] = prediction("left");
  assert.equal(stageReady(s, 2), true);
  s.drafts.phases.predictions[24].overlay = false;
  assert.equal(stageReady(s, 2), false);
});

test("행성 여섯 조사와 순서 아홉 칸과 모든 행성의 묶기가 필요하다", () => {
  const s = freshState();
  for (const p of planets.filter((p) => ["mars", "jupiter", "saturn"].includes(p.id)))
    s.drafts.planets.records[p.id] = { candidate: p.id, feature: p.feature };
  assert.equal(firstReady(s, 3), false);
  for (const p of planets) s.drafts.planets.records[p.id] = { candidate: p.id, feature: p.feature };
  assert.equal(firstReady(s, 3), true);
  s.drafts.planets.order = [...solarOrder];
  assert.equal(stageReady(s, 3), false);
  s.drafts.planets.groups = Object.fromEntries(planets.map((p) => [p.id, p.group]));
  assert.equal(stageReady(s, 3), true);
  s.drafts.planets.groups.venus = "gas";
  assert.equal(stageReady(s, 3), false);
});

test("여덟 천체를 관찰하고 각각 주장과 빛근원 근거를 연결한다", () => {
  const s = freshState();
  s.drafts.classification.viewed = bodies.slice(0, 4).map((b) => b.id);
  assert.equal(firstReady(s, 4), false);
  s.drafts.classification.viewed = bodies.map((b) => b.id);
  s.drafts.classification.answers = Object.fromEntries(bodies.map((b) => [b.id, { kind: b.kind, reason: b.evidence }]));
  assert.equal(stageReady(s, 4), true);
  s.drafts.classification.answers.vega.reason = "color";
  assert.equal(stageReady(s, 4), false);
});

test("별배열은 영역별 관찰과 서로 다른 자유 패턴 두 개를 평가한다", () => {
  const s = freshState();
  s.drafts.pattern.observed = [...patternRegions.cassiopeia.stars, "Dubhe"];
  assert.equal(firstReady(s, 5), false);
  s.drafts.pattern.observed = ["Caph", "Schedar", "Cih", "Dubhe", "Merak", "Phecda"];
  assert.equal(firstReady(s, 5), true);
  for (const [id, r] of Object.entries(patternRegions)) s.drafts.pattern.cases[id] = {
    lines: [[r.stars[0], r.stars[3]], [r.stars[1], r.stars[4]]],
    original: [[r.stars[0], r.stars[3]], [r.stars[1], r.stars[4]]],
    compared: true, showReference: true, reflection: "다르게 이어도 별의 배열은 그대로야.",
  };
  assert.equal(stageReady(s, 5), true);
  s.drafts.pattern.cases.dipper.lines = [["Dubhe", "Merak"], ["Merak", "Dubhe"]];
  assert.equal(stageReady(s, 5), false);
});

test("v1 완료·기록·설정은 손실 없이 이전되고 추가 활동을 조작하지 않는다", () => {
  const old = legacySave(), s = restore(old);
  assert.equal(s.version, 2);
  assert.equal(s.name, old.name);
  assert.equal(s.scene, "results");
  assert.equal(s.core.restored, true);
  assert.equal(coreReady(s), true);
  assert.equal(completedCount(s), 5);
  assert.deepEqual(s.legacyV1.drafts, old.drafts);
  for (const n of [1, 2, 3, 4, 5]) {
    assert.deepEqual(s.evidence[n].data, old.evidence[n].data);
    assert.equal(s.evidence[n].grandfathered, true);
    assert.equal(s.evidence[n].schemaVersion, 1);
    assert.equal(stageReady(s, n), false);
  }
  assert.equal(s.drafts.moon.photos.length, 1);
  assert.equal(s.drafts.phases.predictions[14].reflection, old.drafts.phases.reflection);
  assert.equal(s.drafts.phases.predictions[24].original, null);
  assert.equal(s.drafts.moon.comparisons[1].observation, "");
  assert.equal(s.settings.muted, true);
  assert.equal(s.settings.reducedMotion, true);
  assert.equal(s.settings.bgmVolume, 25);
});

test("v1 미완료 초안과 오답은 보관하고 완료 증거를 새로 만들지 않는다", () => {
  const old = legacySave();
  old.evidence = {};
  old.drafts.planets.records.mars.candidate = "earth";
  const s = restore(old);
  assert.equal(completedCount(s), 0);
  assert.equal(s.core.restored, false);
  assert.equal(s.drafts.planets.records.mars.candidate, "earth");
  assert.deepEqual(s.legacyV1.drafts, old.drafts);
  assert.equal(canAccess(s, "s2a"), false);
});

test("v1에서 이미 인정한 중복 표식·연결선 완료도 새 기준으로 취소하지 않는다", () => {
  const old = legacySave();
  old.evidence[1].data.spots[1] = { ...old.evidence[1].data.spots[0] };
  old.evidence[5].data.lines[1] = [...old.evidence[5].data.lines[0]];
  old.evidence[5].data.original[1] = [...old.evidence[5].data.original[0]];
  const s = restore(old);
  assert.equal(completedCount(s), 5);
  assert.deepEqual(s.evidence[1].data, old.evidence[1].data);
  assert.deepEqual(s.evidence[5].data, old.evidence[5].data);
});

test("이전된 v1 기록은 같은 키로 다시 저장한 뒤에도 보존된다", () => {
  const old = legacySave(), state = restore(old), values = new Map();
  const storage = { getItem: (k) => values.get(k), setItem: (k, v) => values.set(k, v) };
  assert.equal(save(storage, state), true);
  const again = load(storage);
  assert.equal(again.warning, "");
  assert.deepEqual(again.state.evidence, state.evidence);
  assert.deepEqual(again.state.legacyV1, state.legacyV1);
  assert.equal(again.state.core.restored, true);
});

test("관리자 해금·선택 도전은 실제 관찰이나 인증서 조건을 대신하지 않는다", () => {
  const s = freshState();
  s.settings.adminUnlock = true;
  for (const n of [1, 2, 3, 4, 5]) s.challengeAnswers[n] = "correct";
  assert.equal(canAccess(s, "s5b"), true);
  for (const n of [1, 2, 3, 4, 5]) assert.equal(completeStage(s, n), false);
  assert.equal(coreReady(s), false);
  assert.deepEqual(s.evidence, {});
});

test("완료 스냅샷은 두번째 과제와 선택 도전의 수정에도 변하지 않는다", () => {
  const s = freshState();
  s.drafts.moon.photos = [photo(1.6), photo(2.2)];
  s.drafts.moon.comparisons = [comparison(), comparison()];
  s.challengeAnswers[1] = "근거를 비교했어";
  assert.equal(completeStage(s, 1), true);
  s.drafts.moon.comparisons[1].observation = "수정 중";
  s.challengeAnswers[1] = "";
  assert.notEqual(s.evidence[1].data.comparisons[1].observation, "수정 중");
  assert.equal(s.evidence[1].challengeAnswer, "근거를 비교했어");
  assert.equal(s.evidence[1].schemaVersion, 2);
});

test("손상된 새 스키마의 중첩 배열·사전도 안전한 초안으로 복원한다", () => {
  const raw = freshState();
  raw.drafts.moon.comparisons = [null];
  raw.drafts.pattern.cases = { cassiopeia: null, dipper: { lines: [null, ["Dubhe", "not-a-star"]] } };
  raw.drafts.phases.predictions = { 14: { original: { amount: "bad", side: "up" } } };
  raw.drafts.planets.groups = JSON.parse('{"__proto__":{"polluted":true},"mars":"wrong"}');
  raw.settings.bgmVolume = 200;
  assert.doesNotThrow(() => restore(raw));
  const s = restore(raw);
  assert.equal(s.drafts.moon.comparisons.length, 2);
  assert.equal(s.drafts.phases.predictions[14].original, null);
  assert.deepEqual(s.drafts.pattern.cases.dipper.lines, []);
  assert.equal(s.settings.bgmVolume, 100);
  assert.equal({}.polluted, undefined);
});

test("읽을 수 없는 스키마도 자동저장 전에 복구 원본과 경고를 남긴다", () => {
  for (const raw of [null, [], 42, { version: 99, name: "미래 기록" }]) {
    const value = JSON.stringify(raw), values = new Map([[SAVE_KEY, value]]);
    const storage = { getItem: (key) => values.get(key), setItem: (key, data) => values.set(key, data) };
    const result = load(storage);
    assert.ok(result.warning);
    assert.equal(values.get(`${SAVE_KEY}:recovery`), value);
    assert.equal(result.state.version, 2);
    assert.equal(result.state.scene, "home");
  }
});
