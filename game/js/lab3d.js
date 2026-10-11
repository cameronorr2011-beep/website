/* Interactive laboratory renderer. WebGL is the primary path; the dependency-
 * free Canvas projection keeps camera modes, selection affordance, and state
 * labels usable on low-memory computers and Raspberry Pi-class browsers. The
 * model remains independent from this visual layer. */

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const fract = (v) => v - Math.floor(v);
const noise = (n) => fract(Math.sin(n * 12.9898 + 78.233) * 43758.5453);

function colorForHealth(health) {
  return health === "critical" ? 0xe57979 : health === "stressed" ? 0xf0bd63 : 0x7ce2a0;
}

export async function createLabRenderer(canvas, hooks = {}) {
  if (new URLSearchParams(location.search).get('render') !== '2d') {
    try {
      const { WebGLLab } = await import('./lab-webgl.js');
      const lab = new WebGLLab(canvas, hooks);
      return lab;
    } catch (error) {
      hooks.onFallback?.(`3D unavailable: ${error.message}. Using the accessible Canvas view.`);
      // A failed WebGL context cannot be reused as a 2D context.
      const replacement = canvas.cloneNode(false); canvas.replaceWith(replacement); canvas = replacement;
    }
  }
  canvas.dataset.renderer = 'canvas';
  return new SoftwareLab3D(canvas, hooks);
}

class ThreeLab {
  constructor(T, canvas, hooks) {
    this.T = T;
    this.canvas = canvas;
    this.hooks = hooks;
    this.state = null;
    this.mode = "overview";
    this.cameraName = "laboratory";
    this.pointer = { down: false, x: 0, y: 0, moved: false };
    this.orbit = { theta: 0.6, phi: 1.05, radius: 18, target: new T.Vector3(0, 2, 0) };
    this.lastDropKey = "";
    this.scene = new T.Scene();
    this.scene.background = new T.Color(0x07110f);
    this.camera = new T.PerspectiveCamera(42, 1, 0.1, 100);
    this.renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.root = new T.Group();
    this.scene.add(this.root);
    this.buildEnvironment();
    this.bind();
    this.resize();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  buildEnvironment() {
    const T = this.T;
    const mat = (color, roughness = 0.55, metalness = 0.05, transparent = false, opacity = 1) => new T.MeshStandardMaterial({ color, roughness, metalness, transparent, opacity, side: transparent ? T.DoubleSide : T.FrontSide });
    const floor = new T.Mesh(new T.PlaneGeometry(26, 16), mat(0x0d201a, 0.84));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; this.root.add(floor);
    const back = new T.Mesh(new T.PlaneGeometry(26, 10), mat(0x081612, 0.92));
    back.position.set(0, 5, -4); this.root.add(back);
    const grid = new T.GridHelper(26, 26, 0x1c4a38, 0x123024);
    grid.position.y = 0.012; grid.position.z = 0; grid.material.opacity = 0.42; grid.material.transparent = true; this.root.add(grid);

    this.scene.add(new T.HemisphereLight(0xb4e5cf, 0x04100b, 1.6));
    const key = new T.DirectionalLight(0xc8ffe0, 2.3); key.position.set(-6, 11, 8); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); this.scene.add(key);
    const cyan = new T.PointLight(0x50d7d0, 3.2, 12); cyan.position.set(4, 3, 2); this.scene.add(cyan);
    const green = new T.PointLight(0x61e49b, 2.2, 12); green.position.set(-4, 3, 1); this.scene.add(green);

    this.algaeGroup = new T.Group(); this.algaeGroup.name = "Algaephyte cultivation vessel"; this.root.add(this.algaeGroup);
    this.buildVessel(mat);
    this.cyanoGroup = new T.Group(); this.cyanoGroup.name = "Cyanoflow microfluidic chip"; this.root.add(this.cyanoGroup);
    this.buildChip(mat);
    this.buildCells(mat);
    this.buildBubbles();
    this.statusLight = new T.Mesh(new T.SphereGeometry(0.13, 12, 8), mat(0x7ce2a0, 0.25, 0.1));
    this.statusLight.position.set(-5.6, 4.8, 0); this.root.add(this.statusLight);
  }

  buildVessel(mat) {
    const T = this.T;
    const platform = new T.Mesh(new T.CylinderGeometry(2.5, 2.65, 0.32, 40), mat(0x18372b, 0.66, 0.18));
    platform.position.set(-3.4, 0.18, 0); platform.castShadow = true; platform.receiveShadow = true; this.algaeGroup.add(platform);
    const liquid = new T.Mesh(new T.CylinderGeometry(2.02, 2.02, 4.4, 40), mat(0x2a9b68, 0.18, 0.02, true, 0.44));
    liquid.position.set(-3.4, 2.5, 0); liquid.castShadow = true; this.algaeGroup.add(liquid); this.liquid = liquid;
    const glass = new T.Mesh(new T.CylinderGeometry(2.16, 2.16, 4.8, 40, 1, true), mat(0x75e6c1, 0.1, 0.15, true, 0.22));
    glass.position.set(-3.4, 2.55, 0); this.algaeGroup.add(glass);
    const rim = new T.Mesh(new T.TorusGeometry(2.17, 0.055, 8, 48), mat(0xa5ffe0, 0.15, 0.25));
    rim.position.set(-3.4, 4.95, 0); rim.rotation.x = Math.PI / 2; this.algaeGroup.add(rim);
    for (const x of [-5.63, -1.17]) {
      const led = new T.Mesh(new T.BoxGeometry(0.08, 4.2, 0.1), mat(0x72f2a2, 0.25, 0.1));
      led.position.set(x, 2.45, 0.08); this.algaeGroup.add(led);
    }
    const probe = new T.Mesh(new T.CylinderGeometry(0.08, 0.08, 2.6, 12), mat(0xb4d9cf, 0.35, 0.7));
    probe.position.set(-2.5, 4.9, 0.15); this.algaeGroup.add(probe);
    const sensor = new T.Mesh(new T.SphereGeometry(0.15, 12, 8), mat(0x80cfe0, 0.25, 0.3));
    sensor.position.set(-2.5, 3.65, 0.15); this.algaeGroup.add(sensor);
    const tubeCurve = new T.CatmullRomCurve3([new T.Vector3(-3.4, 4.9, 0), new T.Vector3(-3.4, 6.2, 0), new T.Vector3(-0.6, 6.2, 0), new T.Vector3(0.4, 4.4, 0)]);
    const tube = new T.Mesh(new T.TubeGeometry(tubeCurve, 32, 0.085, 8, false), mat(0x7eb7a3, 0.28, 0.2, true, 0.7));
    this.algaeGroup.add(tube);
    const label = new T.Mesh(new T.BoxGeometry(0.03, 0.8, 1.1), mat(0x75e6c1, 0.4, 0.1, true, 0.7));
    label.position.set(-5.62, 1.7, 1.3); this.algaeGroup.add(label);
  }

  buildChip(mat) {
    const T = this.T;
    const base = new T.Mesh(new T.BoxGeometry(7.2, 0.32, 4.6), mat(0x123a3a, 0.28, 0.18));
    base.position.set(3.4, 0.42, 0); base.castShadow = true; this.cyanoGroup.add(base);
    const top = new T.Mesh(new T.BoxGeometry(6.9, 0.16, 4.25), mat(0x5fd5c0, 0.14, 0.08, true, 0.3));
    top.position.set(3.4, 0.67, 0); this.cyanoGroup.add(top);
    this.channelGroup = new T.Group(); this.cyanoGroup.add(this.channelGroup);
    const channelMat = mat(0x6ee7d2, 0.2, 0.1, true, 0.82);
    const horizontal = new T.Mesh(new T.BoxGeometry(5.85, 0.07, 0.23), channelMat);
    horizontal.position.set(3.4, 0.77, 0); this.channelGroup.add(horizontal);
    for (let i = 0; i < 4; i++) {
      const chamber = new T.Mesh(new T.CylinderGeometry(0.38, 0.38, 0.08, 24), mat(0x82f1df, 0.15, 0.08, true, 0.68));
      chamber.position.set(1.35 + i * 1.35, 0.81, 0); chamber.rotation.x = Math.PI / 2; chamber.userData = { label: `Isolation chamber ${i + 1}` }; this.channelGroup.add(chamber);
    }
    const inlet = new T.Mesh(new T.CylinderGeometry(0.26, 0.26, 0.65, 20), mat(0x71b9d3, 0.25, 0.2));
    inlet.position.set(-0.45, 0.66, 0); inlet.rotation.z = Math.PI / 2; this.cyanoGroup.add(inlet);
    const outlet = inlet.clone(); outlet.position.x = 7.25; this.cyanoGroup.add(outlet);
    const chipPipe = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(-0.8, 0.65, 0), new T.Vector3(-0.8, 1.5, 0), new T.Vector3(-1.3, 2.1, 0)]), 12, 0.08, 7, false), mat(0x79b7c8, 0.35, 0.3, true, 0.75));
    this.cyanoGroup.add(chipPipe);
    this.dropletGroup = new T.Group(); this.cyanoGroup.add(this.dropletGroup);
  }

  buildCells(mat) {
    const T = this.T;
    this.cellGroup = new T.Group();
    this.root.add(this.cellGroup);
    this.cellMeshes = new Map();
    for (let i = 0; i < 36; i++) {
      const material = mat(i % 5 === 0 ? 0xb6f5bc : 0x65dc9a, 0.25, 0.08, false, 1);
      const mesh = new T.Mesh(new T.TorusGeometry(0.16, 0.045, 7, 14), material);
      mesh.castShadow = true;
      mesh.userData = { cellId: `CELL-${String(i + 1).padStart(3, "0")}` };
      this.cellGroup.add(mesh);
      this.cellMeshes.set(mesh.userData.cellId, mesh);
    }
  }

  buildBubbles() {
    const T = this.T;
    const geometry = new T.BufferGeometry();
    const positions = new Float32Array(28 * 3);
    for (let i = 0; i < 28; i++) {
      positions[i * 3] = -3.4 + (noise(i + 2) - 0.5) * 3.4;
      positions[i * 3 + 1] = 0.6 + noise(i + 7) * 3.7;
      positions[i * 3 + 2] = (noise(i + 13) - 0.5) * 3.2;
    }
    geometry.setAttribute("position", new T.BufferAttribute(positions, 3));
    this.bubbles = new T.Points(geometry, new T.PointsMaterial({ color: 0xb3f4d5, size: 0.075, transparent: true, opacity: 0.65 }));
    this.algaeGroup.add(this.bubbles);
  }

  bind() {
    this.canvas.addEventListener("pointerdown", (e) => { this.pointer.down = true; this.pointer.moved = false; this.pointer.x = e.clientX; this.pointer.y = e.clientY; this.canvas.setPointerCapture?.(e.pointerId); });
    this.canvas.addEventListener("pointermove", (e) => {
      if (!this.pointer.down) return;
      const dx = e.clientX - this.pointer.x, dy = e.clientY - this.pointer.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) this.pointer.moved = true;
      this.orbit.theta -= dx * 0.008; this.orbit.phi = clamp(this.orbit.phi + dy * 0.008, 0.38, 1.5);
      this.pointer.x = e.clientX; this.pointer.y = e.clientY;
    });
    this.canvas.addEventListener("pointerup", (e) => { if (!this.pointer.moved) this.pick(e); this.pointer.down = false; this.canvas.releasePointerCapture?.(e.pointerId); });
    this.canvas.addEventListener("pointercancel", () => { this.pointer.down = false; });
    this.canvas.addEventListener("wheel", (e) => { e.preventDefault(); this.orbit.radius = clamp(this.orbit.radius + e.deltaY * 0.012, 6, 28); }, { passive: false });
    addEventListener("resize", () => this.resize());
  }

  pick(event) {
    const T = this.T;
    const rect = this.canvas.getBoundingClientRect();
    const pointer = new T.Vector2(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    const ray = new T.Raycaster(); ray.setFromCamera(pointer, this.camera);
    const hit = ray.intersectObjects([...this.cellMeshes.values()], false)[0];
    if (hit?.object?.userData?.cellId) this.hooks.onSelect?.(hit.object.userData.cellId);
  }

  resize() {
    const width = Math.max(1, this.canvas.clientWidth), height = Math.max(1, this.canvas.clientHeight);
    this.camera.aspect = width / height; this.camera.updateProjectionMatrix(); this.renderer.setSize(width, height, false);
  }

  setState(state) { this.state = state; this.mode = state.sim.mode; this.cameraName = state.sim.camera; this.applyVisibility(); }
  setMode(mode) { this.mode = mode; this.applyVisibility(); }
  setCamera(name) { this.cameraName = name; const presets = { laboratory: [0.6, 1.05, 18], algaephyte: [0.12, 1.05, 10], cyanoflow: [-0.42, 0.92, 10], cell: [0.35, 1.1, 6.6] }; const p = presets[name] || presets.laboratory; this.orbit.theta = p[0]; this.orbit.phi = p[1]; this.orbit.radius = p[2]; }

  applyVisibility() {
    this.algaeGroup.visible = this.mode !== "cyanoflow";
    this.cyanoGroup.visible = this.mode !== "algaephyte";
    if (this.mode === "cell") { this.algaeGroup.visible = true; this.cyanoGroup.visible = true; }
  }

  updateScene() {
    if (!this.state) return;
    const T = this.T, state = this.state, cells = state.cyano.cells;
    const healthColor = colorForHealth(state.algae.derived.health);
    this.statusLight.material.color.setHex(healthColor);
    this.liquid.material.color.setHex(state.algae.derived.health === "critical" ? 0x8c4f54 : 0x2a9b68);
    for (const cell of cells) {
      const mesh = this.cellMeshes.get(cell.id); if (!mesh) continue;
      if (cell.state === "lost" || cell.state === "multiplet") { mesh.visible = false; continue; }
      mesh.visible = true;
      const n = Number(cell.id.slice(-3));
      let x = -3.4 + (noise(n + 3) - 0.5) * 3.2, y = 1.05 + noise(n + 4) * 2.9, z = (noise(n + 5) - 0.5) * 2.9;
      if (["in-chip", "analyzed", "isolated"].includes(cell.state)) { x = 0.2 + cell.trajectory.channelProgress * 6.2; y = 0.98; z = (cell.trajectory.y - 0.5) * 2.25; }
      if (cell.state === "transferred") { x = -3.4 + (noise(n + 8) - 0.5) * 3.2; y = 1.05 + noise(n + 9) * 2.9; z = (noise(n + 10) - 0.5) * 2.9; }
      mesh.position.set(x, y + Math.sin(state.sim.visualTime / 7 + n) * 0.025, z);
      mesh.rotation.set(Math.sin(n) * 0.7, state.sim.visualTime / 8 + n, Math.cos(n) * 0.5);
      const selected = cell.id === state.cyano.selectedCellId;
      mesh.scale.setScalar(selected ? 1.8 : cell.morphology === "spiral" ? 1.0 : 0.8);
      mesh.material.color.setHex(selected ? 0xffd166 : cell.state === "isolated" ? 0x82d8ff : 0x65dc9a);
      mesh.material.emissive?.setHex(selected ? 0x7a5e1a : 0x063d24);
    }
    const drops = state.cyano.droplets.slice(0, 16);
    const dropKey = `${state.cyano.stage}|${drops.map((drop) => `${drop.id}:${drop.type}:${drop.cellId || ""}`).join(",")}`;
    if (dropKey !== this.lastDropKey) {
      while (this.dropletGroup.children.length) this.dropletGroup.remove(this.dropletGroup.children[0]);
      for (let i = 0; i < drops.length; i++) {
        const drop = drops[i];
        const sphere = new T.Mesh(new T.SphereGeometry(0.14, 12, 8), new T.MeshStandardMaterial({ color: drop.type === "single-cell" ? 0x64d9e6 : drop.type === "multiplet" ? 0xf0bd63 : 0x697f7a, transparent: true, opacity: 0.72 }));
        sphere.position.set(0.9 + (i % 8) * 0.85, 1.1, -1.2 + Math.floor(i / 8) * 1.9); this.dropletGroup.add(sphere);
      }
      this.lastDropKey = dropKey;
    }
    this.applyVisibility();
  }

  loop() {
    requestAnimationFrame(this.loop);
    this.updateScene();
    const o = this.orbit;
    this.camera.position.set(o.target.x + Math.cos(o.theta) * Math.sin(o.phi) * o.radius, o.target.y + Math.cos(o.phi) * o.radius, o.target.z + Math.sin(o.theta) * Math.sin(o.phi) * o.radius);
    this.camera.lookAt(o.target);
    if (this.bubbles && this.state) {
      const positions = this.bubbles.geometry.attributes.position.array;
      for (let i = 0; i < positions.length / 3; i++) { positions[i * 3 + 1] += 0.0009 * (this.state.sim.running ? this.state.sim.speed : 0); if (positions[i * 3 + 1] > 4.5) positions[i * 3 + 1] = 0.5; }
      this.bubbles.geometry.attributes.position.needsUpdate = true;
    }
    this.renderer.render(this.scene, this.camera);
  }

  destroy() { this.renderer.dispose(); }
}

class SoftwareLab3D {
  constructor(canvas, hooks) {
    this.canvas = canvas; this.ctx = canvas.getContext("2d"); this.hooks = hooks; this.state = null; this.mode = "overview"; this.cameraName = "laboratory"; this.drag = null;
    this.orbit = { theta: .54, phi: 1.03, radius: 14, target: { x: 0, y: 2, z: 0 } };
    this.resize(); addEventListener("resize", () => this.resize());
    canvas.addEventListener("pointerdown", (event) => { this.drag = { x: event.clientX, y: event.clientY, moved: false }; canvas.setPointerCapture?.(event.pointerId); });
    canvas.addEventListener("pointermove", (event) => { if (!this.drag) return; const dx = event.clientX - this.drag.x, dy = event.clientY - this.drag.y; if (Math.abs(dx) + Math.abs(dy) > 3) this.drag.moved = true; this.orbit.theta -= dx * .008; this.orbit.phi = clamp(this.orbit.phi + dy * .008, .34, 1.5); this.drag.x = event.clientX; this.drag.y = event.clientY; });
    canvas.addEventListener("pointerup", (event) => { if (this.drag && !this.drag.moved) this.pick(event); this.drag = null; canvas.releasePointerCapture?.(event.pointerId); });
     canvas.addEventListener("pointercancel", () => { this.drag = null; });
     canvas.addEventListener("wheel", (event) => { event.preventDefault(); this.orbit.radius = clamp(this.orbit.radius + event.deltaY * .012, 6, 28); }, { passive: false });
     canvas.addEventListener("keydown", (event) => { if (this.mode !== "expedition" || !["w", "a", "s", "d", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return; const direction = { x: 0, y: 0, depth: 0 }; if (event.key === "w" || event.key === "ArrowUp") direction.y = -1; if (event.key === "s" || event.key === "ArrowDown") direction.y = 1; if (event.key === "a" || event.key === "ArrowLeft") direction.x = -1; if (event.key === "d" || event.key === "ArrowRight") direction.x = 1; this.hooks.onMove?.(direction); event.preventDefault(); });
     this.loop = this.loop.bind(this); requestAnimationFrame(this.loop);
  }

  resize() { const rect = this.canvas.getBoundingClientRect(); this.dpr = Math.min(1.5, devicePixelRatio || 1); this.w = Math.max(1, rect.width); this.h = Math.max(1, rect.height); this.canvas.width = Math.round(this.w * this.dpr); this.canvas.height = Math.round(this.h * this.dpr); }
  setState(state) { this.state = state; this.mode = state.sim.mode; }
  setMode(mode) { this.mode = mode; }
  setCamera(name) { if (this.cameraName === name) { this.canvas.dataset.camera = name; return; } this.cameraName = name; const presets = { laboratory: [.9, 1.03, 14, 0, 2], expedition: [.75, .92, 15, 0, .5], algaephyte: [.9, 1.04, 9, -3.4, 2.5], cyanoflow: [1, .6, 9, 3.6, .6], cell: [.9, 1.08, 12, 0, 2] }; const preset = presets[name] || presets.laboratory; this.orbit.theta = preset[0]; this.orbit.phi = preset[1]; this.orbit.radius = preset[2]; this.orbit.target.x = preset[3]; this.orbit.target.y = preset[4]; this.canvas.dataset.camera = name; }
  setQuality(value) { this.low = value === 'low'; }

  cameraBasis() {
    const o = this.orbit, eye = { x: o.target.x + Math.cos(o.theta) * Math.sin(o.phi) * o.radius, y: o.target.y + Math.cos(o.phi) * o.radius, z: o.target.z + Math.sin(o.theta) * Math.sin(o.phi) * o.radius };
    const forward = normalize({ x: o.target.x - eye.x, y: o.target.y - eye.y, z: o.target.z - eye.z });
    const right = normalize(cross(forward, { x: 0, y: 1, z: 0 }));
    const up = cross(right, forward);
    return { eye, forward, right, up };
  }
  project(point) {
    const basis = this.cameraBasis(), relative = sub(point, basis.eye);
    const depth = dot(relative, basis.forward);
    if (depth < .1) return null;
    const scale = Math.min(this.w, this.h) * .86 / depth;
    return { x: this.w / 2 + dot(relative, basis.right) * scale, y: this.h * .51 - dot(relative, basis.up) * scale, depth, scale };
  }
  line(ctx, points, stroke, width = 1, alpha = 1) { const projected = points.map((point) => this.project(point)); if (projected.some((point) => !point)) return; ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(projected[0].x, projected[0].y); projected.slice(1).forEach((point) => ctx.lineTo(point.x, point.y)); ctx.stroke(); ctx.restore(); }
  polygon(ctx, points, fill, stroke = null, alpha = 1) { const projected = points.map((point) => this.project(point)); if (projected.some((point) => !point)) return; ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = fill; ctx.beginPath(); ctx.moveTo(projected[0].x, projected[0].y); projected.slice(1).forEach((point) => ctx.lineTo(point.x, point.y)); ctx.closePath(); ctx.fill(); if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); } ctx.restore(); }
  ellipse3d(ctx, point, radius, fill, stroke = null, alpha = 1) { const p = this.project(point); if (!p) return null; ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = fill; ctx.beginPath(); ctx.ellipse(p.x, p.y, radius * p.scale, radius * p.scale * .45, 0, 0, Math.PI * 2); ctx.fill(); if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); } ctx.restore(); return p; }

  drawFloor(ctx) {
    for (let i = -7; i <= 7; i++) { this.line(ctx, [{ x: i * 1.6, y: 0, z: -7 }, { x: i * 1.6, y: 0, z: 7 }], "#174332", 1, .55); this.line(ctx, [{ x: -11, y: 0, z: i * 1.1 }, { x: 11, y: 0, z: i * 1.1 }], "#174332", 1, .55); }
  }
  drawVessel(ctx, state) {
    const x = -3.4, radius = 2.05, bottom = .42, top = 5.0;
    const side = state?.algae?.derived?.health === "critical" ? "#8c4f54" : "#238b5d";
    this.polygon(ctx, [{ x: x - radius, y: bottom, z: -radius }, { x: x + radius, y: bottom, z: -radius }, { x: x + radius, y: top, z: -radius }, { x: x - radius, y: top, z: -radius }], side, "#80e8c1", .3);
    this.polygon(ctx, [{ x: x + radius, y: bottom, z: -radius }, { x: x + radius, y: bottom, z: radius }, { x: x + radius, y: top, z: radius }, { x: x + radius, y: top, z: -radius }], side, "#80e8c1", .23);
    this.polygon(ctx, [{ x: x - radius, y: bottom + .05, z: -radius }, { x: x + radius, y: bottom + .05, z: -radius }, { x: x + radius, y: bottom + .05, z: radius }, { x: x - radius, y: bottom + .05, z: radius }], "#1f8d5b", "#80e8c1", .48);
    this.line(ctx, [{ x: x - radius, y: top, z: -radius }, { x: x + radius, y: top, z: -radius }, { x: x + radius, y: top, z: radius }, { x: x - radius, y: top, z: radius }, { x: x - radius, y: top, z: -radius }], "#a9ffe0", 2, .85);
    for (let i = 0; i < 18; i++) { const px = x + (noise(i + 3) - .5) * 3.1, pz = (noise(i + 9) - .5) * 3.1, py = .75 + ((noise(i + 5) * 3.8 + (state?.sim?.visualTime || 0) * .002 * (i + 1)) % 3.8); this.ellipse3d(ctx, { x: px, y: py, z: pz }, .055 + noise(i + 11) * .045, "#c9ffda", null, .78); }
    for (const px of [x - radius - .1, x + radius + .1]) this.line(ctx, [{ x: px, y: .65, z: .15 }, { x: px, y: 4.8, z: .15 }], "#65eea5", 2, .75);
    this.line(ctx, [{ x, y: top, z: 0 }, { x, y: 6.1, z: 0 }, { x: 1, y: 6.1, z: 0 }, { x: 1.6, y: 4.3, z: 0 }], "#85b8a8", 3, .8);
    const status = this.project({ x: x - 2.65, y: 4.65, z: 0 }); if (status) { ctx.fillStyle = state.algae.derived.health === "critical" ? "#e57979" : state.algae.derived.health === "stressed" ? "#ffd166" : "#7ce2a0"; ctx.beginPath(); ctx.arc(status.x, status.y, 5, 0, Math.PI * 2); ctx.fill(); }
    const label = this.project({ x: x - 1.1, y: .02, z: 1.7 }); if (label) { ctx.fillStyle = "#c8ffdf"; ctx.font = "600 11px IBM Plex Mono, monospace"; ctx.fillText("ALGAEPHYTE VESSEL", label.x, label.y + 20); }
  }
  drawChip(ctx, state) {
    const x = 3.6, y = .52, z = 0, w = 7.2, d = 4.5;
    this.polygon(ctx, [{ x: x - w / 2, y, z: z - d / 2 }, { x: x + w / 2, y, z: z - d / 2 }, { x: x + w / 2, y, z: z + d / 2 }, { x: x - w / 2, y, z: z + d / 2 }], "#174f4b", "#79ead8", .55);
    this.polygon(ctx, [{ x: x - w / 2, y, z: z - d / 2 }, { x: x + w / 2, y, z: z - d / 2 }, { x: x + w / 2, y: y + .35, z: z - d / 2 }, { x: x - w / 2, y: y + .35, z: z - d / 2 }], "#24665d", "#89f4e0", .7);
    const channel = []; for (let i = 0; i <= 18; i++) channel.push({ x: x - 2.8 + i * .31, y: y + .43, z: Math.sin(i * .65) * .65 }); this.line(ctx, channel, "#9af9e8", 5, .86);
    for (let i = 0; i < 4; i++) this.ellipse3d(ctx, { x: x - 2 + i * 1.35, y: y + .45, z: 0 }, .38, "rgba(78,204,190,.32)", "#9af9e8", .9);
    const progress = state?.cyano?.processingProgress || 0; this.ellipse3d(ctx, { x: x - 2.8 + progress * 5.6, y: y + .5, z: 0 }, .17, "#7be8da", null, 1);
    const label = this.project({ x: x - 2.3, y: .03, z: 2.4 }); if (label) { ctx.fillStyle = "#c8ffef"; ctx.font = "600 11px IBM Plex Mono, monospace"; ctx.fillText("CYANOFLOW · MICROFLUIDIC CHIP", label.x, label.y + 22); }
  }
  expeditionPoint(position, world) {
    const width = world?.dimensions?.widthM || 1000, height = world?.dimensions?.heightM || 760, depth = world?.dimensions?.maxDepthM || 80;
    return { x: (position.x / width - .5) * 17.2, y: 3.05 - (position.z / depth) * 5.45, z: (position.y / height - .5) * 9.4 };
  }
  drawExpedition(ctx, state) {
    const expedition = state.expedition; if (!expedition?.world) return;
    const colors = { freshwater: ["#2b8f77", "#133d3a"], marine: ["#2b718d", "#102d45"], sediment: ["#97734d", "#342b26"], terrestrial: ["#647b43", "#253122"] };
    const [accent, deep] = colors[expedition.environmentType] || colors.freshwater;
    this.polygon(ctx, [{ x: -9, y: -2.8, z: -5.5 }, { x: 9, y: -2.8, z: -5.5 }, { x: 9, y: 3.4, z: -5.5 }, { x: -9, y: 3.4, z: -5.5 }], deep, accent, .9);
    for (let i = 0; i < 11; i++) this.line(ctx, [{ x: -9, y: -2.7 + i * .56, z: -5.48 }, { x: 9, y: -2.7 + i * .56, z: -5.48 }], accent, 1, .2);
    expedition.world.regions.forEach((region, index) => {
      const p = this.expeditionPoint(region.position, expedition.world);
      this.ellipse3d(ctx, { ...p, y: -2.3 }, .75 + index * .15, accent, null, .25);
      const label = this.project({ ...p, y: -2.15 }); if (label) { ctx.fillStyle = "rgba(207,244,228,.48)"; ctx.font = "9px IBM Plex Mono, monospace"; ctx.fillText(region.name.toUpperCase(), label.x - 38, label.y); }
    });
    const hits = [];
    expedition.world.hotspots.forEach((hotspot) => {
      const p = this.expeditionPoint(hotspot.position, expedition.world);
      const selected = hotspot.id === expedition.selectedHotspotId;
      const color = selected ? "#ffd166" : hotspot.visited ? "#83c6bd" : "#78e3d3";
      const marker = this.ellipse3d(ctx, p, selected ? .25 : .17, color, selected ? "#fff0aa" : null, .95);
      if (marker) {
        ctx.save(); ctx.strokeStyle = color; ctx.globalAlpha = selected ? .9 : .48; ctx.lineWidth = selected ? 2 : 1; ctx.beginPath(); ctx.arc(marker.x, marker.y, Math.max(8, marker.scale * (selected ? .42 : .28)), 0, Math.PI * 2); ctx.stroke(); ctx.restore();
        hits.push({ id: hotspot.id, x: marker.x, y: marker.y, radius: Math.max(13, marker.scale * .25) });
      }
    });
    this.ellipse3d(ctx, this.expeditionPoint(expedition.probe.position, expedition.world), .36, "#d7e6d5", "#ffd166", .98);
    const probe = this.project(this.expeditionPoint(expedition.probe.position, expedition.world));
    if (probe) { ctx.save(); ctx.strokeStyle = "#73e6d7"; ctx.globalAlpha = .45; ctx.beginPath(); ctx.moveTo(probe.x - 16, probe.y); ctx.lineTo(probe.x + 16, probe.y); ctx.moveTo(probe.x, probe.y - 16); ctx.lineTo(probe.x, probe.y + 16); ctx.stroke(); ctx.restore(); }
    ctx.fillStyle = "#c8ffef"; ctx.font = "600 11px IBM Plex Mono, monospace"; ctx.fillText(`PHYCOFRONTIER · ${expedition.environment.label.toUpperCase()}`, 18, 26);
    ctx.fillStyle = "rgba(204,244,225,.62)"; ctx.font = "9px IBM Plex Mono, monospace"; ctx.fillText("ARROW KEYS / WASD · SELECT HOTSPOT · SYNTHETIC WORLD", 18, this.h - 18);
    this.hitHotspots = hits;
  }
  drawCells(ctx, state) {
    const hits = [];
    for (const cell of state.cyano.cells) {
      if (["lost", "filtered-out", "multiplet"].includes(cell.state)) continue;
      const n = Number(cell.id.slice(-3)); let point = { x: -3.4 + (noise(n + 3) - .5) * 3.2, y: 1 + noise(n + 4) * 3.5, z: (noise(n + 5) - .5) * 3.1 };
      if (["in-chip", "analyzed", "isolated"].includes(cell.state)) point = { x: .3 + cell.trajectory.channelProgress * 6.2, y: 1.05, z: (cell.trajectory.y - .5) * 2.25 };
      if (cell.state === "transferred") point = { x: -3.4 + (noise(n + 8) - .5) * 3.2, y: 1 + noise(n + 9) * 3.5, z: (noise(n + 10) - .5) * 3.1 };
      const p = this.ellipse3d(ctx, point, cell.id === state.cyano.selectedCellId ? .2 : .11, cell.id === state.cyano.selectedCellId ? "#ffd166" : cell.state === "isolated" ? "#82d8ff" : "#76e6a5", cell.id === state.cyano.selectedCellId ? "#fff2b4" : null, .95);
      if (p) { hits.push({ id: cell.id, x: p.x, y: p.y, radius: Math.max(8, p.scale * .2) }); if (cell.id === state.cyano.selectedCellId) { ctx.save(); ctx.strokeStyle = "#ffd166"; ctx.globalAlpha = .75; ctx.beginPath(); ctx.arc(p.x, p.y, 12, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); } }
    }
    this.hitCells = hits;
  }
  drawCellInspection(ctx, state) {
    if (this.cameraName !== "cell") return;
    const cell = state.cyano.cells.find((item) => item.id === state.cyano.selectedCellId);
    if (!cell) return;
    const cx = this.w - 104, cy = 104, radius = Math.min(72, this.h * .18);
    ctx.save();
    ctx.fillStyle = "rgba(3, 16, 14, .82)";
    ctx.beginPath(); ctx.arc(cx, cy, radius + 15, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(114, 222, 213, .62)"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = "rgba(114, 222, 213, .22)";
    ctx.beginPath(); ctx.moveTo(cx - radius, cy); ctx.lineTo(cx + radius, cy); ctx.moveTo(cx, cy - radius); ctx.lineTo(cx, cy + radius); ctx.stroke();
    ctx.translate(cx, cy); ctx.scale(radius * .75, radius * .75); ctx.rotate(cell.morphology === "spiral" ? -.25 : .15);
    ctx.strokeStyle = cell.eligibleCandidate ? "#ffd166" : "#82d8ff"; ctx.fillStyle = "rgba(130, 216, 255, .18)"; ctx.lineWidth = .055;
    if (cell.morphology === "spiral") {
      ctx.beginPath();
      for (let i = 0; i <= 34; i++) { const t = i / 34 * Math.PI * 3.2; const x = Math.cos(t) * (.1 + i / 34 * .76); const y = Math.sin(t) * (.1 + i / 34 * .76); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
      ctx.stroke();
    } else {
      ctx.beginPath(); ctx.ellipse(0, 0, cell.morphology === "rod" ? .92 : .72, cell.morphology === "coccus" ? .62 : .48, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = "#c8ffef"; ctx.font = "600 10px IBM Plex Mono, monospace"; ctx.fillText(`MICROSCOPE · ${cell.id}`, this.w - 180, cy + radius + 31);
    ctx.fillStyle = "rgba(204,244,225,.65)"; ctx.font = "9px IBM Plex Mono, monospace"; ctx.fillText(`${cell.morphology} · ${cell.sizeUm.toFixed(2)} µm · synthetic`, this.w - 180, cy + radius + 45);
  }
  drawText(ctx) { ctx.fillStyle = "rgba(204,244,225,.62)"; ctx.font = "10px IBM Plex Mono, monospace"; ctx.fillText("SOFTWARE 3D · SYNTHETIC LAB VIEW · NO HARDWARE LINK", 18, this.h - 18); }
  pick(event) { const rect = this.canvas.getBoundingClientRect(), x = event.clientX - rect.left, y = event.clientY - rect.top; if (this.mode === "expedition") { const hit = (this.hitHotspots || []).map((item) => ({ ...item, d: Math.hypot(item.x - x, item.y - y) })).sort((a, b) => a.d - b.d)[0]; if (hit && hit.d < Math.max(24, hit.radius * 2)) this.hooks.onHotspot?.(hit.id); return; } const hit = (this.hitCells || []).map((item) => ({ ...item, d: Math.hypot(item.x - x, item.y - y) })).sort((a, b) => a.d - b.d)[0]; if (hit && hit.d < Math.max(20, hit.radius * 2)) this.hooks.onSelect?.(hit.id); }
  loop() { requestAnimationFrame(this.loop); const ctx = this.ctx; ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); ctx.clearRect(0, 0, this.w, this.h); const gradient = ctx.createLinearGradient(0, 0, 0, this.h); gradient.addColorStop(0, "#0a211b"); gradient.addColorStop(1, "#06100f"); ctx.fillStyle = gradient; ctx.fillRect(0, 0, this.w, this.h); const state = this.state; if (!state) return; if (this.mode === "expedition") { this.drawExpedition(ctx, state); return; } this.drawFloor(ctx); if (this.mode !== "cyanoflow") this.drawVessel(ctx, state); if (this.mode !== "algaephyte") this.drawChip(ctx, state); this.drawCells(ctx, state); this.drawCellInspection(ctx, state); this.drawText(ctx); }
}

function sub(a, b) { return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }; }
function cross(a, b) { return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x }; }
function dot(a, b) { return a.x * b.x + a.y * b.y + a.z * b.z; }
function normalize(a) { const length = Math.hypot(a.x, a.y, a.z) || 1; return { x: a.x / length, y: a.y / length, z: a.z / length }; }
