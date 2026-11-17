// Layout of the hill path, in metres. `s` is the distance walked from the start; the scene puts it at z = -s.
// The path is a hill on Earth: ordinary jump height, no low-gravity moves. Pure data so tests can check it.
export const HALF = 4.8;          // half width of the path
export const DOOR_HALF = 1.1;     // half width of one door opening
export const WALL = 0.25;         // half thickness of a gate wall
export const JUMP_REACH = 2.5;    // a running jump clears about this far (see moon-run-stage.js)
// Three parts: practice (flat), apply (one step up, one lantern stone), challenge (another step, two stones).
export const slabs = [
  { s0: -5, s1: 8, top: 0 },
  { s0: 9.2, s1: 23, top: 0 },
  { s0: 24.3, s1: 36, top: 0 },
  { s0: 36, s1: 42, top: 0.45 },
  { s0: 46, s1: 60, top: 0.45 },
  { s0: 61.3, s1: 72, top: 0.45 },
  { s0: 72, s1: 77, top: 0.9 },
  { s0: 83.7, s1: 99, top: 0.9 },
  { s0: 100.3, s1: 120, top: 0.9 },
];
/** Lantern stepping stones in the wider streams. */
export const stones = [
  { s0: 43.1, s1: 44.9, x: 0, half: 1.8, top: 0.45 },
  { s0: 78.2, s1: 80, x: -0.9, half: 1.7, top: 0.9 },
  { s0: 81.1, s1: 82.7, x: 0.9, half: 1.7, top: 0.9 },
];
export const gateS = [16, 32, 52, 67, 90, 106];
export const arriveS = 110.5;
export const observatoryS = 115;
export const doorXs = count => (count === 2 ? [-2.2, 2.2] : [-3.2, 0, 3.2]);
export const slabAt = s => slabs.find(slab => s >= slab.s0 && s <= slab.s1) || null;
/** The floor or stepping stone under a point, or null over a stream. */
export function groundAt(s, x = 0) {
  if (Math.abs(x) <= HALF) { const slab = slabAt(s); if (slab) return slab; }
  return stones.find(stone => s >= stone.s0 && s <= stone.s1 && Math.abs(x - stone.x) <= stone.half) || null;
}
/** Streams between pieces of floor, as [from, to] along the path. */
export function streams() {
  const out = [];
  for (let i = 1; i < slabs.length; i++) if (slabs[i].s0 - slabs[i - 1].s1 > 0.01) out.push([slabs[i - 1].s1, slabs[i].s0]);
  return out;
}
/** Where Lumi returns after a fall: the near end of the last floor she stood on. Open doors stay open. */
export function checkpointFor(s) {
  let last = slabs[0];
  for (const slab of slabs) if (slab.s0 <= s + 0.01) last = slab;
  return { s: Math.max(0, last.s0 + 1.2), top: last.top };
}
