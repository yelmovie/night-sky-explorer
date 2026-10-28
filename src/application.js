import './styles.css';
import './polish.css';
import './classroom.css';
import { chapters, planets, requiredPlanets, solarOrder, bodies, patternRegions } from './data.js';
import { freshState, clone, load, save, canAccess, firstReady, stageReady, stageOpen, completedCount, completeStage, coreReady } from './state.js';
import { esc, icon, moonSVG, dayMoon, starChart } from './drawing.js';
import { button as button, range, celestialImage, planetImage } from './ui.js';
import { conceptArt } from './concept-assets.js';
import { worldMarkup, mountWorld } from './world.js';
import { learningUI, learningView, mountLearning, token } from './learning.js';
import { createSound } from './sound.js';
import { concepts, mountConcept } from './concepts.js';
import { nextTask, hints, companionMarkup } from './companion.js';
import { getStageAction } from './progression.js';
import { appInfo, standards, studentGuide, teacherGuide, sources, abilities, challenges } from './settingsContent.js';

const app = document.querySelector('#app');
let storage;
try { storage = window.localStorage; } catch { storage = { getItem() { throw Error('storage'); }, setItem() { throw Error('storage'); } }; }
const loaded = load(storage);
let state = loaded.state, cleanup = () => {}, events, modalCleanup = () => {}, modalReturn, modalBack, lastSite = null, hintLevel = 0, toastTimer, selectedRecord;
let previewCore = { connections: {}, angle: 15, restored: false };
const sound = createSound(() => state.settings);
const $ = selector => app.querySelector(selector);
const on = (element, type, handler) => element?.addEventListener(type, handler, { signal: events.signal });
const reduced = () => state.settings.reducedMotion || matchMedia('(prefers-reduced-motion: reduce)').matches;
function persist() { if (!save(storage, state)) notify('이 기기에 저장하지 못했어요. 결과에서 기록 파일을 저장해 주세요.'); }
function notify(message) { const toast = document.querySelector('#toast'); toast.textContent = message; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 3800); }
function controls() { return `<header class="floating-controls"><nav aria-label="화면 이동">${button(icon('home'), 'home', 'icon-button', 'aria-label="홈"')}${button(icon('back'), 'back', 'icon-button', 'aria-label="이전"')}</nav><nav aria-label="소리와 설정">${button(icon(state.settings.muted ? 'mute' : 'sound'), 'sound', 'icon-button', `aria-label="${state.settings.muted ? '소리 켜기' : '소리 끄기'}" aria-pressed="${state.settings.muted}"`)}${button(icon('settings'), 'settings', 'icon-button', 'aria-label="설정"')}</nav></header>${state.settings.adminUnlock ? '<div class="preview-ribbon">교사 시연 · 완료 기록과 별개</div>' : ''}`; }
function home() { return `<main class="experience home-v2"><div class="room-bg home-background"></div><section class="hero"><img class="hero-logo" src="/assets/logo.png" alt="별빛 관측 연구소"/><h1 id="screen-title" tabindex="-1">너의 관측으로<br>연구소의 불빛을 켜요.</h1><p class="hero-story">루미와 함께 달을 찾고, 행성을 돌리고,<br>나만의 별 지도를 만들어요.</p><div class="home-cta">${state.started ? '' : '<label class="sr-only" for="nickname">연구원 별명</label><input id="nickname" maxlength="20" placeholder="연구원 별명 (선택)"/>'}${button(state.started ? '탐구 이어하기' : '루미와 출발하기', 'start', 'primary')}${state.started ? button('내 연구 노트', 'notebook') : ''}</div><p class="home-progress">다섯 관측 기록으로 중앙 코어를 복구해요. ${state.started ? `${completedCount(state)}/5 완료` : ''}</p></section><img class="home-character" src="/assets/fox.png" alt="별여우 연구관"/></main>`; }
function recordMarkup(number, data) {
  if (!data) return '<p>관측을 마치면 이곳에 기록이 남아요.</p>';
  if (number === 1) return `<div class="record-strip">${(data.photos || [data.photo]).filter(Boolean).map(photo => `<div>${moonSVG()}<small>${photo.zoom}배 관측</small></div>`).join('')}</div>${(data.comparisons || [data]).map((card, index) => `<p><b>비교 ${index + 1}</b> · ${esc(card.observation)}</p>`).join('')}`;
  if (number === 2) return `<div class="record-strip">${[...data.captures].sort((first, second) => first - second).map(day => `<div>${dayMoon(day)}<small>${day}일째</small></div>`).join('')}</div>${data.predictions ? [14, 24].map(day => `<p><b>${day}일째 예상 비교</b> · ${esc(data.predictions[day].reflection)}</p>`).join('') : `<p>${esc(data.reflection)}</p>`}`;
  if (number === 3) return `<p>${Object.keys(data.records).map(id => planets.find(planet => planet.id === id)?.name).join(' · ')} 조사</p><div class="record-planet-strip" aria-label="태양에서 가까운 순서">${solarOrder.map(id => `<span>${token(id)}</span>`).join('')}</div><p>그림의 크기와 간격은 실제 비율과 달라요.</p>`;
  if (number === 4) return `<p>${bodies.filter(body => data.answers[body.id]?.kind === body.kind && data.answers[body.id]?.reason === body.evidence).length}개 천체의 이름과 빛의 근원을 연결했어요.</p><div class="record-light-pair"><figure>${celestialImage('sun','태양 모형')}<figcaption>태양 · 별</figcaption></figure><figure>${planetImage('venus','금성 모형')}<figcaption>금성 · 행성</figcaption></figure></div><p>별은 스스로 빛나요. 행성은 태양빛을 반사해요.</p>`;
  if (!data.cases) return `<p>${esc(data.reflection)}</p>`;
  return Object.entries(patternRegions).map(([id, region]) => `<div class="pattern-report">${starChart({ lines: data.cases[id].lines, region: id, interactive: false })}<p>${esc(data.cases[id].reflection)}</p></div>`).join('');
}
function coreView() {
  const preview = completedCount(state) < 5, core = preview ? previewCore : state.core;
  return `<main class="experience core-v3"><div class="room-bg"></div><div class="activity-heading"><p>중앙 관측 코어${preview ? ' · 시연' : ''}</p><h1 id="screen-title" tabindex="-1">기록을 장치에 연결해 연구소를 깨워요.</h1></div><div class="core-board"><section class="record-bank"><h2>내 관측 기록</h2>${[3, 1, 5, 2, 4].map(number => button(`${icon(chapters[number - 1].icon)} ${chapters[number - 1].record}`, 'record-' + number, `record-chip ${selectedRecord === number ? 'selected' : ''}`, `aria-pressed="${selectedRecord === number}" ${core.restored ? 'disabled' : ''}`)).join('')}</section><section class="core-sockets-v3"><h2>기록이 필요한 장치</h2>${chapters.map(chapter => button(`${icon(chapter.icon)} <span>${chapter.system}<small>${core.connections[chapter.id] ? chapters[core.connections[chapter.id] - 1].record : '기록을 골라 연결해요'}</small></span>${core.connections[chapter.id] === chapter.id ? icon('check') : ''}`, 'socket-' + chapter.id, `socket ${core.connections[chapter.id] === chapter.id ? 'connected' : ''}`, core.restored ? 'disabled' : '')).join('')}</section><aside class="toolbox"><h2>마지막 보정</h2><div class="calibration"><img class="calibration-art" src="${conceptArt.coreDial.src}" alt="" aria-hidden="true"/><div id="calibration-pointer" style="transform:rotate(${core.angle}deg)"></div><span class="calibration-target"></span></div>${range('보정 링', 'core-angle', 0, 360, core.angle, 5, '°')}<p>바늘을 아래 금빛 기준에 맞춰요.</p>${button(core.restored ? '내 연구 결과' : '중앙 코어 복구', core.restored ? 'results' : 'restore', 'primary')}${preview ? '<p>시연은 학생의 완료 기록을 만들지 않아요.</p>' : ''}</aside></div></main>`;
}
function resultsView() { const actual = state.core.restored && completedCount(state) === 5; return `<main class="report-page"><h1 id="screen-title" tabindex="-1">${actual ? '너의 관측이 연구소를 밝혔어요.' : '쌓여 가는 나의 연구 기록'}</h1>${actual ? `<section class="certificate"><p>별빛 관측 연구소 · 탐구 인증서</p><h2 class="student-name">${esc(state.name)}</h2><p>관찰하고 비교하며 근거를 찾은 별빛 연구원</p><small>${new Date(state.evidence[5].date).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })} · 기획·제작 ${appInfo.credit}</small></section>` : ''}<div class="report-grid">${chapters.map(chapter => `<article class="report-card"><h2>${chapter.record}</h2>${recordMarkup(chapter.id, state.evidence[chapter.id]?.data)}${state.evidence[chapter.id] ? button('개념영상 다시 보기', 'concept-' + chapter.id) : ''}</article>`).join('')}</div><div class="report-actions">${button('기록 파일 저장', 'export')}${actual ? button('인증서·기록 인쇄', 'print') : ''}${button('탐구 지도로', 'map', 'primary')}</div></main>`; }
function refresh() {
  const next = getStageAction(state, learningUI.round), nextButton = $('#stage-next');
  if (nextButton && next) {
    nextButton.textContent = next.label;
    nextButton.dataset.action = next.action;
    nextButton.disabled = next.disabled;
  }
  if ($('#completion-hint')) $('#completion-hint').textContent = nextTask(state);
  if ($('#companion-task')) $('#companion-task').textContent = nextTask(state);
}
function bindActions(root) { root.querySelectorAll('[data-action]').forEach(element => on(element, 'click', () => action(element.dataset.action))); }
function closeModal(returnToParent = true) {
  const element = $('#dialog');
  if (!element?.open) return;
  modalCleanup(); modalCleanup = () => {};
  const back = modalBack; modalBack = null;
  if (element?.open) element.close();
  if (modalReturn?.isConnected) modalReturn.focus({ preventScroll: true });
  if (returnToParent && back) queueMicrotask(back);
}
function dialog(title, body, after, footer = '', back = null) {
  const element = $('#dialog');
  if (element.open) closeModal(false);
  modalReturn = document.activeElement;
  modalBack = back;
  element.className = 'classroom-dialog';
  element.innerHTML = `<header class="dialog-heading"><h2 id="dialog-title">${title}</h2>${button(icon('close'), 'close-modal', 'icon-button', 'aria-label="닫기"')}</header><div class="dialog-body">${body}</div><footer class="dialog-footer">${footer || button('닫기', 'close-modal', 'primary')}</footer>`;
  bindActions(element);
  element.showModal();
  after?.(element);
}
function showConcept(number, back = null, returnLabel = '탐구로 돌아가기') {
  if (!state.evidence[number]) return notify('이 관측을 마친 뒤에 볼 수 있어요.');
  dialog(concepts[number].title, '<div id="concept-host"></div>', () => {
    modalCleanup = mountConcept($('#concept-host'), number, { reduced: reduced(), sound });
    $('#dialog').classList.add('concept-dialog');
  }, button(returnLabel, 'close-modal', 'primary'), back);
}
function notebook() { dialog('나의 연구 노트', chapters.map(chapter => `<details><summary>${chapter.record} · ${state.evidence[chapter.id] ? '완료' : '기록 전'}</summary>${recordMarkup(chapter.id, state.evidence[chapter.id]?.data)}${state.evidence[chapter.id] ? button('개념영상 보기', 'concept-' + chapter.id) : ''}</details>`).join('')); }
const paragraphs = values => values.map(value => `<p>${esc(value)}</p>`).join('');
function settings(openLibrary = false) {
  dialog('연구소 설정', `<label class="toggle-row"><b>배경 음악</b><input id="setting-bgm" type="checkbox" ${state.settings.bgm ? 'checked' : ''}/></label><label class="toggle-row"><b>효과음</b><input id="setting-sfx" type="checkbox" ${state.settings.sfx ? 'checked' : ''}/></label>${range('배경 음악 음량', 'setting-volume', 0, 100, state.settings.bgmVolume, 5, '%')}<label class="toggle-row"><b>동작 줄이기</b><input id="setting-motion" type="checkbox" ${state.settings.reducedMotion ? 'checked' : ''}/></label><details><summary>연구소 이야기 다시 보기</summary><p>뒤섞인 관측 기록을 모아 연구소의 불빛을 되찾아요. 달토끼 루미가 함께 걸으며 탐구를 도와줘요.</p></details><details><summary>완료한 개념영상 모아 보기</summary><div class="concept-library">${chapters.map(chapter => `<button class="concept-card" data-action="library-${chapter.id}" ${state.evidence[chapter.id] ? '' : 'disabled'}><img src="/assets/concepts/stage-${chapter.id}.webp" alt=""/><span>${concepts[chapter.id].title}<small>${state.evidence[chapter.id] ? '10초 · 다시 보기' : '관측을 마치면 열려요'}</small></span></button>`).join('')}</div></details><details><summary>앱 정보 · 배움과 보상</summary><p>밤하늘을 직접 관찰하고, 예상과 근거를 비교해요.</p><p>다섯 기록을 모아 연구소를 복구하고 나의 탐구 인증서를 받아요.</p><p>처음 예상·관측한 근거·수정한 생각이 연구 노트에 남아요.</p><p>별빛 관측 연구소 v${appInfo.version} · ${appInfo.credit}</p></details><details><summary>학생용 가이드</summary>${paragraphs(studentGuide)}</details><details><summary>교사용 가이드</summary>${paragraphs(teacherGuide)}<details><summary>성취기준</summary><p>2022 개정 교육과정과 연계한 탐구 보조 활동이에요. 이 게임만으로 성취기준 전체 달성을 판단하지 않으며, 수업·토론·후속 평가와 함께 활용해 주세요.</p>${standards.map(([code, text]) => `<p>${code} ${text}</p>`).join('')}</details><details><summary>교사용 도구</summary><p>모든 단계의 화면을 열어요. 실제 완료·보상 기록은 채워지지 않아요.</p>${button(state.settings.adminUnlock ? '모두 열림 · 다시 누르면 닫기' : '모든 단계 한 번에 열기', 'unlock', 'secondary', `aria-pressed="${state.settings.adminUnlock}"`)}</details></details><details><summary>이미지·소리·저작권 고지</summary><p>배경과 캐릭터는 제공·생성된 AI 그림이며, 실제 관측사진이 아닌 학습용 모형이에요.</p><p>효과음은 Kenney Interface Sounds(CC0), 배경 음악은 자체 Web Audio 합성이에요. 개념영상은 직접 작성한 도형을 FFmpeg로 제작했어요.</p><p>상세 출처와 라이선스는 assets/CREDITS.md에 기록돼 있어요.</p><details><summary>자료 출처 모아 보기</summary>${sources.map(([name, source]) => `<p><b>${name}</b> · ${source}</p>`).join('')}</details><p>ⓒ 2026 ${appInfo.credit}. All rights reserved.</p><p>자체 제작 화면·일러스트·음원의 복제·재배포·전용·상업적 이용은 별도 이용 조건을 따라요.</p><p>외부 공개 자료의 권리는 각 원저작자에게 있으며 각 자료의 공개 라이선스와 이용 조건을 따라요.</p></details>`, element => {
    if (openLibrary) element.querySelector('.concept-library').closest('details').open = true;
    const volume = element.querySelector('#setting-volume');
    volume.disabled = !state.settings.bgm;
    for (const [id, key] of [['setting-bgm', 'bgm'], ['setting-sfx', 'sfx'], ['setting-motion', 'reducedMotion']]) on(element.querySelector('#' + id), 'change', event => { state.settings[key] = event.target.checked; volume.disabled = !state.settings.bgm; persist(); sound.sync(); });
    on(volume, 'input', event => { state.settings.bgmVolume = +event.target.value; $('#setting-volume-value').textContent = event.target.value + '%'; persist(); sound.sync(); });
  }, `${button('연구 기록 초기화', 'reset', 'secondary')}${button('닫기', 'close-modal', 'primary')}`);
}
function showHint() {
  const sequence = hints(state), index = Math.min(hintLevel, sequence.length - 1);
  dialog('루미의 탐구 힌트', `<div class="hint-story"><img src="/assets/rabbit.png" alt="달토끼 루미"/><div><p class="hint-step">도움 ${index + 1} / ${sequence.length}</p><p>${sequence[index]}</p></div></div>`, null, `${index < sequence.length - 1 ? button('힌트 하나 더', 'more-hint') : ''}${button('직접 해 보기', 'close-modal', 'primary')}`);
}
function reward(number) {
  const chapter = chapters[number - 1];
  dialog('관측 기록을 완성했어요!', `<section class="reward-summary"><div class="reward-symbol">${icon(chapter.icon, 52)}</div><h3>${chapter.record}</h3><p>${chapter.reward}</p></section>`, null, `${button('개념영상 10초 보기 (선택)', 'reward-video-' + number)}${button('탐구 지도', 'map')}${button(number < 5 ? '다음 관측으로' : completedCount(state) === 5 ? '중앙 코어로' : '다른 관측 찾기', 'continue-stage-' + number, 'primary')}`);
}
function challenge(number) {
  const challenge = challenges[number];
  dialog('한 걸음 더 · 선택 도전', `<p>${challenge.question}</p><div class="challenge-choices">${challenge.options.map((option, index) => button(option, `answer-${number}-${index}`)).join('')}</div>`);
}
function go(scene) {
  if (!canAccess(state, scene)) return notify('앞선 관측을 먼저 마쳐 주세요.');
  if (scene !== state.scene) { learningUI.round = 0; learningUI.body = 0; learningUI.selectedStar = null; learningUI.overlayVisible = false; learningUI.piece = null; learningUI.inspectedBody = null; learningUI.pendingAdvance = null; hintLevel = 0; }
  state.scene = scene;
  if (/^s[1-5][ab]$/.test(scene)) {
    lastSite = +scene[1];
    if (!state.visited.includes(lastSite)) state.visited.push(lastSite);
  }
  if (scene !== 'home') state.resume = scene;
  persist(); render(); window.scrollTo(0, 0); $('#screen-title')?.focus({ preventScroll: true });
}
function action(name) {
  sound.start();
  if (!name.startsWith('concept-') && !name.startsWith('reward-video-')) sound.play(name === 'complete' || name === 'restore' ? 'success' : name.includes('hint') ? 'hint' : 'click');
  if (name === 'close-modal') return closeModal();
  if (name === 'home') return go('home');
  if (name === 'back') return go(state.scene === 'home' ? 'home' : state.scene === 'map' ? 'home' : state.scene.endsWith('b') ? state.scene.slice(0, 2) + 'a' : 'map');
  if (name === 'map' || name === 'results') return go(name);
  if (name === 'sound') { state.settings.muted = !state.settings.muted; persist(); sound.sync(); render(); return; }
  if (name === 'settings') return settings();
  if (name === 'start') { if (!state.started) state.name = $('#nickname')?.value.trim() || '별빛 연구원'; state.started = true; return go(canAccess(state, state.resume) ? state.resume : 'map'); }
  if (name === 'notebook') return notebook();
  if (name === 'hint') return showHint();
  if (name === 'more-hint') { hintLevel++; return showHint(); }
  if (name.startsWith('activity-round-')) {
    const next = getStageAction(state, learningUI.round);
    if (!next || next.disabled || next.action !== name || next.round === undefined) return;
    learningUI.round = next.round; learningUI.body = 0; learningUI.selectedStar = null; learningUI.piece = null; learningUI.overlayVisible = false; learningUI.inspectedBody = null; learningUI.pendingAdvance = null;
    render(); window.scrollTo(0, 0); $('#screen-title')?.focus({ preventScroll: true }); return;
  }
  if (name.startsWith('continue-stage-')) {
    const number = +name.split('-').at(-1);
    if (state.scene !== `s${number}b` || !state.evidence[number]) return;
    return go(number < 5 ? `s${number + 1}a` : completedCount(state) === 5 ? 'core' : 'map');
  }
  if (name === 'next') { const number = +state.scene[1]; if (firstReady(state, number)) return go(`s${number}b`); }
  if (name === 'complete') { const number = +state.scene[1]; if (!completeStage(state, number)) return notify('루미의 안내를 보고 남은 기록을 완성해 주세요.'); persist(); return reward(number); }
  if (name.startsWith('reward-video-')) { const number = +name.split('-').at(-1); return showConcept(number, () => reward(number), '완료 화면으로'); }
  if (name.startsWith('library-')) return showConcept(+name.split('-')[1], () => settings(true), '영상 목록으로');
  if (name.startsWith('concept-')) return showConcept(+name.split('-')[1], state.scene === 'results' ? null : notebook, state.scene === 'results' ? '내 연구 결과로' : '연구 노트로');
  if (name === 'unlock') { state.settings.adminUnlock = !state.settings.adminUnlock; if (!canAccess(state, state.scene)) state.scene = 'map'; if (!canAccess(state, state.resume)) state.resume = 'map'; persist(); render(); return settings(); }
  if (name === 'reset') return dialog('연구 기록을 초기화할까요?', '<p>별명·진행·보상·관찰 기록이 이 기기에서 지워져요. 소리 설정은 남아요.</p>', element => element.querySelector('[data-action="close-modal"]').focus(), `${button('취소', 'close-modal', 'primary')}${button('기록 지우기', 'confirm-reset', 'danger')}`);
  if (name === 'confirm-reset') { const settings = { ...state.settings, adminUnlock: false }; state = freshState(); state.settings = settings; lastSite = null; persist(); render(); return; }
  if (name.startsWith('record-')) { selectedRecord = +name.split('-')[1]; render(); return; }
  if (name.startsWith('socket-')) {
    if (!selectedRecord) return notify('왼쪽에서 기록을 먼저 골라 주세요.');
    const core = completedCount(state) < 5 ? previewCore : state.core;
    core.connections[+name.split('-')[1]] = selectedRecord; selectedRecord = null; persist(); render(); return;
  }
  if (name === 'restore') {
    if (completedCount(state) < 5) return notify('시연에서는 기록을 만들지 않아요. 실제 관측 기록 다섯 개를 모아 주세요.');
    if (!coreReady(state)) return notify('연결한 기록과 보정 링의 아래쪽 기준을 확인해 주세요.');
    state.core.restored = true; persist();
    return dialog('연구소에 별빛이 돌아왔어요!', '<img class="ending-art" src="/assets/generated/dome-restored.webp" alt="불빛이 돌아온 연구소"/><p>네가 관찰하고 비교한 다섯 기록이 연구소를 되살렸어요.</p>', null, button('내 탐구 인증서 보기', 'results', 'primary'));
  }
  if (name.startsWith('challenge-')) return challenge(+name.split('-')[1]);
  if (name.startsWith('answer-')) { const [, number, answer] = name.split('-').map((value, index) => index ? +value : value); const correct = answer === challenges[number].answer; if (correct) { state.challengeAnswers[number] = 'correct'; if (state.evidence[number]) state.evidence[number].challengeAnswer = 'correct'; persist(); sound.play('success'); } return dialog(correct ? '탐구 표식을 얻었어요!' : '근거를 다시 살펴봐요.', `<p>${correct ? challenges[number].takeaway : challenges[number].hint}</p>`, null, correct ? button('지도에서 확인', 'map', 'primary') : button('다시 도전', 'challenge-' + number, 'primary')); }
  if (name === 'export') { const anchor = document.createElement('a'); const url = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })); anchor.href = url; anchor.download = '별빛-연구기록.json'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 500); }
  if (name === 'print') window.print();
}
function render() {
  closeModal(false); cleanup(); events?.abort(); events = new AbortController();
  document.body.classList.toggle('reduce-motion', reduced());
  const learning = /^s[1-5][ab]$/.test(state.scene);
  app.innerHTML = controls() + (state.scene === 'home' ? home() : state.scene === 'map' ? worldMarkup(state) : learning ? learningView(state) + companionMarkup(state) : state.scene === 'core' ? coreView() : resultsView()) + '<dialog id="dialog" aria-labelledby="dialog-title"></dialog>';
  on($('#dialog'), 'cancel', event => { event.preventDefault(); closeModal(); });
  bindActions(app);
  cleanup = () => {};
  if (learning) cleanup = mountLearning(app, { state, save: persist, render, notify, dialog, on, refresh, sound });
  if (state.scene === 'map') {
    const world = mountWorld($('#world'), state, { lastSite, onHint: showHint, onStatus: message => message === 'retry' ? render() : notify(message), onSite: number => {
      if (number ? !stageOpen(state, number) : completedCount(state) < 5 && !state.settings.adminUnlock) return notify('앞선 관측을 마치면 이 문이 열려요.');
      lastSite = number;
      if (!state.settings.adminUnlock && (!number || !state.evidence[number])) return go(number ? `s${number}${firstReady(state, number) ? 'b' : 'a'}` : 'core');
      const chapter = chapters[number - 1];
      dialog(chapter ? chapter.place : '중앙 관측 코어', `<p>${chapter ? chapter.goal : '다섯 관측 기록을 장치에 연결해 연구소를 복구해요.'}</p>`, element => {
        on(element.querySelector('#enter-room'), 'click', () => { if (number && !state.visited.includes(number)) state.visited.push(number); go(number ? `s${number}a` : 'core'); });
        if (number) on(element.querySelector('#enter-second'), 'click', () => go(`s${number}b`));
      }, `${number && state.evidence[number] ? button('선택 도전', 'challenge-' + number) : ''}${number && state.settings.adminUnlock ? '<button class="btn secondary" id="enter-second">비교 활동 시연</button>' : ''}<button class="btn primary" id="enter-room">${chapter ? '관측 시작' : '코어 열기'}</button>`);
    } });
    cleanup = () => world.dispose();
  }
  if (state.scene === 'core') on($('#core-angle'), 'input', event => { const core = completedCount(state) < 5 ? previewCore : state.core; core.angle = +event.target.value; $('#core-angle-value').textContent = core.angle + '°'; $('#calibration-pointer').style.transform = `rotate(${core.angle}deg)`; persist(); });
  refresh(); sound.sync();
}
document.addEventListener('pointerdown', () => sound.start());
render();
if (loaded.warning) notify(loaded.warning);
