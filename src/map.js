import { chapters } from "./data.js";
export const sites = [
  [2, 3],
  [8, 2],
  [11, 6],
  [8, 10],
  [2, 10],
];
export const project = (x, y) => ({
  x: 240 + (x - y) * 16,
  y: 28 + (x + y) * 9,
});
export function mountMap(canvas, state, onArrive, onSelect) {
  const ctx = canvas.getContext("2d");
  canvas.width = 480;
  canvas.height = 300;
  const paths = new Set(),
    key = (x, y) => `${x},${y}`;
  function segment(a, b) {
    let [x, y] = a;
    paths.add(key(x, y));
    while (x !== b[0]) {
      x += Math.sign(b[0] - x);
      paths.add(key(x, y));
    }
    while (y !== b[1]) {
      y += Math.sign(b[1] - y);
      paths.add(key(x, y));
    }
  }
  sites.forEach((p) => segment([6, 6], p));
  segment([6, 6], [6, 10]);
  let player = { x: 6, y: 9 },
    route = [],
    destination = null,
    raf,
    previous = 0,
    stopped = false;
  function diamond(x, y, top, left, right, h = 4) {
    ctx.fillStyle = left;
    ctx.beginPath();
    ctx.moveTo(x - 16, y);
    ctx.lineTo(x, y + 9);
    ctx.lineTo(x, y + 9 + h);
    ctx.lineTo(x - 16, y + h);
    ctx.fill();
    ctx.fillStyle = right;
    ctx.beginPath();
    ctx.moveTo(x, y + 9);
    ctx.lineTo(x + 16, y);
    ctx.lineTo(x + 16, y + h);
    ctx.lineTo(x, y + 9 + h);
    ctx.fill();
    ctx.fillStyle = top;
    ctx.beginPath();
    ctx.moveTo(x, y - 9);
    ctx.lineTo(x + 16, y);
    ctx.lineTo(x, y + 9);
    ctx.lineTo(x - 16, y);
    ctx.fill();
  }
  function tree(x, y, seed) {
    const shade = ["#174741", "#205a4b", "#26564a"][seed % 3];
    ctx.fillStyle = "#142e36";
    ctx.fillRect(x - 5, y + 3, 15, 3);
    ctx.fillStyle = "#4e4941";
    ctx.fillRect(x - 2, y - 14, 4, 19);
    ctx.fillStyle = "#103c3b";
    ctx.fillRect(x - 13, y - 14, 26, 6);
    ctx.fillRect(x - 10, y - 23, 20, 10);
    ctx.fillStyle = shade;
    ctx.fillRect(x - 9, y - 22, 16, 7);
    ctx.fillRect(x - 6, y - 30, 12, 9);
    ctx.fillRect(x - 3, y - 36, 6, 9);
    ctx.fillStyle = "#398367";
    ctx.fillRect(x - 5, y - 28, 3, 3);
  }
  function building(x, y, n, lit) {
    ctx.fillStyle = "#081a2b";
    ctx.fillRect(x - 20, y - 2, 45, 7);
    ctx.fillStyle = n === 0 ? "#4c5779" : "#3b4863";
    ctx.fillRect(x - 15, y - 25, 31, 27);
    ctx.fillStyle = "#2a354d";
    ctx.fillRect(x + 9, y - 22, 7, 24);
    if (n === 0 || n === 1 || n === 5) {
      ctx.fillStyle = n === 0 ? "#8684af" : "#717f9b";
      ctx.fillRect(x - 17, y - 33, 35, 9);
      ctx.fillRect(x - 13, y - 40, 27, 8);
      ctx.fillRect(x - 7, y - 44, 15, 5);
      ctx.fillStyle = "#bec0cd";
      ctx.fillRect(x - 9, y - 39, 4, 10);
    } else {
      ctx.fillStyle =
        ["", "#7f8bad", "#8c7197", "#ad846c", "#718e9e"][n] || "#8d88ad";
      ctx.beginPath();
      ctx.moveTo(x - 22, y - 26);
      ctx.lineTo(x, y - 43);
      ctx.lineTo(x + 23, y - 26);
      ctx.fill();
      ctx.fillStyle = "#414a68";
      ctx.fillRect(x - 20, y - 26, 43, 4);
    }
    ctx.fillStyle = lit ? "#ffe3a2" : "#172b44";
    ctx.fillRect(x - 10, y - 18, 6, 8);
    ctx.fillRect(x + 3, y - 18, 6, 8);
    ctx.fillStyle = lit ? "#e8bf75" : "#142237";
    ctx.fillRect(x - 3, y - 9, 7, 11);
    ctx.fillStyle = "#ac9b74";
    ctx.fillRect(x - 17, y + 2, 36, 3);
    if (lit) {
      ctx.fillStyle = "#f6d384";
      ctx.fillRect(x - 22, y - 12, 2, 14);
      ctx.fillRect(x - 24, y - 16, 6, 5);
    }
    if (n === 1) {
      ctx.fillStyle = "#adc4cd";
      ctx.fillRect(x + 12, y - 37, 18, 5);
      ctx.fillRect(x + 15, y - 31, 3, 7);
    }
    if (n === 3) {
      ctx.strokeStyle = "#e1ba7e";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x, y - 38, 12, 4, -0.3, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  function avatar(x, y) {
    ctx.fillStyle = "#071b2c99";
    ctx.fillRect(x - 6, y + 2, 13, 3);
    ctx.fillStyle = "#e6bfa0";
    ctx.fillRect(x - 4, y - 22, 8, 8);
    ctx.fillStyle = "#493c4b";
    ctx.fillRect(x - 5, y - 25, 10, 5);
    ctx.fillRect(x - 5, y - 22, 2, 7);
    ctx.fillStyle = "#e4e2d5";
    ctx.fillRect(x - 6, y - 13, 12, 12);
    ctx.fillStyle = "#6bafd0";
    ctx.fillRect(x - 2, y - 13, 4, 8);
    ctx.fillStyle = "#f2c36d";
    ctx.fillRect(x + 4, y - 12, 2, 3);
    ctx.fillStyle = "#263c5f";
    ctx.fillRect(x - 4, y - 1, 3, 5);
    ctx.fillRect(x + 1, y - 1, 3, 5);
  }
  function draw(time) {
    ctx.clearRect(0, 0, 480, 300);
    ctx.imageSmoothingEnabled = false;
    for (let sum = 0; sum <= 24; sum++)
      for (let x = 0; x <= 12; x++) {
        let y = sum - x;
        if (y < 0 || y > 12) continue;
        const p = project(x, y),
          path = paths.has(key(x, y)),
          water = x < 3 && y > 5 && y < 10;
        diamond(
          p.x,
          p.y,
          water
            ? "#24586b"
            : path
              ? "#827e72"
              : (x + y) % 3
                ? "#254b46"
                : "#2d5549",
          "#16383c",
          "#1d4240",
          x === 12 || y === 12 ? 12 : 3,
        );
        if (water) {
          ctx.fillStyle = "#40798a";
          ctx.fillRect(p.x - 8, p.y, 8, 1);
        } else if (!path && (x * 17 + y * 11) % 5 === 0) {
          ctx.fillStyle = "#62816b";
          ctx.fillRect(p.x - 5, p.y - 3, 2, 2);
        }
      }
    const objects = [];
    for (let x = 0; x < 13; x++)
      for (let y = 0; y < 13; y++) {
        if (
          paths.has(key(x, y)) ||
          sites.some(([sx, sy]) => Math.abs(x - sx) + Math.abs(y - sy) < 2) ||
          (x < 3 && y > 5 && y < 10) ||
          Math.abs(x - 6) + Math.abs(y - 6) < 2
        )
          continue;
        if ((x * 13 + y * 7) % 3 !== 0)
          objects.push({
            depth: x + y,
            fn: () => {
              const p = project(x, y);
              tree(p.x, p.y, x + y);
            },
          });
      }
    sites.forEach(([x, y], i) =>
      objects.push({
        depth: x + y,
        fn: () => {
          const p = project(x, y);
          building(p.x, p.y, i + 1, !!state.evidence[i + 1]);
        },
      }),
    );
    objects.push({
      depth: 12,
      fn: () => {
        const p = project(6, 6);
        building(p.x, p.y, 0, state.core.restored);
      },
    });
    objects.push({
      depth: player.x + player.y + 0.2,
      fn: () => {
        const p = project(player.x, player.y);
        avatar(
          Math.round(p.x),
          Math.round(p.y) +
            (route.length && !state.settings.reducedMotion
              ? Math.round(Math.sin(time / 100))
              : 0),
        );
      },
    });
    objects.sort((a, b) => a.depth - b.depth).forEach((o) => o.fn());
    // Stars and fireflies stay decorative; scientific stars are a separate catalog-based chart.
    for (let i = 0; i < 16; i++) {
      ctx.fillStyle = i % 3 ? "#f0d69066" : "#a8e5d188";
      ctx.fillRect(
        ((i * 71 + 18) % 460) + 10,
        ((i * 37 + 12) % 220) + 12,
        1,
        1,
      );
    }
  }
  function findRoute(target) {
    const start = [Math.round(player.x), Math.round(player.y)],
      queue = [[start]],
      seen = new Set([key(...start)]);
    while (queue.length) {
      const path = queue.shift(),
        p = path.at(-1);
      if (p[0] === target[0] && p[1] === target[1]) return path.slice(1);
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const q = [p[0] + dx, p[1] + dy],
          k = key(...q);
        if (paths.has(k) && !seen.has(k)) {
          seen.add(k);
          queue.push([...path, q]);
        }
      }
    }
    return [];
  }
  function moveTo(n) {
    const target = n === 0 ? [6, 6] : sites[n - 1];
    destination = n;
    route = findRoute(target);
    if (state.settings.reducedMotion) {
      player = { x: target[0], y: target[1] };
      route = [];
      draw(0);
      onArrive(n);
    } else if (!route.length) onArrive(n);
  }
  function tick(time) {
    if (stopped) return;
    const dt = Math.min((time - previous) / 1000, 0.05);
    previous = time;
    if (route.length) {
      const [tx, ty] = route[0],
        distance = Math.hypot(tx - player.x, ty - player.y),
        step = dt * 6;
      if (distance <= step) {
        player = { x: tx, y: ty };
        route.shift();
        if (!route.length) onArrive(destination);
      } else {
        player.x += ((tx - player.x) / distance) * step;
        player.y += ((ty - player.y) / distance) * step;
      }
    }
    draw(time);
    raf = requestAnimationFrame(tick);
  }
  function click(e) {
    const rect = canvas.getBoundingClientRect(),
      x = ((e.clientX - rect.left) / rect.width) * 480,
      y = ((e.clientY - rect.top) / rect.height) * 300;
    let best = Infinity,
      n = null;
    [[6, 6], ...sites].forEach(([sx, sy], i) => {
      const p = project(sx, sy),
        d = Math.hypot(x - p.x, y - (p.y - 20));
      if (d < best) {
        best = d;
        n = i;
      }
    });
    if (best < 40) onSelect(n);
  }
  function keyboard(e) {
    if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key))
      return;
    e.preventDefault();
    const delta = {
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
      }[e.key],
      x = Math.round(player.x) + delta[0],
      y = Math.round(player.y) + delta[1];
    if (paths.has(key(x, y))) {
      route = [[x, y]];
      destination = null;
    }
  }
  canvas.addEventListener("click", click);
  canvas.addEventListener("keydown", keyboard);
  raf = requestAnimationFrame(tick);
  return {
    moveTo,
    dispose() {
      stopped = true;
      cancelAnimationFrame(raf);
      canvas.removeEventListener("click", click);
      canvas.removeEventListener("keydown", keyboard);
    },
  };
}
