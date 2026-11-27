/* Orr Biologicals — the living culture layer.
   Four canvas plates, no libraries:
     bloom   a drifting field of phytoplankton behind the hero (the only scene
             that moves: it is background, and it answers the scroll)
     vessel  one glass bottle of live culture
     strain  a single cell morphology, drawn at relative scale
     shelf   three vessels under light
   The vessels and cells are still illustrations, not simulations, so they are
   painted once and never animated. Decoration only: the page reads complete
   without this file, and one still frame is drawn when motion is reduced. */
(function () {
  "use strict";

  var TAU = Math.PI * 2;
  var reduceMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reduce = reduceMQ.matches;

  function rand(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function makeCanvas(w, h) {
    var c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(w));
    c.height = Math.max(1, Math.round(h));
    return c;
  }

  /* ============================================================
     Cell painting. Every cell is drawn in a unit space where the
     body radius is about 1, then scaled by the scene.
     ============================================================ */

  function glow(ctx, r, tint) {
    var g = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r * 2.15);
    g.addColorStop(0, "rgba(" + tint + ",.24)");
    g.addColorStop(0.5, "rgba(" + tint + ",.08)");
    g.addColorStop(1, "rgba(" + tint + ",0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r * 2.15, 0, TAU);
    ctx.fill();
  }

  function orb(ctx, rx, ry, c0, c1, c2) {
    var g = ctx.createRadialGradient(-rx * 0.35, -ry * 0.38, rx * 0.04, 0, 0, Math.max(rx, ry) * 1.18);
    g.addColorStop(0, c0);
    g.addColorStop(0.52, c1);
    g.addColorStop(1, c2);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, TAU);
    ctx.fill();
  }

  function flagella(ctx, t, count, len, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.026;
    ctx.lineCap = "round";
    for (var f = 0; f < count; f++) {
      var spread = count > 1 ? (f / (count - 1) - 0.5) : 0;
      ctx.beginPath();
      ctx.moveTo(-0.68, -0.08 + spread * 0.22);
      for (var i = 1; i <= 16; i++) {
        var u = i / 16;
        var x = -0.68 - u * len;
        var y = -0.08 + spread * 0.24 +
          Math.sin(t * 3.1 + u * 7.5 + f * 1.9) * 0.26 * u +
          Math.sin(t * 1.7 + f) * 0.05 * u;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawNanno(ctx) {
    glow(ctx, 1, "170,226,86");
    orb(ctx, 1, 1, "#E9FFB8", "#9CD247", "#3C6A15");
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = "#2F5710";
    ctx.beginPath();
    ctx.ellipse(-0.2, 0.12, 0.46, 0.38, 0.5, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0.3, -0.18, 0.26, 0.22, -0.4, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
    var s = ctx.createRadialGradient(-0.38, -0.42, 0.02, -0.38, -0.42, 0.44);
    s.addColorStop(0, "rgba(255,255,242,.92)");
    s.addColorStop(1, "rgba(255,255,242,0)");
    ctx.fillStyle = s;
    ctx.beginPath();
    ctx.arc(-0.38, -0.42, 0.44, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(235,255,190,.48)";
    ctx.lineWidth = 0.03;
    ctx.beginPath();
    ctx.arc(0, 0, 0.985, 0, TAU);
    ctx.stroke();
  }

  function drawTiso(ctx, t, live) {
    glow(ctx, 1, "226,214,132");
    if (live) flagella(ctx, t, 2, 1.9, "rgba(248,242,198,.55)");
    ctx.save();
    ctx.rotate(-0.22);
    orb(ctx, 1, 0.74, "#F7F0C2", "#CDBC60", "#6C5B21");
    ctx.globalAlpha = 0.32;
    ctx.fillStyle = "#6F5D18";
    ctx.beginPath();
    ctx.ellipse(0.3, 0.05, 0.34, 0.27, 0.35, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(255,255,235,.5)";
    ctx.beginPath();
    ctx.ellipse(-0.42, -0.28, 0.26, 0.15, -0.5, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,250,212,.42)";
    ctx.lineWidth = 0.028;
    ctx.beginPath();
    ctx.ellipse(0, 0, 0.99, 0.73, 0, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  function drawPavlova(ctx, t, live) {
    glow(ctx, 1, "214,222,138");
    if (live) flagella(ctx, t, 3, 1.5, "rgba(240,240,190,.45)");
    ctx.save();
    ctx.rotate(0.16);
    orb(ctx, 0.92, 0.94, "#F4F2C0", "#C8CB6E", "#5F6420");
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = "#5C5E18";
    ctx.beginPath();
    ctx.ellipse(0.26, 0.2, 0.3, 0.26, 0.2, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
    var s = ctx.createRadialGradient(-0.3, -0.34, 0.02, -0.3, -0.34, 0.4);
    s.addColorStop(0, "rgba(255,255,238,.8)");
    s.addColorStop(1, "rgba(255,255,238,0)");
    ctx.fillStyle = s;
    ctx.beginPath();
    ctx.arc(-0.3, -0.34, 0.4, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(248,250,205,.4)";
    ctx.lineWidth = 0.028;
    ctx.beginPath();
    ctx.arc(0, 0, 0.93, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  function drawChaeto(ctx) {
    glow(ctx, 1.5, "228,214,138");
    var cells = 4;
    var cellH = 0.6;
    var gap = 0.07;
    for (var i = 0; i < cells; i++) {
      var y = (i - (cells - 1) / 2) * (cellH + gap);
      var w = 0.6 + Math.sin(i * 1.7) * 0.04;
      var g = ctx.createLinearGradient(-w, y, w, y + cellH);
      g.addColorStop(0, "#F2E6B4");
      g.addColorStop(0.45, "#C9B75D");
      g.addColorStop(1, "#796425");
      ctx.fillStyle = g;
      roundRect(ctx, -w, y - cellH / 2, w * 2, cellH, 0.09);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,248,214,.45)";
      ctx.lineWidth = 0.024;
      ctx.stroke();
      ctx.strokeStyle = "rgba(232,222,170,.34)";
      ctx.lineWidth = 0.02;
      for (var s = 0; s < 2; s++) {
        var dir = s ? 1 : -1;
        ctx.beginPath();
        ctx.moveTo(dir * w, y - cellH * 0.3);
        ctx.quadraticCurveTo(dir * (w + 0.7), y - cellH * 0.95, dir * (w + 1.3), y - cellH * 1.2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(dir * w, y + cellH * 0.3);
        ctx.quadraticCurveTo(dir * (w + 0.62), y + cellH * 0.9, dir * (w + 1.15), y + cellH * 1.1);
        ctx.stroke();
      }
    }
  }

  function drawThalassio(ctx) {
    glow(ctx, 1, "228,218,152");
    var g = ctx.createRadialGradient(-0.32, -0.32, 0.04, 0, 0, 1.1);
    g.addColorStop(0, "#FCF4D2");
    g.addColorStop(0.6, "#D7C879");
    g.addColorStop(1, "#89752D");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, 1, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(116,96,38,.42)";
    ctx.lineWidth = 0.028;
    ctx.beginPath();
    ctx.arc(0, 0, 0.77, 0, TAU);
    ctx.stroke();
    for (var ring = 0; ring < 2; ring++) {
      var n = ring ? 16 : 9;
      var rr = ring ? 0.54 : 0.86;
      for (var i = 0; i < n; i++) {
        var a = (i / n) * TAU + ring * 0.3;
        ctx.fillStyle = "rgba(104,88,36,.5)";
        ctx.beginPath();
        ctx.arc(Math.cos(a) * rr, Math.sin(a) * rr, 0.042, 0, TAU);
        ctx.fill();
      }
    }
    ctx.fillStyle = "rgba(120,102,44,.55)";
    ctx.beginPath();
    ctx.arc(0, 0, 0.085, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,250,222,.42)";
    ctx.lineWidth = 0.024;
    ctx.beginPath();
    ctx.arc(0, 0, 0.99, 0, TAU);
    ctx.stroke();
  }

  function drawTetra(ctx, t, live) {
    glow(ctx, 1.15, "168,224,96");
    if (live) flagella(ctx, t, 4, 1.45, "rgba(214,255,168,.5)");
    ctx.save();
    ctx.rotate(0.12);
    orb(ctx, 1.02, 0.78, "#DBFFA6", "#8CC140", "#32560E");
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = "#3F6B12";
    ctx.lineWidth = 0.022;
    for (var i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(-0.5 + i * 0.18, -0.62);
      ctx.quadraticCurveTo(-0.34 + i * 0.18, 0, -0.5 + i * 0.18, 0.62);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(242,255,206,.6)";
    ctx.beginPath();
    ctx.arc(0.34, 0.1, 0.16, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "rgba(206,84,38,.9)";
    ctx.beginPath();
    ctx.arc(-0.6, -0.3, 0.08, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(226,255,178,.4)";
    ctx.lineWidth = 0.028;
    ctx.beginPath();
    ctx.ellipse(0, 0, 1.0, 0.76, 0, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  function drawCell(ctx, type, t, live) {
    if (type === "tiso") drawTiso(ctx, t, live);
    else if (type === "pavlova") drawPavlova(ctx, t, live);
    else if (type === "chaeto") drawChaeto(ctx);
    else if (type === "thalassio") drawThalassio(ctx);
    else if (type === "tetra") drawTetra(ctx, t, live);
    else drawNanno(ctx);
  }

  /* Pre-rendered bodies keep the bloom cheap. Flagella are left off the
     sprites and beaten live on the few large, near cells. */
  var SPRITE_SIZE = 320;
  var SPRITE_R = 62;
  var spriteCache = {};

  function cellSprite(type) {
    if (spriteCache[type]) return spriteCache[type];
    var c = makeCanvas(SPRITE_SIZE, SPRITE_SIZE);
    var x = c.getContext("2d");
    x.translate(SPRITE_SIZE / 2, SPRITE_SIZE / 2);
    x.scale(SPRITE_R, SPRITE_R);
    drawCell(x, type, 0, false);
    spriteCache[type] = c;
    return c;
  }

  function drawSprite(ctx, type, x, y, r, rot, alpha) {
    var d = SPRITE_SIZE * (r / SPRITE_R);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.drawImage(cellSprite(type), -d / 2, -d / 2, d, d);
    ctx.restore();
  }

  /* ============================================================
     Vessels: a bottle, a carboy, a vial, a tube.
     ============================================================ */

  var LIQUID_LEVEL = { bottle: -0.18, carboy: -0.26, vial: -0.3, tube: -0.36 };

  function vesselPath(ctx, kind, w, h) {
    var hw = w / 2;
    var hh = h / 2;
    ctx.beginPath();
    if (kind === "tube") {
      var tr = Math.min(hw, h * 0.12);
      ctx.moveTo(-hw, -hh + tr);
      ctx.quadraticCurveTo(-hw, -hh, -hw + tr, -hh);
      ctx.lineTo(hw - tr, -hh);
      ctx.quadraticCurveTo(hw, -hh, hw, -hh + tr);
      ctx.lineTo(hw, hh - hw);
      ctx.quadraticCurveTo(hw, hh, 0, hh);
      ctx.quadraticCurveTo(-hw, hh, -hw, hh - hw);
      ctx.closePath();
    } else if (kind === "vial") {
      var vr = Math.min(w * 0.2, h * 0.1);
      ctx.moveTo(-hw, -hh + vr);
      ctx.quadraticCurveTo(-hw, -hh, -hw + vr, -hh);
      ctx.lineTo(hw - vr, -hh);
      ctx.quadraticCurveTo(hw, -hh, hw, -hh + vr);
      ctx.lineTo(hw, hh - vr);
      ctx.quadraticCurveTo(hw, hh, hw - vr, hh);
      ctx.lineTo(-hw + vr, hh);
      ctx.quadraticCurveTo(-hw, hh, -hw, hh - vr);
      ctx.closePath();
    } else if (kind === "carboy") {
      var cn = w * 0.24;
      var ch = h * 0.1;
      var cby = -hh + ch;
      var cr = Math.min(w * 0.16, h * 0.12);
      ctx.moveTo(-cn / 2, -hh);
      ctx.lineTo(cn / 2, -hh);
      ctx.lineTo(cn / 2, cby);
      ctx.bezierCurveTo(cn / 2, cby + h * 0.04, hw, cby + h * 0.01, hw, cby + h * 0.07);
      ctx.lineTo(hw, hh - cr);
      ctx.quadraticCurveTo(hw, hh, hw - cr, hh);
      ctx.lineTo(-hw + cr, hh);
      ctx.quadraticCurveTo(-hw, hh, -hw, hh - cr);
      ctx.lineTo(-hw, cby + h * 0.07);
      ctx.bezierCurveTo(-hw, cby + h * 0.01, -cn / 2, cby + h * 0.04, -cn / 2, cby);
      ctx.closePath();
    } else {
      var bn = w * 0.3;
      var bh = h * 0.2;
      var bs = h * 0.07;
      var bby = -hh + bh + bs;
      var br = Math.min(w * 0.14, h * 0.1);
      ctx.moveTo(-bn / 2, -hh);
      ctx.lineTo(bn / 2, -hh);
      ctx.lineTo(bn / 2, -hh + bh);
      ctx.bezierCurveTo(bn / 2, -hh + bh + bs * 0.55, hw, bby - bs * 0.4, hw, bby);
      ctx.lineTo(hw, hh - br);
      ctx.quadraticCurveTo(hw, hh, hw - br, hh);
      ctx.lineTo(-hw + br, hh);
      ctx.quadraticCurveTo(-hw, hh, -hw, hh - br);
      ctx.lineTo(-hw, bby);
      ctx.bezierCurveTo(-hw, bby - bs * 0.4, -bn / 2, -hh + bh + bs * 0.55, -bn / 2, -hh + bh);
      ctx.closePath();
    }
  }

  function makeBubbles(n) {
    var out = [];
    for (var i = 0; i < n; i++) {
      out.push({
        x: rand(-0.42, 0.42),
        p: Math.random(),
        r: rand(0.004, 0.017),
        sp: rand(0.05, 0.16),
        wob: rand(0, TAU),
        amp: rand(0.002, 0.014)
      });
    }
    return out;
  }

  function makeSpecks(n) {
    var out = [];
    for (var i = 0; i < n; i++) {
      out.push({ x: rand(-0.9, 0.9), y: rand(-0.4, 1), r: rand(0.003, 0.008), ph: rand(0, TAU) });
    }
    return out;
  }

  function paintVessel(ctx, kind, w, h, t, phase, state) {
    var hw = w / 2;
    var hh = h / 2;
    var level = h * (LIQUID_LEVEL[kind] || -0.2);

    /* the light behind the glass */
    var back = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(w, h) * 0.95);
    back.addColorStop(0, "rgba(124,200,52,.22)");
    back.addColorStop(0.5, "rgba(84,156,42,.08)");
    back.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = back;
    ctx.fillRect(-w * 1.1, -h * 0.75, w * 2.2, h * 1.5);

    /* glass shadow, so the vessel sits in the frame */
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.filter = "none";
    ctx.fillStyle = "rgba(0,0,0,.55)";
    ctx.beginPath();
    ctx.ellipse(0, hh + h * 0.015, w * 0.4, h * 0.012, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.save();
    vesselPath(ctx, kind, w, h);
    ctx.clip();

    /* liquid */
    var lg = ctx.createLinearGradient(-hw, level, hw, hh);
    lg.addColorStop(0, "#1B3810");
    lg.addColorStop(0.38, "#4E841D");
    lg.addColorStop(0.66, "#8DC93C");
    lg.addColorStop(1, "#223D0D");
    ctx.fillStyle = lg;
    ctx.fillRect(-hw, level, w, hh - level + h);

    /* a shaft of light down the left of the liquid */
    var shaft = ctx.createLinearGradient(-hw, level, hw * 0.1, level);
    shaft.addColorStop(0, "rgba(211,255,150,.20)");
    shaft.addColorStop(1, "rgba(211,255,150,0)");
    ctx.fillStyle = shaft;
    ctx.fillRect(-hw, level, w, hh - level + h);

    /* the meniscus */
    ctx.fillStyle = "rgba(206,255,142,.32)";
    ctx.beginPath();
    ctx.ellipse(0, level, hw * 0.94, Math.max(2, w * 0.035), 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(240,255,210,.55)";
    ctx.lineWidth = 1;
    ctx.stroke();

    /* drifting cells */
    var specks = state.specks;
    for (var s = 0; s < specks.length; s++) {
      var sp = specks[s];
      var sy = level + ((sp.y + 1) / 2) * (hh - level);
      var sx = sp.x * hw * 0.86 + Math.sin(t * 0.5 + sp.ph) * w * 0.02;
      ctx.fillStyle = "rgba(214,255,150,.4)";
      ctx.beginPath();
      ctx.arc(sx, sy, Math.max(0.5, sp.r * h), 0, TAU);
      ctx.fill();
    }

    /* rising air */
    var bubbles = state.bubbles;
    for (var b = 0; b < bubbles.length; b++) {
      var bb = bubbles[b];
      var p = (bb.p + t * bb.sp) % 1;
      var by = hh * 0.94 - (hh * 0.94 - level) * p;
      var bx = bb.x * w + Math.sin(t * 1.4 + bb.wob + phase) * bb.amp * w;
      var br = Math.max(0.7, bb.r * h);
      ctx.fillStyle = "rgba(198,255,140,.10)";
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "rgba(225,255,185,.42)";
      ctx.lineWidth = Math.max(0.5, br * 0.18);
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,235,.55)";
      ctx.beginPath();
      ctx.arc(bx - br * 0.34, by - br * 0.34, Math.max(0.4, br * 0.28), 0, TAU);
      ctx.fill();
    }

    /* caustic bands crossing the liquid */
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.1;
    for (var cband = 0; cband < 2; cband++) {
      var cx = Math.sin(t * 0.35 + cband * 2.1 + phase) * w * 0.5;
      var cg = ctx.createLinearGradient(cx - w * 0.2, level, cx + w * 0.2, hh);
      cg.addColorStop(0, "rgba(255,255,220,0)");
      cg.addColorStop(0.5, "rgba(226,255,170,.9)");
      cg.addColorStop(1, "rgba(255,255,220,0)");
      ctx.fillStyle = cg;
      ctx.fillRect(-hw, level, w, hh - level + h);
    }
    ctx.restore();

    ctx.restore();

    /* glass */
    vesselPath(ctx, kind, w, h);
    ctx.strokeStyle = "rgba(230,255,212,.34)";
    ctx.lineWidth = Math.max(1, w * 0.008);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,.10)";
    ctx.lineWidth = Math.max(0.6, w * 0.004);
    ctx.stroke();

    /* specular edge */
    ctx.save();
    vesselPath(ctx, kind, w, h);
    ctx.clip();
    var spec = ctx.createLinearGradient(-hw, 0, -hw * 0.35, 0);
    spec.addColorStop(0, "rgba(255,255,255,0)");
    spec.addColorStop(0.45, "rgba(255,255,255,.20)");
    spec.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = spec;
    ctx.fillRect(-hw, -hh, w * 0.42, h);
    ctx.restore();

    /* cap */
    if (kind !== "tube") {
      var capW = kind === "bottle" ? w * 0.36 : kind === "carboy" ? w * 0.3 : w * 0.72;
      var capH = Math.max(6, h * 0.048);
      ctx.fillStyle = "#12150F";
      roundRect(ctx, -capW / 2, -hh - capH * 0.72, capW, capH, capH * 0.24);
      ctx.fill();
      ctx.strokeStyle = "rgba(201,255,74,.45)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-capW / 2 + 2, -hh - capH * 0.72 + capH * 0.5);
      ctx.lineTo(capW / 2 - 2, -hh - capH * 0.72 + capH * 0.5);
      ctx.stroke();
    }

    /* printed label */
    if (kind === "bottle" || kind === "carboy") {
      var lw = w * 0.68;
      var lh = h * (kind === "bottle" ? 0.16 : 0.13);
      var ly = h * 0.03;
      ctx.fillStyle = "rgba(243,239,227,.94)";
      ctx.fillRect(-lw / 2, ly, lw, lh);
      ctx.fillStyle = "#0B0B0B";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      var fs = Math.max(7, Math.round(lh * 0.28));
      ctx.font = "700 " + fs + "px Archivo, Arial, sans-serif";
      ctx.fillText("ORR BIOLOGICALS", 0, ly + lh * 0.36);
      ctx.font = Math.max(6, Math.round(fs * 0.62)) + "px 'IBM Plex Mono', monospace";
      ctx.fillText(kind === "bottle" ? "N. OCULATA · 16 OZ" : "CULTURE KIT · 1 GAL", 0, ly + lh * 0.7);
      ctx.fillStyle = "#C9FF4A";
      ctx.fillRect(-lw / 2, ly + lh, lw, Math.max(1.5, lh * 0.06));
    }
  }

  /* ============================================================
     Scene: bloom
     ============================================================ */

  function Bloom(canvas) {
    this.canvas = canvas;
    this.host = canvas.closest("[data-algae-field]") || canvas.parentElement;
    this.ctx = canvas.getContext("2d");
    this.light = canvas.getAttribute("data-density") === "light";
    this.time = 0;
    this.cells = [];
    this.motes = [];
    this.features = [];
    this.rings = [];
    this.pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    this.nextSplit = 2.6;
    this.lastScroll = window.scrollY || 0;
    this.push = 0;
    this.w = 1;
    this.h = 1;
    this.dpr = 1;
    this.resize();
  }

  Bloom.prototype.resize = function () {
    var rect = this.host.getBoundingClientRect();
    this.w = Math.max(1, rect.width);
    this.h = Math.max(1, rect.height);
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var maxPx = this.light ? 1400000 : 2400000;
    if (this.w * this.h * dpr * dpr > maxPx) {
      dpr = Math.max(1, Math.sqrt(maxPx / (this.w * this.h)));
    }
    this.dpr = dpr;
    this.canvas.width = Math.round(this.w * dpr);
    this.canvas.height = Math.round(this.h * dpr);
    this.canvas.style.width = this.w + "px";
    this.canvas.style.height = this.h + "px";
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.seed();
  };

  Bloom.prototype.seed = function () {
    var w = this.w;
    var h = this.h;
    var types = ["nanno", "nanno", "nanno", "tiso", "tiso", "pavlova", "chaeto", "thalassio", "tetra"];
    var count = clamp(Math.round((w * h) / (this.light ? 48000 : 25000)), this.light ? 12 : 30, this.light ? 42 : 72);
    this.cells = [];
    for (var i = 0; i < count; i++) {
      this.cells.push({
        type: types[(Math.random() * types.length) | 0],
        x: Math.random() * w,
        y: Math.random() * h,
        r: rand(this.light ? 4 : 6, this.light ? 14 : 22),
        rot: rand(0, TAU),
        spin: rand(-0.1, 0.1),
        vx: rand(-3, 3),
        vy: rand(-2.4, 1.2),
        alpha: rand(0.3, 0.78),
        depth: rand(0.35, 1.15),
        phase: rand(0, TAU)
      });
    }

    this.motes = [];
    var motes = clamp(Math.round((w * h) / 11000), 26, 130);
    for (var m = 0; m < motes; m++) {
      this.motes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: rand(0.4, 1.7),
        a: rand(0.08, 0.4),
        d: rand(0.2, 1),
        ph: rand(0, TAU)
      });
    }

    this.features = [];
    var near = this.light ? 0 : 3;
    var nearTypes = ["tiso", "tetra", "chaeto"];
    for (var f = 0; f < near; f++) {
      this.features.push({
        type: nearTypes[f % nearTypes.length],
        x: rand(w * 0.1, w * 0.9),
        y: rand(h * 0.15, h * 0.85),
        r: rand(52, 92),
        rot: rand(0, TAU),
        spin: rand(-0.05, 0.05),
        vx: rand(-2.2, 2.2),
        vy: rand(-1.8, 0.8),
        alpha: rand(0.16, 0.3),
        phase: rand(0, TAU)
      });
    }
  };

  Bloom.prototype.draw = function (t, dt) {
    var ctx = this.ctx;
    var w = this.w;
    var h = this.h;
    ctx.clearRect(0, 0, w, h);

    /* light pools, breathing slowly */
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (var i = 0; i < 3; i++) {
      var cx = w * (0.32 + 0.26 * Math.sin(t * 0.045 + i * 2.1));
      var cy = h * (0.3 + 0.26 * Math.cos(t * 0.038 + i * 1.7));
      var R = Math.max(w, h) * (0.3 + i * 0.09);
      var lg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      var pulse = 0.75 + 0.25 * Math.sin(t * 0.16 + i);
      lg.addColorStop(0, "rgba(128,198,58," + (0.055 * pulse).toFixed(3) + ")");
      lg.addColorStop(0.55, "rgba(78,146,40,0.018)");
      lg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = lg;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();

    this.pointer.x += (this.pointer.tx - this.pointer.x) * 0.04;
    this.pointer.y += (this.pointer.ty - this.pointer.y) * 0.04;
    var px = this.pointer.x;
    var py = this.pointer.y;
    var scroll = window.scrollY || 0;
    var dy = scroll - this.lastScroll;
    this.lastScroll = scroll;
    /* the field feels the page move: a little lift, then it settles */
    this.push = clamp(this.push * 0.88 + dy * 0.5, -46, 46);
    var push = this.push;

    ctx.save();
    ctx.translate(0, -Math.min(scroll, h) * 0.22);

    /* the large, soft, near cells */
    for (var f = 0; f < this.features.length; f++) {
      var ft = this.features[f];
      ft.phase += dt * 0.3;
      ft.x += ft.vx * dt + Math.sin(ft.phase * 0.7) * 0.08;
      ft.y += ft.vy * dt;
      if (ft.x < -ft.r * 2) ft.x = w + ft.r * 2;
      if (ft.x > w + ft.r * 2) ft.x = -ft.r * 2;
      if (ft.y < -ft.r * 2) ft.y = h + ft.r * 2;
      if (ft.y > h + ft.r * 2) ft.y = -ft.r * 2;
      ctx.save();
      ctx.translate(ft.x + px * 26, ft.y + py * 20 + push * 0.35);
      ctx.rotate(ft.rot + Math.sin(t * 0.12 + ft.phase) * 0.08);
      ctx.scale(ft.r, ft.r);
      ctx.globalAlpha = ft.alpha;
      drawCell(ctx, ft.type, t, !reduce);
      ctx.restore();
    }

    /* the dust */
    for (var m = 0; m < this.motes.length; m++) {
      var mo = this.motes[m];
      var mx = mo.x + Math.sin(t * 0.22 + mo.ph) * 9 + px * mo.d * 12;
      var my = mo.y + Math.cos(t * 0.18 + mo.ph) * 7 + py * mo.d * 12 + push * 0.2;
      var tw = 0.6 + 0.4 * Math.sin(t * 0.9 + mo.ph);
      ctx.fillStyle = "rgba(214,255,170," + (mo.a * tw).toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(mx, my, mo.r, 0, TAU);
      ctx.fill();
    }

    /* the cells */
    for (var c = 0; c < this.cells.length; c++) {
      var cl = this.cells[c];
      var flowX = Math.sin(cl.y * 0.008 + t * 0.2 + cl.phase) * 4.2;
      var flowY = Math.cos(cl.x * 0.006 + t * 0.17 + cl.phase) * 3.2 - 1.6;
      cl.x += (cl.vx + flowX) * dt;
      cl.y += (cl.vy + flowY) * dt;
      cl.rot += cl.spin * dt;
      if (cl.x < -40) cl.x = w + 40;
      if (cl.x > w + 40) cl.x = -40;
      if (cl.y < -40) cl.y = h + 40;
      if (cl.y > h + 40) cl.y = -40;
      drawSprite(ctx, cl.type, cl.x + px * cl.depth * 20, cl.y + py * cl.depth * 16 + push * cl.depth, cl.r, cl.rot, cl.alpha);
    }

    /* cell division, once in a while */
    if (!reduce) {
      this.nextSplit -= dt;
      if (this.nextSplit <= 0) {
        this.nextSplit = rand(2.4, 4.6);
        this.split();
      }
    }
    for (var rg = this.rings.length - 1; rg >= 0; rg--) {
      var ring = this.rings[rg];
      ring.r += dt * 34;
      ring.life -= dt * 0.85;
      if (ring.life <= 0) {
        this.rings.splice(rg, 1);
        continue;
      }
      ctx.strokeStyle = "rgba(201,255,74," + (ring.life * 0.4).toFixed(3) + ")";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.r, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = "rgba(201,255,74," + (ring.life * 0.16).toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.r * 0.62, 0, TAU);
      ctx.stroke();
    }

    ctx.restore();
  };

  Bloom.prototype.split = function () {
    if (this.cells.length > 82) return;
    var c = this.cells[(Math.random() * this.cells.length) | 0];
    if (!c) return;
    var types = ["nanno", "tiso", "pavlova", "tetra"];
    var mother = c.type;
    var type = types.indexOf(mother) >= 0 ? mother : types[(Math.random() * types.length) | 0];
    this.rings.push({ x: c.x, y: c.y, r: 2, life: 1 });
    c.r *= 0.62;
    c.x -= 5;
    this.cells.push({
      type: type,
      x: c.x + 10,
      y: c.y + rand(-4, 4),
      r: c.r * rand(0.8, 1.05),
      rot: c.rot + rand(-0.6, 0.6),
      spin: c.spin,
      vx: c.vx + rand(-2, 2),
      vy: c.vy + rand(-2, 0.6),
      alpha: c.alpha,
      depth: c.depth,
      phase: rand(0, TAU)
    });
  };

  /* ============================================================
     Scene: vessel
     ============================================================ */

  function Vessel(canvas) {
    this.canvas = canvas;
    this.host = canvas.parentElement;
    this.ctx = canvas.getContext("2d");
    this.kind = (canvas.getAttribute("data-vessel") || "bottle").trim();
    this.bubbles = makeBubbles(26);
    this.specks = makeSpecks(30);
    this.time = 0;
    this.resize();
  }

  Vessel.prototype.resize = function () {
    var rect = this.canvas.getBoundingClientRect();
    this.w = Math.max(1, rect.width);
    this.h = Math.max(1, rect.height);
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (this.w * this.h * dpr * dpr > 1600000) {
      dpr = Math.max(1, Math.sqrt(1600000 / (this.w * this.h)));
    }
    this.dpr = dpr;
    this.canvas.width = Math.round(this.w * dpr);
    this.canvas.height = Math.round(this.h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  Vessel.prototype.draw = function (t) {
    var ctx = this.ctx;
    var w = this.w;
    var h = this.h;
    ctx.clearRect(0, 0, w, h);
    var vh = h * 0.9;
    var vw = this.kind === "tube" ? vh * 0.3 : vh * 0.44;
    if (vw > w * 0.86) vw = w * 0.86;
    ctx.save();
    ctx.translate(w / 2, h / 2 + Math.sin(t * 0.65) * 2.4);
    ctx.rotate(Math.sin(t * 0.42) * 0.008);
    paintVessel(ctx, this.kind, vw, vh, t, 0, this);
    ctx.restore();
  };

  /* ============================================================
     Scene: shelf
     ============================================================ */

  function Shelf(canvas) {
    this.canvas = canvas;
    this.host = canvas.parentElement;
    this.ctx = canvas.getContext("2d");
    var list = (canvas.getAttribute("data-vessels") || "bottle,carboy,vial").split(",");
    this.kinds = [];
    for (var i = 0; i < list.length; i++) {
      var k = list[i].trim();
      if (k) this.kinds.push(k);
    }
    if (!this.kinds.length) this.kinds = ["bottle", "carboy", "vial"];
    this.items = [];
    for (var j = 0; j < this.kinds.length; j++) {
      this.items.push({
        bubbles: makeBubbles(18 + j * 4),
        specks: makeSpecks(20),
        phase: rand(0, TAU)
      });
    }
    this.time = 0;
    this.resize();
  }

  Shelf.prototype.resize = function () {
    var rect = this.canvas.getBoundingClientRect();
    this.w = Math.max(1, rect.width);
    this.h = Math.max(1, rect.height);
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (this.w * this.h * dpr * dpr > 1500000) {
      dpr = Math.max(1, Math.sqrt(1500000 / (this.w * this.h)));
    }
    this.dpr = dpr;
    this.canvas.width = Math.round(this.w * dpr);
    this.canvas.height = Math.round(this.h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  Shelf.prototype.draw = function (t) {
    var ctx = this.ctx;
    var w = this.w;
    var h = this.h;
    ctx.clearRect(0, 0, w, h);

    /* shelf light */
    var glowG = ctx.createRadialGradient(w * 0.5, h * 0.72, 0, w * 0.5, h * 0.72, w * 0.62);
    glowG.addColorStop(0, "rgba(126,200,60,.16)");
    glowG.addColorStop(0.55, "rgba(80,150,40,.05)");
    glowG.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glowG;
    ctx.fillRect(0, 0, w, h);

    var n = this.kinds.length;
    var baseY = h * 0.86;
    var slot = w / (n + 0.6);
    var maxH = h * 0.68;

    /* the shelf itself */
    var grad = ctx.createLinearGradient(0, baseY, 0, baseY + h * 0.02);
    grad.addColorStop(0, "rgba(255,255,255,.16)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(w * 0.04, baseY, w * 0.92, Math.max(1, h * 0.008));

    for (var i = 0; i < n; i++) {
      var item = this.items[i];
      var kind = this.kinds[i];
      var vh = maxH * (0.82 + 0.18 * Math.sin(i * 1.3 + 0.7));
      var vw = kind === "tube" ? vh * 0.28 : kind === "bottle" ? vh * 0.42 : vh * 0.5;
      var x = slot * (i + 0.8);
      if (vw > slot * 0.86) vw = slot * 0.86;
      ctx.save();
      ctx.translate(x, baseY - vh / 2);
      paintVessel(ctx, kind, vw, vh, t, item.phase, item);
      ctx.restore();
    }
  };

  /* ============================================================
     Scene: strain
     ============================================================ */

  var STRAIN_SCALE = { nanno: 0.58, tiso: 0.8, pavlova: 0.8, chaeto: 0.82, thalassio: 0.72, tetra: 1 };
  var STRAIN_LAYOUT = {
    nanno: [{ x: -0.55, y: -0.2, s: 0.62 }, { x: 0.5, y: -0.38, s: 0.46 }, { x: 0.12, y: 0.55, s: 0.7 }],
    tiso: [{ x: -0.34, y: -0.2, s: 0.72 }, { x: 0.42, y: 0.3, s: 0.54 }],
    pavlova: [{ x: -0.3, y: -0.25, s: 0.68 }, { x: 0.4, y: 0.35, s: 0.5 }],
    chaeto: [{ x: 0, y: 0, s: 1 }],
    thalassio: [{ x: -0.32, y: -0.2, s: 0.82 }, { x: 0.38, y: 0.34, s: 0.54 }],
    tetra: [{ x: 0, y: 0, s: 1 }]
  };

  function Strain(canvas) {
    this.canvas = canvas;
    this.host = canvas.parentElement;
    this.ctx = canvas.getContext("2d");
    this.type = (canvas.getAttribute("data-strain") || "nanno").trim();
    this.layout = STRAIN_LAYOUT[this.type] || STRAIN_LAYOUT.nanno;
    this.scale = STRAIN_SCALE[this.type] || 0.7;
    this.time = 0;
    this.resize();
  }

  Strain.prototype.resize = function () {
    var rect = this.canvas.getBoundingClientRect();
    this.w = Math.max(1, rect.width);
    this.h = Math.max(1, rect.height);
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (this.w * this.h * dpr * dpr > 900000) {
      dpr = Math.max(1, Math.sqrt(900000 / (this.w * this.h)));
    }
    this.dpr = dpr;
    this.canvas.width = Math.round(this.w * dpr);
    this.canvas.height = Math.round(this.h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  Strain.prototype.draw = function (t) {
    var ctx = this.ctx;
    var w = this.w;
    var h = this.h;
    ctx.clearRect(0, 0, w, h);

    var bg = ctx.createRadialGradient(w * 0.5, h * 0.48, 0, w * 0.5, h * 0.48, Math.max(w, h) * 0.7);
    bg.addColorStop(0, "rgba(126,200,60,.12)");
    bg.addColorStop(0.55, "rgba(80,150,40,.04)");
    bg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    /* measurement ticks along the bottom */
    var ty = h * 0.9;
    var tx0 = w * 0.16;
    var tx1 = w * 0.84;
    ctx.strokeStyle = "rgba(240,248,224,.16)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tx0, ty);
    ctx.lineTo(tx1, ty);
    ctx.stroke();
    for (var i = 0; i <= 8; i++) {
      var x = tx0 + ((tx1 - tx0) * i) / 8;
      var tick = i % 4 === 0 ? h * 0.018 : h * 0.009;
      ctx.beginPath();
      ctx.moveTo(x, ty - tick);
      ctx.lineTo(x, ty);
      ctx.stroke();
    }

    var R = Math.min(w, h) * 0.32 * this.scale;
    for (var c = 0; c < this.layout.length; c++) {
      var l = this.layout[c];
      ctx.save();
      ctx.translate(w / 2 + l.x * Math.min(w, h) * 0.3, h * 0.46 + l.y * Math.min(w, h) * 0.3);
      ctx.rotate(Math.sin(t * 0.4 + c * 1.7) * 0.09);
      ctx.scale(R * l.s, R * l.s);
      ctx.globalAlpha = 0.94;
      drawCell(ctx, this.type, t + c * 0.8, !reduce);
      ctx.restore();
    }
  };

  /* ============================================================
     Mount: shared visibility, resize and motion handling.
     ============================================================ */

  var FACTORY = { bloom: Bloom, vessel: Vessel, shelf: Shelf, strain: Strain };

  function mount(canvas) {
    var name = canvas.getAttribute("data-algae-scene");
    var Scene = FACTORY[name];
    if (!Scene || !canvas.getContext) return;
    var scene;
    try {
      scene = new Scene(canvas);
    } catch (err) {
      return;
    }
    if (!scene.ctx) return;

    var host = canvas.parentElement || canvas;
    var isBloom = name === "bloom";

    /* one frame immediately, so the composition is present before the
       observer fires and even in a tab that is currently backgrounded.
       The plates are stills: their time never advances. */
    scene.draw(isBloom ? 0 : 2, 0);

    if (!isBloom) {
      if ("ResizeObserver" in window) {
        new ResizeObserver(function () {
          scene.resize();
          scene.draw(2, 0);
        }).observe(host);
      } else {
        window.addEventListener("resize", function () {
          scene.resize();
          scene.draw(2, 0);
        });
      }
      return;
    }

    var raf = 0;
    var running = false;
    var visible = false;
    var last = 0;

    function frame(now) {
      if (!running) return;
      var dt = Math.min(0.064, (now - last) / 1000 || 0.016);
      last = now;
      scene.time += dt;
      scene.draw(scene.time, dt);
      raf = window.requestAnimationFrame(frame);
    }

    function start() {
      if (running || reduce || !visible || document.hidden) return;
      running = true;
      last = window.performance.now();
      raf = window.requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      if (raf) window.cancelAnimationFrame(raf);
      raf = 0;
    }

    function still() {
      scene.time = 1.4;
      scene.draw(1.4, 0);
    }

    var ro = "ResizeObserver" in window ? new ResizeObserver(function () {
      scene.resize();
      if (!running) scene.draw(scene.time, 0);
    }) : null;
    if (ro) ro.observe(host);
    else window.addEventListener("resize", function () {
      scene.resize();
      if (!running) scene.draw(scene.time, 0);
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) {
          if (reduce) still();
          else start();
        } else {
          stop();
        }
      }, { rootMargin: "160px 0px" }).observe(canvas);
    } else {
      visible = true;
      if (reduce) still();
      else start();
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
      else start();
    });

    reduceMQ.addEventListener("change", function () {
      reduce = reduceMQ.matches;
      if (reduce) {
        stop();
        still();
      } else {
        start();
      }
    });

    if (name === "bloom") {
      var hostField = canvas.closest("[data-algae-field]") || host;
      hostField.addEventListener("pointermove", function (event) {
        if (reduce) return;
        var rect = hostField.getBoundingClientRect();
        scene.pointer.tx = (event.clientX - rect.left) / rect.width - 0.5;
        scene.pointer.ty = (event.clientY - rect.top) / rect.height - 0.5;
      }, { passive: true });
      hostField.addEventListener("pointerleave", function () {
        scene.pointer.tx = 0;
        scene.pointer.ty = 0;
      }, { passive: true });
    }

    if (reduce) still();
  }

  function init() {
    var nodes = document.querySelectorAll("[data-algae-scene]");
    for (var i = 0; i < nodes.length; i++) mount(nodes[i]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
