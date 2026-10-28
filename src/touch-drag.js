export function mountTouchDrag(root, { sources, targets, onDrop, on }) {
  let drag, ghost, highlighted, suppressUntil = 0;
  function clear() { ghost?.remove(); highlighted?.classList.remove('drop-active'); ghost = null; highlighted = null; drag = null; }
  function targetAt(event) { return document.elementFromPoint(event.clientX, event.clientY)?.closest(targets); }
  root.querySelectorAll(sources).forEach(source => {
    on(source, 'dragstart', event => event.preventDefault());
    on(source, 'pointerdown', event => { if (event.button !== 0 || source.disabled) return; drag = { source, x: event.clientX, y: event.clientY, moved: false }; source.setPointerCapture(event.pointerId); });
    on(source, 'pointermove', event => {
      if (!drag || drag.source !== source) return;
      if (!drag.moved && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 8) return;
      event.preventDefault(); drag.moved = true;
      if (!ghost) { ghost = document.createElement('div'); ghost.className = 'drag-ghost'; ghost.innerHTML = source.innerHTML; document.body.append(ghost); }
      ghost.style.left = event.clientX + 'px'; ghost.style.top = event.clientY + 'px';
      const target = targetAt(event); highlighted?.classList.remove('drop-active'); highlighted = target; target?.classList.add('drop-active');
    });
    on(source, 'pointerup', event => {
      if (!drag || drag.source !== source) return;
      const moved = drag.moved, target = targetAt(event); clear();
      if (moved) { suppressUntil = performance.now() + 350; if (target) onDrop(source, target); }
    });
    on(source, 'pointercancel', clear);
    on(source, 'lostpointercapture', clear);
  });
  const suppress = event => { if (performance.now() < suppressUntil) { event.preventDefault(); event.stopImmediatePropagation(); } };
  document.addEventListener('click', suppress, true);
  return () => { clear(); setTimeout(() => document.removeEventListener('click', suppress, true), 60); };
}
