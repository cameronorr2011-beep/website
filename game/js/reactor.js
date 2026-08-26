import { CFG } from "./config.js";

/* Reactor view state + upgrades + lab experiments.
   The reactor's dials shape the microscopic world (light, carbon availability). */
export function createReactor(S) {
  function level(id) { return S.upgrades[id] || 0; }

  function buyUpgrade(id) {
    const u = CFG.upgrades[id];
    const lvl = level(id);
    if (lvl >= u.costs.length) return false;
    const cost = u.costs[lvl];
    if (S.biomass < cost) return false;
    S.biomass -= cost;
    S.upgrades[id] = lvl + 1;
    return true;
  }

  /* derived readouts for the reactor panel & view */
  function readouts() {
    const r = S.reactor;
    const lightEff = (r.light / 100) * (S.upgrades.led ? CFG.upgrades.led.fx[S.upgrades.led - 1] : 1);
    const growth = clamp(lightEff * (0.5 + (r.co2 / 100) * 0.6) * tempFactor(r.temp) * phFactor(r.ph), 0, 2.4);
    return {
      density: clamp(S.biomass / 120, 0, 1),
      growth,
      oxygen: clamp(growth * 0.8, 0, 1),
      contamination: clamp((r.ph < 9 ? 0.5 : 0.08) + (r.temp > 37 ? 0.3 : 0) + (r.light > 85 ? 0.15 : 0), 0, 1),
      health: clamp(1 - Math.abs(r.temp - 33) / 25 - Math.abs(r.ph - 10) / 8, 0, 1),
    };
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const tempFactor = (t) => t < 20 || t > 38 ? 0.35 : 1 - Math.abs(t - 34) / 40;
  const phFactor = (p) => p < 8 || p > 11 ? 0.3 : 1 - Math.abs(p - 10) / 12;

  return { level, buyUpgrade, readouts };
}
