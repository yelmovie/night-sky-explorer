import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { REWARD_CARDS, ownedRewardCards, newRewardCards, rewardCardPending, rewardCardDue } from '../src/map-reward-cards.js';
import { chapters } from '../src/data.js';
import { mapCues } from '../src/sound.js';

test('one achievement card per map villain, in facility order, with its art and thumbnail', () => {
  // world.js mounts the villains with the chapter id as the encounter id: the same ids key state.mapHits.
  assert.deepEqual(REWARD_CARDS.map(card => card.id), ['1', '2', '3', '4', '5']);
  assert.deepEqual(REWARD_CARDS.map(card => card.id), chapters.map(chapter => String(chapter.id)));
  assert.deepEqual(REWARD_CARDS.map(card => card.stage), chapters.map(chapter => chapter.place));
  assert.equal(new Set(REWARD_CARDS.map(card => card.title)).size, 5);
  for (const card of REWARD_CARDS) for (const file of [card.art, card.thumb]) {
    assert.match(file, /^\/assets\/reward-cards\/(card|thumb)-[1-5]-[1-5]\.webp$/);
    assert.ok(existsSync(new URL('../public' + file, import.meta.url)), file);
  }
});

test('a card is owned only after the third hit, from the existing hit record', () => {
  assert.deepEqual(ownedRewardCards({}), [false, false, false, false, false]);
  assert.deepEqual(ownedRewardCards(undefined), [false, false, false, false, false]);
  assert.deepEqual(ownedRewardCards({ 1: 3, 2: 2, 4: 3 }), [true, false, false, true, false]);
});

test('a card is won only by the hit that takes a villain from under three to three', () => {
  assert.deepEqual(newRewardCards({}, { 2: 1 }), []);
  assert.deepEqual(newRewardCards({ 2: 2 }, { 2: 3 }), [1]);
  assert.deepEqual(newRewardCards({ 2: 3 }, { 2: 3 }), []);
  assert.deepEqual(newRewardCards({ 1: 3, 5: 2 }, { 1: 3, 5: 3 }), [4]);
  assert.equal(rewardCardPending(), false);
  assert.equal(rewardCardDue(), false);
});

test('the card cues are map cues, and the shared card module is wired without a second finale path', () => {
  for (const name of ['cardWhoosh', 'cardReveal', 'cardEpic', 'cardSlot', 'cardComplete']) assert.ok(mapCues[name], name);
  const world = readFileSync(new URL('../src/world.js', import.meta.url), 'utf8');
  // The villains (and their finale) wait while the last card is due or open; the world itself pauses behind the inert app.
  assert.match(world, /blocked:\(\)=>blocked\(\)\|\|rewardCardDue\(\)/);
  assert.equal(world.match(/root\.closest\('\[inert\]'\)/g)?.length, 3);
  for (const file of ['world.js', 'application.js', 'map-reward-cards.js']) assert.doesNotMatch(readFileSync(new URL('../src/' + file, import.meta.url), 'utf8'), /openMapFinale/);
});
