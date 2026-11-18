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
    'main .orderbox'
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
