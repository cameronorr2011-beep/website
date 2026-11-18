/* Orr Biologicals — the culture, in suspension.
   One WebGL scene behind the home hero: a lit cylinder of cells, framed by
   brass rings. It loads only where the canvas exists and fails silently to
   the CSS stage, so the page is complete without it.

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
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;

      var scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x04110d, 0.05);

      var camera = new THREE.PerspectiveCamera(35, 1, 0.1, 40);
      camera.position.set(0, 0.15, 7.2);

      var vessel = new THREE.Group();
      scene.add(vessel);

      /* ---------- light ---------- */

      scene.add(new THREE.HemisphereLight(0xbfd6c0, 0x04110d, 1.0));

      var key = new THREE.DirectionalLight(0xf6dca8, 2.2);
      key.position.set(3.5, 6, 4);
      scene.add(key);

      var fill = new THREE.PointLight(0x4c9c70, 14, 15, 2);
      fill.position.set(-2.6, 1.4, 2.6);
      scene.add(fill);

      var floor = new THREE.PointLight(0xd9a441, 7, 11, 2);
      floor.position.set(1.4, -3.4, 2.2);
      scene.add(floor);

      /* ---------- the vessel ---------- */

      var R = 0.86;
      var HALF = 1.62;
      var ringMat = new THREE.MeshBasicMaterial({
        color: 0xe9c98b,
        transparent: true,
        opacity: 0.42
      });
      var ringGeo = new THREE.TorusGeometry(R, 0.0045, 8, 120);

      [-HALF, 0, HALF].forEach(function (y) {
        var ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = y;
        vessel.add(ring);
      });

      var strandGeo = new THREE.BufferGeometry();
      var strandPts = [];
      var STRANDS = 20;
      for (var s = 0; s < STRANDS; s++) {
        var a = (s / STRANDS) * Math.PI * 2;
        var x = Math.cos(a) * R;
        var z = Math.sin(a) * R;
        strandPts.push(x, -HALF, z, x, HALF, z);
      }
      strandGeo.setAttribute('position', new THREE.Float32BufferAttribute(strandPts, 3));
      vessel.add(new THREE.LineSegments(
        strandGeo,
        new THREE.LineBasicMaterial({ color: 0xe9c98b, transparent: true, opacity: 0.07 })
      ));

      /* ---------- cells: one instanced draw call ---------- */

      var count = coarse ? 420 : 1050;
      var cellGeo = new THREE.IcosahedronGeometry(0.047, 1);
      var cellMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.36,
        metalness: 0.04,
        emissive: 0x0a241a,
        emissiveIntensity: 0.7
      });
      var cells = new THREE.InstancedMesh(cellGeo, cellMat, count);
      cells.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      vessel.add(cells);

      var dummy = new THREE.Object3D();
      var seeds = [];
      var green = new THREE.Color(0x2e7a55);
      var greenLight = new THREE.Color(0x6faa70);
      var gold = new THREE.Color(0xd9a441);
      var bone = new THREE.Color(0xe9c98b);

      for (var i = 0; i < count; i++) {
        var angle = Math.random() * Math.PI * 2;
        var radius = Math.sqrt(Math.random()) * (R - 0.08);
        var y = (Math.random() * 2 - 1) * (HALF - 0.04);
        var scale = 0.4 + Math.random() * 1.1;

        seeds.push({
          x: Math.cos(angle) * radius,
          y: y,
          z: Math.sin(angle) * radius,
          s: scale,
          ph: Math.random() * Math.PI * 2,
          amp: 0.02 + Math.random() * 0.05
        });

        var colour;
        var roll = Math.random();
        if (roll < 0.055) colour = gold.clone();
        else if (roll < 0.1) colour = bone.clone();
        else if (roll < 0.55) colour = green.clone();
        else colour = greenLight.clone();
        colour.offsetHSL(0, 0, (Math.random() - 0.5) * 0.1);

        dummy.position.set(seeds[i].x, y, seeds[i].z);
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        cells.setMatrixAt(i, dummy.matrix);
        cells.setColorAt(i, colour);
      }
      cells.instanceMatrix.needsUpdate = true;
      if (cells.instanceColor) cells.instanceColor.needsUpdate = true;

      /* ---------- out-of-focus motes ---------- */

      function disc() {
        var c = document.createElement('canvas');
        c.width = c.height = 64;
        var g = c.getContext('2d');
        var grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, 'rgba(243,237,223,.85)');
        grad.addColorStop(0.35, 'rgba(233,201,139,.28)');
        grad.addColorStop(1, 'rgba(233,201,139,0)');
        g.fillStyle = grad;
        g.fillRect(0, 0, 64, 64);
        var tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
      }

      var moteCount = coarse ? 50 : 120;
      var motePos = [];
      for (var m = 0; m < moteCount; m++) {
        var ma = Math.random() * Math.PI * 2;
        var mr = 0.2 + Math.random() * 1.5;
        motePos.push(
          Math.cos(ma) * mr,
          (Math.random() * 2 - 1) * 2.5,
          Math.sin(ma) * mr * 0.7
        );
      }
      var moteGeo = new THREE.BufferGeometry();
      moteGeo.setAttribute('position', new THREE.Float32BufferAttribute(motePos, 3));
      var dust = new THREE.Points(moteGeo, new THREE.PointsMaterial({
        color: 0xf3e7c9,
        size: 0.12,
        map: disc(),
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending
      }));
      vessel.add(dust);

      /* ---------- layout ---------- */

      var baseZ = 7.2;
      var lookX = 0.55;

      function layout() {
        var w = canvas.clientWidth || stage.clientWidth;
        var h = canvas.clientHeight || stage.clientHeight;
        if (!w || !h) return;

        var mobile = w < 900;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.6 : 1.9));
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();

        vessel.position.x = mobile ? 0.28 : 1.52;
        vessel.scale.setScalar(mobile ? 0.98 : 0.9);
        lookX = mobile ? 0.18 : 0.5;
        baseZ = mobile ? 8.4 : 7.2;
        camera.position.z = baseZ;
      }

      function scrollProgress() {
        var rect = stage.getBoundingClientRect();
        return Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height)));
      }

      function placeCells(now, progress) {
        for (var j = 0; j < count; j++) {
          var d = seeds[j];
          var bob = Math.sin(now * 0.00034 + d.ph) * d.amp;
          dummy.position.set(
            d.x + Math.cos(now * 0.00022 + d.ph) * 0.025,
            d.y + bob,
            d.z + Math.sin(now * 0.00019 + d.ph) * 0.025
          );
          dummy.scale.setScalar(d.s * (1 + progress * 0.06));
          dummy.updateMatrix();
          cells.setMatrixAt(j, dummy.matrix);
        }
        cells.instanceMatrix.needsUpdate = true;
      }

      function render(now, progress) {
        vessel.rotation.y = progress * 0.55 + pointer.x * 0.16;
        vessel.rotation.x = -0.03 + progress * 0.05 + pointer.y * 0.06;
        camera.position.z = baseZ - progress * 1.15;
        camera.position.y = 0.15 + progress * 0.22;
        camera.lookAt(lookX, 0, 0);
        dust.rotation.y = now * 0.000018;
        placeCells(now, progress);
        renderer.render(scene, camera);
      }

      var pointer = { x: 0, y: 0 };
      var pointerTarget = { x: 0, y: 0 };
      var raf = 0;
      var running = false;
      var last = 0;

      function frame(now) {
        raf = requestAnimationFrame(frame);
        var dt = Math.min((now - last) / 1000, 0.05);
        last = now;

        pointer.x += (pointerTarget.x - pointer.x) * Math.min(1, dt * 3.2);
        pointer.y += (pointerTarget.y - pointer.y) * Math.min(1, dt * 3.2);

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
