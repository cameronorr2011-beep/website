import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const presets = {
  laboratory: { eye: [11, 10, 15], target: [0, 2, 0] },
  algaephyte: { eye: [3, 6, 10], target: [-2.6, 3, 0] },
  cyanoflow: { eye: [3, 9, 6], target: [3, 1, .4] },
  cell: { eye: [0, 3, 7], target: [0, 3, 0] },
};
const point = (p) => new T.Vector3(...p);
const material = (color, extra = {}) => new T.MeshStandardMaterial({ color, roughness: .48, metalness: .12, ...extra });

export class WebGLLab {
  constructor(canvas, hooks) {
    this.canvas = canvas; this.hooks = hooks; this.state = null;
    this.controller = new AbortController(); this.cells = new Map(); this.textures = new Set();
    this.pickables = []; this.cameraName = null; this.low = false; this.disposed = false;
    this.renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'low-power' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.5;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.scene = new T.Scene(); this.scene.background = new T.Color('#12251f');
    this.scene.fog = new T.Fog('#12251f', 24, 52);
    this.camera = new T.PerspectiveCamera(40, 1, .05, 80);
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true; this.controls.dampingFactor = .09;
    this.controls.minDistance = 2; this.controls.maxDistance = 30;
    this.controls.maxPolarAngle = Math.PI * .49;
    this.controls.addEventListener('start', () => { this.transition = null; });
    this.lab = new T.Group(); this.scene.add(this.lab);
    this.inspector = new T.Group(); this.inspector.visible = false; this.scene.add(this.inspector);
    this.scene.add(new T.HemisphereLight(0xe5f4e7, 0x24382d, 2.4));
    const key = new T.DirectionalLight(0xfff4dc, 3.2); key.position.set(-5, 12, 8);
    key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, { left: -12, right: 12, top: 10, bottom: -10 });
    key.shadow.bias = -.001; this.scene.add(key);
    const fill = new T.DirectionalLight(0xb4e9ee, 1.5); fill.position.set(8, 6, -5); this.scene.add(fill);
    this.buildLab(); this.bind(); this.setCamera('laboratory', true); this.resize();
    this.observer = new ResizeObserver(() => this.resize()); this.observer.observe(canvas);
    this.frame = this.frame.bind(this); this.frameId = requestAnimationFrame(this.frame);
    canvas.dataset.renderer = 'webgl';
  }

  mesh(geometry, mat, position, parent = this.lab, label) {
    const mesh = new T.Mesh(geometry, mat); mesh.position.set(...position);
    mesh.castShadow = !mat.transparent; mesh.receiveShadow = !mat.transparent;
    parent.add(mesh);
    if (label) { mesh.userData.label = label; this.pickables.push(mesh); }
    return mesh;
  }
  box(size, mat, pos, parent, label) { return this.mesh(new T.BoxGeometry(...size), mat, pos, parent, label); }
  cylinder(radius, height, mat, pos, parent, label) { return this.mesh(new T.CylinderGeometry(radius, radius, height, 40), mat, pos, parent, label); }
  tube(points, radius, mat, parent = this.lab) {
    const curve = new T.CatmullRomCurve3(points.map(point));
    return this.mesh(new T.TubeGeometry(curve, 48, radius, 8, false), mat, [0, 0, 0], parent);
  }
  label(text, position, color = '#dcece2', width = 2.5, parent = this.lab) {
    const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 90;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = 'rgba(9,26,21,.93)'; ctx.fillRect(0, 0, 640, 90);
    ctx.fillStyle = color; ctx.font = '500 30px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 320, 45);
    const texture = new T.CanvasTexture(canvas); texture.colorSpace = T.SRGBColorSpace; this.textures.add(texture);
    const sprite = new T.Sprite(new T.SpriteMaterial({ map: texture, depthTest: false }));
    sprite.position.set(...position); sprite.scale.set(width, width * 90 / 640, 1); parent.add(sprite);
    return sprite;
  }

  buildLab() {
    const steel = material('#a2b9ad', { metalness: .75, roughness: .3 });
    const dark = material('#243a31'); const white = material('#c2cec0', { roughness: .7 });
    const glass = material('#b7e7d8', { transparent: true, opacity: .18, depthWrite: false, roughness: .1, side: T.DoubleSide });
    const hose = material('#bad2c6', { transparent: true, opacity: .6 });
    this.box([17, .35, 9], material('#344c41'), [0, .25, 0]);
    this.box([17.2, .1, 9.2], material('#5e7565', { roughness: .8 }), [0, .48, 0]);
    for (const x of [-6.8, 6.8]) this.box([.3, 2.8, .3], steel, [x, -1.3, 2.8]);
    const grid = new T.GridHelper(32, 32, '#344c40', '#20382c'); grid.position.y = -2.8; this.lab.add(grid);

    // Algaephyte: glass column, liquid, sparger, probe, lid, LED rails, pump.
    this.cylinder(1.52, .28, steel, [-2.6, .7, 0], undefined, 'Algaephyte · 18 L culture model').userData.focus = 'algaephyte';
    this.liquid = this.cylinder(1.24, 3.25, material('#368c51', { transparent: true, opacity: .65, depthWrite: false }), [-2.6, 2.48, 0]);
    this.cylinder(1.32, 4, glass, [-2.6, 2.9, 0]);
    for (const y of [.96, 4.88]) {
      const ring = this.mesh(new T.TorusGeometry(1.33, .055, 8, 60), steel, [-2.6, y, 0]); ring.rotation.x = Math.PI / 2;
    }
    this.cylinder(1.4, .15, steel, [-2.6, 5, 0]);
    this.cylinder(.075, 3.4, steel, [-2.2, 4, .45], undefined, 'Synthetic pH / temperature probe');
    this.cylinder(.12, .42, material('#546968'), [-2.2, 5.8, .45]);
    for (const x of [-4.12, -1.08]) {
      this.box([.16, 4.2, .3], dark, [x, 2.9, -.2]);
      this.box([.035, 3.85, .18], material('#dfedbd', { emissive: '#6b8657', emissiveIntensity: .45 }), [x + (x < -2 ? .09 : -.09), 2.9, -.2]);
    }
    for (let i = 0; i < 6; i++) this.box([.2, .018, .025], steel, [-2.2, 1.3 + i * .5, 1.23]);
    this.label('ALGAEPHYTE  /  18 L', [-2.6, .64, 2], '#c3e4aa', 2.8);
    this.box([1.5, .8, 1.4], white, [-5.4, 1, .3], undefined, 'Aeration & circulation · simulated only').userData.focus = 'algaephyte';
    const pump = this.cylinder(.38, .22, dark, [-5.4, 1.05, 1.02]); pump.rotation.x = Math.PI / 2;
    this.tube([[-5.4, 1.3, .3], [-5.4, 3, -.8], [-3.5, 5.65, -.5], [-2.9, 5.2, -.3]], .06, hose);
    this.tube([[-2.9, 5.2, -.3], [-2.9, 2, -.3], [-2.6, 1.15, 0]], .045, hose);
    this.cylinder(.8, .08, steel, [-2.6, 1.08, 0]);
    const bubbles = new T.InstancedMesh(new T.SphereGeometry(.04, 8, 6), material('#d0eedc', { transparent: true, opacity: .6 }), 40);
    this.lab.add(bubbles); this.bubbles = bubbles; this.matrix = new T.Object3D();
    this.status = this.mesh(new T.SphereGeometry(.1, 10, 8), material('#a8d773', { emissive: '#446d27' }), [-5, 1.46, .9]);

    // Preparation station: two sample vials and a filter holder connected to chip.
    for (let i = 0; i < 3; i++) {
      this.cylinder(.24, 1, glass, [.3 + i * .65, 1.15, -2.6]);
      this.cylinder(.21, .55, material(i === 2 ? '#73a993' : '#839953', { transparent: true, opacity: .65 }), [.3 + i * .65, .92, -2.6]);
      this.cylinder(.26, .14, i === 2 ? steel : dark, [.3 + i * .65, 1.73, -2.6]);
    }
    this.box([2.3, .15, .8], dark, [.95, .65, -2.6], undefined, 'Sample preparation · filtration loss is modeled').userData.focus = 'cyanoflow';
    this.label('01  SAMPLE → PREP', [1, 2.25, -2.6], '#c5dacb', 2.5);
    this.tube([[1.6, 1.8, -2.6], [1.6, 2.1, -1.9], [.9, 1.1, -1.1], [.7, .9, .4]], .045, hose);

    // Magnified chip; dimensions are deliberately schematic, not physical CFD.
    this.chip = new T.Group(); this.chip.position.set(3, 0, .4); this.lab.add(this.chip);
    this.box([5, .22, 3.6], dark, [0, .68, 0], this.chip, 'Cyanoflow · magnified microfluidic chip').userData.focus = 'cyanoflow';
    this.box([4.8, .14, 3.4], material('#9cc8c0', { transparent: true, opacity: .35, depthWrite: false }), [0, .9, 0], this.chip);
    this.channel = new T.CatmullRomCurve3([[-2.3,.99,0],[-1.6,.99,0],[-1.3,.99,-.9],[-.7,.99,-.9],[-.4,.99,.85],[.25,.99,.85],[.6,.99,0],[1,.99,0],[1.7,.99,0]].map(point));
    this.mesh(new T.TubeGeometry(this.channel, 100, .068, 8, false), material('#80d2d2', { roughness: .25 }), [0, 0, 0], this.chip);
    this.tube([[.65, .99, -1.6], [.65, .99, -.6], [1, .99, 0]], .05, material('#c4dddb'), this.chip);
    this.tube([[1, .99, 0], [1.6, .99, 1], [2.25, .99, 1]], .05, material('#75b6bb'), this.chip);
    for (let i = 0; i < 12; i++) {
      const x = .8 + (i % 4) * .42, z = -1.23 + Math.floor(i / 4) * .38;
      this.cylinder(.15, .055, material('#314f50'), [x, 1.05, z], this.chip);
    }
    this.label('02  CYANOFLOW / CHIP ENLARGED', [3, .65, 2.7], '#bce9e4', 3.7);
    this.drops = new T.Group(); this.chip.add(this.drops); this.dropKey = '';

    // Microscope and inspection stage provide a selectable entry to single cells.
    const stand = this.box([1.8, .25, 1.4], white, [6.2, .7, -2], undefined, 'Cell inspector · select a candidate first'); stand.userData.focus = 'cell';
    this.box([.28, 2.3, .38], steel, [6.8, 1.8, -2.3]);
    this.box([1.5, .16, 1.05], dark, [6.1, 1.6, -2]);
    const scope = this.cylinder(.32, 1.4, white, [6.1, 2.7, -2]); scope.rotation.z = -.18;
    this.cylinder(.14, .55, steel, [5.97, 1.96, -2]);
    this.label('03  SINGLE-CELL INSPECTION', [6, 3.8, -2], '#d4ddd1', 3);
  }

  cellMesh(cell, inspect = false) {
    const group = new T.Group();
    const green = material('#92c66d', { roughness: .3, metalness: .02 });
    const membrane = material('#b5dca8', { transparent: true, opacity: .3, depthWrite: false, roughness: .2 });
    if (cell.morphology === 'spiral') {
      const n = inspect ? 38 : 16;
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1), angle = t * Math.PI * 5;
        const bead = new T.Mesh(new T.SphereGeometry(.11, inspect ? 16 : 8, 8), green);
        bead.position.set((t - .5) * 1.7, Math.sin(angle) * .23, Math.cos(angle) * .23); group.add(bead);
      }
    } else {
      const body = new T.Mesh(new T.SphereGeometry(.53, inspect ? 40 : 12, inspect ? 28 : 8), membrane); group.add(body);
      const core = new T.Mesh(new T.SphereGeometry(.43, 20, 12), green); group.add(core);
      group.scale.set(cell.morphology === 'rod' ? 1.6 : 1, cell.morphology === 'coccus' ? 1 : .7, .8);
      if (inspect) {
        for (let i = 0; i < 6; i++) {
          const organelle = new T.Mesh(new T.SphereGeometry(.06, 14, 10), material('#dce7af'));
          organelle.position.set(Math.sin(i * 3) * .24, Math.cos(i * 5) * .2, .32); group.add(organelle);
        }
      }
    }
    group.userData = { cellId: cell.id, label: `${cell.id} · ${cell.morphology} · ${cell.sizeUm.toFixed(2)} µm (synthetic)` };
    return group;
  }

  refreshPopulation() {
    const key = this.state.seed + this.state.cyano.cells.map(c => c.id + c.morphology).join();
    if (this.populationKey === key) return;
    for (const mesh of this.cells.values()) { this.lab.remove(mesh); this.disposeGroup(mesh); }
    this.cells.clear(); this.populationKey = key;
    for (const cell of this.state.cyano.cells.slice(0, 100)) {
      const mesh = this.cellMesh(cell); this.cells.set(cell.id, mesh); this.lab.add(mesh);
    }
  }
  update() {
    const s = this.state; if (!s) return;
    this.refreshPopulation();
    const time = s.sim.clock / 60;
    this.liquid.material.color.set(s.algae.derived.health === 'critical' ? '#8c804c' : '#398953');
    this.liquid.material.opacity = Math.min(.86, .45 + s.algae.biomassG / s.algae.volumeL * 2);
    this.status.material.color.set(s.algae.derived.health === 'critical' ? '#d87963' : s.sim.running ? '#98d883' : '#d0b76e');
    for (let i = 0; i < 40; i++) {
      const angle = i * 2.4, r = .22 + (i % 7) * .115;
      this.matrix.position.set(-2.6 + Math.cos(angle) * r, 1.2 + ((i * .293 + time * .1) % 2.8), Math.sin(angle) * r);
      this.matrix.updateMatrix(); this.bubbles.setMatrixAt(i, this.matrix.matrix);
    }
    this.bubbles.instanceMatrix.needsUpdate = true;
    s.cyano.cells.forEach((cell, i) => {
      const mesh = this.cells.get(cell.id); if (!mesh) return;
      mesh.visible = !['filtered-out', 'lost', 'multiplet'].includes(cell.state);
      const r = .2 + (i % 5) * .14, angle = i * 2.4 + time * .04;
      if (cell.state === 'transferred') mesh.position.set(-2.6 + Math.cos(angle) * r, 1.5 + (i % 7) * .33, Math.sin(angle) * r);
      else if (cell.state === 'unprocessed') mesh.position.set(.3, 1.02 + (i % 5) * .05, -2.6 + (i % 3 - 1) * .06);
      else if (cell.state === 'isolated') mesh.position.set(3.8 + (i % 4) * .42, 1.16, -.83 + Math.floor(i / 4) % 3 * .38);
      else {
        const progress = Math.max(0, Math.min(1, cell.trajectory.channelProgress - (i % 8) * .025));
        mesh.position.copy(this.channel.getPoint(progress)).add(this.chip.position); mesh.position.y += .1;
      }
      mesh.rotation.set(0, angle, .15);
      mesh.scale.setScalar(cell.state === 'transferred' ? .25 : cell.state === 'unprocessed' ? .1 : .15);
    });
    const selected = s.cyano.cells.find(c => c.id === s.cyano.selectedCellId);
    if (selected && this.inspectorKey !== s.seed + selected.id) {
      this.disposeGroup(this.inspector); this.inspector.clear();
      const model = this.cellMesh(selected, true); model.position.set(0, 3, 0); model.scale.multiplyScalar(2.2); this.inspector.add(model);
      this.label(`${selected.id}  /  ${selected.morphology.toUpperCase()}  /  ${selected.sizeUm.toFixed(2)} µm`, [0, 1.4, 0], '#deebd8', 4, this.inspector);
      this.label('SYNTHETIC MORPHOLOGY · BIOCHEMISTRY UNKNOWN', [0, 1.07, 0], '#afc9b8', 4, this.inspector);
      this.inspectorKey = s.seed + selected.id;
    }
    const dropKey = s.seed + s.cyano.droplets.length;
    if (dropKey !== this.dropKey) {
      this.disposeGroup(this.drops); this.drops.clear();
      s.cyano.droplets.slice(0, 40).forEach((drop, i) => {
        this.mesh(new T.SphereGeometry(.08, 12, 8), material(drop.type === 'multiplet' ? '#d4ad6b' : '#a1d5de', { transparent: true, opacity: .5 }),
          [-1.95 + (i % 20) * .21, 1.12, 1.15 + Math.floor(i / 20) * .22], this.drops);
      });
      this.dropKey = dropKey;
    }
  }

  setState(state) { this.state = state; }
  setMode() {}
  setQuality(value) {
    this.low = value === 'low'; this.renderer.setPixelRatio(this.low ? 1 : Math.min(devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = !this.low; this.resize();
  }
  setCamera(name, instant = false) {
    if (name === this.cameraName) return;
    this.cameraName = name; this.lab.visible = name !== 'cell'; this.inspector.visible = name === 'cell';
    const p = presets[name] || presets.laboratory;
    if (instant || matchMedia('(prefers-reduced-motion: reduce)').matches) { this.camera.position.copy(point(p.eye)); this.controls.target.copy(point(p.target)); this.controls.update(); }
    else this.transition = { eye: point(p.eye), target: point(p.target) };
    this.canvas.dataset.camera = name;
  }
  resize() {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); this.renderer.setSize(w, h, false);
  }
  hit(event) {
    const r = this.canvas.getBoundingClientRect();
    const ray = new T.Raycaster(); ray.setFromCamera(new T.Vector2((event.clientX - r.left) / r.width * 2 - 1, -(event.clientY - r.top) / r.height * 2 + 1), this.camera);
    const hits = ray.intersectObjects([...this.cells.values(), ...this.pickables].filter(m => m.visible), true);
    let obj = hits[0]?.object;
    while (obj && !obj.userData.label) obj = obj.parent;
    return obj?.userData;
  }
  bind() {
    const options = { signal: this.controller.signal };
    this.canvas.addEventListener('pointerdown', e => { this.down = [e.clientX, e.clientY]; }, options);
    this.canvas.addEventListener('pointerup', e => {
      if (!this.down || Math.hypot(e.clientX - this.down[0], e.clientY - this.down[1]) > 5) return;
      const hit = this.hit(e); if (hit?.cellId) this.hooks.onSelect?.(hit.cellId); else if (hit?.focus) this.hooks.onFocus?.(hit.focus);
    }, options);
    this.canvas.addEventListener('pointermove', e => { this.canvas.title = this.hit(e)?.label || 'Drag to orbit · right-drag to pan · scroll to zoom'; }, options);
    this.canvas.addEventListener('keydown', e => {
      const p = this.camera.position;
      if (e.key === 'ArrowLeft') p.x -= .5;
      else if (e.key === 'ArrowRight') p.x += .5;
      else if (e.key === 'ArrowUp') p.y += .5;
      else if (e.key === 'ArrowDown') p.y -= .5;
      else if (['+', '='].includes(e.key)) p.lerp(this.controls.target, .1);
      else if (e.key === '-') p.sub(this.controls.target).multiplyScalar(1.1).add(this.controls.target);
      else return;
      this.transition = null; e.preventDefault(); this.controls.update();
    }, options);
    this.canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); this.hooks.onContextLost?.(); }, options);
  }
  frame(now) {
    if (this.disposed) return;
    this.frameId = requestAnimationFrame(this.frame);
    if (document.hidden || (this.low && now - (this.last || 0) < 33)) return;
    this.last = now;
    if (this.transition) {
      this.camera.position.lerp(this.transition.eye, .09); this.controls.target.lerp(this.transition.target, .09);
      if (this.camera.position.distanceTo(this.transition.eye) < .02) this.transition = null;
    }
    this.controls.update(); this.update(); this.renderer.render(this.scene, this.camera);
    this.canvas.dataset.drawCalls = String(this.renderer.info.render.calls);
  }
  disposeGroup(group) {
    const geometries = new Set(), materials = new Set();
    group.traverse(o => { if (o.geometry) geometries.add(o.geometry); if (o.material) materials.add(o.material); });
    geometries.forEach(g => g.dispose()); materials.forEach(m => { if (m.map) { m.map.dispose(); this.textures.delete(m.map); } m.dispose(); });
  }
  destroy() {
    this.disposed = true; cancelAnimationFrame(this.frameId); this.controller.abort(); this.observer.disconnect();
    this.controls.dispose(); this.disposeGroup(this.scene); this.textures.forEach(t => t.dispose()); this.renderer.dispose();
  }
}
