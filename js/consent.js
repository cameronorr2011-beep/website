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
  var css = document.createElement("style");
  css.textContent =
    "#ob-consent{position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;" +
      "display:flex;justify-content:center;pointer-events:none;" +
      "font-family:'Bricolage Grotesque',system-ui,sans-serif}" +
    "#ob-consent .ob-c-inner{pointer-events:auto;max-width:720px;width:100%;" +
      "background:rgba(6,20,12,.97);border:1px solid rgba(90,208,122,.25);border-radius:14px;" +
      "padding:14px 18px;display:flex;gap:14px;align-items:center;flex-wrap:wrap;" +
      "box-shadow:0 18px 50px rgba(0,0,0,.5);color:#cfdccf;font-size:.85rem;line-height:1.5}" +
    ".ob-c-text{margin:0;flex:1 1 320px;min-width:0}" +
    ".ob-c-text a{color:#5ad07a;text-decoration:underline;text-underline-offset:2px}" +
    ".ob-c-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}" +
    ".ob-c-btn{cursor:pointer;border:1px solid rgba(90,208,122,.3);background:rgba(90,208,122,.08);" +
      "color:#e8f0e8;border-radius:999px;padding:8px 14px;font:600 .78rem 'Bricolage Grotesque',system-ui,sans-serif;" +
      "transition:border-color .2s,color .2s,background .2s}" +
    ".ob-c-btn:hover{border-color:#5ad07a;color:#5ad07a}" +
    ".ob-c-accept{background:#5ad07a;border-color:#5ad07a;color:#04140d}" +
    ".ob-c-accept:hover{background:#7ce298;color:#04140d}" +
    ".ob-c-link{color:#9fb3a4;font-size:.75rem;text-decoration:none;margin-left:2px}" +
    ".ob-c-link:hover{color:#5ad07a}" +
    ".ob-c-out{opacity:0;transform:translateY(12px);transition:opacity .3s,transform .3s}" +
    "@media (max-width:560px){#ob-consent .ob-c-inner{flex-direction:column;align-items:stretch}}" +
    "@media (prefers-reduced-motion:reduce){.ob-c-out{transition:none}}";
  document.head.appendChild(css);

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
