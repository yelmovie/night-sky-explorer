import { planets } from './data.js';
import { track } from './state.js';
import { moonSVG, dayMoon, phase, esc } from './drawing.js';
import { button, range, planetImage } from './ui.js';

// Optional bonus quests after the core is restored. They never change mission completion.
export const bonusQuests = {
  cloudy: { title: '구름 낀 날의 관측 기록', reward: '비밀 달 관측 기록', text: '구름에 가려 빠진 7일째 달을 앞뒤 기록으로 예상해요.' },
  planet: { title: '새로운 행성 관측 의뢰', reward: '심화 행성 연구 카드', text: '이름표 없는 행성을 관찰해 증거로 이름을 찾아요.' },
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
export function openBonus(kind, { state, dialog, persist, sound, on }) {
  const quest = bonusQuests[kind], done = state.bonus[kind] === 'done';
  if (kind === 'cloudy') {
    const guess = { amount: 20, side: 'left', revealed: false };
    const draw = () => `<div class="bonus-board"><figure>${dayMoon(3)}<figcaption>3일째 기록</figcaption></figure><figure class="bonus-missing"><div id="cloudy-guess">${moonSVG(guess.amount, guess.side)}</div><div class="bonus-cloud ${guess.revealed ? 'is-clear' : ''}" aria-hidden="true"></div>${guess.revealed ? `<div class="bonus-actual">${dayMoon(CLOUDY_DAY)}</div>` : ''}<figcaption>7일째 · ${guess.revealed ? '내 예상 위에 학습용 기록을 겹쳤어요' : '구름에 가려 빠졌어요'}</figcaption></figure><figure>${dayMoon(10)}<figcaption>10일째 기록</figcaption></figure></div>`;
    dialog(quest.title, `<p class="bonus-lead">${quest.text} 밝은 부분의 크기와 방향을 앞뒤 기록과 비교해 봐요.</p><div id="bonus-host">${draw()}</div><div class="bonus-controls">${range('밝은 부분', 'cloudy-amount', 0, 100, guess.amount, 1, '%')}<div class="choice-grid two">${button('오른쪽이 밝아', 'cloudy-right', 'choice-card')}${button('왼쪽이 밝아', 'cloudy-left', 'choice-card selected')}</div></div><p id="bonus-feedback" class="inline-feedback" role="status" data-tone="hint">${done ? `이미 ${quest.reward}을 받았어요. 다시 연습할 수 있어요.` : '예상을 만든 뒤 구름을 걷어 봐요.'}</p>`, element => {
      const host = element.querySelector('#bonus-host'), feedback = element.querySelector('#bonus-feedback');
      const redraw = () => { host.innerHTML = draw(); element.querySelector('[data-action="cloudy-right"]').classList.toggle('selected', guess.side === 'right'); element.querySelector('[data-action="cloudy-left"]').classList.toggle('selected', guess.side === 'left'); };
      on(element.querySelector('#cloudy-amount'), 'input', event => { guess.amount = +event.target.value; element.querySelector('#cloudy-amount-value').textContent = guess.amount + '%'; redraw(); });
      for (const side of ['right', 'left']) on(element.querySelector(`[data-action="cloudy-${side}"]`), 'click', () => { guess.side = side; redraw(); });
      on(element.querySelector('#cloudy-check'), 'click', () => {
        guess.revealed = true; redraw();
        if (cloudyClose(guess)) {
          feedback.dataset.tone = 'success';
          feedback.textContent = `앞뒤 기록 사이의 변화를 잘 읽었어요! ${quest.reward}을 연구 키트에 담았어요.`;
          if (state.bonus.cloudy !== 'done') { state.bonus.cloudy = 'done'; sound.play('success'); persist(); }
        } else {
          track(state, 'retries'); persist(); sound.play('retry');
          feedback.dataset.tone = 'hint';
          feedback.textContent = guess.side !== phase(CLOUDY_DAY).side
            ? '3일째와 10일째 달은 같은 쪽이 밝아요. 방향을 다시 비교해 볼까요?'
            : '3일째보다는 크고 10일째보다는 작아야 해요. 밝은 부분을 다시 조절해 봐요.';
        }
      });
    }, `<button class="btn primary" id="cloudy-check">구름 걷고 비교하기</button>${button('닫기', 'close-modal')}`);
    return;
  }
  const guess = { feature: '', name: '' };
  dialog(quest.title, `<p class="bonus-lead">${quest.text} 힌트는 없어요. 그림에서 보이는 특징을 먼저 골라요.</p><div class="bonus-planet"><div class="bonus-planet-view"><div id="mystery-frame">${planetImage(MYSTERY, '이름표가 없는 미확인 행성 학습용 그림', 'mystery-planet')}</div>${range('확대', 'mystery-zoom', 1, 2, 1, .1, '×')}</div><div class="bonus-planet-form"><label class="field-label" for="mystery-feature">1. 관찰한 특징</label><select id="mystery-feature"><option value="">보이는 특징을 골라요</option>${planets.map(planet => `<option>${esc(planet.feature)}</option>`).join('')}</select><label class="field-label" for="mystery-name">2. 증거로 찾은 이름</label><select id="mystery-name"><option value="">행성 이름을 골라요</option>${planets.map(planet => `<option value="${planet.id}">${planet.name}</option>`).join('')}</select></div></div><p id="bonus-feedback" class="inline-feedback" role="status" data-tone="hint">${done ? `이미 ${quest.reward}를 받았어요. 다시 연습할 수 있어요.` : '특징과 이름을 모두 고른 뒤 판정해요.'}</p>`, element => {
    const feedback = element.querySelector('#bonus-feedback');
    on(element.querySelector('#mystery-zoom'), 'input', event => { element.querySelector('#mystery-zoom-value').textContent = event.target.value + '×'; element.querySelector('.mystery-planet').style.transform = `scale(${event.target.value})`; });
    on(element.querySelector('#mystery-feature'), 'change', event => { guess.feature = event.target.value; });
    on(element.querySelector('#mystery-name'), 'change', event => { guess.name = event.target.value; });
    on(element.querySelector('#planet-check'), 'click', () => {
      if (!guess.feature || !guess.name) { feedback.dataset.tone = 'hint'; feedback.textContent = '관찰한 특징과 이름을 모두 골라 줘요.'; return; }
      if (planetSolved(guess)) {
        feedback.dataset.tone = 'success';
        feedback.textContent = `옅은 청록색 대기를 근거로 천왕성을 찾았어요! ${quest.reward}를 연구 키트에 담았어요.`;
        if (state.bonus.planet !== 'done') { state.bonus.planet = 'done'; sound.play('success'); persist(); }
        return;
      }
      track(state, 'retries'); persist(); sound.play('retry');
      feedback.dataset.tone = 'hint';
      feedback.textContent = guess.feature !== planets.find(planet => planet.id === MYSTERY).feature
        ? '고른 특징이 그림에서 정말 보이는지 확대해서 다시 확인해 봐요.'
        : '특징은 잘 찾았어요. 같은 특징을 가진 행성은 무엇이었는지 조사 기록을 떠올려 봐요.';
    });
  }, `<button class="btn primary" id="planet-check">증거로 판정하기</button>${button('닫기', 'close-modal')}`);
}
