// Fit the entire activity, including its controls, into the visual viewport.
// Small landscape browsers use the same lesson proportions as a compact tablet.
export function lessonViewport(width, height) {
  const w = Math.max(1, width), h = Math.max(1, height);
  const portrait = w < 700 && h > w;
  const scale = Math.min(1, w / (portrait ? 360 : 960), h / (portrait ? 740 : 480));
  return { width: w / scale, height: h / scale, scale, layout: portrait ? 'portrait' : 'wide' };
}

export function mountLessonViewport(stage) {
  const viewport = window.visualViewport;
  const update = () => {
    const fit = lessonViewport(viewport?.width || innerWidth, viewport?.height || innerHeight);
    stage.style.setProperty('--lesson-width', `${fit.width}px`);
    stage.style.setProperty('--lesson-height', `${fit.height}px`);
    stage.style.setProperty('--lesson-scale', fit.scale);
    stage.dataset.layout = fit.layout;
    stage.dataset.scaled = String(fit.scale < 1);
  };
  update();
  window.addEventListener('resize', update);
  window.addEventListener('orientationchange', update);
  viewport?.addEventListener('resize', update);
  return () => {
    window.removeEventListener('resize', update);
    window.removeEventListener('orientationchange', update);
    viewport?.removeEventListener('resize', update);
  };
}
