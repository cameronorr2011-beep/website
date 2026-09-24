/* Cyanoflow — dependency-free interaction layer */
(function () {
  "use strict";

  var menuButton = document.querySelector(".menu-toggle");
  var menu = document.getElementById("mobile-menu");
  if (menuButton && menu) {
    menuButton.addEventListener("click", function () {
      var open = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!open));
      menuButton.setAttribute("aria-label", open ? "Open navigation" : "Close navigation");
      menu.hidden = open;
    });
    menu.addEventListener("click", function (event) {
      if (event.target.tagName === "A") {
        menu.hidden = true;
        menuButton.setAttribute("aria-expanded", "false");
      }
    });
  }

  var progress = document.querySelector(".reading-progress span");
  function updateProgress() {
    if (!progress) return;
    var available = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (available > 0 ? (window.scrollY / available) * 100 : 0) + "%";
  }
  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();

  var sequenceStages = [
    ["Sample preparation", "A cell-containing sample enters the controlled fluidic path."],
    ["Single-cell isolation", "Individual cells are directed into separate aqueous compartments."],
    ["Compartment transport", "Isolated cells move through the chip under controlled flow."],
    ["Optical acquisition", "A defined imaging region records cell appearance over time."],
    ["Quantitative analysis", "Computer vision extracts morphology and temporal measurements."],
    ["Candidate identification", "Cells matching predefined characteristics are prioritized for review."]
  ];
  var sequenceButton = document.getElementById("sequence-button");
  var stageIndex = document.getElementById("stage-index");
  var stageTitle = document.getElementById("stage-title");
  var stageCopy = document.getElementById("stage-copy");
  var sequenceStatus = document.getElementById("sequence-status");
  var sequenceBar = document.getElementById("sequence-progress-bar");
  var sequenceTimer = null;
  var sequencePosition = -1;
  function showStage(index) {
    sequencePosition = index;
    var stage = sequenceStages[index];
    stageIndex.textContent = String(index + 1).padStart(2, "0");
    stageTitle.textContent = stage[0];
    stageCopy.textContent = stage[1];
    sequenceStatus.textContent = index === sequenceStages.length - 1 ? "REVIEW" : "RUNNING";
    sequenceBar.style.width = (((index + 1) / sequenceStages.length) * 100) + "%";
  }
  if (sequenceButton) {
    sequenceButton.addEventListener("click", function () {
      if (sequenceTimer) {
        clearInterval(sequenceTimer);
        sequenceTimer = null;
        sequenceStatus.textContent = "PAUSED";
        sequenceButton.firstChild.textContent = "Resume conceptual sequence ";
        return;
      }
      if (sequencePosition >= sequenceStages.length - 1) showStage(0);
      sequenceButton.firstChild.textContent = "Pause conceptual sequence ";
      sequenceTimer = setInterval(function () {
        if (sequencePosition >= sequenceStages.length - 1) {
          clearInterval(sequenceTimer);
          sequenceTimer = null;
          sequenceStatus.textContent = "COMPLETE";
          sequenceButton.firstChild.textContent = "Run sequence again ";
          return;
        }
        showStage(sequencePosition + 1);
      }, 1050);
    });
  }

  var mapCanvas = document.getElementById("candidate-map");
  var mapControl = document.getElementById("map-control");
  var showCandidates = true;
  function seededRandom(seed) {
    var value = seed % 2147483647;
    if (value <= 0) value += 2147483646;
    return function () {
      value = value * 16807 % 2147483647;
      return (value - 1) / 2147483646;
    };
  }
  function drawCandidateMap() {
    if (!mapCanvas) return;
    var rect = mapCanvas.getBoundingClientRect();
    var ratio = Math.min(window.devicePixelRatio || 1, 2);
    var width = Math.max(320, rect.width);
    var height = Math.max(260, rect.height);
    mapCanvas.width = width * ratio;
    mapCanvas.height = height * ratio;
    var ctx = mapCanvas.getContext("2d");
    ctx.scale(ratio, ratio);
    ctx.clearRect(0, 0, width, height);
    var random = seededRandom(184);
    var clusters = [
      [0.24, 0.3, 0.12, 0.12], [0.57, 0.24, 0.16, 0.13], [0.72, 0.62, 0.18, 0.18], [0.4, 0.7, 0.14, 0.12]
    ];
    for (var i = 0; i < 430; i += 1) {
      var cluster = clusters[i % clusters.length];
      var x = (cluster[0] + (random() - 0.5) * cluster[2] * 2) * width;
      var y = (cluster[1] + (random() - 0.5) * cluster[3] * 2) * height;
      var rare = i % 83 === 0;
      ctx.beginPath();
      ctx.arc(x, y, rare ? 3.8 : 1.35 + random() * 1.2, 0, Math.PI * 2);
      if (rare && showCandidates) {
        ctx.fillStyle = "#b8e778";
        ctx.shadowColor = "#b8e778";
        ctx.shadowBlur = 9;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(184,231,120,.34)";
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        ctx.fillStyle = rare ? "rgba(184,231,120,.18)" : "rgba(87,151,139,.48)";
        ctx.fill();
      }
    }
    ctx.strokeStyle = "rgba(99,227,210,.06)";
    ctx.lineWidth = 1;
    for (var gx = 0; gx < width; gx += 54) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, height); ctx.stroke(); }
    for (var gy = 0; gy < height; gy += 54) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(width, gy); ctx.stroke(); }
  }
  if (mapCanvas) {
    drawCandidateMap();
    var redraw;
    window.addEventListener("resize", function () {
      clearTimeout(redraw);
      redraw = setTimeout(drawCandidateMap, 120);
    });
  }
  if (mapControl) {
    mapControl.addEventListener("click", function () {
      showCandidates = !showCandidates;
      mapControl.setAttribute("aria-pressed", String(showCandidates));
      mapControl.textContent = showCandidates ? "Hide candidate layer" : "Show candidate layer";
      drawCandidateMap();
    });
  }

  var layers = Array.prototype.slice.call(document.querySelectorAll(".arch-layer"));
  function activateLayer(index) {
    layers.forEach(function (layer, layerIndex) { layer.classList.toggle("active", layerIndex === index); });
  }
  layers.forEach(function (layer, index) {
    layer.addEventListener("mouseenter", function () { activateLayer(index); });
    layer.addEventListener("focus", function () { activateLayer(index); });
  });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden && sequenceTimer) {
      clearInterval(sequenceTimer);
      sequenceTimer = null;
      sequenceStatus.textContent = "PAUSED";
      sequenceButton.firstChild.textContent = "Resume conceptual sequence ";
    }
  });
}());
