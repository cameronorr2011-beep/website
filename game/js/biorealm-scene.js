/*
 * BioRealm scene renderer.
 *
 * This file deliberately owns no game rules.  It consumes the plain state
 * objects from biorealm-engine.js and paints an illustrated, low-noise field
 * journal on a Canvas 2D surface.  Static architecture and landscape plates
 * live in a module cache so replacing the canvas during a view render does
 * not throw away the expensive part of the illustration.
 */

const TAU = Math.PI * 2;
const LOGICAL_WIDTH = 1200;
const LOGICAL_HEIGHT = 520;
const SCENE_IDS = new Set([
  "lab", "freshwater", "lakes", "moist-sand", "coastal", "soil",
  "forest-soil", "wetlands", "thermal", "night-tide",
]);
const REACTOR_CAPACITY = { flask: 70, bench: 210, panel: 620, automated: 1600, industrial: 4500 };

const staticArt = new Map();
const staticArtOrder = [];

const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, Number(value) || 0));
const lerp = (a, b, amount) => a + (b - a) * amount;
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

function hash(text) {
  let value = 2166136261;
  for (const char of String(text)) {
    value ^= char.charCodeAt(0);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function seeded(text) {
  let value = hash(text) || 1;
  return () => {
    value += 0x6D2B79F5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function color(value, fallback = "#789188") {
  return typeof value === "string" && /^#[\da-f]{3,8}$/i.test(value) ? value : fallback;
}

function roundRect(ctx, x, y, width, height, radius = 8) {
  const r = Math.min(radius, Math.abs(width) / 2, Math.abs(height) / 2);
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, width, height, r);
  } else {
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
  }
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry, rotation = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rotation, 0, TAU);
}

function line(ctx, points) {
  if (!points.length) return;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let index = 1; index < points.length; index += 1) ctx.lineTo(points[index][0], points[index][1]);
}

function pathFill(ctx, points, fill, stroke = null, width = 1) {
  line(ctx, points);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
}

function strokePath(ctx, points, stroke, width = 1) {
  line(ctx, points);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.stroke();
}

function gradient(ctx, x0, y0, x1, y1, stops) {
  const value = ctx.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(([position, tone]) => value.addColorStop(position, tone));
  return value;
}

function drawScrew(ctx, x, y, radius = 3, tone = "#9caa9e") {
  ctx.fillStyle = "#243b3a";
  ellipse(ctx, x, y, radius + 1, radius + 1);
  ctx.fill();
  ctx.fillStyle = tone;
  ellipse(ctx, x, y, radius, radius);
  ctx.fill();
  ctx.strokeStyle = "#536862";
  ctx.lineWidth = 0.8;
  line(ctx, [[x - radius * .6, y], [x + radius * .6, y]]);
  ctx.stroke();
}

function drawTeardrop(ctx, x, y, size, tone, phase = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(phase);
  ctx.beginPath();
  ctx.moveTo(0, -size * 1.35);
  ctx.bezierCurveTo(size * .9, -.35 * size, size * .8, size, 0, size);
  ctx.bezierCurveTo(-size * .8, size, -size * .9, -.35 * size, 0, -size * 1.35);
  ctx.fillStyle = tone;
  ctx.fill();
  ctx.restore();
}

function makeCanvas(width, height) {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(width, height);
  if (typeof document !== "undefined" && document.createElement) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }
  return null;
}

function cacheStatic(id) {
  const existing = staticArt.get(id);
  if (existing) return { ...existing, hit: true };
  const canvas = makeCanvas(LOGICAL_WIDTH, LOGICAL_HEIGHT);
  if (!canvas) return { canvas: null, midCanvas: null, hit: false };
  const ctx = canvas.getContext("2d");
  if (!ctx) return { canvas: null, midCanvas: null, hit: false };
  ctx.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
  if (id === "lab") drawLabStatic(ctx);
  else drawBiomeStatic(ctx, id);
  const midCanvas = id === "lab" ? null : makeCanvas(LOGICAL_WIDTH, LOGICAL_HEIGHT);
  const midContext = midCanvas?.getContext?.("2d");
  if (midContext && id !== "lab") {
    midContext.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    drawBiomeMidground(midContext, id);
  }
  const plate = { canvas, midCanvas };
  staticArt.set(id, plate);
  staticArtOrder.push(id);
  /* Keep the module cache bounded without making a canvas replacement cold. */
  while (staticArtOrder.length > 6) {
    const old = staticArtOrder.shift();
    if (old && old !== id) staticArt.delete(old);
  }
  return { canvas, midCanvas, hit: false };
}

function leafSpray(ctx, x, y, scale = 1, tone = "#74a47c") {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-14, -27, 7, -56, -6, -93);
  ctx.strokeStyle = "#608d6b"; ctx.lineWidth = 2; ctx.stroke();
  for (let index = 0; index < 6; index += 1) {
    const side = index % 2 ? 1 : -1;
    const ly = -14 - index * 13;
    ctx.beginPath(); ctx.moveTo(-3, ly);
    ctx.bezierCurveTo(side * 28, ly + 5, side * 33, ly - 19, side * 27, ly - 25);
    ctx.bezierCurveTo(side * 12, ly - 24, side * 7, ly - 10, -3, ly);
    ctx.fillStyle = tone; ctx.fill();
    strokePath(ctx, [[-3, ly], [side * 23, ly - 19]], "rgba(219, 229, 156, .27)");
  }
  ctx.restore();
}

function drawDeskTools(ctx) {
  /* Binocular microscope: the sloping body, stage, focus wheel and foot are
   * deliberately large enough to read at the actual card's display scale. */
  ctx.fillStyle = "rgba(4, 17, 22, .5)"; ellipse(ctx, 220, 390, 78, 11); ctx.fill();
  ctx.beginPath(); ctx.moveTo(238, 374); ctx.bezierCurveTo(278, 340, 264, 290, 225, 287);
  ctx.strokeStyle = "#a3b5a1"; ctx.lineWidth = 19; ctx.stroke();
  ctx.strokeStyle = "#4c7168"; ctx.lineWidth = 9; ctx.stroke();
  pathFill(ctx, [[193, 294], [209, 277], [241, 306], [224, 324]], "#bac6ad", "#3f5e57", 2);
  strokePath(ctx, [[197, 289], [184, 273]], "#c5d1b5", 12);
  strokePath(ctx, [[189, 280], [178, 266]], "#1b3437", 13);
  strokePath(ctx, [[209, 281], [198, 264]], "#c5d1b5", 11);
  strokePath(ctx, [[202, 270], [193, 257]], "#1b3437", 12);
  strokePath(ctx, [[216, 318], [207, 335]], "#d9c58a", 8);
  ctx.fillStyle = "#122c30"; roundRect(ctx, 170, 340, 83, 9, 3); ctx.fill();
  ctx.fillStyle = "#adcfba"; ctx.fillRect(190, 336, 34, 3);
  ctx.fillStyle = "#2b5150"; ellipse(ctx, 253, 338, 13, 13); ctx.fill();
  ctx.strokeStyle = "#b8c7a4"; ctx.lineWidth = 3; ctx.stroke(); drawScrew(ctx, 253, 338, 4);
  ctx.fillStyle = "#79998b"; roundRect(ctx, 166, 376, 108, 15, 7); ctx.fill();
  ctx.fillStyle = "#d5bb79"; ellipse(ctx, 206, 376, 13, 5); ctx.fill();

  /* Open field notebook, a pencil and stacked slides on the near worktop. */
  pathFill(ctx, [[302, 361], [348, 358], [366, 385], [315, 389]], "#c0ba94", "#535f51");
  pathFill(ctx, [[348, 358], [389, 361], [408, 387], [366, 385]], "#d7cda6", "#535f51");
  for (let index = 0; index < 4; index += 1) {
    strokePath(ctx, [[315 + index * 2, 368 + index * 4], [344 + index * 3, 365 + index * 4]], "#7c8e76");
  }
  ctx.strokeStyle = "#648771"; ctx.lineWidth = 1;
  ellipse(ctx, 374, 372, 7, 5, .4); ctx.stroke();
  strokePath(ctx, [[385, 348], [418, 382]], "#d3a964", 3);
  strokePath(ctx, [[387, 350], [413, 377]], "#f0d09c");
  ctx.fillStyle = "#4f7770"; roundRect(ctx, 291, 325, 50, 22, 3); ctx.fill();
  for (let index = 0; index < 4; index += 1) strokePath(ctx, [[299, 331 + index * 3], [333, 331 + index * 3]], "#a3c6b3");
}

function drawSampleStand(ctx, x, y) {
  for (let index = 0; index < 5; index += 1) {
    const tx = x + index * 17;
    ctx.fillStyle = "rgba(159, 214, 197, .15)"; roundRect(ctx, tx, y - 57, 10, 53, 4); ctx.fill();
    ctx.strokeStyle = "#99c2b0"; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = ["#75b68a", "#87b591", "#ccb471"][index % 3]; roundRect(ctx, tx + 2, y - 28 - index * 2, 6, 24 + index * 2, 3); ctx.fill();
    ctx.fillStyle = "#d1bb7c"; ctx.fillRect(tx - 1, y - 60, 12, 4);
  }
  ctx.fillStyle = "#a58858"; roundRect(ctx, x - 8, y - 26, 97, 7, 2); ctx.fill();
  ctx.fillRect(x - 5, y - 22, 5, 25); ctx.fillRect(x + 81, y - 22, 5, 25);
  roundRect(ctx, x - 8, y, 97, 6, 2); ctx.fill();
}

function drawLabStatic(ctx) {
  ctx.fillStyle = gradient(ctx, 0, 0, 0, 520, [[0, "#14292d"], [.52, "#1d3e3c"], [1, "#0c1c22"]]);
  ctx.fillRect(0, 0, 1200, 520);
  ctx.fillStyle = "#0b1b21"; ctx.fillRect(0, 0, 1200, 48);
  ctx.fillStyle = "rgba(214, 193, 133, .09)"; ctx.fillRect(0, 48, 1200, 4);

  /* Plaster panels, service conduits, and a warm north window. */
  ctx.fillStyle = "rgba(190, 203, 165, .045)";
  for (let x = 18; x < 1200; x += 96) ctx.fillRect(x, 58, 1, 270);
  for (let y = 86; y < 330; y += 58) strokePath(ctx, [[0, y], [1200, y]], "rgba(223, 201, 140, .055)");
  ctx.strokeStyle = "#46645d"; ctx.lineWidth = 5;
  strokePath(ctx, [[24, 42], [24, 125], [226, 125], [226, 176]], "#46645d", 5);
  strokePath(ctx, [[1078, 244], [1151, 244], [1151, 100], [1184, 100]], "#46645d", 5);
  ctx.strokeStyle = "rgba(239, 201, 128, .25)"; ctx.lineWidth = 1;
  strokePath(ctx, [[25, 40], [25, 122], [226, 122]], "rgba(239, 201, 128, .25)");

  ctx.fillStyle = "#0b2028"; roundRect(ctx, 798, 58, 332, 154, 8); ctx.fill();
  ctx.save(); roundRect(ctx, 808, 68, 312, 134, 4); ctx.clip();
  ctx.fillStyle = gradient(ctx, 808, 68, 808, 202, [[0, "#4a6870"], [.58, "#8d9778"], [1, "#b8895f"]]); ctx.fillRect(808, 68, 312, 134);
  const garden = seeded("north-window-garden");
  for (let index = 0; index < 27; index += 1) {
    ctx.fillStyle = index % 2 ? "rgba(66, 106, 75, .48)" : "rgba(124, 151, 99, .55)";
    ellipse(ctx, 796 + garden() * 340, 122 + garden() * 80, 20 + garden() * 24, 20 + garden() * 19); ctx.fill();
  }
  leafSpray(ctx, 837, 215, 1.4, "#355f49"); leafSpray(ctx, 1084, 218, 1.1, "#3e6d54");
  leafSpray(ctx, 1008, 233, .8, "#577f58");
  ctx.fillStyle = "rgba(239, 222, 167, .13)"; ctx.fillRect(817, 70, 18, 129);
  ctx.restore();
  ctx.strokeStyle = "#71867a"; ctx.lineWidth = 5; ctx.strokeRect(802, 62, 324, 146);
  ctx.strokeStyle = "rgba(222, 190, 117, .48)"; ctx.lineWidth = 2;
  strokePath(ctx, [[964, 64], [964, 206]], "rgba(222, 190, 117, .42)", 2);
  strokePath(ctx, [[804, 135], [1124, 135]], "rgba(222, 190, 117, .3)", 2);

  /* A real bookshelf and reagent nook give the room an occupied scale. */
  ctx.fillStyle = "#172b2c"; roundRect(ctx, 42, 66, 188, 191, 6); ctx.fill();
  ctx.strokeStyle = "#6d8377"; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = "#a68050"; ctx.fillRect(51, 91, 170, 5);
  for (let shelf = 0; shelf < 3; shelf += 1) {
    const sy = 145 + shelf * 51;
    ctx.fillStyle = "#233c39"; ctx.fillRect(52, sy, 168, 5);
    ctx.fillStyle = "rgba(211, 188, 126, .3)"; ctx.fillRect(58, sy - 2, 156, 2);
    for (let book = 0; book < 7; book += 1) {
      ctx.fillStyle = ["#6aa491", "#bd8964", "#7694a5", "#d0b36b"][book % 4];
      const bx = 61 + book * 21, bh = 27 + ((book * 13 + shelf * 7) % 17);
      ctx.fillRect(bx, sy - bh, 14, bh - 3);
      ctx.fillStyle = "rgba(248, 225, 175, .5)"; ctx.fillRect(bx + 3, sy - bh + 5, 8, 1); ctx.fillRect(bx + 3, sy - 9, 8, 1);
      ctx.fillStyle = "rgba(8, 23, 28, .25)"; ctx.fillRect(bx + 11, sy - bh, 3, bh - 3);
    }
  }
  ctx.font = "9px monospace"; ctx.fillStyle = "#c8ba86"; ctx.fillText("FIELD LIBRARY / 01", 61, 84);

  /* A small assay console turns the rear wall into a scientific desk rather
   * than an empty backdrop. Its quiet readout supports the larger live rack. */
  ctx.fillStyle = "#142a2d"; roundRect(ctx, 262, 74, 160, 91, 6); ctx.fill();
  ctx.strokeStyle = "#6e887b"; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = "#0b2026"; roundRect(ctx, 274, 101, 116, 57, 4); ctx.fill();
  ctx.strokeStyle = "rgba(101, 190, 163, .48)"; ctx.lineWidth = 1;
  strokePath(ctx, [[284, 113], [337, 113], [357, 128], [379, 119]], "rgba(101, 190, 163, .48)");
  strokePath(ctx, [[284, 134], [322, 134], [343, 143], [379, 136]], "rgba(218, 185, 107, .55)");
  ctx.fillStyle = "#d5b66b"; ctx.fillRect(284, 147, 31, 3);
  ctx.fillStyle = "#496961"; roundRect(ctx, 399, 109, 11, 11, 3); ctx.fill();
  ctx.fillStyle = "#d1b66a"; ellipse(ctx, 405, 114, 2.5, 2.5); ctx.fill();
  ctx.fillStyle = "#496961"; roundRect(ctx, 399, 130, 11, 11, 3); ctx.fill();
  for (let index = 0; index < 2; index += 1) {
    const px = 477 + index * 145;
    ctx.fillStyle = "#14292b"; ctx.fillRect(px - 5, 69, 124, 91);
    ctx.fillStyle = index ? "#b7b58d" : "#a6b39a"; ctx.fillRect(px, 73, 114, 81);
    ctx.save(); ctx.translate(px + 24, 104); ctx.scale(.65, .65);
    if (index) {
      for (let cell = 0; cell < 5; cell += 1) { ellipse(ctx, 8 + cell * 19, 25 + (cell % 2) * 4, 8, 18); ctx.strokeStyle = "#52705d"; ctx.lineWidth = 2; ctx.stroke(); }
    } else {
      ctx.beginPath(); ctx.moveTo(-4, 30);
      for (let coil = 0; coil < 5; coil += 1) ctx.bezierCurveTo(coil * 20 + 7, -8, coil * 20 + 24, -8, coil * 20 + 14, 30);
      ctx.strokeStyle = "#467662"; ctx.lineWidth = 3; ctx.stroke();
    }
    ctx.restore();
    ctx.font = "8px monospace"; ctx.fillStyle = "#395d51"; ctx.fillText(index ? "COLONY / IV" : "FILAMENT / I", px + 10, 87);
    ctx.fillStyle = "#546e5d"; ctx.fillRect(px + 81, 143, 22, 1);
    drawScrew(ctx, px + 56, 77, 1.5);
  }

  /* Overhead luminaires frame the active bench instead of an empty ceiling. */
  for (const fixture of [[276, 19, 190], [520, 13, 210]]) {
    ctx.fillStyle = "#263b39"; roundRect(ctx, fixture[0], fixture[1], fixture[2], 12, 5); ctx.fill();
    ctx.fillStyle = "rgba(245, 211, 139, .84)"; roundRect(ctx, fixture[0] + 11, fixture[1] + 4, fixture[2] - 22, 3, 2); ctx.fill();
    pathFill(ctx, [[fixture[0] - 18, fixture[1] + 13], [fixture[0] + fixture[2] + 18, fixture[1] + 13], [fixture[0] + fixture[2] + 42, 212], [fixture[0] - 42, 212]], "rgba(222, 175, 89, .035)");
  }

  /* Close-up steel workbench: this is the room's visual anchor. */
  ctx.fillStyle = "rgba(2, 11, 15, .65)"; ellipse(ctx, 615, 508, 500, 18); ctx.fill();
  ctx.fillStyle = gradient(ctx, 0, 405, 0, 510, [[0, "#36524b"], [1, "#142b2d"]]);
  roundRect(ctx, 104, 399, 1000, 109, 7); ctx.fill();
  ctx.strokeStyle = "#829082"; ctx.lineWidth = 2; ctx.stroke();
  pathFill(ctx, [[125, 306], [1087, 306], [1125, 395], [85, 395]], gradient(ctx, 0, 306, 0, 398, [[0, "#455f54"], [1, "#718578"]]), "#97a791", 1);
  ctx.fillStyle = "#bb9b62"; roundRect(ctx, 85, 395, 1040, 17, 3); ctx.fill();
  ctx.fillStyle = "#344e47"; ctx.fillRect(94, 399, 1022, 7);
  ctx.strokeStyle = "rgba(230, 201, 140, .52)"; ctx.lineWidth = 1; ctx.stroke();
  for (let index = 0; index < 4; index += 1) {
    const dx = 400 + index * 170;
    ctx.fillStyle = "#27473f"; roundRect(ctx, dx, 426, 156, 62, 3); ctx.fill();
    ctx.strokeStyle = "#547367"; ctx.stroke();
    ctx.fillStyle = "#b49b67"; roundRect(ctx, dx + 60, 438, 36, 5, 2); ctx.fill();
    ctx.fillStyle = "#a0b3a0"; ctx.font = "8px monospace"; ctx.fillText(["SLIDES", "GLASSWARE", "MEDIA", "FIELD NOTES"][index], dx + 15, 477);
  }
  ctx.fillStyle = "#0e2025"; ctx.fillRect(150, 508, 11, 12); ctx.fillRect(1047, 508, 11, 12);
  ctx.fillStyle = "#88734e"; ctx.fillRect(104, 500, 1000, 5);
  drawDeskTools(ctx);
  drawSampleStand(ctx, 916, 389);

  /* Botany keeps the hard equipment from reading as a sterile empty grid. */
  leafSpray(ctx, 1149, 386, 1.38, "#6b9e73"); leafSpray(ctx, 1181, 386, .97, "#466f55");
  pathFill(ctx, [[1123, 376], [1182, 376], [1175, 426], [1133, 426]], "#947154", "#bb9270");
  ctx.fillStyle = "#b38b64"; roundRect(ctx, 1119, 373, 67, 9, 3); ctx.fill();
}

function biomePalette(id) {
  const palettes = {
    freshwater: ["#102d38", "#1b5c61", "#91c8ad"],
    lakes: ["#192f3e", "#2a6670", "#a4c8bd"],
    "moist-sand": ["#392d2b", "#956547", "#d8b878"],
    coastal: ["#0c263d", "#29637a", "#9ec8c6"],
    soil: ["#1f2525", "#604739", "#ac8660"],
    "forest-soil": ["#172a29", "#3c5e47", "#a6bb80"],
    wetlands: ["#142b32", "#35665e", "#afd0af"],
    thermal: ["#311e28", "#7b3d43", "#dda06a"],
    "night-tide": ["#12162f", "#2e3d73", "#b9b4e4"],
  };
  return palettes[id] || palettes.freshwater;
}

function drawBiomeStatic(ctx, id) {
  const [deep, middle, light] = biomePalette(id);
  ctx.fillStyle = gradient(ctx, 0, 0, 0, 520, [[0, deep], [.6, middle], [1, light]]);
  ctx.fillRect(0, 0, 1200, 520);
  const random = seeded(`plate:${id}`);

  if (id === "night-tide") {
    ctx.fillStyle = "rgba(226, 219, 184, .22)";
    pathFill(ctx, [[0, 95], [110, 72], [194, 88], [276, 55], [360, 86], [454, 63], [555, 98], [660, 68], [770, 94], [890, 53], [1015, 83], [1200, 58], [1200, 0], [0, 0]], "rgba(24, 31, 65, .5)");
    ctx.strokeStyle = "rgba(221, 222, 185, .52)"; ctx.lineWidth = 2;
    strokePath(ctx, [[948, 85], [960, 64], [969, 85], [958, 101]], "rgba(221, 222, 185, .52)", 2);
    ctx.strokeStyle = "rgba(205, 216, 203, .44)";
    for (let i = 0; i < 42; i += 1) {
      const x = random() * 1200; const y = 20 + random() * 230; const size = 1 + random() * 2;
      strokePath(ctx, [[x - size, y], [x + size, y]], "rgba(205, 216, 203, .44)", 1);
      if (i % 4 === 0) strokePath(ctx, [[x, y - size], [x, y + size]], "rgba(205, 216, 203, .32)", 1);
    }
    pathFill(ctx, [[0, 292], [124, 270], [254, 293], [380, 260], [522, 293], [700, 266], [842, 294], [1003, 258], [1200, 289], [1200, 520], [0, 520]], "#122a47");
    return;
  }

  if (id === "thermal") {
    pathFill(ctx, [[0, 214], [110, 180], [215, 215], [322, 157], [442, 212], [550, 177], [674, 220], [803, 156], [941, 209], [1060, 168], [1200, 210], [1200, 520], [0, 520]], "#4e2936");
    for (let index = 0; index < 14; index += 1) {
      const x = random() * 1200; const y = 160 + random() * 270;
      ctx.strokeStyle = index % 2 ? "rgba(227, 163, 100, .35)" : "rgba(122, 200, 167, .26)";
      strokePath(ctx, [[x, y], [x + 28 + random() * 60, y - 8 - random() * 12], [x + 62 + random() * 80, y + 4]], ctx.strokeStyle, 2);
    }
    return;
  }

  if (id === "coastal") {
    pathFill(ctx, [[0, 177], [95, 144], [194, 167], [300, 122], [408, 175], [543, 134], [674, 182], [809, 117], [954, 174], [1080, 132], [1200, 170], [1200, 520], [0, 520]], "#224b59");
    pathFill(ctx, [[0, 325], [117, 307], [218, 328], [339, 287], [474, 324], [604, 300], [727, 330], [864, 292], [1017, 327], [1124, 298], [1200, 319], [1200, 520], [0, 520]], "#123b55");
    return;
  }

  if (id === "wetlands") {
    pathFill(ctx, [[0, 218], [124, 190], [244, 220], [363, 170], [480, 219], [612, 185], [760, 226], [899, 180], [1040, 221], [1200, 188], [1200, 520], [0, 520]], "#2b504e");
    pathFill(ctx, [[0, 300], [170, 280], [330, 307], [508, 278], [685, 305], [846, 270], [1034, 306], [1200, 283], [1200, 520], [0, 520]], "#1e4d4e");
    return;
  }

  if (id === "forest-soil") {
    pathFill(ctx, [[0, 230], [120, 182], [224, 236], [332, 146], [465, 228], [574, 164], [720, 232], [843, 135], [1000, 225], [1114, 172], [1200, 220], [1200, 420], [0, 420]], "#2b4e40");
    for (let x = 45; x < 1200; x += 96) {
      ctx.fillStyle = "rgba(19, 45, 37, .8)";
      pathFill(ctx, [[x, 215], [x + 34, 91 + random() * 70], [x + 51, 215]], "rgba(19, 45, 37, .8)");
      for (let leaf = 0; leaf < 4; leaf += 1) {
        ellipse(ctx, x + 21 + (random() - .5) * 45, 113 + random() * 85, 10 + random() * 9, 29 + random() * 18, random() - .5);
        ctx.fillStyle = leaf % 2 ? "rgba(102, 143, 95, .65)" : "rgba(65, 111, 78, .7)"; ctx.fill();
      }
    }
    pathFill(ctx, [[0, 346], [240, 326], [456, 349], [703, 316], [944, 351], [1200, 324], [1200, 520], [0, 520]], "#342f28");
    return;
  }

  if (id === "soil") {
    pathFill(ctx, [[0, 204], [144, 190], [289, 208], [412, 181], [566, 211], [724, 188], [868, 215], [1019, 180], [1200, 208], [1200, 520], [0, 520]], "#4d4539");
    pathFill(ctx, [[0, 330], [180, 300], [333, 344], [505, 302], [704, 335], [882, 295], [1050, 342], [1200, 306], [1200, 520], [0, 520]], "#312d2a");
    return;
  }

  if (id === "moist-sand") {
    pathFill(ctx, [[0, 230], [130, 193], [263, 225], [384, 187], [543, 231], [688, 201], [842, 228], [1000, 188], [1200, 226], [1200, 520], [0, 520]], "#956348");
    pathFill(ctx, [[0, 331], [134, 302], [298, 340], [451, 298], [621, 338], [803, 301], [1014, 340], [1200, 303], [1200, 520], [0, 520]], "#bd8b5d");
    return;
  }

  if (id === "lakes") {
    pathFill(ctx, [[0, 190], [152, 154], [299, 196], [446, 146], [605, 192], [772, 150], [944, 192], [1102, 145], [1200, 170], [1200, 520], [0, 520]], "#2e6167");
    pathFill(ctx, [[0, 314], [196, 288], [358, 319], [545, 281], [740, 316], [922, 279], [1075, 315], [1200, 294], [1200, 520], [0, 520]], "#1f5560");
    return;
  }

  /* Freshwater has a softer, layered pond bank. */
  pathFill(ctx, [[0, 203], [144, 173], [286, 211], [432, 160], [568, 204], [708, 174], [859, 214], [1005, 164], [1200, 207], [1200, 520], [0, 520]], "#27636a");
  pathFill(ctx, [[0, 319], [166, 294], [328, 321], [517, 284], [685, 321], [860, 290], [1017, 320], [1200, 287], [1200, 520], [0, 520]], "#174f59");
}

/* A transparent, cached middle distance makes pointer movement change the
 * physical scene depth. These are large silhouettes and structures, not a
 * particle layer painted over one background. */
function drawBiomeMidground(ctx, id) {
  const random = seeded(`midground:${id}`);
  const profile = biomeMotionProfile(id);
  ctx.lineCap = "round";
  ctx.globalAlpha = .82;
  if (profile.style === "forest") {
    for (let index = 0; index < 9; index += 1) {
      const x = 38 + index * 145 + random() * 38;
      const top = 106 + random() * 92;
      ctx.fillStyle = index % 2 ? "rgba(20, 55, 45, .72)" : "rgba(27, 73, 57, .78)";
      ctx.fillRect(x - 4, top + 76, 8, 250);
      pathFill(ctx, [[x, top], [x - 42, top + 86], [x + 41, top + 86]], ctx.fillStyle);
      ellipse(ctx, x - 28, top + 46, 20, 42, -.45); ctx.fill();
      ellipse(ctx, x + 27, top + 38, 22, 48, .4); ctx.fill();
    }
  } else if (profile.style === "wetland") {
    ctx.fillStyle = "rgba(29, 78, 67, .7)";
    for (let index = 0; index < 16; index += 1) {
      const x = 20 + index * 78 + random() * 18;
      const y = 238 + random() * 40;
      strokePath(ctx, [[x, 430], [x + 4, y]], "rgba(133, 185, 135, .72)", 4);
      ellipse(ctx, x - 13, y + 21, 8, 22, -.5); ctx.fill();
      ellipse(ctx, x + 14, y + 8, 8, 24, .45); ctx.fill();
    }
  } else if (profile.style === "water" || profile.style === "coast" || profile.style === "night") {
    ctx.fillStyle = profile.style === "night" ? "rgba(58, 62, 120, .5)" : "rgba(17, 69, 72, .62)";
    pathFill(ctx, [[0, 303], [112, 279], [230, 301], [351, 265], [479, 305], [603, 276], [742, 309], [864, 269], [1001, 304], [1125, 273], [1200, 294], [1200, 418], [0, 418]], ctx.fillStyle);
    for (let index = 0; index < 10; index += 1) {
      const x = 28 + index * 133 + random() * 34;
      const y = 328 + random() * 30;
      ctx.fillStyle = index % 3 ? "rgba(104, 166, 137, .55)" : "rgba(188, 178, 112, .6)";
      ellipse(ctx, x, y, 12 + random() * 8, 5 + random() * 3, random()); ctx.fill();
    }
  } else if (profile.style === "sand") {
    ctx.fillStyle = "rgba(226, 184, 111, .48)";
    for (let index = 0; index < 10; index += 1) {
      const x = 70 + index * 126 + random() * 22;
      pathFill(ctx, [[x, 440], [x + 5, 288 + random() * 65], [x + 12, 440]], ctx.fillStyle);
      ellipse(ctx, x - 13, 323 + random() * 48, 7, 20, -.5); ctx.fill();
      ellipse(ctx, x + 19, 305 + random() * 52, 7, 22, .5); ctx.fill();
    }
  } else if (profile.style === "thermal") {
    for (let index = 0; index < 8; index += 1) {
      const x = 70 + index * 161 + random() * 40;
      ctx.fillStyle = index % 2 ? "rgba(208, 116, 73, .48)" : "rgba(189, 155, 92, .52)";
      ellipse(ctx, x, 392 + random() * 18, 35, 16, random()); ctx.fill();
      ctx.strokeStyle = "rgba(223, 175, 114, .36)"; ctx.lineWidth = 3;
      strokePath(ctx, [[x, 387], [x - 14, 315], [x + 6, 252]], ctx.strokeStyle, 3);
    }
  } else {
    ctx.fillStyle = "rgba(80, 61, 48, .54)";
    for (let index = 0; index < 11; index += 1) {
      const x = 18 + index * 116 + random() * 28;
      ellipse(ctx, x, 392 + random() * 28, 31, 14, random()); ctx.fill();
      strokePath(ctx, [[x, 390], [x + (random() - .5) * 38, 313 + random() * 38]], "rgba(172, 132, 92, .48)", 3);
    }
  }
  ctx.globalAlpha = 1;
}

function drawRack(ctx, rack, devices, x, y, width, height, hitboxes, rackIndex) {
  const slots = Array.isArray(rack?.slots) ? rack.slots : [null, null];
  const count = Math.max(1, slots.length);
  const bayWidth = (width - 34) / count;

  ctx.fillStyle = "rgba(6, 17, 20, .84)";
  roundRect(ctx, x, y, width, height, 8); ctx.fill();
  ctx.strokeStyle = "#536e67"; ctx.lineWidth = 2; ctx.stroke();
  hitboxes.push({ type: "rack", rackId: rack?.id || `rack-${rackIndex + 1}`, rackIndex, x, y, width, height });
  ctx.fillStyle = "#2d4945"; roundRect(ctx, x + 13, y + 12, width - 26, 10, 4); ctx.fill();
  ctx.fillStyle = "#a98955"; ctx.fillRect(x + 22, y + 16, width - 44, 2);
  ctx.fillStyle = "#182b2c"; roundRect(ctx, x + 13, y + 35, width - 26, height - 56, 5); ctx.fill();
  ctx.strokeStyle = "rgba(148, 173, 144, .3)"; ctx.lineWidth = 1;
  for (let rail = 0; rail < 3; rail += 1) strokePath(ctx, [[x + 25 + rail * 4, y + 39], [x + 25 + rail * 4, y + height - 28]], "rgba(148, 173, 144, .3)", 1);
  for (let slot = 0; slot < count; slot += 1) {
    const deviceId = slots[slot];
    const device = devices.find((item) => item?.id === deviceId);
    const sx = x + 28 + slot * bayWidth;
    const sw = bayWidth - 10;
    const hit = { type: "rack-slot", rackId: rack?.id || `rack-${rackIndex + 1}`, rackIndex, slot, deviceId: device?.id || null, x: sx - 8, y: y + 29, width: sw + 16, height: height - 38 };
    hitboxes.push(hit);
    if (device) hitboxes.push({ ...hit, type: "device" });
    drawInstrument(ctx, device, sx, y + 48, sw, height - 72, slot);
  }
  ctx.fillStyle = "#132424"; roundRect(ctx, x + 24, y + height - 19, width - 48, 9, 4); ctx.fill();
  ctx.fillStyle = "#a6804f"; ctx.fillRect(x + 31, y + height - 16, width - 62, 2);
  ctx.fillStyle = "#172527"; roundRect(ctx, x + 21, y + height - 5, 18, 9, 3); ctx.fill();
  roundRect(ctx, x + width - 39, y + height - 5, 18, 9, 3); ctx.fill();
}

function drawInstrument(ctx, device, x, y, width, height, index) {
  const occupied = Boolean(device);
  const deviceColor = color(device?.color, index % 2 ? "#7bbcad" : "#7da9cc");
  ctx.fillStyle = occupied ? "#304d4d" : "#203938";
  roundRect(ctx, x, y + 11, width, height - 5, 6); ctx.fill();
  ctx.strokeStyle = occupied ? "#758f83" : "#47645c"; ctx.lineWidth = 1; ctx.stroke();
  drawScrew(ctx, x + 8, y + 19, 2.2); drawScrew(ctx, x + width - 8, y + 19, 2.2);
  if (!occupied) {
    ctx.strokeStyle = "rgba(180, 194, 153, .5)"; ctx.lineWidth = 1;
    line(ctx, [[x + width * .32, y + height * .58], [x + width * .68, y + height * .58]]); ctx.stroke();
    line(ctx, [[x + width * .5, y + height * .4], [x + width * .5, y + height * .75]]); ctx.stroke();
    ctx.fillStyle = "#a98955"; ctx.fillRect(x + width * .28, y + height - 9, width * .44, 2);
    return;
  }
  ctx.fillStyle = "#152b2c"; roundRect(ctx, x + 8, y + 28, width - 16, height * .42, 3); ctx.fill();
  ctx.strokeStyle = "rgba(131, 184, 168, .65)"; ctx.lineWidth = 1;
  const channelY = y + 38;
  strokePath(ctx, [[x + 12, channelY], [x + width * .38, channelY], [x + width * .52, channelY + 10], [x + width - 11, channelY + 10]], "rgba(131, 184, 168, .65)", 1);
  strokePath(ctx, [[x + 12, channelY + 18], [x + width * .36, channelY + 18], [x + width * .45, channelY + 5], [x + width - 11, channelY + 5]], "rgba(131, 184, 168, .4)", 1);
  for (let i = 0; i < 3; i += 1) {
    ctx.fillStyle = device.status === "ready" ? "#d7b978" : device.status === "running" ? deviceColor : "#6b8e80";
    ctx.fillRect(x + 11 + i * 8, y + 20, 4, 3);
  }
  ctx.fillStyle = device.status === "ready" ? "#d8b76f" : device.status === "running" ? deviceColor : "#638173";
  roundRect(ctx, x + 12, y + height - 21, width - 24, 4, 2); ctx.fill();
  ctx.fillStyle = "#142627"; roundRect(ctx, x + 10, y + height - 12, width - 20, 5, 2); ctx.fill();
  ctx.fillStyle = "rgba(187, 204, 155, .64)"; ctx.fillRect(x + 14, y + height - 11, (width - 28) * (device.status === "running" ? .67 : device.status === "ready" ? 1 : .21), 3);
}

function drawReactor(ctx, reactor, x, y, width, height, time, reducedMotion, effectsEnabled, hitboxes) {
  const tier = String(reactor?.tier || "flask");
  const reactorColor = tier === "industrial" ? "#d9b86d" : tier === "thermal" ? "#d9896b" : tier === "automated" ? "#8fa7dc" : tier === "panel" ? "#7dbbb1" : "#86c7ad";
  const level = Math.max(1, finite(reactor?.level, 1));
  const capacity = Math.max(1, finite(reactor?.capacity, (REACTOR_CAPACITY[tier] || REACTOR_CAPACITY.flask) * (1 + (level - 1) * .08)));
  const amount = clamp(finite(reactor?.stored, 0) / capacity);
  const filledSlots = Array.isArray(reactor?.slots) ? reactor.slots.filter(Boolean) : [];
  hitboxes.push({ type: "reactor", reactorId: reactor?.id || null, tier, x, y, width, height });
  ctx.fillStyle = "#243b3b"; roundRect(ctx, x + 6, y + 8, width - 12, height - 5, 8); ctx.fill();
  ctx.strokeStyle = "#718e80"; ctx.lineWidth = 1; ctx.stroke();
  drawScrew(ctx, x + 15, y + 18, 2); drawScrew(ctx, x + width - 15, y + 18, 2);

  const still = reducedMotion || !effectsEnabled;
  if (tier === "flask") drawFlask(ctx, x + width * .5, y + 58, Math.min(width * .34, 34), height - 78, reactorColor, amount, time, still);
  else if (tier === "bench") drawBenchVessel(ctx, x, y, width, height, reactorColor, amount, time, still);
  else if (tier === "panel") drawPanelVessel(ctx, x, y, width, height, reactorColor, amount, time, still);
  else if (tier === "automated") drawTubularLoop(ctx, x, y, width, height, reactorColor, amount, time, still);
  else drawSunroom(ctx, x, y, width, height, reactorColor, amount, time, still);

  /* Each occupied chamber gets a different culture tint, so an upgraded
   * vessel reads as a living collection rather than one generic tank. */
  filledSlots.slice(0, 4).forEach((speciesId, index) => {
    const hue = hash(speciesId) % 360;
    ctx.fillStyle = `hsla(${hue}, 46%, 70%, .78)`;
    ellipse(ctx, x + 18 + index * 15, y + 17, 3.2, 3.2); ctx.fill();
    ctx.strokeStyle = "rgba(224, 216, 167, .38)"; ctx.lineWidth = 1;
    line(ctx, [[x + 18 + index * 15, y + 21], [x + 18 + index * 15, y + 29]]); ctx.stroke();
  });

  ctx.fillStyle = "rgba(210, 194, 139, .78)";
  ctx.fillRect(x + 18, y + height - 18, width - 36, 2);
  ctx.fillStyle = "#829e8e";
  ctx.fillRect(x + 19, y + height - 14, (width - 38) * clamp(finite(reactor?.level, 1) / 10), 2);
}

function drawFlask(ctx, cx, top, radius, height, tone, amount, time, reducedMotion) {
  ctx.strokeStyle = "rgba(189, 215, 193, .74)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx - 8, top - 26); ctx.lineTo(cx - 8, top - 4); ctx.bezierCurveTo(cx - 8, top + 4, cx - radius, top + 16, cx - radius, top + 28); ctx.bezierCurveTo(cx - radius, top + 48, cx + radius, top + 48, cx + radius, top + 28); ctx.bezierCurveTo(cx + radius, top + 16, cx + 8, top + 4, cx + 8, top - 4); ctx.lineTo(cx + 8, top - 26); ctx.stroke();
  ctx.fillStyle = "rgba(179, 216, 193, .12)"; roundRect(ctx, cx - 11, top - 30, 22, 7, 2); ctx.fill();
  const fluidY = top + 8 + (1 - amount) * Math.max(5, height - 27);
  ctx.fillStyle = "rgba(93, 181, 146, .7)";
  ctx.beginPath(); ctx.moveTo(cx - radius + 1, fluidY); ctx.bezierCurveTo(cx - 8, fluidY - 4, cx + 8, fluidY + 4, cx + radius - 1, fluidY); ctx.lineTo(cx + radius - 1, top + 34); ctx.bezierCurveTo(cx + radius - 1, top + 50, cx - radius + 1, top + 50, cx - radius + 1, top + 34); ctx.closePath(); ctx.fill();
  for (let i = 0; i < 3; i += 1) {
    const offset = reducedMotion ? i * 5 : ((time * .017 + i * 25) % 55);
    drawTeardrop(ctx, cx - 8 + i * 7, top + 36 - offset * .35, 1.6, tone, 0);
  }
}

function drawBenchVessel(ctx, x, y, width, height, tone, amount, time, reducedMotion) {
  const left = x + width * .22; const right = x + width * .78; const top = y + 33; const bottom = y + height - 28;
  ctx.strokeStyle = "rgba(192, 218, 204, .72)"; ctx.lineWidth = 2;
  roundRect(ctx, left, top, right - left, bottom - top, 10); ctx.stroke();
  ctx.fillStyle = "rgba(92, 181, 146, .58)"; roundRect(ctx, left + 4, bottom - (bottom - top - 8) * (.2 + amount * .65), right - left - 8, (bottom - top - 8) * (.2 + amount * .65), 6); ctx.fill();
  ctx.strokeStyle = "rgba(197, 224, 203, .55)"; ctx.lineWidth = 3;
  strokePath(ctx, [[left + 13, top - 16], [left + 13, top + 10]], "rgba(197, 224, 203, .55)", 3);
  strokePath(ctx, [[right - 13, top - 16], [right - 13, top + 10]], "rgba(197, 224, 203, .55)", 3);
  for (let i = 0; i < 5; i += 1) drawTeardrop(ctx, left + 14 + i * 13, bottom - 12 - ((time * .012 + i * 11) % 18) * (reducedMotion ? 0 : 1), 1.5, tone, 0);
}

function drawPanelVessel(ctx, x, y, width, height, tone, amount, time, reducedMotion) {
  const left = x + 16; const top = y + 34; const right = x + width - 16; const bottom = y + height - 25;
  ctx.fillStyle = "rgba(123, 188, 174, .12)"; roundRect(ctx, left, top, right - left, bottom - top, 4); ctx.fill();
  ctx.strokeStyle = "rgba(194, 221, 201, .74)"; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = "rgba(94, 181, 151, .62)"; roundRect(ctx, left + 4, top + (bottom - top) * (1 - (.24 + amount * .6)), right - left - 8, (bottom - top) * (.24 + amount * .6) - 4, 2); ctx.fill();
  ctx.strokeStyle = tone; ctx.lineWidth = 2;
  for (let index = 0; index < 3; index += 1) {
    const px = left + 17 + index * ((right - left - 34) / 2);
    strokePath(ctx, [[px, top - 9], [px, top + 7], [px + 9, top + 15]], tone, 2);
    for (let drop = 0; drop < 2; drop += 1) drawTeardrop(ctx, px + 9, top + 29 + drop * 19 - (reducedMotion ? 0 : (time * .015 + index * 11) % 15), 1.4, tone);
  }
}

function drawTubularLoop(ctx, x, y, width, height, tone, amount, time, reducedMotion) {
  const left = x + 15; const right = x + width - 15; const top = y + 36; const bottom = y + height - 29;
  ctx.strokeStyle = "rgba(194, 222, 204, .75)"; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(left, top + 9); ctx.bezierCurveTo(left, top - 12, right, top - 12, right, top + 9); ctx.lineTo(right, bottom - 4); ctx.bezierCurveTo(right, bottom + 16, left, bottom + 16, left, bottom - 4); ctx.closePath(); ctx.stroke();
  ctx.strokeStyle = "rgba(73, 142, 130, .72)"; ctx.lineWidth = 3; ctx.stroke();
  for (let index = 0; index < 5; index += 1) {
    const progress = reducedMotion ? index / 5 : (time * .00007 + index / 5) % 1;
    const px = lerp(left + 5, right - 5, progress);
    const py = progress < .5 ? top + 3 : bottom + 1;
    drawTeardrop(ctx, px, py, 2, tone, 0);
  }
  ctx.fillStyle = `rgba(134, 195, 169, ${.12 + amount * .2})`;
  roundRect(ctx, x + 26, y + 59, width - 52, 9, 3); ctx.fill();
}

function drawSunroom(ctx, x, y, width, height, tone, amount, time, reducedMotion) {
  const left = x + 12; const top = y + 30; const right = x + width - 12; const bottom = y + height - 25;
  ctx.fillStyle = "rgba(218, 187, 104, .08)"; roundRect(ctx, left, top, right - left, bottom - top, 5); ctx.fill();
  ctx.strokeStyle = "rgba(218, 210, 174, .68)"; ctx.lineWidth = 1.5; ctx.stroke();
  for (let column = 1; column < 4; column += 1) strokePath(ctx, [[left + (right - left) * column / 4, top], [left + (right - left) * column / 4, bottom]], "rgba(218, 210, 174, .45)", 1);
  ctx.fillStyle = "rgba(213, 167, 94, .48)"; roundRect(ctx, left + 3, bottom - (bottom - top - 7) * (.18 + amount * .67), right - left - 6, (bottom - top - 7) * (.18 + amount * .67), 3); ctx.fill();
  ctx.strokeStyle = tone; ctx.lineWidth = 2;
  for (let index = 0; index < 6; index += 1) {
    const px = left + 10 + index * ((right - left - 20) / 5);
    strokePath(ctx, [[px, top - 12], [px, top + 8]], tone, 2);
    drawTeardrop(ctx, px, top + 29 + (reducedMotion ? 0 : Math.sin(time * .002 + index) * 4), 1.7, tone);
  }
}

function drawLabDynamic(ctx, state, time, reducedMotion, effectsEnabled, hitboxes) {
  const racks = Array.isArray(state?.racks) && state.racks.length ? state.racks : [{ id: "rack-empty", slots: [null, null], name: "North Window Rack" }];
  const devices = Array.isArray(state?.devices) ? state.devices : [];
  const rackWidth = racks.length > 2 ? 292 : racks.length > 1 ? 342 : 468;
  const rackGap = racks.length > 1 ? 22 : 0;
  const rackCount = Math.min(3, racks.length);
  const rackTotal = rackCount * rackWidth + Math.max(0, rackCount - 1) * rackGap;
  const rackStart = Math.max(254, (1200 - rackTotal) / 2);
  const rackY = 192;
  racks.slice(0, 3).forEach((rack, index) => drawRack(ctx, rack, devices, rackStart + index * (rackWidth + rackGap), rackY - (index % 2) * 5, rackWidth, 130, hitboxes, index));

  const reactors = Array.isArray(state?.reactors) && state.reactors.length ? state.reactors : [{ id: "reactor-empty", tier: "flask", slots: [], stored: 0, level: 1 }];
  const visibleReactors = reactors.slice(0, 7);
  const reactorGap = 10;
  const reactorWidth = Math.min(168, 850 / Math.max(1, visibleReactors.length));
  const reactorTotal = visibleReactors.length * reactorWidth + Math.max(0, visibleReactors.length - 1) * reactorGap;
  const reactorStart = Math.max(264, (1200 - reactorTotal) / 2);
  const reactorY = 317;
  const reactorHeight = 150;

  /* Fixed hose runs join the discovery rack to the vessels on the bench. */
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(196, 219, 190, .72)"; ctx.lineWidth = 5;
  visibleReactors.forEach((reactor, index) => {
    const x = reactorStart + index * (reactorWidth + reactorGap);
    const rackX = rackStart + (index % rackCount) * (rackWidth + rackGap) + rackWidth * (.34 + (index % 2) * .22);
    strokePath(ctx, [[rackX, rackY + 125], [rackX, 326], [x + reactorWidth * .32, 326], [x + reactorWidth * .32, reactorY + 7]], "rgba(196, 219, 190, .72)", 5);
    ctx.strokeStyle = "rgba(70, 139, 126, .7)"; ctx.lineWidth = 2;
    strokePath(ctx, [[rackX, rackY + 125], [rackX, 326], [x + reactorWidth * .32, 326], [x + reactorWidth * .32, reactorY + 7]], "rgba(70, 139, 126, .7)", 2);
  });
  ctx.strokeStyle = "#c4dbbe"; ctx.lineWidth = 1;
  visibleReactors.forEach((reactor, index) => drawReactor(ctx, reactor, reactorStart + index * (reactorWidth + reactorGap), reactorY, reactorWidth, reactorHeight, time, reducedMotion, effectsEnabled, hitboxes));

  /* Labels anchor the objects without competing with the app's overlay zones. */
  ctx.font = "600 9px system-ui, sans-serif";
  ctx.letterSpacing = "1px";
  ctx.fillStyle = "rgba(216, 201, 155, .68)";
  racks.slice(0, 3).forEach((rack, index) => ctx.fillText(String(rack?.name || `Rack ${index + 1}`).toUpperCase(), rackStart + index * (rackWidth + rackGap) + 19, rackY - 9 - (index % 2) * 5));
  ctx.fillStyle = "rgba(190, 213, 184, .52)";
  ctx.fillText("CULTIVATION BENCH · LIVE CULTURES", reactorStart, reactorY - 10);
}

function biomeMotionProfile(id) {
  const profiles = {
    freshwater: { speed: .7, style: "water", foreground: "#9ac8a4" },
    lakes: { speed: .55, style: "water", foreground: "#8db9ac" },
    "moist-sand": { speed: .32, style: "sand", foreground: "#e0be7d" },
    coastal: { speed: .85, style: "coast", foreground: "#a7d8d4" },
    soil: { speed: .23, style: "soil", foreground: "#b08e6c" },
    "forest-soil": { speed: .38, style: "forest", foreground: "#a7c98b" },
    wetlands: { speed: .63, style: "wetland", foreground: "#afd4aa" },
    thermal: { speed: .46, style: "thermal", foreground: "#e2ac72" },
    "night-tide": { speed: .75, style: "night", foreground: "#beb8e2" },
  };
  return profiles[id] || profiles.freshwater;
}

function drawBiomeDynamic(ctx, id, time, reducedMotion, effectsEnabled, pointer, hitboxes) {
  const profile = biomeMotionProfile(id);
  const drift = reducedMotion || !effectsEnabled ? 0 : time * .001 * profile.speed;
  const pointerX = reducedMotion || !effectsEnabled ? 0 : (finite(pointer?.x, .5) - .5) * 12;
  const pointerY = reducedMotion || !effectsEnabled ? 0 : (finite(pointer?.y, .5) - .5) * 5;
  const random = seeded(`foreground:${id}`);
  ctx.save();
  ctx.translate(pointerX, pointerY);

  if (profile.style === "water" || profile.style === "coast" || profile.style === "night") {
    ctx.strokeStyle = profile.foreground;
    ctx.globalAlpha = profile.style === "night" ? .38 : .32;
    ctx.lineWidth = 1.3;
    for (let row = 0; row < 10; row += 1) {
      const y = 330 + row * 17;
      const points = [];
      for (let x = -30; x <= 1230; x += 54) points.push([x, y + Math.sin(x * .018 + drift * (1 + row * .04)) * (2 + row * .2)]);
      strokePath(ctx, points, ctx.strokeStyle, ctx.lineWidth);
    }
  }

  if (profile.style === "sand") {
    ctx.globalAlpha = .55;
    for (let i = 0; i < 110; i += 1) {
      const x = random() * 1200; const y = 334 + random() * 178; const size = .7 + random() * 2.1;
      ctx.fillStyle = i % 5 === 0 ? "#e5c78d" : i % 3 === 0 ? "#936546" : "#b47b54";
      ellipse(ctx, x + Math.sin(drift + i) * 1.3, y, size * 1.7, size * .6, random()); ctx.fill();
    }
    for (let i = 0; i < 7; i += 1) {
      const x = 70 + i * 181 + Math.sin(drift * .4 + i) * 4;
      strokePath(ctx, [[x, 475], [x + 13, 427], [x + 8, 385]], "rgba(228, 187, 112, .62)", 2);
      ellipse(ctx, x + 12, 430, 5, 12, -.5); ctx.fillStyle = "rgba(229, 190, 116, .5)"; ctx.fill();
    }
  }

  if (profile.style === "soil" || profile.style === "forest" || profile.style === "wetland") {
    ctx.lineCap = "round";
    const roots = profile.style === "forest" ? 13 : 10;
    for (let i = 0; i < roots; i += 1) {
      const x = 38 + i * 95 + random() * 32;
      const top = profile.style === "forest" ? 280 + random() * 70 : 315 + random() * 58;
      const bend = x + (random() - .5) * 110;
      strokePath(ctx, [[x, 518], [x - 11, 475], [bend, 430], [bend + (random() - .5) * 28, top]], profile.style === "forest" ? "rgba(139, 169, 103, .56)" : "rgba(172, 131, 91, .64)", profile.style === "forest" ? 3 : 2);
      if (i % 2 === 0) strokePath(ctx, [[bend, 430], [bend - 22, 412], [bend - 35, top + 12]], "rgba(156, 126, 91, .46)", 1.5);
    }
    if (profile.style === "wetland") {
      for (let i = 0; i < 18; i += 1) {
        const x = 15 + i * 71 + Math.sin(drift * .2 + i) * 3;
        strokePath(ctx, [[x, 425], [x + 5, 342 - random() * 42]], "rgba(157, 199, 148, .7)", 2);
        strokePath(ctx, [[x + 5, 355], [x - 10, 341]], "rgba(157, 199, 148, .55)", 1.5);
        strokePath(ctx, [[x + 5, 370], [x + 18, 353]], "rgba(157, 199, 148, .55)", 1.5);
      }
    }
    if (profile.style === "forest") {
      ctx.fillStyle = "rgba(180, 204, 172, .12)";
      pathFill(ctx, [[0, 319], [200, 290], [390, 326], [595, 286], [780, 320], [1000, 284], [1200, 313], [1200, 393], [0, 393]], "rgba(180, 204, 172, .12)");
    }
  }

  if (profile.style === "thermal") {
    ctx.globalAlpha = .56;
    for (let plume = 0; plume < 7; plume += 1) {
      const x = 100 + plume * 175 + Math.sin(drift * .25 + plume) * 8;
      const y = 418 - (drift * 18 + plume * 29) % 112;
      strokePath(ctx, [[x, 470], [x - 12, y + 22], [x + 7, y], [x - 3, y - 21]], "rgba(225, 183, 126, .48)", 3);
      strokePath(ctx, [[x + 3, 466], [x + 19, y + 41], [x + 12, y + 9]], "rgba(170, 204, 172, .26)", 2);
    }
    for (let i = 0; i < 12; i += 1) {
      const x = random() * 1200; const y = 399 + random() * 107;
      ctx.fillStyle = i % 2 ? "#b56f50" : "#d69f62";
      ellipse(ctx, x, y, 7 + random() * 10, 3 + random() * 4, random()); ctx.fill();
    }
  }

  /* Foreground frame: cut banks, reeds, and a few quiet mineral outcrops. */
  ctx.globalAlpha = 1;
  pathFill(ctx, [[0, 470], [120, 454], [239, 471], [350, 449], [472, 478], [604, 450], [731, 477], [861, 448], [1008, 473], [1123, 451], [1200, 466], [1200, 520], [0, 520]], profile.style === "sand" ? "rgba(91, 59, 47, .52)" : profile.style === "thermal" ? "rgba(49, 29, 37, .56)" : "rgba(8, 29, 34, .48)");
  for (let i = 0; i < 13; i += 1) {
    const x = -20 + i * 102 + ((i % 3) * 13);
    const y = 454 + (i % 4) * 5;
    ctx.fillStyle = i % 3 === 0 ? "rgba(196, 167, 113, .42)" : "rgba(58, 91, 78, .58)";
    pathFill(ctx, [[x - 14, y + 10], [x, y - 8 - (i % 3) * 5], [x + 19, y + 11], [x + 7, y + 19]], ctx.fillStyle);
  }
  ctx.restore();
  hitboxes.push({ type: "field", sceneId: id, x: 0, y: 0, width: 1200, height: 520 });
}

function sceneHit(hitboxes, x, y) {
  for (let index = hitboxes.length - 1; index >= 0; index -= 1) {
    const hit = hitboxes[index];
    if (x >= hit.x && x <= hit.x + hit.width && y >= hit.y && y <= hit.y + hit.height) return hit;
  }
  return null;
}

/**
 * Create a BioRealm Canvas 2D scene.
 *
 * `onSelect(hit)` receives `{type, ...}` for rack slots, devices, reactors,
 * or the current field.  Coordinates are in the 1200x520 logical scene.
 */
export function createScene(canvas, options = {}) {
  const context = canvas?.getContext?.("2d");
  if (!canvas || !context) {
    return {
      update() {}, draw() {}, destroy() {}, metrics: () => ({ supported: false, frames: 0, staticHits: 0, staticPlates: staticArt.size }),
    };
  }
  const onSelect = typeof options.onSelect === "function" ? options.onSelect : null;
  let state = {};
  let sceneId = "lab";
  let settings = {};
  let destroyed = false;
  let dpr = 1;
  let frames = 0;
  let skipped = 0;
  let lastTime = 0;
  let timeOffset = 0;
  let hiddenSince = null;
  let staticHits = 0;
  let staticCanvas = null;
  let midCanvas = null;
  let hitboxes = [];
  let pointer = { x: .5, y: .5 };
  let resizeObserver = null;
  let intersectionObserver = null;
  let inViewport = true;
  let layout = { width: LOGICAL_WIDTH, height: LOGICAL_HEIGHT, left: 0, top: 0 };

  function resize() {
    if (destroyed) return;
    const rect = canvas.getBoundingClientRect?.();
    const measuredWidth = finite(rect?.width, canvas.clientWidth || LOGICAL_WIDTH);
    const measuredHeight = finite(rect?.height, canvas.clientHeight || LOGICAL_HEIGHT);
    const cssWidth = measuredWidth <= 0 ? 0 : Math.max(1, measuredWidth);
    const cssHeight = measuredHeight <= 0 ? 0 : Math.max(1, measuredHeight);
    layout = { width: cssWidth, height: cssHeight, left: finite(rect?.left), top: finite(rect?.top) };
    dpr = Math.min(1.5, Math.max(1, finite(typeof window !== "undefined" ? window.devicePixelRatio : 1, 1)));
    const pixelWidth = Math.max(1, Math.round(Math.max(1, cssWidth) * dpr));
    const pixelHeight = Math.max(1, Math.round(Math.max(1, cssHeight) * dpr));
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) { canvas.width = pixelWidth; canvas.height = pixelHeight; }
  }

  function localPoint(event) {
    const rect = canvas.getBoundingClientRect?.() || layout;
    const width = Math.max(1, finite(rect?.width, layout.width));
    const height = Math.max(1, finite(rect?.height, layout.height));
    const rawX = clamp((finite(event.clientX) - finite(rect?.left, layout.left)) / width, 0, 1);
    const rawY = clamp((finite(event.clientY) - finite(rect?.top, layout.top)) / height, 0, 1);
    const scale = Math.min(width / LOGICAL_WIDTH, height / LOGICAL_HEIGHT);
    const offsetX = (width - LOGICAL_WIDTH * scale) / 2;
    const offsetY = (height - LOGICAL_HEIGHT * scale) / 2;
    return {
      x: clamp((rawX * width - offsetX) / scale, 0, LOGICAL_WIDTH),
      y: clamp((rawY * height - offsetY) / scale, 0, LOGICAL_HEIGHT),
      nx: rawX, ny: rawY,
    };
  }

  function move(event) {
    const point = localPoint(event);
    pointer = { x: point.nx, y: point.ny };
  }

  function select(event) {
    if (destroyed || !onSelect) return;
    const point = localPoint(event);
    const hit = sceneHit(hitboxes, point.x, point.y);
    if (hit) onSelect({ ...hit, point: { x: point.x, y: point.y } });
  }

  canvas.addEventListener?.("pointermove", move, { passive: true });
  canvas.addEventListener?.("pointerdown", select, { passive: true });
  if (typeof ResizeObserver !== "undefined") { resizeObserver = new ResizeObserver(resize); resizeObserver.observe(canvas); }
  if (typeof IntersectionObserver !== "undefined") {
    intersectionObserver = new IntersectionObserver((entries) => {
      const entry = entries.find((item) => item.target === canvas);
      if (entry) inViewport = Boolean(entry.isIntersecting && entry.intersectionRatio > 0);
    }, { threshold: [0, .01] });
    intersectionObserver.observe(canvas);
  }
  resize();

  function update(nextState, nextSceneId = "lab", nextSettings = {}) {
    state = nextState && typeof nextState === "object" ? nextState : {};
    sceneId = SCENE_IDS.has(nextSceneId) ? nextSceneId : "lab";
    settings = nextSettings && typeof nextSettings === "object" ? nextSettings : {};
    const art = cacheStatic(sceneId);
    staticCanvas = art.canvas;
    midCanvas = art.midCanvas;
    if (art.hit) staticHits += 1;
    resize();
    return { sceneId, cached: art.hit };
  }

  function draw(timeMs = 0) {
    if (destroyed) return false;
    const timestamp = finite(timeMs, lastTime);
    const documentHidden = typeof document !== "undefined" && Boolean(document.hidden);
    if (!inViewport || documentHidden || canvas.hidden || layout.width <= 0 || layout.height <= 0) {
      if (hiddenSince === null) hiddenSince = timestamp;
      skipped += 1;
      return false;
    }
    if (hiddenSince !== null) {
      timeOffset += Math.max(0, timestamp - hiddenSince);
      hiddenSince = null;
    }
    const reducedMotion = Boolean(settings.reducedMotion);
    const effectsEnabled = settings.effects !== false;
    const time = reducedMotion ? lastTime : Math.max(lastTime, timestamp - timeOffset);
    lastTime = time;
    context.setTransform?.(dpr, 0, 0, dpr, 0, 0);
    const cssWidth = layout.width;
    const cssHeight = layout.height;
    const scale = Math.min(cssWidth / LOGICAL_WIDTH, cssHeight / LOGICAL_HEIGHT);
    const offsetX = (cssWidth - LOGICAL_WIDTH * scale) / 2;
    const offsetY = (cssHeight - LOGICAL_HEIGHT * scale) / 2;
    context.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    context.save();
    context.translate(offsetX, offsetY);
    context.scale(scale, scale);
    const parallax = sceneId !== "lab" && effectsEnabled && !reducedMotion;
    const staticShiftX = parallax ? (pointer.x - .5) * 2.2 : 0;
    const staticShiftY = parallax ? (pointer.y - .5) * .8 : 0;
    if (staticCanvas) {
      context.save(); context.translate(staticShiftX, staticShiftY); context.drawImage(staticCanvas, 0, 0); context.restore();
    }
    if (midCanvas) {
      context.save(); context.translate(parallax ? (pointer.x - .5) * 8 : 0, parallax ? (pointer.y - .5) * 3 : 0); context.drawImage(midCanvas, 0, 0); context.restore();
    }
    hitboxes = [];
    if (sceneId === "lab") drawLabDynamic(context, state, time, reducedMotion, effectsEnabled, hitboxes);
    else drawBiomeDynamic(context, sceneId, time, reducedMotion, effectsEnabled, pointer, hitboxes);
    /* A restrained vignette keeps the physical set legible at the card edge. */
    context.fillStyle = gradient(context, 0, 0, 1200, 0, [[0, "rgba(4, 15, 20, .15)"], [.11, "rgba(4, 15, 20, 0)"], [.89, "rgba(4, 15, 20, 0)"], [1, "rgba(4, 15, 20, .2)"]]);
    context.fillRect(0, 0, 1200, 520);
    context.restore();
    frames += 1;
    return true;
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    resizeObserver?.disconnect?.();
    intersectionObserver?.disconnect?.();
    canvas.removeEventListener?.("pointermove", move);
    canvas.removeEventListener?.("pointerdown", select);
    hitboxes = [];
  }

  function metrics() {
    return { supported: true, frames, skipped, dpr, sceneId, staticHits, staticPlates: staticArt.size, hitboxes: hitboxes.length, inViewport, destroyed };
  }

  update({}, "lab", {});
  return { update, draw, destroy, metrics };
}

function svgColor(value, fallback) {
  return /^#[\da-f]{3,8}$/i.test(String(value || "")) ? String(value) : fallback;
}

/**
 * Return a trusted, inline microscopy portrait.  `species` can be a BioRealm
 * species record or just its id; unknown records receive a quiet silhouette.
 */
export function speciesPortrait(species, known = true) {
  const record = typeof species === "object" && species ? species : { id: species };
  const id = String(record.id || record.name || "unknown").toLowerCase();
  const primary = svgColor(record.color, "#78bca0");
  const secondary = svgColor(record.secondaryColor, "#d0c58e");
  const seed = hash(id);
  const gradientId = `portrait-gradient-${seed.toString(16)}-${++portraitSerial}`;
  let body = "";
  if (!known) {
    body = `<path d="M50 20c18 3 30 13 31 29 2 17-10 30-27 32-19 3-35-8-36-26-1-17 13-33 32-35Z" fill="#304a48" stroke="#9db2a0" stroke-width="1.5"/><path d="M28 65c14-9 32-8 45 2" fill="none" stroke="#67867a" stroke-width="2"/>`;
  } else if (id.includes("arthrospira")) {
    /* Arthrospira: a coiled, septate cyanobacterial filament. */
    body = `<path d="M13 54c4-22 20-32 34-25 12 6 8 24-4 27-13 3-18-13-8-20 11-8 28-1 30 13 3 18-13 31-29 24-11-5-13-18-5-25 10-9 30-5 38 8" fill="none" stroke="${primary}" stroke-width="7" stroke-linecap="round"/><path d="M14 54c4-22 20-32 34-25 12 6 8 24-4 27-13 3-18-13-8-20 11-8 28-1 30 13 3 18-13 31-29 24-11-5-13-18-5-25 10-9 30-5 38 8" fill="none" stroke="${secondary}" stroke-width="1.5" stroke-linecap="round" opacity=".9"/><path d="M23 39l5 5M35 30l3 7M52 39l-6 3M66 51l-7 0M59 70l-4-6M40 75l1-7" stroke="#d7e4b4" stroke-width="1" opacity=".8"/>`;
  } else if (id.includes("chlorella") || id.includes("nannochloropsis")) {
    /* Chlorella/Nannochloropsis: discrete spherical cells with a visible
     * chloroplast rim and pyrenoid-like center. */
    const count = id.includes("nannochloropsis") ? 6 : 7;
    const cells = [];
    for (let index = 0; index < count; index += 1) {
      const x = 22 + ((seed + index * 29) % 58);
      const y = 22 + ((seed * 3 + index * 23) % 58);
      const r = 7 + ((seed + index * 7) % 4);
      cells.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${primary}" opacity=".84" stroke="#d4dfac" stroke-width="1.2"/><circle cx="${x - 2}" cy="${y - 2}" r="${Math.max(2, r * .26)}" fill="${secondary}" opacity=".85"/>`);
    }
    body = cells.join("");
  } else if (id.includes("tetraselmis")) {
    /* Tetraselmis: pear-shaped motile cell with four anterior flagella. */
    body = `<path d="M50 29c17 0 26 12 23 28-3 17-13 28-24 28-12 0-22-12-22-28 0-16 9-28 23-28Z" fill="${primary}" opacity=".82" stroke="#d8e2b7" stroke-width="1.5"/><ellipse cx="43" cy="49" rx="7" ry="11" fill="${secondary}" opacity=".5"/><circle cx="43" cy="47" r="3" fill="#e1ca78"/><path d="M42 31C31 18 20 17 13 10M47 30C43 16 39 10 34 6M53 30C57 15 64 9 72 6M58 32c11-12 21-14 29-13" fill="none" stroke="${secondary}" stroke-width="1.7" stroke-linecap="round"/>`;
  } else if (id.includes("desmodesmus")) {
    /* Desmodesmus: four-celled coenobium with pointed terminal spines. */
    body = `<g fill="${primary}" opacity=".85" stroke="#d9e1ad" stroke-width="1.3"><ellipse cx="25" cy="51" rx="12" ry="19"/><ellipse cx="42" cy="48" rx="12" ry="20"/><ellipse cx="59" cy="48" rx="12" ry="20"/><ellipse cx="76" cy="51" rx="12" ry="19"/></g><path d="M16 35L8 19M84 36l8-17M21 65l-8 15M79 65l8 15" stroke="${secondary}" stroke-width="2" stroke-linecap="round"/><path d="M25 40v22M42 38v23M59 38v23M76 40v22" stroke="${secondary}" stroke-width="1" opacity=".72"/>`;
  } else if (id.includes("diatom")) {
    /* Pennate diatom fallback for future reference records. */
    body = `<path d="M50 12c15 12 22 25 22 38S65 76 50 88C35 76 28 63 28 50s7-26 22-38Z" fill="${primary}" opacity=".72" stroke="#d8dfb5" stroke-width="1.5"/><path d="M38 22c8 19 8 38 0 56M48 15c6 23 6 46 0 70M58 22c-8 19-8 38 0 56M33 40h34M31 50h38M33 60h34" fill="none" stroke="${secondary}" stroke-width="1.2" opacity=".9"/>`;
  } else {
    const cells = [];
    const count = 3 + seed % 5;
    for (let index = 0; index < count; index += 1) {
      const x = 18 + ((seed + index * 37) % 68);
      const y = 18 + ((seed * 3 + index * 29) % 68);
      const r = 4 + ((seed + index * 11) % 5);
      cells.push(`<ellipse cx="${x}" cy="${y}" rx="${r + 2}" ry="${r}" transform="rotate(${(seed + index * 17) % 180} ${x} ${y})"/>`);
    }
    body = `<path d="M21 34c11-12 47-10 57 4 11 15-4 34-27 38-21 3-40-9-38-24 1-7 4-13 8-18Z" fill="${primary}" opacity=".76" stroke="#d0d5a2" stroke-width="1.4"/>${cells.join("")}`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Microscopy portrait" focusable="false"><defs><radialGradient id="${gradientId}" cx="38%" cy="28%"><stop stop-color="#d5e2c0" stop-opacity=".34"/><stop offset="1" stop-color="#10272c" stop-opacity=".05"/></radialGradient></defs><circle cx="50" cy="50" r="47" fill="#10282d" stroke="#789489" stroke-width="2"/><circle cx="50" cy="50" r="42" fill="url(#${gradientId})"/>${body}<path d="M13 75c20 11 51 16 75-2" fill="none" stroke="#d9c990" stroke-opacity=".2" stroke-width="1"/></svg>`;
}

export const sceneIds = [...SCENE_IDS];
