import { solarOrder, requiredPlanets, planets, bodies, patternRegions, starNames } from "./data.js";

// Keep the existing key so an upgrade never starts a second, empty research log.
export const SAVE_KEY = "starlight-lab:v1";
const stageKeys = ["", "moon", "phases", "planets", "classification", "pattern"];
const stageIds = [1, 2, 3, 4, 5];
const predictionDays = [14, 24];
const legacyBodyIds = ["sun", "sirius", "venus", "jupiter"];
const legacyPlanetIds = ["mars", "jupiter", "saturn"];
const prediction = (side = "right") => ({
  amount: 35, side, original: null, revealed: false, overlay: false, reflection: "",
});
const patternCase = () => ({
  lines: [], original: null, compared: false, showReference: false, reflection: "",
});

export const scenes = [
  "home", "map",
  ...stageIds.flatMap((n) => [`s${n}a`, `s${n}b`]),
  "core", "results",
];
export function freshState() {
  return {
    version: 2,
    name: "별빛 연구원",
    scene: "home",
    resume: "map",
    started: false,
    settings: {
      muted: false, reducedMotion: false, adminUnlock: false,
      bgm: true, sfx: true, bgmVolume: 25,
    },
    visited: [],
    drafts: {
      moon: {
        x: 30, y: -20, zoom: 1, focus: 30,
        photos: [],
        comparisons: [{ spots: [], observation: "" }, { spots: [], observation: "" }],
      },
      phases: { day: 3, captures: [], predictions: { 14: prediction(), 24: prediction("left") } },
      planets: {
        selected: "mars", records: {}, feature: "", candidate: "",
        order: Array(9).fill(null), groups: {},
      },
      classification: { viewed: [], answers: {} },
      pattern: {
        activeCase: "cassiopeia", observed: [],
        cases: { cassiopeia: patternCase(), dipper: patternCase() },
      },
    },
    challengeAnswers: { 1: "", 2: "", 3: "", 4: "", 5: "" },
    evidence: {},
    core: { connections: {}, angle: 15, restored: false },
    legacyV1: null,
    updatedAt: null,
  };
}
export const clone = (value) => structuredClone(value);
export function completedCount(s) {
  return stageIds.filter((n) => !!s.evidence[n]).length;
}
export function stageOpen(s, n) {
  return stageIds.includes(n) && (s.settings.adminUnlock || n === 1 || !!s.evidence[n - 1]);
}
export function photoReady(m) {
  return !!m && ["x", "y", "zoom", "focus"].every((k) => Number.isFinite(m[k])) &&
    Math.abs(m.x) <= 12 && Math.abs(m.y) <= 12 &&
    m.zoom >= 1.3 && m.zoom <= 2.7 && Math.abs(m.focus - 72) <= 12;
}
const textReady = (v) => typeof v === "string" && v.trim().length >= 3;
const validCaptureDays = (values) => [...new Set(
  (Array.isArray(values) ? values : []).filter((v) => Number.isInteger(v) && v >= 0 && v <= 29),
)];
const observedStars = (values) => [...new Set(
  (Array.isArray(values) ? values : []).filter((id) => Object.hasOwn(starNames, id)),
)];
const validSpots = (spots) => {
  const unique = new Map();
  for (const p of Array.isArray(spots) ? spots : []) {
    if (p && Number.isFinite(p.x) && Number.isFinite(p.y) && Math.hypot(p.x - 50, p.y - 50) < 49)
      unique.set(`${p.x}:${p.y}`, { x: p.x, y: p.y });
  }
  return [...unique.values()].slice(-2);
};
const validLines = (lines, allowed = Object.keys(starNames)) => {
  const unique = new Map();
  for (const line of Array.isArray(lines) ? lines : []) {
    if (Array.isArray(line) && line.length === 2 && line[0] !== line[1] && line.every((id) => allowed.includes(id)))
      unique.set([...line].sort().join(":"), [...line]);
  }
  return [...unique.values()].slice(0, 30);
};
const recordReady = (p, record) => record?.candidate === p.id && record?.feature === p.feature;
export function firstReady(s, n) {
  const d = s.drafts;
  switch (n) {
    case 1: {
      const photos = d.moon.photos.filter(photoReady);
      return photos.length >= 2 && new Set(photos.map((p) => Math.round(p.zoom * 10))).size >= 2;
    }
    case 2: {
      const days = validCaptureDays(d.phases.captures);
      return days.length >= 6 && days.some((day) => day < 15) && days.some((day) => day >= 15);
    }
    case 3:
      return requiredPlanets.every((id) => recordReady(planets.find((p) => p.id === id), d.planets.records[id]));
    case 4:
      return bodies.every((b) => d.classification.viewed.includes(b.id));
    case 5: {
      const observed = observedStars(d.pattern.observed);
      const regionStars = Object.values(patternRegions).flatMap((r) => r.stars);
      return observed.filter((id) => regionStars.includes(id)).length >= 6 &&
        Object.values(patternRegions).every((r) => observed.filter((id) => r.stars.includes(id)).length >= 2);
    }
    default: return false;
  }
}
export function stageReady(s, n) {
  if (!firstReady(s, n)) return false;
  const d = s.drafts;
  switch (n) {
    case 1:
      return d.moon.comparisons.length >= 2 && d.moon.comparisons.slice(0, 2).every(
        (c) => validSpots(c.spots).length >= 2 && textReady(c.observation),
      );
    case 2:
      return predictionDays.every((day) => {
        const p = d.phases.predictions[day];
        return p && p.original && Number.isFinite(p.original.amount) && p.original.amount >= 0 && p.original.amount <= 100 &&
          ["left", "right"].includes(p.original.side) && p.revealed && p.overlay && textReady(p.reflection);
      });
    case 3:
      return solarOrder.every((id, i) => d.planets.order[i] === id) &&
        planets.every((p) => d.planets.groups[p.id] === p.group);
    case 4:
      return bodies.every((b) => d.classification.answers[b.id]?.kind === b.kind &&
        d.classification.answers[b.id]?.reason === b.evidence);
    case 5:
      return Object.entries(patternRegions).every(([id, r]) => {
        const c = d.pattern.cases[id];
        return c && validLines(c.original, r.stars).length >= 2 && validLines(c.lines, r.stars).length >= 2 &&
          c.compared && textReady(c.reflection);
      });
    default: return false;
  }
}
export function canAccess(s, scene) {
  if (!scenes.includes(scene)) return false;
  if (["home", "map"].includes(scene) || s.settings.adminUnlock) return true;
  if (scene === "core") return completedCount(s) === 5;
  if (scene === "results") return s.core.restored && completedCount(s) === 5;
  const n = Number(scene[1]);
  return stageOpen(s, n) && (scene.endsWith("a") || firstReady(s, n) || !!s.evidence[n]);
}
export function coreReady(s, core = s.core) {
  return completedCount(s) === 5 &&
    stageIds.every((n) => Number(core.connections[n]) === n) && Math.abs(core.angle - 180) <= 10;
}
export function completeStage(s, n) {
  if (!stageReady(s, n)) return false;
  s.evidence[n] = {
    data: clone(s.drafts[stageKeys[n]]),
    date: new Date().toISOString(),
    schemaVersion: 2,
    challengeAnswer: s.challengeAnswers[n] || "",
  };
  return true;
}

function safe(v, depth = 0) {
  if (depth > 12) return null;
  if (typeof v === "string") return v.slice(0, 600);
  if (Array.isArray(v)) return v.slice(0, 40).map((x) => safe(x, depth + 1));
  if (v && typeof v === "object")
    return Object.fromEntries(Object.entries(v)
      .filter(([k]) => !["__proto__", "prototype", "constructor"].includes(k))
      .slice(0, 40).map(([k, x]) => [k, safe(x, depth + 1)]));
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  return typeof v === "boolean" || v === null ? v : null;
}
function clean(template, raw, depth = 0) {
  if (depth > 12 || raw === undefined || raw === null) return clone(template);
  if (Array.isArray(template)) return Array.isArray(raw) ? safe(raw, depth + 1) : clone(template);
  if (template && typeof template === "object")
    return Object.fromEntries(Object.entries(template).map(([k, v]) => [k, clean(v, raw?.[k], depth + 1)]));
  if (typeof template === "string") return typeof raw === "string" ? raw.slice(0, 600) : template;
  if (typeof template === "number") return Number.isFinite(raw) ? raw : template;
  if (typeof template === "boolean") return typeof raw === "boolean" ? raw : template;
  return safe(raw, depth + 1);
}
const bounded = (v, lo, hi, fallback) => Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : fallback;
function normalizePrediction(raw, side) {
  const p = clean(prediction(side), raw);
  p.amount = bounded(p.amount, 0, 100, 35);
  p.side = p.side === "left" ? "left" : "right";
  if (p.original) {
    p.original = Number.isFinite(p.original.amount) && ["left", "right"].includes(p.original.side)
      ? { amount: bounded(p.original.amount, 0, 100, 35), side: p.original.side } : null;
  }
  return p;
}
function normalizeDrafts(s) {
  const d = s.drafts;
  for (const key of ["x", "y"]) d.moon[key] = bounded(d.moon[key], -80, 80, key === "x" ? 30 : -20);
  d.moon.zoom = bounded(d.moon.zoom, 1, 3, 1);
  d.moon.focus = bounded(d.moon.focus, 0, 100, 30);
  d.moon.photos = d.moon.photos.filter((p) => p && ["x", "y", "zoom", "focus"].every((k) => Number.isFinite(p[k]))).slice(0, 2);
  d.moon.comparisons = [0, 1].map((i) => {
    const c = d.moon.comparisons[i];
    return { spots: validSpots(c?.spots), observation: typeof c?.observation === "string" ? c.observation.slice(0, 600) : "" };
  });
  d.phases.day = Math.round(bounded(d.phases.day, 0, 29, 3));
  d.phases.captures = validCaptureDays(d.phases.captures);
  for (const day of predictionDays) d.phases.predictions[day] = normalizePrediction(d.phases.predictions[day], day === 24 ? "left" : "right");
  if (!planets.some((p) => p.id === d.planets.selected)) d.planets.selected = "mars";
  // Keep an unfinished choice as a draft. Completion validates the observed feature separately.
  d.planets.records = Object.fromEntries(planets.filter((p) => d.planets.records?.[p.id] && typeof d.planets.records[p.id] === "object")
    .map((p) => [p.id, {
      candidate: planets.some((x) => x.id === d.planets.records[p.id].candidate) ? d.planets.records[p.id].candidate : "",
      feature: typeof d.planets.records[p.id].feature === "string" ? d.planets.records[p.id].feature.slice(0, 600) : "",
    }]));
  d.planets.order = Array.from({ length: 9 }, (_, i) => solarOrder.includes(d.planets.order[i]) ? d.planets.order[i] : null);
  d.planets.groups = Object.fromEntries(planets.filter((p) => ["rock", "gas", "ice"].includes(d.planets.groups?.[p.id]))
    .map((p) => [p.id, d.planets.groups[p.id]]));
  d.classification.viewed = [...new Set(d.classification.viewed.filter((id) => bodies.some((b) => b.id === id)))];
  d.classification.answers = Object.fromEntries(bodies.map((b) => [b.id, {
    kind: ["star", "planet"].includes(d.classification.answers?.[b.id]?.kind) ? d.classification.answers[b.id].kind : "",
    reason: ["own", "reflect", "bright", "color"].includes(d.classification.answers?.[b.id]?.reason) ? d.classification.answers[b.id].reason : "",
  }]));
  d.pattern.observed = observedStars(d.pattern.observed);
  if (!Object.hasOwn(patternRegions, d.pattern.activeCase)) d.pattern.activeCase = "cassiopeia";
  for (const [id, r] of Object.entries(patternRegions)) {
    const c = clean(patternCase(), d.pattern.cases[id]);
    c.lines = validLines(c.lines, r.stars);
    c.original = c.original ? validLines(c.original, r.stars) : null;
    d.pattern.cases[id] = c;
  }
  return s;
}

// v1 had shorter activities. Validate against those original requirements, then
// retain their real completed records without pretending the extra v2 work was done.
function legacyReady(data, n) {
  if (!data || typeof data !== "object") return false;
  // Match the old validator exactly: v1 did not deduplicate marks or lines.
  const oldSpots = (spots) => (Array.isArray(spots) ? spots : []).filter((p) =>
    p && typeof p.x === "number" && typeof p.y === "number" && Math.hypot(p.x - 50, p.y - 50) < 49,
  );
  const oldLines = (lines) => (Array.isArray(lines) ? lines : []).filter((line) =>
    Array.isArray(line) && line.length === 2 && line[0] !== line[1] && line.every((id) => Object.hasOwn(starNames, id)),
  );
  switch (n) {
    case 1: return photoReady(data.photo) && oldSpots(data.spots).length >= 2 && textReady(data.observation);
    case 2: return validCaptureDays(data.captures).length >= 3 && Number.isFinite(data.original?.amount) &&
      ["left", "right"].includes(data.original?.side) && data.revealed === true && textReady(data.reflection);
    case 3: return legacyPlanetIds.every((id) => recordReady(planets.find((p) => p.id === id), data.records?.[id])) &&
      solarOrder.every((id, i) => data.order?.[i] === id);
    case 4: return legacyBodyIds.every((id) => {
      const b = bodies.find((x) => x.id === id);
      return Array.isArray(data.viewed) && data.viewed.includes(id) && data.answers?.[id]?.kind === b.kind && data.answers?.[id]?.reason === b.evidence;
    });
    case 5: return observedStars(data.observed).length >= 3 && oldLines(data.original).length >= 2 &&
      oldLines(data.lines).length >= 2 && data.compared === true && textReady(data.reflection);
    default: return false;
  }
}
function migrateV1(raw) {
  const s = clean(freshState(), raw);
  s.version = 2;
  s.legacyV1 = { drafts: safe(raw.drafts || {}) };
  const old = raw.drafts || {};
  if (old.moon?.photo) s.drafts.moon.photos = [safe(old.moon.photo)];
  s.drafts.moon.comparisons[0] = {
    spots: safe(old.moon?.spots || []), observation: old.moon?.observation || "",
  };
  s.drafts.phases.predictions[14] = normalizePrediction(old.phases, "right");
  if (old.pattern) {
    for (const [id, r] of Object.entries(patternRegions)) {
      const c = clean(patternCase(), old.pattern);
      c.lines = validLines(old.pattern.lines, r.stars);
      c.original = old.pattern.original ? validLines(old.pattern.original, r.stars) : null;
      s.drafts.pattern.cases[id] = c;
    }
  }
  return s;
}
function restoreDictionaries(s, raw) {
  s.drafts.planets.records = safe(raw.drafts?.planets?.records || {});
  s.drafts.planets.groups = safe(raw.drafts?.planets?.groups || {});
  s.drafts.classification.answers = safe(raw.drafts?.classification?.answers || {});
  s.core.connections = Object.fromEntries(stageIds.filter((n) => stageIds.includes(Number(raw.core?.connections?.[n])))
    .map((n) => [n, Number(raw.core.connections[n])]));
}
export function restore(raw) {
  if (!raw || ![1, 2].includes(raw.version)) return freshState();
  const s = raw.version === 1 ? migrateV1(raw) : clean(freshState(), raw);
  restoreDictionaries(s, raw);
  normalizeDrafts(s);
  s.settings.bgmVolume = bounded(s.settings.bgmVolume, 0, 100, 25);
  s.evidence = {};
  for (const n of stageIds) {
    const ev = raw.evidence?.[n];
    if (!ev?.data || typeof ev.date !== "string" || Number.isNaN(Date.parse(ev.date))) continue;
    if (raw.version === 1 || (ev.schemaVersion === 1 && ev.grandfathered === true)) {
      if (legacyReady(ev.data, n)) s.evidence[n] = {
        data: safe(ev.data), date: ev.date, schemaVersion: 1, grandfathered: true,
      };
      continue;
    }
    const probe = freshState(), key = stageKeys[n];
    probe.drafts[key] = clean(probe.drafts[key], ev.data);
    if (n === 3) {
      probe.drafts.planets.records = safe(ev.data.records || {});
      probe.drafts.planets.groups = safe(ev.data.groups || {});
    }
    if (n === 4) probe.drafts.classification.answers = safe(ev.data.answers || {});
    normalizeDrafts(probe);
    if (stageReady(probe, n)) s.evidence[n] = {
      data: clone(probe.drafts[key]), date: ev.date, schemaVersion: 2,
      challengeAnswer: typeof ev.challengeAnswer === "string" ? ev.challengeAnswer.slice(0, 600) : "",
    };
  }
  s.core.angle = bounded(s.core.angle, 0, 360, 15);
  s.core.restored = !!s.core.restored && coreReady(s);
  s.visited = [...new Set(s.visited.filter((n) => stageIds.includes(n)))];
  s.name = s.name.trim().slice(0, 20) || "별빛 연구원";
  if (!canAccess(s, s.scene)) s.scene = "map";
  if (!canAccess(s, s.resume)) s.resume = "map";
  return s;
}
export function load(storage) {
  try {
    const value = storage.getItem(SAVE_KEY);
    if (!value) return { state: freshState(), warning: "" };
    const raw = JSON.parse(value);
    // A syntactically valid JSON value can still be an unreadable save. Keep it
    // recoverable before the next automatic save replaces the main key.
    if (!raw || typeof raw !== "object" || ![1, 2].includes(raw.version))
      throw Error("Unsupported research log");
    return { state: restore(raw), warning: "" };
  } catch {
    try {
      const old = storage.getItem(SAVE_KEY);
      if (old) storage.setItem(`${SAVE_KEY}:recovery`, old);
    } catch {}
    return {
      state: freshState(),
      warning: "저장된 기록을 읽지 못했어. 가능한 원본은 복구용으로 보관했어. 새 연구는 계속할 수 있어.",
    };
  }
}
export function save(storage, s) {
  s.updatedAt = new Date().toISOString();
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(s));
    return true;
  } catch { return false; }
}

