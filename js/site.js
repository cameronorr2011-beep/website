"use strict";
/* ---------- data ---------- */
var STACK = [
  {label:"Culture", index:"01", title:"The organism is the product surface.", text:"An 18 L borosilicate column keeps Arthrospira in a warm, alkaline, carbonate-rich medium. Geometry, light path and sparger are designed together because biology notices every shortcut.", spec:"18 L · 6 cm optical path · 30–36 °C"},
  {label:"Sense", index:"02", title:"Six channels describe the water. Vision describes the cells.", text:"pH, temperature, wall light, OD₇₅₀, dissolved oxygen and conductivity stream into the controller. A camera and edge TPU classify intact helices, fragments and anything that is not spirulina.", spec:"6 sensors · INT8 YOLO · local inference"},
  {label:"Twin", index:"03", title:"A mathematical culture runs beside the living one.", text:"Droop cell quotas, Steele's light curve and Beer-Lambert self-shading forecast the next 72 hours. Every proposed dose is simulated before the physical culture sees it.", spec:"Physics-first · 72 h horizon · counterfactuals"},
  {label:"Edge brain", index:"04", title:"The Pi 5 thinks locally. The Coral sees locally.", text:"A Raspberry Pi 5 runs telemetry, the physics twin and a deterministic local policy engine. A small, fully quantized YOLO model runs on the Coral USB Accelerator for experimental visual flags. Neither network access nor another computer is required at runtime.", spec:"Pi 5 CPU · Coral TPU · local-first"},
  {label:"Control", index:"05", title:"Intelligence proposes. Hardware decides.", text:"A deterministic gate checks mass, pH, temperature and duty cycle. The ESP32 owns the pumps and keeps independent clamps in firmware. A physical e-stop sits underneath the entire software stack.", spec:"Fail closed · dual gate · wet-side isolation"},
  {label:"Mesh", index:"06", title:"Every vessel can improve without surrendering its data.", text:"Algaephyte nodes exchange fitted twin parameters over MQTT when a network is available. Images and raw traces stay on the instrument. Incoming values are bounded and checked before they influence a live culture.", spec:"Optional MQTT · federated parameters · no raw images"}
];
var SIGNALS = [
  {k:"pH", h:"The carbonate pool, from outside", p:"Not the goal — the symptom. pH is what the bicarbonate/carbonate pool looks like from the outside. A culture at pH 10.6 with high alkalinity is comfortable; the same pH with a depleted pool is starving."},
  {k:"Temperature", h:"The growth band", p:"Arthrospira wants ~30–36 °C. Below that, division slows. Past ~42 °C you are cooking it. The twin keeps the bell-shaped response in mind, not just a setpoint."},
  {k:"Light", h:"Steele, not 'as much as the LED will do'", p:"Growth rises to an optimum irradiance and falls again under photoinhibition. A single wall sensor measures the jacket; the twin integrates through every radial shell."},
  {k:"OD₇₅₀", h:"Biomass, bluntly", p:"Optical density at 750 nm is the workhorse biomass proxy — and it is colour-blind. Below ~0.05 it cannot see the culture yet; a healthy helix and a contaminant can share the number."},
  {k:"Dissolved oxygen", h:"When photosynthesis poisons itself", p:"Oxygen supersaturation through the afternoon is photosynthesis turning on itself. High DO with high light is the classic yellowing recipe. The twin treats it as a state variable, not a footnote."},
  {k:"Conductivity / TDS", h:"Ionic strength, standing in for the pool", p:"A cheap stand-in for the total ionic environment. Combined with pH and temperature it lets the twin estimate the carbonate system — the thing actually feeding the cell."}
];
var GATES = [
  {n:"GATE 01", h:"Arithmetic, not opinion", p:"Hard limits on dose mass, pump runtime, pH band, temperature ceiling and actuation frequency. A proposal outside them is rejected and logged before it reaches anything wet."},
  {n:"GATE 02", h:"The twin runs the counterfactual", p:"The surviving proposal is simulated. If the forecast stalls growth, crosses a pH boundary, or spikes dissolved oxygen, it is blocked. The model answers in the same units you dose in."},
  {n:"GATE 03", h:"Firmware owns the MOSFETs", p:"The ESP32 has its own max-duty table in EEPROM, a watchdog that opens the pumps if the Pi stops heartbeating, and a physical mushroom e-stop that does not ask anyone's opinion."}
];
var LOOP = [
  ["1 Sense","MCP analog front-end + I²C + camera"],
  ["2 Model","Droop · Steele · Beer-Lambert"],
  ["3 Propose","Rules, or a planner with no authority"],
  ["4 Verify","Limits, then counterfactual"],
  ["5 Act","ESP32 MOSFETs, or nothing"],
  ["6 Publish","MQTT parameter vector, or LWT"]
];
var TICKS = ["pH 10.14","35.1 °C","210 µmol","OD₇₅₀ 0.64","DO 148%","TDS 18.2 ppt","Twin +72 h","TPU 21 ms","MQTT QoS 1","Fail closed","Arthrospira platensis","18 L column"];

var FAQS = [
  {q:"What is Algaephyte, in one sentence?", a:"An 18-litre photobioreactor with a digital twin, a two-watt Edge TPU, and pumps that are not allowed to move until a physics model and a firmware clamp both agree."},
  {q:"What's actually 'intelligent' about it?", a:"A control loop: sense, simulate, propose, verify, act. It senses six channels and a camera, forecasts growth with a physics twin, proposes a dose or a light change, and then waits for permission from gates that do not care about its confidence."},
  {q:"Is a language model in charge of the culture?", a:"No. A planner may propose. Every proposal is a request. Deterministic limits, a Droop/Steele twin, firmware duty clamps, and a mushroom e-stop all sit between that request and the liquid."},
  {q:"Why a Coral TPU instead of just the Pi?", a:"YOLOv8n at 288 px is uncomfortable on a Pi CPU if you also want to integrate a twin at a few hertz. The Coral does the vision in ~20 ms at ~2 W. The Pi keeps the physics. If the TPU falls off USB, the controller keeps running, just blind."},
  {q:"What does the YOLO model actually look at?", a:"Helices, fragments, and not-spirulina. We use it as a contamination and stress signal. It cannot open a pump. It can hold one."},
  {q:"What is Algaephyte Mesh?", a:"A federated mesh over MQTT. Nodes share fitted twin parameters — μ_max, I_opt, half-saturation constants — never images, never raw traces, never location. Incoming values are bounds-checked before they touch a live twin."},
  {q:"Why MQTT?", a:"Because a greenhouse on a flaky 4G stick is the real deployment, and MQTT's last-will, retained messages, and 48-byte payloads still work there. We are not bored of it yet."},
  {q:"Can I run a different alga?", a:"Version one is Arthrospira platensis, on purpose. Alkaline medium is free biosecurity and the filaments are large enough to see. Other strains need other twins and other vision classes. Later."},
  {q:"How much does a column actually produce?", a:"On the order of 0.10–0.16 g dry biomass per litre per day when it is healthy. For 18 L that is about 2 g a day, ~1.4 g of protein, ~4 g of CO₂ fixed. We do not round that up."},
  {q:"What happens if the internet dies?", a:"The Pi falls back to a rule-based strategy. Pumps remain clamped. The TPU, if present, still sees. The mesh waits. The culture should not notice."},
  {q:"Is this open source?", a:"The biological models and technical reasoning are published for scrutiny. Algaephyte itself is maintained as an integrated hardware and software platform. Research and validation partners can request deeper implementation access."},
  {q:"Who is behind this?", a:"Orr Biologicals builds full-stack biological infrastructure: cultivation hardware, embedded control, edge vision, physical models and distributed learning in one system. Contact service@orrbiologicals.com."},
  {q:"Can I buy one?", a:"Algaephyte is entering controlled pilot deployments. Use the deployment form or email service@orrbiologicals.com with your location, vessel requirement and cultivation objective."},
  {q:"Does it work in a bedroom?", a:"It works anywhere you can keep ~30–36 °C, ventilate a little air, and not knock the vessel over. It does not work in a sealed cupboard, which we say from measurement, not vibe."},
  {q:"What are the six sensors?", a:"pH, temperature, light at the wall, optical density at 750 nm, dissolved oxygen, and conductivity/TDS. Analog through a proper front-end, not a miracle module from a marketplace listing."},
  {q:"Why fail closed?", a:"Because a pump that does nothing is almost always safer than a pump that does the wrong thing quickly. The alkali pump in particular."}
];

var ISSUES = [
  {s:"The culture went yellow-green overnight", likely:"Nitrogen limitation, or bleach from an over-bright jacket", sev:"mid", body:[
    "Yellowing is two different illnesses that happen to share a colour. In nitrogen limitation, chlorophyll is scavenged, filaments pale from the inside, and the YOLO hue histogram drifts before OD does. In photo-bleaching, the outer shell looks cooked — fragments up, DO high, light historically stupid. Check the photoperiod log and the nitrate quota in the twin before you dose anything.",
    ["Do this in order","1. Look at fragment fraction and DO together. High DO + high light + yellow jacket = dim the panel 30% and increase sparging. Wait two hours. 2. If DO is ordinary and the yellowing is uniform, the twin's nitrogen quota is probably against Q_min. Dose nitrate at the conservative recipe, not 'until it looks right'. 3. If filaments are short and there are non-spirulina boxes, this is not yellowing, this is a crash. See contamination."],
    ["aside","Do not add iron because the internet said so. Iron deficiency is real and also not the most likely thing that happened to you overnight."]]},
  {s:"pH walked above 11 and kept going", likely:"Carbon pool empty; photosynthesis still running", sev:"high", body:[
    "This is the classic unsupervised failure. Growth ate the bicarbonate, pH climbed, the probe reported the climb, and nobody restored the pool. Above ~11 the cells are not dead yet but they are not happy, and a large corrective dump of acid or of bicarbonate will make it worse.",
    "Algaephyte should have proposed a staged NaHCO₃ dose hours ago. If it did not, the pH probe is drifting or the alkali pump is dry. If you are intervening by hand: stop lighting, keep air gentle, add bicarbonate in 0.5 g/L increments an hour apart, never as a slug. Recalibrate the probe against two buffers once the culture is stable. Then ask why the gate did not fire — that log is the actual bug."]},
  {s:"Inoculated three days ago, OD has not moved", likely:"Inoculum too thin, temperature off, or the compensation point", sev:"low", body:[
    "Arthrospira is not magic. A pale inoculum in a full 18 L at 22 °C under a desk lamp will sit there looking like pond water until you give up. Check temperature first — we want ~30–36 °C. Then light at the wall, not at the LED. Then whether you actually added a carbon source. Then whether the inoculum was alive (a cheap microscope, or the camera, looking for motile helices).",
    "If the twin's forecast is flat, believe it. It is usually saying one of: I_avg below compensation, T too low, or X so small that OD cannot see it yet. In the last case, wait. OD₇₅₀ is a blunt instrument below ~0.05."]},
  {s:"Foam at the headspace, then the green dropped out", likely:"Lysis, or a surfactant you introduced", sev:"high", body:[
    "A little foam on a vigorously sparged column is mundane. A sudden head of foam with falling OD is lysing cells. Causes we have actually seen: a bleach residual in a 'clean' vessel, a temperature spike past 42 °C when a heater stuck, and one memorable case of dish soap from a rinse that was not a rinse.",
    "Stop dosing. Reduce air until the head collapses. If the camera still sees helices, you may keep a remnant and recover; dilute with fresh medium if you have it. If the field is debris, compost the run, wash with dilute acid then plenty of water, and do not skip the rinse you skipped last time."]},
  {s:"pH or OD disagrees with a handheld meter", likely:"Calibration, fouling, or a reference junction that has given up", sev:"mid", body:[
    "pH probes in alkaline, warm, bubbling medium have a hard life. We expect to recalibrate weekly and replace the cheap ones every few months. OD windows biofouling is slower and more dishonest — a film that adds 0.04 to OD₇₅₀ will make the twin think it is a genius.",
    "Wipe the OD window. Two-point the pH probe in 7.00 and 10.01 (or 9.18) buffers warmed near culture temperature, not from the fridge. If the offset after calibration is still drifting over hours, the reference junction is dying. Algaephyte will keep acting on a lying probe until you tell it not to; there is a 'hold actuators' in the brick menu for this."]},
  {s:"Node shows LWT / offline on the mesh", likely:"Power, Wi-Fi, or the broker", sev:"mid", body:[
    "Last-will means the socket died. The culture may be perfectly fine — the Pi's local loop does not need the broker. Check power to the brick first. Then whether the greenhouse 4G stick has done its trick. Then whether you can ping the broker from a laptop on the same network.",
    "If the node is actually up, it is still running the rule-based strategy. Do not double-dose by hand 'just in case'. When it reconnects it will publish the current twin state. If it does not reconnect and the e-stop is out, treat it as a local machine and read the OLED."]},
  {s:"OLED says TPU: none — vision disabled", likely:"USB enumeration, power budget, or thermal throttle to death", sev:"low", body:[
    "The Coral is picky about USB current and occasionally about USB3. Try the other port. Try a powered hub if you have added other sticks. If the brick is in a hot cupboard next to the vessel, the TPU may have throttled into a reset loop — we have logs of this, it is not theoretical.",
    "Algaephyte without a TPU is still a twin and still a controller. You have lost the fragment fraction and the not-spirulina class, which means you are back to trusting OD like an animal. Fix the stick when you can. Do not block the air vents on the brick with a towel."]},
  {s:"Alkali or nutrient pump running, reservoir not moving", likely:"Unprimed tubing, a clog, or a reversed head", sev:"high", body:[
    "The firmware will run a dry pump until the duty clamp says stop. The twin will believe the dose happened. This is one of the worse silent failures. Look at the reservoir. Look at the drip. The OLED shows commanded mL; it cannot see a bubble.",
    "Prime into a beaker, not into the culture, until you have a continuous stream. Check the head rotation against the arrow — AP-07 in the workshop still has a note about this because someone (me) reversed it. If the twin's alkalinity state has been lying, treat the carbonate pool as unknown and measure, don't dose to a model of fiction."]},
  {s:"Culture past 39 °C, or the brick is too hot to touch", likely:"Stuck heater, summer greenhouse, or the TPU plus pumps in a sealed box", sev:"high", body:[
    "Arthrospira will tolerate the high thirties. Past ~42 °C you are cooking it. If the heater MOSFET has stuck on, e-stop, unplug the heater, and sparge. If it is weather, shade the vessel and drop the photoperiod; the twin will already be suppressing μ.",
    "If the brick itself is the oven, you have blocked its vents or stacked it against the warm glass. Move it. The Coral will brown-out before the Pi does, and you will get the TPU: none message as a courtesy."]},
  {s:"YOLO 'not-spirulina' climbing, or the culture smells wrong", likely:"Alkalinity sag, dirty inoculum, or a vessel that was not actually clean", sev:"high", body:[
    "Smell is underrated. A healthy alkaline spirulina culture smells like a pond in a specific, almost sweet way. Sour, sewage, or 'aquarium filter' is bacteria. Confirm with the camera. If fragment fraction and not-spirulina are both up, stop dosing nutrients (you are feeding the wrong organism), restore alkalinity if it has sagged, and decide whether this is a recover or a reset.",
    "Recovery is possible early: dilute, raise alkali, keep light moderate. Reset is more common than YouTube admits. Compost, wash, acid rinse, water rinse, start from a known inoculum. Publish the crash. The mesh would rather have your failure in a comment than your contaminant in a parameter vector — not that we accept raw data anyway."]}
];

var JOURNAL = [
  {slug:"alkalinity-not-ph", title:"The first number we trust is alkalinity, not pH", dek:"pH is a symptom. The carbonate pool is the thing actually feeding the cell.", date:"12 Mar 2026", minutes:8, tags:["chemistry","control"], body:[
    {p:"Most growers chase pH because pH is the number a ten-dollar probe will give you. That is a reasonable way to ruin a culture. In an alkaline Arthrospira medium the bicarbonate/carbonate pool is simultaneously the inorganic carbon supply, the overnight buffer, and the reason almost nothing else can live in the vessel. pH is what that pool looks like from the outside."},
    {p:"As photosynthesis pulls CO₂ out of solution, bicarbonate converts toward carbonate and the pH climbs. A culture sitting at pH 10.6 with high alkalinity is comfortable. The same pH with a depleted pool is starving. A probe cannot tell those two stories apart. Algaephyte therefore estimates the carbonate system from pH, temperature and conductivity, and it doses NaHCO₃ to restore the pool rather than to shove a number."},
    {h:"What the twin actually integrates"},
    {p:"The digital twin treats dissolved inorganic carbon as a state variable, not a setpoint. Uptake follows a Monod term against that pool; the pH Algaephyte reports is a derived quantity from the carbonate equilibria at the measured temperature. When the planner proposes a bicarbonate dose, the twin simulates the addition over an hour — not as an instant spike — because a dump of alkali against a weakly buffered culture is how you cook proteins."},
    {aside:"If your only dashboard is pH, you are flying a plane by watching the ground get closer."},
    {p:"On Algaephyte the alkali pump is the most dangerous actuator we ship. It is clamped in firmware to a maximum mass per hour, independently of anything the twin believes. The e-stop on the base cuts that MOSFET. We learned this the obvious way."}]},
  {slug:"yolo-on-a-two-watt-stick", title:"Compiling YOLOv8n for a two-watt stick that sits next to a water jacket", dek:"Coil pitch is a bounding-box problem if you train it that way. The Coral does not care that the subject is alive.", date:"2 Feb 2026", minutes:9, tags:["vision","edge tpu"], body:[
    {p:"The Edge TPU on Algaephyte is a Google Coral USB Accelerator. Four TOPS, about two watts, INT8 only. It sits in the control brick, which sits against an 18-litre vessel that we hold near 35 °C. That thermal neighbourhood is not in the datasheet's comfort zone, so the first engineering problem was not the model. It was whether the stick would throttle while looking at spirulina."},
    {p:"We train YOLOv8n at 288×288 on a modest desktop GPU, quantise per-tensor, and compile with edgetpu_compiler. Not every op maps. NMS comes back to the Pi. Everything else — the backbone, the necks, the heads — runs on the TPU. End-to-end we see roughly 18–24 ms per frame, which is absurd overkill for a culture that changes on the scale of hours, and exactly the right amount of overkill if you are trying to catch a ciliate before it becomes a population."},
    {h:"What the boxes mean"},
    {p:"Three classes survived contact with reality: healthy helix, fragment, and not-spirulina. 'Not-spirulina' is a rude bucket — protozoa, bacterial flocs, air bubbles the preprocessor failed to reject, the occasional piece of silicone swarf. A healthy culture at 400× is almost entirely class one. The number we actually plot is the fragment fraction over a rolling hour. When it ticks up, something is shearing the filaments or grazing them."},
    {aside:"Optical density cannot tell healthy Arthrospira from a green-water contaminant at the same turbidity. A picture can. That is the entire argument for putting a camera on a photobioreactor."},
    {p:"Vision is not allowed to move a pump. It is allowed to make Algaephyte cautious — to widen the twin's uncertainty, to hold a proposed dose, to page a human. A model that has never seen your particular contamination event should not be given the alkali pump. We are stubborn about this."}]},
  {slug:"mqtt-last-will", title:"MQTT last will: the greenhouse reactor that died at 2:14 a.m.", dek:"A 48-byte retained message is a better obituary than a missing dashboard.", date:"19 Jan 2026", minutes:7, tags:["mqtt","network"], body:[
    {p:"Node AP-04 lived in a greenhouse with a 4G stick and a habit of disappearing for twenty minutes whenever a truck went past the mast. We used to treat silence as 'probably fine'. At 02:14 on a Thursday in November the air pump MOSFET failed shorted-off. The culture went anoxic, then crashed. The dashboard, when we opened it at breakfast, showed the last happy telemetry from 01:51. Nothing had been wrong, and then everything had."},
    {p:"MQTT has a feature that is easy to ignore because it is named like a lawyer's letter. Last Will and Testament. When a client connects, it lodges a message the broker will publish on its behalf if the socket dies ungracefully. Algaephyte now lodges a will on algaephyte/{id}/lwt at connect, QoS 1, retained. The mesh does not have to poll. The absence is a fact."},
    {h:"What we actually publish"},
    {p:"Telemetry is small: the six sensor channels, three actuator duties, the twin's current parameter vector, a vision summary (fragment fraction, n detections), and a hash of the compiled model. Algaephyte Mesh shares only the parameter vector across nodes — μ_max, I_opt, K_s, T_opt, a Droop Q_min. Raw traces never leave the brick. Images never leave the brick. If the greenhouse had had a will, we would still have lost AP-04's culture. We would not have lost the morning pretending it was a network blip."},
    {aside:"Unfashionable protocols survive contact with rural cellular. That is why the mesh is MQTT and not a custom gRPC masterpiece."}]},
  {slug:"droop-not-a-net", title:"Droop, Steele, Beer-Lambert — and why the twin is not a neural net", dek:"Fifty-year-old equations can be asked 'what if', and they will answer in the same units you dose in.", date:"5 Dec 2025", minutes:8, tags:["twin","modelling"], body:[
    {p:"It is fashionable to put a small network on every time series and call the result a digital twin. We tried. It forecasted OD with a respectable R² and then proposed a nitrate dose that made no chemical sense, because nothing in its loss function knew that nitrogen is an atom. The twin on Algaephyte is a set of equations that have described microalgal growth since before we were born, wired to live sensors and integrated forward every few seconds."},
    {p:"Droop's cell-quota kinetics decouple uptake from growth: cells store nitrogen, and division depends on that internal quota rather than the concentration in the medium. That single idea explains why a starved culture keeps dividing after you feed it, and why over-dosing nitrate buys you nothing but bacteria. Steele's curve handles light — growth rises to an optimum irradiance and falls again under photoinhibition. Beer-Lambert gives every radial shell of the vessel its own light climate, so a dense culture is a stack of increasingly dark jackets."},
    {h:"The point of a twin is counterfactuals"},
    {p:"A neural net can be asked 'what happens next'. A physics twin can be asked 'what happens if I add 3.2 g of bicarbonate over twelve minutes'. The second question is the one a pump needs answered. The planner proposes; the twin simulates the proposal; a deterministic gate checks mass, pH band, duty cycle; only then does a MOSFET move. Lose the internet and a rule-based strategy on the Pi takes over. The TPU can be unplugged. The culture is not allowed to notice."},
    {aside:"The AI proposes. The culture is never at its mercy. We will keep saying this until it is boring."}]},
  {slug:"what-point-one-three-means", title:"What 0.13 g/L·d actually means in a kitchen", dek:"Honest yields are more useful than a trillion-dollar adjective.", date:"28 Nov 2025", minutes:6, tags:["biology","yield"], body:[
    {p:"A well-run 18-litre Algaephyte column of Arthrospira platensis, at 35 °C, in a Zarrouk-like medium, under a photoperiod that does not cook the outer shell, produces on the order of 0.10–0.16 grams of dry biomass per litre per day. That is not a press-release number. It is the boring range the literature has been reporting in small photobioreactors for years, and it is the range our own columns fall into when nothing is on fire."},
    {p:"Do the arithmetic. 18 L × 0.13 g/L·d = 2.3 g of dry spirulina a day. Protein is roughly 60% of that dry weight, so about 1.4 g of protein. A large hen's egg holds around 6 g. This column, tended by a two-watt TPU and a pair of peristaltic pumps, makes an egg's worth of protein every four days. It also fixes about 4 g of CO₂ a day, because a gram of this biomass is roughly half carbon."},
    {aside:"If that sounds small, good. Biology is small until you stop throwing it away at 3 a.m. when the pH walks off."},
    {p:"The interesting number is not the kitchen. It is the kitchen multiplied by a mesh that does not crash. Ten thousand columns that stay in the productive regime — because their twins borrowed an I_opt from a node that already found it — is 8,400 kilograms of protein a year, produced on benches, in greenhouses, in rooms that used to hold a dehumidifier. That is the scale Algaephyte is built for. Not a hectare of raceway. A network of vessels that refuse to die unsupervised."}]},
  {slug:"fourteen-hour-crash", title:"The 14-hour crash: reading contamination from coil pitch", dek:"The OD trace was a masterpiece of composure. The camera was not.", date:"14 Oct 2025", minutes:8, tags:["vision","failure"], body:[
    {p:"AP-02 looked fine. Optical density climbed through the afternoon with the slightly convex curve we like. pH was 10.1. Dissolved oxygen was high but not stupid. At 19:40 the fragment class on the TPU went from 4% to 19% in forty minutes. Algaephyte held dosing and flagged the node. We did not look until 21:00. By then you could see it without a model: filaments shortened, some straightened, a few loops of something that was not Arthrospira drifting through the field."},
    {p:"The culture was still green. That is the unkindness of these crashes. Green is not a diagnosis. We isolated, counted, and found a mix of bacteria and a small flagellate. The alkalinity had been allowed to sag over three days of aggressive growth — pH still high, pool thin, biosecurity gone. The contaminant did not outcompete spirulina in a proper Zarrouk. It outcompeted spirulina in a Zarrouk we had eaten."},
    {h:"What we changed"},
    {p:"Two things. The twin now treats alkalinity sag as a biosecurity event, not just a carbon event, and will propose a hold-and-restore even if growth is still positive. And the vision summary is on the home tile, not in an advanced tab. If a number can be polite while the cells come apart, it should not be the number you look at first."},
    {aside:"Every clean run and every crash makes the cut. We mean that. AP-02 is in the firmware comments."}]},
  {slug:"a-pump-is-a-weapon", title:"A dosing pump is a weapon if you do not clamp it", dek:"Bounded autonomy is not a slogan. It is a MOSFET and a number in EEPROM.", date:"3 Sep 2025", minutes:7, tags:["safety","firmware"], body:[
    {p:"The planner is allowed to propose experiments. It is not allowed to act on them. The distinction lives in three places at once, because we do not trust any one of them."},
    {p:"Layer one is software on the Pi: hard limits on dose mass, pump runtime, pH band, temperature ceiling, and actuation frequency. A proposal outside them is rejected and logged. Layer two is the twin. The surviving proposal is simulated; if the forecast stalls growth, crosses a pH boundary, or spikes dissolved oxygen, it is blocked. Layer three is firmware on the ESP32 that owns the MOSFETs. It has its own max-duty table in EEPROM, a watchdog that opens the pumps if the Pi stops heartbeating, and a physical mushroom e-stop that does not ask anyone's opinion."},
    {p:"We once let a planner (a language model, to be specific, and we deserved what we got) propose 'raise alkalinity to target' without a rate. The software gate caught the mass. If it had not, the firmware would have. If it had not, there is a red button on the front of the brick. The culture is expensive in time. The pump is cheap. We take the pump's side."},
    {aside:"Fail closed. If you remember one design rule from this site, remember that."}]},
  {slug:"zarrouk-from-the-hardware-store", title:"Zarrouk's medium from things you can actually buy", dek:"The original recipe assumes a storeroom. Ours assumes a town.", date:"21 Aug 2025", minutes:6, tags:["media","open source"], body:[
    {p:"Zarrouk 1966 is a good medium and a bad shopping list. Some of the salts are trivial. Some of them you will not find at a farm co-op. Algaephyte ships with a stock recipe that is chemically close enough for Arthrospira and logistically close enough for a human who does not have an account with Sigma."},
    {p:"The carbon is baking soda, which is the whole point of this organism. Nitrogen is sodium nitrate or, if you are careful with dose, a horticultural nitrate. Phosphorus is KH₂PO₄ from the brewing shop. The rest — magnesium, calcium, iron with a chelator, the trace metals — we publish as a dry premix recipe and as a 'good enough' version using a commercial hydroponic micronutrient, with the iron doubled, because Arthrospira is greedy about iron and hydroponic mixes are not."},
    {p:"We do not pretend this is a methods paper. This is how you get a column green without waiting for a specialist parcel. The media notes are in the journal and in the build record. If you improve the formulation, send the improvement. If you kill a culture with it, send that too."}]},
  {slug:"photoperiod-is-a-control-surface", title:"Photoperiod is a control surface, not a schedule", dek:"The outer shell of a dense column lives in a different century of light than the core.", date:"8 Jul 2025", minutes:7, tags:["light","twin"], body:[
    {p:"People set a timer for 16:8 because a paper did. In a thin flask that is a photoperiod. In an 18-litre column at OD₇₅₀ 0.8 it is a suggestion the interior of the vessel has not heard. Beer-Lambert is not a metaphor. The outer millimetre of a dense culture can be photoinhibited while the axis is below compensation. A single wall sensor cannot see this. The twin can, because it integrates Steele's curve through the radial shells."},
    {p:"Algaephyte therefore treats photoperiod and irradiance as two different handles. It would rather dim a panel than shorten a day, and it would rather shorten a day than bleach the jacket. When dissolved oxygen climbs through the afternoon — photosynthesis poisoning itself — the first proposal is usually more air. The second is a modest dim. The third, if you have been stubborn about air, is a siesta."},
    {aside:"A culture does not want your circadian hygiene. It wants photons where the cells are."}]},
  {slug:"why-arthrospira", title:"Why Arthrospira, and not Chlorella, for version one", dek:"We picked the organism that forgives us. The mesh can get ambitious later.", date:"16 Jun 2025", minutes:6, tags:["biology"], body:[
    {p:"Chlorella is a better carbon-capture story. Haematococcus is a better pigment story. Nannochloropsis is a better lipid story. Arthrospira platensis — spirulina, in the grocery sense — is a better first customer. It grows in a medium so alkaline that most contaminants find the experience insulting. It has been eaten for centuries. Its filaments are large enough that a cheap optic and a 288-pixel YOLO can tell them from a blob. It tells you what it needs with pH."},
    {p:"Algaephyte's whole safety argument leans on that. Bounded autonomy is easier when the organism lives in a chemical neighbourhood that is already hostile to its rivals. When we open the mesh to other strains, the twin's parameters change and the vision classes change and the biosecurity argument gets thinner. That is fine. It is a later problem. Version one is a column of helical cyanobacteria, a two-watt mind, and a pump we do not fully trust."}]}
];

/* wordmark */
(function(){
  var wm=document.getElementById("wordmark");
  if(!wm)return;
  "Algaephyte".split("").forEach(function(ch,i){
    var s=document.createElement("span");
    s.className="letter-in";s.textContent=ch;
    s.style.animationDelay=(80+i*55)+"ms";
    wm.appendChild(s);
  });
})();

/* ticker */
(function(){
  var track=document.getElementById("tickerTrack");
  if(!track)return;
  var items=TICKS.concat(TICKS);
  items.forEach(function(t){
    var s=el('<span class="tick"><i></i>'+t+"</span>");
    track.appendChild(s);
  });
})();

/* stack */
(function(){
  var stage=document.getElementById("stackStage");
  var tabs=document.querySelectorAll(".stack-tab");
  function render(i){
    var d=STACK[i] || STACK[0];
    stage.innerHTML='<div class="stage-enter">'
      +'<div class="k">Layer '+d.index+'</div>'
      +'<h3>'+d.title+'</h3>'
      +'<p>'+d.text+'</p></div>'
      +'<div class="stack-foot"><span class="spec">'+d.spec+'</span>'
      +'<span class="sysline">'+STACK.map(function(_,j){return '<i class="'+(j===i?"on":"")+'"></i>';}).join("")+'</span></div>';
    tabs.forEach(function(t,k){t.classList.toggle("on",k===i);t.setAttribute("aria-selected",k===i?"true":"false");});
  }
  tabs.forEach(function(t){
    t.addEventListener("click",function(){render(parseInt(t.dataset.i,10));});
    t.addEventListener("mouseenter",function(){render(parseInt(t.dataset.i,10));});
  });
  render(0);
})();

/* loop grid */
(function(){
  var g=document.getElementById("loopGrid");
  if(!g)return;
  LOOP.forEach(function(s){
    g.appendChild(el('<div class="loop-cell"><div class="k">'+s[0]+'</div><div class="v">'+s[1]+"</div></div>"));
  });
})();

/* signals */
(function(){
  var g=document.getElementById("sigGrid");
  if(!g)return;
  SIGNALS.forEach(function(s){
    g.appendChild(el('<div class="sig"><div class="k">'+s.k+'</div><h4>'+s.h+'</h4><p>'+s.p+"</p></div>"));
  });
})();

/* gates */
(function(){
  var g=document.getElementById("gateGrid");
  if(!g)return;
  GATES.forEach(function(s){
    g.appendChild(el('<div class="gate"><div class="n">'+s.n+'</div><h4>'+s.h+'</h4><p>'+s.p+"</p></div>"));
  });
})();

/* mesh svg */
(function(){
  var box=document.getElementById("meshSvg");
  if(!box)return;
  var nodes=[[50,50,8],[16,22,4],[84,20,4.5],[88,64,3.8],[22,78,4.2],[58,86,3.4],[10,52,3.2],[68,34,3]];
  var svg='<div class="lab">Parameter mesh · fitted scalars only</div><svg viewBox="0 0 100 100" aria-hidden="true">';
  nodes.slice(1).forEach(function(n){
    svg+='<line x1="50" y1="50" x2="'+n[0]+'" y2="'+n[1]+'" stroke="#9fe0a4" stroke-opacity="0.3" stroke-width="0.4"/>';
  });
  nodes.forEach(function(n,i){
    svg+='<circle cx="'+n[0]+'" cy="'+n[1]+'" r="'+n[2]+'" fill="'+(i===0?"#3f8f4e":"#9fe0a4")+'" stroke="#050705" stroke-width="0.6"/>';
  });
  svg+="</svg>";
  box.innerHTML=svg;
})();

/* journal */
(function(){
  var wrap=document.getElementById("journalRows");
  if(!wrap)return;
  JOURNAL.forEach(function(a,i){
    var body=a.body.map(function(b){
      if(b.p)return "<p>"+b.p+"</p>";
      if(b.h)return "<h5>"+b.h+"</h5>";
      if(b.aside)return "<aside>"+b.aside+"</aside>";
      return "";
    }).join("");
    var tags=a.tags.map(function(t){return "<span>"+t+"</span>";}).join("");
    wrap.appendChild(el(
      '<details class="jrow">'
      +'<summary><span class="n">'+String(i+1).padStart(2,"0")+'</span><span class="d">'+a.date+'</span><span class="t">'+a.title+'</span><span class="m">'+a.minutes+' min</span></summary>'
      +'<div class="body"><div class="meta">'+a.dek+'</div><div class="tags">'+tags+'</div><div class="prose">'+body+"</div></div>"
      +"</details>"
    ));
  });
})();

/* issues accordion */
(function(){
  var wrap=document.getElementById("issueAcc");
  if(!wrap)return;
  ISSUES.forEach(function(it){
    var body=it.body.map(function(b){
      if(typeof b==="string")return "<p>"+b+"</p>";
      if(b[0]==="aside")return "<aside>"+b[1]+"</aside>";
      return "<h5>"+b[0]+"</h5><p>"+b[1]+"</p>";
    }).join("");
    wrap.appendChild(el(
      '<details><summary><span>'+it.s+'</span><span class="sev '+it.sev+'">'+it.sev+'</span></summary>'
      +'<div class="a"><p class="mono" style="margin-bottom:14px;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--mute)">Likely: '+it.likely+"</p>"+body+"</div></details>"
    ));
  });
})();

/* faq accordion */
(function(){
  var wrap=document.getElementById("faqAcc");
  if(!wrap)return;
  FAQS.forEach(function(f){
    wrap.appendChild(el("<details><summary><span>"+f.q+"</span></summary><div class='a'>"+f.a+"</div></details>"));
  });
})();

