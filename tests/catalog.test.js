import test from "node:test";
import assert from "node:assert/strict";
import stars from "../src/stars.json" with { type: "json" };
import { starNames, referenceLines, planets, requiredPlanets, bodies, patternRegions } from "../src/data.js";
test("13개의 별 좌표에 한국어 이름과 고유 HIP 식별자가 있다", () => {
  assert.equal(stars.length, 13);
  assert.equal(new Set(stars.map((s) => s.hip)).size, 13);
  for (const s of stars) {
    assert.ok(starNames[s.id], s.id);
    assert.ok(s.ra >= 0 && s.ra < 24);
    assert.ok(s.dec > 45 && s.dec <= 90);
  }
});
test("모든 기준 연결선은 실제 카탈로그 별 두 개를 연결한다", () => {
  for (const l of referenceLines) {
    assert.equal(l.length, 2);
    assert.notEqual(l[0], l[1]);
    for (const id of l)
      assert.ok(
        stars.some((s) => s.id === id),
        id,
      );
  }
});
test("북극성 좌표는 북천극 가까이에 있다", () => {
  const s = stars.find((s) => s.id === "Polaris");
  assert.equal(s.hip, 11767);
  assert.ok(s.dec > 89);
});
test("필수 여섯 행성과 여덟 행성 묶기 자료가 빠짐없이 있다", () => {
  assert.deepEqual(requiredPlanets, ["mercury", "venus", "earth", "mars", "jupiter", "saturn"]);
  assert.equal(planets.filter((p) => p.group === "rock").length, 4);
  assert.equal(planets.filter((p) => p.group === "gas").length, 2);
  assert.equal(planets.filter((p) => p.group === "ice").length, 2);
  assert.equal(new Set(planets.map((p) => p.id)).size, 8);
});
test("별 네 개와 행성 네 개의 분류는 밝기가 아닌 빛의 근원에 연결된다", () => {
  assert.equal(bodies.length, 8);
  assert.equal(new Set(bodies.map((b) => b.id)).size, 8);
  assert.equal(bodies.filter((b) => b.kind === "star").length, 4);
  assert.equal(bodies.filter((b) => b.kind === "planet").length, 4);
  for (const b of bodies) assert.equal(b.evidence, b.kind === "star" ? "own" : "reflect");
});
test("두 별배열 영역은 서로 겹치지 않는 카탈로그 별을 사용한다", () => {
  const regionStars = Object.values(patternRegions).flatMap((r) => r.stars);
  assert.equal(regionStars.length, 12);
  assert.equal(new Set(regionStars).size, 12);
  for (const id of regionStars) assert.ok(stars.some((s) => s.id === id), id);
});
