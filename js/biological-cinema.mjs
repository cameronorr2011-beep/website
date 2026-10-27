/* Orr Biologicals — Biological Cinema scene module.
   Scientific visualizations built procedurally with Three.js. Not microscope
   observations, not measured telemetry. Every canvas needs a WebGL fallback
   path, reduced-motion handling, and disposal. */

import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min ?? 0, value));
const smooth = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
const seeded = (seed) => {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
};

const PALETTE = {
  membrane: 0x9fd8b4,
  cellGlow: 0x9fe89b,
  cellWarm: 0xd6f7a4,
  cyanoFlash: 0x6fe0cc,
  culture: 0x2f7a55,
  cultureGlow: 0x3fa468,
  metal: 0x8a9d94,
  darkMetal: 0x232f2a,
  ledGlow: 0x9fe0a8,
  tubing: 0xa7cbb9,
};

function fitRenderer(renderer, composer, camera, canvas) {
  const width = canvas.clientWidth || canvas.parentElement?.clientWidth || 1;
  const height = canvas.clientHeight || canvas.parentElement?.clientHeight || 1;
  const ratio = Math.min(window.devicePixelRatio || 1, 1.6);
  renderer.setPixelRatio(ratio);
  renderer.setSize(width, height, false);
  if (composer) composer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function rendererFor(canvas, clear = 0x06100c) {
  if (!canvas || !window.WebGLRenderingContext) return null;
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setClearColor(clear, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    return renderer;
  } catch {
    return null;
  }
}

/* Bloom is applied selectively: only the emissive biological surfaces pass the
   threshold, so glass/metal geometry stays legible. */
function makeComposer(renderer, scene, camera, { strength = 0.62, radius = 0.72, threshold = 0.82 } = {}) {
  try {
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), strength, radius, threshold);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
    return composer;
  } catch {
    return null;
  }
}

function disposeTree(root) {
  root.traverse((node) => {
    if (node.geometry) node.geometry.dispose();
    const materials = node.material;
    if (Array.isArray(materials)) materials.forEach((m) => m.dispose());
    else if (materials) materials.dispose();
  });
  if (root.parent) root.parent.remove(root);
}

/* Shared lifecycle wrapper: pause offscreen, resize correctly, stop cleanly. */
function exhibit(canvas, build) {
  const handle = build();
  if (!handle) return null;
  const handleFrame = handle.frame ?? handle.render;
  const stop = handle.stop ?? (() => {});
  let playing = false;
  let rafId = 0;
  const tick = () => {
    if (!playing) return;
    const again = handleFrame();
    if (again === false) { playing = false; return; }
    rafId = requestAnimationFrame(tick);
  };
  const observer = new IntersectionObserver(([entry]) => {
    playing = entry.isIntersecting;
    cancelAnimationFrame(rafId);
    if (playing && !reducedMotion) rafId = requestAnimationFrame(tick);
  }, { rootMargin: "180px" });
  observer.observe(canvas);
  /* Draw one static frame immediately: background tabs, throttled rAF, and
     snapshot tools all render before the animation loop ever gets a tick. */
  if (typeof handle.render === "function") handle.render();
  return {
    render: () => typeof handle.render === "function" && handle.render(),
    stop: () => {
      playing = false;
      cancelAnimationFrame(rafId);
      observer.disconnect();
      stop();
    },
  };
}

/* ------------------------------------------------------------------ */
/* KIND 1: hero Volvox field                                           */
/* ------------------------------------------------------------------ */

function buildColony(rnd, { cells: count = 900, radius = 1 } = {}) {
  const colony = new THREE.Group();
  const cellGeometry = new THREE.SphereGeometry(radius * 0.071, 10, 8);
  const cellMaterial = new THREE.MeshStandardMaterial({
    color: 0x14251b,
    emissive: PALETTE.cellGlow,
    emissiveIntensity: 0.92,
    roughness: 0.4,
    metalness: 0.02,
  });
  const cells = new THREE.InstancedMesh(cellGeometry, cellMaterial, count);
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const position = new THREE.Vector3();
  const color = new THREE.Color();
  const phiIncrement = Math.PI * (3 - Math.sqrt(5));
  for (let index = 0; index < count; index += 1) {
    const depth = clamp((index + 0.6) / count);
    const phi = Math.acos(1 - 2 * depth);
    const theta = phiIncrement * index;
    const jitter = radius * (0.86 + rnd() * 0.09);
    position.set(
      jitter * Math.sin(phi) * Math.cos(theta),
      jitter * Math.cos(phi),
      jitter * Math.sin(phi) * Math.sin(theta),
    );
    quaternion.setFromEuler(new THREE.Euler(rnd() * Math.PI, rnd() * Math.PI, rnd() * Math.PI));
    const cellScale = radius * (0.82 + rnd() * 0.46);
    scale.setScalar(cellScale);
    matrix.compose(position, quaternion, scale);
    cells.setMatrixAt(index, matrix);
    color.setHSL(0.3 + rnd() * 0.03, 0.62, 0.3 + rnd() * 0.2);
    cells.setColorAt(index, color);
  }
  cells.instanceMatrix.needsUpdate = true;
  if (cells.instanceColor) cells.instanceColor.needsUpdate = true;
  colony.add(cells);  const membrane = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.02, 44, 30),
    new THREE.MeshPhysicalMaterial({
      color: 0x234434,
      transparent: true,
      opacity: 0.1,
      roughness: 0.34,
      metalness: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  colony.add(membrane);

  const daughter = new THREE.Group();
  const daughterCellGeometry = new THREE.SphereGeometry(radius * 0.088, 8, 6);
  const daughterMaterial = new THREE.MeshStandardMaterial({
    color: 0x182c22,
    emissive: PALETTE.cyanoFlash,
    emissiveIntensity: 0.5,
    roughness: 0.46,
  });
  const daughterCells = new THREE.InstancedMesh(daughterCellGeometry, daughterMaterial, 13);
  const daughterCenter = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(radius * 0.42);
  for (let index = 0; index < 13; index += 1) {
    const onSphere = Math.acos(1 - 2 * ((index + 0.5) / 13));
    const around = phiIncrement * index;
    position.set(
      daughterCenter.x + Math.sin(onSphere) * Math.cos(around) * radius * 0.26,
      daughterCenter.y + Math.cos(onSphere) * radius * 0.26,
      daughterCenter.z + Math.sin(onSphere) * Math.sin(around) * radius * 0.26,
    );
    matrix.makeTranslation(position.x, position.y, position.z);
    daughterCells.setMatrixAt(index, matrix);
  }
  daughterCells.instanceMatrix.needsUpdate = true;
  daughter.add(daughterCells);
  colony.add(daughter);
  colony.userData.daughter = daughter;
  return colony;
}

function attachVolvoxField(canvas) {
  const renderer = rendererFor(canvas);
  if (!renderer) return paintFallback(canvas, "volvox");
  renderer.toneMappingExposure = 0.95;
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x03100a, 0.09);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);
  camera.position.set(0, 0.12, 9);
  scene.add(new THREE.HemisphereLight(0x2c5a44, 0x040f0a, 0.55));
  const key = new THREE.DirectionalLight(0xbff5c8, 1.15);
  key.position.set(-3.4, 3.2, 4.4);
  scene.add(key);
  const rim = new THREE.PointLight(PALETTE.cyanoFlash, 4, 26);
  rim.position.set(4.6, -2.6, 2.4);
  scene.add(rim);

  const rnd = seeded(2026);
  const layers = [
    { z: -7.5, scale: 1.05, drift: 0.09, emissive: 0.42, cells: 260 },
    { z: -4.4, scale: 0.85, drift: 0.16, emissive: 0.72, cells: 380 },
    { z: -1.2, scale: 0.66, drift: 0.24, emissive: 1.0, cells: 520 },
    { z: 2.4, scale: 0.5, drift: 0.3, emissive: 1.18, cells: 420 },
  ];
  const colonies = [];
  layers.forEach((layer, layerIndex) => {
    const bucket = new THREE.Group();
    /* Three deliberately placed colonies per depth band: dark water dominates,
       and the left/centre column stays clear for the hero copy. */
    const layout = [
      [2.9, 1.5], [4.6, -1.4], [-2.9, -2.6],
      [1.4, -2.3], [5.0, 2.3], [-5.2, 0.6],
    ];
    layout.forEach(([x, y], index) => {
      if ((index + layerIndex) % 2 === 0) return; // 3 of 6 per layer
      const seedShift = (rnd() - 0.5) * 0.34;
      const colony = buildColony(rnd, {
        cells: Math.max(120, Math.round(layer.cells * (0.6 + rnd() * 0.7))),
        radius: layer.scale * (0.74 + rnd() * 0.5),
      });
      colony.position.set(x + seedShift, y + seedShift * 0.7, layer.z + (rnd() - 0.5) * 0.8);
      colony.userData.layer = layer;
      colony.userData.spin = 0.016 + rnd() * 0.03;
      colony.userData.phase = rnd() * Math.PI * 2;
      colony.userData.driftScale = layer.drift;
      bucket.add(colony);
      colonies.push(colony);
    });
    scene.add(bucket);
  });

  /* Suspended matter in three depth bands — soft round sprites, never squares. */
  const dotTexture = (() => {
    const dot = document.createElement("canvas");
    dot.width = dot.height = 64;
    const context = dot.getContext("2d");
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 30);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.4, "rgba(255,255,255,.7)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);
    const texture = new THREE.CanvasTexture(dot);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  })();
  const moteLayer = (count, spread, size, opacity, color) => {
    const positions = [];
    for (let index = 0; index < count; index += 1) {
      positions.push((rnd() - 0.5) * spread * 1.6, (rnd() - 0.5) * spread * 0.95, (rnd() - 0.5) * 11);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color,
      size,
      map: dotTexture,
      transparent: true,
      opacity,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(geometry, material);
    return points;
  };
  const motes = [
    moteLayer(150, 11, 0.14, 0.32, 0x5b9e77),
    moteLayer(260, 9, 0.06, 0.5, PALETTE.cellGlow),
    moteLayer(180, 8, 0.04, 0.4, PALETTE.cyanoFlash),
  ];
  motes.forEach((layer) => scene.add(layer));

  const composer = makeComposer(renderer, scene, camera, { strength: 0.42, radius: 0.8, threshold: 0.86 });
  const resize = () => fitRenderer(renderer, composer, camera, canvas);
  resize();
  window.addEventListener("resize", resize, { passive: true });

  /* Pointer parallax + scroll drift keep the field feeling like a volume. */
  const pointer = new THREE.Vector2(0, 0);
  const pointerTarget = new THREE.Vector2(0, 0);
  const onPointerMove = (event) => {
    pointerTarget.set(
      (event.clientX / window.innerWidth - 0.5) * 2,
      (event.clientY / window.innerHeight - 0.5) * 2,
    );
  };
  window.addEventListener("pointermove", onPointerMove, { passive: true });

  const clock = new THREE.Clock();
  const render = () => {
    const time = clock.getElapsedTime();
    for (const colony of colonies) {
      const layer = colony.userData.layer;
      colony.rotation.y = time * colony.userData.spin;
      colony.rotation.z = Math.sin(time * 0.11 + colony.userData.phase) * 0.055;
      colony.position.x += Math.sin(time * layer.drift + colony.userData.phase) * 0.00021;
      colony.position.y += Math.cos(time * layer.drift * 0.82 + colony.userData.phase) * 0.00024;
      colony.userData.daughter.rotation.y = -time * colony.userData.spin * 1.5;
    }
    motes.forEach((layer, index) => {
      layer.rotation.y = time * (0.004 + index * 0.0016);
    });
    pointer.x = lerp(pointer.x, pointerTarget.x, 0.022);
    pointer.y = lerp(pointer.y, pointerTarget.y, 0.022);
    camera.position.x = pointer.x * 0.55;
    camera.position.y = 0.12 - pointer.y * 0.42;
    camera.lookAt(0, 0.05, -1.4);
    if (composer) composer.render();
    else renderer.render(scene, camera);
  };
  const stop = () => {
    window.removeEventListener("resize", resize);
    window.removeEventListener("pointermove", onPointerMove);
    disposeTree(scene);
    renderer.dispose();
  };
  return exhibit(canvas, () => ({ frame: () => { render(); return !reducedMotion; }, render, stop }));
}

/* ------------------------------------------------------------------ */
/* KIND 2: photobioreactor scroll study                                */
/* ------------------------------------------------------------------ */

function glassMaterial(tint, opacity) {
  return new THREE.MeshPhysicalMaterial({
    color: tint,
    transparent: true,
    opacity,
    transmission: 0.62,
    roughness: 0.09,
    metalness: 0,
    thickness: 0.24,
    clearcoat: 0.4,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}

function makeReactorRig(rnd) {
  const rig = new THREE.Group();

  /* Culture vessel: dished-bottom glass column with a neck. */
  const vesselProfile = [
    [0, -2.62], [0.62, -2.62], [0.86, -2.34], [0.95, -1.7], [0.98, 1.4],
    [0.98, 1.86], [0.7, 2.06], [0.52, 2.12], [0.49, 2.44], [0.62, 2.5],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const vesselGlass = glassMaterial(0xbfe8d2, 0.3);
  const vessel = new THREE.Mesh(new THREE.LatheGeometry(vesselProfile, 64), vesselGlass);
  rig.add(vessel);

  /* Culture volume sits inside the glass shell. */
  const culture = new THREE.Mesh(
    new THREE.CylinderGeometry(0.92, 0.66, 3.72, 48, 1, false),
    new THREE.MeshStandardMaterial({
      color: PALETTE.culture,
      emissive: PALETTE.cultureGlow,
      emissiveIntensity: 0.55,
      roughness: 0.5,
      metalness: 0,
      transparent: true,
      opacity: 0.68,
    }),
  );
  culture.position.y = -0.42;
  rig.add(culture);
  const swirl = new THREE.Mesh(
    new THREE.TorusGeometry(0.62, 0.05, 10, 44),
    new THREE.MeshStandardMaterial({ color: 0x59b57e, emissive: 0x79d49a, emissiveIntensity: 1.2, roughness: 0.4, transparent: true, opacity: 0.4 }),
  );
  swirl.rotation.x = Math.PI / 2;
  swirl.position.y = -0.42;
  rig.add(swirl);
  rig.userData.swirl = swirl;

  /* Airlift draft tube. */
  const draft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.34, 2.5, 28, 1, true),
    glassMaterial(0xcdeede, 0.16),
  );
  draft.position.y = -0.6;
  rig.add(draft);

  /* Rising bubbles. */
  const bubbleGeometry = new THREE.SphereGeometry(1, 7, 5);
  const bubbleMaterial = new THREE.MeshBasicMaterial({ color: 0x9fe6b2, transparent: true, opacity: 0.5, depthWrite: false });
  const bubbleBands = [
    { count: 34, radius: 0.028, band: 0.66, speed: 0.62 },
    { count: 20, radius: 0.052, band: 0.3, speed: 0.4 },
  ].map((bandConfig) => {
    const instanced = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 7, 5), bubbleMaterial, bandConfig.count);
    instanced.scale.setScalar(bandConfig.radius);
    const seeds = [];
    const matrix = new THREE.Matrix4();
    for (let index = 0; index < bandConfig.count; index += 1) {
      seeds.push({ angle: rnd() * Math.PI * 2, orbit: (rnd() - 0.5) * bandConfig.band, y: rnd() * 3.3, wobble: rnd() * 2 });
    }
    instanced.userData = { seeds, band: bandConfig, matrix };
    return instanced;
  });
  bubbleBands.forEach((band) => rig.add(band));
  rig.userData.bubbles = bubbleBands;

  /* Lid cluster: ports, probes, condenser elbow. */
  const metal = new THREE.MeshStandardMaterial({ color: PALETTE.metal, metalness: 0.85, roughness: 0.3 });
  const ports = new THREE.Group();
  const portPositions = [-0.24, 0.02, 0.26];
  portPositions.forEach((x, index) => {
    const port = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.2, 14), metal);
    port.position.set(x, 2.55, 0);
    ports.add(port);
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.078, 0.02, 8, 18), metal);
    collar.rotation.x = Math.PI / 2;
    collar.position.set(x, 2.48, 0);
    ports.add(collar);
    if (index === 1) {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), new THREE.MeshStandardMaterial({ color: 0x9fe0a8, emissive: 0x2e7a4a, emissiveIntensity: 0.45, roughness: 0.4 }));
      cap.position.set(x, 2.66, 0);
      ports.add(cap);
    }
  });
  rig.add(ports);

  /* Condenser: elbow tube down to a small bottle at the side. */
  const elbow = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.34, 2.48, 0),
      new THREE.Vector3(0.62, 2.6, 0),
      new THREE.Vector3(0.82, 2.42, 0),
      new THREE.Vector3(0.9, 2.1, 0),
    ]), 20, 0.038, 8, false),
    new THREE.MeshStandardMaterial({ color: PALETTE.tubing, roughness: 0.34, metalness: 0.2 }),
  );
  rig.add(elbow);
  const condenser = new THREE.Mesh(new THREE.LatheGeometry(
    [[0, 0], [0.16, 0], [0.17, 0.34], [0.13, 0.62], [0.17, 0.78], [0.07, 0.81], [0.065, 0.72], [0.13, 0.66], [0.13, 0.06]].map(([x, y]) => new THREE.Vector2(x, y)),
    26,
  ), glassMaterial(0xbfe8d2, 0.24));
  condenser.position.set(0.9, 1.32, 0);
  condenser.rotation.y = 0.5;
  rig.add(condenser);
  const condenserJuice = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.4, 18), new THREE.MeshStandardMaterial({ color: 0x76a860, emissive: 0x2c5c33, emissiveIntensity: 0.5, transparent: true, opacity: 0.7, roughness: 0.4 }));
  condenserJuice.position.set(0.9, 1.44, 0);
  rig.add(condenserJuice);

  /* LED panel behind the vessel, on a stalk. */
  const ledPanel = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.9, 0.09), new THREE.MeshStandardMaterial({ color: 0x11251c, metalness: 0.4, roughness: 0.55 }));
  ledPanel.position.set(0, -0.15, -2.05);
  rig.add(ledPanel);
  const ledFace = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 3.7), new THREE.MeshStandardMaterial({ color: 0x14291f, emissive: 0x6fbb84, emissiveIntensity: 0.62, roughness: 0.5 }));
  ledFace.position.set(0, -0.15, -1.99);
  rig.add(ledFace);
  /* LED panel light emits forward, illuminating the vessel edge. */
  const ledLight = new THREE.PointLight(PALETTE.ledGlow, 8.5, 7, 1.8);
  ledLight.position.set(0, -0.15, -1.75);
  rig.add(ledLight);
  rig.userData.ledFace = ledFace;

  /* Frame: two brushed uprights + heavy plinth. */
  const uprights = new THREE.MeshStandardMaterial({ color: PALETTE.darkMetal, metalness: 0.9, roughness: 0.36 });
  [-1.9, 1.9].forEach((x) => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 6, 0.2), uprights);
    post.position.set(x, 0.4, -1.1);
    rig.add(post);
    const guide = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 5.9, 10), metal);
    guide.position.set(x - 0.16 * Math.sign(x), 0.4, -1.02);
    rig.add(guide);
  });
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.34, 1.5), new THREE.MeshStandardMaterial({ color: 0x1a2621, metalness: 0.7, roughness: 0.44 }));
  plinth.position.set(0, -2.86, -0.7);
  rig.add(plinth);
  for (let index = 0; index < 5; index += 1) {
    const vent = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.06, 0.02), new THREE.MeshBasicMaterial({ color: 0x050b08 }));
    vent.position.set(-0.8 + index * 0.4, -2.86, 0.05);
    rig.add(vent);
  }
  const head = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.18, 1.1), uprights);
  head.position.set(0, 3.1, -1.1);
  rig.add(head);

  /* Fluid path: pump + media bottle feeding the column, harvest bottle out. */
  const tubingMaterial = new THREE.MeshStandardMaterial({ color: PALETTE.tubing, roughness: 0.3, metalness: 0.08 });
  const mediaBottle = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.24, 0.8, 22, 1, false), glassMaterial(0xd2ecdc, 0.26));
  mediaBottle.position.set(-2.5, -2.14, -0.55);
  rig.add(mediaBottle);
  const mediaBroth = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.19, 0.42, 18), new THREE.MeshStandardMaterial({ color: 0x4f7f56, emissive: 0x2c5233, emissiveIntensity: 0.5, transparent: true, opacity: 0.72, roughness: 0.42 }));
  mediaBroth.position.set(-2.5, -2.28, -0.55);
  rig.add(mediaBroth);
  const mediaCap = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.12, 16), metal);
  mediaCap.position.set(-2.5, -1.68, -0.55);
  rig.add(mediaCap);
  const inletPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.5, -1.76, -0.55),
    new THREE.Vector3(-2.3, -1.2, -0.5),
    new THREE.Vector3(-2.1, -0.2, -0.48),
    new THREE.Vector3(-1.05, -0.68, -0.46),
    new THREE.Vector3(-0.86, -1.2, -0.44),
    new THREE.Vector3(-0.62, -1.72, -0.42),
    new THREE.Vector3(0, -2.56, -0.3),
    new THREE.Vector3(0.4, -2.6, 0.1),
  ]);
  const inlet = new THREE.Mesh(new THREE.TubeGeometry(inletPath, 64, 0.034, 8, false), tubingMaterial);
  rig.add(inlet);
  const pump = new THREE.Group();
  const pumpBody = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.44, 0.44), new THREE.MeshStandardMaterial({ color: 0x2b3833, metalness: 0.6, roughness: 0.4 }));
  pump.add(pumpBody);
  const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.2, 20), metal);
  roller.rotation.x = Math.PI / 2;
  roller.position.z = 0.24;
  pump.add(roller);
  for (let index = 0; index < 3; index += 1) {
    const nip = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), metal);
    const angle = (index / 3) * Math.PI * 2;
    nip.position.set(Math.cos(angle) * 0.11, Math.sin(angle) * 0.11, 0.35);
    pump.add(nip);
  }
  pump.position.set(-2.05, -0.62, -0.5);
  rig.add(pump);
  rig.userData.pumpRoller = roller;
  const harvestPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.62, -2.2, 0.12),
    new THREE.Vector3(1.3, -2.05, 0.18),
    new THREE.Vector3(1.7, -1.5, 0.18),
    new THREE.Vector3(2.55, -1.35, 0.1),
  ]);
  const harvest = new THREE.Mesh(new THREE.TubeGeometry(harvestPath, 40, 0.03, 8, false), tubingMaterial);
  rig.add(harvest);
  const harvestBottle = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.62, 20, 1, false), glassMaterial(0xe3f3e6, 0.3));
  harvestBottle.position.set(2.55, -1.7, 0.1);
  rig.add(harvestBottle);

  /* Ground shadow plane grounds the object. */
  const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(9, 5), new THREE.ShadowMaterial({ opacity: 0.32 }));
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = -3.04;
  shadowPlane.receiveShadow = false;
  rig.add(shadowPlane);
  return rig;
}

function attachReactorStudy(canvas, section) {
  const renderer = rendererFor(canvas);
  if (!renderer) return paintFallback(canvas, "reactor");
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x06130d, 0.028);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
  const rig = makeReactorRig(seeded(77));
  scene.add(rig);

  scene.add(new THREE.HemisphereLight(0x8fbf9e, 0x0a1a12, 0.55));
  const key = new THREE.DirectionalLight(0xe4ffe2, 2.6);
  key.position.set(-3.4, 4.6, 5.8);
  scene.add(key);
  const rim = new THREE.PointLight(0x63d9cf, 6, 20);
  rim.position.set(4.4, 2.4, 3.2);
  scene.add(rim);
  const groundGlow = new THREE.PointLight(0x2e5f45, 5, 9);
  groundGlow.position.set(0, -2.6, 1.6);
  scene.add(groundGlow);

  const composer = makeComposer(renderer, scene, camera, { strength: 0.3, radius: 0.7, threshold: 0.8 });
  const resize = () => fitRenderer(renderer, composer, camera, canvas);
  resize();
  window.addEventListener("resize", resize, { passive: true });

  /* Scroll choreography: three acts, each with its own copy block. */
  const stageCopies = section ? [...section.querySelectorAll("[data-stage-copy]")] : [];
  const hotspots = section ? [...section.querySelectorAll("[data-hotspot]")].map((node) => ({ node, anchor: node.dataset.hotspot.split(",").map(Number) })) : [];
  const keyframes = [
    { camera: [4.9, 1.9, 8.2], look: [0, 0.15, 0], rigY: -0.22, exposure: 1.02 },
    { camera: [0.4, 2.9, 6.4], look: [0, 0.9, 0], rigY: 0.12, exposure: 1.08 },
    { camera: [-3.4, 0.3, 8.9], look: [0, -0.4, 0], rigY: -0.06, exposure: 0.98 },
    { camera: [2.6, 1.4, 10.4], look: [0, 0, 0], rigY: -0.22, exposure: 1.0 },
  ];
  const setProgress = (progress) => {
    const p = clamp(progress);
    const spans = p * (keyframes.length - 1);
    const index = Math.min(keyframes.length - 2, Math.floor(spans));
    const localT = smooth(spans - index);
    const a = keyframes[index];
    const b = keyframes[index + 1];
    camera.position.set(
      lerp(a.camera[0], b.camera[0], localT),
      lerp(a.camera[1], b.camera[1], localT),
      lerp(a.camera[2], b.camera[2], localT),
    );
    const look = [
      lerp(a.look[0], b.look[0], localT),
      lerp(a.look[1], b.look[1], localT),
      lerp(a.look[2], b.look[2], localT),
    ];
    const time = clock.getElapsedTime();
    const idle = reducedMotion ? 0 : Math.sin(time * 0.24) * 0.03;
    rig.rotation.y = lerp(a.rigY, b.rigY, localT) + idle;
    camera.lookAt(look[0], look[1], look[2]);
    renderer.toneMappingExposure = lerp(a.exposure, b.exposure, localT);
    const swirlRig = rig.userData.swirl;
    if (swirlRig) swirlRig.rotation.z = time * (0.3 + p * 0.5);
    if (reducedMotion) return;
    const bubbles = rig.userData.bubbles;
    bubbles.forEach((instanced, bandIndex) => {
      const { seeds, band, matrix } = instanced.userData;
      seeds.forEach((seed, index) => {
        const life = (time * band.speed * (0.7 + seed.wobble * 0.3) + index / seeds.length) % 1;
        const y = life * 3.3 - 2.4;
        const radius = 0.72 * (1 - life * 0.28);
        const x = Math.cos(seed.angle + seed.wobble) * radius * seed.orbit * 2.2;
        const z = Math.sin(seed.angle + seed.wobble) * radius * seed.orbit * 2.2;
        const scale = 1 - life * 0.6;
        matrix.makeTranslation(x, y + life * 0.2, z + 0.2);
        matrix.scale(new THREE.Vector3(scale, scale, scale).multiplyScalar(band.radius * 5));
        instanced.setMatrixAt(index, matrix);
      });
      instanced.instanceMatrix.needsUpdate = true;
      instanced.scale.setScalar(1);
    });
    const roller = rig.userData.pumpRoller;
    if (roller) roller.rotation.y = time * 1.4;
    if (rig.userData.ledFace) rig.userData.ledFace.material.emissiveIntensity = 0.66 + Math.sin(time * 1.6) * 0.08;
    /* Stage copy crossfade */
    const which = Math.min(stageCopies.length - 1, Math.floor(p * stageCopies.length));
    stageCopies.forEach((node, stage) => {
      node.classList.toggle("is-active", stage === which);
    });
  };

  const clock = new THREE.Clock();
  const render = () => {
    setProgress(render.currentProgress ?? 0);
    if (composer) composer.render();
    else renderer.render(scene, camera);
    projectHotspots();
  };
  const projectHotspots = () => {
    if (!hotspots.length) return;
    canvas.getBoundingClientRect(); /* force layout sync */
    const bounds = canvas.getBoundingClientRect();
    hotspots.forEach(({ node, anchor }) => {
      const vector = new THREE.Vector3(anchor[0], anchor[1], anchor[2]).applyMatrix4(rig.matrixWorld).project(camera);
      const x = (vector.x * 0.5 + 0.5) * bounds.width;
      const y = (-vector.y * 0.5 + 0.5) * bounds.height;
      node.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    });
  };
  if (section) {
    const update = () => {
      const bounds = section.getBoundingClientRect();
      const span = Math.max(1, bounds.height - window.innerHeight * 0.6);
      render.currentProgress = clamp((window.innerHeight * 0.35 - bounds.top) / span);
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
  }
  const stop = () => {
    window.removeEventListener("resize", resize);
    disposeTree(scene);
    renderer.dispose();
  };
  return exhibit(canvas, () => ({ frame: () => { render(); return !reducedMotion; }, render, stop }));
}

/* ------------------------------------------------------------------ */
/* KIND 3: inspectable instrument scenes (Algaephyte, Cyanoflow)        */
/* ------------------------------------------------------------------ */

function attachInspectableScene(canvas, build, { cameraPosition, threshold = 0.8 } = {}) {
  const renderer = rendererFor(canvas, 0x071411);
  if (!renderer) return paintFallback(canvas, canvas.id.includes("Chip") ? "chip" : "reactor");
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x081812, 0.03);
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
  camera.position.set(...(cameraPosition || [4.4, 2, 7]));
  const rig = new THREE.Group();
  scene.add(rig);
  scene.add(new THREE.HemisphereLight(0x9dc9ab, 0x0a1a13, 0.6));
  const key = new THREE.DirectionalLight(0xdfffe4, 2.4);
  key.position.set(-3.4, 4.4, 5.6);
  scene.add(key);
  const rim = new THREE.PointLight(0x63d9cf, 5.5, 18);
  rim.position.set(4, 1.6, 3);
  scene.add(rim);
  build(rig, scene);

  const composer = makeComposer(renderer, scene, camera, { strength: 0.5, radius: 0.74, threshold });
  const resize = () => fitRenderer(renderer, composer, camera, canvas);
  resize();
  window.addEventListener("resize", resize, { passive: true });

  let yaw = -0.3;
  let pitch = 0.03;
  let targetYaw = yaw;
  let targetPitch = pitch;
  let pointerId = null;
  let lastX = 0;
  let lastY = 0;
  canvas.addEventListener("pointerdown", (event) => {
    pointerId = event.pointerId;
    lastX = event.clientX;
    lastY = event.clientY;
    canvas.setPointerCapture?.(pointerId);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (pointerId !== event.pointerId) return;
    targetYaw += (event.clientX - lastX) * 0.0065;
    targetPitch = clamp(targetPitch + (event.clientY - lastY) * 0.005, -0.62, 0.52);
    lastX = event.clientX;
    lastY = event.clientY;
  });
  const endDrag = () => { pointerId = null; };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  const clock = new THREE.Clock();
  const render = () => {
    const time = clock.getElapsedTime();
    yaw = lerp(yaw, targetYaw, 0.09);
    pitch = lerp(pitch, targetPitch, 0.09);
    rig.rotation.y = yaw + (reducedMotion ? 0 : Math.sin(time * 0.14) * 0.02);
    rig.rotation.x = pitch;
    rig.position.y = reducedMotion ? 0 : Math.sin(time * 0.26) * 0.03;
    camera.lookAt(0, -0.1, 0);
    if (composer) composer.render();
    else renderer.render(scene, camera);
    rig.userData.animate?.(time);
  };
  const stop = () => {
    window.removeEventListener("resize", resize);
    disposeTree(scene);
    renderer.dispose();
  };
  return exhibit(canvas, () => ({ frame: () => { render(); return !reducedMotion; }, render, stop }));
}

function makeCultivationScene(canvas) {
  return attachInspectableScene(canvas, (rig, scene) => {
    const glass = glassMaterial(0xc4ead4, 0.24);
    const glassThin = glassMaterial(0xcdeede, 0.18);
    const metal = new THREE.MeshStandardMaterial({ color: PALETTE.metal, metalness: 0.85, roughness: 0.28 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x1a2420, metalness: 0.8, roughness: 0.4 });

    /* Flat-panel culture vessel: dark broth sandwiched between two glass sheets. */
    const broth = new THREE.Mesh(
      new THREE.BoxGeometry(2.02, 3.2, 0.26),
      new THREE.MeshStandardMaterial({
        color: 0x1c4430, emissive: 0x2f7a55, emissiveIntensity: 0.3, transparent: true, opacity: 0.84, roughness: 0.5,
      }),
    );
    broth.position.set(0, 0.1, 0);
    rig.add(broth);
    const frontPane = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.44, 0.05), glass);
    frontPane.position.set(0, 0.1, 0.17);
    rig.add(frontPane);
    const backPane = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.44, 0.05), glass);
    backPane.position.set(0, 0.1, -0.17);
    rig.add(backPane);
    /* Inner glow shim: breaks the slab read with interior layering. */
    const glowShim = new THREE.Mesh(
      new THREE.BoxGeometry(1.88, 3.05, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x14281e, emissive: PALETTE.cellGlow, emissiveIntensity: 0.1, transparent: true, opacity: 0.3, roughness: 0.6 }),
    );
    glowShim.position.set(0, 0.1, 0);
    rig.add(glowShim);
    /* Airlift column inside the broth gives the interior a third dimension. */
    const airliftFluid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.13, 2.7, 20),
      new THREE.MeshStandardMaterial({ color: 0x2a6247, emissive: 0x4fa873, emissiveIntensity: 0.45, transparent: true, opacity: 0.75, roughness: 0.45 }),
    );
    airliftFluid.position.set(0, 0.05, 0);
    rig.add(airliftFluid);
    const airliftGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.155, 2.74, 20, 1, true), glassThin);
    airliftGlass.position.set(0, 0.05, 0);
    rig.add(airliftGlass);

    /* Structural frame: stiles, clamp bands, rails, corner blocks. */
    const railMaterial = new THREE.MeshStandardMaterial({ color: 0x364941, metalness: 0.88, roughness: 0.34 });
    const framePart = (w, h, d, x, y, z) => {
      const part = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), railMaterial);
      part.position.set(x, y, z);
      rig.add(part);
      return part;
    };
    [-1.16, 1.16].forEach((x) => {
      framePart(0.2, 3.56, 0.34, x, 0.1, 0);
      framePart(0.26, 0.09, 0.4, x, 1.88, 0);
      framePart(0.26, 0.09, 0.4, x, -1.7, 0);
    });
    framePart(2.52, 0.2, 0.34, 0, 1.84, 0);
    framePart(2.52, 0.2, 0.34, 0, -1.68, 0);
    [[-1.16, 1.79], [1.16, 1.79], [-1.16, -1.63], [1.16, -1.63]].forEach(([x, y]) => {
      const block = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.38), metal);
      block.position.set(x, y, 0);
      rig.add(block);
    });
    /* Five tie rods across the panel breadth. */
    [-1.02, -0.51, 0, 0.51, 1.02].forEach((x) => {
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.62, 8), metal);
      rod.rotation.x = Math.PI / 2;
      rod.position.set(x, 0.1, 0.24);
      rig.add(rod);
      const nut = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.05, 6), new THREE.MeshStandardMaterial({ color: 0x6a7d70, metalness: 0.7, roughness: 0.4 }));
      nut.rotation.x = Math.PI / 2;
      nut.position.set(x, 0.1, 0.27);
      rig.add(nut);
    });

    /* Head: manifold with two ports + one capped probe and a condenser arm. */
    const head = new THREE.Mesh(new THREE.BoxGeometry(2.52, 0.28, 0.5), dark);
    head.position.set(0, 2.0, 0);
    rig.add(head);
    [[-0.74, false], [0, true], [0.74, false]].forEach(([x, capIt]) => {
      const port = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.26, 14), metal);
      port.position.set(x, 2.28, 0);
      rig.add(port);
      const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.07, 14), dark);
      collar.position.set(x, 2.13, 0);
      rig.add(collar);
      if (capIt) {
        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), new THREE.MeshStandardMaterial({ color: 0x14281e, emissive: 0x63b074, emissiveIntensity: 0.32, roughness: 0.5 }));
        cap.position.set(x, 2.46, 0);
        rig.add(cap);
      }
    });
    const condenserPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 2.44, 0.06),
      new THREE.Vector3(0.3, 2.6, 0.08),
      new THREE.Vector3(0.66, 2.52, 0.1),
      new THREE.Vector3(0.84, 2.28, 0.12),
    ]);
    rig.add(new THREE.Mesh(new THREE.TubeGeometry(condenserPath, 18, 0.034, 8, false), new THREE.MeshStandardMaterial({ color: PALETTE.tubing, roughness: 0.32, metalness: 0.16 })));

    /* Base cabinet with a single status pill, media bottle, pump. */
    const cabinet = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.62, 1.0), new THREE.MeshStandardMaterial({ color: 0x182220, metalness: 0.55, roughness: 0.46 }));
    cabinet.position.set(0, -2.1, 0);
    rig.add(cabinet);
    const toe = new THREE.Mesh(new THREE.BoxGeometry(2.72, 0.1, 0.94), new THREE.MeshStandardMaterial({ color: 0x0d1512, metalness: 0.4, roughness: 0.6 }));
    toe.position.set(0, -2.44, 0);
    rig.add(toe);
    const statusPill = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.045, 0.02), new THREE.MeshStandardMaterial({ color: 0x0c1a13, emissive: PALETTE.cellGlow, emissiveIntensity: 1.05, roughness: 0.4 }));
    statusPill.position.set(0.9, -2.1, 0.51);
    rig.add(statusPill);

    const media = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.62, 20), glassThin);
    media.position.set(-1.92, -2.3, 0.55);
    rig.add(media);
    const fluid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.19, 0.18, 0.3, 16),
      new THREE.MeshStandardMaterial({ color: 0x4f7f56, emissive: 0x2c5233, emissiveIntensity: 0.45, transparent: true, opacity: 0.7, roughness: 0.42 }),
    );
    fluid.position.set(-1.92, -2.4, 0.55);
    rig.add(fluid);
    const mediaCap = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.09, 14), metal);
    mediaCap.position.set(-1.92, -1.96, 0.55);
    rig.add(mediaCap);
    const pumpBody = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.4, 0.4), new THREE.MeshStandardMaterial({ color: 0x2b3833, metalness: 0.6, roughness: 0.4 }));
    pumpBody.position.set(-1.3, -2.28, 0.55);
    rig.add(pumpBody);
    const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.18, 18), metal);
    roller.rotation.x = Math.PI / 2;
    roller.position.set(-1.3, -2.28, 0.78);
    rig.add(roller);

    /* Tubing from pump to bottom inlet manifold. */
    const tubingPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.3, -2.08, 0.55),
      new THREE.Vector3(-1.14, -1.7, 0.5),
      new THREE.Vector3(-1.02, -1.1, 0.46),
      new THREE.Vector3(-0.72, -0.4, 0.42),
      new THREE.Vector3(-0.5, -1.0, 0.36),
      new THREE.Vector3(-0.42, -1.5, 0.3),
      new THREE.Vector3(0, -1.66, 0.26),
    ]);
    rig.add(new THREE.Mesh(new THREE.TubeGeometry(tubingPath, 48, 0.03, 8, false), new THREE.MeshStandardMaterial({ color: PALETTE.tubing, roughness: 0.3, metalness: 0.08 })));

    /* Sensor mounts on the front stile: geometry only, fully inspectable. */
    [[-0.0, -1.1], [0, 0], [0, 1.1]].forEach(([, y]) => {
      const mount = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.014, 8, 18), metal);
      mount.rotation.y = Math.PI / 2;
      mount.position.set(-1.24, y, 0);
      rig.add(mount);
      const bead = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), new THREE.MeshStandardMaterial({ color: 0x14281e, emissive: PALETTE.cyanoFlash, emissiveIntensity: 0.5, roughness: 0.4 }));
      bead.position.set(-1.27, y, 0);
      rig.add(bead);
    });

    /* Aeration: sparger plume inside the broth. */
    const sparger = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.66, 10), metal);
    sparger.rotation.x = Math.PI / 2;
    sparger.position.set(0, -1.4, 0);
    rig.add(sparger);
    const bubbleRnd = seeded(31);
    const bubbleSeeds = [];
    for (let index = 0; index < 26; index += 1) {
      bubbleSeeds.push({ x: (bubbleRnd() - 0.5) * 1.1, z: (bubbleRnd() - 0.5) * 0.55, speed: 0.25 + bubbleRnd() * 0.4, offset: bubbleRnd(), radius: 0.02 + bubbleRnd() * 0.03 });
    }
    const bubbles = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6),      new THREE.MeshBasicMaterial({ color: 0x9fe6b2, transparent: true, opacity: 0.3, depthWrite: false }), 26);
    rig.add(bubbles);
    const bubbleMatrix = new THREE.Matrix4();

    /* A narrow instrument light keeps the vessel wash key-neutral. */
    const coolFill = new THREE.PointLight(0x63d9cf, 1.2, 6, 2);
    coolFill.position.set(-0.4, -1.2, 2.2);
    rig.add(coolFill);

    rig.userData.animate = (time) => {
      bubbleSeeds.forEach((seed, index) => {
        const life = (time * seed.speed * 0.22 + seed.offset) % 1;
        const y = -1.4 + life * 2.9;
        const wobble = Math.sin(time * 1.6 + seed.offset * 9) * 0.03;
        bubbleMatrix.makeTranslation(seed.x + wobble, y, seed.z);
        bubbleMatrix.scale(new THREE.Vector3(seed.radius, seed.radius, seed.radius));
        bubbles.setMatrixAt(index, bubbleMatrix);
      });
      bubbles.instanceMatrix.needsUpdate = true;
      glowShim.material.emissiveIntensity = 0.1 + Math.sin(time * 0.9) * 0.04;
      roller.rotation.y = time * 1.1;
    };
    /* Fit the whole apparatus in the default framing; drag-to-inspect for detail. */
    rig.scale.setScalar(0.78);
  }, { cameraPosition: [3.4, 1.1, 6.4], threshold: 0.84 });
}

function makeChipScene(canvas) {
  return attachInspectableScene(canvas, (rig, scene) => {
    const substrate = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.14, 2.3),
      new THREE.MeshPhysicalMaterial({ color: 0x16241f, metalness: 0.55, roughness: 0.34, clearcoat: 0.3, clearcoatRoughness: 0.3, transparent: true, opacity: 0.96 }),
    );
    substrate.position.y = -0.07;
    rig.add(substrate);

    /* Recessed tray: cavity floor inside thin perimeter walls. */
    const cavityMaterial = new THREE.MeshStandardMaterial({ color: 0x0a1411, metalness: 0.3, roughness: 0.55 });
    const cavity = new THREE.Mesh(new THREE.BoxGeometry(3.32, 0.02, 2.02), cavityMaterial);
    cavity.position.y = -0.005;
    rig.add(cavity);
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x22332c, metalness: 0.5, roughness: 0.42 });
    const wallPart = (w, h, d, x, y, z) => {
      const part = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMaterial);
      part.position.set(x, y, z);
      rig.add(part);
      return part;
    };
    wallPart(3.44, 0.09, 0.06, 0, 0.02, 1.06);
    wallPart(3.44, 0.09, 0.06, 0, 0.02, -1.06);
    wallPart(0.06, 0.09, 2.18, -1.72, 0.02, 0);
    wallPart(0.06, 0.09, 2.18, 1.72, 0.02, 0);

    /* Channels routed on the tray floor. */
    const flowingFluid = new THREE.MeshStandardMaterial({ color: 0x9be3d8, emissive: 0x1f8e86, emissiveIntensity: 0.85, transparent: true, opacity: 0.52, roughness: 0.3 });
    const candidateFluid = new THREE.MeshStandardMaterial({ color: 0xd6f7a6, emissive: 0x6fb04e, emissiveIntensity: 0.9, transparent: true, opacity: 0.55, roughness: 0.3 });
    const channel = (points, radius, material) => {
      const curve = new THREE.CatmullRomCurve3(points);
      const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 44, radius, 8, false), material);
      rig.add(mesh);
      return curve;
    };
    const sampleIn = new THREE.Vector3(-1.9, 0.03, -0.6);
    const trunk = channel([
      sampleIn,
      new THREE.Vector3(-1.25, 0.03, -0.72),
      new THREE.Vector3(-0.55, 0.03, -0.62),
      new THREE.Vector3(0.25, 0.03, -0.38),
      new THREE.Vector3(0.95, 0.03, -0.3),
      new THREE.Vector3(1.5, 0.03, -0.5),
    ], 0.04, flowingFluid);
    const loopCurve = channel([
      new THREE.Vector3(1.5, 0.03, -0.5),
      new THREE.Vector3(1.05, 0.03, -1.0),
      new THREE.Vector3(0.35, 0.03, -1.12),
      new THREE.Vector3(-0.4, 0.03, -0.92),
      new THREE.Vector3(-1.05, 0.03, -1.02),
      new THREE.Vector3(-1.45, 0.03, -0.66),
      new THREE.Vector3(-1.0, 0.03, -0.36),
      new THREE.Vector3(-0.35, 0.03, -0.3),
      new THREE.Vector3(0.4, 0.03, -0.42),
      new THREE.Vector3(1.1, 0.03, -0.44),
      new THREE.Vector3(1.55, 0.03, -0.72),
    ], 0.038, flowingFluid);
    const wasteCurve = channel([
      new THREE.Vector3(1.55, 0.03, -0.72),
      new THREE.Vector3(1.95, 0.03, -0.6),
      new THREE.Vector3(2.1, 0.03, -0.32),
    ], 0.032, flowingFluid);
    const recoveryCurve = channel([
      new THREE.Vector3(0.4, 0.03, -0.42),
      new THREE.Vector3(0.05, 0.03, 0.32),
      new THREE.Vector3(0.55, 0.03, 0.92),
      new THREE.Vector3(1.35, 0.03, 1.02),
      new THREE.Vector3(2.0, 0.03, 0.92),
    ], 0.036, candidateFluid);

    /* Sort gate: a wider cavity before the waste/recovery split. */
    const sortGate = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.56), cavityMaterial);
    sortGate.position.set(1.5, 0.01, -0.62);
    rig.add(sortGate);
    [[1.34, -0.0], [1.66, -0.0]].forEach(([x, _], index) => {
      const electrode = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.09, 8), new THREE.MeshStandardMaterial({ color: 0x9fe89b, emissive: PALETTE.cellGlow, emissiveIntensity: index === 0 ? 0.7 : 0.2, roughness: 0.35 }));
      electrode.position.set(x, 0.055, -0.62);
      rig.add(electrode);
    });

    /* Chamber wells seated in the tray with bright rims. */
    for (let index = 0; index < 6; index += 1) {
      const theta = index / 6;
      const position = loopCurve.getPointAt(theta);
      const well = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.1, 0.06, 22), new THREE.MeshPhysicalMaterial({ color: 0x1a2e28, clearcoat: 0.5, roughness: 0.3, metalness: 0.35 }));
      well.position.set(position.x, 0.03, position.z);
      rig.add(well);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.135, 0.014, 8, 22), new THREE.MeshStandardMaterial({ color: 0x8fa89e, metalness: 0.72, roughness: 0.34 }));
      rim.rotation.x = Math.PI / 2;
      rim.position.set(position.x, 0.075, position.z);
      rig.add(rim);
    }

    /* Transparent lid on short glass posts above the tray. */
    const lid = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.05, 2.2), glassMaterial(0xbfe9df, 0.22));
    lid.position.y = 0.17;
    rig.add(lid);
    [[-1.55, -0.9], [1.55, -0.9], [-1.55, 0.9], [1.55, 0.9]].forEach(([x, z]) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.11, 10), new THREE.MeshStandardMaterial({ color: 0x2a3d35, metalness: 0.6, roughness: 0.42 }));
      post.position.set(x, 0.115, z);
      rig.add(post);
    });

    /* Ports: two on the left (sample, sheath), two on the right (waste, sort). */
    [[sampleIn, -0.6], [new THREE.Vector3(-1.35, 0.03, 0.72), 0.72], [new THREE.Vector3(2.12, 0.03, -0.32), -0.32], [new THREE.Vector3(2.02, 0.03, 0.92), 0.92]].forEach(([at, z]) => {
      const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.22, 12), new THREE.MeshStandardMaterial({ color: 0x517d70, metalness: 0.62, roughness: 0.3 }));
      ferrule.position.set(at.x, 0.22, z);
      rig.add(ferrule);
      const nut = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 6), new THREE.MeshStandardMaterial({ color: 0x31413a, metalness: 0.55, roughness: 0.5 }));
      nut.position.set(at.x, 0.35, z);
      rig.add(nut);
    });

    /* Droplets: instanced spheres easing along the channel network. */
    const dropletMaterial = new THREE.MeshStandardMaterial({ color: 0x6fc2ae, emissive: 0x1f8e86, emissiveIntensity: 0.4, transparent: true, opacity: 0.55, roughness: 0.28 });
    const cells = new THREE.InstancedMesh(new THREE.SphereGeometry(0.045, 8, 6), new THREE.MeshStandardMaterial({ color: 0xe4fda9, emissive: 0x8ec456, emissiveIntensity: 1.1, roughness: 0.3 }), 5);
    const matrix = new THREE.Matrix4();
    const dropletsByCurve = [trunk, loopCurve, recoveryCurve].map((curve, pathIndex) => {
      const droplets = [];
      for (let index = 0; index < 5; index += 1) {
        const droplet = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), dropletMaterial);
        droplet.userData = { t: index / 7, pathIndex, speed: 0.022 + Math.random() * 0.01 };
        rig.add(droplet);
        droplets.push(droplet);
      }
      return droplets;
    });
    rig.userData.animate = (time) => {
      dropletsByCurve.forEach((droplets, pathIndex) => {
        const curve = [trunk, loopCurve, recoveryCurve][pathIndex];
        droplets.forEach((droplet, index) => {
          const life = (droplet.userData.t + time * droplet.userData.speed) % 1;
          const point = curve.getPointAt(life);
          droplet.position.copy(point);
          droplet.position.y += 0.035;
          if (pathIndex !== 2 || index % 3 !== 0) return;
          matrix.makeTranslation(point.x, point.y + 0.05, point.z);
          matrix.scale(new THREE.Vector3(0.55, 0.55, 0.55));
          cells.setMatrixAt(index, matrix);
        });
      });
      cells.instanceMatrix.needsUpdate = true;
    };
    rig.add(cells);
  }, { cameraPosition: [2.6, 2.6, 4.4], threshold: 0.86 });
}

/* ------------------------------------------------------------------ */
/* 2D fallbacks                                                        */
/* ------------------------------------------------------------------ */

function paintFallback(canvas, kind) {
  const context = canvas?.getContext?.("2d");
  if (!context) return null;
  const draw = () => {
    const width = Math.max(1, canvas.clientWidth || 640);
    const height = Math.max(1, canvas.clientHeight || 420);
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const background = context.createRadialGradient(width * .5, height * .4, 0, width * .5, height * .4, Math.max(width, height) * .72);
    background.addColorStop(0, kind === "chip" ? "#123d3b" : "#16452e");
    background.addColorStop(1, "#030b07");
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);
    context.strokeStyle = "rgba(185,235,183,.12)";
    context.lineWidth = 1;
    for (let x = 0; x < width; x += 28) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke(); }
    for (let y = 18; y < height; y += 28) { context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke(); }
    context.lineWidth = 2;
    if (kind === "volvox") {
      for (const [cx, cy, radius] of [[width * .27, height * .46, height * .22], [width * .57, height * .4, height * .14], [width * .79, height * .62, height * .25]]) {
        context.strokeStyle = "rgba(151,232,168,.55)";
        context.beginPath(); context.arc(cx, cy, radius, 0, Math.PI * 2); context.stroke();
        for (let index = 0; index < 22; index += 1) {
          const angle = index * 2.39996;
          context.fillStyle = index % 4 === 0 ? "#c8eb9c" : "#7bd8a3";
          context.beginPath(); context.arc(cx + Math.cos(angle) * radius * .9, cy + Math.sin(angle) * radius * .9, 2.2, 0, Math.PI * 2); context.fill();
        }
      }
    } else if (kind === "chip") {
      const left = width * .12, top = height * .27, chipWidth = width * .76, chipHeight = height * .45;
      context.fillStyle = "rgba(28,74,70,.8)"; context.fillRect(left, top, chipWidth, chipHeight);
      context.strokeStyle = "rgba(139,235,220,.6)"; context.strokeRect(left, top, chipWidth, chipHeight);
      context.strokeStyle = "#73e7dc"; context.lineWidth = 5; context.beginPath(); context.moveTo(left + 12, top + chipHeight * .52); context.lineTo(left + chipWidth * .38, top + chipHeight * .52); context.lineTo(left + chipWidth * .58, top + chipHeight * .26); context.lineTo(left + chipWidth - 12, top + chipHeight * .26); context.stroke();
      context.strokeStyle = "#c8eb9c"; context.beginPath(); context.moveTo(left + chipWidth * .38, top + chipHeight * .52); context.lineTo(left + chipWidth * .62, top + chipHeight * .76); context.lineTo(left + chipWidth - 12, top + chipHeight * .76); context.stroke();
      for (let index = 0; index < 12; index += 1) { context.fillStyle = index % 5 === 0 ? "#c8eb9c" : "#73e7dc"; context.beginPath(); context.arc(left + 30 + index * (chipWidth - 60) / 11, top + chipHeight * .52, 3, 0, Math.PI * 2); context.fill(); }
    } else {
      const cx = width * .52, top = height * .17, vesselWidth = Math.min(width * .34, 190), vesselHeight = height * .66;
      context.strokeStyle = "rgba(205,246,214,.66)"; context.lineWidth = 2; context.strokeRect(cx - vesselWidth / 2, top, vesselWidth, vesselHeight);
      context.fillStyle = "rgba(63,151,92,.5)"; context.fillRect(cx - vesselWidth / 2 + 8, top + vesselHeight * .28, vesselWidth - 16, vesselHeight * .7);
      context.strokeStyle = "#c8eb9c"; context.lineWidth = 5; for (const dx of [-vesselWidth * .65, vesselWidth * .65]) { context.beginPath(); context.moveTo(cx + dx, top + 12); context.lineTo(cx + dx, top + vesselHeight - 12); context.stroke(); }
      context.strokeStyle = "#91cdb1"; context.lineWidth = 3; context.beginPath(); context.moveTo(cx - vesselWidth / 2, top + vesselHeight * .48); context.lineTo(cx - vesselWidth * .82, top + vesselHeight * .48); context.lineTo(cx - vesselWidth, top + vesselHeight * .65); context.stroke();
      context.beginPath(); context.moveTo(cx + vesselWidth / 2, top + vesselHeight * .34); context.lineTo(cx + vesselWidth * .82, top + vesselHeight * .34); context.lineTo(cx + vesselWidth, top + vesselHeight * .18); context.stroke();
    }
    context.fillStyle = "#a7c5aa"; context.font = "10px monospace"; context.fillText("2D / WEBGL FALLBACK · ILLUSTRATIVE", 16, height - 16);
  };
  canvas.dataset.renderer = "canvas";
  canvas.dataset.rendererFallback = "true";
  const resize = () => draw();
  window.addEventListener("resize", resize, { passive: true });
  draw();
  return { stop: () => window.removeEventListener("resize", resize) };
}

/* ------------------------------------------------------------------ */
/* Mount                                                               */
/* ------------------------------------------------------------------ */

const active = [];
const mount = (canvasId, factory) => {
  const canvas = document.querySelector(canvasId);
  if (!canvas) return;
  const handle = factory(canvas);
  if (handle) active.push(handle);
};

mount("#volvoxCanvas", attachVolvoxField);
mount("#reactorCanvas", (canvas) => attachReactorStudy(canvas, document.querySelector("#reactor-study")));
mount("#algaephyteInstrumentCanvas", makeCultivationScene);
mount("#cyanoflowChipCanvas", makeChipScene);
window.addEventListener("pagehide", () => active.forEach((scene) => scene.stop?.()));
