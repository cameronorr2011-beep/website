"use strict";
/* Concept-stage content: design targets, not measured capabilities. */
var STACK = [
  {label:"Culture", index:"01", title:"Start with the culture and vessel.", text:"The proposed vessel is an 18-litre column for Arthrospira. Light path, mixing, medium and cleaning need to be evaluated together before settling on a working design.", spec:"18 L proposed volume · geometry to validate"},
  {label:"Sense", index:"02", title:"Measure the water, then examine the cells.", text:"The planned inputs are pH, temperature, light, optical density, dissolved oxygen and conductivity. Camera checks would supplement these readings, not certify identity or food safety.", spec:"6 planned channels · calibration required"},
  {label:"Twin", index:"03", title:"Compare possible actions in a growth model.", text:"We plan to combine nutrient-quota, light-response and attenuation equations. A 72-hour forecast is a design target; useful accuracy must be demonstrated against real data.", spec:"Physics-based model · forecast target, not validation"},
  {label:"Edge brain", index:"04", title:"Keep the control loop local.", text:"The proposed architecture uses a Raspberry Pi 5 and a Coral camera accelerator. A local assistant would explain decisions without actuator authority. Compute load, heat and fallback behavior still need testing.", spec:"Pi 5 + Coral proposed · optional assistant"},
  {label:"Control", index:"05", title:"Separate proposals from actuator permission.", text:"We want fixed software limits, a model check and independent actuator-controller limits, plus a watchdog and physical stop. Fault testing must establish whether these protections work as intended.", spec:"3 proposed gates · fail-closed requirement"},
  {label:"Mesh", index:"06", title:"Share parameters only if they help.", text:"The optional mesh would exchange fitted model parameters rather than raw traces or images. Compatibility, privacy, bad inputs and safe disconnection all need evaluation.", spec:"Optional MQTT design · no deployed network claimed"}
];
var SIGNALS = [
  {k:"pH", h:"Acidity and alkalinity", p:"pH helps describe medium chemistry but does not directly measure the bicarbonate supply. Carbon availability needs additional evidence and a validated chemistry model."},
  {k:"Temperature", h:"A condition to measure and control", p:"Temperature affects growth and equipment behavior. Suitable ranges depend on the strain and setup; the planned controller needs calibrated readings and independent limits."},
  {k:"Light", h:"Measure what reaches the vessel", p:"Light response is not simply more-is-better. Wall irradiance and attenuation through the culture are candidate inputs to the model."},
  {k:"OD₇₅₀", h:"An optical-density proxy", p:"Light attenuation can help estimate biomass after calibration. Bubbles, deposits and other organisms can affect it, and it cannot establish culture identity."},
  {k:"Dissolved oxygen", h:"Track production and gas exchange", p:"Oxygen is another condition to investigate alongside light and mixing. Its interpretation and any control thresholds need testing in the actual vessel."},
  {k:"Conductivity / TDS", h:"A bulk dissolved-salt reading", p:"Conductivity is not a specific nutrient assay. We need to determine what it can reliably tell us about this medium before using it to guide dosing."}
];
var GATES = [
  {n:"GATE 01", h:"Fixed limits", p:"Planned checks cover dose mass, runtime, frequency, pH and temperature. Missing or stale inputs should block action rather than invite a guess."},
  {n:"GATE 02", h:"Model check", p:"The proposed action would be evaluated in the growth model. Model uncertainty matters: a forecast is not a guarantee of biological safety."},
  {n:"GATE 03", h:"Independent hardware limits", p:"The actuator controller would keep its own limits and watchdog, with a physical stop independent of the assistant. These protections require fault testing."}
];
var LOOP = [["1 Sense","Planned sensors and camera"],["2 Model","Estimate state and uncertainty"],["3 Propose","Local rules suggest an action"],["4 Verify","Limits and model checks"],["5 Act","Only with independent permission"],["6 Share","Optional parameter exchange"]];
var TICKS = ["Concept in development","18 L design target","Six planned sensor channels","72 h forecast target","Three proposed safety gates","Illustrative simulation","No validated yield claim"];
var FAQS = [
  {q:"What is Algaephyte?", a:"A cultivation-system concept combining a vessel, sensors, a growth model and independently limited actuators. It is in development, not a validated product."},
  {q:"Why did Orr Biologicals start?", a:"We were shocked by how inaccessible algae biotechnology was. An early interest in biology, college coursework and microbiology led us to a project focused on making the tools and the science easier to approach."},
  {q:"What can I use on this site now?", a:"The learning guides, source-linked daily research summaries and interactive simulations. Simulations illustrate ideas; they are not measurements from an operating reactor."},
  {q:"Is an AI in charge of the culture?", a:"The design does not give an assistant direct actuator authority. Local policy, model checks and independent hardware limits are proposed safeguards that still need verification."},
  {q:"Why include a camera?", a:"Bulk readings cannot identify everything in a culture. Images could provide complementary evidence, but a classifier needs a labeled dataset and validation against unfamiliar organisms and artifacts."},
  {q:"What is Algaephyte Mesh?", a:"A proposed optional network for sharing fitted growth-model parameters. No deployed vessel network or proven benefit is claimed."},
  {q:"Can it grow other algae?", a:"Arthrospira is the initial design focus. Other organisms would need different media, models, operating limits and validation."},
  {q:"How much does it produce?", a:"We do not have a validated Algaephyte yield to report. The site's numerical examples are assumptions or simulations, not measured production."},
  {q:"What happens if the internet fails?", a:"Local operation without an internet dependency is a design goal. Disconnect and fault tests must demonstrate safe behavior before we claim it works."},
  {q:"Is this open source?", a:"This website carries an MIT license. That does not establish that every proposed hardware design, model or runtime component has been released. Ask us about implementation availability."},
  {q:"Can I buy or reserve one?", a:"No finished reactor or deployment is currently offered. The contact form opens an email draft for research questions and collaboration, not an order or reservation."},
  {q:"Are the equipment images proof of a build?", a:"No. They are retained as illustrative concept imagery, not evidence of completed hardware, measured runs or validated performance."},
  {q:"Does the blog still update automatically?", a:"Yes. The daily pipeline searches PubMed and uses Groq to select and summarize papers. AI summaries can contain errors; check the linked source before relying on them."},
  {q:"Why a fail-closed design?", a:"An incomplete or uncertain proposal should not move an actuator. That is a requirement we intend to test, not a safety guarantee for unvalidated hardware."}
];
var ISSUES = [
  {s:"Sensor readings drift or disagree", likely:"Calibration, fouling, bubbles or a failed sensor", sev:"mid", body:["Compare against an independently calibrated measurement. Investigate probe condition and sampling before trusting a model derived from the reading.", ["Design requirement","Invalid or stale inputs should hold automatic actuation and ask for inspection. This behavior needs explicit fault tests."]]},
  {s:"A pump command does not deliver liquid", likely:"Empty reservoir, air, blocked tubing or mechanical failure", sev:"high", body:["A commanded volume is not proof of delivery. The design needs a way to detect or handle a failed dose rather than silently updating its chemistry estimate.", ["Design requirement","Test dry reservoirs, interrupted flow and incorrect tubing direction without exposing a living culture to uncontrolled dosing."]]},
  {s:"The culture changes color or shows unfamiliar shapes", likely:"Several possible biological or environmental causes", sev:"high", body:["Color alone is not a diagnosis. Review chemistry, light, temperature and organism identification with appropriate methods. Camera flags cannot establish food safety.", ["aside","Do not consume an unidentified or potentially contaminated culture. Seek qualified guidance rather than an automatic recovery recipe."]]},
  {s:"Power or network communication is lost", likely:"Supply, connection or controller fault", sev:"high", body:["A last-will message reports a connection loss, not a biological diagnosis. The planned hardware must reach a defined safe state without relying on a remote dashboard.", ["Design requirement","Verify watchdog behavior, restart state, emergency stop and safe output states under simulated faults."]]}
];
var JOURNAL = [
  {title:"Calibrate before automating", dek:"Planned validation work, not a completed experiment.", tags:["sensors","validation"], body:[{p:"We need to compare sensor readings with independent references across the intended medium and operating conditions. A control model is only useful if its inputs and uncertainty are understood."}]},
  {title:"Test the model against culture data", dek:"Forecast accuracy is an open question.", tags:["growth model","validation"], body:[{p:"The proposed equations must be fitted and evaluated against measured culture behavior, including conditions outside the productive range. The 72-hour horizon is a target to assess, not a proven capability."}]},
  {title:"Demonstrate safe failure behavior", dek:"A safety architecture is not the same as a tested safety system.", tags:["actuators","fault testing"], body:[{p:"We need controlled tests for stale readings, invalid proposals, loss of power, interrupted communications and actuator faults. Results should be documented before describing the system as reliable or autonomous."}]}
];

(function(){
  var wm=document.getElementById("wordmark");
  if(!wm)return;
  "Algaephyte".split("").forEach(function(ch,i){var s=document.createElement("span");s.className="letter-in";s.textContent=ch;s.style.animationDelay=(80+i*55)+"ms";wm.appendChild(s);});
})();
(function(){
  var track=document.getElementById("tickerTrack");if(!track)return;
  TICKS.concat(TICKS).forEach(function(t){track.appendChild(el('<span class="tick">'+t+'</span>'));});
})();
(function(){
  var nav=document.querySelector(".inside-nav");if(!nav)return;
  var links=[].slice.call(nav.querySelectorAll("a[href^='#']")),map={};
  links.forEach(function(a){var sec=document.getElementById(a.getAttribute("href").slice(1));if(sec)map[sec.id]=a;});
  if(!("IntersectionObserver" in window))return;
  var io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){links.forEach(function(a){a.classList.remove("on");});map[en.target.id].classList.add("on");}});},{rootMargin:"-30% 0px -55% 0px"});
  Object.keys(map).forEach(function(id){io.observe(document.getElementById(id));});
})();
(function(){
  var stage=document.getElementById("stackStage"),tabs=document.querySelectorAll(".stack-tab");if(!stage)return;
  function render(i){var d=STACK[i]||STACK[0];stage.innerHTML='<div class="stage-enter"><div class="k">Proposed layer '+d.index+'</div><h3>'+d.title+'</h3><p>'+d.text+'</p></div><div class="stack-foot"><span class="spec">'+d.spec+'</span><span class="sysline">'+STACK.map(function(_,j){return '<i class="'+(j===i?'on':'')+'"></i>';}).join('')+'</span></div>';tabs.forEach(function(t,k){t.classList.toggle("on",k===i);t.setAttribute("aria-selected",k===i?"true":"false");});}
  tabs.forEach(function(t){t.addEventListener("click",function(){render(parseInt(t.dataset.i,10));});t.addEventListener("mouseenter",function(){render(parseInt(t.dataset.i,10));});});render(0);
})();
(function(){var g=document.getElementById("loopGrid");if(g)LOOP.forEach(function(s){g.appendChild(el('<div class="loop-cell"><div class="k">'+s[0]+'</div><div class="v">'+s[1]+'</div></div>'));});})();
(function(){var g=document.getElementById("sigGrid");if(g)SIGNALS.forEach(function(s){g.appendChild(el('<div class="sig"><div class="k">'+s.k+'</div><h4>'+s.h+'</h4><p>'+s.p+'</p></div>'));});})();
(function(){var g=document.getElementById("gateGrid");if(g)GATES.forEach(function(s){g.appendChild(el('<div class="gate"><div class="n">'+s.n+'</div><h4>'+s.h+'</h4><p>'+s.p+'</p></div>'));});})();
(function(){
  var box=document.getElementById("meshSvg");if(!box)return;
  var nodes=[[50,50,8],[16,22,4],[84,20,4.5],[88,64,3.8],[22,78,4.2],[58,86,3.4],[10,52,3.2],[68,34,3]],svg='<div class="lab">Proposed parameter mesh · diagram only</div><svg viewBox="0 0 100 100" aria-hidden="true">';
  nodes.slice(1).forEach(function(n){svg+='<line x1="50" y1="50" x2="'+n[0]+'" y2="'+n[1]+'" stroke="#9fe0a4" stroke-opacity="0.3" stroke-width="0.4"/>';});
  nodes.forEach(function(n,i){svg+='<circle cx="'+n[0]+'" cy="'+n[1]+'" r="'+n[2]+'" fill="'+(i===0?'#3f8f4e':'#9fe0a4')+'" stroke="#050705" stroke-width="0.6"/>';});box.innerHTML=svg+'</svg>';
})();
(function(){
  var wrap=document.getElementById("journalRows");if(!wrap)return;
  JOURNAL.forEach(function(a,i){var body=a.body.map(function(b){return b.p?'<p>'+b.p+'</p>':b.h?'<h5>'+b.h+'</h5>':b.aside?'<aside>'+b.aside+'</aside>':'';}).join(''),tags=a.tags.map(function(t){return '<span>'+t+'</span>';}).join('');wrap.appendChild(el('<details class="jrow"><summary><span class="n">'+String(i+1).padStart(2,'0')+'</span><span class="d">Planned</span><span class="t">'+a.title+'</span><span class="m">Design note</span></summary><div class="body"><div class="meta">'+a.dek+'</div><div class="tags">'+tags+'</div><div class="prose">'+body+'</div></div></details>'));});
})();
(function(){
  var wrap=document.getElementById("issueAcc");if(!wrap)return;
  ISSUES.forEach(function(it){var body=it.body.map(function(b){return typeof b==='string'?'<p>'+b+'</p>':b[0]==='aside'?'<aside>'+b[1]+'</aside>':'<h5>'+b[0]+'</h5><p>'+b[1]+'</p>';}).join('');wrap.appendChild(el('<details><summary><span>'+it.s+'</span><span class="sev '+it.sev+'">'+it.sev+'</span></summary><div class="a"><p class="mono">Possible causes: '+it.likely+'</p>'+body+'</div></details>'));});
})();
(function(){var wrap=document.getElementById("faqAcc");if(wrap)FAQS.forEach(function(f){wrap.appendChild(el('<details><summary><span>'+f.q+'</span></summary><div class="a">'+f.a+'</div></details>'));});})();
