(() => {
  'use strict';

  const canvas = document.getElementById('growthCanvas');
  const graph = document.getElementById('populationGraph');
  if (!canvas || !graph) return;

  const ctx = canvas.getContext('2d');
  const graphCtx = graph.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  graphCtx.imageSmoothingEnabled = false;

  const W = canvas.width;
  const H = canvas.height;
  const TOTAL = 46;
  const sceneStarts = [0, 6, 13, 20, 27, 35, 41];
  const colors = {
    ink: '#edf5e9',
    soft: '#b9d0cb',
    mute: '#79979b',
    faint: '#46626a',
    lime: '#b8e986',
    green: '#65d3a0',
    teal: '#7ed4df',
    amber: '#e5b478',
    red: '#ef8e80',
    violet: '#b6a0e7',
  };

  const scenes = [
    {
      title: '01 · The starting culture',
      short: 'STARTING CULTURE',
      caption: 'A few cells drift through a nutrient-rich water column.',
      beginnerTitle: 'Start with a viable cell',
      beginner: 'A small inoculum begins with water, dissolved carbon dioxide, light, and mineral nutrients. Each cell is a complete living system with its own boundary, pigments, and machinery for turning energy into new material.',
      advancedTitle: 'A mixed physical and chemical starting state',
      advanced: 'The inoculum is a population of photoautotrophic cells suspended in an aqueous medium. Cell envelopes, pigments, carbon-concentrating systems, and dissolved ions are present before net biomass accumulation begins.',
      footnote: 'Species differ in shape, pigments, carbon use, and the conditions they can tolerate.',
      equation: ['water', 'CO₂', 'light', 'ions'],
      description: 'The starting culture contains a few green algal cells drifting in water. Small teal and amber particles represent dissolved carbon and mineral nutrients; light rays enter from above.',
      voiceover: 'A culture starts with a few cells suspended in water. They need light, carbon dioxide, water, and mineral nutrients.',
    },
    {
      title: '02 · Photosynthesis',
      short: 'PHOTOSYNTHESIS',
      caption: 'Light supplies energy; carbon becomes part of the cell.',
      beginnerTitle: 'Catch light. Build sugar. Release oxygen.',
      beginner: 'Pigments absorb photons and transfer that energy into photosynthetic chemistry. Carbon dioxide and water feed the process. The sugar is a carbon-and-energy intermediate; oxygen leaves as a by-product of water splitting.',
      advancedTitle: 'Energy transduction precedes carbon fixation',
      advanced: 'The light reactions generate ATP and reducing power. Carbon fixation then uses that chemical energy to assimilate inorganic carbon into triose phosphates and downstream metabolites; O₂ is released by photosystem II in oxygenic phototrophs.',
      footnote: 'Light is an energy input, not a physical building material incorporated into biomass.',
      equation: ['photons', 'CO₂', 'H₂O'],
      description: 'Incoming yellow light packets travel toward a cell. Carbon dioxide and water enter the photosynthetic process; sugar packets leave the cell while oxygen bubbles rise away.',
      voiceover: 'Pigments absorb light. That energy drives photosynthesis, turning carbon dioxide and water into sugars while oxygen is released.',
    },
    {
      title: '03 · Cellular growth',
      short: 'CELLULAR GROWTH',
      caption: 'Photosynthetic products and nutrients become cell material.',
      beginnerTitle: 'Growth is more than getting bigger',
      beginner: 'The cell uses newly made carbon compounds plus absorbed nitrogen, phosphorus, sulfur, and trace elements to build proteins, membranes, pigments, nucleic acids, and storage products. The cell expands before it divides.',
      advancedTitle: 'Assimilation turns energy into biomass',
      advanced: 'Net growth couples carbon fixation to nutrient assimilation and macromolecular synthesis. A cell may increase dry mass, storage inclusions, pigment content, or structural volume without immediately producing a daughter cell.',
      footnote: 'Growth and reproduction are related, but they are not the same event.',
      equation: ['sugars', 'N + P', 'biosynthesis'],
      description: 'A highlighted cell grows wider and brighter as small nutrient packets move into it. New chloroplast-like pigment bands and a storage granule appear inside the cell.',
      voiceover: 'The cell uses carbon compounds and nutrients to build proteins, membranes, pigments, and storage material. Growth comes before division.',
    },
    {
      title: '04 · Cell division',
      short: 'CELL DIVISION',
      caption: 'One mature cell becomes daughter cells when conditions allow.',
      beginnerTitle: 'Then the cell makes a copy',
      beginner: 'After enough cellular material and genetic information have been prepared, the parent cell divides. The exact timing and mechanism depend on the species, its life cycle, and the environment.',
      advancedTitle: 'Reproduction is species- and condition-dependent',
      advanced: 'Microalgae may divide by binary fission, multiple fission, or other lineage-specific pathways. The animation shows an illustrative daughter-cell event, not a universal algal division mechanism.',
      footnote: 'A faster division rate is only possible when energy, carbon, nutrients, and conditions remain compatible.',
      equation: ['parent', 'replication', 'daughters'],
      description: 'The mature mother cell elongates, forms a division boundary, and separates into two daughter cells. The daughters drift apart and rejoin the population.',
      voiceover: 'When the cell has enough material, it divides. The exact timing and method depend on species and conditions.',
    },
    {
      title: '05 · Population growth',
      short: 'POPULATION GROWTH',
      caption: 'Repeated division turns a small inoculum into a culture.',
      beginnerTitle: 'Small beginnings can compound',
      beginner: 'When many cells divide successfully, the population grows quickly. Early growth can look exponential. As the culture becomes denser, light, carbon, nutrients, space, and gas exchange become harder to share.',
      advancedTitle: 'Growth moves from expansion toward limitation',
      advanced: 'The curve is logistic in spirit: a positive net specific growth rate is progressively reduced by self-shading, depletion, altered pH, oxygen accumulation, and other density-linked constraints.',
      footnote: 'The counter and curve are illustrative values generated by this animation, not a calibrated prediction.',
      equation: ['division', 'density', 'limits'],
      description: 'The view pulls back to a culture vessel containing a larger green population. The graph begins to bend as the vessel becomes denser.',
      voiceover: 'Repeated division increases the population. At higher density, light, carbon, nutrients, and gas exchange become limiting.',
    },
    {
      title: '06 · Limits & stress',
      short: 'LIMITS & STRESS',
      caption: 'More is not always better: balance keeps growth viable.',
      beginnerTitle: 'Every culture has a useful range',
      beginner: 'Too little light or carbon can slow growth. Too much light can cause photoinhibition. Temperature, nutrient balance, pH, salinity, mixing, and oxygen can also push cells into stress.',
      advancedTitle: 'The response is a window, not a single dial',
      advanced: 'The control panel applies a qualitative suitability function around species-agnostic optima. Real response surfaces are strain-specific and interact with acclimation, irradiance history, mixing, pH, and mass transfer.',
      footnote: 'Move the controls to see a slower, stressed, or more balanced culture response.',
      equation: ['light', 'temperature', 'balance'],
      description: 'A culture vessel remains visible while the environment changes. The cells slow down and the scene takes on an amber stress tint when the controls move outside a balanced range.',
      voiceover: 'More is not always better. Too much light, unsuitable temperature, or nutrient imbalance can stress cells and slow growth.',
    },
    {
      title: '07 · The culture system',
      short: 'CULTURE SYSTEM',
      caption: 'A real photobioreactor connects cells to measurable conditions.',
      beginnerTitle: 'The culture is a living system',
      beginner: 'In a flask or photobioreactor, operators watch biomass concentration, pH, dissolved oxygen, light, temperature, mixing, and nutrient availability. The goal is not maximum light or maximum fertilizer — it is a workable balance.',
      advancedTitle: 'Scale-up means managing coupled signals',
      advanced: 'At culture scale, biomass, pH, dissolved oxygen, carbon transfer, light attenuation, temperature, mixing, and nutrient state form a coupled process. Sensors inform decisions; they do not replace validation or species knowledge.',
      footnote: 'This visual links microscopic events to cultivation variables without claiming a validated process model.',
      equation: ['cells', 'sensors', 'culture'],
      description: 'The animation zooms out to a glowing photobioreactor. Green biomass circulates through the vessel while readouts for biomass, pH, dissolved oxygen, and nutrient availability stabilize.',
      voiceover: 'In a real culture system, biomass, pH, dissolved oxygen, light, temperature, mixing, and nutrients are measured together.',
    },
  ];

  // Future species modules can swap morphology and condition notes without
  // changing the scene system. The current visual remains a generalized,
  // illustrative cell rather than a species-identification claim.
  const speciesProfiles = {
    arthrospira: { label: 'ARTHROSPIRA', structure: 'thylakoid pigment bands', mode: 'filamentous cyanobacterium' },
    chlorella: { label: 'CHLORELLA', structure: 'single chloroplast', mode: 'spherical green microalga' },
    pavlova: { label: 'PAVLOVA', structure: 'pigment-rich plastid', mode: 'marine haptophyte' },
    isochrysis: { label: 'ISOCHRYSIS', structure: 'pigment-rich plastid', mode: 'marine microalga' },
  };
  const activeSpecies = speciesProfiles.arthrospira;

  const state = {
    elapsed: 0,
    playing: true,
    speed: 1,
    scene: 0,
    detail: 'beginner',
    targetZoom: 0,
    zoom: 0,
    labels: true,
    voiceover: false,
    reducedMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false,
    light: 68,
    temp: 24,
    nutrients: 76,
    co2: 62,
    species: 'arthrospira',
    lastFrame: performance.now(),
    lastUi: 0,
  };

  const particles = Array.from({ length: 70 }, (_, i) => ({
    x: hash(i * 2.1 + 2) * W,
    y: hash(i * 3.7 + 5) * H,
    size: 1 + Math.floor(hash(i * 8.3 + 2) * 3),
    speed: .3 + hash(i * 2.7 + 9) * 1.2,
    phase: hash(i * 4.1 + 1) * Math.PI * 2,
    type: i % 5 === 0 ? 'nutrient' : (i % 7 === 0 ? 'oxygen' : 'dust'),
  }));
  const cellSeeds = Array.from({ length: 96 }, (_, i) => ({
    x: 70 + hash(i * 3.11 + 2) * 820,
    y: 90 + hash(i * 4.41 + 8) * 355,
    size: 10 + hash(i * 6.2 + 4) * 15,
    angle: (hash(i * 2.3 + 6) - .5) * .9,
    phase: hash(i * 7.1 + 1) * Math.PI * 2,
    variant: i % 4,
  }));

  function hash(value) {
    const x = Math.sin(value * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  }
  function clamp(value, min = 0, max = 1) { return Math.max(min, Math.min(max, value)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t * t * (3 - 2 * t); }
  function formatClock(seconds) {
    const whole = Math.max(0, Math.floor(seconds));
    return `${String(Math.floor(whole / 60)).padStart(2, '0')}:${String(whole % 60).padStart(2, '0')}`;
  }
  function sceneAt(seconds) {
    for (let i = sceneStarts.length - 1; i >= 0; i -= 1) if (seconds >= sceneStarts[i]) return i;
    return 0;
  }
  function sceneProgress(index = state.scene) {
    const start = sceneStarts[index];
    const end = sceneStarts[index + 1] ?? TOTAL;
    return clamp((state.elapsed - start) / (end - start));
  }
  function conditionProfile() {
    const light = state.light / 100;
    const lightScore = 1 - Math.abs(light - .68) / .8;
    const lightPenalty = state.light > 88 ? .52 : 1;
    const tempScore = 1 - Math.abs(state.temp - 24) / 21;
    const nutrientScore = .35 + state.nutrients / 150;
    const co2Score = .35 + state.co2 / 150;
    const factor = clamp(lightScore * lightPenalty * clamp(tempScore, .18, 1) * clamp(nutrientScore, .2, 1) * clamp(co2Score, .2, 1), .08, 1.08);
    const stressed = state.light < 18 || state.light > 92 || state.temp < 12 || state.temp > 34 || state.nutrients < 18 || state.co2 < 14;
    const limiting = !stressed && factor < .55;
    return { factor, stressed, limiting, lightScore, tempScore };
  }
  function populationAt(seconds = state.elapsed) {
    const profile = conditionProfile();
    const growth = 1 / (1 + Math.exp(-.19 * (seconds - 28)));
    const capacity = 440 * clamp(profile.factor, .16, 1);
    return Math.max(4, Math.round(12 + (capacity - 12) * growth));
  }
  function setText(id, text) { const node = document.getElementById(id); if (node) node.textContent = text; }
  function qs(selector) { return document.querySelector(selector); }
  function qsa(selector) { return Array.from(document.querySelectorAll(selector)); }

  const voiceState = {
    enabled: false,
    speaking: false,
    lastScene: -1,
    audio: window.__ALGAE_VOICE_AUDIO__ ? new Audio(window.__ALGAE_VOICE_AUDIO__) : null,
    supported: Boolean(window.__ALGAE_VOICE_AUDIO__) || ('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window),
  };
  if (voiceState.audio) {
    voiceState.audio.addEventListener('play', () => {
      voiceState.speaking = true;
      qs('#voiceToggle')?.classList.add('is-speaking');
      setText('voiceLabel', 'Speaking');
      setText('voiceStatus', 'Narration playing.');
    });
    voiceState.audio.addEventListener('ended', () => {
      voiceState.speaking = false;
      qs('#voiceToggle')?.classList.remove('is-speaking');
      setText('voiceLabel', 'Voiceover');
      setText('voiceStatus', 'Voiceover ready.');
    });
  }

  function voiceText(index) {
    const scene = scenes[index];
    return `Scene ${index + 1}. ${scene.voiceover}`;
  }

  function speakScene(index, force = false) {
    if (!voiceState.supported || !voiceState.enabled) return;
    if (voiceState.audio) {
      voiceState.audio.play().catch(() => setText('voiceStatus', 'Voiceover is ready; press Voiceover again to start audio.'));
      return;
    }
    if (!force && index === voiceState.lastScene) return;
    voiceState.lastScene = index;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(voiceText(index));
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find((voice) => /^en(-|_)(US|GB)/i.test(voice.lang)) || voices.find((voice) => /^en/i.test(voice.lang));
    if (preferred) utterance.voice = preferred;
    utterance.rate = .94;
    utterance.pitch = .94;
    utterance.volume = .92;
    utterance.onstart = () => {
      voiceState.speaking = true;
      qs('#voiceToggle')?.classList.add('is-speaking');
      setText('voiceLabel', 'Speaking');
      setText('voiceStatus', `Voiceover speaking: ${scenes[index].short.toLowerCase()}.`);
    };
    utterance.onend = () => {
      voiceState.speaking = false;
      qs('#voiceToggle')?.classList.remove('is-speaking');
      setText('voiceLabel', 'Voiceover');
      setText('voiceStatus', 'Voiceover ready.');
    };
    utterance.onerror = () => {
      voiceState.speaking = false;
      qs('#voiceToggle')?.classList.remove('is-speaking');
      setText('voiceStatus', 'Voiceover could not start in this browser.');
    };
    window.speechSynthesis.speak(utterance);
  }

  function stopVoiceover() {
    if (voiceState.audio) {
      voiceState.audio.pause();
      voiceState.audio.currentTime = 0;
    }
    if (voiceState.supported) window.speechSynthesis.cancel();
    voiceState.speaking = false;
    qs('#voiceToggle')?.classList.remove('is-speaking');
    setText('voiceLabel', 'Voiceover');
  }

  function drawPixelText(text, x, y, color = colors.soft, size = 11, align = 'left') {
    ctx.save();
    ctx.font = `${size}px "IBM Plex Mono", monospace`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(text, Math.round(x), Math.round(y));
    ctx.restore();
  }

  function drawBackground(time, zoom) {
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, '#12303b');
    gradient.addColorStop(.52, '#0d2832');
    gradient.addColorStop(1, '#07171f');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    const halo = ctx.createRadialGradient(W * .5, H * .25, 12, W * .5, H * .25, 390);
    halo.addColorStop(0, 'rgba(142, 231, 191, .12)');
    halo.addColorStop(1, 'rgba(142, 231, 191, 0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(126, 212, 223, .055)';
    ctx.fillRect(0, 0, W, 110);
    ctx.fillStyle = 'rgba(0, 0, 0, .12)';
    ctx.fillRect(0, H - 42, W, 42);

    const rayAlpha = .035 + state.light / 100 * .085;
    const rays = [
      [[126, 0], [194, 0], [355, 430], [282, 430]],
      [[310, 0], [354, 0], [482, 420], [430, 420]],
      [[564, 0], [624, 0], [673, 430], [610, 430]],
      [[768, 0], [826, 0], [758, 430], [704, 430]],
    ];
    rays.forEach((ray, index) => {
      const drift = Math.sin(time * .00025 + index) * (2 + zoom * 3);
      ctx.fillStyle = `rgba(231, 233, 168, ${rayAlpha * (.72 + index * .06)})`;
      ctx.beginPath();
      ray.forEach(([x, y], point) => {
        if (point === 0) ctx.moveTo(x + drift, y); else ctx.lineTo(x + drift, y);
      });
      ctx.closePath();
      ctx.fill();
    });

    ctx.fillStyle = 'rgba(159, 223, 214, .055)';
    for (let i = 0; i < 9; i += 1) {
      const y = 122 + i * 34 + Math.sin(time * .00035 + i) * 4;
      ctx.fillRect(0, y, W, 1);
    }

    particles.forEach((particle) => {
      const x = (particle.x + time * .012 * particle.speed) % (W + 20) - 10;
      const y = particle.y + Math.sin(time * .00045 * particle.speed + particle.phase) * 11;
      if (particle.type === 'nutrient') {
        ctx.fillStyle = 'rgba(229, 180, 120, .78)';
        ctx.fillRect(Math.round(x), Math.round(y), particle.size + 1, particle.size + 1);
        ctx.fillStyle = 'rgba(255, 220, 150, .7)';
        ctx.fillRect(Math.round(x + 2), Math.round(y - 2), 1, 1);
      } else if (particle.type === 'oxygen') {
        ctx.strokeStyle = 'rgba(126, 212, 223, .64)';
        ctx.lineWidth = 1;
        ctx.strokeRect(Math.round(x), Math.round(y), particle.size + 2, particle.size + 2);
      } else {
        ctx.fillStyle = 'rgba(188, 224, 223, .27)';
        ctx.fillRect(Math.round(x), Math.round(y), particle.size, particle.size);
      }
    });

    if (zoom > .2) drawReactor(time, zoom);
  }

  function drawReactor(time, zoom) {
    const x = lerp(770, 720, zoom);
    const top = lerp(138, 86, zoom);
    const width = lerp(150, 230, zoom);
    const height = lerp(280, 388, zoom);
    ctx.save();
    ctx.globalAlpha = .3 + zoom * .7;
    ctx.fillStyle = 'rgba(116, 229, 173, .11)';
    ctx.fillRect(x - width / 2, top + 22, width, height - 44);
    ctx.fillStyle = 'rgba(196, 240, 124, .08)';
    ctx.fillRect(x - width / 2 + 8, top + height * .45, width - 16, height * .43);
    ctx.strokeStyle = 'rgba(192, 235, 191, .58)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - width * .26, top);
    ctx.lineTo(x + width * .26, top);
    ctx.lineTo(x + width * .41, top + 28);
    ctx.lineTo(x + width * .31, top + height - 29);
    ctx.lineTo(x + width * .1, top + height);
    ctx.lineTo(x - width * .1, top + height);
    ctx.lineTo(x - width * .31, top + height - 29);
    ctx.lineTo(x - width * .41, top + 28);
    ctx.closePath();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(110, 216, 199, .38)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - width * .22, top - 16, width * .44, 17);
    for (let i = 0; i < 8; i += 1) {
      const bx = x - width * .23 + hash(i * 9.1) * width * .46;
      const by = top + height - 40 - ((time * .04 + i * 25) % (height * .57));
      ctx.fillStyle = `rgba(122, 229, 211, ${.34 + hash(i * 2) * .28})`;
      ctx.fillRect(Math.round(bx), Math.round(by), 3 + (i % 2), 3 + (i % 2));
    }
    ctx.restore();

    if (state.labels && zoom > .72) {
      drawPixelText('PHOTOBIOREACTOR', x, top - 30, 'rgba(196, 240, 124, .82)', 9, 'center');
      drawPixelText('pH 7.4', x + width * .65, top + height * .35, 'rgba(234, 245, 221, .68)', 9);
      drawPixelText('DO ↑', x + width * .65, top + height * .43, 'rgba(110, 216, 199, .72)', 9);
      drawPixelText('BIOMASS', x + width * .65, top + height * .51, 'rgba(196, 240, 124, .72)', 9);
    }
  }

  function drawPigmentBand(x, y, size, angle = 0, highlight = false) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = highlight ? 'rgba(206, 248, 112, .95)' : 'rgba(116, 216, 111, .86)';
    ctx.fillRect(-size * .55, -2, size * 1.1, 4);
    ctx.fillStyle = highlight ? 'rgba(235, 255, 170, .72)' : 'rgba(48, 132, 71, .7)';
    ctx.fillRect(-size * .32, -1, 3, 2);
    ctx.fillRect(size * .04, -1, 3, 2);
    ctx.fillRect(size * .34, -1, 3, 2);
    ctx.restore();
  }

  function drawCell(x, y, size, angle, options = {}) {
    const pulse = options.pulse ?? 0;
    const dividing = options.dividing ?? false;
    const alpha = options.alpha ?? 1;
    const stretch = options.stretch ?? 1;
    const variant = options.variant ?? 0;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(stretch, 1);
    if (activeSpecies.label === 'ARTHROSPIRA') {
      const w = size * 2.05 + pulse;
      const h = Math.max(8, size * .66 + pulse * .25);
      const outline = options.highlight ? '#4f9f75' : '#194b54';
      const body = options.highlight ? '#a9e37d' : '#54c89b';
      const filament = options.highlight ? '#e2ee9a' : '#9de0a0';
      ctx.fillStyle = 'rgba(3, 18, 25, .55)';
      ctx.fillRect(-w / 2 - 4, -h / 2 - 4, w + 8, h + 8);
      ctx.fillStyle = outline;
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.fillStyle = body;
      ctx.fillRect(-w / 2 + 3, -h / 2 + 3, w - 6, h - 6);
      ctx.strokeStyle = filament;
      ctx.lineWidth = Math.max(2, Math.round(size * .11));
      ctx.beginPath();
      for (let stepIndex = 0; stepIndex <= 8; stepIndex += 1) {
        const px = -w * .39 + (stepIndex / 8) * w * .78;
        const py = Math.sin(stepIndex * Math.PI * .9) * h * .22;
        if (stepIndex === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.strokeStyle = options.highlight ? 'rgba(255, 249, 184, .8)' : 'rgba(38, 133, 113, .72)';
      ctx.lineWidth = Math.max(1, Math.round(size * .07));
      ctx.beginPath();
      for (let stepIndex = 0; stepIndex <= 8; stepIndex += 1) {
        const px = -w * .39 + (stepIndex / 8) * w * .78;
        const py = Math.sin(stepIndex * Math.PI * .9 + Math.PI) * h * .2;
        if (stepIndex === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.fillStyle = 'rgba(230, 255, 208, .72)';
      ctx.fillRect(-w * .35, -h * .22, 3, 3);
      ctx.fillRect(w * .18, h * .17, 2, 2);
      if (dividing) {
        ctx.fillStyle = 'rgba(255, 238, 153, .98)';
        ctx.fillRect(-Math.max(2, Math.round(size * .07)), -h * .42, Math.max(3, Math.round(size * .14)), h * .84);
      }
      ctx.restore();
      return;
    }
    const w = size * (variant === 1 ? 1.36 : variant === 3 ? 1.08 : 1.12) + pulse;
    const h = size * (variant === 2 ? .76 : 1.02) + pulse * .35;
    const outline = options.highlight ? '#79c989' : '#245c5a';
    const body = options.highlight ? '#b7ed84' : '#6bcf9b';
    const inner = options.highlight ? '#dff3a0' : '#98e2a1';
    const shadow = options.highlight ? '#5c9c70' : '#2d7c70';
    const step = Math.max(3, Math.round(size * .16));
    ctx.fillStyle = 'rgba(3, 18, 25, .55)';
    ctx.fillRect(-w / 2 - step, -h / 2 - step, w + step * 2, h + step * 2);
    ctx.fillStyle = outline;
    ctx.beginPath();
    ctx.moveTo(-w * .28, -h / 2);
    ctx.lineTo(w * .28, -h / 2);
    ctx.lineTo(w / 2, -h * .28);
    ctx.lineTo(w / 2, h * .28);
    ctx.lineTo(w * .28, h / 2);
    ctx.lineTo(-w * .28, h / 2);
    ctx.lineTo(-w / 2, h * .28);
    ctx.lineTo(-w / 2, -h * .28);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(-w * .22, -h * .39);
    ctx.lineTo(w * .22, -h * .39);
    ctx.lineTo(w * .39, -h * .22);
    ctx.lineTo(w * .39, h * .22);
    ctx.lineTo(w * .22, h * .39);
    ctx.lineTo(-w * .22, h * .39);
    ctx.lineTo(-w * .39, h * .22);
    ctx.lineTo(-w * .39, -h * .22);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = inner;
    ctx.fillRect(-w * .22, -h * .27, w * .44, Math.max(2, h * .13));
    ctx.fillStyle = shadow;
    ctx.fillRect(-w * .22, h * .2, w * .44, Math.max(2, h * .13));
    drawPigmentBand(-w * .2, -h * .09, w * .48, -.2, !!options.highlight);
    drawPigmentBand(w * .16, h * .13, w * .42, .2, !!options.highlight);
    ctx.strokeStyle = options.highlight ? 'rgba(247, 236, 139, .95)' : 'rgba(233, 217, 119, .78)';
    ctx.lineWidth = Math.max(2, Math.round(size * .09));
    ctx.beginPath();
    ctx.moveTo(-w * .18, h * .02);
    ctx.lineTo(0, -h * .12);
    ctx.lineTo(w * .18, h * .02);
    ctx.stroke();
    ctx.fillStyle = 'rgba(230, 255, 208, .78)';
    ctx.fillRect(-w * .25, -h * .24, Math.max(2, Math.round(size * .12)), Math.max(2, Math.round(size * .12)));
    if (dividing) {
      ctx.fillStyle = 'rgba(255, 238, 153, .98)';
      ctx.fillRect(-Math.max(2, Math.round(size * .07)), -h * .42, Math.max(3, Math.round(size * .14)), h * .84);
    }
    ctx.restore();
  }

  function drawCells(time, zoom, sceneIndex) {
    const profile = conditionProfile();
    const progress = sceneProgress(sceneIndex);
    const population = populationAt();
    const cultureCount = Math.min(82, Math.max(7, 6 + Math.floor(population / 6)));
    const microscopeCount = Math.min(17, 5 + Math.floor(progress * 7) + (sceneIndex >= 3 ? 4 : 0));
    const count = zoom > .48 ? cultureCount : microscopeCount;
    const cellScale = zoom > .48 ? .55 + zoom * .18 : 1.28;
    const baseX = zoom > .48 ? 720 : 480;
    const baseY = zoom > .48 ? 300 : 300;

    for (let i = 0; i < count; i += 1) {
      const seed = cellSeeds[i];
      const isFocus = i === 0 && sceneIndex <= 3;
      const isDividing = sceneIndex === 3 && isFocus;
      const driftX = Math.sin(time * .00042 * (1 + seed.phase) + seed.phase) * (8 + zoom * 3);
      const driftY = Math.cos(time * .00034 * (1 + seed.phase) + seed.phase) * 11;
      let x = seed.x + driftX;
      let y = seed.y + driftY;
      if (zoom <= .48 && isFocus) {
        x = 480 + driftX * .45;
        y = 274 + driftY * .45;
      }
      if (zoom > .48) {
        x = baseX + (seed.x - 480) * .18 + driftX * .6;
        y = baseY + (seed.y - 270) * .62 + driftY * .65;
      }
      let stretch = 1;
      if (sceneIndex === 2 && isFocus) stretch = 1 + ease(progress) * .34;
      if (sceneIndex === 3 && isFocus) stretch = 1 + Math.sin(progress * Math.PI) * .72;
      if (sceneIndex === 3 && i === 1) x += 26 * ease(progress);
      if (sceneIndex === 3 && i === 2) x -= 26 * ease(progress);
      if (sceneIndex === 5 && profile.stressed) y += Math.sin(i * 2) * 8;
      drawCell(x, y, seed.size * cellScale, seed.angle + Math.sin(time * .0002 + seed.phase) * .12, {
        pulse: sceneIndex === 2 && isFocus ? Math.sin(time * .008) * 2 : 0,
        dividing: isDividing && progress > .35 && progress < .8,
        highlight: isFocus,
        stretch,
        variant: seed.variant,
        alpha: zoom > .48 ? .6 + hash(i * 2.6) * .35 : .96,
      });
    }
  }

  function drawArrow(x1, y1, x2, y2, color, label) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 9 * Math.cos(angle - .45), y2 - 9 * Math.sin(angle - .45));
    ctx.lineTo(x2 - 9 * Math.cos(angle + .45), y2 - 9 * Math.sin(angle + .45));
    ctx.closePath();
    ctx.fill();
    if (label && state.labels) drawPixelText(label, (x1 + x2) / 2, (y1 + y2) / 2 - 9, color, 9, 'center');
  }

  function drawMolecule(x, y, color, label, time, index) {
    const bob = Math.sin(time * .004 + index) * 3;
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x - 5), Math.round(y + bob - 5), 10, 10);
    ctx.fillStyle = 'rgba(255,255,255,.42)';
    ctx.fillRect(Math.round(x - 2), Math.round(y + bob - 3), 3, 3);
    if (state.labels) drawPixelText(label, x, y + bob + 19, color, 9, 'center');
  }

  function drawProcessScene(time, sceneIndex) {
    const progress = sceneProgress(sceneIndex);
    const reveal = ease(clamp(progress * 1.6));
    if (sceneIndex === 1) {
      const y = 272;
      drawMolecule(155, y - 80, colors.amber, 'light', time, 1);
      drawMolecule(155, y + 72, colors.teal, 'CO₂', time, 2);
      drawMolecule(315, y + 72, colors.teal, 'H₂O', time, 3);
      drawArrow(190, y - 78, 385, y - 10, colors.amber, 'energy');
      drawArrow(190, y + 69, 385, y + 8, colors.teal, 'carbon');
      drawArrow(350, y + 69, 405, y + 24, colors.teal, '');
      ctx.strokeStyle = 'rgba(196, 240, 124, .36)';
      ctx.strokeRect(385, y - 54, 190, 110);
      drawPixelText('PHOTOSYNTHETIC CELL', 480, y - 72, colors.lime, 10, 'center');
      drawArrow(575, y - 10, 740, y - 72, colors.lime, 'sugars');
      drawArrow(575, y + 20, 750, y + 78, colors.teal, 'O₂');
      drawMolecule(760, y - 83, colors.lime, 'sugar', time, 4);
      drawMolecule(770, y + 87, colors.teal, 'oxygen', time, 5);
      ctx.globalAlpha = reveal;
      ctx.fillStyle = 'rgba(196, 240, 124, .12)';
      ctx.fillRect(398, y - 45, 164, 92);
      ctx.globalAlpha = 1;
    }
    if (sceneIndex === 2) {
      const x = 555;
      const y = 274;
      drawArrow(145, y - 88, 380, y - 50, colors.lime, 'stored carbon');
      drawArrow(150, y + 92, 380, y + 56, colors.amber, 'mineral ions');
      ctx.strokeStyle = 'rgba(196, 240, 124, .4)';
      ctx.setLineDash([3, 5]);
      ctx.beginPath(); ctx.moveTo(405, y - 45); ctx.lineTo(495, y - 22); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(405, y + 48); ctx.lineTo(495, y + 30); ctx.stroke();
      ctx.setLineDash([]);
      drawPixelText('BUILD', 446, y - 8, colors.lime, 10, 'center');
      drawPixelText('new cell material', x, y + 106, colors.soft, 10, 'center');
      ctx.strokeStyle = 'rgba(196, 240, 124, .2)';
      ctx.strokeRect(x - 74, y - 82, 148, 164);
      ctx.globalAlpha = reveal;
      ctx.fillStyle = 'rgba(196, 240, 124, .11)';
      ctx.fillRect(x - 66, y - 72, 132, 144);
      ctx.globalAlpha = 1;
      drawPixelText('growth ≠ division', 555, 430, colors.amber, 10, 'center');
    }
  }

  function drawStressOverlay(profile) {
    if (!profile.stressed && !profile.limiting) return;
    const alpha = profile.stressed ? .19 : .08;
    const color = profile.stressed ? 'rgba(239, 142, 128, ' : 'rgba(233, 185, 110, ';
    const gradient = ctx.createRadialGradient(W * .5, H * .45, 100, W * .5, H * .45, 520);
    gradient.addColorStop(0, `${color}0)`);
    gradient.addColorStop(1, `${color}${alpha})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);
    if (state.labels) {
      drawPixelText(profile.stressed ? 'STRESS RESPONSE / GROWTH INHIBITED' : 'LIMITING CONDITION / SLOWER NET GROWTH', W / 2, 34, profile.stressed ? colors.red : colors.amber, 10, 'center');
    }
  }

  function drawScene(time) {
    const current = sceneAt(state.elapsed);
    state.scene = current;
    state.zoom += (state.targetZoom - state.zoom) * .08;
    const profile = conditionProfile();
    const sceneFade = ease(clamp(sceneProgress(current) * 2.2));
    const zoom = state.zoom;
    ctx.clearRect(0, 0, W, H);
    drawBackground(time, zoom);
    drawCells(time, zoom, current);
    if (current === 1 || current === 2) drawProcessScene(time, current);

    if (current === 3) {
      const p = sceneProgress(current);
      const x = 310 + p * 230;
      drawArrow(105, 116, x - 68, 116, colors.amber, 'nutrients');
      drawArrow(95, 425, x - 70, 385, colors.teal, 'energy');
      if (state.labels) {
        drawPixelText(p < .45 ? 'PARENT CELL' : 'DAUGHTER CELLS', x, 84, colors.lime, 10, 'center');
        drawPixelText('species-specific timing', 480, 470, colors.soft, 10, 'center');
      }
    }
    if (current === 4) {
      if (state.labels) {
        drawPixelText('EARLY CULTURE', 126, 103, colors.soft, 9, 'center');
        drawPixelText('DENSER CULTURE', 745, 103, colors.lime, 9, 'center');
      }
      ctx.fillStyle = `rgba(196, 240, 124, ${.08 + sceneFade * .1})`;
      ctx.fillRect(600, 0, 320, H);
    }
    if (current === 5) {
      const p = sceneProgress(current);
      ctx.fillStyle = `rgba(233, 185, 110, ${.03 + p * .05})`;
      ctx.fillRect(0, 0, W, H);
      if (state.labels) drawPixelText('MOVE THE INPUTS TO TEST THE WINDOW', W / 2, H - 28, colors.amber, 10, 'center');
    }
    if (current === 6) {
      if (state.labels) {
        drawPixelText('CELLULAR EVENTS → PROCESS SIGNALS', 124, 103, colors.soft, 9, 'center');
        drawPixelText('CULTURE-SCALE READOUT', 740, 103, colors.lime, 9, 'center');
      }
      ctx.strokeStyle = 'rgba(196, 240, 124, .28)';
      ctx.setLineDash([5, 8]);
      ctx.beginPath(); ctx.moveTo(535, 250); ctx.lineTo(655, 250); ctx.stroke();
      ctx.setLineDash([]);
      drawArrow(545, 250, 650, 250, colors.lime, 'measure');
    }
    drawStressOverlay(profile);
    ctx.globalAlpha = sceneFade;
    if (state.labels && current !== 1 && current !== 2) {
      const label = current === 0 ? 'INOCULUM' : current === 3 ? 'REPRODUCTION' : current === 4 ? 'DENSITY' : current === 5 ? 'ENVIRONMENT' : 'SYSTEM';
      drawPixelText(label, 42, H - 28, 'rgba(234, 245, 221, .68)', 10);
    }
    ctx.globalAlpha = 1;
  }

  function drawGraph() {
    const width = graph.width;
    const height = graph.height;
    graphCtx.clearRect(0, 0, width, height);
    graphCtx.fillStyle = '#091b14';
    graphCtx.fillRect(0, 0, width, height);
    graphCtx.strokeStyle = 'rgba(176, 227, 144, .12)';
    graphCtx.lineWidth = 1;
    for (let y = 20; y < height; y += 32) { graphCtx.beginPath(); graphCtx.moveTo(0, y + .5); graphCtx.lineTo(width, y + .5); graphCtx.stroke(); }
    for (let x = 0; x < width; x += 46) { graphCtx.beginPath(); graphCtx.moveTo(x + .5, 0); graphCtx.lineTo(x + .5, height); graphCtx.stroke(); }

    graphCtx.beginPath();
    for (let i = 0; i <= 60; i += 1) {
      const t = i / 60 * TOTAL;
      const population = populationAt(t);
      const x = i / 60 * width;
      const y = height - 15 - (population / 480) * (height - 31);
      if (i === 0) graphCtx.moveTo(x, y); else graphCtx.lineTo(x, y);
    }
    graphCtx.strokeStyle = 'rgba(196, 240, 124, .24)';
    graphCtx.lineWidth = 5;
    graphCtx.stroke();
    graphCtx.strokeStyle = colors.lime;
    graphCtx.lineWidth = 2;
    graphCtx.stroke();

    const markerX = clamp(state.elapsed / TOTAL) * width;
    const markerY = height - 15 - (populationAt() / 480) * (height - 31);
    graphCtx.fillStyle = colors.lime;
    graphCtx.fillRect(Math.round(markerX - 3), Math.round(markerY - 3), 7, 7);
    graphCtx.fillStyle = colors.soft;
    graphCtx.font = '9px "IBM Plex Mono", monospace';
    graphCtx.fillText('cells', 9, 13);
    graphCtx.fillStyle = colors.faint;
    graphCtx.fillText('time →', width - 48, height - 5);
  }

  function updateConditionUi(profile) {
    setText('lightValue', `${state.light}`);
    setText('tempValue', `${state.temp}°`);
    setText('nutrientValue', `${state.nutrients}`);
    setText('co2Value', `${state.co2}`);
    const lightRead = state.light < 20 ? 'too dim · limiting' : state.light > 88 ? 'very bright · stress risk' : state.light < 48 ? 'low · slower capture' : 'balanced';
    const tempRead = state.temp < 14 ? 'cool · slower metabolism' : state.temp > 33 ? 'warm · stress risk' : state.temp < 21 || state.temp > 27 ? 'usable · not optimum' : 'near optimum';
    const nutrientRead = state.nutrients < 20 ? 'low · limiting' : state.nutrients > 90 ? 'high · imbalance risk' : state.nutrients < 55 ? 'available · limited' : 'available';
    const co2Read = state.co2 < 18 ? 'low · carbon limiting' : state.co2 < 50 ? 'available · limited' : 'available';
    setText('lightReadout', `${state.light}% · ${lightRead}`);
    setText('tempReadout', `${state.temp}°C · ${tempRead}`);
    setText('nutrientReadout', `${state.nutrients}% · ${nutrientRead}`);
    setText('co2Readout', `${state.co2}% · ${co2Read}`);
    const condition = document.getElementById('conditionState');
    if (condition) {
      condition.classList.toggle('is-stressed', profile.stressed);
      condition.querySelector('span:last-child').textContent = profile.stressed ? 'Stress conditions are inhibiting net growth.' : profile.limiting ? 'Growth is continuing, but one or more inputs are limiting.' : 'Balanced conditions support steady growth.';
    }
  }

  function updateUi(force = false) {
    const now = performance.now();
    if (!force && now - state.lastUi < 80) return;
    state.lastUi = now;
    const current = sceneAt(state.elapsed);
    const scene = scenes[current];
    state.scene = current;
    if (voiceState.enabled && current !== voiceState.lastScene) speakScene(current);
    setText('sceneTitle', scene.title);
    setText('stageCaption', scene.caption);
    setText('stageClock', formatClock(state.elapsed));
    setText('stageScene', `SCENE ${String(current + 1).padStart(2, '0')} / 07`);
    setText('timelineCurrent', `SCENE ${String(current + 1).padStart(2, '0')} / ${scene.short}`);
    setText('timelineTime', `${formatClock(state.elapsed)} / ${formatClock(TOTAL)}`);
    setText('metricTime', `T + ${formatClock(state.elapsed)}`);
    setText('storyIndex', `SCENE ${String(current + 1).padStart(2, '0')}`);
    setText('storyTitle', state.detail === 'advanced' ? scene.advancedTitle : scene.beginnerTitle);
    setText('storyBody', state.detail === 'advanced' ? scene.advanced : scene.beginner);
    setText('storyFootnote', scene.footnote);
    setText('populationValue', populationAt().toLocaleString());
    const profile = conditionProfile();
    setText('growthRateValue', `${(profile.factor * 1.15).toFixed(1)}×`);
    setText('biomassValue', populationAt() > 300 ? 'DENSE' : populationAt() > 70 ? 'RISING' : 'LOW');
    setText('phValue', profile.stressed ? 'SHIFTING' : populationAt() > 240 ? 'DRIFTING' : 'STABLE');
    setText('oxygenValue', profile.stressed ? 'LOWER' : populationAt() > 90 ? 'RISING' : 'BUILDING');
    setText('runStatus', state.reducedMotion ? 'STATIC FRAME · REDUCED MOTION' : state.playing ? 'RUNNING · ILLUSTRATIVE' : 'PAUSED · ILLUSTRATIVE');
    setText('stageMode', state.zoom > .48 ? 'CULTURE / PROCESS VIEW' : 'MICROSCOPE / 1200×');
    setText('stageSpecies', `${activeSpecies.label} · REFERENCE`);
    document.querySelector('.console-status')?.classList.toggle('is-paused', !state.playing || state.reducedMotion);
    const timeline = document.getElementById('timeline');
    if (timeline && document.activeElement !== timeline) timeline.value = String(state.elapsed);
    const playToggle = document.getElementById('playToggle');
    if (playToggle) {
      playToggle.setAttribute('aria-label', state.playing ? 'Pause animation' : 'Play animation');
      playToggle.setAttribute('aria-pressed', String(state.playing));
    }
    setText('playIcon', state.playing ? 'Ⅱ' : '▶');
    qsa('.scene-tab').forEach((tab, index) => {
      const active = index === current;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    const description = document.getElementById('canvasDescription');
    if (description) description.textContent = scene.description;
    document.documentElement.dataset.scene = String(current + 1);
    canvas.dataset.scene = String(current + 1);
    canvas.dataset.renderer = 'canvas';
    canvas.dataset.population = String(populationAt());
    updateConditionUi(profile);
    drawGraph();
  }

  function jumpToScene(index) {
    const safeIndex = clamp(Number(index), 0, scenes.length - 1);
    state.elapsed = sceneStarts[safeIndex];
    state.scene = safeIndex;
    state.targetZoom = safeIndex >= 4 ? 1 : 0;
    updateUi(true);
  }

  function bindRange(id, key) {
    const input = document.getElementById(id);
    if (!input) return;
    input.value = String(state[key]);
    input.addEventListener('input', () => {
      state[key] = Number(input.value);
      updateUi(true);
    });
  }

  document.getElementById('playToggle')?.addEventListener('click', () => {
    state.playing = !state.playing;
    updateUi(true);
  });
  document.getElementById('restartButton')?.addEventListener('click', () => {
    state.elapsed = 0;
    state.playing = true;
    state.targetZoom = 0;
    updateUi(true);
  });
  document.getElementById('speedSelect')?.addEventListener('change', (event) => {
    state.speed = Number(event.target.value);
    updateUi(true);
  });
  document.getElementById('voiceToggle')?.addEventListener('click', () => {
    if (!voiceState.supported) {
      setText('voiceLabel', 'Unavailable');
      setText('voiceStatus', 'This browser does not expose speech synthesis.');
      return;
    }
    voiceState.enabled = !voiceState.enabled;
    state.voiceover = voiceState.enabled;
    const button = document.getElementById('voiceToggle');
    button?.classList.toggle('is-active', voiceState.enabled);
    button?.setAttribute('aria-pressed', String(voiceState.enabled));
    if (voiceState.enabled) {
      setText('voiceStatus', 'Voiceover enabled.');
      speakScene(state.scene, true);
    } else {
      stopVoiceover();
      setText('voiceStatus', 'Voiceover off.');
    }
  });
  document.getElementById('timeline')?.addEventListener('input', (event) => {
    state.elapsed = Number(event.target.value);
    state.targetZoom = sceneAt(state.elapsed) >= 4 ? 1 : 0;
    updateUi(true);
  });
  qsa('.scene-tab').forEach((tab) => tab.addEventListener('click', () => jumpToScene(tab.dataset.scene)));
  document.getElementById('microscopeButton')?.addEventListener('click', () => {
    state.targetZoom = 0;
    qs('#microscopeButton')?.classList.add('is-active');
    qs('#cultureButton')?.classList.remove('is-active');
    qs('#microscopeButton')?.setAttribute('aria-pressed', 'true');
    qs('#cultureButton')?.setAttribute('aria-pressed', 'false');
  });
  document.getElementById('cultureButton')?.addEventListener('click', () => {
    state.targetZoom = 1;
    qs('#cultureButton')?.classList.add('is-active');
    qs('#microscopeButton')?.classList.remove('is-active');
    qs('#cultureButton')?.setAttribute('aria-pressed', 'true');
    qs('#microscopeButton')?.setAttribute('aria-pressed', 'false');
  });
  document.getElementById('labelsToggle')?.addEventListener('click', (event) => {
    state.labels = !state.labels;
    event.currentTarget.classList.toggle('is-active', state.labels);
    event.currentTarget.setAttribute('aria-pressed', String(state.labels));
  });
  document.getElementById('beginnerButton')?.addEventListener('click', (event) => {
    state.detail = 'beginner';
    event.currentTarget.classList.add('is-active');
    event.currentTarget.setAttribute('aria-pressed', 'true');
    document.getElementById('advancedButton')?.classList.remove('is-active');
    document.getElementById('advancedButton')?.setAttribute('aria-pressed', 'false');
    updateUi(true);
  });
  document.getElementById('advancedButton')?.addEventListener('click', (event) => {
    state.detail = 'advanced';
    event.currentTarget.classList.add('is-active');
    event.currentTarget.setAttribute('aria-pressed', 'true');
    document.getElementById('beginnerButton')?.classList.remove('is-active');
    document.getElementById('beginnerButton')?.setAttribute('aria-pressed', 'false');
    updateUi(true);
  });
  document.getElementById('motionInput')?.addEventListener('change', (event) => {
    state.reducedMotion = event.target.checked;
    if (state.reducedMotion) state.playing = false;
    updateUi(true);
  });
  bindRange('lightInput', 'light');
  bindRange('tempInput', 'temp');
  bindRange('nutrientInput', 'nutrients');
  bindRange('co2Input', 'co2');

  const motionInput = document.getElementById('motionInput');
  if (motionInput) motionInput.checked = state.reducedMotion;

  function frame(now) {
    const delta = Math.min(80, now - state.lastFrame);
    state.lastFrame = now;
    if (state.playing && !state.reducedMotion) {
      state.elapsed += delta / 1000 * state.speed;
      if (state.elapsed >= TOTAL) {
        state.elapsed = 0;
        state.targetZoom = 0;
      }
    }
    drawScene(now);
    updateUi();
    requestAnimationFrame(frame);
  }

  updateUi(true);
  window.__algaeGrowth = { state, scenes, speciesProfiles, voiceState, jumpToScene, conditionProfile, populationAt, voiceText };
  requestAnimationFrame(frame);
})();
