import * as THREE from "three";

const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const seeded = (seed) => {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
};

function fitRenderer(renderer, camera, canvas) {
  const width = canvas.clientWidth || canvas.parentElement?.clientWidth || 1;
  const height = canvas.clientHeight || canvas.parentElement?.clientHeight || 1;
  const ratio = Math.min(window.devicePixelRatio || 1, 1.6);
  renderer.setPixelRatio(ratio);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function rendererFor(canvas, color = 0x06100c) {
  if (!canvas || !window.WebGLRenderingContext) return null;
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
    renderer.setClearColor(color, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.16;
    return renderer;
  } catch {
    return null;
  }
}

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

function addVolvoxColony(scene, random, position, scale) {
  const colony = new THREE.Group();
  colony.position.set(...position);
  colony.scale.setScalar(scale);
  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(1, 20, 14),
    new THREE.MeshBasicMaterial({ color: 0x6fcf9b, transparent: true, opacity: 0.055, side: THREE.DoubleSide, depthWrite: false })
  );
  colony.add(shell);
  const cellGeometry = new THREE.SphereGeometry(0.074, 6, 5);
  const cellMaterial = new THREE.MeshStandardMaterial({ color: 0xbce99c, emissive: 0x4e9b5d, emissiveIntensity: 1.8, roughness: 0.42, metalness: 0.02 });
  const cells = new THREE.InstancedMesh(cellGeometry, cellMaterial, 48);
  const matrix = new THREE.Matrix4();
  const cellColor = new THREE.Color();
  for (let index = 0; index < 48; index += 1) {
    const phi = Math.acos(1 - 2 * ((index + 0.5) / 48));
    const theta = Math.PI * (3 - Math.sqrt(5)) * index;
    const radius = 0.84 + (random() - 0.5) * 0.07;
    const point = new THREE.Vector3(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
    matrix.makeTranslation(point.x, point.y, point.z);
    cells.setMatrixAt(index, matrix);
    cellColor.setHSL(0.27 + random() * 0.08, 0.55, 0.63 + random() * 0.14);
    cells.setColorAt(index, cellColor);
  }
  cells.instanceMatrix.needsUpdate = true;
  colony.add(cells);
  const nucleus = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 12, 8),
    new THREE.MeshBasicMaterial({ color: 0x274f47, transparent: true, opacity: 0.28 })
  );
  colony.add(nucleus);
  scene.add(colony);
  return colony;
}

function makeVolvoxScene(canvas) {
  const renderer = rendererFor(canvas);
  if (!renderer) return paintFallback(canvas, "volvox");
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0.1, 8.6);
  scene.add(new THREE.AmbientLight(0x315946, 1.8));
  const key = new THREE.PointLight(0xa7f59c, 8, 16);
  key.position.set(-3, 2, 4);
  scene.add(key);
  const fill = new THREE.PointLight(0x69d8c4, 4, 14);
  fill.position.set(4, -2, 1);
  scene.add(fill);
  const random = seeded(19);
  const colonies = [
    addVolvoxColony(scene, random, [-2.6, 0.55, -0.3], 1.18),
    addVolvoxColony(scene, random, [0.45, -0.1, 0.5], 0.76),
    addVolvoxColony(scene, random, [2.55, 1.18, -1], 0.56),
    addVolvoxColony(scene, random, [2.3, -1.35, -0.2], 1.44),
    addVolvoxColony(scene, random, [-1.4, -1.32, -1.4], 0.48),
  ];
  const points = [];
  for (let index = 0; index < 220; index += 1) points.push((random() - 0.5) * 10, (random() - 0.5) * 5.6, (random() - 0.5) * 4);
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  scene.add(new THREE.Points(particleGeometry, new THREE.PointsMaterial({ color: 0xa8f0af, size: 0.018, transparent: true, opacity: 0.72 })), 0);
  let active = true;
  let frame = 0;
  const clock = new THREE.Clock();
  const render = () => {
    if (!active) return;
    const time = clock.getElapsedTime();
    colonies.forEach((colony, index) => {
      colony.rotation.y = time * (0.025 + index * 0.006);
      colony.position.y += Math.sin(time * 0.22 + index) * 0.0007;
    });
    camera.position.x += (0.35 * Math.sin(time * 0.05) - camera.position.x) * 0.003;
    renderer.render(scene, camera);
    if (!reducedMotion) frame = requestAnimationFrame(render);
  };
  const resize = () => fitRenderer(renderer, camera, canvas);
  const observer = new IntersectionObserver(([entry]) => {
    active = entry.isIntersecting;
    if (active && !reducedMotion && !frame) frame = requestAnimationFrame(render);
  }, { rootMargin: "200px" });
  observer.observe(canvas);
  window.addEventListener("resize", resize, { passive: true });
  resize();
  render();
  return { stop: () => { active = false; cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener("resize", resize); renderer.dispose(); } };
}

function makeTube(path, material) {
  return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(path), 24, 0.035, 6, false), material);
}

function makeReactorScene(canvas) {
  const renderer = rendererFor(canvas);
  if (!renderer) return paintFallback(canvas, "reactor");
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 40);
  camera.position.set(4.7, 1.6, 8.7);
  const rig = new THREE.Group();
  scene.add(rig);
  scene.add(new THREE.HemisphereLight(0x91dca3, 0x06120d, 2.2));
  const key = new THREE.DirectionalLight(0xd6ffbe, 4.4); key.position.set(-4, 5, 7); scene.add(key);
  const rim = new THREE.PointLight(0x64d9d0, 7, 18); rim.position.set(4, 1, 3); scene.add(rim);
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x9bdcb4, transmission: 0.72, opacity: 0.3, transparent: true, roughness: 0.1, metalness: 0.05, thickness: 0.25, side: THREE.DoubleSide });
  const culture = new THREE.MeshStandardMaterial({ color: 0x275f45, emissive: 0x286a4e, emissiveIntensity: 0.75, roughness: 0.62, transparent: true, opacity: 0.82 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x748c80, metalness: 0.8, roughness: 0.26 });
  const glow = new THREE.MeshStandardMaterial({ color: 0xc4f69e, emissive: 0x6bb966, emissiveIntensity: 2.2, roughness: 0.3 });
  const vessel = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(1.44, 1.44, 4.6, 40, 1, true), glass); body.position.y = 0.2; vessel.add(body);
  const fluid = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 3.72, 32), culture); fluid.position.y = -0.24; vessel.add(fluid);
  [2.45, -2.05].forEach((y) => { const ring = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.07, 8, 48), metal); ring.rotation.x = Math.PI / 2; ring.position.y = y; vessel.add(ring); });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.62, 1.62, 0.25, 36), metal); base.position.y = -2.15; vessel.add(base);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(1.47, 1.47, 0.17, 36), metal); lid.position.y = 2.5; vessel.add(lid);
  [-1, 1].forEach((x) => { const lightBar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 4.4, 0.12), glow); lightBar.position.set(x * 1.83, 0.05, 0); vessel.add(lightBar); });
  const tubeMaterial = new THREE.MeshStandardMaterial({ color: 0x9ac8b1, emissive: 0x315f54, emissiveIntensity: 0.4, roughness: 0.28, metalness: 0.25 });
  vessel.add(makeTube([new THREE.Vector3(-1.25, -1.15, 0), new THREE.Vector3(-2.15, -1.15, 0), new THREE.Vector3(-2.45, -0.25, 0)], tubeMaterial));
  vessel.add(makeTube([new THREE.Vector3(1.25, 1.05, 0), new THREE.Vector3(2.2, 1.05, 0), new THREE.Vector3(2.55, 1.8, 0)], tubeMaterial));
  const random = seeded(77);
  const particles = [];
  for (let index = 0; index < 260; index += 1) particles.push((random() - 0.5) * 2.3, -1.98 + random() * 3.48, (random() - 0.5) * 2.3);
  const particleGeometry = new THREE.BufferGeometry(); particleGeometry.setAttribute("position", new THREE.Float32BufferAttribute(particles, 3));
  const culturePoints = new THREE.Points(particleGeometry, new THREE.PointsMaterial({ color: 0xc4f69e, size: 0.026, transparent: true, opacity: 0.8 }));
  vessel.add(culturePoints);
  rig.add(vessel);
  const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x263c34, metalness: 0.82, roughness: 0.34 });
  [-2.15, 2.15].forEach((x) => { const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 5.5, 0.18), frameMaterial); post.position.set(x, 0, -0.32); rig.add(post); });
  const frameTop = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.14, 0.2), frameMaterial); frameTop.position.set(0, 2.74, -0.32); rig.add(frameTop);
  const render = (progress = 0) => {
    const eased = progress * progress * (3 - 2 * progress);
    rig.rotation.y = -0.28 + eased * 0.58;
    rig.rotation.x = -0.04 + eased * 0.08;
    rig.position.y = (eased - 0.5) * 0.22;
    camera.position.x = 4.7 - eased * 1.8;
    camera.position.z = 8.7 - eased * 0.6;
    camera.lookAt(0, 0.2, 0);
    renderer.render(scene, camera);
  };
  const resize = () => fitRenderer(renderer, camera, canvas);
  window.addEventListener("resize", resize, { passive: true }); resize(); render(0);
  return { render, stop: () => { window.removeEventListener("resize", resize); renderer.dispose(); } };
}

function attachInspectableScene(canvas, build, cameraPosition, lookAt = new THREE.Vector3()) {
  const renderer = rendererFor(canvas, 0x07130f);
  if (!renderer) return paintFallback(canvas, canvas.id.includes("Chip") ? "chip" : "reactor");
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
  camera.position.set(...cameraPosition);
  const rig = new THREE.Group();
  scene.add(rig);
  scene.add(new THREE.HemisphereLight(0x9be2b2, 0x06110c, 2.2));
  const key = new THREE.DirectionalLight(0xd8ffbf, 4.8);
  key.position.set(-4, 5, 7);
  scene.add(key);
  const rim = new THREE.PointLight(0x62ded2, 7, 18);
  rim.position.set(4, 1, 3);
  scene.add(rim);
  build(rig, scene);

  let yaw = -0.26;
  let pitch = -0.06;
  let pointerId = null;
  let lastX = 0;
  let lastY = 0;
  let active = true;
  let frame = 0;
  const clock = new THREE.Clock();
  const render = () => {
    if (!active) return;
    const time = clock.getElapsedTime();
    rig.rotation.y = yaw + (reducedMotion ? 0 : Math.sin(time * 0.16) * 0.025);
    rig.rotation.x = pitch;
    rig.position.y = reducedMotion ? 0 : Math.sin(time * 0.28) * 0.035;
    camera.lookAt(lookAt);
    renderer.render(scene, camera);
    if (!reducedMotion) frame = requestAnimationFrame(render);
  };
  const resize = () => fitRenderer(renderer, camera, canvas);
  const onPointerDown = (event) => {
    pointerId = event.pointerId;
    lastX = event.clientX;
    lastY = event.clientY;
    canvas.setPointerCapture?.(pointerId);
  };
  const onPointerMove = (event) => {
    if (pointerId !== event.pointerId) return;
    yaw += (event.clientX - lastX) * 0.008;
    pitch = clamp(pitch + (event.clientY - lastY) * 0.006, -0.72, 0.6);
    lastX = event.clientX;
    lastY = event.clientY;
    if (reducedMotion) render();
  };
  const onPointerUp = () => { pointerId = null; };
  const observer = new IntersectionObserver(([entry]) => {
    active = entry.isIntersecting;
    if (active && !reducedMotion && !frame) frame = requestAnimationFrame(render);
  }, { rootMargin: "160px" });
  observer.observe(canvas);
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  window.addEventListener("resize", resize, { passive: true });
  resize();
  render();
  return { stop: () => {
    active = false;
    cancelAnimationFrame(frame);
    observer.disconnect();
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("pointerup", onPointerUp);
    canvas.removeEventListener("pointercancel", onPointerUp);
    window.removeEventListener("resize", resize);
    disposeObject(scene);
    renderer.dispose();
  } };
}

function makeCultivationScene(canvas) {
  return attachInspectableScene(canvas, (rig) => {
    const glass = new THREE.MeshPhysicalMaterial({ color: 0x9bdcb4, transmission: 0.7, opacity: 0.3, transparent: true, roughness: 0.12, thickness: 0.18, side: THREE.DoubleSide });
    const culture = new THREE.MeshStandardMaterial({ color: 0x2f7650, emissive: 0x286d4b, emissiveIntensity: 0.9, transparent: true, opacity: 0.84, roughness: 0.62 });
    const metal = new THREE.MeshStandardMaterial({ color: 0x849d8d, metalness: 0.78, roughness: 0.28 });
    const sensor = new THREE.MeshStandardMaterial({ color: 0xb9d7c1, metalness: 0.45, roughness: 0.24, emissive: 0x275949, emissiveIntensity: 0.35 });
    const glow = new THREE.MeshStandardMaterial({ color: 0xc4f69e, emissive: 0x6bb966, emissiveIntensity: 2.3, roughness: 0.3 });
    const vessel = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(1.28, 1.28, 3.7, 36, 1, true), glass); body.position.y = 0.1; vessel.add(body);
    const fluid = new THREE.Mesh(new THREE.CylinderGeometry(1.19, 1.19, 2.9, 30), culture); fluid.position.y = -0.3; vessel.add(fluid);
    vessel.add(new THREE.Mesh(new THREE.CylinderGeometry(1.38, 1.38, 0.2, 36), metal)).position.y = -1.82;
    vessel.add(new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.16, 36), metal)).position.y = 2.0;
    [-1, 1].forEach((x) => {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.11, 3.5, 0.11), glow);
      bar.position.set(x * 1.66, 0.05, 0);
      vessel.add(bar);
    });
    const probe = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.45, 10), sensor);
    probe.position.set(0.4, 1.32, 0.18); vessel.add(probe);
    const probeCap = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), glow); probeCap.position.set(0.4, 0.6, 0.18); vessel.add(probeCap);
    const tube = new THREE.MeshStandardMaterial({ color: 0x9ac8b1, emissive: 0x315f54, emissiveIntensity: 0.35, roughness: 0.3, metalness: 0.2 });
    vessel.add(makeTube([new THREE.Vector3(-1.1, -0.85, 0), new THREE.Vector3(-1.9, -0.85, 0), new THREE.Vector3(-2.25, -0.15, 0)], tube));
    vessel.add(makeTube([new THREE.Vector3(1.1, 0.9, 0), new THREE.Vector3(1.95, 0.9, 0), new THREE.Vector3(2.25, 1.5, 0)], tube));
    const points = [];
    const random = seeded(311);
    for (let index = 0; index < 180; index += 1) points.push((random() - 0.5) * 2, -1.65 + random() * 2.6, (random() - 0.5) * 2);
    const particleGeometry = new THREE.BufferGeometry(); particleGeometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    vessel.add(new THREE.Points(particleGeometry, new THREE.PointsMaterial({ color: 0xc4f69e, size: 0.028, transparent: true, opacity: 0.82 })));
    rig.add(vessel);
    const frame = new THREE.MeshStandardMaterial({ color: 0x263c34, metalness: 0.82, roughness: 0.3 });
    [-2, 2].forEach((x) => { const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 4.7, 0.18), frame); post.position.set(x, 0, -0.28); rig.add(post); });
    const top = new THREE.Mesh(new THREE.BoxGeometry(4.25, 0.14, 0.2), frame); top.position.set(0, 2.36, -0.28); rig.add(top);
    const pump = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.52, 0.6), metal); pump.position.set(-2.35, -1.45, 0); rig.add(pump);
  }, [4.5, 2.1, 7.4]);
}

function makeChipScene(canvas) {
  return attachInspectableScene(canvas, (rig) => {
    const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x233c38, metalness: 0.36, roughness: 0.4 });
    const glass = new THREE.MeshPhysicalMaterial({ color: 0x9de9dd, transmission: 0.68, transparent: true, opacity: 0.3, roughness: 0.1, thickness: 0.12, side: THREE.DoubleSide });
    const channelMaterial = new THREE.MeshStandardMaterial({ color: 0x74e7dc, emissive: 0x238d86, emissiveIntensity: 1.7, roughness: 0.25 });
    const candidateMaterial = new THREE.MeshStandardMaterial({ color: 0xc8eb9c, emissive: 0x6aa94e, emissiveIntensity: 1.8, roughness: 0.3 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.2, 3.1), baseMaterial); base.position.y = -0.12; rig.add(base);
    const top = new THREE.Mesh(new THREE.BoxGeometry(4.7, 0.12, 3), glass); top.position.y = 0.12; rig.add(top);
    const channel = (points, radius = 0.055, material = channelMaterial) => rig.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 28, radius, 8, false), material));
    channel([new THREE.Vector3(-2.1, 0.2, -0.8), new THREE.Vector3(-1.1, 0.2, -0.8), new THREE.Vector3(-0.4, 0.2, -0.2), new THREE.Vector3(1.2, 0.2, -0.2), new THREE.Vector3(2.15, 0.2, -0.75)]);
    channel([new THREE.Vector3(0.3, 0.2, -0.2), new THREE.Vector3(0.3, 0.2, 0.85), new THREE.Vector3(1.15, 0.2, 1.05), new THREE.Vector3(2.1, 0.2, 1.05)], 0.045, candidateMaterial);
    channel([new THREE.Vector3(-0.8, 0.2, -0.65), new THREE.Vector3(-0.8, 0.2, -1.15), new THREE.Vector3(0.2, 0.2, -1.15)], 0.04, channelMaterial);
    [[-1.35, -0.45], [-0.65, -0.45], [0.05, -0.2], [0.75, -0.2], [1.35, -0.75], [1.45, 1.05]].forEach(([x, z], index) => {
      const chamber = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.045, 20), index === 5 ? candidateMaterial : glass);
      chamber.rotation.x = Math.PI / 2; chamber.position.set(x, 0.23, z); rig.add(chamber);
    });
    const random = seeded(902);
    const cells = [];
    for (let index = 0; index < 24; index += 1) {
      const cell = new THREE.Mesh(new THREE.SphereGeometry(0.065 + random() * 0.04, 8, 6), index % 7 === 0 ? candidateMaterial : channelMaterial);
      cell.position.set(-1.9 + random() * 3.7, 0.28, -0.8 + Math.sin(index * 1.7) * 0.16);
      rig.add(cell); cells.push(cell);
    }
    rig.userData.cells = cells;
  }, [4.4, 3.4, 6.3], new THREE.Vector3(0, 0, 0));
}

const volvoxCanvas = document.querySelector("#volvoxCanvas");
const reactorCanvas = document.querySelector("#reactorCanvas");
const cultivationCanvas = document.querySelector("#algaephyteInstrumentCanvas");
const chipCanvas = document.querySelector("#cyanoflowChipCanvas");
if (volvoxCanvas) makeVolvoxScene(volvoxCanvas);
if (cultivationCanvas) makeCultivationScene(cultivationCanvas);
if (chipCanvas) makeChipScene(chipCanvas);
if (reactorCanvas) {
  const reactor = makeReactorScene(reactorCanvas);
  const section = document.querySelector("#reactor-study");
  if (reactor && section) {
    const update = () => {
      const bounds = section.getBoundingClientRect();
      const span = Math.max(1, bounds.height - window.innerHeight * 0.55);
      reactor.render(clamp((window.innerHeight * 0.35 - bounds.top) / span));
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
  }
}
