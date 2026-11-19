import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';

// Each entry is a layer that can move a little relative to the page. The hero
// copy moves least, the photographs move most, and everything stays well under
// a finger's width so the layout never appears to slide apart.
const LAYERS = [
  { selector: '.stage__copy', max: 10 },
  { selector: '.stage__media', max: 22 },
  { selector: '.immersion img', max: 54, scale: 1.08 },
  { selector: '.petrichor__figure img', max: 38, scale: 1.06 },
  { selector: '.alg-strip img', max: 22, scale: 1.045 },
  { selector: '.shot img', max: 16, scale: 1.035 }
];

function ParallaxField() {
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce), (max-width: 860px)');
    let layers = [];
    let frame = 0;
    let listening = false;

    const stop = () => {
      if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
      if (listening) {
        window.removeEventListener('scroll', schedule, { passive: true });
        window.removeEventListener('resize', schedule);
        listening = false;
      }
      layers.forEach(({ el }) => {
        el.classList.remove('is-parallax');
        el.style.transform = '';
      });
      layers = [];
    };

    const apply = () => {
      frame = 0;
      const viewport = window.innerHeight;
      const middle = viewport / 2;

      layers.forEach(({ el, max, scale }) => {
        const rect = el.getBoundingClientRect();
        if (!rect.height) return;

        // +1 when the layer is entering from below, 0 when centred, -1 when
        // leaving above. Clamping keeps off-screen layers from building up a
        // large transform before they appear.
        const progress = Math.max(-1, Math.min(1, (middle - (rect.top + rect.height / 2)) / (middle + rect.height / 2)));
        const shift = (progress * max).toFixed(2);
        const lift = scale && !el.matches('.stage__media') ? ` scale(${scale})` : '';
        el.style.transform = `translate3d(0, ${shift}px, 0)${lift}`;
      });
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };

    const start = () => {
      if (query.matches) return;

      layers = LAYERS.flatMap(({ selector, max, scale }) =>
        Array.from(document.querySelectorAll(selector), (el) => ({ el, max, scale }))
      );

      if (!layers.length) return;

      layers.forEach(({ el }) => el.classList.add('is-parallax'));
      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', schedule);
      listening = true;
      apply();
    };

    const onChange = () => {
      stop();
      start();
    };

    start();

    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', onChange);
    } else {
      query.addListener(onChange);
    }

    return () => {
      stop();
      if (typeof query.removeEventListener === 'function') {
        query.removeEventListener('change', onChange);
      } else {
        query.removeListener(onChange);
      }
    };
  }, []);

  return null;
}

const root = document.getElementById('parallax-root') || (() => {
  const host = document.createElement('div');
  host.id = 'parallax-root';
  host.hidden = true;
  document.body.appendChild(host);
  return host;
})();

createRoot(root).render(<ParallaxField />);
