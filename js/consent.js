/* Orr Biologicals — cookie & storage consent
   Small, dependency-free, defer-safe. No trackers, no network calls.
   Gates non-essential storage (game saves) behind an explicit choice. */
(function () {
  "use strict";

  var KEY = "ob-cookie-consent";
  var VERSION = "1"; // bump to re-ask after material policy changes

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var v = JSON.parse(raw);
      return (v && v.v === VERSION && typeof v.choice === "string") ? v.choice : null;
      /* null => ask again (new visitor, cleared storage, or outdated version) */
    } catch (e) { return null; }
  }

  function write(choice) {
    try {
      localStorage.setItem(KEY, JSON.stringify({ v: VERSION, choice: choice, t: Date.now() }));
    } catch (e) { /* storage unavailable: re-ask next visit, never block the page */ }
  }

  function banner() {
    if (document.getElementById("ob-consent")) return;
    var el = document.createElement("div");
    el.id = "ob-consent";
    el.setAttribute("role", "region");
    el.setAttribute("aria-label", "Cookie consent");
    el.innerHTML =
      '<div class="ob-c-inner">' +
        '<p class="ob-c-text">We use strictly necessary storage to remember this choice. ' +
        'No ads, no trackers. Optional local saves (like game progress) need your OK — ' +
        '<a href="/privacy">privacy policy</a>.</p>' +
        '<div class="ob-c-actions">' +
          '<button type="button" class="ob-c-btn ob-c-essential">Essential only</button>' +
          '<button type="button" class="ob-c-btn ob-c-accept">Accept all</button>' +
          ' <a class="ob-c-link" href="/privacy">Privacy</a>' +
          ' <a class="ob-c-link" href="/terms">Terms</a>' +
        '</div>' +
      '</div>';
    var accept = el.querySelector(".ob-c-accept");
    var essential = el.querySelector(".ob-c-essential");
    accept.addEventListener("click", function () { decide("all"); });
    essential.addEventListener("click", function () { decide("essential"); });
    document.body.appendChild(el);
  }

  function decide(choice) {
    write(choice);
    var el = document.getElementById("ob-consent");
    if (el) {
      el.classList.add("ob-c-out");
      window.setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 350);
      el.setAttribute("aria-hidden", "true");
    }
    try { window.dispatchEvent(new CustomEvent("ob-consent", { detail: { choice: choice } })); } catch (e) {}
  }

  /* ---------- public API ---------- */
  window.OBConsent = {
    get: read,
    ask: banner,
    reset: function () {
      try { localStorage.removeItem(KEY); } catch (e) {}
      banner();
    }
  };

  /* ---------- styles ---------- */
  /* ---------- boot ---------- */
  function boot() {
    if (!read()) banner(); /* show until a valid choice exists */
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
