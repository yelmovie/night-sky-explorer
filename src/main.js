import "./styles.css";
import {
  chapters,
  planets,
  requiredPlanets,
  solarOrder,
  bodies,
  reasons,
  starNames,
} from "./data.js";
import {
  freshState,
  clone,
  load,
  save,
  completedCount,
  stageOpen,
  firstReady,
  stageReady,
  canAccess,
  photoReady,
  completeStage,
  coreReady,
} from "./state.js";
import { esc, icon, moonSVG, dayMoon, phase, starChart } from "./drawing.js";
import { mountMap } from "./map.js";

const app = document.querySelector("#app");
let storage;
try {
  storage = window.localStorage;
} catch {
  storage = {
    getItem() {
      throw Error("unavailable");
    },
    setItem() {
      throw Error("unavailable");
    },
  };
}
const loaded = load(storage);
let state = loaded.state,
  warning = loaded.warning;
let cleanup = () => {},
  events,
  renderId = 0,
  modalReturn = null,
  toastTimer,
  audio,
  planetViewer,
  mapViewer,
  mapSelected = 1,
  mapArrived = null,
  selectedPiece = null,
  selectedStar = null,
  selectedRecord = null,
  previewCore = { connections: {}, angle: 15, restored: false };
let planetRotation = 0,
  planetZoom = 1,
  viewMetrics = {},
  moving = false,
  starRegion = "all";
const $ = (sel) => app.querySelector(sel),
  $$ = (sel) => [...app.querySelectorAll(sel)];
const btn = (label, action, cls = "secondary", attrs = "") =>
  `<button class="btn ${cls}" data-action="${action}" ${attrs}>${label}</button>`;
const badge = (label, cls = "") => `<span class="badge ${cls}">${label}</span>`;
const muted = () => state.settings.muted;
function persist() {
  if (!save(storage, state)) {
    warning =
      "기록을 저장하지 못했어. 브라우저의 저장 공간을 확인하고, 결과에서 기록 파일을 내려받아 줘.";
    const el = $("#save-state");
    if (el) {
      el.textContent = "저장 공간 확인 필요";
      el.classList.add("warning");
    }
  }
}
function tone(success = false) {
  if (muted()) return;
  try {
    audio ||= new AudioContext();
    audio.resume();
    const osc = audio.createOscillator(),
      gain = audio.createGain();
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(success ? 523 : 440, audio.currentTime);
    if (success) osc.frequency.setValueAtTime(784, audio.currentTime + 0.12);
    gain.gain.setValueAtTime(0.035, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.28);
    osc.start();
    osc.stop(audio.currentTime + 0.3);
  } catch {}
}
function toast(text) {
  const el = document.querySelector("#toast");
  el.textContent = text;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 4200);
}
function go(scene) {
  if (!canAccess(state, scene)) {
    toast("앞선 관측을 마치면 이곳으로 갈 수 있어.");
    return;
  }
  if (state.scene !== "home") state.resume = state.scene;
  state.scene = scene;
  selectedStar = null;
  starRegion = "all";
  if (scene !== "home") state.resume = scene;
  persist();
  render();
  window.scrollTo(0, 0);
  $("#screen-title")?.focus({ preventScroll: true });
}
function back() {
  const s = state.scene;
  if (s === "home") {
    toast("지금은 연구소 메인이야.");
    return;
  }
  if (s === "map") go("home");
  else if (s === "results") go("core");
  else if (s === "core") go("map");
  else go(s.endsWith("b") ? s.slice(0, 2) + "a" : "map");
}
function listen(target, event, fn) {
  target?.addEventListener(event, fn, { signal: events.signal });
}
function npc(text, who = "fox") {
  return `<div class="npc-message"><div class="npc-avatar ${who}" aria-hidden="true"></div><div><span class="npc-name">${who === "fox" ? "별여우 연구관" : "달토끼 기록원"}</span><p>${text}</p></div></div>`;
}
function shell() {
  return `<header class="shell"><nav aria-label="화면 이동"><button class="icon-button" data-action="home" aria-label="홈">${icon("home")}</button><button class="icon-button" data-action="back" aria-label="이전">${icon("back")}</button><span class="nav-divider"></span><span class="brand">SCIENCE <b>WORLD</b><small>밤하늘 관찰</small></span></nav><div class="shell-middle">${icon("spark", 16)} 별빛 관측 연구소</div><nav aria-label="소리와 설정"><span id="save-state" class="save-state ${warning ? "warning" : ""}"><i></i>${warning ? "저장 상태 확인" : "이 기기에 자동 저장"}</span><button class="icon-button" data-action="sound" aria-label="${muted() ? "소리 켜기" : "소리 끄기"}" aria-pressed="${muted()}">${icon(muted() ? "mute" : "sound")}</button><button class="icon-button" data-action="settings" aria-label="설정">${icon("settings")}</button></nav></header>${state.settings.adminUnlock ? '<div class="admin-banner">관리자 전체 해금 중 · 실제 완료 기록은 따로 보관돼</div>' : ""}`;
}
function chapterCards() {
  return chapters
    .map(
      (c) =>
        `<div class="chapter-mini ${state.evidence[c.id] ? "complete" : ""}"><span class="chapter-number">0${c.id}</span><span class="mini-icon" style="color:${c.color}">${icon(c.icon, 27)}</span><div><strong>${c.place}</strong><small>${state.evidence[c.id] ? "관측 기록 완료" : c.steps.join(" · ")}</small></div>${state.evidence[c.id] ? icon("check", 16) : ""}</div>`,
    )
    .join("");
}
function home() {
  return `<main class="home-screen"><div class="home-atmosphere"></div><section class="home-hero"><div class="hero-copy"><p class="eyebrow"><span class="tiny-star">✦</span> SCIENCE WORLD · NIGHT SKY</p><img class="hero-logo" src="/assets/logo.png" alt="별빛 관측 연구소"/><h1 id="screen-title" tabindex="-1">오늘 밤, 너의 관측으로<br><em>연구소의 불빛을 켜 줘.</em></h1><p class="hero-description">달의 무늬부터 북쪽 하늘의 별자리까지.<br>다섯 관측 기록을 모으는 너만의 밤하늘 탐험.</p><div class="home-actions">${btn(`${state.started ? "이어서 탐구하기" : "연구소로 출발"} ${icon("arrow")}`, state.started ? "resume" : "start", "primary large")}${state.started ? btn("새 연구 시작", "new", "ghost") : ""}</div><p class="small home-note">${icon("book", 16)} ${state.started ? `${esc(state.name)} · 관측 기록 ${completedCount(state)} / 5` : "초등 4학년 과학 · 관찰하고, 예상하고, 기록해요"}</p></div><aside class="mission-letter"><div class="letter-label">별여우의 연구 의뢰 <span>01</span></div><div class="hero-npc npc-full fox" aria-hidden="true"></div><p>“밤하늘은 반짝이는데,<br>우리 연구소의 <strong>기록이 뒤섞였어.</strong><br>나와 함께 단서를 찾아 줄래?”</p><div class="mission-rule">${icon("spark", 18)} 다섯 기록으로 중앙 관측 코어 복구</div></aside></section><section class="home-chapters" aria-label="다섯 관측 구역">${chapterCards()}</section><footer class="home-footer"><span>달토끼와 별여우가 기다리는 밤</span><button class="text-button" data-action="sources">자료와 제작 안내 ${icon("arrow", 14)}</button></footer></main>`;
}
function screenHeading(kicker, title, description, extra = "") {
  return `<div class="screen-heading"><div><p class="eyebrow">${kicker}</p><h1 id="screen-title" tabindex="-1">${title}</h1><p class="subtitle">${description}</p></div>${extra}</div>`;
}
function mapScreen() {
  const count = completedCount(state);
  return `<main class="page map-page">${screenHeading("OBSERVATION MAP · 탐구 지도", "불빛이 이어지는 숲", "관측 구역을 고르면 연구원이 걸어가. 도착한 뒤 조사를 시작해 줘.", `<div class="progress-medal"><strong>${count}<span> / 5</span></strong><small>모은 연구 기록</small></div>`)}<div class="map-layout"><section class="map-panel"><div class="map-topline">${badge("별빛 관측 연구소 · 야간 탐구")}<span>학생 연구원 ${icon("spark", 15)}</span></div><canvas id="world-map" tabindex="0" aria-label="사선 시점 픽셀 연구소 맵. 장소를 누르거나 아래 구역 버튼을 선택해 이동해." role="img"></canvas><div class="map-site-labels">${chapters.map((c) => `<button class="map-pin pin-${c.id} ${state.evidence[c.id] ? "done" : ""}" data-site="${c.id}" aria-label="${c.place}로 이동">${c.id} ${c.place} ${state.evidence[c.id] ? "✓" : !stageOpen(state, c.id) ? "· 잠김" : ""}</button>`).join("")}<button class="map-pin core-pin" data-site="0" aria-label="중앙 코어로 이동">✦ 중앙 코어</button></div><div class="map-legend"><span><i class="dot mint"></i> 복구 완료</span><span><i class="dot gold"></i> 조사 가능</span><span>방향키로 길을 걸을 수도 있어</span></div></section><aside class="map-sidebar"><p class="eyebrow">다음 관측 구역</p><div class="site-list">${chapters.map((c) => `<button class="site-item ${mapSelected === c.id ? "active" : ""}" data-site="${c.id}" ${!stageOpen(state, c.id) ? 'aria-disabled="true"' : ""}><span class="site-symbol" style="color:${c.color}">${icon(c.icon, 24)}</span><span><small>MISSION 0${c.id}</small><strong>${c.place}</strong></span><span class="site-status">${state.evidence[c.id] ? icon("check", 18) : stageOpen(state, c.id) ? icon("arrow", 18) : icon("lock", 18)}</span></button>`).join("")}</div><div id="map-detail"></div></aside></div><div class="page-bottom">${npc(count === 5 ? "다섯 기록이 모두 모였어! 중앙 코어로 가서 기록을 연결해 줘." : "조사한 시설에는 불빛이 켜져. 네 기록이 연구소를 하나씩 되살릴 거야.")}<div class="bottom-actions">${btn(`${icon("book")} 내 연구 노트`, "notebook")}${state.settings.adminUnlock || count === 5 ? btn("중앙 코어로 이동", "core-travel", "primary") : ""}</div></div></main>`;
}
function updateMapDetail() {
  const c = chapters[mapSelected - 1],
    at = mapArrived === mapSelected;
  $("#map-detail").innerHTML = c
    ? `<div class="destination-card"><h3>${c.title}</h3><p>${c.goal}</p><small>복구 보상 · ${c.reward}</small>${btn(at ? "조사 시작" : moving ? "연구원이 이동 중…" : "이곳으로 걸어가기", at ? "enter-site" : "walk-site", "primary", moving ? "disabled" : "")}${state.visited.includes(c.id) ? btn("방문한 구역 빠른 이동", "fast-site", "text-button") : ""}${state.settings.adminUnlock ? btn("학습 B 바로 열기", "admin-b", "text-button") : ""}</div>`
    : `<div class="destination-card"><h3>중앙 관측 코어</h3><p>모은 다섯 기록을 연결해 연구소의 중앙 돔을 열어 줘.</p>${btn(at ? "코어 열기" : moving ? "연구원이 이동 중…" : "중앙으로 걸어가기", at ? "enter-core" : "walk-site", "primary", moving ? "disabled" : "")}${state.settings.adminUnlock ? btn("개인 결과 미리보기", "admin-results", "text-button") : ""}</div>`;
  bindActions($("#map-detail"));
}
function stageFrame(n, part, left, right, instruction) {
  const c = chapters[n - 1];
  return `<main class="page learning-page" data-scene="s${n}${part}">${screenHeading(`MISSION 0${n} · ${c.place}`, c.steps[part === "a" ? 0 : 1], instruction, `<div class="lesson-progress"><span>${n * 2 - (part === "a" ? 1 : 0)}<small> / 10</small></span><div class="progress-dots">${Array.from({ length: 10 }, (_, i) => `<i class="${i < n * 2 - (part === "a" ? 1 : 0) ? "lit" : ""}"></i>`).join("")}</div>${btn(`${icon("book", 16)} 연구 노트`, "notebook", "text-button")}</div>`)}<div class="learning-grid"><section class="observation-panel">${left}</section><aside class="control-panel">${right}</aside></div><div class="page-bottom">${npc(c.goal, n <= 2 ? "rabbit" : "fox")}<div class="bottom-actions">${btn(part === "a" ? `기록하고 다음으로 ${icon("arrow")}` : `${icon("check")} 연구 기록 완성`, part === "a" ? "next" : "complete", "primary", `id="stage-next" ${!(part === "a" ? firstReady(state, n) : stageReady(state, n)) ? "disabled" : ""}`)}</div></div></main>`;
}
function sectionTitle(num, title) {
  return `<div class="panel-title"><span>${num}</span><h2>${title}</h2></div>`;
}
function range(label, id, min, max, value, step = 1, unit = "") {
  return `<label class="range-label" for="${id}"><span>${label}</span><output id="${id}-value">${value}${unit}</output></label><input type="range" id="${id}" min="${min}" max="${max}" value="${value}" step="${step}" aria-label="${label}"/>`;
}
function s1a() {
  const m = state.drafts.moon;
  return stageFrame(
    1,
    "a",
    `<div class="panel-top">${badge("TELESCOPE · 달 관측 모형")}<span id="focus-status">${photoReady(m) ? "촬영할 수 있어" : "시야와 초점을 조절해 줘"}</span></div><div class="telescope" id="telescope" tabindex="0" aria-label="망원경 시야. 드래그 또는 방향 버튼으로 달을 가운데 맞춰 줘"><div class="scope-stars"></div><div id="scope-moon">${moonSVG()}</div><div class="crosshair"></div><div class="scope-rings"></div></div><p class="canvas-caption">드래그로 시야 이동 · 아래 방향 버튼으로도 조절할 수 있어</p>`,
    `${sectionTitle("01", "달을 가운데로")}<div class="direction-pad"><button data-pan="up" aria-label="시야 위로">↑</button><button data-pan="left" aria-label="시야 왼쪽으로">←</button><span>시야</span><button data-pan="right" aria-label="시야 오른쪽으로">→</button><button data-pan="down" aria-label="시야 아래로">↓</button></div>${sectionTitle("02", "선명하게 조절하기")}${range("배율", "moon-zoom", 1, 3, m.zoom, 0.1, "×")}${range("초점", "moon-focus", 0, 100, m.focus)}<p class="hint">달 전체가 보이는 배율과 가장 또렷한 초점을 찾아봐.</p>${btn(`${icon("camera")} 관측사진 촬영`, "capture-moon", "primary", `id="capture-moon" ${!photoReady(m) ? "disabled" : ""}`)}<div id="photo-status" class="inline-status">${m.photo ? "✓ 관측사진을 노트에 저장했어." : "아직 촬영한 사진이 없어."}</div>`,
    "시야를 움직여 달을 찾고, 배율과 초점을 맞춰 촬영해 줘.",
  );
}
function spotPreviews(m) {
  return m.spots.length
    ? m.spots
        .map(
          (p, i) =>
            `<div class="sample"><div class="sample-crop">${moonSVG(100, "right", "", `style="transform:scale(3);transform-origin:${p.x}% ${p.y}%"`)}</div><small>관찰 ${i + 1} · ${Math.round(p.x)}, ${Math.round(p.y)}</small></div>`,
        )
        .join("")
    : '<p class="empty">표면의 두 곳을 고르면<br>확대해서 나란히 볼 수 있어.</p>';
}
function s1b() {
  const m = state.drafts.moon;
  return stageFrame(
    1,
    "b",
    `<div class="panel-top">${badge("내가 촬영한 달 · 표면 모형")}<span>서로 다른 두 곳 비교</span></div><div class="surface-moon" id="surface-moon" aria-label="달 표면에서 관찰할 위치 선택">${moonSVG()}${m.spots.map((p, i) => `<span class="spot-marker" style="left:${p.x}%;top:${p.y}%">${i + 1}</span>`).join("")}</div><div class="choice-row surface-choices">${btn("왼쪽 위 관찰", "spot-1", "chip")}${btn("오른쪽 위 관찰", "spot-2", "chip")}${btn("아래쪽 관찰", "spot-3", "chip")}</div>`,
    `${sectionTitle("01", "확대해서 비교해 봐")}<div class="sample-row">${spotPreviews(m)}</div>${sectionTitle("02", "어떤 차이를 발견했니?")}<label class="field-label" for="moon-observation">내 관찰 기록</label><textarea id="moon-observation" maxlength="240" placeholder="밝은 부분과 어두운 부분은 어떻게 달라 보였어?">${esc(m.observation)}</textarea><div class="suggestions">${btn("밝고 어두운 부분이 보여.", "moon-note-1", "chip")}${btn("둥글게 움푹 팬 곳이 보여.", "moon-note-2", "chip")}</div><p class="hint">달의 어두운 부분을 ‘바다’라고 부르지만, 물로 된 바다는 아니야.</p>`,
    "달 표면의 두 곳을 골라 확대하고, 발견한 특징을 기록해 줘.",
  );
}
function captureStrip(p) {
  return `<div class="filmstrip">${
    p.captures
      .slice()
      .sort((a, b) => a - b)
      .map((day) => `<div>${dayMoon(day)}<small>${day}일째</small></div>`)
      .join("") ||
    '<p class="empty">서로 다른 시점의 달을 3장 이상 모아 줘.</p>'
  }</div>`;
}
function s2a() {
  const p = state.drafts.phases;
  return stageFrame(
    2,
    "a",
    `<div class="panel-top">${badge("학습용 시간 흐름")}<span>실제 날짜의 하늘과 달라</span></div><div class="phase-stage"><span class="date-label" id="day-label">${p.day}일째</span><div id="phase-moon">${dayMoon(p.day)}</div></div><div id="phase-filmstrip">${captureStrip(p)}</div>`,
    `${sectionTitle("01", "시간을 움직여 봐")}${range("관찰 시점", "phase-day", 0, 29, p.day, 1, "일째")}<div class="ticks"><span>0일째</span><span>14일째</span><span>29일째</span></div><p class="hint">3일째, 7일째, 10일째의 밝은 부분을 비교해 보면 다음 모습을 예상하는 데 도움이 돼.</p><div class="choice-row">${[3, 7, 10].map((d) => btn(`${d}일째`, "day-" + d, "chip")).join("")}</div>${btn(`${icon("camera")} 이 모습 기록`, "capture-phase", "primary")}<div id="phase-count" class="inline-status">${p.captures.length} / 3개 이상 기록</div>${sectionTitle("02", "기록에서 찾아볼 것")}<p>밝은 부분의 크기와 방향이 어떻게 달라졌니?</p>`,
    "여러 날의 달을 관찰하고, 서로 다른 시점의 사진을 세 장 이상 모아 줘.",
  );
}
function s2b() {
  const p = state.drafts.phases;
  return stageFrame(
    2,
    "b",
    `<div class="panel-top">${badge("14일째의 달을 예상해 봐")}<span>학습용 모형 · 북반구 방향 예시</span></div><div class="prediction-pair ${p.overlay ? "overlay-mode" : ""}"><div><span class="stage-label">${p.revealed ? "수정한 내 예상" : "내 예상"}</span><div id="prediction-moon">${moonSVG(p.amount, p.side)}</div></div><div class="actual-moon"><span class="stage-label">관측 자료</span>${p.revealed ? dayMoon(14) : '<div class="unknown-moon">?</div>'}</div></div>${p.revealed && p.original ? `<div class="original-prediction">처음 예상 ${moonSVG(p.original.amount, p.original.side)}<span>${p.original.amount}% · ${p.original.side === "right" ? "오른쪽" : "왼쪽"}에서 밝게 보일 거라고 예상했어.</span></div>` : ""}${captureStrip(p)}`,
    `${sectionTitle("01", "밝은 부분을 조절해 봐")}${range("밝은 부분", "prediction-amount", 0, 100, p.amount, 1, "%")}<div class="segmented">${btn("오른쪽", "side-right", p.side === "right" ? "active" : "")}${btn("왼쪽", "side-left", p.side === "left" ? "active" : "")}</div>${!p.revealed ? btn("예상 저장하고 관측 자료 보기", "reveal-phase", "primary") : `${btn(p.overlay ? "나란히 비교하기" : "겹쳐서 비교하기", "overlay-phase", "secondary")}${sectionTitle("02", "비교하고 생각을 남겨 줘")}<label class="field-label" for="phase-reflection">예상과 관측은 어떻게 달랐니?</label><textarea id="phase-reflection" maxlength="240" placeholder="슬라이더로 예상을 수정하고, 무엇이 달랐는지 적어 줘.">${esc(p.reflection)}</textarea>${btn("관측에서는 거의 둥근 모습이었어.", "phase-note", "chip")}`}<p class="hint">처음 예상이 달라도 괜찮아. 관측 자료와 비교하고 다시 생각하는 게 연구야.</p>`,
    "모아 둔 달 사진을 보고 14일째를 예상한 뒤, 관측 자료와 비교해 줘.",
  );
}
function s3a() {
  const p = state.drafts.planets,
    current = planets.find((x) => x.id === p.selected);
  return stageFrame(
    3,
    "a",
    `<div class="panel-top">${badge("PLANET LAB · 3D 조사대")}<span>학습용 표면 모형</span></div><div class="planet-tabs">${planets.map((x) => `<button data-planet="${x.id}" class="planet-tab ${x.id === p.selected ? "active" : ""}" aria-label="${x.name} 조사"><i style="background:${x.color}"></i>${requiredPlanets.includes(x.id) ? "조사 " + (requiredPlanets.indexOf(x.id) + 1) : x.name}${p.records[x.id] ? " ✓" : ""}</button>`).join("")}</div><div id="planet-viewer" class="planet-viewer"><div class="viewer-loading">3D 조사대를 여는 중…</div></div><div class="viewer-controls">${range("회전", "planet-rotation", -180, 180, planetRotation, 5, "°")}${range("확대", "planet-zoom", 0, 3, planetZoom, 0.1, "×")}</div><p class="canvas-caption">드래그로 회전 · 두 손가락 또는 휠로 확대</p>`,
    `${sectionTitle("01", "보이는 특징을 골라 줘")}<label class="field-label" for="planet-feature">관찰 근거</label><select id="planet-feature"><option value="">관찰한 특징 선택</option>${planets.map((x) => `<option ${p.feature === x.feature ? "selected" : ""}>${x.feature}</option>`).join("")}</select>${sectionTitle("02", "어떤 행성일까?")}<label class="field-label" for="planet-candidate">이름 후보</label><select id="planet-candidate"><option value="">행성 이름 선택</option>${planets.map((x) => `<option value="${x.id}" ${p.candidate === x.id ? "selected" : ""}>${x.name}</option>`).join("")}</select>${btn("근거와 이름 기록", "record-planet", "primary")}<div class="inline-status">필수 조사 ${requiredPlanets.filter((id) => p.records[id]).length} / 3</div><details class="science-note"><summary>행성 참고 자료</summary><ul>${planets.map((x) => `<li><b>${x.name}</b> · ${x.feature}</li>`).join("")}</ul></details><p class="hint">조사 1·2·3을 마치면 다음으로 갈 수 있어. 다른 행성도 자유롭게 살펴봐.</p>`,
    "행성을 돌리고 확대해 특징을 관찰한 뒤, 근거와 이름을 연결해 줘.",
  );
}
function planetToken(id) {
  if (!id) return '<span class="empty-slot">+</span>';
  const p = planets.find((x) => x.id === id);
  return `<span class="planet-dot ${id === "saturn" ? "ringed" : ""} ${id === "sun" ? "sun" : ""}" style="--planet:${p?.color || "#ffcb59"}"></span><strong>${p?.name || "태양"}</strong>`;
}
function s3b() {
  const p = state.drafts.planets;
  return stageFrame(
    3,
    "b",
    `<div class="panel-top">${badge("SOLAR SYSTEM · 태양계 구성판")}<span>실제 크기·거리 비율이 아니야</span></div><div class="solar-board">${solarOrder.map((id, i) => `<button class="solar-slot ${p.order[i] ? "filled" : ""}" data-slot="${i}" aria-label="${i === 0 ? "태양 자리" : `${i}번째 행성 자리`}"><small>${i === 0 ? "중심" : i + "번째"}</small>${planetToken(p.order[i])}</button>`).join("")}</div><div class="solar-tray" aria-label="태양계 구성원">${["saturn", "earth", "sun", "neptune", "mars", "mercury", "jupiter", "uranus", "venus"].map((id) => `<button class="solar-piece ${selectedPiece === id ? "selected" : ""}" data-piece="${id}" draggable="true" ${p.order.includes(id) ? "disabled" : ""}>${planetToken(id)}</button>`).join("")}</div><p class="canvas-caption">구성원을 누르고 자리를 눌러 배치해 줘. 드래그도 가능해.</p>`,
    `${sectionTitle("01", "자료를 보고 배치해 봐")}<p>행성의 겉모습만으로 태양에서의 순서를 알 수는 없어. 연구 노트의 순서 자료를 활용해 줘.</p>${btn(`${icon("book")} 내 조사 노트와 순서 자료`, "solar-note", "primary")}${sectionTitle("02", "다시 바꿔도 괜찮아")}<p class="hint">배치한 자리를 누르면 구성원이 아래로 돌아가. 순서를 확인하고 수정해 봐.</p>${btn("배치 확인하기", "check-solar", "secondary")}<div id="solar-feedback" class="inline-status">${p.order.filter(Boolean).length} / 9개 배치</div>`,
    "태양과 8개 행성을 배치해, 연구실의 태양계 모형을 완성해 줘.",
  );
}
function s4a() {
  const d = state.drafts.classification;
  return stageFrame(
    4,
    "a",
    `<div class="panel-top">${badge("관측 모습 + 과학 자료")}<span>사진의 밝기만으로 판별하지 않아</span></div><div class="body-grid">${bodies.map((b) => `<button class="body-card ${d.viewed.includes(b.id) ? "viewed" : ""}" data-body="${b.id}"><span class="body-orb ${b.id === "sun" ? "is-sun" : ""}" style="--planet:${b.color}"></span><strong>${b.name}</strong><small>${b.look}</small><span class="body-read">${d.viewed.includes(b.id) ? "✓ 자료 비교 완료" : "과학 자료 열기 →"}</span></button>`).join("")}</div><p class="canvas-caption">태양은 맨눈이나 망원경으로 직접 바라보면 안 돼. 이 화면은 모형 자료야.</p>`,
    `${sectionTitle("01", "네 천체를 비교해 봐")}<p>하늘에서 점처럼 보인다고 모두 같은 종류일까?</p><div class="comparison-count">${d.viewed.length}<span> / 4개 자료 비교</span></div>${sectionTitle("02", "어떤 자료가 필요할까?")}<p class="hint">모습을 살펴본 뒤 과학 자료에서 빛이 어디서 오는지 확인해 줘.</p><div class="note-card">${icon("spark", 26)}<p>밝기·색·깜빡임만으로는 별과 행성을 확실하게 구분할 수 없어.</p></div>`,
    "천체를 눌러 관측 모습과 과학 자료를 함께 비교해 줘.",
  );
}
function s4b() {
  const d = state.drafts.classification;
  return stageFrame(
    4,
    "b",
    `<div class="panel-top">${badge("EVIDENCE BOARD · 근거 판별")}<span>주장과 근거를 함께 연결해 줘</span></div><div class="evidence-table">${bodies
      .map((b) => {
        const a = d.answers[b.id] || {};
        return `<div class="evidence-row"><strong><i style="background:${b.color}"></i>${b.name}</strong><label><span>주장</span><select data-kind="${b.id}" aria-label="${b.name} 분류"><option value="">고르기</option><option value="star" ${a.kind === "star" ? "selected" : ""}>별</option><option value="planet" ${a.kind === "planet" ? "selected" : ""}>행성</option></select></label><label><span>근거</span><select data-reason="${b.id}" aria-label="${b.name} 판별 근거"><option value="">근거 고르기</option>${reasons.map(([id, label]) => `<option value="${id}" ${a.reason === id ? "selected" : ""}>${label}</option>`).join("")}</select></label></div>`;
      })
      .join("")}</div>`,
    `${sectionTitle("01", "어떤 천체인지 주장해 줘")}<p>자료를 바탕으로 별인지 행성인지 판단하고, 그 판단을 뒷받침하는 근거를 골라 줘.</p>${btn("판별 근거 확인", "check-classification", "primary")}<div id="classification-feedback" class="inline-status">모습보다 빛의 근원을 생각해 봐.</div><details class="science-note"><summary>비교했던 과학 자료 보기</summary>${bodies.map((b) => `<p><b>${b.name}</b> · ${b.info}</p>`).join("")}</details>`,
    "왜 그렇게 생각했는지, 과학 자료를 근거로 설명해 줘.",
  );
}
function starZoom() {
  return `<div class="choice-row chart-zoom">${btn("전체 하늘", "sky-all", "chip")}${btn("위쪽 별 확대", "sky-cassiopeia", "chip")}${btn("아래쪽 별 확대", "sky-dipper", "chip")}</div>`;
}
function s5a() {
  const p = state.drafts.pattern;
  return stageFrame(
    5,
    "a",
    `<div class="panel-top">${badge("NORTH SKY · 북쪽 하늘")}<span>기준 연결선은 아직 꺼져 있어</span></div><div id="star-view">${starChart({ observed: p.observed, selected: selectedStar, region: starRegion })}</div>${starZoom()}`,
    `${sectionTitle("01", "별의 배열을 살펴봐")}<p>금빛으로 표시한 별이 북극성이야. 주변 별 세 개 이상을 눌러 위치와 배열을 관찰해 줘.</p><div id="star-observation" class="note-card">${selectedStar ? `${starNames[selectedStar]}를 관찰했어. 가까운 다른 별과 어떤 모양을 만들 수 있을까?` : "별 사이의 간격과 방향을 살펴봐."}</div><div id="observed-count" class="comparison-count">${p.observed.length}<span> / 3개 이상 관찰</span></div><p class="hint">오늘의 특정 시각을 재현한 하늘이 아니라, 북극 주변의 별 배열을 비교하는 지도야.</p>`,
    "북극성을 기준으로 주변 별들의 위치와 배열을 관찰해 줘.",
  );
}
function s5b() {
  const p = state.drafts.pattern;
  return stageFrame(
    5,
    "b",
    `<div class="panel-top">${badge("나의 별자리 연구 지도")}<span>${p.showReference ? "청록: 내 선 · 금색 점선: 기준" : "별 두 개를 차례로 누르면 연결돼"}</span></div><div id="star-view">${starChart({ lines: p.lines, reference: p.showReference, selected: selectedStar, region: starRegion })}</div>${starZoom()}<div class="choice-row">${btn("마지막 선 되돌리기", "undo-line", "chip", p.lines.length ? "" : "disabled")}${btn("새 연결 시작", "cancel-line", "chip")}</div>`,
    `${sectionTitle("01", "나만의 패턴을 만들어 봐")}<p>별 두 개를 차례로 눌러 선을 그려 줘. 네 패턴에는 정해진 정답이 없어.</p><div class="inline-status">${p.lines.length}개 선 기록</div>${!p.original ? btn("내 패턴 저장하고 기준 비교", "compare-pattern", "primary", p.lines.length < 2 ? "disabled" : "") : btn(p.showReference ? "기준 연결선 숨기기" : "기준 연결선 보기", "toggle-reference", "secondary")}${p.compared ? `${sectionTitle("02", "비교한 생각을 남겨 줘")}<p class="hint">기준은 카시오페이아자리와 북두칠성이야. 별자리 선은 사람이 별 배열에 덧붙인 표현이지.</p><label class="field-label" for="pattern-reflection">내 패턴과 기준의 비교</label><textarea id="pattern-reflection" maxlength="240" placeholder="비슷한 점이나 다른 점을 적어 줘. 선을 고쳐도 좋아.">${esc(p.reflection)}</textarea>${btn("같은 별도 다른 선으로 이을 수 있어.", "pattern-note", "chip")}` : ""}`,
    "먼저 네 패턴을 만든 뒤 기준 별자리와 비교하고, 생각을 기록해 줘.",
  );
}

function isPreview() {
  return completedCount(state) < 5;
}
function coreScreen() {
  const preview = isPreview(),
    c = preview ? previewCore : state.core;
  return `<main class="page core-page">${screenHeading("FINAL MISSION · 중앙 관측 코어", "다섯 기록, 하나의 별빛", preview ? "관리자 미리보기 · 아래 예시 연결은 실제 연구 기록에 저장되지 않아." : "네가 만든 관측 기록을 알맞은 장치에 연결하고 보정 링을 맞춰 줘.", badge(preview ? "미리보기" : "실제 연구 기록", preview ? "preview" : ""))}<div class="core-layout"><section class="record-bank"><h2>연구 기록 보관함</h2>${[
    3, 1, 5, 2, 4,
  ]
    .map((n) => {
      const d = chapters[n - 1];
      return `<button class="record-chip ${Number(selectedRecord) === n ? "selected" : ""}" data-record="${n}">${icon(d.icon)}<span>${d.record}<small>${preview && !state.evidence[n] ? "미리보기 예시" : evidenceSummary(n, state.evidence[n]?.data)}</small></span></button>`;
    })
    .join(
      "",
    )}</section><section class="core-machine ${c.restored ? "restored" : ""}"><div class="core-orbits"></div><div class="core-center">${icon("spark", 70)}<span>${c.restored ? "연구소 복구 완료" : "CENTRAL CORE"}</span></div><div class="core-sockets">${chapters.map((d) => `<button class="socket ${Number(c.connections[d.id]) === d.id ? "connected" : ""}" data-socket="${d.id}" aria-label="${d.system}에 연결"><span>${icon(d.icon, 18)} ${d.system}</span><small>${c.connections[d.id] ? chapters[c.connections[d.id] - 1]?.record : "기록을 선택한 뒤 여기를 눌러 줘"}</small></button>`).join("")}</div></section><aside class="control-panel core-control">${sectionTitle("01", "관측 기록 연결")}<p>왼쪽에서 기록을 고른 뒤, 가운데에서 그 기록이 필요한 장치를 골라 줘.</p>${sectionTitle("02", "마지막 보정 링")}<div class="calibration"><div id="calibration-pointer" style="transform:rotate(${c.angle}deg)"></div><span class="calibration-target"></span></div>${range("보정 링", "core-angle", 0, 360, c.angle, 5, "°")}<p class="hint">바늘을 아래쪽 금빛 기준에 맞춰 줘.</p>${c.restored ? btn("내 연구 결과 보기", "show-results", "primary") : btn("중앙 코어 복구", "restore-core", "primary")}<p class="small">${preview ? "미리보기에서는 인증 기록이 만들어지지 않아." : "복구한 결과에 네 관측 기록 다섯 가지가 남아."}</p></aside></div><div class="page-bottom">${npc("밤하늘은 늘 반짝이고 있었어. 네가 되살린 건 우리가 하늘을 이해하는 관측 기록이야!")}</div></main>`;
}
function evidenceSummary(n, d) {
  if (!d) return "아직 관측 기록이 없어";
  return [
    null,
    `표면 ${d.spots?.length || 0}곳 비교`,
    `${d.captures?.length || 0}개 시점과 내 예상`,
    `${Object.keys(d.records || {}).length}개 행성 조사`,
    `4개 천체의 판별 근거`,
    `${d.lines?.length || 0}개 선으로 만든 패턴`,
  ][n];
}
function recordContent(n, d) {
  if (!d) return '<p class="empty">아직 직접 만든 관측 기록이 없어.</p>';
  if (n === 1)
    return `<div class="result-moon"><div class="photo-thumbnail" aria-label="내가 촬영한 망원경 시야">${moonSVG(100, "right", "", `style="transform:translate(${d.photo.x}%,${d.photo.y}%) scale(${d.photo.zoom * 0.65});filter:blur(${Math.abs(d.photo.focus - 72) / 9}px)"`)}</div><div><small>내 사진 · 배율 ${d.photo.zoom}× · 초점 ${d.photo.focus}</small><p>${esc(d.observation)}</p><div class="sample-row">${spotPreviews(d)}</div></div></div>`;
  if (n === 2)
    return `${captureStrip(d)}<div class="result-predictions"><div>${moonSVG(d.original.amount, d.original.side)}<small>처음 예상</small></div><div>${moonSVG(d.amount, d.side)}<small>수정한 예상</small></div><div>${dayMoon(14)}<small>관측 자료</small></div></div><p>${esc(d.reflection)}</p>`;
  if (n === 3)
    return `<ul class="record-list">${Object.entries(d.records)
      .map(
        ([id, v]) =>
          `<li><b>${planets.find((p) => p.id === id)?.name}</b> · ${esc(v.feature)}</li>`,
      )
      .join(
        "",
      )}</ul><p class="order-note">태양 → ${planets.map((p) => p.name).join(" → ")}</p>`;
  if (n === 4)
    return `<ul class="record-list">${bodies.map((b) => `<li><b>${b.name} · ${d.answers[b.id].kind === "star" ? "별" : "행성"}</b><br>${esc(reasons.find(([id]) => id === d.answers[b.id].reason)?.[1])}</li>`).join("")}</ul>`;
  return `${starChart({ lines: d.lines, reference: true, interactive: false })}<p>${esc(d.reflection)}</p><small>처음 ${d.original.length}개 선 → 마지막 ${d.lines.length}개 선 · 청록: 내 패턴</small>`;
}
function results() {
  const preview = !state.core.restored || isPreview(),
    date = state.evidence[5]?.date;
  return `<main class="page results-page">${screenHeading(preview ? "PREVIEW · 개인 결과 미리보기" : "RESEARCH COMPLETE · 연구소 복구 완료", preview ? "앞으로 쌓일 너의 연구 기록" : "너의 관측이, 연구소를 밝혔어.", preview ? "직접 완료한 기록만 아래에 표시돼. 인증서는 실제 코어 복구 후 만들어져." : "달을 보고, 예상을 고치고, 근거를 찾은 모든 순간을 모았어.", badge(preview ? "미리보기" : "탐구 완료", preview ? "preview" : "complete"))}<section class="certificate"><div class="certificate-seal">${icon("spark", 45)}<small>STARLIGHT<br>RESEARCHER</small></div><div><p class="eyebrow">별빛 관측 연구소 · ${preview ? "인증 전" : "탐구 인증서"}</p><h2>${esc(state.name)}</h2><p>${preview ? "다섯 관측 기록과 중앙 코어 복구를 기다리는 중이야." : "관찰하고 비교하며 근거를 찾는 별빛 연구원으로 인증해."}</p><small>${date ? new Date(date).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" }) : "—"} · 관측 기록 ${completedCount(state)} / 5</small></div><div class="certificate-stars">✦<br><span>✧ ✧</span></div></section><div class="result-toolbar"><h2>나의 다섯 관측 기록</h2><div>${btn(`${icon("download", 18)} 기록 파일 저장`, "export", "secondary")}${!preview ? btn("인증서·기록 인쇄", "print", "primary") : ""}</div></div><div class="results-grid">${chapters.map((c) => `<article class="result-card"><h3><span style="color:${c.color}">${icon(c.icon, 22)}</span>${c.record}</h3>${recordContent(c.id, state.evidence[c.id]?.data)}</article>`).join("")}</div><div class="page-bottom">${npc("처음 생각과 다른 결과를 만났을 때, 다시 보고 고친 것까지 모두 소중한 연구 기록이야.", "rabbit")}${btn("탐구 지도로 돌아가기", "map", "primary")}</div></main>`;
}

function render() {
  cleanup();
  planetViewer = null;
  mapViewer = null;
  events?.abort();
  events = new AbortController();
  const id = ++renderId;
  document.body.classList.toggle("reduce-motion", state.settings.reducedMotion);
  const renderers = {
    home,
    map: mapScreen,
    s1a,
    s1b,
    s2a,
    s2b,
    s3a,
    s3b,
    s4a,
    s4b,
    s5a,
    s5b,
    core: coreScreen,
    results,
  };
  app.innerHTML =
    shell() +
    renderers[state.scene]() +
    `<dialog id="dialog" aria-labelledby="dialog-title"></dialog>`;
  cleanup = () => {};
  bindActions(app);
  bindControls(id);
  if (warning) toast(warning);
}
function bindActions(root) {
  root
    .querySelectorAll("[data-action]")
    .forEach((el) => listen(el, "click", () => action(el.dataset.action)));
}
function refreshNext() {
  const m = /^s([1-5])([ab])$/.exec(state.scene);
  if (m && $("#stage-next"))
    $("#stage-next").disabled = !(m[2] === "a"
      ? firstReady(state, +m[1])
      : stageReady(state, +m[1]));
}
function modal(title, body, after) {
  const dialog = $("#dialog");
  modalReturn = document.activeElement;
  dialog.innerHTML = `<div class="dialog-heading"><h2 id="dialog-title">${title}</h2><button class="icon-button" data-action="close-modal" aria-label="닫기">${icon("close")}</button></div>${body}`;
  bindActions(dialog);
  dialog.showModal();
  after?.(dialog);
  listen(dialog, "close", () => {
    if (modalReturn?.isConnected) modalReturn.focus();
  });
}
function closeModal() {
  $("#dialog").close();
}
function notebook() {
  modal(
    "달토끼의 연구 노트",
    `<p class="subtitle">${esc(state.name)}의 실제 완료 기록 ${completedCount(state)} / 5</p><div class="notebook-list">${chapters.map((c) => `<details ${state.evidence[c.id] ? "" : 'class="unwritten"'}><summary>${icon(c.icon, 20)} ${c.record} <span>${state.evidence[c.id] ? "✓ 기록 완료" : "아직 기록 전"}</span></summary>${recordContent(c.id, state.evidence[c.id]?.data)}</details>`).join("")}</div>`,
  );
}
function settings() {
  modal(
    "연구소 설정",
    `<label class="field-label" for="researcher-name">연구원 이름</label><input id="researcher-name" type="text" maxlength="20" value="${esc(state.name)}"/><label class="toggle-row"><span><b>효과음</b><small>버튼과 연구 완료 소리</small></span><input type="checkbox" id="setting-sound" ${!muted() ? "checked" : ""}/></label><label class="toggle-row"><span><b>동작 줄이기</b><small>맵 이동을 즉시 완료하고 장식을 멈춰</small></span><input type="checkbox" id="setting-motion" ${state.settings.reducedMotion ? "checked" : ""}/></label><div class="admin-setting"><label class="toggle-row"><span><b>관리자 전체 해금</b><small>모든 학습·코어·결과에 접근</small></span><input type="checkbox" id="setting-admin" ${state.settings.adminUnlock ? "checked" : ""}/></label><p class="hint">실제 완료 기록은 만들어지지 않아. 끄면 실제 진행도에 맞춰 다시 잠겨.</p></div>${warning ? `<p class="warning">${esc(warning)}</p>` : '<p class="small">이 기기·이 브라우저에 저장돼. 브라우저 데이터를 지우면 기록도 사라져.</p>'}${btn("설정 적용", "apply-settings", "primary")}`,
  );
}
function action(a) {
  tone();
  if (a === "home") return go("home");
  if (a === "back") return back();
  if (a === "map") return go("map");
  if (a === "sound") {
    state.settings.muted = !muted();
    if (muted()) audio?.suspend();
    persist();
    const el = $('[data-action="sound"]');
    el.innerHTML = icon(muted() ? "mute" : "sound");
    el.setAttribute("aria-label", muted() ? "소리 켜기" : "소리 끄기");
    el.setAttribute("aria-pressed", muted());
    return;
  }
  if (a === "settings") return settings();
  if (a === "close-modal") return closeModal();
  if (a === "notebook") return notebook();
  if (a === "resume") return go(state.resume);
  if (a === "start") {
    state.started = true;
    persist();
    return go("map");
  }
  if (a === "new")
    return modal(
      "새 연구를 시작할까?",
      `<p>이 브라우저의 현재 연구 기록을 지우고 처음부터 시작해. 필요한 기록은 먼저 파일로 저장해 줘.</p><div class="modal-actions">${btn("기록 파일 저장", "export")}${btn("현재 연구 유지", "close-modal")}${btn("기록 지우고 새로 시작", "confirm-new", "danger")}</div>`,
    );
  if (a === "confirm-new") {
    const settings = state.settings;
    state = freshState();
    state.settings = settings;
    state.started = true;
    selectedStar = null;
    selectedPiece = null;
    previewCore = { connections: {}, angle: 15, restored: false };
    persist();
    return go("map");
  }
  if (a === "apply-settings") {
    state.name =
      $("#researcher-name").value.trim().slice(0, 20) || "별빛 연구원";
    state.settings.muted = !$("#setting-sound").checked;
    state.settings.reducedMotion = $("#setting-motion").checked;
    state.settings.adminUnlock = $("#setting-admin").checked;
    if (muted()) audio?.suspend();
    if (!canAccess(state, state.scene)) state.scene = "map";
    if (!canAccess(state, state.resume)) state.resume = "map";
    persist();
    render();
    $('[data-action="settings"]')?.focus();
    return;
  }
  if (a === "sources")
    return modal(
      "자료와 제작 안내",
      `<p>제공된 2D 배경과 캐릭터를 활용한 학습용 MVP야. 달·행성 표면은 특징을 표현한 모형이며 실제 관측사진은 아니야.</p><ul class="source-list"><li><a href="https://science.nasa.gov/solar-system/planets/" target="_blank" rel="noopener">NASA · 태양계와 행성 자료</a></li><li><a href="https://science.nasa.gov/moon/moon-phases/" target="_blank" rel="noopener">NASA · 달의 모양 변화</a></li><li><a href="https://github.com/astronexus/HYG-Database" target="_blank" rel="noopener">HYG v4.1 · David Nash · 별 좌표 13개</a> (CC BY-SA 4.0, 북극 중심으로 투영)</li></ul><p class="hint">별자리 연결선은 별 위치에 사람이 더한 표현이야. 북두칠성은 큰곰자리의 일부야.</p>`,
    );
  if (a === "walk-site") return travel(mapSelected);
  if (a === "core-travel") return selectSite(0);
  if (a === "enter-site" || a === "fast-site") {
    if (!state.visited.includes(mapSelected)) state.visited.push(mapSelected);
    return go(`s${mapSelected}a`);
  }
  if (a === "admin-b") return go(`s${mapSelected}b`);
  if (a === "admin-results") return go("results");
  if (a === "enter-core") return go("core");
  if (a === "next") {
    const n = +state.scene[1];
    if (firstReady(state, n) || state.settings.adminUnlock) return go(`s${n}b`);
    return;
  }
  if (a === "complete") {
    const n = +state.scene[1];
    if (!completeStage(state, n))
      return toast("관측과 비교 기록을 먼저 완성해 줘.");
    persist();
    tone(true);
    const c = chapters[n - 1];
    return modal(
      "새로운 연구 기록을 찾았어!",
      `<div class="reward-icon">${icon(c.icon, 58)}</div><h3 class="reward-title">${c.record}</h3><p>${c.reward}</p><p class="hint">${n < 5 ? chapters[n].place + "에서 다음 관측을 이어갈 수 있어." : "다섯 기록을 가지고 중앙 코어로 가자."}</p>${btn("탐구 지도로 돌아가기", "map", "primary")}`,
    );
  }
  const m = state.drafts.moon,
    p = state.drafts.phases,
    q = state.drafts.planets,
    r = state.drafts.pattern;
  if (a === "capture-moon") {
    if (!photoReady(m)) return toast("시야와 초점을 조금 더 조절해 줘.");
    m.photo = { x: m.x, y: m.y, zoom: m.zoom, focus: m.focus };
    persist();
    $("#photo-status").textContent = "✓ 관측사진을 노트에 저장했어.";
    refreshNext();
    tone(true);
    return;
  }
  if (a.startsWith("spot-")) {
    const points = [
      [28, 28],
      [65, 30],
      [40, 68],
    ];
    return addSpot(...points[+a.at(-1) - 1]);
  }
  if (a.startsWith("moon-note-")) {
    m.observation = a.endsWith("1")
      ? "밝고 어두운 부분이 보여."
      : "둥글게 움푹 팬 곳이 보여.";
    $("#moon-observation").value = m.observation;
    persist();
    refreshNext();
    return;
  }
  if (a.startsWith("day-")) {
    p.day = +a.slice(4);
    $("#phase-day").value = p.day;
    updatePhase();
    persist();
    return;
  }
  if (a === "capture-phase") {
    if (!p.captures.includes(p.day)) p.captures.push(p.day);
    persist();
    $("#phase-filmstrip").innerHTML = captureStrip(p);
    $("#phase-count").textContent = `${p.captures.length} / 3개 이상 기록`;
    refreshNext();
    return;
  }
  if (a.startsWith("side-")) {
    p.side = a.slice(5);
    persist();
    render();
    return;
  }
  if (a === "reveal-phase") {
    if (!p.original) p.original = { amount: p.amount, side: p.side };
    p.revealed = true;
    persist();
    render();
    return;
  }
  if (a === "overlay-phase") {
    p.overlay = !p.overlay;
    persist();
    render();
    return;
  }
  if (a === "phase-note") {
    p.reflection = "관측에서는 거의 둥근 모습이었어.";
    $("#phase-reflection").value = p.reflection;
    persist();
    refreshNext();
    return;
  }
  if (a === "record-planet") {
    const current = planets.find((x) => x.id === q.selected);
    if (!q.feature || !q.candidate)
      return toast("보이는 특징과 이름 후보를 먼저 골라 줘.");
    if (q.feature !== current.feature || q.candidate !== current.id)
      return toast("모형의 색·무늬·고리를 참고 자료와 다시 비교해 봐.");
    q.records[current.id] = {
      feature: q.feature,
      candidate: q.candidate,
      view: clone(viewMetrics),
      webgl: !!planetViewer?.available,
    };
    persist();
    tone(true);
    toast(`${current.name} 조사 근거를 기록했어.`);
    render();
    return;
  }
  if (a === "solar-note")
    return modal(
      "내 조사 노트 · 태양계 순서 자료",
      `<p>태양에서 가까운 순서로 배치해 줘.</p><div class="order-note">태양 → ${planets.map((p) => p.name).join(" → ")}</div><h3>직접 조사한 근거</h3><ul class="record-list">${
        Object.entries(q.records)
          .map(
            ([id, v]) =>
              `<li><b>${planets.find((p) => p.id === id)?.name}</b> · ${esc(v.feature)}</li>`,
          )
          .join("") ||
        "<li>아직 기록한 근거가 없어. 행성 조사로 돌아가 기록해 줘.</li>"
      }</ul><p class="hint">태양은 별이고, 나머지 8개는 행성이야. 이 모형은 실제 크기·거리 비율과 달라.</p>`,
    );
  if (a === "check-solar") {
    const bad = solarOrder.findIndex((id, i) => q.order[i] !== id);
    $("#solar-feedback").textContent =
      bad === -1
        ? "✓ 태양과 8개 행성이 자료와 일치해!"
        : `${bad === 0 ? "중심" : bad + "번째 자리"}를 순서 자료와 다시 비교해 줘.`;
    refreshNext();
    return;
  }
  if (a === "check-classification") {
    const d = state.drafts.classification,
      bad = bodies.find(
        (b) =>
          d.answers[b.id]?.kind !== b.kind ||
          d.answers[b.id]?.reason !== b.evidence,
      );
    $("#classification-feedback").textContent = bad
      ? `${bad.name}의 과학 자료를 다시 읽어 봐. 빛이 어디서 오는지가 중요한 근거야.`
      : "✓ 네 천체의 주장과 근거가 모두 연결됐어!";
    refreshNext();
    return;
  }
  if (a.startsWith("sky-")) {
    starRegion = a.slice(4);
    updateStarView();
    return;
  }
  if (a === "undo-line") {
    r.lines.pop();
    selectedStar = null;
    persist();
    render();
    return;
  }
  if (a === "cancel-line") {
    selectedStar = null;
    render();
    return;
  }
  if (a === "compare-pattern") {
    if (r.lines.length < 2) return;
    r.original = clone(r.lines);
    r.compared = true;
    r.showReference = true;
    selectedStar = null;
    persist();
    render();
    return;
  }
  if (a === "toggle-reference") {
    r.showReference = !r.showReference;
    persist();
    render();
    return;
  }
  if (a === "pattern-note") {
    r.reflection = "같은 별도 다른 선으로 이을 수 있어.";
    $("#pattern-reflection").value = r.reflection;
    persist();
    refreshNext();
    return;
  }
  if (a === "restore-core") {
    const preview = isPreview(),
      c = preview ? previewCore : state.core;
    if (![1, 2, 3, 4, 5].every((n) => Number(c.connections[n]) === n))
      return toast("각 기록이 필요한 장치와 연결됐는지 확인해 줘.");
    if (Math.abs(c.angle - 180) > 10)
      return toast("보정 링의 바늘을 아래쪽 금빛 기준에 맞춰 줘.");
    if (!preview && !coreReady(state)) return;
    c.restored = true;
    if (!preview) persist();
    tone(true);
    render();
    return modal(
      preview ? "미리보기 · 돔이 열렸어" : "중앙 돔이 다시 열렸어!",
      `<div class="dome-opening"><div></div>${icon("spark", 70)}</div><p>${preview ? "이 장면은 관리자 미리보기야. 실제 완료 기록은 바뀌지 않았어." : `${esc(state.name)}, 네 다섯 관측 기록으로 연구소가 다시 연결됐어.`}</p>${btn("내 연구 결과 보기", "show-results", "primary")}`,
    );
  }
  if (a === "show-results") return go("results");
  if (a === "print") return window.print();
  if (a === "export") {
    const data = {
      title: "별빛 관측 연구소 개인 연구 기록",
      name: state.name,
      exportedAt: new Date().toISOString(),
      completed: completedCount(state),
      restored: state.core.restored,
      evidence: clone(state.evidence),
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "별빛-관측-연구기록.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("연구 기록 파일을 저장했어.");
    return;
  }
}

function selectSite(n) {
  if (n === 0 && completedCount(state) < 5 && !state.settings.adminUnlock)
    return toast("다섯 관측 기록이 모이면 중앙 코어를 열 수 있어.");
  if (n && !stageOpen(state, n))
    return toast("앞선 구역의 연구 기록을 완성하면 열려.");
  mapSelected = n;
  $$(".site-item").forEach((el) =>
    el.classList.toggle("active", +el.dataset.site === n),
  );
  travel(n);
}
function travel(n) {
  mapSelected = n;
  moving = true;
  mapArrived = null;
  updateMapDetail();
  mapViewer.moveTo(n);
}
function addSpot(x, y) {
  const m = state.drafts.moon;
  if (Math.hypot(x - 50, y - 50) > 48) return;
  if (m.spots.some((p) => Math.hypot(x - p.x, y - p.y) < 10))
    return toast("앞에서 고른 곳과 조금 떨어진 표면을 골라 줘.");
  if (m.spots.length === 2) m.spots.shift();
  m.spots.push({ x, y });
  persist();
  render();
}
function updateMoon() {
  const m = state.drafts.moon;
  $("#scope-moon").style.cssText =
    `transform:translate(${m.x}%,${m.y}%) scale(${m.zoom * 0.65});filter:blur(${Math.abs(m.focus - 72) / 9}px)`;
  $("#focus-status").textContent = photoReady(m)
    ? "✓ 선명해! 촬영할 수 있어"
    : "시야와 초점을 조절해 줘";
  $("#capture-moon").disabled = !photoReady(m);
  $("#moon-zoom-value").textContent = m.zoom + "×";
  $("#moon-focus-value").textContent = m.focus;
}
function updatePhase() {
  const p = state.drafts.phases;
  $("#phase-day-value").textContent = p.day + "일째";
  $("#day-label").textContent = p.day + "일째";
  $("#phase-moon").innerHTML = dayMoon(p.day);
}
function updateStarView() {
  const p = state.drafts.pattern,
    b = state.scene === "s5b";
  $("#star-view").innerHTML = starChart({
    lines: b ? p.lines : [],
    reference: b && p.showReference,
    observed: b ? [] : p.observed,
    selected: selectedStar,
    region: starRegion,
  });
  bindStarNodes();
}
function bindStarNodes() {
  const p = state.drafts.pattern;
  $$("[data-star]").forEach((el) => {
    const fn = () => {
      const id = el.dataset.star;
      if (state.scene === "s5a") {
        if (!p.observed.includes(id)) p.observed.push(id);
        selectedStar = id;
        $("#star-observation").textContent =
          `${starNames[id]}를 관찰했어. 주변 별과 어떤 모양을 만들 수 있을까?`;
        $("#observed-count").innerHTML =
          p.observed.length + "<span> / 3개 이상 관찰</span>";
        persist();
        updateStarView();
        refreshNext();
      } else {
        if (selectedStar && selectedStar !== id) {
          if (!p.lines.some((l) => l.includes(selectedStar) && l.includes(id)))
            p.lines.push([selectedStar, id]);
          selectedStar = null;
          persist();
          render();
        } else {
          selectedStar = id;
          updateStarView();
        }
      }
    };
    listen(el, "click", fn);
    listen(el, "keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        fn();
      }
    });
  });
}
function bindControls(id) {
  if (state.scene === "map") {
    if (!stageOpen(state, mapSelected || 1)) mapSelected = 1;
    moving = false;
    mapArrived = null;
    mapViewer = mountMap(
      $("#world-map"),
      state,
      (n) => {
        if (n === null) return;
        mapArrived = n;
        moving = false;
        updateMapDetail();
      },
      selectSite,
    );
    cleanup = () => mapViewer?.dispose();
    $$("[data-site]").forEach((el) =>
      listen(el, "click", () => selectSite(+el.dataset.site)),
    );
    updateMapDetail();
  }
  const m = state.drafts.moon,
    p = state.drafts.phases,
    q = state.drafts.planets,
    r = state.drafts.pattern;
  if (state.scene === "s1a") {
    updateMoon();
    for (const [selector, key] of [
      ["#moon-zoom", "zoom"],
      ["#moon-focus", "focus"],
    ])
      listen($(selector), "input", (e) => {
        m[key] = +e.target.value;
        updateMoon();
        persist();
      });
    const pan = (dx, dy) => {
      m.x = Math.max(-80, Math.min(80, m.x + dx));
      m.y = Math.max(-80, Math.min(80, m.y + dy));
      updateMoon();
      persist();
    };
    $$("[data-pan]").forEach((el) =>
      listen(el, "click", () => {
        const [x, y] = {
          up: [0, -10],
          down: [0, 10],
          left: [-10, 0],
          right: [10, 0],
        }[el.dataset.pan];
        pan(x, y);
      }),
    );
    const scope = $("#telescope");
    let pos = null;
    listen(scope, "pointerdown", (e) => {
      pos = [e.clientX, e.clientY];
      scope.setPointerCapture(e.pointerId);
    });
    listen(scope, "pointermove", (e) => {
      if (!pos) return;
      const rect = scope.getBoundingClientRect();
      pan(
        ((e.clientX - pos[0]) / rect.width) * 100,
        ((e.clientY - pos[1]) / rect.height) * 100,
      );
      pos = [e.clientX, e.clientY];
    });
    listen(scope, "pointerup", () => (pos = null));
    listen(scope, "pointercancel", () => (pos = null));
    listen(scope, "keydown", (e) => {
      const delta = {
        ArrowLeft: [-10, 0],
        ArrowRight: [10, 0],
        ArrowUp: [0, -10],
        ArrowDown: [0, 10],
      }[e.key];
      if (delta) {
        e.preventDefault();
        pan(...delta);
      }
    });
  }
  if (state.scene === "s1b") {
    listen($("#surface-moon"), "click", (e) => {
      const box = e.currentTarget.getBoundingClientRect();
      addSpot(
        ((e.clientX - box.left) / box.width) * 100,
        ((e.clientY - box.top) / box.height) * 100,
      );
    });
    bindText("#moon-observation", m, "observation");
  }
  if (state.scene === "s2a")
    listen($("#phase-day"), "input", (e) => {
      p.day = +e.target.value;
      updatePhase();
      persist();
    });
  if (state.scene === "s2b") {
    listen($("#prediction-amount"), "input", (e) => {
      p.amount = +e.target.value;
      $("#prediction-amount-value").textContent = p.amount + "%";
      $("#prediction-moon").innerHTML = moonSVG(p.amount, p.side);
      persist();
    });
    bindText("#phase-reflection", p, "reflection");
  }
  if (state.scene === "s3a") {
    let disposed = false;
    cleanup = () => {
      disposed = true;
      planetViewer?.dispose();
    };
    import("./planet.js")
      .then(({ mountPlanet }) => {
        if (disposed || id !== renderId) return;
        $("#planet-viewer").innerHTML = "";
        planetViewer = mountPlanet(
          $("#planet-viewer"),
          planets.find((x) => x.id === q.selected),
          (v) => (viewMetrics = v),
        );
        planetViewer.setView(planetRotation, planetZoom);
      })
      .catch(() => {
        if (!disposed)
          $("#planet-viewer").innerHTML =
            '<p class="empty">3D 모형을 불러오지 못했어. 페이지를 다시 열어 줘.</p>';
      });
    $$("[data-planet]").forEach((el) =>
      listen(el, "click", () => {
        q.selected = el.dataset.planet;
        q.feature = "";
        q.candidate = "";
        planetRotation = 0;
        planetZoom = 1;
        persist();
        render();
      }),
    );
    listen($("#planet-feature"), "change", (e) => {
      q.feature = e.target.value;
      persist();
    });
    listen($("#planet-candidate"), "change", (e) => {
      q.candidate = e.target.value;
      persist();
    });
    listen($("#planet-rotation"), "input", (e) => {
      planetRotation = +e.target.value;
      $("#planet-rotation-value").textContent = planetRotation + "°";
      planetViewer?.setView(planetRotation, planetZoom);
    });
    listen($("#planet-zoom"), "input", (e) => {
      planetZoom = +e.target.value;
      $("#planet-zoom-value").textContent = planetZoom + "×";
      planetViewer?.setView(planetRotation, planetZoom);
    });
  }
  if (state.scene === "s3b") {
    function place(i) {
      if (!selectedPiece) {
        if (q.order[i]) {
          q.order[i] = null;
          persist();
          render();
        } else toast("아래 구성원을 먼저 골라 줘.");
        return;
      }
      q.order = q.order.map((v) => (v === selectedPiece ? null : v));
      q.order[i] = selectedPiece;
      selectedPiece = null;
      persist();
      render();
    }
    $$("[data-piece]").forEach((el) => {
      listen(el, "click", () => {
        selectedPiece = el.dataset.piece;
        $$("[data-piece]").forEach((x) =>
          x.classList.toggle("selected", x === el),
        );
      });
      listen(el, "dragstart", (e) => {
        selectedPiece = el.dataset.piece;
        e.dataTransfer.setData("text/plain", selectedPiece);
      });
    });
    $$("[data-slot]").forEach((el) => {
      listen(el, "click", () => place(+el.dataset.slot));
      listen(el, "dragover", (e) => e.preventDefault());
      listen(el, "drop", (e) => {
        e.preventDefault();
        const value = e.dataTransfer.getData("text/plain");
        if (solarOrder.includes(value)) {
          selectedPiece = value;
          place(+el.dataset.slot);
        }
      });
    });
  }
  if (state.scene === "s4a")
    $$("[data-body]").forEach((el) =>
      listen(el, "click", () => {
        const b = bodies.find((x) => x.id === el.dataset.body);
        modal(
          `${b.name} · 과학 자료`,
          `<div class="science-fact"><span class="body-orb" style="--planet:${b.color}"></span><p>${b.info}</p></div><p class="hint">관측 모습: ${b.look}<br>빛이 어디에서 오는지 자료에서 찾았니?</p><button class="btn primary" id="save-body">비교 기록에 담기</button>`,
          () =>
            listen($("#save-body"), "click", () => {
              if (!state.drafts.classification.viewed.includes(b.id))
                state.drafts.classification.viewed.push(b.id);
              persist();
              render();
            }),
        );
      }),
    );
  if (state.scene === "s4b") {
    for (const type of ["kind", "reason"])
      $$(`[data-${type}]`).forEach((el) =>
        listen(el, "change", () => {
          const d = state.drafts.classification.answers,
            b = el.dataset[type];
          d[b] ||= { kind: "", reason: "" };
          d[b][type] = el.value;
          persist();
          refreshNext();
        }),
      );
  }
  if (state.scene === "s5a" || state.scene === "s5b") {
    bindStarNodes();
    bindText("#pattern-reflection", r, "reflection");
  }
  if (state.scene === "core") {
    const c = isPreview() ? previewCore : state.core;
    if (c.restored)
      $$("[data-record], [data-socket], #core-angle").forEach((el) => {
        el.disabled = true;
      });
    $$("[data-record]").forEach((el) =>
      listen(el, "click", () => {
        selectedRecord = +el.dataset.record;
        $$("[data-record]").forEach((x) =>
          x.classList.toggle("selected", x === el),
        );
      }),
    );
    $$("[data-socket]").forEach((el) =>
      listen(el, "click", () => {
        if (!selectedRecord) return toast("왼쪽에서 연구 기록을 먼저 골라 줘.");
        c.connections[+el.dataset.socket] = selectedRecord;
        selectedRecord = null;
        if (!isPreview()) persist();
        render();
      }),
    );
    listen($("#core-angle"), "input", (e) => {
      c.angle = +e.target.value;
      $("#core-angle-value").textContent = c.angle + "°";
      $("#calibration-pointer").style.transform = `rotate(${c.angle}deg)`;
      if (!isPreview()) persist();
    });
  }
}
function bindText(selector, obj, key) {
  listen($(selector), "input", (e) => {
    obj[key] = e.target.value.slice(0, 240);
    persist();
    refreshNext();
  });
}
render();
