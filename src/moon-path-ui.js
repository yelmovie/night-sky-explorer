import { track } from './state.js';
import { moonSVG, dayMoon, icon } from './drawing.js';
import { button } from './ui.js';
import { bindDirectionPad, mapKeyDirection, MAP_VECTORS } from './map-controls.js';
import { pathDays, pathSections, pathGates, doorMatches, judgeDoor, finishPath, pathHelpAfter } from './moon-path.js';

// Screen layer of the bonus "달빛 길 따라가기": start card, HUD, buttons, the card fallback and the reward.
// Both ways of playing (running in 3D, or choosing a moon card) ask judgeDoor() and share one progress count.
const NOTE = '우리나라에서 본 모양을 단순하게 나타냈어요 · 학습용 날짜';
const idle = { x: 0, y: 0, jump: false };
const typing = target => !!target?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"])');

/** The on-screen pad, the jump button and the keyboard become one steering state. */
function bindRunInput(root, blocked, signal) {
  const keys = new Map(), doc = root.ownerDocument, win = doc.defaultView;
  let touch = null, jump = false, tapped = null, tapUntil = 0;
  const release = () => { touch = null; };
  bindDirectionPad(root, '[data-run-dir]', item => item.dataset.runDir, {
    press: direction => { touch = direction; }, release, cancel: release, blocked, signal,
    // A keyboard or switch "click" on an arrow walks one short step.
    tap: direction => { tapped = direction; tapUntil = performance.now() + 380; },
  });
  const clear = () => { keys.clear(); touch = null; jump = false; tapped = null; };
  doc.addEventListener('keydown', event => {
    if (blocked() || event.isComposing || event.ctrlKey || event.altKey || event.metaKey || typing(event.target)) return;
    const direction = mapKeyDirection(event);
    if (direction) { keys.set(event.code || event.key, direction); event.preventDefault(); return; }
    // A focused button keeps Space for itself, so keyboard users can still press it.
    if (event.target?.closest?.('button,a,summary')) return;
    if (event.code === 'Space') { if (!event.repeat) jump = true; event.preventDefault(); }
  }, { signal });
  doc.addEventListener('keyup', event => { keys.delete(event.code || event.key); }, { signal });
  win.addEventListener('blur', clear, { signal });
  doc.addEventListener('visibilitychange', clear, { signal });
  const jumpButton = root.querySelector('[data-run="jump"]');
  jumpButton.addEventListener('pointerdown', event => { if (!blocked() && event.button <= 0) { jump = true; event.preventDefault(); } }, { signal });
  jumpButton.addEventListener('click', event => { if (!blocked() && event.detail === 0) jump = true; }, { signal });
  // After a tap the button gives focus back, so Space jumps instead of pressing it again.
  root.addEventListener('click', event => { const item = event.target.closest('.moon-run-pad button, .moon-run-jump'); if (item && event.detail > 0) root.querySelector('.moon-run-stage').focus({ preventScroll: true }); }, { signal });
  return {
    clear,
    read() {
      const steer = { x: 0, y: 0, jump };
      jump = false;
      if (blocked()) return idle;
      const held = new Set([...keys.values(), ...(touch ? [touch] : []), ...(tapped && performance.now() < tapUntil ? [tapped] : [])]);
      for (const direction of held) { steer.x += MAP_VECTORS[direction].x; steer.y -= MAP_VECTORS[direction].y; }
      return steer;
    },
  };
}

export function openMoonPath(quest, { state, dialog, persist, sound, reduced = false, loadStage = () => import('./moon-run-stage.js') }) {
  // Each moon drawing carries its own clip ids, so every place that shows the six moons draws them anew.
  const moons = () => pathDays.map(day => `<figure>${dayMoon(day)}<figcaption>${day}일째</figcaption></figure>`).join('');
  const arrows = [['up', '앞으로', '▲'], ['left', '왼쪽으로', '◀'], ['right', '오른쪽으로', '▶'], ['down', '뒤로', '▼']];
  const start = (label, mode, cls) => `<button type="button" class="btn ${cls}" data-run-start="${mode}">${label}</button>`;
  const body = `<div class="moon-run" data-view="intro">
    <section class="moon-run-intro">
      <img class="moon-run-art" src="/assets/generated/run-stage/start-card.webp" alt="" width="1280" height="720" decoding="async" draggable="false">
      <p class="bonus-lead">루미와 밤 언덕길을 달려 관측소까지 가요. 갈림길마다 표지판에 적힌 날짜의 달이 걸린 문으로 지나가요.</p>
      <h3>내가 기록한 여섯 날의 달</h3>
      <div class="moon-run-record">${moons()}</div>
      <p class="model-note">${NOTE}</p>
      <p class="moon-run-how">방향 버튼이나 방향키·WASD로 움직이고, 점프 버튼이나 스페이스로 개울을 건너요. 다른 문은 열리지 않으니 다시 고르면 돼요.</p>
      <p id="bonus-feedback" class="inline-feedback" role="status" data-tone="hint">${state.bonus.path === 'done' ? `이미 ${quest.reward}를 받았어요. 다시 달릴 수 있어요.` : reduced ? '동작 줄이기가 켜져 있어서 달 카드를 고르는 방식을 먼저 권해요.' : '달 모양을 잘 봐 두고 출발해요.'}</p>
      <div class="moon-run-actions">${reduced ? start('달 카드로 문 고르기', 'cards', 'primary') + start('3D 길로 달리기', 'run', 'secondary') : start('달빛 길 출발', 'run', 'primary') + start('걷지 않고 문 고르기', 'cards', 'secondary')}${button('닫기', 'close-modal', 'ghost')}</div>
    </section>
    <section class="moon-run-game">
      <div class="moon-run-stage" tabindex="-1" aria-label="달빛 길 3D 화면. 방향키와 스페이스로 루미를 움직여요."><div class="moon-run-labels" aria-hidden="true"></div><p class="moon-run-loading">달빛 길을 준비하고 있어요…</p></div>
      <div class="moon-run-cards"></div>
      <div class="moon-run-hud">
        <ol class="moon-run-progress" aria-label="지나갈 달 문 여섯 개">${pathDays.map(day => `<li data-day="${day}">${day}</li>`).join('')}</ol>
        <p class="moon-run-target"><span></span><b></b></p>
        <figure class="moon-run-prev" hidden><div></div><figcaption></figcaption></figure>
      </div>
      <p class="moon-run-tip" role="status" aria-live="polite"></p>
      <div class="moon-run-pad" role="group" aria-label="루미 움직이기">${arrows.map(([direction, label, glyph]) => `<button type="button" data-run-dir="${direction}" aria-label="${label}">${glyph}</button>`).join('')}</div>
      <button type="button" class="moon-run-jump" data-run="jump" aria-label="점프">점프</button>
      <button type="button" class="btn secondary moon-run-switch" hidden>걷지 않고 문 고르기</button>
      <p class="moon-run-note">${NOTE}</p>
    </section>
    <section class="moon-run-done">
      <h3 tabindex="-1">관측소에 도착했어요!</h3>
      <div class="moon-run-record">${moons()}</div>
      <p>여섯 날의 달을 순서대로 지나왔어요. 밝은 부분은 오른쪽부터 차올랐다가, 왼쪽이 남으며 줄어들었어요.</p>
      <p class="moon-run-reward">${icon('spark', 20)} <span></span></p>
      <p class="model-note">${NOTE}</p>
      <div class="moon-run-actions"><button type="button" class="btn secondary" data-run-again>처음부터 다시 하기</button>${button('닫기', 'close-modal', 'primary')}</div>
    </section>
  </div>`;
  dialog(quest.title, body, element => {
    element.classList.add('moon-run-dialog');
    const events = new AbortController(), signal = events.signal, root = element.querySelector('.moon-run'), find = selector => root.querySelector(selector);
    const host = find('.moon-run-stage'), cards = find('.moon-run-cards'), tipLine = find('.moon-run-tip'), switchButton = find('.moon-run-switch');
    // The start picture is decoration: if it cannot load, the card simply has none.
    find('.moon-run-art').addEventListener('error', event => event.target.remove(), { once: true });
    let gates = pathGates(), current = 0, misses = 0, view = 'intro', stage = null, input = null, timer = 0, tipTimer = 0;
    const show = next => { view = next; root.dataset.view = next; };
    /** The goal lives once, in the target pill above. This line only carries hints and remarks: hints stay until
        the next event, passing remarks clear themselves after a few seconds. */
    function tip(text, tone = 'hint', passing = false) {
      clearTimeout(tipTimer); tipLine.textContent = text; tipLine.dataset.tone = tone;
      if (passing) tipTimer = setTimeout(() => { if (view === 'run') tip(''); }, 4200);
    }
    function hud() {
      root.querySelectorAll('.moon-run-progress li').forEach((item, index) => { item.dataset.state = index < current ? 'done' : index === current ? 'now' : ''; });
      const gate = gates[current], target = find('.moon-run-target'), prev = find('.moon-run-prev');
      target.firstElementChild.textContent = gate ? `${pathSections[gate.section].name} · ${pathSections[gate.section].focus}` : '여섯 문을 모두 지났어요';
      target.lastElementChild.textContent = gate ? `다음 문 · ${gate.day}일째 달` : '관측소로 달려가요';
      prev.hidden = !current;
      if (current) { prev.firstElementChild.innerHTML = dayMoon(gates[current - 1].day); prev.lastElementChild.textContent = `지난 문 · ${gates[current - 1].day}일째`; }
    }
    /** The one place a door is judged, for the 3D path and for the cards. */
    function tryDoor(gateIndex, doorIndex) {
      const gate = gates[gateIndex];
      if (gateIndex !== current || !gate) return { ok: false, reveal: false, answer: -1 };
      const result = judgeDoor(gate, doorIndex, misses), answer = gate.doors.findIndex(door => doorMatches(door, gate.day));
      if (result.ok) {
        current++; misses = 0; sound.play('discover'); switchButton.hidden = true; hud();
        tip(gates[current] ? `${gate.day}일째 달의 문이 열렸어요! 다음은 ${gates[current].day}일째 달이에요.` : `${gate.day}일째 달의 문이 열렸어요! 관측소가 보여요.`, 'success', view === 'run');
      } else {
        misses++; track(state, 'retries'); persist(); sound.play('retry'); tip(result.hint);
        if (view === 'run' && misses >= pathHelpAfter) switchButton.hidden = false;
      }
      return { ...result, answer };
    }
    function stopRun() { stage?.dispose(); stage = null; input?.clear(); input = null; }
    function cleanup() { events.abort(); clearTimeout(timer); clearTimeout(tipTimer); stopRun(); delete element.ownerDocument.defaultView.__moonRun; }
    function finish() {
      const fresh = finishPath(state, current);
      if (fresh) persist();
      stopRun(); sound.play('success'); show('done');
      find('.moon-run-reward span').textContent = fresh ? `${quest.reward}를 연구 키트에 담았어요.` : `${quest.reward}는 이미 연구 키트에 있어요.`;
      // The list behind this dialog is not redrawn until the next screen change, so mark its card here.
      const card = element.ownerDocument.querySelector('.bonus-card[data-action="bonus-path"]');
      if (card) { card.classList.add('is-done'); card.querySelector('small').innerHTML = `${icon('check', 16)} ${quest.reward} 획득`; }
      find('.moon-run-done h3').focus({ preventScroll: true });
    }
    function drawCards(lit = -1) {
      const gate = gates[current];
      cards.innerHTML = `<p class="moon-run-question">${gate.day}일째 달이 걸린 문은 어느 것일까요?</p><div class="moon-run-doors">${gate.doors.map((door, index) => `<button type="button" class="moon-run-door ${index === lit ? 'is-lit' : ''}" data-door="${index}"><span class="sr-only">${index + 1}번 문 · </span>${moonSVG(door.amount, door.side)}</button>`).join('')}</div>`;
    }
    function startCards(message = '') {
      stopRun(); show('cards'); switchButton.hidden = true; hud(); drawCards();
      tip(message);
      cards.querySelector('button')?.focus({ preventScroll: true });
    }
    async function startRun() {
      show('run'); hud(); host.dataset.ready = 'false'; tip('');
      try {
        const { createMoonRun } = await loadStage();
        if (signal.aborted || view !== 'run') return;
        const controls = bindRunInput(root, () => view !== 'run' || !stage || element.ownerDocument.hidden, signal);
        input = controls;
        const made = await createMoonRun({
          host, labels: find('.moon-run-labels'), gates, reduced,
          // If the dialog is replaced without a close event, the next frame notices and frees the 3D scene.
          read: () => { if (!root.isConnected) { queueMicrotask(cleanup); return idle; } return controls.read(); },
          onDoor: tryDoor,
          onNear: kind => tip(kind === 'jump' ? '개울은 점프로 건너요. 점프 버튼이나 스페이스를 눌러요.' : '턱은 점프로 올라가요.', 'hint', true),
          onFall: () => tip('개울에 빠졌어요. 조금 앞에서 다시 달려요. 개울 앞에서 점프!', 'hint', true),
          onArrive: () => { timer = setTimeout(finish, reduced ? 300 : 1500); },
          onLost: () => startCards('3D 화면 연결이 끊겨서 달 카드로 이어 가요.'),
        });
        if (signal.aborted || view !== 'run') { made.dispose(); return; }
        stage = made; host.dataset.ready = 'true';
        // Read-only handle for browser checks; it cannot change progress or the save.
        element.ownerDocument.defaultView.__moonRun = { get state() { return stage ? { ...stage.state, passed: stage.passed } : null; } };
        tip('');
        host.focus({ preventScroll: true });
      } catch {
        if (signal.aborted) return;
        startCards('이 기기에서는 3D 길을 열 수 없어요. 달 카드를 골라서 진행해요.');
      }
    }
    function begin(mode) {
      clearTimeout(timer); stopRun(); gates = pathGates(Math.random); current = 0; misses = 0;
      if (mode === 'run') startRun(); else startCards();
    }
    root.addEventListener('click', event => {
      const starter = event.target.closest('[data-run-start]'), door = event.target.closest('.moon-run-door');
      if (starter) return begin(starter.dataset.runStart);
      if (event.target.closest('[data-run-again]')) { show('intro'); find('[data-run-start]').focus({ preventScroll: true }); return; }
      if (event.target.closest('.moon-run-switch')) return startCards('달 카드로 이어 가요. 지나온 문은 그대로예요.');
      if (door && view === 'cards') {
        const result = tryDoor(current, +door.dataset.door);
        if (result.ok) { if (current >= gates.length) finish(); else { drawCards(); cards.querySelector('button')?.focus({ preventScroll: true }); } return; }
        if (result.reveal) drawCards(result.answer);
        const again = cards.querySelector(`[data-door="${door.dataset.door}"]`);
        again.classList.add('is-wrong'); again.focus({ preventScroll: true });
      }
    }, { signal });
    element.addEventListener('close', cleanup, { once: true });
    hud();
  }, button('닫기', 'close-modal', 'primary'));
}
