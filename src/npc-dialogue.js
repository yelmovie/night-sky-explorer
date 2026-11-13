// Presentation state belongs to this dialog. Original captions stay intact for narration and assistive technology.
export function mountNpcDialogue(dialog, narration, { reduced = false, typewriter = false } = {}) {
  const scene = dialog.querySelector('.npc-conversation');
  if (!scene) return () => {};
  const controller = new AbortController();
  const { signal } = controller;
  const active = scene.querySelector('.is-active');
  const script = scene.querySelector('.dialogue-script');
  const cue = scene.querySelector('.dialogue-reading-cue');
  const textPanel = scene.querySelector('.dialogue-text');
  const footer = dialog.querySelector('.dialog-footer');
  const next = footer?.querySelector('.primary[data-action]');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let timer = null;
  let visual = null;
  let typing = false;
  const nextLabel = next?.textContent;
  scene.classList.toggle('dialogue-reduced', reduced);
  document.body.classList.add('npc-dialogue-open');
  // Position the art above the measured panel and reserve only the current controls' height.
  const measure = () => {
    if (footer) dialog.style.setProperty('--dialogue-controls', footer.offsetHeight + 'px');
    dialog.style.setProperty('--dialogue-panel-height', textPanel.offsetHeight + 'px');
  };
  const layout = new ResizeObserver(measure);
  layout.observe(textPanel);
  if (footer) layout.observe(footer);
  measure();

  function finishTyping() {
    clearInterval(timer);
    timer = null;
    typing = false;
    visual?.remove();
    visual = null;
    script.classList.remove('dialogue-reserve');
    if (next) next.textContent = nextLabel;
    cue.textContent = typewriter ? '다음 버튼으로 이어가요' : '';
  }

  if (typewriter && next && !reduced && !motion.matches && !document.hidden) {
    const letters = Array.from(script.textContent);
    let shown = 0;
    visual = document.createElement('span');
    visual.setAttribute('aria-hidden', 'true');
    visual.className = 'dialogue-typing';
    script.after(visual);
    script.classList.add('dialogue-reserve');
    typing = true;
    cue.textContent = '한 번 누르면 문장을 모두 볼 수 있어요';
    next.textContent = '문장 모두 보기';
    timer = setInterval(() => {
      shown = Math.min(letters.length, shown + 2);
      visual.textContent = letters.slice(0, shown).join('');
      if (shown === letters.length) finishTyping();
    }, 40);
  }
  dialog.addEventListener('click', event => {
    const panelClick = typewriter && textPanel.contains(event.target) && !window.getSelection()?.toString();
    if (typing && (next?.contains(event.target) || panelClick)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      finishTyping();
    } else if (panelClick) {
      next?.click();
    }
  }, { capture: true, signal });

  const unsubscribe = narration.subscribe(state => {
    const speaking = state.id === scene.dataset.lineId && state.status === 'playing' && !document.hidden;
    active.classList.toggle('is-speaking', speaking);
    scene.dataset.speaking = String(speaking);
  });
  function hidden() {
    scene.classList.toggle('dialogue-hidden', document.hidden);
    if (document.hidden) { finishTyping(); active.classList.remove('is-speaking'); }
  }
  document.addEventListener('visibilitychange', hidden, { signal });
  motion.addEventListener('change', () => { if (motion.matches) finishTyping(); }, { signal });
  return () => { controller.abort(); layout.disconnect(); dialog.style.removeProperty('--dialogue-controls'); dialog.style.removeProperty('--dialogue-panel-height'); unsubscribe(); finishTyping(); active.classList.remove('is-speaking'); document.body.classList.remove('npc-dialogue-open'); };
}
