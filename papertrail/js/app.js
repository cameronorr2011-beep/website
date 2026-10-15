import { createApiTransport } from "/papertrail/js/api.js";
import { clearSession, createSession, exportSessionJson, loadSession, saveSession } from "/papertrail/js/store.js";

const DEMO_LABEL = "SYNTHETIC DEMONSTRATION DATA";
const QUESTION = "Does increasing light intensity consistently improve microalgae biomass productivity?";
const VIEW_META = {
  overview: ["Investigation state", "Overview"],
  agents: ["Four-role pipeline", "Agent roles"],
  evidence: ["Source packet", "Evidence browser"],
  claims: ["Traceable assertions", "Claims"],
  debate: ["Adversarial review", "Debate"],
  graph: ["Claim / evidence links", "Trace table"],
  report: ["Adjudicated output", "Final report"],
};

const SOURCES = [
  {
    id: "PT-SRC-001",
    title: "Synthetic light-response batch series",
    kind: "Synthetic experiment record",
    date: "DEMO DATE / 2026-10-14",
    scope: "12 synthetic culture runs · four nominal light conditions",
    description: "A fixed demonstration packet with replicate productivity values at 120, 320, 640, and 960 µmol photons m⁻² s⁻¹.",
    method: "Values were authored for this PaperTrail demonstration. They are not measurements, a publication, or a literature extraction.",
    url: "https://example.invalid/papertrail-demo/source-1",
    provenance: DEMO_LABEL,
  },
  {
    id: "PT-SRC-002",
    title: "Synthetic replicate notebook / variance check",
    kind: "Synthetic laboratory notebook",
    date: "DEMO DATE / 2026-10-14",
    scope: "Three synthetic replicate groups · within-group spread retained",
    description: "A deliberately uneven replicate set used to test whether a mean increase survives variation between nominal light conditions.",
    method: "The notebook is a deterministic teaching fixture. It has no author, institution, DOI, accession, or real-world provenance.",
    url: "https://example.invalid/papertrail-demo/source-2",
    provenance: DEMO_LABEL,
  },
  {
    id: "PT-SRC-003",
    title: "Synthetic high-light stress window",
    kind: "Synthetic boundary-condition record",
    date: "DEMO DATE / 2026-10-14",
    scope: "High-intensity edge cases · 4 synthetic observations",
    description: "A boundary-condition record in which the highest nominal condition stops improving and one replicate declines.",
    method: "The pattern is a synthetic counterexample for debate practice; it does not establish photoinhibition in any organism.",
    url: "https://example.invalid/papertrail-demo/source-3",
    provenance: DEMO_LABEL,
  },
  {
    id: "PT-SRC-004",
    title: "Synthetic methods and uncertainty ledger",
    kind: "Synthetic analysis note",
    date: "DEMO DATE / 2026-10-14",
    scope: "Design limits · confounding and transferability notes",
    description: "A short ledger separating the observed synthetic association from causal or real-culture conclusions.",
    method: "This note is generated as part of the demo packet and is not an external methods standard or peer-reviewed source.",
    url: "https://example.invalid/papertrail-demo/source-4",
    provenance: DEMO_LABEL,
  },
];

const RECORDS = [
  {
    id: "PT-EVD-001",
    sourceId: "PT-SRC-001",
    condition: "120 → 320",
    value: "78 → 101",
    unit: "synthetic mg L⁻¹ d⁻¹",
    observation: "Productivity rises between the two lower nominal light conditions in the fixed batch series.",
    uncertainty: "Replicate spread is retained; the change is descriptive only.",
    provenance: DEMO_LABEL,
  },
  {
    id: "PT-EVD-002",
    sourceId: "PT-SRC-001",
    condition: "320 → 640",
    value: "101 → 117",
    unit: "synthetic mg L⁻¹ d⁻¹",
    observation: "The batch-series mean continues upward, with a smaller increment than the first shift.",
    uncertainty: "The packet does not model temperature, nutrient status, density, or light attenuation.",
    provenance: DEMO_LABEL,
  },
  {
    id: "PT-EVD-003",
    sourceId: "PT-SRC-003",
    condition: "640 → 960",
    value: "117 → 108",
    unit: "synthetic mg L⁻¹ d⁻¹",
    observation: "The highest nominal condition is lower than the preceding condition in the boundary record.",
    uncertainty: "This is a counterexample inside a synthetic packet, not evidence of a universal high-light mechanism.",
    provenance: DEMO_LABEL,
  },
  {
    id: "PT-EVD-004",
    sourceId: "PT-SRC-002",
    condition: "Replicate spread",
    value: "±14 to ±22",
    unit: "synthetic mg L⁻¹ d⁻¹",
    observation: "The synthetic replicate groups overlap at adjacent conditions, weakening a simple monotonic reading.",
    uncertainty: "No inferential interval or power calculation is implied by these authored values.",
    provenance: DEMO_LABEL,
  },
  {
    id: "PT-EVD-005",
    sourceId: "PT-SRC-004",
    condition: "Design boundary",
    value: "1 question",
    unit: "synthetic uncertainty note",
    observation: "An observed association within this packet cannot identify a causal light response for a real culture.",
    uncertainty: "Species, spectrum, photoperiod, temperature, mixing, density, and measurement protocol are unresolved.",
    provenance: DEMO_LABEL,
  },
];

const AGENT_ROLES = [
  {
    id: "PT-AGENT-CUR-001",
    code: "CUR",
    name: "Evidence Curator",
    role: "Source librarian",
    stage: "01 / catalog",
    focus: "Separates original synthetic source metadata from later generated summaries and indexes each record by stable ID.",
    status: "queued",
    provenance: DEMO_LABEL,
  },
  {
    id: "PT-AGENT-QUA-002",
    code: "QUA",
    name: "Quantitative Analyst",
    role: "Pattern analyst",
    stage: "02 / compare",
    focus: "Compares the fixed synthetic values across light conditions while keeping spread, saturation, and boundary behavior visible.",
    status: "queued",
    provenance: DEMO_LABEL,
  },
  {
    id: "PT-AGENT-SKE-003",
    code: "SKE",
    name: "Skeptical Reviewer",
    role: "Adversarial reviewer",
    stage: "03 / challenge",
    focus: "Looks for overreach: monotonicity, causality, transfer to a real culture, and whether the packet supports the wording of the claim.",
    status: "queued",
    provenance: DEMO_LABEL,
  },
  {
    id: "PT-AGENT-ADJ-004",
    code: "ADJ",
    name: "Adjudicator",
    role: "Synthesis lead",
    stage: "04 / adjudicate",
    focus: "Resolves the disagreement into qualified claims, explicit uncertainty, a trace table, and a report that preserves the source links.",
    status: "queued",
    provenance: DEMO_LABEL,
  },
];

const AGENT_OUTPUTS = {
  "PT-AGENT-CUR-001": {
    id: "PT-OUT-CUR-001",
    agentId: "PT-AGENT-CUR-001",
    label: DEMO_LABEL,
    headline: "Four synthetic source records form one bounded evidence packet.",
    summary: "The source layer is internally organized, but it is not a real literature set. The records are synthetic inputs for traceability practice.",
    points: [
      { text: "PT-SRC-001 and PT-SRC-002 carry the comparative observations and replicate spread.", sourceIds: ["PT-SRC-001", "PT-SRC-002"], qualifier: "source inventory" },
      { text: "PT-SRC-003 is an intentionally high-light boundary record, not a universal biological rule.", sourceIds: ["PT-SRC-003"], qualifier: "source inventory" },
      { text: "PT-SRC-004 records the transfer and causality limits before any synthesis is written.", sourceIds: ["PT-SRC-004"], qualifier: "source inventory" },
    ],
  },
  "PT-AGENT-QUA-002": {
    id: "PT-OUT-QUA-002",
    agentId: "PT-AGENT-QUA-002",
    label: DEMO_LABEL,
    headline: "The synthetic mean rises through 640, then falls at 960.",
    summary: "The packet supports an increase over the lower-to-middle transitions, but the sequence is not monotonic across all four nominal conditions.",
    points: [
      { text: "The 120 → 320 shift is +23 synthetic mg L⁻¹ d⁻¹; the 320 → 640 shift is +16.", sourceIds: ["PT-SRC-001"], qualifier: "descriptive comparison" },
      { text: "The 640 → 960 shift is −9 in the high-light boundary record.", sourceIds: ["PT-SRC-003"], qualifier: "descriptive comparison" },
      { text: "Overlapping authored replicate spread makes a simple always-increasing interpretation unstable.", sourceIds: ["PT-SRC-002"], qualifier: "uncertainty" },
    ],
  },
  "PT-AGENT-SKE-003": {
    id: "PT-OUT-SKE-003",
    agentId: "PT-AGENT-SKE-003",
    label: DEMO_LABEL,
    headline: "A trend inside the packet is not a causal or transferable result.",
    summary: "The original wording ‘consistently improve’ is too strong for this evidence. A real-culture conclusion remains unresolved because key design variables are absent.",
    points: [
      { text: "The high-light counterexample directly challenges the word consistently.", sourceIds: ["PT-SRC-003"], qualifier: "disagreement" },
      { text: "Replicate overlap and omitted culture conditions limit confidence in a monotonic interpretation.", sourceIds: ["PT-SRC-002", "PT-SRC-004"], qualifier: "uncertainty" },
      { text: "The packet cannot establish what would happen in a named real organism or instrument setup.", sourceIds: ["PT-SRC-004"], qualifier: "unresolved" },
    ],
  },
  "PT-AGENT-ADJ-004": {
    id: "PT-OUT-ADJ-004",
    agentId: "PT-AGENT-ADJ-004",
    label: DEMO_LABEL,
    headline: "Adjudicated: higher light helps some transitions here, not consistently across the packet.",
    summary: "The final wording preserves the observed synthetic pattern and separates it from inference about causality or any real culture.",
    points: [
      { text: "Retain the qualified packet-level claim: gains plateau and reverse at the highest synthetic condition.", sourceIds: ["PT-SRC-001", "PT-SRC-003"], qualifier: "qualified inference" },
      { text: "Retain uncertainty about causes, transferability, and experimental design adequacy.", sourceIds: ["PT-SRC-002", "PT-SRC-004"], qualifier: "unresolved" },
      { text: "Do not present the demo output as a recommendation for light control or cultivation.", sourceIds: ["PT-SRC-004"], qualifier: "boundary" },
    ],
  },
};

const FINDINGS = [
  {
    id: "PT-FND-001",
    label: DEMO_LABEL,
    title: "Lower-to-middle light transitions show synthetic gains.",
    text: "The authored packet increases from 78 to 101 and then 117 synthetic productivity units across the first three nominal conditions.",
    sourceIds: ["PT-SRC-001"],
    qualifier: "DESCRIPTIVE OBSERVATION",
  },
  {
    id: "PT-FND-002",
    label: DEMO_LABEL,
    title: "The full sequence is not monotonic.",
    text: "The 960 condition is lower than the 640 condition in the boundary record, so every increase in nominal intensity does not improve the authored outcome.",
    sourceIds: ["PT-SRC-001", "PT-SRC-003"],
    qualifier: "QUALIFIED INFERENCE",
  },
  {
    id: "PT-FND-003",
    label: DEMO_LABEL,
    title: "Transfer to a real culture is unresolved.",
    text: "The packet does not identify a species, spectrum, photoperiod, density, temperature, mixing regime, or validated measurement protocol.",
    sourceIds: ["PT-SRC-002", "PT-SRC-004"],
    qualifier: "UNCERTAINTY / UNRESOLVED",
  },
];

const CLAIMS = [
  {
    id: "PT-CLM-001",
    label: DEMO_LABEL,
    statement: "Within this synthetic packet, increasing nominal light intensity does not consistently improve biomass productivity; gains taper and reverse at the highest condition.",
    detail: "This is the adjudicated packet-level claim. It describes the authored records and should not be read as a biological law or operating recommendation.",
    status: "QUALIFIED INFERENCE",
    confidence: "Moderate for this synthetic packet",
    sourceIds: ["PT-SRC-001", "PT-SRC-002", "PT-SRC-003"],
    evidenceIds: ["PT-EVD-001", "PT-EVD-002", "PT-EVD-003", "PT-EVD-004"],
  },
  {
    id: "PT-CLM-002",
    label: DEMO_LABEL,
    statement: "The largest authored increase occurs between the low and middle conditions, but the comparison is descriptive rather than causal.",
    detail: "The values support a within-packet comparison. They do not isolate light from density, temperature, mixing, spectrum, or other culture variables.",
    status: "DESCRIPTIVE COMPARISON",
    confidence: "Bounded to the authored values",
    sourceIds: ["PT-SRC-001", "PT-SRC-004"],
    evidenceIds: ["PT-EVD-001", "PT-EVD-002", "PT-EVD-005"],
  },
  {
    id: "PT-CLM-003",
    label: DEMO_LABEL,
    statement: "Whether increasing light would improve productivity in a specific real microalgae culture remains unresolved.",
    detail: "The demonstration intentionally stops before making a live or real-world claim. A valid answer would require a defined organism, protocol, measured replicates, and an appropriate analysis.",
    status: "UNRESOLVED / NEEDS REAL STUDY",
    confidence: "Not estimable from demo data",
    sourceIds: ["PT-SRC-002", "PT-SRC-003", "PT-SRC-004"],
    evidenceIds: ["PT-EVD-003", "PT-EVD-004", "PT-EVD-005"],
  },
];

const DEBATE = {
  label: DEMO_LABEL,
  disagreement: {
    id: "PT-DEB-001",
    title: "Disagreement · the trend is not enough",
    agentId: "PT-AGENT-SKE-003",
    text: "The quantitative pattern is being overread if it is summarized as ‘more light is better.’ The highest condition falls, replicates overlap, and the packet omits variables that could explain the differences.",
    sourceIds: ["PT-SRC-002", "PT-SRC-003", "PT-SRC-004"],
    qualifier: "CHALLENGE / UNCERTAINTY",
  },
  rebuttal: {
    id: "PT-DEB-002",
    title: "Rebuttal · retain the bounded comparison",
    agentId: "PT-AGENT-QUA-002",
    text: "The comparison still supports a limited descriptive statement: the authored values rise through the middle conditions and then fall. The rebuttal accepts that this does not identify cause or transfer to a real culture.",
    sourceIds: ["PT-SRC-001", "PT-SRC-003", "PT-SRC-004"],
    qualifier: "RESPONSE / QUALIFIED",
  },
  adjudication: {
    id: "PT-DEB-003",
    title: "Adjudication · answer the exact wording",
    agentId: "PT-AGENT-ADJ-004",
    text: "The word consistently is rejected for the synthetic packet. The final answer is a qualified no for this demo dataset, paired with an unresolved boundary: the result cannot answer what will happen in a particular real culture.",
    sourceIds: ["PT-SRC-001", "PT-SRC-002", "PT-SRC-003", "PT-SRC-004"],
    qualifier: "ADJUDICATED / SYNTHETIC ONLY",
  },
};

const GRAPH = {
  label: DEMO_LABEL,
  note: "No force-directed renderer is used in this vertical slice. This honest table fallback keeps every claim-to-record relationship inspectable and exportable.",
  edges: [
    { claimId: "PT-CLM-001", relationship: "supported by", evidenceId: "PT-EVD-001", sourceId: "PT-SRC-001", qualifier: "gain at lower transition" },
    { claimId: "PT-CLM-001", relationship: "qualified by", evidenceId: "PT-EVD-003", sourceId: "PT-SRC-003", qualifier: "highest condition declines" },
    { claimId: "PT-CLM-001", relationship: "qualified by", evidenceId: "PT-EVD-004", sourceId: "PT-SRC-002", qualifier: "replicate overlap" },
    { claimId: "PT-CLM-002", relationship: "supported by", evidenceId: "PT-EVD-001", sourceId: "PT-SRC-001", qualifier: "descriptive increase" },
    { claimId: "PT-CLM-002", relationship: "bounded by", evidenceId: "PT-EVD-005", sourceId: "PT-SRC-004", qualifier: "no causal isolation" },
    { claimId: "PT-CLM-003", relationship: "left unresolved by", evidenceId: "PT-EVD-005", sourceId: "PT-SRC-004", qualifier: "real-culture transfer unknown" },
    { claimId: "PT-CLM-003", relationship: "left unresolved by", evidenceId: "PT-EVD-004", sourceId: "PT-SRC-002", qualifier: "spread and design limits" },
  ],
};

const REPORT = {
  id: "PT-RPT-001",
  label: DEMO_LABEL,
  title: "Light intensity and synthetic biomass productivity",
  generatedBy: "PT-AGENT-ADJ-004",
  status: "QUALIFIED SYNTHETIC CONCLUSION",
  executiveSummary: "For this fixed synthetic packet, increasing nominal light intensity does not consistently improve biomass productivity: values rise through the middle conditions and then decline at the highest condition. This is a bounded demonstration inference, not a result about a real culture.",
  summarySourceIds: ["PT-SRC-001", "PT-SRC-003"],
  sections: [
    {
      heading: "What the packet shows",
      text: "The authored sequence moves from 78 to 101 to 117 and then 108 synthetic productivity units. That shape supports a qualified packet-level statement about non-monotonic behavior.",
      sourceIds: ["PT-SRC-001", "PT-SRC-003"],
      qualifier: "DESCRIPTIVE OBSERVATION / QUALIFIED INFERENCE",
    },
    {
      heading: "Why the debate matters",
      text: "The skeptical review correctly rejects a universal ‘more is better’ interpretation. Replicate overlap and missing culture variables prevent a causal reading, even though the within-packet pattern remains inspectable.",
      sourceIds: ["PT-SRC-002", "PT-SRC-004"],
      qualifier: "UNCERTAINTY / REBUTTAL RETAINED",
    },
    {
      heading: "Answer to the question",
      text: "Qualified no for the synthetic demonstration packet: the authored values do not improve at every higher nominal intensity. Unresolved for a specific real microalgae culture: this packet does not contain the measurements or design needed to answer that question.",
      sourceIds: ["PT-SRC-001", "PT-SRC-002", "PT-SRC-003", "PT-SRC-004"],
      qualifier: "ADJUDICATION / SYNTHETIC ONLY",
    },
  ],
  limitations: [
    "SYNTHETIC / no record is a real publication, experiment, institution, or measurement.",
    "UNRESOLVED / organism, light spectrum, photoperiod, temperature, mixing, density, nutrients, and assay protocol are unspecified.",
    "INFERENCE BOUNDARY / no cultivation setting, dosing instruction, or control recommendation follows from this report.",
  ],
};

const roleById = new Map(AGENT_ROLES.map((role) => [role.id, role]));
const sourceById = new Map(SOURCES.map((source) => [source.id, source]));
const recordById = new Map(RECORDS.map((record) => [record.id, record]));
const claimById = new Map(CLAIMS.map((claim) => [claim.id, claim]));

const app = document.querySelector(".papertrail-app");
const panel = document.getElementById("pt-panel");
const dialog = document.getElementById("pt-reset-dialog");
const api = createApiTransport({ baseUrl: app?.dataset.apiBase || "" });
let currentView = "overview";
let runTimer = null;
let toastTimer = null;
let storageMode = "local";
let storageError = "";
let sessionRecovered = false;

function copy(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function html(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function source(id) {
  return sourceById.get(id) || { id, title: "Unknown source", url: "https://example.invalid/papertrail-demo/unknown", provenance: DEMO_LABEL };
}

function makeInitialSession() {
  return createSession({
    question: QUESTION,
    agentRoles: AGENT_ROLES,
    sources: SOURCES,
    records: RECORDS,
    defaultClaimId: "PT-CLM-001",
  });
}

const loaded = loadSession(makeInitialSession);
let state = loaded.state;
storageMode = loaded.storageMode;
storageError = loaded.storageError;
sessionRecovered = loaded.recovered;
currentView = state.selection?.view && VIEW_META[state.selection.view] ? state.selection.view : "overview";

function syntheticLabel(text = DEMO_LABEL) {
  return `<span class="pt-synthetic-label">${html(text)}</span>`;
}

function trace(ids = []) {
  if (!ids.length) return `<span class="pt-citation pt-citation--inference">INFERENCE / NO DIRECT SOURCE</span>`;
  return `<div class="pt-citations" aria-label="Source trace">${ids.map((id) => `<a class="pt-citation" href="${html(source(id).url)}" data-demo-link data-source-id="${html(id)}">${html(id)}</a>`).join("")}</div>`;
}

function sourceLinks(ids = []) {
  if (!ids.length) return `<p class="pt-epistemic">INFERENCE / no direct source link recorded.</p>`;
  return `<ul class="pt-source-trace-list">${ids.map((id) => {
    const item = source(id);
    return `<li><span><strong class="pt-source-id">${html(item.id)}</strong> · ${html(item.title)}</span><a class="pt-demo-link" href="${html(item.url)}" data-demo-link data-source-id="${html(item.id)}">${html(item.url)}</a><small class="pt-epistemic">NON-REAL DEMO LINK · disabled in this workspace</small></li>`;
  }).join("")}</ul>`;
}

function outputSourceIds(output) {
  return [...new Set((output?.points || []).flatMap((point) => point.sourceIds || []))];
}

function emptyState(title, message, actionText = "Start demo investigation") {
  return `<div class="pt-empty"><div class="pt-empty-inner">${syntheticLabel("EMPTY / NEW SESSION")}<h3>${html(title)}</h3><p>${html(message)}</p><button class="pt-button pt-button--primary" type="button" data-action="start">${html(actionText)} <span aria-hidden="true">→</span></button></div></div>`;
}

function statusForAgent(agentId) {
  return state.agents?.find((agent) => agent.id === agentId)?.status || "queued";
}

function renderStatus() {
  const completeCount = state.workflow.completedAgentIds.length;
  const total = state.workflow.totalSteps || AGENT_ROLES.length;
  const statusLabel = document.getElementById("pt-status-label");
  const statusTitle = document.getElementById("pt-status-title");
  const statusCopy = document.getElementById("pt-status-copy");
  const progressFill = document.getElementById("pt-progress-fill");
  const progressStage = document.getElementById("pt-progress-stage");
  const progressState = document.getElementById("pt-progress-state");
  const startButton = document.getElementById("pt-start");
  const nextRole = AGENT_ROLES[state.workflow.currentStep];

  statusLabel.dataset.state = state.status;
  if (state.status === "new") {
    statusLabel.textContent = "NEW / EMPTY SESSION";
    statusTitle.textContent = "Ready for a controlled demo run";
    statusCopy.textContent = "No agent outputs have been generated. Start the deterministic investigation to populate the workspace.";
    startButton.textContent = "Start demo investigation →";
  } else if (state.status === "running") {
    statusLabel.textContent = `RUNNING / ${completeCount} OF ${total}`;
    statusTitle.textContent = nextRole ? `${nextRole.name} is next` : "Completing the adjudication";
    statusCopy.textContent = nextRole ? `The persisted workflow is processing the ${nextRole.stage} stage. Reload recovery is enabled.` : "The persisted workflow is writing its final report.";
    startButton.textContent = "Investigation running…";
  } else {
    statusLabel.textContent = "COMPLETED / ADJUDICATED";
    statusTitle.textContent = "Traceable demo report is ready";
    statusCopy.textContent = "All four roles have completed. Inspect the disagreement, trace table, and final report.";
    startButton.textContent = "Run demo again →";
  }
  startButton.disabled = state.status === "running";
  progressFill.style.width = `${total ? (completeCount / total) * 100 : 0}%`;
  progressStage.textContent = `${completeCount} / ${total} roles complete`;
  progressState.textContent = state.status;
  document.getElementById("pt-session-id").textContent = state.sessionId;
  document.getElementById("pt-header-live").textContent = api.configured ? "backend configured" : "live mode unavailable";
}

function renderStorage() {
  const card = document.getElementById("pt-storage-card");
  const title = document.getElementById("pt-storage-title");
  const copyText = document.getElementById("pt-storage-copy");
  card.dataset.mode = storageMode;
  if (storageMode === "local") {
    title.textContent = "LOCAL STORAGE ACTIVE";
    copyText.textContent = sessionRecovered ? "Version 1 session recovered from this browser." : "Version 1 session state will recover on reload.";
  } else {
    title.textContent = "STORAGE UNAVAILABLE";
    copyText.textContent = "Session is held in memory only and may not survive reload.";
  }
  if (storageError) card.title = storageError;
}

function renderApiState() {
  const card = document.getElementById("pt-live-card");
  const label = document.getElementById("pt-live-label");
  const title = document.getElementById("pt-live-title");
  const copyText = document.getElementById("pt-live-copy");
  const checkButton = document.getElementById("pt-api-check");
  if (!api.configured) {
    card.dataset.state = "unavailable";
    label.textContent = "LIVE MODE UNAVAILABLE";
    title.textContent = "No backend configured";
    copyText.textContent = "This demo has no live research mode. Configure an explicit backend to check availability; no backend is required for this workspace.";
    checkButton.hidden = true;
  } else {
    card.dataset.state = "configured";
    label.textContent = "API CONFIGURED / STATUS UNKNOWN";
    title.textContent = "Backend boundary is explicit";
    copyText.textContent = "PaperTrail will only contact the configured base. The synthetic demo remains usable if the backend is unavailable.";
    checkButton.hidden = false;
  }
}

function persist() {
  state.updatedAt = new Date().toISOString();
  const result = saveSession(state);
  storageMode = result.storageMode;
  storageError = result.error;
  renderStorage();
}

function showToast(message) {
  const toast = document.getElementById("pt-toast");
  toast.textContent = message;
  toast.dataset.visible = "true";
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => { toast.dataset.visible = "false"; }, 3200);
}

function renderRail() {
  return `<div class="pt-rail" aria-label="Demo workflow progress">${AGENT_ROLES.map((agent, index) => {
    const status = statusForAgent(agent.id);
    const stateName = status === "complete" ? "complete" : state.status === "running" && state.workflow.currentStep === index ? "active" : "queued";
    return `<div class="pt-rail-step" data-state="${stateName}"><span class="pt-rail-node">${status === "complete" ? "✓" : String(index + 1).padStart(2, "0")}</span><span class="pt-rail-copy"><strong>${html(agent.name)}</strong><small>${html(status === "complete" ? "output persisted" : agent.stage)}</small></span></div>`;
  }).join("")}</div>`;
}

function renderMiniAgents() {
  return `<div class="pt-mini-agent-list">${AGENT_ROLES.map((agent) => {
    const status = statusForAgent(agent.id);
    return `<div class="pt-mini-agent" data-state="${status}"><span class="pt-mini-agent-id">${html(agent.code)}</span><span><strong>${html(agent.name)}</strong><small>${html(agent.role)}</small></span><span class="pt-mini-state">${html(status)}</span></div>`;
  }).join("")}</div>`;
}

function renderOverview() {
  if (state.status === "new") {
    return `${emptyState("No run has been started", "The empty/new state is persisted as a versioned session. Start the deterministic demo to release each role in sequence and populate the trace.")}`;
  }
  const claim = state.analysis.claims[0];
  const eventCopy = state.workflow.events.length ? state.workflow.events[state.workflow.events.length - 1].message : "Demo initialized";
  return `<div class="pt-panel-heading"><div><h3>${state.status === "completed" ? "The evidence trail is ready to inspect." : "The evidence trail is being assembled."}</h3><p class="pt-panel-lede">${state.status === "completed" ? "Four distinct roles have turned a fixed synthetic packet into a qualified conclusion. Every displayed finding carries a source trace or an explicit uncertainty marker." : "The run is deterministic and persisted after each role. You can inspect partial outputs while the remaining roles are pending."}</p></div></div>
    <div class="pt-stat-grid">
      <div class="pt-stat"><span>agents</span><strong>${state.workflow.completedAgentIds.length}/4</strong><small>role outputs persisted</small></div>
      <div class="pt-stat"><span>sources</span><strong>${SOURCES.length}</strong><small>synthetic metadata records</small></div>
      <div class="pt-stat"><span>claims</span><strong>${state.analysis.claims.length}</strong><small>source-linked assertions</small></div>
      <div class="pt-stat"><span>trace edges</span><strong>${state.analysis.graph?.edges.length || 0}</strong><small>${state.analysis.graph ? "table fallback ready" : "awaiting adjudication"}</small></div>
    </div>
    <div class="pt-overview-grid">
      <section class="pt-section-card"><h3>Workflow rail</h3><p>Current persisted event: <span class="pt-mono">${html(eventCopy)}</span></p>${renderRail()}</section>
      <section class="pt-section-card"><h3>Four distinct roles</h3><p>Each role has its own boundary and generated output layer.</p>${renderMiniAgents()}</section>
    </div>
    ${claim ? `<section class="pt-claim-spotlight" style="margin-top:14px"><span class="pt-status-badge">${html(claim.status)}</span><h3>${html(claim.statement)}</h3><p>${html(claim.detail)}</p>${trace(claim.sourceIds)}<div style="margin-top:15px"><button class="pt-button pt-button--quiet" type="button" data-view="claims">Inspect claim and source links →</button></div></section>` : `<div class="pt-callout" style="margin-top:14px"><strong>RUNNING / CLAIMS PENDING</strong><p>The quantitative analyst will release the first findings after the curator completes the source inventory.</p></div>`}`;
}

function renderAgentCard(agent) {
  const output = state.analysis.agentOutputs[agent.id];
  const status = statusForAgent(agent.id);
  return `<article class="pt-agent-card" data-state="${html(status)}"><div class="pt-card-heading"><span class="pt-agent-card__id">${html(agent.id)}</span><span class="pt-state-label">${html(status === "complete" ? "COMPLETE" : status === "queued" ? "QUEUED" : status)}</span></div><h3>${html(agent.name)}</h3><p class="pt-agent-role">${html(agent.role)} · ${html(agent.stage)}</p><p class="pt-agent-focus">${html(agent.focus)}</p><div class="pt-agent-output">${syntheticLabel(agent.provenance)}${output ? `<h4>${html(output.headline)}</h4><p>${html(output.summary)}</p><ul class="pt-agent-points">${output.points.map((point) => `<li>${html(point.text)} <span class="pt-epistemic">${html(point.qualifier)} · ${html(point.sourceIds.join(", "))}</span></li>`).join("")}</ul>${trace(outputSourceIds(output))}` : `<p>Output pending. This role is released in order by the demo workflow.</p>`}</div></article>`;
}

function renderAgents() {
  return `<p class="pt-panel-lede">The role metadata stays separate from generated summaries. Each completed output is labeled ${DEMO_LABEL} and retains its source IDs, while a queued role makes no claim.</p><div class="pt-agent-grid">${AGENT_ROLES.map(renderAgentCard).join("")}</div>`;
}

function renderSourceCard(item) {
  return `<article class="pt-source-card"><div class="pt-card-heading"><span class="pt-source-id">${html(item.id)}</span>${syntheticLabel(item.provenance)}</div><div><h3>${html(item.title)}</h3><p class="pt-source-kind">${html(item.kind)}</p></div><div class="pt-source-meta"><span><strong>record date:</strong> ${html(item.date)}</span><span><strong>scope:</strong> ${html(item.scope)}</span></div><p class="pt-source-description">${html(item.description)}</p><p class="pt-source-method"><strong>Method boundary:</strong> ${html(item.method)}</p><div class="pt-source-link-wrap"><small>Non-real source link · navigation disabled</small><a class="pt-demo-link" href="${html(item.url)}" data-demo-link data-source-id="${html(item.id)}">${html(item.url)}</a></div></article>`;
}

function renderEvidence() {
  return `<p class="pt-panel-lede">The source layer below is original synthetic metadata. It is intentionally separate from generated agent summaries. Source IDs are stable, and every link is visibly marked as a non-real demo record.</p><div class="pt-source-grid">${SOURCES.map(renderSourceCard).join("")}</div><h3 class="pt-record-heading">Synthetic evidence records</h3><div class="pt-record-list">${RECORDS.map((record) => `<article class="pt-record-card"><div><span class="pt-source-id">${html(record.id)}</span><h4>${html(record.condition)}</h4><small class="pt-epistemic">${html(record.sourceId)}</small></div><div><div class="pt-record-value">${html(record.value)} <small>${html(record.unit)}</small></div><p>${html(record.observation)}</p></div><div><p class="pt-record-uncertainty">${html(record.uncertainty)}</p>${syntheticLabel(record.provenance)}</div></article>`).join("")}</div>`;
}

function renderClaimDetail(claim) {
  return `<article class="pt-claim-detail">${syntheticLabel(claim.label)}<h3>${html(claim.statement)}</h3><p>${html(claim.detail)}</p><dl class="pt-claim-meta"><div><dt>Claim ID</dt><dd class="pt-source-id">${html(claim.id)}</dd></div><div><dt>Epistemic status</dt><dd>${html(claim.status)}</dd></div><div><dt>Confidence boundary</dt><dd>${html(claim.confidence)}</dd></div><div><dt>Evidence records</dt><dd class="pt-source-id">${html(claim.evidenceIds.join(", "))}</dd></div></dl><h4 class="pt-subheading">Source links for this claim</h4>${sourceLinks(claim.sourceIds)}<h4 class="pt-subheading">Evidence record trace</h4><div class="pt-record-list">${claim.evidenceIds.map((id) => { const record = recordById.get(id); return record ? `<div class="pt-record-card"><div><span class="pt-source-id">${html(record.id)}</span><h4>${html(record.condition)}</h4></div><div><div class="pt-record-value">${html(record.value)}</div><p>${html(record.observation)}</p></div><div><p class="pt-record-uncertainty">${html(record.uncertainty)}</p></div></div>` : ""; }).join("")}</div></article>`;
}

function renderFindings() {
  if (!state.analysis.findings.length) return "";
  return `<section class="pt-section-card" style="margin-top:14px"><div class="pt-card-heading"><h3>Findings released by the quantitative analyst</h3>${syntheticLabel()}</div><div class="pt-two-col" style="margin-top:14px">${state.analysis.findings.map((finding) => `<article>${syntheticLabel(finding.label)}<span class="pt-status-badge">${html(finding.qualifier)}</span><h4 style="margin-top:9px">${html(finding.title)}</h4><p style="margin:7px 0 0;font-size:12px;line-height:1.65">${html(finding.text)}</p>${trace(finding.sourceIds)}<p class="pt-source-id" style="margin:8px 0 0">${html(finding.id)}</p></article>`).join("")}</div></section>`;
}

function renderClaims() {
  if (!state.analysis.claims.length) return emptyState("Claims are waiting for analysis", "The curator must catalog the packet before the quantitative analyst can release source-linked claims.");
  const selected = claimById.get(state.selection.claimId) || state.analysis.claims.find((claim) => claim.id === state.selection.claimId) || state.analysis.claims[0];
  return `<p class="pt-panel-lede">Select a claim to inspect its wording, epistemic status, evidence record IDs, and visibly non-real source links. Every claim shown here is ${DEMO_LABEL}.</p><div class="pt-claim-layout"><div class="pt-claim-list" aria-label="Claims">${state.analysis.claims.map((claim) => `<button class="pt-claim-select" type="button" data-claim-id="${html(claim.id)}" aria-pressed="${claim.id === selected.id ? "true" : "false"}"><strong>${html(claim.id)}</strong><small>${html(claim.status)}</small></button>`).join("")}</div>${renderClaimDetail(selected)}</div>${renderFindings()}`;
}

function renderDebateCard(kind, item) {
  return `<article class="pt-debate-card" data-kind="${html(kind)}">${syntheticLabel()}<div class="pt-card-heading"><span class="pt-status-badge">${html(item.qualifier)}</span><span class="pt-source-id">${html(item.id)}</span></div><h3>${html(item.title)}</h3><p>${html(item.text)}</p><p class="pt-epistemic" style="margin-top:12px">Generated by ${html(item.agentId)} · source trace: ${html(item.sourceIds.join(", "))}</p>${trace(item.sourceIds)}</article>`;
}

function renderDebate() {
  if (!state.analysis.debate) return emptyState("Debate has not started", "The skeptical reviewer and adjudicator enter after the quantitative analyst releases the claims.");
  const debate = state.analysis.debate;
  return `<p class="pt-panel-lede">This debate preserves disagreement instead of collapsing it into a single confident sentence. Every turn is ${DEMO_LABEL} and points back to source IDs.</p><div class="pt-debate-stack">${renderDebateCard("disagreement", debate.disagreement)}${renderDebateCard("rebuttal", debate.rebuttal)}${renderDebateCard("adjudication", debate.adjudication)}</div>`;
}

function renderGraph() {
  if (!state.analysis.graph) return emptyState("Trace table is waiting for adjudication", "The adjudicator will create claim-to-evidence edges after the disagreement and rebuttal are recorded.");
  const graph = state.analysis.graph;
  return `<div class="pt-graph-note"><span class="pt-status-badge">HONEST TABLE FALLBACK</span><p>${html(graph.note)} All rows are ${DEMO_LABEL}.</p></div><div class="pt-table-wrap"><table class="pt-trace-table"><caption class="pt-mono" style="padding:12px;text-align:left;color:var(--pt-faint);font-size:10px">Claim / evidence trace · ${html(graph.label)}</caption><thead><tr><th>Claim ID</th><th>Relationship</th><th>Evidence ID</th><th>Source ID</th><th>Qualifier</th></tr></thead><tbody>${graph.edges.map((edge) => `<tr><td>${html(edge.claimId)}</td><td>${html(edge.relationship)}</td><td>${html(edge.evidenceId)}</td><td>${html(edge.sourceId)}</td><td>${html(edge.qualifier)}</td></tr>`).join("")}</tbody></table></div>`;
}

function renderReport() {
  const report = state.analysis.report;
  if (!report) return emptyState("The final report is not ready", "Complete the four-role run to unlock the adjudicated report and JSON export.");
  return `<article class="pt-report"><div class="pt-report-heading"><div>${syntheticLabel(report.label)}<h3>${html(report.title)}</h3><p class="pt-epistemic" style="margin:10px 0 0">${html(report.status)} · generated by ${html(report.generatedBy)}</p></div><span class="pt-source-id">${html(report.id)}</span></div><div class="pt-report-summary"><p>${html(report.executiveSummary)}</p>${trace(report.summarySourceIds)}</div><div class="pt-report-grid">${report.sections.map((section, index) => `<section class="pt-report-section${index === 2 ? " pt-report-section--wide" : ""}"><h4>${html(section.heading)}</h4><p>${html(section.text)}</p><p class="pt-epistemic" style="margin-top:10px">${html(section.qualifier)} · source IDs: ${html(section.sourceIds.join(", "))}</p>${trace(section.sourceIds)}</section>`).join("")}<section class="pt-report-section pt-report-section--wide"><h4>Limitations and unresolved questions</h4><ul class="pt-limitations">${report.limitations.map((item) => `<li>${html(item)}</li>`).join("")}</ul></section></div><div class="pt-export-row"><p>Export includes schema version, source metadata, agent outputs, claims, debate, trace edges, and report.</p><button class="pt-button pt-button--primary" type="button" data-action="export">Export session JSON <span aria-hidden="true">↓</span></button></div></article>`;
}

function renderPanel() {
  const [kicker, title] = VIEW_META[currentView];
  document.getElementById("pt-view-kicker").textContent = kicker;
  document.getElementById("pt-view-title").textContent = title;
  panel.setAttribute("aria-labelledby", `pt-tab-${currentView}`);
  const renderers = { overview: renderOverview, agents: renderAgents, evidence: renderEvidence, claims: renderClaims, debate: renderDebate, graph: renderGraph, report: renderReport };
  panel.innerHTML = renderers[currentView]();
}

function renderTabs() {
  document.querySelectorAll("#pt-tabs [data-view]").forEach((tab) => {
    tab.setAttribute("aria-selected", String(tab.dataset.view === currentView));
  });
}

function renderAll() {
  renderStatus();
  renderStorage();
  renderApiState();
  renderTabs();
  renderPanel();
}

function selectView(view, shouldPersist = true) {
  if (!VIEW_META[view]) return;
  currentView = view;
  state.selection.view = view;
  if (shouldPersist) persist();
  renderTabs();
  renderPanel();
}

function startDemo() {
  if (state.status === "running") return;
  window.clearTimeout(runTimer);
  state = makeInitialSession();
  sessionRecovered = false;
  state.status = "running";
  state.runStartedAt = new Date().toISOString();
  state.workflow.events.push({ id: "PT-EVT-000", message: "Demo investigation started", agentId: null, label: DEMO_LABEL });
  currentView = "overview";
  state.selection.view = currentView;
  persist();
  renderAll();
  showToast("Demo started. The curator output will persist first.");
  runTimer = window.setTimeout(advanceRun, 420);
}

function advanceRun() {
  if (state.status !== "running") return;
  const index = state.workflow.currentStep;
  const agent = AGENT_ROLES[index];
  if (!agent) {
    completeRun();
    return;
  }
  const output = AGENT_OUTPUTS[agent.id];
  state.agents = state.agents.map((item) => item.id === agent.id ? { ...item, status: "complete" } : item);
  state.workflow.completedAgentIds.push(agent.id);
  state.workflow.currentStep = index + 1;
  state.workflow.events.push({ id: `PT-EVT-${String(index + 1).padStart(3, "0")}`, message: `${agent.name} output persisted`, agentId: agent.id, label: DEMO_LABEL });
  state.analysis.agentOutputs[agent.id] = copy(output);
  if (agent.id === "PT-AGENT-QUA-002") {
    state.analysis.findings = copy(FINDINGS);
    state.analysis.claims = copy(CLAIMS);
  }
  if (agent.id === "PT-AGENT-SKE-003") state.analysis.debate = copy(DEBATE);
  if (agent.id === "PT-AGENT-ADJ-004") {
    state.analysis.graph = copy(GRAPH);
    state.analysis.report = copy(REPORT);
  }
  if (index === AGENT_ROLES.length - 1) {
    completeRun();
    return;
  }
  persist();
  renderAll();
  showToast(`${agent.name} complete. Output persisted locally.`);
  runTimer = window.setTimeout(advanceRun, 680);
}

function completeRun() {
  state.status = "completed";
  state.completedAt = new Date().toISOString();
  state.workflow.currentStep = AGENT_ROLES.length;
  state.workflow.events.push({ id: "PT-EVT-004", message: "Adjudication and report complete", agentId: "PT-AGENT-ADJ-004", label: DEMO_LABEL });
  persist();
  renderAll();
  showToast("Demo complete. The final report is ready to inspect and export.");
}

function resetDemo() {
  window.clearTimeout(runTimer);
  clearSession();
  state = makeInitialSession();
  sessionRecovered = false;
  currentView = "overview";
  storageMode = "local";
  storageError = "";
  persist();
  renderAll();
  showToast("Session reset to the empty/new state.");
}

function openResetDialog() {
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
}

function closeResetDialog() {
  if (typeof dialog.close === "function") dialog.close();
  else dialog.removeAttribute("open");
}

function exportJson() {
  const blob = new Blob([exportSessionJson(state)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "papertrail-synthetic-demo-session.json";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  showToast("Session JSON export prepared. It contains synthetic data only.");
}

async function checkApi() {
  if (!api.configured) return;
  const card = document.getElementById("pt-live-card");
  const label = document.getElementById("pt-live-label");
  const title = document.getElementById("pt-live-title");
  const copyText = document.getElementById("pt-live-copy");
  label.textContent = "API CHECK IN PROGRESS";
  title.textContent = "Checking configured backend";
  copyText.textContent = "Only the explicit API base is contacted. The local synthetic workflow is unchanged.";
  const result = await api.checkHealth();
  if (result.ok) {
    card.dataset.state = "configured";
    label.textContent = "API AVAILABLE / OPTIONAL";
    title.textContent = "Backend responded";
    copyText.textContent = "Live transport is available, but this vertical slice still presents the deterministic synthetic demo by default.";
  } else {
    card.dataset.state = "unavailable";
    label.textContent = "API UNAVAILABLE";
    title.textContent = "Configured backend could not be reached";
    copyText.textContent = `${result.message} The synthetic demo remains available offline.`;
  }
}

document.getElementById("pt-start").addEventListener("click", startDemo);
document.getElementById("pt-reset").addEventListener("click", openResetDialog);
document.getElementById("pt-cancel-reset").addEventListener("click", closeResetDialog);
document.getElementById("pt-confirm-reset").addEventListener("click", () => { closeResetDialog(); resetDemo(); });
document.getElementById("pt-api-check").addEventListener("click", checkApi);

document.getElementById("pt-tabs").addEventListener("click", (event) => {
  const tab = event.target.closest("[data-view]");
  if (tab) selectView(tab.dataset.view);
});

document.getElementById("pt-tabs").addEventListener("keydown", (event) => {
  const tabs = [...document.querySelectorAll("#pt-tabs [data-view]")];
  const index = tabs.indexOf(document.activeElement);
  if (index < 0) return;
  let next = index;
  if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % tabs.length;
  if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + tabs.length) % tabs.length;
  if (event.key === "Home") next = 0;
  if (event.key === "End") next = tabs.length - 1;
  if (next !== index) {
    event.preventDefault();
    tabs[next].focus();
    selectView(tabs[next].dataset.view);
  }
});

panel.addEventListener("click", (event) => {
  const demoLink = event.target.closest("[data-demo-link]");
  if (demoLink) {
    event.preventDefault();
    showToast(`${demoLink.dataset.sourceId || "Source"} is a visibly marked non-real demo link.`);
    return;
  }
  const viewButton = event.target.closest("[data-view]");
  if (viewButton) {
    selectView(viewButton.dataset.view);
    return;
  }
  const claimButton = event.target.closest("[data-claim-id]");
  if (claimButton) {
    state.selection.claimId = claimButton.dataset.claimId;
    persist();
    renderPanel();
    return;
  }
  const action = event.target.closest("[data-action]");
  if (!action) return;
  if (action.dataset.action === "start") startDemo();
  if (action.dataset.action === "export") exportJson();
});

if (state.status === "running") runTimer = window.setTimeout(advanceRun, 300);
renderAll();
if (api.configured) checkApi();
