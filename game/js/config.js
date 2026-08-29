export const CFG = {
  world: { w: 2200, h: 2200 },
  tick: 1 / 60,
  cell: {
    r: 26,
    points: 16,
    accel: 1050,
    damp: 0.985,
    wallFriction: 0.35,
  },
  eat: { magnet: 115, pull: 430, radius: 30 },
  motes: { count: 130, value: 3, bigValue: 14, bigChance: 0.06, respawnDelay: 2.2 },
  divide: { baseNeed: 42, growth: 1.14, popCap: 34, npcRate: 0.028 },
  bacteria: { count: 9, speed: 92, sense: 240, drain: 12, iframes: 1.4 },
  stages: [
    { name: "Plankton Cell", need: 0, mult: 1 },
    { name: "Dividing Cell", need: 70, mult: 1.2 },
    { name: "Micro-Colony", need: 220, mult: 1.45 },
    { name: "Filament Coil", need: 600, mult: 1.8 },
    { name: "Living Mat", need: 1500, mult: 2.3 },
    { name: "Bloom Empire", need: 3600, mult: 3 },
  ],
  cellUps: {
    fins:     { name: "Flagellar Fins",   desc: "+18% swim speed per level",      costs: [25, 60, 140, 320],        fx: [1.18, 1.39, 1.64, 1.94] },
    magnet:   { name: "Cytoplasm Pull",  desc: "+30% energy reach per level",    costs: [20, 55, 130, 300],        fx: [1.3, 1.69, 2.2, 2.86] },
    photo:    { name: "Photosystems II", desc: "+25% energy per mote per level", costs: [30, 75, 170, 380],        fx: [1.25, 1.56, 1.95, 2.44] },
    mitosis:  { name: "Mitosis Catalyst",desc: "-12% division cost per level",   costs: [35, 85, 190, 420],        fx: [0.88, 0.77, 0.68, 0.6] },
    membrane: { name: "Tough Membrane",  desc: "-25% bacteria drain per level",  costs: [25, 70, 160, 360],        fx: [0.75, 0.56, 0.42, 0.32] },
  },
  reactors: [
    { name: "Test Tube",    rate: 0.6,  cost: 0 },
    { name: "Glass Column", rate: 3,    cost: 120 },
    { name: "Flat Panel",   rate: 12,   cost: 650 },
    { name: "Spiral Coil",  rate: 52,   cost: 3800 },
    { name: "Solar Row",    rate: 230,  cost: 21000 },
    { name: "Deep Tank",    rate: 1000, cost: 110000 },
  ],
  reactorMaxLvl: 10,
  lvlCost: (base, lvl) => Math.round(base * 0.55 * Math.pow(1.95, lvl - 1)),
  boosts: {
    leds:    { name: "LED Arrays",     desc: "+50% all reactor income / level", costs: [150, 700, 3200],  fx: [1.5, 2.25, 3.4] },
    co2:     { name: "CO₂ Dosing",     desc: "+40% energy everywhere / level",  costs: [200, 900],        fx: [1.4, 1.96] },
    harvest: { name: "Auto-Harvester", desc: "+2h offline earning cap / level", costs: [500, 2500],       fx: [2, 4] },
  },
  offlineEfficiency: 0.5,
};

export const PALETTE = {
  tube:  "#7ad0a0",
  glass: "#a8e6c8",
  led:   ["#ffe08a", "#a3ffcf", "#8ad4ff", "#d4a3ff", "#ffb38a", "#ff8ab5"],
};
