import { createNarration, mountNarrationControl } from './narration.js';
import { voiceForText, voiceLines } from './voice-lines.js';
import { mountWelcomeVoice } from './welcome-voice.js';
let welcomeCleanup = () => {};
import './styles-1.css';
import './styles-2.css';
import './styles-3.css';
import './polish.css';
import './classroom.css';
import './flow.css';
import './concept-art.css';
import { chapters, planets, solarOrder, bodies, patternRegions } from './data.js';
import { freshState, clone, load, save, canAccess, firstReady, stageOpen, completedCount, completeStage, coreReady, track } from './state.js';
import { esc, icon, moonSVG, dayMoon, starChart } from './drawing.js';
import { button, range, celestialImage, planetImage, token, recordBadge } from './ui.js';
import { conceptArt } from './concept-assets.js';
import { learningUI } from './learning-ui.js';
import { loadMapScreen, loadObservationScreen, waitForScreen } from './screen-loaders.js';
import './screen-loading.css';
import { createSound } from './sound.js';
import { concepts, mountConcept } from './concepts.js';
import { nextTask, hints } from './companion.js';
import { getStageAction } from './progression.js';
import { appInfo, standards, learningObjectives, studentGuide, teacherGuide, sources, challenges } from './settingsContent.js';
import { missionTag, evidenceTag, restorePercent, npc, npcLine, npcConversation, kitMeter, inquiryStyle, evidenceFact, evidenceVisual, introPanel, movieMarkup, mountMovie } from './quest.js';
import { mountNpcDialogue } from './npc-dialogue.js';
import { films, filmMarkup, mountFilm } from './films.js';
import { bonusQuests, openBonus } from './bonus.js';
import './quest.css';
import './moon-run.css';
import { createResearchSession } from './session.js';
import './responsive.css';
import './scenery-surfaces.css';
import './npc-dialogue.css';
import './flow-refresh.css';
import './design-refresh.css';
import './certificate-handwriting.css';
import {saveCertificatePng} from './certificate-png.js';

const app = document.querySelector('#app');
let storage;
try { storage = window.localStorage; } catch { storage = { getItem() { throw Error('storage'); }, setItem() { throw Error('storage'); } }; }
const session = createResearchSession(storage);
const loaded = session;
let studentSnapshot = null;
let pendingRestoration = [];
let state = loaded.state, cleanup = () => {}, events, modalCleanup = () => {}, modalReturn, modalBack, lastSite = null, hintLevel = 0, toastTimer, selectedRecord;
let mapScreen, observationScreen, screenFailure = null;
const retryScene = history.state?.starlightRetryScene;
if (retryScene) {
  const { starlightRetryScene, ...rest } = history.state;
  history.replaceState(rest, '');
  if (canAccess(state, retryScene)) state.scene = retryScene;
}
let previewCore = { connections: {}, angle: 15, restored: false }, lastReplay = null;
const sound = createSound(() => state.settings);
// 목소리(대사·내레이션·악당 음성·개념 자막 음성)는 효과음과 따로 「목소리」 스위치를 따른다. 꺼져 있으면 글만 보이고 「음성 없음」 시간으로 돈다.
const voiceOff = () => state.settings.muted || !state.settings.voice;
// 헤더 소리 버튼은 전체 켜기·끄기다. 배경 음악·효과음·목소리 중 하나라도 들리면 「끄기」, 모두 꺼져 있으면 「켜기」.
const anyAudible = () => !state.settings.muted && (state.settings.bgm || state.settings.sfx || state.settings.voice);
const narration = createNarration({ isMuted: voiceOff, duck: value => sound.setDucked(value) });
let modalVoiceCleanup = () => {}, sceneVoiceCleanup = () => {}, previousFeedbackVoice = '';
function clearModalVoice() { modalVoiceCleanup(); modalVoiceCleanup = () => {}; narration.stop(); }
// 지도 악당 말풍선: 같은 글의 별빛 가림이 음성. 다른 인물의 음성이 나오는 중이면 끊지 않는다.
function villainVoice(text) {
  const line = voiceLines.find(item => item.id.startsWith('villain-') && item.text === text);
  const busy = ['loading', 'playing'].includes(narration.state.status) && !String(narration.state.id).startsWith('villain-');
  if (line && !busy) narration.play(line.id);
}
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
// 설정 창에서 스위치를 바꾸면 화면을 다시 그리지 않고 헤더 소리 버튼의 그림·이름만 맞춘다.
function syncSoundButton() { const toggle = app.querySelector('.floating-controls [data-action="sound"]'); if (!toggle) return; const audible = anyAudible(); toggle.innerHTML = icon(audible ? 'sound' : 'mute'); toggle.setAttribute('aria-label', audible ? '소리 끄기' : '소리 켜기'); toggle.setAttribute('aria-pressed', String(!audible)); }
function controls() { return `<header class="floating-controls"><nav aria-label="화면 이동">${button(icon('home'), 'home', 'icon-button', 'aria-label="홈"')}${button(icon('back'), 'back', 'icon-button', 'aria-label="이전"')}</nav><nav aria-label="연구 키트와 설정">${state.scene === 'map' ? button(icon('book'), 'kit', 'icon-button', 'aria-label="연구 키트 열기" title="연구 키트 열기"') : ''}${state.scene === 'map' && mapScreen ? mapScreen.rewardSlotsHtml(state.mapHits) : ''}${button(icon(anyAudible() ? 'sound' : 'mute'), 'sound', 'icon-button', `aria-label="${anyAudible() ? '소리 끄기' : '소리 켜기'}" aria-pressed="${!anyAudible()}"`)}${button(icon('settings'), 'settings', 'icon-button', 'aria-label="설정"')}</nav></header>${state.settings.adminUnlock ? '<div class="preview-ribbon">교사 시연 · 자동저장 안 함 · 설정에서 시연 종료</div>' : ''}`; }
function home() { return `<main class="experience home-v2 home-title"><div class="room-bg home-background"></div><section class="hero"><h1 class="hero-title-art" id="screen-title" tabindex="-1"><img class="hero-logo" src="/assets/logo.webp" alt="별빛 관측 연구소" width="1200" height="400"/></h1><div class="home-cta">${button(state.started ? '새로 시작' : '시작하기', 'new-start', 'primary')}${button('이어 하기', 'home-continue', 'secondary', state.started ? '' : 'disabled')}</div></section><img class="home-character" src="/assets/home-fox.webp" alt="별여우 연구관"/><p class="home-credit">${appInfo.credit}</p></main>`; }
function recordMarkup(number, data) {
  if (!data) return '<p>관측을 마치면 이곳에 기록이 남아요.</p>';
  if (number === 1) return `<div class="record-strip">${(data.photos || [data.photo]).filter(Boolean).map(photo => `<div>${moonSVG()}<small>${photo.zoom}배 관측</small></div>`).join('')}</div>${(data.comparisons || [data]).map((card, index) => `<p><b>비교 ${index + 1}</b> · ${esc(card.observation)}</p>`).join('')}`;
  if (number === 2) return `<div class="record-strip">${[...data.captures].sort((first, second) => first - second).map(day => `<div>${dayMoon(day)}<small>${day}일째</small></div>`).join('')}</div>${data.predictions ? [14, 24].map(day => `<p><b>${day}일째 예상 비교</b> · ${esc(data.predictions[day].reflection)}</p>`).join('') : `<p>${esc(data.reflection)}</p>`}`;
  if (number === 3) return `<p>${Object.keys(data.records).map(id => planets.find(planet => planet.id === id)?.name).join(' · ')} 조사</p><div class="record-planet-strip" aria-label="태양에서 가까운 순서">${solarOrder.map(id => `<span>${token(id)}</span>`).join('')}</div><p>그림의 크기와 간격은 실제 비율과 달라요.</p>`;
  if (number === 4) return `<p>${bodies.filter(body => data.answers[body.id]?.kind === body.kind && data.answers[body.id]?.reason === body.evidence).length}개 천체의 이름과 빛의 근원을 연결했어요.</p><div class="record-light-pair"><figure>${celestialImage('sun','태양 모형')}<figcaption>태양 · 별</figcaption></figure><figure>${planetImage('venus','금성 모형')}<figcaption>금성 · 행성</figcaption></figure></div><p>별은 스스로 빛나요. 달과 행성은 태양빛을 반사해요.</p>${data.lightTrial?.prediction ? `<p><b>가림판 실험</b> · 내 예상: ${data.lightTrial.prediction==='darker'?'어두워짐':'그대로 밝음'}<br>가림: ${data.lightTrial.observations.includes('covered')?'반사광이 사라짐':'미관측'} · 치움: ${data.lightTrial.observations.includes('uncovered')?'반사광이 돌아옴':'미관측'}</p>` : ''}`;
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
  return coreAligned(core) ? '정렬 완료! 데이터 흐름이 하나로 맞춰졌어요.' : '링을 끌거나 아래 버튼·방향키로 돌려 바늘을 금빛 기준에 맞춰요.';
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
    return button(`${recordBadge(number, 40)} <span><small>${evidenceTag(number)}</small>${chapters[number - 1].record}</span>${used ? icon('check', 18) : ''}`, 'record-' + number, `record-chip ${selectedRecord === number ? 'selected' : ''} ${used ? 'used' : ''}`, `aria-pressed="${selectedRecord === number}" ${core.restored || used ? 'disabled' : ''}`);
  }).join('');
  const sockets = chapters.map(chapter => {
    const value = core.connections[chapter.id], ok = value === chapter.id;
    return button(`${recordBadge(chapter.id, 40)}<span><b>${chapter.system}</b><small>${ok ? chapter.record : value ? '다른 기록이 연결됐어요 · 다시 골라요' : '기록 대기 중'}</small></span>${ok ? icon('check', 22) : ''}`, 'socket-' + chapter.id, `socket ${ok ? 'connected' : value ? 'needs-review' : ''} ${lastReplay === chapter.id ? 'just-connected' : ''}`, core.restored ? 'disabled' : '');
  }).join('');
  return `<main class="experience core-v3 core-final"><div class="room-bg"></div><div class="activity-heading"><p>마지막 탐구 · 중앙 관측 코어 재가동${preview ? ' · 교사 시연' : ''}</p><h1 id="screen-title" tabindex="-1">${core.restored ? '중앙 관측 코어가 다시 깨어났어요.' : connected === 5 ? '보정 링을 돌려 데이터 흐름을 맞춰요.' : '연구 키트의 기록을 알맞은 채널에 연결해요.'}</h1></div><div class="core-board"><section class="record-bank"><h2>연구 키트</h2>${chips}<p class="bank-note sr-only">기록을 고른 뒤 가운데 채널을 눌러요.</p>${preview ? '' : button(`${icon('book')} 최종 보고서 다시 보기`, 'report', 'ghost')}</section><section class="core-sockets-v3"><div class="core-meter"><span>중앙 코어 연결</span><b>${connected * 20}%</b><div class="meter" role="progressbar" aria-label="중앙 코어 연결" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${connected * 20}"><i style="width:${connected * 20}%"></i></div></div>${sockets}<div id="core-replay" class="core-replay" aria-live="polite">${replayMarkup()}</div></section><aside class="toolbox calibration-panel"><h2>마지막 보정 링</h2><div class="calibration ${locked && !core.restored ? 'is-locked' : ''} ${ready || core.restored ? 'is-aligned' : ''}" id="calibration" role="slider" tabindex="${locked ? -1 : 0}" aria-label="보정 링: 돌려서 바늘을 아래 기준에 맞춰요" aria-valuemin="0" aria-valuemax="360" aria-valuenow="${core.angle}" aria-disabled="${locked}"><img class="calibration-art" src="${conceptArt.coreDial.src}" alt="" aria-hidden="true"/><div id="calibration-pointer" style="transform:rotate(${core.angle}deg)"></div><span class="calibration-target"></span>${locked && !core.restored ? `<span class="calibration-lock">${icon('lock', 28)}</span>` : ''}</div><div class="calibration-step-controls" role="group" aria-label="한 번 눌러 보정 링 돌리기"><button type="button" class="btn secondary" data-core-step="-5" ${locked ? 'disabled' : ''}>왼쪽 5°</button><button type="button" class="btn secondary" data-core-step="5" ${locked ? 'disabled' : ''}>오른쪽 5°</button></div><div class="sr-only sr-only-focusable">${range('보정 링', 'core-angle', 0, 360, core.angle, 5, '°')}</div><p id="calibration-status" role="status">${calibrationStatus(core)}</p>${core.restored ? button('엔딩 영상 다시 보기', 'movie') + button('내 인증서 보기', 'results', 'primary') : button(preview ? '복구 장면 시연' : '중앙 코어 재가동', 'restore', 'primary', `id="restore-core" ${ready ? '' : 'disabled'}`)}${preview ? '<p class="bank-note">시연은 학생의 완료 기록을 만들지 않아요.</p>' : ''}</aside></div></main>`;
}
function recordCards() {
  return chapters.map(chapter => `<article class="report-card ${state.evidence[chapter.id] ? 'is-done' : ''}"><p class="report-tag">${evidenceTag(chapter.id)} · ${state.evidence[chapter.id] ? '확인 완료' : '기록 전'}</p><h2>${chapter.record}</h2>${recordMarkup(chapter.id, state.evidence[chapter.id]?.data)}${state.evidence[chapter.id] ? button('개념영상 다시 보기', 'concept-' + chapter.id) : ''}</article>`).join('');
}
function resultsView() {
  const actual = state.core.restored && completedCount(state) === 5;
  if (!actual) return `<main class="report-page"><h1 id="screen-title" tabindex="-1">쌓여 가는 나의 연구 기록</h1>${kitMeter(state)}<div class="report-grid">${recordCards()}</div><div class="report-actions">${button('기록 파일 저장', 'export')}${button('탐구 지도로', 'map', 'primary')}</div></main>`;
  const style = inquiryStyle(state.stats), date = new Date(state.evidence[5].date).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' });
  const blank=(field,label)=>`<span class="cert-field"><span class="cert-blank" data-cert-blank="${field}" aria-label="${label} 적는 빈칸"></span><span>${label}</span></span>`;
  return `<main class="report-page results-v2"><header class="results-head"><p>탐구 완료 · 관측 시스템 복구</p><h1 id="screen-title" tabindex="-1">너의 관측이 연구소를 밝혔어요.</h1></header><div class="results-layout"><section class="certificate cert-v2 has-art cert-paper" id="starlight-certificate" aria-label="별빛 관측 연구원 인증서"><img class="cert-background" src="/assets/ui/cert-frame.webp" alt=""><div class="cert-frame cert-content"><p class="cert-kicker">과학 세상 · 별빛 관측 연구소</p><h2 class="cert-title">별빛 관측 연구원 인증서</h2><div class="cert-fields"><div class="cert-school-row">${blank('school','학교')}${blank('grade','학년')}${blank('class','반')}${blank('number','번')}</div><div class="cert-name-row"><span>이름</span><span class="cert-blank" data-cert-blank="name" aria-label="이름 적는 빈칸"></span></div></div><p class="cert-text">위 연구원은 「별빛 관측 연구소」에서 발생한 관측 데이터 오류를 <b>달 관찰 → 변화 기록 → 행성 조사 → 증거 판별 → 별자리 관찰</b>의 과정을 통해 해결하고, 연구 결과를 성공적으로 검증하였습니다.</p><dl class="cert-stats"><div><dt>탐구 스타일</dt><dd>${style.name}</dd></div></dl><p class="cert-style">${style.text}</p><footer><span>${date}</span><span>${appInfo.credit}</span></footer></div></section><aside class="results-side"><p class="privacy-note">인쇄한 뒤 학교·반·번호·이름을 직접 적어요.</p><div class="results-actions">${button(`${icon('download')} 인증서 인쇄 / PDF 저장`, 'print', 'primary')}${button('PNG 저장','certificate-png','primary')}${button(`${icon('book')} 내 관측 기록 보기`, 'records')}${button('엔딩 영상 다시 보기', 'movie')}${button(`${icon('map')} 다시 관측하기`, 'map')}</div><section class="bonus-list"><h2>추가 탐구 <small>선택 도전</small></h2>${Object.entries(bonusQuests).map(([id, quest]) => `<button class="bonus-card ${state.bonus[id] === 'done' ? 'is-done' : ''}" data-action="bonus-${id}"><b>${quest.title}</b><span>${quest.text}</span><small>${state.bonus[id] === 'done' ? `${icon('check', 16)} ${quest.reward} 획득` : `보상 · ${quest.reward}`}</small></button>`).join('')}</section></aside></div><section id="my-records" class="records-section" tabindex="-1"><h2>내 관측 기록 다섯 가지</h2><div class="report-grid">${recordCards()}</div></section><div class="report-actions">${button('기록 파일 저장', 'export')}</div></main>`;
}
function refresh() {
  const next = getStageAction(state, learningUI.round), nextButton = $('#stage-next');
  if (nextButton && next) {
    nextButton.textContent = next.label;
    nextButton.dataset.action = next.action;
    nextButton.disabled = next.disabled;
    const reason = $('#stage-next-reason');
    if (reason) { reason.textContent = next.reason || ''; reason.hidden = !next.reason; }
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
  narration.stop({ spareVillain: true }); // 지도 악당 대사는 끝까지 두고, 창의 안내 음성이 그 뒤로 미뤄진다(narration.js)
  const element = $('#dialog');
  if (element.open) closeModal(false);
  modalReturn = document.activeElement;
  modalBack = back;
  element.className = 'classroom-dialog';
  element.innerHTML = `<header class="dialog-heading"><h2 id="dialog-title">${title}</h2>${button(icon('close'), 'close-modal', 'icon-button', 'aria-label="닫기"')}</header><div class="dialog-body">${body}</div><footer class="dialog-footer">${footer || button('닫기', 'close-modal', 'primary')}</footer>`;
  bindActions(element);
  element.showModal();
  after?.(element);
  // One way out: when the footer already has a close button, the header X is the same action twice.
  // Full-screen views (concept film, moon run, ending movie) keep their X as the exit.
  const footerClose = element.querySelector('.dialog-footer [data-action="close-modal"]'), headerClose = element.querySelector('.dialog-heading [data-action="close-modal"]');
  if (footerClose && headerClose && !element.matches('.concept-dialog,.moon-run-dialog,.movie-dialog')) {
    const hadFocus = document.activeElement === headerClose;
    headerClose.remove();
    if (hadFocus) footerClose.focus({ preventScroll: true });
  }
  // 엔딩·인트로 영상 창은 대사가 영상 안에 있으므로 「다시 듣기」를 붙이지 않는다(소리 겹침 방지).
  if (!element.matches('.movie-dialog,.film-dialog')) {
    const line = voiceForText(element.querySelector('.dialog-body').textContent);
    if (element.querySelector('.npc-conversation')) {
      element.classList.add('npc-scene-dialog');
      modalCleanup = mountNpcDialogue(element, narration, { reduced: reduced(), typewriter: element.classList.contains('story-dialog') });
    }
    if (line) modalVoiceCleanup = mountNarrationControl(element.querySelector('.dialog-footer'), line.id, narration);
  }
}
function showConcept(number, back = null, returnLabel = '탐구로 돌아가기') {
  if (!state.evidence[number]) return notify('이 관측을 마친 뒤에 볼 수 있어요.');
  dialog(concepts[number].title, '<div id="concept-host"></div>', () => {
    modalCleanup = mountConcept($('#concept-host'), number, { reduced: reduced(), sound, audible: !state.settings.muted && state.settings.sfx, volume: (state.settings.sfxVolume ?? 100) / 100, narration });
    $('#dialog').classList.add('concept-dialog');
  }, button(returnLabel, 'close-modal', 'primary'), back);
}
function kit() {
  track(state, 'reviews'); persist();
  const count = completedCount(state), bonus = Object.entries(bonusQuests).filter(([id]) => state.bonus[id] === 'done');
  const line = count === 5 ? (state.core.restored ? '연구소가 다시 밝아졌어! 네 기록은 언제든 여기서 다시 볼 수 있어.' : '다섯 기록이 모두 모였어! 중앙 관측 코어로 가져가자.') : '네가 만든 관측 기록을 여기에 보관하고 있어. 기록을 눌러 다시 볼 수 있어.';
  dialog('연구 키트 · 관측 자료 모음', `${npcLine('rabbit', line, count === 5 ? 'cheer' : 'write')}${kitMeter(state)}<div class="kit-list">${chapters.map(chapter => { const done = !!state.evidence[chapter.id]; return `<details class="kit-item ${done ? 'is-done' : ''}"><summary><span class="kit-check">${recordBadge(chapter.id, 40)}</span><span class="kit-name"><small>${evidenceTag(chapter.id)} · ${missionTag(chapter.id)}</small>${chapter.record}</span><em>${done ? '확인 완료' : '기록 전'}</em></summary><div class="kit-record">${recordMarkup(chapter.id, state.evidence[chapter.id]?.data)}${done ? button('개념영상 보기', 'concept-' + chapter.id) : ''}</div></details>`; }).join('')}</div>${bonus.length ? `<p class="kit-bonus">${icon('spark', 18)} 보너스 보상 · ${bonus.map(([, quest]) => quest.reward).join(' · ')}</p>` : ''}`);
}
const paragraphs = values => values.map(value => `<p>${esc(value)}</p>`).join('');
function settings(openLibrary = false) {
  const unlocked=state.core.restored||state.settings.adminUnlock;
  dialog('설정', `<div data-science-settings><div class="science-settings-body"><section class="science-settings-audio" aria-label="소리와 화면 설정"><label class="toggle-row"><b>배경 음악</b><input id="setting-bgm" type="checkbox" role="switch" ${state.settings.bgm ? 'checked' : ''}/></label><label class="settings-star-volume setting-row" for="setting-volume"><b>배경 음악 음량</b><input type="range" id="setting-volume" min="0" max="100" step="5" value="${state.settings.bgmVolume}"><output id="setting-volume-value" for="setting-volume">${state.settings.bgmVolume}%</output></label><label class="toggle-row"><b>효과음</b><input id="setting-sfx" type="checkbox" role="switch" ${state.settings.sfx ? 'checked' : ''}/></label><label class="settings-star-volume setting-row" for="setting-sfx-volume"><b>효과음 크기</b><input type="range" id="setting-sfx-volume" min="0" max="100" step="5" value="${state.settings.sfxVolume}"><output id="setting-sfx-volume-value" for="setting-sfx-volume">${state.settings.sfxVolume}%</output></label><label class="toggle-row"><b>목소리</b><input id="setting-voice" type="checkbox" role="switch" ${state.settings.voice ? 'checked' : ''}/></label><label class="toggle-row"><b>동작 줄이기</b><input id="setting-motion" type="checkbox" role="switch" ${state.settings.reducedMotion ? 'checked' : ''}/></label></section><section class="science-settings-actions" aria-label="바로 가기">${button('연구 키트 · 나의 관측 기록','kit','secondary')}${button('이 탐험을 하는 이유 다시 보기','story-replay','secondary')}${button('엔딩 다시 보기','movie','secondary',unlocked?'':'disabled aria-describedby="star-settings-end"')}${button('나의 탐구 결과 보기','results','secondary',state.core.restored?'':'disabled aria-describedby="star-settings-end"')}${unlocked?'':'<p id="star-settings-end">다섯 관측 기록을 모아 중앙 코어를 복구하면 볼 수 있어요.</p>'}</section><p class="film-replay">${button('프롤로그 영상 다시 보기', 'film-intro')}</p><details><summary>앱 정보 · 배움과 보상</summary><p>밤하늘을 직접 관찰하고, 예상과 근거를 비교해요.</p><p>다섯 기록을 모아 연구소를 복구하고 나의 탐구 인증서를 받아요. 지도에 나타나는 악당을 모두 물리치면 지도 피날레 영상도 열려요.</p><p>처음 예상·관측한 근거·수정한 생각이 연구 노트에 남아요.</p><p>별빛 관측 연구소 v${appInfo.version} · ${appInfo.credit}</p><details><summary>완료한 개념영상 모아 보기</summary><div class="concept-library">${chapters.map(chapter => `<button class="concept-card" data-action="library-${chapter.id}" ${state.evidence[chapter.id] ? '' : 'disabled'}><img src="/assets/concepts/stage-${chapter.id}.webp" alt=""/><span>${concepts[chapter.id].title}<small>${state.evidence[chapter.id] ? `${concepts[chapter.id].seconds}초 · 다시 보기` : '관측을 마치면 열려요'}</small></span></button>`).join('')}</div></details></details><details><summary>학생용 가이드</summary>${paragraphs(studentGuide)}</details><details><summary>교사용 가이드</summary>${paragraphs(teacherGuide)}<details><summary>성취기준</summary><p>2022 개정 교육과정과 연계한 탐구 보조 활동이에요. 이 게임만으로 성취기준 전체 달성을 판단하지 않으며, 수업·토론·후속 평가와 함께 활용해 주세요.</p>${standards.map(([code, text]) => `<p>${code} ${text}</p>`).join('')}</details><details><summary>장별 학습 근거와 오개념</summary><p>교사 현장 검수 전이에요. 기록의 존재와 설명의 과학적 타당성은 구분해 확인해 주세요.</p>${learningObjectives.map(item => `<section><h3>${item.chapter}장 · ${chapters[item.chapter-1].place}</h3><p>${item.standardCodes.join(', ')} · ${item.objective}</p><p><b>살펴볼 기록</b> · ${item.evidence}</p><p><b>함께 확인해요</b> · ${item.misconception}</p><p>${item.boundary}</p></section>`).join('')}</details><details><summary>교사용 도구</summary><p>모든 단계를 임시로 체험해요. 시연 중 조작은 자동저장하지 않고, 시연 종료·새로고침 시 원래 학생 기록으로 돌아가요.</p>${button(state.settings.adminUnlock ? '시연 종료 · 학생 기록으로 돌아가기' : '모든 단계 한 번에 열기', 'unlock', 'secondary', `aria-pressed="${state.settings.adminUnlock}"`)}</details></details><details><summary>이미지·소리·저작권 고지</summary><p>배경과 캐릭터는 제공·생성된 AI 그림이며, 실제 관측사진이 아닌 학습용 모형이에요.</p><p>배경 음악은 Suno로 만든 곡이에요. 버튼을 누를 때 나는 짧은 소리는 자체 Web Audio 합성이고, 지도 전투·성취 카드·장 열림·발자국 같은 효과음은 Freesound·Kenney의 CC0 녹음이에요. 개념영상은 게임 그림과 직접 작성한 도형으로 HyperFrames에서 제작했고, 영상 효과음은 Kenney(CC0)예요. 인트로·엔딩 영상은 게임 그림을 바탕으로 Google Veo(Flow·Gemini)로 만들었어요. 기존 캐릭터 대사와 안내 음성은 ElevenLabs로 만든 AI 생성 음성이에요. 달 방향 모형 안내 한 줄은 macOS 한국어 음성으로 로컬에서 합성했어요.</p><p>상세 출처와 라이선스는 assets/CREDITS.md에 기록돼 있어요.</p><details><summary>자료 출처 모아 보기</summary>${sources.map(([name, source]) => `<p><b>${name}</b> · ${source}</p>`).join('')}</details><p>${appInfo.credit}</p><p>자체 제작 화면·일러스트·음원의 복제·재배포·전용·상업적 이용은 별도 이용 조건을 따라요.</p><p>외부 공개 자료의 권리는 각 원저작자에게 있으며 각 자료의 공개 라이선스와 이용 조건을 따라요.</p></details></div></div>`, element => {
    element.classList.add('science-settings-stars');
    modalCleanup = mountWelcomeVoice(element.querySelector('.science-settings-audio'), { isMuted: voiceOff, duck: value => sound.setDucked(value, 'welcome') });
    element.querySelector('.dialog-footer').classList.add('science-settings-footer');
    if (openLibrary) {
      const library=element.querySelector('.concept-library').closest('details');
      library.parentElement.closest('details').open=true;
      library.open=true;
    }
    const volume = element.querySelector('#setting-volume'), sfxVolume = element.querySelector('#setting-sfx-volume');
    const disable = () => { volume.disabled = !state.settings.bgm; sfxVolume.disabled = !state.settings.sfx; };
    disable();
    // 스위치를 끄는 순간 그 갈래의 소리가 멈춘다(목소리는 narration이 문서 change 이벤트로 멈추고 배경음 줄임도 푼다).
    for (const [id, key] of [['setting-bgm', 'bgm'], ['setting-sfx', 'sfx'], ['setting-voice', 'voice'], ['setting-motion', 'reducedMotion']]) on(element.querySelector('#' + id), 'change', event => { state.settings[key] = event.target.checked; disable(); persist(); sound.sync(); syncSoundButton(); });
    on(volume, 'input', event => { state.settings.bgmVolume = +event.target.value; $('#setting-volume-value').textContent = event.target.value + '%'; persist(); sound.sync(); });
    on(sfxVolume, 'input', event => { state.settings.sfxVolume = +event.target.value; $('#setting-sfx-volume-value').textContent = event.target.value + '%'; persist(); });
  }, `${button('연구 기록 초기화', 'reset', 'secondary')}${button('닫기', 'close-modal', 'primary')}`);
}
function showHint() {
  const sequence = hints(state), index = Math.min(hintLevel, sequence.length - 1);
  dialog('루미의 탐구 힌트', `<div class="hint-story"><img src="/assets/rabbit.webp" alt="달토끼 루미"/><div><p class="hint-step">도움 ${index + 1} / ${sequence.length}</p><p>${sequence[index]}</p></div></div>`, null, `${index < sequence.length - 1 ? button('힌트 하나 더', 'more-hint') : ''}${button('직접 해 보기', 'close-modal', 'primary')}`);
}
function reward(number) {
  const chapter = chapters[number - 1];
  dialog(`${evidenceTag(number)} 확보!`, `${npcConversation('fox', chapter.npc, { pose: number === 5 ? 'cheer' : 'point', emotion: number === 5 ? 'happy' : 'encouraging', lineId: 'reward-' + number })}<details class="dialogue-extra"><summary>${chapter.record} · 연구소의 변화</summary><section class="reward-summary"><div class="reward-symbol">${recordBadge(number, 72)}</div><p class="reward-kicker">${missionTag(number)} 완료 · ${chapter.title}</p><h3>${chapter.record}</h3>${kitMeter(state)}</section><div class="world-change"><b>${icon('spark', 18)} 연구소 변화</b><p>${chapter.worldChange}</p></div></details>`, null, `${button(`개념영상 ${concepts[number].seconds}초 보기 (선택)`, 'reward-video-' + number)}${button('지도에서 변화 보기', 'continue-stage-' + number, 'primary')}`);
  on($('#dialog .dialogue-extra'), 'toggle', event => { if (event.target.open) narration.play('change-' + number); });
}
function showIntro(step = 0, replay = false) {
  const panel = introPanel(step, state.name), last = step === 2;
  dialog(panel.title, `<div class="story-panel" data-step="${step}">${panel.body}</div><p class="story-dots" aria-label="${step + 1} / 3 장면">${[0, 1, 2].map(index => `<i class="${index === step ? 'on' : ''}"></i>`).join('')}</p>`, element => element.classList.add('story-dialog'), `${last ? '' : button('건너뛰기', replay ? 'close-modal' : 'story-done')}${button(last ? (replay ? '닫기' : '첫 관측실로 출발') : '다음', last ? (replay ? 'close-modal' : 'story-done') : `story-next-${step + 1}-${replay ? 1 : 0}`, 'primary')}`, replay ? null : finishIntro);
}
// 인트로 영상(구글 플로우 장면 + 일레븐랩스 대사 + 자막): 끝나거나 건너뛰면 지금의 이야기 화면으로 이어진다.
function filmOptions(onEnd) { return { audible: !state.settings.muted && state.settings.voice !== false, volume: (state.settings.sfxVolume ?? 100) / 100, sound, onEnd }; }
function showIntroFilm(replay = false) {
  // 첫 시작에서 한 번만 자동으로 띄운다. 설정의 「프롤로그 영상 다시 보기」는 끝나면 창만 닫는다.
  if (!replay) { state.introFilm = true; persist(); }
  dialog(films.intro.title, filmMarkup('intro'), element => {
    element.classList.add('concept-dialog', 'film-dialog');
    const film = mountFilm(element, filmOptions(() => setTimeout(() => {
      if (!$('#dialog')?.open || !$('#dialog').classList.contains('film-dialog')) return;
      if (replay) closeModal(); else showIntro(0);
    }, 600)));
    modalCleanup = () => film.dispose();
  }, replay ? button('닫기', 'close-modal') : button('건너뛰기', 'story-next-0'));
}
function finishIntro() { state.intro = true; persist(); go(canAccess(state, state.resume) ? state.resume : 'map'); }
function finalReport() {
  track(state, 'reviews');
  const first = !state.core.reportSeen;
  state.core.reportSeen = true; persist();
  dialog('최종 관측 보고서', `${npcLine('fox', npc.report, 'map')}<div class="final-report">${chapters.map(chapter => `<details><summary>${recordBadge(chapter.id)}<span class="report-name">${chapter.record}<small>${evidenceFact(chapter.id, state.evidence[chapter.id]?.data)}</small></span><em class="verified">${icon('check', 16)} 확인</em></summary><div class="report-record">${recordMarkup(chapter.id, state.evidence[chapter.id]?.data)}</div></details>`).join('')}</div><p class="bank-note">항목을 누르면 내가 만든 실제 기록을 다시 볼 수 있어요.</p>`, null, button(first ? '중앙 코어 연결 시작' : '코어로 돌아가기', 'close-modal', 'primary'));
}
let movie = null, mapFinaleOpen = false;
// 메인 테마는 시작부터 계속, 파이널은 엔딩·인증서·지도 피날레 창에서 나온다.
function syncMusic() { sound.setMusic(movie || mapFinaleOpen || state.scene === 'results' ? 'finale' : 'main'); }
// 엔딩 영상: 동작 줄이기를 켰을 때는 한 장면씩 넘기는 기존 엔딩을 그대로 쓴다.
function showFinalFilm() {
  const preview = completedCount(state) < 5;
  sound.play('success');
  dialog(films.final.title, filmMarkup('final'), element => {
    element.classList.add('concept-dialog', 'film-dialog');
    const skip = element.querySelector('#movie-skip');
    const film = mountFilm(element, filmOptions(() => { skip?.remove(); element.querySelector('#movie-done')?.focus({ preventScroll: true }); }));
    movie = film;
    on(skip, 'click', () => film.skip());
    syncMusic();
    modalCleanup = () => { film.dispose(); movie = null; setTimeout(syncMusic); };
  }, `<button class="btn" id="movie-skip">건너뛰기</button>${preview ? button('시연 닫기', 'close-modal', 'primary', 'id="movie-done"') : button('인증서 받기', 'results', 'primary', 'id="movie-done"')}`, preview ? null : () => go('results'));
}
function showMovie() {
  if (!reduced()) return showFinalFilm();
  const preview = completedCount(state) < 5;
  sound.play('success');
  dialog('엔딩 · 연구소 복구', movieMarkup(state), element => {
    element.classList.add('movie-dialog');
    const skip = element.querySelector('#movie-skip');
    movie = mountMovie(element, {
      reduced: reduced(),
      onScene(index) {
        if (index < 4) { narration.play('movie-' + (index + 1)); return; }
        modalVoiceCleanup = mountNarrationControl(element.querySelector('.dialog-footer'), 'ending', narration);
      },
      onEnd() { skip?.remove(); element.querySelector('#movie-done')?.focus({ preventScroll: true }); },
    });
    on(skip, 'click', () => movie?.next());
    syncMusic();
    // 인증서로 넘어가면 파이널이 끊기지 않게, 닫힌 뒤 화면이 정해지면 고른다.
    modalCleanup = () => { movie?.dispose(); movie = null; setTimeout(syncMusic); };
  }, `<button class="btn" id="movie-skip">${reduced() ? '다음 장면' : '건너뛰기'}</button>${preview ? button('시연 닫기', 'close-modal', 'primary', 'id="movie-done"') : button('인증서 받기', 'results', 'primary', 'id="movie-done"')}`, preview ? null : () => go('results'));
}
function challenge(number) {
  const challenge = challenges[number];
  dialog('한 걸음 더 · 선택 도전', `<p>${challenge.question}</p><div class="challenge-choices">${challenge.options.map((option, index) => button(option, `answer-${number}-${index}`)).join('')}</div>`);
}
function go(scene, { fromHistory = false } = {}) {
  if (!canAccess(state, scene)) return notify('앞선 관측을 먼저 마쳐 주세요.');
  // 브라우저 뒤로 가기가 앱 안 앞 화면으로 가도록 화면을 옮길 때마다 기록에 쌓는다(뒤로 가기로 온 이동은 쌓지 않는다).
  if (!fromHistory && scene !== state.scene) history.pushState({ ...history.state, starlightScene: scene }, '');
  if (scene !== state.scene) { screenFailure = null; if(learningUI.playback){learningUI.playback.playing=false;learningUI.playback.step=0;learningUI.playback.finished=false;} learningUI.round = 0; learningUI.body = 0; learningUI.selectedStar = null; learningUI.overlayVisible = false; learningUI.piece = null; learningUI.inspectedBody = null; learningUI.pendingAdvance = null; hintLevel = 0; }
  state.scene = scene;
  if (/^s[1-5][ab]$/.test(scene)) {
    lastSite = +scene[1];
    if (!state.visited.includes(lastSite)) state.visited.push(lastSite);
  }
  if (scene !== 'home') state.resume = scene;
  persist(); render(); window.scrollTo(0, 0); $('#screen-title')?.focus({ preventScroll: true });
}
// 기록을 지우고 처음 상태로(소리 설정은 남김). 시연 중이거나 복구용 보관에 실패하면 지우지 않는다.
function resetRecords() {
  if (studentSnapshot || !session.backup()) { showSaveWarning(); notify(session.warning || '먼저 시연을 끝내 주세요.'); return false; }
  const settings = { ...state.settings, adminUnlock: false }; state = freshState(); state.settings = settings; lastSite = null; pendingRestoration = []; persist(); return true;
}
function action(name) {
  sound.start();
  if (!name.startsWith('concept-') && !name.startsWith('reward-video-')) sound.play(name === 'complete' ? 'success' : name.includes('hint') ? 'hint' : 'click');
  if (name === 'close-modal') return closeModal();
  if (name === 'retry-map-assets') { screenFailure = null; return renderAndFocus(); }
  if (name === 'retry-screen-code') {
    history.replaceState({ ...history.state, starlightRetryScene: state.scene }, '');
    return location.reload();
  }
  if (name === 'continue-without-map') return enterSite(nextSite());
  if (name === 'home') return go('home');
  if (name === 'back') return go(state.scene === 'home' ? 'home' : state.scene === 'map' ? 'home' : state.scene.endsWith('b') ? state.scene.slice(0, 2) + 'a' : 'map');
  if (name === 'map' || name === 'results') return go(name);
  if (name === 'sound') {
    // 켜기를 눌렀는데 세 갈래가 모두 꺼져 있으면 셋 다 켠다(헤더 버튼은 전체 켜기·끄기).
    if (anyAudible()) state.settings.muted = true;
    else { state.settings.muted = false; if (!state.settings.bgm && !state.settings.sfx && !state.settings.voice) Object.assign(state.settings, { bgm: true, sfx: true, voice: true }); }
    persist(); sound.sync(); render(); return;
  }
  if (name === 'settings') return settings();
  if (name === 'new-start' && state.started) {
    if (studentSnapshot) return notify('시연을 끝낸 뒤 새로 시작할 수 있어요.');
    return dialog('기존 탐구 기록을 지우고 새로 시작할까요?', '<p>별명·진행·보상·관찰 기록이 새로 시작해요. 이전 기록은 이 브라우저에 복구용으로 보관하고 소리 설정은 남아요.</p>', element => element.querySelector('[data-action="close-modal"]').focus(), `${button('취소', 'close-modal', 'primary')}${button('기록 지우고 시작', 'confirm-new-start', 'danger')}`);
  }
  if (name === 'confirm-new-start') { if (!resetRecords()) return; render(); }
  if (name === 'new-start' || name === 'confirm-new-start' || name === 'home-continue') { state.started = true; if (!state.intro && completedCount(state) === 0) { persist(); return reduced() || state.introFilm ? showIntro(0) : showIntroFilm(); } state.intro = true; return go(canAccess(state, state.resume) ? state.resume : 'map'); }
  if (name === 'kit' || name === 'notebook') return kit();
  if (name.startsWith('story-next-')) { const [, , step, replay] = name.split('-'); return showIntro(+step, replay === '1'); }
  if (name === 'story-done') return finishIntro();
  if (name === 'story-replay') return showIntro(0, true);
  if (name === 'report') return finalReport();
  if (name === 'movie') return showMovie();
  if (name === 'film-intro') return showIntroFilm(true);
  if (name === 'records') { const records = $('#my-records'); records?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' }); records?.focus({ preventScroll: true }); return; }
  if (name.startsWith('bonus-')) return openBonus(name.slice(6), { state, dialog, persist, sound, on, reduced: reduced() });
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
    return go('map');
  }
  if (name === 'next') { const number = +state.scene[1]; if (firstReady(state, number)) return go(`s${number}b`); }
  if (name === 'complete') { const number = +state.scene[1], fresh = !state.evidence[number]; if (!completeStage(state, number)) return notify('루미의 안내를 보고 남은 기록을 완성해 주세요.'); if(fresh&&!studentSnapshot)pendingRestoration.push(number); persist(); return reward(number); }
  if (name.startsWith('reward-video-')) { const number = +name.split('-').at(-1); return showConcept(number, () => reward(number), '완료 화면으로'); }
  if (name.startsWith('library-')) return showConcept(+name.split('-')[1], () => settings(true), '영상 목록으로');
  if (name.startsWith('concept-')) return showConcept(+name.split('-')[1], state.scene === 'results' ? null : kit, state.scene === 'results' ? '내 연구 결과로' : '연구 키트로');
  if (name === 'unlock') { if (studentSnapshot) { state = studentSnapshot; studentSnapshot = null; } else { studentSnapshot = clone(state); state = clone(state); state.settings.adminUnlock = true; previewCore = { connections: {}, angle: 15, restored: false }; } if (!canAccess(state, state.scene)) state.scene = 'map'; if (!canAccess(state, state.resume)) state.resume = 'map'; persist(); render(); return settings(); }
  if (name === 'reset' && studentSnapshot) return notify('시연을 끝낸 뒤 학생 기록을 초기화할 수 있어요.');
  if (name === 'reset') return dialog('연구 기록을 초기화할까요?', '<p>별명·진행·보상·관찰 기록이 새로 시작해요. 이전 기록은 이 브라우저에 복구용으로 보관하고 소리 설정은 남아요.</p>', element => element.querySelector('[data-action="close-modal"]').focus(), `${button('취소', 'close-modal', 'primary')}${button('기록 지우기', 'confirm-reset', 'danger')}`);
  if (name === 'confirm-reset') { if (resetRecords()) render(); return; }
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
    if(!state.core.restored&&!studentSnapshot){pendingRestoration.push(0);lastSite=0;} state.core.restored = true; lastReplay = null; persist(); render();
    return showMovie();
  }
  if (name.startsWith('challenge-')) return challenge(+name.split('-')[1]);
  if (name.startsWith('answer-')) { const [, number, answer] = name.split('-').map((value, index) => index ? +value : value); const correct = answer === challenges[number].answer; if (correct) { state.challengeAnswers[number] = 'correct'; if (state.evidence[number]) state.evidence[number].challengeAnswer = 'correct'; persist(); sound.play('success'); } else sound.play('retry'); return dialog(correct ? '탐구 표식을 얻었어요!' : '근거를 다시 살펴봐요.', `<p>${correct ? challenges[number].takeaway : challenges[number].hint}</p>`, null, correct ? button('지도에서 확인', 'map', 'primary') : button('다시 도전', 'challenge-' + number, 'primary')); }
  if (name === 'export') { const anchor = document.createElement('a'); const url = URL.createObjectURL(new Blob([JSON.stringify(studentSnapshot || state, null, 2)], { type: 'application/json' })); anchor.href = url; anchor.download = '별빛-연구기록.json'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 500); }
  if(name==='certificate-png'){const paper=document.querySelector('#starlight-certificate');if(paper)saveCertificatePng(paper,'별빛_관측연구원_인증서.png').then(()=>notify('인증서 PNG를 저장했어요.')).catch(()=>notify('인증서 그림을 불러오지 못했어요. 연결을 확인해 주세요.'));}
  if (name === 'print') { document.body.classList.add('print-certificate'); addEventListener('afterprint', () => document.body.classList.remove('print-certificate'), { once: true }); window.print(); }
}
const nextSite = () => chapters.find(chapter => !state.evidence[chapter.id])?.id || 0;
function enterSite(number) {
  if (number ? !stageOpen(state, number) : completedCount(state) < 5 && !state.settings.adminUnlock) return notify('앞선 관측을 마치면 이 문이 열려요.');
  lastSite = number;
  if (!state.settings.adminUnlock && (!number || !state.evidence[number])) return go(number ? `s${number}${firstReady(state, number) ? 'b' : 'a'}` : 'core');
  const chapter = chapters[number - 1];
  dialog(chapter ? chapter.place : '중앙 관측 코어', `<p>${chapter ? chapter.goal : '다섯 관측 기록을 장치에 연결해 연구소를 복구해요.'}</p>`, element => {
    on(element.querySelector('#enter-room'), 'click', () => { if (number && !state.visited.includes(number)) state.visited.push(number); go(number ? `s${number}a` : 'core'); });
    if (number) on(element.querySelector('#enter-second'), 'click', () => go(`s${number}b`));
  }, `${number && state.evidence[number] ? button('선택 도전', 'challenge-' + number) : ''}${number && state.settings.adminUnlock ? '<button class="btn secondary" id="enter-second">비교 활동 시연</button>' : ''}<button class="btn primary" id="enter-room">${chapter ? '관측 시작' : '코어 열기'}</button>`);
}
function screenLoading(map, failure) {
  const title = map ? '별빛 연구소 지도' : '관측실';
  const next = nextSite();
  const directLabel = next === 1 ? '첫 관측 시작' : next ? `${chapters[next - 1].place}로 바로 가기` : '중앙 코어로 바로 가기';
  return `<main class="screen-loading" data-screen-load="${failure || 'pending'}">
    <h1 id="screen-title" tabindex="-1">${title}</h1>
    <p role="${failure ? 'alert' : 'status'}">${failure ? `${map ? '지도를' : '관측실을'} 불러오지 못했어요. 저장한 기록은 그대로예요.` : `${map ? '숲길을' : '관측 도구를'} 준비하고 있어요.`}</p>
    ${failure ? `<div class="screen-loading-actions">${button('다시 열기', failure === 'assets' ? 'retry-map-assets' : 'retry-screen-code', map ? 'secondary' : 'primary')}${map ? button(directLabel, 'continue-without-map', 'primary') : ''}</div>` : ''}
  </main>`;
}
function renderAndFocus() {
  render();
  ($('#screen-title') || $('#world'))?.focus({ preventScroll: true });
}
function updateAfterLoad(signal) {
  if (signal.aborted) return;
  const dialog = $('#dialog');
  if (dialog.open) {
    dialog.addEventListener('close', () => updateAfterLoad(signal), { once: true, signal });
    return;
  }
  const main = app.querySelector('main');
  if (document.activeElement === document.body || main?.contains(document.activeElement)) renderAndFocus();
  else render();
}
function render() {
  narration.stop(); sceneVoiceCleanup(); sceneVoiceCleanup = () => {};
  welcomeCleanup(); welcomeCleanup = () => {};
  closeModal(false); cleanup(); events?.abort(); events = new AbortController();
  document.body.classList.toggle('reduce-motion', reduced());
  const learning = /^s[1-5][ab]$/.test(state.scene), map = state.scene === 'map';
  const needsCode = (map && !mapScreen) || (learning && !observationScreen);
  const failure = screenFailure?.scene === state.scene ? screenFailure.kind : null;
  const waiting = needsCode || failure;
  const scene = state.scene, signal = events.signal;
  app.innerHTML = (waiting ? controls() + screenLoading(map, failure) : learning ? observationScreen.learningView(state, controls()) : controls() + (scene === 'home' ? home() : map ? mapScreen.worldMarkup(state) : scene === 'core' ? coreView() : resultsView())) + '<dialog id="dialog" aria-labelledby="dialog-title"></dialog>';
  on($('#dialog'), 'cancel', event => { event.preventDefault(); closeModal(); });
  bindActions(app);
  cleanup = () => {};
  if (needsCode && !failure) {
    waitForScreen(map ? loadMapScreen() : loadObservationScreen(), signal).then(module => {
      if (map) mapScreen = module;
      else observationScreen = module;
      updateAfterLoad(signal);
    }, () => {
      if (signal.aborted) return;
      screenFailure = { scene, kind: 'code' };
      updateAfterLoad(signal);
    });
  }
  if (!waiting && learning) cleanup = observationScreen.mountLearning(app, { state, save: persist, render, notify, dialog, on, refresh, sound, narration, onFeedback: syncFeedbackVoice });
  if (!waiting && map) {
    const restoredSites = studentSnapshot ? [] : pendingRestoration.slice();
    // 발자국·열림 소리는 늘 미리 받고, 전투 효과음은 지도에 남은 악당이 있을 때만 받는다.
    sound.preload(!state.settings.adminUnlock && chapters.some(c => state.evidence[c.id] && (state.mapHits?.[c.id] ?? 0) < 3));
    const opened = newlyOpenSites();
    const world = mapScreen.mountWorld($('#world'), state, {
      lastSite, restoredSites, save: persist, tone:(kind,hits)=>sound.mapCue(kind,hits), say: villainVoice, onStep: sound.step, onHint: showHint, onStatus: notify, onSite: enterSite,
      // 성취 카드: 악당의 세 번째 타격이 저장되면 퇴장 뒤 카드가 뜬다. 목소리 중에는 효과음이 나지 않으므로 악당의 퇴장 대사가 끝난 뒤에 뜬다.
      // 카드가 열린 동안 #app이 inert라 지도·악당·파이널 영상이 기다린다.
      onMapHits: (before, patch) => mapScreen.awardRewardCards(before, patch, { hits: () => state.mapHits, open: () => state.scene === 'map' && !!$('#world'), sound: name => sound.mapCue(name), masked: () => !['idle', 'muted', 'error'].includes(narration.state.status), reduced: reduced() }),
      onReady: () => {
        pendingRestoration.splice(0, restoredSites.length);
        if (opened) announceOpen(signal);
        if (document.activeElement === document.body) $('#world')?.focus({ preventScroll: true });
      },
      onError: () => {
        screenFailure = { scene, kind: 'assets' };
        world.dispose();
        updateAfterLoad(signal);
      },
    });
    // 지도 복구 작업대: 탐구를 마친 구역만 직접 복구(보상 상호작용, 학습 판정과 분리). 교사 시연은 저장하지 않는다.
    if (completedCount(state)>0 || state.settings.adminUnlock) mapScreen.mountRepair($('#world'), { state, save: persist, kind: 'focus', preview: state.settings.adminUnlock, available: chapters.filter(c => state.settings.adminUnlock || state.evidence[c.id]).map(c => ({ id: c.id - 1, label: c.place })) });
    cleanup = () => world.dispose();
  }
  if (state.scene === 'core') mountCalibration();
  syncFeedbackVoice(app.querySelector('#planet-feedback, #classification-feedback'));
  refresh(); sound.sync(); syncMusic();
  if (state.scene === 'core' && completedCount(state) === 5 && !state.core.restored && !state.core.reportSeen) finalReport();
}
// 스테이지 열림 소리: 열린 시설(관측소 1~5, 중앙 코어 0)을 메모리에 들고, 지도에 새로 열린 곳이 보이면 한 번 낸다.
// 앱을 열 때 이미 열린 곳은 알린 것으로 치므로 새로고침·재방문 때는 다시 나지 않는다. 교사 시연(전체 해금)은 알리지 않는다.
const openSites = s => [0, ...chapters.map(c => c.id)].filter(n => n ? stageOpen(s, n) : completedCount(s) === 5);
let knownOpen = new Set(openSites(state));
function newlyOpenSites() {
  if (state.settings.adminUnlock) return false;
  const now = openSites(state), fresh = now.some(n => !knownOpen.has(n));
  knownOpen = new Set(now);
  return fresh;
}
// 완료음·보상 창·대사가 끝난 뒤에 낸다: 지도가 그려지고 0.4초 뒤부터, 창이 없고 목소리가 쉬는 첫 순간(최대 8초 기다림).
function announceOpen(signal) {
  const begin = performance.now();
  const check = () => {
    if (signal.aborted) return;
    const busy = !!document.querySelector('dialog[open]') || !!app.closest('[inert]') || app.inert || !['idle', 'muted', 'error'].includes(narration.state.status);
    if (!busy) return sound.stageOpen();
    if (performance.now() - begin < 8000) setTimeout(check, 150);
  };
  setTimeout(check, 400);
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
  app.querySelectorAll('[data-core-step]').forEach(button=>on(button,'click',()=>{if(!locked())set(core.angle+Number(button.dataset.coreStep),true);}));
  // The ring turns by the change in finger angle, so a tap alone never jumps the needle.
  on(dial, 'pointerdown', event => { if (locked()) return notify(calibrationStatus(core)); event.preventDefault(); drag = { previous: pointerAngle(event), raw: core.angle }; if (event.pointerType === 'mouse') dial.setPointerCapture(event.pointerId); dial.classList.add('is-turning'); });
  on(dial, 'pointermove', event => { if (!drag) return; const now = pointerAngle(event); let delta = now - drag.previous; if (delta > 180) delta -= 360; if (delta < -180) delta += 360; drag.previous = now; drag.raw += delta; set(drag.raw); });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) on(dial, type, () => { if (!drag) return; drag = null; dial.classList.remove('is-turning'); persist(); if (coreAligned(core) && !locked()) sound.play('place'); });
  on(dial, 'keydown', event => { const step = { ArrowRight: 5, ArrowUp: 5, ArrowLeft: -5, ArrowDown: -5 }[event.key]; if (step && !locked()) { event.preventDefault(); set(core.angle + step, true); } });
}
// 캡처 단계에서 받아, 지도 방향 버튼처럼 이벤트를 멈추는 곳을 처음 눌러도 배경음이 시작된다.
document.addEventListener('pointerdown', () => sound.start(), true);
document.addEventListener('keydown', () => sound.start(), true);
// 파이널 창이 열리면 파이널 곡으로 넘어간다. 카드 완성 징글이 아직 울리면 끊지 않고 곡을 0에서 올린다(sound.js).
document.addEventListener('map-finale', event => { mapFinaleOpen = !!event.detail; syncMusic(); });
render();
// 브라우저 뒤로 가기: 활동 → 지도 → 시작 화면 순서로 앞 화면에 가고, 시작 화면에서 한 번 더 누르면 평소처럼 앱을 나간다.
// 처음 열 때(새로고침이 아닐 때) 시작 화면·지도를 기록 아래에 깔아 둔다. 진행 저장은 건드리지 않는다.
if (!history.state?.starlightScene) {
  const below = state.scene === 'home' ? [] : ['map', 'home'].includes(state.scene) ? ['home'] : ['home', 'map'];
  history.replaceState({ ...history.state, starlightScene: below[0] || state.scene }, '');
  for (const scene of [...below.slice(1), state.scene].slice(below.length ? 0 : 1)) history.pushState({ ...history.state, starlightScene: scene }, '');
}
addEventListener('popstate', event => {
  const target = event.state?.starlightScene;
  if (!target) return;
  if ($('#dialog')?.open) closeModal(false);
  if (target === state.scene) return;
  if (canAccess(state, target)) return go(target, { fromHistory: true });
  history.replaceState({ ...history.state, starlightScene: 'map' }, '');
  go('map', { fromHistory: true });
});
if (loaded.warning) { notify(loaded.warning); showSaveWarning(); }
// 오프라인 재방문: 배포 빌드에서만 서비스워커를 쓴다(public/sw.js). 자리 잡기 전에 받은 파일 목록도 넘겨 저장하게 한다.
if (import.meta.env?.PROD && 'serviceWorker' in navigator && location.protocol.startsWith('http')) {
  addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').then(() => navigator.serviceWorker.ready).then(reg => reg.active?.postMessage({ cacheUrls: performance.getEntriesByType('resource').map(entry => entry.name) })).catch(() => {}); });
}
