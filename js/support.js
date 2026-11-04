/* Orr Biologicals · copy-to-clipboard for the Lightning support address.
   Runs on the /support/ page and the homepage support band. Uses the
   Clipboard API where available with an execCommand fallback; only the
   target element's own text is ever copied. */
(function () {
  'use strict';

  function legacyCopy(value) {
    var area = document.createElement('textarea');
    area.value = value;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.left = '-999px';
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (error) { ok = false; }
    document.body.removeChild(area);
    return ok;
  }

  function copy(value) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(value).then(function () { return true; }).catch(function () { return legacyCopy(value); });
    }
    return Promise.resolve(legacyCopy(value));
  }

  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-copy]');
    if (!button) return;
    var source = document.querySelector(button.getAttribute('data-copy'));
    var status = document.querySelector(button.getAttribute('data-status') || '');
    if (!source) return;
    var value = source.textContent.trim();
    copy(value).then(function (ok) {
      if (!status) return;
      status.textContent = ok
        ? 'Copied: ' + value
        : 'Copy failed — select the address and copy it manually.';
    });
  });
})();
