var er="orr-biologicals-algal-simulation-input",ri="orr-biologicals-algal-simulation-output",jf="orr-biologicals-algal-simulation-comparison";var gt="algal-biomass-logistic-1.0.0",jt="algal-digital-lab-engine-1.0.0",Wu="baseline";var is=Object.freeze({maxDurationHours:8760,maxIntegrationSteps:1e5,maxSweepCases:64,maxSweepSteps:25e4,maxSensitivityDimensions:8}),Gl=Object.freeze({biomass:"dX/dt = mu_eff * X * (1 - X/K)",euler:"X_next = X + dt_days * dX/dt",effectiveGrowth:"mu_eff = mu_max * f_light * f_temperature * f_pH * f_nutrient",lightSaturation:"f_light = lightPpfd / (lightPpfd + halfSaturationPpfd)",temperatureResponse:"f_temperature = exp(-0.5 * ((temperatureC - optimumC) / widthC)^2)",pHResponse:"f_pH = exp(-0.5 * ((pH - optimum) / width)^2)",nutrientResponse:"f_nutrient = nutrientMgL / (nutrientMgL + halfSaturationMgL)"}),Wl=Object.freeze(["X is biomass concentration in g/L; K is the illustrative carrying capacity in g/L.","The state equation is logistic growth: dX/dt = mu_eff * X * (1 - X/K).","Integration uses fixed-step forward Euler with dt expressed in days.","mu_eff is mu_max multiplied by the enabled light, temperature, pH, and nutrient response factors; a disabled factor equals 1.","Light saturation is Monod-like; temperature and pH responses are Gaussian-shaped; nutrient response is Monod-like.","endpointGrowthRatePerDay is the net specific endpoint rate (dX/dt)/X; a zero-biomass endpoint reports 0.","Relative change uses delta divided by the absolute initial biomass; a zero-to-zero baseline is reported as 0 with an explicit status.","Organism names are reference labels only. Profile parameters are illustrative placeholders for exploring the interface, not measured species claims.","No measurement, calibration, species identification, process guarantee, or hardware control is implied by a simulation result."]),Yf=Object.freeze(["light","temperature","pH","nutrient"]),ts=Object.freeze(["model.muMaxPerDay","model.carryingCapacityG_L","model.volumeL","model.environment.lightPpfd","model.environment.temperatureC","model.environment.pH","model.environment.nutrientMgL","model.responseFactors.light.enabled","model.responseFactors.light.halfSaturationPpfd","model.responseFactors.temperature.enabled","model.responseFactors.temperature.optimumC","model.responseFactors.temperature.widthC","model.responseFactors.pH.enabled","model.responseFactors.pH.optimum","model.responseFactors.pH.width","model.responseFactors.nutrient.enabled","model.responseFactors.nutrient.halfSaturationMgL","initialConditions.biomassG_L","initialConditions.timeHours","integration.durationHours","integration.stepHours","organism.profileId"]);var Zu={muMaxPerDay:.28,carryingCapacityG_L:2,volumeL:1,environment:{lightPpfd:220,temperatureC:30,pH:9.5,nutrientMgL:250},responseFactors:{light:{enabled:!0,kind:"saturation",halfSaturationPpfd:120},temperature:{enabled:!0,kind:"gaussian",optimumC:30,widthC:8},pH:{enabled:!0,kind:"gaussian",optimum:9.5,width:1.4},nutrient:{enabled:!0,kind:"monod",halfSaturationMgL:45}}},Ci={arthrospira:{profileId:"arthrospira",label:"Arthrospira",scientificName:"Arthrospira spp.",classification:"reference / illustrative",parameterBasis:"illustrative placeholders; not species measurements",provenance:{kind:"reference-label",label:"real organism reference label",note:"The label is a reference for UI exploration; the simulation does not identify a culture or assert performance."},illustrativeDefaults:{muMaxPerDay:.28,carryingCapacityG_L:2,environment:{temperatureC:30,pH:9.5}}},"chlorella-vulgaris":{profileId:"chlorella-vulgaris",label:"Chlorella vulgaris",scientificName:"Chlorella vulgaris",classification:"reference / illustrative",parameterBasis:"illustrative placeholders; not species measurements",provenance:{kind:"reference-label",label:"real organism reference label",note:"The label is a reference for UI exploration; the simulation does not identify a culture or assert performance."},illustrativeDefaults:{muMaxPerDay:.28,carryingCapacityG_L:2,environment:{temperatureC:25,pH:7.2}}},"nannochloropsis-oceanica":{profileId:"nannochloropsis-oceanica",label:"Nannochloropsis oceanica",scientificName:"Nannochloropsis oceanica",classification:"reference / illustrative",parameterBasis:"illustrative placeholders; not species measurements",provenance:{kind:"reference-label",label:"real organism reference label",note:"The label is a reference for UI exploration; the simulation does not identify a culture or assert performance."},illustrativeDefaults:{muMaxPerDay:.28,carryingCapacityG_L:2,environment:{temperatureC:22,pH:8.1}}},tetraselmis:{profileId:"tetraselmis",label:"Tetraselmis",scientificName:"Tetraselmis spp.",classification:"reference / illustrative",parameterBasis:"illustrative placeholders; not species measurements",provenance:{kind:"reference-label",label:"real organism reference label",note:"The label is a reference for UI exploration; the simulation does not identify a culture or assert performance."},illustrativeDefaults:{muMaxPerDay:.28,carryingCapacityG_L:2,environment:{temperatureC:21,pH:8.1}}},pavlova:{profileId:"pavlova",label:"Pavlova",scientificName:"Pavlova spp.",classification:"reference / illustrative",parameterBasis:"illustrative placeholders; not species measurements",provenance:{kind:"reference-label",label:"real organism reference label",note:"The label is a reference for UI exploration; the simulation does not identify a culture or assert performance."},illustrativeDefaults:{muMaxPerDay:.28,carryingCapacityG_L:2,environment:{temperatureC:20,pH:8.1}}},isochrysis:{profileId:"isochrysis",label:"Isochrysis",scientificName:"Isochrysis spp.",classification:"reference / illustrative",parameterBasis:"illustrative placeholders; not species measurements",provenance:{kind:"reference-label",label:"real organism reference label",note:"The label is a reference for UI exploration; the simulation does not identify a culture or assert performance."},illustrativeDefaults:{muMaxPerDay:.28,carryingCapacityG_L:2,environment:{temperatureC:20,pH:8.1}}}},Zf=Object.freeze({"arthrospira-spp":"arthrospira","arthrospira-platensis":"arthrospira",chlorella:"chlorella-vulgaris",nannochloropsis:"nannochloropsis-oceanica","nannochloropsis-oceanica":"nannochloropsis-oceanica","tetraselmis-spp":"tetraselmis","pavlova-spp":"pavlova","isochrysis-spp":"isochrysis"});function et(n){return n==null||typeof n!="object"?n:JSON.parse(JSON.stringify(n))}function jl(n){if(!n||typeof n!="object"||Object.isFrozen(n))return n;for(let e of Object.values(n))jl(e);return Object.freeze(n)}function Ue(n){return n!==null&&typeof n=="object"&&!Array.isArray(n)}function tr(n){return typeof n=="number"&&Number.isFinite(n)}function qt(n,e=10){if(!tr(n))return n;let t=Number(n.toFixed(e));return Object.is(t,-0)?0:t}function _o(n,e,t){return Math.max(e,Math.min(t,n))}function Hn(n,e){if(!Ue(e))return et(n);let t=Ue(n)?et(n):{};for(let[i,s]of Object.entries(e))Ue(s)&&Ue(t[i])?t[i]=Hn(t[i],s):t[i]=et(s);return t}function me(n,e,t="invalid"){return{path:n,message:e,code:t}}var Et=class extends Error{constructor(e,t=[]){super(e),this.name="SimulationValidationError",this.errors=t}};function Jf(n,e){if(n.length>0)throw new Et(`${e} validation failed`,n)}function ss(n){let e=Ue(n)?n.profileId??n.id??n.key:n;if(typeof e!="string")return null;let t=e.trim().toLowerCase().replace(/\s+/g,"-");return Object.hasOwn(Ci,t)?t:Zf[t]||null}function $l(n){let e=Ci[n];return et({profileId:e.profileId,label:e.label,scientificName:e.scientificName,classification:e.classification,parameterBasis:e.parameterBasis,provenance:e.provenance})}function nn(n,e,t,i){if(!Ue(n)){i.push(me(t,"must be an object","type"));return}for(let s of Object.keys(n))e.includes(s)||i.push(me(`${t}.${s}`,"unsupported value or field","unsupported"))}function It(n,e,t,{minimum:i=-1/0,maximum:s=1/0,exclusiveMinimum:r=!1,exclusiveMaximum:o=!1}={}){if(!tr(n)){t.push(me(e,"must be a finite number","finite-number"));return}let a=r?n<=i:n<i,l=o?n>=s:n>s;(a||l)&&t.push(me(e,`must be ${r?">":">="} ${i} and ${o?"<":"<="} ${s}`,"range"))}function yo(n,e,t){typeof n!="boolean"&&t.push(me(e,"must be a boolean","boolean"))}function Kf(n,e,t="model.responseFactors"){if(nn(n,Yf,t,e),!Ue(n))return;let i=n.light;nn(i,["enabled","kind","halfSaturationPpfd"],`${t}.light`,e),Ue(i)&&(yo(i.enabled,`${t}.light.enabled`,e),i.kind!=="saturation"&&e.push(me(`${t}.light.kind`,"only saturation is supported","unsupported")),It(i.halfSaturationPpfd,`${t}.light.halfSaturationPpfd`,e,{minimum:0,exclusiveMinimum:!0}));let s=n.temperature;nn(s,["enabled","kind","optimumC","widthC"],`${t}.temperature`,e),Ue(s)&&(yo(s.enabled,`${t}.temperature.enabled`,e),s.kind!=="gaussian"&&e.push(me(`${t}.temperature.kind`,"only gaussian is supported","unsupported")),It(s.optimumC,`${t}.temperature.optimumC`,e,{minimum:-20,maximum:80}),It(s.widthC,`${t}.temperature.widthC`,e,{minimum:0,exclusiveMinimum:!0}));let r=n.pH;nn(r,["enabled","kind","optimum","width"],`${t}.pH`,e),Ue(r)&&(yo(r.enabled,`${t}.pH.enabled`,e),r.kind!=="gaussian"&&e.push(me(`${t}.pH.kind`,"only gaussian is supported","unsupported")),It(r.optimum,`${t}.pH.optimum`,e,{minimum:0,maximum:14}),It(r.width,`${t}.pH.width`,e,{minimum:0,exclusiveMinimum:!0}));let o=n.nutrient;nn(o,["enabled","kind","halfSaturationMgL"],`${t}.nutrient`,e),Ue(o)&&(yo(o.enabled,`${t}.nutrient.enabled`,e),o.kind!=="monod"&&e.push(me(`${t}.nutrient.kind`,"only monod is supported","unsupported")),It(o.halfSaturationMgL,`${t}.nutrient.halfSaturationMgL`,e,{minimum:0,exclusiveMinimum:!0}))}function Yl(n,e,t="model"){if(nn(n,["muMaxPerDay","carryingCapacityG_L","volumeL","environment","responseFactors"],t,e),!Ue(n))return;It(n.muMaxPerDay,`${t}.muMaxPerDay`,e,{minimum:0,maximum:10}),It(n.carryingCapacityG_L,`${t}.carryingCapacityG_L`,e,{minimum:0,exclusiveMinimum:!0,maximum:1e6}),It(n.volumeL,`${t}.volumeL`,e,{minimum:0,exclusiveMinimum:!0,maximum:1e6});let s=n.environment;nn(s,["lightPpfd","temperatureC","pH","nutrientMgL"],`${t}.environment`,e),Ue(s)&&(It(s.lightPpfd,`${t}.environment.lightPpfd`,e,{minimum:0,maximum:1e4}),It(s.temperatureC,`${t}.environment.temperatureC`,e,{minimum:-20,maximum:80}),It(s.pH,`${t}.environment.pH`,e,{minimum:0,maximum:14}),It(s.nutrientMgL,`${t}.environment.nutrientMgL`,e,{minimum:0,maximum:1e6})),Kf(n.responseFactors,e)}function Ju(n,e){nn(n,["id","label"],"scenario",e),Ue(n)&&((typeof n.id!="string"||!/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(n.id))&&e.push(me("scenario.id","must be a short identifier using letters, numbers, dot, underscore, or hyphen","identifier")),(typeof n.label!="string"||n.label.trim().length===0||n.label.length>160)&&e.push(me("scenario.label","must be a non-empty label of at most 160 characters","text")))}function Ku(n,e){if(nn(n,["profileId","label","scientificName","classification","parameterBasis","provenance"],"organism",e),!Ue(n))return;(!ss(n.profileId)||ss(n.profileId)!==n.profileId)&&e.push(me("organism.profileId","must be one of the supported reference/illustrative profiles","unsupported"));let t=Ci[n.profileId];t&&n.label!==t.label&&e.push(me("organism.label","does not match the selected profile","mismatch")),n.classification!=="reference / illustrative"&&e.push(me("organism.classification","must remain clearly labeled reference / illustrative","provenance")),Ue(n.provenance)||e.push(me("organism.provenance","must include provenance","provenance"))}function Qu(n,e){if(nn(n,["method","durationHours","stepHours"],"integration",e),!!Ue(n)&&(n.method!=="fixed-step-euler"&&e.push(me("integration.method","only fixed-step-euler is supported","unsupported")),It(n.durationHours,"integration.durationHours",e,{minimum:0,exclusiveMinimum:!0,maximum:is.maxDurationHours}),It(n.stepHours,"integration.stepHours",e,{minimum:0,exclusiveMinimum:!0,maximum:24}),tr(n.durationHours)&&tr(n.stepHours))){let t=n.durationHours/n.stepHours;Number.isInteger(t)||e.push(me("integration","durationHours must be evenly divisible by stepHours for fixed-step integration","divisibility")),t>is.maxIntegrationSteps&&e.push(me("integration",`step count exceeds ${is.maxIntegrationSteps}`,"workload-limit"))}}function eh(n,e){nn(n,["timeHours","biomassG_L"],"initialConditions",e),Ue(n)&&(It(n.timeHours,"initialConditions.timeHours",e,{minimum:0,maximum:1e6}),It(n.biomassG_L,"initialConditions.biomassG_L",e,{minimum:0,maximum:1e6}))}function th(n){let e=[];return Ue(n)?(nn(n,["format","version","schemaVersion","modelVersion","engineVersion","scenario","organism","model","initialConditions","integration","assumptions"],"input",e),n.format!==er&&e.push(me("format",`must be ${er}`,"version")),n.version!==1&&e.push(me("version","must be 1","version")),n.schemaVersion!==1&&e.push(me("schemaVersion","must be 1","version")),n.modelVersion!==gt&&e.push(me("modelVersion",`must be ${gt}`,"version")),n.engineVersion!==jt&&e.push(me("engineVersion",`must be ${jt}`,"version")),Ju(n.scenario,e),Ku(n.organism,e),Yl(n.model,e),eh(n.initialConditions,e),Qu(n.integration,e),(!Array.isArray(n.assumptions)||n.assumptions.length===0||n.assumptions.some(t=>typeof t!="string"))&&e.push(me("assumptions","must be a non-empty array of text assumptions","type")),{valid:e.length===0,errors:e}):{valid:!1,errors:[me("input","must be an object","type")]}}function Xl(n){let e=th(n);if(!e.valid)throw new Et("Simulation input validation failed",e.errors);return n}function Qf(n){if(!Ue(n))return{};let e={muMax:"muMaxPerDay",K:"carryingCapacityG_L",carryingCapacity:"carryingCapacityG_L",lightPpfd:"environment.lightPpfd",temperatureC:"environment.temperatureC",pH:"environment.pH",ph:"environment.pH",nutrientMgL:"environment.nutrientMgL",nutrient:"environment.nutrientMgL"},t={};for(let[i,s]of Object.entries(n)){let r=e[i]||i;if(r.includes(".")){let[o,a]=r.split(".");t[o]||={},t[o][a]=s}else i==="responses"?t.responseFactors=s:t[r]=s}return t}function ns(n,e){let t=e?Ci[e].illustrativeDefaults:{},i=Ue(n)?n:{},s=Hn(Zu,t),r=Qf(i),o=r.responseFactors||i.responseFactors,a=Hn(s,r);return o&&(a.responseFactors=Hn(s.responseFactors,o)),a}function Zl(n={},e="arthrospira"){let t=ss(e);if(!t)throw new Et("Unsupported organism profile",[me("organism","must be supported","unsupported")]);if(!Ue(n))throw new Et("Model configuration options must be an object",[me("model","must be an object","type")]);let i=Ue(n.configuration)&&n.snapshotVersion!==void 0?n.configuration:n,s=ns(i,t),r=[];return Yl(s,r),Jf(r,"Model configuration"),s}function ep(n){let e=Ue(n)?n:{},t=e.id??Wu,i=e.label??(t===Wu?"Baseline illustrative culture":String(t));return{id:String(t),label:String(i)}}function tp(n){if(!Ue(n))throw new Et("Simulation input options must be an object",[me("input","must be an object","type")]);let e=["organism","organismId","scenario","scenarioId","scenarioLabel","model","configuration","modelConfiguration","modelConfigurationSnapshot","initialConditions","initialBiomassG_L","initialBiomassGPerL","initialBiomass","initialTimeHours","durationHours","hours","stepHours","integration","simulation"],t=Object.keys(n).filter(p=>!e.includes(p));if(t.length>0)throw new Et("Unsupported simulation input option",t.map(p=>me(p,"unsupported value or field","unsupported")));for(let p of["scenario","model","configuration","modelConfiguration","modelConfigurationSnapshot","initialConditions","integration","simulation"])if(n[p]!==void 0&&!Ue(n[p]))throw new Et("Invalid simulation input option",[me(p,"must be an object","type")]);let i=[["scenario",["id","label"]],["initialConditions",["timeHours","biomassG_L","biomassGPerL","biomass","X"]],["integration",["method","durationHours","stepHours"]],["simulation",["method","durationHours","stepHours"]]];for(let[p,w]of i){if(n[p]===void 0)continue;let E=Object.keys(n[p]).filter(b=>!w.includes(b));if(E.length>0)throw new Et("Unsupported simulation input option",E.map(b=>me(`${p}.${b}`,"unsupported value or field","unsupported")))}let s=ss(n.organism??n.organismId??"arthrospira");if(!s)throw new Et("Unsupported organism profile",[me("organism","must be one of the supported reference/illustrative profiles","unsupported")]);let r=Ci[s],o=n.model??n.configuration??n.modelConfiguration??n.modelConfigurationSnapshot??{},a=Ue(o?.configuration)&&o.snapshotVersion!==void 0?o.configuration:o,l=ns(a,s),c=n.initialConditions??{},u=c.biomassG_L??c.biomassGPerL??c.biomass??c.X??n.initialBiomassG_L??n.initialBiomassGPerL??n.initialBiomass??.1,d=c.timeHours??n.initialTimeHours??0,h=n.integration??n.simulation??{},f=h.durationHours??n.durationHours??n.hours??72,g=h.stepHours??n.stepHours??1,y=h.method==="euler"?"fixed-step-euler":h.method??"fixed-step-euler",m=ep(n.scenario??{id:n.scenarioId,label:n.scenarioLabel});return{format:er,version:1,schemaVersion:1,modelVersion:gt,engineVersion:jt,scenario:m,organism:$l(s),model:l,initialConditions:{timeHours:d,biomassG_L:u},integration:{method:y,durationHours:f,stepHours:g},assumptions:et(Wl)}}function cn(n={}){if(Ue(n)&&n.format===er){let t=et(n);return Xl(t),t}let e=tp(n);return Xl(e),e}function nh(){return et(Object.values(Ci))}var I0=jl(et(Ci));var P0=jl(et(Zu));function vo(n){return Ue(n)&&n.format===er,cn(n)}function np(n){let e=n.environment,t=n.responseFactors,i=t.light.enabled?e.lightPpfd/(e.lightPpfd+t.light.halfSaturationPpfd):1,s=t.temperature.enabled?Math.exp(-.5*((e.temperatureC-t.temperature.optimumC)/t.temperature.widthC)**2):1,r=t.pH.enabled?Math.exp(-.5*((e.pH-t.pH.optimum)/t.pH.width)**2):1,o=t.nutrient.enabled?e.nutrientMgL/(e.nutrientMgL+t.nutrient.halfSaturationMgL):1;return{light:_o(i,0,1),temperature:_o(s,0,1),pH:_o(r,0,1),nutrient:_o(o,0,1)}}function ih(n,e){let t=np(e),i=e.muMaxPerDay*t.light*t.temperature*t.pH*t.nutrient,s=i*n*(1-n/e.carryingCapacityG_L);return{factors:t,muEffPerDay:i,derivativeG_LPerDay:s}}function sh(n,e){return n===0?e===0?0:null:(e-n)/Math.abs(n)}function ip(n,e){return n!==0?{defined:!0,reason:"non-zero-baseline"}:e===0?{defined:!0,reason:"zero-baseline-no-change"}:{defined:!1,reason:"zero-baseline-undefined"}}function $u({step:n,timeHours:e,biomassG_L:t,initialBiomassG_L:i,model:s}){let r=ih(t,s),o=t-i;return{step:n,timeHours:qt(e),biomassG_L:qt(t),biomassG:qt(t*s.volumeL),deltaFromInitialG_L:qt(o),deltaFromInitialG:qt(o*s.volumeL),relativeChangeFromInitial:sh(i,t),dXdtG_LPerDay:qt(r.derivativeG_LPerDay),muEffPerDay:qt(r.muEffPerDay),carryingCapacityG_L:qt(s.carryingCapacityG_L),lightFactor:qt(r.factors.light),temperatureFactor:qt(r.factors.temperature),pHFactor:qt(r.factors.pH),nutrientFactor:qt(r.factors.nutrient)}}function sp(n){return{snapshotVersion:1,modelVersion:gt,equation:Gl.biomass,configuration:et(n),...et(n)}}function rp(n){let e={};for(let[t,i]of Object.entries(n))e[t]=tr(i)?qt(i):i;return e}function nr(n){let e=vo(n);Xl(e);let t=e.model,i=e.initialConditions.biomassG_L,{durationHours:s,stepHours:r}=e.integration,o=s/r,a=r/24,l=[],c=i;l.push($u({step:0,timeHours:e.initialConditions.timeHours,biomassG_L:c,initialBiomassG_L:i,model:t}));for(let w=1;w<=o;w+=1){let E=ih(c,t),b=c+a*E.derivativeG_LPerDay;c=Math.max(0,qt(b)),l.push($u({step:w,timeHours:e.initialConditions.timeHours+w*r,biomassG_L:c,initialBiomassG_L:i,model:t}))}let u=l[0],d=l[l.length-1],h=sh(u.biomassG_L,d.biomassG_L),f=ip(u.biomassG_L,d.biomassG_L),g=u.biomassG_L===0&&d.biomassG_L===0||d.biomassG_L===0?0:d.dXdtG_LPerDay/d.biomassG_L,y=rp({initialBiomassG_L:u.biomassG_L,finalBiomassG_L:d.biomassG_L,deltaBiomassG_L:d.biomassG_L-u.biomassG_L,relativeChange:h,relativeChangePercent:h===null?null:h*100,relativeChangeDefined:f.defined,relativeChangeReason:f.reason,initialBiomassG:u.biomassG,finalBiomassG:d.biomassG,deltaBiomassG:d.biomassG-u.biomassG,endpointGrowthRatePerDay:g,endpointMuEffectivePerDay:d.muEffPerDay,endpointDerivativeG_LPerDay:d.dXdtG_LPerDay,endpointLogisticFactor:1-d.biomassG_L/t.carryingCapacityG_L,durationHours:s,stepHours:r,stepCount:o}),m=sp(t),p={format:ri,version:1,schemaVersion:1,modelVersion:gt,engineVersion:jt,scenario:et(e.scenario),organism:et(e.organism),inputSnapshot:et(e),initialConditions:et(e.initialConditions),modelConfigurationSnapshot:et(m),configurationSnapshot:et(m),modelVersionSnapshot:{version:1,modelVersion:gt,engineVersion:jt,equations:et(Gl),assumptions:et(Wl)},equations:et(Gl),assumptions:et(Wl),integration:et(e.integration),timeSeries:l,derivedMetrics:y};return Yt(p),p}function ql(n,e,t){typeof n=="number"&&!Number.isFinite(n)?t.push(me(e,"must be finite","finite-number")):Array.isArray(n)?n.forEach((i,s)=>ql(i,`${e}[${s}]`,t)):Ue(n)&&Object.entries(n).forEach(([i,s])=>ql(s,`${e}.${i}`,t))}function op(n){let e=[];if(!Ue(n))return{valid:!1,errors:[me("output","must be an object","type")]};if(nn(n,["format","version","schemaVersion","modelVersion","engineVersion","scenario","organism","inputSnapshot","initialConditions","modelConfigurationSnapshot","configurationSnapshot","modelVersionSnapshot","equations","assumptions","integration","timeSeries","derivedMetrics"],"output",e),n.format!==ri&&e.push(me("format",`must be ${ri}`,"version")),n.version!==1&&e.push(me("version","must be 1","version")),n.schemaVersion!==1&&e.push(me("schemaVersion","must be 1","version")),n.modelVersion!==gt&&e.push(me("modelVersion",`must be ${gt}`,"version")),n.engineVersion!==jt&&e.push(me("engineVersion",`must be ${jt}`,"version")),Ju(n.scenario,e),Ku(n.organism,e),!Ue(n.inputSnapshot))e.push(me("inputSnapshot","must be a versioned input snapshot","type"));else{let t=th(n.inputSnapshot);t.valid||e.push(...t.errors.map(i=>({...i,path:`inputSnapshot.${i.path}`})))}Ue(n.initialConditions)?eh(n.initialConditions,e):e.push(me("initialConditions","must be an object","type")),Qu(n.integration,e);for(let t of["modelConfigurationSnapshot","configurationSnapshot"]){let i=n[t];if(!Ue(i)){e.push(me(t,"must be a model configuration snapshot","type"));continue}if(i.snapshotVersion!==1&&e.push(me(`${t}.snapshotVersion`,"must be 1","version")),i.modelVersion!==gt&&e.push(me(`${t}.modelVersion`,`must be ${gt}`,"version")),!Ue(i.configuration))e.push(me(`${t}.configuration`,"must contain the captured model configuration","type"));else{Yl(i.configuration,e,`${t}.configuration`);for(let s of["muMaxPerDay","carryingCapacityG_L","volumeL","environment","responseFactors"])rs(i[s])!==rs(i.configuration[s])&&e.push(me(`${t}.${s}`,"must match the captured configuration","mismatch"))}}if(Ue(n.modelVersionSnapshot)?(n.modelVersionSnapshot.version!==1&&e.push(me("modelVersionSnapshot.version","must be 1","version")),n.modelVersionSnapshot.modelVersion!==gt&&e.push(me("modelVersionSnapshot.modelVersion",`must be ${gt}`,"version")),n.modelVersionSnapshot.engineVersion!==jt&&e.push(me("modelVersionSnapshot.engineVersion",`must be ${jt}`,"version")),Ue(n.modelVersionSnapshot.equations)||e.push(me("modelVersionSnapshot.equations","must contain equation documentation","type")),Array.isArray(n.modelVersionSnapshot.assumptions)||e.push(me("modelVersionSnapshot.assumptions","must contain assumptions","type"))):e.push(me("modelVersionSnapshot","must be a version snapshot","type")),(!Array.isArray(n.assumptions)||n.assumptions.length===0)&&e.push(me("assumptions","must be a non-empty array","type")),!Array.isArray(n.timeSeries)||n.timeSeries.length<1)e.push(me("timeSeries","must contain at least the initial point","type"));else{let t=-1/0;n.timeSeries.forEach((i,s)=>{if(!Ue(i)){e.push(me(`timeSeries[${s}]`,"must be an object","type"));return}for(let r of["step","timeHours","biomassG_L","biomassG","dXdtG_LPerDay","muEffPerDay"])It(i[r],`timeSeries[${s}].${r}`,e);i.timeHours<t&&e.push(me(`timeSeries[${s}].timeHours`,"must be monotonic","ordering")),t=i.timeHours,i.biomassG_L<0&&e.push(me(`timeSeries[${s}].biomassG_L`,"must not be negative","range"))})}return Ue(n.derivedMetrics)||e.push(me("derivedMetrics","must be an object","type")),ql(n,"output",e),{valid:e.length===0,errors:e}}function Yt(n){let e=op(n);if(!e.valid)throw new Et("Simulation output validation failed",e.errors);return n}function rh(n){return Yt(n),et(n.derivedMetrics)}function rs(n){return Array.isArray(n)?`[${n.map(e=>rs(e)).join(",")}]`:Ue(n)?`{${Object.keys(n).sort().map(e=>`${JSON.stringify(e)}:${rs(n[e])}`).join(",")}}`:JSON.stringify(n)}function Xu(n){let e;try{e=typeof n=="string"?JSON.parse(n):et(n)}catch(t){throw new Et(`Malformed simulation output: ${t.message}`,[me("output","must be valid JSON","malformed")])}return Yt(e),e}var qu=Object.freeze(["step","time_hours","biomass_g_l","biomass_g","delta_from_initial_g_l","delta_from_initial_g","relative_change_from_initial","dXdt_g_l_per_day","mu_eff_per_day","carrying_capacity_g_l","light_factor","temperature_factor","pH_factor","nutrient_factor"]);function ap(n){if(n==null)return"";let e=String(n);return/[",\n\r]/.test(e)?`"${e.replaceAll('"','""')}"`:e}function lp(n){return Yt(n),n.timeSeries.map(e=>({step:e.step,time_hours:e.timeHours,biomass_g_l:e.biomassG_L,biomass_g:e.biomassG,delta_from_initial_g_l:e.deltaFromInitialG_L,delta_from_initial_g:e.deltaFromInitialG,relative_change_from_initial:e.relativeChangeFromInitial,dXdt_g_l_per_day:e.dXdtG_LPerDay,mu_eff_per_day:e.muEffPerDay,carrying_capacity_g_l:e.carryingCapacityG_L,light_factor:e.lightFactor,temperature_factor:e.temperatureFactor,pH_factor:e.pHFactor,nutrient_factor:e.nutrientFactor}))}function Jl(n){let e=lp(n);return[qu.join(","),...e.map(t=>qu.map(i=>ap(t[i])).join(","))].join(`
`)+`
`}function cp(n){if(typeof n!="string")return null;let e=n.trim();if(ts.includes(e))return e;if(e.startsWith("configuration.")){let i=`model.${e.slice(14)}`;if(ts.includes(i))return i}if(e.startsWith("modelConfiguration.")){let i=`model.${e.slice(19)}`;if(ts.includes(i))return i}let t=`model.${e}`;return ts.includes(t)?t:null}function up(n,e){return e.split(".").reduce((t,i)=>t?.[i],n)}function hp(n,e,t){let i=e.split("."),s=et(n),r=s;for(let o=0;o<i.length-1;o+=1)r=r[i[o]];return r[i.at(-1)]=et(t),s}function dp(n,e="copy"){return`${n}-${e}`.replace(/[^A-Za-z0-9._-]/g,"-").slice(0,64)||"scenario-copy"}function oh(n,e={}){let t=n?.format===ri?n.inputSnapshot:vo(n),i=Ue(e)?e:{},s=et(t);if(i.parameterPath!==void 0||i.path!==void 0){let c=cp(i.parameterPath??i.path);if(!c)throw new Et("Unsupported scenario parameter path",[me("parameterPath","is not sweepable","unsupported")]);if(s=hp(s,c,i.value),c==="organism.profileId"){let u=ss(i.value);if(!u)throw new Et("Unsupported organism profile",[me("value","must be supported","unsupported")]);s.organism=$l(u)}}let r={};for(let c of["muMaxPerDay","muMax","K","carryingCapacityG_L","carryingCapacity","volumeL","environment","responseFactors","responses","lightPpfd","temperatureC","pH","ph","nutrientMgL","nutrient"])Object.hasOwn(i,c)&&(r[c]=i[c]);if(Object.keys(r).length>0&&(s.model=ns(Hn(s.model,r),s.organism.profileId)),Ue(i.model)&&(s.model=ns(Hn(s.model,i.model),s.organism.profileId)),Ue(i.configuration)&&(s.model=ns(Hn(s.model,i.configuration),s.organism.profileId)),Ue(i.initialConditions)&&(s.initialConditions=Hn(s.initialConditions,i.initialConditions)),Ue(i.integration)&&(s.integration=Hn(s.integration,i.integration)),i.organism!==void 0||i.organismId!==void 0){let c=ss(i.organism??i.organismId);if(!c)throw new Et("Unsupported organism profile",[me("organism","must be supported","unsupported")]);s.organism=$l(c),s.model=ns(s.model,c)}let o=Ue(i.scenario)?i.scenario:{},a=i.scenarioId??o.id??dp(t.scenario.id),l=i.scenarioLabel??o.label??`${t.scenario.label} copy`;return s.scenario={id:a,label:l},cn(s)}function ju(n){return Object.fromEntries(ts.map(t=>[t,up(n,t)]))}function Yu(n){let e=n.derivedMetrics;return{initialBiomassG_L:e.initialBiomassG_L,finalBiomassG_L:e.finalBiomassG_L,deltaBiomassG_L:e.deltaBiomassG_L,relativeChange:e.relativeChange,endpointGrowthRatePerDay:e.endpointGrowthRatePerDay}}function Kl(n,e){let t=n?.format===ri?n.inputSnapshot:vo(n),i=e?.format===ri?e.inputSnapshot:vo(e),s=n?.format===ri?Xu(n):nr(t),r=e?.format===ri?Xu(e):nr(i),o=ju(t),a=ju(i),l=[];for(let h of ts){let f=o[h],g=a[h];rs(f)!==rs(g)&&l.push({path:h,before:et(f),after:et(g)})}let c=l.map(h=>h.path),u=Yu(s),d=Yu(r);return{format:jf,version:1,schemaVersion:1,modelVersion:gt,leftScenario:et(t.scenario),rightScenario:et(i.scenario),changedParameters:l,changedParameterPaths:c,changedParametersCount:l.length,identicalParameters:l.length===0,metrics:{left:u,right:d,difference:{finalBiomassG_L:d.finalBiomassG_L-u.finalBiomassG_L,deltaBiomassG_L:d.deltaBiomassG_L-u.deltaBiomassG_L,relativeChange:u.relativeChange===null||d.relativeChange===null?null:d.relativeChange-u.relativeChange,endpointGrowthRatePerDay:d.endpointGrowthRatePerDay-u.endpointGrowthRatePerDay}},leftOutput:s,rightOutput:r}}var os="orr-algal-digital-lab",gh="orr-algal-digital-lab";var ur="local-player",ah="synthetic-computational";var ir="orr.algal-digital-lab",Vn=Object.freeze({projects:Object.freeze({collection:"projects",singular:"project",idPrefix:"project",schema:`${ir}/project`,version:1}),experiments:Object.freeze({collection:"experiments",singular:"experiment",idPrefix:"experiment",schema:`${ir}/experiment`,version:1}),runs:Object.freeze({collection:"runs",singular:"run",idPrefix:"run",schema:`${ir}/run`,version:1}),notebookEntries:Object.freeze({collection:"notebookEntries",singular:"notebook-entry",idPrefix:"notebook_entry",schema:`${ir}/notebook-entry`,version:1}),uiSettings:Object.freeze({collection:"uiSettings",singular:"ui-settings",idPrefix:"ui_settings",schema:`${ir}/ui-settings`,version:1})}),lh=Object.freeze({project:"projects",projects:"projects",experiment:"experiments",experiments:"experiments",run:"runs",runs:"runs",notebook:"notebookEntries",notebookEntry:"notebookEntries",notebookEntries:"notebookEntries",notebook_entry:"notebookEntries",notebook_entries:"notebookEntries","notebook-entry":"notebookEntries",uiSetting:"uiSettings",uiSettings:"uiSettings",ui_setting:"uiSettings",ui_settings:"uiSettings","ui-settings":"uiSettings",settings:"uiSettings"}),cr=Object.freeze(Object.keys(Vn)),U0=Object.freeze({projects:Object.freeze({collection:"projects",schema:Vn.projects.schema,version:1,required:Object.freeze(["id","playerId","name","provenance"])}),experiments:Object.freeze({collection:"experiments",schema:Vn.experiments.schema,version:1,required:Object.freeze(["id","playerId","title","provenance"])}),runs:Object.freeze({collection:"runs",schema:Vn.runs.schema,version:1,required:Object.freeze(["id","playerId","experimentId","timeSeries","provenance"])}),notebookEntries:Object.freeze({collection:"notebookEntries",schema:Vn.notebookEntries.schema,version:1,required:Object.freeze(["id","playerId","title","content","provenance"])}),uiSettings:Object.freeze({collection:"uiSettings",schema:Vn.uiSettings.schema,version:1,required:Object.freeze(["id","playerId","scope","settings","provenance"])})}),fp=new Set(["schema","version","schemaVersion","entityType","id","playerId","ownerId","createdAt","updatedAt","provenance","dataOrigin"]),pp=new Set(["schema","version","schemaVersion","entityType","id","playerId","ownerId","createdAt","updatedAt","dataOrigin"]),mp=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,gp=/^[A-Za-z0-9][A-Za-z0-9._~-]{0,127}$/,_h=/^[A-Za-z0-9][A-Za-z0-9._~-]{0,191}$/,ch=new Set(["draft","planned","running","completed","archived","failed"]),_p=new Set(["__proto__","constructor","prototype"]),uh=0,We=class extends Error{constructor(e,t,i){super(t),this.name="PersistenceError",this.code=e,i!==void 0&&(this.cause=i)}},Ql=class extends We{constructor(e,t){super("QUOTA_EXCEEDED",e,t),this.name="StorageQuotaError"}},Ni=class extends We{constructor(e,t,i){super(e,t,i),this.name="StorageError"}},je=class extends We{constructor(e,t){super("VALIDATION_ERROR",e,t),this.name="ValidationError"}};function Li(n,e){throw new je(n,e)}function Gn(n){if(n===null||typeof n!="object"||Array.isArray(n))return!1;let e=Object.getPrototypeOf(n);return e===Object.prototype||e===null}function hn(n,e){return Gn(n)||Li(`${e} must be a JSON object.`),n}function Ui(n,e="$",t=new Set,i=0){if(i>64&&Li(`${e} exceeds the supported JSON nesting depth.`),!(n===null||typeof n=="string"||typeof n=="boolean")){if(typeof n=="number"){Number.isFinite(n)||Li(`${e} must not contain a non-finite number.`);return}if(typeof n!="object"&&Li(`${e} must contain JSON-compatible values.`),t.has(n)&&Li(`${e} must not contain cyclic data.`),t.add(n),Array.isArray(n))for(let s=0;s<n.length;s+=1)Ui(n[s],`${e}[${s}]`,t,i+1);else{hn(n,e);for(let[s,r]of Object.entries(n))_p.has(s)&&Li(`${e} contains an unsafe JSON key.`),r===void 0&&Li(`${e}.${s} must not be undefined.`),Ui(r,`${e}.${s}`,t,i+1)}t.delete(n)}}function Zt(n,e="value"){Ui(n,e);try{return JSON.parse(JSON.stringify(n))}catch(t){throw new je(`${e} could not be serialized as JSON.`,t)}}function hh(n,e="JSON"){if(typeof n!="string")throw new We("INVALID_JSON",`${e} must be a JSON string.`);try{let t=JSON.parse(n);return Ui(t,e),t}catch(t){throw new We("INVALID_JSON",`${e} is not valid JSON.`,t)}}function un(n=ur){let e=String(n).trim();if(!gp.test(e))throw new je("playerId must be 1-128 URL-safe letters, numbers, or . _ ~ - characters.");return e}function yp(n=ur){return`${gh}:v1:${encodeURIComponent(un(n))}`}function Ii(n){let e=Object.prototype.hasOwnProperty.call(lh,n)?lh[n]:null;if(!e)throw new je(`Unknown persistence entity type: ${String(n)}.`);return e}function Di(n){let e=String(n);try{if(typeof TextEncoder=="function")return new TextEncoder().encode(e).byteLength}catch{}return encodeURIComponent(e).replace(/%[0-9A-F]{2}|./g,"x").length}function dh(n="The in-memory storage quota was exceeded."){let e=new Error(n);return e.name="QuotaExceededError",e.code=22,e}function hr(n={}){let e=n.quotaBytes===void 0?1/0:n.quotaBytes;if(!(e===1/0||Number.isInteger(e)&&e>=0))throw new TypeError("quotaBytes must be a non-negative integer or Infinity.");let t=new Map,i=n.initial;if(i!==void 0){if(!Gn(i))throw new TypeError("initial storage values must be an object.");for(let[r,o]of Object.entries(i))t.set(String(r),String(o))}function s(){let r=0;for(let[o,a]of t)r+=Di(o)+Di(a);return r}if(s()>e)throw dh();return{__orrStorageKind:"memory",get length(){return t.size},key(r){return!Number.isInteger(r)||r<0||r>=t.size?null:Array.from(t.keys())[r]??null},getItem(r){let o=String(r);return t.has(o)?t.get(o):null},setItem(r,o){let a=String(r),l=String(o),c=t.get(a),u=c===void 0?0:Di(a)+Di(c);if(s()-u+Di(a)+Di(l)>e)throw dh();t.set(a,l)},removeItem(r){t.delete(String(r))},clear(){t.clear()},get quotaBytes(){return e}}}function yh(n){return n!==null&&typeof n=="object"&&typeof n.getItem=="function"&&typeof n.setItem=="function"&&typeof n.removeItem=="function"}function vp(){try{let n=globalThis.localStorage;if(yh(n))return n.getItem(`${gh}:availability`),{storage:n,kind:"localStorage"}}catch{}return{storage:hr(),kind:"memory"}}function xp(n){return n?.name==="QuotaExceededError"||n?.code===22||n?.code===1014||/quota|storage\s+full/i.test(String(n?.message||""))}function bp(n,e){try{return n.getItem(e)}catch(t){throw new Ni("STORAGE_READ_FAILED","The local persistence store could not be read.",t)}}function Sp(n,e,t){try{n.setItem(e,t)}catch(i){throw xp(i)?new Ql("The local persistence store quota is full; no changes were saved.",i):new Ni("STORAGE_WRITE_FAILED","The local persistence store could not be written.",i)}}function or(n){let e=typeof n=="function"?n():new Date,t=e instanceof Date?e:new Date(e);if(Number.isNaN(t.getTime()))throw new je("The persistence clock must return a valid date.");return t.toISOString()}function oi(n,e,t){if(n==null||n==="")return t;if(typeof n!="string"||!mp.test(n)||Number.isNaN(Date.parse(n))||new Date(n).toISOString()!==n)throw new je(`${e} must be an ISO-8601 UTC timestamp.`);return n}function Rn(n,e,t={}){let{required:i=!1,fallback:s=""}=t;if(n==null){if(i&&!s)throw new je(`${e} is required.`);return s}if(typeof n!="string")throw new je(`${e} must be a string.`);let r=n.trim();if(i&&r.length===0)throw new je(`${e} must not be empty.`);return r}function Pi(n,e){return n==null?"":Rn(n,e)}function ar(n,e){if(n==null)return[];if(!Array.isArray(n))throw new je(`${e} must be an array of strings.`);return n.map((t,i)=>Rn(t,`${e}[${i}]`,{required:!0}))}function sr(n,e,t={}){return n==null?Zt(t,e):(hn(n,e),Zt(n,e))}function fh(n,e,t){let i=Rn(n,e,{fallback:t});if(!ch.has(i))throw new je(`${e} must be one of: ${Array.from(ch).join(", ")}.`);return i}function Mp(n,e){let t=n;if(t==null||String(t).trim()==="")throw new je(`${e.singular} id is required.`);if(t=String(t).trim(),!_h.test(t))throw new je("Record id contains unsupported characters.");return t}function rr(n,e){if(n==null||n==="")return null;let t=String(n).trim();if(!_h.test(t))throw new je(`${e} must be a stable record id.`);return t}function tc(n){let e=n??{};if(hn(e,"provenance"),e.kind!==void 0&&e.kind!=="synthetic-computational")throw new je("provenance.kind must be synthetic-computational.");if(e.origin!==void 0&&e.origin!=="synthetic")throw new je("provenance.origin must be synthetic; measured records must remain separate.");if(e.synthetic!==void 0&&e.synthetic!==!0)throw new je("provenance.synthetic must be true for Algal Digital Lab records.");if(e.computational!==void 0&&e.computational!==!0)throw new je("provenance.computational must be true for Algal Digital Lab records.");let t={...Zt(e,"provenance"),kind:"synthetic-computational",origin:"synthetic",source:Rn(e.source,"provenance.source",{fallback:"algal-digital-lab"}),method:Rn(e.method,"provenance.method",{fallback:"local computational model"}),synthetic:!0,computational:!0};return e.sourceRefs!==void 0&&(t.sourceRefs=ar(e.sourceRefs,"provenance.sourceRefs")),e.derivedFrom!==void 0&&(t.derivedFrom=ar(e.derivedFrom,"provenance.derivedFrom")),t}function nc(n){let e=n==null?ah:String(n).trim();if(e!==ah)throw new je("dataOrigin must be synthetic-computational.");return e}function Ep(n){Ui(n,"record");let e={};for(let[t,i]of Object.entries(n))fp.has(t)||(e[t]=Zt(i,`record.${t}`));return e}function vh(n){if(n==null)return[];if(!Array.isArray(n))throw new je("timeSeries must be an array of data points.");return n.map((e,t)=>{hn(e,`timeSeries[${t}]`);let i=Zt(e,`timeSeries[${t}]`),s=i.elapsedSeconds??i.t??i.time;if(s!==void 0&&(typeof s!="number"||!Number.isFinite(s)))throw new je(`timeSeries[${t}] elapsed time must be a finite number.`);if(i.timeHours!==void 0&&(typeof i.timeHours!="number"||!Number.isFinite(i.timeHours)))throw new je(`timeSeries[${t}] timeHours must be a finite number.`);return i.timestamp!==void 0&&(i.timestamp=oi(i.timestamp,`timeSeries[${t}].timestamp`,null)),i.provenance!==void 0&&(i.provenance=tc(i.provenance)),i.dataOrigin!==void 0&&(i.dataOrigin=nc(i.dataOrigin)),i})}function xo(n,e,t){let i=Vn[n],s=hn(e,`${i.singular} record`),r=t.playerId,o=t.now;if(s.playerId!==void 0&&un(s.playerId)!==r)throw new je(`${i.singular} playerId does not belong to this player namespace.`);if(s.ownerId!==void 0&&un(s.ownerId)!==r)throw new je(`${i.singular} ownerId does not belong to this player namespace.`);if(s.schema!==void 0&&s.schema!==i.schema)throw new je(`${i.singular} schema is not supported.`);if(s.entityType!==void 0&&s.entityType!==i.singular)throw new je(`${i.singular} entityType is not supported.`);if(s.version!==void 0&&s.version!==i.version)throw new je(`${i.singular} version is not supported.`);if(s.schemaVersion!==void 0&&s.schemaVersion!==i.version)throw new je(`${i.singular} schemaVersion is not supported.`);let a=t.requestedId??s.id??t.existing?.id,l=Mp(a,i),c=t.preserveTimestamps?oi(s.createdAt,`${i.singular}.createdAt`,o):t.existing?.createdAt??o,u=t.preserveTimestamps?oi(s.updatedAt,`${i.singular}.updatedAt`,c):o,d=Ep(s),h={schema:i.schema,version:i.version,schemaVersion:i.version,entityType:i.singular,id:l,playerId:r,ownerId:r,createdAt:c,updatedAt:u,dataOrigin:nc(s.dataOrigin),provenance:tc(s.provenance)};if(n==="projects"){let g=Rn(s.name??s.title,"project.name",{required:!0});return{...d,...h,name:g,description:Pi(s.description,"project.description"),organism:Pi(s.organism,"project.organism"),model:Pi(s.model,"project.model"),tags:ar(s.tags,"project.tags")}}if(n==="experiments"){let g=Rn(s.title??s.name,"experiment.title",{required:!0});return{...d,...h,title:g,projectId:rr(s.projectId,"experiment.projectId"),hypothesis:Pi(s.hypothesis,"experiment.hypothesis"),protocol:Pi(s.protocol,"experiment.protocol"),parameters:sr(s.parameters,"experiment.parameters"),status:fh(s.status,"experiment.status","draft"),tags:ar(s.tags,"experiment.tags")}}if(n==="runs"){let g=Pi(s.label??s.title,"run.label");return{...d,...h,label:g,experimentId:rr(s.experimentId,"run.experimentId"),status:fh(s.status,"run.status","planned"),parameters:sr(s.parameters,"run.parameters"),summary:sr(s.summary,"run.summary"),metrics:sr(s.metrics,"run.metrics"),timeSeries:vh(s.timeSeries),startedAt:oi(s.startedAt,"run.startedAt",null),endedAt:oi(s.endedAt,"run.endedAt",null)}}if(n==="notebookEntries"){let g=Rn(s.title??s.name,"notebookEntry.title",{fallback:"Untitled entry"});return{...d,...h,title:g,content:Pi(s.content??s.body??s.markdown,"notebookEntry.content"),projectId:rr(s.projectId,"notebookEntry.projectId"),experimentId:rr(s.experimentId,"notebookEntry.experimentId"),runId:rr(s.runId,"notebookEntry.runId"),tags:ar(s.tags,"notebookEntry.tags")}}let f=Rn(s.scope,"uiSettings.scope",{fallback:"lab",required:!0});return{...d,...h,scope:f,settings:sr(s.settings,"uiSettings.settings")}}function wp(){return{projects:[],experiments:[],runs:[],notebookEntries:[],uiSettings:[]}}function lr(n=ur,e=new Date().toISOString()){let t=un(n),i=oi(e,"state.updatedAt",new Date().toISOString());return{format:os,schema:os,version:1,schemaVersion:1,playerId:t,ownerId:t,revision:0,createdAt:i,updatedAt:i,collections:wp()}}function Tp(n,e){if(n.format!==void 0&&n.format!==os)throw new We("UNSUPPORTED_FORMAT","The persistence export format is not supported.");if(n.schema!==void 0&&n.schema!==os)throw new We("UNSUPPORTED_FORMAT","The persistence state schema is not supported.");let t=n.version??n.schemaVersion;if(n.version!==void 0&&n.schemaVersion!==void 0&&n.version!==n.schemaVersion)throw new We("UNSUPPORTED_VERSION","The persistence version fields do not agree.");if(t!==1)throw Number.isInteger(t)&&t>1?new We("UNSUPPORTED_VERSION",`The persistence state version ${t} is newer than version 1.`):new We("UNSUPPORTED_VERSION","The persistence state version is not supported.");if(n.playerId===void 0||un(n.playerId)!==e||n.ownerId!==void 0&&un(n.ownerId)!==e)throw new je("Imported state belongs to a different player namespace.")}function Ap(n,e,t={}){hn(n,"state"),Ui(n,"state"),Tp(n,e);let i=t.now??new Date().toISOString(),s=n.collections;hn(s,"state.collections");let r=lr(e,oi(n.createdAt,"state.createdAt",i));r.updatedAt=oi(n.updatedAt,"state.updatedAt",r.createdAt),r.revision=Number.isInteger(n.revision)&&n.revision>=0?n.revision:0;for(let o of cr){let a=s[o];if(a===void 0){r.collections[o]=[];continue}if(!Array.isArray(a))throw new We("INVALID_STATE",`state.collections.${o} must be an array.`);let l=new Set;r.collections[o]=a.map(c=>{let u=xo(o,c,{playerId:e,now:i,preserveTimestamps:!0});if(l.has(u.id))throw new We("INVALID_STATE",`Duplicate ${o} id ${u.id}.`);return l.add(u.id),u})}return r}function Rp(n){let e=Gn(n.collections)?n.collections:n;return Object.fromEntries(cr.map(t=>[t,e[t]]))}function ph(n,e={}){let t=typeof e=="string"?{playerId:e}:e,i=un(t.playerId??ur),s=t.now??or(t.clock);if(n==null||(hn(n,"state"),Ui(n,"state"),Object.keys(n).length===0))return lr(i,s);if(n.format!==void 0&&n.format!==os)throw new We("UNSUPPORTED_FORMAT","The persistence export format is not supported.");if(n.schema!==void 0&&n.schema!==os)throw new We("UNSUPPORTED_FORMAT","The persistence state schema is not supported.");if(n.playerId!==void 0&&un(n.playerId)!==i||n.ownerId!==void 0&&un(n.ownerId)!==i)throw new je("Imported state belongs to a different player namespace.");let r=n.version??n.schemaVersion;if(r===1)return Ap(n,i,{now:s});if(r!==void 0&&r!==0)throw Number.isInteger(r)&&r>1?new We("UNSUPPORTED_VERSION",`The persistence state version ${r} is newer than version 1.`):new We("UNSUPPORTED_VERSION","The persistence state version is not supported.");let o=Rp(n),a=cr.some(u=>o[u]!==void 0),l=r===0&&Object.keys(n).every(u=>["version","schemaVersion","playerId","ownerId","format","schema"].includes(u));if(!a&&!l)throw new We("INVALID_STATE","The persistence state has no recognized collections.");let c=lr(i,s);for(let u of cr){let d=o[u];if(d===void 0)continue;if(!Array.isArray(d))throw new We("INVALID_STATE",`Legacy ${u} must be an array.`);let h=new Set;c.collections[u]=d.map((f,g)=>{hn(f,`legacy ${u}[${g}]`);let y={...f};delete y.schema,delete y.version,delete y.schemaVersion,delete y.entityType,u==="projects"&&y.name===void 0&&(y.name=y.title??`Imported project ${g+1}`),u==="experiments"&&y.title===void 0&&(y.title=y.name??`Imported experiment ${g+1}`),y.id===void 0&&(y.id=`${Vn[u].idPrefix}_imported_${g+1}`);let m=xo(u,y,{playerId:i,now:s,preserveTimestamps:!0});if(h.has(m.id))throw new We("INVALID_STATE",`Duplicate ${u} id ${m.id}.`);return h.add(m.id),m})}return c}function Cp(n){if(n!==void 0&&typeof n!="function")throw new TypeError("idFactory must be a function.");return n??(e=>{let t=globalThis.crypto;if(t&&typeof t.randomUUID=="function")return`${e}_${t.randomUUID()}`;if(t&&typeof t.getRandomValues=="function"){let i=new Uint8Array(16);return t.getRandomValues(i),`${e}_${Array.from(i,s=>s.toString(16).padStart(2,"0")).join("")}`}return uh+=1,`${e}_${Date.now().toString(36)}_${uh.toString(36)}`})}function Ip(n){return String(n).trim().toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"")||"lab"}function Pp(n,e){try{return JSON.stringify(n)===JSON.stringify(e)}catch{return!1}}function mh(n){if(n==null)return"";let e=String(n);return typeof n=="string"&&/^\s*[=+\-@]/.test(e)&&(e=`'${e}`),/[",\r\n]/.test(e)?`"${e.replace(/"/g,'""')}"`:e}function xh(n,e="",t={}){if(n==null)return t;if(typeof n!="object"||Array.isArray(n))return e&&(t[e]=n),t;for(let i of Object.keys(n).sort()){let s=e?`${e}.${i}`:i;xh(n[i],s,t)}return t}function Lp(n){let e={},t=[n.values,n.metrics,n.measurements];for(let s of t)s!==void 0&&xh(s,"",e);let i=new Set(["t","time","elapsedSeconds","timeHours","timestamp","values","metrics","measurements","provenance","dataOrigin"]);for(let[s,r]of Object.entries(n))!i.has(s)&&(r===null||typeof r!="object")&&(e[s]=r);return e}function Dp(n,e={}){let t=vh(n),i=t.map(l=>Lp(l)),s=Array.from(new Set(i.flatMap(l=>Object.keys(l)))).sort(),r=e.includeRunId!==!1&&e.runId!==void 0,o=[];r&&o.push("runId"),o.push("sampleIndex","elapsedSeconds","timestamp",...s);let a=[o.map(mh).join(",")];return t.forEach((l,c)=>{let u=i[c],d=l.elapsedSeconds??l.t??l.time??(l.timeHours===void 0?"":l.timeHours*3600),h=[];r&&h.push(e.runId),h.push(c,d,l.timestamp??""),h.push(...s.map(f=>u[f]??"")),a.push(h.map(mh).join(","))}),`${a.join(`
`)}
`}function Np(n,e={}){return hn(n,"run"),tc(n.provenance),nc(n.dataOrigin),Dp(n.timeSeries??[],{...e,runId:e.runId??n.id})}function Up(n={}){let e=n.baseUrl??n.apiBaseUrl,t=e==null?"":String(e).trim(),i=e!==void 0&&t.length===0||t==="/",s=i?"":t.replace(/\/$/,""),r=(s.length>0||i)&&n.enabled!==!1,o=n.fetchImpl,a=Number.isInteger(n.timeoutMs)?n.timeoutMs:8e3;if(r&&s.length>0){let h;try{h=new URL(s)}catch(f){throw new We("BACKEND_CONFIG_INVALID","baseUrl must be an explicit HTTP(S) API origin.",f)}if(!["http:","https:"].includes(h.protocol)||h.username||h.password||h.search||h.hash||h.pathname!=="/")throw new We("BACKEND_CONFIG_INVALID","baseUrl must be an HTTP(S) origin without credentials, query, or path.")}function l(){return{configured:r,baseUrl:r?s:null,label:r?"optional local backend":"local browser only"}}function c(h){let f=`/api/state/${encodeURIComponent(un(h))}`;return s?new URL(f,`${s}/`).toString():f}function u(){return s?new URL("/health",`${s}/`).toString():"/health"}async function d(h,f){if(!r)throw new We("BACKEND_NOT_CONFIGURED","No optional persistence backend is configured.");let g=o??globalThis.fetch;if(typeof g!="function")throw new We("BACKEND_UNAVAILABLE","The configured persistence backend needs a fetch implementation.");let y,m=typeof AbortController=="function"?new AbortController:null,p=m?globalThis.setTimeout?.(()=>m.abort(),a):null;try{y=await g(c(h),{...f,credentials:"omit",cache:"no-store",...m?{signal:m.signal}:{},headers:{"Content-Type":"application/json",...n.headers??{},...f.headers??{}}})}catch(E){throw new We("BACKEND_REQUEST_FAILED",E?.name==="AbortError"?`The optional persistence backend timed out after ${a} ms.`:"The optional persistence backend could not be reached.",E)}finally{p!==null&&globalThis.clearTimeout?.(p)}if(y.status===404&&f.method==="GET")return null;let w;try{w=await y.json()}catch(E){throw new We("BACKEND_INVALID_RESPONSE","The optional persistence backend returned invalid JSON.",E)}if(!y.ok){let E=Gn(w)?w.message??w.error:null;throw new We("BACKEND_REQUEST_FAILED",E||`The optional persistence backend returned HTTP ${y.status}.`)}if(!Gn(w)||w.ok!==!0||w.playerId!==un(h)||!Gn(w.state))throw new We("BACKEND_INVALID_RESPONSE","The optional persistence backend returned an invalid state envelope.");return w}return Object.freeze({configured:r,baseUrl:r?s:null,status:l,async load(h){let f=await d(h,{method:"GET"});return f===null?null:Zt(f.state,"backend state")},async health(){let h=o??globalThis.fetch;if(typeof h!="function")throw new We("BACKEND_UNAVAILABLE","The configured persistence backend needs a fetch implementation.");let f=typeof AbortController=="function"?new AbortController:null,g=f?globalThis.setTimeout?.(()=>f.abort(),a):null,y;try{y=await h(u(),{method:"GET",credentials:"omit",cache:"no-store",...f?{signal:f.signal}:{},headers:{...n.headers??{}}})}catch(p){throw new We("BACKEND_REQUEST_FAILED",p?.name==="AbortError"?`The optional persistence backend timed out after ${a} ms.`:"The optional persistence backend could not be reached.",p)}finally{g!==null&&globalThis.clearTimeout?.(g)}let m=await y.json().catch(()=>null);if(!y.ok||!Gn(m)||m.ok!==!0)throw new We("BACKEND_REQUEST_FAILED",m?.message||`The optional persistence backend returned HTTP ${y.status}.`);return m},async save(h,f){let g=Zt(f,"backend state"),y=JSON.stringify(g);if(Di(y)>65536)throw new We("BACKEND_PAYLOAD_TOO_LARGE","The local Node API accepts at most 64 KiB; the local save and JSON export are still available.");return d(h,{method:"PUT",body:y})}})}var ec=class{constructor(e={}){let t=e.storage===void 0?vp():(()=>{if(!yh(e.storage))throw new TypeError("storage must implement getItem, setItem, and removeItem.");return{storage:e.storage,kind:e.storage.__orrStorageKind??"custom"}})();this.playerId=un(e.playerId??ur),this.storage=t.storage,this.storageKind=t.kind,this.storageKey=e.storageKey===void 0?yp(this.playerId):String(e.storageKey),this.clock=e.clock,this.idFactory=Cp(e.idFactory),this.backend=e.backend??Up({baseUrl:e.backendBaseUrl??e.apiBaseUrl,fetchImpl:e.fetchImpl,headers:e.backendHeaders,timeoutMs:e.backendTimeoutMs});let i=bp(this.storage,this.storageKey);if(this.loadedFromEmpty=i===null||i==="",this.loadedFromEmpty)this._state=lr(this.playerId,or(this.clock));else{let s;try{s=hh(i,"stored state")}catch(r){throw new Ni("CORRUPT_STORAGE","The local persistence state contains invalid JSON.",r)}try{this._state=ph(s,{playerId:this.playerId,clock:this.clock})}catch(r){throw r instanceof We?r:new Ni("CORRUPT_STORAGE","The local persistence state could not be validated.",r)}}}state(){return Zt(this._state,"state")}getState(){return this.state()}initialize(){return this._write(this._state),this.loadedFromEmpty=!1,this.state()}_write(e){let t;try{t=JSON.stringify(e)}catch(i){throw new Ni("SERIALIZATION_FAILED","The persistence state could not be serialized.",i)}Sp(this.storage,this.storageKey,t)}_commit(e){let t=or(this.clock),i={...this._state,revision:this._state.revision+1,updatedAt:t,collections:Zt(e,"state.collections")};return this._write(i),this._state=i,this.loadedFromEmpty=!1,this.state()}_newId(e,t){let i=Vn[e];if(t.id!==void 0&&t.id!==null&&String(t.id).trim()!=="")return t.id;if(e==="uiSettings"){let r=Rn(t.scope,"uiSettings.scope",{fallback:"lab",required:!0});return`${i.idPrefix}_${Ip(r)}`}let s=this.idFactory(i.idPrefix,this.playerId);if(s==null||String(s).trim()==="")throw new je("idFactory must return a stable id.");return s}create(e,t={}){let i=Ii(e);hn(t,`${i} input`);let s=or(this.clock),r=xo(i,t,{playerId:this.playerId,now:s,requestedId:this._newId(i,t),preserveTimestamps:!1}),o=this._state.collections[i];if(o.some(c=>c.id===r.id))throw new We("ID_CONFLICT",`${i} id ${r.id} already exists for this player.`);let a=[...o,r],l={...this._state.collections,[i]:a};return this._commit(l).collections[i].find(c=>c.id===r.id)}get(e,t){let i=Ii(e),s=String(t),r=this._state.collections[i].find(o=>o.id===s);return r?Zt(r,`${i} record`):null}require(e,t){let i=this.get(e,t);if(!i)throw new We("NOT_FOUND",`No ${Ii(e)} record exists with id ${String(t)}.`);return i}list(e,t={}){let i=Ii(e),s=typeof t=="function"?{predicate:t}:t??{},r=s.predicate??s.where??(Gn(s)?s:void 0),o=this._state.collections[i].filter(a=>{if(typeof r=="function"&&!r(Zt(a,"record")))return!1;if(Gn(r)){for(let[l,c]of Object.entries(r))if(!Pp(a[l],c))return!1}return!0});return o.sort((a,l)=>a.createdAt.localeCompare(l.createdAt)||a.id.localeCompare(l.id)),Zt(o,`${i} records`)}update(e,t,i={}){let s=Ii(e);hn(i,`${s} patch`);let r=this._state.collections[s],o=r.findIndex(h=>h.id===String(t));if(o<0)throw new We("NOT_FOUND",`No ${s} record exists with id ${String(t)}.`);for(let h of pp)if(Object.prototype.hasOwnProperty.call(i,h))throw new je(`${h} is managed by the persistence layer and cannot be changed.`);let a=or(this.clock),l={...r[o],...Zt(i,"patch")},c=xo(s,l,{playerId:this.playerId,now:a,existing:r[o],requestedId:r[o].id,preserveTimestamps:!1}),u=r.slice();u[o]=c;let d={...this._state.collections,[s]:u};return this._commit(d).collections[s][o]}remove(e,t){let i=Ii(e),s=this._state.collections[i],r=s.filter(o=>o.id!==String(t));return r.length===s.length?!1:(this._commit({...this._state.collections,[i]:r}),!0)}deleteRecord(e,t){return this.remove(e,t)}delete(e,t){return this.remove(e,t)}count(e){return this.list(e).length}clear(e){let t=Ii(e);return this._state.collections[t].length===0?!1:(this._commit({...this._state.collections,[t]:[]}),!0)}exportState(){return this.state()}exportJSON(e={}){let t=e.pretty!==!1;return`${JSON.stringify(this._state,null,t?2:0)}
`}importState(e,t={}){let i=ph(e,{playerId:this.playerId,clock:this.clock}),s=t.mode??(t.merge?"merge":"replace");if(s!=="replace"&&s!=="merge")throw new je("import mode must be replace or merge.");if(s==="replace")return this._commit(i.collections);let r={};for(let o of cr){let a=new Map(this._state.collections[o].map(l=>[l.id,l]));for(let l of i.collections[o])a.set(l.id,l);r[o]=Array.from(a.values())}return this._commit(r)}importJSON(e,t={}){let i=typeof e=="string"?hh(e,"imported state"):Zt(e,"imported state");return this.importState(i,t)}exportRunCSV(e,t={}){return Np(this.require("runs",e),{...t,runId:t.runId??String(e)})}backendStatus(){return this.backend&&typeof this.backend.status=="function"?this.backend.status():{configured:!!this.backend?.configured,baseUrl:this.backend?.baseUrl??null}}async saveToBackend(){if(!this.backend||this.backend.configured!==!0)throw new We("BACKEND_NOT_CONFIGURED","No optional persistence backend is configured.");return this.backend.save(this.playerId,this.exportState())}async loadFromBackend(e={}){if(!this.backend||this.backend.configured!==!0)throw new We("BACKEND_NOT_CONFIGURED","No optional persistence backend is configured.");let t=await this.backend.load(this.playerId);return t==null?null:this.importState(t,{mode:e.mode??"replace"})}async syncToBackend(){return this.saveToBackend()}async checkBackend(){if(!this.backend||this.backend.configured!==!0||typeof this.backend.health!="function")throw new We("BACKEND_NOT_CONFIGURED","No optional persistence backend is configured.");return this.backend.health()}createProject(e){return this.create("projects",e)}getProject(e){return this.get("projects",e)}listProjects(e){return this.list("projects",e)}updateProject(e,t){return this.update("projects",e,t)}deleteProject(e){return this.remove("projects",e)}createExperiment(e){return this.create("experiments",e)}getExperiment(e){return this.get("experiments",e)}listExperiments(e){return this.list("experiments",e)}updateExperiment(e,t){return this.update("experiments",e,t)}deleteExperiment(e){return this.remove("experiments",e)}createRun(e){return this.create("runs",e)}getRun(e){return this.get("runs",e)}listRuns(e){return this.list("runs",e)}updateRun(e,t){return this.update("runs",e,t)}deleteRun(e){return this.remove("runs",e)}createNotebookEntry(e){return this.create("notebookEntries",e)}getNotebookEntry(e){return this.get("notebookEntries",e)}listNotebookEntries(e){return this.list("notebookEntries",e)}updateNotebookEntry(e,t){return this.update("notebookEntries",e,t)}deleteNotebookEntry(e){return this.remove("notebookEntries",e)}createUISettings(e){return this.create("uiSettings",e)}getUISettings(e){return this.get("uiSettings",e)}listUISettings(e){return this.list("uiSettings",e)}updateUISettings(e,t){return this.update("uiSettings",e,t)}deleteUISettings(e){return this.remove("uiSettings",e)}createUiSettings(e){return this.createUISettings(e)}getUiSettings(e){return this.getUISettings(e)}listUiSettings(e){return this.listUISettings(e)}updateUiSettings(e,t){return this.updateUISettings(e,t)}deleteUiSettings(e){return this.deleteUISettings(e)}};function as(n={}){return new ec(n)}var vi={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},xi={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},Jh=0,kc=1,Kh=2;var zc=1,Qh=2,Fn=3,Zn=0,Wt=1,$t=2,Qn=0,Hi=1,Qr=2,Hc=3,Vc=4,ed=5,mi=100,td=101,nd=102,id=103,sd=104,rd=200,od=201,ad=202,ld=203,Xo=204,qo=205,cd=206,ud=207,hd=208,dd=209,fd=210,pd=211,md=212,gd=213,_d=214,Aa=0,Ra=1,Ca=2,Vi=3,Ia=4,Pa=5,La=6,Da=7,Gc=0,yd=1,vd=2,ei=0,xd=1,bd=2,Sd=3,Na=4,Md=5,Ed=6,wd=7;var Wc=300,Xi=301,qi=302,Ua=303,Oa=304,eo=306,jo=1e3,pi=1001,Yo=1002,Jt=1003,Td=1004;var to=1005;var Sn=1006,Fa=1007;var bi=1008;var wn=1009,$c=1010,Xc=1011,Fs=1012,Ba=1013,Si=1014,Tn=1015,Bs=1016,ka=1017,za=1018,ks=1020,qc=35902,jc=35899,Yc=1021,Zc=1022,gn=1023,Ms=1026,zs=1027,Ha=1028,Va=1029,Jc=1030,Ga=1031;var Wa=1033,no=33776,io=33777,so=33778,ro=33779,$a=35840,Xa=35841,qa=35842,ja=35843,Ya=36196,Za=37492,Ja=37496,Ka=37808,Qa=37809,el=37810,tl=37811,nl=37812,il=37813,sl=37814,rl=37815,ol=37816,al=37817,ll=37818,cl=37819,ul=37820,hl=37821,dl=36492,fl=36494,pl=36495,ml=36283,gl=36284,_l=36285,yl=36286;var Er=2300,Zo=2301,$o=2302,Ic=2400,Pc=2401,Lc=2402;var Ad=3200,Rd=3201;var Kc=0,Cd=1,ti="",Vt="srgb",Gi="srgb-linear",wr="linear",st="srgb";var zi=7680;var Dc=519,Id=512,Pd=513,Ld=514,Qc=515,Dd=516,Nd=517,Ud=518,Od=519,Nc=35044;var eu="300 es",bn=2e3,Tr=2001;var Cn=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(t)===-1&&i[e].push(t)}hasEventListener(e,t){let i=this._listeners;return i===void 0?!1:i[e]!==void 0&&i[e].indexOf(t)!==-1}removeEventListener(e,t){let i=this._listeners;if(i===void 0)return;let s=i[e];if(s!==void 0){let r=s.indexOf(t);r!==-1&&s.splice(r,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let i=t[e.type];if(i!==void 0){e.target=this;let s=i.slice(0);for(let r=0,o=s.length;r<o;r++)s[r].call(this,e);e.target=null}}},Ft=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],bh=1234567,xr=Math.PI/180,Es=180/Math.PI;function Hs(){let n=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(Ft[n&255]+Ft[n>>8&255]+Ft[n>>16&255]+Ft[n>>24&255]+"-"+Ft[e&255]+Ft[e>>8&255]+"-"+Ft[e>>16&15|64]+Ft[e>>24&255]+"-"+Ft[t&63|128]+Ft[t>>8&255]+"-"+Ft[t>>16&255]+Ft[t>>24&255]+Ft[i&255]+Ft[i>>8&255]+Ft[i>>16&255]+Ft[i>>24&255]).toLowerCase()}function ke(n,e,t){return Math.max(e,Math.min(t,n))}function tu(n,e){return(n%e+e)%e}function Op(n,e,t,i,s){return i+(n-e)*(s-i)/(t-e)}function Fp(n,e,t){return n!==e?(t-n)/(e-n):0}function br(n,e,t){return(1-t)*n+t*e}function Bp(n,e,t,i){return br(n,e,1-Math.exp(-t*i))}function kp(n,e=1){return e-Math.abs(tu(n,e*2)-e)}function zp(n,e,t){return n<=e?0:n>=t?1:(n=(n-e)/(t-e),n*n*(3-2*n))}function Hp(n,e,t){return n<=e?0:n>=t?1:(n=(n-e)/(t-e),n*n*n*(n*(n*6-15)+10))}function Vp(n,e){return n+Math.floor(Math.random()*(e-n+1))}function Gp(n,e){return n+Math.random()*(e-n)}function Wp(n){return n*(.5-Math.random())}function $p(n){n!==void 0&&(bh=n);let e=bh+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function Xp(n){return n*xr}function qp(n){return n*Es}function jp(n){return(n&n-1)===0&&n!==0}function Yp(n){return Math.pow(2,Math.ceil(Math.log(n)/Math.LN2))}function Zp(n){return Math.pow(2,Math.floor(Math.log(n)/Math.LN2))}function Jp(n,e,t,i,s){let r=Math.cos,o=Math.sin,a=r(t/2),l=o(t/2),c=r((e+i)/2),u=o((e+i)/2),d=r((e-i)/2),h=o((e-i)/2),f=r((i-e)/2),g=o((i-e)/2);switch(s){case"XYX":n.set(a*u,l*d,l*h,a*c);break;case"YZY":n.set(l*h,a*u,l*d,a*c);break;case"ZXZ":n.set(l*d,l*h,a*u,a*c);break;case"XZX":n.set(a*u,l*g,l*f,a*c);break;case"YXY":n.set(l*f,a*u,l*g,a*c);break;case"ZYZ":n.set(l*g,l*f,a*u,a*c);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+s)}}function bs(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("Invalid component type.")}}function Ht(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("Invalid component type.")}}var ji={DEG2RAD:xr,RAD2DEG:Es,generateUUID:Hs,clamp:ke,euclideanModulo:tu,mapLinear:Op,inverseLerp:Fp,lerp:br,damp:Bp,pingpong:kp,smoothstep:zp,smootherstep:Hp,randInt:Vp,randFloat:Gp,randFloatSpread:Wp,seededRandom:$p,degToRad:Xp,radToDeg:qp,isPowerOfTwo:jp,ceilPowerOfTwo:Yp,floorPowerOfTwo:Zp,setQuaternionFromProperEuler:Jp,normalize:Ht,denormalize:bs},re=class n{constructor(e=0,t=0){n.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,i=this.y,s=e.elements;return this.x=s[0]*t+s[3]*i+s[6],this.y=s[1]*t+s[4]*i+s[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=ke(this.x,e.x,t.x),this.y=ke(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=ke(this.x,e,t),this.y=ke(this.y,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(ke(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(ke(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y;return t*t+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let i=Math.cos(t),s=Math.sin(t),r=this.x-e.x,o=this.y-e.y;return this.x=r*i-o*s+e.x,this.y=r*s+o*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},pn=class{constructor(e=0,t=0,i=0,s=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=i,this._w=s}static slerpFlat(e,t,i,s,r,o,a){let l=i[s+0],c=i[s+1],u=i[s+2],d=i[s+3],h=r[o+0],f=r[o+1],g=r[o+2],y=r[o+3];if(a===0){e[t+0]=l,e[t+1]=c,e[t+2]=u,e[t+3]=d;return}if(a===1){e[t+0]=h,e[t+1]=f,e[t+2]=g,e[t+3]=y;return}if(d!==y||l!==h||c!==f||u!==g){let m=1-a,p=l*h+c*f+u*g+d*y,w=p>=0?1:-1,E=1-p*p;if(E>Number.EPSILON){let I=Math.sqrt(E),A=Math.atan2(I,p*w);m=Math.sin(m*A)/I,a=Math.sin(a*A)/I}let b=a*w;if(l=l*m+h*b,c=c*m+f*b,u=u*m+g*b,d=d*m+y*b,m===1-a){let I=1/Math.sqrt(l*l+c*c+u*u+d*d);l*=I,c*=I,u*=I,d*=I}}e[t]=l,e[t+1]=c,e[t+2]=u,e[t+3]=d}static multiplyQuaternionsFlat(e,t,i,s,r,o){let a=i[s],l=i[s+1],c=i[s+2],u=i[s+3],d=r[o],h=r[o+1],f=r[o+2],g=r[o+3];return e[t]=a*g+u*d+l*f-c*h,e[t+1]=l*g+u*h+c*d-a*f,e[t+2]=c*g+u*f+a*h-l*d,e[t+3]=u*g-a*d-l*h-c*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,i,s){return this._x=e,this._y=t,this._z=i,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let i=e._x,s=e._y,r=e._z,o=e._order,a=Math.cos,l=Math.sin,c=a(i/2),u=a(s/2),d=a(r/2),h=l(i/2),f=l(s/2),g=l(r/2);switch(o){case"XYZ":this._x=h*u*d+c*f*g,this._y=c*f*d-h*u*g,this._z=c*u*g+h*f*d,this._w=c*u*d-h*f*g;break;case"YXZ":this._x=h*u*d+c*f*g,this._y=c*f*d-h*u*g,this._z=c*u*g-h*f*d,this._w=c*u*d+h*f*g;break;case"ZXY":this._x=h*u*d-c*f*g,this._y=c*f*d+h*u*g,this._z=c*u*g+h*f*d,this._w=c*u*d-h*f*g;break;case"ZYX":this._x=h*u*d-c*f*g,this._y=c*f*d+h*u*g,this._z=c*u*g-h*f*d,this._w=c*u*d+h*f*g;break;case"YZX":this._x=h*u*d+c*f*g,this._y=c*f*d+h*u*g,this._z=c*u*g-h*f*d,this._w=c*u*d-h*f*g;break;case"XZY":this._x=h*u*d-c*f*g,this._y=c*f*d-h*u*g,this._z=c*u*g+h*f*d,this._w=c*u*d+h*f*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let i=t/2,s=Math.sin(i);return this._x=e.x*s,this._y=e.y*s,this._z=e.z*s,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,i=t[0],s=t[4],r=t[8],o=t[1],a=t[5],l=t[9],c=t[2],u=t[6],d=t[10],h=i+a+d;if(h>0){let f=.5/Math.sqrt(h+1);this._w=.25/f,this._x=(u-l)*f,this._y=(r-c)*f,this._z=(o-s)*f}else if(i>a&&i>d){let f=2*Math.sqrt(1+i-a-d);this._w=(u-l)/f,this._x=.25*f,this._y=(s+o)/f,this._z=(r+c)/f}else if(a>d){let f=2*Math.sqrt(1+a-i-d);this._w=(r-c)/f,this._x=(s+o)/f,this._y=.25*f,this._z=(l+u)/f}else{let f=2*Math.sqrt(1+d-i-a);this._w=(o-s)/f,this._x=(r+c)/f,this._y=(l+u)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let i=e.dot(t)+1;return i<1e-8?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(ke(this.dot(e),-1,1)))}rotateTowards(e,t){let i=this.angleTo(e);if(i===0)return this;let s=Math.min(1,t/i);return this.slerp(e,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let i=e._x,s=e._y,r=e._z,o=e._w,a=t._x,l=t._y,c=t._z,u=t._w;return this._x=i*u+o*a+s*c-r*l,this._y=s*u+o*l+r*a-i*c,this._z=r*u+o*c+i*l-s*a,this._w=o*u-i*a-s*l-r*c,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);let i=this._x,s=this._y,r=this._z,o=this._w,a=o*e._w+i*e._x+s*e._y+r*e._z;if(a<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,a=-a):this.copy(e),a>=1)return this._w=o,this._x=i,this._y=s,this._z=r,this;let l=1-a*a;if(l<=Number.EPSILON){let f=1-t;return this._w=f*o+t*this._w,this._x=f*i+t*this._x,this._y=f*s+t*this._y,this._z=f*r+t*this._z,this.normalize(),this}let c=Math.sqrt(l),u=Math.atan2(c,a),d=Math.sin((1-t)*u)/c,h=Math.sin(t*u)/c;return this._w=o*d+this._w*h,this._x=i*d+this._x*h,this._y=s*d+this._y*h,this._z=r*d+this._z*h,this._onChangeCallback(),this}slerpQuaternions(e,t,i){return this.copy(e).slerp(t,i)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),i=Math.random(),s=Math.sqrt(1-i),r=Math.sqrt(i);return this.set(s*Math.sin(e),s*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},R=class n{constructor(e=0,t=0,i=0){n.prototype.isVector3=!0,this.x=e,this.y=t,this.z=i}set(e,t,i){return i===void 0&&(i=this.z),this.x=e,this.y=t,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Sh.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Sh.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,i=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[3]*i+r[6]*s,this.y=r[1]*t+r[4]*i+r[7]*s,this.z=r[2]*t+r[5]*i+r[8]*s,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,i=this.y,s=this.z,r=e.elements,o=1/(r[3]*t+r[7]*i+r[11]*s+r[15]);return this.x=(r[0]*t+r[4]*i+r[8]*s+r[12])*o,this.y=(r[1]*t+r[5]*i+r[9]*s+r[13])*o,this.z=(r[2]*t+r[6]*i+r[10]*s+r[14])*o,this}applyQuaternion(e){let t=this.x,i=this.y,s=this.z,r=e.x,o=e.y,a=e.z,l=e.w,c=2*(o*s-a*i),u=2*(a*t-r*s),d=2*(r*i-o*t);return this.x=t+l*c+o*d-a*u,this.y=i+l*u+a*c-r*d,this.z=s+l*d+r*u-o*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,i=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[4]*i+r[8]*s,this.y=r[1]*t+r[5]*i+r[9]*s,this.z=r[2]*t+r[6]*i+r[10]*s,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=ke(this.x,e.x,t.x),this.y=ke(this.y,e.y,t.y),this.z=ke(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=ke(this.x,e,t),this.y=ke(this.y,e,t),this.z=ke(this.z,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(ke(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let i=e.x,s=e.y,r=e.z,o=t.x,a=t.y,l=t.z;return this.x=s*l-r*a,this.y=r*o-i*l,this.z=i*a-s*o,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let i=e.dot(this)/t;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return ic.copy(this).projectOnVector(e),this.sub(ic)}reflect(e){return this.sub(ic.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(ke(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y,s=this.z-e.z;return t*t+i*i+s*s}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,i){let s=Math.sin(t)*e;return this.x=s*Math.sin(i),this.y=Math.cos(t)*e,this.z=s*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,i){return this.x=e*Math.sin(t),this.y=i,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),s=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=i,this.z=s,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,i=Math.sqrt(1-t*t);return this.x=i*Math.cos(e),this.y=t,this.z=i*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},ic=new R,Sh=new pn,ze=class n{constructor(e,t,i,s,r,o,a,l,c){n.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,i,s,r,o,a,l,c)}set(e,t,i,s,r,o,a,l,c){let u=this.elements;return u[0]=e,u[1]=s,u[2]=a,u[3]=t,u[4]=r,u[5]=l,u[6]=i,u[7]=o,u[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],this}extractBasis(e,t,i){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,s=t.elements,r=this.elements,o=i[0],a=i[3],l=i[6],c=i[1],u=i[4],d=i[7],h=i[2],f=i[5],g=i[8],y=s[0],m=s[3],p=s[6],w=s[1],E=s[4],b=s[7],I=s[2],A=s[5],P=s[8];return r[0]=o*y+a*w+l*I,r[3]=o*m+a*E+l*A,r[6]=o*p+a*b+l*P,r[1]=c*y+u*w+d*I,r[4]=c*m+u*E+d*A,r[7]=c*p+u*b+d*P,r[2]=h*y+f*w+g*I,r[5]=h*m+f*E+g*A,r[8]=h*p+f*b+g*P,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[1],s=e[2],r=e[3],o=e[4],a=e[5],l=e[6],c=e[7],u=e[8];return t*o*u-t*a*c-i*r*u+i*a*l+s*r*c-s*o*l}invert(){let e=this.elements,t=e[0],i=e[1],s=e[2],r=e[3],o=e[4],a=e[5],l=e[6],c=e[7],u=e[8],d=u*o-a*c,h=a*l-u*r,f=c*r-o*l,g=t*d+i*h+s*f;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);let y=1/g;return e[0]=d*y,e[1]=(s*c-u*i)*y,e[2]=(a*i-s*o)*y,e[3]=h*y,e[4]=(u*t-s*l)*y,e[5]=(s*r-a*t)*y,e[6]=f*y,e[7]=(i*l-c*t)*y,e[8]=(o*t-i*r)*y,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,i,s,r,o,a){let l=Math.cos(r),c=Math.sin(r);return this.set(i*l,i*c,-i*(l*o+c*a)+o+e,-s*c,s*l,-s*(-c*o+l*a)+a+t,0,0,1),this}scale(e,t){return this.premultiply(sc.makeScale(e,t)),this}rotate(e){return this.premultiply(sc.makeRotation(-e)),this}translate(e,t){return this.premultiply(sc.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,i,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,i=e.elements;for(let s=0;s<9;s++)if(t[s]!==i[s])return!1;return!0}fromArray(e,t=0){for(let i=0;i<9;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}},sc=new ze;function nu(n){for(let e=n.length-1;e>=0;--e)if(n[e]>=65535)return!0;return!1}function Ar(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function Fd(){let n=Ar("canvas");return n.style.display="block",n}var Mh={};function ws(n){n in Mh||(Mh[n]=!0,console.warn(n))}function Bd(n,e,t){return new Promise(function(i,s){function r(){switch(n.clientWaitSync(e,n.SYNC_FLUSH_COMMANDS_BIT,0)){case n.WAIT_FAILED:s();break;case n.TIMEOUT_EXPIRED:setTimeout(r,t);break;default:i()}}setTimeout(r,t)})}var Eh=new ze().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),wh=new ze().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Kp(){let n={enabled:!0,workingColorSpace:Gi,spaces:{},convert:function(s,r,o){return this.enabled===!1||r===o||!r||!o||(this.spaces[r].transfer===st&&(s.r=Yn(s.r),s.g=Yn(s.g),s.b=Yn(s.b)),this.spaces[r].primaries!==this.spaces[o].primaries&&(s.applyMatrix3(this.spaces[r].toXYZ),s.applyMatrix3(this.spaces[o].fromXYZ)),this.spaces[o].transfer===st&&(s.r=Ss(s.r),s.g=Ss(s.g),s.b=Ss(s.b))),s},workingToColorSpace:function(s,r){return this.convert(s,this.workingColorSpace,r)},colorSpaceToWorking:function(s,r){return this.convert(s,r,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===ti?wr:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,r=this.workingColorSpace){return s.fromArray(this.spaces[r].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,r,o){return s.copy(this.spaces[r].toXYZ).multiply(this.spaces[o].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(s,r){return ws("THREE.ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),n.workingToColorSpace(s,r)},toWorkingColorSpace:function(s,r){return ws("THREE.ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),n.colorSpaceToWorking(s,r)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],i=[.3127,.329];return n.define({[Gi]:{primaries:e,whitePoint:i,transfer:wr,toXYZ:Eh,fromXYZ:wh,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:Vt},outputColorSpaceConfig:{drawingBufferColorSpace:Vt}},[Vt]:{primaries:e,whitePoint:i,transfer:st,toXYZ:Eh,fromXYZ:wh,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:Vt}}}),n}var Ze=Kp();function Yn(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function Ss(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}var ls,Jo=class{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let i;if(e instanceof HTMLCanvasElement)i=e;else{ls===void 0&&(ls=Ar("canvas")),ls.width=e.width,ls.height=e.height;let s=ls.getContext("2d");e instanceof ImageData?s.putImageData(e,0,0):s.drawImage(e,0,0,e.width,e.height),i=ls}return i.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=Ar("canvas");t.width=e.width,t.height=e.height;let i=t.getContext("2d");i.drawImage(e,0,0,e.width,e.height);let s=i.getImageData(0,0,e.width,e.height),r=s.data;for(let o=0;o<r.length;o++)r[o]=Yn(r[o]/255)*255;return i.putImageData(s,0,0),t}else if(e.data){let t=e.data.slice(0);for(let i=0;i<t.length;i++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[i]=Math.floor(Yn(t[i]/255)*255):t[i]=Yn(t[i]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},Qp=0,Ts=class{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Qp++}),this.uuid=Hs(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):t instanceof VideoFrame?e.set(t.displayHeight,t.displayWidth,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let i={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let o=0,a=s.length;o<a;o++)s[o].isDataTexture?r.push(rc(s[o].image)):r.push(rc(s[o]))}else r=rc(s);i.url=r}return t||(e.images[this.uuid]=i),i}};function rc(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?Jo.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}var em=0,oc=new R,Kt=class n extends Cn{constructor(e=n.DEFAULT_IMAGE,t=n.DEFAULT_MAPPING,i=pi,s=pi,r=Sn,o=bi,a=gn,l=wn,c=n.DEFAULT_ANISOTROPY,u=ti){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:em++}),this.uuid=Hs(),this.name="",this.source=new Ts(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=i,this.wrapT=s,this.magFilter=r,this.minFilter=o,this.anisotropy=c,this.format=a,this.internalFormat=null,this.type=l,this.offset=new re(0,0),this.repeat=new re(1,1),this.center=new re(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new ze,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0}get width(){return this.source.getSize(oc).x}get height(){return this.source.getSize(oc).y}get depth(){return this.source.getSize(oc).z}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let i=e[t];if(i===void 0){console.warn(`THREE.Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let s=this[t];if(s===void 0){console.warn(`THREE.Texture.setValues(): property '${t}' does not exist.`);continue}s&&i&&s.isVector2&&i.isVector2||s&&i&&s.isVector3&&i.isVector3||s&&i&&s.isMatrix3&&i.isMatrix3?s.copy(i):this[t]=i}}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let i={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),t||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==Wc)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case jo:e.x=e.x-Math.floor(e.x);break;case pi:e.x=e.x<0?0:1;break;case Yo:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case jo:e.y=e.y-Math.floor(e.y);break;case pi:e.y=e.y<0?0:1;break;case Yo:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};Kt.DEFAULT_IMAGE=null;Kt.DEFAULT_MAPPING=Wc;Kt.DEFAULT_ANISOTROPY=1;var it=class n{constructor(e=0,t=0,i=0,s=1){n.prototype.isVector4=!0,this.x=e,this.y=t,this.z=i,this.w=s}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,i,s){return this.x=e,this.y=t,this.z=i,this.w=s,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,i=this.y,s=this.z,r=this.w,o=e.elements;return this.x=o[0]*t+o[4]*i+o[8]*s+o[12]*r,this.y=o[1]*t+o[5]*i+o[9]*s+o[13]*r,this.z=o[2]*t+o[6]*i+o[10]*s+o[14]*r,this.w=o[3]*t+o[7]*i+o[11]*s+o[15]*r,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,i,s,r,l=e.elements,c=l[0],u=l[4],d=l[8],h=l[1],f=l[5],g=l[9],y=l[2],m=l[6],p=l[10];if(Math.abs(u-h)<.01&&Math.abs(d-y)<.01&&Math.abs(g-m)<.01){if(Math.abs(u+h)<.1&&Math.abs(d+y)<.1&&Math.abs(g+m)<.1&&Math.abs(c+f+p-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let E=(c+1)/2,b=(f+1)/2,I=(p+1)/2,A=(u+h)/4,P=(d+y)/4,N=(g+m)/4;return E>b&&E>I?E<.01?(i=0,s=.707106781,r=.707106781):(i=Math.sqrt(E),s=A/i,r=P/i):b>I?b<.01?(i=.707106781,s=0,r=.707106781):(s=Math.sqrt(b),i=A/s,r=N/s):I<.01?(i=.707106781,s=.707106781,r=0):(r=Math.sqrt(I),i=P/r,s=N/r),this.set(i,s,r,t),this}let w=Math.sqrt((m-g)*(m-g)+(d-y)*(d-y)+(h-u)*(h-u));return Math.abs(w)<.001&&(w=1),this.x=(m-g)/w,this.y=(d-y)/w,this.z=(h-u)/w,this.w=Math.acos((c+f+p-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=ke(this.x,e.x,t.x),this.y=ke(this.y,e.y,t.y),this.z=ke(this.z,e.z,t.z),this.w=ke(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=ke(this.x,e,t),this.y=ke(this.y,e,t),this.z=ke(this.z,e,t),this.w=ke(this.w,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(ke(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this.w=e.w+(t.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},Ko=class extends Cn{constructor(e=1,t=1,i={}){super(),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Sn,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1},i),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=i.depth,this.scissor=new it(0,0,e,t),this.scissorTest=!1,this.viewport=new it(0,0,e,t);let s={width:e,height:t,depth:i.depth},r=new Kt(s);this.textures=[];let o=i.count;for(let a=0;a<o;a++)this.textures[a]=r.clone(),this.textures[a].isRenderTargetTexture=!0,this.textures[a].renderTarget=this;this._setTextureOptions(i),this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=i.depthTexture,this.samples=i.samples,this.multiview=i.multiview}_setTextureOptions(e={}){let t={minFilter:Sn,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let i=0;i<this.textures.length;i++)this.textures[i].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),e!==null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,i=1){if(this.width!==e||this.height!==t||this.depth!==i){this.width=e,this.height=t,this.depth=i;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=e,this.textures[s].image.height=t,this.textures[s].image.depth=i,this.textures[s].isArrayTexture=this.textures[s].image.depth>1;this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,i=e.textures.length;t<i;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let s=Object.assign({},e.textures[t].image);this.textures[t].source=new Ts(s)}return this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},In=class extends Ko{constructor(e=1,t=1,i={}){super(e,t,i),this.isWebGLRenderTarget=!0}},Rr=class extends Kt{constructor(e=null,t=1,i=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:i,depth:s},this.magFilter=Jt,this.minFilter=Jt,this.wrapR=pi,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var Qo=class extends Kt{constructor(e=null,t=1,i=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:i,depth:s},this.magFilter=Jt,this.minFilter=Jt,this.wrapR=pi,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var Pn=class{constructor(e=new R(1/0,1/0,1/0),t=new R(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t+=3)this.expandByPoint(yn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,i=e.count;t<i;t++)this.expandByPoint(yn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let i=yn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let i=e.geometry;if(i!==void 0){let r=i.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let o=0,a=r.count;o<a;o++)e.isMesh===!0?e.getVertexPosition(o,yn):yn.fromBufferAttribute(r,o),yn.applyMatrix4(e.matrixWorld),this.expandByPoint(yn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),bo.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),bo.copy(i.boundingBox)),bo.applyMatrix4(e.matrixWorld),this.union(bo)}let s=e.children;for(let r=0,o=s.length;r<o;r++)this.expandByObject(s[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,yn),yn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,i;return e.normal.x>0?(t=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),t<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(dr),So.subVectors(this.max,dr),cs.subVectors(e.a,dr),us.subVectors(e.b,dr),hs.subVectors(e.c,dr),ai.subVectors(us,cs),li.subVectors(hs,us),Oi.subVectors(cs,hs);let t=[0,-ai.z,ai.y,0,-li.z,li.y,0,-Oi.z,Oi.y,ai.z,0,-ai.x,li.z,0,-li.x,Oi.z,0,-Oi.x,-ai.y,ai.x,0,-li.y,li.x,0,-Oi.y,Oi.x,0];return!ac(t,cs,us,hs,So)||(t=[1,0,0,0,1,0,0,0,1],!ac(t,cs,us,hs,So))?!1:(Mo.crossVectors(ai,li),t=[Mo.x,Mo.y,Mo.z],ac(t,cs,us,hs,So))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,yn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(yn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Wn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Wn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Wn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Wn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Wn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Wn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Wn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Wn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Wn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},Wn=[new R,new R,new R,new R,new R,new R,new R,new R],yn=new R,bo=new Pn,cs=new R,us=new R,hs=new R,ai=new R,li=new R,Oi=new R,dr=new R,So=new R,Mo=new R,Fi=new R;function ac(n,e,t,i,s){for(let r=0,o=n.length-3;r<=o;r+=3){Fi.fromArray(n,r);let a=s.x*Math.abs(Fi.x)+s.y*Math.abs(Fi.y)+s.z*Math.abs(Fi.z),l=e.dot(Fi),c=t.dot(Fi),u=i.dot(Fi);if(Math.max(-Math.max(l,c,u),Math.min(l,c,u))>a)return!1}return!0}var tm=new Pn,fr=new R,lc=new R,Ln=class{constructor(e=new R,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let i=this.center;t!==void 0?i.copy(t):tm.setFromPoints(e).getCenter(i);let s=0;for(let r=0,o=e.length;r<o;r++)s=Math.max(s,i.distanceToSquared(e[r]));return this.radius=Math.sqrt(s),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let i=this.center.distanceToSquared(e);return t.copy(e),i>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;fr.subVectors(e,this.center);let t=fr.lengthSq();if(t>this.radius*this.radius){let i=Math.sqrt(t),s=(i-this.radius)*.5;this.center.addScaledVector(fr,s/i),this.radius+=s}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(lc.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(fr.copy(e.center).add(lc)),this.expandByPoint(fr.copy(e.center).sub(lc))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},$n=new R,cc=new R,Eo=new R,ci=new R,uc=new R,wo=new R,hc=new R,gi=class{constructor(e=new R,t=new R(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,$n)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let i=t.dot(this.direction);return i<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=$n.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):($n.copy(this.origin).addScaledVector(this.direction,t),$n.distanceToSquared(e))}distanceSqToSegment(e,t,i,s){cc.copy(e).add(t).multiplyScalar(.5),Eo.copy(t).sub(e).normalize(),ci.copy(this.origin).sub(cc);let r=e.distanceTo(t)*.5,o=-this.direction.dot(Eo),a=ci.dot(this.direction),l=-ci.dot(Eo),c=ci.lengthSq(),u=Math.abs(1-o*o),d,h,f,g;if(u>0)if(d=o*l-a,h=o*a-l,g=r*u,d>=0)if(h>=-g)if(h<=g){let y=1/u;d*=y,h*=y,f=d*(d+o*h+2*a)+h*(o*d+h+2*l)+c}else h=r,d=Math.max(0,-(o*h+a)),f=-d*d+h*(h+2*l)+c;else h=-r,d=Math.max(0,-(o*h+a)),f=-d*d+h*(h+2*l)+c;else h<=-g?(d=Math.max(0,-(-o*r+a)),h=d>0?-r:Math.min(Math.max(-r,-l),r),f=-d*d+h*(h+2*l)+c):h<=g?(d=0,h=Math.min(Math.max(-r,-l),r),f=h*(h+2*l)+c):(d=Math.max(0,-(o*r+a)),h=d>0?r:Math.min(Math.max(-r,-l),r),f=-d*d+h*(h+2*l)+c);else h=o>0?-r:r,d=Math.max(0,-(o*h+a)),f=-d*d+h*(h+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,d),s&&s.copy(cc).addScaledVector(Eo,h),f}intersectSphere(e,t){$n.subVectors(e.center,this.origin);let i=$n.dot(this.direction),s=$n.dot($n)-i*i,r=e.radius*e.radius;if(s>r)return null;let o=Math.sqrt(r-s),a=i-o,l=i+o;return l<0?null:a<0?this.at(l,t):this.at(a,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let i=-(this.origin.dot(e.normal)+e.constant)/t;return i>=0?i:null}intersectPlane(e,t){let i=this.distanceToPlane(e);return i===null?null:this.at(i,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let i,s,r,o,a,l,c=1/this.direction.x,u=1/this.direction.y,d=1/this.direction.z,h=this.origin;return c>=0?(i=(e.min.x-h.x)*c,s=(e.max.x-h.x)*c):(i=(e.max.x-h.x)*c,s=(e.min.x-h.x)*c),u>=0?(r=(e.min.y-h.y)*u,o=(e.max.y-h.y)*u):(r=(e.max.y-h.y)*u,o=(e.min.y-h.y)*u),i>o||r>s||((r>i||isNaN(i))&&(i=r),(o<s||isNaN(s))&&(s=o),d>=0?(a=(e.min.z-h.z)*d,l=(e.max.z-h.z)*d):(a=(e.max.z-h.z)*d,l=(e.min.z-h.z)*d),i>l||a>s)||((a>i||i!==i)&&(i=a),(l<s||s!==s)&&(s=l),s<0)?null:this.at(i>=0?i:s,t)}intersectsBox(e){return this.intersectBox(e,$n)!==null}intersectTriangle(e,t,i,s,r){uc.subVectors(t,e),wo.subVectors(i,e),hc.crossVectors(uc,wo);let o=this.direction.dot(hc),a;if(o>0){if(s)return null;a=1}else if(o<0)a=-1,o=-o;else return null;ci.subVectors(this.origin,e);let l=a*this.direction.dot(wo.crossVectors(ci,wo));if(l<0)return null;let c=a*this.direction.dot(uc.cross(ci));if(c<0||l+c>o)return null;let u=-a*ci.dot(hc);return u<0?null:this.at(u/o,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},ot=class n{constructor(e,t,i,s,r,o,a,l,c,u,d,h,f,g,y,m){n.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,i,s,r,o,a,l,c,u,d,h,f,g,y,m)}set(e,t,i,s,r,o,a,l,c,u,d,h,f,g,y,m){let p=this.elements;return p[0]=e,p[4]=t,p[8]=i,p[12]=s,p[1]=r,p[5]=o,p[9]=a,p[13]=l,p[2]=c,p[6]=u,p[10]=d,p[14]=h,p[3]=f,p[7]=g,p[11]=y,p[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new n().fromArray(this.elements)}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],t[9]=i[9],t[10]=i[10],t[11]=i[11],t[12]=i[12],t[13]=i[13],t[14]=i[14],t[15]=i[15],this}copyPosition(e){let t=this.elements,i=e.elements;return t[12]=i[12],t[13]=i[13],t[14]=i[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,i){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this}makeBasis(e,t,i){return this.set(e.x,t.x,i.x,0,e.y,t.y,i.y,0,e.z,t.z,i.z,0,0,0,0,1),this}extractRotation(e){let t=this.elements,i=e.elements,s=1/ds.setFromMatrixColumn(e,0).length(),r=1/ds.setFromMatrixColumn(e,1).length(),o=1/ds.setFromMatrixColumn(e,2).length();return t[0]=i[0]*s,t[1]=i[1]*s,t[2]=i[2]*s,t[3]=0,t[4]=i[4]*r,t[5]=i[5]*r,t[6]=i[6]*r,t[7]=0,t[8]=i[8]*o,t[9]=i[9]*o,t[10]=i[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,i=e.x,s=e.y,r=e.z,o=Math.cos(i),a=Math.sin(i),l=Math.cos(s),c=Math.sin(s),u=Math.cos(r),d=Math.sin(r);if(e.order==="XYZ"){let h=o*u,f=o*d,g=a*u,y=a*d;t[0]=l*u,t[4]=-l*d,t[8]=c,t[1]=f+g*c,t[5]=h-y*c,t[9]=-a*l,t[2]=y-h*c,t[6]=g+f*c,t[10]=o*l}else if(e.order==="YXZ"){let h=l*u,f=l*d,g=c*u,y=c*d;t[0]=h+y*a,t[4]=g*a-f,t[8]=o*c,t[1]=o*d,t[5]=o*u,t[9]=-a,t[2]=f*a-g,t[6]=y+h*a,t[10]=o*l}else if(e.order==="ZXY"){let h=l*u,f=l*d,g=c*u,y=c*d;t[0]=h-y*a,t[4]=-o*d,t[8]=g+f*a,t[1]=f+g*a,t[5]=o*u,t[9]=y-h*a,t[2]=-o*c,t[6]=a,t[10]=o*l}else if(e.order==="ZYX"){let h=o*u,f=o*d,g=a*u,y=a*d;t[0]=l*u,t[4]=g*c-f,t[8]=h*c+y,t[1]=l*d,t[5]=y*c+h,t[9]=f*c-g,t[2]=-c,t[6]=a*l,t[10]=o*l}else if(e.order==="YZX"){let h=o*l,f=o*c,g=a*l,y=a*c;t[0]=l*u,t[4]=y-h*d,t[8]=g*d+f,t[1]=d,t[5]=o*u,t[9]=-a*u,t[2]=-c*u,t[6]=f*d+g,t[10]=h-y*d}else if(e.order==="XZY"){let h=o*l,f=o*c,g=a*l,y=a*c;t[0]=l*u,t[4]=-d,t[8]=c*u,t[1]=h*d+y,t[5]=o*u,t[9]=f*d-g,t[2]=g*d-f,t[6]=a*u,t[10]=y*d+h}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(nm,e,im)}lookAt(e,t,i){let s=this.elements;return sn.subVectors(e,t),sn.lengthSq()===0&&(sn.z=1),sn.normalize(),ui.crossVectors(i,sn),ui.lengthSq()===0&&(Math.abs(i.z)===1?sn.x+=1e-4:sn.z+=1e-4,sn.normalize(),ui.crossVectors(i,sn)),ui.normalize(),To.crossVectors(sn,ui),s[0]=ui.x,s[4]=To.x,s[8]=sn.x,s[1]=ui.y,s[5]=To.y,s[9]=sn.y,s[2]=ui.z,s[6]=To.z,s[10]=sn.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,s=t.elements,r=this.elements,o=i[0],a=i[4],l=i[8],c=i[12],u=i[1],d=i[5],h=i[9],f=i[13],g=i[2],y=i[6],m=i[10],p=i[14],w=i[3],E=i[7],b=i[11],I=i[15],A=s[0],P=s[4],N=s[8],M=s[12],S=s[1],D=s[5],B=s[9],H=s[13],W=s[2],q=s[6],$=s[10],ne=s[14],V=s[3],le=s[7],de=s[11],Te=s[15];return r[0]=o*A+a*S+l*W+c*V,r[4]=o*P+a*D+l*q+c*le,r[8]=o*N+a*B+l*$+c*de,r[12]=o*M+a*H+l*ne+c*Te,r[1]=u*A+d*S+h*W+f*V,r[5]=u*P+d*D+h*q+f*le,r[9]=u*N+d*B+h*$+f*de,r[13]=u*M+d*H+h*ne+f*Te,r[2]=g*A+y*S+m*W+p*V,r[6]=g*P+y*D+m*q+p*le,r[10]=g*N+y*B+m*$+p*de,r[14]=g*M+y*H+m*ne+p*Te,r[3]=w*A+E*S+b*W+I*V,r[7]=w*P+E*D+b*q+I*le,r[11]=w*N+E*B+b*$+I*de,r[15]=w*M+E*H+b*ne+I*Te,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[4],s=e[8],r=e[12],o=e[1],a=e[5],l=e[9],c=e[13],u=e[2],d=e[6],h=e[10],f=e[14],g=e[3],y=e[7],m=e[11],p=e[15];return g*(+r*l*d-s*c*d-r*a*h+i*c*h+s*a*f-i*l*f)+y*(+t*l*f-t*c*h+r*o*h-s*o*f+s*c*u-r*l*u)+m*(+t*c*d-t*a*f-r*o*d+i*o*f+r*a*u-i*c*u)+p*(-s*a*u-t*l*d+t*a*h+s*o*d-i*o*h+i*l*u)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,i){let s=this.elements;return e.isVector3?(s[12]=e.x,s[13]=e.y,s[14]=e.z):(s[12]=e,s[13]=t,s[14]=i),this}invert(){let e=this.elements,t=e[0],i=e[1],s=e[2],r=e[3],o=e[4],a=e[5],l=e[6],c=e[7],u=e[8],d=e[9],h=e[10],f=e[11],g=e[12],y=e[13],m=e[14],p=e[15],w=d*m*c-y*h*c+y*l*f-a*m*f-d*l*p+a*h*p,E=g*h*c-u*m*c-g*l*f+o*m*f+u*l*p-o*h*p,b=u*y*c-g*d*c+g*a*f-o*y*f-u*a*p+o*d*p,I=g*d*l-u*y*l-g*a*h+o*y*h+u*a*m-o*d*m,A=t*w+i*E+s*b+r*I;if(A===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let P=1/A;return e[0]=w*P,e[1]=(y*h*r-d*m*r-y*s*f+i*m*f+d*s*p-i*h*p)*P,e[2]=(a*m*r-y*l*r+y*s*c-i*m*c-a*s*p+i*l*p)*P,e[3]=(d*l*r-a*h*r-d*s*c+i*h*c+a*s*f-i*l*f)*P,e[4]=E*P,e[5]=(u*m*r-g*h*r+g*s*f-t*m*f-u*s*p+t*h*p)*P,e[6]=(g*l*r-o*m*r-g*s*c+t*m*c+o*s*p-t*l*p)*P,e[7]=(o*h*r-u*l*r+u*s*c-t*h*c-o*s*f+t*l*f)*P,e[8]=b*P,e[9]=(g*d*r-u*y*r-g*i*f+t*y*f+u*i*p-t*d*p)*P,e[10]=(o*y*r-g*a*r+g*i*c-t*y*c-o*i*p+t*a*p)*P,e[11]=(u*a*r-o*d*r-u*i*c+t*d*c+o*i*f-t*a*f)*P,e[12]=I*P,e[13]=(u*y*s-g*d*s+g*i*h-t*y*h-u*i*m+t*d*m)*P,e[14]=(g*a*s-o*y*s-g*i*l+t*y*l+o*i*m-t*a*m)*P,e[15]=(o*d*s-u*a*s+u*i*l-t*d*l-o*i*h+t*a*h)*P,this}scale(e){let t=this.elements,i=e.x,s=e.y,r=e.z;return t[0]*=i,t[4]*=s,t[8]*=r,t[1]*=i,t[5]*=s,t[9]*=r,t[2]*=i,t[6]*=s,t[10]*=r,t[3]*=i,t[7]*=s,t[11]*=r,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],s=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,i,s))}makeTranslation(e,t,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,i,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,t,-i,0,0,i,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,0,i,0,0,1,0,0,-i,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,0,i,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let i=Math.cos(t),s=Math.sin(t),r=1-i,o=e.x,a=e.y,l=e.z,c=r*o,u=r*a;return this.set(c*o+i,c*a-s*l,c*l+s*a,0,c*a+s*l,u*a+i,u*l-s*o,0,c*l-s*a,u*l+s*o,r*l*l+i,0,0,0,0,1),this}makeScale(e,t,i){return this.set(e,0,0,0,0,t,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,t,i,s,r,o){return this.set(1,i,r,0,e,1,o,0,t,s,1,0,0,0,0,1),this}compose(e,t,i){let s=this.elements,r=t._x,o=t._y,a=t._z,l=t._w,c=r+r,u=o+o,d=a+a,h=r*c,f=r*u,g=r*d,y=o*u,m=o*d,p=a*d,w=l*c,E=l*u,b=l*d,I=i.x,A=i.y,P=i.z;return s[0]=(1-(y+p))*I,s[1]=(f+b)*I,s[2]=(g-E)*I,s[3]=0,s[4]=(f-b)*A,s[5]=(1-(h+p))*A,s[6]=(m+w)*A,s[7]=0,s[8]=(g+E)*P,s[9]=(m-w)*P,s[10]=(1-(h+y))*P,s[11]=0,s[12]=e.x,s[13]=e.y,s[14]=e.z,s[15]=1,this}decompose(e,t,i){let s=this.elements,r=ds.set(s[0],s[1],s[2]).length(),o=ds.set(s[4],s[5],s[6]).length(),a=ds.set(s[8],s[9],s[10]).length();this.determinant()<0&&(r=-r),e.x=s[12],e.y=s[13],e.z=s[14],vn.copy(this);let c=1/r,u=1/o,d=1/a;return vn.elements[0]*=c,vn.elements[1]*=c,vn.elements[2]*=c,vn.elements[4]*=u,vn.elements[5]*=u,vn.elements[6]*=u,vn.elements[8]*=d,vn.elements[9]*=d,vn.elements[10]*=d,t.setFromRotationMatrix(vn),i.x=r,i.y=o,i.z=a,this}makePerspective(e,t,i,s,r,o,a=bn,l=!1){let c=this.elements,u=2*r/(t-e),d=2*r/(i-s),h=(t+e)/(t-e),f=(i+s)/(i-s),g,y;if(l)g=r/(o-r),y=o*r/(o-r);else if(a===bn)g=-(o+r)/(o-r),y=-2*o*r/(o-r);else if(a===Tr)g=-o/(o-r),y=-o*r/(o-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return c[0]=u,c[4]=0,c[8]=h,c[12]=0,c[1]=0,c[5]=d,c[9]=f,c[13]=0,c[2]=0,c[6]=0,c[10]=g,c[14]=y,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,i,s,r,o,a=bn,l=!1){let c=this.elements,u=2/(t-e),d=2/(i-s),h=-(t+e)/(t-e),f=-(i+s)/(i-s),g,y;if(l)g=1/(o-r),y=o/(o-r);else if(a===bn)g=-2/(o-r),y=-(o+r)/(o-r);else if(a===Tr)g=-1/(o-r),y=-r/(o-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return c[0]=u,c[4]=0,c[8]=0,c[12]=h,c[1]=0,c[5]=d,c[9]=0,c[13]=f,c[2]=0,c[6]=0,c[10]=g,c[14]=y,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){let t=this.elements,i=e.elements;for(let s=0;s<16;s++)if(t[s]!==i[s])return!1;return!0}fromArray(e,t=0){for(let i=0;i<16;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e[t+9]=i[9],e[t+10]=i[10],e[t+11]=i[11],e[t+12]=i[12],e[t+13]=i[13],e[t+14]=i[14],e[t+15]=i[15],e}},ds=new R,vn=new ot,nm=new R(0,0,0),im=new R(1,1,1),ui=new R,To=new R,sn=new R,Th=new ot,Ah=new pn,Mn=class n{constructor(e=0,t=0,i=0,s=n.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=i,this._order=s}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,i,s=this._order){return this._x=e,this._y=t,this._z=i,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,i=!0){let s=e.elements,r=s[0],o=s[4],a=s[8],l=s[1],c=s[5],u=s[9],d=s[2],h=s[6],f=s[10];switch(t){case"XYZ":this._y=Math.asin(ke(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-u,f),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(h,c),this._z=0);break;case"YXZ":this._x=Math.asin(-ke(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(a,f),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-d,r),this._z=0);break;case"ZXY":this._x=Math.asin(ke(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(-d,f),this._z=Math.atan2(-o,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-ke(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(h,f),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-o,c));break;case"YZX":this._z=Math.asin(ke(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-u,c),this._y=Math.atan2(-d,r)):(this._x=0,this._y=Math.atan2(a,f));break;case"XZY":this._z=Math.asin(-ke(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(h,c),this._y=Math.atan2(a,r)):(this._x=Math.atan2(-u,f),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,i){return Th.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Th,t,i)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Ah.setFromEuler(this),this.setFromQuaternion(Ah,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Mn.DEFAULT_ORDER="XYZ";var Cr=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},sm=0,Rh=new R,fs=new pn,Xn=new ot,Ao=new R,pr=new R,rm=new R,om=new pn,Ch=new R(1,0,0),Ih=new R(0,1,0),Ph=new R(0,0,1),Lh={type:"added"},am={type:"removed"},ps={type:"childadded",child:null},dc={type:"childremoved",child:null},St=class n extends Cn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:sm++}),this.uuid=Hs(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=n.DEFAULT_UP.clone();let e=new R,t=new Mn,i=new pn,s=new R(1,1,1);function r(){i.setFromEuler(t,!1)}function o(){t.setFromQuaternion(i,void 0,!1)}t._onChange(r),i._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new ot},normalMatrix:{value:new ze}}),this.matrix=new ot,this.matrixWorld=new ot,this.matrixAutoUpdate=n.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=n.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Cr,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return fs.setFromAxisAngle(e,t),this.quaternion.multiply(fs),this}rotateOnWorldAxis(e,t){return fs.setFromAxisAngle(e,t),this.quaternion.premultiply(fs),this}rotateX(e){return this.rotateOnAxis(Ch,e)}rotateY(e){return this.rotateOnAxis(Ih,e)}rotateZ(e){return this.rotateOnAxis(Ph,e)}translateOnAxis(e,t){return Rh.copy(e).applyQuaternion(this.quaternion),this.position.add(Rh.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Ch,e)}translateY(e){return this.translateOnAxis(Ih,e)}translateZ(e){return this.translateOnAxis(Ph,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Xn.copy(this.matrixWorld).invert())}lookAt(e,t,i){e.isVector3?Ao.copy(e):Ao.set(e,t,i);let s=this.parent;this.updateWorldMatrix(!0,!1),pr.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Xn.lookAt(pr,Ao,this.up):Xn.lookAt(Ao,pr,this.up),this.quaternion.setFromRotationMatrix(Xn),s&&(Xn.extractRotation(s.matrixWorld),fs.setFromRotationMatrix(Xn),this.quaternion.premultiply(fs.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(Lh),ps.child=e,this.dispatchEvent(ps),ps.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(am),dc.child=e,this.dispatchEvent(dc),dc.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Xn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Xn.multiply(e.parent.matrixWorld)),e.applyMatrix4(Xn),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(Lh),ps.child=e,this.dispatchEvent(ps),ps.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let i=0,s=this.children.length;i<s;i++){let o=this.children[i].getObjectByProperty(e,t);if(o!==void 0)return o}}getObjectsByProperty(e,t,i=[]){this[e]===t&&i.push(this);let s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].getObjectsByProperty(e,t,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(pr,e,rm),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(pr,om,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);let t=this.children;for(let i=0,s=t.length;i<s;i++)t[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let i=0,s=t.length;i<s;i++)t[i].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let i=0,s=t.length;i<s;i++)t[i].updateMatrixWorld(e)}updateWorldMatrix(e,t){let i=this.parent;if(e===!0&&i!==null&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){let s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].updateWorldMatrix(!1,!0)}}toJSON(e){let t=e===void 0||typeof e=="string",i={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(a=>({...a,boundingBox:a.boundingBox?a.boundingBox.toJSON():void 0,boundingSphere:a.boundingSphere?a.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(a=>({...a})),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(e),s.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function r(a,l){return a[l.uuid]===void 0&&(a[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(e.geometries,this.geometry);let a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){let l=a.shapes;if(Array.isArray(l))for(let c=0,u=l.length;c<u;c++){let d=l[c];r(e.shapes,d)}else r(e.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let a=[];for(let l=0,c=this.material.length;l<c;l++)a.push(r(e.materials,this.material[l]));s.material=a}else s.material=r(e.materials,this.material);if(this.children.length>0){s.children=[];for(let a=0;a<this.children.length;a++)s.children.push(this.children[a].toJSON(e).object)}if(this.animations.length>0){s.animations=[];for(let a=0;a<this.animations.length;a++){let l=this.animations[a];s.animations.push(r(e.animations,l))}}if(t){let a=o(e.geometries),l=o(e.materials),c=o(e.textures),u=o(e.images),d=o(e.shapes),h=o(e.skeletons),f=o(e.animations),g=o(e.nodes);a.length>0&&(i.geometries=a),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),u.length>0&&(i.images=u),d.length>0&&(i.shapes=d),h.length>0&&(i.skeletons=h),f.length>0&&(i.animations=f),g.length>0&&(i.nodes=g)}return i.object=s,i;function o(a){let l=[];for(let c in a){let u=a[c];delete u.metadata,l.push(u)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let i=0;i<e.children.length;i++){let s=e.children[i];this.add(s.clone())}return this}};St.DEFAULT_UP=new R(0,1,0);St.DEFAULT_MATRIX_AUTO_UPDATE=!0;St.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var xn=new R,qn=new R,fc=new R,jn=new R,ms=new R,gs=new R,Dh=new R,pc=new R,mc=new R,gc=new R,_c=new it,yc=new it,vc=new it,fi=class n{constructor(e=new R,t=new R,i=new R){this.a=e,this.b=t,this.c=i}static getNormal(e,t,i,s){s.subVectors(i,t),xn.subVectors(e,t),s.cross(xn);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(e,t,i,s,r){xn.subVectors(s,t),qn.subVectors(i,t),fc.subVectors(e,t);let o=xn.dot(xn),a=xn.dot(qn),l=xn.dot(fc),c=qn.dot(qn),u=qn.dot(fc),d=o*c-a*a;if(d===0)return r.set(0,0,0),null;let h=1/d,f=(c*l-a*u)*h,g=(o*u-a*l)*h;return r.set(1-f-g,g,f)}static containsPoint(e,t,i,s){return this.getBarycoord(e,t,i,s,jn)===null?!1:jn.x>=0&&jn.y>=0&&jn.x+jn.y<=1}static getInterpolation(e,t,i,s,r,o,a,l){return this.getBarycoord(e,t,i,s,jn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,jn.x),l.addScaledVector(o,jn.y),l.addScaledVector(a,jn.z),l)}static getInterpolatedAttribute(e,t,i,s,r,o){return _c.setScalar(0),yc.setScalar(0),vc.setScalar(0),_c.fromBufferAttribute(e,t),yc.fromBufferAttribute(e,i),vc.fromBufferAttribute(e,s),o.setScalar(0),o.addScaledVector(_c,r.x),o.addScaledVector(yc,r.y),o.addScaledVector(vc,r.z),o}static isFrontFacing(e,t,i,s){return xn.subVectors(i,t),qn.subVectors(e,t),xn.cross(qn).dot(s)<0}set(e,t,i){return this.a.copy(e),this.b.copy(t),this.c.copy(i),this}setFromPointsAndIndices(e,t,i,s){return this.a.copy(e[t]),this.b.copy(e[i]),this.c.copy(e[s]),this}setFromAttributeAndIndices(e,t,i,s){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,s),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return xn.subVectors(this.c,this.b),qn.subVectors(this.a,this.b),xn.cross(qn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return n.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return n.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,i,s,r){return n.getInterpolation(e,this.a,this.b,this.c,t,i,s,r)}containsPoint(e){return n.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return n.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let i=this.a,s=this.b,r=this.c,o,a;ms.subVectors(s,i),gs.subVectors(r,i),pc.subVectors(e,i);let l=ms.dot(pc),c=gs.dot(pc);if(l<=0&&c<=0)return t.copy(i);mc.subVectors(e,s);let u=ms.dot(mc),d=gs.dot(mc);if(u>=0&&d<=u)return t.copy(s);let h=l*d-u*c;if(h<=0&&l>=0&&u<=0)return o=l/(l-u),t.copy(i).addScaledVector(ms,o);gc.subVectors(e,r);let f=ms.dot(gc),g=gs.dot(gc);if(g>=0&&f<=g)return t.copy(r);let y=f*c-l*g;if(y<=0&&c>=0&&g<=0)return a=c/(c-g),t.copy(i).addScaledVector(gs,a);let m=u*g-f*d;if(m<=0&&d-u>=0&&f-g>=0)return Dh.subVectors(r,s),a=(d-u)/(d-u+(f-g)),t.copy(s).addScaledVector(Dh,a);let p=1/(m+y+h);return o=y*p,a=h*p,t.copy(i).addScaledVector(ms,o).addScaledVector(gs,a)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},kd={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},hi={h:0,s:0,l:0},Ro={h:0,s:0,l:0};function xc(n,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?n+(e-n)*6*t:t<1/2?e:t<2/3?n+(e-n)*6*(2/3-t):n}var De=class{constructor(e,t,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,i)}set(e,t,i){if(t===void 0&&i===void 0){let s=e;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(e,t,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Vt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Ze.colorSpaceToWorking(this,t),this}setRGB(e,t,i,s=Ze.workingColorSpace){return this.r=e,this.g=t,this.b=i,Ze.colorSpaceToWorking(this,s),this}setHSL(e,t,i,s=Ze.workingColorSpace){if(e=tu(e,1),t=ke(t,0,1),i=ke(i,0,1),t===0)this.r=this.g=this.b=i;else{let r=i<=.5?i*(1+t):i+t-i*t,o=2*i-r;this.r=xc(o,r,e+1/3),this.g=xc(o,r,e),this.b=xc(o,r,e-1/3)}return Ze.colorSpaceToWorking(this,s),this}setStyle(e,t=Vt){function i(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(e)){let r,o=s[1],a=s[2];switch(o){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(e)){let r=s[1],o=r.length;if(o===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(o===6)return this.setHex(parseInt(r,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Vt){let i=kd[e.toLowerCase()];return i!==void 0?this.setHex(i,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Yn(e.r),this.g=Yn(e.g),this.b=Yn(e.b),this}copyLinearToSRGB(e){return this.r=Ss(e.r),this.g=Ss(e.g),this.b=Ss(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Vt){return Ze.workingToColorSpace(Bt.copy(this),e),Math.round(ke(Bt.r*255,0,255))*65536+Math.round(ke(Bt.g*255,0,255))*256+Math.round(ke(Bt.b*255,0,255))}getHexString(e=Vt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=Ze.workingColorSpace){Ze.workingToColorSpace(Bt.copy(this),t);let i=Bt.r,s=Bt.g,r=Bt.b,o=Math.max(i,s,r),a=Math.min(i,s,r),l,c,u=(a+o)/2;if(a===o)l=0,c=0;else{let d=o-a;switch(c=u<=.5?d/(o+a):d/(2-o-a),o){case i:l=(s-r)/d+(s<r?6:0);break;case s:l=(r-i)/d+2;break;case r:l=(i-s)/d+4;break}l/=6}return e.h=l,e.s=c,e.l=u,e}getRGB(e,t=Ze.workingColorSpace){return Ze.workingToColorSpace(Bt.copy(this),t),e.r=Bt.r,e.g=Bt.g,e.b=Bt.b,e}getStyle(e=Vt){Ze.workingToColorSpace(Bt.copy(this),e);let t=Bt.r,i=Bt.g,s=Bt.b;return e!==Vt?`color(${e} ${t.toFixed(3)} ${i.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(i*255)},${Math.round(s*255)})`}offsetHSL(e,t,i){return this.getHSL(hi),this.setHSL(hi.h+e,hi.s+t,hi.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,i){return this.r=e.r+(t.r-e.r)*i,this.g=e.g+(t.g-e.g)*i,this.b=e.b+(t.b-e.b)*i,this}lerpHSL(e,t){this.getHSL(hi),e.getHSL(Ro);let i=br(hi.h,Ro.h,t),s=br(hi.s,Ro.s,t),r=br(hi.l,Ro.l,t);return this.setHSL(i,s,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,i=this.g,s=this.b,r=e.elements;return this.r=r[0]*t+r[3]*i+r[6]*s,this.g=r[1]*t+r[4]*i+r[7]*s,this.b=r[2]*t+r[5]*i+r[8]*s,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Bt=new De;De.NAMES=kd;var lm=0,Dn=class extends Cn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:lm++}),this.uuid=Hs(),this.name="",this.type="Material",this.blending=Hi,this.side=Zn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Xo,this.blendDst=qo,this.blendEquation=mi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new De(0,0,0),this.blendAlpha=0,this.depthFunc=Vi,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Dc,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=zi,this.stencilZFail=zi,this.stencilZPass=zi,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let i=e[t];if(i===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}let s=this[t];if(s===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(i):s&&s.isVector3&&i&&i.isVector3?s.copy(i):this[t]=i}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let i={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(i.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(i.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.shadowSide!==null&&(i.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),this.blending!==Hi&&(i.blending=this.blending),this.side!==Zn&&(i.side=this.side),this.vertexColors===!0&&(i.vertexColors=!0),this.opacity<1&&(i.opacity=this.opacity),this.transparent===!0&&(i.transparent=!0),this.blendSrc!==Xo&&(i.blendSrc=this.blendSrc),this.blendDst!==qo&&(i.blendDst=this.blendDst),this.blendEquation!==mi&&(i.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(i.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(i.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(i.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(i.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(i.blendAlpha=this.blendAlpha),this.depthFunc!==Vi&&(i.depthFunc=this.depthFunc),this.depthTest===!1&&(i.depthTest=this.depthTest),this.depthWrite===!1&&(i.depthWrite=this.depthWrite),this.colorWrite===!1&&(i.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(i.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Dc&&(i.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(i.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(i.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==zi&&(i.stencilFail=this.stencilFail),this.stencilZFail!==zi&&(i.stencilZFail=this.stencilZFail),this.stencilZPass!==zi&&(i.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(i.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(i.rotation=this.rotation),this.polygonOffset===!0&&(i.polygonOffset=!0),this.polygonOffsetFactor!==0&&(i.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(i.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(i.linewidth=this.linewidth),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.dithering===!0&&(i.dithering=!0),this.alphaTest>0&&(i.alphaTest=this.alphaTest),this.alphaHash===!0&&(i.alphaHash=!0),this.alphaToCoverage===!0&&(i.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(i.premultipliedAlpha=!0),this.forceSinglePass===!0&&(i.forceSinglePass=!0),this.wireframe===!0&&(i.wireframe=!0),this.wireframeLinewidth>1&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(i.flatShading=!0),this.visible===!1&&(i.visible=!1),this.toneMapped===!1&&(i.toneMapped=!1),this.fog===!1&&(i.fog=!1),Object.keys(this.userData).length>0&&(i.userData=this.userData);function s(r){let o=[];for(let a in r){let l=r[a];delete l.metadata,o.push(l)}return o}if(t){let r=s(e.textures),o=s(e.images);r.length>0&&(i.textures=r),o.length>0&&(i.images=o)}return i}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,i=null;if(t!==null){let s=t.length;i=new Array(s);for(let r=0;r!==s;++r)i[r]=t[r].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}},Nn=class extends Dn{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new De(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Mn,this.combine=Gc,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}};var Mt=new R,Co=new re,cm=0,Ut=class{constructor(e,t,i=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:cm++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=i,this.usage=Nc,this.updateRanges=[],this.gpuType=Tn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,i){e*=this.itemSize,i*=t.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[e+s]=t.array[i+s];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,i=this.count;t<i;t++)Co.fromBufferAttribute(this,t),Co.applyMatrix3(e),this.setXY(t,Co.x,Co.y);else if(this.itemSize===3)for(let t=0,i=this.count;t<i;t++)Mt.fromBufferAttribute(this,t),Mt.applyMatrix3(e),this.setXYZ(t,Mt.x,Mt.y,Mt.z);return this}applyMatrix4(e){for(let t=0,i=this.count;t<i;t++)Mt.fromBufferAttribute(this,t),Mt.applyMatrix4(e),this.setXYZ(t,Mt.x,Mt.y,Mt.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)Mt.fromBufferAttribute(this,t),Mt.applyNormalMatrix(e),this.setXYZ(t,Mt.x,Mt.y,Mt.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)Mt.fromBufferAttribute(this,t),Mt.transformDirection(e),this.setXYZ(t,Mt.x,Mt.y,Mt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let i=this.array[e*this.itemSize+t];return this.normalized&&(i=bs(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=Ht(i,this.array)),this.array[e*this.itemSize+t]=i,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=bs(t,this.array)),t}setX(e,t){return this.normalized&&(t=Ht(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=bs(t,this.array)),t}setY(e,t){return this.normalized&&(t=Ht(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=bs(t,this.array)),t}setZ(e,t){return this.normalized&&(t=Ht(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=bs(t,this.array)),t}setW(e,t){return this.normalized&&(t=Ht(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=Ht(t,this.array),i=Ht(i,this.array)),this.array[e+0]=t,this.array[e+1]=i,this}setXYZ(e,t,i,s){return e*=this.itemSize,this.normalized&&(t=Ht(t,this.array),i=Ht(i,this.array),s=Ht(s,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=s,this}setXYZW(e,t,i,s,r){return e*=this.itemSize,this.normalized&&(t=Ht(t,this.array),i=Ht(i,this.array),s=Ht(s,this.array),r=Ht(r,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=s,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==Nc&&(e.usage=this.usage),e}};var Ir=class extends Ut{constructor(e,t,i){super(new Uint16Array(e),t,i)}};var Pr=class extends Ut{constructor(e,t,i){super(new Uint32Array(e),t,i)}};var Qe=class extends Ut{constructor(e,t,i){super(new Float32Array(e),t,i)}},um=0,dn=new ot,bc=new St,_s=new R,rn=new Pn,mr=new Pn,Pt=new R,wt=class n extends Cn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:um++}),this.uuid=Hs(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(nu(e)?Pr:Ir)(e,1):this.index=e,this}setIndirect(e){return this.indirect=e,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,i=0){this.groups.push({start:e,count:t,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let i=this.attributes.normal;if(i!==void 0){let r=new ze().getNormalMatrix(e);i.applyNormalMatrix(r),i.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(e),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return dn.makeRotationFromQuaternion(e),this.applyMatrix4(dn),this}rotateX(e){return dn.makeRotationX(e),this.applyMatrix4(dn),this}rotateY(e){return dn.makeRotationY(e),this.applyMatrix4(dn),this}rotateZ(e){return dn.makeRotationZ(e),this.applyMatrix4(dn),this}translate(e,t,i){return dn.makeTranslation(e,t,i),this.applyMatrix4(dn),this}scale(e,t,i){return dn.makeScale(e,t,i),this.applyMatrix4(dn),this}lookAt(e){return bc.lookAt(e),bc.updateMatrix(),this.applyMatrix4(bc.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(_s).negate(),this.translate(_s.x,_s.y,_s.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let i=[];for(let s=0,r=e.length;s<r;s++){let o=e[s];i.push(o.x,o.y,o.z||0)}this.setAttribute("position",new Qe(i,3))}else{let i=Math.min(e.length,t.count);for(let s=0;s<i;s++){let r=e[s];t.setXYZ(s,r.x,r.y,r.z||0)}e.length>t.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Pn);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new R(-1/0,-1/0,-1/0),new R(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let i=0,s=t.length;i<s;i++){let r=t[i];rn.setFromBufferAttribute(r),this.morphTargetsRelative?(Pt.addVectors(this.boundingBox.min,rn.min),this.boundingBox.expandByPoint(Pt),Pt.addVectors(this.boundingBox.max,rn.max),this.boundingBox.expandByPoint(Pt)):(this.boundingBox.expandByPoint(rn.min),this.boundingBox.expandByPoint(rn.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Ln);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new R,1/0);return}if(e){let i=this.boundingSphere.center;if(rn.setFromBufferAttribute(e),t)for(let r=0,o=t.length;r<o;r++){let a=t[r];mr.setFromBufferAttribute(a),this.morphTargetsRelative?(Pt.addVectors(rn.min,mr.min),rn.expandByPoint(Pt),Pt.addVectors(rn.max,mr.max),rn.expandByPoint(Pt)):(rn.expandByPoint(mr.min),rn.expandByPoint(mr.max))}rn.getCenter(i);let s=0;for(let r=0,o=e.count;r<o;r++)Pt.fromBufferAttribute(e,r),s=Math.max(s,i.distanceToSquared(Pt));if(t)for(let r=0,o=t.length;r<o;r++){let a=t[r],l=this.morphTargetsRelative;for(let c=0,u=a.count;c<u;c++)Pt.fromBufferAttribute(a,c),l&&(_s.fromBufferAttribute(e,c),Pt.add(_s)),s=Math.max(s,i.distanceToSquared(Pt))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let i=t.position,s=t.normal,r=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Ut(new Float32Array(4*i.count),4));let o=this.getAttribute("tangent"),a=[],l=[];for(let N=0;N<i.count;N++)a[N]=new R,l[N]=new R;let c=new R,u=new R,d=new R,h=new re,f=new re,g=new re,y=new R,m=new R;function p(N,M,S){c.fromBufferAttribute(i,N),u.fromBufferAttribute(i,M),d.fromBufferAttribute(i,S),h.fromBufferAttribute(r,N),f.fromBufferAttribute(r,M),g.fromBufferAttribute(r,S),u.sub(c),d.sub(c),f.sub(h),g.sub(h);let D=1/(f.x*g.y-g.x*f.y);isFinite(D)&&(y.copy(u).multiplyScalar(g.y).addScaledVector(d,-f.y).multiplyScalar(D),m.copy(d).multiplyScalar(f.x).addScaledVector(u,-g.x).multiplyScalar(D),a[N].add(y),a[M].add(y),a[S].add(y),l[N].add(m),l[M].add(m),l[S].add(m))}let w=this.groups;w.length===0&&(w=[{start:0,count:e.count}]);for(let N=0,M=w.length;N<M;++N){let S=w[N],D=S.start,B=S.count;for(let H=D,W=D+B;H<W;H+=3)p(e.getX(H+0),e.getX(H+1),e.getX(H+2))}let E=new R,b=new R,I=new R,A=new R;function P(N){I.fromBufferAttribute(s,N),A.copy(I);let M=a[N];E.copy(M),E.sub(I.multiplyScalar(I.dot(M))).normalize(),b.crossVectors(A,M);let D=b.dot(l[N])<0?-1:1;o.setXYZW(N,E.x,E.y,E.z,D)}for(let N=0,M=w.length;N<M;++N){let S=w[N],D=S.start,B=S.count;for(let H=D,W=D+B;H<W;H+=3)P(e.getX(H+0)),P(e.getX(H+1)),P(e.getX(H+2))}}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let i=this.getAttribute("normal");if(i===void 0)i=new Ut(new Float32Array(t.count*3),3),this.setAttribute("normal",i);else for(let h=0,f=i.count;h<f;h++)i.setXYZ(h,0,0,0);let s=new R,r=new R,o=new R,a=new R,l=new R,c=new R,u=new R,d=new R;if(e)for(let h=0,f=e.count;h<f;h+=3){let g=e.getX(h+0),y=e.getX(h+1),m=e.getX(h+2);s.fromBufferAttribute(t,g),r.fromBufferAttribute(t,y),o.fromBufferAttribute(t,m),u.subVectors(o,r),d.subVectors(s,r),u.cross(d),a.fromBufferAttribute(i,g),l.fromBufferAttribute(i,y),c.fromBufferAttribute(i,m),a.add(u),l.add(u),c.add(u),i.setXYZ(g,a.x,a.y,a.z),i.setXYZ(y,l.x,l.y,l.z),i.setXYZ(m,c.x,c.y,c.z)}else for(let h=0,f=t.count;h<f;h+=3)s.fromBufferAttribute(t,h+0),r.fromBufferAttribute(t,h+1),o.fromBufferAttribute(t,h+2),u.subVectors(o,r),d.subVectors(s,r),u.cross(d),i.setXYZ(h+0,u.x,u.y,u.z),i.setXYZ(h+1,u.x,u.y,u.z),i.setXYZ(h+2,u.x,u.y,u.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,i=e.count;t<i;t++)Pt.fromBufferAttribute(e,t),Pt.normalize(),e.setXYZ(t,Pt.x,Pt.y,Pt.z)}toNonIndexed(){function e(a,l){let c=a.array,u=a.itemSize,d=a.normalized,h=new c.constructor(l.length*u),f=0,g=0;for(let y=0,m=l.length;y<m;y++){a.isInterleavedBufferAttribute?f=l[y]*a.data.stride+a.offset:f=l[y]*u;for(let p=0;p<u;p++)h[g++]=c[f++]}return new Ut(h,u,d)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new n,i=this.index.array,s=this.attributes;for(let a in s){let l=s[a],c=e(l,i);t.setAttribute(a,c)}let r=this.morphAttributes;for(let a in r){let l=[],c=r[a];for(let u=0,d=c.length;u<d;u++){let h=c[u],f=e(h,i);l.push(f)}t.morphAttributes[a]=l}t.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let a=0,l=o.length;a<l;a++){let c=o[a];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){let e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let i=this.attributes;for(let l in i){let c=i[l];e.data.attributes[l]=c.toJSON(e.data)}let s={},r=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],u=[];for(let d=0,h=c.length;d<h;d++){let f=c[d];u.push(f.toJSON(e.data))}u.length>0&&(s[l]=u,r=!0)}r&&(e.data.morphAttributes=s,e.data.morphTargetsRelative=this.morphTargetsRelative);let o=this.groups;o.length>0&&(e.data.groups=JSON.parse(JSON.stringify(o)));let a=this.boundingSphere;return a!==null&&(e.data.boundingSphere=a.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let i=e.index;i!==null&&this.setIndex(i.clone());let s=e.attributes;for(let c in s){let u=s[c];this.setAttribute(c,u.clone(t))}let r=e.morphAttributes;for(let c in r){let u=[],d=r[c];for(let h=0,f=d.length;h<f;h++)u.push(d[h].clone(t));this.morphAttributes[c]=u}this.morphTargetsRelative=e.morphTargetsRelative;let o=e.groups;for(let c=0,u=o.length;c<u;c++){let d=o[c];this.addGroup(d.start,d.count,d.materialIndex)}let a=e.boundingBox;a!==null&&(this.boundingBox=a.clone());let l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},Nh=new ot,Bi=new gi,Io=new Ln,Uh=new R,Po=new R,Lo=new R,Do=new R,Sc=new R,No=new R,Oh=new R,Uo=new R,Je=class extends St{constructor(e=new wt,t=new Nn){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let s=t[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}getVertexPosition(e,t){let i=this.geometry,s=i.attributes.position,r=i.morphAttributes.position,o=i.morphTargetsRelative;t.fromBufferAttribute(s,e);let a=this.morphTargetInfluences;if(r&&a){No.set(0,0,0);for(let l=0,c=r.length;l<c;l++){let u=a[l],d=r[l];u!==0&&(Sc.fromBufferAttribute(d,e),o?No.addScaledVector(Sc,u):No.addScaledVector(Sc.sub(t),u))}t.add(No)}return t}raycast(e,t){let i=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),Io.copy(i.boundingSphere),Io.applyMatrix4(r),Bi.copy(e.ray).recast(e.near),!(Io.containsPoint(Bi.origin)===!1&&(Bi.intersectSphere(Io,Uh)===null||Bi.origin.distanceToSquared(Uh)>(e.far-e.near)**2))&&(Nh.copy(r).invert(),Bi.copy(e.ray).applyMatrix4(Nh),!(i.boundingBox!==null&&Bi.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(e,t,Bi)))}_computeIntersections(e,t,i){let s,r=this.geometry,o=this.material,a=r.index,l=r.attributes.position,c=r.attributes.uv,u=r.attributes.uv1,d=r.attributes.normal,h=r.groups,f=r.drawRange;if(a!==null)if(Array.isArray(o))for(let g=0,y=h.length;g<y;g++){let m=h[g],p=o[m.materialIndex],w=Math.max(m.start,f.start),E=Math.min(a.count,Math.min(m.start+m.count,f.start+f.count));for(let b=w,I=E;b<I;b+=3){let A=a.getX(b),P=a.getX(b+1),N=a.getX(b+2);s=Oo(this,p,e,i,c,u,d,A,P,N),s&&(s.faceIndex=Math.floor(b/3),s.face.materialIndex=m.materialIndex,t.push(s))}}else{let g=Math.max(0,f.start),y=Math.min(a.count,f.start+f.count);for(let m=g,p=y;m<p;m+=3){let w=a.getX(m),E=a.getX(m+1),b=a.getX(m+2);s=Oo(this,o,e,i,c,u,d,w,E,b),s&&(s.faceIndex=Math.floor(m/3),t.push(s))}}else if(l!==void 0)if(Array.isArray(o))for(let g=0,y=h.length;g<y;g++){let m=h[g],p=o[m.materialIndex],w=Math.max(m.start,f.start),E=Math.min(l.count,Math.min(m.start+m.count,f.start+f.count));for(let b=w,I=E;b<I;b+=3){let A=b,P=b+1,N=b+2;s=Oo(this,p,e,i,c,u,d,A,P,N),s&&(s.faceIndex=Math.floor(b/3),s.face.materialIndex=m.materialIndex,t.push(s))}}else{let g=Math.max(0,f.start),y=Math.min(l.count,f.start+f.count);for(let m=g,p=y;m<p;m+=3){let w=m,E=m+1,b=m+2;s=Oo(this,o,e,i,c,u,d,w,E,b),s&&(s.faceIndex=Math.floor(m/3),t.push(s))}}}};function hm(n,e,t,i,s,r,o,a){let l;if(e.side===Wt?l=i.intersectTriangle(o,r,s,!0,a):l=i.intersectTriangle(s,r,o,e.side===Zn,a),l===null)return null;Uo.copy(a),Uo.applyMatrix4(n.matrixWorld);let c=t.ray.origin.distanceTo(Uo);return c<t.near||c>t.far?null:{distance:c,point:Uo.clone(),object:n}}function Oo(n,e,t,i,s,r,o,a,l,c){n.getVertexPosition(a,Po),n.getVertexPosition(l,Lo),n.getVertexPosition(c,Do);let u=hm(n,e,t,i,Po,Lo,Do,Oh);if(u){let d=new R;fi.getBarycoord(Oh,Po,Lo,Do,d),s&&(u.uv=fi.getInterpolatedAttribute(s,a,l,c,d,new re)),r&&(u.uv1=fi.getInterpolatedAttribute(r,a,l,c,d,new re)),o&&(u.normal=fi.getInterpolatedAttribute(o,a,l,c,d,new R),u.normal.dot(i.direction)>0&&u.normal.multiplyScalar(-1));let h={a,b:l,c,normal:new R,materialIndex:0};fi.getNormal(Po,Lo,Do,h.normal),u.face=h,u.barycoord=d}return u}var Jn=class n extends wt{constructor(e=1,t=1,i=1,s=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:i,widthSegments:s,heightSegments:r,depthSegments:o};let a=this;s=Math.floor(s),r=Math.floor(r),o=Math.floor(o);let l=[],c=[],u=[],d=[],h=0,f=0;g("z","y","x",-1,-1,i,t,e,o,r,0),g("z","y","x",1,-1,i,t,-e,o,r,1),g("x","z","y",1,1,e,i,t,s,o,2),g("x","z","y",1,-1,e,i,-t,s,o,3),g("x","y","z",1,-1,e,t,i,s,r,4),g("x","y","z",-1,-1,e,t,-i,s,r,5),this.setIndex(l),this.setAttribute("position",new Qe(c,3)),this.setAttribute("normal",new Qe(u,3)),this.setAttribute("uv",new Qe(d,2));function g(y,m,p,w,E,b,I,A,P,N,M){let S=b/P,D=I/N,B=b/2,H=I/2,W=A/2,q=P+1,$=N+1,ne=0,V=0,le=new R;for(let de=0;de<$;de++){let Te=de*D-H;for(let Xe=0;Xe<q;Xe++){let ct=Xe*S-B;le[y]=ct*w,le[m]=Te*E,le[p]=W,c.push(le.x,le.y,le.z),le[y]=0,le[m]=0,le[p]=A>0?1:-1,u.push(le.x,le.y,le.z),d.push(Xe/P),d.push(1-de/N),ne+=1}}for(let de=0;de<N;de++)for(let Te=0;Te<P;Te++){let Xe=h+Te+q*de,ct=h+Te+q*(de+1),ft=h+(Te+1)+q*(de+1),tt=h+(Te+1)+q*de;l.push(Xe,ct,tt),l.push(ct,ft,tt),V+=6}a.addGroup(f,V,M),f+=V,h+=ne}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};function Yi(n){let e={};for(let t in n){e[t]={};for(let i in n[t]){let s=n[t][i];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][i]=null):e[t][i]=s.clone():Array.isArray(s)?e[t][i]=s.slice():e[t][i]=s}}return e}function kt(n){let e={};for(let t=0;t<n.length;t++){let i=Yi(n[t]);for(let s in i)e[s]=i[s]}return e}function dm(n){let e=[];for(let t=0;t<n.length;t++)e.push(n[t].clone());return e}function iu(n){let e=n.getRenderTarget();return e===null?n.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:Ze.workingColorSpace}var zd={clone:Yi,merge:kt},fm=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,pm=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,En=class extends Dn{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=fm,this.fragmentShader=pm,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Yi(e.uniforms),this.uniformsGroups=dm(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let s in this.uniforms){let o=this.uniforms[s].value;o&&o.isTexture?t.uniforms[s]={type:"t",value:o.toJSON(e).uuid}:o&&o.isColor?t.uniforms[s]={type:"c",value:o.getHex()}:o&&o.isVector2?t.uniforms[s]={type:"v2",value:o.toArray()}:o&&o.isVector3?t.uniforms[s]={type:"v3",value:o.toArray()}:o&&o.isVector4?t.uniforms[s]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?t.uniforms[s]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?t.uniforms[s]={type:"m4",value:o.toArray()}:t.uniforms[s]={value:o}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let i={};for(let s in this.extensions)this.extensions[s]===!0&&(i[s]=!0);return Object.keys(i).length>0&&(t.extensions=i),t}},Lr=class extends St{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new ot,this.projectionMatrix=new ot,this.projectionMatrixInverse=new ot,this.coordinateSystem=bn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}},di=new R,Fh=new re,Bh=new re,Nt=class extends Lr{constructor(e=50,t=1,i=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=s,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=Es*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(xr*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Es*2*Math.atan(Math.tan(xr*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,i){di.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(di.x,di.y).multiplyScalar(-e/di.z),di.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(di.x,di.y).multiplyScalar(-e/di.z)}getViewSize(e,t){return this.getViewBounds(e,Fh,Bh),t.subVectors(Bh,Fh)}setViewOffset(e,t,i,s,r,o){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(xr*.5*this.fov)/this.zoom,i=2*t,s=this.aspect*i,r=-.5*s,o=this.view;if(this.view!==null&&this.view.enabled){let l=o.fullWidth,c=o.fullHeight;r+=o.offsetX*s/l,t-=o.offsetY*i/c,s*=o.width/l,i*=o.height/c}let a=this.filmOffset;a!==0&&(r+=e*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,t,t-i,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},ys=-90,vs=1,ea=class extends St{constructor(e,t,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new Nt(ys,vs,e,t);s.layers=this.layers,this.add(s);let r=new Nt(ys,vs,e,t);r.layers=this.layers,this.add(r);let o=new Nt(ys,vs,e,t);o.layers=this.layers,this.add(o);let a=new Nt(ys,vs,e,t);a.layers=this.layers,this.add(a);let l=new Nt(ys,vs,e,t);l.layers=this.layers,this.add(l);let c=new Nt(ys,vs,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[i,s,r,o,a,l]=t;for(let c of t)this.remove(c);if(e===bn)i.up.set(0,1,0),i.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===Tr)i.up.set(0,-1,0),i.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:i,activeMipmapLevel:s}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[r,o,a,l,c,u]=this.children,d=e.getRenderTarget(),h=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;let y=i.texture.generateMipmaps;i.texture.generateMipmaps=!1,e.setRenderTarget(i,0,s),e.render(t,r),e.setRenderTarget(i,1,s),e.render(t,o),e.setRenderTarget(i,2,s),e.render(t,a),e.setRenderTarget(i,3,s),e.render(t,l),e.setRenderTarget(i,4,s),e.render(t,c),i.texture.generateMipmaps=y,e.setRenderTarget(i,5,s),e.render(t,u),e.setRenderTarget(d,h,f),e.xr.enabled=g,i.texture.needsPMREMUpdate=!0}},Dr=class extends Kt{constructor(e=[],t=Xi,i,s,r,o,a,l,c,u){super(e,t,i,s,r,o,a,l,c,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},ta=class extends In{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let i={width:e,height:e,depth:1},s=[i,i,i,i,i,i];this.texture=new Dr(s),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let i={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new Jn(5,5,5),r=new En({name:"CubemapFromEquirect",uniforms:Yi(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:Wt,blending:Qn});r.uniforms.tEquirect.value=t;let o=new Je(s,r),a=t.minFilter;return t.minFilter===bi&&(t.minFilter=Sn),new ea(1,10,this).update(e,o),t.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(e,t=!0,i=!0,s=!0){let r=e.getRenderTarget();for(let o=0;o<6;o++)e.setRenderTarget(this,o),e.clear(t,i,s);e.setRenderTarget(r)}},Gt=class extends St{constructor(){super(),this.isGroup=!0,this.type="Group"}},mm={type:"move"},As=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Gt,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Gt,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new R,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new R),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Gt,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new R,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new R),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let i of e.hand.values())this._getHandJoint(t,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,i){let s=null,r=null,o=null,a=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){o=!0;for(let y of e.hand.values()){let m=t.getJointPose(y,i),p=this._getHandJoint(c,y);m!==null&&(p.matrix.fromArray(m.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=m.radius),p.visible=m!==null}let u=c.joints["index-finger-tip"],d=c.joints["thumb-tip"],h=u.position.distanceTo(d.position),f=.02,g=.005;c.inputState.pinching&&h>f+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&h<=f-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,i),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1));a!==null&&(s=t.getPose(e.targetRaySpace,i),s===null&&r!==null&&(s=r),s!==null&&(a.matrix.fromArray(s.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,s.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(s.linearVelocity)):a.hasLinearVelocity=!1,s.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(s.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(mm)))}return a!==null&&(a.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=o!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let i=new Gt;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[t.jointName]=i,e.add(i)}return e.joints[t.jointName]}};var Nr=class n{constructor(e,t=1,i=1e3){this.isFog=!0,this.name="",this.color=new De(e),this.near=t,this.far=i}clone(){return new n(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}},Ur=class extends St{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Mn,this.environmentIntensity=1,this.environmentRotation=new Mn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}};var na=class extends Kt{constructor(e=null,t=1,i=1,s,r,o,a,l,c=Jt,u=Jt,d,h){super(null,o,a,l,c,u,s,r,d,h),this.isDataTexture=!0,this.image={data:e,width:t,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var Or=class extends Ut{constructor(e,t,i,s=1){super(e,t,i),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=s}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}},xs=new ot,kh=new ot,Fo=[],zh=new Pn,gm=new ot,gr=new Je,_r=new Ln,Fr=class extends Je{constructor(e,t,i){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new Or(new Float32Array(i*16),16),this.instanceColor=null,this.morphTexture=null,this.count=i,this.boundingBox=null,this.boundingSphere=null;for(let s=0;s<i;s++)this.setMatrixAt(s,gm)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new Pn),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let i=0;i<t;i++)this.getMatrixAt(i,xs),zh.copy(e.boundingBox).applyMatrix4(xs),this.boundingBox.union(zh)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new Ln),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let i=0;i<t;i++)this.getMatrixAt(i,xs),_r.copy(e.boundingSphere).applyMatrix4(xs),this.boundingSphere.union(_r)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let i=t.morphTargetInfluences,s=this.morphTexture.source.data.data,r=i.length+1,o=e*r+1;for(let a=0;a<i.length;a++)i[a]=s[o+a]}raycast(e,t){let i=this.matrixWorld,s=this.count;if(gr.geometry=this.geometry,gr.material=this.material,gr.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),_r.copy(this.boundingSphere),_r.applyMatrix4(i),e.ray.intersectsSphere(_r)!==!1))for(let r=0;r<s;r++){this.getMatrixAt(r,xs),kh.multiplyMatrices(i,xs),gr.matrixWorld=kh,gr.raycast(e,Fo);for(let o=0,a=Fo.length;o<a;o++){let l=Fo[o];l.instanceId=r,l.object=this,t.push(l)}Fo.length=0}}setColorAt(e,t){this.instanceColor===null&&(this.instanceColor=new Or(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3)}setMatrixAt(e,t){t.toArray(this.instanceMatrix.array,e*16)}setMorphAt(e,t){let i=t.morphTargetInfluences,s=i.length+1;this.morphTexture===null&&(this.morphTexture=new na(new Float32Array(s*this.count),s,this.count,Ha,Tn));let r=this.morphTexture.source.data.data,o=0;for(let c=0;c<i.length;c++)o+=i[c];let a=this.geometry.morphTargetsRelative?1:1-o,l=s*e;r[l]=a,r.set(i,l+1)}updateMorphTargets(){}dispose(){this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}},Mc=new R,_m=new R,ym=new ze,fn=class{constructor(e=new R(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,i,s){return this.normal.set(e,t,i),this.constant=s,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,i){let s=Mc.subVectors(i,t).cross(_m.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(s,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){let i=e.delta(Mc),s=this.normal.dot(i);if(s===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let r=-(e.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:t.copy(e.start).addScaledVector(i,r)}intersectsLine(e){let t=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return t<0&&i>0||i<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let i=t||ym.getNormalMatrix(e),s=this.coplanarPoint(Mc).applyMatrix4(e),r=this.normal.applyMatrix3(i).normalize();return this.constant=-s.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}},ki=new Ln,vm=new re(.5,.5),Bo=new R,Rs=class{constructor(e=new fn,t=new fn,i=new fn,s=new fn,r=new fn,o=new fn){this.planes=[e,t,i,s,r,o]}set(e,t,i,s,r,o){let a=this.planes;return a[0].copy(e),a[1].copy(t),a[2].copy(i),a[3].copy(s),a[4].copy(r),a[5].copy(o),this}copy(e){let t=this.planes;for(let i=0;i<6;i++)t[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,t=bn,i=!1){let s=this.planes,r=e.elements,o=r[0],a=r[1],l=r[2],c=r[3],u=r[4],d=r[5],h=r[6],f=r[7],g=r[8],y=r[9],m=r[10],p=r[11],w=r[12],E=r[13],b=r[14],I=r[15];if(s[0].setComponents(c-o,f-u,p-g,I-w).normalize(),s[1].setComponents(c+o,f+u,p+g,I+w).normalize(),s[2].setComponents(c+a,f+d,p+y,I+E).normalize(),s[3].setComponents(c-a,f-d,p-y,I-E).normalize(),i)s[4].setComponents(l,h,m,b).normalize(),s[5].setComponents(c-l,f-h,p-m,I-b).normalize();else if(s[4].setComponents(c-l,f-h,p-m,I-b).normalize(),t===bn)s[5].setComponents(c+l,f+h,p+m,I+b).normalize();else if(t===Tr)s[5].setComponents(l,h,m,b).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),ki.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),ki.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(ki)}intersectsSprite(e){ki.center.set(0,0,0);let t=vm.distanceTo(e.center);return ki.radius=.7071067811865476+t,ki.applyMatrix4(e.matrixWorld),this.intersectsSphere(ki)}intersectsSphere(e){let t=this.planes,i=e.center,s=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(i)<s)return!1;return!0}intersectsBox(e){let t=this.planes;for(let i=0;i<6;i++){let s=t[i];if(Bo.x=s.normal.x>0?e.max.x:e.min.x,Bo.y=s.normal.y>0?e.max.y:e.min.y,Bo.z=s.normal.z>0?e.max.z:e.min.z,s.distanceToPoint(Bo)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let i=0;i<6;i++)if(t[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var Br=class extends Dn{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new De(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}},ia=new R,sa=new R,Hh=new ot,yr=new gi,ko=new Ln,Ec=new R,Vh=new R,ra=class extends St{constructor(e=new wt,t=new Br){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,i=[0];for(let s=1,r=t.count;s<r;s++)ia.fromBufferAttribute(t,s-1),sa.fromBufferAttribute(t,s),i[s]=i[s-1],i[s]+=ia.distanceTo(sa);e.setAttribute("lineDistance",new Qe(i,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,t){let i=this.geometry,s=this.matrixWorld,r=e.params.Line.threshold,o=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),ko.copy(i.boundingSphere),ko.applyMatrix4(s),ko.radius+=r,e.ray.intersectsSphere(ko)===!1)return;Hh.copy(s).invert(),yr.copy(e.ray).applyMatrix4(Hh);let a=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=this.isLineSegments?2:1,u=i.index,h=i.attributes.position;if(u!==null){let f=Math.max(0,o.start),g=Math.min(u.count,o.start+o.count);for(let y=f,m=g-1;y<m;y+=c){let p=u.getX(y),w=u.getX(y+1),E=zo(this,e,yr,l,p,w,y);E&&t.push(E)}if(this.isLineLoop){let y=u.getX(g-1),m=u.getX(f),p=zo(this,e,yr,l,y,m,g-1);p&&t.push(p)}}else{let f=Math.max(0,o.start),g=Math.min(h.count,o.start+o.count);for(let y=f,m=g-1;y<m;y+=c){let p=zo(this,e,yr,l,y,y+1,y);p&&t.push(p)}if(this.isLineLoop){let y=zo(this,e,yr,l,g-1,f,g-1);y&&t.push(y)}}}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let s=t[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}};function zo(n,e,t,i,s,r,o){let a=n.geometry.attributes.position;if(ia.fromBufferAttribute(a,s),sa.fromBufferAttribute(a,r),t.distanceSqToSegment(ia,sa,Ec,Vh)>i)return;Ec.applyMatrix4(n.matrixWorld);let c=e.ray.origin.distanceTo(Ec);if(!(c<e.near||c>e.far))return{distance:c,point:Vh.clone().applyMatrix4(n.matrixWorld),index:o,face:null,faceIndex:null,barycoord:null,object:n}}var Gh=new R,Wh=new R,oa=class extends ra{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,i=[];for(let s=0,r=t.count;s<r;s+=2)Gh.fromBufferAttribute(t,s),Wh.fromBufferAttribute(t,s+1),i[s]=s===0?0:i[s-1],i[s+1]=i[s]+Gh.distanceTo(Wh);e.setAttribute("lineDistance",new Qe(i,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}};var Cs=class extends Dn{constructor(e){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new De(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},$h=new ot,Uc=new gi,Ho=new Ln,Vo=new R,kr=class extends St{constructor(e=new wt,t=new Cs){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}raycast(e,t){let i=this.geometry,s=this.matrixWorld,r=e.params.Points.threshold,o=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),Ho.copy(i.boundingSphere),Ho.applyMatrix4(s),Ho.radius+=r,e.ray.intersectsSphere(Ho)===!1)return;$h.copy(s).invert(),Uc.copy(e.ray).applyMatrix4($h);let a=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=i.index,d=i.attributes.position;if(c!==null){let h=Math.max(0,o.start),f=Math.min(c.count,o.start+o.count);for(let g=h,y=f;g<y;g++){let m=c.getX(g);Vo.fromBufferAttribute(d,m),Xh(Vo,m,l,s,e,t,this)}}else{let h=Math.max(0,o.start),f=Math.min(d.count,o.start+o.count);for(let g=h,y=f;g<y;g++)Vo.fromBufferAttribute(d,g),Xh(Vo,g,l,s,e,t,this)}}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let s=t[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}};function Xh(n,e,t,i,s,r,o){let a=Uc.distanceSqToPoint(n);if(a<t){let l=new R;Uc.closestPointToPoint(n,l),l.applyMatrix4(i);let c=s.ray.origin.distanceTo(l);if(c<s.near||c>s.far)return;r.push({distance:c,distanceToRay:Math.sqrt(a),point:l,index:e,face:null,faceIndex:null,barycoord:null,object:o})}}var zr=class extends Kt{constructor(e,t,i=Si,s,r,o,a=Jt,l=Jt,c,u=Ms,d=1){if(u!==Ms&&u!==zs)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let h={width:e,height:t,depth:d};super(h,s,r,o,a,l,u,i,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Ts(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}},Hr=class extends Kt{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}};var Vr=class n extends wt{constructor(e=1,t=32,i=0,s=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:i,thetaLength:s},t=Math.max(3,t);let r=[],o=[],a=[],l=[],c=new R,u=new re;o.push(0,0,0),a.push(0,0,1),l.push(.5,.5);for(let d=0,h=3;d<=t;d++,h+=3){let f=i+d/t*s;c.x=e*Math.cos(f),c.y=e*Math.sin(f),o.push(c.x,c.y,c.z),a.push(0,0,1),u.x=(o[h]/e+1)/2,u.y=(o[h+1]/e+1)/2,l.push(u.x,u.y)}for(let d=1;d<=t;d++)r.push(d,d+1,0);this.setIndex(r),this.setAttribute("position",new Qe(o,3)),this.setAttribute("normal",new Qe(a,3)),this.setAttribute("uv",new Qe(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radius,e.segments,e.thetaStart,e.thetaLength)}},Un=class n extends wt{constructor(e=1,t=1,i=1,s=32,r=1,o=!1,a=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:i,radialSegments:s,heightSegments:r,openEnded:o,thetaStart:a,thetaLength:l};let c=this;s=Math.floor(s),r=Math.floor(r);let u=[],d=[],h=[],f=[],g=0,y=[],m=i/2,p=0;w(),o===!1&&(e>0&&E(!0),t>0&&E(!1)),this.setIndex(u),this.setAttribute("position",new Qe(d,3)),this.setAttribute("normal",new Qe(h,3)),this.setAttribute("uv",new Qe(f,2));function w(){let b=new R,I=new R,A=0,P=(t-e)/i;for(let N=0;N<=r;N++){let M=[],S=N/r,D=S*(t-e)+e;for(let B=0;B<=s;B++){let H=B/s,W=H*l+a,q=Math.sin(W),$=Math.cos(W);I.x=D*q,I.y=-S*i+m,I.z=D*$,d.push(I.x,I.y,I.z),b.set(q,P,$).normalize(),h.push(b.x,b.y,b.z),f.push(H,1-S),M.push(g++)}y.push(M)}for(let N=0;N<s;N++)for(let M=0;M<r;M++){let S=y[M][N],D=y[M+1][N],B=y[M+1][N+1],H=y[M][N+1];(e>0||M!==0)&&(u.push(S,D,H),A+=3),(t>0||M!==r-1)&&(u.push(D,B,H),A+=3)}c.addGroup(p,A,0),p+=A}function E(b){let I=g,A=new re,P=new R,N=0,M=b===!0?e:t,S=b===!0?1:-1;for(let B=1;B<=s;B++)d.push(0,m*S,0),h.push(0,S,0),f.push(.5,.5),g++;let D=g;for(let B=0;B<=s;B++){let W=B/s*l+a,q=Math.cos(W),$=Math.sin(W);P.x=M*$,P.y=m*S,P.z=M*q,d.push(P.x,P.y,P.z),h.push(0,S,0),A.x=q*.5+.5,A.y=$*.5*S+.5,f.push(A.x,A.y),g++}for(let B=0;B<s;B++){let H=I+B,W=D+B;b===!0?u.push(W,W+1,H):u.push(W+1,W,H),N+=3}c.addGroup(p,N,b===!0?1:2),p+=N}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}};var mn=class{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){console.warn("THREE.Curve: .getPoint() not implemented.")}getPointAt(e,t){let i=this.getUtoTmapping(e);return this.getPoint(i,t)}getPoints(e=5){let t=[];for(let i=0;i<=e;i++)t.push(this.getPoint(i/e));return t}getSpacedPoints(e=5){let t=[];for(let i=0;i<=e;i++)t.push(this.getPointAt(i/e));return t}getLength(){let e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let t=[],i,s=this.getPoint(0),r=0;t.push(0);for(let o=1;o<=e;o++)i=this.getPoint(o/e),r+=i.distanceTo(s),t.push(r),s=i;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t=null){let i=this.getLengths(),s=0,r=i.length,o;t?o=t:o=e*i[r-1];let a=0,l=r-1,c;for(;a<=l;)if(s=Math.floor(a+(l-a)/2),c=i[s]-o,c<0)a=s+1;else if(c>0)l=s-1;else{l=s;break}if(s=l,i[s]===o)return s/(r-1);let u=i[s],h=i[s+1]-u,f=(o-u)/h;return(s+f)/(r-1)}getTangent(e,t){let s=e-1e-4,r=e+1e-4;s<0&&(s=0),r>1&&(r=1);let o=this.getPoint(s),a=this.getPoint(r),l=t||(o.isVector2?new re:new R);return l.copy(a).sub(o).normalize(),l}getTangentAt(e,t){let i=this.getUtoTmapping(e);return this.getTangent(i,t)}computeFrenetFrames(e,t=!1){let i=new R,s=[],r=[],o=[],a=new R,l=new ot;for(let f=0;f<=e;f++){let g=f/e;s[f]=this.getTangentAt(g,new R)}r[0]=new R,o[0]=new R;let c=Number.MAX_VALUE,u=Math.abs(s[0].x),d=Math.abs(s[0].y),h=Math.abs(s[0].z);u<=c&&(c=u,i.set(1,0,0)),d<=c&&(c=d,i.set(0,1,0)),h<=c&&i.set(0,0,1),a.crossVectors(s[0],i).normalize(),r[0].crossVectors(s[0],a),o[0].crossVectors(s[0],r[0]);for(let f=1;f<=e;f++){if(r[f]=r[f-1].clone(),o[f]=o[f-1].clone(),a.crossVectors(s[f-1],s[f]),a.length()>Number.EPSILON){a.normalize();let g=Math.acos(ke(s[f-1].dot(s[f]),-1,1));r[f].applyMatrix4(l.makeRotationAxis(a,g))}o[f].crossVectors(s[f],r[f])}if(t===!0){let f=Math.acos(ke(r[0].dot(r[e]),-1,1));f/=e,s[0].dot(a.crossVectors(r[0],r[e]))>0&&(f=-f);for(let g=1;g<=e;g++)r[g].applyMatrix4(l.makeRotationAxis(s[g],f*g)),o[g].crossVectors(s[g],r[g])}return{tangents:s,normals:r,binormals:o}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){let e={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}},Gr=class extends mn{constructor(e=0,t=0,i=1,s=1,r=0,o=Math.PI*2,a=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=e,this.aY=t,this.xRadius=i,this.yRadius=s,this.aStartAngle=r,this.aEndAngle=o,this.aClockwise=a,this.aRotation=l}getPoint(e,t=new re){let i=t,s=Math.PI*2,r=this.aEndAngle-this.aStartAngle,o=Math.abs(r)<Number.EPSILON;for(;r<0;)r+=s;for(;r>s;)r-=s;r<Number.EPSILON&&(o?r=0:r=s),this.aClockwise===!0&&!o&&(r===s?r=-s:r=r-s);let a=this.aStartAngle+e*r,l=this.aX+this.xRadius*Math.cos(a),c=this.aY+this.yRadius*Math.sin(a);if(this.aRotation!==0){let u=Math.cos(this.aRotation),d=Math.sin(this.aRotation),h=l-this.aX,f=c-this.aY;l=h*u-f*d+this.aX,c=h*d+f*u+this.aY}return i.set(l,c)}copy(e){return super.copy(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}toJSON(){let e=super.toJSON();return e.aX=this.aX,e.aY=this.aY,e.xRadius=this.xRadius,e.yRadius=this.yRadius,e.aStartAngle=this.aStartAngle,e.aEndAngle=this.aEndAngle,e.aClockwise=this.aClockwise,e.aRotation=this.aRotation,e}fromJSON(e){return super.fromJSON(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}},aa=class extends Gr{constructor(e,t,i,s,r,o){super(e,t,i,i,s,r,o),this.isArcCurve=!0,this.type="ArcCurve"}};function su(){let n=0,e=0,t=0,i=0;function s(r,o,a,l){n=r,e=a,t=-3*r+3*o-2*a-l,i=2*r-2*o+a+l}return{initCatmullRom:function(r,o,a,l,c){s(o,a,c*(a-r),c*(l-o))},initNonuniformCatmullRom:function(r,o,a,l,c,u,d){let h=(o-r)/c-(a-r)/(c+u)+(a-o)/u,f=(a-o)/u-(l-o)/(u+d)+(l-a)/d;h*=u,f*=u,s(o,a,h,f)},calc:function(r){let o=r*r,a=o*r;return n+e*r+t*o+i*a}}}var Go=new R,wc=new su,Tc=new su,Ac=new su,Is=class extends mn{constructor(e=[],t=!1,i="centripetal",s=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=e,this.closed=t,this.curveType=i,this.tension=s}getPoint(e,t=new R){let i=t,s=this.points,r=s.length,o=(r-(this.closed?0:1))*e,a=Math.floor(o),l=o-a;this.closed?a+=a>0?0:(Math.floor(Math.abs(a)/r)+1)*r:l===0&&a===r-1&&(a=r-2,l=1);let c,u;this.closed||a>0?c=s[(a-1)%r]:(Go.subVectors(s[0],s[1]).add(s[0]),c=Go);let d=s[a%r],h=s[(a+1)%r];if(this.closed||a+2<r?u=s[(a+2)%r]:(Go.subVectors(s[r-1],s[r-2]).add(s[r-1]),u=Go),this.curveType==="centripetal"||this.curveType==="chordal"){let f=this.curveType==="chordal"?.5:.25,g=Math.pow(c.distanceToSquared(d),f),y=Math.pow(d.distanceToSquared(h),f),m=Math.pow(h.distanceToSquared(u),f);y<1e-4&&(y=1),g<1e-4&&(g=y),m<1e-4&&(m=y),wc.initNonuniformCatmullRom(c.x,d.x,h.x,u.x,g,y,m),Tc.initNonuniformCatmullRom(c.y,d.y,h.y,u.y,g,y,m),Ac.initNonuniformCatmullRom(c.z,d.z,h.z,u.z,g,y,m)}else this.curveType==="catmullrom"&&(wc.initCatmullRom(c.x,d.x,h.x,u.x,this.tension),Tc.initCatmullRom(c.y,d.y,h.y,u.y,this.tension),Ac.initCatmullRom(c.z,d.z,h.z,u.z,this.tension));return i.set(wc.calc(l),Tc.calc(l),Ac.calc(l)),i}copy(e){super.copy(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let s=e.points[t];this.points.push(s.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,i=this.points.length;t<i;t++){let s=this.points[t];e.points.push(s.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let s=e.points[t];this.points.push(new R().fromArray(s))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}};function qh(n,e,t,i,s){let r=(i-e)*.5,o=(s-t)*.5,a=n*n,l=n*a;return(2*t-2*i+r+o)*l+(-3*t+3*i-2*r-o)*a+r*n+t}function xm(n,e){let t=1-n;return t*t*e}function bm(n,e){return 2*(1-n)*n*e}function Sm(n,e){return n*n*e}function Sr(n,e,t,i){return xm(n,e)+bm(n,t)+Sm(n,i)}function Mm(n,e){let t=1-n;return t*t*t*e}function Em(n,e){let t=1-n;return 3*t*t*n*e}function wm(n,e){return 3*(1-n)*n*n*e}function Tm(n,e){return n*n*n*e}function Mr(n,e,t,i,s){return Mm(n,e)+Em(n,t)+wm(n,i)+Tm(n,s)}var la=class extends mn{constructor(e=new re,t=new re,i=new re,s=new re){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=e,this.v1=t,this.v2=i,this.v3=s}getPoint(e,t=new re){let i=t,s=this.v0,r=this.v1,o=this.v2,a=this.v3;return i.set(Mr(e,s.x,r.x,o.x,a.x),Mr(e,s.y,r.y,o.y,a.y)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},ca=class extends mn{constructor(e=new R,t=new R,i=new R,s=new R){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=e,this.v1=t,this.v2=i,this.v3=s}getPoint(e,t=new R){let i=t,s=this.v0,r=this.v1,o=this.v2,a=this.v3;return i.set(Mr(e,s.x,r.x,o.x,a.x),Mr(e,s.y,r.y,o.y,a.y),Mr(e,s.z,r.z,o.z,a.z)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},ua=class extends mn{constructor(e=new re,t=new re){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=e,this.v2=t}getPoint(e,t=new re){let i=t;return e===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(e).add(this.v1)),i}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new re){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},ha=class extends mn{constructor(e=new R,t=new R){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=e,this.v2=t}getPoint(e,t=new R){let i=t;return e===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(e).add(this.v1)),i}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new R){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},da=class extends mn{constructor(e=new re,t=new re,i=new re){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=e,this.v1=t,this.v2=i}getPoint(e,t=new re){let i=t,s=this.v0,r=this.v1,o=this.v2;return i.set(Sr(e,s.x,r.x,o.x),Sr(e,s.y,r.y,o.y)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Wr=class extends mn{constructor(e=new R,t=new R,i=new R){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=e,this.v1=t,this.v2=i}getPoint(e,t=new R){let i=t,s=this.v0,r=this.v1,o=this.v2;return i.set(Sr(e,s.x,r.x,o.x),Sr(e,s.y,r.y,o.y),Sr(e,s.z,r.z,o.z)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},fa=class extends mn{constructor(e=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=e}getPoint(e,t=new re){let i=t,s=this.points,r=(s.length-1)*e,o=Math.floor(r),a=r-o,l=s[o===0?o:o-1],c=s[o],u=s[o>s.length-2?s.length-1:o+1],d=s[o>s.length-3?s.length-1:o+2];return i.set(qh(a,l.x,c.x,u.x,d.x),qh(a,l.y,c.y,u.y,d.y)),i}copy(e){super.copy(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let s=e.points[t];this.points.push(s.clone())}return this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,i=this.points.length;t<i;t++){let s=this.points[t];e.points.push(s.toArray())}return e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let s=e.points[t];this.points.push(new re().fromArray(s))}return this}},Am=Object.freeze({__proto__:null,ArcCurve:aa,CatmullRomCurve3:Is,CubicBezierCurve:la,CubicBezierCurve3:ca,EllipseCurve:Gr,LineCurve:ua,LineCurve3:ha,QuadraticBezierCurve:da,QuadraticBezierCurve3:Wr,SplineCurve:fa});var Ps=class n extends wt{constructor(e=[new re(0,-.5),new re(.5,0),new re(0,.5)],t=12,i=0,s=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:e,segments:t,phiStart:i,phiLength:s},t=Math.floor(t),s=ke(s,0,Math.PI*2);let r=[],o=[],a=[],l=[],c=[],u=1/t,d=new R,h=new re,f=new R,g=new R,y=new R,m=0,p=0;for(let w=0;w<=e.length-1;w++)switch(w){case 0:m=e[w+1].x-e[w].x,p=e[w+1].y-e[w].y,f.x=p*1,f.y=-m,f.z=p*0,y.copy(f),f.normalize(),l.push(f.x,f.y,f.z);break;case e.length-1:l.push(y.x,y.y,y.z);break;default:m=e[w+1].x-e[w].x,p=e[w+1].y-e[w].y,f.x=p*1,f.y=-m,f.z=p*0,g.copy(f),f.x+=y.x,f.y+=y.y,f.z+=y.z,f.normalize(),l.push(f.x,f.y,f.z),y.copy(g)}for(let w=0;w<=t;w++){let E=i+w*u*s,b=Math.sin(E),I=Math.cos(E);for(let A=0;A<=e.length-1;A++){d.x=e[A].x*b,d.y=e[A].y,d.z=e[A].x*I,o.push(d.x,d.y,d.z),h.x=w/t,h.y=A/(e.length-1),a.push(h.x,h.y);let P=l[3*A+0]*b,N=l[3*A+1],M=l[3*A+0]*I;c.push(P,N,M)}}for(let w=0;w<t;w++)for(let E=0;E<e.length-1;E++){let b=E+w*e.length,I=b,A=b+e.length,P=b+e.length+1,N=b+1;r.push(I,A,N),r.push(P,N,A)}this.setIndex(r),this.setAttribute("position",new Qe(o,3)),this.setAttribute("uv",new Qe(a,2)),this.setAttribute("normal",new Qe(c,3))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.points,e.segments,e.phiStart,e.phiLength)}};var Kn=class n extends wt{constructor(e=1,t=1,i=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:i,heightSegments:s};let r=e/2,o=t/2,a=Math.floor(i),l=Math.floor(s),c=a+1,u=l+1,d=e/a,h=t/l,f=[],g=[],y=[],m=[];for(let p=0;p<u;p++){let w=p*h-o;for(let E=0;E<c;E++){let b=E*d-r;g.push(b,-w,0),y.push(0,0,1),m.push(E/a),m.push(1-p/l)}}for(let p=0;p<l;p++)for(let w=0;w<a;w++){let E=w+c*p,b=w+c*(p+1),I=w+1+c*(p+1),A=w+1+c*p;f.push(E,b,A),f.push(b,I,A)}this.setIndex(f),this.setAttribute("position",new Qe(g,3)),this.setAttribute("normal",new Qe(y,3)),this.setAttribute("uv",new Qe(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.width,e.height,e.widthSegments,e.heightSegments)}};var $r=class n extends wt{constructor(e=1,t=32,i=16,s=0,r=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:i,phiStart:s,phiLength:r,thetaStart:o,thetaLength:a},t=Math.max(3,Math.floor(t)),i=Math.max(2,Math.floor(i));let l=Math.min(o+a,Math.PI),c=0,u=[],d=new R,h=new R,f=[],g=[],y=[],m=[];for(let p=0;p<=i;p++){let w=[],E=p/i,b=0;p===0&&o===0?b=.5/t:p===i&&l===Math.PI&&(b=-.5/t);for(let I=0;I<=t;I++){let A=I/t;d.x=-e*Math.cos(s+A*r)*Math.sin(o+E*a),d.y=e*Math.cos(o+E*a),d.z=e*Math.sin(s+A*r)*Math.sin(o+E*a),g.push(d.x,d.y,d.z),h.copy(d).normalize(),y.push(h.x,h.y,h.z),m.push(A+b,1-E),w.push(c++)}u.push(w)}for(let p=0;p<i;p++)for(let w=0;w<t;w++){let E=u[p][w+1],b=u[p][w],I=u[p+1][w],A=u[p+1][w+1];(p!==0||o>0)&&f.push(E,b,A),(p!==i-1||l<Math.PI)&&f.push(b,I,A)}this.setIndex(f),this.setAttribute("position",new Qe(g,3)),this.setAttribute("normal",new Qe(y,3)),this.setAttribute("uv",new Qe(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}};var Ls=class n extends wt{constructor(e=1,t=.4,i=12,s=48,r=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:i,tubularSegments:s,arc:r},i=Math.floor(i),s=Math.floor(s);let o=[],a=[],l=[],c=[],u=new R,d=new R,h=new R;for(let f=0;f<=i;f++)for(let g=0;g<=s;g++){let y=g/s*r,m=f/i*Math.PI*2;d.x=(e+t*Math.cos(m))*Math.cos(y),d.y=(e+t*Math.cos(m))*Math.sin(y),d.z=t*Math.sin(m),a.push(d.x,d.y,d.z),u.x=e*Math.cos(y),u.y=e*Math.sin(y),h.subVectors(d,u).normalize(),l.push(h.x,h.y,h.z),c.push(g/s),c.push(f/i)}for(let f=1;f<=i;f++)for(let g=1;g<=s;g++){let y=(s+1)*f+g-1,m=(s+1)*(f-1)+g-1,p=(s+1)*(f-1)+g,w=(s+1)*f+g;o.push(y,m,w),o.push(m,p,w)}this.setIndex(o),this.setAttribute("position",new Qe(a,3)),this.setAttribute("normal",new Qe(l,3)),this.setAttribute("uv",new Qe(c,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc)}};var Ds=class n extends wt{constructor(e=new Wr(new R(-1,-1,0),new R(-1,1,0),new R(1,1,0)),t=64,i=1,s=8,r=!1){super(),this.type="TubeGeometry",this.parameters={path:e,tubularSegments:t,radius:i,radialSegments:s,closed:r};let o=e.computeFrenetFrames(t,r);this.tangents=o.tangents,this.normals=o.normals,this.binormals=o.binormals;let a=new R,l=new R,c=new re,u=new R,d=[],h=[],f=[],g=[];y(),this.setIndex(g),this.setAttribute("position",new Qe(d,3)),this.setAttribute("normal",new Qe(h,3)),this.setAttribute("uv",new Qe(f,2));function y(){for(let E=0;E<t;E++)m(E);m(r===!1?t:0),w(),p()}function m(E){u=e.getPointAt(E/t,u);let b=o.normals[E],I=o.binormals[E];for(let A=0;A<=s;A++){let P=A/s*Math.PI*2,N=Math.sin(P),M=-Math.cos(P);l.x=M*b.x+N*I.x,l.y=M*b.y+N*I.y,l.z=M*b.z+N*I.z,l.normalize(),h.push(l.x,l.y,l.z),a.x=u.x+i*l.x,a.y=u.y+i*l.y,a.z=u.z+i*l.z,d.push(a.x,a.y,a.z)}}function p(){for(let E=1;E<=t;E++)for(let b=1;b<=s;b++){let I=(s+1)*(E-1)+(b-1),A=(s+1)*E+(b-1),P=(s+1)*E+b,N=(s+1)*(E-1)+b;g.push(I,A,N),g.push(A,P,N)}}function w(){for(let E=0;E<=t;E++)for(let b=0;b<=s;b++)c.x=E/t,c.y=b/s,f.push(c.x,c.y)}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON();return e.path=this.parameters.path.toJSON(),e}static fromJSON(e){return new n(new Am[e.path.type]().fromJSON(e.path),e.tubularSegments,e.radius,e.radialSegments,e.closed)}};var Ns=class extends Dn{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new De(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new De(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Kc,this.normalScale=new re(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Mn,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}},On=class extends Ns{constructor(e){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new re(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return ke(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(t){this.ior=(1+.4*t)/(1-.4*t)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new De(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new De(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new De(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._sheen=0,this._transmission=0,this.setValues(e)}get anisotropy(){return this._anisotropy}set anisotropy(e){this._anisotropy>0!=e>0&&this.version++,this._anisotropy=e}get clearcoat(){return this._clearcoat}set clearcoat(e){this._clearcoat>0!=e>0&&this.version++,this._clearcoat=e}get iridescence(){return this._iridescence}set iridescence(e){this._iridescence>0!=e>0&&this.version++,this._iridescence=e}get dispersion(){return this._dispersion}set dispersion(e){this._dispersion>0!=e>0&&this.version++,this._dispersion=e}get sheen(){return this._sheen}set sheen(e){this._sheen>0!=e>0&&this.version++,this._sheen=e}get transmission(){return this._transmission}set transmission(e){this._transmission>0!=e>0&&this.version++,this._transmission=e}copy(e){return super.copy(e),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=e.anisotropy,this.anisotropyRotation=e.anisotropyRotation,this.anisotropyMap=e.anisotropyMap,this.clearcoat=e.clearcoat,this.clearcoatMap=e.clearcoatMap,this.clearcoatRoughness=e.clearcoatRoughness,this.clearcoatRoughnessMap=e.clearcoatRoughnessMap,this.clearcoatNormalMap=e.clearcoatNormalMap,this.clearcoatNormalScale.copy(e.clearcoatNormalScale),this.dispersion=e.dispersion,this.ior=e.ior,this.iridescence=e.iridescence,this.iridescenceMap=e.iridescenceMap,this.iridescenceIOR=e.iridescenceIOR,this.iridescenceThicknessRange=[...e.iridescenceThicknessRange],this.iridescenceThicknessMap=e.iridescenceThicknessMap,this.sheen=e.sheen,this.sheenColor.copy(e.sheenColor),this.sheenColorMap=e.sheenColorMap,this.sheenRoughness=e.sheenRoughness,this.sheenRoughnessMap=e.sheenRoughnessMap,this.transmission=e.transmission,this.transmissionMap=e.transmissionMap,this.thickness=e.thickness,this.thicknessMap=e.thicknessMap,this.attenuationDistance=e.attenuationDistance,this.attenuationColor.copy(e.attenuationColor),this.specularIntensity=e.specularIntensity,this.specularIntensityMap=e.specularIntensityMap,this.specularColor.copy(e.specularColor),this.specularColorMap=e.specularColorMap,this}};var pa=class extends Dn{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Ad,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},ma=class extends Dn{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function Wo(n,e){return!n||n.constructor===e?n:typeof e.BYTES_PER_ELEMENT=="number"?new e(n):Array.prototype.slice.call(n)}function Rm(n){return ArrayBuffer.isView(n)&&!(n instanceof DataView)}var Wi=class{constructor(e,t,i,s){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new t.constructor(i),this.sampleValues=t,this.valueSize=i,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,i=this._cachedIndex,s=t[i],r=t[i-1];n:{e:{let o;t:{i:if(!(e<s)){for(let a=i+2;;){if(s===void 0){if(e<r)break i;return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}if(i===a)break;if(r=s,s=t[++i],e<s)break e}o=t.length;break t}if(!(e>=r)){let a=t[1];e<a&&(i=2,r=a);for(let l=i-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===l)break;if(s=r,r=t[--i-1],e>=r)break e}o=i,i=0;break t}break n}for(;i<o;){let a=i+o>>>1;e<t[a]?o=a:i=a+1}if(s=t[i],r=t[i-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}this._cachedIndex=i,this.intervalChanged_(i,r,s)}return this.interpolate_(i,r,e,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,i=this.sampleValues,s=this.valueSize,r=e*s;for(let o=0;o!==s;++o)t[o]=i[r+o];return t}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},ga=class extends Wi{constructor(e,t,i,s){super(e,t,i,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Ic,endingEnd:Ic}}intervalChanged_(e,t,i){let s=this.parameterPositions,r=e-2,o=e+1,a=s[r],l=s[o];if(a===void 0)switch(this.getSettings_().endingStart){case Pc:r=e,a=2*t-i;break;case Lc:r=s.length-2,a=t+s[r]-s[r+1];break;default:r=e,a=i}if(l===void 0)switch(this.getSettings_().endingEnd){case Pc:o=e,l=2*i-t;break;case Lc:o=1,l=i+s[1]-s[0];break;default:o=e-1,l=t}let c=(i-t)*.5,u=this.valueSize;this._weightPrev=c/(t-a),this._weightNext=c/(l-i),this._offsetPrev=r*u,this._offsetNext=o*u}interpolate_(e,t,i,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=e*a,c=l-a,u=this._offsetPrev,d=this._offsetNext,h=this._weightPrev,f=this._weightNext,g=(i-t)/(s-t),y=g*g,m=y*g,p=-h*m+2*h*y-h*g,w=(1+h)*m+(-1.5-2*h)*y+(-.5+h)*g+1,E=(-1-f)*m+(1.5+f)*y+.5*g,b=f*m-f*y;for(let I=0;I!==a;++I)r[I]=p*o[u+I]+w*o[c+I]+E*o[l+I]+b*o[d+I];return r}},_a=class extends Wi{constructor(e,t,i,s){super(e,t,i,s)}interpolate_(e,t,i,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=e*a,c=l-a,u=(i-t)/(s-t),d=1-u;for(let h=0;h!==a;++h)r[h]=o[c+h]*d+o[l+h]*u;return r}},ya=class extends Wi{constructor(e,t,i,s){super(e,t,i,s)}interpolate_(e){return this.copySampleValue_(e-1)}},on=class{constructor(e,t,i,s){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=Wo(t,this.TimeBufferType),this.values=Wo(i,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,i;if(t.toJSON!==this.toJSON)i=t.toJSON(e);else{i={name:e.name,times:Wo(e.times,Array),values:Wo(e.values,Array)};let s=e.getInterpolation();s!==e.DefaultInterpolation&&(i.interpolation=s)}return i.type=e.ValueTypeName,i}InterpolantFactoryMethodDiscrete(e){return new ya(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new _a(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new ga(this.times,this.values,this.getValueSize(),e)}setInterpolation(e){let t;switch(e){case Er:t=this.InterpolantFactoryMethodDiscrete;break;case Zo:t=this.InterpolantFactoryMethodLinear;break;case $o:t=this.InterpolantFactoryMethodSmooth;break}if(t===void 0){let i="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(i);return console.warn("THREE.KeyframeTrack:",i),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Er;case this.InterpolantFactoryMethodLinear:return Zo;case this.InterpolantFactoryMethodSmooth:return $o}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let i=0,s=t.length;i!==s;++i)t[i]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let i=0,s=t.length;i!==s;++i)t[i]*=e}return this}trim(e,t){let i=this.times,s=i.length,r=0,o=s-1;for(;r!==s&&i[r]<e;)++r;for(;o!==-1&&i[o]>t;)--o;if(++o,r!==0||o!==s){r>=o&&(o=Math.max(o,1),r=o-1);let a=this.getValueSize();this.times=i.slice(r,o),this.values=this.values.slice(r*a,o*a)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),e=!1);let i=this.times,s=this.values,r=i.length;r===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),e=!1);let o=null;for(let a=0;a!==r;a++){let l=i[a];if(typeof l=="number"&&isNaN(l)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,a,l),e=!1;break}if(o!==null&&o>l){console.error("THREE.KeyframeTrack: Out of order keys.",this,a,l,o),e=!1;break}o=l}if(s!==void 0&&Rm(s))for(let a=0,l=s.length;a!==l;++a){let c=s[a];if(isNaN(c)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,a,c),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),i=this.getValueSize(),s=this.getInterpolation()===$o,r=e.length-1,o=1;for(let a=1;a<r;++a){let l=!1,c=e[a],u=e[a+1];if(c!==u&&(a!==1||c!==e[0]))if(s)l=!0;else{let d=a*i,h=d-i,f=d+i;for(let g=0;g!==i;++g){let y=t[d+g];if(y!==t[h+g]||y!==t[f+g]){l=!0;break}}}if(l){if(a!==o){e[o]=e[a];let d=a*i,h=o*i;for(let f=0;f!==i;++f)t[h+f]=t[d+f]}++o}}if(r>0){e[o]=e[r];for(let a=r*i,l=o*i,c=0;c!==i;++c)t[l+c]=t[a+c];++o}return o!==e.length?(this.times=e.slice(0,o),this.values=t.slice(0,o*i)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),i=this.constructor,s=new i(this.name,e,t);return s.createInterpolant=this.createInterpolant,s}};on.prototype.ValueTypeName="";on.prototype.TimeBufferType=Float32Array;on.prototype.ValueBufferType=Float32Array;on.prototype.DefaultInterpolation=Zo;var _i=class extends on{constructor(e,t,i){super(e,t,i)}};_i.prototype.ValueTypeName="bool";_i.prototype.ValueBufferType=Array;_i.prototype.DefaultInterpolation=Er;_i.prototype.InterpolantFactoryMethodLinear=void 0;_i.prototype.InterpolantFactoryMethodSmooth=void 0;var va=class extends on{constructor(e,t,i,s){super(e,t,i,s)}};va.prototype.ValueTypeName="color";var xa=class extends on{constructor(e,t,i,s){super(e,t,i,s)}};xa.prototype.ValueTypeName="number";var ba=class extends Wi{constructor(e,t,i,s){super(e,t,i,s)}interpolate_(e,t,i,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=(i-t)/(s-t),c=e*a;for(let u=c+a;c!==u;c+=4)pn.slerpFlat(r,0,o,c-a,o,c,l);return r}},Xr=class extends on{constructor(e,t,i,s){super(e,t,i,s)}InterpolantFactoryMethodLinear(e){return new ba(this.times,this.values,this.getValueSize(),e)}};Xr.prototype.ValueTypeName="quaternion";Xr.prototype.InterpolantFactoryMethodSmooth=void 0;var yi=class extends on{constructor(e,t,i){super(e,t,i)}};yi.prototype.ValueTypeName="string";yi.prototype.ValueBufferType=Array;yi.prototype.DefaultInterpolation=Er;yi.prototype.InterpolantFactoryMethodLinear=void 0;yi.prototype.InterpolantFactoryMethodSmooth=void 0;var Sa=class extends on{constructor(e,t,i,s){super(e,t,i,s)}};Sa.prototype.ValueTypeName="vector";var Ma=class{constructor(e,t,i){let s=this,r=!1,o=0,a=0,l,c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=i,this.abortController=new AbortController,this.itemStart=function(u){a++,r===!1&&s.onStart!==void 0&&s.onStart(u,o,a),r=!0},this.itemEnd=function(u){o++,s.onProgress!==void 0&&s.onProgress(u,o,a),o===a&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(u){s.onError!==void 0&&s.onError(u)},this.resolveURL=function(u){return l?l(u):u},this.setURLModifier=function(u){return l=u,this},this.addHandler=function(u,d){return c.push(u,d),this},this.removeHandler=function(u){let d=c.indexOf(u);return d!==-1&&c.splice(d,2),this},this.getHandler=function(u){for(let d=0,h=c.length;d<h;d+=2){let f=c[d],g=c[d+1];if(f.global&&(f.lastIndex=0),f.test(u))return g}return null},this.abort=function(){return this.abortController.abort(),this.abortController=new AbortController,this}}},Hd=new Ma,Ea=class{constructor(e){this.manager=e!==void 0?e:Hd,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(e,t){let i=this;return new Promise(function(s,r){i.load(e,s,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}};Ea.DEFAULT_MATERIAL_NAME="__DEFAULT";var Us=class extends St{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new De(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(t.object.target=this.target.uuid),t}},qr=class extends Us{constructor(e,t,i){super(e,i),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(St.DEFAULT_UP),this.updateMatrix(),this.groundColor=new De(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}},Rc=new ot,jh=new R,Yh=new R,wa=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new re(512,512),this.mapType=wn,this.map=null,this.mapPass=null,this.matrix=new ot,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Rs,this._frameExtents=new re(1,1),this._viewportCount=1,this._viewports=[new it(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera,i=this.matrix;jh.setFromMatrixPosition(e.matrixWorld),t.position.copy(jh),Yh.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Yh),t.updateMatrixWorld(),Rc.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Rc,t.coordinateSystem,t.reversedDepth),t.reversedDepth?i.set(.5,0,0,.5,0,.5,0,.5,0,0,1,0,0,0,0,1):i.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),i.multiply(Rc)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}};var Zh=new ot,vr=new R,Cc=new R,Oc=class extends wa{constructor(){super(new Nt(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new re(4,2),this._viewportCount=6,this._viewports=[new it(2,1,1,1),new it(0,1,1,1),new it(3,1,1,1),new it(1,1,1,1),new it(3,0,1,1),new it(1,0,1,1)],this._cubeDirections=[new R(1,0,0),new R(-1,0,0),new R(0,0,1),new R(0,0,-1),new R(0,1,0),new R(0,-1,0)],this._cubeUps=[new R(0,1,0),new R(0,1,0),new R(0,1,0),new R(0,1,0),new R(0,0,1),new R(0,0,-1)]}updateMatrices(e,t=0){let i=this.camera,s=this.matrix,r=e.distance||i.far;r!==i.far&&(i.far=r,i.updateProjectionMatrix()),vr.setFromMatrixPosition(e.matrixWorld),i.position.copy(vr),Cc.copy(i.position),Cc.add(this._cubeDirections[t]),i.up.copy(this._cubeUps[t]),i.lookAt(Cc),i.updateMatrixWorld(),s.makeTranslation(-vr.x,-vr.y,-vr.z),Zh.multiplyMatrices(i.projectionMatrix,i.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Zh,i.coordinateSystem,i.reversedDepth)}},$i=class extends Us{constructor(e,t,i=0,s=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=i,this.decay=s,this.shadow=new Oc}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}},jr=class extends Lr{constructor(e=-1,t=1,i=1,s=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=i,this.bottom=s,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,i,s,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=i-e,o=i+e,a=s+t,l=s-t;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,o=r+c*this.view.width,a-=u*this.view.offsetY,l=a-u*this.view.height}this.projectionMatrix.makeOrthographic(r,o,a,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},Fc=class extends wa{constructor(){super(new jr(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},Yr=class extends Us{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(St.DEFAULT_UP),this.updateMatrix(),this.target=new St,this.shadow=new Fc}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}};var Ta=class extends Nt{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}},Zr=class{constructor(e=!0){this.autoStart=e,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1}start(){this.startTime=performance.now(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let e=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){let t=performance.now();e=(t-this.oldTime)/1e3,this.oldTime=t,this.elapsedTime+=e}return e}};var ru="\\[\\]\\.:\\/",Cm=new RegExp("["+ru+"]","g"),ou="[^"+ru+"]",Im="[^"+ru.replace("\\.","")+"]",Pm=/((?:WC+[\/:])*)/.source.replace("WC",ou),Lm=/(WCOD+)?/.source.replace("WCOD",Im),Dm=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",ou),Nm=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",ou),Um=new RegExp("^"+Pm+Lm+Dm+Nm+"$"),Om=["material","materials","bones","map"],Bc=class{constructor(e,t,i){let s=i||dt.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,s)}getValue(e,t){this.bind();let i=this._targetGroup.nCachedObjects_,s=this._bindings[i];s!==void 0&&s.getValue(e,t)}setValue(e,t){let i=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=i.length;s!==r;++s)i[s].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].unbind()}},dt=class n{constructor(e,t,i){this.path=t,this.parsedPath=i||n.parseTrackName(t),this.node=n.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,i){return e&&e.isAnimationObjectGroup?new n.Composite(e,t,i):new n(e,t,i)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(Cm,"")}static parseTrackName(e){let t=Um.exec(e);if(t===null)throw new Error("PropertyBinding: Cannot parse trackName: "+e);let i={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},s=i.nodeName&&i.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=i.nodeName.substring(s+1);Om.indexOf(r)!==-1&&(i.nodeName=i.nodeName.substring(0,s),i.objectName=r)}if(i.propertyName===null||i.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+e);return i}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let i=e.skeleton.getBoneByName(t);if(i!==void 0)return i}if(e.children){let i=function(r){for(let o=0;o<r.length;o++){let a=r[o];if(a.name===t||a.uuid===t)return a;let l=i(a.children);if(l)return l}return null},s=i(e.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)e[t++]=i[s]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)i[s]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)i[s]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)i[s]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,i=t.objectName,s=t.propertyName,r=t.propertyIndex;if(e||(e=n.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(i){let c=t.objectIndex;switch(i){case"materials":if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let u=0;u<e.length;u++)if(e[u].name===c){c=u;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[i]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[i]}if(c!==void 0){if(e[c]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[c]}}let o=e[s];if(o===void 0){let c=t.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+c+"."+s+" but it wasn't found.",e);return}let a=this.Versioning.None;this.targetObject=e,e.isMaterial===!0?a=this.Versioning.NeedsUpdate:e.isObject3D===!0&&(a=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!e.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[r]!==void 0&&(r=e.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=r}else o.fromArray!==void 0&&o.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(l=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][a]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};dt.Composite=Bc;dt.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};dt.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};dt.prototype.GetterByBindingType=[dt.prototype._getValue_direct,dt.prototype._getValue_array,dt.prototype._getValue_arrayElement,dt.prototype._getValue_toArray];dt.prototype.SetterByBindingTypeAndVersioning=[[dt.prototype._setValue_direct,dt.prototype._setValue_direct_setNeedsUpdate,dt.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[dt.prototype._setValue_array,dt.prototype._setValue_array_setNeedsUpdate,dt.prototype._setValue_array_setMatrixWorldNeedsUpdate],[dt.prototype._setValue_arrayElement,dt.prototype._setValue_arrayElement_setNeedsUpdate,dt.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[dt.prototype._setValue_fromArray,dt.prototype._setValue_fromArray_setNeedsUpdate,dt.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var F0=new Float32Array(1);var Os=class{constructor(e=1,t=0,i=0){this.radius=e,this.phi=t,this.theta=i}set(e,t,i){return this.radius=e,this.phi=t,this.theta=i,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){return this.phi=ke(this.phi,1e-6,Math.PI-1e-6),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,t,i){return this.radius=Math.sqrt(e*e+t*t+i*i),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(e,i),this.phi=Math.acos(ke(t/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}};var Jr=class extends oa{constructor(e=10,t=10,i=4473924,s=8947848){i=new De(i),s=new De(s);let r=t/2,o=e/t,a=e/2,l=[],c=[];for(let h=0,f=0,g=-a;h<=t;h++,g+=o){l.push(-a,0,g,a,0,g),l.push(g,0,-a,g,0,a);let y=h===r?i:s;y.toArray(c,f),f+=3,y.toArray(c,f),f+=3,y.toArray(c,f),f+=3,y.toArray(c,f),f+=3}let u=new wt;u.setAttribute("position",new Qe(l,3)),u.setAttribute("color",new Qe(c,3));let d=new Br({vertexColors:!0,toneMapped:!1});super(u,d),this.type="GridHelper"}dispose(){this.geometry.dispose(),this.material.dispose()}};var Kr=class extends Cn{constructor(e,t=null){super(),this.object=e,this.domElement=t,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(e){if(e===void 0){console.warn("THREE.Controls: connect() now requires an element.");return}this.domElement!==null&&this.disconnect(),this.domElement=e}disconnect(){}dispose(){}update(){}};function au(n,e,t,i){let s=Fm(i);switch(t){case Yc:return n*e;case Ha:return n*e/s.components*s.byteLength;case Va:return n*e/s.components*s.byteLength;case Jc:return n*e*2/s.components*s.byteLength;case Ga:return n*e*2/s.components*s.byteLength;case Zc:return n*e*3/s.components*s.byteLength;case gn:return n*e*4/s.components*s.byteLength;case Wa:return n*e*4/s.components*s.byteLength;case no:case io:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case so:case ro:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case Xa:case ja:return Math.max(n,16)*Math.max(e,8)/4;case $a:case qa:return Math.max(n,8)*Math.max(e,8)/2;case Ya:case Za:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case Ja:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case Ka:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case Qa:return Math.floor((n+4)/5)*Math.floor((e+3)/4)*16;case el:return Math.floor((n+4)/5)*Math.floor((e+4)/5)*16;case tl:return Math.floor((n+5)/6)*Math.floor((e+4)/5)*16;case nl:return Math.floor((n+5)/6)*Math.floor((e+5)/6)*16;case il:return Math.floor((n+7)/8)*Math.floor((e+4)/5)*16;case sl:return Math.floor((n+7)/8)*Math.floor((e+5)/6)*16;case rl:return Math.floor((n+7)/8)*Math.floor((e+7)/8)*16;case ol:return Math.floor((n+9)/10)*Math.floor((e+4)/5)*16;case al:return Math.floor((n+9)/10)*Math.floor((e+5)/6)*16;case ll:return Math.floor((n+9)/10)*Math.floor((e+7)/8)*16;case cl:return Math.floor((n+9)/10)*Math.floor((e+9)/10)*16;case ul:return Math.floor((n+11)/12)*Math.floor((e+9)/10)*16;case hl:return Math.floor((n+11)/12)*Math.floor((e+11)/12)*16;case dl:case fl:case pl:return Math.ceil(n/4)*Math.ceil(e/4)*16;case ml:case gl:return Math.ceil(n/4)*Math.ceil(e/4)*8;case _l:case yl:return Math.ceil(n/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function Fm(n){switch(n){case wn:case $c:return{byteLength:1,components:1};case Fs:case Xc:case Bs:return{byteLength:2,components:1};case ka:case za:return{byteLength:2,components:4};case Si:case Ba:case Tn:return{byteLength:4,components:1};case qc:case jc:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${n}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"180"}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="180");function df(){let n=null,e=!1,t=null,i=null;function s(r,o){t(r,o),i=n.requestAnimationFrame(s)}return{start:function(){e!==!0&&t!==null&&(i=n.requestAnimationFrame(s),e=!0)},stop:function(){n.cancelAnimationFrame(i),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){n=r}}}function km(n){let e=new WeakMap;function t(a,l){let c=a.array,u=a.usage,d=c.byteLength,h=n.createBuffer();n.bindBuffer(l,h),n.bufferData(l,c,u),a.onUploadCallback();let f;if(c instanceof Float32Array)f=n.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)f=n.HALF_FLOAT;else if(c instanceof Uint16Array)a.isFloat16BufferAttribute?f=n.HALF_FLOAT:f=n.UNSIGNED_SHORT;else if(c instanceof Int16Array)f=n.SHORT;else if(c instanceof Uint32Array)f=n.UNSIGNED_INT;else if(c instanceof Int32Array)f=n.INT;else if(c instanceof Int8Array)f=n.BYTE;else if(c instanceof Uint8Array)f=n.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)f=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:h,type:f,bytesPerElement:c.BYTES_PER_ELEMENT,version:a.version,size:d}}function i(a,l,c){let u=l.array,d=l.updateRanges;if(n.bindBuffer(c,a),d.length===0)n.bufferSubData(c,0,u);else{d.sort((f,g)=>f.start-g.start);let h=0;for(let f=1;f<d.length;f++){let g=d[h],y=d[f];y.start<=g.start+g.count+1?g.count=Math.max(g.count,y.start+y.count-g.start):(++h,d[h]=y)}d.length=h+1;for(let f=0,g=d.length;f<g;f++){let y=d[f];n.bufferSubData(c,y.start*u.BYTES_PER_ELEMENT,u,y.start,y.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(a){return a.isInterleavedBufferAttribute&&(a=a.data),e.get(a)}function r(a){a.isInterleavedBufferAttribute&&(a=a.data);let l=e.get(a);l&&(n.deleteBuffer(l.buffer),e.delete(a))}function o(a,l){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){let u=e.get(a);(!u||u.version<a.version)&&e.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}let c=e.get(a);if(c===void 0)e.set(a,t(a,l));else if(c.version<a.version){if(c.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(c.buffer,a,l),c.version=a.version}}return{get:s,remove:r,update:o}}var zm=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Hm=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Vm=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Gm=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Wm=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,$m=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Xm=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,qm=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,jm=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,Ym=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Zm=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Jm=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Km=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,Qm=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,eg=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,tg=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,ng=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,ig=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,sg=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,rg=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,og=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,ag=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,lg=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,cg=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,ug=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,hg=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,dg=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,fg=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,pg=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,mg=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,gg="gl_FragColor = linearToOutputTexel( gl_FragColor );",_g=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,yg=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,vg=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,xg=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,bg=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Sg=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Mg=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Eg=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,wg=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Tg=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Ag=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Rg=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Cg=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Ig=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Pg=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,Lg=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,Dg=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Ng=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Ug=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Og=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Fg=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Bg=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,kg=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,zg=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Hg=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Vg=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Gg=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Wg=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,$g=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Xg=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,qg=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,jg=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Yg=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Zg=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Jg=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Kg=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Qg=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,e_=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,t_=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,n_=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,i_=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,s_=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,r_=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,o_=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,a_=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,l_=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,c_=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,u_=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,h_=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,d_=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,f_=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,p_=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,m_=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,g_=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,__=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,y_=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,v_=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,x_=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,b_=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		float depth = unpackRGBAToDepth( texture2D( depths, uv ) );
		#ifdef USE_REVERSED_DEPTH_BUFFER
			return step( depth, compare );
		#else
			return step( compare, depth );
		#endif
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow( sampler2D shadow, vec2 uv, float compare ) {
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		#ifdef USE_REVERSED_DEPTH_BUFFER
			float hard_shadow = step( distribution.x, compare );
		#else
			float hard_shadow = step( compare, distribution.x );
		#endif
		if ( hard_shadow != 1.0 ) {
			float distance = compare - distribution.x;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,S_=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,M_=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,E_=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,w_=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,T_=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,A_=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,R_=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,C_=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,I_=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,P_=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,L_=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,D_=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,N_=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,U_=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,O_=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,F_=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,B_=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,k_=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,z_=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,H_=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,V_=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,G_=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,W_=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,$_=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,X_=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,q_=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,j_=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,Y_=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Z_=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,J_=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,K_=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Q_=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,ey=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,ty=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,ny=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,iy=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,sy=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,ry=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,oy=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,ay=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,ly=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,cy=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,uy=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,hy=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,dy=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,fy=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,py=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,my=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,gy=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,_y=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,yy=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,$e={alphahash_fragment:zm,alphahash_pars_fragment:Hm,alphamap_fragment:Vm,alphamap_pars_fragment:Gm,alphatest_fragment:Wm,alphatest_pars_fragment:$m,aomap_fragment:Xm,aomap_pars_fragment:qm,batching_pars_vertex:jm,batching_vertex:Ym,begin_vertex:Zm,beginnormal_vertex:Jm,bsdfs:Km,iridescence_fragment:Qm,bumpmap_pars_fragment:eg,clipping_planes_fragment:tg,clipping_planes_pars_fragment:ng,clipping_planes_pars_vertex:ig,clipping_planes_vertex:sg,color_fragment:rg,color_pars_fragment:og,color_pars_vertex:ag,color_vertex:lg,common:cg,cube_uv_reflection_fragment:ug,defaultnormal_vertex:hg,displacementmap_pars_vertex:dg,displacementmap_vertex:fg,emissivemap_fragment:pg,emissivemap_pars_fragment:mg,colorspace_fragment:gg,colorspace_pars_fragment:_g,envmap_fragment:yg,envmap_common_pars_fragment:vg,envmap_pars_fragment:xg,envmap_pars_vertex:bg,envmap_physical_pars_fragment:Lg,envmap_vertex:Sg,fog_vertex:Mg,fog_pars_vertex:Eg,fog_fragment:wg,fog_pars_fragment:Tg,gradientmap_pars_fragment:Ag,lightmap_pars_fragment:Rg,lights_lambert_fragment:Cg,lights_lambert_pars_fragment:Ig,lights_pars_begin:Pg,lights_toon_fragment:Dg,lights_toon_pars_fragment:Ng,lights_phong_fragment:Ug,lights_phong_pars_fragment:Og,lights_physical_fragment:Fg,lights_physical_pars_fragment:Bg,lights_fragment_begin:kg,lights_fragment_maps:zg,lights_fragment_end:Hg,logdepthbuf_fragment:Vg,logdepthbuf_pars_fragment:Gg,logdepthbuf_pars_vertex:Wg,logdepthbuf_vertex:$g,map_fragment:Xg,map_pars_fragment:qg,map_particle_fragment:jg,map_particle_pars_fragment:Yg,metalnessmap_fragment:Zg,metalnessmap_pars_fragment:Jg,morphinstance_vertex:Kg,morphcolor_vertex:Qg,morphnormal_vertex:e_,morphtarget_pars_vertex:t_,morphtarget_vertex:n_,normal_fragment_begin:i_,normal_fragment_maps:s_,normal_pars_fragment:r_,normal_pars_vertex:o_,normal_vertex:a_,normalmap_pars_fragment:l_,clearcoat_normal_fragment_begin:c_,clearcoat_normal_fragment_maps:u_,clearcoat_pars_fragment:h_,iridescence_pars_fragment:d_,opaque_fragment:f_,packing:p_,premultiplied_alpha_fragment:m_,project_vertex:g_,dithering_fragment:__,dithering_pars_fragment:y_,roughnessmap_fragment:v_,roughnessmap_pars_fragment:x_,shadowmap_pars_fragment:b_,shadowmap_pars_vertex:S_,shadowmap_vertex:M_,shadowmask_pars_fragment:E_,skinbase_vertex:w_,skinning_pars_vertex:T_,skinning_vertex:A_,skinnormal_vertex:R_,specularmap_fragment:C_,specularmap_pars_fragment:I_,tonemapping_fragment:P_,tonemapping_pars_fragment:L_,transmission_fragment:D_,transmission_pars_fragment:N_,uv_pars_fragment:U_,uv_pars_vertex:O_,uv_vertex:F_,worldpos_vertex:B_,background_vert:k_,background_frag:z_,backgroundCube_vert:H_,backgroundCube_frag:V_,cube_vert:G_,cube_frag:W_,depth_vert:$_,depth_frag:X_,distanceRGBA_vert:q_,distanceRGBA_frag:j_,equirect_vert:Y_,equirect_frag:Z_,linedashed_vert:J_,linedashed_frag:K_,meshbasic_vert:Q_,meshbasic_frag:ey,meshlambert_vert:ty,meshlambert_frag:ny,meshmatcap_vert:iy,meshmatcap_frag:sy,meshnormal_vert:ry,meshnormal_frag:oy,meshphong_vert:ay,meshphong_frag:ly,meshphysical_vert:cy,meshphysical_frag:uy,meshtoon_vert:hy,meshtoon_frag:dy,points_vert:fy,points_frag:py,shadow_vert:my,shadow_frag:gy,sprite_vert:_y,sprite_frag:yy},ae={common:{diffuse:{value:new De(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new ze},alphaMap:{value:null},alphaMapTransform:{value:new ze},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new ze}},envmap:{envMap:{value:null},envMapRotation:{value:new ze},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new ze}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new ze}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new ze},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new ze},normalScale:{value:new re(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new ze},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new ze}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new ze}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new ze}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new De(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new De(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new ze},alphaTest:{value:0},uvTransform:{value:new ze}},sprite:{diffuse:{value:new De(16777215)},opacity:{value:1},center:{value:new re(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new ze},alphaMap:{value:null},alphaMapTransform:{value:new ze},alphaTest:{value:0}}},Bn={basic:{uniforms:kt([ae.common,ae.specularmap,ae.envmap,ae.aomap,ae.lightmap,ae.fog]),vertexShader:$e.meshbasic_vert,fragmentShader:$e.meshbasic_frag},lambert:{uniforms:kt([ae.common,ae.specularmap,ae.envmap,ae.aomap,ae.lightmap,ae.emissivemap,ae.bumpmap,ae.normalmap,ae.displacementmap,ae.fog,ae.lights,{emissive:{value:new De(0)}}]),vertexShader:$e.meshlambert_vert,fragmentShader:$e.meshlambert_frag},phong:{uniforms:kt([ae.common,ae.specularmap,ae.envmap,ae.aomap,ae.lightmap,ae.emissivemap,ae.bumpmap,ae.normalmap,ae.displacementmap,ae.fog,ae.lights,{emissive:{value:new De(0)},specular:{value:new De(1118481)},shininess:{value:30}}]),vertexShader:$e.meshphong_vert,fragmentShader:$e.meshphong_frag},standard:{uniforms:kt([ae.common,ae.envmap,ae.aomap,ae.lightmap,ae.emissivemap,ae.bumpmap,ae.normalmap,ae.displacementmap,ae.roughnessmap,ae.metalnessmap,ae.fog,ae.lights,{emissive:{value:new De(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:$e.meshphysical_vert,fragmentShader:$e.meshphysical_frag},toon:{uniforms:kt([ae.common,ae.aomap,ae.lightmap,ae.emissivemap,ae.bumpmap,ae.normalmap,ae.displacementmap,ae.gradientmap,ae.fog,ae.lights,{emissive:{value:new De(0)}}]),vertexShader:$e.meshtoon_vert,fragmentShader:$e.meshtoon_frag},matcap:{uniforms:kt([ae.common,ae.bumpmap,ae.normalmap,ae.displacementmap,ae.fog,{matcap:{value:null}}]),vertexShader:$e.meshmatcap_vert,fragmentShader:$e.meshmatcap_frag},points:{uniforms:kt([ae.points,ae.fog]),vertexShader:$e.points_vert,fragmentShader:$e.points_frag},dashed:{uniforms:kt([ae.common,ae.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:$e.linedashed_vert,fragmentShader:$e.linedashed_frag},depth:{uniforms:kt([ae.common,ae.displacementmap]),vertexShader:$e.depth_vert,fragmentShader:$e.depth_frag},normal:{uniforms:kt([ae.common,ae.bumpmap,ae.normalmap,ae.displacementmap,{opacity:{value:1}}]),vertexShader:$e.meshnormal_vert,fragmentShader:$e.meshnormal_frag},sprite:{uniforms:kt([ae.sprite,ae.fog]),vertexShader:$e.sprite_vert,fragmentShader:$e.sprite_frag},background:{uniforms:{uvTransform:{value:new ze},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:$e.background_vert,fragmentShader:$e.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new ze}},vertexShader:$e.backgroundCube_vert,fragmentShader:$e.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:$e.cube_vert,fragmentShader:$e.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:$e.equirect_vert,fragmentShader:$e.equirect_frag},distanceRGBA:{uniforms:kt([ae.common,ae.displacementmap,{referencePosition:{value:new R},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:$e.distanceRGBA_vert,fragmentShader:$e.distanceRGBA_frag},shadow:{uniforms:kt([ae.lights,ae.fog,{color:{value:new De(0)},opacity:{value:1}}]),vertexShader:$e.shadow_vert,fragmentShader:$e.shadow_frag}};Bn.physical={uniforms:kt([Bn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new ze},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new ze},clearcoatNormalScale:{value:new re(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new ze},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new ze},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new ze},sheen:{value:0},sheenColor:{value:new De(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new ze},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new ze},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new ze},transmissionSamplerSize:{value:new re},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new ze},attenuationDistance:{value:0},attenuationColor:{value:new De(0)},specularColor:{value:new De(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new ze},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new ze},anisotropyVector:{value:new re},anisotropyMap:{value:null},anisotropyMapTransform:{value:new ze}}]),vertexShader:$e.meshphysical_vert,fragmentShader:$e.meshphysical_frag};var vl={r:0,b:0,g:0},Zi=new Mn,vy=new ot;function xy(n,e,t,i,s,r,o){let a=new De(0),l=r===!0?0:1,c,u,d=null,h=0,f=null;function g(E){let b=E.isScene===!0?E.background:null;return b&&b.isTexture&&(b=(E.backgroundBlurriness>0?t:e).get(b)),b}function y(E){let b=!1,I=g(E);I===null?p(a,l):I&&I.isColor&&(p(I,1),b=!0);let A=n.xr.getEnvironmentBlendMode();A==="additive"?i.buffers.color.setClear(0,0,0,1,o):A==="alpha-blend"&&i.buffers.color.setClear(0,0,0,0,o),(n.autoClear||b)&&(i.buffers.depth.setTest(!0),i.buffers.depth.setMask(!0),i.buffers.color.setMask(!0),n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil))}function m(E,b){let I=g(b);I&&(I.isCubeTexture||I.mapping===eo)?(u===void 0&&(u=new Je(new Jn(1,1,1),new En({name:"BackgroundCubeMaterial",uniforms:Yi(Bn.backgroundCube.uniforms),vertexShader:Bn.backgroundCube.vertexShader,fragmentShader:Bn.backgroundCube.fragmentShader,side:Wt,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),u.geometry.deleteAttribute("normal"),u.geometry.deleteAttribute("uv"),u.onBeforeRender=function(A,P,N){this.matrixWorld.copyPosition(N.matrixWorld)},Object.defineProperty(u.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(u)),Zi.copy(b.backgroundRotation),Zi.x*=-1,Zi.y*=-1,Zi.z*=-1,I.isCubeTexture&&I.isRenderTargetTexture===!1&&(Zi.y*=-1,Zi.z*=-1),u.material.uniforms.envMap.value=I,u.material.uniforms.flipEnvMap.value=I.isCubeTexture&&I.isRenderTargetTexture===!1?-1:1,u.material.uniforms.backgroundBlurriness.value=b.backgroundBlurriness,u.material.uniforms.backgroundIntensity.value=b.backgroundIntensity,u.material.uniforms.backgroundRotation.value.setFromMatrix4(vy.makeRotationFromEuler(Zi)),u.material.toneMapped=Ze.getTransfer(I.colorSpace)!==st,(d!==I||h!==I.version||f!==n.toneMapping)&&(u.material.needsUpdate=!0,d=I,h=I.version,f=n.toneMapping),u.layers.enableAll(),E.unshift(u,u.geometry,u.material,0,0,null)):I&&I.isTexture&&(c===void 0&&(c=new Je(new Kn(2,2),new En({name:"BackgroundMaterial",uniforms:Yi(Bn.background.uniforms),vertexShader:Bn.background.vertexShader,fragmentShader:Bn.background.fragmentShader,side:Zn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(c)),c.material.uniforms.t2D.value=I,c.material.uniforms.backgroundIntensity.value=b.backgroundIntensity,c.material.toneMapped=Ze.getTransfer(I.colorSpace)!==st,I.matrixAutoUpdate===!0&&I.updateMatrix(),c.material.uniforms.uvTransform.value.copy(I.matrix),(d!==I||h!==I.version||f!==n.toneMapping)&&(c.material.needsUpdate=!0,d=I,h=I.version,f=n.toneMapping),c.layers.enableAll(),E.unshift(c,c.geometry,c.material,0,0,null))}function p(E,b){E.getRGB(vl,iu(n)),i.buffers.color.setClear(vl.r,vl.g,vl.b,b,o)}function w(){u!==void 0&&(u.geometry.dispose(),u.material.dispose(),u=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return a},setClearColor:function(E,b=1){a.set(E),l=b,p(a,l)},getClearAlpha:function(){return l},setClearAlpha:function(E){l=E,p(a,l)},render:y,addToRenderList:m,dispose:w}}function by(n,e){let t=n.getParameter(n.MAX_VERTEX_ATTRIBS),i={},s=h(null),r=s,o=!1;function a(S,D,B,H,W){let q=!1,$=d(H,B,D);r!==$&&(r=$,c(r.object)),q=f(S,H,B,W),q&&g(S,H,B,W),W!==null&&e.update(W,n.ELEMENT_ARRAY_BUFFER),(q||o)&&(o=!1,b(S,D,B,H),W!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,e.get(W).buffer))}function l(){return n.createVertexArray()}function c(S){return n.bindVertexArray(S)}function u(S){return n.deleteVertexArray(S)}function d(S,D,B){let H=B.wireframe===!0,W=i[S.id];W===void 0&&(W={},i[S.id]=W);let q=W[D.id];q===void 0&&(q={},W[D.id]=q);let $=q[H];return $===void 0&&($=h(l()),q[H]=$),$}function h(S){let D=[],B=[],H=[];for(let W=0;W<t;W++)D[W]=0,B[W]=0,H[W]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:D,enabledAttributes:B,attributeDivisors:H,object:S,attributes:{},index:null}}function f(S,D,B,H){let W=r.attributes,q=D.attributes,$=0,ne=B.getAttributes();for(let V in ne)if(ne[V].location>=0){let de=W[V],Te=q[V];if(Te===void 0&&(V==="instanceMatrix"&&S.instanceMatrix&&(Te=S.instanceMatrix),V==="instanceColor"&&S.instanceColor&&(Te=S.instanceColor)),de===void 0||de.attribute!==Te||Te&&de.data!==Te.data)return!0;$++}return r.attributesNum!==$||r.index!==H}function g(S,D,B,H){let W={},q=D.attributes,$=0,ne=B.getAttributes();for(let V in ne)if(ne[V].location>=0){let de=q[V];de===void 0&&(V==="instanceMatrix"&&S.instanceMatrix&&(de=S.instanceMatrix),V==="instanceColor"&&S.instanceColor&&(de=S.instanceColor));let Te={};Te.attribute=de,de&&de.data&&(Te.data=de.data),W[V]=Te,$++}r.attributes=W,r.attributesNum=$,r.index=H}function y(){let S=r.newAttributes;for(let D=0,B=S.length;D<B;D++)S[D]=0}function m(S){p(S,0)}function p(S,D){let B=r.newAttributes,H=r.enabledAttributes,W=r.attributeDivisors;B[S]=1,H[S]===0&&(n.enableVertexAttribArray(S),H[S]=1),W[S]!==D&&(n.vertexAttribDivisor(S,D),W[S]=D)}function w(){let S=r.newAttributes,D=r.enabledAttributes;for(let B=0,H=D.length;B<H;B++)D[B]!==S[B]&&(n.disableVertexAttribArray(B),D[B]=0)}function E(S,D,B,H,W,q,$){$===!0?n.vertexAttribIPointer(S,D,B,W,q):n.vertexAttribPointer(S,D,B,H,W,q)}function b(S,D,B,H){y();let W=H.attributes,q=B.getAttributes(),$=D.defaultAttributeValues;for(let ne in q){let V=q[ne];if(V.location>=0){let le=W[ne];if(le===void 0&&(ne==="instanceMatrix"&&S.instanceMatrix&&(le=S.instanceMatrix),ne==="instanceColor"&&S.instanceColor&&(le=S.instanceColor)),le!==void 0){let de=le.normalized,Te=le.itemSize,Xe=e.get(le);if(Xe===void 0)continue;let ct=Xe.buffer,ft=Xe.type,tt=Xe.bytesPerElement,j=ft===n.INT||ft===n.UNSIGNED_INT||le.gpuType===Ba;if(le.isInterleavedBufferAttribute){let J=le.data,ge=J.stride,Oe=le.offset;if(J.isInstancedInterleavedBuffer){for(let we=0;we<V.locationSize;we++)p(V.location+we,J.meshPerAttribute);S.isInstancedMesh!==!0&&H._maxInstanceCount===void 0&&(H._maxInstanceCount=J.meshPerAttribute*J.count)}else for(let we=0;we<V.locationSize;we++)m(V.location+we);n.bindBuffer(n.ARRAY_BUFFER,ct);for(let we=0;we<V.locationSize;we++)E(V.location+we,Te/V.locationSize,ft,de,ge*tt,(Oe+Te/V.locationSize*we)*tt,j)}else{if(le.isInstancedBufferAttribute){for(let J=0;J<V.locationSize;J++)p(V.location+J,le.meshPerAttribute);S.isInstancedMesh!==!0&&H._maxInstanceCount===void 0&&(H._maxInstanceCount=le.meshPerAttribute*le.count)}else for(let J=0;J<V.locationSize;J++)m(V.location+J);n.bindBuffer(n.ARRAY_BUFFER,ct);for(let J=0;J<V.locationSize;J++)E(V.location+J,Te/V.locationSize,ft,de,Te*tt,Te/V.locationSize*J*tt,j)}}else if($!==void 0){let de=$[ne];if(de!==void 0)switch(de.length){case 2:n.vertexAttrib2fv(V.location,de);break;case 3:n.vertexAttrib3fv(V.location,de);break;case 4:n.vertexAttrib4fv(V.location,de);break;default:n.vertexAttrib1fv(V.location,de)}}}}w()}function I(){N();for(let S in i){let D=i[S];for(let B in D){let H=D[B];for(let W in H)u(H[W].object),delete H[W];delete D[B]}delete i[S]}}function A(S){if(i[S.id]===void 0)return;let D=i[S.id];for(let B in D){let H=D[B];for(let W in H)u(H[W].object),delete H[W];delete D[B]}delete i[S.id]}function P(S){for(let D in i){let B=i[D];if(B[S.id]===void 0)continue;let H=B[S.id];for(let W in H)u(H[W].object),delete H[W];delete B[S.id]}}function N(){M(),o=!0,r!==s&&(r=s,c(r.object))}function M(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:a,reset:N,resetDefaultState:M,dispose:I,releaseStatesOfGeometry:A,releaseStatesOfProgram:P,initAttributes:y,enableAttribute:m,disableUnusedAttributes:w}}function Sy(n,e,t){let i;function s(c){i=c}function r(c,u){n.drawArrays(i,c,u),t.update(u,i,1)}function o(c,u,d){d!==0&&(n.drawArraysInstanced(i,c,u,d),t.update(u,i,d))}function a(c,u,d){if(d===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,c,0,u,0,d);let f=0;for(let g=0;g<d;g++)f+=u[g];t.update(f,i,1)}function l(c,u,d,h){if(d===0)return;let f=e.get("WEBGL_multi_draw");if(f===null)for(let g=0;g<c.length;g++)o(c[g],u[g],h[g]);else{f.multiDrawArraysInstancedWEBGL(i,c,0,u,0,h,0,d);let g=0;for(let y=0;y<d;y++)g+=u[y]*h[y];t.update(g,i,1)}}this.setMode=s,this.render=r,this.renderInstances=o,this.renderMultiDraw=a,this.renderMultiDrawInstances=l}function My(n,e,t,i){let s;function r(){if(s!==void 0)return s;if(e.has("EXT_texture_filter_anisotropic")===!0){let P=e.get("EXT_texture_filter_anisotropic");s=n.getParameter(P.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function o(P){return!(P!==gn&&i.convert(P)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(P){let N=P===Bs&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(P!==wn&&i.convert(P)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_TYPE)&&P!==Tn&&!N)}function l(P){if(P==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";P="mediump"}return P==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp",u=l(c);u!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",u,"instead."),c=u);let d=t.logarithmicDepthBuffer===!0,h=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control"),f=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),g=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),y=n.getParameter(n.MAX_TEXTURE_SIZE),m=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),p=n.getParameter(n.MAX_VERTEX_ATTRIBS),w=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),E=n.getParameter(n.MAX_VARYING_VECTORS),b=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),I=g>0,A=n.getParameter(n.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:o,textureTypeReadable:a,precision:c,logarithmicDepthBuffer:d,reversedDepthBuffer:h,maxTextures:f,maxVertexTextures:g,maxTextureSize:y,maxCubemapSize:m,maxAttributes:p,maxVertexUniforms:w,maxVaryings:E,maxFragmentUniforms:b,vertexTextures:I,maxSamples:A}}function Ey(n){let e=this,t=null,i=0,s=!1,r=!1,o=new fn,a=new ze,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(d,h){let f=d.length!==0||h||i!==0||s;return s=h,i=d.length,f},this.beginShadows=function(){r=!0,u(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(d,h){t=u(d,h,0)},this.setState=function(d,h,f){let g=d.clippingPlanes,y=d.clipIntersection,m=d.clipShadows,p=n.get(d);if(!s||g===null||g.length===0||r&&!m)r?u(null):c();else{let w=r?0:i,E=w*4,b=p.clippingState||null;l.value=b,b=u(g,h,E,f);for(let I=0;I!==E;++I)b[I]=t[I];p.clippingState=b,this.numIntersection=y?this.numPlanes:0,this.numPlanes+=w}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=i>0),e.numPlanes=i,e.numIntersection=0}function u(d,h,f,g){let y=d!==null?d.length:0,m=null;if(y!==0){if(m=l.value,g!==!0||m===null){let p=f+y*4,w=h.matrixWorldInverse;a.getNormalMatrix(w),(m===null||m.length<p)&&(m=new Float32Array(p));for(let E=0,b=f;E!==y;++E,b+=4)o.copy(d[E]).applyMatrix4(w,a),o.normal.toArray(m,b),m[b+3]=o.constant}l.value=m,l.needsUpdate=!0}return e.numPlanes=y,e.numIntersection=0,m}}function wy(n){let e=new WeakMap;function t(o,a){return a===Ua?o.mapping=Xi:a===Oa&&(o.mapping=qi),o}function i(o){if(o&&o.isTexture){let a=o.mapping;if(a===Ua||a===Oa)if(e.has(o)){let l=e.get(o).texture;return t(l,o.mapping)}else{let l=o.image;if(l&&l.height>0){let c=new ta(l.height);return c.fromEquirectangularTexture(n,o),e.set(o,c),o.addEventListener("dispose",s),t(c.texture,o.mapping)}else return null}}return o}function s(o){let a=o.target;a.removeEventListener("dispose",s);let l=e.get(a);l!==void 0&&(e.delete(a),l.dispose())}function r(){e=new WeakMap}return{get:i,dispose:r}}var Gs=4,Vd=[.125,.215,.35,.446,.526,.582],Qi=20,lu=new jr,Gd=new De,cu=null,uu=0,hu=0,du=!1,Ki=(1+Math.sqrt(5))/2,Vs=1/Ki,Wd=[new R(-Ki,Vs,0),new R(Ki,Vs,0),new R(-Vs,0,Ki),new R(Vs,0,Ki),new R(0,Ki,-Vs),new R(0,Ki,Vs),new R(-1,1,-1),new R(1,1,-1),new R(-1,1,1),new R(1,1,1)],Ty=new R,Sl=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,i=.1,s=100,r={}){let{size:o=256,position:a=Ty}=r;cu=this._renderer.getRenderTarget(),uu=this._renderer.getActiveCubeFace(),hu=this._renderer.getActiveMipmapLevel(),du=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(o);let l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(e,i,s,l,a),t>0&&this._blur(l,0,0,t),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=qd(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Xd(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(cu,uu,hu),this._renderer.xr.enabled=du,e.scissorTest=!1,xl(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===Xi||e.mapping===qi?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),cu=this._renderer.getRenderTarget(),uu=this._renderer.getActiveCubeFace(),hu=this._renderer.getActiveMipmapLevel(),du=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let i=t||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:Sn,minFilter:Sn,generateMipmaps:!1,type:Bs,format:gn,colorSpace:Gi,depthBuffer:!1},s=$d(e,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=$d(e,t,i);let{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=Ay(r)),this._blurMaterial=Ry(r,e,t)}return s}_compileMaterial(e){let t=new Je(this._lodPlanes[0],e);this._renderer.compile(t,lu)}_sceneToCubeUV(e,t,i,s,r){let l=new Nt(90,1,t,i),c=[1,-1,1,1,1,1],u=[1,1,1,-1,-1,-1],d=this._renderer,h=d.autoClear,f=d.toneMapping;d.getClearColor(Gd),d.toneMapping=ei,d.autoClear=!1,d.state.buffers.depth.getReversed()&&(d.setRenderTarget(s),d.clearDepth(),d.setRenderTarget(null));let y=new Nn({name:"PMREM.Background",side:Wt,depthWrite:!1,depthTest:!1}),m=new Je(new Jn,y),p=!1,w=e.background;w?w.isColor&&(y.color.copy(w),e.background=null,p=!0):(y.color.copy(Gd),p=!0);for(let E=0;E<6;E++){let b=E%3;b===0?(l.up.set(0,c[E],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x+u[E],r.y,r.z)):b===1?(l.up.set(0,0,c[E]),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y+u[E],r.z)):(l.up.set(0,c[E],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y,r.z+u[E]));let I=this._cubeSize;xl(s,b*I,E>2?I:0,I,I),d.setRenderTarget(s),p&&d.render(m,l),d.render(e,l)}m.geometry.dispose(),m.material.dispose(),d.toneMapping=f,d.autoClear=h,e.background=w}_textureToCubeUV(e,t){let i=this._renderer,s=e.mapping===Xi||e.mapping===qi;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=qd()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Xd());let r=s?this._cubemapMaterial:this._equirectMaterial,o=new Je(this._lodPlanes[0],r),a=r.uniforms;a.envMap.value=e;let l=this._cubeSize;xl(t,0,0,3*l,2*l),i.setRenderTarget(t),i.render(o,lu)}_applyPMREM(e){let t=this._renderer,i=t.autoClear;t.autoClear=!1;let s=this._lodPlanes.length;for(let r=1;r<s;r++){let o=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),a=Wd[(s-r-1)%Wd.length];this._blur(e,r-1,r,o,a)}t.autoClear=i}_blur(e,t,i,s,r){let o=this._pingPongRenderTarget;this._halfBlur(e,o,t,i,s,"latitudinal",r),this._halfBlur(o,e,i,i,s,"longitudinal",r)}_halfBlur(e,t,i,s,r,o,a){let l=this._renderer,c=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");let u=3,d=new Je(this._lodPlanes[s],c),h=c.uniforms,f=this._sizeLods[i]-1,g=isFinite(r)?Math.PI/(2*f):2*Math.PI/(2*Qi-1),y=r/g,m=isFinite(r)?1+Math.floor(u*y):Qi;m>Qi&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${Qi}`);let p=[],w=0;for(let P=0;P<Qi;++P){let N=P/y,M=Math.exp(-N*N/2);p.push(M),P===0?w+=M:P<m&&(w+=2*M)}for(let P=0;P<p.length;P++)p[P]=p[P]/w;h.envMap.value=e.texture,h.samples.value=m,h.weights.value=p,h.latitudinal.value=o==="latitudinal",a&&(h.poleAxis.value=a);let{_lodMax:E}=this;h.dTheta.value=g,h.mipInt.value=E-i;let b=this._sizeLods[s],I=3*b*(s>E-Gs?s-E+Gs:0),A=4*(this._cubeSize-b);xl(t,I,A,3*b,2*b),l.setRenderTarget(t),l.render(d,lu)}};function Ay(n){let e=[],t=[],i=[],s=n,r=n-Gs+1+Vd.length;for(let o=0;o<r;o++){let a=Math.pow(2,s);t.push(a);let l=1/a;o>n-Gs?l=Vd[o-n+Gs-1]:o===0&&(l=0),i.push(l);let c=1/(a-2),u=-c,d=1+c,h=[u,u,d,u,d,d,u,u,d,d,u,d],f=6,g=6,y=3,m=2,p=1,w=new Float32Array(y*g*f),E=new Float32Array(m*g*f),b=new Float32Array(p*g*f);for(let A=0;A<f;A++){let P=A%3*2/3-1,N=A>2?0:-1,M=[P,N,0,P+2/3,N,0,P+2/3,N+1,0,P,N,0,P+2/3,N+1,0,P,N+1,0];w.set(M,y*g*A),E.set(h,m*g*A);let S=[A,A,A,A,A,A];b.set(S,p*g*A)}let I=new wt;I.setAttribute("position",new Ut(w,y)),I.setAttribute("uv",new Ut(E,m)),I.setAttribute("faceIndex",new Ut(b,p)),e.push(I),s>Gs&&s--}return{lodPlanes:e,sizeLods:t,sigmas:i}}function $d(n,e,t){let i=new In(n,e,t);return i.texture.mapping=eo,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function xl(n,e,t,i,s){n.viewport.set(e,t,i,s),n.scissor.set(e,t,i,s)}function Ry(n,e,t){let i=new Float32Array(Qi),s=new R(0,1,0);return new En({name:"SphericalGaussianBlur",defines:{n:Qi,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:Su(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:Qn,depthTest:!1,depthWrite:!1})}function Xd(){return new En({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Su(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:Qn,depthTest:!1,depthWrite:!1})}function qd(){return new En({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Su(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Qn,depthTest:!1,depthWrite:!1})}function Su(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function Cy(n){let e=new WeakMap,t=null;function i(a){if(a&&a.isTexture){let l=a.mapping,c=l===Ua||l===Oa,u=l===Xi||l===qi;if(c||u){let d=e.get(a),h=d!==void 0?d.texture.pmremVersion:0;if(a.isRenderTargetTexture&&a.pmremVersion!==h)return t===null&&(t=new Sl(n)),d=c?t.fromEquirectangular(a,d):t.fromCubemap(a,d),d.texture.pmremVersion=a.pmremVersion,e.set(a,d),d.texture;if(d!==void 0)return d.texture;{let f=a.image;return c&&f&&f.height>0||u&&f&&s(f)?(t===null&&(t=new Sl(n)),d=c?t.fromEquirectangular(a):t.fromCubemap(a),d.texture.pmremVersion=a.pmremVersion,e.set(a,d),a.addEventListener("dispose",r),d.texture):null}}}return a}function s(a){let l=0,c=6;for(let u=0;u<c;u++)a[u]!==void 0&&l++;return l===c}function r(a){let l=a.target;l.removeEventListener("dispose",r);let c=e.get(l);c!==void 0&&(e.delete(l),c.dispose())}function o(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:i,dispose:o}}function Iy(n){let e={};function t(i){if(e[i]!==void 0)return e[i];let s;switch(i){case"WEBGL_depth_texture":s=n.getExtension("WEBGL_depth_texture")||n.getExtension("MOZ_WEBGL_depth_texture")||n.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=n.getExtension("EXT_texture_filter_anisotropic")||n.getExtension("MOZ_EXT_texture_filter_anisotropic")||n.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=n.getExtension("WEBGL_compressed_texture_s3tc")||n.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=n.getExtension("WEBGL_compressed_texture_pvrtc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=n.getExtension(i)}return e[i]=s,s}return{has:function(i){return t(i)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(i){let s=t(i);return s===null&&ws("THREE.WebGLRenderer: "+i+" extension not supported."),s}}}function Py(n,e,t,i){let s={},r=new WeakMap;function o(d){let h=d.target;h.index!==null&&e.remove(h.index);for(let g in h.attributes)e.remove(h.attributes[g]);h.removeEventListener("dispose",o),delete s[h.id];let f=r.get(h);f&&(e.remove(f),r.delete(h)),i.releaseStatesOfGeometry(h),h.isInstancedBufferGeometry===!0&&delete h._maxInstanceCount,t.memory.geometries--}function a(d,h){return s[h.id]===!0||(h.addEventListener("dispose",o),s[h.id]=!0,t.memory.geometries++),h}function l(d){let h=d.attributes;for(let f in h)e.update(h[f],n.ARRAY_BUFFER)}function c(d){let h=[],f=d.index,g=d.attributes.position,y=0;if(f!==null){let w=f.array;y=f.version;for(let E=0,b=w.length;E<b;E+=3){let I=w[E+0],A=w[E+1],P=w[E+2];h.push(I,A,A,P,P,I)}}else if(g!==void 0){let w=g.array;y=g.version;for(let E=0,b=w.length/3-1;E<b;E+=3){let I=E+0,A=E+1,P=E+2;h.push(I,A,A,P,P,I)}}else return;let m=new(nu(h)?Pr:Ir)(h,1);m.version=y;let p=r.get(d);p&&e.remove(p),r.set(d,m)}function u(d){let h=r.get(d);if(h){let f=d.index;f!==null&&h.version<f.version&&c(d)}else c(d);return r.get(d)}return{get:a,update:l,getWireframeAttribute:u}}function Ly(n,e,t){let i;function s(h){i=h}let r,o;function a(h){r=h.type,o=h.bytesPerElement}function l(h,f){n.drawElements(i,f,r,h*o),t.update(f,i,1)}function c(h,f,g){g!==0&&(n.drawElementsInstanced(i,f,r,h*o,g),t.update(f,i,g))}function u(h,f,g){if(g===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,f,0,r,h,0,g);let m=0;for(let p=0;p<g;p++)m+=f[p];t.update(m,i,1)}function d(h,f,g,y){if(g===0)return;let m=e.get("WEBGL_multi_draw");if(m===null)for(let p=0;p<h.length;p++)c(h[p]/o,f[p],y[p]);else{m.multiDrawElementsInstancedWEBGL(i,f,0,r,h,0,y,0,g);let p=0;for(let w=0;w<g;w++)p+=f[w]*y[w];t.update(p,i,1)}}this.setMode=s,this.setIndex=a,this.render=l,this.renderInstances=c,this.renderMultiDraw=u,this.renderMultiDrawInstances=d}function Dy(n){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function i(r,o,a){switch(t.calls++,o){case n.TRIANGLES:t.triangles+=a*(r/3);break;case n.LINES:t.lines+=a*(r/2);break;case n.LINE_STRIP:t.lines+=a*(r-1);break;case n.LINE_LOOP:t.lines+=a*r;break;case n.POINTS:t.points+=a*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function s(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:s,update:i}}function Ny(n,e,t){let i=new WeakMap,s=new it;function r(o,a,l){let c=o.morphTargetInfluences,u=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,d=u!==void 0?u.length:0,h=i.get(a);if(h===void 0||h.count!==d){let M=function(){P.dispose(),i.delete(a),a.removeEventListener("dispose",M)};h!==void 0&&h.texture.dispose();let f=a.morphAttributes.position!==void 0,g=a.morphAttributes.normal!==void 0,y=a.morphAttributes.color!==void 0,m=a.morphAttributes.position||[],p=a.morphAttributes.normal||[],w=a.morphAttributes.color||[],E=0;f===!0&&(E=1),g===!0&&(E=2),y===!0&&(E=3);let b=a.attributes.position.count*E,I=1;b>e.maxTextureSize&&(I=Math.ceil(b/e.maxTextureSize),b=e.maxTextureSize);let A=new Float32Array(b*I*4*d),P=new Rr(A,b,I,d);P.type=Tn,P.needsUpdate=!0;let N=E*4;for(let S=0;S<d;S++){let D=m[S],B=p[S],H=w[S],W=b*I*4*S;for(let q=0;q<D.count;q++){let $=q*N;f===!0&&(s.fromBufferAttribute(D,q),A[W+$+0]=s.x,A[W+$+1]=s.y,A[W+$+2]=s.z,A[W+$+3]=0),g===!0&&(s.fromBufferAttribute(B,q),A[W+$+4]=s.x,A[W+$+5]=s.y,A[W+$+6]=s.z,A[W+$+7]=0),y===!0&&(s.fromBufferAttribute(H,q),A[W+$+8]=s.x,A[W+$+9]=s.y,A[W+$+10]=s.z,A[W+$+11]=H.itemSize===4?s.w:1)}}h={count:d,texture:P,size:new re(b,I)},i.set(a,h),a.addEventListener("dispose",M)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)l.getUniforms().setValue(n,"morphTexture",o.morphTexture,t);else{let f=0;for(let y=0;y<c.length;y++)f+=c[y];let g=a.morphTargetsRelative?1:1-f;l.getUniforms().setValue(n,"morphTargetBaseInfluence",g),l.getUniforms().setValue(n,"morphTargetInfluences",c)}l.getUniforms().setValue(n,"morphTargetsTexture",h.texture,t),l.getUniforms().setValue(n,"morphTargetsTextureSize",h.size)}return{update:r}}function Uy(n,e,t,i){let s=new WeakMap;function r(l){let c=i.render.frame,u=l.geometry,d=e.get(l,u);if(s.get(d)!==c&&(e.update(d),s.set(d,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",a)===!1&&l.addEventListener("dispose",a),s.get(l)!==c&&(t.update(l.instanceMatrix,n.ARRAY_BUFFER),l.instanceColor!==null&&t.update(l.instanceColor,n.ARRAY_BUFFER),s.set(l,c))),l.isSkinnedMesh){let h=l.skeleton;s.get(h)!==c&&(h.update(),s.set(h,c))}return d}function o(){s=new WeakMap}function a(l){let c=l.target;c.removeEventListener("dispose",a),t.remove(c.instanceMatrix),c.instanceColor!==null&&t.remove(c.instanceColor)}return{update:r,dispose:o}}var ff=new Kt,jd=new zr(1,1),pf=new Rr,mf=new Qo,gf=new Dr,Yd=[],Zd=[],Jd=new Float32Array(16),Kd=new Float32Array(9),Qd=new Float32Array(4);function $s(n,e,t){let i=n[0];if(i<=0||i>0)return n;let s=e*t,r=Yd[s];if(r===void 0&&(r=new Float32Array(s),Yd[s]=r),e!==0){i.toArray(r,0);for(let o=1,a=0;o!==e;++o)a+=t,n[o].toArray(r,a)}return r}function Tt(n,e){if(n.length!==e.length)return!1;for(let t=0,i=n.length;t<i;t++)if(n[t]!==e[t])return!1;return!0}function At(n,e){for(let t=0,i=e.length;t<i;t++)n[t]=e[t]}function El(n,e){let t=Zd[e];t===void 0&&(t=new Int32Array(e),Zd[e]=t);for(let i=0;i!==e;++i)t[i]=n.allocateTextureUnit();return t}function Oy(n,e){let t=this.cache;t[0]!==e&&(n.uniform1f(this.addr,e),t[0]=e)}function Fy(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Tt(t,e))return;n.uniform2fv(this.addr,e),At(t,e)}}function By(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(n.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(Tt(t,e))return;n.uniform3fv(this.addr,e),At(t,e)}}function ky(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Tt(t,e))return;n.uniform4fv(this.addr,e),At(t,e)}}function zy(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(Tt(t,e))return;n.uniformMatrix2fv(this.addr,!1,e),At(t,e)}else{if(Tt(t,i))return;Qd.set(i),n.uniformMatrix2fv(this.addr,!1,Qd),At(t,i)}}function Hy(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(Tt(t,e))return;n.uniformMatrix3fv(this.addr,!1,e),At(t,e)}else{if(Tt(t,i))return;Kd.set(i),n.uniformMatrix3fv(this.addr,!1,Kd),At(t,i)}}function Vy(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(Tt(t,e))return;n.uniformMatrix4fv(this.addr,!1,e),At(t,e)}else{if(Tt(t,i))return;Jd.set(i),n.uniformMatrix4fv(this.addr,!1,Jd),At(t,i)}}function Gy(n,e){let t=this.cache;t[0]!==e&&(n.uniform1i(this.addr,e),t[0]=e)}function Wy(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Tt(t,e))return;n.uniform2iv(this.addr,e),At(t,e)}}function $y(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Tt(t,e))return;n.uniform3iv(this.addr,e),At(t,e)}}function Xy(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Tt(t,e))return;n.uniform4iv(this.addr,e),At(t,e)}}function qy(n,e){let t=this.cache;t[0]!==e&&(n.uniform1ui(this.addr,e),t[0]=e)}function jy(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Tt(t,e))return;n.uniform2uiv(this.addr,e),At(t,e)}}function Yy(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Tt(t,e))return;n.uniform3uiv(this.addr,e),At(t,e)}}function Zy(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Tt(t,e))return;n.uniform4uiv(this.addr,e),At(t,e)}}function Jy(n,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s);let r;this.type===n.SAMPLER_2D_SHADOW?(jd.compareFunction=Qc,r=jd):r=ff,t.setTexture2D(e||r,s)}function Ky(n,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),t.setTexture3D(e||mf,s)}function Qy(n,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),t.setTextureCube(e||gf,s)}function ev(n,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),t.setTexture2DArray(e||pf,s)}function tv(n){switch(n){case 5126:return Oy;case 35664:return Fy;case 35665:return By;case 35666:return ky;case 35674:return zy;case 35675:return Hy;case 35676:return Vy;case 5124:case 35670:return Gy;case 35667:case 35671:return Wy;case 35668:case 35672:return $y;case 35669:case 35673:return Xy;case 5125:return qy;case 36294:return jy;case 36295:return Yy;case 36296:return Zy;case 35678:case 36198:case 36298:case 36306:case 35682:return Jy;case 35679:case 36299:case 36307:return Ky;case 35680:case 36300:case 36308:case 36293:return Qy;case 36289:case 36303:case 36311:case 36292:return ev}}function nv(n,e){n.uniform1fv(this.addr,e)}function iv(n,e){let t=$s(e,this.size,2);n.uniform2fv(this.addr,t)}function sv(n,e){let t=$s(e,this.size,3);n.uniform3fv(this.addr,t)}function rv(n,e){let t=$s(e,this.size,4);n.uniform4fv(this.addr,t)}function ov(n,e){let t=$s(e,this.size,4);n.uniformMatrix2fv(this.addr,!1,t)}function av(n,e){let t=$s(e,this.size,9);n.uniformMatrix3fv(this.addr,!1,t)}function lv(n,e){let t=$s(e,this.size,16);n.uniformMatrix4fv(this.addr,!1,t)}function cv(n,e){n.uniform1iv(this.addr,e)}function uv(n,e){n.uniform2iv(this.addr,e)}function hv(n,e){n.uniform3iv(this.addr,e)}function dv(n,e){n.uniform4iv(this.addr,e)}function fv(n,e){n.uniform1uiv(this.addr,e)}function pv(n,e){n.uniform2uiv(this.addr,e)}function mv(n,e){n.uniform3uiv(this.addr,e)}function gv(n,e){n.uniform4uiv(this.addr,e)}function _v(n,e,t){let i=this.cache,s=e.length,r=El(t,s);Tt(i,r)||(n.uniform1iv(this.addr,r),At(i,r));for(let o=0;o!==s;++o)t.setTexture2D(e[o]||ff,r[o])}function yv(n,e,t){let i=this.cache,s=e.length,r=El(t,s);Tt(i,r)||(n.uniform1iv(this.addr,r),At(i,r));for(let o=0;o!==s;++o)t.setTexture3D(e[o]||mf,r[o])}function vv(n,e,t){let i=this.cache,s=e.length,r=El(t,s);Tt(i,r)||(n.uniform1iv(this.addr,r),At(i,r));for(let o=0;o!==s;++o)t.setTextureCube(e[o]||gf,r[o])}function xv(n,e,t){let i=this.cache,s=e.length,r=El(t,s);Tt(i,r)||(n.uniform1iv(this.addr,r),At(i,r));for(let o=0;o!==s;++o)t.setTexture2DArray(e[o]||pf,r[o])}function bv(n){switch(n){case 5126:return nv;case 35664:return iv;case 35665:return sv;case 35666:return rv;case 35674:return ov;case 35675:return av;case 35676:return lv;case 5124:case 35670:return cv;case 35667:case 35671:return uv;case 35668:case 35672:return hv;case 35669:case 35673:return dv;case 5125:return fv;case 36294:return pv;case 36295:return mv;case 36296:return gv;case 35678:case 36198:case 36298:case 36306:case 35682:return _v;case 35679:case 36299:case 36307:return yv;case 35680:case 36300:case 36308:case 36293:return vv;case 36289:case 36303:case 36311:case 36292:return xv}}var pu=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.setValue=tv(t.type)}},mu=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=bv(t.type)}},gu=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,i){let s=this.seq;for(let r=0,o=s.length;r!==o;++r){let a=s[r];a.setValue(e,t[a.id],i)}}},fu=/(\w+)(\])?(\[|\.)?/g;function ef(n,e){n.seq.push(e),n.map[e.id]=e}function Sv(n,e,t){let i=n.name,s=i.length;for(fu.lastIndex=0;;){let r=fu.exec(i),o=fu.lastIndex,a=r[1],l=r[2]==="]",c=r[3];if(l&&(a=a|0),c===void 0||c==="["&&o+2===s){ef(t,c===void 0?new pu(a,n,e):new mu(a,n,e));break}else{let d=t.map[a];d===void 0&&(d=new gu(a),ef(t,d)),t=d}}}var Ws=class{constructor(e,t){this.seq=[],this.map={};let i=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let s=0;s<i;++s){let r=e.getActiveUniform(t,s),o=e.getUniformLocation(t,r.name);Sv(r,o,this)}}setValue(e,t,i,s){let r=this.map[t];r!==void 0&&r.setValue(e,i,s)}setOptional(e,t,i){let s=t[i];s!==void 0&&this.setValue(e,i,s)}static upload(e,t,i,s){for(let r=0,o=t.length;r!==o;++r){let a=t[r],l=i[a.id];l.needsUpdate!==!1&&a.setValue(e,l.value,s)}}static seqWithValue(e,t){let i=[];for(let s=0,r=e.length;s!==r;++s){let o=e[s];o.id in t&&i.push(o)}return i}};function tf(n,e,t){let i=n.createShader(e);return n.shaderSource(i,t),n.compileShader(i),i}var Mv=37297,Ev=0;function wv(n,e){let t=n.split(`
`),i=[],s=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let o=s;o<r;o++){let a=o+1;i.push(`${a===e?">":" "} ${a}: ${t[o]}`)}return i.join(`
`)}var nf=new ze;function Tv(n){Ze._getMatrix(nf,Ze.workingColorSpace,n);let e=`mat3( ${nf.elements.map(t=>t.toFixed(4))} )`;switch(Ze.getTransfer(n)){case wr:return[e,"LinearTransferOETF"];case st:return[e,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",n),[e,"LinearTransferOETF"]}}function sf(n,e,t){let i=n.getShaderParameter(e,n.COMPILE_STATUS),r=(n.getShaderInfoLog(e)||"").trim();if(i&&r==="")return"";let o=/ERROR: 0:(\d+)/.exec(r);if(o){let a=parseInt(o[1]);return t.toUpperCase()+`

`+r+`

`+wv(n.getShaderSource(e),a)}else return r}function Av(n,e){let t=Tv(e);return[`vec4 ${n}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}function Rv(n,e){let t;switch(e){case xd:t="Linear";break;case bd:t="Reinhard";break;case Sd:t="Cineon";break;case Na:t="ACESFilmic";break;case Ed:t="AgX";break;case wd:t="Neutral";break;case Md:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+n+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var bl=new R;function Cv(){Ze.getLuminanceCoefficients(bl);let n=bl.x.toFixed(4),e=bl.y.toFixed(4),t=bl.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${n}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function Iv(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",n.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(oo).join(`
`)}function Pv(n){let e=[];for(let t in n){let i=n[t];i!==!1&&e.push("#define "+t+" "+i)}return e.join(`
`)}function Lv(n,e){let t={},i=n.getProgramParameter(e,n.ACTIVE_ATTRIBUTES);for(let s=0;s<i;s++){let r=n.getActiveAttrib(e,s),o=r.name,a=1;r.type===n.FLOAT_MAT2&&(a=2),r.type===n.FLOAT_MAT3&&(a=3),r.type===n.FLOAT_MAT4&&(a=4),t[o]={type:r.type,location:n.getAttribLocation(e,o),locationSize:a}}return t}function oo(n){return n!==""}function rf(n,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return n.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function of(n,e){return n.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var Dv=/^[ \t]*#include +<([\w\d./]+)>/gm;function _u(n){return n.replace(Dv,Uv)}var Nv=new Map;function Uv(n,e){let t=$e[e];if(t===void 0){let i=Nv.get(e);if(i!==void 0)t=$e[i],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,i);else throw new Error("Can not resolve #include <"+e+">")}return _u(t)}var Ov=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function af(n){return n.replace(Ov,Fv)}function Fv(n,e,t,i){let s="";for(let r=parseInt(e);r<parseInt(t);r++)s+=i.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function lf(n){let e=`precision ${n.precision} float;
	precision ${n.precision} int;
	precision ${n.precision} sampler2D;
	precision ${n.precision} samplerCube;
	precision ${n.precision} sampler3D;
	precision ${n.precision} sampler2DArray;
	precision ${n.precision} sampler2DShadow;
	precision ${n.precision} samplerCubeShadow;
	precision ${n.precision} sampler2DArrayShadow;
	precision ${n.precision} isampler2D;
	precision ${n.precision} isampler3D;
	precision ${n.precision} isamplerCube;
	precision ${n.precision} isampler2DArray;
	precision ${n.precision} usampler2D;
	precision ${n.precision} usampler3D;
	precision ${n.precision} usamplerCube;
	precision ${n.precision} usampler2DArray;
	`;return n.precision==="highp"?e+=`
#define HIGH_PRECISION`:n.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:n.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function Bv(n){let e="SHADOWMAP_TYPE_BASIC";return n.shadowMapType===zc?e="SHADOWMAP_TYPE_PCF":n.shadowMapType===Qh?e="SHADOWMAP_TYPE_PCF_SOFT":n.shadowMapType===Fn&&(e="SHADOWMAP_TYPE_VSM"),e}function kv(n){let e="ENVMAP_TYPE_CUBE";if(n.envMap)switch(n.envMapMode){case Xi:case qi:e="ENVMAP_TYPE_CUBE";break;case eo:e="ENVMAP_TYPE_CUBE_UV";break}return e}function zv(n){let e="ENVMAP_MODE_REFLECTION";if(n.envMap)switch(n.envMapMode){case qi:e="ENVMAP_MODE_REFRACTION";break}return e}function Hv(n){let e="ENVMAP_BLENDING_NONE";if(n.envMap)switch(n.combine){case Gc:e="ENVMAP_BLENDING_MULTIPLY";break;case yd:e="ENVMAP_BLENDING_MIX";break;case vd:e="ENVMAP_BLENDING_ADD";break}return e}function Vv(n){let e=n.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,i=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:i,maxMip:t}}function Gv(n,e,t,i){let s=n.getContext(),r=t.defines,o=t.vertexShader,a=t.fragmentShader,l=Bv(t),c=kv(t),u=zv(t),d=Hv(t),h=Vv(t),f=Iv(t),g=Pv(r),y=s.createProgram(),m,p,w=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(oo).join(`
`),m.length>0&&(m+=`
`),p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(oo).join(`
`),p.length>0&&(p+=`
`)):(m=[lf(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+u:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(oo).join(`
`),p=[lf(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+u:"",t.envMap?"#define "+d:"",h?"#define CUBEUV_TEXEL_WIDTH "+h.texelWidth:"",h?"#define CUBEUV_TEXEL_HEIGHT "+h.texelHeight:"",h?"#define CUBEUV_MAX_MIP "+h.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor||t.batchingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==ei?"#define TONE_MAPPING":"",t.toneMapping!==ei?$e.tonemapping_pars_fragment:"",t.toneMapping!==ei?Rv("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",$e.colorspace_pars_fragment,Av("linearToOutputTexel",t.outputColorSpace),Cv(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(oo).join(`
`)),o=_u(o),o=rf(o,t),o=of(o,t),a=_u(a),a=rf(a,t),a=of(a,t),o=af(o),a=af(a),t.isRawShaderMaterial!==!0&&(w=`#version 300 es
`,m=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,p=["#define varying in",t.glslVersion===eu?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===eu?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);let E=w+m+o,b=w+p+a,I=tf(s,s.VERTEX_SHADER,E),A=tf(s,s.FRAGMENT_SHADER,b);s.attachShader(y,I),s.attachShader(y,A),t.index0AttributeName!==void 0?s.bindAttribLocation(y,0,t.index0AttributeName):t.morphTargets===!0&&s.bindAttribLocation(y,0,"position"),s.linkProgram(y);function P(D){if(n.debug.checkShaderErrors){let B=s.getProgramInfoLog(y)||"",H=s.getShaderInfoLog(I)||"",W=s.getShaderInfoLog(A)||"",q=B.trim(),$=H.trim(),ne=W.trim(),V=!0,le=!0;if(s.getProgramParameter(y,s.LINK_STATUS)===!1)if(V=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(s,y,I,A);else{let de=sf(s,I,"vertex"),Te=sf(s,A,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(y,s.VALIDATE_STATUS)+`

Material Name: `+D.name+`
Material Type: `+D.type+`

Program Info Log: `+q+`
`+de+`
`+Te)}else q!==""?console.warn("THREE.WebGLProgram: Program Info Log:",q):($===""||ne==="")&&(le=!1);le&&(D.diagnostics={runnable:V,programLog:q,vertexShader:{log:$,prefix:m},fragmentShader:{log:ne,prefix:p}})}s.deleteShader(I),s.deleteShader(A),N=new Ws(s,y),M=Lv(s,y)}let N;this.getUniforms=function(){return N===void 0&&P(this),N};let M;this.getAttributes=function(){return M===void 0&&P(this),M};let S=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return S===!1&&(S=s.getProgramParameter(y,Mv)),S},this.destroy=function(){i.releaseStatesOfProgram(this),s.deleteProgram(y),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=Ev++,this.cacheKey=e,this.usedTimes=1,this.program=y,this.vertexShader=I,this.fragmentShader=A,this}var Wv=0,yu=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){let t=e.vertexShader,i=e.fragmentShader,s=this._getShaderStage(t),r=this._getShaderStage(i),o=this._getShaderCacheForMaterial(e);return o.has(s)===!1&&(o.add(s),s.usedTimes++),o.has(r)===!1&&(o.add(r),r.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let i of t)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,i=t.get(e);return i===void 0&&(i=new Set,t.set(e,i)),i}_getShaderStage(e){let t=this.shaderCache,i=t.get(e);return i===void 0&&(i=new vu(e),t.set(e,i)),i}},vu=class{constructor(e){this.id=Wv++,this.code=e,this.usedTimes=0}};function $v(n,e,t,i,s,r,o){let a=new Cr,l=new yu,c=new Set,u=[],d=s.logarithmicDepthBuffer,h=s.vertexTextures,f=s.precision,g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function y(M){return c.add(M),M===0?"uv":`uv${M}`}function m(M,S,D,B,H){let W=B.fog,q=H.geometry,$=M.isMeshStandardMaterial?B.environment:null,ne=(M.isMeshStandardMaterial?t:e).get(M.envMap||$),V=ne&&ne.mapping===eo?ne.image.height:null,le=g[M.type];M.precision!==null&&(f=s.getMaxPrecision(M.precision),f!==M.precision&&console.warn("THREE.WebGLProgram.getParameters:",M.precision,"not supported, using",f,"instead."));let de=q.morphAttributes.position||q.morphAttributes.normal||q.morphAttributes.color,Te=de!==void 0?de.length:0,Xe=0;q.morphAttributes.position!==void 0&&(Xe=1),q.morphAttributes.normal!==void 0&&(Xe=2),q.morphAttributes.color!==void 0&&(Xe=3);let ct,ft,tt,j;if(le){let nt=Bn[le];ct=nt.vertexShader,ft=nt.fragmentShader}else ct=M.vertexShader,ft=M.fragmentShader,l.update(M),tt=l.getVertexShaderID(M),j=l.getFragmentShaderID(M);let J=n.getRenderTarget(),ge=n.state.buffers.depth.getReversed(),Oe=H.isInstancedMesh===!0,we=H.isBatchedMesh===!0,Ye=!!M.map,Ot=!!M.matcap,C=!!ne,pt=!!M.aoMap,Be=!!M.lightMap,Pe=!!M.bumpMap,ve=!!M.normalMap,mt=!!M.displacementMap,xe=!!M.emissiveMap,Ge=!!M.metalnessMap,Ct=!!M.roughnessMap,bt=M.anisotropy>0,T=M.clearcoat>0,v=M.dispersion>0,F=M.iridescence>0,X=M.sheen>0,Z=M.transmission>0,G=bt&&!!M.anisotropyMap,Ee=T&&!!M.clearcoatMap,ie=T&&!!M.clearcoatNormalMap,be=T&&!!M.clearcoatRoughnessMap,Se=F&&!!M.iridescenceMap,ee=F&&!!M.iridescenceThicknessMap,he=X&&!!M.sheenColorMap,Ie=X&&!!M.sheenRoughnessMap,Me=!!M.specularMap,ce=!!M.specularColorMap,He=!!M.specularIntensityMap,L=Z&&!!M.transmissionMap,te=Z&&!!M.thicknessMap,se=!!M.gradientMap,pe=!!M.alphaMap,K=M.alphaTest>0,Y=!!M.alphaHash,ye=!!M.extensions,Fe=ei;M.toneMapped&&(J===null||J.isXRRenderTarget===!0)&&(Fe=n.toneMapping);let ut={shaderID:le,shaderType:M.type,shaderName:M.name,vertexShader:ct,fragmentShader:ft,defines:M.defines,customVertexShaderID:tt,customFragmentShaderID:j,isRawShaderMaterial:M.isRawShaderMaterial===!0,glslVersion:M.glslVersion,precision:f,batching:we,batchingColor:we&&H._colorsTexture!==null,instancing:Oe,instancingColor:Oe&&H.instanceColor!==null,instancingMorph:Oe&&H.morphTexture!==null,supportsVertexTextures:h,outputColorSpace:J===null?n.outputColorSpace:J.isXRRenderTarget===!0?J.texture.colorSpace:Gi,alphaToCoverage:!!M.alphaToCoverage,map:Ye,matcap:Ot,envMap:C,envMapMode:C&&ne.mapping,envMapCubeUVHeight:V,aoMap:pt,lightMap:Be,bumpMap:Pe,normalMap:ve,displacementMap:h&&mt,emissiveMap:xe,normalMapObjectSpace:ve&&M.normalMapType===Cd,normalMapTangentSpace:ve&&M.normalMapType===Kc,metalnessMap:Ge,roughnessMap:Ct,anisotropy:bt,anisotropyMap:G,clearcoat:T,clearcoatMap:Ee,clearcoatNormalMap:ie,clearcoatRoughnessMap:be,dispersion:v,iridescence:F,iridescenceMap:Se,iridescenceThicknessMap:ee,sheen:X,sheenColorMap:he,sheenRoughnessMap:Ie,specularMap:Me,specularColorMap:ce,specularIntensityMap:He,transmission:Z,transmissionMap:L,thicknessMap:te,gradientMap:se,opaque:M.transparent===!1&&M.blending===Hi&&M.alphaToCoverage===!1,alphaMap:pe,alphaTest:K,alphaHash:Y,combine:M.combine,mapUv:Ye&&y(M.map.channel),aoMapUv:pt&&y(M.aoMap.channel),lightMapUv:Be&&y(M.lightMap.channel),bumpMapUv:Pe&&y(M.bumpMap.channel),normalMapUv:ve&&y(M.normalMap.channel),displacementMapUv:mt&&y(M.displacementMap.channel),emissiveMapUv:xe&&y(M.emissiveMap.channel),metalnessMapUv:Ge&&y(M.metalnessMap.channel),roughnessMapUv:Ct&&y(M.roughnessMap.channel),anisotropyMapUv:G&&y(M.anisotropyMap.channel),clearcoatMapUv:Ee&&y(M.clearcoatMap.channel),clearcoatNormalMapUv:ie&&y(M.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:be&&y(M.clearcoatRoughnessMap.channel),iridescenceMapUv:Se&&y(M.iridescenceMap.channel),iridescenceThicknessMapUv:ee&&y(M.iridescenceThicknessMap.channel),sheenColorMapUv:he&&y(M.sheenColorMap.channel),sheenRoughnessMapUv:Ie&&y(M.sheenRoughnessMap.channel),specularMapUv:Me&&y(M.specularMap.channel),specularColorMapUv:ce&&y(M.specularColorMap.channel),specularIntensityMapUv:He&&y(M.specularIntensityMap.channel),transmissionMapUv:L&&y(M.transmissionMap.channel),thicknessMapUv:te&&y(M.thicknessMap.channel),alphaMapUv:pe&&y(M.alphaMap.channel),vertexTangents:!!q.attributes.tangent&&(ve||bt),vertexColors:M.vertexColors,vertexAlphas:M.vertexColors===!0&&!!q.attributes.color&&q.attributes.color.itemSize===4,pointsUvs:H.isPoints===!0&&!!q.attributes.uv&&(Ye||pe),fog:!!W,useFog:M.fog===!0,fogExp2:!!W&&W.isFogExp2,flatShading:M.flatShading===!0&&M.wireframe===!1,sizeAttenuation:M.sizeAttenuation===!0,logarithmicDepthBuffer:d,reversedDepthBuffer:ge,skinning:H.isSkinnedMesh===!0,morphTargets:q.morphAttributes.position!==void 0,morphNormals:q.morphAttributes.normal!==void 0,morphColors:q.morphAttributes.color!==void 0,morphTargetsCount:Te,morphTextureStride:Xe,numDirLights:S.directional.length,numPointLights:S.point.length,numSpotLights:S.spot.length,numSpotLightMaps:S.spotLightMap.length,numRectAreaLights:S.rectArea.length,numHemiLights:S.hemi.length,numDirLightShadows:S.directionalShadowMap.length,numPointLightShadows:S.pointShadowMap.length,numSpotLightShadows:S.spotShadowMap.length,numSpotLightShadowsWithMaps:S.numSpotLightShadowsWithMaps,numLightProbes:S.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:M.dithering,shadowMapEnabled:n.shadowMap.enabled&&D.length>0,shadowMapType:n.shadowMap.type,toneMapping:Fe,decodeVideoTexture:Ye&&M.map.isVideoTexture===!0&&Ze.getTransfer(M.map.colorSpace)===st,decodeVideoTextureEmissive:xe&&M.emissiveMap.isVideoTexture===!0&&Ze.getTransfer(M.emissiveMap.colorSpace)===st,premultipliedAlpha:M.premultipliedAlpha,doubleSided:M.side===$t,flipSided:M.side===Wt,useDepthPacking:M.depthPacking>=0,depthPacking:M.depthPacking||0,index0AttributeName:M.index0AttributeName,extensionClipCullDistance:ye&&M.extensions.clipCullDistance===!0&&i.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(ye&&M.extensions.multiDraw===!0||we)&&i.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:i.has("KHR_parallel_shader_compile"),customProgramCacheKey:M.customProgramCacheKey()};return ut.vertexUv1s=c.has(1),ut.vertexUv2s=c.has(2),ut.vertexUv3s=c.has(3),c.clear(),ut}function p(M){let S=[];if(M.shaderID?S.push(M.shaderID):(S.push(M.customVertexShaderID),S.push(M.customFragmentShaderID)),M.defines!==void 0)for(let D in M.defines)S.push(D),S.push(M.defines[D]);return M.isRawShaderMaterial===!1&&(w(S,M),E(S,M),S.push(n.outputColorSpace)),S.push(M.customProgramCacheKey),S.join()}function w(M,S){M.push(S.precision),M.push(S.outputColorSpace),M.push(S.envMapMode),M.push(S.envMapCubeUVHeight),M.push(S.mapUv),M.push(S.alphaMapUv),M.push(S.lightMapUv),M.push(S.aoMapUv),M.push(S.bumpMapUv),M.push(S.normalMapUv),M.push(S.displacementMapUv),M.push(S.emissiveMapUv),M.push(S.metalnessMapUv),M.push(S.roughnessMapUv),M.push(S.anisotropyMapUv),M.push(S.clearcoatMapUv),M.push(S.clearcoatNormalMapUv),M.push(S.clearcoatRoughnessMapUv),M.push(S.iridescenceMapUv),M.push(S.iridescenceThicknessMapUv),M.push(S.sheenColorMapUv),M.push(S.sheenRoughnessMapUv),M.push(S.specularMapUv),M.push(S.specularColorMapUv),M.push(S.specularIntensityMapUv),M.push(S.transmissionMapUv),M.push(S.thicknessMapUv),M.push(S.combine),M.push(S.fogExp2),M.push(S.sizeAttenuation),M.push(S.morphTargetsCount),M.push(S.morphAttributeCount),M.push(S.numDirLights),M.push(S.numPointLights),M.push(S.numSpotLights),M.push(S.numSpotLightMaps),M.push(S.numHemiLights),M.push(S.numRectAreaLights),M.push(S.numDirLightShadows),M.push(S.numPointLightShadows),M.push(S.numSpotLightShadows),M.push(S.numSpotLightShadowsWithMaps),M.push(S.numLightProbes),M.push(S.shadowMapType),M.push(S.toneMapping),M.push(S.numClippingPlanes),M.push(S.numClipIntersection),M.push(S.depthPacking)}function E(M,S){a.disableAll(),S.supportsVertexTextures&&a.enable(0),S.instancing&&a.enable(1),S.instancingColor&&a.enable(2),S.instancingMorph&&a.enable(3),S.matcap&&a.enable(4),S.envMap&&a.enable(5),S.normalMapObjectSpace&&a.enable(6),S.normalMapTangentSpace&&a.enable(7),S.clearcoat&&a.enable(8),S.iridescence&&a.enable(9),S.alphaTest&&a.enable(10),S.vertexColors&&a.enable(11),S.vertexAlphas&&a.enable(12),S.vertexUv1s&&a.enable(13),S.vertexUv2s&&a.enable(14),S.vertexUv3s&&a.enable(15),S.vertexTangents&&a.enable(16),S.anisotropy&&a.enable(17),S.alphaHash&&a.enable(18),S.batching&&a.enable(19),S.dispersion&&a.enable(20),S.batchingColor&&a.enable(21),S.gradientMap&&a.enable(22),M.push(a.mask),a.disableAll(),S.fog&&a.enable(0),S.useFog&&a.enable(1),S.flatShading&&a.enable(2),S.logarithmicDepthBuffer&&a.enable(3),S.reversedDepthBuffer&&a.enable(4),S.skinning&&a.enable(5),S.morphTargets&&a.enable(6),S.morphNormals&&a.enable(7),S.morphColors&&a.enable(8),S.premultipliedAlpha&&a.enable(9),S.shadowMapEnabled&&a.enable(10),S.doubleSided&&a.enable(11),S.flipSided&&a.enable(12),S.useDepthPacking&&a.enable(13),S.dithering&&a.enable(14),S.transmission&&a.enable(15),S.sheen&&a.enable(16),S.opaque&&a.enable(17),S.pointsUvs&&a.enable(18),S.decodeVideoTexture&&a.enable(19),S.decodeVideoTextureEmissive&&a.enable(20),S.alphaToCoverage&&a.enable(21),M.push(a.mask)}function b(M){let S=g[M.type],D;if(S){let B=Bn[S];D=zd.clone(B.uniforms)}else D=M.uniforms;return D}function I(M,S){let D;for(let B=0,H=u.length;B<H;B++){let W=u[B];if(W.cacheKey===S){D=W,++D.usedTimes;break}}return D===void 0&&(D=new Gv(n,S,M,r),u.push(D)),D}function A(M){if(--M.usedTimes===0){let S=u.indexOf(M);u[S]=u[u.length-1],u.pop(),M.destroy()}}function P(M){l.remove(M)}function N(){l.dispose()}return{getParameters:m,getProgramCacheKey:p,getUniforms:b,acquireProgram:I,releaseProgram:A,releaseShaderCache:P,programs:u,dispose:N}}function Xv(){let n=new WeakMap;function e(o){return n.has(o)}function t(o){let a=n.get(o);return a===void 0&&(a={},n.set(o,a)),a}function i(o){n.delete(o)}function s(o,a,l){n.get(o)[a]=l}function r(){n=new WeakMap}return{has:e,get:t,remove:i,update:s,dispose:r}}function qv(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.material.id!==e.material.id?n.material.id-e.material.id:n.z!==e.z?n.z-e.z:n.id-e.id}function cf(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.z!==e.z?e.z-n.z:n.id-e.id}function uf(){let n=[],e=0,t=[],i=[],s=[];function r(){e=0,t.length=0,i.length=0,s.length=0}function o(d,h,f,g,y,m){let p=n[e];return p===void 0?(p={id:d.id,object:d,geometry:h,material:f,groupOrder:g,renderOrder:d.renderOrder,z:y,group:m},n[e]=p):(p.id=d.id,p.object=d,p.geometry=h,p.material=f,p.groupOrder=g,p.renderOrder=d.renderOrder,p.z=y,p.group=m),e++,p}function a(d,h,f,g,y,m){let p=o(d,h,f,g,y,m);f.transmission>0?i.push(p):f.transparent===!0?s.push(p):t.push(p)}function l(d,h,f,g,y,m){let p=o(d,h,f,g,y,m);f.transmission>0?i.unshift(p):f.transparent===!0?s.unshift(p):t.unshift(p)}function c(d,h){t.length>1&&t.sort(d||qv),i.length>1&&i.sort(h||cf),s.length>1&&s.sort(h||cf)}function u(){for(let d=e,h=n.length;d<h;d++){let f=n[d];if(f.id===null)break;f.id=null,f.object=null,f.geometry=null,f.material=null,f.group=null}}return{opaque:t,transmissive:i,transparent:s,init:r,push:a,unshift:l,finish:u,sort:c}}function jv(){let n=new WeakMap;function e(i,s){let r=n.get(i),o;return r===void 0?(o=new uf,n.set(i,[o])):s>=r.length?(o=new uf,r.push(o)):o=r[s],o}function t(){n=new WeakMap}return{get:e,dispose:t}}function Yv(){let n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new R,color:new De};break;case"SpotLight":t={position:new R,direction:new R,color:new De,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new R,color:new De,distance:0,decay:0};break;case"HemisphereLight":t={direction:new R,skyColor:new De,groundColor:new De};break;case"RectAreaLight":t={color:new De,position:new R,halfWidth:new R,halfHeight:new R};break}return n[e.id]=t,t}}}function Zv(){let n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new re};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new re};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new re,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[e.id]=t,t}}}var Jv=0;function Kv(n,e){return(e.castShadow?2:0)-(n.castShadow?2:0)+(e.map?1:0)-(n.map?1:0)}function Qv(n){let e=new Yv,t=Zv(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)i.probe.push(new R);let s=new R,r=new ot,o=new ot;function a(c){let u=0,d=0,h=0;for(let M=0;M<9;M++)i.probe[M].set(0,0,0);let f=0,g=0,y=0,m=0,p=0,w=0,E=0,b=0,I=0,A=0,P=0;c.sort(Kv);for(let M=0,S=c.length;M<S;M++){let D=c[M],B=D.color,H=D.intensity,W=D.distance,q=D.shadow&&D.shadow.map?D.shadow.map.texture:null;if(D.isAmbientLight)u+=B.r*H,d+=B.g*H,h+=B.b*H;else if(D.isLightProbe){for(let $=0;$<9;$++)i.probe[$].addScaledVector(D.sh.coefficients[$],H);P++}else if(D.isDirectionalLight){let $=e.get(D);if($.color.copy(D.color).multiplyScalar(D.intensity),D.castShadow){let ne=D.shadow,V=t.get(D);V.shadowIntensity=ne.intensity,V.shadowBias=ne.bias,V.shadowNormalBias=ne.normalBias,V.shadowRadius=ne.radius,V.shadowMapSize=ne.mapSize,i.directionalShadow[f]=V,i.directionalShadowMap[f]=q,i.directionalShadowMatrix[f]=D.shadow.matrix,w++}i.directional[f]=$,f++}else if(D.isSpotLight){let $=e.get(D);$.position.setFromMatrixPosition(D.matrixWorld),$.color.copy(B).multiplyScalar(H),$.distance=W,$.coneCos=Math.cos(D.angle),$.penumbraCos=Math.cos(D.angle*(1-D.penumbra)),$.decay=D.decay,i.spot[y]=$;let ne=D.shadow;if(D.map&&(i.spotLightMap[I]=D.map,I++,ne.updateMatrices(D),D.castShadow&&A++),i.spotLightMatrix[y]=ne.matrix,D.castShadow){let V=t.get(D);V.shadowIntensity=ne.intensity,V.shadowBias=ne.bias,V.shadowNormalBias=ne.normalBias,V.shadowRadius=ne.radius,V.shadowMapSize=ne.mapSize,i.spotShadow[y]=V,i.spotShadowMap[y]=q,b++}y++}else if(D.isRectAreaLight){let $=e.get(D);$.color.copy(B).multiplyScalar(H),$.halfWidth.set(D.width*.5,0,0),$.halfHeight.set(0,D.height*.5,0),i.rectArea[m]=$,m++}else if(D.isPointLight){let $=e.get(D);if($.color.copy(D.color).multiplyScalar(D.intensity),$.distance=D.distance,$.decay=D.decay,D.castShadow){let ne=D.shadow,V=t.get(D);V.shadowIntensity=ne.intensity,V.shadowBias=ne.bias,V.shadowNormalBias=ne.normalBias,V.shadowRadius=ne.radius,V.shadowMapSize=ne.mapSize,V.shadowCameraNear=ne.camera.near,V.shadowCameraFar=ne.camera.far,i.pointShadow[g]=V,i.pointShadowMap[g]=q,i.pointShadowMatrix[g]=D.shadow.matrix,E++}i.point[g]=$,g++}else if(D.isHemisphereLight){let $=e.get(D);$.skyColor.copy(D.color).multiplyScalar(H),$.groundColor.copy(D.groundColor).multiplyScalar(H),i.hemi[p]=$,p++}}m>0&&(n.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=ae.LTC_FLOAT_1,i.rectAreaLTC2=ae.LTC_FLOAT_2):(i.rectAreaLTC1=ae.LTC_HALF_1,i.rectAreaLTC2=ae.LTC_HALF_2)),i.ambient[0]=u,i.ambient[1]=d,i.ambient[2]=h;let N=i.hash;(N.directionalLength!==f||N.pointLength!==g||N.spotLength!==y||N.rectAreaLength!==m||N.hemiLength!==p||N.numDirectionalShadows!==w||N.numPointShadows!==E||N.numSpotShadows!==b||N.numSpotMaps!==I||N.numLightProbes!==P)&&(i.directional.length=f,i.spot.length=y,i.rectArea.length=m,i.point.length=g,i.hemi.length=p,i.directionalShadow.length=w,i.directionalShadowMap.length=w,i.pointShadow.length=E,i.pointShadowMap.length=E,i.spotShadow.length=b,i.spotShadowMap.length=b,i.directionalShadowMatrix.length=w,i.pointShadowMatrix.length=E,i.spotLightMatrix.length=b+I-A,i.spotLightMap.length=I,i.numSpotLightShadowsWithMaps=A,i.numLightProbes=P,N.directionalLength=f,N.pointLength=g,N.spotLength=y,N.rectAreaLength=m,N.hemiLength=p,N.numDirectionalShadows=w,N.numPointShadows=E,N.numSpotShadows=b,N.numSpotMaps=I,N.numLightProbes=P,i.version=Jv++)}function l(c,u){let d=0,h=0,f=0,g=0,y=0,m=u.matrixWorldInverse;for(let p=0,w=c.length;p<w;p++){let E=c[p];if(E.isDirectionalLight){let b=i.directional[d];b.direction.setFromMatrixPosition(E.matrixWorld),s.setFromMatrixPosition(E.target.matrixWorld),b.direction.sub(s),b.direction.transformDirection(m),d++}else if(E.isSpotLight){let b=i.spot[f];b.position.setFromMatrixPosition(E.matrixWorld),b.position.applyMatrix4(m),b.direction.setFromMatrixPosition(E.matrixWorld),s.setFromMatrixPosition(E.target.matrixWorld),b.direction.sub(s),b.direction.transformDirection(m),f++}else if(E.isRectAreaLight){let b=i.rectArea[g];b.position.setFromMatrixPosition(E.matrixWorld),b.position.applyMatrix4(m),o.identity(),r.copy(E.matrixWorld),r.premultiply(m),o.extractRotation(r),b.halfWidth.set(E.width*.5,0,0),b.halfHeight.set(0,E.height*.5,0),b.halfWidth.applyMatrix4(o),b.halfHeight.applyMatrix4(o),g++}else if(E.isPointLight){let b=i.point[h];b.position.setFromMatrixPosition(E.matrixWorld),b.position.applyMatrix4(m),h++}else if(E.isHemisphereLight){let b=i.hemi[y];b.direction.setFromMatrixPosition(E.matrixWorld),b.direction.transformDirection(m),y++}}}return{setup:a,setupView:l,state:i}}function hf(n){let e=new Qv(n),t=[],i=[];function s(u){c.camera=u,t.length=0,i.length=0}function r(u){t.push(u)}function o(u){i.push(u)}function a(){e.setup(t)}function l(u){e.setupView(t,u)}let c={lightsArray:t,shadowsArray:i,camera:null,lights:e,transmissionRenderTarget:{}};return{init:s,state:c,setupLights:a,setupLightsView:l,pushLight:r,pushShadow:o}}function ex(n){let e=new WeakMap;function t(s,r=0){let o=e.get(s),a;return o===void 0?(a=new hf(n),e.set(s,[a])):r>=o.length?(a=new hf(n),o.push(a)):a=o[r],a}function i(){e=new WeakMap}return{get:t,dispose:i}}var tx=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,nx=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function ix(n,e,t){let i=new Rs,s=new re,r=new re,o=new it,a=new pa({depthPacking:Rd}),l=new ma,c={},u=t.maxTextureSize,d={[Zn]:Wt,[Wt]:Zn,[$t]:$t},h=new En({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new re},radius:{value:4}},vertexShader:tx,fragmentShader:nx}),f=h.clone();f.defines.HORIZONTAL_PASS=1;let g=new wt;g.setAttribute("position",new Ut(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let y=new Je(g,h),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=zc;let p=this.type;this.render=function(A,P,N){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||A.length===0)return;let M=n.getRenderTarget(),S=n.getActiveCubeFace(),D=n.getActiveMipmapLevel(),B=n.state;B.setBlending(Qn),B.buffers.depth.getReversed()===!0?B.buffers.color.setClear(0,0,0,0):B.buffers.color.setClear(1,1,1,1),B.buffers.depth.setTest(!0),B.setScissorTest(!1);let H=p!==Fn&&this.type===Fn,W=p===Fn&&this.type!==Fn;for(let q=0,$=A.length;q<$;q++){let ne=A[q],V=ne.shadow;if(V===void 0){console.warn("THREE.WebGLShadowMap:",ne,"has no shadow.");continue}if(V.autoUpdate===!1&&V.needsUpdate===!1)continue;s.copy(V.mapSize);let le=V.getFrameExtents();if(s.multiply(le),r.copy(V.mapSize),(s.x>u||s.y>u)&&(s.x>u&&(r.x=Math.floor(u/le.x),s.x=r.x*le.x,V.mapSize.x=r.x),s.y>u&&(r.y=Math.floor(u/le.y),s.y=r.y*le.y,V.mapSize.y=r.y)),V.map===null||H===!0||W===!0){let Te=this.type!==Fn?{minFilter:Jt,magFilter:Jt}:{};V.map!==null&&V.map.dispose(),V.map=new In(s.x,s.y,Te),V.map.texture.name=ne.name+".shadowMap",V.camera.updateProjectionMatrix()}n.setRenderTarget(V.map),n.clear();let de=V.getViewportCount();for(let Te=0;Te<de;Te++){let Xe=V.getViewport(Te);o.set(r.x*Xe.x,r.y*Xe.y,r.x*Xe.z,r.y*Xe.w),B.viewport(o),V.updateMatrices(ne,Te),i=V.getFrustum(),b(P,N,V.camera,ne,this.type)}V.isPointLightShadow!==!0&&this.type===Fn&&w(V,N),V.needsUpdate=!1}p=this.type,m.needsUpdate=!1,n.setRenderTarget(M,S,D)};function w(A,P){let N=e.update(y);h.defines.VSM_SAMPLES!==A.blurSamples&&(h.defines.VSM_SAMPLES=A.blurSamples,f.defines.VSM_SAMPLES=A.blurSamples,h.needsUpdate=!0,f.needsUpdate=!0),A.mapPass===null&&(A.mapPass=new In(s.x,s.y)),h.uniforms.shadow_pass.value=A.map.texture,h.uniforms.resolution.value=A.mapSize,h.uniforms.radius.value=A.radius,n.setRenderTarget(A.mapPass),n.clear(),n.renderBufferDirect(P,null,N,h,y,null),f.uniforms.shadow_pass.value=A.mapPass.texture,f.uniforms.resolution.value=A.mapSize,f.uniforms.radius.value=A.radius,n.setRenderTarget(A.map),n.clear(),n.renderBufferDirect(P,null,N,f,y,null)}function E(A,P,N,M){let S=null,D=N.isPointLight===!0?A.customDistanceMaterial:A.customDepthMaterial;if(D!==void 0)S=D;else if(S=N.isPointLight===!0?l:a,n.localClippingEnabled&&P.clipShadows===!0&&Array.isArray(P.clippingPlanes)&&P.clippingPlanes.length!==0||P.displacementMap&&P.displacementScale!==0||P.alphaMap&&P.alphaTest>0||P.map&&P.alphaTest>0||P.alphaToCoverage===!0){let B=S.uuid,H=P.uuid,W=c[B];W===void 0&&(W={},c[B]=W);let q=W[H];q===void 0&&(q=S.clone(),W[H]=q,P.addEventListener("dispose",I)),S=q}if(S.visible=P.visible,S.wireframe=P.wireframe,M===Fn?S.side=P.shadowSide!==null?P.shadowSide:P.side:S.side=P.shadowSide!==null?P.shadowSide:d[P.side],S.alphaMap=P.alphaMap,S.alphaTest=P.alphaToCoverage===!0?.5:P.alphaTest,S.map=P.map,S.clipShadows=P.clipShadows,S.clippingPlanes=P.clippingPlanes,S.clipIntersection=P.clipIntersection,S.displacementMap=P.displacementMap,S.displacementScale=P.displacementScale,S.displacementBias=P.displacementBias,S.wireframeLinewidth=P.wireframeLinewidth,S.linewidth=P.linewidth,N.isPointLight===!0&&S.isMeshDistanceMaterial===!0){let B=n.properties.get(S);B.light=N}return S}function b(A,P,N,M,S){if(A.visible===!1)return;if(A.layers.test(P.layers)&&(A.isMesh||A.isLine||A.isPoints)&&(A.castShadow||A.receiveShadow&&S===Fn)&&(!A.frustumCulled||i.intersectsObject(A))){A.modelViewMatrix.multiplyMatrices(N.matrixWorldInverse,A.matrixWorld);let H=e.update(A),W=A.material;if(Array.isArray(W)){let q=H.groups;for(let $=0,ne=q.length;$<ne;$++){let V=q[$],le=W[V.materialIndex];if(le&&le.visible){let de=E(A,le,M,S);A.onBeforeShadow(n,A,P,N,H,de,V),n.renderBufferDirect(N,null,H,de,A,V),A.onAfterShadow(n,A,P,N,H,de,V)}}}else if(W.visible){let q=E(A,W,M,S);A.onBeforeShadow(n,A,P,N,H,q,null),n.renderBufferDirect(N,null,H,q,A,null),A.onAfterShadow(n,A,P,N,H,q,null)}}let B=A.children;for(let H=0,W=B.length;H<W;H++)b(B[H],P,N,M,S)}function I(A){A.target.removeEventListener("dispose",I);for(let N in c){let M=c[N],S=A.target.uuid;S in M&&(M[S].dispose(),delete M[S])}}}var sx={[Aa]:Ra,[Ca]:La,[Ia]:Da,[Vi]:Pa,[Ra]:Aa,[La]:Ca,[Da]:Ia,[Pa]:Vi};function rx(n,e){function t(){let L=!1,te=new it,se=null,pe=new it(0,0,0,0);return{setMask:function(K){se!==K&&!L&&(n.colorMask(K,K,K,K),se=K)},setLocked:function(K){L=K},setClear:function(K,Y,ye,Fe,ut){ut===!0&&(K*=Fe,Y*=Fe,ye*=Fe),te.set(K,Y,ye,Fe),pe.equals(te)===!1&&(n.clearColor(K,Y,ye,Fe),pe.copy(te))},reset:function(){L=!1,se=null,pe.set(-1,0,0,0)}}}function i(){let L=!1,te=!1,se=null,pe=null,K=null;return{setReversed:function(Y){if(te!==Y){let ye=e.get("EXT_clip_control");Y?ye.clipControlEXT(ye.LOWER_LEFT_EXT,ye.ZERO_TO_ONE_EXT):ye.clipControlEXT(ye.LOWER_LEFT_EXT,ye.NEGATIVE_ONE_TO_ONE_EXT),te=Y;let Fe=K;K=null,this.setClear(Fe)}},getReversed:function(){return te},setTest:function(Y){Y?J(n.DEPTH_TEST):ge(n.DEPTH_TEST)},setMask:function(Y){se!==Y&&!L&&(n.depthMask(Y),se=Y)},setFunc:function(Y){if(te&&(Y=sx[Y]),pe!==Y){switch(Y){case Aa:n.depthFunc(n.NEVER);break;case Ra:n.depthFunc(n.ALWAYS);break;case Ca:n.depthFunc(n.LESS);break;case Vi:n.depthFunc(n.LEQUAL);break;case Ia:n.depthFunc(n.EQUAL);break;case Pa:n.depthFunc(n.GEQUAL);break;case La:n.depthFunc(n.GREATER);break;case Da:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}pe=Y}},setLocked:function(Y){L=Y},setClear:function(Y){K!==Y&&(te&&(Y=1-Y),n.clearDepth(Y),K=Y)},reset:function(){L=!1,se=null,pe=null,K=null,te=!1}}}function s(){let L=!1,te=null,se=null,pe=null,K=null,Y=null,ye=null,Fe=null,ut=null;return{setTest:function(nt){L||(nt?J(n.STENCIL_TEST):ge(n.STENCIL_TEST))},setMask:function(nt){te!==nt&&!L&&(n.stencilMask(nt),te=nt)},setFunc:function(nt,zn,An){(se!==nt||pe!==zn||K!==An)&&(n.stencilFunc(nt,zn,An),se=nt,pe=zn,K=An)},setOp:function(nt,zn,An){(Y!==nt||ye!==zn||Fe!==An)&&(n.stencilOp(nt,zn,An),Y=nt,ye=zn,Fe=An)},setLocked:function(nt){L=nt},setClear:function(nt){ut!==nt&&(n.clearStencil(nt),ut=nt)},reset:function(){L=!1,te=null,se=null,pe=null,K=null,Y=null,ye=null,Fe=null,ut=null}}}let r=new t,o=new i,a=new s,l=new WeakMap,c=new WeakMap,u={},d={},h=new WeakMap,f=[],g=null,y=!1,m=null,p=null,w=null,E=null,b=null,I=null,A=null,P=new De(0,0,0),N=0,M=!1,S=null,D=null,B=null,H=null,W=null,q=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS),$=!1,ne=0,V=n.getParameter(n.VERSION);V.indexOf("WebGL")!==-1?(ne=parseFloat(/^WebGL (\d)/.exec(V)[1]),$=ne>=1):V.indexOf("OpenGL ES")!==-1&&(ne=parseFloat(/^OpenGL ES (\d)/.exec(V)[1]),$=ne>=2);let le=null,de={},Te=n.getParameter(n.SCISSOR_BOX),Xe=n.getParameter(n.VIEWPORT),ct=new it().fromArray(Te),ft=new it().fromArray(Xe);function tt(L,te,se,pe){let K=new Uint8Array(4),Y=n.createTexture();n.bindTexture(L,Y),n.texParameteri(L,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(L,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let ye=0;ye<se;ye++)L===n.TEXTURE_3D||L===n.TEXTURE_2D_ARRAY?n.texImage3D(te,0,n.RGBA,1,1,pe,0,n.RGBA,n.UNSIGNED_BYTE,K):n.texImage2D(te+ye,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,K);return Y}let j={};j[n.TEXTURE_2D]=tt(n.TEXTURE_2D,n.TEXTURE_2D,1),j[n.TEXTURE_CUBE_MAP]=tt(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),j[n.TEXTURE_2D_ARRAY]=tt(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),j[n.TEXTURE_3D]=tt(n.TEXTURE_3D,n.TEXTURE_3D,1,1),r.setClear(0,0,0,1),o.setClear(1),a.setClear(0),J(n.DEPTH_TEST),o.setFunc(Vi),Pe(!1),ve(kc),J(n.CULL_FACE),pt(Qn);function J(L){u[L]!==!0&&(n.enable(L),u[L]=!0)}function ge(L){u[L]!==!1&&(n.disable(L),u[L]=!1)}function Oe(L,te){return d[L]!==te?(n.bindFramebuffer(L,te),d[L]=te,L===n.DRAW_FRAMEBUFFER&&(d[n.FRAMEBUFFER]=te),L===n.FRAMEBUFFER&&(d[n.DRAW_FRAMEBUFFER]=te),!0):!1}function we(L,te){let se=f,pe=!1;if(L){se=h.get(te),se===void 0&&(se=[],h.set(te,se));let K=L.textures;if(se.length!==K.length||se[0]!==n.COLOR_ATTACHMENT0){for(let Y=0,ye=K.length;Y<ye;Y++)se[Y]=n.COLOR_ATTACHMENT0+Y;se.length=K.length,pe=!0}}else se[0]!==n.BACK&&(se[0]=n.BACK,pe=!0);pe&&n.drawBuffers(se)}function Ye(L){return g!==L?(n.useProgram(L),g=L,!0):!1}let Ot={[mi]:n.FUNC_ADD,[td]:n.FUNC_SUBTRACT,[nd]:n.FUNC_REVERSE_SUBTRACT};Ot[id]=n.MIN,Ot[sd]=n.MAX;let C={[rd]:n.ZERO,[od]:n.ONE,[ad]:n.SRC_COLOR,[Xo]:n.SRC_ALPHA,[fd]:n.SRC_ALPHA_SATURATE,[hd]:n.DST_COLOR,[cd]:n.DST_ALPHA,[ld]:n.ONE_MINUS_SRC_COLOR,[qo]:n.ONE_MINUS_SRC_ALPHA,[dd]:n.ONE_MINUS_DST_COLOR,[ud]:n.ONE_MINUS_DST_ALPHA,[pd]:n.CONSTANT_COLOR,[md]:n.ONE_MINUS_CONSTANT_COLOR,[gd]:n.CONSTANT_ALPHA,[_d]:n.ONE_MINUS_CONSTANT_ALPHA};function pt(L,te,se,pe,K,Y,ye,Fe,ut,nt){if(L===Qn){y===!0&&(ge(n.BLEND),y=!1);return}if(y===!1&&(J(n.BLEND),y=!0),L!==ed){if(L!==m||nt!==M){if((p!==mi||b!==mi)&&(n.blendEquation(n.FUNC_ADD),p=mi,b=mi),nt)switch(L){case Hi:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Qr:n.blendFunc(n.ONE,n.ONE);break;case Hc:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case Vc:n.blendFuncSeparate(n.DST_COLOR,n.ONE_MINUS_SRC_ALPHA,n.ZERO,n.ONE);break;default:console.error("THREE.WebGLState: Invalid blending: ",L);break}else switch(L){case Hi:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Qr:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE,n.ONE,n.ONE);break;case Hc:console.error("THREE.WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case Vc:console.error("THREE.WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:console.error("THREE.WebGLState: Invalid blending: ",L);break}w=null,E=null,I=null,A=null,P.set(0,0,0),N=0,m=L,M=nt}return}K=K||te,Y=Y||se,ye=ye||pe,(te!==p||K!==b)&&(n.blendEquationSeparate(Ot[te],Ot[K]),p=te,b=K),(se!==w||pe!==E||Y!==I||ye!==A)&&(n.blendFuncSeparate(C[se],C[pe],C[Y],C[ye]),w=se,E=pe,I=Y,A=ye),(Fe.equals(P)===!1||ut!==N)&&(n.blendColor(Fe.r,Fe.g,Fe.b,ut),P.copy(Fe),N=ut),m=L,M=!1}function Be(L,te){L.side===$t?ge(n.CULL_FACE):J(n.CULL_FACE);let se=L.side===Wt;te&&(se=!se),Pe(se),L.blending===Hi&&L.transparent===!1?pt(Qn):pt(L.blending,L.blendEquation,L.blendSrc,L.blendDst,L.blendEquationAlpha,L.blendSrcAlpha,L.blendDstAlpha,L.blendColor,L.blendAlpha,L.premultipliedAlpha),o.setFunc(L.depthFunc),o.setTest(L.depthTest),o.setMask(L.depthWrite),r.setMask(L.colorWrite);let pe=L.stencilWrite;a.setTest(pe),pe&&(a.setMask(L.stencilWriteMask),a.setFunc(L.stencilFunc,L.stencilRef,L.stencilFuncMask),a.setOp(L.stencilFail,L.stencilZFail,L.stencilZPass)),xe(L.polygonOffset,L.polygonOffsetFactor,L.polygonOffsetUnits),L.alphaToCoverage===!0?J(n.SAMPLE_ALPHA_TO_COVERAGE):ge(n.SAMPLE_ALPHA_TO_COVERAGE)}function Pe(L){S!==L&&(L?n.frontFace(n.CW):n.frontFace(n.CCW),S=L)}function ve(L){L!==Jh?(J(n.CULL_FACE),L!==D&&(L===kc?n.cullFace(n.BACK):L===Kh?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):ge(n.CULL_FACE),D=L}function mt(L){L!==B&&($&&n.lineWidth(L),B=L)}function xe(L,te,se){L?(J(n.POLYGON_OFFSET_FILL),(H!==te||W!==se)&&(n.polygonOffset(te,se),H=te,W=se)):ge(n.POLYGON_OFFSET_FILL)}function Ge(L){L?J(n.SCISSOR_TEST):ge(n.SCISSOR_TEST)}function Ct(L){L===void 0&&(L=n.TEXTURE0+q-1),le!==L&&(n.activeTexture(L),le=L)}function bt(L,te,se){se===void 0&&(le===null?se=n.TEXTURE0+q-1:se=le);let pe=de[se];pe===void 0&&(pe={type:void 0,texture:void 0},de[se]=pe),(pe.type!==L||pe.texture!==te)&&(le!==se&&(n.activeTexture(se),le=se),n.bindTexture(L,te||j[L]),pe.type=L,pe.texture=te)}function T(){let L=de[le];L!==void 0&&L.type!==void 0&&(n.bindTexture(L.type,null),L.type=void 0,L.texture=void 0)}function v(){try{n.compressedTexImage2D(...arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function F(){try{n.compressedTexImage3D(...arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function X(){try{n.texSubImage2D(...arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function Z(){try{n.texSubImage3D(...arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function G(){try{n.compressedTexSubImage2D(...arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function Ee(){try{n.compressedTexSubImage3D(...arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function ie(){try{n.texStorage2D(...arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function be(){try{n.texStorage3D(...arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function Se(){try{n.texImage2D(...arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function ee(){try{n.texImage3D(...arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function he(L){ct.equals(L)===!1&&(n.scissor(L.x,L.y,L.z,L.w),ct.copy(L))}function Ie(L){ft.equals(L)===!1&&(n.viewport(L.x,L.y,L.z,L.w),ft.copy(L))}function Me(L,te){let se=c.get(te);se===void 0&&(se=new WeakMap,c.set(te,se));let pe=se.get(L);pe===void 0&&(pe=n.getUniformBlockIndex(te,L.name),se.set(L,pe))}function ce(L,te){let pe=c.get(te).get(L);l.get(te)!==pe&&(n.uniformBlockBinding(te,pe,L.__bindingPointIndex),l.set(te,pe))}function He(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),o.setReversed(!1),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),u={},le=null,de={},d={},h=new WeakMap,f=[],g=null,y=!1,m=null,p=null,w=null,E=null,b=null,I=null,A=null,P=new De(0,0,0),N=0,M=!1,S=null,D=null,B=null,H=null,W=null,ct.set(0,0,n.canvas.width,n.canvas.height),ft.set(0,0,n.canvas.width,n.canvas.height),r.reset(),o.reset(),a.reset()}return{buffers:{color:r,depth:o,stencil:a},enable:J,disable:ge,bindFramebuffer:Oe,drawBuffers:we,useProgram:Ye,setBlending:pt,setMaterial:Be,setFlipSided:Pe,setCullFace:ve,setLineWidth:mt,setPolygonOffset:xe,setScissorTest:Ge,activeTexture:Ct,bindTexture:bt,unbindTexture:T,compressedTexImage2D:v,compressedTexImage3D:F,texImage2D:Se,texImage3D:ee,updateUBOMapping:Me,uniformBlockBinding:ce,texStorage2D:ie,texStorage3D:be,texSubImage2D:X,texSubImage3D:Z,compressedTexSubImage2D:G,compressedTexSubImage3D:Ee,scissor:he,viewport:Ie,reset:He}}function ox(n,e,t,i,s,r,o){let a=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new re,u=new WeakMap,d,h=new WeakMap,f=!1;try{f=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(T,v){return f?new OffscreenCanvas(T,v):Ar("canvas")}function y(T,v,F){let X=1,Z=bt(T);if((Z.width>F||Z.height>F)&&(X=F/Math.max(Z.width,Z.height)),X<1)if(typeof HTMLImageElement<"u"&&T instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&T instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&T instanceof ImageBitmap||typeof VideoFrame<"u"&&T instanceof VideoFrame){let G=Math.floor(X*Z.width),Ee=Math.floor(X*Z.height);d===void 0&&(d=g(G,Ee));let ie=v?g(G,Ee):d;return ie.width=G,ie.height=Ee,ie.getContext("2d").drawImage(T,0,0,G,Ee),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+Z.width+"x"+Z.height+") to ("+G+"x"+Ee+")."),ie}else return"data"in T&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+Z.width+"x"+Z.height+")."),T;return T}function m(T){return T.generateMipmaps}function p(T){n.generateMipmap(T)}function w(T){return T.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:T.isWebGL3DRenderTarget?n.TEXTURE_3D:T.isWebGLArrayRenderTarget||T.isCompressedArrayTexture?n.TEXTURE_2D_ARRAY:n.TEXTURE_2D}function E(T,v,F,X,Z=!1){if(T!==null){if(n[T]!==void 0)return n[T];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+T+"'")}let G=v;if(v===n.RED&&(F===n.FLOAT&&(G=n.R32F),F===n.HALF_FLOAT&&(G=n.R16F),F===n.UNSIGNED_BYTE&&(G=n.R8)),v===n.RED_INTEGER&&(F===n.UNSIGNED_BYTE&&(G=n.R8UI),F===n.UNSIGNED_SHORT&&(G=n.R16UI),F===n.UNSIGNED_INT&&(G=n.R32UI),F===n.BYTE&&(G=n.R8I),F===n.SHORT&&(G=n.R16I),F===n.INT&&(G=n.R32I)),v===n.RG&&(F===n.FLOAT&&(G=n.RG32F),F===n.HALF_FLOAT&&(G=n.RG16F),F===n.UNSIGNED_BYTE&&(G=n.RG8)),v===n.RG_INTEGER&&(F===n.UNSIGNED_BYTE&&(G=n.RG8UI),F===n.UNSIGNED_SHORT&&(G=n.RG16UI),F===n.UNSIGNED_INT&&(G=n.RG32UI),F===n.BYTE&&(G=n.RG8I),F===n.SHORT&&(G=n.RG16I),F===n.INT&&(G=n.RG32I)),v===n.RGB_INTEGER&&(F===n.UNSIGNED_BYTE&&(G=n.RGB8UI),F===n.UNSIGNED_SHORT&&(G=n.RGB16UI),F===n.UNSIGNED_INT&&(G=n.RGB32UI),F===n.BYTE&&(G=n.RGB8I),F===n.SHORT&&(G=n.RGB16I),F===n.INT&&(G=n.RGB32I)),v===n.RGBA_INTEGER&&(F===n.UNSIGNED_BYTE&&(G=n.RGBA8UI),F===n.UNSIGNED_SHORT&&(G=n.RGBA16UI),F===n.UNSIGNED_INT&&(G=n.RGBA32UI),F===n.BYTE&&(G=n.RGBA8I),F===n.SHORT&&(G=n.RGBA16I),F===n.INT&&(G=n.RGBA32I)),v===n.RGB&&(F===n.UNSIGNED_INT_5_9_9_9_REV&&(G=n.RGB9_E5),F===n.UNSIGNED_INT_10F_11F_11F_REV&&(G=n.R11F_G11F_B10F)),v===n.RGBA){let Ee=Z?wr:Ze.getTransfer(X);F===n.FLOAT&&(G=n.RGBA32F),F===n.HALF_FLOAT&&(G=n.RGBA16F),F===n.UNSIGNED_BYTE&&(G=Ee===st?n.SRGB8_ALPHA8:n.RGBA8),F===n.UNSIGNED_SHORT_4_4_4_4&&(G=n.RGBA4),F===n.UNSIGNED_SHORT_5_5_5_1&&(G=n.RGB5_A1)}return(G===n.R16F||G===n.R32F||G===n.RG16F||G===n.RG32F||G===n.RGBA16F||G===n.RGBA32F)&&e.get("EXT_color_buffer_float"),G}function b(T,v){let F;return T?v===null||v===Si||v===ks?F=n.DEPTH24_STENCIL8:v===Tn?F=n.DEPTH32F_STENCIL8:v===Fs&&(F=n.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):v===null||v===Si||v===ks?F=n.DEPTH_COMPONENT24:v===Tn?F=n.DEPTH_COMPONENT32F:v===Fs&&(F=n.DEPTH_COMPONENT16),F}function I(T,v){return m(T)===!0||T.isFramebufferTexture&&T.minFilter!==Jt&&T.minFilter!==Sn?Math.log2(Math.max(v.width,v.height))+1:T.mipmaps!==void 0&&T.mipmaps.length>0?T.mipmaps.length:T.isCompressedTexture&&Array.isArray(T.image)?v.mipmaps.length:1}function A(T){let v=T.target;v.removeEventListener("dispose",A),N(v),v.isVideoTexture&&u.delete(v)}function P(T){let v=T.target;v.removeEventListener("dispose",P),S(v)}function N(T){let v=i.get(T);if(v.__webglInit===void 0)return;let F=T.source,X=h.get(F);if(X){let Z=X[v.__cacheKey];Z.usedTimes--,Z.usedTimes===0&&M(T),Object.keys(X).length===0&&h.delete(F)}i.remove(T)}function M(T){let v=i.get(T);n.deleteTexture(v.__webglTexture);let F=T.source,X=h.get(F);delete X[v.__cacheKey],o.memory.textures--}function S(T){let v=i.get(T);if(T.depthTexture&&(T.depthTexture.dispose(),i.remove(T.depthTexture)),T.isWebGLCubeRenderTarget)for(let X=0;X<6;X++){if(Array.isArray(v.__webglFramebuffer[X]))for(let Z=0;Z<v.__webglFramebuffer[X].length;Z++)n.deleteFramebuffer(v.__webglFramebuffer[X][Z]);else n.deleteFramebuffer(v.__webglFramebuffer[X]);v.__webglDepthbuffer&&n.deleteRenderbuffer(v.__webglDepthbuffer[X])}else{if(Array.isArray(v.__webglFramebuffer))for(let X=0;X<v.__webglFramebuffer.length;X++)n.deleteFramebuffer(v.__webglFramebuffer[X]);else n.deleteFramebuffer(v.__webglFramebuffer);if(v.__webglDepthbuffer&&n.deleteRenderbuffer(v.__webglDepthbuffer),v.__webglMultisampledFramebuffer&&n.deleteFramebuffer(v.__webglMultisampledFramebuffer),v.__webglColorRenderbuffer)for(let X=0;X<v.__webglColorRenderbuffer.length;X++)v.__webglColorRenderbuffer[X]&&n.deleteRenderbuffer(v.__webglColorRenderbuffer[X]);v.__webglDepthRenderbuffer&&n.deleteRenderbuffer(v.__webglDepthRenderbuffer)}let F=T.textures;for(let X=0,Z=F.length;X<Z;X++){let G=i.get(F[X]);G.__webglTexture&&(n.deleteTexture(G.__webglTexture),o.memory.textures--),i.remove(F[X])}i.remove(T)}let D=0;function B(){D=0}function H(){let T=D;return T>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+T+" texture units while this GPU supports only "+s.maxTextures),D+=1,T}function W(T){let v=[];return v.push(T.wrapS),v.push(T.wrapT),v.push(T.wrapR||0),v.push(T.magFilter),v.push(T.minFilter),v.push(T.anisotropy),v.push(T.internalFormat),v.push(T.format),v.push(T.type),v.push(T.generateMipmaps),v.push(T.premultiplyAlpha),v.push(T.flipY),v.push(T.unpackAlignment),v.push(T.colorSpace),v.join()}function q(T,v){let F=i.get(T);if(T.isVideoTexture&&Ge(T),T.isRenderTargetTexture===!1&&T.isExternalTexture!==!0&&T.version>0&&F.__version!==T.version){let X=T.image;if(X===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(X.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{j(F,T,v);return}}else T.isExternalTexture&&(F.__webglTexture=T.sourceTexture?T.sourceTexture:null);t.bindTexture(n.TEXTURE_2D,F.__webglTexture,n.TEXTURE0+v)}function $(T,v){let F=i.get(T);if(T.isRenderTargetTexture===!1&&T.version>0&&F.__version!==T.version){j(F,T,v);return}t.bindTexture(n.TEXTURE_2D_ARRAY,F.__webglTexture,n.TEXTURE0+v)}function ne(T,v){let F=i.get(T);if(T.isRenderTargetTexture===!1&&T.version>0&&F.__version!==T.version){j(F,T,v);return}t.bindTexture(n.TEXTURE_3D,F.__webglTexture,n.TEXTURE0+v)}function V(T,v){let F=i.get(T);if(T.version>0&&F.__version!==T.version){J(F,T,v);return}t.bindTexture(n.TEXTURE_CUBE_MAP,F.__webglTexture,n.TEXTURE0+v)}let le={[jo]:n.REPEAT,[pi]:n.CLAMP_TO_EDGE,[Yo]:n.MIRRORED_REPEAT},de={[Jt]:n.NEAREST,[Td]:n.NEAREST_MIPMAP_NEAREST,[to]:n.NEAREST_MIPMAP_LINEAR,[Sn]:n.LINEAR,[Fa]:n.LINEAR_MIPMAP_NEAREST,[bi]:n.LINEAR_MIPMAP_LINEAR},Te={[Id]:n.NEVER,[Od]:n.ALWAYS,[Pd]:n.LESS,[Qc]:n.LEQUAL,[Ld]:n.EQUAL,[Ud]:n.GEQUAL,[Dd]:n.GREATER,[Nd]:n.NOTEQUAL};function Xe(T,v){if(v.type===Tn&&e.has("OES_texture_float_linear")===!1&&(v.magFilter===Sn||v.magFilter===Fa||v.magFilter===to||v.magFilter===bi||v.minFilter===Sn||v.minFilter===Fa||v.minFilter===to||v.minFilter===bi)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),n.texParameteri(T,n.TEXTURE_WRAP_S,le[v.wrapS]),n.texParameteri(T,n.TEXTURE_WRAP_T,le[v.wrapT]),(T===n.TEXTURE_3D||T===n.TEXTURE_2D_ARRAY)&&n.texParameteri(T,n.TEXTURE_WRAP_R,le[v.wrapR]),n.texParameteri(T,n.TEXTURE_MAG_FILTER,de[v.magFilter]),n.texParameteri(T,n.TEXTURE_MIN_FILTER,de[v.minFilter]),v.compareFunction&&(n.texParameteri(T,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(T,n.TEXTURE_COMPARE_FUNC,Te[v.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(v.magFilter===Jt||v.minFilter!==to&&v.minFilter!==bi||v.type===Tn&&e.has("OES_texture_float_linear")===!1)return;if(v.anisotropy>1||i.get(v).__currentAnisotropy){let F=e.get("EXT_texture_filter_anisotropic");n.texParameterf(T,F.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(v.anisotropy,s.getMaxAnisotropy())),i.get(v).__currentAnisotropy=v.anisotropy}}}function ct(T,v){let F=!1;T.__webglInit===void 0&&(T.__webglInit=!0,v.addEventListener("dispose",A));let X=v.source,Z=h.get(X);Z===void 0&&(Z={},h.set(X,Z));let G=W(v);if(G!==T.__cacheKey){Z[G]===void 0&&(Z[G]={texture:n.createTexture(),usedTimes:0},o.memory.textures++,F=!0),Z[G].usedTimes++;let Ee=Z[T.__cacheKey];Ee!==void 0&&(Z[T.__cacheKey].usedTimes--,Ee.usedTimes===0&&M(v)),T.__cacheKey=G,T.__webglTexture=Z[G].texture}return F}function ft(T,v,F){return Math.floor(Math.floor(T/F)/v)}function tt(T,v,F,X){let G=T.updateRanges;if(G.length===0)t.texSubImage2D(n.TEXTURE_2D,0,0,0,v.width,v.height,F,X,v.data);else{G.sort((ee,he)=>ee.start-he.start);let Ee=0;for(let ee=1;ee<G.length;ee++){let he=G[Ee],Ie=G[ee],Me=he.start+he.count,ce=ft(Ie.start,v.width,4),He=ft(he.start,v.width,4);Ie.start<=Me+1&&ce===He&&ft(Ie.start+Ie.count-1,v.width,4)===ce?he.count=Math.max(he.count,Ie.start+Ie.count-he.start):(++Ee,G[Ee]=Ie)}G.length=Ee+1;let ie=n.getParameter(n.UNPACK_ROW_LENGTH),be=n.getParameter(n.UNPACK_SKIP_PIXELS),Se=n.getParameter(n.UNPACK_SKIP_ROWS);n.pixelStorei(n.UNPACK_ROW_LENGTH,v.width);for(let ee=0,he=G.length;ee<he;ee++){let Ie=G[ee],Me=Math.floor(Ie.start/4),ce=Math.ceil(Ie.count/4),He=Me%v.width,L=Math.floor(Me/v.width),te=ce,se=1;n.pixelStorei(n.UNPACK_SKIP_PIXELS,He),n.pixelStorei(n.UNPACK_SKIP_ROWS,L),t.texSubImage2D(n.TEXTURE_2D,0,He,L,te,se,F,X,v.data)}T.clearUpdateRanges(),n.pixelStorei(n.UNPACK_ROW_LENGTH,ie),n.pixelStorei(n.UNPACK_SKIP_PIXELS,be),n.pixelStorei(n.UNPACK_SKIP_ROWS,Se)}}function j(T,v,F){let X=n.TEXTURE_2D;(v.isDataArrayTexture||v.isCompressedArrayTexture)&&(X=n.TEXTURE_2D_ARRAY),v.isData3DTexture&&(X=n.TEXTURE_3D);let Z=ct(T,v),G=v.source;t.bindTexture(X,T.__webglTexture,n.TEXTURE0+F);let Ee=i.get(G);if(G.version!==Ee.__version||Z===!0){t.activeTexture(n.TEXTURE0+F);let ie=Ze.getPrimaries(Ze.workingColorSpace),be=v.colorSpace===ti?null:Ze.getPrimaries(v.colorSpace),Se=v.colorSpace===ti||ie===be?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,v.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,v.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,v.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,Se);let ee=y(v.image,!1,s.maxTextureSize);ee=Ct(v,ee);let he=r.convert(v.format,v.colorSpace),Ie=r.convert(v.type),Me=E(v.internalFormat,he,Ie,v.colorSpace,v.isVideoTexture);Xe(X,v);let ce,He=v.mipmaps,L=v.isVideoTexture!==!0,te=Ee.__version===void 0||Z===!0,se=G.dataReady,pe=I(v,ee);if(v.isDepthTexture)Me=b(v.format===zs,v.type),te&&(L?t.texStorage2D(n.TEXTURE_2D,1,Me,ee.width,ee.height):t.texImage2D(n.TEXTURE_2D,0,Me,ee.width,ee.height,0,he,Ie,null));else if(v.isDataTexture)if(He.length>0){L&&te&&t.texStorage2D(n.TEXTURE_2D,pe,Me,He[0].width,He[0].height);for(let K=0,Y=He.length;K<Y;K++)ce=He[K],L?se&&t.texSubImage2D(n.TEXTURE_2D,K,0,0,ce.width,ce.height,he,Ie,ce.data):t.texImage2D(n.TEXTURE_2D,K,Me,ce.width,ce.height,0,he,Ie,ce.data);v.generateMipmaps=!1}else L?(te&&t.texStorage2D(n.TEXTURE_2D,pe,Me,ee.width,ee.height),se&&tt(v,ee,he,Ie)):t.texImage2D(n.TEXTURE_2D,0,Me,ee.width,ee.height,0,he,Ie,ee.data);else if(v.isCompressedTexture)if(v.isCompressedArrayTexture){L&&te&&t.texStorage3D(n.TEXTURE_2D_ARRAY,pe,Me,He[0].width,He[0].height,ee.depth);for(let K=0,Y=He.length;K<Y;K++)if(ce=He[K],v.format!==gn)if(he!==null)if(L){if(se)if(v.layerUpdates.size>0){let ye=au(ce.width,ce.height,v.format,v.type);for(let Fe of v.layerUpdates){let ut=ce.data.subarray(Fe*ye/ce.data.BYTES_PER_ELEMENT,(Fe+1)*ye/ce.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,K,0,0,Fe,ce.width,ce.height,1,he,ut)}v.clearLayerUpdates()}else t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,K,0,0,0,ce.width,ce.height,ee.depth,he,ce.data)}else t.compressedTexImage3D(n.TEXTURE_2D_ARRAY,K,Me,ce.width,ce.height,ee.depth,0,ce.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else L?se&&t.texSubImage3D(n.TEXTURE_2D_ARRAY,K,0,0,0,ce.width,ce.height,ee.depth,he,Ie,ce.data):t.texImage3D(n.TEXTURE_2D_ARRAY,K,Me,ce.width,ce.height,ee.depth,0,he,Ie,ce.data)}else{L&&te&&t.texStorage2D(n.TEXTURE_2D,pe,Me,He[0].width,He[0].height);for(let K=0,Y=He.length;K<Y;K++)ce=He[K],v.format!==gn?he!==null?L?se&&t.compressedTexSubImage2D(n.TEXTURE_2D,K,0,0,ce.width,ce.height,he,ce.data):t.compressedTexImage2D(n.TEXTURE_2D,K,Me,ce.width,ce.height,0,ce.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):L?se&&t.texSubImage2D(n.TEXTURE_2D,K,0,0,ce.width,ce.height,he,Ie,ce.data):t.texImage2D(n.TEXTURE_2D,K,Me,ce.width,ce.height,0,he,Ie,ce.data)}else if(v.isDataArrayTexture)if(L){if(te&&t.texStorage3D(n.TEXTURE_2D_ARRAY,pe,Me,ee.width,ee.height,ee.depth),se)if(v.layerUpdates.size>0){let K=au(ee.width,ee.height,v.format,v.type);for(let Y of v.layerUpdates){let ye=ee.data.subarray(Y*K/ee.data.BYTES_PER_ELEMENT,(Y+1)*K/ee.data.BYTES_PER_ELEMENT);t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,Y,ee.width,ee.height,1,he,Ie,ye)}v.clearLayerUpdates()}else t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,ee.width,ee.height,ee.depth,he,Ie,ee.data)}else t.texImage3D(n.TEXTURE_2D_ARRAY,0,Me,ee.width,ee.height,ee.depth,0,he,Ie,ee.data);else if(v.isData3DTexture)L?(te&&t.texStorage3D(n.TEXTURE_3D,pe,Me,ee.width,ee.height,ee.depth),se&&t.texSubImage3D(n.TEXTURE_3D,0,0,0,0,ee.width,ee.height,ee.depth,he,Ie,ee.data)):t.texImage3D(n.TEXTURE_3D,0,Me,ee.width,ee.height,ee.depth,0,he,Ie,ee.data);else if(v.isFramebufferTexture){if(te)if(L)t.texStorage2D(n.TEXTURE_2D,pe,Me,ee.width,ee.height);else{let K=ee.width,Y=ee.height;for(let ye=0;ye<pe;ye++)t.texImage2D(n.TEXTURE_2D,ye,Me,K,Y,0,he,Ie,null),K>>=1,Y>>=1}}else if(He.length>0){if(L&&te){let K=bt(He[0]);t.texStorage2D(n.TEXTURE_2D,pe,Me,K.width,K.height)}for(let K=0,Y=He.length;K<Y;K++)ce=He[K],L?se&&t.texSubImage2D(n.TEXTURE_2D,K,0,0,he,Ie,ce):t.texImage2D(n.TEXTURE_2D,K,Me,he,Ie,ce);v.generateMipmaps=!1}else if(L){if(te){let K=bt(ee);t.texStorage2D(n.TEXTURE_2D,pe,Me,K.width,K.height)}se&&t.texSubImage2D(n.TEXTURE_2D,0,0,0,he,Ie,ee)}else t.texImage2D(n.TEXTURE_2D,0,Me,he,Ie,ee);m(v)&&p(X),Ee.__version=G.version,v.onUpdate&&v.onUpdate(v)}T.__version=v.version}function J(T,v,F){if(v.image.length!==6)return;let X=ct(T,v),Z=v.source;t.bindTexture(n.TEXTURE_CUBE_MAP,T.__webglTexture,n.TEXTURE0+F);let G=i.get(Z);if(Z.version!==G.__version||X===!0){t.activeTexture(n.TEXTURE0+F);let Ee=Ze.getPrimaries(Ze.workingColorSpace),ie=v.colorSpace===ti?null:Ze.getPrimaries(v.colorSpace),be=v.colorSpace===ti||Ee===ie?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,v.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,v.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,v.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,be);let Se=v.isCompressedTexture||v.image[0].isCompressedTexture,ee=v.image[0]&&v.image[0].isDataTexture,he=[];for(let Y=0;Y<6;Y++)!Se&&!ee?he[Y]=y(v.image[Y],!0,s.maxCubemapSize):he[Y]=ee?v.image[Y].image:v.image[Y],he[Y]=Ct(v,he[Y]);let Ie=he[0],Me=r.convert(v.format,v.colorSpace),ce=r.convert(v.type),He=E(v.internalFormat,Me,ce,v.colorSpace),L=v.isVideoTexture!==!0,te=G.__version===void 0||X===!0,se=Z.dataReady,pe=I(v,Ie);Xe(n.TEXTURE_CUBE_MAP,v);let K;if(Se){L&&te&&t.texStorage2D(n.TEXTURE_CUBE_MAP,pe,He,Ie.width,Ie.height);for(let Y=0;Y<6;Y++){K=he[Y].mipmaps;for(let ye=0;ye<K.length;ye++){let Fe=K[ye];v.format!==gn?Me!==null?L?se&&t.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Y,ye,0,0,Fe.width,Fe.height,Me,Fe.data):t.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Y,ye,He,Fe.width,Fe.height,0,Fe.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):L?se&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Y,ye,0,0,Fe.width,Fe.height,Me,ce,Fe.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Y,ye,He,Fe.width,Fe.height,0,Me,ce,Fe.data)}}}else{if(K=v.mipmaps,L&&te){K.length>0&&pe++;let Y=bt(he[0]);t.texStorage2D(n.TEXTURE_CUBE_MAP,pe,He,Y.width,Y.height)}for(let Y=0;Y<6;Y++)if(ee){L?se&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Y,0,0,0,he[Y].width,he[Y].height,Me,ce,he[Y].data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Y,0,He,he[Y].width,he[Y].height,0,Me,ce,he[Y].data);for(let ye=0;ye<K.length;ye++){let ut=K[ye].image[Y].image;L?se&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Y,ye+1,0,0,ut.width,ut.height,Me,ce,ut.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Y,ye+1,He,ut.width,ut.height,0,Me,ce,ut.data)}}else{L?se&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Y,0,0,0,Me,ce,he[Y]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Y,0,He,Me,ce,he[Y]);for(let ye=0;ye<K.length;ye++){let Fe=K[ye];L?se&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Y,ye+1,0,0,Me,ce,Fe.image[Y]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Y,ye+1,He,Me,ce,Fe.image[Y])}}}m(v)&&p(n.TEXTURE_CUBE_MAP),G.__version=Z.version,v.onUpdate&&v.onUpdate(v)}T.__version=v.version}function ge(T,v,F,X,Z,G){let Ee=r.convert(F.format,F.colorSpace),ie=r.convert(F.type),be=E(F.internalFormat,Ee,ie,F.colorSpace),Se=i.get(v),ee=i.get(F);if(ee.__renderTarget=v,!Se.__hasExternalTextures){let he=Math.max(1,v.width>>G),Ie=Math.max(1,v.height>>G);Z===n.TEXTURE_3D||Z===n.TEXTURE_2D_ARRAY?t.texImage3D(Z,G,be,he,Ie,v.depth,0,Ee,ie,null):t.texImage2D(Z,G,be,he,Ie,0,Ee,ie,null)}t.bindFramebuffer(n.FRAMEBUFFER,T),xe(v)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,X,Z,ee.__webglTexture,0,mt(v)):(Z===n.TEXTURE_2D||Z>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&Z<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,X,Z,ee.__webglTexture,G),t.bindFramebuffer(n.FRAMEBUFFER,null)}function Oe(T,v,F){if(n.bindRenderbuffer(n.RENDERBUFFER,T),v.depthBuffer){let X=v.depthTexture,Z=X&&X.isDepthTexture?X.type:null,G=b(v.stencilBuffer,Z),Ee=v.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,ie=mt(v);xe(v)?a.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,ie,G,v.width,v.height):F?n.renderbufferStorageMultisample(n.RENDERBUFFER,ie,G,v.width,v.height):n.renderbufferStorage(n.RENDERBUFFER,G,v.width,v.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,Ee,n.RENDERBUFFER,T)}else{let X=v.textures;for(let Z=0;Z<X.length;Z++){let G=X[Z],Ee=r.convert(G.format,G.colorSpace),ie=r.convert(G.type),be=E(G.internalFormat,Ee,ie,G.colorSpace),Se=mt(v);F&&xe(v)===!1?n.renderbufferStorageMultisample(n.RENDERBUFFER,Se,be,v.width,v.height):xe(v)?a.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,Se,be,v.width,v.height):n.renderbufferStorage(n.RENDERBUFFER,be,v.width,v.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function we(T,v){if(v&&v.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(n.FRAMEBUFFER,T),!(v.depthTexture&&v.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");let X=i.get(v.depthTexture);X.__renderTarget=v,(!X.__webglTexture||v.depthTexture.image.width!==v.width||v.depthTexture.image.height!==v.height)&&(v.depthTexture.image.width=v.width,v.depthTexture.image.height=v.height,v.depthTexture.needsUpdate=!0),q(v.depthTexture,0);let Z=X.__webglTexture,G=mt(v);if(v.depthTexture.format===Ms)xe(v)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,Z,0,G):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,Z,0);else if(v.depthTexture.format===zs)xe(v)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,Z,0,G):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,Z,0);else throw new Error("Unknown depthTexture format")}function Ye(T){let v=i.get(T),F=T.isWebGLCubeRenderTarget===!0;if(v.__boundDepthTexture!==T.depthTexture){let X=T.depthTexture;if(v.__depthDisposeCallback&&v.__depthDisposeCallback(),X){let Z=()=>{delete v.__boundDepthTexture,delete v.__depthDisposeCallback,X.removeEventListener("dispose",Z)};X.addEventListener("dispose",Z),v.__depthDisposeCallback=Z}v.__boundDepthTexture=X}if(T.depthTexture&&!v.__autoAllocateDepthBuffer){if(F)throw new Error("target.depthTexture not supported in Cube render targets");let X=T.texture.mipmaps;X&&X.length>0?we(v.__webglFramebuffer[0],T):we(v.__webglFramebuffer,T)}else if(F){v.__webglDepthbuffer=[];for(let X=0;X<6;X++)if(t.bindFramebuffer(n.FRAMEBUFFER,v.__webglFramebuffer[X]),v.__webglDepthbuffer[X]===void 0)v.__webglDepthbuffer[X]=n.createRenderbuffer(),Oe(v.__webglDepthbuffer[X],T,!1);else{let Z=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,G=v.__webglDepthbuffer[X];n.bindRenderbuffer(n.RENDERBUFFER,G),n.framebufferRenderbuffer(n.FRAMEBUFFER,Z,n.RENDERBUFFER,G)}}else{let X=T.texture.mipmaps;if(X&&X.length>0?t.bindFramebuffer(n.FRAMEBUFFER,v.__webglFramebuffer[0]):t.bindFramebuffer(n.FRAMEBUFFER,v.__webglFramebuffer),v.__webglDepthbuffer===void 0)v.__webglDepthbuffer=n.createRenderbuffer(),Oe(v.__webglDepthbuffer,T,!1);else{let Z=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,G=v.__webglDepthbuffer;n.bindRenderbuffer(n.RENDERBUFFER,G),n.framebufferRenderbuffer(n.FRAMEBUFFER,Z,n.RENDERBUFFER,G)}}t.bindFramebuffer(n.FRAMEBUFFER,null)}function Ot(T,v,F){let X=i.get(T);v!==void 0&&ge(X.__webglFramebuffer,T,T.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),F!==void 0&&Ye(T)}function C(T){let v=T.texture,F=i.get(T),X=i.get(v);T.addEventListener("dispose",P);let Z=T.textures,G=T.isWebGLCubeRenderTarget===!0,Ee=Z.length>1;if(Ee||(X.__webglTexture===void 0&&(X.__webglTexture=n.createTexture()),X.__version=v.version,o.memory.textures++),G){F.__webglFramebuffer=[];for(let ie=0;ie<6;ie++)if(v.mipmaps&&v.mipmaps.length>0){F.__webglFramebuffer[ie]=[];for(let be=0;be<v.mipmaps.length;be++)F.__webglFramebuffer[ie][be]=n.createFramebuffer()}else F.__webglFramebuffer[ie]=n.createFramebuffer()}else{if(v.mipmaps&&v.mipmaps.length>0){F.__webglFramebuffer=[];for(let ie=0;ie<v.mipmaps.length;ie++)F.__webglFramebuffer[ie]=n.createFramebuffer()}else F.__webglFramebuffer=n.createFramebuffer();if(Ee)for(let ie=0,be=Z.length;ie<be;ie++){let Se=i.get(Z[ie]);Se.__webglTexture===void 0&&(Se.__webglTexture=n.createTexture(),o.memory.textures++)}if(T.samples>0&&xe(T)===!1){F.__webglMultisampledFramebuffer=n.createFramebuffer(),F.__webglColorRenderbuffer=[],t.bindFramebuffer(n.FRAMEBUFFER,F.__webglMultisampledFramebuffer);for(let ie=0;ie<Z.length;ie++){let be=Z[ie];F.__webglColorRenderbuffer[ie]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,F.__webglColorRenderbuffer[ie]);let Se=r.convert(be.format,be.colorSpace),ee=r.convert(be.type),he=E(be.internalFormat,Se,ee,be.colorSpace,T.isXRRenderTarget===!0),Ie=mt(T);n.renderbufferStorageMultisample(n.RENDERBUFFER,Ie,he,T.width,T.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+ie,n.RENDERBUFFER,F.__webglColorRenderbuffer[ie])}n.bindRenderbuffer(n.RENDERBUFFER,null),T.depthBuffer&&(F.__webglDepthRenderbuffer=n.createRenderbuffer(),Oe(F.__webglDepthRenderbuffer,T,!0)),t.bindFramebuffer(n.FRAMEBUFFER,null)}}if(G){t.bindTexture(n.TEXTURE_CUBE_MAP,X.__webglTexture),Xe(n.TEXTURE_CUBE_MAP,v);for(let ie=0;ie<6;ie++)if(v.mipmaps&&v.mipmaps.length>0)for(let be=0;be<v.mipmaps.length;be++)ge(F.__webglFramebuffer[ie][be],T,v,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+ie,be);else ge(F.__webglFramebuffer[ie],T,v,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+ie,0);m(v)&&p(n.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(Ee){for(let ie=0,be=Z.length;ie<be;ie++){let Se=Z[ie],ee=i.get(Se),he=n.TEXTURE_2D;(T.isWebGL3DRenderTarget||T.isWebGLArrayRenderTarget)&&(he=T.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(he,ee.__webglTexture),Xe(he,Se),ge(F.__webglFramebuffer,T,Se,n.COLOR_ATTACHMENT0+ie,he,0),m(Se)&&p(he)}t.unbindTexture()}else{let ie=n.TEXTURE_2D;if((T.isWebGL3DRenderTarget||T.isWebGLArrayRenderTarget)&&(ie=T.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(ie,X.__webglTexture),Xe(ie,v),v.mipmaps&&v.mipmaps.length>0)for(let be=0;be<v.mipmaps.length;be++)ge(F.__webglFramebuffer[be],T,v,n.COLOR_ATTACHMENT0,ie,be);else ge(F.__webglFramebuffer,T,v,n.COLOR_ATTACHMENT0,ie,0);m(v)&&p(ie),t.unbindTexture()}T.depthBuffer&&Ye(T)}function pt(T){let v=T.textures;for(let F=0,X=v.length;F<X;F++){let Z=v[F];if(m(Z)){let G=w(T),Ee=i.get(Z).__webglTexture;t.bindTexture(G,Ee),p(G),t.unbindTexture()}}}let Be=[],Pe=[];function ve(T){if(T.samples>0){if(xe(T)===!1){let v=T.textures,F=T.width,X=T.height,Z=n.COLOR_BUFFER_BIT,G=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,Ee=i.get(T),ie=v.length>1;if(ie)for(let Se=0;Se<v.length;Se++)t.bindFramebuffer(n.FRAMEBUFFER,Ee.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Se,n.RENDERBUFFER,null),t.bindFramebuffer(n.FRAMEBUFFER,Ee.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+Se,n.TEXTURE_2D,null,0);t.bindFramebuffer(n.READ_FRAMEBUFFER,Ee.__webglMultisampledFramebuffer);let be=T.texture.mipmaps;be&&be.length>0?t.bindFramebuffer(n.DRAW_FRAMEBUFFER,Ee.__webglFramebuffer[0]):t.bindFramebuffer(n.DRAW_FRAMEBUFFER,Ee.__webglFramebuffer);for(let Se=0;Se<v.length;Se++){if(T.resolveDepthBuffer&&(T.depthBuffer&&(Z|=n.DEPTH_BUFFER_BIT),T.stencilBuffer&&T.resolveStencilBuffer&&(Z|=n.STENCIL_BUFFER_BIT)),ie){n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,Ee.__webglColorRenderbuffer[Se]);let ee=i.get(v[Se]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,ee,0)}n.blitFramebuffer(0,0,F,X,0,0,F,X,Z,n.NEAREST),l===!0&&(Be.length=0,Pe.length=0,Be.push(n.COLOR_ATTACHMENT0+Se),T.depthBuffer&&T.resolveDepthBuffer===!1&&(Be.push(G),Pe.push(G),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,Pe)),n.invalidateFramebuffer(n.READ_FRAMEBUFFER,Be))}if(t.bindFramebuffer(n.READ_FRAMEBUFFER,null),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),ie)for(let Se=0;Se<v.length;Se++){t.bindFramebuffer(n.FRAMEBUFFER,Ee.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Se,n.RENDERBUFFER,Ee.__webglColorRenderbuffer[Se]);let ee=i.get(v[Se]).__webglTexture;t.bindFramebuffer(n.FRAMEBUFFER,Ee.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+Se,n.TEXTURE_2D,ee,0)}t.bindFramebuffer(n.DRAW_FRAMEBUFFER,Ee.__webglMultisampledFramebuffer)}else if(T.depthBuffer&&T.resolveDepthBuffer===!1&&l){let v=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[v])}}}function mt(T){return Math.min(s.maxSamples,T.samples)}function xe(T){let v=i.get(T);return T.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&v.__useRenderToTexture!==!1}function Ge(T){let v=o.render.frame;u.get(T)!==v&&(u.set(T,v),T.update())}function Ct(T,v){let F=T.colorSpace,X=T.format,Z=T.type;return T.isCompressedTexture===!0||T.isVideoTexture===!0||F!==Gi&&F!==ti&&(Ze.getTransfer(F)===st?(X!==gn||Z!==wn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",F)),v}function bt(T){return typeof HTMLImageElement<"u"&&T instanceof HTMLImageElement?(c.width=T.naturalWidth||T.width,c.height=T.naturalHeight||T.height):typeof VideoFrame<"u"&&T instanceof VideoFrame?(c.width=T.displayWidth,c.height=T.displayHeight):(c.width=T.width,c.height=T.height),c}this.allocateTextureUnit=H,this.resetTextureUnits=B,this.setTexture2D=q,this.setTexture2DArray=$,this.setTexture3D=ne,this.setTextureCube=V,this.rebindTextures=Ot,this.setupRenderTarget=C,this.updateRenderTargetMipmap=pt,this.updateMultisampleRenderTarget=ve,this.setupDepthRenderbuffer=Ye,this.setupFrameBufferTexture=ge,this.useMultisampledRTT=xe}function ax(n,e){function t(i,s=ti){let r,o=Ze.getTransfer(s);if(i===wn)return n.UNSIGNED_BYTE;if(i===ka)return n.UNSIGNED_SHORT_4_4_4_4;if(i===za)return n.UNSIGNED_SHORT_5_5_5_1;if(i===qc)return n.UNSIGNED_INT_5_9_9_9_REV;if(i===jc)return n.UNSIGNED_INT_10F_11F_11F_REV;if(i===$c)return n.BYTE;if(i===Xc)return n.SHORT;if(i===Fs)return n.UNSIGNED_SHORT;if(i===Ba)return n.INT;if(i===Si)return n.UNSIGNED_INT;if(i===Tn)return n.FLOAT;if(i===Bs)return n.HALF_FLOAT;if(i===Yc)return n.ALPHA;if(i===Zc)return n.RGB;if(i===gn)return n.RGBA;if(i===Ms)return n.DEPTH_COMPONENT;if(i===zs)return n.DEPTH_STENCIL;if(i===Ha)return n.RED;if(i===Va)return n.RED_INTEGER;if(i===Jc)return n.RG;if(i===Ga)return n.RG_INTEGER;if(i===Wa)return n.RGBA_INTEGER;if(i===no||i===io||i===so||i===ro)if(o===st)if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(i===no)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===io)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===so)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===ro)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=e.get("WEBGL_compressed_texture_s3tc"),r!==null){if(i===no)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===io)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===so)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===ro)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===$a||i===Xa||i===qa||i===ja)if(r=e.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(i===$a)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===Xa)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===qa)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===ja)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===Ya||i===Za||i===Ja)if(r=e.get("WEBGL_compressed_texture_etc"),r!==null){if(i===Ya||i===Za)return o===st?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(i===Ja)return o===st?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(i===Ka||i===Qa||i===el||i===tl||i===nl||i===il||i===sl||i===rl||i===ol||i===al||i===ll||i===cl||i===ul||i===hl)if(r=e.get("WEBGL_compressed_texture_astc"),r!==null){if(i===Ka)return o===st?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===Qa)return o===st?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===el)return o===st?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===tl)return o===st?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===nl)return o===st?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===il)return o===st?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===sl)return o===st?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===rl)return o===st?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===ol)return o===st?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===al)return o===st?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===ll)return o===st?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===cl)return o===st?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===ul)return o===st?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===hl)return o===st?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===dl||i===fl||i===pl)if(r=e.get("EXT_texture_compression_bptc"),r!==null){if(i===dl)return o===st?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===fl)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===pl)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===ml||i===gl||i===_l||i===yl)if(r=e.get("EXT_texture_compression_rgtc"),r!==null){if(i===ml)return r.COMPRESSED_RED_RGTC1_EXT;if(i===gl)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===_l)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===yl)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===ks?n.UNSIGNED_INT_24_8:n[i]!==void 0?n[i]:null}return{convert:t}}var lx=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,cx=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,xu=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let i=new Hr(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=i}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,i=new En({vertexShader:lx,fragmentShader:cx,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new Je(new Kn(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},bu=class extends Cn{constructor(e,t){super();let i=this,s=null,r=1,o=null,a="local-floor",l=1,c=null,u=null,d=null,h=null,f=null,g=null,y=typeof XRWebGLBinding<"u",m=new xu,p={},w=t.getContextAttributes(),E=null,b=null,I=[],A=[],P=new re,N=null,M=new Nt;M.viewport=new it;let S=new Nt;S.viewport=new it;let D=[M,S],B=new Ta,H=null,W=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(j){let J=I[j];return J===void 0&&(J=new As,I[j]=J),J.getTargetRaySpace()},this.getControllerGrip=function(j){let J=I[j];return J===void 0&&(J=new As,I[j]=J),J.getGripSpace()},this.getHand=function(j){let J=I[j];return J===void 0&&(J=new As,I[j]=J),J.getHandSpace()};function q(j){let J=A.indexOf(j.inputSource);if(J===-1)return;let ge=I[J];ge!==void 0&&(ge.update(j.inputSource,j.frame,c||o),ge.dispatchEvent({type:j.type,data:j.inputSource}))}function $(){s.removeEventListener("select",q),s.removeEventListener("selectstart",q),s.removeEventListener("selectend",q),s.removeEventListener("squeeze",q),s.removeEventListener("squeezestart",q),s.removeEventListener("squeezeend",q),s.removeEventListener("end",$),s.removeEventListener("inputsourceschange",ne);for(let j=0;j<I.length;j++){let J=A[j];J!==null&&(A[j]=null,I[j].disconnect(J))}H=null,W=null,m.reset();for(let j in p)delete p[j];e.setRenderTarget(E),f=null,h=null,d=null,s=null,b=null,tt.stop(),i.isPresenting=!1,e.setPixelRatio(N),e.setSize(P.width,P.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(j){r=j,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(j){a=j,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||o},this.setReferenceSpace=function(j){c=j},this.getBaseLayer=function(){return h!==null?h:f},this.getBinding=function(){return d===null&&y&&(d=new XRWebGLBinding(s,t)),d},this.getFrame=function(){return g},this.getSession=function(){return s},this.setSession=async function(j){if(s=j,s!==null){if(E=e.getRenderTarget(),s.addEventListener("select",q),s.addEventListener("selectstart",q),s.addEventListener("selectend",q),s.addEventListener("squeeze",q),s.addEventListener("squeezestart",q),s.addEventListener("squeezeend",q),s.addEventListener("end",$),s.addEventListener("inputsourceschange",ne),w.xrCompatible!==!0&&await t.makeXRCompatible(),N=e.getPixelRatio(),e.getSize(P),y&&"createProjectionLayer"in XRWebGLBinding.prototype){let ge=null,Oe=null,we=null;w.depth&&(we=w.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,ge=w.stencil?zs:Ms,Oe=w.stencil?ks:Si);let Ye={colorFormat:t.RGBA8,depthFormat:we,scaleFactor:r};d=this.getBinding(),h=d.createProjectionLayer(Ye),s.updateRenderState({layers:[h]}),e.setPixelRatio(1),e.setSize(h.textureWidth,h.textureHeight,!1),b=new In(h.textureWidth,h.textureHeight,{format:gn,type:wn,depthTexture:new zr(h.textureWidth,h.textureHeight,Oe,void 0,void 0,void 0,void 0,void 0,void 0,ge),stencilBuffer:w.stencil,colorSpace:e.outputColorSpace,samples:w.antialias?4:0,resolveDepthBuffer:h.ignoreDepthValues===!1,resolveStencilBuffer:h.ignoreDepthValues===!1})}else{let ge={antialias:w.antialias,alpha:!0,depth:w.depth,stencil:w.stencil,framebufferScaleFactor:r};f=new XRWebGLLayer(s,t,ge),s.updateRenderState({baseLayer:f}),e.setPixelRatio(1),e.setSize(f.framebufferWidth,f.framebufferHeight,!1),b=new In(f.framebufferWidth,f.framebufferHeight,{format:gn,type:wn,colorSpace:e.outputColorSpace,stencilBuffer:w.stencil,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1})}b.isXRRenderTarget=!0,this.setFoveation(l),c=null,o=await s.requestReferenceSpace(a),tt.setContext(s),tt.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return m.getDepthTexture()};function ne(j){for(let J=0;J<j.removed.length;J++){let ge=j.removed[J],Oe=A.indexOf(ge);Oe>=0&&(A[Oe]=null,I[Oe].disconnect(ge))}for(let J=0;J<j.added.length;J++){let ge=j.added[J],Oe=A.indexOf(ge);if(Oe===-1){for(let Ye=0;Ye<I.length;Ye++)if(Ye>=A.length){A.push(ge),Oe=Ye;break}else if(A[Ye]===null){A[Ye]=ge,Oe=Ye;break}if(Oe===-1)break}let we=I[Oe];we&&we.connect(ge)}}let V=new R,le=new R;function de(j,J,ge){V.setFromMatrixPosition(J.matrixWorld),le.setFromMatrixPosition(ge.matrixWorld);let Oe=V.distanceTo(le),we=J.projectionMatrix.elements,Ye=ge.projectionMatrix.elements,Ot=we[14]/(we[10]-1),C=we[14]/(we[10]+1),pt=(we[9]+1)/we[5],Be=(we[9]-1)/we[5],Pe=(we[8]-1)/we[0],ve=(Ye[8]+1)/Ye[0],mt=Ot*Pe,xe=Ot*ve,Ge=Oe/(-Pe+ve),Ct=Ge*-Pe;if(J.matrixWorld.decompose(j.position,j.quaternion,j.scale),j.translateX(Ct),j.translateZ(Ge),j.matrixWorld.compose(j.position,j.quaternion,j.scale),j.matrixWorldInverse.copy(j.matrixWorld).invert(),we[10]===-1)j.projectionMatrix.copy(J.projectionMatrix),j.projectionMatrixInverse.copy(J.projectionMatrixInverse);else{let bt=Ot+Ge,T=C+Ge,v=mt-Ct,F=xe+(Oe-Ct),X=pt*C/T*bt,Z=Be*C/T*bt;j.projectionMatrix.makePerspective(v,F,X,Z,bt,T),j.projectionMatrixInverse.copy(j.projectionMatrix).invert()}}function Te(j,J){J===null?j.matrixWorld.copy(j.matrix):j.matrixWorld.multiplyMatrices(J.matrixWorld,j.matrix),j.matrixWorldInverse.copy(j.matrixWorld).invert()}this.updateCamera=function(j){if(s===null)return;let J=j.near,ge=j.far;m.texture!==null&&(m.depthNear>0&&(J=m.depthNear),m.depthFar>0&&(ge=m.depthFar)),B.near=S.near=M.near=J,B.far=S.far=M.far=ge,(H!==B.near||W!==B.far)&&(s.updateRenderState({depthNear:B.near,depthFar:B.far}),H=B.near,W=B.far),B.layers.mask=j.layers.mask|6,M.layers.mask=B.layers.mask&3,S.layers.mask=B.layers.mask&5;let Oe=j.parent,we=B.cameras;Te(B,Oe);for(let Ye=0;Ye<we.length;Ye++)Te(we[Ye],Oe);we.length===2?de(B,M,S):B.projectionMatrix.copy(M.projectionMatrix),Xe(j,B,Oe)};function Xe(j,J,ge){ge===null?j.matrix.copy(J.matrixWorld):(j.matrix.copy(ge.matrixWorld),j.matrix.invert(),j.matrix.multiply(J.matrixWorld)),j.matrix.decompose(j.position,j.quaternion,j.scale),j.updateMatrixWorld(!0),j.projectionMatrix.copy(J.projectionMatrix),j.projectionMatrixInverse.copy(J.projectionMatrixInverse),j.isPerspectiveCamera&&(j.fov=Es*2*Math.atan(1/j.projectionMatrix.elements[5]),j.zoom=1)}this.getCamera=function(){return B},this.getFoveation=function(){if(!(h===null&&f===null))return l},this.setFoveation=function(j){l=j,h!==null&&(h.fixedFoveation=j),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=j)},this.hasDepthSensing=function(){return m.texture!==null},this.getDepthSensingMesh=function(){return m.getMesh(B)},this.getCameraTexture=function(j){return p[j]};let ct=null;function ft(j,J){if(u=J.getViewerPose(c||o),g=J,u!==null){let ge=u.views;f!==null&&(e.setRenderTargetFramebuffer(b,f.framebuffer),e.setRenderTarget(b));let Oe=!1;ge.length!==B.cameras.length&&(B.cameras.length=0,Oe=!0);for(let C=0;C<ge.length;C++){let pt=ge[C],Be=null;if(f!==null)Be=f.getViewport(pt);else{let ve=d.getViewSubImage(h,pt);Be=ve.viewport,C===0&&(e.setRenderTargetTextures(b,ve.colorTexture,ve.depthStencilTexture),e.setRenderTarget(b))}let Pe=D[C];Pe===void 0&&(Pe=new Nt,Pe.layers.enable(C),Pe.viewport=new it,D[C]=Pe),Pe.matrix.fromArray(pt.transform.matrix),Pe.matrix.decompose(Pe.position,Pe.quaternion,Pe.scale),Pe.projectionMatrix.fromArray(pt.projectionMatrix),Pe.projectionMatrixInverse.copy(Pe.projectionMatrix).invert(),Pe.viewport.set(Be.x,Be.y,Be.width,Be.height),C===0&&(B.matrix.copy(Pe.matrix),B.matrix.decompose(B.position,B.quaternion,B.scale)),Oe===!0&&B.cameras.push(Pe)}let we=s.enabledFeatures;if(we&&we.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&y){d=i.getBinding();let C=d.getDepthInformation(ge[0]);C&&C.isValid&&C.texture&&m.init(C,s.renderState)}if(we&&we.includes("camera-access")&&y){e.state.unbindTexture(),d=i.getBinding();for(let C=0;C<ge.length;C++){let pt=ge[C].camera;if(pt){let Be=p[pt];Be||(Be=new Hr,p[pt]=Be);let Pe=d.getCameraImage(pt);Be.sourceTexture=Pe}}}}for(let ge=0;ge<I.length;ge++){let Oe=A[ge],we=I[ge];Oe!==null&&we!==void 0&&we.update(Oe,J,c||o)}ct&&ct(j,J),J.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:J}),g=null}let tt=new df;tt.setAnimationLoop(ft),this.setAnimationLoop=function(j){ct=j},this.dispose=function(){}}},Ji=new Mn,ux=new ot;function hx(n,e){function t(m,p){m.matrixAutoUpdate===!0&&m.updateMatrix(),p.value.copy(m.matrix)}function i(m,p){p.color.getRGB(m.fogColor.value,iu(n)),p.isFog?(m.fogNear.value=p.near,m.fogFar.value=p.far):p.isFogExp2&&(m.fogDensity.value=p.density)}function s(m,p,w,E,b){p.isMeshBasicMaterial||p.isMeshLambertMaterial?r(m,p):p.isMeshToonMaterial?(r(m,p),d(m,p)):p.isMeshPhongMaterial?(r(m,p),u(m,p)):p.isMeshStandardMaterial?(r(m,p),h(m,p),p.isMeshPhysicalMaterial&&f(m,p,b)):p.isMeshMatcapMaterial?(r(m,p),g(m,p)):p.isMeshDepthMaterial?r(m,p):p.isMeshDistanceMaterial?(r(m,p),y(m,p)):p.isMeshNormalMaterial?r(m,p):p.isLineBasicMaterial?(o(m,p),p.isLineDashedMaterial&&a(m,p)):p.isPointsMaterial?l(m,p,w,E):p.isSpriteMaterial?c(m,p):p.isShadowMaterial?(m.color.value.copy(p.color),m.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function r(m,p){m.opacity.value=p.opacity,p.color&&m.diffuse.value.copy(p.color),p.emissive&&m.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(m.map.value=p.map,t(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.bumpMap&&(m.bumpMap.value=p.bumpMap,t(p.bumpMap,m.bumpMapTransform),m.bumpScale.value=p.bumpScale,p.side===Wt&&(m.bumpScale.value*=-1)),p.normalMap&&(m.normalMap.value=p.normalMap,t(p.normalMap,m.normalMapTransform),m.normalScale.value.copy(p.normalScale),p.side===Wt&&m.normalScale.value.negate()),p.displacementMap&&(m.displacementMap.value=p.displacementMap,t(p.displacementMap,m.displacementMapTransform),m.displacementScale.value=p.displacementScale,m.displacementBias.value=p.displacementBias),p.emissiveMap&&(m.emissiveMap.value=p.emissiveMap,t(p.emissiveMap,m.emissiveMapTransform)),p.specularMap&&(m.specularMap.value=p.specularMap,t(p.specularMap,m.specularMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest);let w=e.get(p),E=w.envMap,b=w.envMapRotation;E&&(m.envMap.value=E,Ji.copy(b),Ji.x*=-1,Ji.y*=-1,Ji.z*=-1,E.isCubeTexture&&E.isRenderTargetTexture===!1&&(Ji.y*=-1,Ji.z*=-1),m.envMapRotation.value.setFromMatrix4(ux.makeRotationFromEuler(Ji)),m.flipEnvMap.value=E.isCubeTexture&&E.isRenderTargetTexture===!1?-1:1,m.reflectivity.value=p.reflectivity,m.ior.value=p.ior,m.refractionRatio.value=p.refractionRatio),p.lightMap&&(m.lightMap.value=p.lightMap,m.lightMapIntensity.value=p.lightMapIntensity,t(p.lightMap,m.lightMapTransform)),p.aoMap&&(m.aoMap.value=p.aoMap,m.aoMapIntensity.value=p.aoMapIntensity,t(p.aoMap,m.aoMapTransform))}function o(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,p.map&&(m.map.value=p.map,t(p.map,m.mapTransform))}function a(m,p){m.dashSize.value=p.dashSize,m.totalSize.value=p.dashSize+p.gapSize,m.scale.value=p.scale}function l(m,p,w,E){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.size.value=p.size*w,m.scale.value=E*.5,p.map&&(m.map.value=p.map,t(p.map,m.uvTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function c(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.rotation.value=p.rotation,p.map&&(m.map.value=p.map,t(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function u(m,p){m.specular.value.copy(p.specular),m.shininess.value=Math.max(p.shininess,1e-4)}function d(m,p){p.gradientMap&&(m.gradientMap.value=p.gradientMap)}function h(m,p){m.metalness.value=p.metalness,p.metalnessMap&&(m.metalnessMap.value=p.metalnessMap,t(p.metalnessMap,m.metalnessMapTransform)),m.roughness.value=p.roughness,p.roughnessMap&&(m.roughnessMap.value=p.roughnessMap,t(p.roughnessMap,m.roughnessMapTransform)),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)}function f(m,p,w){m.ior.value=p.ior,p.sheen>0&&(m.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),m.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(m.sheenColorMap.value=p.sheenColorMap,t(p.sheenColorMap,m.sheenColorMapTransform)),p.sheenRoughnessMap&&(m.sheenRoughnessMap.value=p.sheenRoughnessMap,t(p.sheenRoughnessMap,m.sheenRoughnessMapTransform))),p.clearcoat>0&&(m.clearcoat.value=p.clearcoat,m.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(m.clearcoatMap.value=p.clearcoatMap,t(p.clearcoatMap,m.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,t(p.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(m.clearcoatNormalMap.value=p.clearcoatNormalMap,t(p.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===Wt&&m.clearcoatNormalScale.value.negate())),p.dispersion>0&&(m.dispersion.value=p.dispersion),p.iridescence>0&&(m.iridescence.value=p.iridescence,m.iridescenceIOR.value=p.iridescenceIOR,m.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(m.iridescenceMap.value=p.iridescenceMap,t(p.iridescenceMap,m.iridescenceMapTransform)),p.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=p.iridescenceThicknessMap,t(p.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),p.transmission>0&&(m.transmission.value=p.transmission,m.transmissionSamplerMap.value=w.texture,m.transmissionSamplerSize.value.set(w.width,w.height),p.transmissionMap&&(m.transmissionMap.value=p.transmissionMap,t(p.transmissionMap,m.transmissionMapTransform)),m.thickness.value=p.thickness,p.thicknessMap&&(m.thicknessMap.value=p.thicknessMap,t(p.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=p.attenuationDistance,m.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(m.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(m.anisotropyMap.value=p.anisotropyMap,t(p.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=p.specularIntensity,m.specularColor.value.copy(p.specularColor),p.specularColorMap&&(m.specularColorMap.value=p.specularColorMap,t(p.specularColorMap,m.specularColorMapTransform)),p.specularIntensityMap&&(m.specularIntensityMap.value=p.specularIntensityMap,t(p.specularIntensityMap,m.specularIntensityMapTransform))}function g(m,p){p.matcap&&(m.matcap.value=p.matcap)}function y(m,p){let w=e.get(p).light;m.referencePosition.value.setFromMatrixPosition(w.matrixWorld),m.nearDistance.value=w.shadow.camera.near,m.farDistance.value=w.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:s}}function dx(n,e,t,i){let s={},r={},o=[],a=n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS);function l(w,E){let b=E.program;i.uniformBlockBinding(w,b)}function c(w,E){let b=s[w.id];b===void 0&&(g(w),b=u(w),s[w.id]=b,w.addEventListener("dispose",m));let I=E.program;i.updateUBOMapping(w,I);let A=e.render.frame;r[w.id]!==A&&(h(w),r[w.id]=A)}function u(w){let E=d();w.__bindingPointIndex=E;let b=n.createBuffer(),I=w.__size,A=w.usage;return n.bindBuffer(n.UNIFORM_BUFFER,b),n.bufferData(n.UNIFORM_BUFFER,I,A),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,E,b),b}function d(){for(let w=0;w<a;w++)if(o.indexOf(w)===-1)return o.push(w),w;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function h(w){let E=s[w.id],b=w.uniforms,I=w.__cache;n.bindBuffer(n.UNIFORM_BUFFER,E);for(let A=0,P=b.length;A<P;A++){let N=Array.isArray(b[A])?b[A]:[b[A]];for(let M=0,S=N.length;M<S;M++){let D=N[M];if(f(D,A,M,I)===!0){let B=D.__offset,H=Array.isArray(D.value)?D.value:[D.value],W=0;for(let q=0;q<H.length;q++){let $=H[q],ne=y($);typeof $=="number"||typeof $=="boolean"?(D.__data[0]=$,n.bufferSubData(n.UNIFORM_BUFFER,B+W,D.__data)):$.isMatrix3?(D.__data[0]=$.elements[0],D.__data[1]=$.elements[1],D.__data[2]=$.elements[2],D.__data[3]=0,D.__data[4]=$.elements[3],D.__data[5]=$.elements[4],D.__data[6]=$.elements[5],D.__data[7]=0,D.__data[8]=$.elements[6],D.__data[9]=$.elements[7],D.__data[10]=$.elements[8],D.__data[11]=0):($.toArray(D.__data,W),W+=ne.storage/Float32Array.BYTES_PER_ELEMENT)}n.bufferSubData(n.UNIFORM_BUFFER,B,D.__data)}}}n.bindBuffer(n.UNIFORM_BUFFER,null)}function f(w,E,b,I){let A=w.value,P=E+"_"+b;if(I[P]===void 0)return typeof A=="number"||typeof A=="boolean"?I[P]=A:I[P]=A.clone(),!0;{let N=I[P];if(typeof A=="number"||typeof A=="boolean"){if(N!==A)return I[P]=A,!0}else if(N.equals(A)===!1)return N.copy(A),!0}return!1}function g(w){let E=w.uniforms,b=0,I=16;for(let P=0,N=E.length;P<N;P++){let M=Array.isArray(E[P])?E[P]:[E[P]];for(let S=0,D=M.length;S<D;S++){let B=M[S],H=Array.isArray(B.value)?B.value:[B.value];for(let W=0,q=H.length;W<q;W++){let $=H[W],ne=y($),V=b%I,le=V%ne.boundary,de=V+le;b+=le,de!==0&&I-de<ne.storage&&(b+=I-de),B.__data=new Float32Array(ne.storage/Float32Array.BYTES_PER_ELEMENT),B.__offset=b,b+=ne.storage}}}let A=b%I;return A>0&&(b+=I-A),w.__size=b,w.__cache={},this}function y(w){let E={boundary:0,storage:0};return typeof w=="number"||typeof w=="boolean"?(E.boundary=4,E.storage=4):w.isVector2?(E.boundary=8,E.storage=8):w.isVector3||w.isColor?(E.boundary=16,E.storage=12):w.isVector4?(E.boundary=16,E.storage=16):w.isMatrix3?(E.boundary=48,E.storage=48):w.isMatrix4?(E.boundary=64,E.storage=64):w.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",w),E}function m(w){let E=w.target;E.removeEventListener("dispose",m);let b=o.indexOf(E.__bindingPointIndex);o.splice(b,1),n.deleteBuffer(s[E.id]),delete s[E.id],delete r[E.id]}function p(){for(let w in s)n.deleteBuffer(s[w]);o=[],s={},r={}}return{bind:l,update:c,dispose:p}}var Ml=class{constructor(e={}){let{canvas:t=Fd(),context:i=null,depth:s=!0,stencil:r=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:d=!1,reversedDepthBuffer:h=!1}=e;this.isWebGLRenderer=!0;let f;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");f=i.getContextAttributes().alpha}else f=o;let g=new Uint32Array(4),y=new Int32Array(4),m=null,p=null,w=[],E=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=ei,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let b=this,I=!1;this._outputColorSpace=Vt;let A=0,P=0,N=null,M=-1,S=null,D=new it,B=new it,H=null,W=new De(0),q=0,$=t.width,ne=t.height,V=1,le=null,de=null,Te=new it(0,0,$,ne),Xe=new it(0,0,$,ne),ct=!1,ft=new Rs,tt=!1,j=!1,J=new ot,ge=new R,Oe=new it,we={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},Ye=!1;function Ot(){return N===null?V:1}let C=i;function pt(x,U){return t.getContext(x,U)}try{let x={alpha:!0,depth:s,stencil:r,antialias:a,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:u,failIfMajorPerformanceCaveat:d};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${"180"}`),t.addEventListener("webglcontextlost",se,!1),t.addEventListener("webglcontextrestored",pe,!1),t.addEventListener("webglcontextcreationerror",K,!1),C===null){let U="webgl2";if(C=pt(U,x),C===null)throw pt(U)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(x){throw console.error("THREE.WebGLRenderer: "+x.message),x}let Be,Pe,ve,mt,xe,Ge,Ct,bt,T,v,F,X,Z,G,Ee,ie,be,Se,ee,he,Ie,Me,ce,He;function L(){Be=new Iy(C),Be.init(),Me=new ax(C,Be),Pe=new My(C,Be,e,Me),ve=new rx(C,Be),Pe.reversedDepthBuffer&&h&&ve.buffers.depth.setReversed(!0),mt=new Dy(C),xe=new Xv,Ge=new ox(C,Be,ve,xe,Pe,Me,mt),Ct=new wy(b),bt=new Cy(b),T=new km(C),ce=new by(C,T),v=new Py(C,T,mt,ce),F=new Uy(C,v,T,mt),ee=new Ny(C,Pe,Ge),ie=new Ey(xe),X=new $v(b,Ct,bt,Be,Pe,ce,ie),Z=new hx(b,xe),G=new jv,Ee=new ex(Be),Se=new xy(b,Ct,bt,ve,F,f,l),be=new ix(b,F,Pe),He=new dx(C,mt,Pe,ve),he=new Sy(C,Be,mt),Ie=new Ly(C,Be,mt),mt.programs=X.programs,b.capabilities=Pe,b.extensions=Be,b.properties=xe,b.renderLists=G,b.shadowMap=be,b.state=ve,b.info=mt}L();let te=new bu(b,C);this.xr=te,this.getContext=function(){return C},this.getContextAttributes=function(){return C.getContextAttributes()},this.forceContextLoss=function(){let x=Be.get("WEBGL_lose_context");x&&x.loseContext()},this.forceContextRestore=function(){let x=Be.get("WEBGL_lose_context");x&&x.restoreContext()},this.getPixelRatio=function(){return V},this.setPixelRatio=function(x){x!==void 0&&(V=x,this.setSize($,ne,!1))},this.getSize=function(x){return x.set($,ne)},this.setSize=function(x,U,k=!0){if(te.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}$=x,ne=U,t.width=Math.floor(x*V),t.height=Math.floor(U*V),k===!0&&(t.style.width=x+"px",t.style.height=U+"px"),this.setViewport(0,0,x,U)},this.getDrawingBufferSize=function(x){return x.set($*V,ne*V).floor()},this.setDrawingBufferSize=function(x,U,k){$=x,ne=U,V=k,t.width=Math.floor(x*k),t.height=Math.floor(U*k),this.setViewport(0,0,x,U)},this.getCurrentViewport=function(x){return x.copy(D)},this.getViewport=function(x){return x.copy(Te)},this.setViewport=function(x,U,k,z){x.isVector4?Te.set(x.x,x.y,x.z,x.w):Te.set(x,U,k,z),ve.viewport(D.copy(Te).multiplyScalar(V).round())},this.getScissor=function(x){return x.copy(Xe)},this.setScissor=function(x,U,k,z){x.isVector4?Xe.set(x.x,x.y,x.z,x.w):Xe.set(x,U,k,z),ve.scissor(B.copy(Xe).multiplyScalar(V).round())},this.getScissorTest=function(){return ct},this.setScissorTest=function(x){ve.setScissorTest(ct=x)},this.setOpaqueSort=function(x){le=x},this.setTransparentSort=function(x){de=x},this.getClearColor=function(x){return x.copy(Se.getClearColor())},this.setClearColor=function(){Se.setClearColor(...arguments)},this.getClearAlpha=function(){return Se.getClearAlpha()},this.setClearAlpha=function(){Se.setClearAlpha(...arguments)},this.clear=function(x=!0,U=!0,k=!0){let z=0;if(x){let O=!1;if(N!==null){let Q=N.texture.format;O=Q===Wa||Q===Ga||Q===Va}if(O){let Q=N.texture.type,ue=Q===wn||Q===Si||Q===Fs||Q===ks||Q===ka||Q===za,_e=Se.getClearColor(),fe=Se.getClearAlpha(),Ce=_e.r,Le=_e.g,Ae=_e.b;ue?(g[0]=Ce,g[1]=Le,g[2]=Ae,g[3]=fe,C.clearBufferuiv(C.COLOR,0,g)):(y[0]=Ce,y[1]=Le,y[2]=Ae,y[3]=fe,C.clearBufferiv(C.COLOR,0,y))}else z|=C.COLOR_BUFFER_BIT}U&&(z|=C.DEPTH_BUFFER_BIT),k&&(z|=C.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),C.clear(z)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",se,!1),t.removeEventListener("webglcontextrestored",pe,!1),t.removeEventListener("webglcontextcreationerror",K,!1),Se.dispose(),G.dispose(),Ee.dispose(),xe.dispose(),Ct.dispose(),bt.dispose(),F.dispose(),ce.dispose(),He.dispose(),X.dispose(),te.dispose(),te.removeEventListener("sessionstart",An),te.removeEventListener("sessionend",Bu),Ai.stop()};function se(x){x.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),I=!0}function pe(){console.log("THREE.WebGLRenderer: Context Restored."),I=!1;let x=mt.autoReset,U=be.enabled,k=be.autoUpdate,z=be.needsUpdate,O=be.type;L(),mt.autoReset=x,be.enabled=U,be.autoUpdate=k,be.needsUpdate=z,be.type=O}function K(x){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",x.statusMessage)}function Y(x){let U=x.target;U.removeEventListener("dispose",Y),ye(U)}function ye(x){Fe(x),xe.remove(x)}function Fe(x){let U=xe.get(x).programs;U!==void 0&&(U.forEach(function(k){X.releaseProgram(k)}),x.isShaderMaterial&&X.releaseShaderCache(x))}this.renderBufferDirect=function(x,U,k,z,O,Q){U===null&&(U=we);let ue=O.isMesh&&O.matrixWorld.determinant()<0,_e=Vf(x,U,k,z,O);ve.setMaterial(z,ue);let fe=k.index,Ce=1;if(z.wireframe===!0){if(fe=v.getWireframeAttribute(k),fe===void 0)return;Ce=2}let Le=k.drawRange,Ae=k.attributes.position,qe=Le.start*Ce,rt=(Le.start+Le.count)*Ce;Q!==null&&(qe=Math.max(qe,Q.start*Ce),rt=Math.min(rt,(Q.start+Q.count)*Ce)),fe!==null?(qe=Math.max(qe,0),rt=Math.min(rt,fe.count)):Ae!=null&&(qe=Math.max(qe,0),rt=Math.min(rt,Ae.count));let vt=rt-qe;if(vt<0||vt===1/0)return;ce.setup(O,z,_e,k,fe);let ht,lt=he;if(fe!==null&&(ht=T.get(fe),lt=Ie,lt.setIndex(ht)),O.isMesh)z.wireframe===!0?(ve.setLineWidth(z.wireframeLinewidth*Ot()),lt.setMode(C.LINES)):lt.setMode(C.TRIANGLES);else if(O.isLine){let Re=z.linewidth;Re===void 0&&(Re=1),ve.setLineWidth(Re*Ot()),O.isLineSegments?lt.setMode(C.LINES):O.isLineLoop?lt.setMode(C.LINE_LOOP):lt.setMode(C.LINE_STRIP)}else O.isPoints?lt.setMode(C.POINTS):O.isSprite&&lt.setMode(C.TRIANGLES);if(O.isBatchedMesh)if(O._multiDrawInstances!==null)ws("THREE.WebGLRenderer: renderMultiDrawInstances has been deprecated and will be removed in r184. Append to renderMultiDraw arguments and use indirection."),lt.renderMultiDrawInstances(O._multiDrawStarts,O._multiDrawCounts,O._multiDrawCount,O._multiDrawInstances);else if(Be.get("WEBGL_multi_draw"))lt.renderMultiDraw(O._multiDrawStarts,O._multiDrawCounts,O._multiDrawCount);else{let Re=O._multiDrawStarts,_t=O._multiDrawCounts,Ke=O._multiDrawCount,en=fe?T.get(fe).bytesPerElement:1,es=xe.get(z).currentProgram.getUniforms();for(let tn=0;tn<Ke;tn++)es.setValue(C,"_gl_DrawID",tn),lt.render(Re[tn]/en,_t[tn])}else if(O.isInstancedMesh)lt.renderInstances(qe,vt,O.count);else if(k.isInstancedBufferGeometry){let Re=k._maxInstanceCount!==void 0?k._maxInstanceCount:1/0,_t=Math.min(k.instanceCount,Re);lt.renderInstances(qe,vt,_t)}else lt.render(qe,vt)};function ut(x,U,k){x.transparent===!0&&x.side===$t&&x.forceSinglePass===!1?(x.side=Wt,x.needsUpdate=!0,go(x,U,k),x.side=Zn,x.needsUpdate=!0,go(x,U,k),x.side=$t):go(x,U,k)}this.compile=function(x,U,k=null){k===null&&(k=x),p=Ee.get(k),p.init(U),E.push(p),k.traverseVisible(function(O){O.isLight&&O.layers.test(U.layers)&&(p.pushLight(O),O.castShadow&&p.pushShadow(O))}),x!==k&&x.traverseVisible(function(O){O.isLight&&O.layers.test(U.layers)&&(p.pushLight(O),O.castShadow&&p.pushShadow(O))}),p.setupLights();let z=new Set;return x.traverse(function(O){if(!(O.isMesh||O.isPoints||O.isLine||O.isSprite))return;let Q=O.material;if(Q)if(Array.isArray(Q))for(let ue=0;ue<Q.length;ue++){let _e=Q[ue];ut(_e,k,O),z.add(_e)}else ut(Q,k,O),z.add(Q)}),p=E.pop(),z},this.compileAsync=function(x,U,k=null){let z=this.compile(x,U,k);return new Promise(O=>{function Q(){if(z.forEach(function(ue){xe.get(ue).currentProgram.isReady()&&z.delete(ue)}),z.size===0){O(x);return}setTimeout(Q,10)}Be.get("KHR_parallel_shader_compile")!==null?Q():setTimeout(Q,10)})};let nt=null;function zn(x){nt&&nt(x)}function An(){Ai.stop()}function Bu(){Ai.start()}let Ai=new df;Ai.setAnimationLoop(zn),typeof self<"u"&&Ai.setContext(self),this.setAnimationLoop=function(x){nt=x,te.setAnimationLoop(x),x===null?Ai.stop():Ai.start()},te.addEventListener("sessionstart",An),te.addEventListener("sessionend",Bu),this.render=function(x,U){if(U!==void 0&&U.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(I===!0)return;if(x.matrixWorldAutoUpdate===!0&&x.updateMatrixWorld(),U.parent===null&&U.matrixWorldAutoUpdate===!0&&U.updateMatrixWorld(),te.enabled===!0&&te.isPresenting===!0&&(te.cameraAutoUpdate===!0&&te.updateCamera(U),U=te.getCamera()),x.isScene===!0&&x.onBeforeRender(b,x,U,N),p=Ee.get(x,E.length),p.init(U),E.push(p),J.multiplyMatrices(U.projectionMatrix,U.matrixWorldInverse),ft.setFromProjectionMatrix(J,bn,U.reversedDepth),j=this.localClippingEnabled,tt=ie.init(this.clippingPlanes,j),m=G.get(x,w.length),m.init(),w.push(m),te.enabled===!0&&te.isPresenting===!0){let Q=b.xr.getDepthSensingMesh();Q!==null&&Hl(Q,U,-1/0,b.sortObjects)}Hl(x,U,0,b.sortObjects),m.finish(),b.sortObjects===!0&&m.sort(le,de),Ye=te.enabled===!1||te.isPresenting===!1||te.hasDepthSensing()===!1,Ye&&Se.addToRenderList(m,x),this.info.render.frame++,tt===!0&&ie.beginShadows();let k=p.state.shadowsArray;be.render(k,x,U),tt===!0&&ie.endShadows(),this.info.autoReset===!0&&this.info.reset();let z=m.opaque,O=m.transmissive;if(p.setupLights(),U.isArrayCamera){let Q=U.cameras;if(O.length>0)for(let ue=0,_e=Q.length;ue<_e;ue++){let fe=Q[ue];zu(z,O,x,fe)}Ye&&Se.render(x);for(let ue=0,_e=Q.length;ue<_e;ue++){let fe=Q[ue];ku(m,x,fe,fe.viewport)}}else O.length>0&&zu(z,O,x,U),Ye&&Se.render(x),ku(m,x,U);N!==null&&P===0&&(Ge.updateMultisampleRenderTarget(N),Ge.updateRenderTargetMipmap(N)),x.isScene===!0&&x.onAfterRender(b,x,U),ce.resetDefaultState(),M=-1,S=null,E.pop(),E.length>0?(p=E[E.length-1],tt===!0&&ie.setGlobalState(b.clippingPlanes,p.state.camera)):p=null,w.pop(),w.length>0?m=w[w.length-1]:m=null};function Hl(x,U,k,z){if(x.visible===!1)return;if(x.layers.test(U.layers)){if(x.isGroup)k=x.renderOrder;else if(x.isLOD)x.autoUpdate===!0&&x.update(U);else if(x.isLight)p.pushLight(x),x.castShadow&&p.pushShadow(x);else if(x.isSprite){if(!x.frustumCulled||ft.intersectsSprite(x)){z&&Oe.setFromMatrixPosition(x.matrixWorld).applyMatrix4(J);let ue=F.update(x),_e=x.material;_e.visible&&m.push(x,ue,_e,k,Oe.z,null)}}else if((x.isMesh||x.isLine||x.isPoints)&&(!x.frustumCulled||ft.intersectsObject(x))){let ue=F.update(x),_e=x.material;if(z&&(x.boundingSphere!==void 0?(x.boundingSphere===null&&x.computeBoundingSphere(),Oe.copy(x.boundingSphere.center)):(ue.boundingSphere===null&&ue.computeBoundingSphere(),Oe.copy(ue.boundingSphere.center)),Oe.applyMatrix4(x.matrixWorld).applyMatrix4(J)),Array.isArray(_e)){let fe=ue.groups;for(let Ce=0,Le=fe.length;Ce<Le;Ce++){let Ae=fe[Ce],qe=_e[Ae.materialIndex];qe&&qe.visible&&m.push(x,ue,qe,k,Oe.z,Ae)}}else _e.visible&&m.push(x,ue,_e,k,Oe.z,null)}}let Q=x.children;for(let ue=0,_e=Q.length;ue<_e;ue++)Hl(Q[ue],U,k,z)}function ku(x,U,k,z){let O=x.opaque,Q=x.transmissive,ue=x.transparent;p.setupLightsView(k),tt===!0&&ie.setGlobalState(b.clippingPlanes,k),z&&ve.viewport(D.copy(z)),O.length>0&&mo(O,U,k),Q.length>0&&mo(Q,U,k),ue.length>0&&mo(ue,U,k),ve.buffers.depth.setTest(!0),ve.buffers.depth.setMask(!0),ve.buffers.color.setMask(!0),ve.setPolygonOffset(!1)}function zu(x,U,k,z){if((k.isScene===!0?k.overrideMaterial:null)!==null)return;p.state.transmissionRenderTarget[z.id]===void 0&&(p.state.transmissionRenderTarget[z.id]=new In(1,1,{generateMipmaps:!0,type:Be.has("EXT_color_buffer_half_float")||Be.has("EXT_color_buffer_float")?Bs:wn,minFilter:bi,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:Ze.workingColorSpace}));let Q=p.state.transmissionRenderTarget[z.id],ue=z.viewport||D;Q.setSize(ue.z*b.transmissionResolutionScale,ue.w*b.transmissionResolutionScale);let _e=b.getRenderTarget(),fe=b.getActiveCubeFace(),Ce=b.getActiveMipmapLevel();b.setRenderTarget(Q),b.getClearColor(W),q=b.getClearAlpha(),q<1&&b.setClearColor(16777215,.5),b.clear(),Ye&&Se.render(k);let Le=b.toneMapping;b.toneMapping=ei;let Ae=z.viewport;if(z.viewport!==void 0&&(z.viewport=void 0),p.setupLightsView(z),tt===!0&&ie.setGlobalState(b.clippingPlanes,z),mo(x,k,z),Ge.updateMultisampleRenderTarget(Q),Ge.updateRenderTargetMipmap(Q),Be.has("WEBGL_multisampled_render_to_texture")===!1){let qe=!1;for(let rt=0,vt=U.length;rt<vt;rt++){let ht=U[rt],lt=ht.object,Re=ht.geometry,_t=ht.material,Ke=ht.group;if(_t.side===$t&&lt.layers.test(z.layers)){let en=_t.side;_t.side=Wt,_t.needsUpdate=!0,Hu(lt,k,z,Re,_t,Ke),_t.side=en,_t.needsUpdate=!0,qe=!0}}qe===!0&&(Ge.updateMultisampleRenderTarget(Q),Ge.updateRenderTargetMipmap(Q))}b.setRenderTarget(_e,fe,Ce),b.setClearColor(W,q),Ae!==void 0&&(z.viewport=Ae),b.toneMapping=Le}function mo(x,U,k){let z=U.isScene===!0?U.overrideMaterial:null;for(let O=0,Q=x.length;O<Q;O++){let ue=x[O],_e=ue.object,fe=ue.geometry,Ce=ue.group,Le=ue.material;Le.allowOverride===!0&&z!==null&&(Le=z),_e.layers.test(k.layers)&&Hu(_e,U,k,fe,Le,Ce)}}function Hu(x,U,k,z,O,Q){x.onBeforeRender(b,U,k,z,O,Q),x.modelViewMatrix.multiplyMatrices(k.matrixWorldInverse,x.matrixWorld),x.normalMatrix.getNormalMatrix(x.modelViewMatrix),O.onBeforeRender(b,U,k,z,x,Q),O.transparent===!0&&O.side===$t&&O.forceSinglePass===!1?(O.side=Wt,O.needsUpdate=!0,b.renderBufferDirect(k,U,z,O,x,Q),O.side=Zn,O.needsUpdate=!0,b.renderBufferDirect(k,U,z,O,x,Q),O.side=$t):b.renderBufferDirect(k,U,z,O,x,Q),x.onAfterRender(b,U,k,z,O,Q)}function go(x,U,k){U.isScene!==!0&&(U=we);let z=xe.get(x),O=p.state.lights,Q=p.state.shadowsArray,ue=O.state.version,_e=X.getParameters(x,O.state,Q,U,k),fe=X.getProgramCacheKey(_e),Ce=z.programs;z.environment=x.isMeshStandardMaterial?U.environment:null,z.fog=U.fog,z.envMap=(x.isMeshStandardMaterial?bt:Ct).get(x.envMap||z.environment),z.envMapRotation=z.environment!==null&&x.envMap===null?U.environmentRotation:x.envMapRotation,Ce===void 0&&(x.addEventListener("dispose",Y),Ce=new Map,z.programs=Ce);let Le=Ce.get(fe);if(Le!==void 0){if(z.currentProgram===Le&&z.lightsStateVersion===ue)return Gu(x,_e),Le}else _e.uniforms=X.getUniforms(x),x.onBeforeCompile(_e,b),Le=X.acquireProgram(_e,fe),Ce.set(fe,Le),z.uniforms=_e.uniforms;let Ae=z.uniforms;return(!x.isShaderMaterial&&!x.isRawShaderMaterial||x.clipping===!0)&&(Ae.clippingPlanes=ie.uniform),Gu(x,_e),z.needsLights=Wf(x),z.lightsStateVersion=ue,z.needsLights&&(Ae.ambientLightColor.value=O.state.ambient,Ae.lightProbe.value=O.state.probe,Ae.directionalLights.value=O.state.directional,Ae.directionalLightShadows.value=O.state.directionalShadow,Ae.spotLights.value=O.state.spot,Ae.spotLightShadows.value=O.state.spotShadow,Ae.rectAreaLights.value=O.state.rectArea,Ae.ltc_1.value=O.state.rectAreaLTC1,Ae.ltc_2.value=O.state.rectAreaLTC2,Ae.pointLights.value=O.state.point,Ae.pointLightShadows.value=O.state.pointShadow,Ae.hemisphereLights.value=O.state.hemi,Ae.directionalShadowMap.value=O.state.directionalShadowMap,Ae.directionalShadowMatrix.value=O.state.directionalShadowMatrix,Ae.spotShadowMap.value=O.state.spotShadowMap,Ae.spotLightMatrix.value=O.state.spotLightMatrix,Ae.spotLightMap.value=O.state.spotLightMap,Ae.pointShadowMap.value=O.state.pointShadowMap,Ae.pointShadowMatrix.value=O.state.pointShadowMatrix),z.currentProgram=Le,z.uniformsList=null,Le}function Vu(x){if(x.uniformsList===null){let U=x.currentProgram.getUniforms();x.uniformsList=Ws.seqWithValue(U.seq,x.uniforms)}return x.uniformsList}function Gu(x,U){let k=xe.get(x);k.outputColorSpace=U.outputColorSpace,k.batching=U.batching,k.batchingColor=U.batchingColor,k.instancing=U.instancing,k.instancingColor=U.instancingColor,k.instancingMorph=U.instancingMorph,k.skinning=U.skinning,k.morphTargets=U.morphTargets,k.morphNormals=U.morphNormals,k.morphColors=U.morphColors,k.morphTargetsCount=U.morphTargetsCount,k.numClippingPlanes=U.numClippingPlanes,k.numIntersection=U.numClipIntersection,k.vertexAlphas=U.vertexAlphas,k.vertexTangents=U.vertexTangents,k.toneMapping=U.toneMapping}function Vf(x,U,k,z,O){U.isScene!==!0&&(U=we),Ge.resetTextureUnits();let Q=U.fog,ue=z.isMeshStandardMaterial?U.environment:null,_e=N===null?b.outputColorSpace:N.isXRRenderTarget===!0?N.texture.colorSpace:Gi,fe=(z.isMeshStandardMaterial?bt:Ct).get(z.envMap||ue),Ce=z.vertexColors===!0&&!!k.attributes.color&&k.attributes.color.itemSize===4,Le=!!k.attributes.tangent&&(!!z.normalMap||z.anisotropy>0),Ae=!!k.morphAttributes.position,qe=!!k.morphAttributes.normal,rt=!!k.morphAttributes.color,vt=ei;z.toneMapped&&(N===null||N.isXRRenderTarget===!0)&&(vt=b.toneMapping);let ht=k.morphAttributes.position||k.morphAttributes.normal||k.morphAttributes.color,lt=ht!==void 0?ht.length:0,Re=xe.get(z),_t=p.state.lights;if(tt===!0&&(j===!0||x!==S)){let zt=x===S&&z.id===M;ie.setState(z,x,zt)}let Ke=!1;z.version===Re.__version?(Re.needsLights&&Re.lightsStateVersion!==_t.state.version||Re.outputColorSpace!==_e||O.isBatchedMesh&&Re.batching===!1||!O.isBatchedMesh&&Re.batching===!0||O.isBatchedMesh&&Re.batchingColor===!0&&O.colorTexture===null||O.isBatchedMesh&&Re.batchingColor===!1&&O.colorTexture!==null||O.isInstancedMesh&&Re.instancing===!1||!O.isInstancedMesh&&Re.instancing===!0||O.isSkinnedMesh&&Re.skinning===!1||!O.isSkinnedMesh&&Re.skinning===!0||O.isInstancedMesh&&Re.instancingColor===!0&&O.instanceColor===null||O.isInstancedMesh&&Re.instancingColor===!1&&O.instanceColor!==null||O.isInstancedMesh&&Re.instancingMorph===!0&&O.morphTexture===null||O.isInstancedMesh&&Re.instancingMorph===!1&&O.morphTexture!==null||Re.envMap!==fe||z.fog===!0&&Re.fog!==Q||Re.numClippingPlanes!==void 0&&(Re.numClippingPlanes!==ie.numPlanes||Re.numIntersection!==ie.numIntersection)||Re.vertexAlphas!==Ce||Re.vertexTangents!==Le||Re.morphTargets!==Ae||Re.morphNormals!==qe||Re.morphColors!==rt||Re.toneMapping!==vt||Re.morphTargetsCount!==lt)&&(Ke=!0):(Ke=!0,Re.__version=z.version);let en=Re.currentProgram;Ke===!0&&(en=go(z,U,O));let es=!1,tn=!1,Qs=!1,yt=en.getUniforms(),an=Re.uniforms;if(ve.useProgram(en.program)&&(es=!0,tn=!0,Qs=!0),z.id!==M&&(M=z.id,tn=!0),es||S!==x){ve.buffers.depth.getReversed()&&x.reversedDepth!==!0&&(x._reversedDepth=!0,x.updateProjectionMatrix()),yt.setValue(C,"projectionMatrix",x.projectionMatrix),yt.setValue(C,"viewMatrix",x.matrixWorldInverse);let Xt=yt.map.cameraPosition;Xt!==void 0&&Xt.setValue(C,ge.setFromMatrixPosition(x.matrixWorld)),Pe.logarithmicDepthBuffer&&yt.setValue(C,"logDepthBufFC",2/(Math.log(x.far+1)/Math.LN2)),(z.isMeshPhongMaterial||z.isMeshToonMaterial||z.isMeshLambertMaterial||z.isMeshBasicMaterial||z.isMeshStandardMaterial||z.isShaderMaterial)&&yt.setValue(C,"isOrthographic",x.isOrthographicCamera===!0),S!==x&&(S=x,tn=!0,Qs=!0)}if(O.isSkinnedMesh){yt.setOptional(C,O,"bindMatrix"),yt.setOptional(C,O,"bindMatrixInverse");let zt=O.skeleton;zt&&(zt.boneTexture===null&&zt.computeBoneTexture(),yt.setValue(C,"boneTexture",zt.boneTexture,Ge))}O.isBatchedMesh&&(yt.setOptional(C,O,"batchingTexture"),yt.setValue(C,"batchingTexture",O._matricesTexture,Ge),yt.setOptional(C,O,"batchingIdTexture"),yt.setValue(C,"batchingIdTexture",O._indirectTexture,Ge),yt.setOptional(C,O,"batchingColorTexture"),O._colorsTexture!==null&&yt.setValue(C,"batchingColorTexture",O._colorsTexture,Ge));let ln=k.morphAttributes;if((ln.position!==void 0||ln.normal!==void 0||ln.color!==void 0)&&ee.update(O,k,en),(tn||Re.receiveShadow!==O.receiveShadow)&&(Re.receiveShadow=O.receiveShadow,yt.setValue(C,"receiveShadow",O.receiveShadow)),z.isMeshGouraudMaterial&&z.envMap!==null&&(an.envMap.value=fe,an.flipEnvMap.value=fe.isCubeTexture&&fe.isRenderTargetTexture===!1?-1:1),z.isMeshStandardMaterial&&z.envMap===null&&U.environment!==null&&(an.envMapIntensity.value=U.environmentIntensity),tn&&(yt.setValue(C,"toneMappingExposure",b.toneMappingExposure),Re.needsLights&&Gf(an,Qs),Q&&z.fog===!0&&Z.refreshFogUniforms(an,Q),Z.refreshMaterialUniforms(an,z,V,ne,p.state.transmissionRenderTarget[x.id]),Ws.upload(C,Vu(Re),an,Ge)),z.isShaderMaterial&&z.uniformsNeedUpdate===!0&&(Ws.upload(C,Vu(Re),an,Ge),z.uniformsNeedUpdate=!1),z.isSpriteMaterial&&yt.setValue(C,"center",O.center),yt.setValue(C,"modelViewMatrix",O.modelViewMatrix),yt.setValue(C,"normalMatrix",O.normalMatrix),yt.setValue(C,"modelMatrix",O.matrixWorld),z.isShaderMaterial||z.isRawShaderMaterial){let zt=z.uniformsGroups;for(let Xt=0,Vl=zt.length;Xt<Vl;Xt++){let Ri=zt[Xt];He.update(Ri,en),He.bind(Ri,en)}}return en}function Gf(x,U){x.ambientLightColor.needsUpdate=U,x.lightProbe.needsUpdate=U,x.directionalLights.needsUpdate=U,x.directionalLightShadows.needsUpdate=U,x.pointLights.needsUpdate=U,x.pointLightShadows.needsUpdate=U,x.spotLights.needsUpdate=U,x.spotLightShadows.needsUpdate=U,x.rectAreaLights.needsUpdate=U,x.hemisphereLights.needsUpdate=U}function Wf(x){return x.isMeshLambertMaterial||x.isMeshToonMaterial||x.isMeshPhongMaterial||x.isMeshStandardMaterial||x.isShadowMaterial||x.isShaderMaterial&&x.lights===!0}this.getActiveCubeFace=function(){return A},this.getActiveMipmapLevel=function(){return P},this.getRenderTarget=function(){return N},this.setRenderTargetTextures=function(x,U,k){let z=xe.get(x);z.__autoAllocateDepthBuffer=x.resolveDepthBuffer===!1,z.__autoAllocateDepthBuffer===!1&&(z.__useRenderToTexture=!1),xe.get(x.texture).__webglTexture=U,xe.get(x.depthTexture).__webglTexture=z.__autoAllocateDepthBuffer?void 0:k,z.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(x,U){let k=xe.get(x);k.__webglFramebuffer=U,k.__useDefaultFramebuffer=U===void 0};let $f=C.createFramebuffer();this.setRenderTarget=function(x,U=0,k=0){N=x,A=U,P=k;let z=!0,O=null,Q=!1,ue=!1;if(x){let fe=xe.get(x);if(fe.__useDefaultFramebuffer!==void 0)ve.bindFramebuffer(C.FRAMEBUFFER,null),z=!1;else if(fe.__webglFramebuffer===void 0)Ge.setupRenderTarget(x);else if(fe.__hasExternalTextures)Ge.rebindTextures(x,xe.get(x.texture).__webglTexture,xe.get(x.depthTexture).__webglTexture);else if(x.depthBuffer){let Ae=x.depthTexture;if(fe.__boundDepthTexture!==Ae){if(Ae!==null&&xe.has(Ae)&&(x.width!==Ae.image.width||x.height!==Ae.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");Ge.setupDepthRenderbuffer(x)}}let Ce=x.texture;(Ce.isData3DTexture||Ce.isDataArrayTexture||Ce.isCompressedArrayTexture)&&(ue=!0);let Le=xe.get(x).__webglFramebuffer;x.isWebGLCubeRenderTarget?(Array.isArray(Le[U])?O=Le[U][k]:O=Le[U],Q=!0):x.samples>0&&Ge.useMultisampledRTT(x)===!1?O=xe.get(x).__webglMultisampledFramebuffer:Array.isArray(Le)?O=Le[k]:O=Le,D.copy(x.viewport),B.copy(x.scissor),H=x.scissorTest}else D.copy(Te).multiplyScalar(V).floor(),B.copy(Xe).multiplyScalar(V).floor(),H=ct;if(k!==0&&(O=$f),ve.bindFramebuffer(C.FRAMEBUFFER,O)&&z&&ve.drawBuffers(x,O),ve.viewport(D),ve.scissor(B),ve.setScissorTest(H),Q){let fe=xe.get(x.texture);C.framebufferTexture2D(C.FRAMEBUFFER,C.COLOR_ATTACHMENT0,C.TEXTURE_CUBE_MAP_POSITIVE_X+U,fe.__webglTexture,k)}else if(ue){let fe=U;for(let Ce=0;Ce<x.textures.length;Ce++){let Le=xe.get(x.textures[Ce]);C.framebufferTextureLayer(C.FRAMEBUFFER,C.COLOR_ATTACHMENT0+Ce,Le.__webglTexture,k,fe)}}else if(x!==null&&k!==0){let fe=xe.get(x.texture);C.framebufferTexture2D(C.FRAMEBUFFER,C.COLOR_ATTACHMENT0,C.TEXTURE_2D,fe.__webglTexture,k)}M=-1},this.readRenderTargetPixels=function(x,U,k,z,O,Q,ue,_e=0){if(!(x&&x.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let fe=xe.get(x).__webglFramebuffer;if(x.isWebGLCubeRenderTarget&&ue!==void 0&&(fe=fe[ue]),fe){ve.bindFramebuffer(C.FRAMEBUFFER,fe);try{let Ce=x.textures[_e],Le=Ce.format,Ae=Ce.type;if(!Pe.textureFormatReadable(Le)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Pe.textureTypeReadable(Ae)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}U>=0&&U<=x.width-z&&k>=0&&k<=x.height-O&&(x.textures.length>1&&C.readBuffer(C.COLOR_ATTACHMENT0+_e),C.readPixels(U,k,z,O,Me.convert(Le),Me.convert(Ae),Q))}finally{let Ce=N!==null?xe.get(N).__webglFramebuffer:null;ve.bindFramebuffer(C.FRAMEBUFFER,Ce)}}},this.readRenderTargetPixelsAsync=async function(x,U,k,z,O,Q,ue,_e=0){if(!(x&&x.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let fe=xe.get(x).__webglFramebuffer;if(x.isWebGLCubeRenderTarget&&ue!==void 0&&(fe=fe[ue]),fe)if(U>=0&&U<=x.width-z&&k>=0&&k<=x.height-O){ve.bindFramebuffer(C.FRAMEBUFFER,fe);let Ce=x.textures[_e],Le=Ce.format,Ae=Ce.type;if(!Pe.textureFormatReadable(Le))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Pe.textureTypeReadable(Ae))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let qe=C.createBuffer();C.bindBuffer(C.PIXEL_PACK_BUFFER,qe),C.bufferData(C.PIXEL_PACK_BUFFER,Q.byteLength,C.STREAM_READ),x.textures.length>1&&C.readBuffer(C.COLOR_ATTACHMENT0+_e),C.readPixels(U,k,z,O,Me.convert(Le),Me.convert(Ae),0);let rt=N!==null?xe.get(N).__webglFramebuffer:null;ve.bindFramebuffer(C.FRAMEBUFFER,rt);let vt=C.fenceSync(C.SYNC_GPU_COMMANDS_COMPLETE,0);return C.flush(),await Bd(C,vt,4),C.bindBuffer(C.PIXEL_PACK_BUFFER,qe),C.getBufferSubData(C.PIXEL_PACK_BUFFER,0,Q),C.deleteBuffer(qe),C.deleteSync(vt),Q}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(x,U=null,k=0){let z=Math.pow(2,-k),O=Math.floor(x.image.width*z),Q=Math.floor(x.image.height*z),ue=U!==null?U.x:0,_e=U!==null?U.y:0;Ge.setTexture2D(x,0),C.copyTexSubImage2D(C.TEXTURE_2D,k,0,0,ue,_e,O,Q),ve.unbindTexture()};let Xf=C.createFramebuffer(),qf=C.createFramebuffer();this.copyTextureToTexture=function(x,U,k=null,z=null,O=0,Q=null){Q===null&&(O!==0?(ws("WebGLRenderer: copyTextureToTexture function signature has changed to support src and dst mipmap levels."),Q=O,O=0):Q=0);let ue,_e,fe,Ce,Le,Ae,qe,rt,vt,ht=x.isCompressedTexture?x.mipmaps[Q]:x.image;if(k!==null)ue=k.max.x-k.min.x,_e=k.max.y-k.min.y,fe=k.isBox3?k.max.z-k.min.z:1,Ce=k.min.x,Le=k.min.y,Ae=k.isBox3?k.min.z:0;else{let ln=Math.pow(2,-O);ue=Math.floor(ht.width*ln),_e=Math.floor(ht.height*ln),x.isDataArrayTexture?fe=ht.depth:x.isData3DTexture?fe=Math.floor(ht.depth*ln):fe=1,Ce=0,Le=0,Ae=0}z!==null?(qe=z.x,rt=z.y,vt=z.z):(qe=0,rt=0,vt=0);let lt=Me.convert(U.format),Re=Me.convert(U.type),_t;U.isData3DTexture?(Ge.setTexture3D(U,0),_t=C.TEXTURE_3D):U.isDataArrayTexture||U.isCompressedArrayTexture?(Ge.setTexture2DArray(U,0),_t=C.TEXTURE_2D_ARRAY):(Ge.setTexture2D(U,0),_t=C.TEXTURE_2D),C.pixelStorei(C.UNPACK_FLIP_Y_WEBGL,U.flipY),C.pixelStorei(C.UNPACK_PREMULTIPLY_ALPHA_WEBGL,U.premultiplyAlpha),C.pixelStorei(C.UNPACK_ALIGNMENT,U.unpackAlignment);let Ke=C.getParameter(C.UNPACK_ROW_LENGTH),en=C.getParameter(C.UNPACK_IMAGE_HEIGHT),es=C.getParameter(C.UNPACK_SKIP_PIXELS),tn=C.getParameter(C.UNPACK_SKIP_ROWS),Qs=C.getParameter(C.UNPACK_SKIP_IMAGES);C.pixelStorei(C.UNPACK_ROW_LENGTH,ht.width),C.pixelStorei(C.UNPACK_IMAGE_HEIGHT,ht.height),C.pixelStorei(C.UNPACK_SKIP_PIXELS,Ce),C.pixelStorei(C.UNPACK_SKIP_ROWS,Le),C.pixelStorei(C.UNPACK_SKIP_IMAGES,Ae);let yt=x.isDataArrayTexture||x.isData3DTexture,an=U.isDataArrayTexture||U.isData3DTexture;if(x.isDepthTexture){let ln=xe.get(x),zt=xe.get(U),Xt=xe.get(ln.__renderTarget),Vl=xe.get(zt.__renderTarget);ve.bindFramebuffer(C.READ_FRAMEBUFFER,Xt.__webglFramebuffer),ve.bindFramebuffer(C.DRAW_FRAMEBUFFER,Vl.__webglFramebuffer);for(let Ri=0;Ri<fe;Ri++)yt&&(C.framebufferTextureLayer(C.READ_FRAMEBUFFER,C.COLOR_ATTACHMENT0,xe.get(x).__webglTexture,O,Ae+Ri),C.framebufferTextureLayer(C.DRAW_FRAMEBUFFER,C.COLOR_ATTACHMENT0,xe.get(U).__webglTexture,Q,vt+Ri)),C.blitFramebuffer(Ce,Le,ue,_e,qe,rt,ue,_e,C.DEPTH_BUFFER_BIT,C.NEAREST);ve.bindFramebuffer(C.READ_FRAMEBUFFER,null),ve.bindFramebuffer(C.DRAW_FRAMEBUFFER,null)}else if(O!==0||x.isRenderTargetTexture||xe.has(x)){let ln=xe.get(x),zt=xe.get(U);ve.bindFramebuffer(C.READ_FRAMEBUFFER,Xf),ve.bindFramebuffer(C.DRAW_FRAMEBUFFER,qf);for(let Xt=0;Xt<fe;Xt++)yt?C.framebufferTextureLayer(C.READ_FRAMEBUFFER,C.COLOR_ATTACHMENT0,ln.__webglTexture,O,Ae+Xt):C.framebufferTexture2D(C.READ_FRAMEBUFFER,C.COLOR_ATTACHMENT0,C.TEXTURE_2D,ln.__webglTexture,O),an?C.framebufferTextureLayer(C.DRAW_FRAMEBUFFER,C.COLOR_ATTACHMENT0,zt.__webglTexture,Q,vt+Xt):C.framebufferTexture2D(C.DRAW_FRAMEBUFFER,C.COLOR_ATTACHMENT0,C.TEXTURE_2D,zt.__webglTexture,Q),O!==0?C.blitFramebuffer(Ce,Le,ue,_e,qe,rt,ue,_e,C.COLOR_BUFFER_BIT,C.NEAREST):an?C.copyTexSubImage3D(_t,Q,qe,rt,vt+Xt,Ce,Le,ue,_e):C.copyTexSubImage2D(_t,Q,qe,rt,Ce,Le,ue,_e);ve.bindFramebuffer(C.READ_FRAMEBUFFER,null),ve.bindFramebuffer(C.DRAW_FRAMEBUFFER,null)}else an?x.isDataTexture||x.isData3DTexture?C.texSubImage3D(_t,Q,qe,rt,vt,ue,_e,fe,lt,Re,ht.data):U.isCompressedArrayTexture?C.compressedTexSubImage3D(_t,Q,qe,rt,vt,ue,_e,fe,lt,ht.data):C.texSubImage3D(_t,Q,qe,rt,vt,ue,_e,fe,lt,Re,ht):x.isDataTexture?C.texSubImage2D(C.TEXTURE_2D,Q,qe,rt,ue,_e,lt,Re,ht.data):x.isCompressedTexture?C.compressedTexSubImage2D(C.TEXTURE_2D,Q,qe,rt,ht.width,ht.height,lt,ht.data):C.texSubImage2D(C.TEXTURE_2D,Q,qe,rt,ue,_e,lt,Re,ht);C.pixelStorei(C.UNPACK_ROW_LENGTH,Ke),C.pixelStorei(C.UNPACK_IMAGE_HEIGHT,en),C.pixelStorei(C.UNPACK_SKIP_PIXELS,es),C.pixelStorei(C.UNPACK_SKIP_ROWS,tn),C.pixelStorei(C.UNPACK_SKIP_IMAGES,Qs),Q===0&&U.generateMipmaps&&C.generateMipmap(_t),ve.unbindTexture()},this.initRenderTarget=function(x){xe.get(x).__webglFramebuffer===void 0&&Ge.setupRenderTarget(x)},this.initTexture=function(x){x.isCubeTexture?Ge.setTextureCube(x,0):x.isData3DTexture?Ge.setTexture3D(x,0):x.isDataArrayTexture||x.isCompressedArrayTexture?Ge.setTexture2DArray(x,0):Ge.setTexture2D(x,0),ve.unbindTexture()},this.resetState=function(){A=0,P=0,N=null,ve.reset(),ce.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return bn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=Ze._getDrawingBufferColorSpace(e),t.unpackColorSpace=Ze._getUnpackColorSpace()}};var _f={type:"change"},Eu={type:"start"},vf={type:"end"},wl=new gi,yf=new fn,px=Math.cos(70*ji.DEG2RAD),Rt=new R,Qt=2*Math.PI,at={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},Mu=1e-6,Tl=class extends Kr{constructor(e,t=null){super(e,t),this.state=at.NONE,this.target=new R,this.cursor=new R,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.keyRotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:vi.ROTATE,MIDDLE:vi.DOLLY,RIGHT:vi.PAN},this.touches={ONE:xi.ROTATE,TWO:xi.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._domElementKeyEvents=null,this._lastPosition=new R,this._lastQuaternion=new pn,this._lastTargetPosition=new R,this._quat=new pn().setFromUnitVectors(e.up,new R(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new Os,this._sphericalDelta=new Os,this._scale=1,this._panOffset=new R,this._rotateStart=new re,this._rotateEnd=new re,this._rotateDelta=new re,this._panStart=new re,this._panEnd=new re,this._panDelta=new re,this._dollyStart=new re,this._dollyEnd=new re,this._dollyDelta=new re,this._dollyDirection=new R,this._mouse=new re,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=gx.bind(this),this._onPointerDown=mx.bind(this),this._onPointerUp=_x.bind(this),this._onContextMenu=Ex.bind(this),this._onMouseWheel=xx.bind(this),this._onKeyDown=bx.bind(this),this._onTouchStart=Sx.bind(this),this._onTouchMove=Mx.bind(this),this._onMouseDown=yx.bind(this),this._onMouseMove=vx.bind(this),this._interceptControlDown=wx.bind(this),this._interceptControlUp=Tx.bind(this),this.domElement!==null&&this.connect(this.domElement),this.update()}connect(e){super.connect(e),this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents(),this.domElement.getRootNode().removeEventListener("keydown",this._interceptControlDown,{capture:!0}),this.domElement.style.touchAction="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(e){e.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=e}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(_f),this.update(),this.state=at.NONE}update(e=null){let t=this.object.position;Rt.copy(t).sub(this.target),Rt.applyQuaternion(this._quat),this._spherical.setFromVector3(Rt),this.autoRotate&&this.state===at.NONE&&this._rotateLeft(this._getAutoRotationAngle(e)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let i=this.minAzimuthAngle,s=this.maxAzimuthAngle;isFinite(i)&&isFinite(s)&&(i<-Math.PI?i+=Qt:i>Math.PI&&(i-=Qt),s<-Math.PI?s+=Qt:s>Math.PI&&(s-=Qt),i<=s?this._spherical.theta=Math.max(i,Math.min(s,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(i+s)/2?Math.max(i,this._spherical.theta):Math.min(s,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let r=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{let o=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),r=o!=this._spherical.radius}if(Rt.setFromSpherical(this._spherical),Rt.applyQuaternion(this._quatInverse),t.copy(this.target).add(Rt),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let o=null;if(this.object.isPerspectiveCamera){let a=Rt.length();o=this._clampDistance(a*this._scale);let l=a-o;this.object.position.addScaledVector(this._dollyDirection,l),this.object.updateMatrixWorld(),r=!!l}else if(this.object.isOrthographicCamera){let a=new R(this._mouse.x,this._mouse.y,0);a.unproject(this.object);let l=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),r=l!==this.object.zoom;let c=new R(this._mouse.x,this._mouse.y,0);c.unproject(this.object),this.object.position.sub(c).add(a),this.object.updateMatrixWorld(),o=Rt.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;o!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(o).add(this.object.position):(wl.origin.copy(this.object.position),wl.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(wl.direction))<px?this.object.lookAt(this.target):(yf.setFromNormalAndCoplanarPoint(this.object.up,this.target),wl.intersectPlane(yf,this.target))))}else if(this.object.isOrthographicCamera){let o=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),o!==this.object.zoom&&(this.object.updateProjectionMatrix(),r=!0)}return this._scale=1,this._performCursorZoom=!1,r||this._lastPosition.distanceToSquared(this.object.position)>Mu||8*(1-this._lastQuaternion.dot(this.object.quaternion))>Mu||this._lastTargetPosition.distanceToSquared(this.target)>Mu?(this.dispatchEvent(_f),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(e){return e!==null?Qt/60*this.autoRotateSpeed*e:Qt/60/60*this.autoRotateSpeed}_getZoomScale(e){let t=Math.abs(e*.01);return Math.pow(.95,this.zoomSpeed*t)}_rotateLeft(e){this._sphericalDelta.theta-=e}_rotateUp(e){this._sphericalDelta.phi-=e}_panLeft(e,t){Rt.setFromMatrixColumn(t,0),Rt.multiplyScalar(-e),this._panOffset.add(Rt)}_panUp(e,t){this.screenSpacePanning===!0?Rt.setFromMatrixColumn(t,1):(Rt.setFromMatrixColumn(t,0),Rt.crossVectors(this.object.up,Rt)),Rt.multiplyScalar(e),this._panOffset.add(Rt)}_pan(e,t){let i=this.domElement;if(this.object.isPerspectiveCamera){let s=this.object.position;Rt.copy(s).sub(this.target);let r=Rt.length();r*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*e*r/i.clientHeight,this.object.matrix),this._panUp(2*t*r/i.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(e*(this.object.right-this.object.left)/this.object.zoom/i.clientWidth,this.object.matrix),this._panUp(t*(this.object.top-this.object.bottom)/this.object.zoom/i.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(e,t){if(!this.zoomToCursor)return;this._performCursorZoom=!0;let i=this.domElement.getBoundingClientRect(),s=e-i.left,r=t-i.top,o=i.width,a=i.height;this._mouse.x=s/o*2-1,this._mouse.y=-(r/a)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(e){return Math.max(this.minDistance,Math.min(this.maxDistance,e))}_handleMouseDownRotate(e){this._rotateStart.set(e.clientX,e.clientY)}_handleMouseDownDolly(e){this._updateZoomParameters(e.clientX,e.clientX),this._dollyStart.set(e.clientX,e.clientY)}_handleMouseDownPan(e){this._panStart.set(e.clientX,e.clientY)}_handleMouseMoveRotate(e){this._rotateEnd.set(e.clientX,e.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(Qt*this._rotateDelta.x/t.clientHeight),this._rotateUp(Qt*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(e){this._dollyEnd.set(e.clientX,e.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(e){this._panEnd.set(e.clientX,e.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(e){this._updateZoomParameters(e.clientX,e.clientY),e.deltaY<0?this._dollyIn(this._getZoomScale(e.deltaY)):e.deltaY>0&&this._dollyOut(this._getZoomScale(e.deltaY)),this.update()}_handleKeyDown(e){let t=!1;switch(e.code){case this.keys.UP:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(Qt*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,this.keyPanSpeed),t=!0;break;case this.keys.BOTTOM:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(-Qt*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,-this.keyPanSpeed),t=!0;break;case this.keys.LEFT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(Qt*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,0),t=!0;break;case this.keys.RIGHT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(-Qt*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,0),t=!0;break}t&&(e.preventDefault(),this.update())}_handleTouchStartRotate(e){if(this._pointers.length===1)this._rotateStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),i=.5*(e.pageX+t.x),s=.5*(e.pageY+t.y);this._rotateStart.set(i,s)}}_handleTouchStartPan(e){if(this._pointers.length===1)this._panStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),i=.5*(e.pageX+t.x),s=.5*(e.pageY+t.y);this._panStart.set(i,s)}}_handleTouchStartDolly(e){let t=this._getSecondPointerPosition(e),i=e.pageX-t.x,s=e.pageY-t.y,r=Math.sqrt(i*i+s*s);this._dollyStart.set(0,r)}_handleTouchStartDollyPan(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enablePan&&this._handleTouchStartPan(e)}_handleTouchStartDollyRotate(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enableRotate&&this._handleTouchStartRotate(e)}_handleTouchMoveRotate(e){if(this._pointers.length==1)this._rotateEnd.set(e.pageX,e.pageY);else{let i=this._getSecondPointerPosition(e),s=.5*(e.pageX+i.x),r=.5*(e.pageY+i.y);this._rotateEnd.set(s,r)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(Qt*this._rotateDelta.x/t.clientHeight),this._rotateUp(Qt*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(e){if(this._pointers.length===1)this._panEnd.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),i=.5*(e.pageX+t.x),s=.5*(e.pageY+t.y);this._panEnd.set(i,s)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(e){let t=this._getSecondPointerPosition(e),i=e.pageX-t.x,s=e.pageY-t.y,r=Math.sqrt(i*i+s*s);this._dollyEnd.set(0,r),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);let o=(e.pageX+t.x)*.5,a=(e.pageY+t.y)*.5;this._updateZoomParameters(o,a)}_handleTouchMoveDollyPan(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enablePan&&this._handleTouchMovePan(e)}_handleTouchMoveDollyRotate(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enableRotate&&this._handleTouchMoveRotate(e)}_addPointer(e){this._pointers.push(e.pointerId)}_removePointer(e){delete this._pointerPositions[e.pointerId];for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId){this._pointers.splice(t,1);return}}_isTrackingPointer(e){for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId)return!0;return!1}_trackPointer(e){let t=this._pointerPositions[e.pointerId];t===void 0&&(t=new re,this._pointerPositions[e.pointerId]=t),t.set(e.pageX,e.pageY)}_getSecondPointerPosition(e){let t=e.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[t]}_customWheelEvent(e){let t=e.deltaMode,i={clientX:e.clientX,clientY:e.clientY,deltaY:e.deltaY};switch(t){case 1:i.deltaY*=16;break;case 2:i.deltaY*=100;break}return e.ctrlKey&&!this._controlActive&&(i.deltaY*=10),i}};function mx(n){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(n.pointerId),this.domElement.addEventListener("pointermove",this._onPointerMove),this.domElement.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(n)&&(this._addPointer(n),n.pointerType==="touch"?this._onTouchStart(n):this._onMouseDown(n)))}function gx(n){this.enabled!==!1&&(n.pointerType==="touch"?this._onTouchMove(n):this._onMouseMove(n))}function _x(n){switch(this._removePointer(n),this._pointers.length){case 0:this.domElement.releasePointerCapture(n.pointerId),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(vf),this.state=at.NONE;break;case 1:let e=this._pointers[0],t=this._pointerPositions[e];this._onTouchStart({pointerId:e,pageX:t.x,pageY:t.y});break}}function yx(n){let e;switch(n.button){case 0:e=this.mouseButtons.LEFT;break;case 1:e=this.mouseButtons.MIDDLE;break;case 2:e=this.mouseButtons.RIGHT;break;default:e=-1}switch(e){case vi.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(n),this.state=at.DOLLY;break;case vi.ROTATE:if(n.ctrlKey||n.metaKey||n.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(n),this.state=at.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(n),this.state=at.ROTATE}break;case vi.PAN:if(n.ctrlKey||n.metaKey||n.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(n),this.state=at.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(n),this.state=at.PAN}break;default:this.state=at.NONE}this.state!==at.NONE&&this.dispatchEvent(Eu)}function vx(n){switch(this.state){case at.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(n);break;case at.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(n);break;case at.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(n);break}}function xx(n){this.enabled===!1||this.enableZoom===!1||this.state!==at.NONE||(n.preventDefault(),this.dispatchEvent(Eu),this._handleMouseWheel(this._customWheelEvent(n)),this.dispatchEvent(vf))}function bx(n){this.enabled!==!1&&this._handleKeyDown(n)}function Sx(n){switch(this._trackPointer(n),this._pointers.length){case 1:switch(this.touches.ONE){case xi.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(n),this.state=at.TOUCH_ROTATE;break;case xi.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(n),this.state=at.TOUCH_PAN;break;default:this.state=at.NONE}break;case 2:switch(this.touches.TWO){case xi.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(n),this.state=at.TOUCH_DOLLY_PAN;break;case xi.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(n),this.state=at.TOUCH_DOLLY_ROTATE;break;default:this.state=at.NONE}break;default:this.state=at.NONE}this.state!==at.NONE&&this.dispatchEvent(Eu)}function Mx(n){switch(this._trackPointer(n),this.state){case at.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(n),this.update();break;case at.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(n),this.update();break;case at.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(n),this.update();break;case at.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(n),this.update();break;default:this.state=at.NONE}}function Ex(n){this.enabled!==!1&&n.preventDefault()}function wx(n){n.key==="Control"&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function Tx(n){n.key==="Control"&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}var Rl=Math.PI*2,wu=Object.freeze({overview:{position:[5.8,3.35,6.8],distance:1.16},vessel:{position:[3.5,2.1,4.4],distance:1},close:{position:[1.9,1.1,2.35],distance:.82},top:{position:[1.2,8,1.3],distance:1.05}}),Sf=660,Ax=[[.47,-1.75],[1.02,-1.62],[1.12,-.62],[.94,-.13],[.36,.45],[.25,1.35],[.25,1.78]],Ru={cylinder:[[1.12,-1.755],[1.12,.995]],flask:[[.5,-1.8],[.96,-1.68],[1.02,-.78],[.84,-.25],[.27,.26],[.19,.82]]},Tu={cylinder:{center:[0,-.05,0],radius:2.42},flask:{center:[0,-.05,0],radius:2.23},tubular:{center:[0,-.02,0],radius:1.85}},ni=new Is([new R(-1.2,-.72,0),new R(-.7,.35,0),new R(0,.72,0),new R(.7,.35,0),new R(1.2,-.72,0)]),Xs=96,xf=ni.computeFrenetFrames(Xs,!1);function Cl(n,e,t){return Math.max(e,Math.min(t,n))}function Ei(n,e=0){let t=Math.sin((n+1)*12.9898+e*78.233)*43758.5453;return t-Math.floor(t)}function bf(n){return Object.hasOwn(Tu,n)?n:"cylinder"}function Mf(n){let e=Number(n.biomass),t=Number(n.carryingCapacity);return Cl((Number.isFinite(e)?e:0)/(Number.isFinite(t)&&t>0?t:2),0,1)}function Ef(n){return new De().setHSL(.37,.5+n*.24,.44-n*.21)}function Rx(n,e){for(let t=1;t<n.length;t+=1){let[i,s]=n[t];if(e<=s){let[r,o]=n[t-1];return ji.lerp(r,i,Cl((e-o)/(s-o),0,1))}}return n.at(-1)[0]}function ao(n,e,t,i=0,s=0){let r=(Ei(t,14+s)+i*(s?.07:.012))%1,o=Ei(t,12+s)*Rl+i*.045,a=Math.sqrt(Ei(t,13+s));if(e==="tubular"){ni.getPointAt(r,n);let l=Math.round(r*Xs);n.addScaledVector(xf.normals[l],Math.cos(o)*a*.23),n.addScaledVector(xf.binormals[l],Math.sin(o)*a*.23)}else{let l=Ru[e],c=l[0][1]+.08,u=l.at(-1)[1]-.08,d=ji.lerp(c,u,r),h=Math.max(0,Rx(l,d)-.09)*a;n.set(Math.cos(o)*h,d,Math.sin(o)*h)}return n}function Al(n){let e=new Set,t=new Set;n.traverse(i=>{i.geometry&&e.add(i.geometry),i.material&&(Array.isArray(i.material)?i.material:[i.material]).forEach(s=>t.add(s))}),e.forEach(i=>i.dispose()),t.forEach(i=>i.dispose())}function Mi(n={}){return new Ns({roughness:.55,metalness:.1,...n})}var Au=class{constructor(e){if(this.canvas=e,this.context=e.getContext("2d",{alpha:!1}),!this.context)throw new Error("Canvas projection is unavailable");this.width=0,this.height=0,this.point=new R,this.projected=new R}resize(){let e=this.canvas.getBoundingClientRect(),t=Math.min(globalThis.devicePixelRatio||1,2);this.width=Math.max(1,Math.floor(e.width)),this.height=Math.max(1,Math.floor(e.height)),this.canvas.width=Math.floor(this.width*t),this.canvas.height=Math.floor(this.height*t),this.context.setTransform(t,0,0,t,0,0)}project(e,t,i,s){return this.projected.set(e,t,i).project(s),[(this.projected.x+1)*this.width/2,(1-this.projected.y)*this.height/2,this.projected.z]}ring(e,t,i,s=36){return Array.from({length:s},(r,o)=>{let a=o/s*Rl;return this.project(Math.cos(a)*e,t,Math.sin(a)*e,i)})}path(e,t=!0){this.context.beginPath(),e.forEach(([i,s],r)=>r?this.context.lineTo(i,s):this.context.moveTo(i,s)),t&&this.context.closePath()}lathe(e,t,i,s,r=!1){let o=this.context,a=e.map(([u,d])=>this.ring(u,d,t)),l=[];for(let u=1;u<a.length;u+=1)for(let d=0;d<a[u].length;d+=1){let h=(d+1)%a[u].length;l.push([a[u-1][d],a[u-1][h],a[u][h],a[u][d]])}r&&l.push(a[0],a.at(-1));let c=u=>u.reduce((d,h)=>d+h[2],0)/u.length;l.sort((u,d)=>c(d)-c(u)),o.fillStyle=i,o.globalAlpha=s;for(let u of l)this.path(u),o.fill();o.globalAlpha=1}draw(e,t,i){let s=this.context,r=this.width,o=this.height;i.updateMatrixWorld();let a=Mf(e),l=Ef(a).getStyle(),c=s.createLinearGradient(0,0,r,o);c.addColorStop(0,"#0b2116"),c.addColorStop(.55,"#07150e"),c.addColorStop(1,"#040b07"),s.fillStyle=c,s.fillRect(0,0,r,o),s.strokeStyle="rgba(145,228,156,.08)",s.lineWidth=1;for(let h=0;h<r;h+=28)s.beginPath(),s.moveTo(h,0),s.lineTo(h,o),s.stroke();for(let h=14;h<o;h+=28)s.beginPath(),s.moveTo(0,h),s.lineTo(r,h),s.stroke();let u=s.createRadialGradient(r/2,o/2,0,r/2,o/2,Math.max(r,o)*.6);if(u.addColorStop(0,"rgba(105,220,124,.18)"),u.addColorStop(1,"rgba(105,220,124,0)"),s.fillStyle=u,s.fillRect(0,0,r,o),e.geometry==="tubular"){let h=Array.from({length:Xs+1},(g,y)=>(ni.getPointAt(y/Xs,this.point),this.project(this.point.x,this.point.y,this.point.z,i))),f=o/(2*Math.tan(ji.degToRad(i.fov/2))*i.position.length());s.lineCap="round",this.path(h,!1),s.lineWidth=f*.84,s.strokeStyle="rgba(188,245,205,.38)",s.stroke(),this.path(h,!1),s.lineWidth=f*.68,s.strokeStyle=l,s.globalAlpha=.35+a*.45,s.stroke(),s.globalAlpha=1;for(let g of[h[0],h.at(-1)])s.beginPath(),s.arc(g[0],g[1],f*.44,0,Rl),s.fillStyle="#356849",s.fill()}else{let h=e.geometry==="flask",f=h?Ax:[[1.22,-1.81],[1.22,1.81]];this.lathe([[h?1.3:1.42,-1.95],[h?1.17:1.32,-1.79]],i,"#356849",1,!0),this.lathe(Ru[e.geometry],i,l,.26+a*.45,!0),this.lathe(f,i,"#bcefd0",.055),s.strokeStyle="rgba(188,245,205,.7)",s.lineWidth=2,this.path(this.ring(f.at(-1)[0],f.at(-1)[1],i)),s.stroke(),s.strokeStyle="rgba(188,245,205,.3)",s.lineWidth=1,this.path(this.ring(f[0][0],f[0][1],i)),s.stroke()}let d=Math.max(18,Math.floor(18+a*(Sf-18)));for(let h=0;h<d;h+=1){ao(this.point,e.geometry,h,t);let[f,g]=this.project(this.point.x,this.point.y,this.point.z,i);s.fillStyle=h%7===0?"rgba(115,216,211,.75)":"rgba(181,255,192,.7)",s.beginPath(),s.arc(f,g,1+Ei(h,6),0,Rl),s.fill()}s.fillStyle="#a5beac",s.font="9px IBM Plex Mono, monospace",s.fillText("CANVAS / SYNTHETIC PROJECTION",16,o-12)}},Il=class{constructor(e){this.canvas=e,this.mode="canvas",this.cameraName="overview",this.state={geometry:"cylinder",biomass:.1,carryingCapacity:2,running:!1},this.clock=new Zr,this.raf=0,this.destroyed=!1,this.needsRender=!0,this.renderingFrame=!1,this.reducedMotionQuery=typeof globalThis.matchMedia=="function"?globalThis.matchMedia("(prefers-reduced-motion: reduce)"):null,this.reducedMotion=!!this.reducedMotionQuery?.matches,this.onVisibilityChange=()=>this.scheduleRender(),this.onMotionPreferenceChange=t=>{this.reducedMotion=!!t.matches,this.controls&&(this.controls.enableDamping=!this.reducedMotion),this.scheduleRender()},this.onContextLost=t=>{t.preventDefault(),this.activateCanvasFallback(new Error("webgl-context-lost"))},this.onCanvasKeyDown=t=>this.handleCanvasKey(t),this.resizeObserver=typeof ResizeObserver=="function"?new ResizeObserver(()=>this.resize()):null,this.resizeObserver?.observe(e),this.fallback=null,this.scene=null,this.camera=null,this.webgl=null,this.controls=null,this.vesselGroup=null,this.cultureGroup=null,this.liquidGroup=null,this.bubbles=null,this.particles=null,this.particlePositions=null,this.particleCount=0,this.particlePoint=new R,this.bubblePoint=new R,this.reducedMotionQuery?.addEventListener?.("change",this.onMotionPreferenceChange),globalThis.document?.addEventListener?.("visibilitychange",this.onVisibilityChange),this.animate=this.animate.bind(this),this.setup(),this.scheduleRender()}setup(){if((()=>{try{return new URLSearchParams(globalThis.location?.search||"").get("render")==="2d"}catch{return!1}})()){this.activateCanvasFallback();return}try{this.canvas.addEventListener("webglcontextlost",this.onContextLost,{once:!0}),this.webgl=new Ml({canvas:this.canvas,antialias:!0,alpha:!1,powerPreference:"high-performance"}),this.webgl.setPixelRatio(Math.min(globalThis.devicePixelRatio||1,1.8)),this.webgl.outputColorSpace=Vt,this.webgl.toneMapping=Na,this.webgl.toneMappingExposure=1.15,this.mode="webgl",this.buildScene(),this.canvas.dataset.renderer="webgl",this.canvas.dataset.drawCalls="1",this.setCamera("overview"),this.resize()}catch(t){this.activateCanvasFallback(t)}this.canvas.dataset.camera=this.cameraName,this.canvas.dataset.geometry=this.state.geometry}replaceCanvas(){let e=this.canvas,t=e.cloneNode(!1);return e.replaceWith(t),e.removeEventListener("webglcontextlost",this.onContextLost),e.removeEventListener("keydown",this.onCanvasKeyDown),this.resizeObserver?.disconnect(),this.canvas=t,this.resizeObserver?.observe(t),t}activateCanvasFallback(e=null){if(!(this.destroyed||this.mode==="canvas"&&this.fallback)){this.mode="canvas";try{this.webgl?.dispose()}catch{}this.webgl=null,this.controls?.dispose(),this.controls=null,this.scene&&Al(this.scene),this.scene=null,this.vesselGroup=null,this.liquidGroup=null,this.cultureGroup=null,this.particles=null,this.bubbles=null,this.particlePositions=null,this.particleCount=0,this.replaceCanvas(),this.fallback=new Au(this.canvas),this.createCameraControls(),this.canvas.dataset.renderer="canvas",this.canvas.dataset.drawCalls="1",e?this.canvas.dataset.rendererError=e.message||"webgl-unavailable":delete this.canvas.dataset.rendererError,this.canvas.dataset.camera=this.cameraName,this.canvas.dataset.geometry=this.state.geometry,this.resize(),this.setCamera(this.cameraName),this.resize(),this.scheduleRender()}}createCameraControls(){this.camera=new Nt(31,1,.1,100),this.controls=new Tl(this.camera,this.canvas),this.controls.enableDamping=!this.reducedMotion,this.controls.dampingFactor=.065,this.controls.enablePan=!1,this.controls.minDistance=2.5,this.controls.maxDistance=20,this.controls.maxPolarAngle=Math.PI*.8,this.controls.addEventListener("change",()=>this.scheduleRender()),this.canvas.addEventListener("keydown",this.onCanvasKeyDown)}buildScene(){this.scene=new Ur,this.scene.background=new De(463631),this.scene.fog=new Nr(463631,9,20),this.createCameraControls(),this.scene.add(new qr(13302223,462858,1.8));let e=new Yr(10548135,3.4);e.position.set(3,7,4),this.scene.add(e);let t=new $i(6018769,4.5,10,2);t.position.set(-3,2.4,1.7),this.scene.add(t);let i=new $i(15773025,2.4,8,2);i.position.set(3.4,1,-2),this.scene.add(i);let s=new Je(new Kn(22,22),Mi({color:530192,roughness:.88,metalness:.02}));s.rotation.x=-Math.PI/2,s.position.y=-2.08,this.scene.add(s);let r=new Jr(18,18,2444342,1258273);r.position.y=-2.06,r.material.transparent=!0,r.material.opacity=.45,this.scene.add(r);let o=new Je(new Kn(18,10),Mi({color:729366,roughness:.9}));o.position.set(0,2.4,-3.5),this.scene.add(o);for(let h=-5;h<=5;h+=1){let f=new Je(new Un(.013,.013,7.5,8),Mi({color:h%2?2314297:3632457,emissive:730645,emissiveIntensity:.45}));f.position.set(h*.72,1.4,-3.42),f.rotation.z=Math.PI/2,f.rotation.y=h*.025,this.scene.add(f)}let a=new Je(new Jn(5.8,.06,.22),new Nn({color:11009984}));a.position.set(0,4.45,-1.6),this.scene.add(a);let l=new $i(10220714,1.6,7,2);l.position.set(0,4.1,-1.4),this.scene.add(l);let c=new Gt,u=new Je(new Jn(2.1,.75,.35),Mi({color:1322270,roughness:.42,metalness:.35}));u.position.set(-3.1,-.55,-2.7),c.add(u);let d=new Je(new Kn(1.45,.39),new Nn({color:5427360}));d.position.set(-3.1,-.4,-2.5),d.rotation.y=.03,c.add(d),this.scene.add(c),this.cultureGroup=new Gt,this.scene.add(this.cultureGroup),this.vesselGroup=new Gt,this.cultureGroup.add(this.vesselGroup),this.liquidGroup=new Gt,this.cultureGroup.add(this.liquidGroup),this.makeParticles(),this.makeBubbles(),this.setGeometry(this.state.geometry)}makeParticles(){let e=Sf,t=new Float32Array(e*3),i=new Float32Array(e*3);for(let o=0;o<e;o+=1)ao(this.particlePoint,this.state.geometry,o),t[o*3]=this.particlePoint.x,t[o*3+1]=this.particlePoint.y,t[o*3+2]=this.particlePoint.z,i[o*3]=o%7===0?.45:.42,i[o*3+1]=o%7===0?.84:.92,i[o*3+2]=o%7===0?.82:.62;let s=new wt;s.setAttribute("position",new Ut(t,3)),s.setAttribute("color",new Ut(i,3)),s.setDrawRange(0,180);let r=new kr(s,new Cs({size:.038,vertexColors:!0,transparent:!0,opacity:.9,sizeAttenuation:!0,blending:Qr}));this.particles=r,this.particlePositions=t,this.particleCount=e,this.cultureGroup.add(r)}updateParticlePositions(e=0){if(!(!this.particles||!this.particlePositions)){for(let t=0;t<this.particleCount;t+=1)ao(this.particlePoint,this.state.geometry,t,e),this.particlePositions[t*3]=this.particlePoint.x,this.particlePositions[t*3+1]=this.particlePoint.y,this.particlePositions[t*3+2]=this.particlePoint.z;this.particles.geometry.attributes.position.needsUpdate=!0}}makeBubbles(){let t=new $r(.035,8,6),i=new Fr(t,new Nn({color:10485698,transparent:!0,opacity:.38}),48),s=new St;for(let r=0;r<48;r+=1){ao(this.bubblePoint,this.state.geometry,r,Ei(r,42),40),s.position.copy(this.bubblePoint);let o=.45+Ei(r,43)*1.2;s.scale.setScalar(o),s.updateMatrix(),i.setMatrixAt(r,s.matrix)}i.instanceMatrix.needsUpdate=!0,this.bubbles=i,this.cultureGroup.add(i)}updateBubbles(e=0){if(!this.bubbles)return;let t=new St;for(let i=0;i<this.bubbles.count;i+=1)ao(this.bubblePoint,this.state.geometry,i,e*.08+Ei(i,42),40),t.position.copy(this.bubblePoint),t.scale.setScalar(.45+Ei(i,43)*1.2),t.updateMatrix(),this.bubbles.setMatrixAt(i,t.matrix);this.bubbles.instanceMatrix.needsUpdate=!0}makeCylinder(){let e=new Gt,t=new Je(new Un(1.22,1.22,3.62,52,1,!0),new On({color:11067325,metalness:.03,roughness:.08,transmission:.35,transparent:!0,opacity:.25,side:$t}));e.add(t);let i=Mi({color:6143349,metalness:.56,roughness:.27,emissive:1195040,emissiveIntensity:.25}),s=new Je(new Ls(1.23,.055,10,52),i);s.rotation.x=Math.PI/2,s.position.y=1.81,e.add(s);let r=new Je(new Un(1.32,1.42,.16,48),i);return r.position.y=-1.87,e.add(r),this.makeLiquidCylinder(),e}makeLiquidCylinder(){let e=new Je(new Un(1.12,1.12,2.75,48),new On({color:2858594,roughness:.2,metalness:.02,transmission:.08,transparent:!0,opacity:.65,emissive:801570,emissiveIntensity:.36}));e.position.y=-.38,this.liquidGroup.add(e);let t=new Je(new Vr(1.11,48),new Nn({color:7266699,transparent:!0,opacity:.16,side:$t}));t.rotation.x=-Math.PI/2,t.position.y=1,this.liquidGroup.add(t)}makeFlask(){let e=[new re(.47,-1.75),new re(1.02,-1.62),new re(1.12,-.62),new re(.94,-.13),new re(.36,.45),new re(.25,1.35),new re(.25,1.78)],t=new Gt;t.add(new Je(new Ps(e,52),new On({color:11067325,transmission:.38,roughness:.08,transparent:!0,opacity:.26,side:$t})));let i=new Je(new Ls(.255,.045,10,32),Mi({color:6670202,metalness:.5,roughness:.24}));i.rotation.x=Math.PI/2,i.position.y=1.8,t.add(i);let s=new Je(new Un(1.17,1.3,.14,48),Mi({color:3632968,metalness:.5,roughness:.3}));s.position.y=-1.86,t.add(s);let r=Ru.flask.map(([a,l])=>new re(a,l+.13)),o=new Je(new Ps(r,48),new On({color:2858594,roughness:.2,transparent:!0,opacity:.68,emissive:735776,emissiveIntensity:.38}));return o.position.y=-.13,this.liquidGroup.add(o),t}makeTubular(){let e=new Gt,t=new Je(new Ds(ni,Xs,.42,20,!1),new On({color:11067325,roughness:.08,transmission:.28,transparent:!0,opacity:.25,side:$t}));e.add(t);let i=new Je(new Ds(ni,Xs,.34,18,!1),new On({color:2858594,roughness:.2,transparent:!0,opacity:.72,emissive:735776,emissiveIntensity:.4}));this.liquidGroup.add(i);let s=Mi({color:6143349,metalness:.5,roughness:.25});for(let[r,o]of[[ni.getPointAt(0),ni.getTangentAt(0)],[ni.getPointAt(1),ni.getTangentAt(1)]]){let a=new Je(new Un(.5,.5,.18,32),s);a.position.copy(r),a.quaternion.setFromUnitVectors(new R(0,1,0),o),e.add(a)}return e}setGeometry(e="cylinder"){let t=bf(e);if(this.state.geometry=t,this.canvas.dataset.geometry=t,this.mode!=="webgl"){this.setCamera(this.cameraName),this.scheduleRender();return}this.vesselGroup&&(Al(this.vesselGroup),this.vesselGroup.clear()),this.liquidGroup&&(Al(this.liquidGroup),this.liquidGroup.clear()),t==="flask"?this.vesselGroup.add(this.makeFlask()):t==="tubular"?this.vesselGroup.add(this.makeTubular()):this.vesselGroup.add(this.makeCylinder()),this.updateParticlePositions(),this.updateBubbles(),this.setState(this.state),this.setCamera(this.cameraName)}setState(e={}){let t=bf(e.geometry??this.state.geometry),i=t!==this.state.geometry;if(this.state={...this.state,...e,geometry:t},this.canvas.dataset.geometry=this.state.geometry,this.canvas.dataset.biomass=String(this.state.biomass??0),i){this.setGeometry(t);return}if(this.mode==="webgl"){let s=Mf(this.state),r=Ef(s);this.liquidGroup?.traverse(o=>{if(!o.material)return;(Array.isArray(o.material)?o.material:[o.material]).forEach(l=>{l.color&&l.color.copy(r),l.emissive&&l.emissive.copy(r).multiplyScalar(.16),"opacity"in l&&l.type!=="MeshBasicMaterial"&&(l.opacity=.2+s*.55)})}),this.particles&&(this.particles.geometry.setDrawRange(0,Math.max(18,Math.floor(18+s*(this.particleCount-18)))),this.particles.material.opacity=.3+s*.6),this.bubbles?.material&&(this.bubbles.material.color.copy(r).lerp(new De(10485698),.55),this.bubbles.material.opacity=.08+s*.34)}this.scheduleRender()}setCamera(e="overview"){let t=wu[e]||wu.overview;if(this.cameraName=wu[e]?e:"overview",this.canvas.dataset.camera=this.cameraName,!this.camera||!this.controls)return;let i=this.camera.aspect||1,s=(Tu[this.state.geometry]?.radius||2.42)/Tu.cylinder.radius,r=Cl(1/Math.max(i,.72),1,1.42),o=t.distance*s*r;this.camera.position.set(...t.position).multiplyScalar(o),this.controls.target.set(0,this.state.geometry==="tubular"?.05:-.08,0),this.controls.update(),this.scheduleRender()}resize(){let e=this.canvas.getBoundingClientRect(),t=Math.max(1,e.width),i=Math.max(1,e.height);if(this.mode==="canvas"&&this.fallback?.resize(),this.camera){let s=t/i,r=this.camera.aspect||s;this.camera.aspect=s,this.camera.fov=s<1?Cl(31+(1-s)*7,31,38):31,this.camera.updateProjectionMatrix(),this.mode==="webgl"&&this.webgl&&this.webgl.setSize(t,i,!1),Math.abs(r-s)>.08&&this.controls?this.setCamera(this.cameraName):this.scheduleRender();return}this.fallback&&(this.fallback.resize(),this.scheduleRender())}handleCanvasKey(e){if(!this.controls)return;let t=.12,i=!0;e.key==="ArrowLeft"?this.controls.rotateLeft(t):e.key==="ArrowRight"?this.controls.rotateLeft(-t):e.key==="ArrowUp"?this.controls.rotateUp(t):e.key==="ArrowDown"?this.controls.rotateUp(-t):e.key==="+"||e.key==="="?this.controls.dollyIn(1.12):e.key==="-"||e.key==="_"?this.controls.dollyOut(1.12):i=!1,i&&(e.preventDefault(),this.controls.update(),this.scheduleRender())}motionAllowed(){return!this.reducedMotion&&!globalThis.document?.hidden}scheduleRender(){this.needsRender=!0,!this.raf&&!this.renderingFrame&&!this.destroyed&&(this.raf=requestAnimationFrame(this.animate))}renderFrame(e){this.renderingFrame=!0;let t=this.clock.getElapsedTime(),i=this.motionAllowed()?t:0;try{this.mode==="webgl"&&this.webgl&&this.scene&&this.camera?(this.updateParticlePositions(i),this.updateBubbles(i),this.controls?.update(),this.webgl.render(this.scene,this.camera),this.canvas.dataset.drawCalls=String(this.webgl.info.render.calls)):this.fallback&&this.camera&&(this.fallback.draw(this.state,i,this.camera),this.canvas.dataset.drawCalls="1")}finally{this.renderingFrame=!1}this.needsRender=!1}animate(){this.raf=0,!this.destroyed&&(this.motionAllowed()?(this.renderFrame(),this.raf=requestAnimationFrame(this.animate)):this.needsRender&&this.renderFrame())}destroy(){this.destroyed=!0,cancelAnimationFrame(this.raf),this.raf=0,this.resizeObserver?.disconnect(),this.reducedMotionQuery?.removeEventListener?.("change",this.onMotionPreferenceChange),globalThis.document?.removeEventListener?.("visibilitychange",this.onVisibilityChange),this.canvas.removeEventListener("webglcontextlost",this.onContextLost),this.canvas.removeEventListener("keydown",this.onCanvasKeyDown),this.controls?.dispose(),this.scene&&Al(this.scene),this.webgl?.dispose(),this.fallback=null,this.scene=null,this.camera=null,this.controls=null,this.webgl=null}};var If=Object.freeze({dashboard:"Dashboard",laboratory:"Virtual Laboratory",simulations:"Simulations",strains:"Strain Explorer",experiments:"Experiments",assistant:"Assistant",notebook:"Notebook",reports:"Reports",settings:"Settings & data"}),Nl=new Set(Object.keys(If)),co=nh(),Ul=new Map(co.map(n=>[n.profileId,n])),Cx=document.querySelector("#simApp"),qs=document.querySelector("#simView"),Pl=document.querySelector("#simToast"),_={view:Df(),db:null,project:null,form:null,output:null,input:null,currentRun:null,comparison:null,renderer:null,assistantAnswer:null,assistantQuestion:"",backendUrl:"",backendKey:"",noteDraft:{title:"",content:""},comparisonSelection:null,playbackIndex:-1,playbackTimeHours:null,cameraName:"overview",outputSource:"none",draftDirty:!1,isRunning:!1,persistenceWarning:"",initializing:!0,chartResizeObserver:null,toastTimer:0},Cu="orr-biologicals-digital-lab-api",Iu="orr-biologicals-digital-lab-api-key";function Pf(){try{let n=new URLSearchParams(window.location.search),e=String(n.get("api")||sessionStorage.getItem(Cu)||"").trim(),t=String(n.get("apiKey")||sessionStorage.getItem(Iu)||"").trim();return{url:e,key:t}}catch{return{url:"",key:""}}}function Lf(n=Pf()){return{backendBaseUrl:n.url||void 0,backendHeaders:n.key?{"X-API-Key":n.key}:void 0,backendTimeoutMs:8e3}}function Df(){let n=window.location.hash.slice(1).split("?")[0];return Nl.has(n)?n:"laboratory"}function oe(n){return String(n??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function uo(n,e="scenario"){return String(n??"").trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,56)||e}function Ve(n,e=3){return n==null||!Number.isFinite(Number(n))?"\u2014":Number(n).toLocaleString("en-US",{maximumFractionDigits:e})}function Zs(n,e=1){return n==null||!Number.isFinite(Number(n))?"\u2014":`${Ve(n,e)}%`}function Ol(n){if(!n)return"Not yet saved";let e=new Date(n);return Number.isNaN(e.getTime())?"Unknown time":e.toLocaleString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit"})}function ho(n){return Ul.get(n)?.label||n||"Unknown profile"}function Lt(n){return n===void 0?void 0:JSON.parse(JSON.stringify(n))}function Pu(){return new Date().toISOString()}function js(n){let e=globalThis.crypto;return e?.randomUUID?`${n}_${e.randomUUID()}`:`${n}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,10)}`}function Js(n=_.project?.id){return n?`project:${n}`:"project:unselected"}function Nu(n){return _.db?.listUiSettings({scope:n})[0]||null}function Fl(n=_.project?.id){if(!n||!_.db)return[];let e=new Set(_.db.listExperiments({projectId:n}).map(t=>t.id));return _.db.listRuns().filter(t=>e.has(t.experimentId))}function Ix(n=_.project?.id){return n&&_.db?_.db.listExperiments({projectId:n}):[]}function Px(n=_.project?.id){return n&&_.db?_.db.listNotebookEntries({projectId:n}):[]}function Lx(n){return _.db?.getExperiment(n)?.projectId||null}function Ti(n){return n?.experimentId?Lx(n.experimentId):null}function Dx(){return _.persistenceWarning?`<div role="alert" aria-live="assertive" style="margin:0 0 18px;padding:13px 15px;color:#ffe9c7;background:#3b2918;border:1px solid rgba(226,177,109,.58);border-radius:9px;font:11px/1.55 var(--sim-mono)"><strong style="display:block;margin-bottom:4px;color:#ffd28e">LOCAL STORAGE WARNING</strong>${oe(_.persistenceWarning)}</div>`:""}function Bl(n){let e=n?.message||"The local persistence store rejected the change.";_.persistenceWarning=`Changes are currently held in this browser session only. No save was reported as successful. ${e}`}function Nx(n){return!!(n?.code&&/^(QUOTA_EXCEEDED|STORAGE_|SERIALIZATION_|ID_CONFLICT|NOT_FOUND|INVALID_STATE)/.test(n.code))}function Nf(){return _.output?rh(_.output):null}function Ne(n,e="success"){window.clearTimeout(_.toastTimer),Pl.textContent=n,Pl.classList.toggle("is-error",e==="error"),Pl.classList.add("is-visible"),_.toastTimer=window.setTimeout(()=>Pl.classList.remove("is-visible"),3400)}function kl(n,e,t="text/plain;charset=utf-8"){let i=new Blob([e],{type:t}),s=URL.createObjectURL(i),r=document.createElement("a");r.href=s,r.download=n,r.click(),window.setTimeout(()=>URL.revokeObjectURL(s),0)}function fo(n="arthrospira"){let e=cn({organism:n}),t=e.model;return{projectName:"Untitled culture study",scenarioLabel:e.scenario.label,organism:e.organism.profileId,geometry:"cylinder",durationHours:e.integration.durationHours,stepHours:e.integration.stepHours,initialBiomassG_L:e.initialConditions.biomassG_L,muMaxPerDay:t.muMaxPerDay,carryingCapacityG_L:t.carryingCapacityG_L,volumeL:t.volumeL,lightPpfd:t.environment.lightPpfd,temperatureC:t.environment.temperatureC,pH:t.environment.pH,nutrientMgL:t.environment.nutrientMgL,lightEnabled:t.responseFactors.light.enabled,temperatureEnabled:t.responseFactors.temperature.enabled,pHEnabled:t.responseFactors.pH.enabled,nutrientEnabled:t.responseFactors.nutrient.enabled}}function wf(n){return co.find(e=>e.label===n?.organism)?.profileId||"arthrospira"}function zl(n,e=_.project?.name,t=_.form?.geometry||"cylinder"){let i=fo(n.organism.profileId);return{...i,projectName:e||i.projectName,scenarioLabel:n.scenario.label,organism:n.organism.profileId,geometry:t,durationHours:n.integration.durationHours,stepHours:n.integration.stepHours,initialBiomassG_L:n.initialConditions.biomassG_L,muMaxPerDay:n.model.muMaxPerDay,carryingCapacityG_L:n.model.carryingCapacityG_L,volumeL:n.model.volumeL,lightPpfd:n.model.environment.lightPpfd,temperatureC:n.model.environment.temperatureC,pH:n.model.environment.pH,nutrientMgL:n.model.environment.nutrientMgL,lightEnabled:n.model.responseFactors.light.enabled,temperatureEnabled:n.model.responseFactors.temperature.enabled,pHEnabled:n.model.responseFactors.pH.enabled,nutrientEnabled:n.model.responseFactors.nutrient.enabled}}function ii(n,e,t,i=t.id){let s=n.collections[e];if(!Array.isArray(s))throw new Error(`Workspace snapshot is missing ${e}.`);let r=i?s.findIndex(c=>c.id===i):-1,o=r>=0?s[r]:null,a=Pu(),l={...o||{},...Lt(t),id:i||js(e==="uiSettings"?"ui_settings":e.slice(0,-1)),playerId:_.db.playerId,ownerId:_.db.playerId,createdAt:o?.createdAt||t.createdAt||a,updatedAt:a,dataOrigin:"synthetic-computational",provenance:o?.provenance||{kind:"synthetic-computational",origin:"synthetic",source:"algal-digital-lab",method:"local computational model",synthetic:!0,computational:!0}};return r>=0?s[r]=l:s.push(l),l}function si(n,e,t){let i=n.collections.uiSettings.find(s=>s.scope===e);return ii(n,"uiSettings",{...i||{},scope:e,settings:Lt(t)},i?.id||`ui_settings_${uo(e,"lab").replaceAll("-","_")}`)}function Ks(n){let e=_.db.exportState(),t=n(e);return _.db.importState(e,{mode:"replace"}),t}function Uu(){return{projectId:_.project?.id||null,draft:Lt(_.form),currentRunId:_.currentRun?.id||null,comparison:Lt(_.comparisonSelection),cameraName:_.cameraName,playbackIndex:Number.isInteger(_.playbackIndex)?_.playbackIndex:-1,playbackTimeHours:_.playbackTimeHours,draftDirty:_.draftDirty===!0}}function Uf(){return{activeProjectId:_.project?.id||null,view:Nl.has(_.view)?_.view:"laboratory"}}function Dt({showError:n=!0}={}){if(_.initializing||!_.db||!_.project||!_.form)return!0;try{return Ys(),Ks(e=>{let t=e.collections.projects.find(i=>i.id===_.project.id);if(!t)throw new Error("The active project no longer exists in local records.");ii(e,"projects",{...t,name:_.form.projectName,organism:ho(_.form.organism),model:gt,description:"A local-first synthetic microalgae growth investigation.",tags:["synthetic","computational"],draft:Lt(_.form)},t.id),si(e,Js(t.id),Uu()),si(e,"lab",Uf())}),_.project=_.db.getProject(_.project.id),!0}catch(e){return Nx(e)&&Bl(e),n&&Ne(`Project could not be saved: ${e.message}`,"error"),!1}}function Ux(n){if(_.output=null,_.outputSource=n?"missing":"none",!!n&&!(n.outputSnapshot===void 0||n.outputSnapshot===null))try{Yt(n.outputSnapshot),_.output=Lt(n.outputSnapshot),_.outputSource="stored"}catch{_.output=null,_.outputSource="invalid",_.persistenceWarning=`Saved run ${n.label||n.id} contains an invalid stored output. It was not recomputed or overwritten.`}}function Ox(n){if(_.comparison=null,_.comparisonSelection=n&&typeof n=="object"?{leftRunId:n.leftRunId||"",rightRunId:n.rightRunId||""}:null,!_.comparisonSelection?.leftRunId||!_.comparisonSelection?.rightRunId)return;let e=_.db.getRun(_.comparisonSelection.leftRunId),t=_.db.getRun(_.comparisonSelection.rightRunId);if(!(Ti(e)!==_.project?.id||Ti(t)!==_.project?.id)&&!(!e.outputSnapshot||!t.outputSnapshot))try{Yt(e.outputSnapshot),Yt(t.outputSnapshot),_.comparison=Kl(e.outputSnapshot,t.outputSnapshot)}catch(i){_.comparison=null,_.persistenceWarning=`A saved comparison could not be restored: ${i.message}`}}function po(n){_.project=n;let e=Nu(Js(n.id)),t=e?.settings&&typeof e.settings=="object"?e.settings:{},i=t.draft&&typeof t.draft=="object"?t.draft:n.draft;_.form={...fo(wf(n)),...i||{}},Ul.has(_.form.organism)||(_.form.organism=wf(n)),_.form.projectName=i?.projectName??n.name,_.cameraName=["overview","vessel","close","top"].includes(t.cameraName)?t.cameraName:"overview",_.playbackIndex=Number.isInteger(t.playbackIndex)?t.playbackIndex:-1,_.playbackTimeHours=Number.isFinite(t.playbackTimeHours)?t.playbackTimeHours:null,_.draftDirty=t.draftDirty===!0,_.input=null,_.currentRun=null,_.output=null,_.outputSource="none";let s=t.currentRunId?_.db.getRun(t.currentRunId):null;if(s&&Ti(s)===n.id){if(_.currentRun=s,i){if(s.parameters?.inputSnapshot)try{_.input=cn(s.parameters.inputSnapshot)}catch{_.input=null}}else try{_.input=cn(s.parameters?.inputSnapshot),_.form=zl(_.input,n.name,_.form.geometry)}catch(r){_.persistenceWarning=`The active run input snapshot could not be restored: ${r.message}`}Ux(s),_.output&&(!Number.isInteger(_.playbackIndex)||_.playbackIndex<0||_.playbackIndex>=_.output.timeSeries.length)&&(_.playbackIndex=_.output.timeSeries.length-1)}Ox(t.comparison)}function Fx(){let n=Pf();_.backendUrl=n.url,_.backendKey=n.key;try{_.db=as({playerId:"digital-lab-local",...Lf(n)})}catch(s){_.db=as({playerId:"digital-lab-local",storage:hr()}),_.persistenceWarning=`Browser storage could not be opened (${s.message}). The unreadable original was left untouched; this session is using an in-memory workspace and will not survive reload.`}let e=_.db.listProjects();if(!e.length)try{e=[_.db.createProject({name:"Untitled culture study",description:"A local-first synthetic microalgae growth investigation.",organism:"Arthrospira",model:gt,tags:["synthetic","computational"]})]}catch(s){_.persistenceWarning=`The initial project could not be written (${s.message}). This session is using an in-memory workspace; no save was reported as successful.`,_.db=as({playerId:"digital-lab-local",storage:hr()}),e=[_.db.createProject({name:"Untitled culture study",description:"A local-first synthetic microalgae growth investigation.",organism:"Arthrospira",model:gt,tags:["synthetic","computational"]})]}let t=Nu("lab")?.settings,i=e.find(s=>s.id===t?.activeProjectId)||e[0];po(i),!window.location.hash&&Nl.has(t?.view)&&(_.view=t.view),_.initializing=!1,Dt({showError:!1})}function Bx(){_.renderer?.destroy(),_.renderer=null,_.chartResizeObserver?.disconnect(),_.chartResizeObserver=null}function kx(){document.querySelectorAll("[data-view]").forEach(n=>{let e=n.dataset.view===_.view;n.classList.toggle("is-active",e),e&&n.classList.contains("sim-nav-item")?n.setAttribute("aria-current","page"):n.classList.contains("sim-nav-item")&&n.removeAttribute("aria-current")}),document.querySelector("#simBreadcrumb").textContent=If[_.view]}function lo(n,{updateHash:e=!0}={}){Nl.has(n)&&(_.view=n,e&&window.location.hash!==`#${n}`&&window.history.replaceState(null,"",`#${n}`),Dt({showError:!1}),xt())}function kn(n,e,t,i=""){return`<header class="sim-page-heading"><div><p class="sim-eyebrow">${oe(n)}</p><h1>${oe(e)}</h1></div><div>${t?`<p class="sim-page-subtitle">${oe(t)}</p>`:""}${i}</div></header>`}function Of(n){return`<div class="metric-strip">
    <div class="metric-mini"><span>Final biomass</span><strong>${n?`${Ve(n.finalBiomassG_L)}<small> g/L</small>`:"\u2014"}</strong><small>concentration</small></div>
    <div class="metric-mini"><span>Relative change</span><strong>${n?Zs(n.relativeChangePercent):"\u2014"}</strong><small>from initial state</small></div>
    <div class="metric-mini"><span>Growth rate</span><strong>${n?Ve(n.endpointGrowthRatePerDay,4):"\u2014"}</strong><small>net specific / day</small></div>
    <div class="metric-mini"><span>Runs in project</span><strong>${Fl().length}</strong><small>local records</small></div>
  </div>`}function zx(n,e=5){let t=[...n].reverse().slice(0,e);return t.length?`<table class="run-list"><thead><tr><th>Run</th><th>Organism</th><th>Final biomass</th><th>Status</th><th></th></tr></thead><tbody>${t.map(i=>{let s=i.parameters?.inputSnapshot,r=i.metrics||i.summary||{};return`<tr><td>${oe(i.label||"Untitled run")}<small>${oe(Ol(i.createdAt))}</small></td><td>${oe(s?.organism?.label||"Illustrative culture")}</td><td class="number">${Ve(r.finalBiomassG_L)} g/L</td><td><span class="status-pill">${oe(i.status||"completed")}</span></td><td><button class="sim-link-button" type="button" data-action="load-run" data-run-id="${oe(i.id)}">Open \u2192</button></td></tr>`}).join("")}</tbody></table>`:'<div class="sim-empty"><div><strong>No synthetic runs yet</strong><p>Configure a culture and run the first reproducible model trace in the Virtual Laboratory.</p><button class="sim-button primary" type="button" data-view="laboratory">Open laboratory</button></div></div>'}function Hx(){let n=Fl(),e=Nf();return`${kn("Algal Digital Lab \xB7 local workspace","A clear surface for uncertain biology.","Run a reproducible, illustrative culture model, inspect its trace, and keep every assumption attached to the result.")}
    <section class="dashboard-hero">
      <div class="dashboard-hero-copy"><p class="sim-eyebrow">Research workspace / synthetic mode</p><h2>Make the model legible.</h2><p>The lab turns a small set of environmental hypotheses into a versioned biomass trace. No hardware measurements, species identification, or process guarantee is implied.</p><div class="dashboard-hero-actions"><button class="sim-button primary" type="button" data-view="laboratory">Open virtual laboratory <span>\u2192</span></button><button class="sim-button ghost" type="button" data-view="strains">Browse reference profiles</button></div></div>
       <aside class="dashboard-signal-card"><div class="signal-topline"><span>Model signal</span><span>v1.0.0</span></div><div class="signal-wave" aria-hidden="true"></div><div class="signal-value"><strong>${e?Ve(e.finalBiomassG_L):"\u2014"}</strong><span>g/L endpoint</span></div><p class="signal-card-note">${e?`Saved output \xB7 ${oe(_.output.organism.label)}`:"No saved output \xB7 draft only"}</p></aside>
    </section>
    ${Of(e)}
    <div class="dashboard-grid" style="margin-top:16px">
      <section class="dashboard-panel panel-span-7"><div class="panel-heading"><div><h2>Recent runs</h2><p>Local experiment records stay in this browser until you export or sync them.</p></div><button class="sim-link-button" type="button" data-view="simulations">View all \u2192</button></div>${zx(n)}</section>
      <section class="dashboard-panel panel-span-5"><div class="panel-heading"><div><h2>Research shortcuts</h2><p>Move between the model, the organisms, and the record.</p></div></div><div class="quick-grid"><button class="quick-card" type="button" data-view="laboratory"><span>01</span><div><b>Configure a run</b><p>Change light, temperature, pH, nutrients, and duration.</p></div></button><button class="quick-card" type="button" data-view="strains"><span>02</span><div><b>Explore profiles</b><p>Reference labels with illustrative, not measured, parameters.</p></div></button><button class="quick-card" type="button" data-view="notebook"><span>03</span><div><b>Write a note</b><p>Attach a hypothesis to a project or run.</p></div></button><button class="quick-card" type="button" data-view="reports"><span>04</span><div><b>Export a report</b><p>Keep the model version and assumptions with the trace.</p></div></button></div></section>
      <section class="dashboard-panel panel-span-12"><div class="panel-heading"><div><h2>What this model is \u2014 and is not</h2><p>Transparent boundaries are part of the instrument.</p></div><span class="sim-provenance">Synthetic computational</span></div><div class="assumptions-panel" style="margin:0"><div><h3>Illustrative biomass bookkeeping</h3><p>The current engine integrates a logistic biomass equation with optional light, temperature, pH, and nutrient response factors. It is useful for comparing hypotheses and interface states, not for claiming biological performance.</p></div><ol><li>Fixed-step forward Euler integration.</li><li>Organism profiles are reference labels only.</li><li>All saved records carry synthetic provenance.</li><li>Hardware, actuators, cloud sync, and AI conclusions are outside this route.</li></ol></div></section>
    </div>`}function wi(n,e=""){let t=qs.querySelector(`[name="${n}"]`);return t?t.value:e}function Vx(n,e=!1){let t=qs.querySelector(`[name="${n}"]`);return t?t.checked:e}function Ys(){if(_.form){_.form.projectName=wi("projectName",_.form.projectName),_.form.scenarioLabel=wi("scenarioLabel",_.form.scenarioLabel),_.form.organism=wi("organism",_.form.organism),_.form.geometry=wi("geometry",_.form.geometry);for(let n of["durationHours","stepHours","initialBiomassG_L","muMaxPerDay","carryingCapacityG_L","volumeL","lightPpfd","temperatureC","pH","nutrientMgL"]){let e=qs.querySelector(`[name="${n}"]`);e&&(_.form[n]=e.value)}for(let n of["lightEnabled","temperatureEnabled","pHEnabled","nutrientEnabled"])_.form[n]=Vx(n,_.form[n])}}function Gx(n){let e=_.output?.timeSeries;if(!Array.isArray(e)||!e.length)return;_.playbackIndex=Math.max(0,Math.min(e.length-1,Number(n)||0));let t=e[_.playbackIndex];_.playbackTimeHours=t.timeHours,_.renderer?.setState({biomass:t.biomassG_L,carryingCapacity:Number(_.form.carryingCapacityG_L)||2,running:!1});let i=document.querySelector("#playbackBiomass"),s=document.querySelector("#playbackTime"),r=document.querySelector("#playbackTimeLabel");i&&(i.textContent=`${Ve(t.biomassG_L)} g/L`),s&&(s.textContent=`${Ve(t.timeHours,2)} h of ${Ve(_.output.integration.durationHours,2)} h`),r&&(r.textContent=`t = ${Ve(t.timeHours,2)} h \xB7 step ${t.step}`),Dt({showError:!1})}function Wx(n,e,t){let i=n[e];if(typeof i=="number"&&Number.isFinite(i))return i;if(typeof i!="string"||i.trim()==="")return t.push({path:e,message:"must not be empty; enter a number",code:"required"}),null;let s=Number(i);return Number.isFinite(s)?s:(t.push({path:e,message:"must be a finite number",code:"finite-number"}),null)}function Ff(){Ys();let n=_.form,e=[],t=typeof n.projectName=="string"?n.projectName.trim():"",i=typeof n.scenarioLabel=="string"?n.scenarioLabel.trim():"";t||e.push({path:"projectName",message:"must not be empty",code:"required"}),i||e.push({path:"scenarioLabel",message:"must not be empty",code:"required"}),i.length>160&&e.push({path:"scenarioLabel",message:"must be at most 160 characters",code:"text"});let s={};for(let l of["durationHours","stepHours","initialBiomassG_L","muMaxPerDay","carryingCapacityG_L","volumeL","lightPpfd","temperatureC","pH","nutrientMgL"])s[l]=Wx(n,l,e);if(e.length)throw new Et("Simulation form validation failed",e);let r=s.durationHours/s.stepHours;if(!Number.isInteger(r)||r>is.maxIntegrationSteps)throw new Et("Simulation workload validation failed",[{path:"integration",message:Number.isInteger(r)?`step count must not exceed ${is.maxIntegrationSteps}`:"duration must be evenly divisible by the time step",code:"workload-limit"}]);let o=Zl({},n.organism),a=Zl({muMaxPerDay:s.muMaxPerDay,carryingCapacityG_L:s.carryingCapacityG_L,volumeL:s.volumeL,environment:{...o.environment,lightPpfd:s.lightPpfd,temperatureC:s.temperatureC,pH:s.pH,nutrientMgL:s.nutrientMgL},responseFactors:{...o.responseFactors,light:{...o.responseFactors.light,enabled:n.lightEnabled},temperature:{...o.responseFactors.temperature,enabled:n.temperatureEnabled},pH:{...o.responseFactors.pH,enabled:n.pHEnabled},nutrient:{...o.responseFactors.nutrient,enabled:n.nutrientEnabled}}},n.organism);return cn({organism:n.organism,scenario:{id:uo(i),label:i},model:a,initialConditions:{biomassG_L:s.initialBiomassG_L,timeHours:0},integration:{method:"fixed-step-euler",durationHours:s.durationHours,stepHours:s.stepHours}})}function _n(n,e,t,i="",s="number",r=""){return`<label class="field-group"><span class="field-label">${oe(n)} ${i?`<em>${oe(i)}</em>`:""}</span><span class="input-with-unit"><input class="sim-input" name="${oe(e)}" type="${s}" value="${oe(t)}" ${r}>${i?`<span class="input-unit">${oe(i)}</span>`:""}</span></label>`}function Tf(n,e,t,i){return`<label class="field-group"><span class="field-label">${oe(n)}</span><select class="sim-select" name="${oe(e)}">${i.map(([s,r])=>`<option value="${oe(s)}"${s===t?" selected":""}>${oe(r)}</option>`).join("")}</select></label>`}function Ll(n,e,t,i){return`<label class="switch-row"><span>${oe(n)}<small>${oe(i)}</small></span><span class="sim-switch"><input type="checkbox" name="${oe(e)}"${t?" checked":""}><span aria-hidden="true"></span></span></label>`}function $x(){let n=_.form,e=co.map(i=>[i.profileId,i.label]),t=_.isRunning;return`<form class="sim-panel control-panel" id="simulationForm" novalidate aria-busy="${t?"true":"false"}"><h3>Simulation studio</h3><p class="panel-subtitle">A bounded, deterministic model snapshot. Every value is editable before a run.</p>
    ${_n("Project","projectName",n.projectName,"","text",'maxlength="80" required')}
    ${_n("Scenario label","scenarioLabel",n.scenarioLabel,"","text",'maxlength="160" required')}
    ${Tf("Reference profile","organism",n.organism,e)}
    ${Tf("Reactor geometry","geometry",n.geometry,[["cylinder","Vertical cylinder"],["flask","Erlenmeyer flask"],["tubular","Tubular loop"]])}
    <div class="control-divider"></div>
    <div class="field-label">Initial conditions</div>
    <div class="two-fields">${_n("Biomass","initialBiomassG_L",n.initialBiomassG_L,"g/L","number",'min="0" max="1000000" step="0.001"')}${_n("Volume","volumeL",n.volumeL,"L","number",'min="0.001" max="1000000" step="0.1"')}</div>
    <div class="control-divider"></div>
    <div class="field-label">Model configuration</div>
    <div class="two-fields">${_n("Max growth","muMaxPerDay",n.muMaxPerDay,"/day","number",'min="0" max="10" step="0.01"')}${_n("Capacity","carryingCapacityG_L",n.carryingCapacityG_L,"g/L","number",'min="0.001" max="1000000" step="0.1"')}</div>
    <div class="two-fields">${_n("Duration","durationHours",n.durationHours,"hours","number",'min="1" max="8760" step="1"')}${_n("Time step","stepHours",n.stepHours,"hours","number",'min="0.01" max="24" step="0.01"')}</div>
    <div class="control-divider"></div>
    <div class="field-label">Environment</div>
    <div class="two-fields">${_n("Light","lightPpfd",n.lightPpfd,"\xB5mol m\u207B\xB2 s\u207B\xB9","number",'min="0" max="10000" step="1" required')}${_n("Temperature","temperatureC",n.temperatureC,"\xB0C","number",'min="-20" max="80" step="0.1" required')}</div>
    <div class="two-fields">${_n("pH","pH",n.pH,"pH","number",'min="0" max="14" step="0.1"')}${_n("Nutrient","nutrientMgL",n.nutrientMgL,"mg/L","number",'min="0" max="1000000" step="1"')}</div>
    <div class="control-divider"></div>
    <div class="field-label">Response factors <em>toggle on / off</em></div>
    <div class="switch-list">${Ll("Light saturation","lightEnabled",n.lightEnabled,"Monod-like response")}${Ll("Temperature","temperatureEnabled",n.temperatureEnabled,"Gaussian response")}${Ll("pH","pHEnabled",n.pHEnabled,"Gaussian response")}${Ll("Nutrients","nutrientEnabled",n.nutrientEnabled,"Monod-like response")}</div>
    <div class="control-actions"><button class="sim-button primary" type="submit" data-action="run"${t?" disabled":""}>${t?"\u23F3 Running bounded workload\u2026":"\u25B6 Run model"}</button><button class="sim-button ghost" type="button" data-action="reset-form"${t?" disabled":""}>Reset draft</button><button class="sim-button ghost" type="button" data-action="duplicate-scenario"${t?" disabled":""}>Duplicate scenario</button></div>
    ${t?'<p class="sim-muted" aria-live="polite" style="margin:10px 0 0;font:10px var(--sim-mono)">Computation in progress. Run controls are disabled until the bounded step workload completes.</p>':""}
    <div class="validation-message" id="validationMessage" role="alert" aria-live="assertive"></div>
  </form>`}function Xx(n){let e=n?.inputSnapshot,t=n?.timeSeries?.at(-1);return!e||!t?'<div class="sim-empty" style="min-height:150px"><div><strong>Factors appear after a run</strong><p>Run the configured scenario to inspect the response terms.</p></div></div>':`<div class="factor-list">${[["Light",t.lightFactor],["Temperature",t.temperatureFactor],["pH",t.pHFactor],["Nutrient",t.nutrientFactor]].map(([s,r])=>`<div class="factor-row"><span>${s}</span><span class="factor-track"><i style="width:${Math.round(Math.max(0,Math.min(1,r))*100)}%"></i></span><b>${Ve(r,2)}</b></div>`).join("")}</div>`}function Ou(){let n=_.output?.timeSeries;if(!Array.isArray(n)||!n.length)return null;let e=Number.isInteger(_.playbackIndex)&&_.playbackIndex>=0?Math.min(_.playbackIndex,n.length-1):n.length-1;return{point:n[e],index:e,total:n.length}}function qx(){let n=Nf(),e=_.output,t=e?.organism?.label||ho(_.form.organism),i=Ou(),s=_.currentRun&&!e?'<div role="status" style="margin:0 0 14px;padding:10px;color:var(--sim-amber);background:rgba(226,177,109,.08);border:1px solid rgba(226,177,109,.22);border-radius:7px;font:10px/1.45 var(--sim-mono)">This saved run has no stored output. <button class="sim-link-button" type="button" data-action="recompute-current-run">Recompute from its input snapshot</button> (explicitly disclosed; the saved snapshot will not be changed).</div>':"";return`<aside class="sim-panel telemetry-panel"><div class="telemetry-head"><div><h3>Run telemetry</h3><small>${oe(t)} \xB7 ${e?oe(e.scenario.label):"No saved output selected"}</small></div><span class="live-dot" aria-label="Local model ready"></span></div>
    ${s}<div class="result-hero"><span class="result-label">Saved endpoint biomass</span><strong>${n?Ve(n.finalBiomassG_L):"\u2014"}</strong><small>g/L \xB7 ${n?`\u0394 ${Ve(n.deltaBiomassG_L)} g/L`:"no endpoint before a run"}</small></div>
    <dl class="result-list"><div><dt>Model state</dt><dd>${e?_.outputSource==="stored"?"STORED OUTPUT":"RECOMPUTED":"DRAFT / NOT RUN"}</dd></div><div><dt>Integration</dt><dd>${e?`${Ve(e.integration.durationHours,0)} h / ${Ve(e.integration.stepHours,2)} h`:"Not run"}</dd></div><div><dt>Steps</dt><dd>${n?Ve(n.stepCount,0):"Not run"}</dd></div><div><dt>Relative change</dt><dd>${n?Zs(n.relativeChangePercent):"\u2014"}</dd></div></dl>
    ${i?`<div style="margin:0 0 14px;padding:10px;background:rgba(115,216,211,.06);border:1px solid rgba(115,216,211,.18);border-radius:7px"><div class="field-label" style="margin-bottom:4px">Playback point <em>separate from saved endpoint</em></div><strong id="playbackBiomass">${Ve(i.point.biomassG_L)} g/L</strong><small id="playbackTimeLabel" style="display:block;color:var(--sim-mute);font:10px var(--sim-mono)">t = ${Ve(i.point.timeHours,2)} h \xB7 step ${i.point.step}</small></div>`:""}
    <div><div class="field-label" style="margin-bottom:10px">Response factors <em>endpoint</em></div>${Xx(e)}</div>
    <div class="provenance-note"><strong>${e?_.outputSource==="stored"?"Stored evidence":"Explicitly recomputed evidence":"Draft boundary"}</strong>${e?"The displayed output is the saved run snapshot unless explicitly marked recomputed. It is synthetic computational data, not a sensor reading, calibration, species identification, CFD result, or actuator instruction.":"No endpoint or integration result is being inferred before a successful run."}</div>
  </aside>`}function jx(){let n=_.output,e=Ou(),t=e?.point.biomassG_L??_.form.initialBiomassG_L,i=_.form.geometry,s=_.cameraName;return`<section class="visual-panel sim-panel"><canvas id="labCanvas" tabindex="0" aria-label="Interactive procedural 3D synthetic reactor. Drag to orbit and use the camera controls to inspect the culture vessel."></canvas><div class="scene-kicker"><span class="sim-eyebrow">Procedural virtual reactor</span><strong>${oe(n?.organism?.label||ho(_.form.organism))}</strong><small>${oe(i)} geometry \xB7 browser rendered</small></div><div class="scene-telemetry"><div class="telemetry-item"><span>${n?"PLAYBACK BIOMASS":"DRAFT BIOMASS"}</span><strong>${Ve(t)} g/L</strong></div><div class="telemetry-item"><span>${n?"PLAYBACK TIME":"STATUS"}</span><strong>${e?`${Ve(e.point.timeHours,2)} h`:_.isRunning?"RUNNING":"DRAFT PREVIEW"}</strong></div><div class="telemetry-item"><span>MODE</span><strong>${n?"STORED TRACE":"SIMULATED DRAFT"}</strong></div></div>${e?`<label style="position:absolute;left:18px;right:18px;bottom:56px;z-index:3;color:var(--sim-ink-soft);font:9px var(--sim-mono)">Playback scrubber <input id="playbackScrubber" type="range" min="0" max="${e.total-1}" step="1" value="${e.index}" aria-label="Playback time through stored simulation trace" style="width:100%;accent-color:var(--sim-leaf)"><span id="playbackTime" style="display:block;margin-top:3px;color:var(--sim-leaf)">${Ve(e.point.timeHours,2)} h of ${Ve(n.integration.durationHours,2)} h</span></label>`:""}<div class="scene-camera-control" role="group" aria-label="Virtual reactor camera"><button class="camera-button${s==="overview"?" is-active":""}" type="button" data-action="camera" data-camera="overview">Overview</button><button class="camera-button${s==="vessel"?" is-active":""}" type="button" data-action="camera" data-camera="vessel">Vessel</button><button class="camera-button${s==="close"?" is-active":""}" type="button" data-action="camera" data-camera="close">Close</button><button class="camera-button${s==="top"?" is-active":""}" type="button" data-action="camera" data-camera="top">Top</button></div><div class="scene-legend"><span class="legend-item"><i class="legend-dot green"></i>culture volume</span><span class="legend-item"><i class="legend-dot cyan"></i>flow markers</span><span class="legend-item"><i class="legend-dot amber"></i>synthetic state</span></div><div class="scene-status" id="sceneStatus">WebGL / Canvas projection \xB7 synthetic state linked</div><div class="scene-loading" id="sceneLoading"><span class="loader"></span><span>Loading procedural laboratory\u2026</span></div></section>`}function Yx(){let n=_.output;return`<section class="analysis-panel"><div class="panel-heading"><div><h2>Biomass trajectory</h2><p>Concentration across the fixed-step integration window.</p></div><span class="sim-provenance">${n?_.outputSource==="stored"?"stored trace":"recomputed trace":"awaiting run"}</span></div><div class="chart-wrap"><canvas id="biomassChart" aria-label="Biomass trajectory chart"></canvas>${n?"":'<div class="chart-empty">Run the model to plot a trajectory</div>'}</div>${n?`<div class="run-meta"><span class="meta-chip"><strong>Equation</strong> logistic dX/dt</span><span class="meta-chip"><strong>Engine</strong> ${jt}</span><span class="meta-chip"><strong>Origin</strong> synthetic</span></div>`:""}</section>`}function Zx(){let n=Fl(),e=_.comparisonSelection?.leftRunId||"",t=_.comparisonSelection?.rightRunId||"",i=(a,l)=>`<option value="${oe(a.id)}"${a.id===l?" selected":""}>${oe(a.label||a.id)}</option>`,s=n.map(a=>i(a,e)).join(""),r=n.map(a=>i(a,t)).join(""),o=_.comparison;return`<section class="analysis-panel"><div class="panel-heading"><div><h2>Compare scenarios</h2><p>Change one hypothesis, keep the stored traces attached to this project.</p></div><span class="sim-provenance">stored traces</span></div><div class="compare-box"><div class="compare-row"><label class="field-group"><span class="field-label">Reference run</span><select class="sim-select" id="compareLeft"><option value="">Choose a run</option>${s}</select></label><span>vs</span><label class="field-group"><span class="field-label">Variant run</span><select class="sim-select" id="compareRight"><option value="">Choose a run</option>${r}</select></label></div><button class="sim-button" type="button" data-action="compare-runs"${n.length<2?" disabled":""}>Compare stored runs</button>${o?`<div class="compare-result"><div><span>Changed parameters</span><strong>${o.changedParametersCount}</strong></div><div><span>Endpoint difference</span><strong>${Ve(o.metrics.difference.finalBiomassG_L)} g/L</strong></div><div><span>Relative change difference</span><strong>${o.metrics.difference.relativeChange===null?"\u2014":Zs(o.metrics.difference.relativeChange*100)}</strong></div></div>`:""}</div></section>`}function Af(){let n=_.draftDirty&&_.output?'<div role="status" style="margin:0 0 16px;padding:11px 13px;color:var(--sim-cyan);background:rgba(115,216,211,.06);border:1px solid rgba(115,216,211,.2);border-radius:8px;font:10px/1.5 var(--sim-mono)"><strong>EDITABLE DRAFT</strong> The controls differ from the saved result shown below. Run the draft to create a new immutable output; the existing saved run remains unchanged.</div>':"";return`${kn("Virtual Laboratory \xB7 simulation studio","Run the next hypothesis.","A transparent, local-first workspace for exploring an illustrative biomass model. Configure the culture, then inspect the trace in a procedural reactor.",'<div class="run-meta"><span class="meta-chip"><strong>MODEL</strong> logistic biomass</span><span class="meta-chip"><strong>ORIGIN</strong> synthetic only</span></div>')}
    ${n}<div class="lab-title-bar"><div><p class="sim-eyebrow">Experiment / ${oe(_.form.scenarioLabel||"Unnamed draft")}</p><h2>${oe(_.form.projectName||"Unnamed project draft")}</h2></div><p>Every run stores its validated input snapshot, full output, model version, assumptions, and time series together.</p></div>
    <div class="lab-grid">${$x()}${jx()}${qx()}</div>
    <div class="lab-analysis-grid">${Yx()}${Zx()}</div>
    <section class="assumptions-panel"><div><h3>Interpretation boundary</h3><p>Use this panel to compare parameterized scenarios, not to infer a validated cultivation recipe. The browser visualizes the same deterministic state that feeds the table and export.</p><div class="analysis-footer"><button class="sim-button" type="button" data-action="export-csv"${_.output?"":" disabled"}>\u2193 Export time series CSV</button><button class="sim-button" type="button" data-action="save-note"${_.output?"":" disabled"}>\u270E Add run note</button></div></div><ol>${(_.output?.assumptions||["X is biomass concentration in g/L; K is an illustrative carrying capacity.","Integration uses fixed-step forward Euler with dt expressed in days.","Response factors are optional and use bounded illustrative functions.","Organism labels are references; parameters are not species measurements."]).map(e=>`<li>${oe(e)}</li>`).join("")}</ol></section>`}function Lu(){let n=document.querySelector("#biomassChart"),e=_.output;if(!n||!e)return;let t=n.getBoundingClientRect(),i=Math.min(window.devicePixelRatio||1,2),s=Math.max(300,t.width),r=Math.max(180,t.height);n.width=Math.floor(s*i),n.height=Math.floor(r*i);let o=n.getContext("2d");o.setTransform(i,0,0,i,0,0),o.clearRect(0,0,s,r);let a=e.timeSeries,l={top:12,right:13,bottom:28,left:46},c=s-l.left-l.right,u=r-l.top-l.bottom,d=Math.max(...a.map(p=>p.biomassG_L),e.modelConfigurationSnapshot.configuration.carryingCapacityG_L*.1,.001),h=Math.max(a.at(-1).timeHours,1),f=p=>l.left+p/h*c,g=p=>l.top+u-p/d*u;o.font="9px IBM Plex Mono, monospace",o.strokeStyle="rgba(163,225,170,.10)",o.lineWidth=1;for(let p=0;p<=4;p+=1){let w=l.top+u*p/4;o.beginPath(),o.moveTo(l.left,w),o.lineTo(s-l.right,w),o.stroke(),o.fillStyle="#71877a",o.fillText(Ve(d*(1-p/4),2),3,w+3)}o.fillStyle="#71877a",o.fillText("0 h",l.left,r-7),o.fillText(`${Ve(h,0)} h`,s-l.right-32,r-7);let y=o.createLinearGradient(0,l.top,0,r-l.bottom);y.addColorStop(0,"rgba(145,228,156,.28)"),y.addColorStop(1,"rgba(145,228,156,0)"),o.beginPath(),a.forEach((p,w)=>w?o.lineTo(f(p.timeHours),g(p.biomassG_L)):o.moveTo(f(p.timeHours),g(p.biomassG_L))),o.lineTo(f(h),r-l.bottom),o.lineTo(l.left,r-l.bottom),o.closePath(),o.fillStyle=y,o.fill(),o.beginPath(),a.forEach((p,w)=>w?o.lineTo(f(p.timeHours),g(p.biomassG_L)):o.moveTo(f(p.timeHours),g(p.biomassG_L))),o.strokeStyle="#91e49c",o.lineWidth=2,o.stroke();let m=a.at(-1);o.fillStyle="#b5ffc0",o.beginPath(),o.arc(f(m.timeHours),g(m.biomassG_L),3.5,0,Math.PI*2),o.fill()}function Jx(){let n=Fl(),e=_.comparison;return`${kn("Simulation archive \xB7 versioned traces","Every run leaves a trail.","Open a saved input snapshot, compare two scenarios, or export the exact time series that the model produced.",'<div class="toolbar-actions"><button class="sim-button primary" type="button" data-view="laboratory">\uFF0B New simulation</button><button class="sim-button" type="button" data-action="export-state">\u2193 Export workspace JSON</button></div>')}
    <div class="view-toolbar"><p><strong>${n.length}</strong> saved run${n.length===1?"":"s"} \xB7 browser-local records \xB7 synthetic provenance attached</p><div class="toolbar-actions"><button class="sim-button small" type="button" data-action="clear-comparison"${e?"":" disabled"}>Clear comparison</button></div></div>
    ${n.length?`<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Scenario</th><th>Profile</th><th>Duration</th><th>Endpoint</th><th>Change</th><th>Actions</th></tr></thead><tbody>${[...n].reverse().map(t=>{let i=t.parameters?.inputSnapshot,s=t.metrics||{};return`<tr><td><strong>${oe(t.label||"Untitled run")}</strong><small>${oe(Ol(t.createdAt))}</small></td><td>${oe(i?.organism?.label||"Illustrative culture")}<small>${oe(i?.organism?.classification||"synthetic")}</small></td><td class="number">${Ve(i?.integration?.durationHours,0)} h</td><td class="number">${Ve(s.finalBiomassG_L)} g/L</td><td class="number">${Zs(s.relativeChangePercent)}</td><td><div class="table-actions"><button class="sim-button small" type="button" data-action="load-run" data-run-id="${oe(t.id)}">Open</button><button class="sim-button small" type="button" data-action="export-run-csv" data-run-id="${oe(t.id)}">CSV</button><button class="sim-button small danger" type="button" data-action="delete-run" data-run-id="${oe(t.id)}">Delete</button></div></td></tr>`}).join("")}</tbody></table></div>`:'<div class="sim-empty"><div><strong>Your archive is empty</strong><p>Runs created in the Virtual Laboratory appear here with their model and provenance snapshots.</p><button class="sim-button primary" type="button" data-view="laboratory">Configure first run</button></div></div>'}
     <section class="analysis-panel" style="margin-top:13px"><div class="panel-heading"><div><h2>Compare saved scenarios</h2><p>Compare stored outputs from the active project without silently rerunning evidence.</p></div><span class="sim-provenance">reproducible</span></div><div class="compare-box"><div class="compare-row"><label class="field-group"><span class="field-label">Reference</span><select class="sim-select" id="compareLeft"><option value="">Choose a run</option>${n.map(t=>`<option value="${oe(t.id)}"${t.id===(_.comparisonSelection?.leftRunId||"")?" selected":""}>${oe(t.label||t.id)}</option>`).join("")}</select></label><span>vs</span><label class="field-group"><span class="field-label">Variant</span><select class="sim-select" id="compareRight"><option value="">Choose a run</option>${n.map(t=>`<option value="${oe(t.id)}"${t.id===(_.comparisonSelection?.rightRunId||"")?" selected":""}>${oe(t.label||t.id)}</option>`).join("")}</select></label></div><button class="sim-button" type="button" data-action="compare-runs"${n.length<2?" disabled":""}>Compare stored outputs</button>${e?`<div class="compare-result"><div><span>Changed parameter paths</span><strong>${e.changedParameterPaths.length||"none"}</strong></div><div><span>Endpoint difference</span><strong>${Ve(e.metrics.difference.finalBiomassG_L)} g/L</strong></div><div><span>Growth-rate difference</span><strong>${Ve(e.metrics.difference.endpointGrowthRatePerDay,4)} / day</strong></div></div>`:""}</div></section>`}function Kx(){let n=["\u25CC","\u2723","\u25CD","\u2301","\u2726","\u25C9"];return`${kn("Reference profile explorer \xB7 illustrative","Start with a label. Question the defaults.","These profiles help organize experiments around familiar organism names. Their parameters are placeholders for interface exploration, not species measurements.")}
    <div class="view-toolbar"><p><strong>${co.length}</strong> reference labels \xB7 all marked reference / illustrative</p><div class="toolbar-actions"><span class="sim-provenance">no identification claim</span></div></div>
    <div class="catalog-grid">${co.map((e,t)=>`<article class="catalog-card"><div class="catalog-card-top"><div><h2>${oe(e.label)}</h2><p class="latin">${oe(e.scientificName)}</p></div><span class="strain-mark">${n[t%n.length]}</span></div><p>${oe(e.parameterBasis)}. Use this card to seed a scenario, then adjust the environment explicitly.</p><div class="card-bottom"><small>${oe(e.classification)}<br>${oe(e.provenance.label)}</small><button type="button" data-action="select-profile" data-profile-id="${oe(e.profileId)}">Use in laboratory \u2192</button></div></article>`).join("")}</div>
    <section class="assumptions-panel" style="margin-top:14px"><div><h3>Why the label is not the measurement</h3><p>The engine preserves the selected label in every input and output snapshot so a reader can see what was explored. It intentionally does not turn a named organism into an evidence-backed calibration.</p></div><ol><li>Parameters remain editable in the Simulation Studio.</li><li>Every run stores its model configuration.</li><li>Exports retain assumptions and provenance.</li></ol></section>`}function Qx(){let n=[...Ix()].reverse();return`${kn("Experiment register \xB7 local records","Questions with a place to live.","An experiment links a hypothesis, protocol, parameter snapshot, and one or more saved simulation runs.",'<div class="toolbar-actions"><button class="sim-button primary" type="button" data-view="laboratory">\uFF0B New experiment</button></div>')}
    ${n.length?`<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Experiment</th><th>Project</th><th>Status</th><th>Model</th><th>Created</th><th></th></tr></thead><tbody>${n.map(e=>{let t=_.db.getProject(e.projectId);return`<tr><td><strong>${oe(e.title)}</strong><small>${oe(e.hypothesis||"No hypothesis entered")}</small></td><td>${oe(t?.name||"Unlinked project")}</td><td><span class="status-pill ${e.status==="failed"?"red":""}">${oe(e.status)}</span></td><td class="number">${oe(e.parameters?.modelVersion||gt)}</td><td>${oe(Ol(e.createdAt))}</td><td><button class="sim-button small" type="button" data-view="simulations">View runs</button></td></tr>`}).join("")}</tbody></table></div>`:'<div class="sim-empty"><div><strong>No experiments registered</strong><p>Run a scenario and the lab will create a linked experiment record with its hypothesis and protocol boundary.</p><button class="sim-button primary" type="button" data-view="laboratory">Start an experiment</button></div></div>'}`}function Bf(n=""){let e=_.output;if(!e)return{heading:"Run a model first",paragraphs:["The local assistant only interprets a completed synthetic trace. Open the Virtual Laboratory, configure a scenario, and run it before asking for a reading."],bullets:[]};let t=e.derivedMetrics,i=e.timeSeries.at(-1),r=[["light",i.lightFactor],["temperature",i.temperatureFactor],["pH",i.pHFactor],["nutrient",i.nutrientFactor]].sort((l,c)=>l[1]-c[1])[0],o=n.trim().toLowerCase();return{heading:"Local model reading",paragraphs:[o.includes("why")||o.includes("factor")?`The smallest endpoint response factor is ${r[0]} at ${Ve(r[1],2)}. In this model, that term reduces the effective growth rate multiplicatively; it is not a diagnosis of a real culture.`:`The trace ends at ${Ve(t.finalBiomassG_L)} g/L after ${Ve(t.durationHours,0)} hours, versus ${Ve(t.initialBiomassG_L)} g/L initially.`,`The endpoint net specific rate is ${Ve(t.endpointGrowthRatePerDay,4)} per day and the relative change is ${Zs(t.relativeChangePercent)}. The result is fully determined by the stored input snapshot and ${e.engineVersion}.`],bullets:[`Light ${Ve(i.lightFactor,2)} \xB7 temperature ${Ve(i.temperatureFactor,2)} \xB7 pH ${Ve(i.pHFactor,2)} \xB7 nutrient ${Ve(i.nutrientFactor,2)}`,`Carrying capacity is ${Ve(e.modelConfigurationSnapshot.configuration.carryingCapacityG_L)} g/L in this illustrative configuration.`,"Try a duplicated scenario with one parameter changed, then compare the two traces."]}}function e0(){let n=_.assistantAnswer||Bf();return`${kn("Assistant \xB7 local interpretation","Ask the trace, not the model to pretend.","This panel is a deterministic explanation layer over the local result. No remote AI provider is connected and no biological conclusion is generated.")}
    <div class="assistant-grid"><section class="assistant-panel"><h2>One question at a time</h2><p>Ask about the endpoint, the response factors, or what to compare next. The answer is generated from the current stored output only.</p><label class="field-group"><span class="field-label">Question <em>optional</em></span><textarea class="sim-textarea" id="assistantQuestion" placeholder="Why did the endpoint change?">${oe(_.assistantQuestion||"")}</textarea></label><button class="sim-button primary" type="button" data-action="assistant-run">Explain current trace</button><div class="assistant-disclaimer"><span>i</span><span>Local rule-based interpretation \xB7 synthetic computational data \xB7 not an AI conclusion or cultivation instruction.</span></div></section><section class="assistant-answer"><p class="sim-eyebrow">${_.output?`Run / ${oe(_.output.scenario.label)}`:"No active run"}</p><h3>${oe(n.heading)}</h3>${n.paragraphs.map(e=>`<p>${oe(e)}</p>`).join("")}${n.bullets.length?`<ul>${n.bullets.map(e=>`<li>${oe(e)}</li>`).join("")}</ul>`:""}</section></div>`}function t0(){let n=[...Px()].reverse();return`${kn("Notebook \xB7 research notes","Keep the reasoning beside the result.",`Notes for active project: ${_.project?.name||"current project"}. Notes are stored locally and can be linked to an experiment and run.`)}
    <div class="note-layout"><form class="note-editor" id="noteForm"><h2>New note</h2><label class="field-group"><span class="field-label">Title</span><input class="sim-input" name="noteTitle" type="text" maxlength="120" placeholder="Working hypothesis" value="${oe(_.noteDraft.title)}"></label><label class="field-group"><span class="field-label">Markdown note</span><textarea class="sim-textarea" name="noteContent" placeholder="What are you trying to learn?">${oe(_.noteDraft.content)}</textarea></label><button class="sim-button primary" type="submit" data-action="save-note">Save note locally</button></form><section class="note-list-panel"><div class="panel-heading"><div><h2>Saved entries</h2><p>${n.length} local note${n.length===1?"":"s"}</p></div><span class="sim-provenance">browser-local</span></div>${n.length?`<div class="note-list">${n.map(e=>`<article class="note-card"><div class="note-card-head"><strong>${oe(e.title)}</strong><time>${oe(Ol(e.createdAt))}</time></div><p>${oe(e.content||"Empty note")}</p><div class="analysis-footer"><span class="meta-chip">${e.runId?"linked to run":"project note"}</span><button class="sim-link-button" type="button" data-action="delete-note" data-note-id="${oe(e.id)}">Delete</button></div></article>`).join("")}</div>`:'<div class="sim-empty"><div><strong>No notes yet</strong><p>Write down the hypothesis before you turn a parameter into a conclusion.</p></div></div>'}</section></div>`}function n0(){let n=_.output;if(!n)return`${kn("Reports \xB7 exportable evidence","A report starts with a run.","Run a scenario first. The report will carry its versioned input, model assumptions, derived metrics, and time series.")}<div class="sim-empty"><div><strong>No completed run selected</strong><p>Reports are generated from actual local simulation outputs; nothing is fabricated to fill this page.</p><button class="sim-button primary" type="button" data-view="laboratory">Open laboratory</button></div></div>`;let e=n.derivedMetrics,t={format:n.format,scenario:n.scenario,organism:n.organism,modelVersion:n.modelVersion,engineVersion:n.engineVersion,derivedMetrics:e,assumptions:n.assumptions,integration:n.integration};return`${kn("Reports \xB7 ${escapeHtml(output.scenario.label)}","The result, with its boundary attached.","Export a compact report for review or the full CSV time series for analysis.",'<div class="toolbar-actions"><button class="sim-button primary" type="button" data-action="export-report">\u2193 Export report JSON</button><button class="sim-button" type="button" data-action="export-csv">\u2193 Export CSV</button></div>')}
     <section class="report-header"><div><p class="sim-eyebrow">${oe(n.organism.classification)}</p><h2>${oe(n.organism.label)} \xB7 ${oe(n.scenario.label)}</h2><p>Endpoint ${Ve(e.finalBiomassG_L)} g/L \xB7 relative change ${Zs(e.relativeChangePercent)} \xB7 ${Ve(e.durationHours,0)} hour integration</p></div><span class="report-stamp">${_.outputSource==="stored"?"STORED OUTPUT":"RECOMPUTED / DISCLOSED"}<br>SYNTHETIC / COMPUTATIONAL</span></section>
    <div class="metric-strip">${Of(e).replace(/^<div class="metric-strip">|<\/div>$/g,"")}</div>
    <div class="report-sections"><section class="report-section"><h3>Snapshot</h3><pre>${oe(JSON.stringify(t,null,2))}</pre></section><section class="report-section"><h3>Assumptions</h3><ol>${n.assumptions.map(i=>`<li style="margin:0 0 8px;color:var(--sim-mute);font-size:11px">${oe(i)}</li>`).join("")}</ol><div class="analysis-footer"><button class="sim-button" type="button" data-action="open-run-note">\u270E Add a notebook interpretation</button><button class="sim-button" type="button" data-action="load-run" data-run-id="${oe(_.currentRun?.id||"")}"${_.currentRun?"":" disabled"}>Open in laboratory</button></div></section></div>`}function i0(){let n=_.db.backendStatus(),e=_.db.storageKind==="localStorage"?"localStorage":"memory fallback";return`${kn("Settings & data \xB7 explicit boundaries","Own the record.","The default workspace never contacts a server. Export or configure an optional endpoint only when you understand the storage boundary.")}
    <div class="settings-grid"><section class="settings-card"><h2>Local persistence</h2><p>Projects, experiments, runs, and notebook entries are namespaced to this browser profile. This is not an authenticated account.</p><div class="settings-stat"><span>Storage</span><strong>${oe(e)}</strong></div><div class="settings-stat"><span>Projects</span><strong>${_.db.count("projects")}</strong></div><div class="settings-stat"><span>Runs</span><strong>${_.db.count("runs")}</strong></div><div class="settings-stat"><span>Notes</span><strong>${_.db.count("notebookEntries")}</strong></div><div class="settings-actions"><button class="sim-button" type="button" data-action="export-state">\u2193 Export JSON</button><button class="sim-button" type="button" data-action="import-state">\u2191 Import JSON</button><input id="importStateFile" type="file" accept="application/json,.json" hidden></div></section><section class="settings-card"><h2>Optional development backend</h2><p>Only use an explicit HTTP(S) origin for the separately installed local Node persistence service. It has no authentication, authorization, or production deployment guarantee.</p><label class="field-group"><span class="field-label">API origin <em>optional</em></span><input class="sim-input" id="backendUrl" type="url" placeholder="http://127.0.0.1:8787" value="${oe(_.backendUrl)}"></label><div class="settings-stat"><span>Current mode</span><strong>${oe(n.label||"local browser only")}</strong></div><div class="settings-stat"><span>Configured origin</span><strong>${oe(n.baseUrl||"none")}</strong></div><div class="settings-actions"><button class="sim-button" type="button" data-action="configure-backend">Use this origin</button><button class="sim-button" type="button" data-action="sync-backend"${n.configured?"":" disabled"}>Sync local state</button></div></section><section class="settings-card"><h2>Model contract</h2><p>The active engine keeps an explicit version snapshot with each result. This surface is for transparent exploration, not a validated digital twin.</p><div class="settings-stat"><span>Engine</span><strong>${jt}</strong></div><div class="settings-stat"><span>Model</span><strong>${gt}</strong></div><div class="settings-stat"><span>Data origin</span><strong>synthetic-computational</strong></div></section><section class="settings-card"><h2>Reset local workspace</h2><p>Use export first if the records matter. Resetting removes this namespace from the current browser only.</p><div class="settings-actions"><button class="sim-button danger" type="button" data-action="reset-workspace">Reset records</button></div></section></div>`}function xt(){Bx(),kx(),document.querySelector("#projectChipText").textContent=_.project?.name||_.form?.projectName||"Untitled culture study";let n=document.querySelector("#projectSelector");n&&_.db&&(n.innerHTML=_.db.listProjects().map(t=>`<option value="${oe(t.id)}"${t.id===_.project?.id?" selected":""}>${oe(t.name)}</option>`).join(""),n.value=_.project?.id||"");let e={dashboard:Hx,laboratory:Af,simulations:Jx,strains:Kx,experiments:Qx,assistant:e0,notebook:t0,reports:n0,settings:i0};if(qs.innerHTML=`${Dx()}${(e[_.view]||Af)()}`,_.view==="settings"){let t=Array.from(qs.querySelectorAll(".settings-card")).find(s=>s.querySelector("h2")?.textContent.trim()==="Optional development backend");if(t){let s=t.querySelector("p");s&&(s.textContent="Use an explicit HTTP(S) origin for the separately installed Node service. An optional X-API-Key stays in this browser session and is never exported with research data.");let r=t.querySelector("#backendUrl");r&&!t.querySelector("#backendKey")&&r.insertAdjacentHTML("afterend",`<label class="field-group"><span class="field-label">API key <em>session only</em></span><input class="sim-input" id="backendKey" type="password" autocomplete="off" placeholder="Only if the server requires one" value="${oe(_.backendKey)}"></label>`);let o=t.querySelector(".settings-actions");o&&!o.querySelector('[data-action="backend-health"]')&&o.insertAdjacentHTML("beforeend",`<button class="sim-button" type="button" data-action="backend-health"${_.db.backendStatus().configured?"":" disabled"}>Check connection</button>`)}let i=qs.querySelector(".sim-page-subtitle");i&&(i.textContent="Local browser storage, project drafts, saved outputs, and workspace JSON are managed here. No backend or AI provider is connected on this route.")}document.querySelectorAll('[data-action="run"]').forEach(t=>{t.disabled=_.isRunning}),Cx.dataset.simBoot="ready",_.view==="laboratory"&&s0(),(_.view==="reports"||_.view==="dashboard")&&window.requestAnimationFrame(Lu)}function s0(){let n=document.querySelector("#labCanvas");if(!n)return;_.renderer=new Il(n),_.renderer.setGeometry(_.form.geometry),_.renderer.setCamera(_.cameraName);let e=Ou();_.renderer.setState({biomass:e?.point.biomassG_L??_.form.initialBiomassG_L,carryingCapacity:Number(_.form.carryingCapacityG_L)||2,running:_.isRunning}),document.querySelector("#sceneLoading")?.classList.add("is-hidden"),document.querySelector("#sceneStatus")?.classList.add("is-hidden"),Lu();let i=document.querySelector("#biomassChart");i&&typeof ResizeObserver=="function"&&(_.chartResizeObserver=new ResizeObserver(Lu),_.chartResizeObserver.observe(i))}function Du(n){let e=document.querySelector("#validationMessage");if(!e)return;document.querySelectorAll("#simulationForm [aria-invalid]").forEach(s=>s.removeAttribute("aria-invalid"));let t=n?.errors||[],i=t.slice(0,8).map(s=>`${s.path}: ${s.message}`).join(" \xB7 ")||n?.message||"Check the model inputs.";for(let s of t){let r=String(s.path||"").replace(/^model\.environment\./,"").replace(/^initialConditions\./,"").replace(/^integration\./,"");document.querySelector(`#simulationForm [name="${CSS.escape(r)}"]`)?.setAttribute("aria-invalid","true")}e.textContent=i,e.classList.add("is-visible")}function r0(){document.querySelector("#validationMessage")?.classList.remove("is-visible"),document.querySelectorAll("#simulationForm [aria-invalid]").forEach(n=>n.removeAttribute("aria-invalid"))}function kf(){Dt({showError:!0})&&(Ne("Project, editable draft, and UI state saved locally."),xt())}function Rf(){return new Promise(n=>{typeof window.requestAnimationFrame=="function"?window.requestAnimationFrame(()=>n()):window.setTimeout(n,0)})}function o0(n,e,t,i){Yt(e);let s=js("experiment"),r=js("run");Ks(a=>{ii(a,"experiments",{id:s,title:n.scenario.label,projectId:_.project.id,hypothesis:"How does this illustrative parameter set change the modeled biomass trace?",protocol:"Fixed-step Euler integration with explicit response factors; synthetic computational record.",parameters:{inputSnapshot:Lt(n),modelVersion:gt,engineVersion:jt},status:"completed",tags:["synthetic",n.organism.profileId],startedAt:t,endedAt:i},s),ii(a,"runs",{id:r,label:n.scenario.label,experimentId:s,status:"completed",parameters:{inputSnapshot:Lt(n),modelVersion:gt,engineVersion:jt},summary:Lt(e.derivedMetrics),metrics:Lt(e.derivedMetrics),timeSeries:Lt(e.timeSeries),outputSnapshot:Lt(e),startedAt:t,endedAt:i},r);let l=a.collections.projects.find(c=>c.id===_.project.id);if(!l)throw new Error("The active project no longer exists in local records.");ii(a,"projects",{...l,draft:Lt(_.form)},l.id),si(a,Js(l.id),{...Uu(),currentRunId:r,comparison:null,draftDirty:!1,playbackIndex:e.timeSeries.length-1,playbackTimeHours:e.timeSeries.at(-1).timeHours}),si(a,"lab",{...Uf(),activeProjectId:l.id})});let o=_.db.getRun(r);if(!o?.outputSnapshot)throw new Error("The run commit completed without a stored output snapshot.");return Yt(o.outputSnapshot),o}async function Fu(){if(_.isRunning)return;_.view!=="laboratory"&&lo("laboratory"),await Rf(),r0();let n;try{n=Ff()}catch(t){Du(t),Ne(t.message||"The model inputs could not be validated.","error");return}let e=Pu();_.isRunning=!0,_.input=Lt(n),xt(),await Rf();try{let t=nr(n);Yt(t);let i=Pu(),s=o0(n,t,e,i);_.input=n,_.output=Lt(s.outputSnapshot),_.outputSource="stored",_.currentRun=s,_.form=zl(n,String(_.form.projectName||"").trim(),_.form.geometry),_.draftDirty=!1,_.playbackIndex=_.output.timeSeries.length-1,_.playbackTimeHours=_.output.timeSeries.at(-1).timeHours,_.comparison=null,_.comparisonSelection=null,_.isRunning=!1,Ne(`Run complete \xB7 ${Ve(_.output.derivedMetrics.finalBiomassG_L)} g/L endpoint`),xt()}catch(t){_.isRunning=!1,_.output=null,_.outputSource="none",Bl(t),xt(),Du(t),Ne(t.message||"The model could not be completed or saved.","error")}}function a0(){_.form=fo(_.form.organism||"arthrospira"),_.form.projectName=_.project?.name||"Untitled culture study",_.draftDirty=!!_.output,_.playbackIndex=_.output?_.output.timeSeries.length-1:-1,_.playbackTimeHours=_.output?.timeSeries.at(-1)?.timeHours??null,Dt({showError:!0}),xt(),Ne(_.output?"Draft reset; the saved result was retained.":"Draft reset to the profile defaults.")}function zf(n){if(!n||n===_.project?.id)return!0;if(!Dt({showError:!0}))return!1;let e=_.db.getProject(n);return e?(po(e),_.view="laboratory",window.history.replaceState(null,"","#laboratory"),Dt({showError:!0}),xt(),Ne(`Opened project \xB7 ${e.name}`),!0):(Ne("That project is not available in this workspace.","error"),!1)}function l0(){try{if(!Dt({showError:!0}))return;let n=_.db.count("projects")+1,e=js("project"),t=fo("arthrospira");Ks(i=>{ii(i,"projects",{id:e,name:`Culture study ${n}`,description:"A local-first synthetic microalgae growth investigation.",organism:"Arthrospira",model:gt,tags:["synthetic","computational"],draft:t},e),si(i,Js(e),{projectId:e,draft:t,currentRunId:null,comparison:null,cameraName:"overview",playbackIndex:-1,playbackTimeHours:null,draftDirty:!1}),si(i,"lab",{activeProjectId:e,view:"laboratory"})}),_.project=_.db.getProject(e),po(_.project),_.view="laboratory",window.history.replaceState(null,"","#laboratory"),xt(),Ne("New local project created.")}catch(n){Ne(`Project could not be created: ${n.message}`,"error")}}function Dl(n,{allowRecompute:e=!0}={}){if(n?.outputSnapshot!==void 0&&n?.outputSnapshot!==null)return Yt(n.outputSnapshot),{output:Lt(n.outputSnapshot),source:"stored"};let t=n?.parameters?.inputSnapshot;if(!t)throw new Error("This run has no usable input snapshot.");if(!e||!window.confirm("This older run has no stored output. Recompute it from the saved input snapshot? The original run remains unchanged and this will be labeled as recomputed."))return null;let i=cn(t),s=nr(i);return Yt(s),{output:s,source:"recomputed"}}function Cf(n,{forceRecompute:e=!1}={}){if(!n)return;let t=_.db.getRun(n),i=Ti(t);if(!t||!i){Ne("This run has no owning experiment or project.","error");return}if(!(i!==_.project?.id&&!zf(i))){t=_.db.getRun(n);try{let s=t?.parameters?.inputSnapshot;if(!s)throw new Error("This run has no usable input snapshot.");_.input=cn(s);let r=Dl(t,{allowRecompute:e||!0});if(!r)return;_.output=r.output,_.outputSource=r.source,_.currentRun=t,_.form=zl(_.input,_.project?.name||_.form.projectName,_.form.geometry),_.draftDirty=!1,_.playbackIndex=_.output.timeSeries.length-1,_.playbackTimeHours=_.output.timeSeries.at(-1).timeHours,_.view="laboratory",window.history.replaceState(null,"","#laboratory"),Dt({showError:!0}),xt(),Ne(r.source==="stored"?"Saved run reopened from its stored output.":"Older run explicitly recomputed; the original saved run was not changed.")}catch(s){Ne(`Run could not be reopened: ${s.message}`,"error")}}}function c0(){let n=document.querySelector("#compareLeft")?.value,e=document.querySelector("#compareRight")?.value,t=_.db.getRun(n),i=_.db.getRun(e);if(!t||!i||Ti(t)!==_.project?.id||Ti(i)!==_.project?.id){Ne("Choose two saved runs from the active project.","error");return}try{let s=Dl(t),r=Dl(i);if(!s||!r)return;_.comparison=Kl(s.output,r.output),_.comparisonSelection={leftRunId:t.id,rightRunId:i.id},Dt({showError:!0}),Ne(`Compared ${_.comparison.changedParametersCount} changed parameter path${_.comparison.changedParametersCount===1?"":"s"}.`),xt()}catch(s){Ne(`Comparison failed: ${s.message}`,"error")}}function u0(){try{let n=_.output?.inputSnapshot||Ff(),e=oh(n,{scenarioLabel:`${n.scenario.label} copy`});_.form=zl(e,String(_.form.projectName||"").trim(),_.form.geometry),_.draftDirty=!0,Dt({showError:!0}),xt(),Ne("Draft duplicate created; no new run was saved.")}catch(n){Du(n),Ne(n.message||"The scenario could not be duplicated.","error")}}function h0(){if(!_.output){Ne("Run a scenario before exporting a time series.","error");return}kl(`${uo(_.output.scenario.label)}-time-series.csv`,Jl(_.output),"text/csv;charset=utf-8"),Ne("CSV time series downloaded.")}function d0(){if(!_.output){Ne("Run a scenario before exporting a report.","error");return}let n={reportFormat:"orr-biologicals-algal-lab-report",reportVersion:1,generatedAt:new Date().toISOString(),outputSource:_.outputSource,output:Lt(_.output)};kl(`${uo(_.output.scenario.label)}-report.json`,`${JSON.stringify(n,null,2)}
`,"application/json;charset=utf-8"),Ne(_.outputSource==="stored"?"Stored-output report downloaded.":"Recomputed-output report downloaded with disclosure.")}function f0(n){let e=_.db.getRun(n);if(e)try{let t=Dl(e);if(!t)return;kl(`${uo(e.label||e.id)}-time-series.csv`,Jl(t.output),"text/csv;charset=utf-8"),Ne(t.source==="stored"?"Stored run CSV downloaded.":"Recomputed run CSV downloaded with disclosure.")}catch(t){Ne(`CSV export failed: ${t.message}`,"error")}}function p0(){kl("algal-digital-lab-workspace.json",_.db.exportJSON({pretty:!0}),"application/json;charset=utf-8"),Ne("Workspace JSON downloaded.")}function m0(n){let e=n?.collections;if(!e||typeof e!="object")throw new Error("The workspace snapshot has no collections.");let t=new Set(e.projects.map(r=>r.id)),i=new Set(e.experiments.map(r=>r.id)),s=new Set(e.runs.map(r=>r.id));for(let r of e.experiments){if(r.projectId&&!t.has(r.projectId))throw new Error(`Experiment ${r.id} points to a missing project.`);r.parameters?.inputSnapshot&&cn(r.parameters.inputSnapshot)}for(let r of e.runs){if(!r.experimentId||!i.has(r.experimentId))throw new Error(`Run ${r.id} points to a missing experiment.`);r.parameters?.inputSnapshot&&cn(r.parameters.inputSnapshot),r.outputSnapshot!==void 0&&r.outputSnapshot!==null&&Yt(r.outputSnapshot)}for(let r of e.notebookEntries){if(r.projectId&&!t.has(r.projectId))throw new Error(`Notebook entry ${r.id} points to a missing project.`);if(r.experimentId&&!i.has(r.experimentId))throw new Error(`Notebook entry ${r.id} points to a missing experiment.`);if(r.runId&&!s.has(r.runId))throw new Error(`Notebook entry ${r.id} points to a missing run.`)}for(let r of e.uiSettings){let o=r.settings;if(!o||typeof o!="object")throw new Error(`UI settings ${r.scope} are not an object.`);if(o.activeProjectId&&!t.has(o.activeProjectId))throw new Error(`UI settings ${r.scope} point to a missing project.`);if(o.currentRunId&&!s.has(o.currentRunId))throw new Error(`UI settings ${r.scope} point to a missing run.`);if(o.comparison){for(let a of[o.comparison.leftRunId,o.comparison.rightRunId])if(a&&!s.has(a))throw new Error(`UI comparison in ${r.scope} points to a missing run.`)}}return!0}function g0(n){if(!n)return;let e=4*1024*1024;if(n.size>e){Ne("Import rejected: workspace files are limited to 4 MiB.","error");return}let t=new FileReader;t.addEventListener("load",()=>{try{let i=String(t.result);if(new Blob([i]).size>e)throw new Error("workspace files are limited to 4 MiB.");let s=as({playerId:_.db.playerId,storage:hr()});s.importJSON(i,{mode:"replace"});let r=s.exportState(),o=_.db.exportState(),a={...o,collections:{}};for(let u of["projects","experiments","runs","notebookEntries","uiSettings"]){let d=new Map(o.collections[u].map(h=>[h.id,h]));for(let h of r.collections[u])d.set(h.id,h);a.collections[u]=Array.from(d.values())}m0(a),_.db.importState(a,{mode:"replace"});let l=Nu("lab")?.settings,c=_.db.getProject(l?.activeProjectId)||_.db.getProject(_.project?.id)||_.db.listProjects()[0];if(!c)throw new Error("The imported workspace contains no project.");po(c),Ne("Workspace records imported and merged."),xt()}catch(i){Ne(`Import rejected: ${i.message}`,"error")}}),t.readAsText(n)}function Hf(){let n=wi("noteTitle","").trim()||"Untitled research note",e=wi("noteContent","").trim();if(!e){Ne("Write a note before saving it.","error");return}if(!_.project?.id){Ne("Choose a project before saving a note.","error");return}try{let t=js("notebook_entry");Ks(i=>{if(_.currentRun&&Ti(_.currentRun)!==_.project.id)throw new Error("The selected run does not belong to the active project.");ii(i,"notebookEntries",{id:t,title:n,content:e,projectId:_.project.id,experimentId:_.currentRun?.experimentId||null,runId:_.currentRun?.id||null,tags:["synthetic","local"]},t)}),_.noteDraft={title:"",content:""},Ne("Notebook entry saved locally."),xt()}catch(t){Ne(`Note could not be saved: ${t.message}`,"error")}}function _0(n){if(n&&window.confirm("Delete this notebook entry? This cannot be undone."))try{if(!_.db.deleteNotebookEntry(n)){Ne("Notebook entry was not found.","error");return}Ne("Notebook entry deleted."),xt()}catch(e){Bl(e),Ne(`Notebook entry could not be deleted: ${e.message}`,"error")}}function y0(n){if(!n)return;let e=_.db.getRun(n);if(!e||Ti(e)!==_.project?.id){Ne("That run is not in the active project.","error");return}if(window.confirm(`Delete saved run \u201C${e.label||e.id}\u201D? The immutable output will be removed.`))try{Ks(t=>{t.collections.runs=t.collections.runs.filter(s=>s.id!==n);let i=t.collections.projects.find(s=>s.id===_.project.id);i&&ii(t,"projects",{...i,draft:Lt(_.form)},i.id),si(t,Js(_.project.id),{...Uu(),currentRunId:_.currentRun?.id===n?null:_.currentRun?.id,comparison:_.comparisonSelection&&(_.comparisonSelection.leftRunId===n||_.comparisonSelection.rightRunId===n)?null:_.comparisonSelection})}),_.currentRun?.id===n&&(_.currentRun=null,_.output=null,_.input=null,_.outputSource="none",_.playbackIndex=-1,_.playbackTimeHours=null),(_.comparisonSelection?.leftRunId===n||_.comparisonSelection?.rightRunId===n)&&(_.comparison=null,_.comparisonSelection=null),Ne("Run removed from this browser."),xt()}catch(t){Bl(t),Ne(`Run could not be deleted: ${t.message}`,"error")}}function v0(n){Ul.has(n)&&(Ys(),_.form={..._.form,organism:n},_.draftDirty=!0,Dt({showError:!0}),lo("laboratory"),Ne(`${ho(n)} selected; existing draft values were retained.`))}function x0(){_.assistantQuestion=document.querySelector("#assistantQuestion")?.value||"",_.assistantAnswer=Bf(_.assistantQuestion),xt()}function b0(){let n=document.querySelector("#backendUrl")?.value.trim()||"",e=document.querySelector("#backendKey")?.value.trim()||"";try{n?sessionStorage.setItem(Cu,n):sessionStorage.removeItem(Cu),e?sessionStorage.setItem(Iu,e):sessionStorage.removeItem(Iu),_.db=as({playerId:"digital-lab-local",...Lf({url:n,key:e})}),_.project=_.db.getProject(_.project?.id)||_.db.listProjects()[0]||_.db.createProject({name:_.form.projectName||"Untitled culture study",description:"A local-first synthetic microalgae growth investigation.",organism:ho(_.form.organism),model:gt,tags:["synthetic","computational"]}),_.backendUrl=n,_.backendKey=e,Ne(n?"Backend configured. Check the connection before syncing.":"Backend cleared; local browser mode restored."),xt()}catch(t){Ne(`Backend origin rejected: ${t.message}`,"error")}}async function S0(){try{let n=await _.db.checkBackend();Ne(`Backend responded: ${n.service||"health check passed"}.`)}catch(n){Ne(`Backend check failed: ${n.message}`,"error")}}async function M0(){try{await _.db.syncToBackend(),Ne("Local workspace synced to the explicitly configured backend.")}catch(n){Ne(`Backend sync failed: ${n.message}`,"error")}}function E0(){if(window.confirm("Reset this entire local workspace? All projects, experiments, runs, comparisons, and notes will be permanently removed from this browser."))try{let n=js("project"),e=fo("arthrospira");Ks(t=>{for(let i of["runs","experiments","notebookEntries","uiSettings","projects"])t.collections[i]=[];ii(t,"projects",{id:n,name:"Untitled culture study",description:"A local-first synthetic microalgae growth investigation.",organism:"Arthrospira",model:gt,tags:["synthetic","computational"],draft:e},n),si(t,Js(n),{projectId:n,draft:e,currentRunId:null,comparison:null,cameraName:"overview",playbackIndex:-1,playbackTimeHours:null,draftDirty:!1}),si(t,"lab",{activeProjectId:n,view:"laboratory"})}),_.project=_.db.getProject(n),po(_.project),_.view="laboratory",window.history.replaceState(null,"","#laboratory"),_.output=null,_.input=null,_.currentRun=null,_.comparison=null,Ne("Local workspace reset."),xt()}catch(n){Ne(`Workspace could not be reset: ${n.message}`,"error")}}function w0(n){let e=n.target.closest("[data-action], [data-view]");if(!e)return;let{action:t,view:i}=e.dataset;if(i){n.preventDefault(),lo(i);return}if(!t||(n.preventDefault(),_.isRunning&&t!=="camera"))return;let r={run:Fu,"save-project":kf,"new-project":l0,"reset-form":a0,"duplicate-scenario":u0,"load-run":()=>Cf(e.dataset.runId),"recompute-current-run":()=>Cf(_.currentRun?.id,{forceRecompute:!0}),"delete-run":()=>y0(e.dataset.runId),"export-csv":h0,"export-report":d0,"export-run-csv":()=>f0(e.dataset.runId),"export-state":p0,"import-state":()=>document.querySelector("#importStateFile")?.click(),"save-note":()=>{e.closest("#noteForm")?Hf():(_.noteDraft={title:_.output?`${_.output.scenario.label} interpretation`:"",content:""},lo("notebook"))},"compare-runs":c0,"clear-comparison":()=>{_.comparison=null,_.comparisonSelection=null,Dt({showError:!0}),xt()},"select-profile":()=>v0(e.dataset.profileId),"delete-note":()=>_0(e.dataset.noteId),"assistant-run":x0,"configure-backend":b0,"backend-health":S0,"sync-backend":M0,"reset-workspace":E0,"open-run-note":()=>{_.noteDraft={title:_.output?`${_.output.scenario.label} interpretation`:"",content:""},lo("notebook")},camera:()=>{_.cameraName=e.dataset.camera,_.renderer?.setCamera(_.cameraName),document.querySelectorAll(".camera-button").forEach(o=>o.classList.toggle("is-active",o.dataset.camera===_.cameraName)),Dt({showError:!1})}}[t];r&&r()}function T0(n){let e=n.target;if(e.id==="importStateFile"){g0(e.files?.[0]);return}if(e.id==="projectSelector"){zf(e.value);return}if(e.matches('[name="organism"]')){let t=e.value;if(!Ul.has(t))return;Ys(),_.form.organism=t,_.draftDirty=!0,Dt({showError:!0}),xt();return}if(e.matches('[name="geometry"]')){_.form.geometry=e.value,_.draftDirty=!0,_.renderer?.setGeometry(e.value),Dt({showError:!0});return}e.matches("#compareLeft, #compareRight")||e.closest("#simulationForm")&&(Ys(),_.draftDirty=!0,Dt({showError:!1}))}function A0(n){if(n.target.id==="playbackScrubber"){Gx(n.target.value);return}n.target.matches('[name="noteTitle"], [name="noteContent"]')&&(_.noteDraft={title:wi("noteTitle",""),content:wi("noteContent","")}),n.target.closest("#simulationForm")&&(Ys(),_.draftDirty=!0,Dt({showError:!1}))}function R0(n){n.preventDefault(),n.target.id==="simulationForm"&&Fu(),n.target.id==="noteForm"&&Hf()}function C0(){Fx(),document.addEventListener("click",w0),document.addEventListener("change",T0),document.addEventListener("input",A0),document.addEventListener("submit",R0),window.addEventListener("hashchange",()=>{let n=Df();n!==_.view&&(_.view=n,xt())}),window.addEventListener("keydown",n=>{let e=n.metaKey||n.ctrlKey;e&&n.key.toLowerCase()==="s"&&(n.preventDefault(),kf()),e&&n.key==="Enter"&&(n.preventDefault(),Fu())}),xt()}C0();
/*! For license information please see simulation-ZQE53TIH.js.LEGAL.txt */
