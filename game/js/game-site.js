import { initHero, initColony, initBacteria, initAmbient } from "./site-scenes.js";

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
window.__reducedMotion = reduced;

/* ---------- body state: site vs game ---------- */
function enterGame(push = true) {
  document.body.classList.add("playing");
  document.body.classList.remove("site-open");
  $("#btnStart").click();
  if (push) history.pushState({ game: true }, "", "#play-game");
}
function exitGame() {
  if (!document.body.classList.contains("playing")) return;
  document.body.classList.remove("playing");
  document.body.classList.add("site-open");
}
$("#playNow").addEventListener("click", () => enterGame());
$$("[data-play]").forEach((b) => b.addEventListener("click", () => enterGame()));
$("#exitSite").addEventListener("click", () => { exitGame(); history.back(); });
addEventListener("popstate", () => exitGame());

/* ---------- mobile menu ---------- */
const mnav = $("#mnav"), menuBtn = $("#menuBtn");
menuBtn.addEventListener("click", () => {
  const open = mnav.hidden;
  mnav.hidden = !open;
  menuBtn.setAttribute("aria-expanded", String(open));
});
mnav.addEventListener("click", (e) => {
  if (e.target.tagName === "A") { mnav.hidden = true; menuBtn.setAttribute("aria-expanded", "false"); }
});

/* ---------- smooth scroll + active section ---------- */
$$("[data-nav]").forEach((a) => a.addEventListener("click", (e) => {
  const id = a.getAttribute("href");
  if (!id.startsWith("#")) return;
  e.preventDefault();
  document.querySelector(id)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
}));
const navLinks = $$('#siteNav .nlinks a');
const secObs = new IntersectionObserver((entries) => {
  for (const en of entries) if (en.isIntersecting) {
    const id = "#" + en.target.id;
    navLinks.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === id));
  }
}, { rootMargin: "-45% 0px -50% 0px" });
["home","start-here","world","evolve","colony","bacteria","reactor","tycoon","play"].forEach((id) => {
  const el = document.getElementById(id);
  if (el) secObs.observe(el);
});

/* ---------- evolution tree interactions ---------- */
const TRAITS = {
  light:       ["Light capture", "Bigger photosystems drink faint glows. Your cell brightens and thrives in dim corners of the column."],
  defense:     ["Defense", "Thicker walls and chemical deterrents. Grazers find you chewy and regrettable."],
  growth:      ["Growth", "Divide sooner on less. The fastest lineages are rarely the greediest."],
  environment: ["Resilience", "Tolerate heat swings, pH drift and salty surprises the reactor throws at you."],
  colony:      ["Cooperation", "Share energy through biofilm networks. A colony thinks with one slow mind."],
};
const demoCell = $("#demoCell");
$$('#evoTree .leaf').forEach((leaf) => {
  const key = leaf.dataset.trait;
  const show = () => {
    $$('#evoTree .leaf').forEach((l) => l.classList.toggle("on", l === leaf));
    $("#ttName").textContent = TRAITS[key][0];
    $("#ttDesc").textContent = TRAITS[key][1];
    demoCell.className = "demo-cell t-" + key;
  };
  leaf.addEventListener("mouseenter", show);
  leaf.addEventListener("click", show);
  leaf.addEventListener("focus", show);
  leaf.setAttribute("tabindex", "0");
  leaf.setAttribute("role", "button");
  leaf.setAttribute("aria-label", TRAITS[key].join(". "));
});

/* ---------- reactor scroll zoom ---------- */
const zCell = $("#zCell"), zReactor = $("#zReactor"), ro = $(".readouts");
function reactorFrame() {
  const r = $("#reactor").getBoundingClientRect();
  const total = r.height - innerHeight;
  const p = Math.min(1, Math.max(0, -r.top / Math.max(1, total)));
  const zoomP = Math.min(1, p / 0.55);
  zCell.style.transform = `scale(${Math.max(0.05, 1 - zoomP * 0.95)}) translate(${zoomP * 40}px,${-zoomP * 30}px)`;
  zCell.style.opacity = String(Math.max(0, 1 - zoomP * 1.15));
  const rp = Math.max(0, (p - 0.4) / 0.6);
  zReactor.style.opacity = String(rp);
  zReactor.style.transform = `scale(${0.72 + rp * 0.28})`;
  ro.style.opacity = String(rp > 0.7 ? (rp - 0.7) * 3 : 0);
}

/* ---------- tycoon cards ---------- */
const TYCOON = {
  light:   { cls: "has-led",     stat: "Photon efficiency",   val: "+25%" },
  co2:     { cls: "has-co2",     stat: "Carbon uptake",       val: "+20%" },
  mix:     { cls: "has-mix",     stat: "Circulation",         val: "+15%" },
  sensor:  { cls: "has-sensor",  stat: "Data fidelity",       val: "+15%" },
  harvest: { cls: "has-harvest", stat: "Biomass recovery",    val: "+9%/h" },
};
$$(".upcard[data-up]").forEach((card) => card.addEventListener("click", () => {
  $$(".upcard").forEach((c) => c.classList.toggle("on", c === card));
  const t = TYCOON[card.dataset.up];
  const mr = $("#miniReactor");
  mr.className = "mini-reactor has-culture " + t.cls;
  $("#statName").textContent = t.stat;
  animateVal($("#statVal"), t.val);
}));
function animateVal(el, target) {
  let i = 0; const digits = target.match(/\d+/);
  if (!digits) { el.textContent = target; return; }
  const end = +digits[0], pre = target.slice(0, digits.index), post = target.slice(digits.index + digits[0].length);
  const iv = setInterval(() => {
    i += Math.ceil(end / 14);
    if (i >= end) { el.textContent = target; clearInterval(iv); return; }
    el.textContent = pre + i + post;
  }, 40);
}

/* ---------- scenes (canvas) ---------- */
initHero($("#cvHero"), reduced);
initColony($("#cvColony"), reduced);
initBacteria($("#cvBact"), reduced, $("#vignetteCap"));
$$("[data-ambient]").forEach((cv) => initAmbient(cv, reduced));

/* colony density follows scroll through its section */
const colonySec = $("#colony"), dens = $$(".densities span");
new IntersectionObserver((ens) => ens.forEach((en) => { window.__colonyVisible = en.isIntersecting; }), { threshold: 0.05 })
  .observe(colonySec);
addEventListener("scroll", () => {
  const r = colonySec.getBoundingClientRect();
  const p = Math.min(1, Math.max(0, (innerHeight - r.top) / (r.height + innerHeight)));
  window.__colonyDensity = p;
  const idx = Math.min(3, Math.floor(p * 4));
  dens.forEach((s, i) => s.classList.toggle("lit", i <= idx));
}, { passive: true });

/* single scroll rAF for transform work */
let ticking = false;
if (!reduced) addEventListener("scroll", () => {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(() => { reactorFrame(); ticking = false; });
  }
}, { passive: true });

/* boot state */
document.body.classList.add("site-open");
if (location.hash === "#play-game" || location.hash === "#play") {
  // deep-link straight into play only from explicit #play-game
  if (location.hash === "#play-game") enterGame(false); else location.hash = "#home";
}
