import { createApiTransport } from "/papertrail/js/api.js";
import {
  clearApiBase,
  clearLiveSession,
  clearSession,
  createSession,
  exportSessionJson,
  loadApiBase,
  loadLiveSession,
  loadSession,
  saveApiBase,
  saveLiveSession,
  saveSession,
} from "/papertrail/js/store.js";

const DEMO_LABEL = "SYNTHETIC DEMONSTRATION DATA";
const LIVE_PROVIDER_LABEL = "VERIFIED PROVIDER METADATA";
const LIVE_AI_LABEL = "AI-GENERATED INTERPRETATION";
const QUESTION = "Does increasing light intensity consistently improve microalgae biomass productivity?";
const VIEW_META = {
  overview: ["Investigation state", "Overview"],
  agents: ["Four-role pipeline", "Agent roles"],
  lab: ["Execution records", "Agent laboratory"],
  evidence: ["Source packet", "Evidence browser"],
  claims: ["Traceable assertions", "Claims"],
  debate: ["Adversarial review", "Debate"],
  graph: ["Claim / evidence links", "Trace table"],
  report: ["Adjudicated output", "Final report"],
};
const LIVE_AGENT_ROLES = [
  ["investigator", "Investigator", "Builds the first source-grounded interpretation."],
  ["skeptic", "Skeptic", "Challenges overreach, missing citations, and weak inferences."],
  ["experimentalist", "Experimentalist", "Turns unresolved questions into proposed tests."],
  ["adjudicator", "Adjudicator", "Weighs the debate and prepares the audited report."],
];
const DEMO_PROMPT_VERSION = "papertrail-demo-v1";

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
const settingsDialog = document.getElementById("pt-settings-dialog");
const storedApiBase = loadApiBase();
let api = createApiTransport({ baseUrl: storedApiBase.value });
let currentView = "overview";
let runTimer = null;
let toastTimer = null;
let storageMode = storedApiBase.storageMode;
let storageError = storedApiBase.storageError;
let sessionRecovered = false;
let mode = "demo";
let liveSnapshot = null;
let liveStale = false;
let liveError = "";
let liveTransportState = "idle";
let liveStorageMode = storedApiBase.storageMode;
let liveStorageError = storedApiBase.storageError;
let liveRecovered = false;
let liveSubscription = null;
let liveRefreshPromise = null;
let liveGeneration = 0;
let lastLiveErrorToast = "";
let liveClaimId = null;
let apiBoundaryError = "";
let apiProviderIssue = "";
let evidenceQuery = "";

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

function liveBundle() {
  return liveSnapshot || {
    session: null,
    events: [],
    sources: [],
    agentRuns: [],
    claims: [],
    evidence: [],
    evidenceLinks: [],
    debate: null,
    report: null,
    audit: null,
  };
}

function liveSession() {
  return liveBundle().session || {};
}

function liveStatus() {
  return String(liveSession().status || "UNKNOWN").toUpperCase();
}

function safeHttpUrl(value) {
  if (!value) return null;
  try {
    const parsed = new URL(String(value));
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
}

function liveSource(id) {
  return (liveBundle().sources || []).find((item) => item?.id === id) || null;
}

function liveText(value, fallback = "") {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (!value || typeof value !== "object") return fallback;
  for (const key of ["text", "content", "statement", "claim", "detail", "observation", "summary", "headline", "executiveSummary", "summary"]) {
    if (typeof value[key] === "string" && value[key].trim()) return value[key].trim();
  }
  return fallback;
}

function liveStatusBadge(status) {
  return `<span class="pt-status-badge">${html(String(status || "STATUS NOT RETURNED").replaceAll("_", " "))}</span>`;
}

function liveExternalLink(value, label = value, className = "pt-live-source-link") {
  const url = safeHttpUrl(value);
  return url
    ? `<a class="${html(className)}" href="${html(url)}" target="_blank" rel="noreferrer noopener">${html(label)}</a>`
    : "";
}

function liveSourceIds(item) {
  return [...new Set([
    ...(Array.isArray(item?.sourceIds) ? item.sourceIds : []),
    ...(typeof item?.sourceId === "string" ? [item.sourceId] : []),
  ])];
}

function liveSourceTrace(ids = []) {
  const validIds = ids.filter((id) => liveSource(id));
  if (validIds.length === 0) return `<span class="pt-epistemic">NO DIRECT PROVIDER SOURCE LINK RECORDED</span>`;
  return `<ul class="pt-live-trace-list" aria-label="Provider source trace">${validIds.map((id) => {
    const item = liveSource(id);
    const url = item?.sourceUrl || item?.sourceUrls?.[0];
    const link = liveExternalLink(url, url, "pt-live-source-link");
    return `<li><strong class="pt-source-id">${html(id)}</strong> · ${html(item?.title || "Provider source")}${link || `<span class="pt-epistemic">No valid http(s) source URL supplied.</span>`}</li>`;
  }).join("")}</ul>`;
}

function renderLiveTraceable(item, context = "interpretation") {
  if (!item || typeof item !== "object") return "";
  const text = liveText(item, "No text returned.");
  const status = item.epistemicStatus || item.status || (context === "provider" ? "reported_finding" : "unresolved");
  return `<article class="pt-live-result-card"><div class="pt-live-status-line"><span class="${context === "provider" ? "pt-provider-badge" : "pt-ai-badge"}">${html(context === "provider" ? LIVE_PROVIDER_LABEL : LIVE_AI_LABEL)}</span>${liveStatusBadge(status)}</div><p>${html(text)}</p>${liveSourceTrace(liveSourceIds(item))}</article>`;
}

function renderLiveTraceableList(items, emptyText = "No result has been persisted yet.", context = "interpretation") {
  const values = Array.isArray(items) ? items.filter(Boolean) : [];
  return values.length ? `<div class="pt-live-role-list">${values.map((item) => renderLiveTraceable(item, context)).join("")}</div>` : `<div class="pt-live-empty">${html(emptyText)}</div>`;
}

function latestLiveRun(role) {
  const runs = (liveBundle().agentRuns || []).filter((run) => run?.role === role);
  return runs[runs.length - 1] || null;
}

function liveRunErrors() {
  const errors = [];
  for (const run of liveBundle().agentRuns || []) {
    if (run?.error) errors.push({ role: run.role || "agent", message: run.error, status: run.status || "failed" });
  }
  for (const event of liveBundle().events || []) {
    if (["error", "agent_error"].includes(event?.type)) {
      const payload = event.payload || {};
      errors.push({ role: payload.role || payload.stage || "pipeline", message: payload.message || payload.error || "The live run reported an error.", status: payload.status || payload.code || "error" });
    }
  }
  const seen = new Set();
  return errors.filter((item) => {
    const key = `${item.role}|${item.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function renderLiveErrors() {
  const errors = liveRunErrors();
  if (!errors.length) return "";
  return `<section class="pt-live-error" aria-label="Live run errors"><strong>Agent or pipeline errors are part of this live record</strong><ul class="pt-live-error-list">${errors.map((item) => `<li><strong>${html(item.role)}</strong> · ${html(item.status)} · ${html(item.message)}</li>`).join("")}</ul></section>`;
}

function liveEventStage() {
  const events = liveBundle().events || [];
  const stageEvent = [...events].reverse().find((event) => event?.type === "stage_change" && event.payload?.stage);
  return stageEvent?.payload?.stage || "awaiting persisted event";
}

function liveInterruption() {
  return [...(liveBundle().events || [])].reverse().find((event) => event?.type === "run_interrupted") || null;
}

function liveEventMessage(event) {
  const payload = event?.payload || {};
  if (event?.type === "stage_change") return `stage: ${payload.stage || "unknown"}${payload.status ? ` · ${payload.status}` : ""}`;
  if (event?.type === "source_retrieval") return `provider retrieval · ${payload.sourceCount ?? "?"} source records reported`;
  if (event?.type === "agent_start") return `${payload.role || "agent"} started`;
  if (event?.type === "agent_completion") return `${payload.role || "agent"} output persisted`;
  if (event?.type === "agent_error") return `${payload.role || "agent"} error: ${payload.message || "error returned"}`;
  if (event?.type === "audit") return `citation audit · ${payload.valid ? "valid" : "errors returned"}`;
  if (event?.type === "report") return `report persisted · ${payload.status || "status not returned"}`;
  if (event?.type === "error") return `${payload.stage || "pipeline"} error: ${payload.message || "error returned"}`;
  if (event?.type === "run_interrupted") return `run interrupted · ${payload.status || "partial state preserved"}`;
  return event?.type || "persisted event";
}

function source(id) {
  return sourceById.get(id) || { id, title: "Unknown source", url: "https://example.invalid/papertrail-demo/unknown", provenance: DEMO_LABEL };
}

function makeInitialSession(question = QUESTION) {
  return createSession({
    question: question || QUESTION,
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
const loadedLive = loadLiveSession();
liveSnapshot = loadedLive.snapshot;
liveStorageMode = loadedLive.storageMode;
liveStorageError = loadedLive.storageError;
liveRecovered = loadedLive.recovered;
if (liveSnapshot) mode = "live";

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
  if (mode === "live") {
    const session = liveSession();
    const status = liveStatus();
    const statusLabel = document.getElementById("pt-status-label");
    const statusTitle = document.getElementById("pt-status-title");
    const statusCopy = document.getElementById("pt-status-copy");
    const progressFill = document.getElementById("pt-progress-fill");
    const progressStage = document.getElementById("pt-progress-stage");
    const progressState = document.getElementById("pt-progress-state");
    const startButton = document.getElementById("pt-start");
    const cancelButton = document.getElementById("pt-cancel-live");
    const completedRoles = new Set((liveBundle().agentRuns || []).filter((run) => ["completed", "complete"].includes(String(run?.status).toLowerCase())).map((run) => run.role)).size;
    const interruption = liveInterruption();
    const interrupted = Boolean(interruption && !liveStale);
    const interruptionReason = interruption?.payload?.reason || "The API restarted before the worker reached a terminal state.";
    const normalizedState = liveStale ? "stale" : status.toLowerCase();
    statusLabel.dataset.state = normalizedState;
    statusLabel.textContent = liveStale ? `${status} / STALE SNAPSHOT` : interrupted ? `${status} / INTERRUPTED` : status;
    statusTitle.textContent = liveStale
      ? "Last live snapshot needs revalidation"
      : interrupted ? "Live run was interrupted"
        : status === "RUNNING" ? `Live run at ${liveEventStage()}`
        : status === "COMPLETED" ? "Live report is available"
          : status === "PARTIAL" ? "Live run completed with limitations"
            : status === "CANCELLED" ? "Live run was cancelled"
              : status === "FAILED" ? "Live run failed" : "Live session is waiting to run";
    statusCopy.textContent = liveStale
      ? "The configured API could not revalidate this persisted bundle. Displayed results are stale or unknown; completion is not being asserted as current."
      : liveError || (interrupted
        ? `${interruptionReason} Previously persisted sources and outputs remain inspectable. Start a new live investigation from the form below; do not treat this partial record as a completed report.`
        : status === "RUNNING"
          ? "The server owns progress. PaperTrail displays only persisted events and bundle data; no client progress is synthesized."
        : status === "COMPLETED"
          ? "The server returned a completed bundle. Inspect provider metadata, agent interpretations, debate, audit, and limitations."
          : status === "PARTIAL" ? "The server returned a partial result. Agent errors, provider warnings, and citation limitations remain visible."
            : status === "CANCELLED" ? "The server recorded cancellation. The persisted partial bundle remains inspectable."
              : status === "FAILED" ? "The server recorded a failed run. Inspect the reported agent or pipeline errors below." : "No live run has started for this session.");
    progressFill.style.width = `${Math.min(100, (completedRoles / LIVE_AGENT_ROLES.length) * 100)}%`;
    progressStage.textContent = `${completedRoles} / ${LIVE_AGENT_ROLES.length} role outputs recorded`;
    progressState.textContent = `${status.toLowerCase()}${liveStale ? " / stale" : ""}`;
    document.getElementById("pt-session-id").textContent = session.id || "LIVE SESSION";
    startButton.textContent = "Start demo investigation →";
    startButton.disabled = false;
    cancelButton.hidden = !(status === "RUNNING" && !liveStale);
    cancelButton.disabled = liveTransportState === "cancelling";
    document.getElementById("pt-header-live").textContent = api.configured ? "local API boundary" : "live mode unavailable";
    return;
  }

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
  document.getElementById("pt-header-live").textContent = api.configured ? "local API boundary" : "live mode unavailable";
  document.getElementById("pt-cancel-live").hidden = true;
}

function renderStorage() {
  const card = document.getElementById("pt-storage-card");
  const title = document.getElementById("pt-storage-title");
  const copyText = document.getElementById("pt-storage-copy");
  const activeStorageMode = mode === "live" ? liveStorageMode : storageMode;
  const activeStorageError = mode === "live" ? liveStorageError : storageError;
  card.dataset.mode = activeStorageMode;
  if (activeStorageMode === "local") {
    title.textContent = mode === "live" ? "LIVE SNAPSHOT STORAGE ACTIVE" : "LOCAL STORAGE ACTIVE";
    copyText.textContent = mode === "live"
      ? liveRecovered ? "Version 1 live metadata, results, and events recovered from this browser." : "Version 1 live metadata, results, and events will recover on reload."
      : sessionRecovered ? "Version 1 session recovered from this browser." : "Version 1 session state will recover on reload.";
  } else {
    title.textContent = "STORAGE UNAVAILABLE";
    copyText.textContent = "Reload recovery is unavailable; this session is held in memory only.";
  }
  if (activeStorageError) card.title = activeStorageError;
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
    copyText.textContent = "Live mode is unavailable until you configure an explicit local API boundary. No backend is required for the offline demo.";
    checkButton.hidden = true;
  } else if (liveStale || apiBoundaryError) {
    card.dataset.state = "unavailable";
    label.textContent = "API UNAVAILABLE / LIVE MODE UNAVAILABLE";
    title.textContent = "Configured backend could not be confirmed";
    copyText.textContent = `${apiBoundaryError || liveError || "The saved live bundle could not be revalidated."} The offline demo remains available.`;
    checkButton.hidden = false;
  } else if (apiProviderIssue) {
    card.dataset.state = "configured";
    label.textContent = "API AVAILABLE / PROVIDER UNAVAILABLE";
    title.textContent = "API boundary responded";
    copyText.textContent = `${apiProviderIssue} The server owns provider credentials; the offline demo remains available.`;
    checkButton.hidden = false;
  } else {
    card.dataset.state = "configured";
    label.textContent = "LOCAL API BOUNDARY";
    title.textContent = "Backend boundary is explicit";
    copyText.textContent = "PaperTrail contacts only the configured base with credentials omitted. Provider credentials remain server-side.";
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

function runDuration(run) {
  if (!run?.startedAt || !run?.finishedAt) return "not completed";
  const duration = Date.parse(run.finishedAt) - Date.parse(run.startedAt);
  return Number.isFinite(duration) && duration >= 0 ? `${duration} ms` : "not returned";
}

function renderLiveLabRecord(role, name, focus) {
  const run = latestLiveRun(role);
  const input = run?.input || {};
  return `<article class="pt-lab-record"><div class="pt-card-heading"><span class="pt-source-id">${html(role)}</span>${liveStatusBadge(run?.status || "queued")}</div><h3>${html(name)}</h3><p class="pt-agent-focus">${html(focus)}</p><dl class="pt-lab-meta"><div><dt>Prompt version</dt><dd>${html(input.promptVersion || "not returned by server")}</dd></div><div><dt>Model identifier</dt><dd>${html(run?.model || "not returned")}</dd></div><div><dt>Execution duration</dt><dd>${html(runDuration(run))}</dd></div><div><dt>Token usage</dt><dd>not recorded by this API</dd></div><div><dt>Source IDs supplied</dt><dd class="pt-source-id">${html((input.sourceIds || []).join(", ") || "none")}</dd></div></dl>${run?.error ? `<div class="pt-live-error"><strong>VALIDATION / EXECUTION ERROR</strong><p>${html(run.error)}</p></div>` : `<p class="pt-epistemic">Structured output is persisted separately from provider metadata. Inspect Agent roles for the returned interpretation.</p>`}</article>`;
}

function renderDemoLabRecord(agent) {
  const output = state.analysis.agentOutputs[agent.id];
  const status = statusForAgent(agent.id);
  return `<article class="pt-lab-record"><div class="pt-card-heading"><span class="pt-source-id">${html(agent.code)}</span><span class="pt-state-label">${html(status)}</span></div><h3>${html(agent.name)}</h3><p class="pt-agent-focus">${html(agent.focus)}</p><dl class="pt-lab-meta"><div><dt>Prompt version</dt><dd>${DEMO_PROMPT_VERSION}</dd></div><div><dt>Model identifier</dt><dd>deterministic fixture / no model call</dd></div><div><dt>Execution duration</dt><dd>synthetic staged release</dd></div><div><dt>Token usage</dt><dd>not applicable</dd></div><div><dt>Source IDs supplied</dt><dd class="pt-source-id">${html(output ? outputSourceIds(output).join(", ") : "none")}</dd></div></dl><p class="pt-epistemic">${DEMO_LABEL}. This laboratory record does not claim an external model execution.</p></article>`;
}

function renderLab() {
  if (mode === "live") {
    return `${liveConnectionBanner()}<p class="pt-panel-lede">The laboratory exposes only execution facts persisted by the server: role, prompt version when recorded, model identifier, duration, supplied source IDs, validation errors, and token-usage availability. It does not expose secrets or claim telemetry the API did not record.</p><div class="pt-lab-grid">${LIVE_AGENT_ROLES.map(([role, name, focus]) => renderLiveLabRecord(role, name, focus)).join("")}</div>${renderLiveErrors()}`;
  }
  return `<p class="pt-panel-lede">The offline laboratory mirrors the four analytical boundaries without pretending that a language model ran. Every record is ${DEMO_LABEL}.</p><div class="pt-lab-grid">${AGENT_ROLES.map(renderDemoLabRecord).join("")}</div>`;
}

function renderSourceCard(item) {
  return `<article class="pt-source-card"><div class="pt-card-heading"><span class="pt-source-id">${html(item.id)}</span>${syntheticLabel(item.provenance)}</div><div><h3>${html(item.title)}</h3><p class="pt-source-kind">${html(item.kind)}</p></div><div class="pt-source-meta"><span><strong>record date:</strong> ${html(item.date)}</span><span><strong>scope:</strong> ${html(item.scope)}</span></div><p class="pt-source-description">${html(item.description)}</p><p class="pt-source-method"><strong>Method boundary:</strong> ${html(item.method)}</p><div class="pt-source-link-wrap"><small>Non-real source link · navigation disabled</small><a class="pt-demo-link" href="${html(item.url)}" data-demo-link data-source-id="${html(item.id)}">${html(item.url)}</a></div></article>`;
}

function matchesEvidenceQuery(item) {
  if (!evidenceQuery) return true;
  const haystack = [item?.id, item?.title, item?.kind, item?.scope, item?.description, item?.condition, item?.value, item?.observation, item?.provider, item?.doi, item?.pmid]
    .filter(Boolean).join(" ").toLocaleLowerCase();
  return haystack.includes(evidenceQuery);
}

function renderEvidence() {
  const sources = SOURCES.filter(matchesEvidenceQuery);
  const records = RECORDS.filter(matchesEvidenceQuery);
  return `<p class="pt-panel-lede">The source layer below is original synthetic metadata. It is intentionally separate from generated agent summaries. Source IDs are stable, and every link is visibly marked as a non-real demo record.</p><div class="pt-evidence-search-row"><label for="pt-evidence-search">Search synthetic sources and records</label><input id="pt-evidence-search" data-evidence-search type="search" value="${html(evidenceQuery)}" placeholder="title, source ID, condition…"><span>${sources.length} sources · ${records.length} records</span></div><div class="pt-source-grid">${sources.length ? sources.map(renderSourceCard).join("") : `<div class="pt-live-empty">No synthetic evidence matches this search.</div>`}</div><h3 class="pt-record-heading">Synthetic evidence records</h3><div class="pt-record-list">${records.length ? records.map((record) => `<article class="pt-record-card"><div><span class="pt-source-id">${html(record.id)}</span><h4>${html(record.condition)}</h4><small class="pt-epistemic">${html(record.sourceId)}</small></div><div><div class="pt-record-value">${html(record.value)} <small>${html(record.unit)}</small></div><p>${html(record.observation)}</p></div><div><p class="pt-record-uncertainty">${html(record.uncertainty)}</p>${syntheticLabel(record.provenance)}</div></article>`).join("") : `<div class="pt-live-empty">No synthetic evidence records match this search.</div>`}</div>`;
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

function liveConnectionBanner() {
  if (liveStale) return `<div class="pt-live-banner" data-state="error"><strong>STALE / UNKNOWN LIVE SNAPSHOT</strong><p>${html(liveError || "The saved server bundle could not be revalidated. Its contents remain visible as the last persisted response.")}</p></div>`;
  const interruption = liveInterruption();
  if (interruption) return `<div class="pt-live-banner" data-state="error"><strong>RUN INTERRUPTED / START A NEW LIVE INVESTIGATION</strong><p>${html(interruption.payload?.reason || "The API restarted before the live worker reached a terminal state.")} Previously persisted data remains visible, but this session is not a completed report.</p></div>`;
  if (liveError) return `<div class="pt-live-banner" data-state="error"><strong>LIVE API ERROR</strong><p>${html(liveError)}</p></div>`;
  if (liveTransportState === "polling") return `<div class="pt-live-banner"><strong>POLLING FALLBACK ACTIVE</strong><p>EventSource is unavailable or reconnecting. The client is polling the persisted session bundle with a bounded window.</p></div>`;
  if (liveTransportState === "reconnecting") return `<div class="pt-live-banner"><strong>RECONNECTING TO LIVE EVENTS</strong><p>The last persisted event ID will be replayed. Reconnect attempts are bounded.</p></div>`;
  if (liveTransportState === "sse") return `<div class="pt-live-banner"><strong>LIVE EVENT STREAM CONNECTED</strong><p>Server events are being replayed from the persisted event ID. Displayed progress is server-reported.</p></div>`;
  return `<div class="pt-live-banner"><strong>LOCAL API BOUNDARY</strong><p>Provider records and agent results below are from the configured server session. AI-generated interpretations remain distinct from provider-reported metadata.</p></div>`;
}

function renderLiveEvents() {
  const events = liveBundle().events || [];
  if (!events.length) return `<div class="pt-live-empty">No persisted server events have been returned yet.</div>`;
  return `<ul class="pt-live-event-list" aria-label="Persisted live events">${events.slice(-40).map((event) => `<li><time datetime="${html(event.createdAt || "")}">#${html(event.id)}</time><span><strong>${html(event.type || "event")}</strong> · ${html(liveEventMessage(event))}</span></li>`).join("")}</ul>`;
}

function renderLiveOverview() {
  const session = liveSession();
  if (!session.id) return `<div class="pt-live-empty"><strong>No live session is loaded.</strong><p>Choose Live mode in the new investigation form after configuring the local API boundary.</p></div>`;
  const bundle = liveBundle();
  const status = liveStatus();
  return `${liveConnectionBanner()}<section class="pt-panel-heading"><div><h3>${html(session.question || "Live investigation")}</h3><p class="pt-panel-lede">Server status: ${html(status)}. This overview reports stored bundle data and persisted events; it does not invent progress or provider findings.</p></div>${liveStatusBadge(status)}</section><div class="pt-stat-grid"><div class="pt-stat"><span>agent runs</span><strong>${html((bundle.agentRuns || []).length)}</strong><small>server records, including failures</small></div><div class="pt-stat"><span>sources</span><strong>${html((bundle.sources || []).length)}</strong><small>verified provider metadata records</small></div><div class="pt-stat"><span>claims</span><strong>${html((bundle.claims || []).length)}</strong><small>epistemic status shown per claim</small></div><div class="pt-stat"><span>trace links</span><strong>${html((bundle.evidenceLinks || []).length)}</strong><small>honest table fallback</small></div></div><div class="pt-overview-grid"><section class="pt-section-card"><h3>Persisted server events</h3><p>Last recorded stage: <span class="pt-mono">${html(liveEventStage())}</span></p>${renderLiveEvents()}</section><section class="pt-section-card"><h3>Session metadata</h3><div class="pt-live-result-meta"><span><strong>session:</strong> ${html(session.id)}</span><span><strong>created:</strong> ${html(session.createdAt || "not returned")}</span><span><strong>updated:</strong> ${html(session.updatedAt || "not returned")}</span><span><strong>model:</strong> ${html(session.model || "server default / not returned")}</span><span><strong>last event ID:</strong> ${html(liveSnapshot?.lastEventId ?? 0)}</span></div><p class="pt-epistemic">The browser stores session metadata, results, and events only. Provider credentials are not part of this snapshot.</p></section></div>${renderLiveErrors()}`;
}

function renderLiveAgentCard(role, name, focus) {
  const run = latestLiveRun(role);
  const output = run?.output;
  const status = run?.status || "queued";
  const arrays = ["findings", "interpretations", "hypotheses", "unresolved", "challenges", "proposedTests", "rebuttals"].flatMap((key) => Array.isArray(output?.[key]) ? output[key] : []);
  const detail = output ? `${output.headline ? `<h4>${html(output.headline)}</h4>` : ""}${output.summary ? `<p>${html(output.summary)}</p>` : ""}${output.decision ? `<h4>Decision</h4>${renderLiveTraceable(output.decision)}` : ""}${renderLiveTraceableList(arrays, "This agent returned no traceable items.")}${output.report ? `<h4>Returned report candidate</h4>${renderLiveTraceable(output.report)}` : ""}` : `<div class="pt-live-empty">No output has been persisted for this role.</div>`;
  const error = run?.error ? `<div class="pt-live-error"><strong>AGENT ERROR</strong><p>${html(run.error)}</p></div>` : "";
  return `<article class="pt-live-agent-card" data-state="${html(String(status).toLowerCase())}"><div class="pt-card-heading"><span class="pt-source-id">${html(role)}</span>${liveStatusBadge(status)}</div><h3>${html(name)}</h3><p class="pt-agent-focus">${html(focus)}</p><div class="pt-live-status-line"><span class="pt-ai-badge">${LIVE_AI_LABEL}</span>${run?.model ? `<span>model: ${html(run.model)}</span>` : ""}</div><div style="margin-top:13px">${detail}</div>${error}</article>`;
}

function renderLiveAgents() {
  return `${liveConnectionBanner()}<p class="pt-panel-lede">These four panels are distinct server agent roles. Their language is AI-generated interpretation and is not provider-reported metadata. Missing or failed runs remain visible.</p><div class="pt-live-agent-grid">${LIVE_AGENT_ROLES.map(([role, name, focus]) => renderLiveAgentCard(role, name, focus)).join("")}</div>${renderLiveErrors()}`;
}

function providerMetadataText(item) {
  try {
    const metadata = item?.providerMetadataByProvider || item?.providerMetadata;
    return metadata === undefined ? "Provider returned no raw metadata object." : JSON.stringify(metadata, null, 2);
  } catch {
    return "Provider metadata could not be displayed as JSON.";
  }
}

function renderLiveSourceCard(item) {
  const sourceUrl = safeHttpUrl(item?.sourceUrl);
  const alternateUrls = (Array.isArray(item?.sourceUrls) ? item.sourceUrls : []).map(safeHttpUrl).filter(Boolean).filter((url) => url !== sourceUrl);
  const availability = item?.fullTextAvailable ? "FULL TEXT AVAILABLE" : "ABSTRACT ONLY / FULL TEXT NOT PROVIDED";
  return `<article class="pt-live-source-card"><div class="pt-card-heading"><span class="pt-source-id">${html(item?.id || "source")}</span><span class="pt-provider-badge">${LIVE_PROVIDER_LABEL}</span></div><h3>${html(item?.title || "Untitled provider record")}</h3><div class="pt-live-status-line"><span>${html(item?.provider || "provider not returned")}</span><span>record: ${html(item?.providerRecordId || "not returned")}</span></div><div class="pt-live-source-meta"><span><strong>authors:</strong> ${html(Array.isArray(item?.authors) && item.authors.length ? item.authors.join(", ") : "not returned")}</span><span><strong>date:</strong> ${html(item?.date || "not returned")}</span><span><strong>DOI:</strong> ${html(item?.doi || "not returned")}</span><span><strong>PMID:</strong> ${html(item?.pmid || "not returned")}</span><span><strong>retrieved:</strong> ${html(item?.retrievedAt || "not returned")}</span><span><strong>metadata origin:</strong> ${html(item?.metadataOrigin || "provider")}</span></div><span class="pt-availability">${availability}</span>${item?.abstract ? `<p class="pt-live-abstract"><strong>Provider abstract:</strong><br>${html(item.abstract)}</p>` : `<p class="pt-live-abstract">Provider did not return an abstract. No full text is claimed.</p>`}${sourceUrl ? liveExternalLink(sourceUrl, sourceUrl) : `<p class="pt-epistemic">No valid http(s) source URL supplied by provider.</p>`}${alternateUrls.map((url) => liveExternalLink(url, `Alternate provider URL · ${url}`)).join("")}${item?.doi ? `<p class="pt-epistemic">DOI: ${html(item.doi)}</p>` : ""}<details class="pt-live-provider-details"><summary>Provider-reported metadata</summary><pre>${html(providerMetadataText(item))}</pre></details></article>`;
}

function renderLiveEvidence() {
  const bundle = liveBundle();
  const evidence = bundle.evidence || [];
  const sources = (bundle.sources || []).filter(matchesEvidenceQuery);
  const passages = evidence.filter(matchesEvidenceQuery);
  return `${liveConnectionBanner()}<p class="pt-panel-lede">Source records are displayed as ${LIVE_PROVIDER_LABEL}. DOI, PMID, abstract, retrieval time, provider IDs, source URLs, and full-text availability are taken from the server bundle. Agent interpretations are rendered separately.</p><div class="pt-evidence-search-row"><label for="pt-evidence-search">Search provider sources and passages</label><input id="pt-evidence-search" data-evidence-search type="search" value="${html(evidenceQuery)}" placeholder="title, DOI, provider, source ID…"><span>${sources.length} sources · ${passages.length} passages</span></div><div class="pt-live-source-grid">${sources.length ? sources.map(renderLiveSourceCard).join("") : `<div class="pt-live-empty">No provider source records match this search.</div>`}</div><h3 class="pt-record-heading">Provider evidence passages</h3>${passages.length ? `<div class="pt-live-role-list">${passages.map((item) => renderLiveTraceable(item, "provider")).join("")}</div>` : `<div class="pt-live-empty">No evidence passages match this search.</div>`}`;
}

function renderLiveClaimDetail(claim) {
  if (!claim) return `<div class="pt-live-empty">No claim is available in the current live bundle.</div>`;
  const evidence = (liveBundle().evidence || []).filter((item) => (claim.evidenceIds || []).includes(item?.id));
  return `<article class="pt-claim-detail"><div class="pt-live-status-line"><span class="pt-ai-badge">${LIVE_AI_LABEL}</span>${liveStatusBadge(claim.epistemicStatus || "unresolved")}</div><h3>${html(liveText(claim, "Claim text not returned."))}</h3>${claim.detail ? `<p>${html(claim.detail)}</p>` : ""}<dl class="pt-claim-meta"><div><dt>Claim ID</dt><dd class="pt-source-id">${html(claim.id)}</dd></div><div><dt>Epistemic status</dt><dd>${html(claim.epistemicStatus || "unresolved / status not returned")}</dd></div><div><dt>Confidence</dt><dd>${html(claim.confidence || "not returned")}</dd></div><div><dt>Evidence records</dt><dd class="pt-source-id">${html((claim.evidenceIds || []).join(", ") || "none")}</dd></div></dl><h4 class="pt-subheading">Provider source links</h4>${liveSourceTrace(claim.sourceIds || [])}<h4 class="pt-subheading">Evidence passage trace</h4>${evidence.length ? `<div class="pt-live-role-list">${evidence.map((item) => renderLiveTraceable(item, "provider")).join("")}</div>` : `<div class="pt-live-empty">No matching evidence passage was returned.</div>`}</article>`;
}

function renderLiveClaims() {
  const claims = liveBundle().claims || [];
  if (!claims.length) return `${liveConnectionBanner()}<div class="pt-live-empty">No claims have been persisted. The server may still be retrieving sources or may have returned a partial result without claims.</div>${renderLiveErrors()}`;
  const selected = claims.find((claim) => claim.id === liveClaimId) || claims[0];
  return `${liveConnectionBanner()}<p class="pt-panel-lede">Each claim is an AI-generated interpretation or unresolved statement with the epistemic status returned by the server. Provider source links are shown separately.</p><div class="pt-claim-layout"><div class="pt-claim-list" aria-label="Live claims">${claims.map((claim) => `<button class="pt-claim-select" type="button" data-live-claim-id="${html(claim.id)}" aria-pressed="${claim.id === selected.id ? "true" : "false"}"><strong>${html(claim.id)}</strong><small>${html(claim.epistemicStatus || "unresolved")}</small></button>`).join("")}</div>${renderLiveClaimDetail(selected)}</div>${renderLiveErrors()}`;
}

function renderLiveDebateItem(item, role = "debate") {
  if (!item) return `<div class="pt-live-empty">No ${html(role)} was returned.</div>`;
  return `<article class="pt-live-result-card"><div class="pt-live-status-line"><span class="pt-ai-badge">${LIVE_AI_LABEL}</span>${item.role ? `<span>${html(item.role)}</span>` : ""}${liveStatusBadge(item.epistemicStatus || "unresolved")}</div><p>${html(liveText(item, "Debate text not returned."))}</p>${liveSourceTrace(liveSourceIds(item))}</article>`;
}

function renderLiveDebate() {
  const debate = liveBundle().debate;
  const rounds = Array.isArray(debate?.rounds) ? debate.rounds : [];
  if (!debate && !rounds.length) return `${liveConnectionBanner()}<div class="pt-live-empty">No persisted debate rounds are available yet.</div>${renderLiveErrors()}`;
  return `${liveConnectionBanner()}<p class="pt-panel-lede">Debate rounds preserve objections and rebuttals returned by the server. They are AI-generated interpretations, not provider metadata.</p><div class="pt-live-debate-rounds">${rounds.length ? rounds.map((round) => `<section class="pt-live-round"><div class="pt-card-heading"><h3>Round ${html(round.round)}</h3><span class="pt-source-id">${html((round.errors || []).length ? "errors recorded" : "persisted")}</span></div><div class="pt-live-rounds"><div class="pt-live-round-section"><h4>Objections and proposed tests</h4>${renderLiveTraceableList(round.objections, "No objections or proposed tests returned.")}</div><div class="pt-live-round-section"><h4>Rebuttal</h4>${renderLiveDebateItem(round.rebuttal, "rebuttal")}</div>${(round.errors || []).length ? `<div class="pt-live-error"><strong>ROUND ERRORS</strong><ul class="pt-live-error-list">${round.errors.map((error) => `<li>${html(error?.role || "agent")} · ${html(error?.message || error)}</li>`).join("")}</ul></div>` : ""}</div></section>`).join("") : `<div class="pt-live-empty">The server returned debate metadata without a round list.</div>`}</div>${renderLiveErrors()}`;
}

function renderLiveGraph() {
  const links = liveBundle().evidenceLinks || [];
  return `${liveConnectionBanner()}<p class="pt-live-table-note"><strong>HONEST TABLE FALLBACK</strong><br>This view renders persisted claim/evidence links only. No force-directed graph or synthetic relationship is added by the browser.</p>${links.length ? `<div class="pt-table-wrap"><table class="pt-trace-table"><caption class="pt-mono" style="padding:12px;text-align:left;color:var(--pt-faint);font-size:10px">Live claim / evidence trace</caption><thead><tr><th>Claim ID</th><th>Evidence ID</th><th>Source ID</th><th>Relationship</th><th>Provider link</th></tr></thead><tbody>${links.map((link) => { const item = liveSource(link.sourceId); const url = item?.sourceUrl || item?.sourceUrls?.[0]; return `<tr><td>${html(link.claimId || "not returned")}</td><td>${html(link.evidenceId || "not returned")}</td><td>${html(link.sourceId || "not returned")}</td><td>${html(link.relationship || "not returned")}</td><td>${liveExternalLink(url, url || "no valid http(s) URL", "pt-live-source-link") || `<span class="pt-epistemic">No valid http(s) URL</span>`}</td></tr>`; }).join("")}</tbody></table></div>` : `<div class="pt-live-empty">No persisted evidence links are available. The table remains empty rather than inventing edges.</div>`}`;
}

function renderLiveReport() {
  const report = liveBundle().report;
  const audit = liveBundle().audit;
  if (!report) return `${liveConnectionBanner()}<div class="pt-live-empty">No report has been persisted. The live run may still be active or may have failed before report persistence.</div>${renderLiveErrors()}`;
  const sections = Array.isArray(report.sections) ? report.sections : [];
  const findings = Array.isArray(report.findings) ? report.findings : [];
  const limitations = Array.isArray(report.limitations) ? report.limitations : [];
  return `${liveConnectionBanner()}<article class="pt-report"><div class="pt-report-heading"><div><span class="pt-ai-badge">${LIVE_AI_LABEL}</span><h3>${html(report.title || "Live PaperTrail report")}</h3><p class="pt-epistemic">${html(report.epistemicStatus || "status not returned")} · generated by ${html(report.generatedBy || "server")}</p></div><span class="pt-source-id">${html(report.id || "report")}</span></div><div class="pt-report-summary"><p>${html(report.executiveSummary || report.summary || "No executive summary returned.")}</p>${liveSourceTrace(report.summarySourceIds || report.sourceIds || [])}</div><div class="pt-report-grid">${sections.map((section, index) => `<section class="pt-report-section${index === sections.length - 1 ? " pt-report-section--wide" : ""}"><h4>${html(section.heading || section.title || "Report section")}</h4><p>${html(liveText(section, "No section text returned."))}</p>${liveStatusBadge(section.epistemicStatus || "unresolved")}${liveSourceTrace(section.sourceIds || [])}</section>`).join("")}${findings.length ? `<section class="pt-report-section pt-report-section--wide"><h4>Findings</h4>${renderLiveTraceableList(findings, "No findings returned.")}</section>` : ""}<section class="pt-report-section pt-report-section--wide"><h4>Limitations and unresolved questions</h4>${limitations.length ? `<ul class="pt-live-limitations">${limitations.map((item) => typeof item === "string" ? `<li>${html(item)}</li>` : `<li>${html(liveText(item, "Limitation text not returned."))}${liveSourceTrace(item.sourceIds || [])}</li>`).join("")}</ul>` : `<div class="pt-live-empty">No limitations were returned by the server.</div>`}</section></div>${audit ? `<section class="pt-live-audit" data-valid="${audit.valid === true ? "true" : "false"}"><div class="pt-card-heading"><h3>Citation audit</h3>${liveStatusBadge(audit.valid === true ? "valid" : "errors returned")}</div>${audit.errors?.length ? `<ul class="pt-live-error-list">${audit.errors.map((error) => `<li>${html(error.code || "audit error")} · ${html(error.message || error.path || "citation audit error")}</li>`).join("")}</ul>` : `<p>No citation audit errors were returned.</p>`}${audit.warnings?.length ? `<ul class="pt-live-limitations">${audit.warnings.map((warning) => `<li>${html(warning.message || warning.code || warning)}</li>`).join("")}</ul>` : ""}</section>` : `<section class="pt-live-audit"><h3>Citation audit</h3><p>No citation audit object was returned.</p></section>`}${renderLiveErrors()}<div class="pt-export-row"><p>Export contains sanitized live metadata, results, provider records, and persisted events.</p><button class="pt-button pt-button--primary" type="button" data-action="export-live">Export live session JSON <span aria-hidden="true">↓</span></button></div></article>`;
}

function renderLivePanel() {
  const renderers = { overview: renderLiveOverview, agents: renderLiveAgents, lab: renderLab, evidence: renderLiveEvidence, claims: renderLiveClaims, debate: renderLiveDebate, graph: renderLiveGraph, report: renderLiveReport };
  return renderers[currentView]();
}

function renderPanel() {
  const [kicker, title] = VIEW_META[currentView];
  document.getElementById("pt-view-kicker").textContent = kicker;
  document.getElementById("pt-view-title").textContent = title;
  panel.setAttribute("aria-labelledby", `pt-tab-${currentView}`);
  const modeLabel = document.querySelector(".pt-content-heading > span");
  if (mode === "live") {
    modeLabel.className = "pt-live-mode-label";
    modeLabel.textContent = liveStale ? "LIVE SNAPSHOT / STALE OR UNKNOWN" : "LIVE / PROVIDER-BACKED SESSION";
    panel.innerHTML = renderLivePanel();
    return;
  }
  modeLabel.className = "pt-synthetic-label";
  modeLabel.textContent = DEMO_LABEL;
  const renderers = { overview: renderOverview, agents: renderAgents, lab: renderLab, evidence: renderEvidence, claims: renderClaims, debate: renderDebate, graph: renderGraph, report: renderReport };
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
  const heroLede = document.querySelector(".pt-hero-lede");
  if (heroLede) heroLede.textContent = mode === "live"
    ? "Follow a provider-backed investigation from verified source metadata through independent AI-generated interpretations, debate, adjudication, and a citation-audited report. The server owns the run and the browser displays its persisted results."
    : "Follow one bounded investigation from a deterministic evidence packet through independent agent roles, disagreement, adjudication, and a traceable final report. The offline demo makes no live research claim.";
  renderTabs();
  renderPanel();
  updateFormModeStatus();
}

function selectView(view, shouldPersist = true) {
  if (!VIEW_META[view]) return;
  currentView = view;
  if (mode === "demo") {
    state.selection.view = view;
    if (shouldPersist) persist();
  }
  renderTabs();
  renderPanel();
}

function setFormError(message = "") {
  const error = document.getElementById("pt-form-error");
  error.textContent = message;
  error.hidden = !message;
}

function updateFormModeStatus() {
  const selected = document.querySelector("#pt-investigation-form input[name=mode]:checked")?.value || "demo";
  const status = document.getElementById("pt-mode-status");
  const submit = document.getElementById("pt-submit-investigation");
  status.dataset.mode = selected;
  if (selected === "live") {
    status.textContent = api.configured ? "LIVE MODE / LOCAL API BOUNDARY READY" : "LIVE MODE / LIVE MODE UNAVAILABLE — CONFIGURE API URL";
    submit.textContent = "Start live investigation →";
  } else {
    status.textContent = "DEMO MODE / OFFLINE DETERMINISTIC RUN";
    submit.textContent = "Start demo investigation →";
  }
}

function selectFormMode(value) {
  const radio = document.querySelector(`#pt-investigation-form input[name=mode][value="${value}"]`);
  if (radio) radio.checked = true;
  updateFormModeStatus();
}

function formValues() {
  const question = document.getElementById("pt-question").value.trim();
  const maxResults = Math.max(1, Math.min(100, Number.parseInt(document.getElementById("pt-max-results").value, 10) || 25));
  const depth = Math.max(1, Math.min(8, Number.parseInt(document.getElementById("pt-depth").value, 10) || 2));
  const selectedMode = document.querySelector("#pt-investigation-form input[name=mode]:checked")?.value || "demo";
  return { question, maxResults, depth, mode: selectedMode };
}

function persistLiveBundle(bundle) {
  const result = saveLiveSession(bundle);
  if (result.snapshot) liveSnapshot = result.snapshot;
  liveStorageMode = result.storageMode;
  liveStorageError = result.error;
  return result;
}

function stopLiveSubscription() {
  if (liveSubscription) liveSubscription.close();
  liveSubscription = null;
}

function liveBundleEventId(bundle) {
  const eventIds = Array.isArray(bundle?.events) ? bundle.events.map((event) => Number(event?.id)).filter(Number.isSafeInteger) : [];
  return Math.max(0, Number(bundle?.lastEventId) || 0, ...eventIds);
}

function liveBundleIsFresh(bundle) {
  if (!liveSnapshot || !bundle?.session || bundle.session.id !== liveSession().id) return true;
  const currentEventId = liveBundleEventId(liveSnapshot);
  const incomingEventId = liveBundleEventId(bundle);
  if (incomingEventId < currentEventId) return false;
  if (incomingEventId > currentEventId) return true;
  const currentUpdated = Date.parse(liveSnapshot.session?.updatedAt || "");
  const incomingUpdated = Date.parse(bundle.session?.updatedAt || "");
  return !Number.isFinite(currentUpdated) || !Number.isFinite(incomingUpdated) || incomingUpdated >= currentUpdated;
}

function persistFreshLiveBundle(bundle) {
  if (!liveBundleIsFresh(bundle)) return { ok: true, applied: false, snapshot: liveSnapshot };
  const result = persistLiveBundle(bundle);
  return { ...result, applied: true };
}

function applyLiveEvent(event) {
  if (!event || !liveSnapshot || (event.sessionId && event.sessionId !== liveSession().id)) return;
  const events = Array.isArray(liveSnapshot.events) ? liveSnapshot.events : [];
  const eventId = Number(event.id);
  if (Number.isSafeInteger(eventId) && events.some((item) => Number(item.id) === eventId)) return;
  const next = {
    ...liveSnapshot,
    events: [...events, copy(event)].sort((left, right) => Number(left.id) - Number(right.id)),
    session: {
      ...liveSnapshot.session,
      ...(event.type === "stage_change" && event.payload?.status ? { status: String(event.payload.status).toUpperCase() } : {}),
      ...(event.type === "cancel_requested" ? { cancelRequested: true } : {}),
      ...(event.createdAt ? { updatedAt: event.createdAt } : {}),
    },
  };
  persistLiveBundle(next);
  liveStale = false;
}

async function refreshLiveBundle({ render = true } = {}) {
  const requestGeneration = liveGeneration;
  const sessionId = liveSession().id;
  if (!api.configured || !sessionId) return { ok: false, status: "not-configured", message: "Live mode is unavailable until a backend is configured." };
  if (liveRefreshPromise?.generation === requestGeneration) return liveRefreshPromise.promise;
  const promise = (async () => {
    const result = await api.getSession(sessionId);
    if (requestGeneration !== liveGeneration || liveSession().id !== sessionId) return { ...result, staleGeneration: true };
    if (!result.ok || !result.data?.session) {
      liveStale = true;
      liveError = result.message;
      apiBoundaryError = result.message;
      if (render) renderAll();
      return result;
    }
    const saved = persistFreshLiveBundle(result.data);
    if (saved.applied === false) {
      if (render) renderAll();
      return { ...result, data: liveSnapshot, superseded: true };
    }
    liveStale = false;
    liveError = "";
    apiBoundaryError = "";
    if (["COMPLETED", "PARTIAL", "CANCELLED", "FAILED"].includes(String(result.data.session.status).toUpperCase())) stopLiveSubscription();
    if (render) renderAll();
    return { ...result, data: saved.snapshot || result.data };
  })();
  liveRefreshPromise = { generation: requestGeneration, promise };
  try {
    return await promise;
  } finally {
    if (liveRefreshPromise?.promise === promise) liveRefreshPromise = null;
  }
}

function reportLiveTransportError(message, stale = false) {
  if (!message) return;
  liveError = message;
  liveStale = stale || liveStale;
  if (lastLiveErrorToast !== message) {
    lastLiveErrorToast = message;
    showToast(message);
  }
  renderAll();
}

async function cancelOrphanedLiveStart(transport, sessionId) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const observed = await transport.getSession(sessionId);
    if (observed.ok && observed.data?.session) {
      const status = String(observed.data.session.status || "").toUpperCase();
      if (["COMPLETED", "PARTIAL", "CANCELLED", "FAILED"].includes(status)) return;
      if (status === "RUNNING") {
        await transport.cancel(sessionId);
        return;
      }
    }
    await new Promise((resolve) => window.setTimeout(resolve, 250));
  }
}

function subscribeLiveEvents() {
  const sessionId = liveSession().id;
  if (!sessionId || !api.configured) return;
  const subscriptionGeneration = liveGeneration;
  const isCurrent = () => subscriptionGeneration === liveGeneration && liveSession().id === sessionId;
  stopLiveSubscription();
  liveTransportState = "connecting";
  liveSubscription = api.subscribeEvents(sessionId, {
    after: liveSnapshot?.lastEventId || 0,
    maxReconnects: 3,
    onStatus: (status) => {
      if (!isCurrent()) return;
      liveTransportState = status.mode || liveTransportState;
      if (status.mode === "closed" && liveStatus() === "RUNNING") {
        liveStale = true;
        liveError = liveError || "The live event subscription closed before a terminal server status was revalidated.";
        apiBoundaryError = liveError;
      }
      renderAll();
    },
    onEvent: async (event) => {
      if (!isCurrent()) return;
      applyLiveEvent(event);
      liveError = "";
      renderAll();
      await refreshLiveBundle();
    },
    onBundle: (bundle) => {
      if (!isCurrent()) return;
      if (!bundle?.session) return;
      persistFreshLiveBundle(bundle);
      liveStale = false;
      liveError = "";
      renderAll();
    },
    onError: (error) => {
      if (!isCurrent()) return;
      if (["COMPLETED", "PARTIAL", "CANCELLED", "FAILED"].includes(liveStatus())) return;
      reportLiveTransportError(error?.message || "The live event subscription is unavailable.", true);
    },
    onTerminal: () => {
      if (!isCurrent()) return;
      void refreshLiveBundle();
    },
  });
}

async function recoverLiveSession() {
  if (mode !== "live" || !liveSnapshot) return;
  const requestGeneration = liveGeneration;
  const sessionId = liveSession().id;
  liveStale = true;
  liveTransportState = "recovering";
  renderAll();
  if (!api.configured) {
    liveError = "No API base is configured, so this saved live bundle is stale or unknown.";
    renderAll();
    return;
  }
  const result = await refreshLiveBundle();
  if (requestGeneration !== liveGeneration || mode !== "live" || liveSession().id !== sessionId) return;
  if (!result.ok) return;
  liveError = "";
  if (liveStatus() === "RUNNING") subscribeLiveEvents();
  renderAll();
}

async function startLive(values) {
  if (!api.configured) {
    setFormError("Live mode is unavailable. Configure an explicit http(s) API base URL first; the offline demo remains available.");
    openSettingsDialog();
    return;
  }
  if (liveStatus() === "RUNNING" && mode === "live" && !liveStale) {
    setFormError("A live investigation is already running. Cancel it or inspect its persisted bundle before starting another.");
    return;
  }
  window.clearTimeout(runTimer);
  stopLiveSubscription();
  setFormError("");
  liveGeneration += 1;
  const replacingLiveSnapshot = Boolean(liveSnapshot);
  const replacingStaleSnapshot = liveStale;
  const requestGeneration = liveGeneration;
  const transport = api;
  const isCurrentRequest = () => requestGeneration === liveGeneration && mode === "live" && api === transport;
  liveClaimId = null;
  mode = "live";
  liveStale = replacingLiveSnapshot && replacingStaleSnapshot;
  liveError = "";
  apiBoundaryError = "";
  liveTransportState = "starting";
  currentView = "overview";
  renderAll();
  const options = { maxResults: values.maxResults, maxQueries: values.depth, includeAbstract: true };
  const created = await transport.createSession({ question: values.question, options });
  if (!isCurrentRequest()) return;
  if (!created.ok || !created.data?.id) {
    reportLiveTransportError(created.message || "The configured API could not create a live session.");
    return;
  }
  const clearedPending = clearLiveSession();
  liveSnapshot = null;
  liveRecovered = false;
  liveStorageMode = clearedPending.storageMode;
  liveStorageError = clearedPending.error;
  persistLiveBundle({
    session: created.data,
    events: [],
    sources: [],
    agentRuns: [],
    claims: [],
    evidence: [],
    evidenceLinks: [],
    debate: null,
    report: null,
    audit: null,
  });
  renderAll();
  const started = await transport.startRun(created.data.id, { options });
  if (!isCurrentRequest()) {
    void cancelOrphanedLiveStart(transport, created.data.id).catch(() => {});
    return;
  }
  if (!started.ok) {
    const startError = started.message || "The configured API could not start the live run.";
    reportLiveTransportError(startError, true);
    await recoverLiveSession();
    if (isCurrentRequest() && liveStatus() === "NEW") {
      liveError = startError;
      renderAll();
    }
    return;
  }
  liveStale = false;
  persistLiveBundle({
    session: started.data || created.data,
    events: [],
    sources: [],
    agentRuns: [],
    claims: [],
    evidence: [],
    evidenceLinks: [],
    debate: null,
    report: null,
    audit: null,
  });
  liveRecovered = false;
  renderAll();
  subscribeLiveEvents();
  await refreshLiveBundle();
  if (!isCurrentRequest()) return;
  showToast("Live investigation started. Displaying persisted server events and results.");
}

async function cancelLive() {
  if (mode !== "live" || !liveSession().id || liveStatus() !== "RUNNING" || !api.configured) return;
  const requestGeneration = liveGeneration;
  const sessionId = liveSession().id;
  const transport = api;
  liveTransportState = "cancelling";
  renderAll();
  const result = await transport.cancel(sessionId);
  if (requestGeneration !== liveGeneration || mode !== "live" || liveSession().id !== sessionId || api !== transport) return;
  if (!result.ok) {
    reportLiveTransportError(result.message || "The configured API could not accept cancellation.");
    return;
  }
  if (liveSnapshot?.session) {
    persistLiveBundle({ ...liveSnapshot, session: { ...liveSnapshot.session, cancelRequested: Boolean(result.data?.cancelRequested) } });
  }
  liveError = "Cancellation requested; waiting for the server to persist CANCELLED.";
  renderAll();
  await refreshLiveBundle();
}

function startDemo() {
  if (mode === "live" && liveStatus() === "RUNNING") {
    setFormError("A live run is active. Cancel the live run before starting the deterministic demo.");
    return;
  }
  if (state.status === "running") return;
  window.clearTimeout(runTimer);
  stopLiveSubscription();
  liveGeneration += 1;
  mode = "demo";
  selectFormMode("demo");
  const question = document.getElementById("pt-question")?.value.trim() || QUESTION;
  state = makeInitialSession();
  state.question = question;
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
  stopLiveSubscription();
  liveGeneration += 1;
  mode = "demo";
  clearSession();
  state = makeInitialSession();
  sessionRecovered = false;
  currentView = "overview";
  storageMode = "local";
  storageError = "";
  selectFormMode("demo");
  persist();
  renderAll();
  showToast("Session reset to the empty/new state.");
}

function openSettingsDialog() {
  const input = document.getElementById("pt-api-base");
  const error = document.getElementById("pt-settings-error");
  const stateText = document.getElementById("pt-settings-state");
  input.value = api.baseUrl || "";
  error.textContent = "";
  error.hidden = true;
  stateText.textContent = api.configured ? `Configured local API boundary: ${api.baseUrl}` : "Live mode unavailable until an API base URL is saved.";
  if (typeof settingsDialog.showModal === "function") settingsDialog.showModal();
  else settingsDialog.setAttribute("open", "");
  input.focus();
}

function closeSettingsDialog() {
  if (typeof settingsDialog.close === "function") settingsDialog.close();
  else settingsDialog.removeAttribute("open");
}

function setSettingsError(message = "") {
  const error = document.getElementById("pt-settings-error");
  error.textContent = message;
  error.hidden = !message;
}

async function saveSettings(event) {
  event.preventDefault();
  const input = document.getElementById("pt-api-base");
  const result = saveApiBase(input.value);
  if (!result.ok) {
    setSettingsError(result.error);
    return;
  }
  liveGeneration += 1;
  api = createApiTransport({ baseUrl: result.value });
  apiBoundaryError = "";
  apiProviderIssue = "";
  if (result.storageMode === "memory") {
    storageMode = "memory";
    storageError = result.error;
  }
  setSettingsError("");
  if (!api.configured) {
    stopLiveSubscription();
    if (mode === "live" && liveSnapshot) {
      liveStale = true;
      liveError = "The API base was removed. The saved live bundle is stale or unknown until a base is configured again.";
    }
    document.getElementById("pt-settings-state").textContent = "API base removed. Live mode unavailable; the offline demo remains usable.";
  } else {
    document.getElementById("pt-settings-state").textContent = `Saved local API boundary: ${api.baseUrl}`;
  }
  renderAll();
  closeSettingsDialog();
  if (api.configured) {
    if (mode === "live" && liveSnapshot) await recoverLiveSession();
    else await checkApi();
  }
}

function removeApiBase() {
  const result = clearApiBase();
  liveGeneration += 1;
  api = createApiTransport({ baseUrl: "" });
  apiBoundaryError = "";
  apiProviderIssue = "";
  stopLiveSubscription();
  if (mode === "live" && liveSnapshot) {
    liveStale = true;
    liveError = "The API base was removed. The saved live bundle is stale or unknown.";
  }
  const stateText = document.getElementById("pt-settings-state");
  stateText.textContent = result.storageMode === "memory"
    ? "API base removed for this tab. Reload recovery is unavailable."
    : "API base removed. Live mode unavailable until a URL is saved.";
  renderAll();
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

function exportLiveJson() {
  if (!liveSnapshot) return;
  const blob = new Blob([JSON.stringify(liveSnapshot, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "papertrail-live-session.json";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  showToast("Live session JSON export prepared from the persisted server snapshot.");
}

async function checkApi() {
  if (!api.configured) {
    renderApiState();
    return;
  }
  const requestGeneration = liveGeneration;
  const transport = api;
  const isCurrentCheck = () => requestGeneration === liveGeneration && api === transport;
  const card = document.getElementById("pt-live-card");
  const label = document.getElementById("pt-live-label");
  const title = document.getElementById("pt-live-title");
  const copyText = document.getElementById("pt-live-copy");
  label.textContent = "API CHECK IN PROGRESS";
  title.textContent = "Checking configured backend";
  copyText.textContent = "Only the explicit API base is contacted. Provider credentials are not sent by the browser.";
  const result = await transport.getHealth();
  if (!isCurrentCheck()) return;
  if (result.ok) {
    const models = await transport.getModels();
    if (!isCurrentCheck()) return;
    card.dataset.state = "configured";
    label.textContent = models.ok && models.data?.available === false ? "API AVAILABLE / PROVIDER UNAVAILABLE" : "API AVAILABLE / OPTIONAL";
    title.textContent = "Backend responded";
    const modelStatus = models.ok && models.data?.status ? ` Model status: ${models.data.status}.` : models.ok ? " Model status was not returned." : ` Model check failed: ${models.message}`;
    copyText.textContent = `The local API boundary responded.${modelStatus} The offline demo remains available.`;
    apiBoundaryError = "";
    apiProviderIssue = models.ok && models.data?.available === false ? `Provider model status: ${models.data.status || "unavailable"}.` : models.ok ? "" : `Provider model check failed: ${models.message}`;
    if (mode === "live" && liveSnapshot) await recoverLiveSession();
    if (!isCurrentCheck()) return;
  } else {
    card.dataset.state = "unavailable";
    label.textContent = "API UNAVAILABLE / LIVE MODE UNAVAILABLE";
    title.textContent = "Configured backend could not be reached";
    copyText.textContent = `${result.message} The offline demo remains available.`;
    apiBoundaryError = result.message;
    apiProviderIssue = "";
    liveError = result.message;
    if (mode === "live" && liveSnapshot) liveStale = true;
  }
  renderAll();
}

document.getElementById("pt-start").addEventListener("click", startDemo);
document.getElementById("pt-reset").addEventListener("click", openResetDialog);
document.getElementById("pt-cancel-reset").addEventListener("click", closeResetDialog);
document.getElementById("pt-confirm-reset").addEventListener("click", () => { closeResetDialog(); resetDemo(); });
document.getElementById("pt-api-check").addEventListener("click", checkApi);
document.getElementById("pt-open-settings").addEventListener("click", openSettingsDialog);
document.getElementById("pt-cancel-settings").addEventListener("click", closeSettingsDialog);
document.getElementById("pt-settings-form").addEventListener("submit", (event) => { void saveSettings(event); });
document.getElementById("pt-remove-api").addEventListener("click", removeApiBase);
document.getElementById("pt-cancel-live").addEventListener("click", () => { void cancelLive(); });
document.getElementById("pt-example-question").addEventListener("change", (event) => {
  if (event.target.value) document.getElementById("pt-question").value = event.target.value;
});
document.querySelectorAll("#pt-investigation-form input[name=mode]").forEach((input) => input.addEventListener("change", updateFormModeStatus));
document.getElementById("pt-investigation-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  const values = formValues();
  if (values.mode === "live") void startLive(values);
  else startDemo();
});

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

panel.addEventListener("input", (event) => {
  const search = event.target.closest("[data-evidence-search]");
  if (!search) return;
  evidenceQuery = String(search.value || "").trim().toLocaleLowerCase().slice(0, 160);
  renderPanel();
  const next = panel.querySelector("[data-evidence-search]");
  if (next) {
    next.focus();
    next.setSelectionRange(next.value.length, next.value.length);
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
  const liveClaimButton = event.target.closest("[data-live-claim-id]");
  if (liveClaimButton) {
    liveClaimId = liveClaimButton.dataset.liveClaimId;
    renderPanel();
    return;
  }
  const action = event.target.closest("[data-action]");
  if (!action) return;
  if (action.dataset.action === "start") startDemo();
  if (action.dataset.action === "export") exportJson();
  if (action.dataset.action === "export-live") exportLiveJson();
});

if (mode === "demo" && state.status === "running") runTimer = window.setTimeout(advanceRun, 300);
renderAll();
if (mode === "live") void recoverLiveSession();
else if (api.configured) void checkApi();
