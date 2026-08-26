/* ============================================================
   Orr Biologicals — network-sim.js
   Federated-learning visualization: several cultivation systems
   (AlgaePhyte reactors / Mycophyte chambers) train local digital
   twins and exchange model updates through a central aggregator
   (PhycoNet protocol). Raw sensor data stays on-device.
   Honest framing: federated learning reduces data sharing but
   privacy is not absolute — it depends on deployment and threat
   model. This is a schematic, not real telemetry.
   Mounts into a #net-viz canvas on /how-it-works.
   ============================================================ */
(function () {
  "use strict";
  var S = window.OrrSim;
  if (!S) return;
  var clamp = S.clamp;

  function NetViz(canvas, ui) {
    this.cv = canvas;
    this.ctx = canvas.getContext("2d");
    this.ui = ui || {};
    this.dpr = 1; this.W = 0; this.H = 0;
    this.round = 0;
    this.t = 0;
    this.packets = [];
    this.running = false;
    this.hidden = false;
    this._seed = 5;
    var self = this;
    this._rs = function () { self.resize(); };
    window.addEventListener("resize", this._rs, { passive: true });
    this.resize();
    this._seedRand();
    this.nodes = [];
    var count = this.W < 640 ? 4 : 6;
    for (var i = 0; i < count; i++) {
      var a = (i / count) * Math.PI * 2 - Math.PI / 2;
      var r = Math.min(this.W, this.H) * 0.30;
      this.nodes.push({
        x: this.W / 2 + Math.cos(a) * r,
        y: this.H / 2 + Math.sin(a) * r,
        label: this.ui.labels ? this.ui.labels[i] : ("Chamber " + (i + 1)),
        err: 0.85 + (this.rand() * 0.6),   // local twin error, shrinks with rounds
        alive: true, hp: 1
      });
    }
    this.center = { x: this.W / 2, y: this.H / 2 };
  }

  NetViz.prototype.rand = function () {
    this._seed = (this._seed * 16807) % 2147483647;
    return (this._seed - 1) / 2147483646;
  };
  NetViz.prototype._seedRand = function () {
    for (var i = 0; i < 20; i++) this.rand();
  };

  NetViz.prototype.resize = function () {
    var w = this.cv.clientWidth || this.cv.parentNode.clientWidth || 700;
    var h = this.cv.clientHeight || 380;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.cv.width = Math.max(1, Math.floor(w * this.dpr));
    this.cv.height = Math.max(1, Math.floor(h * this.dpr));
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.W = w; this.H = h;
  };

  NetViz.prototype.launchRound = function () {
    this.round++;
    var self = this;
    this.nodes.forEach(function (n) {
      if (!n.alive) return;
      n.err = Math.max(0.08, n.err * (0.82 + self.rand() * 0.1));
      var p = { from: { x: n.x, y: n.y }, to: { x: self.center.x, y: self.center.y }, t: 0, dir: "up", size: 2 + Math.round(self.rand() * 2) };
      self.packets.push(p);
    });
    if (this.ui.roundEl) this.ui.roundEl.textContent = "Round " + this.round;
    if (this.ui.convEl) this.ui.convEl.textContent = Math.round((1 - this.avgErr()) * 100) + "%";
  };

  NetViz.prototype.avgErr = function () {
    var alive = this.nodes.filter(function (n) { return n.alive; });
    if (!alive.length) return 1;
    return alive.reduce(function (s, n) { return s + n.err; }, 0) / alive.length;
  };

  NetViz.prototype.fail = function (i) {
    var n = this.nodes[i];
    if (!n || !n.alive) return;
    n.alive = false;
    this.packets.push({ from: { x: n.x, y: n.y }, to: { x: this.center.x, y: this.center.y }, t: 0, dir: "up", dead: true, size: 2 });
    if (this.ui.offlineEl) {
      this.ui.offlineEl.textContent = n.label + " went offline — local fallback rules keep its chamber safe; it rejoins on reconnect";
    }
  };

  NetViz.prototype.draw = function (dt) {
    if (this.hidden) return;
    var ctx = this.ctx, W = this.W, H = this.H;
    var teal = S.css("--teal") || "#33e6ad";
    var line = S.css("--line") || "rgba(128,128,128,.2)";
    var muted = S.css("--muted") || "#888";
    var ink = S.css("--ink2") || "#ccc";
    ctx.clearRect(0, 0, W, H);

    /* link lines to aggregator */
    ctx.strokeStyle = line; ctx.lineWidth = 1.2;
    this.nodes.forEach(function (n) {
      if (!n.alive) { ctx.strokeStyle = "rgba(128,80,80,.4)"; }
      ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(W / 2, H / 2); ctx.stroke();
      ctx.strokeStyle = line;
    });

    /* packets */
    ctx.save();
    for (var p = 0; p < this.packets.length; p++) {
      var pk = this.packets[p];
      pk.t += dt * 0.55;
      if (pk.t >= 1) { this.packets.splice(p, 1); p--; continue; }
      var e = pk.t * pk.t * (3 - 2 * pk.t);
      var x = pk.from.x + (pk.to.x - pk.from.x) * e;
      var y = pk.from.y + (pk.to.y - pk.from.y) * e;
      ctx.beginPath();
      ctx.arc(x, y, pk.size, 0, 6.283);
      ctx.fillStyle = pk.dead ? "rgba(220,110,90,.7)" : "rgba(" + hexRgb(teal) + ",.85)";
      ctx.fill();
    }
    ctx.restore();

    /* aggregator */
    var pulse = 0.6 + 0.4 * Math.sin(this.t * 2);
    var g = ctx.createRadialGradient(W / 2, H / 2, 4, W / 2, H / 2, 44);
    g.addColorStop(0, "rgba(" + hexRgb(teal) + "," + (0.35 * pulse) + ")");
    g.addColorStop(1, "rgba(" + hexRgb(teal) + ",0)");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(W / 2, H / 2, 44, 0, 6.283); ctx.fill();
    ctx.fillStyle = teal;
    ctx.beginPath(); ctx.arc(W / 2, H / 2, 7, 0, 6.283); ctx.fill();
    ctx.fillStyle = muted; ctx.font = "600 9px 'IBM Plex Mono', monospace"; ctx.textAlign = "center";
    ctx.fillText("AGGREGATOR", W / 2, H / 2 + 30);
    ctx.fillText("twin parameters · never raw data", W / 2, H / 2 + 42);

    /* nodes */
    this.nodes.forEach(function (n) {
      var ring = ctx.createRadialGradient(n.x, n.y, 3, n.x, n.y, 26);
      ring.addColorStop(0, "rgba(" + hexRgb(teal) + "," + (n.alive ? 0.28 : 0.08) + ")");
      ring.addColorStop(1, "rgba(" + hexRgb(teal) + ",0)");
      ctx.fillStyle = ring;
      ctx.beginPath(); ctx.arc(n.x, n.y, 26, 0, 6.283); ctx.fill();
      ctx.fillStyle = n.alive ? teal : "rgba(180,120,110,1)";
      ctx.beginPath(); ctx.arc(n.x, n.y, 5, 0, 6.283); ctx.fill();
      ctx.fillStyle = ink; ctx.textAlign = "center";
      ctx.fillText(n.label, n.x, n.y - 14);
      ctx.fillStyle = muted;
      ctx.fillText("err " + (n.err * 100).toFixed(0) + "%", n.x, n.y + 16);
      /* mini convergence bar */
      var bw = 34, bh = 3;
      ctx.fillStyle = line;
      ctx.fillRect(n.x - bw / 2, n.y + 20, bw, bh);
      ctx.fillStyle = n.alive ? teal : "rgba(180,120,110,1)";
      ctx.fillRect(n.x - bw / 2, n.y + 20, bw * (1 - n.err), bh);
    });
    ctx.textAlign = "left";

    /* legend */
    ctx.fillStyle = muted; ctx.font = "9px 'IBM Plex Mono', monospace";
    ctx.fillText("● devices · ▬ twin error (shrinks as rounds aggregate)", 10, H - 8);
  };

  NetViz.prototype.loop = function () {
    var self = this;
    function frame(ts) {
      if (!self.running) return;
      self.t = (ts || 0) / 1000;
      self.draw(1 / 30);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  };

  NetViz.prototype.start = function () {
    var self = this;
    this.running = true;
    document.addEventListener("visibilitychange", function () {
      self.hidden = document.hidden;
      if (self.hidden) self.packets = [];
    });
    this.loop();
    this.launchRound();
    setInterval(function () { if (!document.hidden) self.launchRound(); }, 3600);
    setTimeout(function () { self.fail(0); }, 9000);
  };

  function hexRgb(hex) {
    var h = (hex || "#33e6ad").replace("#", "");
    if (h.length === 3) h = h.split("").map(function (c) { return c + c; }).join("");
    var n = parseInt(h, 16);
    if (isNaN(n)) return "51,230,173";
    return (n >> 16) + "," + ((n >> 8) & 255) + "," + (n & 255);
  }

  window.OrrNetViz = NetViz;
})();
