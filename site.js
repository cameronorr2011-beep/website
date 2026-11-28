/* Orr Biologicals — surface behaviour.
   The site is complete without this file: nothing is hidden until the script
   runs, and with prefers-reduced-motion nothing moves at all. */
(function () {
  var root = document.documentElement;
  root.classList.add('js');

  var header = document.querySelector('.site-head');
  function onScroll() {
    if (header) header.classList.toggle('is-stuck', window.scrollY > 8);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Anchor landing. html{scroll-behavior:smooth} leaves the browser's jump to
     a #section unfinished on some browsers, so /algae#media and the store's
     /#blends opened at the top of the page. Land instantly instead, then land
     once more after the images settle if the reader has not scrolled since. */
  var landedY = null;

  function jumpToHash() {
    var hash = window.location.hash;
    if (!hash) return;
    var id;
    try { id = decodeURIComponent(hash.slice(1)); } catch (error) { return; }
    var target = document.getElementById(id);
    if (!target) return;
    var prior = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    try { target.scrollIntoView({ block: 'start', behavior: 'instant' }); }
    catch (error) { target.scrollIntoView(true); }
    root.style.scrollBehavior = prior;
    landedY = window.scrollY;
  }

  if (window.location.hash) {
    jumpToHash();
    window.addEventListener('load', function () {
      if (landedY === null || Math.abs(window.scrollY - landedY) < 4) jumpToHash();
    });
  }
  window.addEventListener('hashchange', function () { window.setTimeout(jumpToHash, 0); });

  /* Scroll choreography: one passive listener, one frame at a time. The rail
     reports progress, the hero drifts against the copy, and the dark sections
     let their light move behind the still illustrations. The products never
     animate on their own. */
  var railFill = document.querySelector('.scroll-rail__fill');
  var scrollScenes = document.querySelectorAll('[data-scroll]');
  var heroLive = document.querySelector('.hero3');
  var scrollQueued = false;

  function paintScroll() {
    scrollQueued = false;
    var y = window.scrollY || 0;
    var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    var progress = Math.min(1, Math.max(0, y / max));
    root.style.setProperty('--scroll', progress.toFixed(4));
    if (railFill) railFill.style.transform = 'scaleX(' + progress.toFixed(4) + ')';

    if (reduced.matches) return;

    if (heroLive) {
      var hp = Math.min(1, Math.max(0, y / Math.max(1, heroLive.offsetHeight)));
      heroLive.style.setProperty('--hero-p', hp.toFixed(4));
    }

    for (var i = 0; i < scrollScenes.length; i++) {
      var el = scrollScenes[i];
      var rect = el.getBoundingClientRect();
      if (rect.bottom < -160 || rect.top > window.innerHeight + 160) continue;
      var q = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
      el.style.setProperty('--p', Math.min(1, Math.max(0, q)).toFixed(4));
    }
  }

  function queueScroll() {
    if (scrollQueued) return;
    scrollQueued = true;
    window.requestAnimationFrame(paintScroll);
  }

  window.addEventListener('scroll', queueScroll, { passive: true });
  window.addEventListener('resize', queueScroll);
  paintScroll();

  /* the kit plate answers a pointer with a few degrees of depth. Pointer
     devices only, never under reduced motion, and it resets on leave. */
  if (!reduced.matches && window.matchMedia('(hover: hover)').matches) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-tilt]'), function (el) {
      var frame = 0;
      var mx = 0;
      var my = 0;

      function apply() {
        frame = 0;
        el.style.transform = 'perspective(900px) rotateX(' + (-my * 4.2).toFixed(2) + 'deg) rotateY(' + (mx * 4.2).toFixed(2) + 'deg)';
      }

      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        mx = (e.clientX - r.left) / r.width - 0.5;
        my = (e.clientY - r.top) / r.height - 0.5;
        if (!frame) frame = requestAnimationFrame(apply);
      }, { passive: true });

      el.addEventListener('pointerleave', function () {
        mx = 0;
        my = 0;
        if (!frame) frame = requestAnimationFrame(apply);
      }, { passive: true });
    });
  }

  /* Parallax is an enhancement, not a dependency. React is downloaded after
     idle, only on wide screens, and only when motion is welcome. */
  var wide = window.matchMedia('(min-width: 861px)');
  if (!reduced.matches && wide.matches && document.querySelector('.stage, .immersion, .petrichor, .alg-strip, .shot')) {
    var loadParallax = function () {
      import('/assets/parallax.js').catch(function () {});
    };
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(loadParallax, { timeout: 1600 });
    } else {
      window.setTimeout(loadParallax, 900);
    }
  }

  if (reduced.matches || !('IntersectionObserver' in window)) return;

  var nodes = document.querySelectorAll([
    'main .section-head',
    'main .alg-cat__head',
    'main .shot',
    'main .plate',
    'main .price',
    'main .immersion__body',
    'main .petrichor__body',
    'main .figures article',
    'main .post-list article',
    'main .steps li',
    'main .strain',
    'main .alg-prod',
    'main .table-scroll',
    'main .orderbox',
    'main .live-stats__grid > div',
    'main .culture-room__list li',
    'main .morph__card',
    'main .morph__foot',
    'main .kit-stage__list li'
  ].join(','));

  var watched = [];

  Array.prototype.forEach.call(nodes, function (el) {
    if (el.closest('.hero')) return; // the hero has its own entrance
    el.classList.add('reveal');
    var siblings = el.parentElement ? el.parentElement.children : [];
    var index = 0;
    for (var i = 0; i < siblings.length; i++) {
      if (siblings[i] === el) break;
      if (siblings[i].classList && siblings[i].classList.contains('reveal')) index++;
    }
    if (index > 0) el.style.setProperty('--d', Math.min(index, 3) * 70 + 'ms');
    watched.push(el);
  });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

  watched.forEach(function (el) { io.observe(el); });
})();
