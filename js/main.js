/* Orr Biologicals — main.js · nav, reveals, forms */
(function () {
  "use strict";

  /* Mobile nav */
  var nav = document.querySelector(".nav");
  var toggle = document.querySelector(".nav-toggle");
  if (nav && toggle) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("click", function (e) {
      if (nav.classList.contains("open") && !nav.contains(e.target)) {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* Active nav link */
  var path = location.pathname.replace(/\/+$/, "") || "/";
  var pagePath = path.match(/^\/pages\/(.+)\.html$/i);
  var articlePath = path.match(/^\/pages\/insights\/(.+)\.html$/i);
  if (articlePath) path = "/insights/" + articlePath[1];
  else if (pagePath) path = "/" + pagePath[1];
  document.querySelectorAll(".nav-links a:not(.btn)").forEach(function (a) {
    var href = (a.getAttribute("href") || "").split("#")[0].toLowerCase().replace(/\/+$/, "") || "/";
    var matchesSection = href === "/insights" && path.toLowerCase().indexOf("/insights/") === 0;
    if (href === path.toLowerCase() || matchesSection) a.classList.add("active");
  });

  /* Scroll reveals */
  var els = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && els.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("visible"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    els.forEach(function (el) { io.observe(el); });
  } else {
    els.forEach(function (el) { el.classList.add("visible"); });
  }

  /* Newsletter (front-end demo) */
  var news = document.querySelector(".newsletter-form");
  if (news) {
    news.addEventListener("submit", function (e) {
      e.preventDefault();
      var note = news.parentElement.querySelector(".form-success");
      if (note) {
        note.textContent = "Thank you — we will be in touch.";
        note.classList.add("show");
      }
      news.reset();
    });
  }

  /* Contact form (front-end demo, honeypot-protected) */
  var form = document.getElementById("contact-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var hp = form.querySelector(".hp input, input.hp");
      if (hp && hp.value) return; // spam bot
      var note = document.getElementById("form-status");
      if (note) {
        note.textContent = "Thank you for your inquiry. We review every message — expect a reply via email.";
        note.classList.add("show");
      }
      form.reset();
    });
  }
})();
