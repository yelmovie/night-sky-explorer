import { SAVE_KEY, freshState, restore, canAccess } from './state.js';

// Fail closed: a tab must never silently replace another tab's research.
export function createResearchSession(storage) {
  let expected = null, blocked = false, warning = '', state = freshState();
  try {
    expected = storage.getItem(SAVE_KEY);
    if (expected) {
      const raw = JSON.parse(expected);
      if (!raw || typeof raw !== 'object' || ![1, 2].includes(raw.version)) throw Error('unsupported');
      state = restore(raw);
    }
  } catch {
    blocked = true;
    warning = '기존 기록을 읽지 못해 자동저장을 멈췄어요. 원본은 덮어쓰지 않아요. 현재 기록을 파일로 저장하고 선생님께 알려 주세요.';
  }
  state.settings.adminUnlock = false;
  if (!canAccess(state, state.scene)) state.scene = 'map';
  if (!canAccess(state, state.resume)) state.resume = 'map';
  const fail = message => { blocked = true; warning = message; return false; };
  return {
    state,
    get warning() { return warning; },
    save(value) {
      if (blocked) return false;
      try {
        if (storage.getItem(SAVE_KEY) !== expected)
          return fail('다른 창에서 기록이 바뀌어 자동저장을 멈췄어요. 현재 기록을 파일로 저장한 뒤 새로고침해 주세요.');
        const next = JSON.stringify({ ...value, updatedAt: new Date().toISOString() });
        storage.setItem(SAVE_KEY, next);
        expected = next;
        return true;
      } catch { return fail('이 기기에 저장하지 못했어요. 현재 기록을 파일로 저장해 주세요.'); }
    },
    backup() {
      if (blocked) return false;
      try {
        if (storage.getItem(SAVE_KEY) !== expected) return fail('다른 창의 기록이 바뀌었어요. 새로고침한 뒤 초기화해 주세요.');
        if (expected !== null) {
          let key = `${SAVE_KEY}:before-reset:${Date.now()}`;
          while (storage.getItem(key) !== null) key += '-1';
          storage.setItem(key, expected);
        }
        return true;
      } catch { return fail('초기화 전 백업을 저장하지 못해 초기화를 멈췄어요. 기록 파일을 먼저 저장해 주세요.'); }
    },
  };
}
