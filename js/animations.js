"use strict";
(function () {
  var reduced = matchMedia('(prefers-reduced-motion: reduce)');
  var count = document.getElementById('countUp');
  if (count) count.textContent = '2.34';
  if ('IntersectionObserver' in window && !reduced.matches) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      });
    }, {threshold: 0.08});
    document.querySelectorAll('.section-reveal').forEach(function (node) { observer.observe(node); });
    reduced.addEventListener('change', function () { if (reduced.matches) observer.disconnect(); });
  }
  document.querySelectorAll('details').forEach(function (details) {
    details.addEventListener('toggle', function () {
      if (!details.open || reduced.matches) return;
      var content = details.querySelector('summary + *');
      if (content && content.animate) content.animate([{opacity: .65, transform: 'translateY(-4px)'}, {opacity: 1, transform: 'none'}], {duration: 180, easing: 'cubic-bezier(.2,.65,.3,1)'});
    });
  });
  function revealTarget() {
    if (!location.hash) return;
    var target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (!target) return;
    var parent = target.parentElement;
    while (parent) { if (parent.tagName === 'DETAILS') parent.open = true; parent = parent.parentElement; }
    requestAnimationFrame(function () { target.scrollIntoView({behavior: 'instant', block: 'start'}); });
  }
  addEventListener('hashchange', revealTarget);
  revealTarget();
})();
