/*
 * Cyanoflow is a deterministic, local-first game model. Organisms, rates,
 * traits, rarity, and discoveries below are synthetic game content, not
 * cultivation instructions or validated biology.
 *
 * A device's chambers are sample lanes: a one-chamber screening device gives
 * one independent sample per expedition, while a four-chamber archive device
 * gives four. Reactor production is always biomass/second; harvesting converts
 * stored biomass to credits at BIOMASS_TO_CREDITS.
 */

export const SAVE_KEY = "orr-cyanoflow-v1";
export const LEGACY_SAVE_KEYS = ["orr-biorealm-v1", "orr-microflux-rack-v2", "orr-microflux-rack-v1"];
export const SAVE_VERSION = 3;
export const MAX_OFFLINE_SECONDS = 8 * 60 * 60;
export const MAX_FUTURE_SKEW_MS = 60 * 1000;
export const BIOMASS_TO_CREDITS = 3;
export const RESEARCH_GRANT = 100;

export const REACTOR_ENVIRONMENTS = [
  { id: "balanced", name: "Balanced", description: "A neutral room for dependable generalists.", affinity: [], bonus: 1, mismatch: 1 },
  { id: "warm", name: "Warm", description: "Warm-spectrum conditions favor heatproof and grainbound strains.", affinity: ["heatproof", "grainbound", "amber", "surge"], bonus: 1.16, mismatch: 0.94 },
  { id: "marine", name: "Marine", description: "Salt-light conditions favor tidebound and marine strains.", affinity: ["marine", "tidebound", "dense", "valuable"], bonus: 1.16, mismatch: 0.94 },
  { id: "shade", name: "Shade", description: "Filtered light favors rooted, patient forest strains.", affinity: ["shade", "rooted", "patient"], bonus: 1.16, mismatch: 0.94 },
  { id: "wetland", name: "Wetland", description: "Mist and reed conditions favor adaptive wetland strains.", affinity: ["mist", "adaptive", "contract"], bonus: 1.16, mismatch: 0.94 },
  { id: "extreme", name: "Extreme", description: "A demanding room favors heatproof and volatile strains.", affinity: ["heatproof", "volatile", "surge", "unusual"], bonus: 1.18, mismatch: 0.92 },
  { id: "rare", name: "Rare", description: "A tuned archive room favors luminous and unusual records.", affinity: ["rare", "luminous", "mythic", "unusual"], bonus: 1.18, mismatch: 0.92 },
];

export const RARITIES = [
  { id: "common", label: "Common", stars: 1, color: "#a7c3b0", weight: 64 },
  { id: "uncommon", label: "Uncommon", stars: 2, color: "#72c4b5", weight: 23 },
  { id: "rare", label: "Rare", stars: 3, color: "#7fa9df", weight: 9 },
  { id: "epic", label: "Epic", stars: 4, color: "#ba91d5", weight: 3.2 },
  { id: "legendary", label: "Legendary", stars: 5, color: "#ebbd69", weight: 0.8 },
];

const pool = (...entries) => entries.map(([speciesId, weight]) => ({ speciesId, weight }));

export const BIOMES = [
  {
    id: "freshwater", name: "Freshwater", subtitle: "Ponds & streams", icon: "◌", color: "#68b7ae",
    description: "Cool, clear water with a dependable first survey.", unlockCost: 0, requiredResearch: 0,
    requiredMilestones: [], expeditionCost: 8, duration: 32, rarityBias: 0,
    species: ["arthrospira", "chlorella", "desmodesmus", "nannochloropsis"],
    pool: pool(["arthrospira", 58], ["chlorella", 27], ["desmodesmus", 11], ["nannochloropsis", 4]),
    environment: { water: "fresh", substrate: "clear water", light: "balanced", salinity: "low" },
    palette: ["#0c3340", "#185b5d", "#7bc9b0"], event: "ripples", preference: "balanced",
  },
  {
    id: "lakes", name: "Lake Shelf", subtitle: "Open lake water", icon: "◉", color: "#629fc1",
    description: "A broad lake shelf where patient drifters and silver colonies overlap.", unlockCost: 190, requiredResearch: 1,
    requiredMilestones: ["first-survey"], expeditionCost: 12, duration: 38, rarityBias: 0.12,
    species: ["chlorella", "desmodesmus", "lake-glint", "silver-drift"],
    pool: pool(["chlorella", 42], ["desmodesmus", 27], ["lake-glint", 22], ["silver-drift", 9]),
    environment: { water: "fresh", substrate: "mineral shelf", light: "open", salinity: "low" },
    palette: ["#102f46", "#28627b", "#a2d7d0"], event: "lake-glass", preference: "open water",
  },
  {
    id: "moist-sand", name: "Moist Sand", subtitle: "Tidal grain", icon: "⌁", color: "#d4a768",
    description: "Warm grains hold slow-moving communities and the occasional amber signal.", unlockCost: 260, requiredResearch: 2,
    requiredMilestones: ["first-survey"], expeditionCost: 18, duration: 42, rarityBias: 0.2,
    species: ["tetraselmis", "pavlova", "chlorella", "sandglass"],
    pool: pool(["chlorella", 25], ["sandglass", 31], ["tetraselmis", 25], ["pavlova", 19]),
    environment: { water: "brackish", substrate: "warm grain", light: "warm", salinity: "medium" },
    palette: ["#59412d", "#ae7950", "#e2c17e"], event: "sunshower", preference: "warm",
  },
  {
    id: "coastal", name: "Saltwater Coast", subtitle: "Tide pools", icon: "≈", color: "#68a6d4",
    description: "Mineral-rich tide pools reward patient searches with marine specialists.", unlockCost: 780, requiredResearch: 3,
    requiredMilestones: ["first-survey"], expeditionCost: 32, duration: 52, rarityBias: 0.7,
    species: ["nannochloropsis", "tetraselmis", "isochrysis", "blue-hour"],
    pool: pool(["nannochloropsis", 35], ["tetraselmis", 30], ["isochrysis", 17], ["blue-hour", 3], ["coast-cinder", 15]),
    environment: { water: "salt", substrate: "tide rock", light: "bright", salinity: "high" },
    palette: ["#0e2c44", "#1f6380", "#9bd3dc"], event: "moon-tide", preference: "marine",
  },
  {
    id: "soil", name: "Garden Soil", subtitle: "Damp topsoil", icon: "⌂", color: "#9b795b",
    description: "Soft soil pockets carry grounded colonies with reliable, modest growth.", unlockCost: 1_100, requiredResearch: 3,
    requiredMilestones: ["archive-entry"], expeditionCost: 42, duration: 58, rarityBias: 0.72,
    species: ["soil-lace", "rootglass", "moss-lantern", "chlorella"],
    pool: pool(["soil-lace", 39], ["chlorella", 25], ["moss-lantern", 25], ["rootglass", 11]),
    environment: { water: "moist", substrate: "topsoil", light: "filtered", salinity: "low" },
    palette: ["#30241f", "#6b4d3b", "#b89a6c"], event: "soil-breath", preference: "grounded",
  },
  {
    id: "forest-soil", name: "Forest Soil", subtitle: "Root & moss", icon: "✣", color: "#83a16e",
    description: "Filtered light, damp roots and leaf litter hide resilient green colonies.", unlockCost: 1_650, requiredResearch: 4,
    requiredMilestones: ["archive-entry"], expeditionCost: 50, duration: 64, rarityBias: 1.0,
    species: ["chlorella", "desmodesmus", "moss-lantern", "rootglass"],
    pool: pool(["chlorella", 22], ["desmodesmus", 24], ["moss-lantern", 32], ["rootglass", 22]),
    environment: { water: "moist", substrate: "root mat", light: "shade", salinity: "low" },
    palette: ["#1b2e29", "#3d6046", "#a8bb78"], event: "forest-breath", preference: "shade",
  },
  {
    id: "wetlands", name: "Wetlands", subtitle: "Mist & reed", icon: "≋", color: "#709d98",
    description: "Reflective shallows shift with mist; unusual traits surface after careful analysis.", unlockCost: 3_400, requiredResearch: 5,
    requiredMilestones: ["rare-record"], expeditionCost: 78, duration: 76, rarityBias: 1.35,
    species: ["pavlova", "isochrysis", "marsh-orbit", "reedlight"],
    pool: pool(["pavlova", 27], ["marsh-orbit", 35], ["isochrysis", 21], ["reedlight", 2], ["fen-comet", 15]),
    environment: { water: "fresh", substrate: "reed silt", light: "mist", salinity: "low" },
    palette: ["#152d30", "#386b62", "#a5d0b1"], event: "morning-mist", preference: "wetland",
  },
  {
    id: "thermal", name: "Thermal Springs", subtitle: "Extreme field", icon: "△", color: "#d78067",
    description: "A late-game expedition into warm mineral water with rare but never guaranteed signals.", unlockCost: 8_200, requiredResearch: 7,
    requiredMilestones: ["rare-record"], expeditionCost: 120, duration: 90, rarityBias: 2.1,
    species: ["thermal-ribbon", "ember-spiral", "redshift", "heat-moss"],
    pool: pool(["thermal-ribbon", 35], ["heat-moss", 30], ["ember-spiral", 4], ["redshift", 2], ["thermal-pebble", 29]),
    environment: { water: "mineral", substrate: "hot stone", light: "haze", salinity: "medium" },
    palette: ["#351d28", "#8d3f46", "#e0a06b"], event: "heat-haze", preference: "extreme",
  },
  {
    id: "night-tide", name: "Night Tide", subtitle: "Unusual water", icon: "☾", color: "#9c8dd0",
    description: "A moonlit survey window with a small pool of luminous, high-value possibilities.", unlockCost: 18_000, requiredResearch: 9,
    requiredMilestones: ["variant-analysis"], expeditionCost: 220, duration: 118, rarityBias: 3.2,
    species: ["blue-hour", "night-pear", "lumen-arc", "night-common"],
    pool: pool(["night-common", 43], ["blue-hour", 24], ["night-pear", 3], ["lumen-arc", 1], ["redshift", 4], ["moon-thread", 25]),
    environment: { water: "salt", substrate: "moonlit rock", light: "low", salinity: "high" },
    palette: ["#171a3a", "#353372", "#b8b2ea"], event: "aurora-water", preference: "rare",
  },
];

export const SPECIES = [
  { id: "arthrospira", name: "Arthrospira (Spirulina)", short: "Arthrospira", scientific: true, rarity: "common", color: "#66c78f", baseRate: 0.34, growth: 1.18, biomes: ["freshwater"], reactors: ["all"], traits: ["steady", "bright"], lore: "A real cyanobacterial genus presented here as a fictional collection asset." },
  { id: "chlorella", name: "Chlorella", short: "Chlorella", scientific: true, rarity: "common", color: "#86bd79", baseRate: 0.42, growth: 1.08, biomes: ["freshwater", "lakes", "moist-sand", "soil", "forest-soil"], reactors: ["flask", "bench", "panel", "all"], traits: ["compact", "reliable"], lore: "A real green microalga; all game economics are invented." },
  { id: "desmodesmus", name: "Desmodesmus", short: "Desmodesmus", scientific: true, rarity: "uncommon", color: "#b0c66d", baseRate: 0.61, growth: 0.92, biomes: ["freshwater", "lakes", "forest-soil"], reactors: ["flask", "bench", "panel", "all"], traits: ["colony", "patient"], lore: "A real freshwater genus with fictional game traits." },
  { id: "nannochloropsis", name: "Nannochloropsis", short: "Nannochloropsis", scientific: true, rarity: "uncommon", color: "#62b6b8", baseRate: 0.72, growth: 0.88, biomes: ["freshwater", "coastal"], reactors: ["flask", "bench", "panel", "automated", "all"], traits: ["marine", "dense"], lore: "A real marine microalga; the yield model is synthetic." },
  { id: "tetraselmis", name: "Tetraselmis", short: "Tetraselmis", scientific: true, rarity: "rare", color: "#5ab9a2", baseRate: 1.02, growth: 0.82, biomes: ["moist-sand", "coastal"], reactors: ["panel", "automated", "all"], traits: ["tidebound", "quick"], lore: "A real genus commonly associated with marine research; traits here are game mechanics." },
  { id: "pavlova", name: "Pavlova", short: "Pavlova", scientific: true, rarity: "rare", color: "#d0a66c", baseRate: 1.2, growth: 0.76, biomes: ["moist-sand", "wetlands"], reactors: ["panel", "automated", "all"], traits: ["amber", "contract"], lore: "A real microalgal genus represented as a fictional collectible." },
  { id: "isochrysis", name: "Isochrysis", short: "Isochrysis", scientific: true, rarity: "epic", color: "#d9b968", baseRate: 1.58, growth: 0.69, biomes: ["coastal", "wetlands"], reactors: ["automated", "industrial", "all"], traits: ["marine", "valuable"], lore: "A real genus; its rarity and rate are game balancing only." },
  { id: "sandglass", name: "Sandglass Veil", short: "Sandglass", scientific: false, rarity: "uncommon", color: "#e0b774", baseRate: 0.88, growth: 1.14, biomes: ["moist-sand"], reactors: ["bench", "panel", "all"], traits: ["grainbound", "fast"], lore: "A fictional strain adapted to warm mineral grains." },
  { id: "blue-hour", name: "Blue Hour Drift", short: "Blue Hour", scientific: false, rarity: "epic", color: "#85a8e2", baseRate: 2.05, growth: 0.58, biomes: ["coastal", "night-tide"], reactors: ["automated", "industrial", "all"], traits: ["luminous", "rare"], lore: "A fictional luminous variant found in synthetic night surveys." },
  { id: "moss-lantern", name: "Moss Lantern", short: "Moss Lantern", scientific: false, rarity: "rare", color: "#a5c379", baseRate: 1.34, growth: 0.74, biomes: ["soil", "forest-soil"], reactors: ["panel", "automated", "all"], traits: ["shade", "steady"], lore: "A fictional forest-floor colony with a calm growth rhythm." },
  { id: "rootglass", name: "Rootglass Thread", short: "Rootglass", scientific: false, rarity: "epic", color: "#9cb6a1", baseRate: 1.84, growth: 0.63, biomes: ["soil", "forest-soil"], reactors: ["automated", "industrial", "all"], traits: ["rooted", "efficient"], lore: "A fictional strain whose glassy filaments favor filtered light." },
  { id: "marsh-orbit", name: "Marsh Orbit", short: "Marsh Orbit", scientific: false, rarity: "rare", color: "#89c7b4", baseRate: 1.48, growth: 0.72, biomes: ["wetlands"], reactors: ["panel", "automated", "all"], traits: ["mist", "adaptive"], lore: "A fictional wetland strain with an unusual batch rhythm." },
  { id: "reedlight", name: "Reedlight Bloom", short: "Reedlight", scientific: false, rarity: "legendary", color: "#d6e79d", baseRate: 3.35, growth: 0.68, biomes: ["wetlands"], reactors: ["industrial", "all"], traits: ["luminous", "contract"], lore: "A fictional five-star discovery; its visual light is purely atmospheric." },
  { id: "thermal-ribbon", name: "Thermal Ribbon", short: "Thermal Ribbon", scientific: false, rarity: "epic", color: "#e58b70", baseRate: 2.32, growth: 0.52, biomes: ["thermal"], reactors: ["automated", "industrial", "all"], traits: ["heatproof", "surge"], lore: "A fictional extreme-environment lineage." },
  { id: "ember-spiral", name: "Ember Spiral", short: "Ember Spiral", scientific: false, rarity: "legendary", color: "#efbd6b", baseRate: 4.08, growth: 0.64, biomes: ["thermal"], reactors: ["industrial", "all"], traits: ["heatproof", "volatile"], lore: "A fictional legendary culture with high upside and slow growth." },
  { id: "redshift", name: "Redshift Motile", short: "Redshift", scientific: false, rarity: "legendary", color: "#e67e8c", baseRate: 4.6, growth: 0.58, biomes: ["thermal", "night-tide"], reactors: ["industrial", "all"], traits: ["unusual", "rare"], lore: "A fictional variant reserved for the late research tree." },
  { id: "night-pear", name: "Night Pearl", short: "Night Pearl", scientific: false, rarity: "legendary", color: "#c7a8e9", baseRate: 5.1, growth: 0.56, biomes: ["night-tide"], reactors: ["industrial", "all"], traits: ["luminous", "patient"], lore: "A fictional moonlit discovery intended as a long-term collection goal." },
  { id: "lumen-arc", name: "Lumen Arc", short: "Lumen Arc", scientific: false, rarity: "legendary", color: "#d5d0ff", baseRate: 6.4, growth: 0.52, biomes: ["night-tide"], reactors: ["industrial", "all"], traits: ["luminous", "mythic"], lore: "A fictional apex variant; discovering one changes the laboratory's cadence." },
  { id: "lake-glint", name: "Lake Glint", short: "Lake Glint", scientific: false, rarity: "uncommon", color: "#7ac4cc", baseRate: 0.74, growth: 1.02, biomes: ["lakes"], reactors: ["bench", "panel", "all"], traits: ["reflective", "steady"], lore: "A fictional lake-shelf colony with a dependable reflective pulse." },
  { id: "silver-drift", name: "Silver Drift", short: "Silver Drift", scientific: false, rarity: "rare", color: "#b8d5dc", baseRate: 1.06, growth: 0.83, biomes: ["lakes"], reactors: ["panel", "automated", "all"], traits: ["reflective", "quick"], lore: "A fictional open-water drifter; its value is a game statistic." },
  { id: "soil-lace", name: "Soil Lace", short: "Soil Lace", scientific: false, rarity: "common", color: "#b2a16b", baseRate: 0.58, growth: 1.12, biomes: ["soil"], reactors: ["bench", "panel", "all"], traits: ["rooted", "reliable"], lore: "A fictional topsoil filament with a modest, reliable yield." },
  { id: "heat-moss", name: "Heat Moss", short: "Heat Moss", scientific: false, rarity: "uncommon", color: "#d8a273", baseRate: 1.46, growth: 0.66, biomes: ["thermal"], reactors: ["automated", "industrial", "all"], traits: ["heatproof", "steady"], lore: "A fictional warm-stone colony that keeps late pools approachable." },
  { id: "thermal-pebble", name: "Thermal Pebble", short: "Thermal Pebble", scientific: false, rarity: "common", color: "#c98370", baseRate: 1.02, growth: 0.82, biomes: ["thermal"], reactors: ["panel", "automated", "industrial", "all"], traits: ["heatproof", "compact"], lore: "A fictional thermal sample that keeps rare outcomes rare rather than certain." },
  { id: "fen-comet", name: "Fen Comet", short: "Fen Comet", scientific: false, rarity: "uncommon", color: "#9ad4b8", baseRate: 1.08, growth: 0.8, biomes: ["wetlands"], reactors: ["panel", "automated", "all"], traits: ["mist", "quick"], lore: "A fictional wetland comet with a short, bright batch cycle." },
  { id: "coast-cinder", name: "Coast Cinder", short: "Coast Cinder", scientific: false, rarity: "common", color: "#769fb5", baseRate: 0.8, growth: 0.92, biomes: ["coastal"], reactors: ["bench", "panel", "automated", "all"], traits: ["marine", "compact"], lore: "A fictional tide-pool common that gives marine surveys a steady floor." },
  { id: "night-common", name: "Night Pebble", short: "Night Pebble", scientific: false, rarity: "common", color: "#9aa0d1", baseRate: 1.12, growth: 0.75, biomes: ["night-tide"], reactors: ["panel", "automated", "industrial", "all"], traits: ["luminous", "compact"], lore: "A fictional nocturnal common; the late pool still has ordinary outcomes." },
  { id: "moon-thread", name: "Moon Thread", short: "Moon Thread", scientific: false, rarity: "uncommon", color: "#b7b6df", baseRate: 1.34, growth: 0.63, biomes: ["night-tide"], reactors: ["automated", "industrial", "all"], traits: ["luminous", "patient"], lore: "A fictional moonlit thread that rewards repeated night surveys." },
];

export const DEVICES = [
  { id: "screening", name: "Screening Chip", subtitle: "quiet first pass", glyph: "S", color: "#77c8b7", cost: 95, speed: 1, quality: 0, rarity: 0, chambers: 1, maxLevel: 5, compatibleBiomes: ["freshwater"], description: "A patient, low-cost chip for dependable freshwater first surveys." },
  { id: "optical", name: "Optical Analysis Chip", subtitle: "spectral readout", glyph: "O", color: "#85a8e2", cost: 420, speed: 1.18, quality: 0.14, rarity: 0.45, chambers: 2, maxLevel: 6, compatibleBiomes: ["freshwater", "lakes", "moist-sand", "soil", "forest-soil"], description: "Reads subtle inland signals and opens a two-sample survey lane." },
  { id: "isolation", name: "Isolation Array", subtitle: "rare strain focus", glyph: "I", color: "#c69bdd", cost: 1_450, speed: 0.96, quality: 0.23, rarity: 1.05, chambers: 3, maxLevel: 7, compatibleBiomes: ["freshwater", "lakes", "moist-sand", "coastal", "soil", "forest-soil", "wetlands"], description: "Separates mixed signatures and favors unusual field outcomes." },
  { id: "archive", name: "Archive Sequencer", subtitle: "research-grade", glyph: "A", color: "#e0b970", cost: 5_400, speed: 1.05, quality: 0.4, rarity: 1.65, chambers: 4, maxLevel: 8, compatibleBiomes: ["all"], description: "A late-game instrument with four independent archive lanes." },
];

export const REACTOR_TIERS = [
  { id: "flask", name: "Seed Flask", icon: "◒", cost: 0, unlockResearch: 0, slots: 1, capacity: 10_000, rate: 0.72, efficiency: 0.76, environment: "balanced", description: "A warm glass vessel for the first living culture." },
  { id: "bench", name: "Bench Vessel", icon: "◍", cost: 520, unlockResearch: 2, slots: 2, capacity: 50_000, rate: 1.0, efficiency: 0.94, environment: "balanced", description: "A steady bench-scale chamber with two strain positions." },
  { id: "panel", name: "Flat-Panel Reactor", icon: "▤", cost: 1_850, unlockResearch: 4, slots: 3, capacity: 180_000, rate: 1.28, efficiency: 1.12, environment: "marine", description: "Broad illuminated surfaces reward a balanced collection." },
  { id: "automated", name: "Automated Tubular Loop", icon: "◎", cost: 6_800, unlockResearch: 6, slots: 3, capacity: 500_000, rate: 1.7, efficiency: 1.34, environment: "wetland", description: "Flow and light are coordinated while the lab is quiet." },
  { id: "industrial", name: "Industrial Sunroom", icon: "✺", cost: 24_000, unlockResearch: 9, slots: 4, capacity: 2_000_000, rate: 2.2, efficiency: 1.58, environment: "rare", description: "A high-end cultivation room for apex strains." },
];

// A larger vessel can cultivate the lower-grade strains supported by its
// smaller counterparts. Keep the exported selector metadata and engine aligned.
for (const species of SPECIES) {
  species.freshwater = species.biomes.includes("freshwater");
  const explicit = species.reactors.filter((id) => id !== "all");
  const minimumTier = explicit.length ? REACTOR_TIERS.findIndex((tier) => explicit.includes(tier.id)) : 0;
  species.reactors = REACTOR_TIERS.slice(species.freshwater ? 0 : minimumTier).map((tier) => tier.id);
}

export const UPGRADES = [
  { id: "optics", branch: "discovery", name: "Polarized Optics", cost: 240, max: 3, icon: "◈", description: "+0.16 sample quality per level; rare outcomes become more likely.", effect: "quality +0.16" },
  { id: "flow-control", branch: "discovery", name: "Laminar Flow Control", cost: 330, max: 3, icon: "≈", description: "Speeds expeditions by 9% per level without changing their pools.", effect: "expeditions −9%" },
  { id: "chambers", branch: "infrastructure", name: "Rack Chamber Grid", cost: 620, max: 2, icon: "▦", description: "+1 valid discovery slot in each commissioned rack per level.", effect: "+1 rack slot" },
  { id: "rare-culture", branch: "research", name: "Rare Culture Index", cost: 1_100, max: 4, icon: "✦", description: "Unlocks deeper field notes and improves high-rarity weighting.", effect: "research +1" },
  { id: "wetland-mapping", branch: "research", name: "Wetland Mapping", cost: 2_200, max: 1, icon: "⌁", description: "Opens wetlands and adds one explicit research milestone.", effect: "opens wetlands" },
  { id: "light-control", branch: "cultivation", name: "Spectral Light Control", cost: 480, max: 4, icon: "☼", description: "+8% reactor efficiency per level.", effect: "efficiency +8%" },
  { id: "nutrient-loop", branch: "cultivation", name: "Nutrient Loop", cost: 760, max: 3, icon: "↻", description: "+12% storage capacity per level and a small growth benefit.", effect: "capacity +12%" },
  { id: "mutation-analysis", branch: "research", name: "Mutation Analysis", cost: 4_800, max: 2, icon: "⌘", description: "Rare discoveries can reveal a valuable variant trait.", effect: "variant chance +8%" },
  { id: "auto-collection", branch: "automation", name: "Quiet Auto-Collection", cost: 1_500, max: 1, icon: "↓", description: "Collects ready discoveries while you are away.", effect: "auto-collect" },
  { id: "lab-automation", branch: "automation", name: "Night Shift Protocol", cost: 4_200, max: 2, icon: "⋆", description: "Collects ready opted-in devices and starts at most one next survey per device.", effect: "auto-repeat" },
  { id: "third-rack", branch: "infrastructure", name: "Third Rack Bay", cost: 5_600, max: 1, icon: "▥", description: "Adds one commissioned rack bay with the current chamber grid.", effect: "+1 rack" },
];

export const EVENTS = [
  { id: "quiet-current", name: "Quiet Current", description: "The laboratory settles. Reactor output is gently improved.", color: "#78c9b5", duration: 95, production: 1.18 },
  { id: "golden-hour", name: "Golden Hour", description: "Warm light finds a few more unusual signatures in every expedition.", color: "#e2b96b", duration: 82, rarity: 0.7, quality: 0.12 },
  { id: "mist-window", name: "Mist Window", description: "Wetland-style samples travel cleanly through the lab.", color: "#a7c9c0", duration: 88, production: 1.12, quality: 0.18 },
  { id: "clear-channel", name: "Clear Channel", description: "Flow is unusually calm; devices complete their work sooner.", color: "#83a8d4", duration: 76, speed: 1.08 },
  { id: "community-bloom", name: "Community Bloom", description: "A gentle burst of growth fills the culture ledger.", color: "#b6d789", duration: 70, production: 1.28, rarity: 0.25 },
];

export const CONTRACTS = [
  { id: "freshwater-notes", name: "First Field Notes", description: "Complete and collect one Freshwater expedition.", reward: 120, check: (state) => state.stats.completedExpeditions >= 1 },
  { id: "three-stars", name: "A Rare Shape", description: "Discover a three-star strain.", reward: 360, check: (state) => state.stats.highestRarity >= 3 },
  { id: "living-archive", name: "Living Archive", description: "Discover six different species.", reward: 900, check: (state) => state.discovered.length >= 6 },
  { id: "quiet-empire", name: "Quiet Empire", description: "Reach 5.0 biomass per second from reactors.", reward: 2_400, check: (state) => calculateTotalRate(state, state.lastSettledAt) >= 5 },
  { id: "night-window", name: "Night Window", description: "Unlock Night Tide.", reward: 5_000, check: (state) => state.unlockedBiomes.includes("night-tide") },
];

export const RESEARCH_MILESTONES = [
  { id: "first-survey", label: "First survey", points: 1, check: (state) => state.stats.completedExpeditions >= 1 },
  { id: "archive-entry", label: "Archive entry", points: 1, check: (state) => state.stats.discoveries >= 1 },
  { id: "first-harvest", label: "First reactor harvest", points: 1, check: (state) => state.stats.harvests >= 1 },
  { id: "rare-record", label: "Rare record", points: 2, check: (state) => state.stats.highestRarity >= 3 },
  { id: "variant-analysis", label: "Variant analysis", points: 2, check: (state) => state.stats.variants >= 1 },
];

const indexById = (items) => Object.assign(Object.create(null), Object.fromEntries(items.map((item) => [item.id, item])));
const SPECIES_BY_ID = indexById(SPECIES);
const BIOME_BY_ID = indexById(BIOMES);
const DEVICE_BY_ID = indexById(DEVICES);
const REACTOR_BY_ID = indexById(REACTOR_TIERS);
const UPGRADE_BY_ID = indexById(UPGRADES);
const EVENT_BY_ID = indexById(EVENTS);
const ENVIRONMENT_BY_ID = indexById(REACTOR_ENVIRONMENTS);
const EVENT_INTERVAL_MS = 5 * 60 * 1000;
const BASE_EVENT = { id: "settled-air", name: "Settled Air", description: "No ambient modifier is active. The lab follows its normal rhythm.", color: "#7f9a9a", production: 1, speed: 1, quality: 0, rarity: 0, duration: 0 };

export const byId = {
  species: (id) => SPECIES_BY_ID[id], biome: (id) => BIOME_BY_ID[id], device: (id) => DEVICE_BY_ID[id],
  reactor: (id) => REACTOR_BY_ID[id], environment: (id) => ENVIRONMENT_BY_ID[id], upgrade: (id) => UPGRADE_BY_ID[id], event: (id) => EVENT_BY_ID[id],
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const positive = (value, fallback = 0) => Math.max(0, finite(value, fallback));
const integer = (value, fallback = 0) => Math.floor(positive(value, fallback));
const unique = (array) => new Set(array).size === array.length;

export function hashSeed(text) {
  let hash = 2166136261;
  for (const char of String(text)) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return hash >>> 0;
}

export function randomFromSeed(seed) {
  let value = hashSeed(seed) || 1;
  return () => {
    value += 0x6D2B79F5;
    let t = value;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function rarityInfo(id) { return RARITIES.find((item) => item.id === id) || RARITIES[0]; }
export function speciesInfo(id) { return SPECIES_BY_ID[id] || SPECIES_BY_ID.arthrospira; }
export function biomeInfo(id) { return BIOME_BY_ID[id] || BIOMES[0]; }
export function reactorInfo(id) { return REACTOR_BY_ID[id] || REACTOR_TIERS[0]; }

function nowValue(now, fallback = Date.now()) { return Number.isFinite(Number(now)) ? Math.max(0, Number(now)) : fallback; }
function actionTime(state, now) { return Math.max(state.lastSettledAt, nowValue(now, state.lastSettledAt)); }
function randomWorldSeed() {
  try {
    const cryptoApi = globalThis.crypto;
    if (cryptoApi?.getRandomValues) {
      const values = new Uint32Array(4);
      cryptoApi.getRandomValues(values);
      return `ORR-${Array.from(values, (value) => value.toString(16).padStart(8, "0")).join("")}`.slice(0, 64);
    }
    if (typeof cryptoApi?.randomUUID === "function") return `ORR-${cryptoApi.randomUUID()}`.slice(0, 64);
  } catch { /* use the non-crypto fallback when the host does not expose Web Crypto */ }
  return `ORR-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`.slice(0, 64);
}

function defaultReactorEnvironment(tierId) { return REACTOR_BY_ID[tierId]?.environment || "balanced"; }
function starterReactor(now) { return { id: "reactor-1", tier: "flask", level: 1, environment: defaultReactorEnvironment("flask"), slots: ["arthrospira"], stored: 0, lastSettledAt: now }; }
function baseStats() {
  return { expeditions: 0, completedExpeditions: 0, discoveries: 0, catches: 0, rareFinds: 0, highestRarity: 1, perfectSurveys: 0, totalSeconds: 0, harvests: 0, variants: 0, contracts: 0, grants: 0, migrationCredits: 0 };
}

export function createInitialState(seed = randomWorldSeed(), now = Date.now()) {
  const timestamp = nowValue(now);
  return {
    format: "orr-cyanoflow-save", version: SAVE_VERSION, seed: String(seed).slice(0, 64),
    credits: 95, lifetimeCredits: 0, biomassHarvested: 0, totalProduction: 0,
    unlockedBiomes: ["freshwater"], activeBiome: "freshwater", discovered: ["arthrospira"],
    collection: { arthrospira: { count: 1, variants: 0, bestQuality: 0.58 } },
    devices: [], racks: [{ id: "rack-1", name: "North Window Rack", slots: [null, null], commissioned: true }],
    reactors: [starterReactor(timestamp)], selectedReactor: "reactor-1", upgrades: Object.fromEntries(UPGRADES.map((upgrade) => [upgrade.id, 0])),
    stats: baseStats(), expeditionCounter: 0, lastDiscovery: null, activeEvent: null, eventCounter: 0,
    contractId: "freshwater-notes", claimedContracts: [],
    log: ["The North Window lab is warm. A starter Arthrospira culture is already circulating."],
    tutorial: { step: 0, dismissed: false }, settings: { music: true, sfx: true, reducedMotion: false, musicVolume: 0.38, sfxVolume: 0.55, muted: false, effects: true },
    lastSettledAt: timestamp, lastSavedAt: timestamp,
  };
}

const STATE_KEYS = new Set([
  "format", "version", "seed", "credits", "lifetimeCredits", "biomassHarvested", "totalProduction",
  "unlockedBiomes", "activeBiome", "discovered", "collection", "devices", "racks", "reactors",
  "selectedReactor", "upgrades", "stats", "expeditionCounter", "lastDiscovery", "activeEvent",
  "eventCounter", "contractId", "claimedContracts", "log", "tutorial", "settings", "lastSettledAt", "lastSavedAt",
]);
const STATS_KEYS = new Set(Object.keys(baseStats()));
const SETTING_KEYS = new Set(["music", "sfx", "reducedMotion", "musicVolume", "sfxVolume", "muted", "effects"]);
const TUTORIAL_KEYS = new Set(["step", "dismissed"]);
const MAX_MONEY = 1e12;

function assertObject(value, message) { if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(message); }
function assertKeys(value, allowed, message) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(message);
  for (const key of Object.keys(value)) if (!allowed.has(key)) throw new Error(`${message}: unknown key ${key}`);
}
function assertFiniteRange(value, min, max, message) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) throw new Error(message);
}
function assertInteger(value, min, max, message) {
  assertFiniteRange(value, min, max, message);
  if (!Number.isSafeInteger(value)) throw new Error(message);
}
function addBounded(record, key, amount, max = MAX_MONEY) {
  if (!Number.isFinite(record[key]) || !Number.isFinite(amount) || amount < 0 || record[key] < 0 || record[key] > max) return false;
  const next = record[key] + amount;
  if (!Number.isFinite(next)) return false;
  record[key] = Math.min(max, next); return true;
}
function awardCredits(state, amount) {
  if (!Number.isFinite(amount) || amount < 0 || !Number.isFinite(state.credits) || !Number.isFinite(state.lifetimeCredits)
    || state.credits < 0 || state.lifetimeCredits < 0 || state.credits > MAX_MONEY || state.lifetimeCredits > MAX_MONEY
    || !Number.isFinite(state.credits + amount) || !Number.isFinite(state.lifetimeCredits + amount)) return false;
  addBounded(state, "credits", amount); addBounded(state, "lifetimeCredits", amount);
  return true;
}
function assertUniqueIds(items, label) {
  if (!Array.isArray(items) || !unique(items.map((item) => item.id))) throw new Error(`${label} contains duplicate IDs`);
}
function validId(id, lookup) { return typeof id === "string" && Boolean(lookup[id]); }

function rackSlotCount(state) { return 2 + upgradeLevel(state, "chambers"); }

function syncInfrastructure(state) {
  const slots = rackSlotCount(state);
  for (const rack of state.racks) {
    if (!Array.isArray(rack.slots)) rack.slots = [];
    if (rack.slots.length > slots && rack.slots.slice(slots).some(Boolean)) throw new Error("A device is assigned to a locked rack slot");
    rack.slots = Array.from({ length: slots }, (_, index) => rack.slots[index] || null);
  }
}

function mapLegacySpecies(id) {
  if (SPECIES_BY_ID[id]) return id;
  const aliases = { "mint-comet": "arthrospira", "algae": "arthrospira", "spirulina": "arthrospira" };
  return Object.hasOwn(aliases, id) ? aliases[id] : null;
}

function legacyNumber(raw, key, fallback = 0) {
  if (raw[key] === undefined) return fallback;
  assertFiniteRange(raw[key], 0, MAX_MONEY, `Invalid ${key}`);
  return Number(raw[key]);
}

function legacyArray(raw, key) {
  if (raw[key] === undefined) return [];
  if (!Array.isArray(raw[key])) throw new Error(`Invalid ${key}`);
  return raw[key];
}

function migrateVersionedSave(raw, now) {
  assertObject(raw, "Save data is not an object");
  assertFiniteRange(raw.version, 1, 2, "Unsupported save version");
  const state = createInitialState(typeof raw.seed === "string" && raw.seed ? raw.seed : `MIGRATED-${now}`, now);
  const oldCredits = legacyNumber(raw, "credits", state.credits);
  state.credits = Math.min(MAX_MONEY, Math.max(state.credits, oldCredits) + RESEARCH_GRANT);
  state.lifetimeCredits = Math.min(MAX_MONEY, legacyNumber(raw, "lifetimeCredits", 0) + RESEARCH_GRANT);
  state.biomassHarvested = legacyNumber(raw, "biomassHarvested", legacyNumber(raw, "biomass", 0));
  state.totalProduction = legacyNumber(raw, "totalProduction", 0);
  const oldDiscovered = legacyArray(raw, "discovered").map(mapLegacySpecies).filter(Boolean);
  const collectionKeys = raw.collection && typeof raw.collection === "object" && !Array.isArray(raw.collection) ? Object.keys(raw.collection) : [];
  const allDiscovered = [...new Set(["arthrospira", ...oldDiscovered, ...collectionKeys.map(mapLegacySpecies).filter(Boolean)])];
  state.discovered = allDiscovered;
  state.collection = {};
  for (const id of allDiscovered) {
    const source = raw.collection?.[id] || raw.collection?.[Object.keys(raw.collection || {}).find((key) => mapLegacySpecies(key) === id)] || {};
    state.collection[id] = {
      count: clamp(integer(source.count, id === "arthrospira" ? 1 : 1), 1, 999_999),
      variants: clamp(integer(source.variants, 0), 0, 999),
      bestQuality: clamp(finite(source.bestQuality, 0.52), 0, 1),
    };
  }
  const oldUnlocked = legacyArray(raw, "unlockedBiomes").filter((id) => BIOME_BY_ID[id]);
  state.unlockedBiomes = [...new Set(["freshwater", ...oldUnlocked])];
  state.activeBiome = BIOME_BY_ID[raw.activeBiome] && state.unlockedBiomes.includes(raw.activeBiome) ? raw.activeBiome : "freshwater";
  state.upgrades = {};
  for (const upgrade of UPGRADES) state.upgrades[upgrade.id] = clamp(integer(raw.upgrades?.[upgrade.id], 0), 0, upgrade.max);
  state.stats = Object.fromEntries(Object.keys(baseStats()).map((key) => [key, legacyNumber(raw.stats || {}, key, baseStats()[key])]));
  state.stats.expeditions = integer(raw.stats?.expeditions, integer(raw.expeditions, 0));
  state.stats.discoveries = integer(raw.stats?.discoveries, 0);
  state.stats.highestRarity = clamp(integer(raw.stats?.highestRarity, 1), 1, 5);
  state.stats.migrationCredits = RESEARCH_GRANT;
  state.stats.grants = 1;
  state.expeditionCounter = integer(raw.expeditionCounter, 0);
  state.log.unshift("A previous Cyanoflow or Rack Run record was migrated. A 100-credit research grant was issued.");
  state.lastSavedAt = now;
  syncInfrastructure(state);
  if (upgradeLevel(state, "third-rack")) state.racks.push({ id: "rack-2", name: "Rack 2", commissioned: true, slots: Array(rackSlotCount(state)).fill(null) });
  return normalizeState(state, now);
}

function normalizeDeviceRecord(raw, index, legacy) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("Invalid device record");
  if (!legacy) assertKeys(raw, new Set(["id", "type", "level", "rackId", "slot", "status", "autoRepeat", "expedition"]), "Invalid device record");
  const type = raw.type;
  if (!DEVICE_BY_ID[type]) throw new Error("Invalid device type");
  const id = raw.id === undefined && legacy ? `device-${index + 1}` : raw.id;
  if (typeof id !== "string" || !id) throw new Error("Invalid device ID");
  const definition = DEVICE_BY_ID[type];
  const status = raw.status === undefined && legacy ? "idle" : raw.status;
  if (!["idle", "running", "ready"].includes(status)) throw new Error("Invalid device status");
  assertInteger(raw.level ?? 1, 1, definition.maxLevel, "Invalid device level");
  const level = clamp(integer(raw.level, 1), 1, definition.maxLevel);
  const device = {
    id, type, level, rackId: typeof raw.rackId === "string" ? raw.rackId : null,
    slot: Number.isInteger(raw.slot) ? raw.slot : null, status, autoRepeat: raw.autoRepeat === true, expedition: null,
  };
  if (!legacy && raw.autoRepeat !== undefined && typeof raw.autoRepeat !== "boolean") throw new Error("Invalid device auto-repeat flag");
  if (!legacy && raw.rackId !== null && typeof raw.rackId !== "string") throw new Error("Invalid device rack assignment");
  if (!legacy && raw.slot !== null && !Number.isInteger(raw.slot)) throw new Error("Invalid device slot assignment");
  if (raw.expedition !== undefined && raw.expedition !== null) {
    const expedition = raw.expedition;
    if (!expedition || typeof expedition !== "object" || Array.isArray(expedition)) throw new Error("Invalid expedition record");
    if (!legacy) assertKeys(expedition, new Set(["biomeId", "seed", "startedAt", "endsAt", "result", "collected", "snapshot"]), "Invalid expedition record");
    if (!BIOME_BY_ID[expedition.biomeId] || typeof expedition.seed !== "string" || !expedition.seed) throw new Error("Invalid expedition target");
    if (!legacy && !deviceCompatibleWithBiome(device, expedition.biomeId)) throw new Error("Expedition uses an incompatible device");
    assertFiniteRange(expedition.startedAt, 0, Number.MAX_SAFE_INTEGER, "Invalid expedition start timestamp");
    assertFiniteRange(expedition.endsAt, 0, Number.MAX_SAFE_INTEGER, "Invalid expedition end timestamp");
    if (expedition.endsAt <= expedition.startedAt) throw new Error("Invalid expedition duration");
    const result = expedition.result;
    if (result !== null && result !== undefined) {
      if (!legacy) assertKeys(result, new Set(["speciesId", "quality", "variant", "rarity", "sampleSeed", "samples", "resolvedAt", "revealedAt"]), "Invalid expedition result");
      if (!SPECIES_BY_ID[result.speciesId] || !RARITIES.some((rarity) => rarity.id === result.rarity) || typeof result.variant !== "boolean") throw new Error("Invalid expedition result summary");
      assertFiniteRange(result.quality, 0, 1, "Invalid expedition result quality");
      assertFiniteRange(result.sampleSeed, 0, 0xffffffff, "Invalid expedition result seed");
      if (!Array.isArray(result.samples) || !result.samples.length) throw new Error("Invalid expedition samples");
      for (const sample of result.samples) {
        if (!legacy) assertKeys(sample, new Set(["speciesId", "quality", "variant", "rarity", "sampleSeed", "lane"]), "Invalid expedition sample");
        if (!SPECIES_BY_ID[sample.speciesId] || !RARITIES.some((rarity) => rarity.id === sample.rarity) || typeof sample.variant !== "boolean") throw new Error("Invalid expedition sample");
        assertFiniteRange(sample.quality, 0, 1, "Invalid expedition sample quality");
        assertFiniteRange(sample.sampleSeed, 0, 0xffffffff, "Invalid expedition sample seed");
        if (!Number.isInteger(sample.lane) || sample.lane < 0 || sample.lane >= 4) throw new Error("Invalid expedition sample lane");
      }
      if (result.speciesId !== result.samples[0].speciesId || result.rarity !== result.samples[0].rarity || result.variant !== result.samples[0].variant) throw new Error("Expedition result summary does not match samples");
      assertFiniteRange(result.resolvedAt, 0, Number.MAX_SAFE_INTEGER, "Invalid expedition resolution timestamp");
      assertFiniteRange(result.revealedAt, 0, Number.MAX_SAFE_INTEGER, "Invalid expedition reveal timestamp");
    } else if (status === "ready") {
      throw new Error("A ready expedition must have a fixed result");
    }
    if (!expedition.snapshot || typeof expedition.snapshot !== "object" || Array.isArray(expedition.snapshot)) throw new Error("Expedition snapshot is missing");
    if (!legacy) assertKeys(expedition.snapshot, new Set(["speed", "quality", "rarity", "chambers", "variantChance", "eventId"]), "Invalid expedition snapshot");
    assertFiniteRange(expedition.snapshot.speed, 0.01, 100, "Invalid expedition snapshot speed");
    assertFiniteRange(expedition.snapshot.quality, 0, 1, "Invalid expedition snapshot quality");
    assertFiniteRange(expedition.snapshot.rarity, 0, 100, "Invalid expedition snapshot rarity");
    assertInteger(expedition.snapshot.chambers, 1, 4, "Invalid expedition snapshot chambers");
    if (expedition.snapshot.chambers !== definition.chambers) throw new Error("Expedition chambers do not match device profile");
    assertFiniteRange(expedition.snapshot.variantChance, 0, 0.8, "Invalid expedition snapshot variant chance");
    if (!EVENT_BY_ID[expedition.snapshot.eventId] && expedition.snapshot.eventId !== BASE_EVENT.id) throw new Error("Invalid expedition snapshot event");
    if (result && (result.samples.length !== Math.floor(expedition.snapshot.chambers) || new Set(result.samples.map((sample) => sample.lane)).size !== result.samples.length)) throw new Error("Expedition sample lanes do not match its chambers");
    device.expedition = {
      biomeId: expedition.biomeId, seed: expedition.seed, startedAt: Number(expedition.startedAt), endsAt: Number(expedition.endsAt),
      result: result || null, collected: expedition.collected === true,
      snapshot: expedition.snapshot && typeof expedition.snapshot === "object" ? { ...expedition.snapshot } : null,
    };
    if (!legacy && typeof expedition.collected !== "boolean") throw new Error("Invalid expedition collection flag");
  }
  if (status === "idle" && device.expedition) throw new Error("Idle device has an expedition");
  if (status !== "idle" && !device.expedition) throw new Error("Busy device has no expedition");
  return device;
}

function normalizeReactorRecord(raw, index, legacy, now) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("Invalid reactor record");
  if (!legacy) assertKeys(raw, new Set(["id", "tier", "level", "environment", "slots", "stored", "lastSettledAt"]), "Invalid reactor record");
  const tier = REACTOR_BY_ID[raw.tier] ? raw.tier : legacy ? "flask" : null;
  if (!tier) throw new Error("Invalid reactor tier");
  const definition = REACTOR_BY_ID[tier];
  const id = raw.id === undefined && legacy ? `reactor-${index + 1}` : raw.id;
  if (typeof id !== "string" || !id) throw new Error("Invalid reactor ID");
  assertInteger(raw.level ?? 1, 1, 10, "Invalid reactor level");
  const environment = raw.environment === undefined ? defaultReactorEnvironment(tier) : raw.environment;
  if (!validId(environment, ENVIRONMENT_BY_ID)) throw new Error("Invalid reactor environment");
  const slots = Array.isArray(raw.slots) ? raw.slots : legacy ? [] : null;
  if (!slots) throw new Error("Invalid reactor slots");
  if (!legacy && slots.length !== definition.slots) throw new Error("Reactor slot count does not match its tier");
  const normalizedSlots = Array.from({ length: definition.slots }, (_, slot) => {
    const speciesId = slots[slot];
    if (speciesId !== null && speciesId !== undefined && !SPECIES_BY_ID[speciesId]) throw new Error("Unknown reactor species");
    return speciesId || null;
  });
  assertFiniteRange(raw.stored ?? 0, 0, MAX_MONEY, "Invalid reactor storage");
  const settled = raw.lastSettledAt === undefined ? now : raw.lastSettledAt;
  assertFiniteRange(settled, 0, Number.MAX_SAFE_INTEGER, "Invalid reactor timestamp");
  return { id, tier, level: clamp(integer(raw.level, 1), 1, 10), environment, slots: normalizedSlots, stored: Number(raw.stored || 0), lastSettledAt: Number(settled) };
}

function normalizeState(raw, now = Date.now(), options = {}) {
  assertObject(raw, "Save data is not an object");
  const legacy = options.legacy === true;
  const timestamp = nowValue(now);
  const state = createInitialState(typeof raw.seed === "string" && raw.seed ? raw.seed : "ORR-RESTORED", timestamp);
  if (typeof raw.seed !== "string" || !raw.seed || raw.seed.length > 64) throw new Error("Invalid save seed");
  state.seed = raw.seed;
  for (const [key, max] of [["credits", MAX_MONEY], ["lifetimeCredits", MAX_MONEY], ["biomassHarvested", MAX_MONEY], ["totalProduction", MAX_MONEY]]) {
    assertFiniteRange(raw[key], 0, max, `Invalid ${key}`);
  }
  state.credits = positive(raw.credits, state.credits); state.lifetimeCredits = positive(raw.lifetimeCredits, 0);
  state.biomassHarvested = positive(raw.biomassHarvested, 0); state.totalProduction = positive(raw.totalProduction, 0);
  for (const [key, value] of [["credits", state.credits], ["lifetimeCredits", state.lifetimeCredits], ["biomassHarvested", state.biomassHarvested], ["totalProduction", state.totalProduction]]) {
    assertFiniteRange(value, 0, MAX_MONEY, `Invalid ${key}`);
  }
  const unlocked = raw.unlockedBiomes === undefined && legacy ? ["freshwater"] : raw.unlockedBiomes;
  const discovered = raw.discovered === undefined && legacy ? ["arthrospira"] : raw.discovered;
  if (!Array.isArray(unlocked) || !unique(unlocked) || unlocked.some((id) => !BIOME_BY_ID[id])) throw new Error("Invalid biome unlock list");
  if (!unlocked.includes("freshwater")) throw new Error("Freshwater must remain unlocked");
  if (!Array.isArray(discovered) || !unique(discovered) || discovered.some((id) => !SPECIES_BY_ID[id])) throw new Error("Invalid discovery list");
  if (!discovered.includes("arthrospira")) throw new Error("Starter culture is missing");
  if (!legacy && !unlocked.includes(raw.activeBiome)) throw new Error("Invalid active biome");
  state.unlockedBiomes = [...unlocked]; state.activeBiome = unlocked.includes(raw.activeBiome) ? raw.activeBiome : unlocked[0];
  if (!BIOME_BY_ID[state.activeBiome]) throw new Error("Invalid active biome");
  state.discovered = [...discovered];
  if (raw.collection !== undefined && (!raw.collection || typeof raw.collection !== "object" || Array.isArray(raw.collection))) throw new Error("Invalid collection");
  const collection = raw.collection || {};
  if (!legacy && Object.keys(collection).some((id) => !discovered.includes(id))) throw new Error("Collection contains an undiscovered species");
  state.collection = {};
  for (const id of discovered) {
    const entry = collection[id] || (legacy ? {} : null);
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) throw new Error("Missing collection record");
    if (!legacy) assertKeys(entry, new Set(["count", "variants", "bestQuality"]), "Invalid collection record");
    assertInteger(entry.count, 1, 999_999, "Invalid sample count");
    assertInteger(entry.variants, 0, Math.min(999, entry.count), "Invalid variant count");
    assertFiniteRange(entry.bestQuality ?? 0.5, 0, 1, "Invalid collection quality");
    state.collection[id] = { count: clamp(integer(entry.count, 1), 1, 999_999), variants: clamp(integer(entry.variants, 0), 0, 999), bestQuality: clamp(finite(entry.bestQuality, 0.5), 0, 1) };
  }
  if (!Array.isArray(raw.devices)) throw new Error("Invalid device list");
  state.devices = raw.devices.map((device, index) => normalizeDeviceRecord(device, index, legacy));
  assertUniqueIds(state.devices, "Devices");
  if (!Array.isArray(raw.racks) || !raw.racks.length) throw new Error("Invalid rack list");
  state.racks = raw.racks.map((rack, index) => {
    if (!rack || typeof rack !== "object" || Array.isArray(rack)) throw new Error("Invalid rack record");
    if (!legacy) assertKeys(rack, new Set(["id", "name", "slots", "commissioned"]), "Invalid rack record");
    const id = rack.id === undefined && legacy ? `rack-${index + 1}` : rack.id;
    if (typeof id !== "string" || !id) throw new Error("Invalid rack ID");
    if (rack.slots !== undefined && !Array.isArray(rack.slots)) throw new Error("Invalid rack slots");
    const slots = rack.slots || [null, null];
    if (slots.length > 8) throw new Error("Rack has too many slots");
    if (!legacy && rack.commissioned !== undefined && typeof rack.commissioned !== "boolean") throw new Error("Invalid rack commission flag");
    if (!legacy && slots.some((item) => item !== null && item !== undefined && typeof item !== "string")) throw new Error("Invalid rack slot assignment");
    return { id, name: typeof rack.name === "string" && rack.name ? rack.name : `Rack ${index + 1}`, slots: [...slots].map((item) => item === null || item === undefined ? null : item), commissioned: rack.commissioned !== false };
  });
  assertUniqueIds(state.racks, "Racks");
  if (!Array.isArray(raw.reactors) || !raw.reactors.length) throw new Error("Invalid reactor list");
  state.upgrades = {};
  if (raw.upgrades !== undefined && (!raw.upgrades || typeof raw.upgrades !== "object" || Array.isArray(raw.upgrades))) throw new Error("Invalid upgrade map");
  if (!legacy && Object.keys(raw.upgrades || {}).some((id) => !UPGRADE_BY_ID[id])) throw new Error("Unknown upgrade");
  for (const upgrade of UPGRADES) {
    const level = raw.upgrades?.[upgrade.id] ?? 0;
    assertInteger(level, 0, upgrade.max, `Invalid upgrade level for ${upgrade.id}`);
    state.upgrades[upgrade.id] = clamp(integer(level, 0), 0, upgrade.max);
  }
  if (!legacy && state.racks.some((rack) => rack.slots.length !== rackSlotCount(state))) throw new Error("Rack slot count does not match infrastructure");
  syncInfrastructure(state);
  state.reactors = raw.reactors.map((reactor, index) => normalizeReactorRecord(reactor, index, legacy, timestamp));
  assertUniqueIds(state.reactors, "Reactors");
  if (!legacy && !state.reactors.some((reactor) => reactor.id === raw.selectedReactor)) throw new Error("Selected reactor is missing");
  state.selectedReactor = state.reactors.some((reactor) => reactor.id === raw.selectedReactor) ? raw.selectedReactor : state.reactors[0].id;
  state.stats = { ...baseStats() };
  if (raw.stats !== undefined && (!raw.stats || typeof raw.stats !== "object" || Array.isArray(raw.stats))) throw new Error("Invalid stats");
  if (!legacy && Object.keys(raw.stats || {}).some((key) => !STATS_KEYS.has(key))) throw new Error("Unknown stat");
  for (const key of Object.keys(state.stats)) {
    const value = raw.stats?.[key] ?? state.stats[key];
    assertFiniteRange(value, 0, key === "highestRarity" ? 5 : MAX_MONEY, `Invalid stat ${key}`);
    if (key !== "totalSeconds") assertInteger(value, key === "highestRarity" ? 1 : 0, key === "highestRarity" ? 5 : MAX_MONEY, `Invalid stat ${key}`);
    state.stats[key] = value;
  }
  assertInteger(raw.expeditionCounter, 0, MAX_MONEY, "Invalid expedition counter");
  assertInteger(raw.eventCounter, 0, MAX_MONEY, "Invalid event counter");
  state.expeditionCounter = integer(raw.expeditionCounter, 0); state.eventCounter = integer(raw.eventCounter, 0);
  if (raw.lastDiscovery !== undefined && raw.lastDiscovery !== null) {
    assertObject(raw.lastDiscovery, "Invalid last discovery");
    if (!legacy) assertKeys(raw.lastDiscovery, new Set(["speciesId", "quality", "variant", "rarity", "sampleSeed", "lane", "collectedAt", "samples"]), "Invalid last discovery");
    if (!SPECIES_BY_ID[raw.lastDiscovery.speciesId] || !RARITIES.some((rarity) => rarity.id === raw.lastDiscovery.rarity) || typeof raw.lastDiscovery.variant !== "boolean") throw new Error("Invalid last discovery summary");
    assertFiniteRange(raw.lastDiscovery.quality, 0, 1, "Invalid last discovery quality");
    assertFiniteRange(raw.lastDiscovery.sampleSeed, 0, 0xffffffff, "Invalid last discovery seed");
    assertFiniteRange(raw.lastDiscovery.collectedAt, 0, Number.MAX_SAFE_INTEGER, "Invalid last discovery timestamp");
    if (raw.lastDiscovery.collectedAt > timestamp + MAX_FUTURE_SKEW_MS) throw new Error("Last discovery is in the future");
    if (!Number.isInteger(raw.lastDiscovery.lane) || raw.lastDiscovery.lane < 0 || raw.lastDiscovery.lane >= 4) throw new Error("Invalid last discovery lane");
    if (!Array.isArray(raw.lastDiscovery.samples) || !raw.lastDiscovery.samples.length) throw new Error("Invalid last discovery samples");
    for (const sample of raw.lastDiscovery.samples) {
      assertObject(sample, "Invalid last discovery sample");
      assertKeys(sample, new Set(["speciesId", "quality", "variant", "rarity", "sampleSeed", "lane"]), "Invalid last discovery sample");
      if (!SPECIES_BY_ID[sample.speciesId] || !RARITIES.some((rarity) => rarity.id === sample.rarity) || typeof sample.variant !== "boolean") throw new Error("Invalid last discovery sample");
      if (SPECIES_BY_ID[sample.speciesId].rarity !== sample.rarity || !state.discovered.includes(sample.speciesId)) throw new Error("Invalid last discovery species");
      assertFiniteRange(sample.quality, 0, 1, "Invalid last discovery sample quality");
      assertFiniteRange(sample.sampleSeed, 0, 0xffffffff, "Invalid last discovery sample seed");
      if (!Number.isInteger(sample.lane) || sample.lane < 0 || sample.lane >= 4) throw new Error("Invalid last discovery sample lane");
    }
    if (raw.lastDiscovery.samples.length > 4 || raw.lastDiscovery.samples.some((sample, index) => sample.lane !== index)) throw new Error("Invalid last discovery lanes");
    for (const key of ["speciesId", "quality", "variant", "rarity", "sampleSeed", "lane"]) {
      if (raw.lastDiscovery[key] !== raw.lastDiscovery.samples[0][key]) throw new Error("Last discovery summary does not match samples");
    }
  }
  state.lastDiscovery = raw.lastDiscovery && typeof raw.lastDiscovery === "object" ? { ...raw.lastDiscovery, samples: raw.lastDiscovery.samples.map((sample) => ({ ...sample })) } : null;
  state.contractId = CONTRACTS.some((contract) => contract.id === raw.contractId) ? raw.contractId : "freshwater-notes";
  if (!Array.isArray(raw.claimedContracts) || !unique(raw.claimedContracts) || raw.claimedContracts.some((id) => !CONTRACTS.some((contract) => contract.id === id))) throw new Error("Invalid contract list");
  state.claimedContracts = [...raw.claimedContracts];
  state.log = Array.isArray(raw.log) && raw.log.length ? raw.log.map(String).slice(0, 12) : state.log;
  if (raw.tutorial !== undefined && (!raw.tutorial || typeof raw.tutorial !== "object" || Array.isArray(raw.tutorial))) throw new Error("Invalid tutorial");
  if (raw.settings !== undefined && (!raw.settings || typeof raw.settings !== "object" || Array.isArray(raw.settings))) throw new Error("Invalid settings");
  if (!legacy && Object.keys(raw.settings || {}).some((key) => !SETTING_KEYS.has(key))) throw new Error("Unknown setting");
  for (const key of ["music", "sfx", "reducedMotion", "muted", "effects"]) {
    if (raw.settings?.[key] !== undefined && typeof raw.settings[key] !== "boolean") throw new Error(`Invalid setting ${key}`);
  }
  state.tutorial = { ...state.tutorial, ...(raw.tutorial || {}) }; state.settings = { ...state.settings, ...(raw.settings || {}) };
  assertKeys(state.tutorial, TUTORIAL_KEYS, "Invalid tutorial"); assertKeys(state.settings, SETTING_KEYS, "Invalid settings");
  if (raw.tutorial?.step !== undefined) assertInteger(raw.tutorial.step, 0, 99, "Invalid tutorial step");
  if (raw.tutorial?.dismissed !== undefined && typeof raw.tutorial.dismissed !== "boolean") throw new Error("Invalid tutorial dismissed flag");
  state.tutorial.step = clamp(integer(state.tutorial.step, 0), 0, 99); state.tutorial.dismissed = state.tutorial.dismissed === true;
  for (const key of ["music", "sfx", "reducedMotion", "muted", "effects"]) state.settings[key] = state.settings[key] === true;
  for (const key of ["musicVolume", "sfxVolume"]) { assertFiniteRange(state.settings[key], 0, 1, `Invalid ${key}`); state.settings[key] = clamp(finite(state.settings[key], key === "musicVolume" ? .38 : .55), 0, 1); }
  state.lastSettledAt = raw.lastSettledAt === undefined ? timestamp : raw.lastSettledAt;
  state.lastSavedAt = raw.lastSavedAt === undefined ? timestamp : raw.lastSavedAt;
  assertFiniteRange(state.lastSettledAt, 0, Number.MAX_SAFE_INTEGER, "Invalid last settlement timestamp");
  assertFiniteRange(state.lastSavedAt, 0, Number.MAX_SAFE_INTEGER, "Invalid last save timestamp");
  if (state.lastSettledAt > timestamp + MAX_FUTURE_SKEW_MS || state.lastSavedAt > timestamp + MAX_FUTURE_SKEW_MS) throw new Error("Save timestamp is in the future");
  if (raw.activeEvent !== undefined && raw.activeEvent !== null) {
    assertKeys(raw.activeEvent, new Set(["id", "startedAt", "endsAt", "claimed"]), "Invalid active event");
     if (!EVENT_BY_ID[raw.activeEvent.id] || !Number.isFinite(Number(raw.activeEvent.startedAt)) || !Number.isFinite(Number(raw.activeEvent.endsAt)) || raw.activeEvent.endsAt <= raw.activeEvent.startedAt) throw new Error("Invalid active event");
     if (typeof raw.activeEvent.claimed !== "boolean") throw new Error("Invalid active event claim flag");
    assertFiniteRange(raw.activeEvent.startedAt, 0, timestamp + MAX_FUTURE_SKEW_MS, "Invalid active event start timestamp");
    assertFiniteRange(raw.activeEvent.endsAt, 0, timestamp + MAX_FUTURE_SKEW_MS + EVENT_INTERVAL_MS, "Invalid active event end timestamp");
    state.activeEvent = { id: raw.activeEvent.id, startedAt: raw.activeEvent.startedAt, endsAt: raw.activeEvent.endsAt, claimed: raw.activeEvent.claimed };
  } else state.activeEvent = null;
  if (state.activeEvent && state.activeEvent.endsAt <= timestamp) state.activeEvent = null;
  syncInfrastructure(state);
  validateState(state, timestamp, { allowLegacyExpeditions: legacy });
  return state;
}

function validateState(state, now = Date.now(), options = {}) {
  if (state.format !== "orr-cyanoflow-save" || state.version !== SAVE_VERSION) throw new Error("Invalid Cyanoflow save format");
  assertFiniteRange(state.credits, 0, MAX_MONEY, "Invalid credits");
  assertFiniteRange(state.lifetimeCredits, 0, MAX_MONEY, "Invalid lifetime credits");
  for (const key of ["biomassHarvested", "totalProduction"]) assertFiniteRange(state[key], 0, MAX_MONEY, `Invalid ${key}`);
  for (const key of ["lastSettledAt", "lastSavedAt"]) assertFiniteRange(state[key], 0, Number.MAX_SAFE_INTEGER, `Invalid ${key}`);
  for (const key of ["expeditionCounter", "eventCounter"]) {
    if (!Number.isSafeInteger(state[key]) || state[key] < 0 || state[key] > MAX_MONEY) throw new Error(`Invalid ${key}`);
  }
  if (!Array.isArray(state.unlockedBiomes) || !unique(state.unlockedBiomes) || state.unlockedBiomes.some((id) => !BIOME_BY_ID[id])) throw new Error("Invalid unlocked biomes");
  if (!state.unlockedBiomes.includes(state.activeBiome)) throw new Error("Active biome is locked");
  if (!Array.isArray(state.discovered) || !unique(state.discovered) || state.discovered.some((id) => !SPECIES_BY_ID[id])) throw new Error("Invalid discovered species");
  if (!state.discovered.includes("arthrospira")) throw new Error("Starter species is missing");
  assertUniqueIds(state.devices, "Devices"); assertUniqueIds(state.racks, "Racks"); assertUniqueIds(state.reactors, "Reactors");
  if (state.racks.length > 1 + upgradeLevel(state, "third-rack")) throw new Error("Unresearched rack bay");
  const assigned = new Set();
  for (const rack of state.racks) {
    if (typeof rack.commissioned !== "boolean") throw new Error("Invalid rack commission flag");
    if (!Array.isArray(rack.slots)) throw new Error("Invalid rack slots");
    if (!rack.commissioned) {
      if (rack.slots.some(Boolean)) throw new Error("An uncommissioned rack contains a device");
      continue;
    }
    if (!Array.isArray(rack.slots) || rack.slots.length !== rackSlotCount(state)) throw new Error("Rack slot count is inconsistent");
    for (let slot = 0; slot < rack.slots.length; slot += 1) {
      const deviceId = rack.slots[slot];
      if (deviceId === null) continue;
      if (typeof deviceId !== "string") throw new Error("Invalid rack slot assignment");
      const device = state.devices.find((item) => item.id === deviceId);
      if (!device || assigned.has(deviceId) || device.rackId !== rack.id || device.slot !== slot) throw new Error("Device rack assignment is inconsistent");
      assigned.add(deviceId);
    }
  }
  for (const device of state.devices) {
    if (!Number.isInteger(device.level) || device.level < 1 || device.level > DEVICE_BY_ID[device.type].maxLevel) throw new Error("Invalid device level");
    if (device.rackId === null || device.slot === null) {
      if (device.rackId !== null || device.slot !== null || assigned.has(device.id)) throw new Error("Uninstalled device has a rack assignment");
    } else if (!assigned.has(device.id)) throw new Error("Device points to a missing rack slot");
    if (device.status === "idle" && device.expedition !== null) throw new Error("Idle device retains an expedition");
    if (device.status !== "idle" && !device.expedition) throw new Error("Busy device lacks an expedition");
    if (device.expedition) {
      const expedition = device.expedition;
      if (!assigned.has(device.id) || !state.unlockedBiomes.includes(expedition.biomeId)) throw new Error("Locked expedition assignment");
      if (expedition.collected) throw new Error("Collected expedition cannot remain on a device");
      if (expedition.startedAt > now + MAX_FUTURE_SKEW_MS || expedition.endsAt <= expedition.startedAt) throw new Error("Invalid expedition timestamps");
      const duration = Math.max(1000, Math.round(BIOME_BY_ID[expedition.biomeId].duration / expedition.snapshot.speed * 1000));
      if (expedition.endsAt - expedition.startedAt !== duration) throw new Error("Expedition duration does not match snapshot");
      if (device.status === "running" && expedition.result) throw new Error("Running expedition already has a result");
      if (device.status === "ready" && !device.expedition.result) throw new Error("Expedition outcome is not fixed");
      if (device.expedition.result) {
        if (!Array.isArray(device.expedition.result.samples) || !device.expedition.result.samples.length) throw new Error("Invalid expedition result");
        for (const sample of device.expedition.result.samples) {
          if (!SPECIES_BY_ID[sample.speciesId] || sample.quality < 0 || sample.quality > 1) throw new Error("Invalid expedition result sample");
        }
        const result = expedition.result;
        if (result.resolvedAt < expedition.endsAt || result.revealedAt < result.resolvedAt || result.revealedAt > now + MAX_FUTURE_SKEW_MS) throw new Error("Invalid expedition result timestamps");
        const expected = fixedDiscovery(state, device, expedition, result.resolvedAt);
        for (const key of ["speciesId", "quality", "variant", "rarity", "sampleSeed"]) {
          if (result[key] !== expected[key]) throw new Error("Expedition result does not match snapshot");
        }
        for (let lane = 0; lane < expected.samples.length; lane += 1) {
          for (const key of ["speciesId", "quality", "variant", "rarity", "sampleSeed", "lane"]) {
            if (result.samples[lane]?.[key] !== expected.samples[lane][key]) throw new Error("Expedition sample does not match snapshot");
          }
        }
      }
    }
  }
  for (const reactor of state.reactors) {
    const definition = REACTOR_BY_ID[reactor.tier];
    if (!definition || !ENVIRONMENT_BY_ID[reactor.environment] || reactor.slots.length !== definition.slots || reactor.stored < 0 || reactor.stored > reactorCapacity(reactor, state)) throw new Error("Invalid reactor structure");
    if (!unique(reactor.slots.filter(Boolean))) throw new Error("Duplicate reactor strain slots");
    if (reactor.lastSettledAt !== state.lastSettledAt) throw new Error("Inconsistent reactor settlement timestamp");
    for (const speciesId of reactor.slots.filter(Boolean)) {
      if (!state.discovered.includes(speciesId) || !speciesCompatibleWithReactor(speciesId, reactor.tier)) throw new Error("Locked or incompatible reactor assignment");
    }
  }
  if (!unique(state.reactors.map((reactor) => reactor.tier))) throw new Error("Duplicate reactor tier");
  if (!state.reactors.some((reactor) => reactor.id === state.selectedReactor)) throw new Error("Selected reactor is missing");
  if (state.lastSettledAt > now + MAX_FUTURE_SKEW_MS || state.lastSavedAt > now + MAX_FUTURE_SKEW_MS) throw new Error("Save timestamp is in the future");
  return true;
}

function serializeSnapshot(state) {
  return {
    format: "orr-cyanoflow-save", version: SAVE_VERSION, seed: state.seed, credits: state.credits,
    lifetimeCredits: state.lifetimeCredits, biomassHarvested: state.biomassHarvested, totalProduction: state.totalProduction,
    unlockedBiomes: [...state.unlockedBiomes], activeBiome: state.activeBiome, discovered: [...state.discovered],
    collection: Object.fromEntries(state.discovered.map((id) => [id, { ...state.collection[id] }])),
    devices: state.devices.map((device) => ({ ...device, expedition: device.expedition ? { ...device.expedition, result: device.expedition.result ? { ...device.expedition.result, samples: device.expedition.result.samples.map((sample) => ({ ...sample })) } : null } : null })),
    racks: state.racks.map((rack) => ({ ...rack, slots: [...rack.slots] })),
    reactors: state.reactors.map((reactor) => ({ ...reactor, slots: [...reactor.slots] })), selectedReactor: state.selectedReactor,
    upgrades: { ...state.upgrades }, stats: { ...state.stats }, expeditionCounter: state.expeditionCounter,
    lastDiscovery: state.lastDiscovery ? { ...state.lastDiscovery } : null, activeEvent: state.activeEvent ? { ...state.activeEvent } : null,
    eventCounter: state.eventCounter, contractId: state.contractId, claimedContracts: [...state.claimedContracts], log: [...state.log],
    tutorial: { ...state.tutorial }, settings: { ...state.settings }, lastSettledAt: state.lastSettledAt, lastSavedAt: state.lastSavedAt,
  };
}

export function parseState(raw, now = Date.now()) {
  let value = raw;
  if (typeof raw === "string") { try { value = JSON.parse(raw); } catch { throw new Error("Save data is not valid JSON"); } }
  assertObject(value, "Save data is not an object");
  if (value.format === "orr-microflux-save") return migrateLegacySave(value, now);
  if (value.format !== "orr-cyanoflow-save" && value.format !== "orr-biorealm-save") throw new Error("Unsupported save format");
  if (!Number.isInteger(value.version) || value.version < 1 || value.version > SAVE_VERSION) throw new Error("Unsupported save version");
  if (value.version < SAVE_VERSION) return migrateVersionedSave(value, now);
  if (value.format === "orr-biorealm-save") value = { ...value, format: "orr-cyanoflow-save" };
  assertKeys(value, STATE_KEYS, "Invalid save schema");
  const required = ["seed", "credits", "lifetimeCredits", "biomassHarvested", "totalProduction", "unlockedBiomes", "activeBiome", "discovered", "collection", "devices", "racks", "reactors", "selectedReactor", "upgrades", "stats", "expeditionCounter", "eventCounter", "claimedContracts", "lastSettledAt", "lastSavedAt"];
  if (required.some((key) => value[key] === undefined)) throw new Error("Save is missing required fields");
  return normalizeState(value, now, { legacy: false });
}

export function serializeState(state) {
  if (!state || state.__invalidLoad) throw new Error("Refusing to serialize an invalidly loaded state");
  const snapshot = serializeSnapshot(normalizeState(serializeSnapshot(state), Math.max(state.lastSettledAt, state.lastSavedAt), { legacy: false }));
  return JSON.stringify(snapshot);
}

export function migrateLegacySave(raw, now = Date.now()) {
  assertObject(raw, "Legacy save is not an object");
  const state = createInitialState(`LEGACY-${now}`, nowValue(now));
  const oldCredits = legacyNumber(raw, "credits", 0);
  state.credits = Math.min(MAX_MONEY, Math.max(state.credits, oldCredits) + RESEARCH_GRANT);
  state.lifetimeCredits = Math.min(MAX_MONEY, legacyNumber(raw, "lifetimeCredits", oldCredits) + RESEARCH_GRANT);
  state.biomassHarvested = legacyNumber(raw, "biomassHarvested", legacyNumber(raw, "biomass", 0));
  const oldDiscovered = legacyArray(raw, "discovered").map(mapLegacySpecies).filter(Boolean);
  const oldCollection = raw.collection && typeof raw.collection === "object" && !Array.isArray(raw.collection) ? raw.collection : {};
  state.discovered = [...new Set(["arthrospira", ...oldDiscovered, ...Object.keys(oldCollection).map(mapLegacySpecies).filter(Boolean)])];
  state.collection = {};
  for (const id of state.discovered) {
    const key = Object.keys(oldCollection).find((candidate) => mapLegacySpecies(candidate) === id);
    const entry = oldCollection[id] || (key ? oldCollection[key] : {}) || {};
    state.collection[id] = { count: clamp(integer(entry.count, 1), 1, 999_999), variants: clamp(integer(entry.variants, 0), 0, 999), bestQuality: clamp(finite(entry.bestQuality, 0.52), 0, 1) };
  }
  state.stats.migrationCredits = RESEARCH_GRANT;
  state.stats.grants = 1;
  state.log.unshift("A previous Rack Run was folded into the North Window lab. A 100-credit research grant was issued.");
  return state;
}

export function safeLoad(storage, now = Date.now()) {
  const invalidState = (error, raw, source = undefined) => {
    const state = createInitialState(`INVALID-${now}`, now);
    Object.defineProperty(state, "__invalidLoad", { value: true, enumerable: false, configurable: false });
    return { state, migrated: false, invalid: true, error: error instanceof Error ? error.message : "Invalid save", raw, ...(source ? { source } : {}) };
  };
  const current = storage?.getItem?.(SAVE_KEY);
  if (current) {
    try { return { state: parseState(current, now), migrated: false, invalid: false }; }
    catch (error) { return invalidState(error, current); }
  }
  for (const key of LEGACY_SAVE_KEYS) {
    const legacy = storage?.getItem?.(key);
    if (!legacy) continue;
    try {
      const state = key === "orr-biorealm-v1" ? parseState(legacy, now) : migrateLegacySave(JSON.parse(legacy), now);
      return { state, migrated: true, invalid: false, source: key };
    }
    catch (error) { return invalidState(error, legacy, key); }
  }
  return { state: createInitialState(undefined, now), migrated: false, invalid: false };
}

export function saveState(storage, state, now = Date.now()) {
  if (!storage?.setItem || !state || state.__invalidLoad) return false;
  const timestamp = nowValue(now, state.lastSavedAt || Date.now());
  state.lastSavedAt = Math.max(state.lastSavedAt || 0, timestamp);
  try { storage.setItem(SAVE_KEY, serializeState(state)); return true; } catch { return false; }
}

export function upgradeLevel(state, id) { return Math.floor(positive(state?.upgrades?.[id], 0)); }
export function upgradeCost(id, level = 0) { const item = UPGRADE_BY_ID[id]; return item ? Math.round(item.cost * (1.72 ** Math.max(0, level))) : Infinity; }
export function deviceUpgradeCost(device) { const def = DEVICE_BY_ID[device?.type]; return def ? Math.round(def.cost * 0.48 * (1.65 ** Math.max(0, (device.level || 1) - 1))) : Infinity; }
export function reactorUpgradeCost(reactor) { const def = REACTOR_BY_ID[reactor?.tier]; return def ? Math.round(110 * def.rate * (1.75 ** Math.max(0, (reactor.level || 1) - 1))) : Infinity; }

export function researchProgress(state) {
  const milestones = RESEARCH_MILESTONES.map((milestone) => ({ ...milestone, complete: Boolean(milestone.check(state)) }));
  const milestonePoints = milestones.filter((milestone) => milestone.complete).reduce((sum, milestone) => sum + milestone.points, 0);
  const upgradePoints = ["rare-culture", "wetland-mapping", "mutation-analysis", "chambers", "third-rack", "optics"].reduce((sum, id) => sum + upgradeLevel(state, id), 0);
  return { points: milestonePoints + upgradePoints, milestonePoints, upgradePoints, milestones };
}

export function unlockedResearch(state) { return researchProgress(state).points; }

function eventAt(state, now) {
  const timestamp = nowValue(now);
  const cycle = Math.floor(timestamp / EVENT_INTERVAL_MS);
  const cycleStart = cycle * EVENT_INTERVAL_MS;
  const definition = EVENTS[(hashSeed(`${state.seed}:event:${cycle}`) + (state.eventCounter || 0)) % EVENTS.length];
  const activeEnd = cycleStart + definition.duration * 1000;
  if (timestamp < activeEnd) return { ...definition, startedAt: cycleStart, endsAt: activeEnd, active: true };
  return { ...BASE_EVENT, startedAt: activeEnd, endsAt: cycleStart + EVENT_INTERVAL_MS, active: false };
}

export function eventFor(state, now = Date.now()) {
  const event = eventAt(state, now);
  state.activeEvent = event.active ? { id: event.id, startedAt: event.startedAt, endsAt: event.endsAt, claimed: false } : null;
  return event;
}

function eventMultiplierAt(state, key, now) {
  const event = eventAt(state, now);
  const fallback = key === "production" || key === "speed" ? 1 : 0;
  return Number(event[key] ?? fallback);
}

function nextEventBoundary(state, now) {
  const timestamp = nowValue(now);
  const cycle = Math.floor(timestamp / EVENT_INTERVAL_MS);
  const cycleStart = cycle * EVENT_INTERVAL_MS;
  const definition = EVENTS[(hashSeed(`${state.seed}:event:${cycle}`) + (state.eventCounter || 0)) % EVENTS.length];
  const activeEnd = cycleStart + definition.duration * 1000;
  return timestamp < activeEnd ? activeEnd : cycleStart + EVENT_INTERVAL_MS;
}

function speciesCompatibleWithReactor(speciesId, tierId) {
  const species = SPECIES_BY_ID[speciesId];
  return Boolean(species && species.reactors.includes(tierId));
}

function deviceCompatibleWithBiome(device, biomeId) {
  const definition = DEVICE_BY_ID[device?.type];
  return Boolean(definition && (definition.compatibleBiomes.includes("all") || definition.compatibleBiomes.includes(biomeId)));
}

function deviceChambers(device) { return Math.max(1, Math.min(4, DEVICE_BY_ID[device?.type]?.chambers || 1)); }

function reactorGrowthMultiplier(species, reactor, state) {
  const record = state.collection?.[species.id];
  const quality = record ? 0.9 + clamp(record.bestQuality, 0, 1) * 0.2 : 1;
  const growth = 0.78 + species.growth * 0.22;
  const trait = species.traits.includes("steady") || species.traits.includes("reliable") ? 1.04 : species.traits.includes("volatile") ? 0.94 : 1;
  const vesselFit = species.traits.includes("marine") && ["panel", "automated", "industrial"].includes(reactor.tier) ? 1.04 : 1;
  const environment = ENVIRONMENT_BY_ID[reactor.environment] || ENVIRONMENT_BY_ID.balanced;
  const affinity = environment.id === "balanced" ? 1 : environment.affinity.some((traitId) => species.traits.includes(traitId)) ? environment.bonus : environment.mismatch;
  const rarityYield = 1 + (rarityInfo(species.rarity).stars - 1) * 0.06;
  const variant = record?.variants > 0 ? 1.05 : 1;
  return quality * growth * trait * vesselFit * affinity * rarityYield * variant;
}

export function reactorCapacity(reactor, state) {
  const definition = REACTOR_BY_ID[reactor?.tier];
  if (!definition) return 0;
  return definition.capacity * (1 + upgradeLevel(state, "nutrient-loop") * 0.12) * (1 + Math.max(0, (reactor.level || 1) - 1) * 0.08);
}

// Read-only UI/export data: callers use these actual upgraded caps instead of
// guessing capacity from the tier's base size. Idle fill times are null.
export function storageSummary(state, now = Date.now()) {
  const reactors = state.reactors.map((reactor) => {
    const capacity = reactorCapacity(reactor, state);
    const rate = reactorProduction(reactor, state, now);
    const remaining = Math.max(0, capacity - reactor.stored);
    return { id: reactor.id, stored: reactor.stored, capacity, remaining, rate,
      credits: reactor.stored * BIOMASS_TO_CREDITS, fillRatio: capacity ? reactor.stored / capacity : 0,
      secondsUntilFull: rate > 0 ? remaining / rate : null };
  });
  return { stored: reactors.reduce((sum, reactor) => sum + reactor.stored, 0),
    capacity: reactors.reduce((sum, reactor) => sum + reactor.capacity, 0),
    credits: reactors.reduce((sum, reactor) => sum + reactor.credits, 0),
    rate: reactors.reduce((sum, reactor) => sum + reactor.rate, 0), reactors };
}

export function speciesRate(speciesId, reactor, state, now = Date.now()) {
  const species = SPECIES_BY_ID[speciesId]; const definition = REACTOR_BY_ID[reactor?.tier];
  if (!species || !definition || !speciesCompatibleWithReactor(speciesId, definition.id)) return 0;
  const traitBonus = species.traits.includes("quick") ? 0.04 : species.traits.includes("patient") ? -0.03 : 0;
  const eventProduction = eventMultiplierAt(state, "production", now);
  return species.baseRate * definition.rate * definition.efficiency * reactorGrowthMultiplier(species, reactor, state)
    * (1 + Math.max(0, (reactor.level || 1) - 1) * 0.075)
    * (1 + upgradeLevel(state, "light-control") * 0.08 + upgradeLevel(state, "nutrient-loop") * 0.025 + traitBonus)
    * eventProduction;
}

export function reactorProduction(reactor, state, now = Date.now()) {
  if (!reactor) return 0;
  return reactor.slots.reduce((sum, speciesId) => sum + (speciesId ? speciesRate(speciesId, reactor, state, now) : 0), 0);
}

export function calculateTotalRate(state, now = Date.now()) {
  return state.reactors.reduce((sum, reactor) => sum + reactorProduction(reactor, state, now), 0);
}

function settleReactorSegment(state, from, to) {
  const elapsed = (to - from) / 1000;
  if (elapsed <= 0) return 0;
  let produced = 0;
  for (const reactor of state.reactors) {
    const amount = reactorProduction(reactor, state, from + 1) * elapsed;
    const room = Math.max(0, reactorCapacity(reactor, state) - reactor.stored);
    const accepted = Math.min(room, amount);
    reactor.stored += accepted; produced += accepted;
    reactor.lastSettledAt = to;
  }
  return produced;
}

export function settleProduction(state, now = Date.now(), options = {}) {
  const requestedNow = nowValue(now, state.lastSettledAt || Date.now());
  const previous = finite(state.lastSettledAt, requestedNow);
  if (requestedNow <= previous) return { elapsed: 0, produced: 0, capped: false };
  const rawElapsed = (requestedNow - previous) / 1000;
  const elapsed = Math.min(MAX_OFFLINE_SECONDS, rawElapsed);
  const end = previous + elapsed * 1000;
  let cursor = previous;
  let produced = 0;
  // At most 194 boundaries occur in an eight-hour window. Do not truncate the
  // integration before `end` and then mark the unprocessed time as settled.
  while (cursor < end) {
    const boundary = Math.min(end, nextEventBoundary(state, cursor));
    produced += settleReactorSegment(state, cursor, boundary);
    cursor = boundary;
  }
  addBounded(state, "totalProduction", produced); addBounded(state.stats, "totalSeconds", elapsed); state.lastSettledAt = requestedNow;
  for (const reactor of state.reactors) reactor.lastSettledAt = requestedNow;
  if (options.collect !== false && upgradeLevel(state, "auto-collection") > 0) collectReadyExpeditions(state, requestedNow, { repeat: true });
  return { elapsed, produced, capped: rawElapsed > elapsed + 1e-9 };
}

export function applyOffline(state, now = Date.now()) {
  const result = settleProduction(state, now);
  if (result.capped) addLog(state, "The lab was quiet for more than the eight-hour offline window; older time was not simulated.");
  if (result.produced > 0.01) addLog(state, `While you were away, ${result.produced.toFixed(1)} biomass settled through the reactors.`);
  state.lastSavedAt = Math.max(state.lastSavedAt, actionTime(state, now)); return result;
}

export function harvestReactor(state, reactorId, now = Date.now()) {
  settleProduction(state, now);
  const reactor = state.reactors.find((item) => item.id === reactorId);
  if (!reactor || !Number.isFinite(reactor.stored) || reactor.stored <= 0 || !Number.isFinite(state.credits) || !Number.isFinite(state.lifetimeCredits)) return { ok: false, amount: 0, credits: 0 };
  const amount = reactor.stored; const credits = amount * BIOMASS_TO_CREDITS;
  if (!Number.isFinite(credits) || !Number.isFinite(state.credits + credits) || !Number.isFinite(state.lifetimeCredits + credits)) return { ok: false, amount: 0, credits: 0, reason: "invalid" };
  reactor.stored = 0; awardCredits(state, credits); addBounded(state, "biomassHarvested", amount); addBounded(state.stats, "harvests", 1);
  checkContracts(state); return { ok: true, amount, credits };
}

export function harvestAll(state, now = Date.now()) {
  settleProduction(state, now);
  let credits = 0;
  for (const reactor of state.reactors) {
    if (!Number.isFinite(reactor.stored) || reactor.stored <= 0) continue;
    const amount = reactor.stored; const earned = amount * BIOMASS_TO_CREDITS;
    if (!Number.isFinite(earned)) continue;
    reactor.stored = 0; credits += earned; addBounded(state, "biomassHarvested", amount);
  }
  if (credits > 0) addBounded(state.stats, "harvests", 1);
  awardCredits(state, credits); checkContracts(state); return credits;
}

function addLog(state, message) { state.log.unshift(message); state.log = state.log.slice(0, 12); }
function spend(state, amount) {
  if (!Number.isFinite(amount) || amount < 0 || !Number.isFinite(state.credits) || state.credits < 0 || state.credits > MAX_MONEY || state.credits < amount) return false;
  const remaining = state.credits - amount;
  if (!Number.isFinite(remaining) || remaining < 0) return false;
  state.credits = remaining; return true;
}

export function claimGrant(state) {
  if (state.stats.grants !== 0) return { ok: false, reason: "claimed", amount: 0 };
  if (!Number.isFinite(state.credits) || state.credits < 0 || !Number.isFinite(state.lifetimeCredits)) return { ok: false, reason: "invalid", amount: 0 };
  awardCredits(state, RESEARCH_GRANT); state.stats.grants = 1;
  addLog(state, "The first research grant arrived: +100 credits for the screening program.");
  return { ok: true, amount: RESEARCH_GRANT };
}

function chooseWeighted(items, rng) {
  const total = items.reduce((sum, item) => sum + Math.max(0, item.weight), 0);
  if (total <= 0) return items[0];
  let point = rng() * total;
  for (const item of items) {
    point -= Math.max(0, item.weight);
    if (point <= 0) return item;
  }
  return items[items.length - 1];
}

function discoveryCandidates(state, device, biomeId, snapshot = null) {
  const biome = BIOME_BY_ID[biomeId];
  const definition = DEVICE_BY_ID[device?.type];
  if (!biome || !definition || !deviceCompatibleWithBiome(device, biomeId)) return [];
  const rarePressure = snapshot?.rarity ?? biome.rarityBias + definition.rarity + Math.max(0, (device.level || 1) - 1) * 0.13 + upgradeLevel(state, "rare-culture") * 0.22;
  return biome.pool.map((entry) => {
    const species = SPECIES_BY_ID[entry.speciesId];
    if (!species || !species.biomes.includes(biomeId)) return null;
    const stars = rarityInfo(species.rarity).stars;
    return { speciesId: species.id, rarity: species.rarity, weight: entry.weight * (1 + Math.max(0, rarePressure) * (stars - 1) * 0.2) };
  }).filter(Boolean);
}

export function discoveryOdds(state, device, biomeId, now = Date.now()) {
  const biome = BIOME_BY_ID[biomeId];
  const snapshot = device?.expedition?.biomeId === biomeId ? device.expedition.snapshot
    : biome && DEVICE_BY_ID[device?.type] ? fixedExpeditionSnapshot(state, device, biome, nowValue(now)) : null;
  const candidates = discoveryCandidates(state, device, biomeId, snapshot);
  const total = candidates.reduce((sum, item) => sum + item.weight, 0);
  const odds = candidates.map((item) => ({ ...item, probability: total ? item.weight / total : 0 }));
  const result = odds;
  Object.defineProperties(result, {
    biomeId: { value: biomeId, enumerable: false },
    deviceId: { value: device?.id || null, enumerable: false },
    samples: { value: deviceChambers(device), enumerable: false },
    total: { value: total, enumerable: false },
    byRarity: { value: Object.fromEntries(RARITIES.map((rarity) => [rarity.id, odds.filter((item) => item.rarity === rarity.id).reduce((sum, item) => sum + item.probability, 0)])), enumerable: false },
  });
  return result;
}

function fixedDiscovery(state, device, expedition, now) {
  const snapshot = expedition.snapshot;
  const candidates = discoveryCandidates(state, device, expedition.biomeId, snapshot);
  const fallback = candidates[0] || { speciesId: "arthrospira", rarity: "common", weight: 1 };
  const samples = [];
  for (let lane = 0; lane < snapshot.chambers; lane += 1) {
    const rng = randomFromSeed(`${expedition.seed}:lane:${lane}`);
    const selected = chooseWeighted(candidates.length ? candidates : [fallback], rng) || fallback;
    const species = SPECIES_BY_ID[selected.speciesId];
    const quality = clamp(snapshot.quality + rng() * 0.18 - 0.09, 0, 1);
    const variantChance = clamp(snapshot.variantChance + (species.traits.includes("unusual") ? 0.04 : 0), 0, 0.8);
    const variant = rng() < variantChance;
    samples.push({
      speciesId: species.id, quality, variant, rarity: species.rarity,
      sampleSeed: hashSeed(`${expedition.seed}:lane:${lane}`), lane,
    });
  }
  return {
    speciesId: samples[0].speciesId, quality: samples[0].quality, variant: samples[0].variant,
    rarity: samples[0].rarity, sampleSeed: hashSeed(expedition.seed), samples, resolvedAt: now, revealedAt: now,
  };
}

export function deviceCanRun(device, state = null) {
  if (!device || !DEVICE_BY_ID[device.type] || !device.rackId || !Number.isInteger(device.slot) || device.slot < 0 || device.status !== "idle") return false;
  if (!state) return true;
  const rack = state.racks.find((item) => item.id === device.rackId && item.commissioned);
  return Boolean(rack && device.slot < rackSlotCount(state) && rack.slots[device.slot] === device.id
    && state.racks.reduce((count, item) => count + item.slots.filter((id) => id === device.id).length, 0) === 1);
}

function freeRackSlot(state, preferredRackId = null, preferredSlot = null) {
  const racks = state.racks.filter((rack) => rack.commissioned);
  if (preferredRackId) {
    const rack = racks.find((item) => item.id === preferredRackId);
    if (!rack) return null;
    if (Number.isInteger(preferredSlot) && preferredSlot >= 0 && preferredSlot < rackSlotCount(state) && preferredSlot < rack.slots.length && rack.slots[preferredSlot] === null) return { rack, slot: preferredSlot };
    return null;
  }
  for (const rack of racks) {
    const slot = rack.slots.findIndex((deviceId) => deviceId === null);
    if (slot >= 0 && slot < rackSlotCount(state)) return { rack, slot };
  }
  return null;
}

export function buyDevice(state, type, now = Date.now()) {
  const definition = DEVICE_BY_ID[type];
  if (!validId(type, DEVICE_BY_ID)) return { ok: false, reason: "missing" };
  if (!spend(state, definition.cost)) return { ok: false, reason: "funds", cost: definition.cost };
  const numericIds = state.devices.map((device) => Number(String(device.id).replace("device-", ""))).filter(Number.isInteger);
  const id = `device-${Math.max(0, ...numericIds) + 1}`;
  const device = { id, type, level: 1, rackId: null, slot: null, status: "idle", autoRepeat: false, expedition: null };
  state.devices.push(device);
  const placement = freeRackSlot(state);
  if (placement) {
    placement.rack.slots[placement.slot] = id; device.rackId = placement.rack.id; device.slot = placement.slot;
    addLog(state, `${definition.name} arrived and was seated in ${placement.rack.name}.`);
  } else addLog(state, `${definition.name} arrived in the receiving bay; a rack chamber is needed.`);
  return { ok: true, device };
}

export function installDevice(state, deviceId, rackId = null, slot = null) {
  const device = state.devices.find((item) => item.id === deviceId);
  if (!device) return { ok: false, reason: "missing" };
  if (device.status !== "idle") return { ok: false, reason: "busy" };
  const placement = freeRackSlot(state, rackId, slot);
  if (!placement) return { ok: false, reason: rackId ? "occupied" : "locked" };
  for (const rack of state.racks) rack.slots = rack.slots.map((item) => item === deviceId ? null : item);
  placement.rack.slots[placement.slot] = device.id; device.rackId = placement.rack.id; device.slot = placement.slot;
  addLog(state, `${DEVICE_BY_ID[device.type].name} seated in ${placement.rack.name}.`);
  return { ok: true, rackId: placement.rack.id, slot: placement.slot };
}

export function upgradeDevice(state, deviceId, now = Date.now()) {
  settleProduction(state, now, { collect: false });
  const device = state.devices.find((item) => item.id === deviceId);
  if (!device) return { ok: false, reason: "missing" };
  const definition = DEVICE_BY_ID[device.type];
  if (device.level >= definition.maxLevel) return { ok: false, reason: "max" };
  const cost = deviceUpgradeCost(device);
  if (!spend(state, cost)) return { ok: false, reason: "funds", cost };
  device.level += 1; addLog(state, `${definition.name} tuned to level ${device.level}.`); return { ok: true, cost };
}

function fixedExpeditionSnapshot(state, device, biome, now) {
  const definition = DEVICE_BY_ID[device.type];
  const event = eventAt(state, now);
  const speed = Math.max(0.48, definition.speed * (1 + (device.level - 1) * 0.06) * (1 + upgradeLevel(state, "flow-control") * 0.09) * (event.speed || 1));
  return {
    speed, quality: clamp(0.42 + definition.quality + (device.level - 1) * 0.035 + upgradeLevel(state, "optics") * 0.16 + (event.quality || 0), 0, 1),
    rarity: biome.rarityBias + definition.rarity + (device.level - 1) * 0.13 + upgradeLevel(state, "rare-culture") * 0.22 + (event.rarity || 0),
    chambers: deviceChambers(device), variantChance: upgradeLevel(state, "mutation-analysis") * 0.08,
    eventId: event.id,
  };
}

export function startExpedition(state, deviceId, biomeId, now = Date.now()) {
  const timestamp = actionTime(state, now);
  settleProduction(state, timestamp, { collect: false });
  const device = state.devices.find((item) => item.id === deviceId); const biome = BIOME_BY_ID[biomeId];
  if (!device || !validId(biomeId, BIOME_BY_ID)) return { ok: false, reason: "missing" };
  if (!state.unlockedBiomes.includes(biomeId)) return { ok: false, reason: "biome" };
  if (!deviceCanRun(device, state)) return { ok: false, reason: "device" };
  if (!deviceCompatibleWithBiome(device, biomeId)) return { ok: false, reason: "incompatible" };
  if (!Number.isSafeInteger(state.expeditionCounter) || state.expeditionCounter < 0 || state.expeditionCounter >= MAX_MONEY) return { ok: false, reason: "max" };
  if (!spend(state, biome.expeditionCost)) return { ok: false, reason: "funds", cost: biome.expeditionCost };
  const snapshot = fixedExpeditionSnapshot(state, device, biome, timestamp);
  const duration = Math.max(1_000, Math.round((biome.duration / snapshot.speed) * 1000));
  const expeditionSeed = `${state.seed}:${++state.expeditionCounter}:${device.id}:${biomeId}`;
  device.status = "running";
  device.expedition = { biomeId, seed: expeditionSeed, startedAt: timestamp, endsAt: timestamp + duration, result: null, collected: false, snapshot };
  addBounded(state.stats, "expeditions", 1); addLog(state, `${DEVICE_BY_ID[device.type].name} entered a ${biome.name} survey.`);
  return { ok: true, endsAt: timestamp + duration, duration, seed: expeditionSeed };
}

function resolveReady(state, device, now) {
  if (!device.expedition.result) device.expedition.result = fixedDiscovery(state, device, device.expedition, now);
  device.status = "ready";
}

export function tickExpeditions(state, now = Date.now()) {
  const timestamp = actionTime(state, now);
  settleProduction(state, timestamp, { collect: false });
  const ready = [];
  for (const device of state.devices) {
    if (device.status !== "running" || !device.expedition || device.expedition.endsAt > timestamp) continue;
    resolveReady(state, device, timestamp);
    ready.push(device);
  }
  if (upgradeLevel(state, "auto-collection") > 0) collectReadyExpeditions(state, timestamp, { repeat: true });
  return ready;
}

function recordSample(state, sample, now) {
  const species = SPECIES_BY_ID[sample.speciesId];
  if (!species) return null;
  if (!state.discovered.includes(species.id)) state.discovered.push(species.id);
  const entry = state.collection[species.id] || { count: 0, variants: 0, bestQuality: 0 };
  addBounded(entry, "count", 1, 999_999); entry.bestQuality = Math.max(entry.bestQuality, clamp(finite(sample.quality, 0), 0, 1));
  if (sample.variant) addBounded(entry, "variants", 1, 999);
  state.collection[species.id] = entry;
  addBounded(state.stats, "discoveries", 1); addBounded(state.stats, "catches", 1); state.stats.highestRarity = Math.max(state.stats.highestRarity, rarityInfo(species.rarity).stars);
  if (rarityInfo(species.rarity).stars >= 3) addBounded(state.stats, "rareFinds", 1);
  if (sample.variant) addBounded(state.stats, "variants", 1);
  return species;
}

function collectReadyDirect(state, device, now, options = {}) {
  if (!device || device.status !== "ready" || !device.expedition?.result || device.expedition.collected) return { ok: false, reason: "not-ready" };
  const repeatBiomeId = device.expedition.biomeId;
  const result = device.expedition.result;
  const samples = Array.isArray(result.samples) && result.samples.length ? result.samples : [{ speciesId: result.speciesId, quality: result.quality, variant: result.variant, rarity: result.rarity }];
  const found = [];
  for (const sample of samples) {
    const species = recordSample(state, sample, now);
    if (species) found.push(species);
  }
  if (!found.length) return { ok: false, reason: "invalid-result" };
  device.expedition.collected = true; addBounded(state.stats, "completedExpeditions", 1);
  const first = samples[0];
  state.lastDiscovery = { ...first, speciesId: first.speciesId, collectedAt: now, samples: samples.map((sample) => ({ ...sample })) };
  device.status = "idle"; device.expedition = null;
  const names = [...new Set(found.map((species) => species.short))];
  addLog(state, `${names.join(", ")} added to the living archive${found.some((species, index) => samples[index]?.variant) ? " as a rare variant" : ""}.`);
  checkContracts(state);
  const output = { ...state.lastDiscovery, speciesId: first.speciesId, quality: first.quality, variant: first.variant };
  if (options.repeat && device.autoRepeat && upgradeLevel(state, "lab-automation") > 0) {
    if (repeatBiomeId && BIOME_BY_ID[repeatBiomeId]) startExpedition(state, device.id, repeatBiomeId, now);
  }
  return { ok: true, result: output, samples: found.map((species, index) => ({ speciesId: species.id, ...samples[index] })) };
}

export function collectExpedition(state, deviceId, now = Date.now()) {
  const timestamp = actionTime(state, now);
  settleProduction(state, timestamp, { collect: false });
  const device = state.devices.find((item) => item.id === deviceId);
  if (!device || device.status !== "ready") {
    // A single bounded readiness pass preserves the old API's convenience while
    // avoiding the former tick -> collect -> tick recursion.
    if (device && device.status === "running" && device.expedition?.endsAt <= timestamp) {
      resolveReady(state, device, timestamp);
    }
  }
  return collectReadyDirect(state, device, timestamp, { repeat: upgradeLevel(state, "lab-automation") > 0 });
}

export function collectReadyExpeditions(state, now = Date.now(), options = {}) {
  const timestamp = actionTime(state, now);
  settleProduction(state, timestamp, { collect: false });
  let count = 0;
  for (const device of state.devices) {
    if (device.status === "running" && device.expedition?.endsAt <= timestamp) resolveReady(state, device, timestamp);
  }
  const ready = state.devices.filter((device) => device.status === "ready");
  for (const device of ready) {
    const result = collectReadyDirect(state, device, timestamp, { repeat: options.repeat === true });
    if (result.ok) count += 1;
  }
  return count;
}

export function unlockBiome(state, biomeId, now = Date.now()) {
  const biome = BIOME_BY_ID[biomeId];
  if (!biome || state.unlockedBiomes.includes(biomeId)) return { ok: false, reason: "unlocked" };
  const progress = researchProgress(state);
  if (progress.points < biome.requiredResearch) return { ok: false, reason: "research", required: biome.requiredResearch, progress: progress.points };
  if (biome.requiredMilestones.some((id) => !progress.milestones.find((milestone) => milestone.id === id)?.complete)) return { ok: false, reason: "milestone", required: biome.requiredMilestones };
  settleProduction(state, now, { collect: false });
  if (!spend(state, biome.unlockCost)) return { ok: false, reason: "funds", cost: biome.unlockCost };
  state.unlockedBiomes.push(biomeId); state.activeBiome = biomeId; addLog(state, `${biome.name} was added to the field atlas.`); return { ok: true };
}

export function buyReactor(state, tierId, now = Date.now()) {
  const tier = REACTOR_BY_ID[tierId];
  if (!validId(tierId, REACTOR_BY_ID) || tier.cost <= 0 || state.reactors.some((item) => item.tier === tierId)) return { ok: false, reason: "unavailable" };
  if (unlockedResearch(state) < tier.unlockResearch) return { ok: false, reason: "research", required: tier.unlockResearch };
  settleProduction(state, now, { collect: false });
  if (!spend(state, tier.cost)) return { ok: false, reason: "funds", cost: tier.cost };
  const ids = state.reactors.map((reactor) => Number(String(reactor.id).replace("reactor-", ""))).filter(Number.isInteger);
  const reactor = { id: `reactor-${Math.max(0, ...ids) + 1}`, tier: tierId, level: 1, environment: defaultReactorEnvironment(tierId), slots: Array(tier.slots).fill(null), stored: 0, lastSettledAt: state.lastSettledAt };
  state.reactors.push(reactor); state.selectedReactor = reactor.id; addLog(state, `${tier.name} joined the cultivation room.`); return { ok: true, reactor };
}

export function upgradeReactor(state, reactorId, now = Date.now()) {
  settleProduction(state, actionTime(state, now), { collect: false });
  const reactor = state.reactors.find((item) => item.id === reactorId);
  if (!reactor || reactor.level >= 10) return { ok: false, reason: "max" };
  const cost = reactorUpgradeCost(reactor);
  if (!spend(state, cost)) return { ok: false, reason: "funds", cost };
  reactor.level += 1; addLog(state, `${REACTOR_BY_ID[reactor.tier].name} efficiency rose to level ${reactor.level}.`); return { ok: true, cost };
}

export function assignSpecies(state, reactorId, slot, speciesId, now = Date.now()) {
  const reactor = state.reactors.find((item) => item.id === reactorId); const species = SPECIES_BY_ID[speciesId];
  if (!reactor || !species || !state.discovered.includes(speciesId) || !Number.isInteger(slot) || slot < 0 || slot >= REACTOR_BY_ID[reactor.tier].slots || slot >= reactor.slots.length) return { ok: false, reason: "invalid" };
  if (!speciesCompatibleWithReactor(speciesId, reactor.tier)) return { ok: false, reason: "incompatible" };
  if (reactor.slots.some((id, index) => index !== slot && id === speciesId)) return { ok: false, reason: "duplicate" };
  settleProduction(state, actionTime(state, now), { collect: false }); reactor.slots[slot] = speciesId;
  addLog(state, `${species.short} transferred into ${REACTOR_BY_ID[reactor.tier].name}.`); return { ok: true };
}

export function setReactorEnvironment(state, reactorId, environment, now = Date.now()) {
  const reactor = state.reactors.find((item) => item.id === reactorId);
  if (!reactor) return { ok: false, reason: "missing" };
  if (!validId(environment, ENVIRONMENT_BY_ID)) return { ok: false, reason: "environment" };
  settleProduction(state, actionTime(state, now), { collect: false });
  reactor.environment = environment;
  addLog(state, `${REACTOR_BY_ID[reactor.tier].name} shifted to ${ENVIRONMENT_BY_ID[environment].name} conditions.`);
  return { ok: true, environment };
}

export function clearReactorSlot(state, reactorId, slot, now = Date.now()) {
  const reactor = state.reactors.find((item) => item.id === reactorId);
  if (!reactor || !Number.isInteger(slot) || slot < 0 || slot >= reactor.slots.length) return { ok: false };
  settleProduction(state, actionTime(state, now), { collect: false }); reactor.slots[slot] = null; return { ok: true };
}

export function buyUpgrade(state, id, now = Date.now()) {
  const upgrade = UPGRADE_BY_ID[id]; const level = upgradeLevel(state, id);
  if (!validId(id, UPGRADE_BY_ID) || level >= upgrade.max) return { ok: false, reason: "max" };
  settleProduction(state, actionTime(state, now), { collect: false });
  const cost = upgradeCost(id, level);
  if (!spend(state, cost)) return { ok: false, reason: "funds", cost };
  state.upgrades[id] = level + 1;
  if (id === "chambers") syncInfrastructure(state);
  if (id === "third-rack" && state.upgrades[id] === 1) {
    const rackNumber = state.racks.length + 1;
    state.racks.push({ id: `rack-${rackNumber}`, name: rackNumber === 3 ? "East Growth Rack" : `Rack ${rackNumber}`, slots: Array(rackSlotCount(state)).fill(null), commissioned: true });
  }
  addLog(state, `${upgrade.name} reached level ${level + 1}.`); checkContracts(state); return { ok: true, cost };
}

export function setDeviceAutoRepeat(state, deviceId, enabled = true) {
  const device = state.devices.find((item) => item.id === deviceId);
  if (!device) return { ok: false, reason: "missing" };
  device.autoRepeat = enabled === true; return { ok: true, autoRepeat: device.autoRepeat };
}

export function checkContracts(state) {
  let claimed = 0;
  while (claimed < CONTRACTS.length) {
    const pointer = CONTRACTS.findIndex((item) => item.id === state.contractId && !state.claimedContracts.includes(item.id));
    const contract = pointer >= 0 ? CONTRACTS[pointer] : CONTRACTS.find((item) => !state.claimedContracts.includes(item.id));
    if (!contract || !contract.check(state)) break;
    state.claimedContracts.push(contract.id); awardCredits(state, contract.reward); addBounded(state.stats, "contracts", 1); claimed += 1;
    const next = CONTRACTS.find((item) => !state.claimedContracts.includes(item.id));
    state.contractId = next?.id || contract.id; addLog(state, `Research contract complete: ${contract.name}. +${contract.reward.toLocaleString()} credits.`);
  }
  return claimed > 0;
}

export function tick(state, now = Date.now()) {
  const timestamp = nowValue(now);
  const production = settleProduction(state, timestamp);
  const ready = tickExpeditions(state, timestamp);
  checkContracts(state);
  return { ...production, ready, event: eventFor(state, timestamp), rate: calculateTotalRate(state, timestamp) };
}

export function nextObjective(state) {
  const contract = CONTRACTS.find((item) => item.id === state.contractId && !state.claimedContracts.includes(item.id)) || CONTRACTS.find((item) => !state.claimedContracts.includes(item.id));
  if (contract) return { title: contract.name, detail: contract.description, reward: contract.reward };
  const nextBiome = BIOMES.find((item) => !state.unlockedBiomes.includes(item.id));
  if (nextBiome) return { title: `Survey ${nextBiome.name}`, detail: `${nextBiome.unlockCost.toLocaleString()} credits · research ${nextBiome.requiredResearch}`, reward: 0 };
  return { title: "Tune the living archive", detail: "Improve a reactor or search for a five-star variant.", reward: 0 };
}

export function formatNumber(value, digits = 1) {
  const number = Number(value) || 0;
  if (Math.abs(number) >= 1_000_000) return `${(number / 1_000_000).toFixed(digits)}m`;
  if (Math.abs(number) >= 1_000) return `${(number / 1_000).toFixed(digits)}k`;
  return number.toFixed(Math.abs(number) < 10 ? digits : 0);
}
