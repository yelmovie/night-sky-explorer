// Tap-to-choose observation sentences replace free typing on tablets.
// Every choice is checked against the student's own data, so the concept is still judged, not skipped.
import { phase } from './drawing.js';
import { patternRegions, referenceLines } from './data.js';

const lineKey = line => [...line].sort().join(':');

export function moonSurfaceChoices() {
  return [{
    key: 'look',
    title: '두 곳을 비교하면?',
    options: [
      { id: 'shade', text: '밝은 곳과 어두운 곳의 색이 달라요.', ok: true },
      { id: 'crater', text: '둥근 구덩이의 크기와 개수가 달라요.', ok: true },
      { id: 'same', text: '두 곳은 완전히 똑같이 생겼어요.', ok: false, hint: '두 확대 그림을 다시 봐. 밝기와 구덩이가 정말 같을까?' },
    ],
  }];
}

export function phaseChoices(day, original) {
  const actual = phase(day), diff = actual.amount - (original?.amount ?? 0);
  return [{
    key: 'size',
    title: '밝은 부분의 크기는?',
    options: [
      { id: 'bigger', label: '더 커요', text: '밝은 부분이 내 예상보다 컸어요.', ok: diff > 5, hint: '겹친 그림을 봐. 관측 자료의 밝은 부분이 정말 더 클까?' },
      { id: 'similar', label: '비슷해요', text: '밝은 부분의 크기가 예상과 비슷했어요.', ok: Math.abs(diff) <= 15, hint: '두 그림의 밝은 부분 넓이를 다시 비교해 봐.' },
      { id: 'smaller', label: '더 작아요', text: '밝은 부분이 내 예상보다 작았어요.', ok: diff < -5, hint: '겹친 그림을 봐. 관측 자료의 밝은 부분이 정말 더 작을까?' },
    ],
  }, {
    key: 'side',
    title: '밝은 쪽 방향은?',
    options: [
      { id: 'same-side', label: '같아요', text: '밝은 쪽 방향이 예상과 같았어요.', ok: original?.side === actual.side, hint: '관측 자료에서 오른쪽과 왼쪽 중 어디가 밝은지 다시 봐.' },
      { id: 'other-side', label: '반대예요', text: '밝은 쪽 방향이 예상과 반대였어요.', ok: original?.side !== actual.side, hint: '관측 자료에서 오른쪽과 왼쪽 중 어디가 밝은지 다시 봐.' },
    ],
  }];
}

export function patternChoices(region, lines = []) {
  const stars = patternRegions[region].stars;
  const reference = new Set(referenceLines.filter(line => line.every(id => stars.includes(id))).map(lineKey));
  const mine = [...new Set(lines.map(lineKey))], same = mine.filter(key => reference.has(key)).length;
  return [{
    key: 'match',
    title: '내 선과 기준선은?',
    options: [
      { id: 'all', label: '모두 같아요', text: '내 선이 기준선과 모두 같았어요.', ok: mine.length > 0 && same === mine.length, hint: '노란 점선과 내 선을 하나씩 겹쳐 봐.' },
      { id: 'some', label: '일부만 같아요', text: '일부 선은 같고 일부는 달랐어요.', ok: same > 0 && same < mine.length, hint: '노란 점선과 내 선을 하나씩 겹쳐 봐.' },
      { id: 'none', label: '모두 달라요', text: '내 선은 기준선과 모두 달랐어요.', ok: mine.length > 0 && same === 0, hint: '노란 점선과 내 선을 하나씩 겹쳐 봐.' },
    ],
  }, {
    key: 'idea',
    title: '선을 다르게 이으면?',
    options: [
      { id: 'stay', label: '별은 그대로예요', text: '선이 달라도 별의 위치는 그대로예요.', ok: true },
      { id: 'move', label: '별이 옮겨져요', text: '선을 다르게 이으면 별의 위치도 바뀌어요.', ok: false, hint: '선을 지워도 별은 같은 자리에 있었어. 다시 생각해 봐.' },
    ],
  }];
}

// picks: { [groupKey]: optionId }. Returns the sentence once every group has a correct pick.
export function composeReflection(groups, picks = {}) {
  const chosen = groups.map(group => group.options.find(option => option.id === picks[group.key]));
  if (chosen.some(option => !option?.ok)) return '';
  return chosen.map(option => option.text).join(' ');
}

export function choiceFeedback(groups, picks = {}) {
  for (const group of groups) {
    const option = group.options.find(item => item.id === picks[group.key]);
    if (option && !option.ok) return { tone: 'hint', text: option.hint };
  }
  if (groups.every(group => group.options.find(item => item.id === picks[group.key])?.ok)) return { tone: 'success', text: '자료와 맞는 관찰이야! 기록에 담았어.' };
  return { tone: 'hint', text: groups.length > 1 ? '두 줄에서 하나씩 골라요.' : '알맞은 문장을 골라요.' };
}

export function choiceMarkup(groups, picks = {}, saved = '', { compact = false } = {}) {
  const hasPicks = Object.keys(picks).length > 0;
  const incorrect = groups.some(group => group.options.some(option => option.id === picks[group.key] && !option.ok));
  const message = incorrect ? choiceFeedback(groups, picks).text : '';
  return `<div class="reflection-choices${compact ? ' compact-choices' : ''}" role="group" aria-label="관찰 문장 고르기">${groups.map(group => `<fieldset class="choice-row"><legend>${group.title}</legend>${group.options.map(option => {
    const picked = hasPicks ? picks[group.key] === option.id : option.ok && saved.includes(option.text);
    return `<button type="button" class="btn sentence-chip ${picked ? option.ok ? 'is-right' : 'is-wrong' : ''}" data-learning="pick-${group.key}-${option.id}" aria-pressed="${picked}">${option.label || option.text}</button>`;
  }).join('')}</fieldset>`).join('')}<p id="reflection-feedback" class="inline-feedback" role="status" data-tone="hint" ${message?'':'hidden'}>${message}</p></div>`;
}
