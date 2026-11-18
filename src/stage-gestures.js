// Hands-on gestures that give each stage its own feel. Each one only changes what the
// student sees or reaches; recording still goes through the normal learning actions.

// s3a: the planet arrives behind a cloud of noisy data; rubbing it away reveals the picture.
export function mountFogWipe(canvas, { onReveal, signal }) {
  if (!canvas) return;
  const box = canvas.getBoundingClientRect(), ratio = Math.min(2, devicePixelRatio || 1);
  canvas.width = Math.max(1, Math.round(box.width * ratio));
  canvas.height = Math.max(1, Math.round(box.height * ratio));
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const base = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * .6);
  base.addColorStop(0, '#b9c6d8'); base.addColorStop(1, '#5d6f8a');
  ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 70; i++) {
    const x = Math.random() * w, y = Math.random() * h, r = (30 + Math.random() * 90) * ratio;
    const puff = ctx.createRadialGradient(x, y, 0, x, y, r);
    puff.addColorStop(0, i % 3 ? '#e8eef7cc' : '#8a9bb6aa'); puff.addColorStop(1, '#e8eef700');
    ctx.fillStyle = puff; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  let down = false, moves = 0, done = false, last = null;
  const radius = Math.max(34, Math.min(w, h) * .1);
  // Only the middle of the view (where the planet sits) has to be wiped clear.
  const cleared = () => {
    const x0 = Math.round(w * .25), y0 = Math.round(h * .2), cw = Math.round(w * .5), ch = Math.round(h * .6);
    const data = ctx.getImageData(x0, y0, cw, ch).data; let clear = 0, total = 0;
    for (let y = 2; y < ch; y += 12) for (let x = 2; x < cw; x += 12) { total++; if (data[(y * cw + x) * 4 + 3] < 60) clear++; }
    return clear / total;
  };
  const finish = () => { if (done) return; done = true; canvas.classList.add('is-cleared'); setTimeout(onReveal, 420); };
  const erase = event => {
    const r = canvas.getBoundingClientRect();
    const point = { x: (event.clientX - r.left) * w / r.width, y: (event.clientY - r.top) * h / r.height };
    ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = '#000'; ctx.strokeStyle = '#000';
    ctx.lineCap = 'round'; ctx.lineWidth = radius * 2;
    ctx.beginPath(); ctx.moveTo((last || point).x, (last || point).y); ctx.lineTo(point.x + .01, point.y); ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
    last = point;
    if (++moves % 6 === 0 && cleared() > .45) finish();
  };
  canvas.addEventListener('pointerdown', event => { down = true; last = null; canvas.setPointerCapture(event.pointerId); erase(event); }, { signal });
  canvas.addEventListener('pointermove', event => { if (down) erase(event); }, { signal });
  for (const type of ['pointerup', 'pointercancel']) canvas.addEventListener(type, () => { down = false; last = null; if (cleared() > .45) finish(); }, { signal });
  canvas.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); finish(); } }, { signal });
}

// s4a: drag the screen into the sunbeam (or back out) instead of pressing a toggle.
export const BEAM_ZONE = { x1: 118, x2: 240, y1: 20, y2: 140 };
export function mountShieldDrag(svg, { blocked, onChange, signal }) {
  const shield = svg?.querySelector('[data-shield]');
  if (!shield) return;
  const toSvg = event => { const point = svg.createSVGPoint(); point.x = event.clientX; point.y = event.clientY; return point.matrixTransform(svg.getScreenCTM().inverse()); };
  let start = null;
  shield.addEventListener('pointerdown', event => { start = toSvg(event); shield.setPointerCapture(event.pointerId); shield.classList.add('is-dragging'); event.preventDefault(); }, { signal });
  shield.addEventListener('pointermove', event => {
    if (!start) return; const p = toSvg(event);
    shield.setAttribute('transform', `translate(${p.x - start.x} ${p.y - start.y})`);
  }, { signal });
  const drop = event => {
    if (!start) return;
    const from = start; start = null; shield.classList.remove('is-dragging');
    const p = toSvg(event), inBeam = p.x >= BEAM_ZONE.x1 && p.x <= BEAM_ZONE.x2 && p.y >= BEAM_ZONE.y1 && p.y <= BEAM_ZONE.y2;
    shield.removeAttribute('transform');
    // A tap (no real drag) flips the shield, so the separate toggle button is no longer needed.
    if (Math.hypot(p.x - from.x, p.y - from.y) < 6) onChange(!blocked);
    else if (inBeam !== blocked) onChange(inBeam);
  };
  shield.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onChange(!blocked, true);
  }, { signal });
  shield.addEventListener('pointerup', drop, { signal });
  shield.addEventListener('pointercancel', () => { start = null; shield.removeAttribute('transform'); shield.classList.remove('is-dragging'); }, { signal });
}

// s2a: release the time slider near an observation day and it snaps there.
export function snapDay(value, days, captured) {
  return days.find(day => Math.abs(day - value) <= 1 && !captured.includes(day));
}
