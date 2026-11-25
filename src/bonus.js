import { planets } from './data.js';
import { track } from './state.js';
import { moonSVG, dayMoon, phase, esc, icon } from './drawing.js';
import { button, range, planetImage } from './ui.js';
import { openMoonPath } from './moon-path-ui.js';

// Optional bonus quests after the core is restored. They never change mission completion.
export const bonusQuests = {
  cloudy: { title: '구름 낀 날의 관측 기록', reward: '비밀 달 관측 기록', icon: 'moon' },
  planet: { title: '새로운 행성 관측 의뢰', reward: '심화 행성 연구 카드', icon: 'planet' },
  path: { title: '달빛 길 따라가기', reward: '달빛 길잡이 카드', icon: 'map' },
};
const CLOUDY_DAY = 7, MYSTERY = 'uranus';
export function cloudyClose(guess) {
  const actual = phase(CLOUDY_DAY);
  return guess.side === actual.side && Math.abs(guess.amount - actual.amount) <= 20;
}
export function planetSolved(guess) {
  const planet = planets.find(item => item.id === MYSTERY);
  return guess.feature === planet.feature && guess.name === MYSTERY;
}
export function openBonus(kind, { state, dialog, persist, sound, on, reduced = false }) {
  const quest = bonusQuests[kind];
  const showCompletedCard = () => {
    const card = document.querySelector(`.bonus-card[data-action="bonus-${kind}"]`);
    if (!card || card.classList.contains('is-done')) return;
    card.classList.add('is-done');
    card.lastElementChild.outerHTML = `<span class="sr-only">${quest.reward} 획득</span>${icon('check')}`;
  };
  // The third bonus has its own screen: a 3D hill path, with moon cards as the other way to play.
  if (kind === 'path') return openMoonPath(quest, { state, dialog, persist, sound, reduced, showCompletedCard });
  if (kind === 'cloudy') {
    const guess = { amount: 20, side: '', revealed: false };
    const draw = () => `<div class="bonus-board"><figure>${dayMoon(3)}<figcaption>3일째 기록</figcaption></figure><figure class="bonus-missing"><div id="cloudy-guess">${guess.side ? moonSVG(guess.amount, guess.side) : '<span class="moon-unknown" aria-hidden="true">?</span>'}</div><div class="bonus-cloud ${guess.revealed ? 'is-clear' : ''}" aria-hidden="true"></div>${guess.revealed ? `<div class="bonus-actual">${dayMoon(CLOUDY_DAY)}</div>` : ''}<figcaption>7일째 · ${guess.revealed ? '예상과 기록' : '내 예상'}</figcaption></figure><figure>${dayMoon(10)}<figcaption>10일째 기록</figcaption></figure></div>`;
    const sides = [['left', '왼쪽'], ['right', '오른쪽']].map(([side, label]) =>
      button(`<span aria-hidden="true">${moonSVG(50, side)}</span>${label}이 밝아요`, 'cloudy-' + side, 'choice-card', 'aria-pressed="false"')).join('');
    dialog(quest.title, `<p class="bonus-lead">앞뒤 달을 보고 7일째에 밝을 쪽을 골라요.</p><div id="bonus-host">${draw()}</div><div class="bonus-controls"><div class="choice-grid two" role="group" aria-label="밝을 쪽 고르기">${sides}</div><div id="cloudy-size" hidden>${range('밝은 부분', 'cloudy-amount', 0, 100, guess.amount, 1, '%')}</div></div><p id="bonus-feedback" class="inline-feedback" role="status" data-tone="hint"></p>`, element => {
      element.classList.add('bonus-observation-dialog');
      const host = element.querySelector('#bonus-host'), feedback = element.querySelector('#bonus-feedback');
      const options = [...element.querySelectorAll('.bonus-controls [data-action]')];
      const redraw = () => {
        host.innerHTML = draw();
        for (const option of options) {
          const chosen = option.dataset.action === 'cloudy-' + guess.side;
          option.classList.toggle('selected', chosen);
          option.setAttribute('aria-pressed', String(chosen));
        }
      };
      const editGuess = () => { guess.revealed = false; feedback.textContent = ''; redraw(); };
      on(element.querySelector('#cloudy-amount'), 'input', event => { guess.amount = +event.target.value; element.querySelector('#cloudy-amount-value').textContent = guess.amount + '%'; editGuess(); });
      for (const side of ['right', 'left']) on(element.querySelector(`[data-action="cloudy-${side}"]`), 'click', () => {
        guess.side = side;
        element.querySelector('#cloudy-size').hidden = false;
        element.querySelector('#cloudy-check').disabled = false;
        editGuess();
      });
      on(element.querySelector('#cloudy-check'), 'click', () => {
        guess.revealed = cloudyClose(guess); redraw();
        if (guess.revealed) {
          feedback.dataset.tone = 'success';
          feedback.textContent = `앞뒤 기록 사이의 변화를 잘 읽었어요! ${quest.reward}을 연구 키트에 담았어요.`;
          if (state.bonus.cloudy !== 'done') { state.bonus.cloudy = 'done'; sound.play('success'); persist(); showCompletedCard(); }
        } else {
          track(state, 'retries'); persist(); sound.play('retry');
          feedback.dataset.tone = 'hint';
          feedback.textContent = guess.side !== phase(CLOUDY_DAY).side
            ? '앞뒤 기록에서 밝은 쪽을 다시 비교해요.'
            : '앞뒤 기록의 밝은 부분 크기를 다시 비교해요.';
        }
      });
    }, `${button('닫기', 'close-modal')}<button class="btn primary" id="cloudy-check" disabled>구름 걷고 비교하기</button>`);
    return;
  }
  const guess = { feature: '', name: '' };
  dialog(quest.title, `<div class="bonus-planet"><div class="bonus-planet-view"><div id="mystery-frame">${planetImage(MYSTERY, '이름표가 없는 미확인 행성 학습용 그림', 'mystery-planet')}</div>${range('확대', 'mystery-zoom', 1, 2, 1, .1, '×')}</div><div class="bonus-planet-form"><p class="field-label" id="mystery-feature-label">그림에서 보이는 특징을 골라요</p><div class="bonus-chips feature-chips" role="group" aria-labelledby="mystery-feature-label">${[2, 6, 0, 4, 7, 1, 5, 3].map(index => planets[index]).map(planet => `<button type="button" class="btn choice-card" data-pick="feature" data-value="${esc(planet.feature)}" aria-pressed="false">${esc(planet.feature)}</button>`).join('')}</div><div id="mystery-names" hidden><p class="field-label" id="mystery-name-label">어떤 행성인지 골라요</p><div class="bonus-chips name-chips" role="group" aria-labelledby="mystery-name-label">${planets.map(planet => `<button type="button" class="btn choice-card" data-pick="name" data-value="${planet.id}" aria-pressed="false">${planet.name}</button>`).join('')}</div></div></div></div><p id="bonus-feedback" class="inline-feedback" role="status" data-tone="hint"></p>`, element => {
    element.classList.add('bonus-observation-dialog');
    const feedback = element.querySelector('#bonus-feedback');
    on(element.querySelector('#mystery-zoom'), 'input', event => { element.querySelector('#mystery-zoom-value').textContent = event.target.value + '×'; element.querySelector('.mystery-planet').style.transform = `scale(${event.target.value})`; });
    element.querySelectorAll('[data-pick]').forEach(chip => on(chip, 'click', () => {
      guess[chip.dataset.pick] = chip.dataset.value;
      element.querySelector('#mystery-names').hidden = false;
      element.querySelector('#planet-check').disabled = !guess.name;
      element.querySelectorAll(`[data-pick="${chip.dataset.pick}"]`).forEach(other => { const picked = other === chip; other.classList.toggle('selected', picked); other.setAttribute('aria-pressed', String(picked)); });
      sound.play('click');
    }));
    on(element.querySelector('#planet-check'), 'click', () => {
      if (!guess.feature || !guess.name) { feedback.dataset.tone = 'hint'; feedback.textContent = '관찰한 특징과 이름을 모두 골라 줘요.'; return; }
      if (planetSolved(guess)) {
        feedback.dataset.tone = 'success';
        feedback.textContent = `옅은 청록색 대기를 근거로 천왕성을 찾았어요! ${quest.reward}를 연구 키트에 담았어요.`;
        if (state.bonus.planet !== 'done') { state.bonus.planet = 'done'; sound.play('success'); persist(); showCompletedCard(); }
        return;
      }
      track(state, 'retries'); persist(); sound.play('retry');
      feedback.dataset.tone = 'hint';
      feedback.textContent = guess.feature !== planets.find(planet => planet.id === MYSTERY).feature
        ? '고른 특징이 그림에서 정말 보이는지 확대해서 다시 확인해 봐요.'
        : '특징은 잘 찾았어요. 같은 특징을 가진 행성은 무엇이었는지 조사 기록을 떠올려 봐요.';
    });
  }, `${button('닫기', 'close-modal')}<button class="btn primary" id="planet-check" disabled>관측 확인</button>`);
}
