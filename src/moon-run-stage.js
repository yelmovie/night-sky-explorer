// The running stage of the bonus "달빛 길 따라가기". Loaded on demand so three.js stays off the first screen.
// This file only draws and walks: which door opens is decided by judgeDoor() in moon-path.js (through onDoor).
// The hill is on Earth. Jumps are ordinary, and the sky has no moon of its own: the only moons are on the doors.
// Movement follows the three.js games_fps example: a capsule against an octree, five sub-steps a frame.
import * as THREE from 'three';
import { Octree } from 'three/addons/math/Octree.js';
import { Capsule } from 'three/addons/math/Capsule.js';
import { moonSVG } from './drawing.js';
import { HALF, DOOR_HALF, WALL, slabs, stones, gateS, arriveS, observatoryS, doorXs, slabAt, groundAt, streams, checkpointFor } from './moon-run-course.js';

const GRAVITY = 28, JUMP = 9.5, RADIUS = 0.3, BODY = 1.1, STEPS = 5, GROUND_PUSH = 22, AIR_PUSH = 7;
// Lumi never runs faster in the air than on the ground, so a jump always reaches the same 2.5 m.
const TOP_SPEED = GROUND_PUSH / 6;
const WALL_HEIGHT = 2.3, MOON_SIZE = 1.6, MOON_PX = 160, WATER_DROP = 1.15;
const ART = '/assets/generated/run-stage/';
const FONT = '"NanumSquareNeo", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
const loader = new THREE.TextureLoader();
async function picture(url, pixel = false) {
  const texture = await loader.loadAsync(url);
  texture.colorSpace = THREE.SRGBColorSpace;
  if (pixel) { texture.magFilter = THREE.NearestFilter; texture.generateMipmaps = false; texture.minFilter = THREE.LinearFilter; }
  return texture;
}
const optional = url => picture(url).catch(() => null);
function drawn(width, height, paint) {
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  paint(canvas.getContext('2d'));
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
function tiled(texture) { texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.anisotropy = 4; return texture; }
function seeded(seed) { return () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296; }
/** One cell of a sheet with `columns` by `rows` pictures. Rows count from the top. */
function cell(texture, column, row, columns = 4, rows = 4) { texture.repeat.set(1 / columns, 1 / rows); texture.offset.set(column / columns, 1 - (row + 1) / rows); }
function standing(material, width, height, foot = 0.04) {
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(width, height, 1); sprite.center.set(0.5, foot);
  return sprite;
}
const cutout = map => new THREE.SpriteMaterial({ map, transparent: true, alphaTest: 0.35 });
/** A box whose pictures repeat every `tile` metres instead of stretching. */
function box(width, height, depth, material, x, y, z, tile = 0) {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  if (tile) {
    // Faces come in the order +x, -x, +y, -y, +z, -z, four corners each.
    const uv = geometry.attributes.uv, spans = [[depth, height], [depth, height], [width, depth], [width, depth], [width, height], [width, height]];
    for (let i = 0; i < uv.count; i++) { const [u, v] = spans[Math.floor(i / 4)]; uv.setXY(i, uv.getX(i) * u / tile, uv.getY(i) * v / tile); }
  }
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  return mesh;
}
function flat(width, length, material, x, y, z, tile = 0) {
  const geometry = new THREE.PlaneGeometry(width, length);
  if (tile) { const uv = geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * width / tile, uv.getY(i) * length / tile); }
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2; mesh.position.set(x, y, z);
  return mesh;
}

class Runner {
  constructor(world, walk) {
    this.world = world; this.walk = walk;
    this.group = new THREE.Group(); this.position = new THREE.Vector3(); this.velocity = new THREE.Vector3();
    this.capsule = new Capsule(new THREE.Vector3(0, RADIUS, 0), new THREE.Vector3(0, RADIUS + BODY, 0), RADIUS);
    this.onFloor = false; this.floor = 0; this.stunned = 0; this.cheering = false; this.still = false; this.time = 0; this.jumped = false;
    cell(walk, 0, 3);
    this.sprite = standing(cutout(walk), 1.35, 1.35);
    this.shadow = new THREE.Mesh(new THREE.CircleGeometry(0.42, 20), new THREE.MeshBasicMaterial({ color: '#040a14', transparent: true, opacity: 0.4, depthWrite: false }));
    this.shadow.rotation.x = -Math.PI / 2;
    this.group.add(this.shadow, this.sprite);
  }
  place(x, y, z) {
    this.capsule.start.set(x, y + RADIUS, z); this.capsule.end.set(x, y + RADIUS + BODY, z);
    this.velocity.set(0, 0, 0); this.floor = y; this.stunned = 0; this.sync();
  }
  /** A wrong door: one stumble back. Nothing else changes. */
  flinch() { this.stunned = 0.5; this.velocity.set(0, 3, 3.4); this.onFloor = false; }
  hop() { if (this.onFloor && !this.still) { this.velocity.y = 5; this.onFloor = false; } }
  step(dt, steer, bounds, barrier) {
    this.stunned = Math.max(0, this.stunned - dt);
    const length = Math.hypot(steer.x, steer.y), free = this.stunned === 0 && !this.cheering;
    const dx = free && length ? steer.x / length : 0, dz = free && length ? -steer.y / length : 0;
    this.jumped = false;
    if (free && steer.jump && this.onFloor) { this.velocity.y = JUMP; this.onFloor = false; this.jumped = true; }
    if (this.cheering && this.onFloor && !this.still) { this.velocity.y = 4.2; this.onFloor = false; }
    const h = dt / STEPS, move = new THREE.Vector3();
    for (let i = 0; i < STEPS; i++) {
      const push = h * (this.onFloor ? GROUND_PUSH : AIR_PUSH), before = this.capsule.start.z;
      this.velocity.x += dx * push; this.velocity.z += dz * push;
      let damping = Math.exp(-6 * h) - 1;
      if (!this.onFloor) { this.velocity.y -= GRAVITY * h; damping *= 0.1; }
      this.velocity.x += this.velocity.x * damping; this.velocity.z += this.velocity.z * damping;
      const speed = Math.hypot(this.velocity.x, this.velocity.z);
      if (speed > TOP_SPEED) { this.velocity.x *= TOP_SPEED / speed; this.velocity.z *= TOP_SPEED / speed; }
      this.capsule.translate(move.copy(this.velocity).multiplyScalar(h));
      this.collide();
      const p = this.capsule.start, x = Math.max(bounds.minX, Math.min(bounds.maxX, p.x));
      let z = Math.max(bounds.minZ, Math.min(bounds.maxZ, p.z));
      if (x !== p.x) this.velocity.x = 0;
      const held = barrier(before, x, z);
      if (held !== null) z = held;
      if (z !== p.z) this.velocity.z = 0;
      if (x !== p.x || z !== p.z) this.capsule.translate(move.set(x - p.x, 0, z - p.z));
    }
    this.sync();
    if (this.onFloor) this.floor = this.position.y;
    const moving = Math.hypot(this.velocity.x, this.velocity.z) > 0.4;
    this.time = moving || this.cheering ? this.time + dt : 0;
    const row = this.cheering ? 0 : !moving ? 3 : Math.abs(this.velocity.x) > Math.abs(this.velocity.z) ? (this.velocity.x < 0 ? 1 : 2) : this.velocity.z > 0 ? 0 : 3;
    cell(this.walk, Math.floor(this.time * 9) % 4, row);
    this.sprite.material.color.set(this.stunned > 0 && Math.floor(this.stunned * 14) % 2 ? '#ff9c8c' : '#ffffff');
  }
  collide() {
    const hit = this.world.capsuleIntersect(this.capsule);
    this.onFloor = false;
    if (!hit) return;
    this.onFloor = hit.normal.y > 0.15;
    if (this.onFloor) this.velocity.y = Math.min(0, this.velocity.y);
    else this.velocity.addScaledVector(hit.normal, -hit.normal.dot(this.velocity));
    if (hit.depth >= 1e-10) this.capsule.translate(hit.normal.multiplyScalar(hit.depth));
  }
  sync() {
    this.position.set(this.capsule.start.x, this.capsule.start.y - RADIUS, this.capsule.start.z);
    this.group.position.copy(this.position);
    // The round shadow lies on whatever floor is under Lumi and shrinks as she rises. Over a stream there is none.
    const under = groundAt(-this.position.z, this.position.x), lift = under ? this.position.y - under.top : 0;
    this.shadow.visible = !!under && lift > -0.2;
    if (under) { this.shadow.position.y = under.top - this.position.y + 0.03; this.shadow.scale.setScalar(Math.max(0.45, 1 - Math.max(0, lift) * 0.35)); }
  }
}

/**
 * host: element that receives the canvas. labels: element laid over it for the door moons.
 * onDoor(gateIndex, doorIndex) -> { ok, reveal, answer } is the only place a result is decided.
 */
export async function createMoonRun({ host, labels, gates, reduced = false, read, onDoor, onNear = () => {}, onFall = () => {}, onArrive = () => {}, onLost = () => {}, onCue = () => {} }) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' }); }
  catch { throw new Error('webgl-unavailable'); }
  const canvas = renderer.domElement, textures = [];
  try {
    // The two walk sheets are required. The painted scenery is optional: without a file the code-drawn look is used.
    textures.push(...await Promise.all([
      picture('/assets/generated/rabbit-walk.webp', true), picture('/assets/generated/student.webp', true),
      ...['night-grass', 'night-path', 'night-ridge', 'stone-wall', 'door', 'stream', 'observatory', 'props'].map(name => optional(`${ART}${name}.webp`)),
    ]));
    await document.fonts?.load(`800 96px ${FONT}`, '일째0123456789').catch(() => {});
  } catch (error) { renderer.dispose(); renderer.forceContextLoss(); throw error; }
  const [walk, studentSheet, grassArt, pathArt, ridgeArt, wallArt, doorArt, streamArt, observatoryArt, propsArt] = textures;
  renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
  canvas.className = 'moon-run-canvas'; canvas.setAttribute('aria-hidden', 'true');
  const lose = event => { event.preventDefault(); stopped = true; onLost(); };
  canvas.addEventListener('webglcontextlost', lose);
  host.prepend(canvas);

  const NIGHT = '#0b1630';
  const scene = new THREE.Scene(); scene.background = new THREE.Color(NIGHT); scene.fog = new THREE.Fog(NIGHT, 36, 96);
  scene.add(new THREE.HemisphereLight('#cfd9ff', '#2a4034', 2.5));
  const moonlight = new THREE.DirectionalLight('#eef1ff', 1.5); moonlight.position.set(-5, 10, 7); scene.add(moonlight);
  const camera = new THREE.PerspectiveCamera(46, 16 / 9, 0.1, 220);

  // --- Floor: basic shapes with painted tiles. Lumi collides only with `solid`.
  const grassTexture = tiled(grassArt || drawn(256, 256, g => {
    const random = seeded(13);
    g.fillStyle = '#2f6d4a'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 900; i++) { g.fillStyle = ['#3b7d55', '#285f41', '#447f5c', '#245639'][i % 4]; g.fillRect(random() * 256, random() * 256, 2 + random() * 3, 5 + random() * 7); }
  }));
  const grass = new THREE.MeshLambertMaterial({ map: grassTexture }), soil = new THREE.MeshLambertMaterial({ color: '#4a4353' });
  const trail = new THREE.MeshLambertMaterial(pathArt ? { map: tiled(pathArt) } : { color: '#8f8a84' });
  const stoneTexture = wallArt ? tiled(wallArt) : null;
  const rock = new THREE.MeshLambertMaterial(stoneTexture ? { map: stoneTexture, color: '#e6ecff' } : { color: '#8f98ab' });
  const solid = new THREE.Group(), END = slabs.at(-1).s1;
  for (const slab of slabs) {
    solid.add(box(HALF * 2, 3.2, slab.s1 - slab.s0, [soil, soil, grass, soil, soil, soil], 0, slab.top - 1.6, -(slab.s0 + slab.s1) / 2, 4));
    scene.add(flat(3.4, slab.s1 - slab.s0, trail, 0, slab.top + 0.015, -(slab.s0 + slab.s1) / 2, 3.4));
  }
  for (const stone of stones) solid.add(box(stone.half * 2, 0.55, stone.s1 - stone.s0, rock, stone.x, stone.top - 0.275, -(stone.s0 + stone.s1) / 2, 2.4));
  // Hillside beside the path and the streams that cross it. The water is where a missed jump lands.
  const hill = new THREE.MeshLambertMaterial({ map: grassTexture, color: '#93b3a4' });
  if (streamArt) tiled(streamArt);
  const water = new THREE.MeshBasicMaterial(streamArt ? { map: streamArt, color: '#c9dcff' } : { color: '#2f6fa3' });
  for (const side of [-1, 1]) scene.add(flat(150, END + 80, hill, side * (HALF + 75), -0.06, -(END - 20) / 2, 4));
  for (const [from, to] of streams()) {
    const low = Math.min(slabAt(from).top, slabAt(to).top), length = to - from;
    scene.add(flat(HALF * 2, length, water, 0, low - WATER_DROP, -(from + to) / 2, 3));
    for (const side of [-1, 1]) scene.add(flat(70, length, water, side * (HALF + 35), -0.03, -(from + to) / 2, 3));
  }

  // --- Gates: a wall with two or three doors. Closed doors are kept out of the octree and held by barrier().
  // Each gate owns its materials so it can fade away once Lumi is through and it stands between her and the camera.
  const lampLight = new THREE.MeshBasicMaterial({ color: '#ffe19a' });
  const labelItems = [];
  function label(gate, html, className, position, size, base) {
    const el = document.createElement('div'); el.className = className; el.innerHTML = html; el.hidden = true; labels.append(el);
    const item = { gate, el, position, size, base, shown: false }; labelItems.push(item);
    return item;
  }
  /** A date board on a tall post. The canvas is 160 px to a metre, so the board keeps its size on any post. */
  function signTexture(day, tall) {
    return drawn(256, Math.round(tall * 160), g => {
      g.fillStyle = '#6b4a34'; g.fillRect(116, 120, 24, tall * 160 - 120);
      g.fillStyle = '#fff9ec'; g.strokeStyle = '#f2c266'; g.lineWidth = 12;
      g.beginPath(); g.roundRect(10, 10, 236, 130, 26); g.fill(); g.stroke();
      g.fillStyle = '#20354c'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = `800 ${day > 9 ? 66 : 76}px ${FONT}`; g.fillText(`${day}일째`, 128, 80);
    });
  }
  const course = gates.map((gate, index) => {
    const s = gateS[index], z = -s, top = slabAt(s).top, xs = doorXs(gate.doors.length);
    const wall = new THREE.MeshLambertMaterial(stoneTexture ? { map: stoneTexture } : { color: '#4a5880' }), beam = new THREE.MeshLambertMaterial(stoneTexture ? { map: stoneTexture, color: '#c6d2ff' } : { color: '#5d6c96' });
    const trim = new THREE.MeshLambertMaterial({ color: '#d9b25c' }), gold = new THREE.MeshBasicMaterial({ color: '#f2c266' }), plaqueBack = new THREE.MeshBasicMaterial({ color: '#0b1d2d' });
    const plain = new THREE.MeshLambertMaterial({ color: '#2a3f78' }), face = new THREE.MeshLambertMaterial(doorArt ? { map: doorArt } : { color: '#2a3f78' });
    const walls = new THREE.Group(), extras = new THREE.Group(), plaques = new THREE.Group();
    const edges = [-HALF, ...xs.flatMap(x => [x - DOOR_HALF, x + DOOR_HALF]), HALF];
    for (let i = 0; i < edges.length; i += 2) walls.add(box(edges[i + 1] - edges[i], WALL_HEIGHT, WALL * 2, wall, (edges[i] + edges[i + 1]) / 2, top + WALL_HEIGHT / 2, z, 2.3));
    walls.add(box(HALF * 2 + 0.3, 0.5, WALL * 2 + 0.2, beam, 0, top + WALL_HEIGHT + 0.25, z, 2.3));
    const doors = gate.doors.map((door, doorIndex) => {
      const x = xs[doorIndex], panel = box(DOOR_HALF * 2 - 0.06, WALL_HEIGHT - 0.04, 0.2, [plain, plain, plain, plain, face, plain], x, top + WALL_HEIGHT / 2, z);
      extras.add(panel);
      for (const side of [-1, 1]) extras.add(box(0.14, WALL_HEIGHT, 0.12, trim, x + side * (DOOR_HALF + 0.02), top + WALL_HEIGHT / 2, z + WALL + 0.06));
      const center = new THREE.Vector3(x, top + WALL_HEIGHT + 1.35, z + WALL + 0.12);
      const ring = new THREE.Mesh(new THREE.CircleGeometry(MOON_SIZE / 2 + 0.16, 40), gold), back = new THREE.Mesh(new THREE.CircleGeometry(MOON_SIZE / 2 + 0.06, 40), plaqueBack);
      ring.position.copy(center); back.position.copy(center).z += 0.01;
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 10), lampLight);
      lamp.position.set(x, top + WALL_HEIGHT + 2.55, z + WALL + 0.12); lamp.visible = false;
      plaques.add(ring, back, box(0.14, 0.55, 0.14, trim, x, top + WALL_HEIGHT + 0.7, z + WALL), lamp);
      return { x, panel, lamp, open: false, slide: 0, shake: 0, wait: 0, item: label(index, moonSVG(door.amount, door.side), 'moon-run-moon', center, MOON_SIZE, MOON_PX) };
    });
    // The date stands on a tall signpost at each end of the wall, off the path, level with the moons.
    // Like the moons, it shows only on the gate Lumi is facing, so a later date never stands beside this one.
    const tall = top + WALL_HEIGHT + 2.1, board = new THREE.SpriteMaterial({ map: signTexture(gate.day, tall), transparent: true, alphaTest: 0.3 });
    for (const side of [-1, 1]) { const post = standing(board, 1.6, tall, 0); post.position.set(side * (HALF + 0.95), -0.06, z + 0.3); plaques.add(post); }
    extras.add(plaques); solid.add(walls); scene.add(extras);
    return { index, z, top, doors, walls, extras, plaques, materials: [wall, beam, trim, gold, plaqueBack, plain, face, board], alpha: 1 };
  });
  scene.add(solid);
  const world = new Octree().fromGraphNode(solid);

  // --- Scenery: lanterns, trees, the observatory, the cheering researcher, stars and far hills.
  const decor = [], random = seeded(29), dummy = new THREE.Object3D();
  const posts = [];
  for (const slab of slabs) for (let s = slab.s0 + 1.5; s < slab.s1 - 0.5; s += 5.5) {
    if (gateS.some(gate => Math.abs(gate - s) < 1.2)) continue;
    for (const side of [-1, 1]) posts.push([side * (HALF - 0.28), slab.top, -s]);
  }
  for (const stone of stones) posts.push([stone.x + stone.half - 0.25, stone.top, -(stone.s0 + stone.s1) / 2]);
  const glowAt = new Float32Array(posts.length * 3);
  posts.forEach(([x, y, z], i) => glowAt.set([x, y + 1.16, z], i * 3));
  if (propsArt) {
    // props.webp holds four cells, three wide by four tall: pine, round tree, flowering bush, lantern post.
    const kinds = [0, 1, 2, 3].map(column => { const map = propsArt.clone(); cell(map, column, 0, 4, 1); textures.push(map); return cutout(map); });
    for (const [x, y, z] of posts) { const lantern = standing(kinds[3], 1.5 * 0.75, 1.5, 0.01); lantern.position.set(x, y, z); scene.add(lantern); decor.push(lantern); }
    const wet = streams();
    for (let s = -6; s < END + 14; s += 2.6) for (const side of [-1, 1]) {
      const pick = random(), far = random(), at = s + random() * 1.6;
      if (wet.some(([from, to]) => at > from - 1 && at < to + 1)) continue;
      const kind = pick < 0.42 ? 0 : pick < 0.68 ? 1 : 2, size = kind === 0 ? 4.4 + random() * 1.6 : kind === 1 ? 3.3 + random() * 1.1 : 1.1 + random() * 0.5;
      const plant = standing(kinds[kind], size * 0.75, size, 0.01);
      plant.position.set(side * (HALF + (kind === 2 ? 0.9 : 2.4) + far * 11), -0.06, -at); scene.add(plant); decor.push(plant);
    }
  } else {
    const stems = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.06, 0.08, 1, 6), new THREE.MeshLambertMaterial({ color: '#39466a' }), posts.length);
    const lamps = new THREE.InstancedMesh(new THREE.SphereGeometry(0.17, 10, 8), lampLight, posts.length);
    posts.forEach(([x, y, z], i) => {
      dummy.position.set(x, y + 0.5, z); dummy.updateMatrix(); stems.setMatrixAt(i, dummy.matrix);
      dummy.position.set(x, y + 1.12, z); dummy.updateMatrix(); lamps.setMatrixAt(i, dummy.matrix);
    });
    scene.add(stems, lamps);
  }
  const glowTexture = drawn(64, 64, g => { const fade = g.createRadialGradient(32, 32, 2, 32, 32, 32); fade.addColorStop(0, '#ffe7a8cc'); fade.addColorStop(0.4, '#ffd98a44'); fade.addColorStop(1, '#ffd98a00'); g.fillStyle = fade; g.fillRect(0, 0, 64, 64); });
  const glowGeometry = new THREE.BufferGeometry(); glowGeometry.setAttribute('position', new THREE.BufferAttribute(glowAt, 3));
  scene.add(new THREE.Points(glowGeometry, new THREE.PointsMaterial({ map: glowTexture, size: 1.9, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })));

  const goalTop = slabAt(observatoryS).top;
  if (observatoryArt) {
    const building = standing(cutout(observatoryArt), 7.6 * observatoryArt.image.width / observatoryArt.image.height, 7.6, 0.02);
    building.position.set(0, goalTop, -observatoryS); scene.add(building);
  } else {
    const shell = new THREE.MeshLambertMaterial({ color: '#dfe5f0' }), domeSkin = new THREE.MeshLambertMaterial({ color: '#9fb0cf' }), dark = new THREE.MeshLambertMaterial({ color: '#16233f' });
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.7, 2.6, 24), shell); tower.position.set(0, goalTop + 1.3, -observatoryS);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(2.6, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), domeSkin); dome.position.set(0, goalTop + 2.6, -observatoryS);
    scene.add(tower, dome, box(1.3, 1.9, 0.2, dark, 0, goalTop + 0.95, -observatoryS + 2.62), box(0.7, 1.6, 0.4, dark, 0, goalTop + 4.1, -observatoryS + 1.9));
  }
  const mat = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.45, 36), new THREE.MeshBasicMaterial({ color: '#a7dcc9', transparent: true, opacity: 0.75 })); mat.rotation.x = -Math.PI / 2; mat.position.set(0, goalTop + 0.03, -arriveS - 0.6); scene.add(mat);
  cell(studentSheet, 0, 0);
  const helperMaterial = cutout(studentSheet);
  const helpers = [[3.3, 0, -2.4], [-2.6, goalTop, -arriveS - 1.2]].map(([x, y, z]) => { const sprite = standing(helperMaterial, 1.75, 1.75); sprite.position.set(x, y, z); scene.add(sprite); return { sprite, y }; });

  const far = new THREE.Group(), starAt = new Float32Array(360 * 3);
  for (let i = 0; i < 360; i++) starAt.set([(random() - 0.5) * 300, 9 + random() * 50, -150], i * 3);
  const starGeometry = new THREE.BufferGeometry(); starGeometry.setAttribute('position', new THREE.BufferAttribute(starAt, 3));
  far.add(new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: '#fff3cf', size: 2.2, sizeAttenuation: false, fog: false, depthWrite: false })));
  const ridgeTexture = ridgeArt || drawn(1024, 256, g => {
    const r = seeded(5);
    for (const [color, base, wave] of [['#1b3158', 110, 46], ['#12233f', 140, 26]]) {
      g.fillStyle = color; g.beginPath(); g.moveTo(0, 256);
      for (let x = 0; x <= 1024; x += 16) g.lineTo(x, base - Math.abs(Math.sin(x / 130 + r() * 0.4)) * wave - r() * 8);
      g.lineTo(1024, 256); g.fill();
    }
  });
  // The painted hills are a band whose top fades to nothing, so the code-drawn stars show above them.
  const ridgeHeight = ridgeArt ? 330 * ridgeArt.image.height / ridgeArt.image.width : 40;
  const ridge = new THREE.Mesh(new THREE.PlaneGeometry(330, ridgeHeight), new THREE.MeshBasicMaterial({ map: ridgeTexture, transparent: true, fog: false, depthWrite: false }));
  ridge.position.set(0, ridgeHeight / 2 - (ridgeArt ? 30 : 16), -140); far.add(ridge); scene.add(far);

  const runner = new Runner(world, walk); scene.add(runner.group);
  runner.still = reduced; runner.place(0, 0.05, 0);
  const bounds = { minX: -HALF + 0.42, maxX: HALF - 0.42, minZ: -(observatoryS - 3.4), maxZ: 4.2 };
  let current = 0, clock = 0, sinceStep = 1, lastFloorS = 0, arrived = false, stopped = false, paused = false, raf = 0, last = 0, camFloor = 0, width = 1, height = 1;
  const seen = new Set(), steps = slabs.flatMap((slab, i) => (i && Math.abs(slab.s0 - slabs[i - 1].s1) < 0.01 ? [slab.s0] : []));
  /** A gate shows its moons from the moment Lumi is through the gate before it until she is through this one. */
  const facing = gate => gate.index <= current && (!gate.index || runner.position.z < course[gate.index - 1].z - 0.8) && runner.position.z > gate.z - 1.2;

  /** Holds Lumi at a closed door and reports the touch. Returns the corrected z or null. */
  function barrier(before, x, z) {
    for (const gate of course) {
      const front = gate.z + WALL + RADIUS, back = gate.z - WALL - RADIUS;
      if (z >= front || z <= back || (before < front && before > back)) continue;
      const doorIndex = gate.doors.findIndex(door => Math.abs(x - door.x) < DOOR_HALF);
      if (doorIndex < 0 || gate.doors[doorIndex].open) continue;
      if (before >= front) { touch(gate, doorIndex); if (gate.doors[doorIndex].open) continue; return front; }
      return back;
    }
    return null;
  }
  function touch(gate, doorIndex) {
    const door = gate.doors[doorIndex];
    if (gate.index !== current || clock < door.wait || runner.stunned > 0) return;
    door.wait = clock + 0.9;
    const result = onDoor(gate.index, doorIndex);
    if (result.ok) {
      door.open = true; door.item.el.classList.add('is-open'); current = gate.index + 1;
      for (const other of gate.doors) { other.lamp.visible = false; other.item.el.classList.remove('is-lit'); }
      if (reduced) door.panel.visible = false;
      runner.hop();
      return;
    }
    runner.flinch(); door.shake = 0.45;
    door.item.el.classList.remove('is-wrong'); void door.item.el.offsetWidth; door.item.el.classList.add('is-wrong');
    if (result.reveal && gate.doors[result.answer]) { gate.doors[result.answer].lamp.visible = true; gate.doors[result.answer].item.el.classList.add('is-lit'); }
  }
  const view = new THREE.Vector3();
  function placeLabels() {
    const k = height / (2 * Math.tan(camera.fov * Math.PI / 360));
    for (const item of labelItems) {
      view.copy(item.position).applyMatrix4(camera.matrixWorldInverse);
      const depth = -view.z;
      // Labels lie over the canvas and are not hidden by walls, so only the gate Lumi is facing shows them.
      if (!facing(course[item.gate]) || depth < 2.5 || depth > 48) { if (item.shown) { item.el.hidden = true; item.shown = false; } continue; }
      view.applyMatrix4(camera.projectionMatrix);
      const x = (view.x * 0.5 + 0.5) * width, y = (-view.y * 0.5 + 0.5) * height, scale = item.size * k / depth / item.base;
      item.el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) translate(-50%,-50%) scale(${scale.toFixed(3)})`;
      item.el.style.opacity = depth > 40 ? ((48 - depth) / 8).toFixed(2) : '';
      if (!item.shown) { item.el.hidden = false; item.shown = true; }
    }
  }
  function draw() {
    const tx = runner.position.x * 0.5, z = runner.position.z;
    camera.position.set(tx, camFloor + 4.9, z + 8.8); camera.lookAt(tx, camFloor + 2, z - 5); camera.updateMatrixWorld();
    far.position.set(tx * 0.6, 0, camera.position.z);
    // Standing pictures behind the camera or far ahead are not drawn.
    for (const sprite of decor) sprite.visible = sprite.position.z < camera.position.z + 2 && sprite.position.z > z - 62;
    placeLabels();
    renderer.render(scene, camera);
  }
  function frame(now) {
    if (stopped) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
    if (paused || document.hidden || !dt) return;
    clock += dt;
    runner.step(dt, arrived ? { x: 0, y: 0, jump: false } : read(), bounds, barrier);
    // Sounds of Lumi's own moves: the jump she was asked for, and a footstep every 300 ms while she runs on the ground.
    if (runner.jumped) onCue('jump');
    sinceStep += dt;
    if (!arrived && runner.onFloor && runner.stunned === 0 && Math.hypot(runner.velocity.x, runner.velocity.z) > 0.4 && sinceStep >= 0.3) { sinceStep = sinceStep < 0.6 ? sinceStep - 0.3 : 0; onCue('step'); }
    const s = -runner.position.z;
    if (runner.onFloor && slabAt(s)) lastFloorS = s;
    if (runner.position.y < checkpointFor(lastFloorS).top - WATER_DROP - 0.35) {
      const back = checkpointFor(lastFloorS);
      runner.place(0, back.top + 0.05, -back.s); onFall();
    }
    for (const [from] of streams()) if (!seen.has('jump') && s > from - 4 && s < from) { seen.add('jump'); onNear('jump'); }
    for (const at of steps) if (!seen.has('step') && s > at - 3.5 && s < at) { seen.add('step'); onNear('step'); }
    if (!arrived && current >= course.length && s >= arriveS) { arrived = true; runner.cheering = true; onArrive(); }
    for (const gate of course) {
      // Once Lumi is through, the wall would cover her from the camera, so the whole gate fades out.
      const target = runner.position.z < gate.z - 1 ? 0 : 1;
      if (gate.alpha !== target) {
        gate.alpha = reduced ? target : Math.max(0, Math.min(1, gate.alpha + (target ? 1 : -1) * dt * 5));
        for (const material of gate.materials) { material.transparent = gate.alpha < 1; material.opacity = gate.alpha; material.depthWrite = gate.alpha === 1; }
        gate.walls.visible = gate.extras.visible = gate.alpha > 0;
      }
      gate.plaques.visible = facing(gate);
      for (const door of gate.doors) {
        if (door.open && door.slide < 1 && !reduced) { door.slide = Math.min(1, door.slide + dt * 2.4); door.panel.position.y = gate.top + WALL_HEIGHT / 2 - door.slide * (WALL_HEIGHT + 0.1); if (door.slide === 1) door.panel.visible = false; }
        if (door.shake > 0) { door.shake = Math.max(0, door.shake - dt); door.panel.position.x = door.x + (reduced ? 0 : Math.sin(door.shake * 60) * 0.05 * (door.shake / 0.45)); }
      }
    }
    if (!reduced) {
      for (const helper of helpers) helper.sprite.position.y = helper.y + Math.abs(Math.sin(clock * 3.2)) * 0.12;
      if (streamArt) streamArt.offset.x = (clock * 0.06) % 1;
    }
    camFloor += (runner.floor - camFloor) * Math.min(1, dt * 4);
    draw();
  }
  const resize = new ResizeObserver(() => {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    width = w; height = h;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w / h < 1.5 ? 54 : 46; camera.updateProjectionMatrix();
    if (!stopped) draw();
  });
  resize.observe(host);
  raf = requestAnimationFrame(frame);

  return {
    get passed() { return current; },
    /** Course position and floor contact, for checks and for the tips. */
    get state() { return { s: -runner.position.z, x: runner.position.x, y: runner.position.y, onFloor: runner.onFloor, arrived }; },
    pause(value) { paused = !!value; last = performance.now(); },
    dispose() {
      stopped = true; cancelAnimationFrame(raf); resize.disconnect();
      canvas.removeEventListener('webglcontextlost', lose);
      scene.traverse(object => {
        object.geometry?.dispose();
        for (const material of [object.material].flat()) { if (!material) continue; material.map?.dispose(); material.dispose(); }
      });
      for (const texture of textures) texture?.dispose();
      labels.replaceChildren();
      renderer.dispose(); renderer.forceContextLoss(); canvas.remove();
    },
  };
}
