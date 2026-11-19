/* Orr Biologicals — one specimen, in suspension.
   A tall column of flat-shaded cells inside a thin brass instrument frame.
   No bokeh, no glow, no atmosphere: the page supplies the field, the scene
   supplies the specimen.

   Performance: instanced geometry, one draw call for the cells, capped DPR,
   paused when offscreen or when the tab is hidden. With reduced motion the
   scene is rendered once and never animates. */

(function () {
  var canvas = document.querySelector('[data-culture]');
  if (!canvas) return;

  var stage = canvas.closest('.stage');
  if (!stage) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia('(max-width: 900px)').matches;

  import('https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js')
    .then(function (THREE) {
      var renderer;
      try {
        renderer = new THREE.WebGLRenderer({
          canvas: canvas,
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance'
        });
      } catch (err) {
        return;
      }

      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.NoToneMapping;

      var scene = new THREE.Scene();
      var camera = new THREE.PerspectiveCamera(30, 1, 0.1, 40);
      camera.position.set(0, 0.1, 7.8);

      var vessel = new THREE.Group();
      scene.add(vessel);

      /* ---------- light: flat, even, no drama ---------- */

      scene.add(new THREE.HemisphereLight(0xe8efe2, 0x06120d, 1.45));

      var key = new THREE.DirectionalLight(0xfff3d8, 1.55);
      key.position.set(4, 6, 5);
      scene.add(key);

      var rim = new THREE.DirectionalLight(0x6f9c79, 0.55);
      rim.position.set(-5, 2, -3);
      scene.add(rim);

      /* ---------- the vessel: two rings and a hairline frame ---------- */

      var R = 0.82;
      var H = 1.78;
      var brass = 0xc89b45;

      var ringMat = new THREE.MeshBasicMaterial({
        color: brass,
        transparent: true,
        opacity: 0.42
      });
      var ringGeo = new THREE.TorusGeometry(R, 0.0035, 4, 128);

      [-H, H].forEach(function (y) {
        var ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = y;
        vessel.add(ring);
      });

      var edgePoints = [];
      var EDGES = 8;
      for (var e = 0; e < EDGES; e++) {
        var a = (e / EDGES) * Math.PI * 2;
        var x = Math.cos(a) * R;
        var z = Math.sin(a) * R;
        edgePoints.push(x, -H, z, x, H, z);
      }
      var edgeGeo = new THREE.BufferGeometry();
      edgeGeo.setAttribute('position', new THREE.Float32BufferAttribute(edgePoints, 3));
      vessel.add(new THREE.LineSegments(
        edgeGeo,
        new THREE.LineBasicMaterial({ color: brass, transparent: true, opacity: 0.1 })
      ));

      /* a measuring rule beside the column, like a bench instrument */
      var ruleX = R + 0.26;
      var rulePoints = [ruleX, -H, 0, ruleX, H, 0];
      for (var t = 0; t <= 4; t++) {
        var ty = -H + (t / 4) * (H * 2);
        rulePoints.push(ruleX, ty, 0, ruleX + 0.07, ty, 0);
      }
      var ruleGeo = new THREE.BufferGeometry();
      ruleGeo.setAttribute('position', new THREE.Float32BufferAttribute(rulePoints, 3));
      vessel.add(new THREE.LineSegments(
        ruleGeo,
        new THREE.LineBasicMaterial({ color: brass, transparent: true, opacity: 0.2 })
      ));

      /* ---------- cells: one instanced draw call ---------- */

      var count = coarse ? 240 : 520;
      var cellGeo = new THREE.IcosahedronGeometry(0.024, 0);
      var cellMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.9,
        metalness: 0,
        flatShading: true
      });
      var cells = new THREE.InstancedMesh(cellGeo, cellMat, count);
      cells.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      vessel.add(cells);

      var dummy = new THREE.Object3D();
      var seeds = [];
      var greenDeep = new THREE.Color(0x2f6b4f);
      var greenMid = new THREE.Color(0x5b8f62);
      var greenPale = new THREE.Color(0x8faa6d);
      var gold = new THREE.Color(0xc89b45);

      for (var i = 0; i < count; i++) {
        var angle = Math.random() * Math.PI * 2;
        var radius = Math.sqrt(Math.random()) * (R - 0.09);
        var y = (Math.random() * 2 - 1) * (H - 0.05);
        var scale = 0.55 + Math.random() * 0.95;

        seeds.push({
          x: Math.cos(angle) * radius,
          y: y,
          z: Math.sin(angle) * radius,
          s: scale,
          ph: Math.random() * Math.PI * 2,
          amp: 0.015 + Math.random() * 0.04
        });

        var colour;
        var roll = Math.random();
        if (roll < 0.025) colour = gold.clone();
        else if (roll < 0.245) colour = greenPale.clone();
        else if (roll < 0.725) colour = greenMid.clone();
        else colour = greenDeep.clone();
        colour.offsetHSL(0, 0, (Math.random() - 0.5) * 0.06);

        dummy.position.set(seeds[i].x, y, seeds[i].z);
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        cells.setMatrixAt(i, dummy.matrix);
        cells.setColorAt(i, colour);
      }
      cells.instanceMatrix.needsUpdate = true;
      if (cells.instanceColor) cells.instanceColor.needsUpdate = true;

      /* ---------- layout ---------- */

      var baseZ = 8.8;
      var lookX = 0;
      var mobile = false;

      function layout() {
        var w = canvas.clientWidth || stage.clientWidth;
        var h = canvas.clientHeight || stage.clientHeight;
        if (!w || !h) return;

        mobile = w < 900;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.55 : 1.75));
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();

        vessel.position.x = mobile ? 0 : 1.1;
        vessel.position.y = mobile ? -0.05 : 0.12;
        vessel.scale.setScalar(mobile ? 0.92 : 0.74);
        lookX = mobile ? 0 : 0.05;
        baseZ = mobile ? 9.0 : 8.8;
        camera.position.z = baseZ;
      }

      function scrollProgress() {
        var rect = stage.getBoundingClientRect();
        return Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height)));
      }

      function placeCells(now, progress) {
        for (var j = 0; j < count; j++) {
          var d = seeds[j];
          var bob = Math.sin(now * 0.00022 + d.ph) * d.amp;
          dummy.position.set(
            d.x + Math.cos(now * 0.00016 + d.ph) * 0.018,
            d.y + bob,
            d.z + Math.sin(now * 0.00014 + d.ph) * 0.018
          );
          dummy.scale.setScalar(d.s * (1 + progress * 0.04));
          dummy.updateMatrix();
          cells.setMatrixAt(j, dummy.matrix);
        }
        cells.instanceMatrix.needsUpdate = true;
      }

      var pointer = { x: 0, y: 0 };
      var pointerTarget = { x: 0, y: 0 };

      function render(now, progress) {
        vessel.rotation.y = now * 0.000025 + pointer.x * 0.07;
        vessel.rotation.x = pointer.y * 0.025;
        camera.position.z = baseZ - progress * 0.3;
        camera.position.y = 0.1 + progress * 0.1;
        camera.lookAt(lookX, 0, 0);
        placeCells(now, progress);
        renderer.render(scene, camera);
      }

      var raf = 0;
      var running = false;
      var last = 0;

      function frame(now) {
        raf = requestAnimationFrame(frame);
        var dt = Math.min((now - last) / 1000, 0.05);
        last = now;

        pointer.x += (pointerTarget.x - pointer.x) * Math.min(1, dt * 2.6);
        pointer.y += (pointerTarget.y - pointer.y) * Math.min(1, dt * 2.6);

        render(now, scrollProgress());
      }

      function start() {
        if (running || reduce) return;
        running = true;
        last = performance.now();
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(frame);
      }

      function stop() {
        running = false;
        cancelAnimationFrame(raf);
      }

      layout();
      stage.classList.add('is-live');

      if (reduce) {
        placeCells(0, 0);
        renderer.render(scene, camera);
        window.addEventListener('resize', function () {
          layout();
          render(0, scrollProgress());
        }, { passive: true });
        return;
      }

      if (window.matchMedia('(hover: hover)').matches) {
        stage.addEventListener('pointermove', function (e) {
          var r = stage.getBoundingClientRect();
          pointerTarget.x = (e.clientX - r.left) / r.width - 0.5;
          pointerTarget.y = (e.clientY - r.top) / r.height - 0.5;
        }, { passive: true });

        stage.addEventListener('pointerleave', function () {
          pointerTarget.x = 0;
          pointerTarget.y = 0;
        }, { passive: true });
      }

      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) start();
            else stop();
          });
        }, { threshold: 0.02 }).observe(stage);
      } else {
        start();
      }

      document.addEventListener('visibilitychange', function () {
        if (document.hidden) stop();
        else if (stage.getBoundingClientRect().bottom > 0) start();
      });

      var resizeTimer = 0;
      window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
          layout();
          if (reduce) renderer.render(scene, camera);
        }, 120);
      }, { passive: true });

      render(performance.now(), 0);
    })
    .catch(function () {
      /* the CSS stage stands on its own */
    });
})();
