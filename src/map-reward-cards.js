import { createRewardCards } from './reward-cards.js';
import { chapters } from './data.js';

// One achievement card per map villain, in facility order. world.js mounts one villain per chapter and uses the
// chapter id ('1'-'5') as the encounter id, so that id is also the key in state.mapHits. The star count rises with the chapter.
const TITLES = ['달 표면 관측 대장', '달 모양 변화 기록왕', '태양계 행성 박사', '별과 행성 판별 탐정', '북극성 별자리 영웅'];
const base = '/assets/reward-cards/';
export const REWARD_CARDS = chapters.map((chapter, index) => {
  const id = String(chapter.id), file = `${index + 1}-${id}.webp`;
  return { id, title: TITLES[index], stage: chapter.place, art: `${base}card-${file}`, thumb: `${base}thumb-${file}` };
});
const HITS = 3;
// A card is owned once its villain has taken all three hits (state.mapHits). Nothing extra is saved.
export const ownedRewardCards = hits => REWARD_CARDS.map(({ id }) => hits?.[id] === HITS);
// Card indexes won by this save patch: only the hit that takes a villain from under three to three.
export const newRewardCards = (before, patch) => REWARD_CARDS.flatMap(({ id }, index) => before?.[id] !== HITS && patch?.[id] === HITS ? [index] : []);

// Cue names in sound.js mapCues (public/assets/audio/sfx).
const SOUNDS = { whoosh: 'cardWhoosh', reveal: 'cardReveal', epic: 'cardEpic', slot: 'cardSlot', complete: 'cardComplete' };
// application.js hands over its map cue call with each award, so the cards follow the sound switch and the effects setting.
let cue = () => {};

// Built on first use: tests load this module without a browser.
let instance;
function rewards() {
  return instance ??= createRewardCards({
    setName: '별빛 관측 연구소 성취 카드',
    cards: REWARD_CARDS,
    theme: { accent: '#f5cf7b', accent2: '#101e36', glow: '#ffe9b4', ink: '#20354c' },
    particles: ['star', 'spark', 'circle'],
    colors: ['#f5cf7b', '#ffe9b4', '#8fd5d2', '#bcb0ff', '#9edcf4', '#ffffff'],
    // The gold star of the app icon (public/favicon.svg).
    emblem: '<svg viewBox="4 4 56 56" aria-hidden="true"><path d="m32 8 6 17 18 1-14 12 5 18-15-10-15 10 5-18L8 26l18-1z" fill="#ffcf68"/></svg>',
    sound: name => cue(SOUNDS[name]),
    inertRoot: () => document.querySelector('#app'),
  });
}

// A card on its way to a slot stays empty in the header until it lands, even if the header is redrawn in between.
const flying = new Set();
const shown = hits => ownedRewardCards(hits).map((owned, index) => owned && !flying.has(index));
/** True from a villain's third hit until its card sits in the slot. world.js leaves the all-villains chime to the card meanwhile. */
export const rewardCardPending = () => flying.size > 0;
/** The slot strip for the header, just before the sound button. */
export const rewardSlotsHtml = hits => rewards().slotsHtml(shown(hits));

// The villain leaves in about 0.7 s. Its parting line is still being spoken then, and effects stay silent under a
// voice (sound.js), so the card waits until no voice has played for CLEAR ms; PATIENCE caps that wait.
const EXIT = 760, EXIT_CALM = 520, POLL = 120, CLEAR = 360, PATIENCE = 8000, BUBBLE = 2750;
let holdAt = 0;
/**
 * The card's turn. The map finale opens 2.92 s after the fifth villain's last hit; a card that is still waiting
 * (for the voice, or for a dialog opened in between) holds it from the moment the villain's speech bubble has gone.
 * world.js adds this to the villains' blocked(), so the finale keeps its own trigger and simply comes after the card.
 */
export const rewardCardDue = (now = Date.now()) => holdAt > 0 && now >= holdAt;
const landed = index => { flying.delete(index); if (!flying.size) holdAt = 0; };
/**
 * Shows the cards won by a villain save (world.js onSave) once the villain's exit has played and its voice is over.
 * The card flies in from the villain if it is still on screen. hits() returns the saved hit record at that moment,
 * open() says whether the map is still the screen in view, masked() whether a voice is silencing the effects,
 * sound(name) plays a sound.js map cue.
 */
export function awardRewardCards(before, patch, { hits, open, sound, masked = () => false, reduced = false }) {
  const won = newRewardCards(before, patch);
  if (!won.length) return;
  if (sound) cue = sound;
  for (const index of won) {
    const earned = Date.now(), ready = earned + (reduced ? EXIT_CALM : EXIT);
    let clearSince = 0;
    flying.add(index);
    if (ownedRewardCards({ ...before, ...patch }).every(Boolean)) holdAt = earned + BUBBLE;
    const show = () => {
      const owned = ownedRewardCards(hits());
      // Left the map or the record was reset meanwhile: no reveal, the slot just follows the record.
      if (!open() || !owned[index]) { landed(index); rewards().syncSlots(shown(hits())); return; }
      const now = Date.now();
      clearSince = masked() ? 0 : clearSince || now;
      // A dialog opened in the meantime (settings) sits above the card layer: wait until it is closed.
      if (document.hidden || document.querySelector('dialog[open]') || now < ready || (!clearSince || now - clearSince < CLEAR) && now - earned < PATIENCE) { setTimeout(show, POLL); return; }
      const foe = document.querySelector(`.map-encounter-foe[data-encounter="${REWARD_CARDS[index].id}"]`), box = foe && !foe.hidden ? foe.getBoundingClientRect() : null;
      rewards().reveal(index, box ? { x: box.left, y: box.top - 30 } : undefined, owned.map((has, other) => has && (other === index || !flying.has(other)))).finally(() => landed(index));
    };
    setTimeout(show, ready - CLEAR - earned);
  }
}
