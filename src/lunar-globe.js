import {
  ImageLoader, Mesh, OrthographicCamera, Scene, ShaderMaterial, SRGBColorSpace,
  Texture, Vector3, WebGLRenderer,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { lunarPhaseAngle } from './lunar-model.js';

const assetPath = '/assets/generated/lunar-observation/';
const vertexShader = `
  varying vec3 lunarPosition;
  void main() {
    lunarPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const fragmentShader = `
  uniform sampler2D surfaceAtlas;
  uniform vec3 sunlight;
  varying vec3 lunarPosition;

  void main() {
    vec3 normal = normalize(lunarPosition);
    float incidence = dot(normal, sunlight);
    if (incidence <= 0.0) discard;

    // North up, with the mean sub-Earth point at the center of the view.
    vec2 uv = vec2(0.5 + atan(normal.x, normal.z) / 6.2831853,
                   0.5 + asin(clamp(normal.y, -1.0, 1.0)) / 3.1415927);
    vec3 albedo = texture2D(surfaceAtlas, uv).rgb;
    float facing = max(normal.z, 0.0);
    float reflection = 1.42 * pow(2.0 * incidence / (incidence + facing), 0.55)
                       + 0.24 * incidence;
    float edge = smoothstep(0.0, 0.02, incidence);
    gl_FragColor = vec4(albedo * reflection, edge);
    #include <colorspace_fragment>
  }
`;

export function mountLunarGlobe(host, initialDay) {
  let renderer;
  try {
    renderer = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch {
    return null;
  }
  const canvas = renderer.domElement;
  canvas.className = 'lunar-globe';
  canvas.setAttribute('aria-hidden', 'true');
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));

  const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 6);
  camera.position.z = 3;
  const scene = new Scene();
  const atlas = new Texture();
  atlas.colorSpace = SRGBColorSpace;
  const sunlight = new Vector3();
  const material = new ShaderMaterial({
    vertexShader, fragmentShader, transparent: true,
    uniforms: { surfaceAtlas: { value: atlas }, sunlight: { value: sunlight } },
  });
  let geometry, globe, resize, disposed = false;

  function draw() {
    renderer.render(scene, camera);
  }

  function setDay(day) {
    const angle = lunarPhaseAngle(day);
    // The observer stays in place while the direction to the Sun changes.
    sunlight.set(Math.sin(angle), 0, -Math.cos(angle));
    if (globe) draw();
  }

  function fit() {
    const width = host.clientWidth, height = host.clientHeight;
    if (!width || !height) return;
    const diameter = Math.min(width, height) * 0.96;
    camera.right = width / diameter;
    camera.left = -camera.right;
    camera.top = height / diameter;
    camera.bottom = -camera.top;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    draw();
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    resize?.disconnect();
    canvas.removeEventListener('webglcontextlost', dispose);
    canvas.remove();
    host.classList.remove('has-lunar-globe');
    geometry?.dispose();
    material.dispose();
    atlas.dispose();
    renderer.dispose();
    if (!renderer.getContext().isContextLost()) renderer.forceContextLoss();
  }

  setDay(initialDay);
  canvas.addEventListener('webglcontextlost', dispose);
  const loadGeometry = new GLTFLoader().loadAsync(assetPath + 'moon.glb').then(({ scene }) => {
    const mesh = scene.children[0];
    mesh.material.dispose();
    if (disposed) mesh.geometry.dispose();
    else geometry = mesh.geometry;
  });
  const loadAtlas = new ImageLoader().loadAsync(assetPath + 'surface.webp');
  Promise.all([loadGeometry, loadAtlas]).then(([, image]) => {
    if (disposed) return;
    atlas.image = image;
    atlas.needsUpdate = true;
    globe = new Mesh(geometry, material);
    scene.add(globe);
    fit();
    host.append(canvas);
    host.classList.add('has-lunar-globe');
    resize = new ResizeObserver(fit);
    resize.observe(host);
  }).catch(dispose);

  return { setDay, dispose };
}
