import { CFG } from "./config.js";

/* fx(): fold evolution traits + reactor upgrades into live multipliers */
export function fx(S) {
  const m = {
    lightGain: 1, nutrientGain: 1, carbonGain: 1, epGain: 1,
    dmgTaken: 1, speed: 1, divideCost: 1, drain: 1,
    buildingDiscount: 1, grazerFlee: 0, sharedEnergy: 0,
    tempResist: 0, phStable: 0,
  };
  for (const id of S.evo) {
    const t = CFG.evo.find((e) => e.id === id);
    if (!t) continue;
    for (const k in t.fx) {
      if (k === "grazerFlee") m[k] = t.fx[k];
      else if (typeof t.fx[k] === "number") m[k] *= t.fx[k];
    }
  }
  const up = (id) => S.upgrades[id] || 0;
  m.lightUpgrade = CFG.upgrades.led.fx[Math.min(up("led"), 2)] ?? 1;
  m.carbonUpgrade = CFG.upgrades.co2.fx[Math.min(up("co2"), 2)] ?? 1;
  m.mixUpgrade = CFG.upgrades.mix.fx[Math.min(up("mix"), 2)] ?? 1;
  m.sensorUpgrade = CFG.upgrades.sensor.fx[Math.min(up("sensor"), 2)] ?? 1;
  m.harvestRate = [0, ...CFG.upgrades.harvest.fx][Math.min(up("harvest"), 3)];
  return m;
}

export function stageFor(pop) {
  let s = 0;
  for (let i = 0; i < CFG.stages.length; i++) if (pop >= CFG.stages[i].pop) s = i;
  return s;
}
