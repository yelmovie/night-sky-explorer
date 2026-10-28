import stars from "./stars.json" with { type: "json" };
import { starNames, referenceLines } from "./data.js";
import { conceptArt } from "./concept-assets.js";
export const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function icon(name, size = 22) {
  const paths = {
    home: "M3 11 12 3l9 8M5 10v11h5v-7h4v7h5V10",
    back: "m14 5-7 7 7 7M7 12h14",
    sound: "M4 9h4l5-4v14l-5-4H4zM17 8q5 4 0 8M19 4q9 8 0 16",
    mute: "M4 9h4l5-4v14l-5-4H4zM17 9l5 6m0-6-5 6",
    settings:
      "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2",
    moon: "M20 15A9 9 0 0 1 9 3a9 9 0 1 0 11 12",
    clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18m0 4v5l4 2",
    planet: "M5 8a8 8 0 1 1 12 11M3 17c-5-4 15-16 19-11S7 22 3 17",
    spark: "m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3z",
    stars: "m4 16 5-9 7 4 4-7M4 16h0M9 7h0m7 4h0m4-7h0",
    book: "M12 5Q6 1 3 5v15q4-3 9 0 5-3 9 0V5q-3-4-9 0v15",
    check: "m5 12 4 4L20 5",
    lock: "M6 10h12v11H6zM8 10V7a4 4 0 0 1 8 0v3",
    arrow: "M4 12h16m-6-6 6 6-6 6",
    camera: "M3 7h5l2-3h4l2 3h5v14H3zM12 10a4 4 0 1 0 0 8 4 4 0 0 0 0-8",
    close: "m6 6 12 12M6 18 18 6",
    download: "M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4",
    map: "m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2zM9 3v16m6-14v16",
  };
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] || paths.spark}"/></svg>`;
}
let uid = 0;
// The generated surface stays fixed; only the mathematical illumination mask changes.
// moonHref lets offline renderers embed the same asset without fetching a browser URL.
export function moonSVG(amount = 100, side = "right", cls = "", extra = "", { moonHref = conceptArt.moon.src } = {}) {
  const id = `moon${uid++}`,
    f = Math.max(0, Math.min(1, amount / 100)),
    k = 2 * f - 1;
  const pts = [];
  for (let y = -48; y <= 48; y += 1) {
    const x = Math.sqrt(Math.max(0, 48 * 48 - y * y));
    pts.push([50 + x, 50 + y]);
  }
  for (let y = 48; y >= -48; y -= 1) {
    const x = Math.sqrt(Math.max(0, 48 * 48 - y * y));
    pts.push([50 - k * x, 50 + y]);
  }
  const path =
    pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(2)} ${p[1]}`).join(" ") +
    "Z";
  const mirror = side === "left" ? ' transform="translate(100 0) scale(-1 1)"' : "";
  return `<svg class="moon-art ${cls}" viewBox="0 0 100 100" role="img" aria-label="밝은 부분 ${Math.round(f * 100)}%, ${side === "right" ? "오른쪽" : "왼쪽"} 달 학습 모형" ${extra}><defs><clipPath id="${id}disk"><circle cx="50" cy="50" r="48"/></clipPath><clipPath id="${id}light"><path d="${path}"${mirror}/></clipPath><svg id="${id}surface" x="2" y="2" width="96" height="96" viewBox="${conceptArt.moon.viewBox}" preserveAspectRatio="none"><image href="${esc(moonHref)}" width="${conceptArt.moon.width}" height="${conceptArt.moon.height}"/></svg></defs><circle cx="50" cy="50" r="49" fill="#202b46"/><g clip-path="url(#${id}disk)"><use href="#${id}surface" opacity=".1"/><g clip-path="url(#${id}light)"><use href="#${id}surface"/></g></g></svg>`;
}
export function phase(day) {
  const angle = (day / 29.53) * Math.PI * 2;
  return {
    amount: (1 - Math.cos(angle)) * 50,
    side: day <= 14.765 ? "right" : "left",
  };
}
export function dayMoon(day, cls = "", options = {}) {
  const p = phase(day);
  return moonSVG(p.amount, p.side, cls, "", options);
}
export const projectedStars = stars.map((s) => {
  const r = (90 - s.dec) * 4.45,
    a = (s.ra / 24) * Math.PI * 2;
  return { ...s, x: 300 + Math.sin(a) * r, y: 220 - Math.cos(a) * r };
});
export function starChart({
  lines = [],
  reference = false,
  observed = [],
  selected = "",
  interactive = true,
  region = "all",
  starHref = conceptArt.star.src,
} = {}) {
  const imageId = `starLight${uid++}`;
  const group = projectedStars.filter((s) =>
    region === "cassiopeia"
      ? ["Caph", "Schedar", "Cih", "Ruchbah", "Segin"].includes(s.id)
      : !["Caph", "Schedar", "Cih", "Ruchbah", "Segin", "Polaris"].includes(
          s.id,
        ),
  );
  const bounds =
    region === "all"
      ? "0 0 600 440"
      : `${Math.min(...group.map((s) => s.x)) - 30} ${Math.min(...group.map((s) => s.y)) - 30} ${Math.max(...group.map((s) => s.x)) - Math.min(...group.map((s) => s.x)) + 60} ${Math.max(...group.map((s) => s.y)) - Math.min(...group.map((s) => s.y)) + 60}`;
  const line = ([a, b], cls) => {
    const x = projectedStars.find((s) => s.id === a),
      y = projectedStars.find((s) => s.id === b);
    return x && y
      ? `<line x1="${x.x}" y1="${x.y}" x2="${y.x}" y2="${y.y}" class="${cls}"/>`
      : "";
  };
  return `<svg viewBox="${bounds}" class="star-chart" style="overflow:hidden" aria-label="북극성 주변 별 관측 지도"><defs><symbol id="${imageId}" viewBox="0 0 ${conceptArt.star.width} ${conceptArt.star.height}"><image href="${esc(starHref)}" width="${conceptArt.star.width}" height="${conceptArt.star.height}"/></symbol></defs><circle cx="300" cy="220" r="190" fill="none" stroke="#33445e" stroke-dasharray="3 8"/><circle cx="300" cy="220" r="100" fill="none" stroke="#26334c"/>${reference ? referenceLines.map((l) => line(l, "reference-line")).join("") : ""}${lines.map((l) => line(l, "my-line")).join("")}${projectedStars
    .filter((s) => region === "all" || group.includes(s))
    .map((s) => {
      const size = (s.id === "Polaris" ? 7 : Math.max(3, 7 - s.mag)) * 4;
      return `<g ${interactive ? `role="button" tabindex="0" data-star="${s.id}" aria-label="${starNames[s.id]} 관찰"` : ""} class="star-node ${selected === s.id ? "selected" : ""}"><circle cx="${s.x}" cy="${s.y}" r="10" fill="transparent"/><use href="#${imageId}" x="${s.x - size / 2}" y="${s.y - size / 2}" width="${size}" height="${size}" pointer-events="none" aria-hidden="true"/><circle cx="${s.x}" cy="${s.y}" r="8" fill="none" stroke="${selected === s.id ? "#ffd771" : observed.includes(s.id) ? "#80e0c577" : "transparent"}"/><text x="${s.x + 8}" y="${s.y - 8}" class="star-label" style="font-size:${region === "all" ? 12 : 5}px">${s.id === "Polaris" ? "북극성" : projectedStars.indexOf(s) + 1}</text></g>`;
    })
    .join(
      "",
    )}${region === "all" ? '<text x="20" y="418" class="chart-caption">북극 중심 학습 지도 · 별 위치: HYG / J2000</text>' : ""}</svg>`;
}
