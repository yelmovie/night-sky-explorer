import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
export function mountPlanet(host, planet, onView) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
  } catch {
    host.innerHTML =
      '<p class="empty">이 기기에서는 3D 화면을 열 수 없어.<br>다른 WebGL 지원 브라우저에서 회전 관찰을 해 줘. 아래 자료는 읽을 수 있어.</p>';
    return { dispose() {}, setView() {}, available: false };
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0, 0);
  host.appendChild(renderer.domElement);
  renderer.domElement.setAttribute(
    "aria-label",
    `${planet.name} 3D 모형. 드래그로 회전하고 두 손가락으로 확대할 수 있어.`,
  );
  const scene = new THREE.Scene(),
    camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 1, 6);
  const control = new OrbitControls(camera, renderer.domElement);
  control.enablePan = false;
  control.minDistance = 3.4;
  control.maxDistance = 8;
  control.enableDamping = false;
  scene.add(new THREE.AmbientLight("#dceaff", 2));
  const key = new THREE.DirectionalLight("#fff2d7", 3);
  key.position.set(-3, 4, 5);
  scene.add(key);
  const tex = document.createElement("canvas");
  tex.width = 1024;
  tex.height = 512;
  const ctx = tex.getContext("2d");
  ctx.fillStyle = planet.color;
  ctx.fillRect(0, 0, 1024, 512);
  let seed = planet.id.length * 100 + 7;
  function rand() {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  if (["bands", "rings", "cloud", "ice"].includes(planet.type)) {
    for (let y = 0; y < 512; y += 3) {
      ctx.fillStyle = `rgba(${y % 31 < 15 ? "255,242,214" : "92,69,54"},${0.04 + rand() * 0.24})`;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= 1024; x += 8)
        ctx.lineTo(x, y + Math.sin(x / 55 + y) * 4);
      ctx.lineTo(1024, y + 6);
      ctx.lineTo(0, y + 6);
      ctx.fill();
    }
    if (planet.id === "jupiter") {
      ctx.fillStyle = "#b55f42";
      ctx.beginPath();
      ctx.ellipse(300, 310, 62, 27, -0.04, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#f2ca9d";
      ctx.lineWidth = 8;
      ctx.stroke();
    }
  }
  if (planet.type === "rock") {
    for (let i = 0; i < 160; i++) {
      const x = rand() * 1024,
        y = rand() * 512,
        r = rand() * 30 + 2;
      ctx.fillStyle = `rgba(63,38,31,${0.05 + rand() * 0.2})`;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#f2c19a22";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    if (planet.id === "mars") {
      ctx.fillStyle = "#e9ddd0";
      ctx.fillRect(0, 0, 1024, 20);
    }
  }
  if (planet.type === "earth") {
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = i % 2 ? "#60815a" : "#8a9970";
      const x = rand() * 1024,
        y = 80 + rand() * 330;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let j = 0; j < 9; j++)
        ctx.lineTo(
          x + Math.cos((j / 8) * Math.PI * 2) * (15 + rand() * 65),
          y + Math.sin((j / 8) * Math.PI * 2) * (15 + rand() * 35),
        );
      ctx.fill();
    }
    for (let i = 0; i < 28; i++) {
      ctx.fillStyle = "#ffffff66";
      ctx.fillRect(
        rand() * 1024,
        rand() * 512,
        30 + rand() * 100,
        4 + rand() * 12,
      );
    }
  }
  const texture = new THREE.CanvasTexture(tex);
  texture.colorSpace = THREE.SRGBColorSpace;
  const globe = new THREE.Mesh(
    new THREE.SphereGeometry(1.15, 64, 48),
    new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9 }),
  );
  scene.add(globe);
  if (planet.id === "saturn" || planet.id === "uranus") {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.4, 2.1, 96),
      new THREE.MeshStandardMaterial({
        color: planet.id === "saturn" ? "#c9b383" : "#96b6bb",
        side: THREE.DoubleSide,
        transparent: true,
        opacity: planet.id === "saturn" ? 0.82 : 0.25,
        roughness: 1,
      }),
    );
    ring.rotation.x = Math.PI / 2.4;
    ring.rotation.y = 0.15;
    scene.add(ring);
  }
  function render() {
    renderer.render(scene, camera);
    onView?.({
      rotation: Math.round((control.getAzimuthalAngle() * 180) / Math.PI),
      distance: Number(camera.position.length().toFixed(2)),
    });
  }
  const resize = new ResizeObserver(() => {
    const w = host.clientWidth,
      h = host.clientHeight;
    if (w && h) {
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      render();
    }
  });
  resize.observe(host);
  control.addEventListener("change", render);
  render();
  function lost(e) {
    e.preventDefault();
    host.dataset.status = "lost";
    const msg = document.createElement("p");
    msg.className = "webgl-warning";
    msg.textContent = "3D 연결이 끊겼어. 다른 화면에 다녀오면 다시 열 수 있어.";
    host.append(msg);
  }
  renderer.domElement.addEventListener("webglcontextlost", lost);
  return {
    available: true,
    setView(rotation, zoom) {
      const a = (rotation * Math.PI) / 180,
        r = 7 - zoom;
      camera.position.set(Math.sin(a) * r, 1, Math.cos(a) * r);
      control.update();
      render();
    },
    dispose() {
      resize.disconnect();
      control.dispose();
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          o.material.map?.dispose();
          o.material.dispose();
        }
      });
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
