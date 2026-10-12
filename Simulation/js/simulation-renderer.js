import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const TAU = Math.PI * 2;
const CAMERA_PRESETS = Object.freeze({
  overview: { position: [5.8, 3.35, 6.8], distance: 1.16 },
  vessel: { position: [3.5, 2.1, 4.4], distance: 1 },
  close: { position: [1.9, 1.1, 2.35], distance: .82 },
  top: { position: [1.2, 8, 1.3], distance: 1.05 },
});
const PARTICLE_COUNT = 660;
const FLASK_PROFILE = [[.47, -1.75], [1.02, -1.62], [1.12, -.62], [.94, -.13], [.36, .45], [.25, 1.35], [.25, 1.78]];
// Fixed illustrative working volumes. Concentration never changes their bounds.
const LIQUID_PROFILES = {
  cylinder: [[1.12, -1.755], [1.12, .995]],
  flask: [[.5, -1.8], [.96, -1.68], [1.02, -.78], [.84, -.25], [.27, .26], [.19, .82]],
};
const VESSEL_BOUNDS = {
  cylinder: { center: [0, -.05, 0], radius: 2.42 },
  flask: { center: [0, -.05, 0], radius: 2.23 },
  tubular: { center: [0, -.02, 0], radius: 1.85 },
};
const TUBE_CURVE = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-1.2, -.72, 0), new THREE.Vector3(-.7, .35, 0),
  new THREE.Vector3(0, .72, 0), new THREE.Vector3(.7, .35, 0), new THREE.Vector3(1.2, -.72, 0),
]);
const TUBE_SEGMENTS = 96;
const TUBE_FRAMES = TUBE_CURVE.computeFrenetFrames(TUBE_SEGMENTS, false);

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function seededUnit(index, salt = 0) {
  const value = Math.sin((index + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function normalizeGeometry(value) {
  return Object.hasOwn(VESSEL_BOUNDS, value) ? value : "cylinder";
}

function concentration(state) {
  const biomass = Number(state.biomass);
  const capacity = Number(state.carryingCapacity);
  return clamp((Number.isFinite(biomass) ? biomass : 0) / (Number.isFinite(capacity) && capacity > 0 ? capacity : 2), 0, 1);
}

function cultureColor(density) {
  return new THREE.Color().setHSL(.37, .5 + density * .24, .44 - density * .21);
}

function profileRadius(profile, y) {
  for (let index = 1; index < profile.length; index += 1) {
    const [radius, height] = profile[index];
    if (y <= height) {
      const [previousRadius, previousHeight] = profile[index - 1];
      return THREE.MathUtils.lerp(previousRadius, radius, clamp((y - previousHeight) / (height - previousHeight), 0, 1));
    }
  }
  return profile.at(-1)[0];
}

// The same geometry-aware samples drive WebGL markers and the Canvas projection.
function culturePoint(target, geometry, index, time = 0, salt = 0) {
  const fraction = (seededUnit(index, 14 + salt) + time * (salt ? .07 : .012)) % 1;
  const angle = seededUnit(index, 12 + salt) * TAU + time * .045;
  const radial = Math.sqrt(seededUnit(index, 13 + salt));
  if (geometry === "tubular") {
    TUBE_CURVE.getPointAt(fraction, target);
    const frame = Math.round(fraction * TUBE_SEGMENTS);
    target.addScaledVector(TUBE_FRAMES.normals[frame], Math.cos(angle) * radial * .23);
    target.addScaledVector(TUBE_FRAMES.binormals[frame], Math.sin(angle) * radial * .23);
  } else {
    const profile = LIQUID_PROFILES[geometry];
    const bottom = profile[0][1] + .08;
    const top = profile.at(-1)[1] - .08;
    const y = THREE.MathUtils.lerp(bottom, top, fraction);
    const radius = Math.max(0, profileRadius(profile, y) - .09) * radial;
    target.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
  }
  return target;
}

function disposeObject(object) {
  const geometries = new Set();
  const materials = new Set();
  object.traverse((node) => {
    if (node.geometry) geometries.add(node.geometry);
    if (node.material) {
      (Array.isArray(node.material) ? node.material : [node.material]).forEach((item) => materials.add(item));
    }
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((item) => item.dispose());
}

function material(options = {}) {
  return new THREE.MeshStandardMaterial({ roughness: .55, metalness: .1, ...options });
}

class CanvasFallback {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d", { alpha: false });
    if (!this.context) throw new Error("Canvas projection is unavailable");
    this.width = 0;
    this.height = 0;
    this.point = new THREE.Vector3();
    this.projected = new THREE.Vector3();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const ratio = Math.min(globalThis.devicePixelRatio || 1, 2);
    this.width = Math.max(1, Math.floor(rect.width));
    this.height = Math.max(1, Math.floor(rect.height));
    this.canvas.width = Math.floor(this.width * ratio);
    this.canvas.height = Math.floor(this.height * ratio);
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  project(x, y, z, camera) {
    this.projected.set(x, y, z).project(camera);
    return [(this.projected.x + 1) * this.width / 2, (1 - this.projected.y) * this.height / 2, this.projected.z];
  }

  ring(radius, height, camera, segments = 36) {
    return Array.from({ length: segments }, (_, index) => {
      const angle = index / segments * TAU;
      return this.project(Math.cos(angle) * radius, height, Math.sin(angle) * radius, camera);
    });
  }

  path(points, close = true) {
    this.context.beginPath();
    points.forEach(([x, y], index) => index ? this.context.lineTo(x, y) : this.context.moveTo(x, y));
    if (close) this.context.closePath();
  }

  lathe(profile, camera, color, opacity, capped = false) {
    const ctx = this.context;
    const rings = profile.map(([radius, y]) => this.ring(radius, y, camera));
    const faces = [];
    for (let row = 1; row < rings.length; row += 1) {
      for (let index = 0; index < rings[row].length; index += 1) {
        const next = (index + 1) % rings[row].length;
        faces.push([rings[row - 1][index], rings[row - 1][next], rings[row][next], rings[row][index]]);
      }
    }
    if (capped) faces.push(rings[0], rings.at(-1));
    const depth = (face) => face.reduce((sum, point) => sum + point[2], 0) / face.length;
    faces.sort((left, right) => depth(right) - depth(left));
    ctx.fillStyle = color;
    ctx.globalAlpha = opacity;
    for (const face of faces) { this.path(face); ctx.fill(); }
    ctx.globalAlpha = 1;
  }

  draw(state, time, camera) {
    const ctx = this.context;
    const width = this.width;
    const height = this.height;
    camera.updateMatrixWorld();
    const density = concentration(state);
    const color = cultureColor(density).getStyle();
    const background = ctx.createLinearGradient(0, 0, width, height);
    background.addColorStop(0, "#0b2116");
    background.addColorStop(.55, "#07150e");
    background.addColorStop(1, "#040b07");
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "rgba(145,228,156,.08)";
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 28) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
    for (let y = 14; y < height; y += 28) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }

    const glow = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) * .6);
    glow.addColorStop(0, "rgba(105,220,124,.18)");
    glow.addColorStop(1, "rgba(105,220,124,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    if (state.geometry === "tubular") {
      const points = Array.from({ length: TUBE_SEGMENTS + 1 }, (_, index) => {
        TUBE_CURVE.getPointAt(index / TUBE_SEGMENTS, this.point);
        return this.project(this.point.x, this.point.y, this.point.z, camera);
      });
      const pixelsPerUnit = height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.length());
      ctx.lineCap = "round";
      this.path(points, false); ctx.lineWidth = pixelsPerUnit * .84; ctx.strokeStyle = "rgba(188,245,205,.38)"; ctx.stroke();
      this.path(points, false); ctx.lineWidth = pixelsPerUnit * .68; ctx.strokeStyle = color; ctx.globalAlpha = .35 + density * .45; ctx.stroke(); ctx.globalAlpha = 1;
      for (const point of [points[0], points.at(-1)]) {
        ctx.beginPath(); ctx.arc(point[0], point[1], pixelsPerUnit * .44, 0, TAU); ctx.fillStyle = "#356849"; ctx.fill();
      }
    } else {
      const flask = state.geometry === "flask";
      const shell = flask ? FLASK_PROFILE : [[1.22, -1.81], [1.22, 1.81]];
      this.lathe([[flask ? 1.3 : 1.42, -1.95], [flask ? 1.17 : 1.32, -1.79]], camera, "#356849", 1, true);
      this.lathe(LIQUID_PROFILES[state.geometry], camera, color, .26 + density * .45, true);
      this.lathe(shell, camera, "#bcefd0", .055);
      ctx.strokeStyle = "rgba(188,245,205,.7)"; ctx.lineWidth = 2;
      this.path(this.ring(shell.at(-1)[0], shell.at(-1)[1], camera)); ctx.stroke();
      ctx.strokeStyle = "rgba(188,245,205,.3)"; ctx.lineWidth = 1;
      this.path(this.ring(shell[0][0], shell[0][1], camera)); ctx.stroke();
    }

    const particleCount = Math.max(18, Math.floor(18 + density * (PARTICLE_COUNT - 18)));
    for (let index = 0; index < particleCount; index += 1) {
      culturePoint(this.point, state.geometry, index, time);
      const [x, y] = this.project(this.point.x, this.point.y, this.point.z, camera);
      ctx.fillStyle = index % 7 === 0 ? "rgba(115,216,211,.75)" : "rgba(181,255,192,.7)";
      ctx.beginPath();
      ctx.arc(x, y, 1 + seededUnit(index, 6), 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = "#a5beac";
    ctx.font = "9px IBM Plex Mono, monospace";
    ctx.fillText("CANVAS / SYNTHETIC PROJECTION", 16, height - 12);
  }
}

export class SimulationRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.mode = "canvas";
    this.cameraName = "overview";
    this.state = { geometry: "cylinder", biomass: .1, carryingCapacity: 2, running: false };
    this.clock = new THREE.Clock();
    this.raf = 0;
    this.destroyed = false;
    this.needsRender = true;
    this.renderingFrame = false;
    this.reducedMotionQuery = typeof globalThis.matchMedia === "function"
      ? globalThis.matchMedia("(prefers-reduced-motion: reduce)")
      : null;
    this.reducedMotion = Boolean(this.reducedMotionQuery?.matches);
    this.onVisibilityChange = () => this.scheduleRender();
    this.onMotionPreferenceChange = (event) => {
      this.reducedMotion = Boolean(event.matches);
      if (this.controls) this.controls.enableDamping = !this.reducedMotion;
      this.scheduleRender();
    };
    this.onContextLost = (event) => {
      event.preventDefault();
      this.activateCanvasFallback(new Error("webgl-context-lost"));
    };
    this.onCanvasKeyDown = (event) => this.handleCanvasKey(event);
    this.resizeObserver = typeof ResizeObserver === "function"
      ? new ResizeObserver(() => this.resize())
      : null;
    this.resizeObserver?.observe(canvas);
    this.fallback = null;
    this.scene = null;
    this.camera = null;
    this.webgl = null;
    this.controls = null;
    this.vesselGroup = null;
    this.cultureGroup = null;
    this.liquidGroup = null;
    this.bubbles = null;
    this.particles = null;
    this.particlePositions = null;
    this.particleCount = 0;
    this.particlePoint = new THREE.Vector3();
    this.bubblePoint = new THREE.Vector3();
    this.reducedMotionQuery?.addEventListener?.("change", this.onMotionPreferenceChange);
    globalThis.document?.addEventListener?.("visibilitychange", this.onVisibilityChange);
    this.animate = this.animate.bind(this);
    this.setup();
    this.scheduleRender();
  }

  setup() {
    const forcedCanvas = (() => {
      try { return new URLSearchParams(globalThis.location?.search || "").get("render") === "2d"; }
      catch { return false; }
    })();
    if (forcedCanvas) {
      this.activateCanvasFallback();
      return;
    }
    try {
      this.canvas.addEventListener("webglcontextlost", this.onContextLost, { once: true });
      this.webgl = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
      this.webgl.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 1.8));
      this.webgl.outputColorSpace = THREE.SRGBColorSpace;
      this.webgl.toneMapping = THREE.ACESFilmicToneMapping;
      this.webgl.toneMappingExposure = 1.15;
      this.mode = "webgl";
      this.buildScene();
      this.canvas.dataset.renderer = "webgl";
      this.canvas.dataset.drawCalls = "1";
      this.setCamera("overview");
      this.resize();
    } catch (error) {
      this.activateCanvasFallback(error);
    }
    this.canvas.dataset.camera = this.cameraName;
    this.canvas.dataset.geometry = this.state.geometry;
  }

  replaceCanvas() {
    const previous = this.canvas;
    const replacement = previous.cloneNode(false);
    previous.replaceWith(replacement);
    previous.removeEventListener("webglcontextlost", this.onContextLost);
    previous.removeEventListener("keydown", this.onCanvasKeyDown);
    this.resizeObserver?.disconnect();
    this.canvas = replacement;
    this.resizeObserver?.observe(replacement);
    return replacement;
  }

  activateCanvasFallback(error = null) {
    if (this.destroyed || this.mode === "canvas" && this.fallback) return;
    this.mode = "canvas";
    try { this.webgl?.dispose(); } catch { /* context may already be lost */ }
    this.webgl = null;
    this.controls?.dispose();
    this.controls = null;
    if (this.scene) disposeObject(this.scene);
    this.scene = null;
    this.vesselGroup = null;
    this.liquidGroup = null;
    this.cultureGroup = null;
    this.particles = null;
    this.bubbles = null;
    this.particlePositions = null;
    this.particleCount = 0;
    this.replaceCanvas();
    this.fallback = new CanvasFallback(this.canvas);
    this.createCameraControls();
    this.canvas.dataset.renderer = "canvas";
    this.canvas.dataset.drawCalls = "1";
    if (error) this.canvas.dataset.rendererError = error.message || "webgl-unavailable";
    else delete this.canvas.dataset.rendererError;
    this.canvas.dataset.camera = this.cameraName;
    this.canvas.dataset.geometry = this.state.geometry;
    this.resize();
    this.setCamera(this.cameraName);
    this.resize();
    this.scheduleRender();
  }

  createCameraControls() {
    this.camera = new THREE.PerspectiveCamera(31, 1, .1, 100);
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = !this.reducedMotion;
    this.controls.dampingFactor = .065;
    this.controls.enablePan = false;
    this.controls.minDistance = 2.5;
    this.controls.maxDistance = 20;
    this.controls.maxPolarAngle = Math.PI * .8;
    this.controls.addEventListener("change", () => this.scheduleRender());
    this.canvas.addEventListener("keydown", this.onCanvasKeyDown);
  }

  buildScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x07130f);
    this.scene.fog = new THREE.Fog(0x07130f, 9, 20);
    this.createCameraControls();

    this.scene.add(new THREE.HemisphereLight(0xcaf9cf, 0x07100a, 1.8));
    const key = new THREE.DirectionalLight(0xa0f3a7, 3.4);
    key.position.set(3, 7, 4); this.scene.add(key);
    const cyan = new THREE.PointLight(0x5bd6d1, 4.5, 10, 2);
    cyan.position.set(-3, 2.4, 1.7); this.scene.add(cyan);
    const amber = new THREE.PointLight(0xf0ad61, 2.4, 8, 2);
    amber.position.set(3.4, 1, -2); this.scene.add(amber);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(22, 22), material({ color: 0x081710, roughness: .88, metalness: .02 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -2.08; this.scene.add(floor);
    const grid = new THREE.GridHelper(18, 18, 0x254c36, 0x133321);
    grid.position.y = -2.06; grid.material.transparent = true; grid.material.opacity = .45; this.scene.add(grid);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(18, 10), material({ color: 0x0b2116, roughness: .9 }));
    back.position.set(0, 2.4, -3.5); this.scene.add(back);
    for (let index = -5; index <= 5; index += 1) {
      const conduit = new THREE.Mesh(new THREE.CylinderGeometry(.013, .013, 7.5, 8), material({ color: index % 2 ? 0x235039 : 0x376d49, emissive: 0x0b2615, emissiveIntensity: .45 }));
      conduit.position.set(index * .72, 1.4, -3.42); conduit.rotation.z = Math.PI / 2; conduit.rotation.y = index * .025; this.scene.add(conduit);
    }
    const lightStrip = new THREE.Mesh(new THREE.BoxGeometry(5.8, .06, .22), new THREE.MeshBasicMaterial({ color: 0xa7ffc0 }));
    lightStrip.position.set(0, 4.45, -1.6); this.scene.add(lightStrip);
    const glow = new THREE.PointLight(0x9bf4aa, 1.6, 7, 2); glow.position.set(0, 4.1, -1.4); this.scene.add(glow);

    const consoleGroup = new THREE.Group();
    const consoleBody = new THREE.Mesh(new THREE.BoxGeometry(2.1, .75, .35), material({ color: 0x142d1e, roughness: .42, metalness: .35 }));
    consoleBody.position.set(-3.1, -.55, -2.7); consoleGroup.add(consoleBody);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.45, .39), new THREE.MeshBasicMaterial({ color: 0x52d0a0 }));
    screen.position.set(-3.1, -.4, -2.5); screen.rotation.y = .03; consoleGroup.add(screen);
    this.scene.add(consoleGroup);

    this.cultureGroup = new THREE.Group();
    this.scene.add(this.cultureGroup);
    this.vesselGroup = new THREE.Group();
    this.cultureGroup.add(this.vesselGroup);
    this.liquidGroup = new THREE.Group();
    this.cultureGroup.add(this.liquidGroup);
    this.makeParticles();
    this.makeBubbles();
    this.setGeometry(this.state.geometry);
  }

  makeParticles() {
    const max = PARTICLE_COUNT;
    const positions = new Float32Array(max * 3);
    const colors = new Float32Array(max * 3);
    for (let index = 0; index < max; index += 1) {
      culturePoint(this.particlePoint, this.state.geometry, index);
      positions[index * 3] = this.particlePoint.x;
      positions[index * 3 + 1] = this.particlePoint.y;
      positions[index * 3 + 2] = this.particlePoint.z;
      colors[index * 3] = index % 7 === 0 ? .45 : .42;
      colors[index * 3 + 1] = index % 7 === 0 ? .84 : .92;
      colors[index * 3 + 2] = index % 7 === 0 ? .82 : .62;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setDrawRange(0, 180);
    const points = new THREE.Points(geometry, new THREE.PointsMaterial({ size: .038, vertexColors: true, transparent: true, opacity: .9, sizeAttenuation: true, blending: THREE.AdditiveBlending }));
    this.particles = points;
    this.particlePositions = positions;
    this.particleCount = max;
    this.cultureGroup.add(points);
  }

  updateParticlePositions(time = 0) {
    if (!this.particles || !this.particlePositions) return;
    for (let index = 0; index < this.particleCount; index += 1) {
      culturePoint(this.particlePoint, this.state.geometry, index, time);
      this.particlePositions[index * 3] = this.particlePoint.x;
      this.particlePositions[index * 3 + 1] = this.particlePoint.y;
      this.particlePositions[index * 3 + 2] = this.particlePoint.z;
    }
    this.particles.geometry.attributes.position.needsUpdate = true;
  }

  makeBubbles() {
    const count = 48;
    const geometry = new THREE.SphereGeometry(.035, 8, 6);
    const bubbles = new THREE.InstancedMesh(geometry, new THREE.MeshBasicMaterial({ color: 0x9fffc2, transparent: true, opacity: .38 }), count);
    const transform = new THREE.Object3D();
    for (let index = 0; index < count; index += 1) {
      culturePoint(this.bubblePoint, this.state.geometry, index, seededUnit(index, 42), 40);
      transform.position.copy(this.bubblePoint);
      const scale = .45 + seededUnit(index, 43) * 1.2;
      transform.scale.setScalar(scale); transform.updateMatrix(); bubbles.setMatrixAt(index, transform.matrix);
    }
    bubbles.instanceMatrix.needsUpdate = true;
    this.bubbles = bubbles;
    this.cultureGroup.add(bubbles);
  }

  updateBubbles(time = 0) {
    if (!this.bubbles) return;
    const transform = new THREE.Object3D();
    for (let index = 0; index < this.bubbles.count; index += 1) {
      culturePoint(this.bubblePoint, this.state.geometry, index, time * .08 + seededUnit(index, 42), 40);
      transform.position.copy(this.bubblePoint);
      transform.scale.setScalar(.45 + seededUnit(index, 43) * 1.2);
      transform.updateMatrix();
      this.bubbles.setMatrixAt(index, transform.matrix);
    }
    this.bubbles.instanceMatrix.needsUpdate = true;
  }

  makeCylinder() {
    const group = new THREE.Group();
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(1.22, 1.22, 3.62, 52, 1, true), new THREE.MeshPhysicalMaterial({ color: 0xa8dfbd, metalness: .03, roughness: .08, transmission: .35, transparent: true, opacity: .25, side: THREE.DoubleSide }));
    group.add(glass);
    const rimMaterial = material({ color: 0x5dbd75, metalness: .56, roughness: .27, emissive: 0x123c20, emissiveIntensity: .25 });
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1.23, .055, 10, 52), rimMaterial); rim.rotation.x = Math.PI / 2; rim.position.y = 1.81; group.add(rim);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.32, 1.42, .16, 48), rimMaterial); base.position.y = -1.87; group.add(base);
    this.makeLiquidCylinder();
    return group;
  }

  makeLiquidCylinder() {
    const liquid = new THREE.Mesh(new THREE.CylinderGeometry(1.12, 1.12, 2.75, 48), new THREE.MeshPhysicalMaterial({ color: 0x2b9e62, roughness: .2, metalness: .02, transmission: .08, transparent: true, opacity: .65, emissive: 0x0c3b22, emissiveIntensity: .36 }));
    liquid.position.y = -.38; this.liquidGroup.add(liquid);
    const surface = new THREE.Mesh(new THREE.CircleGeometry(1.11, 48), new THREE.MeshBasicMaterial({ color: 0x6ee18b, transparent: true, opacity: .16, side: THREE.DoubleSide }));
    surface.rotation.x = -Math.PI / 2; surface.position.y = 1; this.liquidGroup.add(surface);
  }

  makeFlask() {
    const profile = [new THREE.Vector2(.47, -1.75), new THREE.Vector2(1.02, -1.62), new THREE.Vector2(1.12, -.62), new THREE.Vector2(.94, -.13), new THREE.Vector2(.36, .45), new THREE.Vector2(.25, 1.35), new THREE.Vector2(.25, 1.78)];
    const group = new THREE.Group();
    group.add(new THREE.Mesh(new THREE.LatheGeometry(profile, 52), new THREE.MeshPhysicalMaterial({ color: 0xa8dfbd, transmission: .38, roughness: .08, transparent: true, opacity: .26, side: THREE.DoubleSide })));
    const rim = new THREE.Mesh(new THREE.TorusGeometry(.255, .045, 10, 32), material({ color: 0x65c77a, metalness: .5, roughness: .24 })); rim.rotation.x = Math.PI / 2; rim.position.y = 1.8; group.add(rim);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.17, 1.3, .14, 48), material({ color: 0x376f48, metalness: .5, roughness: .3 })); base.position.y = -1.86; group.add(base);
    const liquidProfile = LIQUID_PROFILES.flask.map(([radius, height]) => new THREE.Vector2(radius, height + .13));
    const liquid = new THREE.Mesh(new THREE.LatheGeometry(liquidProfile, 48), new THREE.MeshPhysicalMaterial({ color: 0x2b9e62, roughness: .2, transparent: true, opacity: .68, emissive: 0x0b3a20, emissiveIntensity: .38 }));
    liquid.position.y = -.13; this.liquidGroup.add(liquid);
    return group;
  }

  makeTubular() {
    const group = new THREE.Group();
    const glass = new THREE.Mesh(new THREE.TubeGeometry(TUBE_CURVE, TUBE_SEGMENTS, .42, 20, false), new THREE.MeshPhysicalMaterial({ color: 0xa8dfbd, roughness: .08, transmission: .28, transparent: true, opacity: .25, side: THREE.DoubleSide }));
    group.add(glass);
    const liquid = new THREE.Mesh(new THREE.TubeGeometry(TUBE_CURVE, TUBE_SEGMENTS, .34, 18, false), new THREE.MeshPhysicalMaterial({ color: 0x2b9e62, roughness: .2, transparent: true, opacity: .72, emissive: 0x0b3a20, emissiveIntensity: .4 }));
    this.liquidGroup.add(liquid);
    const capMaterial = material({ color: 0x5dbd75, metalness: .5, roughness: .25 });
    for (const [point, direction] of [[TUBE_CURVE.getPointAt(0), TUBE_CURVE.getTangentAt(0)], [TUBE_CURVE.getPointAt(1), TUBE_CURVE.getTangentAt(1)]]) {
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, .18, 32), capMaterial);
      cap.position.copy(point); cap.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction); group.add(cap);
    }
    return group;
  }

  setGeometry(geometry = "cylinder") {
    const next = normalizeGeometry(geometry);
    this.state.geometry = next;
    this.canvas.dataset.geometry = next;
    if (this.mode !== "webgl") { this.setCamera(this.cameraName); this.scheduleRender(); return; }
    if (this.vesselGroup) { disposeObject(this.vesselGroup); this.vesselGroup.clear(); }
    if (this.liquidGroup) { disposeObject(this.liquidGroup); this.liquidGroup.clear(); }
    if (next === "flask") this.vesselGroup.add(this.makeFlask());
    else if (next === "tubular") this.vesselGroup.add(this.makeTubular());
    else this.vesselGroup.add(this.makeCylinder());
    this.updateParticlePositions();
    this.updateBubbles();
    this.setState(this.state);
    this.setCamera(this.cameraName);
  }

  setState(next = {}) {
    const nextGeometry = normalizeGeometry(next.geometry ?? this.state.geometry);
    const geometryChanged = nextGeometry !== this.state.geometry;
    this.state = { ...this.state, ...next, geometry: nextGeometry };
    this.canvas.dataset.geometry = this.state.geometry;
    this.canvas.dataset.biomass = String(this.state.biomass ?? 0);
    if (geometryChanged) {
      this.setGeometry(nextGeometry);
      return;
    }
    if (this.mode === "webgl") {
      const density = concentration(this.state);
      const culture = cultureColor(density);
      this.liquidGroup?.traverse((node) => {
        if (!node.material) return;
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        materials.forEach((item) => {
          if (item.color) item.color.copy(culture);
          if (item.emissive) item.emissive.copy(culture).multiplyScalar(.16);
          if ("opacity" in item && item.type !== "MeshBasicMaterial") item.opacity = .2 + density * .55;
        });
      });
      if (this.particles) {
        this.particles.geometry.setDrawRange(0, Math.max(18, Math.floor(18 + density * (this.particleCount - 18))));
        this.particles.material.opacity = .3 + density * .6;
      }
      if (this.bubbles?.material) {
        this.bubbles.material.color.copy(culture).lerp(new THREE.Color(0x9fffc2), .55);
        this.bubbles.material.opacity = .08 + density * .34;
      }
    }
    this.scheduleRender();
  }

  setCamera(name = "overview") {
    const preset = CAMERA_PRESETS[name] || CAMERA_PRESETS.overview;
    this.cameraName = CAMERA_PRESETS[name] ? name : "overview";
    this.canvas.dataset.camera = this.cameraName;
    if (!this.camera || !this.controls) return;
    const aspect = this.camera.aspect || 1;
    const geometryScale = (VESSEL_BOUNDS[this.state.geometry]?.radius || 2.42) / VESSEL_BOUNDS.cylinder.radius;
    const narrowScale = clamp(1 / Math.max(aspect, .72), 1, 1.42);
    const scale = preset.distance * geometryScale * narrowScale;
    this.camera.position.set(...preset.position).multiplyScalar(scale);
    this.controls.target.set(0, this.state.geometry === "tubular" ? .05 : -.08, 0);
    this.controls.update();
    this.scheduleRender();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    if (this.mode === "canvas") this.fallback?.resize();
    if (this.camera) {
      const aspect = width / height;
      const previousAspect = this.camera.aspect || aspect;
      this.camera.aspect = aspect;
      this.camera.fov = aspect < 1 ? clamp(31 + (1 - aspect) * 7, 31, 38) : 31;
      this.camera.updateProjectionMatrix();
      if (this.mode === "webgl" && this.webgl) {
        this.webgl.setSize(width, height, false);
      }
      // Re-apply the named frame when a responsive layout crosses a narrow-stage boundary.
      if (Math.abs(previousAspect - aspect) > .08 && this.controls) this.setCamera(this.cameraName);
      else this.scheduleRender();
      return;
    }
    if (this.fallback) {
      this.fallback.resize();
      this.scheduleRender();
    }
  }

  handleCanvasKey(event) {
    if (!this.controls) return;
    const amount = .12;
    let handled = true;
    if (event.key === "ArrowLeft") this.controls.rotateLeft(amount);
    else if (event.key === "ArrowRight") this.controls.rotateLeft(-amount);
    else if (event.key === "ArrowUp") this.controls.rotateUp(amount);
    else if (event.key === "ArrowDown") this.controls.rotateUp(-amount);
    else if (event.key === "+" || event.key === "=" ) this.controls.dollyIn(1.12);
    else if (event.key === "-" || event.key === "_") this.controls.dollyOut(1.12);
    else handled = false;
    if (handled) {
      event.preventDefault();
      this.controls.update();
      this.scheduleRender();
    }
  }

  motionAllowed() {
    return !this.reducedMotion && !globalThis.document?.hidden;
  }

  scheduleRender() {
    this.needsRender = true;
    if (!this.raf && !this.renderingFrame && !this.destroyed) this.raf = requestAnimationFrame(this.animate);
  }

  renderFrame(time) {
    this.renderingFrame = true;
    const elapsed = this.clock.getElapsedTime();
    const animationTime = this.motionAllowed() ? elapsed : 0;
    try {
      if (this.mode === "webgl" && this.webgl && this.scene && this.camera) {
        this.updateParticlePositions(animationTime);
        this.updateBubbles(animationTime);
        this.controls?.update();
        this.webgl.render(this.scene, this.camera);
        this.canvas.dataset.drawCalls = String(this.webgl.info.render.calls);
      } else if (this.fallback && this.camera) {
        this.fallback.draw(this.state, animationTime, this.camera);
        this.canvas.dataset.drawCalls = "1";
      }
    } finally {
      this.renderingFrame = false;
    }
    this.needsRender = false;
  }

  animate() {
    this.raf = 0;
    if (this.destroyed) return;
    if (this.motionAllowed()) {
      this.renderFrame();
      this.raf = requestAnimationFrame(this.animate);
    } else if (this.needsRender) {
      this.renderFrame();
    }
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.resizeObserver?.disconnect();
    this.reducedMotionQuery?.removeEventListener?.("change", this.onMotionPreferenceChange);
    globalThis.document?.removeEventListener?.("visibilitychange", this.onVisibilityChange);
    this.canvas.removeEventListener("webglcontextlost", this.onContextLost);
    this.canvas.removeEventListener("keydown", this.onCanvasKeyDown);
    this.controls?.dispose();
    if (this.scene) disposeObject(this.scene);
    this.webgl?.dispose();
    this.fallback = null;
    this.scene = null;
    this.camera = null;
    this.controls = null;
    this.webgl = null;
  }
}

export const LabRenderer = SimulationRenderer;
