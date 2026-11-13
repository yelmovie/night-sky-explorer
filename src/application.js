import { createNarration, mountNarrationControl } from './narration.js';
import { voiceForText } from './voice-lines.js';
import { mountWelcomeVoice } from './welcome-voice.js';
let welcomeCleanup = () => {};
import './styles.css';
import './polish.css';
import './classroom.css';
import { chapters, planets, requiredPlanets, solarOrder, bodies, patternRegions } from './data.js';
import { freshState, clone, load, save, canAccess, firstReady, stageReady, stageOpen, completedCount, completeStage, coreReady, track } from './state.js';
import { esc, icon, moonSVG, dayMoon, starChart } from './drawing.js';
import { button as button, range, celestialImage, planetImage } from './ui.js';
import { conceptArt } from './concept-assets.js';
import { worldMarkup, mountWorld } from './world.js';
import { mountRepair } from './map-repair.js';
import { learningUI, learningView, mountLearning, token } from './learning.js';
import { createSound } from './sound.js';
import { concepts, mountConcept } from './concepts.js';
import { nextTask, hints } from './companion.js';
import { getStageAction } from './progression.js';
import { appInfo, standards, learningObjectives, studentGuide, teacherGuide, sources, abilities, challenges } from './settingsContent.js';
import { missionTag, evidenceTag, restorePercent, npc, npcLine, npcConversation, kitMeter, inquiryStyle, evidenceFact, evidenceVisual, introPanel, movieMarkup, mountMovie } from './quest.js';
import { mountNpcDialogue } from './npc-dialogue.js';
import { bonusQuests, openBonus } from './bonus.js';
import './quest.css';
import { createResearchSession } from './session.js';
import './responsive.css';
import './scenery-surfaces.css';
import './npc-dialogue.css';

const app = document.querySelector('#app');
let storage;
try { storage = window.localStorage; } catch { storage = { getItem() { throw Error('storage'); }, setItem() { throw Error('storage'); } }; }
const session = createResearchSession(storage);
const loaded = session;
let studentSnapshot = null;
let state = loaded.state, cleanup = () => {}, events, modalCleanup = () => {}, modalReturn, modalBack, lastSite = null, hintLevel = 0, toastTimer, selectedRecord;
let previewCore = { connections: {}, angle: 15, restored: false }, lastReplay = null;
const sound = createSound(() => state.settings);
const narration = createNarration({ isMuted: () => state.settings.muted || !state.settings.sfx, duck: value => sound.setDucked(value) });
let modalVoiceCleanup = () => {}, sceneVoiceCleanup = () => {}, previousFeedbackVoice = '';
function clearModalVoice() { modalVoiceCleanup(); modalVoiceCleanup = () => {}; narration.stop(); }
function syncFeedbackVoice(feedback) {
  const line = feedback && voiceForText(feedback.textContent);
  const key = line ? state.scene + ':' + line.id : '';
  narration.stop(); sceneVoiceCleanup(); sceneVoiceCleanup = () => {};
  if (line) sceneVoiceCleanup = mountNarrationControl(app.querySelector('.lesson-help') || feedback.parentElement, line.id, narration, { autoplay: key !== previousFeedbackVoice, compact: true });
  previousFeedbackVoice = key;
}
const $ = selector => app.querySelector(selector);
const on = (element, type, handler) => element?.addEventListener(type, handler, { signal: events.signal });
const reduced = () => state.settings.reducedMotion || matchMedia('(prefers-reduced-motion: reduce)').matches;
function persist() { if (studentSnapshot) return; if (!session.save(state)) { notify(session.warning); showSaveWarning(); } }
function showSaveWarning() { if (!session.warning || document.querySelector('#save-warning')) return; const note = document.createElement('aside'); note.id = 'save-warning'; note.setAttribute('role', 'alert'); note.innerHTML = `<span>${esc(session.warning)}</span><button class="btn" type="button">기록 파일 저장</button>`; note.querySelector('button').onclick = () => action('export'); document.body.append(note); }
function notify(message) { const toast = document.querySelector('#toast'); toast.textContent = message; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 3800); }
function controls() { return `<header class="floating-controls"><nav aria-label="화면 이동">${button(icon('home'), 'home', 'icon-button', 'aria-label="홈"')}${button(icon('back'), 'back', 'icon-button', 'aria-label="이전"')}</nav><nav aria-label="소리와 설정">${button(icon(state.settings.muted ? 'mute' : 'sound'), 'sound', 'icon-button', `aria-label="${state.settings.muted ? '소리 켜기' : '소리 끄기'}" aria-pressed="${state.settings.muted}"`)}${button(icon('settings'), 'settings', 'icon-button', 'aria-label="설정"')}</nav></header>${state.settings.adminUnlock ? '<div class="preview-ribbon">교사 시연 · 자동저장 안 함 · 설정에서 시연 종료</div>' : ''}`; }
function home() { return `<main class="experience home-v2"><div class="room-bg home-background"></div><section class="hero"><img class="hero-logo" src="/assets/logo.webp" alt="별빛 관측 연구소"/><h1 id="screen-title" tabindex="-1">너의 관측으로<br>연구소의 불빛을 켜요.</h1><p class="hero-story">루미와 함께 달을 찾고, 행성을 돌리고,<br>나만의 별 지도를 만들어요.</p><div class="home-cta">${state.started ? '' : '<label class="sr-only" for="nickname">연구원 별명</label><input id="nickname" maxlength="20" placeholder="연구원 별명 (선택)"/>'}${button(state.started ? '탐구 이어 하기' : '루미와 출발하기', 'start', 'primary')}${state.started ? button(`${icon('book')} 연구 키트`, 'kit') : ''}</div><p class="home-progress">${state.started ? `관측 데이터 ${completedCount(state)}/5 · 연구소 복구 ${restorePercent(state)}%` : '다섯 관측 기록으로 중앙 코어를 복구해요.'}</p></section><img class="home-character" src="/assets/home-fox.webp" alt="별여우 연구관"/></main>`; }
function recordMarkup(number, data) {
  if (!data) return '<p>관측을 마치면 이곳에 기록이 남아요.</p>';
  if (number === 1) return `<div class="record-strip">${(data.photos || [data.photo]).filter(Boolean).map(photo => `<div>${moonSVG()}<small>${photo.zoom}배 관측</small></div>`).join('')}</div>${(data.comparisons || [data]).map((card, index) => `<p><b>비교 ${index + 1}</b> · ${esc(card.observation)}</p>`).join('')}`;
  if (number === 2) return `<div class="record-strip">${[...data.captures].sort((first, second) => first - second).map(day => `<div>${dayMoon(day)}<small>${day}일째</small></div>`).join('')}</div>${data.predictions ? [14, 24].map(day => `<p><b>${day}일째 예상 비교</b> · ${esc(data.predictions[day].reflection)}</p>`).join('') : `<p>${esc(data.reflection)}</p>`}`;
  if (number === 3) return `<p>${Object.keys(data.records).map(id => planets.find(planet => planet.id === id)?.name).join(' · ')} 조사</p><div class="record-planet-strip" aria-label="태양에서 가까운 순서">${solarOrder.map(id => `<span>${token(id)}</span>`).join('')}</div><p>그림의 크기와 간격은 실제 비율과 달라요.</p>`;
  if (number === 4) return `<p>${bodies.filter(body => data.answers[body.id]?.kind === body.kind && data.answers[body.id]?.reason === body.evidence).length}개 천체의 이름과 빛의 근원을 연결했어요.</p><div class="record-light-pair"><figure>${celestialImage('sun','태양 모형')}<figcaption>태양 · 별</figcaption></figure><figure>${planetImage('venus','금성 모형')}<figcaption>금성 · 행성</figcaption></figure></div><p>별은 스스로 빛나요. 행성은 태양빛을 반사해요.</p>`;
  if (!data.cases) return `<p>${esc(data.reflection)}</p>`;
  return Object.entries(patternRegions).map(([id, region]) => `<div class="pattern-report">${starChart({ lines: data.cases[id].lines, region: id, interactive: false })}<p>${esc(data.cases[id].reflection)}</p></div>`).join('');
}
const CORE_TARGET = 180;
const activeCore = () => completedCount(state) < 5 ? previewCore : state.core;
const coreConnected = core => chapters.filter(chapter => core.connections[chapter.id] === chapter.id).length;
const coreAligned = core => Math.abs(core.angle - CORE_TARGET) <= 10;
function calibrationStatus(core) {
  if (core.restored) return '보정 완료 · 연구소가 정상으로 돌아왔어요.';
  if (coreConnected(core) < 5) return `다섯 채널을 모두 연결하면 보정 링이 풀려요. (${coreConnected(core)}/5)`;
  return coreAligned(core) ? '정렬 완료! 데이터 흐름이 하나로 맞춰졌어요.' : '링을 손가락으로 돌려 바늘을 아래 금빛 기준에 맞춰요.';
}
function replayMarkup() {
  if (!lastReplay) return '<p class="replay-empty">기록을 채널에 연결하면 그 기록의 핵심 장면이 여기서 재생돼요.</p>';
  const chapter = chapters[lastReplay - 1], data = state.evidence[lastReplay]?.data;
  return `<figure class="replay-card">${evidenceVisual(lastReplay, data)}<figcaption><small>${evidenceTag(lastReplay)} · 핵심 장면</small><b>${chapter.record}</b><span>${evidenceFact(lastReplay, data) || '시연 기록'}</span><em>${chapter.system} 연결 완료</em></figcaption></figure>`;
}
function coreView() {
  const preview = completedCount(state) < 5, core = activeCore(), connected = coreConnected(core), locked = connected < 5 || core.restored, ready = connected === 5 && coreAligned(core);
  const chips = [3, 1, 5, 2, 4].map(number => {
    const used = core.connections[number] === number;
    return button(`${icon(chapters[number - 1].icon)} <span><small>${evidenceTag(number)}</small>${chapters[number - 1].record}</span>${used ? icon('check', 18) : ''}`, 'record-' + number, `record-chip ${selectedRecord === number ? 'selected' : ''} ${used ? 'used' : ''}`, `aria-pressed="${selectedRecord === number}" ${core.restored || used ? 'disabled' : ''}`);
  }).join('');
  const sockets = chapters.map(chapter => {
    const value = core.connections[chapter.id], ok = value === chapter.id;
    return button(`<i class="socket-icon">${icon(chapter.icon, 26)}</i><span><b>${chapter.system}</b><small>${ok ? chapter.record : value ? '다른 기록이 연결됐어요 · 다시 골라요' : '기록 대기 중'}</small></span>${ok ? icon('check', 22) : ''}`, 'socket-' + chapter.id, `socket ${ok ? 'connected' : value ? 'needs-review' : ''} ${lastReplay === chapter.id ? 'just-connected' : ''}`, core.restored ? 'disabled' : '');
  }).join('');
  return `<main class="experience core-v3 core-final"><div class="room-bg"></div><div class="activity-heading"><p>마지막 탐구 · 중앙 관측 코어 재가동${preview ? ' · 교사 시연' : ''}</p><h1 id="screen-title" tabindex="-1">${core.restored ? '중앙 관측 코어가 다시 깨어났어요.' : connected === 5 ? '보정 링을 돌려 데이터 흐름을 맞춰요.' : '연구 키트의 기록을 알맞은 채널에 연결해요.'}</h1></div><div class="core-board"><section class="record-bank"><h2>연구 키트</h2>${chips}<p class="bank-note">기록을 고른 뒤 가운데 채널을 눌러요.</p>${preview ? '' : button(`${icon('book')} 최종 보고서 다시 보기`, 'report', 'ghost')}</section><section class="core-sockets-v3"><div class="core-meter"><span>중앙 코어 연결</span><b>${connected * 20}%</b><div class="meter" role="progressbar" aria-label="중앙 코어 연결" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${connected * 20}"><i style="width:${connected * 20}%"></i></div></div>${sockets}<div id="core-replay" class="core-replay" aria-live="polite">${replayMarkup()}</div></section><aside class="toolbox calibration-panel"><h2>마지막 보정 링</h2><div class="calibration ${locked && !core.restored ? 'is-locked' : ''} ${ready || core.restored ? 'is-aligned' : ''}" id="calibration" role="slider" tabindex="${locked ? -1 : 0}" aria-label="보정 링: 돌려서 바늘을 아래 기준에 맞춰요" aria-valuemin="0" aria-valuemax="360" aria-valuenow="${core.angle}" aria-disabled="${locked}"><img class="calibration-art" src="${conceptArt.coreDial.src}" alt="" aria-hidden="true"/><div id="calibration-pointer" style="transform:rotate(${core.angle}deg)"></div><span class="calibration-target"></span>${locked && !core.restored ? `<span class="calibration-lock">${icon('lock', 28)}</span>` : ''}</div>${range('보정 링', 'core-angle', 0, 360, core.angle, 5, '°')}<p id="calibration-status" role="status">${calibrationStatus(core)}</p>${core.restored ? button('엔딩 영상 다시 보기', 'movie') + button('내 인증서 보기', 'results', 'primary') : button(preview ? '복구 장면 시연' : '중앙 코어 재가동', 'restore', 'primary', `id="restore-core" ${ready ? '' : 'disabled'}`)}${preview ? '<p class="bank-note">시연은 학생의 완료 기록을 만들지 않아요.</p>' : ''}</aside></div></main>`;
}
function recordCards() {
  return chapters.map(chapter => `<article class="report-card ${state.evidence[chapter.id] ? 'is-done' : ''}"><p class="report-tag">${evidenceTag(chapter.id)} · ${state.evidence[chapter.id] ? '확인 완료' : '기록 전'}</p><h2>${chapter.record}</h2>${recordMarkup(chapter.id, state.evidence[chapter.id]?.data)}${state.evidence[chapter.id] ? button('개념영상 다시 보기', 'concept-' + chapter.id) : ''}</article>`).join('');
}
function resultsView() {
  const actual = state.core.restored && completedCount(state) === 5;
  if (!actual) return `<main class="report-page"><h1 id="screen-title" tabindex="-1">쌓여 가는 나의 연구 기록</h1>${kitMeter(state)}<div class="report-grid">${recordCards()}</div><div class="report-actions">${button('기록 파일 저장', 'export')}${button('탐구 지도로', 'map', 'primary')}</div></main>`;
  const style = inquiryStyle(state.stats), date = new Date(state.evidence[5].date).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' });
  const blank = (label, size) => `<label class="cert-field"><input type="text" maxlength="${size}" autocomplete="off" aria-label="${label}"/><span>${label}</span></label>`;
  return `<main class="report-page results-v2"><header class="results-head"><p>탐구 완료 · 관측 시스템 복구</p><h1 id="screen-title" tabindex="-1">너의 관측이 연구소를 밝혔어요.</h1></header><div class="results-layout"><section class="certificate cert-v2" aria-label="별빛 관측 연구원 인증서"><div class="cert-frame"><p class="cert-kicker">과학 세상 · 별빛 관측 연구소</p><h2>별빛 관측 연구원 인증서</h2><div class="cert-fields">${blank('학년', 2)}${blank('반', 2)}${blank('번', 3)}<label class="cert-field cert-name"><span>이름</span><input type="text" maxlength="12" autocomplete="off" aria-label="이름"/></label></div><p class="cert-text">위 연구원은 「별빛 관측 연구소」에서 발생한 관측 데이터 오류를 <b>달 관찰 → 변화 기록 → 행성 조사 → 증거 판별 → 별자리 관찰</b>의 과정을 통해 해결하고, 5개의 연구 결과를 성공적으로 검증하였습니다.</p><dl class="cert-stats"><div><dt>탐구</dt><dd>5 / 5 완료</dd></div><div><dt>관측 기록</dt><dd>5 / 5 확인</dd></div><div><dt>연구소 복구</dt><dd>100%</dd></div><div><dt>탐구 스타일</dt><dd>${style.name}</dd></div></dl><p class="cert-style">${style.text}</p><footer><span>${date}</span><span>연구원 별명 · ${esc(state.name)}</span><span>${appInfo.credit}</span></footer></div></section><aside class="results-side"><p class="privacy-note">학년·반·번호·이름은 출력하기 직전에 적어요. 이 기기에 저장되지 않아요.</p><div class="results-actions">${button(`${icon('download')} 인증서 출력`, 'print', 'primary')}${button(`${icon('book')} 내 관측 기록 보기`, 'records')}${button('엔딩 영상 다시 보기', 'movie')}${button(`${icon('map')} 다시 관측하기`, 'map')}</div><section class="bonus-list"><h2>추가 탐구 <small>선택 도전</small></h2>${Object.entries(bonusQuests).map(([id, quest]) => `<button class="bonus-card ${state.bonus[id] === 'done' ? 'is-done' : ''}" data-action="bonus-${id}"><b>${quest.title}</b><span>${quest.text}</span><small>${state.bonus[id] === 'done' ? `${icon('check', 16)} ${quest.reward} 획득` : `보상 · ${quest.reward}`}</small></button>`).join('')}</section></aside></div><section id="my-records" class="records-section" tabindex="-1"><h2>내 관측 기록 다섯 가지</h2><div class="report-grid">${recordCards()}</div></section><div class="report-actions">${button('기록 파일 저장', 'export')}${button('탐구 지도로', 'map', 'primary')}</div></main>`;
}
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
  clearModalVoice();
  modalCleanup(); modalCleanup = () => {};
  const back = modalBack; modalBack = null;
  if (element?.open) element.close();
  if (modalReturn?.isConnected) modalReturn.focus({ preventScroll: true });
  if (returnToParent && back) queueMicrotask(back);
}
function dialog(title, body, after, footer = '', back = null) {
  narration.stop();
  const element = $('#dialog');
  if (element.open) closeModal(false);
  modalReturn = document.activeElement;
  modalBack = back;
  element.className = 'classroom-dialog';
  element.innerHTML = `<header class="dialog-heading"><h2 id="dialog-title">${title}</h2>${button(icon('close'), 'close-modal', 'icon-button', 'aria-label="닫기"')}</header><div class="dialog-body">${body}</div><footer class="dialog-footer">${footer || button('닫기', 'close-modal', 'primary')}</footer>`;
  bindActions(element);
  element.showModal();
  after?.(element);
  const storyMix = element.matches('.story-dialog, .movie-dialog');
  if (storyMix) sound.setStoryMix(true);
  if (!element.classList.contains('movie-dialog')) {
    const line = voiceForText(element.querySelector('.dialog-body').textContent);
    if (element.querySelector('.npc-conversation')) {
      element.classList.add('npc-scene-dialog');
      modalCleanup = mountNpcDialogue(element, narration, { reduced: reduced(), typewriter: element.classList.contains('story-dialog') });
    }
    if (line) modalVoiceCleanup = mountNarrationControl(element.querySelector('.dialog-footer'), line.id, narration);
  }
  if (storyMix) {
    const cleanup = modalCleanup;
    modalCleanup = () => { cleanup(); sound.setStoryMix(false); };
  }
}
function showConcept(number, back = null, returnLabel = '탐구로 돌아가기') {
  if (!state.evidence[number]) return notify('이 관측을 마친 뒤에 볼 수 있어요.');
  dialog(concepts[number].title, '<div id="concept-host"></div>', () => {
    modalCleanup = mountConcept($('#concept-host'), number, { reduced: reduced(), sound, audible: !state.settings.muted && state.settings.sfx });
    $('#dialog').classList.add('concept-dialog');
  }, button(returnLabel, 'close-modal', 'primary'), back);
}
function kit() {
  track(state, 'reviews'); persist();
  const count = completedCount(state), bonus = Object.entries(bonusQuests).filter(([id]) => state.bonus[id] === 'done');
  const line = count === 5 ? (state.core.restored ? '연구소가 다시 밝아졌어! 네 기록은 언제든 여기서 다시 볼 수 있어.' : '다섯 기록이 모두 모였어! 중앙 관측 코어로 가져가자.') : '네가 만든 관측 기록을 여기에 보관하고 있어. 기록을 눌러 다시 볼 수 있어.';
  dialog('연구 키트 · 관측 자료 모음', `${npcLine('rabbit', line, count === 5 ? 'cheer' : 'write')}${kitMeter(state)}<div class="kit-list">${chapters.map(chapter => { const done = !!state.evidence[chapter.id]; return `<details class="kit-item ${done ? 'is-done' : ''}"><summary><span class="kit-check">${done ? icon('check', 18) : ''}</span><span class="kit-name"><small>${evidenceTag(chapter.id)} · ${missionTag(chapter.id)}</small>${chapter.record}</span><em>${done ? '확인 완료' : '기록 전'}</em></summary><div class="kit-record">${recordMarkup(chapter.id, state.evidence[chapter.id]?.data)}${done ? button('개념영상 보기', 'concept-' + chapter.id) : ''}</div></details>`; }).join('')}</div>${bonus.length ? `<p class="kit-bonus">${icon('spark', 18)} 보너스 보상 · ${bonus.map(([, quest]) => quest.reward).join(' · ')}</p>` : ''}`);
}
const paragraphs = values => values.map(value => `<p>${esc(value)}</p>`).join('');
function settings(openLibrary = false) {
  dialog('연구소 설정', `<label class="toggle-row"><b>배경 음악</b><input id="setting-bgm" type="checkbox" ${state.settings.bgm ? 'checked' : ''}/></label><label class="toggle-row"><b>효과음</b><input id="setting-sfx" type="checkbox" ${state.settings.sfx ? 'checked' : ''}/></label>${range('배경 음악 음량', 'setting-volume', 0, 100, state.settings.bgmVolume, 5, '%')}<label class="toggle-row"><b>동작 줄이기</b><input id="setting-motion" type="checkbox" ${state.settings.reducedMotion ? 'checked' : ''}/></label><details><summary>연구소 이야기 다시 보기</summary><p>연구소의 다섯 관측 데이터 시스템이 서로 맞지 않아요. 직접 관측한 기록으로 연구소를 복구해요.</p>${button('사건 도입 다시 보기', 'story-replay')}</details><details><summary>완료한 개념영상 모아 보기</summary><div class="concept-library">${chapters.map(chapter => `<button class="concept-card" data-action="library-${chapter.id}" ${state.evidence[chapter.id] ? '' : 'disabled'}><img src="/assets/concepts/stage-${chapter.id}.webp" alt=""/><span>${concepts[chapter.id].title}<small>${state.evidence[chapter.id] ? `${concepts[chapter.id].seconds}초 · 다시 보기` : '관측을 마치면 열려요'}</small></span></button>`).join('')}</div></details><details><summary>앱 정보 · 배움과 보상</summary><p>밤하늘을 직접 관찰하고, 예상과 근거를 비교해요.</p><p>다섯 기록을 모아 연구소를 복구하고 나의 탐구 인증서를 받아요.</p><p>처음 예상·관측한 근거·수정한 생각이 연구 노트에 남아요.</p><p>별빛 관측 연구소 v${appInfo.version} · ${appInfo.credit}</p></details><details><summary>학생용 가이드</summary>${paragraphs(studentGuide)}</details><details><summary>교사용 가이드</summary>${paragraphs(teacherGuide)}<details><summary>성취기준</summary><p>2022 개정 교육과정과 연계한 탐구 보조 활동이에요. 이 게임만으로 성취기준 전체 달성을 판단하지 않으며, 수업·토론·후속 평가와 함께 활용해 주세요.</p>${standards.map(([code, text]) => `<p>${code} ${text}</p>`).join('')}</details><details><summary>장별 학습 근거와 오개념</summary><p>교사 현장 검수 전이에요. 기록의 존재와 설명의 과학적 타당성은 구분해 확인해 주세요.</p>${learningObjectives.map(item => `<section><h3>${item.chapter}장 · ${chapters[item.chapter-1].place}</h3><p>${item.standardCodes.join(', ')} · ${item.objective}</p><p><b>살펴볼 기록</b> · ${item.evidence}</p><p><b>함께 확인해요</b> · ${item.misconception}</p><p>${item.boundary}</p></section>`).join('')}</details><details><summary>교사용 도구</summary><p>모든 단계를 임시로 체험해요. 시연 중 조작은 자동저장하지 않고, 시연 종료·새로고침 시 원래 학생 기록으로 돌아가요.</p>${button(state.settings.adminUnlock ? '시연 종료 · 학생 기록으로 돌아가기' : '모든 단계 한 번에 열기', 'unlock', 'secondary', `aria-pressed="${state.settings.adminUnlock}"`)}</details></details><details><summary>이미지·소리·저작권 고지</summary><p>배경과 캐릭터는 제공·생성된 AI 그림이며, 실제 관측사진이 아닌 학습용 모형이에요.</p><p>게임 효과음과 배경 음악은 자체 Web Audio 합성이에요. 개념영상은 게임 그림과 직접 작성한 도형으로 HyperFrames에서 제작했고, 영상 효과음은 Kenney(CC0)예요.</p><p>상세 출처와 라이선스는 assets/CREDITS.md에 기록돼 있어요.</p><details><summary>자료 출처 모아 보기</summary>${sources.map(([name, source]) => `<p><b>${name}</b> · ${source}</p>`).join('')}</details><p>ⓒ 2026 ${appInfo.credit}. All rights reserved.</p><p>자체 제작 화면·일러스트·음원의 복제·재배포·전용·상업적 이용은 별도 이용 조건을 따라요.</p><p>외부 공개 자료의 권리는 각 원저작자에게 있으며 각 자료의 공개 라이선스와 이용 조건을 따라요.</p></details>`, element => {
    if (openLibrary) element.querySelector('.concept-library').closest('details').open = true;
    const volume = element.querySelector('#setting-volume');
    volume.disabled = !state.settings.bgm;
    for (const [id, key] of [['setting-bgm', 'bgm'], ['setting-sfx', 'sfx'], ['setting-motion', 'reducedMotion']]) on(element.querySelector('#' + id), 'change', event => { state.settings[key] = event.target.checked; volume.disabled = !state.settings.bgm; persist(); sound.sync(); });
    on(volume, 'input', event => { state.settings.bgmVolume = +event.target.value; $('#setting-volume-value').textContent = event.target.value + '%'; persist(); sound.sync(); });
  }, `${button('연구 기록 초기화', 'reset', 'secondary')}${button('닫기', 'close-modal', 'primary')}`);
}
function showHint() {
  const sequence = hints(state), index = Math.min(hintLevel, sequence.length - 1);
  dialog('루미의 탐구 힌트', `<div class="hint-story"><img src="/assets/rabbit.webp" alt="달토끼 루미"/><div><p class="hint-step">도움 ${index + 1} / ${sequence.length}</p><p>${sequence[index]}</p></div></div>`, null, `${index < sequence.length - 1 ? button('힌트 하나 더', 'more-hint') : ''}${button('직접 해 보기', 'close-modal', 'primary')}`);
}
function reward(number) {
  const chapter = chapters[number - 1];
  dialog(`${evidenceTag(number)} 확보!`, `${npcConversation('fox', chapter.npc, { pose: number === 5 ? 'cheer' : 'point', emotion: number === 5 ? 'happy' : 'encouraging', lineId: 'reward-' + number })}<details class="dialogue-extra"><summary>${chapter.record} · 연구소의 변화</summary><section class="reward-summary"><div class="reward-symbol">${icon(chapter.icon, 52)}</div><p class="reward-kicker">${missionTag(number)} 완료 · ${chapter.title}</p><h3>${chapter.record}</h3>${kitMeter(state)}</section><div class="world-change"><b>${icon('spark', 18)} 연구소 변화</b><p>${chapter.worldChange}</p></div></details>`, null, `${button(`개념영상 ${concepts[number].seconds}초 보기 (선택)`, 'reward-video-' + number)}${button('탐구 지도', 'map')}${button(number < 5 ? '다음 미션으로' : completedCount(state) === 5 ? '중앙 관측실로' : '다른 관측 찾기', 'continue-stage-' + number, 'primary')}`);
}
function showIntro(step = 0, replay = false) {
  const panel = introPanel(step, state.name), last = step === 2;
  dialog(panel.title, `<div class="story-panel" data-step="${step}">${panel.body}</div><p class="story-dots" aria-label="${step + 1} / 3 장면">${[0, 1, 2].map(index => `<i class="${index === step ? 'on' : ''}"></i>`).join('')}</p>`, element => element.classList.add('story-dialog'), `${last ? '' : button('건너뛰기', replay ? 'close-modal' : 'story-done')}${button(last ? (replay ? '닫기' : '첫 관측실로 출발') : '다음', last ? (replay ? 'close-modal' : 'story-done') : `story-next-${step + 1}-${replay ? 1 : 0}`, 'primary')}`, replay ? null : finishIntro);
}
function finishIntro() { state.intro = true; persist(); go(canAccess(state, state.resume) ? state.resume : 'map'); }
function finalReport() {
  track(state, 'reviews');
  const first = !state.core.reportSeen;
  state.core.reportSeen = true; persist();
  dialog('최종 관측 보고서', `${npcLine('fox', npc.report, 'map')}<div class="final-report">${chapters.map(chapter => `<details><summary><span class="report-index">${String(chapter.id).padStart(2, '0')}</span><span class="report-name">${chapter.record}<small>${evidenceFact(chapter.id, state.evidence[chapter.id]?.data)}</small></span><em class="verified">${icon('check', 16)} 확인</em></summary><div class="report-record">${recordMarkup(chapter.id, state.evidence[chapter.id]?.data)}</div></details>`).join('')}</div><p class="bank-note">항목을 누르면 내가 만든 실제 기록을 다시 볼 수 있어요.</p>`, null, button(first ? '중앙 코어 연결 시작' : '코어로 돌아가기', 'close-modal', 'primary'));
}
let movie = null;
function showMovie() {
  const preview = completedCount(state) < 5;
  sound.play('success');
  dialog('엔딩 · 연구소 복구', movieMarkup(state), element => {
    element.classList.add('movie-dialog');
    const skip = element.querySelector('#movie-skip');
    movie = mountMovie(element, {
      reduced: reduced(),
      onScene(index) {
        if (index !== 4) return;
        modalVoiceCleanup = mountNarrationControl(element.querySelector('.dialog-footer'), 'ending', narration);
      },
      onEnd() { skip?.remove(); element.querySelector('#movie-done')?.focus({ preventScroll: true }); },
    });
    on(skip, 'click', () => movie?.next());
    modalCleanup = () => { movie?.dispose(); movie = null; };
  }, `<button class="btn" id="movie-skip">${reduced() ? '다음 장면' : '건너뛰기'}</button>${preview ? button('시연 닫기', 'close-modal', 'primary', 'id="movie-done"') : button('인증서 받기', 'results', 'primary', 'id="movie-done"')}`, preview ? null : () => go('results'));
}
function challenge(number) {
  const challenge = challenges[number];
  dialog('한 걸음 더 · 선택 도전', `<p>${challenge.question}</p><div class="challenge-choices">${challenge.options.map((option, index) => button(option, `answer-${number}-${index}`)).join('')}</div>`);
}
function go(scene) {
  if (!canAccess(state, scene)) return notify('앞선 관측을 먼저 마쳐 주세요.');
  if (scene !== state.scene) { if(learningUI.playback){learningUI.playback.playing=false;learningUI.playback.step=0;learningUI.playback.finished=false;} learningUI.round = 0; learningUI.body = 0; learningUI.selectedStar = null; learningUI.overlayVisible = false; learningUI.piece = null; learningUI.inspectedBody = null; learningUI.pendingAdvance = null; hintLevel = 0; }
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
  if (!name.startsWith('concept-') && !name.startsWith('reward-video-')) sound.play(name === 'complete' ? 'success' : name.includes('hint') ? 'hint' : 'click');
  if (name === 'close-modal') return closeModal();
  if (name === 'home') return go('home');
  if (name === 'back') return go(state.scene === 'home' ? 'home' : state.scene === 'map' ? 'home' : state.scene.endsWith('b') ? state.scene.slice(0, 2) + 'a' : 'map');
  if (name === 'map' || name === 'results') return go(name);
  if (name === 'sound') { state.settings.muted = !state.settings.muted; persist(); sound.sync(); render(); return; }
  if (name === 'settings') return settings();
  if (name === 'start') { if (!state.started) state.name = $('#nickname')?.value.trim() || '별빛 연구원'; state.started = true; if (!state.intro && completedCount(state) === 0) { persist(); return showIntro(0); } state.intro = true; return go(canAccess(state, state.resume) ? state.resume : 'map'); }
  if (name === 'kit' || name === 'notebook') return kit();
  if (name.startsWith('story-next-')) { const [, , step, replay] = name.split('-'); return showIntro(+step, replay === '1'); }
  if (name === 'story-done') return finishIntro();
  if (name === 'story-replay') return showIntro(0, true);
  if (name === 'report') return finalReport();
  if (name === 'movie') return showMovie();
  if (name === 'records') { const records = $('#my-records'); records?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' }); records?.focus({ preventScroll: true }); return; }
  if (name.startsWith('bonus-')) return openBonus(name.slice(6), { state, dialog, persist, sound, on });
  if (name === 'hint') { track(state, 'hints'); persist(); return showHint(); }
  if (name === 'more-hint') { hintLevel++; track(state, 'hints'); persist(); return showHint(); }
  if (name.startsWith('activity-round-')) {
    const next = getStageAction(state, learningUI.round);
    if (!next || next.disabled || next.action !== name || next.round === undefined) return;
    if(learningUI.playback){learningUI.playback.playing=false;learningUI.playback.step=0;learningUI.playback.finished=false;}
    learningUI.round = next.round; learningUI.body = 0; learningUI.selectedStar = null; learningUI.piece = null; learningUI.overlayVisible = false; learningUI.inspectedBody = null; learningUI.pendingAdvance = null;
    render(); window.scrollTo(0, 0); $('#screen-title')?.focus({ preventScroll: true }); return;
  }
  if (name.startsWith('continue-stage-')) {
    const number = +name.split('-').at(-1);
    if (state.scene !== `s${number}b` || !state.evidence[number]) return;
    return go(number < 5 ? (canAccess(state, `s${number + 1}a`) ? `s${number + 1}a` : 'map') : completedCount(state) === 5 ? 'core' : 'map');
  }
  if (name === 'next') { const number = +state.scene[1]; if (firstReady(state, number)) return go(`s${number}b`); }
  if (name === 'complete') { const number = +state.scene[1]; if (!completeStage(state, number)) return notify('루미의 안내를 보고 남은 기록을 완성해 주세요.'); persist(); return reward(number); }
  if (name.startsWith('reward-video-')) { const number = +name.split('-').at(-1); return showConcept(number, () => reward(number), '완료 화면으로'); }
  if (name.startsWith('library-')) return showConcept(+name.split('-')[1], () => settings(true), '영상 목록으로');
  if (name.startsWith('concept-')) return showConcept(+name.split('-')[1], state.scene === 'results' ? null : kit, state.scene === 'results' ? '내 연구 결과로' : '연구 키트로');
  if (name === 'unlock') { if (studentSnapshot) { state = studentSnapshot; studentSnapshot = null; } else { studentSnapshot = clone(state); state = clone(state); state.settings.adminUnlock = true; previewCore = { connections: {}, angle: 15, restored: false }; } if (!canAccess(state, state.scene)) state.scene = 'map'; if (!canAccess(state, state.resume)) state.resume = 'map'; persist(); render(); return settings(); }
  if (name === 'reset' && studentSnapshot) return notify('시연을 끝낸 뒤 학생 기록을 초기화할 수 있어요.');
  if (name === 'reset') return dialog('연구 기록을 초기화할까요?', '<p>별명·진행·보상·관찰 기록이 새로 시작해요. 이전 기록은 이 브라우저에 복구용으로 보관하고 소리 설정은 남아요.</p>', element => element.querySelector('[data-action="close-modal"]').focus(), `${button('취소', 'close-modal', 'primary')}${button('기록 지우기', 'confirm-reset', 'danger')}`);
  if (name === 'confirm-reset') { if (studentSnapshot || !session.backup()) { showSaveWarning(); return notify(session.warning || '먼저 시연을 끝내 주세요.'); } const settings = { ...state.settings, adminUnlock: false }; state = freshState(); state.settings = settings; lastSite = null; persist(); render(); return; }
  if (name.startsWith('record-')) { const number = +name.split('-')[1]; if (activeCore().connections[number] === number) return; selectedRecord = selectedRecord === number ? null : number; render(); return; }
  if (name.startsWith('socket-')) {
    const core = activeCore(), socket = +name.split('-')[1];
    if (core.restored) return;
    if (!selectedRecord) return notify('왼쪽 연구 키트에서 기록을 먼저 골라 주세요.');
    if (selectedRecord !== socket) {
      track(state, 'retries'); selectedRecord = null; persist(); render(); sound.play('retry');
      return notify(`${chapters[socket - 1].system}에는 다른 기록이 필요해요. 고른 기록이 어느 관측실에서 만들어졌는지 다시 봐요.`);
    }
    core.connections[socket] = socket; lastReplay = socket; selectedRecord = null; sound.play('discover'); persist(); render();
    if (coreConnected(core) === 5) notify('다섯 채널이 모두 연결됐어요! 이제 보정 링을 돌려요.');
    return;
  }
  if (name === 'restore') {
    const core = activeCore();
    if (coreConnected(core) < 5 || !coreAligned(core)) return notify('채널 연결과 보정 링의 아래쪽 기준을 확인해 주세요.');
    if (completedCount(state) < 5) return showMovie();
    if (!coreReady(state)) return notify('채널 연결과 보정 링의 아래쪽 기준을 확인해 주세요.');
    state.core.restored = true; lastReplay = null; persist(); render();
    return showMovie();
  }
  if (name.startsWith('challenge-')) return challenge(+name.split('-')[1]);
  if (name.startsWith('answer-')) { const [, number, answer] = name.split('-').map((value, index) => index ? +value : value); const correct = answer === challenges[number].answer; if (correct) { state.challengeAnswers[number] = 'correct'; if (state.evidence[number]) state.evidence[number].challengeAnswer = 'correct'; persist(); sound.play('success'); } else sound.play('retry'); return dialog(correct ? '탐구 표식을 얻었어요!' : '근거를 다시 살펴봐요.', `<p>${correct ? challenges[number].takeaway : challenges[number].hint}</p>`, null, correct ? button('지도에서 확인', 'map', 'primary') : button('다시 도전', 'challenge-' + number, 'primary')); }
  if (name === 'export') { const anchor = document.createElement('a'); const url = URL.createObjectURL(new Blob([JSON.stringify(studentSnapshot || state, null, 2)], { type: 'application/json' })); anchor.href = url; anchor.download = '별빛-연구기록.json'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 500); }
  if (name === 'print') { document.body.classList.add('print-certificate'); addEventListener('afterprint', () => document.body.classList.remove('print-certificate'), { once: true }); window.print(); }
}
function render() {
  narration.stop(); sceneVoiceCleanup(); sceneVoiceCleanup = () => {};
  welcomeCleanup(); welcomeCleanup = () => {};
  closeModal(false); cleanup(); events?.abort(); events = new AbortController();
  document.body.classList.toggle('reduce-motion', reduced());
  const learning = /^s[1-5][ab]$/.test(state.scene);
  app.innerHTML = (learning ? learningView(state, controls()) : controls() + (state.scene === 'home' ? home() : state.scene === 'map' ? worldMarkup(state) : state.scene === 'core' ? coreView() : resultsView())) + '<dialog id="dialog" aria-labelledby="dialog-title"></dialog>';
  on($('#dialog'), 'cancel', event => { event.preventDefault(); closeModal(); });
  if (state.scene === 'home') welcomeCleanup = mountWelcomeVoice(app.querySelector('.hero'), { caption: '밤하늘 탐험에 온 걸 환영해! 달과 별, 행성을 자세히 살펴보고, 관찰한 특징을 기록하며 우주의 단서를 찾아보자.', isMuted: () => state.settings.muted || !state.settings.sfx, duck: value => sound.setDucked(value) });
  bindActions(app);
  cleanup = () => {};
  if (learning) cleanup = mountLearning(app, { state, save: persist, render, notify, dialog, on, refresh, sound, onFeedback: syncFeedbackVoice });
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
    // 지도 복구 작업대: 탐구를 마친 구역만 직접 복구(보상 상호작용, 학습 판정과 분리). 교사 시연은 저장하지 않는다.
    mountRepair($('#world'), { state, save: persist, kind: 'focus', preview: state.settings.adminUnlock, available: chapters.filter(c => state.settings.adminUnlock || state.evidence[c.id]).map(c => ({ id: c.id - 1, label: c.place })) });
    cleanup = () => world.dispose();
  }
  if (state.scene === 'core') mountCalibration();
  syncFeedbackVoice(app.querySelector('#planet-feedback, #classification-feedback'));
  refresh(); sound.sync();
  if (state.scene === 'core' && completedCount(state) === 5 && !state.core.restored && !state.core.reportSeen) finalReport();
}
function mountCalibration() {
  const core = activeCore(), dial = $('#calibration'), input = $('#core-angle'), locked = () => coreConnected(core) < 5 || core.restored;
  input.disabled = locked();
  const set = (angle, keep) => {
    core.angle = ((Math.round(angle / 5) * 5) % 360 + 360) % 360;
    input.value = core.angle; $('#core-angle-value').textContent = core.angle + '°';
    $('#calibration-pointer').style.transform = `rotate(${core.angle}deg)`;
    dial.setAttribute('aria-valuenow', core.angle);
    const ready = !locked() && coreAligned(core);
    dial.classList.toggle('is-aligned', ready);
    $('#calibration-status').textContent = calibrationStatus(core);
    if ($('#restore-core')) $('#restore-core').disabled = !ready;
    if (keep) persist();
  };
  const pointerAngle = event => { const box = dial.getBoundingClientRect(); return Math.atan2(event.clientX - box.left - box.width / 2, box.top + box.height / 2 - event.clientY) * 180 / Math.PI; };
  let drag = null;
  on(input, 'input', event => set(+event.target.value, true));
  // The ring turns by the change in finger angle, so a tap alone never jumps the needle.
  on(dial, 'pointerdown', event => { if (locked()) return notify(calibrationStatus(core)); event.preventDefault(); drag = { previous: pointerAngle(event), raw: core.angle }; if (event.pointerType === 'mouse') dial.setPointerCapture(event.pointerId); dial.classList.add('is-turning'); });
  on(dial, 'pointermove', event => { if (!drag) return; const now = pointerAngle(event); let delta = now - drag.previous; if (delta > 180) delta -= 360; if (delta < -180) delta += 360; drag.previous = now; drag.raw += delta; set(drag.raw); });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) on(dial, type, () => { if (!drag) return; drag = null; dial.classList.remove('is-turning'); persist(); if (coreAligned(core) && !locked()) sound.play('place'); });
  on(dial, 'keydown', event => { const step = { ArrowRight: 5, ArrowUp: 5, ArrowLeft: -5, ArrowDown: -5 }[event.key]; if (step && !locked()) { event.preventDefault(); set(core.angle + step, true); } });
}
document.addEventListener('pointerdown', () => sound.start());
render();
if (loaded.warning) { notify(loaded.warning); showSaveWarning(); }
