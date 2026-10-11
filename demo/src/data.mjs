// Original fictional expedition. Traits are game rules, not biological predictions.
export const VERSION = 1;
export const DT = 1 / 60;
export const W = 2400, H = 1100, TILE = 40;
export const BIOMES = [
  {id:'estuary',name:'Verdant Estuary',type:'wetland',col:0,row:0,color:'#80cfa3',sky:['#142e37','#6b9390'],soil:'#233f39',water:780,temp:24,salt:5,ph:7.8,light:.8,nutrients:.9,pressure:1,current:.1,flora:'reeds',group:'Chlorophyte',morph:'colony',clue:'Golden droplets gather on the reed roots.',story:'Your expedition begins where a river becomes the sea.'},
  {id:'river',name:'Glasswater Run',type:'river',col:1,row:0,color:'#9ac8d6',sky:['#203d4b','#9eb9af'],soil:'#34494c',water:750,temp:16,salt:0,ph:7.2,light:.7,nutrients:.6,pressure:1,current:.65,flora:'willow',group:'Diatom',morph:'diatom',clue:'Amber films cling to stones facing the current.',story:'An ancient watershed carries evidence from the mountains.'},
  {id:'dunes',name:'Amber Dunes',type:'desert',col:2,row:0,color:'#e6bc7e',sky:['#553e50','#d1a77e'],soil:'#80604c',water:0,temp:38,salt:14,ph:8.2,light:1,nutrients:.2,pressure:1,current:0,flora:'grass',group:'Cyanobacterium',morph:'filament',clue:'Dormant filaments wake in hidden rain pockets.',story:'The desert is not empty. It is waiting for water.'},
  {id:'aurora',name:'Aurora Shelf',type:'polar',col:3,row:0,color:'#b0e5e6',sky:['#142b48','#587e96'],soil:'#74999f',water:760,temp:-2,salt:32,ph:8.1,light:.4,nutrients:.4,pressure:2,current:.2,flora:'ice',gate:'thermal',group:'Chlorophyte',morph:'round',clue:'Red pigments protect the organisms trapped inside ice.',story:'A living mosaic glows beneath the oldest ice.'},
  {id:'roots',name:'Rootbound Grotto',type:'forest',col:0,row:1,color:'#acd699',sky:['#101d27','#3f6556'],soil:'#303d35',water:810,temp:19,salt:0,ph:6.5,light:.25,nutrients:.8,pressure:1,current:0,flora:'roots',group:'Desmid',morph:'star',clue:'Symmetric cells flourish in the quiet root pools.',story:'A forest above. A second forest beneath.'},
  {id:'lake',name:'Mirrorwater Lake',type:'lake',col:1,row:1,color:'#7bc5cf',sky:['#163149','#4a7c88'],soil:'#2a4549',water:560,temp:12,salt:0,ph:7.5,light:.45,nutrients:.7,pressure:3,current:.1,flora:'kelp',group:'Chlorophyte',morph:'round',clue:'Different depths shelter different pigment strategies.',story:'An overturned research buoy points toward a flooded vault.'},
  {id:'salt',name:'Saltglass Basin',type:'saline',col:2,row:1,color:'#e2abc0',sky:['#3c304f','#b39aab'],soil:'#796471',water:690,temp:29,salt:110,ph:9.1,light:.95,nutrients:.3,pressure:1,current:0,flora:'crystal',group:'Chlorophyte',morph:'oval',clue:'Orange cells persist where salt excludes their rivals.',story:'Every crystal holds a record of an older shoreline.'},
  {id:'frost',name:'Frostvault',type:'ice cave',col:3,row:1,color:'#87c9eb',sky:['#0a1c32','#2d546f'],soil:'#456979',water:710,temp:1,salt:12,ph:7.4,light:.12,nutrients:.3,pressure:4,current:.2,flora:'ice',gate:'thermal',group:'Diatom',morph:'diatom',clue:'Blue light reaches the thin channels inside the glacier.',story:'Ice folds over a station that never sent its final report.'},
  {id:'vault',name:'The Lost Observatory',type:'laboratory',col:0,row:2,color:'#b9d7bd',sky:['#111d29','#30444c'],soil:'#37434a',water:0,temp:20,salt:2,ph:7,light:.2,nutrients:.65,pressure:1,current:0,flora:'machine',group:'Euglenoid',morph:'oval',clue:'A surviving culture escaped into the condensation channels.',story:'The instruments are silent. The cultures are not.'},
  {id:'kelp',name:'Kelp Cathedral',type:'ocean',col:1,row:2,color:'#7de0c4',sky:['#12323f','#266f6b'],soil:'#264742',water:360,temp:15,salt:35,ph:8.1,light:.6,nutrients:.65,pressure:5,current:.4,flora:'kelp',gate:'dive',group:'Haptophyte',morph:'star',clue:'Calcified stars drift between the kelp fronds.',story:'Sunlight descends through the canopy of a submerged forest.'},
  {id:'trench',name:'Midnight Trench',type:'deep ocean',col:2,row:2,color:'#8f9bea',sky:['#070e22','#162f47'],soil:'#273644',water:200,temp:3,salt:35,ph:7.8,light:.02,nutrients:.8,pressure:120,current:.25,flora:'vent',gate:'pressure',group:'Diatom',morph:'diatom',clue:'Marine snow carries rare cells into the abyss.',story:'Follow the cold light. Something here is still adapting.'},
  {id:'ember',name:'Ember Caldera',type:'volcanic',col:3,row:2,color:'#edaa7e',sky:['#271d32','#78514c'],soil:'#3d343a',water:740,temp:54,salt:8,ph:4.8,light:.5,nutrients:.8,pressure:2,current:.1,flora:'vent',gate:'thermal',group:'Cyanobacterium',morph:'filament',clue:'Mineral-rich springs support unusually resilient mats.',story:'Where the earth opens, another frontier begins.'},
];
export const DEVICES = {
  sampler:{name:'Field Sampler',role:'Collects a local habitat sample automatically.',cost:35,materials:6,seconds:14,power:2,capacity:1,isolation:0,contamination:.15,mode:'sample',unlock:null},
  sorter:{name:'Droplet Sorter',role:'Turns a stored sample into a candidate culture.',cost:45,materials:8,seconds:6,power:3,capacity:1,isolation:.45,contamination:.12,mode:'sort',unlock:null},
  isolator:{name:'Single-cell Isolator',role:'Purifies candidates; contamination can require another cycle.',cost:65,materials:10,seconds:7,power:4,capacity:1,isolation:.85,contamination:.1,mode:'isolate',unlock:null},
  fluorescence:{name:'Fluorescence Chip',role:'Characterizes isolated strains and awards research data.',cost:65,materials:10,seconds:8,power:4,capacity:1,isolation:0,contamination:.03,mode:'analyze',unlock:null},
  screening:{name:'Parallel Screening Array',role:'Processes three sample compartments in parallel.',cost:130,materials:18,seconds:10,power:9,capacity:3,isolation:.6,contamination:.15,mode:'sort',unlock:'automation'},
  edna:{name:'Environmental DNA Analyzer',role:'Provides evidence without claiming a characterized isolate.',cost:90,materials:12,seconds:9,power:5,capacity:1,isolation:0,contamination:.04,mode:'evidence',unlock:'imaging'},
  adaptive:{name:'Adaptive Discovery Array',role:'Uses research data to prioritize unusual candidates.',cost:180,materials:20,seconds:11,power:8,capacity:1,isolation:.7,contamination:.05,mode:'adaptive',unlock:'automation'},
  drone:{name:'Autonomous Sampling Drone',role:'Explores nearby accessible terrain and returns samples.',cost:145,materials:20,seconds:18,power:6,capacity:2,isolation:0,contamination:.2,mode:'drone',unlock:'automation'},
  pressure:{name:'Pressure Module',role:'Protects instruments in high-pressure marine habitats.',cost:90,materials:14,seconds:0,power:0,capacity:0,isolation:0,contamination:0,mode:'support',unlock:'pressure'},
  extreme:{name:'Extremophile Module',role:'Protects instruments from heat, frost and hypersalinity.',cost:80,materials:12,seconds:0,power:0,capacity:0,isolation:0,contamination:0,mode:'support',unlock:'thermal'},
  mobile:{name:'Mobile Research Laboratory',role:'Completes sample-to-characterization in one field cycle.',cost:240,materials:30,seconds:24,power:12,capacity:1,isolation:.95,contamination:.02,mode:'complete',unlock:'imaging'},
  station:{name:'Remote Research Station',role:'Provides long-term power, repair and storage at a habitat.',cost:160,materials:22,seconds:15,power:0,capacity:0,isolation:0,contamination:0,mode:'station',unlock:'automation'},
};
export const TECH = {
  dive:{name:'Extended dive apparatus',branch:'Exploration',cost:45,data:6,materials:6,description:'Triples oxygen endurance and opens the Kelp Cathedral.'},
  tether:{name:'Rootline climbing rig',branch:'Exploration',cost:55,data:8,materials:8,description:'Adds an air jump and faster climbing to reach high habitats.'},
  drill:{name:'Powered sediment drill',branch:'Microfluidics',cost:50,data:8,materials:10,description:'Breaks mineral seals to reveal hidden chambers and rare samples.'},
  pressure:{name:'Pressure-resistant suit',branch:'Exploration',cost:95,data:16,materials:14,requires:'dive',description:'Opens the Midnight Trench and its pressure module.'},
  thermal:{name:'Environmental protection',branch:'Ecology',cost:65,data:10,materials:10,description:'Opens polar and volcanic routes.'},
  scanner:{name:'Multispectral scanner',branch:'Ecology',cost:45,data:6,materials:5,description:'Doubles scan range and increases unusual organism chance.'},
  storage:{name:'Expedition sample pack',branch:'Logistics',cost:35,data:4,materials:5,description:'Doubles field sample capacity from 8 to 16.'},
  imaging:{name:'Advanced imaging',branch:'Analytical chemistry',cost:80,data:12,materials:10,description:'Unlocks eDNA evidence and the mobile laboratory.'},
  automation:{name:'Distributed instruments',branch:'Automation',cost:90,data:14,materials:12,description:'Unlocks drones, screening arrays and remote stations.'},
  efficiency:{name:'Laminar flow optimization',branch:'Microfluidics',cost:60,data:8,materials:8,description:'All processing cycles run 30% faster with less contamination.'},
};
export const CLADES = ['diatom','round','filament','star','oval','colony'];
export const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
export function hash(text) { let h=2166136261; for(const c of String(text)) h=Math.imul(h^c.charCodeAt(0),16777619); return h>>>0; }
export function rng(seed) { let x=hash(seed); return ()=>{x+=0x6D2B79F5;let t=x;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;}; }
export const region = id => BIOMES.find(b=>b.id===id);
