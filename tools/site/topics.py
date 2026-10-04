"""Curated pillar content; publication date denotes this editorial release."""
PBR_SOURCE = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9033726/'
PBR_REVIEW = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9731602/'
MEASURE = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9368473/'

BIOTECH = '''
<p class="dek">Algae biotechnology uses algae and, in many applied contexts, cyanobacteria to investigate or produce useful biological materials and processes. Cultivation, organism selection, measurement and downstream use are separate problems: a promising organism is not automatically an economical or safe production process.</p>
<h2>What counts as algae biotechnology?</h2>
<p>The term includes studying photosynthetic cells, growing biomass, obtaining compounds such as pigments and lipids, and using cultures in live-feed or environmental research. Microalgae are not one taxonomic lineage; <a href="/blog/spirulina-is-a-cyanobacterium">Spirulina is a cyanobacterium</a>, whereas <a href="/applications/species/chlorella">Chlorella</a> is a eukaryotic green alga. Taxonomy, strain identity and the application determine which evidence is relevant.</p>
<p>Benner et al. review laboratory systems for studying phototrophic organisms and discuss why experimental cultivation differs from full-scale production [1]. Chanquia et al. connect reactor choices to cultivation and synthesis applications [2]. These are published literature, not Orr Biologicals experimental results.</p>
<h2>Four questions connect the field</h2>
<table><thead><tr><th>Question</th><th>Useful measurements</th><th>Start here</th></tr></thead><tbody>
<tr><td>Which organism fits the application?</td><td>Verified strain identity and application-specific composition.</td><td><a href="/applications/#species">Species guides</a></td></tr>
<tr><td>What conditions support the culture?</td><td>Light, temperature, chemistry, gas exchange and biomass trends.</td><td><a href="/microalgae-cultivation/">Microalgae cultivation</a></td></tr>
<tr><td>How does the vessel change those conditions?</td><td>Light distribution, mixing and heat/mass transfer.</td><td><a href="/photobioreactors/">Photobioreactor design principles</a></td></tr>
<tr><td>Which individual cells differ?</td><td>Identity-preserving imaging and independently verified phenotypes.</td><td><a href="/blog/single-cell-microalgae-microfluidics">Single-cell microalgae methods</a></td></tr>
</tbody></table>
<h2>Applications: useful distinctions, not universal promises</h2>
<p><a href="/applications/#aquaculture">Aquaculture live feeds</a> depend on cell size, digestibility and the animal's life stage. <a href="/applications/microalgal-biotechnology">Pigments and lipids</a> require an appropriate strain and extraction or measurement method; an image's color alone does not determine compound concentration. <a href="/applications/phytoplankton-aquaculture-food-webs">Food-web applications</a> involve transfer through other organisms, not just algae growth.</p>
<p>Environmental or carbon-related applications require a defined accounting boundary. Photosynthetic uptake during growth does not by itself establish durable carbon removal, net climate benefit or safe use of biomass exposed to contaminants. Energy, nutrients, harvest losses and downstream handling belong in the evaluation.</p>
<h2>Algaephyte and Cyanoflow address different scales</h2>
<p><a href="/algaephyte/">Algaephyte</a> is a cultivation research concept: sensors, growth models and bounded control proposals at culture scale. <a href="/cyanoflow">Cyanoflow</a> is a single-cell research concept: compartmentalization, microscopy, tracking and candidate characterization. Shared computer-vision methods do not collapse the two questions into one product.</p>
<p>Neither platform has validated hardware performance on this site. The <a href="/research/">research methodology</a> explains the distinction between a literature-backed statement, a proposed architecture, an educational simulation and a measured result.</p>
<h2>How to evaluate a biotechnology claim</h2>
<ol><li>Identify the organism, strain, cultivation mode and conditions.</li><li>Separate measured biomass from optical or image-derived proxies.</li><li>Check whether comparisons use the same units, time window and system boundary.</li><li>Look for independent biological replicates, controls and stated exclusions.</li><li>Check whether the reported result concerns a culture, a recovered cell or a downstream assay.</li></ol>
<p>These questions prevent a species description, simulation or laboratory observation from being presented as a deployment, food-safety assurance or production guarantee.</p>
<h2>Sources and a reading route</h2>
<ol><li><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC9033726/">Benner et al. (2022), Lab-scale photobioreactor systems: principles, applications, and scalability</a>. DOI: 10.1007/s00449-022-02711-1.</li><li><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC9731602/">Chanquia et al. (2021 online; 2022 issue), Photobioreactors for cultivation and synthesis: specifications, challenges, and perspectives</a>. DOI: 10.1002/elsc.202100070.</li></ol>
<p>Next: <a href="/microalgae-cultivation/">understand cultivation inputs</a>, <a href="/applications/">choose an application or species</a>, or use the <a href="/glossary">scientific glossary</a> to clarify an unfamiliar term.</p>
'''

CULTIVATION = '''
<p class="dek">Microalgae cultivation is the maintenance of a defined organism under conditions that support the biological process you want to study. Light, temperature, nutrients, carbon supply, mixing and gas exchange interact; there is no universal recipe or optimum that fits every species, strain and vessel.</p>
<h2>Start with identity and the question</h2>
<p>Choose a documented culture and a measurable goal before selecting equipment. A <a href="/applications/species/arthrospira">Spirulina/Arthrospira culture</a> and a marine <a href="/applications/species/isochrysis-tisochrysis">Isochrysis or Tisochrysis culture</a> are not interchangeable. Use the <a href="/applications/how-to-start-a-phytoplankton-culture">starter-culture guide</a> for planning and the <a href="/applications/how-to-grow-a-microalgae-culture">setup explainer</a> for a general workflow.</p>
<p>Record strain/source, medium, vessel, illumination schedule, sampling method and what constitutes success. Do not casually culture unknown environmental organisms; use appropriate containment and institutional procedures. A culture's appearance does not certify identity or suitability for consumption.</p>
<h2>The inputs interact</h2>
<table><thead><tr><th>Input</th><th>What changes</th><th>What not to infer</th><th>Supporting guide</th></tr></thead><tbody>
<tr><td>Light</td><td>Available energy, self-shading and exposure history.</td><td>Wall illumination equals light received by every cell.</td><td><a href="/blog/light-temperature-mixing">Light, temperature and mixing</a></td></tr>
<tr><td>Temperature</td><td>Growth response and gas solubility.</td><td>A published strain optimum applies to yours.</td><td><a href="/blog/winter-home-growing-warmth">Cold-weather cultivation constraints</a></td></tr>
<tr><td>Nutrients</td><td>Biomass formation and cellular composition.</td><td>More nutrient always means more useful growth.</td><td><a href="/blog/zarrouk-medium-and-nutrients">Spirulina medium and nutrients</a></td></tr>
<tr><td>Carbon and pH</td><td>Carbonate chemistry and available inorganic carbon.</td><td>pH alone measures carbon inventory.</td><td><a href="/blog/alkalinity-as-a-control-variable">Alkalinity versus pH</a></td></tr>
<tr><td>Mixing and gas exchange</td><td>Cell exposure, carbon transfer and oxygen removal.</td><td>Maximum bubbling is always beneficial.</td><td><a href="/photobioreactors/">Photobioreactor transport tradeoffs</a></td></tr>
</tbody></table>
<p>The reactor review by Benner et al. explains why light attenuation and transport conditions complicate comparisons between vessels [1]. Setpoints belong to a defined experimental context, not a universal species property.</p>
<h2>Monitoring: optical density is a proxy</h2>
<p>Optical density describes attenuation through a sample and depends on wavelength, path length, reference blank and concentration. Pigment changes and scattering can change the signal. A calibration to biomass must be appropriate to the organism, instrument and conditions; direct biomass or cell measurements answer different questions [2].</p>
<p>Read <a href="/blog/six-culture-signals-main-senses">the proposed six sensor channels</a> and <a href="/blog/dissolved-oxygen-stress-signal">dissolved-oxygen interpretation</a>. Record calibration, sample dilution and timestamps alongside readings. DO concentration or percent saturation must be interpreted with temperature and relevant water chemistry.</p>
<h2>Contamination and culture failure</h2>
<p>Unexpected appearance, drifting measurements or stalled growth justify investigation, not an automatic diagnosis. Review <a href="/applications/prevent-contamination-microalgae-cultures">contamination prevention</a> and <a href="/blog/troubleshooting-contamination-crashes">Spirulina culture failures</a>. High pH can influence which organisms compete, but it does not prove a culture is uncontaminated or food-safe.</p>
<p>Keep records of failed runs and possible measurement errors. Do not use an image classifier to certify food safety. If identity or safety is uncertain, do not consume the culture; the <a href="/disclaimer">safety disclaimer</a> explains the limits of this educational site.</p>
<h2>Batch, continuous operation and scaling</h2>
<p>A batch run changes as biomass, nutrients and optical depth change. Continuous or semi-continuous operation introduces feed, removal and residence-time questions. The cultivation mode affects how a growth rate or yield should be interpreted. Enlarging a vessel changes geometry and transport, so multiplying a small-vessel result is not a scale-up validation [1].</p>
<p>Use <a href="/applications/how-to-scale-a-microalgae-culture">the scale-up guide</a> for planning questions and <a href="/blog/harvesting-and-using-fresh-spirulina">harvest considerations</a> for educational context. Neither page establishes a validated consumption protocol.</p>
<h2>Models and automation are a separate layer</h2>
<p><a href="/algaephyte/">Algaephyte</a> proposes combining observations with a growth model and bounded action proposals. Calibration error, missing readings and mismatched models can still produce misleading recommendations. A useful model needs validation against observations it was not fitted to. The <a href="/#simulation">interactive cultivation model</a> demonstrates qualitative relationships, not measured performance.</p>
<h2>Sources and next reading</h2>
<ol><li><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC9033726/">Benner et al. (2022), Lab-scale photobioreactor systems</a>. Reactor choice, light distribution and scale-up limitations.</li><li><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC9368473/">Schagerl et al. (2022), Estimating biomass and vitality of microalgae</a>. DOI: 10.3390/cells11152455. Measurement choices and optical limitations.</li></ol>
<p>Next: <a href="/photobioreactors/">choose a reactor around the measurement question</a>, compare <a href="/applications/#species">organism-specific guides</a>, or review <a href="/research/">evidence and methodology labels</a>.</p>
'''

REACTORS = '''
<p class="dek">A photobioreactor is a cultivation system that supplies light to photosynthetic organisms while managing their environment. Its design must balance light delivery, mixing, gas exchange, heat control and cleanability. No reactor geometry is best for every strain or research question.</p>
<h2>How a photobioreactor works</h2>
<p>Light supplies energy, while the culture medium supplies nutrients and inorganic carbon. Cells absorb and scatter light, so exposure changes with biomass concentration and path length. Mixing moves cells and redistributes dissolved substances; gas transfer can supply carbon dioxide and remove photosynthetically generated oxygen. Heat and surface fouling change conditions too [1, 2].</p>
<p>That coupled behavior explains why a wall-light reading or a pump setting alone cannot characterize a reactor. Begin with <a href="/microalgae-cultivation/">cultivation requirements</a> and define which variables the experiment must hold steady or intentionally change.</p>
<h2>Open ponds and closed vessels: a decision, not a ranking</h2>
<p>Open ponds allow direct environmental exposure and can suit particular organisms and production contexts. Closed systems offer different opportunities for containment and control but add construction, cleaning and operational costs. Closed does not automatically mean axenic, contamination-proof or cheaper per useful product. Benner et al. and the Oklahoma State University design explainer discuss these tradeoffs [1, 3].</p>
<h2>Compare common reactor geometries</h2>
<table><thead><tr><th>Geometry</th><th>Reason to consider it</th><th>Important limitation</th></tr></thead><tbody>
<tr><td>Illuminated flask</td><td>Simple small-scale batch observations.</td><td>Control and gas transfer may not represent a larger reactor.</td></tr>
<tr><td>Bubble column or airlift</td><td>Gas-driven circulation and culture observation.</td><td>Column width changes light paths; bubbling can affect cells and measurement.</td></tr>
<tr><td>Flat panel</td><td>Shorter optical path and a large illuminated surface.</td><td>Heat removal, fouling, mixing and modular expansion need evaluation.</td></tr>
<tr><td>Tubular loop</td><td>Distributed illuminated culture volume.</td><td>Circulation, gas removal and light/temperature gradients require attention.</td></tr>
<tr><td>Illuminated stirred tank</td><td>Defined mixing and controlled experimental conditions.</td><td>Illumination geometry and shear may constrain suitability.</td></tr>
</tbody></table>
<p>This comparison is qualitative, summarized from reactor reviews [1, 2]. It is not a yield, cost or energy-efficiency comparison measured by Orr Biologicals.</p>
<h2>Light management and self-shading</h2>
<p>Incident photon flux at a vessel surface is not the same as exposure inside a dense suspension. Path length, cell concentration and pigments matter; light that is excessive near a surface may coexist with light limitation deeper inside. Read <a href="/blog/light-temperature-mixing">light and mixing</a> and <a href="/blog/digital-twin-droop-steele-model">Droop, Steele and attenuation assumptions</a>. An ideal Beer–Lambert description may not capture all scattering and geometry effects.</p>
<h2>Mixing, carbon supply and oxygen removal</h2>
<p>Transport should be characterized, not inferred from bubbles alone. Gas exchange and circulation influence carbon availability, DO and the sequence of light/dark exposure experienced by cells. Pumping or aeration can introduce shear, bubbles and foaming; the tolerable conditions depend on the organism and setup [2, 3].</p>
<p><a href="/blog/dissolved-oxygen-stress-signal">Dissolved-oxygen monitoring</a> and <a href="/blog/alkalinity-as-a-control-variable">carbonate chemistry</a> provide different evidence. A pH change alone is not a complete gas-transfer measurement.</p>
<h2>Sensors and contamination monitoring</h2>
<p>Temperature, pH, irradiance, optical density, DO and conductivity can support monitoring when calibration and context are recorded. <a href="/blog/six-culture-signals-main-senses">The Algaephyte sensor design</a> describes a proposed suite, not a validated instrument. Cameras may reveal morphology or debris, but <a href="/blog/vision-contamination-detection">vision cannot certify identity or food safety</a>.</p>
<h2>Digital twins and bounded control</h2>
<p>A model can compare hypotheses or proposed changes, but model agreement is not proof that an action is safe. <a href="/algaephyte/">Algaephyte's cultivation concept</a> separates measurement, prediction, proposals and independent actuator limits. <a href="/blog/bounded-autonomy-safe-ai-proposals">Bounded automation</a> must also handle stale data and unavailable components.</p>
<p>Before extrapolating a lab result, document the reactor, organism, operating mode, measurement methods and failure cases. Geometry changes during scale-up alter transfer and illumination; see <a href="/applications/how-to-scale-a-microalgae-culture">scale-up planning</a>.</p>
<h2>Sources and scope</h2>
<ol><li><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC9033726/">Benner et al. (2022), Lab-scale photobioreactor systems: principles, applications, and scalability</a>. DOI: 10.1007/s00449-022-02711-1.</li><li><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC9731602/">Chanquia et al., Photobioreactors for cultivation and synthesis</a>. DOI: 10.1002/elsc.202100070 (2021 online; 2022 issue).</li><li><a href="https://extension.okstate.edu/fact-sheets/photobioreactor-design-for-algal-biomass-production">Dunford (2015), Photobioreactor design for algal biomass production</a>. Oklahoma State University Extension, FAPC-192.</li></ol>
<p>Next: <a href="/microalgae-cultivation/">connect reactor design to cultivation inputs</a> or <a href="/research/">review the research evidence framework</a>. This explainer is not an electrical, pressure-system or food-safety construction protocol.</p>
'''

ALGAEPHYTE = '''
<p class="dek">Algaephyte is Orr Biologicals' proposed intelligent microalgae cultivation system. It combines culture-level sensors, a growth model, optional camera analysis and bounded control proposals. It is a research concept in development, not a validated reactor or commercially deployed product.</p>
<h2>What question does Algaephyte address?</h2>
<p>The question is whether documented observations and a calibrated model can help a grower understand changing conditions without handing unrestricted actuator control to an AI model. Unlike <a href="/cyanoflow">Cyanoflow's single-cell discovery workflow</a>, Algaephyte concerns the environment of a growing culture: chemistry, illumination, mixing and gas exchange.</p>
<p><a href="/microalgae-cultivation/">Microalgae cultivation fundamentals</a> establish the biology; <a href="/photobioreactors/">photobioreactor design</a> establishes why vessel geometry and transport matter. The hardware/software proposals on the <a href="/#inside">interactive architecture page</a> still require assembly, calibration and fault testing.</p>
<h2>Sensors: different signals, not one health number</h2>
<p>The proposed inputs are pH, temperature, wall irradiance, optical density, dissolved oxygen and conductivity. Each can be wrong or ambiguous. An optical-density calibration depends on wavelength, path length, organism and conditions; cameras measure image features, not biochemical composition [1].</p>
<p>Read <a href="/blog/six-culture-signals-main-senses">the six-channel sensor concept</a>, <a href="/blog/dissolved-oxygen-stress-signal">DO interpretation</a> and <a href="/blog/alkalinity-as-a-control-variable">alkalinity and carbon chemistry</a>. Record the measurement process before claiming an instrument detects a biological change.</p>
<h2>Digital twin: predictions need held-out tests</h2>
<p>Candidate model components include nutrient-quota kinetics, light-response curves and light attenuation. Their presence does not establish correct parameters or a useful forecast horizon. <a href="/blog/digital-twins-biological-cultivation">A biological digital twin</a> must be connected to observations; <a href="/blog/digital-twin-droop-steele-model">Droop and Steele design notes</a> explain some selected assumptions.</p>
<p>Test predictions on runs or time periods excluded from fitting, document residual errors and specify where the model should refuse a forecast. The <a href="/#simulation">living culture simulation</a> is educational; its outputs are not measured reactor yield.</p>
<h2>Computer vision and edge AI</h2>
<p>Local camera inference may offer another evidence stream, but bubbles, debris, focus and unseen organisms can confound classification. The <a href="/blog/vision-contamination-detection">vision limitations note</a> and <a href="/blog/edge-ai-biological-systems">edge-AI tradeoffs</a> are design context. No accuracy, inference speed, power draw or contamination-detection performance is established for an assembled Algaephyte instrument.</p>
<h2>Bounded automation: proposals do not own pumps</h2>
<p>The proposed architecture separates fixed software limits, model-based checks and independent actuator-controller limits. Optional assistant output should never bypass these controls. <a href="/blog/control-loop-architecture">The control-loop design</a> and <a href="/blog/bounded-autonomy-safe-ai-proposals">bounded AI proposals</a> describe intended behavior, not safety certification.</p>
<table><thead><tr><th>Condition</th><th>Required design response to test</th></tr></thead><tbody>
<tr><td>Stale or implausible sensor reading</td><td>Reject unsupported actions; expose uncertainty to the operator.</td></tr>
<tr><td>Malformed assistant proposal</td><td>Reject incomplete units, rate or mass limits rather than guess.</td></tr>
<tr><td>Lost network or optional inference</td><td>Do not rely on the missing component for actuator permission.</td></tr>
<tr><td>Hardware command/output disagreement</td><td>Use independently tested watchdogs, clamps and physical stop paths.</td></tr>
</tbody></table>
<p>These are requirements for future tests. A plausible diagram or multiple software checks do not demonstrate independent physical protection.</p>
<h2>Research status and next experiments</h2>
<p>Priorities are sensor calibration, model identification, matched prediction/observation runs and fault injection. Any future performance report should disclose strain, medium, reactor geometry, energy inputs, replicates, exclusions and failed runs. A proposed parameter-sharing network also needs privacy and compatibility testing; read <a href="/blog/federated-learning-network">the mesh design</a>.</p>
<p>The site makes no finished reactor offer, validated deployment, cultivation improvement or food-safety claim. <a href="/research/">Research status and methodology</a> defines the labels used here; <a href="/disclaimer">the scientific disclaimer</a> sets the safety scope.</p>
<h2>Source reading and next steps</h2>
<p>[1] <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC9368473/">Schagerl et al. (2022), Estimating biomass and vitality of microalgae</a> supports the discussion of measurement proxies. For vessel selection, see <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC9033726/">Benner et al. (2022), lab-scale photobioreactors</a>. Neither source validates Orr Biologicals hardware.</p>
<p>Next: inspect <a href="/#system">the existing proposed control loop</a>, explore <a href="/#simulation">the model interface</a>, or <a href="/#deploy">discuss a research question</a>.</p>
'''

TOPICS = [
('algae-biotechnology/index.html', 'Algae Biotechnology: Organisms, Cultivation & Research | Orr Biologicals', 'Understand algae biotechnology: organism selection, cultivation, photobioreactors, compounds and single-cell research, with evidence limits and source reading.', BIOTECH, False),
('microalgae-cultivation/index.html', 'Microalgae Cultivation: Light, Nutrients & Monitoring | Orr Biologicals', 'Learn how light, temperature, nutrients, carbon, mixing and monitoring interact in microalgae cultivation. Compare measurements and find species-specific guides.', CULTIVATION, False),
('photobioreactors/index.html', 'Microalgae Photobioreactors: Design, Light & Sensors | Orr Biologicals', 'Compare photobioreactor geometries and understand light paths, mixing, gas exchange, sensors and scale-up limits using cited research and educational guides.', REACTORS, False),
('algaephyte/index.html', 'AI-Assisted Microalgae Cultivation Research | Algaephyte', 'Explore Algaephyte’s proposed sensor-based cultivation, digital twin and bounded automation. Research design goals, not validated hardware or deployed products.', ALGAEPHYTE, False),
]
H1 = {
'algae-biotechnology/index.html': 'Algae biotechnology: organisms, cultivation and research',
'microalgae-cultivation/index.html': 'Microalgae cultivation: conditions and monitoring',
'photobioreactors/index.html': 'Microalgae photobioreactors: design and measurement',
'algaephyte/index.html': 'Algaephyte: AI-assisted microalgae cultivation research',
}
