"use strict";

/* A deterministic, endlessly looping culture-flow plate. It is intentionally
   quiet enough to sit behind copy, but has depth cues from layered fluid,
   refraction bands, and drifting Arthrospira-like filaments. No network or
   video asset is required, so the hero remains rebuildable offline. */
(function () {
  var canvas = document.getElementById("cultureCascade");
  if (!canvas) return;
  var context = canvas.getContext("2d");
  if (!context) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var particles = Array.from({ length: 46 }, function (_, index) {
    return { seed: index * 1.71, depth: .25 + (index % 7) / 10, phase: index * .63 };
  });
  var width = 0;
  var height = 0;
  var frame = 0;
  var raf = 0;

  function resize() {
    var rect = canvas.getBoundingClientRect();
    var ratio = Math.min(window.devicePixelRatio || 1, 1.7);
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function stream(x, phase, spread) {
    var top = -20;
    var bottom = height + 18;
    var wave = Math.sin(frame * .00055 + phase) * spread;
    context.beginPath();
    context.moveTo(x - 20, top);
    context.bezierCurveTo(x + wave - 30, height * .28, x - wave + 26, height * .61, x + 10, bottom);
    context.lineTo(x + 34, bottom);
    context.bezierCurveTo(x + wave + 49, height * .62, x - wave + 52, height * .28, x + 20, top);
    context.closePath();
    var fill = context.createLinearGradient(0, 0, 0, height);
    fill.addColorStop(0, "rgba(151, 220, 163, .02)");
    fill.addColorStop(.42, "rgba(94, 181, 120, .20)");
    fill.addColorStop(1, "rgba(22, 87, 65, .52)");
    context.fillStyle = fill;
    context.fill();
    context.beginPath();
    context.moveTo(x + wave - 6, top);
    context.bezierCurveTo(x - wave + 14, height * .3, x + wave - 4, height * .68, x + 18, bottom);
    context.strokeStyle = "rgba(212, 246, 213, .34)";
    context.lineWidth = 1.2;
    context.stroke();
  }

  function draw(time) {
    frame = reduce.matches ? 0 : time;
    context.clearRect(0, 0, width, height);
    var depthWash = context.createRadialGradient(width * .68, height * .3, 4, width * .68, height * .3, width * .85);
    depthWash.addColorStop(0, "rgba(183, 236, 177, .15)");
    depthWash.addColorStop(1, "rgba(3, 18, 12, .02)");
    context.fillStyle = depthWash;
    context.fillRect(0, 0, width, height);
    stream(width * .52, 1.2, 29);
    stream(width * .67, 3.6, 42);
    stream(width * .82, 5.1, 23);

    particles.forEach(function (particle) {
      var x = width * (.34 + ((particle.seed * .173) % .58));
      var travel = ((frame * (.000018 + particle.depth * .000026) + particle.phase * .03) % 1);
      var y = ((particle.seed * 37 + travel * (height + 46)) % (height + 46)) - 20;
      var drift = Math.sin(frame * .0008 + particle.phase) * (5 + particle.depth * 9);
      var scale = .7 + particle.depth * 1.5;
      context.save();
      context.translate(x + drift, y);
      context.rotate(Math.sin(particle.phase + frame * .0003) * .65);
      context.strokeStyle = "rgba(198, 240, 187, " + (.2 + particle.depth * .26) + ")";
      context.lineWidth = scale;
      context.beginPath();
      context.moveTo(-4 * scale, -2 * scale);
      context.bezierCurveTo(-1 * scale, -7 * scale, 2 * scale, 7 * scale, 6 * scale, 1 * scale);
      context.stroke();
      context.restore();
    });
    if (!reduce.matches) raf = window.requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize", resize, { passive: true });
  if (reduce.matches) draw(0);
  else raf = window.requestAnimationFrame(draw);
  reduce.addEventListener("change", function () {
    window.cancelAnimationFrame(raf);
    if (reduce.matches) draw(0);
    else raf = window.requestAnimationFrame(draw);
  });
})();
