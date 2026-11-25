// Map restoration is a separate reward interaction.
import { icon } from './ui.js';

const photoArt = `<svg viewBox="0 0 280 116" role="img" aria-label="별자리 관측 장면"><rect width="280" height="116" fill="#06162e"/><path d="M30 60L84 25 130 72 191 30 246 55" fill="none" stroke="#6690ad" stroke-dasharray="3 5"/><image href="/assets/generated/starlight-v3.webp" x="18" y="48" width="24" height="24"/><image href="/assets/generated/starlight-v3.webp" x="72" y="13" width="24" height="24"/><image href="/assets/generated/starlight-v3.webp" x="118" y="60" width="24" height="24"/><image href="/assets/generated/starlight-v3.webp" x="179" y="18" width="24" height="24"/><image href="/assets/generated/starlight-v3.webp" x="234" y="43" width="24" height="24"/><circle cx="15" cy="15" r="1" fill="white"/><circle cx="40" cy="90" r="1" fill="white"/><circle cx="160" cy="12" r="1" fill="white"/><circle cx="200" cy="99" r="1" fill="white"/><circle cx="265" cy="81" r="1" fill="white"/><circle cx="73" cy="102" r="1" fill="white"/><circle cx="110" cy="9" r="1" fill="white"/></svg>`;

export function mountRepair(host, { state, save, available, preview = false }) {
  if (preview) state = { ...state, mapRepairs: [...(state.mapRepairs || [])] };
  const panel = document.createElement('details');
  panel.className = 'map-repair';
  panel.innerHTML = `
    <summary>${icon('camera', 20)}<span class="map-repair-label"></span></summary>
    <div class="repair-body">
      <label>복구할 구역 <select aria-label="복구할 구역"></select></label>
      <div class="repair-work"></div>
      <p class="repair-status" role="status"></p>
    </div>`;
  host.append(panel);
  const summary = panel.querySelector('summary');
  const select = panel.querySelector('select');
  const work = panel.querySelector('.repair-work');
  const status = panel.querySelector('.repair-status');
  const close = () => {
    panel.open = false;
    summary.focus();
  };
  panel.addEventListener('keydown', event => {
    event.stopPropagation();
    if (event.key === 'Escape') close();
  });

  function updateSummary() {
    const count = (state.mapRepairs || []).length;
    const label = count ? `지도 복구 · ${count}곳 완료` : '지도 복구 작업대';
    summary.querySelector('.map-repair-label').textContent = label;
    summary.setAttribute('aria-label', label);
  }
  updateSummary();

  if (!available.length) {
    select.disabled = true;
    work.textContent = '탐구를 마친 구역을 복구할 수 있어요.';
    return;
  }
  available.forEach(({ id, label }) => select.add(new Option(label, String(id))));

  function showPhoto(completed) {
    work.innerHTML = `
      <div class="repair-scene">
        <div class="repair-photo">${photoArt}</div>
        ${completed ? `<span class="repair-check" aria-hidden="true">${icon('check', 22)}</span>` : ''}
      </div>
      ${completed ? '<button type="button" class="btn secondary">지도 계속 보기</button>' : `
        <label class="repair-focus">렌즈 초점 <input type="range" min="0" max="100" value="10"></label>
        <button type="button" class="btn primary" disabled hidden>선명한 별 사진 찍기</button>
      `}`;
  }

  function showCompleted(message) {
    showPhoto(true);
    status.textContent = message;
    work.querySelector('button').onclick = close;
  }

  function render() {
    const id = Number(select.value);
    if ((state.mapRepairs || []).includes(id)) {
      showCompleted('이 구역의 별 사진을 복구했어요.');
      return;
    }
    status.textContent = '';
    showPhoto(false);
    const slider = work.querySelector('input');
    const photo = work.querySelector('.repair-photo');
    const capture = work.querySelector('button');
    const update = () => {
      const error = Math.abs(Number(slider.value) - 65);
      photo.style.filter = `blur(${error / 11}px)`;
      capture.disabled = error > 4;
      capture.hidden = capture.disabled;
    };
    slider.oninput = update;
    capture.onclick = () => {
      state.mapRepairs = [...(state.mapRepairs || []), id];
      if (!preview) save();
      updateSummary();
      showCompleted(preview ? '별 사진 복구 시연을 마쳤어요.' : '별 사진을 복구했어요.');
      work.querySelector('button').focus();
    };
    update();
  }
  select.onchange = render;
  render();
}
