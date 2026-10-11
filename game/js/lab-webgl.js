import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const presets = {
  laboratory: { eye: [11, 10, 15], target: [0, 2, 0] },
  algaephyte: { eye: [3, 6, 10], target: [-2.6, 3, 0] },
  cyanoflow: { eye: [3, 9, 6], target: [3, 1, .4] },
  cell: { eye: [0, 3, 7], target: [0, 3, 0] },
  expedition: { eye: [10, 8.5, 13], target: [0, .7, 0] },
};
const ENVIRONMENT_RANGES = { freshwater: 180, marine: 195, sediment: 125, terrestrial: 110 };
const point = (p) => new T.Vector3(...p);
const material = (color, extra = {}) => new T.MeshStandardMaterial({ color, roughness: .48, metalness: .12, ...extra });

export class WebGLLab {
  constructor(canvas, hooks) {
    this.canvas = canvas; this.hooks = hooks; this.state = null;
    this.controller = new AbortController(); this.cells = new Map(); this.textures = new Set();
    this.pickables = []; this.cameraName = null; this.low = false; this.disposed = false;
    this.animTime = 0; this.environmentLights = []; this.environmentIndicators = [];
    this.expeditionKey = ''; this.expeditionPickables = []; this.expeditionMarkers = new Map();
    this.renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'low-power' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.5;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.scene = new T.Scene(); this.scene.background = new T.Color('#081510');
    this.scene.fog = new T.Fog('#081510', 24, 52);
    this.camera = new T.PerspectiveCamera(40, 1, .05, 80);
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true; this.controls.dampingFactor = .09;
    this.controls.minDistance = 2; this.controls.maxDistance = 30;
    this.controls.maxPolarAngle = Math.PI * .49;
    this.controls.addEventListener('start', () => { this.transition = null; });
    this.lab = new T.Group(); this.scene.add(this.lab);
    this.inspector = new T.Group(); this.inspector.visible = false; this.scene.add(this.inspector);
    this.scene.add(new T.HemisphereLight(0xd9eee5, 0x101d19, 2.1));
    const key = new T.DirectionalLight(0xfff2d5, 3.6); key.position.set(-5, 12, 8);
    key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, { left: -12, right: 12, top: 10, bottom: -10 });
    key.shadow.bias = -.001; this.scene.add(key);
    const fill = new T.DirectionalLight(0x9ee8e5, 1.8); fill.position.set(8, 6, -5); this.scene.add(fill);
    const cyan = new T.PointLight(0x5de4d3, 4.5, 13); cyan.position.set(3, 4, 2); this.scene.add(cyan);
    const green = new T.PointLight(0x8bd47a, 3.2, 10); green.position.set(-3, 3, 1); this.scene.add(green);
    this.buildLab(); this.buildExpedition(); this.bind(); this.setCamera('laboratory', true); this.resize();
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
  box(size, mat, pos, parent, label) { const radius = Math.min(.1, ...size.map((value) => value / 5)); return this.mesh(new RoundedBoxGeometry(...size, radius, 3), mat, pos, parent, label); }
  cylinder(radius, height, mat, pos, parent, label) { return this.mesh(new T.CylinderGeometry(radius, radius, height, 40), mat, pos, parent, label); }
  tube(points, radius, mat, parent = this.lab) {
    const curve = new T.CatmullRomCurve3(points.map(point));
    return this.mesh(new T.TubeGeometry(curve, 48, radius, 8, false), mat, [0, 0, 0], parent);
  }
  label(text, position, color = '#dcece2', width = 2.5, parent = this.lab) {
    const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 90;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = 'rgba(4,15,12,.92)'; ctx.font = '600 27px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(4,15,12,.9)'; ctx.strokeText(text, 320, 45); ctx.fillStyle = color; ctx.fillText(text, 320, 45);
    const texture = new T.CanvasTexture(canvas); texture.colorSpace = T.SRGBColorSpace; this.textures.add(texture);
    const sprite = new T.Sprite(new T.SpriteMaterial({ map: texture, depthTest: false }));
    sprite.position.set(...position); sprite.scale.set(width, width * 90 / 640, 1); parent.add(sprite);
    return sprite;
  }

  buildLab() {
    const steel = material('#657a73', { metalness: .82, roughness: .25 });
    const dark = material('#162520'); const white = material('#d3ddd0', { roughness: .52 });
    const glass = new T.MeshPhysicalMaterial({ color: '#9ed9ca', transparent: true, opacity: .24, depthWrite: false, roughness: .08, metalness: .05, transmission: .18, thickness: .7, clearcoat: .8, side: T.DoubleSide });
    const hose = material('#bad2c6', { transparent: true, opacity: .6 });
    this.box([17, .35, 9], material('#111d19', { metalness: .3, roughness: .45 }), [0, .25, 0]);
    this.box([17.2, .1, 9.2], material('#2b4439', { roughness: .65 }), [0, .48, 0]);
    for (const x of [-6.8, 6.8]) this.box([.3, 2.8, .3], steel, [x, -1.3, 2.8]);
    const grid = new T.GridHelper(32, 32, '#244b3b', '#132c23'); grid.position.y = -2.8; this.lab.add(grid);
    this.box([17, 7, .2], material('#0d1c17', { roughness: .9 }), [0, 2.9, -4.4]);
    this.box([10, .08, .12], material('#8fe7ce', { emissive: '#3b927a', emissiveIntensity: .8 }), [0, 5.8, -4.2]);
    for (const x of [-6, -3, 0, 3, 6]) this.box([.04, 4.8, .04], material('#294a3c'), [x, 2.6, -4.25]);
    this.buildEnvironmentDetails(steel, dark, white);

    // Algaephyte: glass column, liquid, sparger, probe, lid, LED rails, pump.
    this.cylinder(1.52, .28, steel, [-2.6, .7, 0], undefined, 'Algaephyte · 18 L culture model').userData.focus = 'algaephyte';
    this.liquid = this.cylinder(1.24, 3.25, material('#248b5f', { transparent: true, opacity: .72, depthWrite: false, roughness: .16 }), [-2.6, 2.48, 0]);
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
    const pump = this.cylinder(.38, .22, dark, [-5.4, 1.05, 1.02]); pump.rotation.x = Math.PI / 2; this.pump = pump;
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
    this.flowNodes = new T.InstancedMesh(
      new T.SphereGeometry(.085, 8, 6),
      material('#8deee1', { transparent: true, opacity: .78, emissive: '#2b8f82', emissiveIntensity: .9 }),
      18,
    );
    this.flowNodes.instanceMatrix.setUsage(T.DynamicDrawUsage);
    this.flowMatrix = new T.Object3D();
    this.chip.add(this.flowNodes);
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

  buildEnvironmentDetails(steel, dark, white) {
    // A small amount of room context makes the devices read as a laboratory,
    // not as isolated meshes on a green platform. Everything remains
    // procedural and self-hosted so the scene has no image or network assets.
    const frame = material('#496458', { metalness: .65, roughness: .34 });
    const lightHousing = material('#182d24', { metalness: .25, roughness: .4 });
    const lightSurface = material('#c7f4d7', { emissive: '#6fd6a0', emissiveIntensity: .72 });
    const safety = material('#7b5b32', { roughness: .5 });

    // Overhead utility beam and three soft laboratory luminaires.
    this.box([15.5, .18, .32], frame, [0, 6.28, -1.35]);
    for (const x of [-4.8, 0, 4.8]) {
      this.box([2.45, .1, .72], lightHousing, [x, 6.12, -1.35]);
      const panel = this.box([2.05, .025, .46], lightSurface, [x, 6.055, -1.35]);
      this.environmentLights.push(panel.material);
    }

    // Rear service shelf with reagent bottles and a quiet status console.
    this.box([5.25, .12, .58], frame, [4.25, 4.25, -4.02]);
    for (const x of [1.75, 6.75]) this.box([.1, 1.35, .1], frame, [x, 4.88, -4.02]);
    for (let i = 0; i < 4; i++) {
      const bottleX = 2.15 + i * .82;
      this.cylinder(.19, .72, new T.MeshPhysicalMaterial({ color: i % 2 ? '#7da9a0' : '#b5d08e', transparent: true, opacity: .7, roughness: .18, transmission: .1 }), [bottleX, 4.7, -4.02]);
      this.cylinder(.08, .16, dark, [bottleX, 5.13, -4.02]);
    }
    this.box([1.72, 1.02, .12], dark, [6.15, 3.02, -4.02], undefined, 'Synthetic run monitor · read-only');
    this.box([1.38, .67, .025], material('#1d6654', { emissive: '#2fbe91', emissiveIntensity: .36 }), [6.15, 3.06, -3.95]);
    this.box([.12, .58, .12], steel, [6.15, 2.43, -4.02]);
    this.box([.88, .08, .38], white, [6.15, 2.16, -4.02]);

    // Utility conduits and floor safety markings provide scale and depth cues.
    const conduit = material('#527b6d', { metalness: .55, roughness: .4 });
    this.tube([[-7.45, 5.1, -4.02], [-6.7, 5.1, -4.02], [-6.7, 3.85, -4.02], [-5.9, 3.85, -4.02]], .035, conduit);
    this.tube([[7.25, 5.15, -4.02], [7.25, 4.05, -4.02], [6.9, 3.7, -4.02]], .035, conduit);
    this.box([4.2, .025, .08], safety, [-2.6, .56, 2.5]);
    this.box([4.3, .025, .08], safety, [3.3, .56, 2.5]);

    // Wall indicators are deliberately status-like, but remain synthetic UI
    // decoration; their state is updated from the model below.
    for (const x of [-6.8, -6.35, -5.9, 7.0, 7.45]) {
      const indicator = this.mesh(new T.SphereGeometry(.055, 10, 8), material('#65d99a', { emissive: '#2c8b5c', emissiveIntensity: .65 }), [x, 5.35, -4.03]);
      this.environmentIndicators.push(indicator.material);
    }
    this.label('SYNTHETIC  /  READ-ONLY', [5.15, 5.65, -4.02], '#9cd9be', 2.25);
  }

  buildExpedition() {
    const root = this.expeditionRoot = new T.Group();
    root.visible = false;
    root.name = 'PHYCOFRONTIER deterministic exploration world';
    this.scene.add(root);
    this.expeditionTerrain = new T.Group();
    this.expeditionMarkersGroup = new T.Group();
    root.add(this.expeditionTerrain, this.expeditionMarkersGroup);

    this.expeditionFloor = this.box([19, .24, 12], material('#102c32', { roughness: .8 }), [0, -2.95, 0], root);
    this.expeditionVolume = this.box([18.6, 7.6, 11.6], new T.MeshPhysicalMaterial({ color: '#154f58', transparent: true, opacity: .16, roughness: .05, metalness: .05, transmission: .22, thickness: 1.2, side: T.DoubleSide, depthWrite: false }), [0, .6, 0], root);
    this.expeditionVolume.castShadow = false;
    this.expeditionVolume.receiveShadow = false;
    const grid = new T.GridHelper(18, 18, '#2a7170', '#16474a');
    grid.position.y = -2.8; grid.scale.z = .64; grid.material.transparent = true; grid.material.opacity = .46; root.add(grid);
    for (const y of [-1.1, .4, 1.9]) {
      const depthLine = this.box([18.2, .018, .035], material('#4d9a8c', { transparent: true, opacity: .3 }), [0, y, -5.72], root);
      depthLine.userData.depthGuide = true;
    }
    this.expeditionParticleMatrix = new T.Object3D();
    this.expeditionParticles = new T.InstancedMesh(
      new T.SphereGeometry(.035, 6, 5),
      material('#83d9d1', { transparent: true, opacity: .38, emissive: '#1e7476', emissiveIntensity: .45 }),
      160,
    );
    this.expeditionParticles.instanceMatrix.setUsage(T.DynamicDrawUsage);
    root.add(this.expeditionParticles);
    this.expeditionProbe = new T.Group();
    this.expeditionProbe.name = 'Scientific exploration probe';
    root.add(this.expeditionProbe);
    const shell = material('#c5d5c4', { metalness: .72, roughness: .28 });
    const dark = material('#132a2c', { metalness: .54, roughness: .32 });
    const cyan = material('#6fe5df', { emissive: '#2caaa6', emissiveIntensity: 1.3, metalness: .14, roughness: .22 });
    const amber = material('#ffd37a', { emissive: '#a36b21', emissiveIntensity: .85, metalness: .1, roughness: .27 });
    this.expeditionProbe.add(this.box([1.12, .48, .76], shell, [0, 0, 0], this.expeditionProbe));
    this.expeditionProbe.add(this.box([.5, .16, 1.18], dark, [0, -.18, 0], this.expeditionProbe));
    for (const x of [-.56, .56]) {
      this.expeditionProbe.add(this.box([.1, .16, 1.25], dark, [x, -.12, 0], this.expeditionProbe));
      this.expeditionProbe.add(this.box([.12, .12, .18], cyan, [x, .02, -.48], this.expeditionProbe));
    }
    const mast = this.cylinder(.045, .48, shell, [0, .36, 0], this.expeditionProbe);
    this.expeditionProbe.add(mast);
    this.expeditionProbe.add(this.cylinder(.1, .08, amber, [0, .61, 0], this.expeditionProbe));
    this.expeditionProbe.userData.label = 'Probe · environmental sensors · sampling inlet';
    this.pickables.push(this.expeditionProbe);
    this.expeditionProbeLight = new T.PointLight(0x71ebe5, 2.8, 4.2);
    this.expeditionProbeLight.position.set(0, .1, -.55); this.expeditionProbe.add(this.expeditionProbeLight);
    this.label('PHYCOFRONTIER  /  PROBE', [-4.9, 3.35, -4.8], '#bfeee6', 2.7, root);
    this.label('DEPTH  /  TELEMETRY  /  SAMPLE', [4.4, 3.35, -4.8], '#92bcb9', 2.3, root);
  }

  expeditionPoint(position, world) {
    const width = world?.dimensions?.widthM || 1000;
    const height = world?.dimensions?.heightM || 760;
    const depth = world?.dimensions?.maxDepthM || 80;
    return new T.Vector3(
      (position.x / width - .5) * 17.2,
      3.05 - (position.z / depth) * 5.45,
      (position.y / height - .5) * 9.4,
    );
  }

  refreshExpeditionWorld(state) {
    const world = state?.expedition?.world;
    if (!world) return;
    const key = `${state.expedition.seed}|${state.expedition.environmentType}|${world.hotspots.map((hotspot) => hotspot.id).join('|')}`;
    if (key === this.expeditionKey) return;
    this.expeditionKey = key;
    this.expeditionPickables.forEach((item) => { const index = this.pickables.indexOf(item); if (index >= 0) this.pickables.splice(index, 1); });
    this.expeditionPickables = [];
    this.expeditionMarkers.clear();
    this.disposeGroup(this.expeditionTerrain); this.expeditionTerrain.clear();
    this.disposeGroup(this.expeditionMarkersGroup); this.expeditionMarkersGroup.clear();
    const envColor = { freshwater: '#2b8f77', marine: '#2b718d', sediment: '#97734d', terrestrial: '#647b43' }[state.expedition.environmentType] || '#2b8f77';
    this.expeditionFloor.material.color.set(envColor);
    this.expeditionVolume.material.color.set(envColor);
    this.expeditionVolume.material.opacity = state.expedition.environmentType === 'terrestrial' ? .11 : .16;
    world.regions.forEach((region, index) => {
      const center = this.expeditionPoint(region.position, world);
      const size = .8 + (index % 3) * .24;
      const rock = new T.Mesh(new T.IcosahedronGeometry(size, 1), material(envColor, { roughness: .9, metalness: .03, transparent: true, opacity: .68 }));
      rock.position.copy(center); rock.position.y -= .48 + (index % 2) * .42; rock.scale.set(1.5, .5 + (index % 2) * .2, .9); rock.rotation.set(index * .4, index * .7, index * .2); this.expeditionTerrain.add(rock);
      for (let j = 0; j < 4; j++) {
        const pebble = new T.Mesh(new T.DodecahedronGeometry(.12 + j * .04, 0), material('#6b8f7b', { roughness: .92 }));
        pebble.position.set(center.x + (j - 1.5) * .42, center.y - .62 - (j % 2) * .12, center.z + (j % 2 ? .28 : -.22));
        pebble.rotation.set(j, j * .7, j * .3); this.expeditionTerrain.add(pebble);
      }
    });
    world.hotspots.forEach((hotspot) => {
      const marker = new T.Group();
      marker.position.copy(this.expeditionPoint(hotspot.position, world));
      marker.userData = { hotspotId: hotspot.id, label: `${hotspot.name} · biological hotspot` };
      const ring = new T.Mesh(new T.TorusGeometry(.3, .045, 8, 32), material('#78e3d3', { emissive: '#2b968e', emissiveIntensity: 1.1, transparent: true, opacity: .85 }));
      ring.rotation.x = Math.PI / 2; marker.add(ring);
      const core = new T.Mesh(new T.SphereGeometry(.1, 10, 8), material('#b8fff0', { emissive: '#52f5db', emissiveIntensity: 1.8, transparent: true, opacity: .92 }));
      core.position.y = .06; marker.add(core);
      const beam = new T.Mesh(new T.CylinderGeometry(.012, .012, 1.4, 6), material('#7ce2d6', { emissive: '#318c83', emissiveIntensity: .8, transparent: true, opacity: .38 }));
      beam.position.y = -.7; marker.add(beam);
      this.expeditionMarkersGroup.add(marker); this.expeditionMarkers.set(hotspot.id, { marker, ring, core, beam }); this.expeditionPickables.push(marker); this.pickables.push(marker);
    });
    for (let i = 0; i < 160; i++) {
      const x = Math.sin(i * 12.9898) * 7.6;
      const y = -2.1 + (Math.sin(i * 5.231 + 1.7) * .5 + .5) * 5.9;
      const z = Math.cos(i * 8.137) * 4.8;
      this.expeditionParticleMatrix.position.set(x, y, z); this.expeditionParticleMatrix.scale.setScalar(.5 + (i % 5) * .13); this.expeditionParticleMatrix.updateMatrix(); this.expeditionParticles.setMatrixAt(i, this.expeditionParticleMatrix.matrix);
    }
    this.expeditionParticles.instanceMatrix.needsUpdate = true;
  }

  updateExpedition() {
    const e = this.state?.expedition;
    if (!e) return;
    this.refreshExpeditionWorld(this.state);
    const probePosition = this.expeditionPoint(e.probe.position, e.world);
    this.expeditionProbe.position.lerp(probePosition, .22);
    this.expeditionProbe.rotation.y = this.animTime * .16 + e.probe.position.x * .002;
    this.expeditionProbeLight.intensity = e.status === 'depleted' ? .3 : e.autonomy.enabled ? 4.4 : 2.8;
    this.expeditionParticles.rotation.y = this.animTime * .008;
    const selectedId = e.selectedHotspotId;
    this.expeditionMarkers.forEach((visual, id) => {
      const hotspot = e.world.hotspots.find((item) => item.id === id);
      if (!hotspot) return;
      const selected = id === selectedId;
      const inRange = Math.hypot(e.probe.position.x - hotspot.position.x, e.probe.position.y - hotspot.position.y, e.probe.position.z - hotspot.position.z) <= (ENVIRONMENT_RANGES[e.environmentType] || 160);
      const color = selected ? '#ffd37a' : hotspot.visited ? '#83c6bd' : inRange ? '#78e3d3' : '#4d8b83';
      visual.ring.material.color.set(color); visual.ring.material.emissive.set(color); visual.ring.material.emissiveIntensity = selected ? 2.3 : inRange ? 1.45 : .8; visual.ring.scale.setScalar(1 + (selected ? .16 : .04) * Math.sin(this.animTime * 3 + id.length));
      visual.core.material.color.set(color); visual.core.material.emissive.set(color); visual.core.material.emissiveIntensity = selected ? 2.8 : 1.5; visual.beam.material.color.set(color); visual.beam.material.opacity = selected ? .62 : .28;
    });
    // The depth guides read as an instrument scale rather than decorative UI.
    this.expeditionTerrain.children.forEach((mesh, index) => { mesh.rotation.y += .0001 * (index + 1); });
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
    if (this.mode === 'expedition') { this.updateExpedition(); return; }
    this.refreshPopulation();
    const time = this.animTime || s.sim.clock / 60;
    this.liquid.material.color.set(s.algae.derived.health === 'critical' ? '#8c804c' : '#398953');
    this.liquid.material.opacity = Math.min(.86, .45 + s.algae.biomassG / s.algae.volumeL * 2);
    this.status.material.color.set(s.algae.derived.health === 'critical' ? '#d87963' : s.sim.running ? '#98d883' : '#d0b76e');
    if (this.pump) this.pump.rotation.y = time * (s.sim.running ? 2.8 : .35);
    const health = s.algae.derived.health;
    const indicatorColor = health === 'critical' ? '#d87963' : health === 'stressed' ? '#e0b45b' : '#65d99a';
    this.environmentIndicators.forEach((mat, index) => {
      mat.color.set(indicatorColor); mat.emissive.set(indicatorColor);
      mat.emissiveIntensity = s.sim.running ? .95 : .42 + (index % 2) * .12;
    });
    this.environmentLights.forEach((mat) => {
      mat.emissiveIntensity = s.sim.running ? .92 : .58;
    });
    for (let i = 0; i < 40; i++) {
      const angle = i * 2.4, r = .22 + (i % 7) * .115;
      this.matrix.position.set(-2.6 + Math.cos(angle) * r, 1.2 + ((i * .293 + time * .1) % 2.8), Math.sin(angle) * r);
      this.matrix.updateMatrix(); this.bubbles.setMatrixAt(i, this.matrix.matrix);
    }
    this.bubbles.instanceMatrix.needsUpdate = true;
    const flowActive = s.cyano.stage !== 'sample' || s.cyano.processingProgress > 0;
    const flowSpeed = flowActive ? (s.sim.running ? .055 * Math.max(1, s.sim.speed / 5) : .012) : .004;
    this.flowNodes.material.color.set(flowActive ? '#8deee1' : '#456b62');
    this.flowNodes.material.emissive.set(flowActive ? '#2b8f82' : '#182d29');
    this.flowNodes.material.opacity = flowActive ? .82 : .34;
    for (let i = 0; i < 18; i++) {
      const progress = (i / 18 + time * flowSpeed) % 1;
      this.flowMatrix.position.copy(this.channel.getPoint(progress));
      this.flowMatrix.scale.setScalar(flowActive ? 1 : .62);
      this.flowMatrix.updateMatrix(); this.flowNodes.setMatrixAt(i, this.flowMatrix.matrix);
    }
    this.flowNodes.instanceMatrix.needsUpdate = true;
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
  setMode(mode) {
    this.mode = mode || 'overview';
    this.lab.visible = this.mode !== 'expedition' && this.mode !== 'cell';
    this.expeditionRoot.visible = this.mode === 'expedition';
    this.inspector.visible = this.mode === 'cell';
  }
  setQuality(value) {
    this.low = value === 'low'; this.renderer.setPixelRatio(this.low ? 1 : Math.min(devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = !this.low; this.resize();
  }
  setCamera(name, instant = false) {
    if (name === this.cameraName) return;
    this.cameraName = name; this.lab.visible = name !== 'expedition' && name !== 'cell'; this.expeditionRoot.visible = name === 'expedition'; this.inspector.visible = name === 'cell';
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
      const hit = this.hit(e); if (hit?.cellId) this.hooks.onSelect?.(hit.cellId); else if (hit?.hotspotId) this.hooks.onHotspot?.(hit.hotspotId); else if (hit?.focus) this.hooks.onFocus?.(hit.focus);
    }, options);
    this.canvas.addEventListener('pointermove', e => { this.canvas.title = this.hit(e)?.label || 'Drag to orbit · right-drag to pan · scroll to zoom'; }, options);
    this.canvas.addEventListener('keydown', e => {
      if (this.mode === 'expedition' && ['w', 'a', 's', 'd', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        const direction = { x: 0, y: 0, depth: 0 };
        if (e.key === 'w' || e.key === 'ArrowUp') direction.y = -1;
        if (e.key === 's' || e.key === 'ArrowDown') direction.y = 1;
        if (e.key === 'a' || e.key === 'ArrowLeft') direction.x = -1;
        if (e.key === 'd' || e.key === 'ArrowRight') direction.x = 1;
        this.hooks.onMove?.(direction); e.preventDefault(); return;
      }
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
    this.animTime = now / 1000;
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
