/* A shallow field of cells, drawn flat. No 3D, no library.
   Pauses offscreen, on hidden tabs, and renders one still frame when the
   visitor asks for reduced motion. */
(function () {
  var canvas = document.querySelector("[data-cells]");
  if (!canvas) return;

  var hero = canvas.closest(".hero2");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  var dpr = 1;
  var width = 0;
  var height = 0;
  var cells = [];
  var running = false;
  var frame = 0;
  var pointer = { x: 0, y: 0, tx: 0, ty: 0 };

  var palette = [
    "rgba(77,104,30,",   /* olive */
    "rgba(107,140,38,",  /* mid green */
    "rgba(146,180,58,",  /* light green */
    "rgba(201,255,74,"   /* neon, rare */
  ];

  function size() {
    var rect = hero.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
    if (!running) draw();
  }

  function seed() {
    var count = Math.max(26, Math.min(88, Math.round((width * height) / 24000)));
    cells = [];
    for (var i = 0; i < count; i++) {
      var kind = Math.random() < 0.12 ? 3 : Math.floor(Math.random() * 3);
      var radius = kind === 3 ? 2.2 + Math.random() * 2.4 : 2.4 + Math.random() * 4.4;
      cells.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: radius,
        vx: (Math.random() - 0.5) * 0.26,
        vy: (Math.random() - 0.5) * 0.2 - 0.03,
        a: 0.14 + Math.random() * 0.26,
        color: palette[kind],
        ring: Math.random() < 0.28,
        depth: 0.4 + Math.random() * 0.9,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    for (var i = 0; i < cells.length; i++) {
      var c = cells[i];
      var x = c.x + pointer.x * c.depth * 14;
      var y = c.y + pointer.y * c.depth * 14;
      ctx.beginPath();
      ctx.arc(x, y, c.r, 0, Math.PI * 2);
      if (c.ring) {
        ctx.strokeStyle = c.color + (c.a * 0.9) + ")";
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        ctx.fillStyle = c.color + c.a + ")";
        ctx.fill();
      }
    }
  }

  function step() {
    if (!running) return;
    pointer.x += (pointer.tx - pointer.x) * 0.045;
    pointer.y += (pointer.ty - pointer.y) * 0.045;
    for (var i = 0; i < cells.length; i++) {
      var c = cells[i];
      c.phase += 0.008;
      c.x += c.vx + Math.sin(c.phase) * 0.06;
      c.y += c.vy;
      if (c.x < -12) c.x = width + 12;
      if (c.x > width + 12) c.x = -12;
      if (c.y < -12) c.y = height + 12;
      if (c.y > height + 12) c.y = -12;
    }
    draw();
    frame = window.requestAnimationFrame(step);
  }

  function start() {
    if (running || reduce.matches) return;
    running = true;
    frame = window.requestAnimationFrame(step);
  }

  function stop() {
    running = false;
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
  }

  hero.addEventListener("pointermove", function (event) {
    if (reduce.matches) return;
    var rect = hero.getBoundingClientRect();
    pointer.tx = (event.clientX - rect.left) / rect.width - 0.5;
    pointer.ty = (event.clientY - rect.top) / rect.height - 0.5;
  });
  hero.addEventListener("pointerleave", function () {
    pointer.tx = 0;
    pointer.ty = 0;
  });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop();
    else start();
  });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) start();
        else stop();
      });
    }, { threshold: 0.05 }).observe(hero);
  } else {
    start();
  }

  if ("ResizeObserver" in window) new ResizeObserver(size).observe(hero);
  else window.addEventListener("resize", size);

  reduce.addEventListener("change", function () {
    if (reduce.matches) { stop(); draw(); }
    else start();
  });

  size();
  if (!reduce.matches) start();
})();
