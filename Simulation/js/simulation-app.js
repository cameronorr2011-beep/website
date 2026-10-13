import {
  compareScenarios,
  createModelConfiguration,
  createSimulationInput,
  duplicateScenario,
  deriveMetrics,
  exportTimeSeriesCsv,
  getOrganismProfiles,
  runSimulation,
  assertValidSimulationOutput,
  SimulationValidationError,
  WORKLOAD_LIMITS,
  MODEL_VERSION,
  ENGINE_VERSION,
} from "../engine/index.mjs";
import { createLabPersistence, createMemoryStorage } from "./persistence.js";
import { SimulationRenderer } from "./simulation-renderer.js";

const VIEW_LABELS = Object.freeze({
  dashboard: "Dashboard",
  laboratory: "Virtual Laboratory",
  simulations: "Simulations",
  strains: "Strain Explorer",
  experiments: "Experiments",
  assistant: "Assistant",
  notebook: "Notebook",
  reports: "Reports",
  settings: "Settings & data",
});
const VIEW_KEYS = new Set(Object.keys(VIEW_LABELS));
const profiles = getOrganismProfiles();
const profileById = new Map(profiles.map((profile) => [profile.profileId, profile]));
const appRoot = document.querySelector("#simApp");
const viewRoot = document.querySelector("#simView");
const toastRoot = document.querySelector("#simToast");

const state = {
  view: readView(),
  db: null,
  project: null,
  form: null,
  output: null,
  input: null,
  currentRun: null,
  comparison: null,
  renderer: null,
  assistantAnswer: null,
  assistantQuestion: "",
  backendUrl: "",
  backendKey: "",
  noteDraft: { title: "", content: "" },
  comparisonSelection: null,
  playbackIndex: -1,
  playbackTimeHours: null,
  cameraName: "overview",
  outputSource: "none",
  draftDirty: false,
  isRunning: false,
  persistenceWarning: "",
  initializing: true,
  chartResizeObserver: null,
  toastTimer: 0,
};

const BACKEND_URL_STORAGE = "orr-biologicals-digital-lab-api";
const BACKEND_KEY_STORAGE = "orr-biologicals-digital-lab-api-key";

function readBackendConfig() {
  try {
    const params = new URLSearchParams(window.location.search);
    const url = String(params.get("api") || sessionStorage.getItem(BACKEND_URL_STORAGE) || "").trim();
    const key = String(params.get("apiKey") || sessionStorage.getItem(BACKEND_KEY_STORAGE) || "").trim();
    return { url, key };
  } catch {
    return { url: "", key: "" };
  }
}

function backendOptions(config = readBackendConfig()) {
  return {
    backendBaseUrl: config.url || undefined,
    backendHeaders: config.key ? { "X-API-Key": config.key } : undefined,
    backendTimeoutMs: 8000,
  };
}

function readView() {
  const requested = window.location.hash.slice(1).split("?")[0];
  return VIEW_KEYS.has(requested) ? requested : "laboratory";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function slug(value, fallback = "scenario") {
  const result = String(value ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return result.slice(0, 56) || fallback;
}

function numberValue(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function formatNumber(value, digits = 3) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "—";
  return Number(value).toLocaleString("en-US", { maximumFractionDigits: digits });
}

function formatPercent(value, digits = 1) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "—";
  return `${formatNumber(value, digits)}%`;
}

function formatDate(value) {
  if (!value) return "Not yet saved";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown time" : date.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function profileLabel(id) {
  return profileById.get(id)?.label || id || "Unknown profile";
}

function cloneJson(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function nowIso() {
  return new Date().toISOString();
}

function recordId(prefix) {
  const cryptoObject = globalThis.crypto;
  if (cryptoObject?.randomUUID) return `${prefix}_${cryptoObject.randomUUID()}`;
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function projectSettingsScope(projectId = state.project?.id) {
  return projectId ? `project:${projectId}` : "project:unselected";
}

function getUiSettings(scope) {
  return state.db?.listUiSettings({ scope })[0] || null;
}

function projectRuns(projectId = state.project?.id) {
  if (!projectId || !state.db) return [];
  const experimentIds = new Set(state.db.listExperiments({ projectId }).map((experiment) => experiment.id));
  return state.db.listRuns().filter((run) => experimentIds.has(run.experimentId));
}

function projectExperiments(projectId = state.project?.id) {
  return projectId && state.db ? state.db.listExperiments({ projectId }) : [];
}

function projectNotes(projectId = state.project?.id) {
  return projectId && state.db ? state.db.listNotebookEntries({ projectId }) : [];
}

function experimentProjectId(experimentId) {
  return state.db?.getExperiment(experimentId)?.projectId || null;
}

function runProjectId(run) {
  return run?.experimentId ? experimentProjectId(run.experimentId) : null;
}

function renderPersistentWarning() {
  if (!state.persistenceWarning) return "";
  return `<div role="alert" aria-live="assertive" style="margin:0 0 18px;padding:13px 15px;color:#ffe9c7;background:#3b2918;border:1px solid rgba(226,177,109,.58);border-radius:9px;font:11px/1.55 var(--sim-mono)"><strong style="display:block;margin-bottom:4px;color:#ffd28e">LOCAL STORAGE WARNING</strong>${escapeHtml(state.persistenceWarning)}</div>`;
}

function markPersistenceFailure(error) {
  const detail = error?.message || "The local persistence store rejected the change.";
  state.persistenceWarning = `Changes are currently held in this browser session only. No save was reported as successful. ${detail}`;
}

function isPersistenceFailure(error) {
  return Boolean(error?.code && /^(QUOTA_EXCEEDED|STORAGE_|SERIALIZATION_|ID_CONFLICT|NOT_FOUND|INVALID_STATE)/.test(error.code));
}

function getMetrics() {
  return state.output ? deriveMetrics(state.output) : null;
}

function showToast(message, kind = "success") {
  window.clearTimeout(state.toastTimer);
  toastRoot.textContent = message;
  toastRoot.classList.toggle("is-error", kind === "error");
  toastRoot.classList.add("is-visible");
  state.toastTimer = window.setTimeout(() => toastRoot.classList.remove("is-visible"), 3400);
}

function downloadText(filename, content, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = filename; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function createDefaultForm(profileId = "arthrospira") {
  const input = createSimulationInput({ organism: profileId });
  const model = input.model;
  return {
    projectName: "Untitled culture study",
    scenarioLabel: input.scenario.label,
    organism: input.organism.profileId,
    geometry: "cylinder",
    durationHours: input.integration.durationHours,
    stepHours: input.integration.stepHours,
    initialBiomassG_L: input.initialConditions.biomassG_L,
    muMaxPerDay: model.muMaxPerDay,
    carryingCapacityG_L: model.carryingCapacityG_L,
    volumeL: model.volumeL,
    lightPpfd: model.environment.lightPpfd,
    temperatureC: model.environment.temperatureC,
    pH: model.environment.pH,
    nutrientMgL: model.environment.nutrientMgL,
    lightEnabled: model.responseFactors.light.enabled,
    temperatureEnabled: model.responseFactors.temperature.enabled,
    pHEnabled: model.responseFactors.pH.enabled,
    nutrientEnabled: model.responseFactors.nutrient.enabled,
  };
}

function profileIdForProject(project) {
  return profiles.find((profile) => profile.label === project?.organism)?.profileId || "arthrospira";
}

function formFromInput(input, projectName = state.project?.name, geometry = state.form?.geometry || "cylinder") {
  const form = createDefaultForm(input.organism.profileId);
  return {
    ...form,
    projectName: projectName || form.projectName,
    scenarioLabel: input.scenario.label,
    organism: input.organism.profileId,
    geometry,
    durationHours: input.integration.durationHours,
    stepHours: input.integration.stepHours,
    initialBiomassG_L: input.initialConditions.biomassG_L,
    muMaxPerDay: input.model.muMaxPerDay,
    carryingCapacityG_L: input.model.carryingCapacityG_L,
    volumeL: input.model.volumeL,
    lightPpfd: input.model.environment.lightPpfd,
    temperatureC: input.model.environment.temperatureC,
    pH: input.model.environment.pH,
    nutrientMgL: input.model.environment.nutrientMgL,
    lightEnabled: input.model.responseFactors.light.enabled,
    temperatureEnabled: input.model.responseFactors.temperature.enabled,
    pHEnabled: input.model.responseFactors.pH.enabled,
    nutrientEnabled: input.model.responseFactors.nutrient.enabled,
  };
}

function addOrUpdateSnapshotRecord(snapshot, collectionName, payload, requestedId = payload.id) {
  const collection = snapshot.collections[collectionName];
  if (!Array.isArray(collection)) throw new Error(`Workspace snapshot is missing ${collectionName}.`);
  const existingIndex = requestedId ? collection.findIndex((record) => record.id === requestedId) : -1;
  const existing = existingIndex >= 0 ? collection[existingIndex] : null;
  const timestamp = nowIso();
  const record = {
    ...(existing || {}),
    ...cloneJson(payload),
    id: requestedId || recordId(collectionName === "uiSettings" ? "ui_settings" : collectionName.slice(0, -1)),
    playerId: state.db.playerId,
    ownerId: state.db.playerId,
    createdAt: existing?.createdAt || payload.createdAt || timestamp,
    updatedAt: timestamp,
    dataOrigin: "synthetic-computational",
    provenance: existing?.provenance || {
      kind: "synthetic-computational",
      origin: "synthetic",
      source: "algal-digital-lab",
      method: "local computational model",
      synthetic: true,
      computational: true,
    },
  };
  if (existingIndex >= 0) collection[existingIndex] = record;
  else collection.push(record);
  return record;
}

function upsertSettingsInSnapshot(snapshot, scope, settings) {
  const existing = snapshot.collections.uiSettings.find((entry) => entry.scope === scope);
  return addOrUpdateSnapshotRecord(snapshot, "uiSettings", {
    ...(existing || {}),
    scope,
    settings: cloneJson(settings),
  }, existing?.id || `ui_settings_${slug(scope, "lab").replaceAll("-", "_")}`);
}

function commitAtomicSnapshot(mutator) {
  const snapshot = state.db.exportState();
  const result = mutator(snapshot);
  state.db.importState(snapshot, { mode: "replace" });
  return result;
}

function projectUiPayload() {
  return {
    projectId: state.project?.id || null,
    draft: cloneJson(state.form),
    currentRunId: state.currentRun?.id || null,
    comparison: cloneJson(state.comparisonSelection),
    cameraName: state.cameraName,
    playbackIndex: Number.isInteger(state.playbackIndex) ? state.playbackIndex : -1,
    playbackTimeHours: state.playbackTimeHours,
    draftDirty: state.draftDirty === true,
  };
}

function workspaceUiPayload() {
  return {
    activeProjectId: state.project?.id || null,
    view: VIEW_KEYS.has(state.view) ? state.view : "laboratory",
  };
}

function persistProjectState({ showError = true } = {}) {
  if (state.initializing || !state.db || !state.project || !state.form) return true;
  try {
    syncFormFromDom();
    commitAtomicSnapshot((snapshot) => {
      const project = snapshot.collections.projects.find((entry) => entry.id === state.project.id);
      if (!project) throw new Error("The active project no longer exists in local records.");
      addOrUpdateSnapshotRecord(snapshot, "projects", {
        ...project,
        name: state.form.projectName,
        organism: profileLabel(state.form.organism),
        model: MODEL_VERSION,
        description: "A local-first synthetic microalgae growth investigation.",
        tags: ["synthetic", "computational"],
        draft: cloneJson(state.form),
      }, project.id);
      upsertSettingsInSnapshot(snapshot, projectSettingsScope(project.id), projectUiPayload());
      upsertSettingsInSnapshot(snapshot, "lab", workspaceUiPayload());
    });
    state.project = state.db.getProject(state.project.id);
    return true;
  } catch (error) {
    if (isPersistenceFailure(error)) markPersistenceFailure(error);
    if (showError) showToast(`Project could not be saved: ${error.message}`, "error");
    return false;
  }
}

function restoreRunOutput(run) {
  state.output = null;
  state.outputSource = run ? "missing" : "none";
  if (!run) return;
  if (run.outputSnapshot === undefined || run.outputSnapshot === null) return;
  try {
    assertValidSimulationOutput(run.outputSnapshot);
    state.output = cloneJson(run.outputSnapshot);
    state.outputSource = "stored";
  } catch (error) {
    state.output = null;
    state.outputSource = "invalid";
    state.persistenceWarning = `Saved run ${run.label || run.id} contains an invalid stored output. It was not recomputed or overwritten.`;
  }
}

function restoreComparisonFromSettings(selection) {
  state.comparison = null;
  state.comparisonSelection = selection && typeof selection === "object"
    ? { leftRunId: selection.leftRunId || "", rightRunId: selection.rightRunId || "" }
    : null;
  if (!state.comparisonSelection?.leftRunId || !state.comparisonSelection?.rightRunId) return;
  const left = state.db.getRun(state.comparisonSelection.leftRunId);
  const right = state.db.getRun(state.comparisonSelection.rightRunId);
  if (runProjectId(left) !== state.project?.id || runProjectId(right) !== state.project?.id) return;
  if (!left.outputSnapshot || !right.outputSnapshot) return;
  try {
    assertValidSimulationOutput(left.outputSnapshot);
    assertValidSimulationOutput(right.outputSnapshot);
    state.comparison = compareScenarios(left.outputSnapshot, right.outputSnapshot);
  } catch (error) {
    state.comparison = null;
    state.persistenceWarning = `A saved comparison could not be restored: ${error.message}`;
  }
}

function restoreActiveProject(project) {
  state.project = project;
  const settingsRecord = getUiSettings(projectSettingsScope(project.id));
  const settings = settingsRecord?.settings && typeof settingsRecord.settings === "object" ? settingsRecord.settings : {};
  const savedDraft = settings.draft && typeof settings.draft === "object" ? settings.draft : project.draft;
  state.form = { ...createDefaultForm(profileIdForProject(project)), ...(savedDraft || {}) };
  if (!profileById.has(state.form.organism)) state.form.organism = profileIdForProject(project);
  state.form.projectName = savedDraft?.projectName ?? project.name;
  state.cameraName = ["overview", "vessel", "close", "top"].includes(settings.cameraName) ? settings.cameraName : "overview";
  state.playbackIndex = Number.isInteger(settings.playbackIndex) ? settings.playbackIndex : -1;
  state.playbackTimeHours = Number.isFinite(settings.playbackTimeHours) ? settings.playbackTimeHours : null;
  state.draftDirty = settings.draftDirty === true;
  state.input = null;
  state.currentRun = null;
  state.output = null;
  state.outputSource = "none";
  const candidateRun = settings.currentRunId ? state.db.getRun(settings.currentRunId) : null;
  if (candidateRun && runProjectId(candidateRun) === project.id) {
    state.currentRun = candidateRun;
    if (!savedDraft) {
      try {
        state.input = createSimulationInput(candidateRun.parameters?.inputSnapshot);
        state.form = formFromInput(state.input, project.name, state.form.geometry);
      } catch (error) {
        state.persistenceWarning = `The active run input snapshot could not be restored: ${error.message}`;
      }
    } else if (candidateRun.parameters?.inputSnapshot) {
      try { state.input = createSimulationInput(candidateRun.parameters.inputSnapshot); } catch { state.input = null; }
    }
    restoreRunOutput(candidateRun);
    if (state.output && (!Number.isInteger(state.playbackIndex) || state.playbackIndex < 0 || state.playbackIndex >= state.output.timeSeries.length)) {
      state.playbackIndex = state.output.timeSeries.length - 1;
    }
  }
  restoreComparisonFromSettings(settings.comparison);
}

function initializePersistence() {
  const backendConfig = readBackendConfig();
  state.backendUrl = backendConfig.url;
  state.backendKey = backendConfig.key;
  try {
    state.db = createLabPersistence({ playerId: "digital-lab-local", ...backendOptions(backendConfig) });
  } catch (error) {
    state.db = createLabPersistence({ playerId: "digital-lab-local", storage: createMemoryStorage() });
    state.persistenceWarning = `Browser storage could not be opened (${error.message}). The unreadable original was left untouched; this session is using an in-memory workspace and will not survive reload.`;
  }
  let projects = state.db.listProjects();
  if (!projects.length) {
    try {
      projects = [state.db.createProject({
        name: "Untitled culture study",
        description: "A local-first synthetic microalgae growth investigation.",
        organism: "Arthrospira",
        model: MODEL_VERSION,
        tags: ["synthetic", "computational"],
      })];
    } catch (error) {
      state.persistenceWarning = `The initial project could not be written (${error.message}). This session is using an in-memory workspace; no save was reported as successful.`;
      state.db = createLabPersistence({ playerId: "digital-lab-local", storage: createMemoryStorage() });
      projects = [state.db.createProject({
        name: "Untitled culture study",
        description: "A local-first synthetic microalgae growth investigation.",
        organism: "Arthrospira",
        model: MODEL_VERSION,
        tags: ["synthetic", "computational"],
      })];
    }
  }
  const workspace = getUiSettings("lab")?.settings;
  const active = projects.find((project) => project.id === workspace?.activeProjectId) || projects[0];
  restoreActiveProject(active);
  if (!window.location.hash && VIEW_KEYS.has(workspace?.view)) state.view = workspace.view;
  state.initializing = false;
  persistProjectState({ showError: false });
}

function destroyRenderer() {
  state.renderer?.destroy();
  state.renderer = null;
  state.chartResizeObserver?.disconnect();
  state.chartResizeObserver = null;
}

function updateNavigation() {
  document.querySelectorAll("[data-view]").forEach((item) => {
    const active = item.dataset.view === state.view;
    item.classList.toggle("is-active", active);
    if (active && item.classList.contains("sim-nav-item")) item.setAttribute("aria-current", "page");
    else if (item.classList.contains("sim-nav-item")) item.removeAttribute("aria-current");
  });
  document.querySelector("#simBreadcrumb").textContent = VIEW_LABELS[state.view];
}

function setView(view, { updateHash = true } = {}) {
  if (!VIEW_KEYS.has(view)) return;
  state.view = view;
  if (updateHash && window.location.hash !== `#${view}`) window.history.replaceState(null, "", `#${view}`);
  persistProjectState({ showError: false });
  render();
}

function renderPageHeading(eyebrow, title, description, actions = "") {
  return `<header class="sim-page-heading"><div><p class="sim-eyebrow">${escapeHtml(eyebrow)}</p><h1>${escapeHtml(title)}</h1></div><div>${description ? `<p class="sim-page-subtitle">${escapeHtml(description)}</p>` : ""}${actions}</div></header>`;
}

function renderMetricStrip(metrics) {
  return `<div class="metric-strip">
    <div class="metric-mini"><span>Final biomass</span><strong>${metrics ? `${formatNumber(metrics.finalBiomassG_L)}<small> g/L</small>` : "—"}</strong><small>concentration</small></div>
    <div class="metric-mini"><span>Relative change</span><strong>${metrics ? formatPercent(metrics.relativeChangePercent) : "—"}</strong><small>from initial state</small></div>
    <div class="metric-mini"><span>Growth rate</span><strong>${metrics ? formatNumber(metrics.endpointGrowthRatePerDay, 4) : "—"}</strong><small>net specific / day</small></div>
    <div class="metric-mini"><span>Runs in project</span><strong>${projectRuns().length}</strong><small>local records</small></div>
  </div>`;
}

function renderRunRows(runs, limit = 5) {
  const recent = [...runs].reverse().slice(0, limit);
  if (!recent.length) return `<div class="sim-empty"><div><strong>No synthetic runs yet</strong><p>Configure a culture and run the first reproducible model trace in the Virtual Laboratory.</p><button class="sim-button primary" type="button" data-view="laboratory">Open laboratory</button></div></div>`;
  return `<table class="run-list"><thead><tr><th>Run</th><th>Organism</th><th>Final biomass</th><th>Status</th><th></th></tr></thead><tbody>${recent.map((run) => {
    const input = run.parameters?.inputSnapshot;
    const metrics = run.metrics || run.summary || {};
    return `<tr><td>${escapeHtml(run.label || "Untitled run")}<small>${escapeHtml(formatDate(run.createdAt))}</small></td><td>${escapeHtml(input?.organism?.label || "Illustrative culture")}</td><td class="number">${formatNumber(metrics.finalBiomassG_L)} g/L</td><td><span class="status-pill">${escapeHtml(run.status || "completed")}</span></td><td><button class="sim-link-button" type="button" data-action="load-run" data-run-id="${escapeHtml(run.id)}">Open →</button></td></tr>`;
  }).join("")}</tbody></table>`;
}

function renderDashboard() {
  const runs = projectRuns();
  const metrics = getMetrics();
  return `${renderPageHeading("Algal Digital Lab · local workspace", "A clear surface for uncertain biology.", "Run a reproducible, illustrative culture model, inspect its trace, and keep every assumption attached to the result.")}
    <section class="dashboard-hero">
      <div class="dashboard-hero-copy"><p class="sim-eyebrow">Research workspace / synthetic mode</p><h2>Turn one question into a trace.</h2><p>The lab exists to make a hypothesis inspectable: configure a bounded model, run it, compare the result, and keep the assumptions attached. No hardware measurements, species identification, or process guarantee is implied.</p><div class="dashboard-hero-actions"><button class="sim-button primary" type="button" data-view="laboratory">Start with a hypothesis <span>→</span></button><button class="sim-button ghost" type="button" data-view="assistant">Ask the local assistant</button></div></div>
      <aside class="dashboard-signal-card"><div class="signal-topline"><span>Model signal</span><span>v1.0.0</span></div><div class="signal-wave" aria-hidden="true"></div><div class="signal-value"><strong>${metrics ? formatNumber(metrics.finalBiomassG_L) : "—"}</strong><span>g/L endpoint</span></div><p class="signal-card-note">${metrics ? `Saved output · ${escapeHtml(state.output.organism.label)}` : "No saved output · draft only"}</p></aside>
    </section>
    ${renderMetricStrip(metrics)}
    <section class="dashboard-panel workflow-panel" style="margin-top:16px"><div class="panel-heading"><div><p class="sim-eyebrow">Your next move</p><h2>The research loop is five steps.</h2><p>Follow the numbered path when the workspace feels busy. Each step keeps the question visible and the boundary clear.</p></div><span class="sim-provenance">local · reproducible</span></div><div class="workflow-steps"><button type="button" data-view="notebook"><span>01</span><b>State the question</b><small>Write the hypothesis before touching a parameter.</small></button><button type="button" data-view="laboratory"><span>02</span><b>Configure a run</b><small>Choose the profile, environment, and duration.</small></button><button type="button" data-action="run"><span>03</span><b>Run the trace</b><small>Integrate the illustrative biomass model.</small></button><button type="button" data-view="simulations"><span>04</span><b>Inspect and compare</b><small>Look at the endpoint and response factors.</small></button><button type="button" data-view="reports"><span>05</span><b>Keep the record</b><small>Export the result with its assumptions.</small></button></div></section>
    <div class="dashboard-grid" style="margin-top:16px">
      <section class="dashboard-panel panel-span-7"><div class="panel-heading"><div><h2>Recent runs</h2><p>Local experiment records stay in this browser until you export or sync them.</p></div><button class="sim-link-button" type="button" data-view="simulations">View all →</button></div>${renderRunRows(runs)}</section>
      <section class="dashboard-panel panel-span-5"><div class="panel-heading"><div><h2>Research shortcuts</h2><p>Move between the model, the organisms, and the record.</p></div></div><div class="quick-grid"><button class="quick-card" type="button" data-view="laboratory"><span>01</span><div><b>Configure a run</b><p>Change light, temperature, pH, nutrients, and duration.</p></div></button><button class="quick-card" type="button" data-view="strains"><span>02</span><div><b>Explore profiles</b><p>Reference labels with illustrative, not measured, parameters.</p></div></button><button class="quick-card" type="button" data-view="notebook"><span>03</span><div><b>Write a note</b><p>Attach a hypothesis to a project or run.</p></div></button><button class="quick-card" type="button" data-view="reports"><span>04</span><div><b>Export a report</b><p>Keep the model version and assumptions with the trace.</p></div></button></div></section>
      <section class="dashboard-panel panel-span-12"><div class="panel-heading"><div><h2>What this model is — and is not</h2><p>Transparent boundaries are part of the instrument.</p></div><span class="sim-provenance">Synthetic computational</span></div><div class="assumptions-panel" style="margin:0"><div><h3>Illustrative biomass bookkeeping</h3><p>The current engine integrates a logistic biomass equation with optional light, temperature, pH, and nutrient response factors. It is useful for comparing hypotheses and interface states, not for claiming biological performance.</p></div><ol><li>Fixed-step forward Euler integration.</li><li>Organism profiles are reference labels only.</li><li>All saved records carry synthetic provenance.</li><li>Hardware, actuators, cloud sync, and AI conclusions are outside this route.</li></ol></div></section>
    </div>`;
}

function formValue(name, fallback = "") {
  const element = viewRoot.querySelector(`[name="${name}"]`);
  return element ? element.value : fallback;
}

function formChecked(name, fallback = false) {
  const element = viewRoot.querySelector(`[name="${name}"]`);
  return element ? element.checked : fallback;
}

function syncFormFromDom() {
  if (!state.form) return;
  state.form.projectName = formValue("projectName", state.form.projectName);
  state.form.scenarioLabel = formValue("scenarioLabel", state.form.scenarioLabel);
  state.form.organism = formValue("organism", state.form.organism);
  state.form.geometry = formValue("geometry", state.form.geometry);
  for (const field of ["durationHours", "stepHours", "initialBiomassG_L", "muMaxPerDay", "carryingCapacityG_L", "volumeL", "lightPpfd", "temperatureC", "pH", "nutrientMgL"]) {
    const element = viewRoot.querySelector(`[name="${field}"]`);
    if (element) state.form[field] = element.value;
  }
  for (const field of ["lightEnabled", "temperatureEnabled", "pHEnabled", "nutrientEnabled"]) state.form[field] = formChecked(field, state.form[field]);
}

function updatePlayback(index) {
  const points = state.output?.timeSeries;
  if (!Array.isArray(points) || !points.length) return;
  state.playbackIndex = Math.max(0, Math.min(points.length - 1, Number(index) || 0));
  const playback = points[state.playbackIndex];
  state.playbackTimeHours = playback.timeHours;
  state.renderer?.setState({ biomass: playback.biomassG_L, carryingCapacity: Number(state.form.carryingCapacityG_L) || 2, running: false });
  const biomass = document.querySelector("#playbackBiomass");
  const time = document.querySelector("#playbackTime");
  const timeLabel = document.querySelector("#playbackTimeLabel");
  if (biomass) biomass.textContent = `${formatNumber(playback.biomassG_L)} g/L`;
  if (time) time.textContent = `${formatNumber(playback.timeHours, 2)} h of ${formatNumber(state.output.integration.durationHours, 2)} h`;
  if (timeLabel) timeLabel.textContent = `t = ${formatNumber(playback.timeHours, 2)} h · step ${playback.step}`;
  persistProjectState({ showError: false });
}

function numericFormValue(form, field, errors) {
  const raw = form[field];
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw !== "string" || raw.trim() === "") {
    errors.push({ path: field, message: "must not be empty; enter a number", code: "required" });
    return null;
  }
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    errors.push({ path: field, message: "must be a finite number", code: "finite-number" });
    return null;
  }
  return value;
}

function inputFromForm() {
  syncFormFromDom();
  const form = state.form;
  const errors = [];
  const projectName = typeof form.projectName === "string" ? form.projectName.trim() : "";
  const scenarioLabel = typeof form.scenarioLabel === "string" ? form.scenarioLabel.trim() : "";
  if (!projectName) errors.push({ path: "projectName", message: "must not be empty", code: "required" });
  if (!scenarioLabel) errors.push({ path: "scenarioLabel", message: "must not be empty", code: "required" });
  if (scenarioLabel.length > 160) errors.push({ path: "scenarioLabel", message: "must be at most 160 characters", code: "text" });
  const numeric = {};
  for (const field of ["durationHours", "stepHours", "initialBiomassG_L", "muMaxPerDay", "carryingCapacityG_L", "volumeL", "lightPpfd", "temperatureC", "pH", "nutrientMgL"]) numeric[field] = numericFormValue(form, field, errors);
  if (errors.length) throw new SimulationValidationError("Simulation form validation failed", errors);
  const stepCount = numeric.durationHours / numeric.stepHours;
  if (!Number.isInteger(stepCount) || stepCount > WORKLOAD_LIMITS.maxIntegrationSteps) {
    throw new SimulationValidationError("Simulation workload validation failed", [{
      path: "integration",
      message: Number.isInteger(stepCount)
        ? `step count must not exceed ${WORKLOAD_LIMITS.maxIntegrationSteps}`
        : "duration must be evenly divisible by the time step",
      code: "workload-limit",
    }]);
  }
  const baseModel = createModelConfiguration({}, form.organism);
  const model = createModelConfiguration({
    muMaxPerDay: numeric.muMaxPerDay,
    carryingCapacityG_L: numeric.carryingCapacityG_L,
    volumeL: numeric.volumeL,
    environment: {
      ...baseModel.environment,
      lightPpfd: numeric.lightPpfd,
      temperatureC: numeric.temperatureC,
      pH: numeric.pH,
      nutrientMgL: numeric.nutrientMgL,
    },
    responseFactors: {
      ...baseModel.responseFactors,
      light: { ...baseModel.responseFactors.light, enabled: form.lightEnabled },
      temperature: { ...baseModel.responseFactors.temperature, enabled: form.temperatureEnabled },
      pH: { ...baseModel.responseFactors.pH, enabled: form.pHEnabled },
      nutrient: { ...baseModel.responseFactors.nutrient, enabled: form.nutrientEnabled },
    },
  }, form.organism);
  return createSimulationInput({
    organism: form.organism,
    scenario: { id: slug(scenarioLabel), label: scenarioLabel },
    model,
    initialConditions: { biomassG_L: numeric.initialBiomassG_L, timeHours: 0 },
    integration: { method: "fixed-step-euler", durationHours: numeric.durationHours, stepHours: numeric.stepHours },
  });
}

function field(label, name, value, unit = "", type = "number", extra = "") {
  return `<label class="field-group"><span class="field-label">${escapeHtml(label)} ${unit ? `<em>${escapeHtml(unit)}</em>` : ""}</span><span class="input-with-unit"><input class="sim-input" name="${escapeHtml(name)}" type="${type}" value="${escapeHtml(value)}" ${extra}>${unit ? `<span class="input-unit">${escapeHtml(unit)}</span>` : ""}</span></label>`;
}

function selectField(label, name, value, options) {
  return `<label class="field-group"><span class="field-label">${escapeHtml(label)}</span><select class="sim-select" name="${escapeHtml(name)}">${options.map(([optionValue, optionLabel]) => `<option value="${escapeHtml(optionValue)}"${optionValue === value ? " selected" : ""}>${escapeHtml(optionLabel)}</option>`).join("")}</select></label>`;
}

function switchField(label, name, checked, note) {
  return `<label class="switch-row"><span>${escapeHtml(label)}<small>${escapeHtml(note)}</small></span><span class="sim-switch"><input type="checkbox" name="${escapeHtml(name)}"${checked ? " checked" : ""}><span aria-hidden="true"></span></span></label>`;
}

function renderControlPanel() {
  const form = state.form;
  const options = profiles.map((profile) => [profile.profileId, profile.label]);
  const busy = state.isRunning;
  return `<form class="sim-panel control-panel" id="simulationForm" novalidate aria-busy="${busy ? "true" : "false"}"><h3>Simulation studio</h3><p class="panel-subtitle">A bounded, deterministic model snapshot. Every value is editable before a run.</p>
    ${field("Project", "projectName", form.projectName, "", "text", 'maxlength="80" required')}
    ${field("Scenario label", "scenarioLabel", form.scenarioLabel, "", "text", 'maxlength="160" required')}
    ${selectField("Reference profile", "organism", form.organism, options)}
    ${selectField("Reactor geometry", "geometry", form.geometry, [["cylinder", "Vertical cylinder"], ["flask", "Erlenmeyer flask"], ["tubular", "Tubular loop"]])}
    <div class="control-divider"></div>
    <div class="field-label">Initial conditions</div>
    <div class="two-fields">${field("Biomass", "initialBiomassG_L", form.initialBiomassG_L, "g/L", "number", 'min="0" max="1000000" step="0.001"')}${field("Volume", "volumeL", form.volumeL, "L", "number", 'min="0.001" max="1000000" step="0.1"')}</div>
    <div class="control-divider"></div>
    <div class="field-label">Model configuration</div>
    <div class="two-fields">${field("Max growth", "muMaxPerDay", form.muMaxPerDay, "/day", "number", 'min="0" max="10" step="0.01"')}${field("Capacity", "carryingCapacityG_L", form.carryingCapacityG_L, "g/L", "number", 'min="0.001" max="1000000" step="0.1"')}</div>
    <div class="two-fields">${field("Duration", "durationHours", form.durationHours, "hours", "number", 'min="1" max="8760" step="1"')}${field("Time step", "stepHours", form.stepHours, "hours", "number", 'min="0.01" max="24" step="0.01"')}</div>
    <div class="control-divider"></div>
    <div class="field-label">Environment</div>
    <div class="two-fields">${field("Light", "lightPpfd", form.lightPpfd, "µmol m⁻² s⁻¹", "number", 'min="0" max="10000" step="1" required')}${field("Temperature", "temperatureC", form.temperatureC, "°C", "number", 'min="-20" max="80" step="0.1" required')}</div>
    <div class="two-fields">${field("pH", "pH", form.pH, "pH", "number", 'min="0" max="14" step="0.1"')}${field("Nutrient", "nutrientMgL", form.nutrientMgL, "mg/L", "number", 'min="0" max="1000000" step="1"')}</div>
    <div class="control-divider"></div>
    <div class="field-label">Response factors <em>toggle on / off</em></div>
    <div class="switch-list">${switchField("Light saturation", "lightEnabled", form.lightEnabled, "Monod-like response")}${switchField("Temperature", "temperatureEnabled", form.temperatureEnabled, "Gaussian response")}${switchField("pH", "pHEnabled", form.pHEnabled, "Gaussian response")}${switchField("Nutrients", "nutrientEnabled", form.nutrientEnabled, "Monod-like response")}</div>
    <div class="control-actions"><button class="sim-button primary" type="submit" data-action="run"${busy ? " disabled" : ""}>${busy ? "⏳ Running bounded workload…" : "▶ Run model"}</button><button class="sim-button ghost" type="button" data-action="reset-form"${busy ? " disabled" : ""}>Reset draft</button><button class="sim-button ghost" type="button" data-action="duplicate-scenario"${busy ? " disabled" : ""}>Duplicate scenario</button></div>
    ${busy ? `<p class="sim-muted" aria-live="polite" style="margin:10px 0 0;font:10px var(--sim-mono)">Computation in progress. Run controls are disabled until the bounded step workload completes.</p>` : ""}
    <div class="validation-message" id="validationMessage" role="alert" aria-live="assertive"></div>
  </form>`;
}

function renderFactors(output) {
  const input = output?.inputSnapshot;
  const point = output?.timeSeries?.at(-1);
  if (!input || !point) return `<div class="sim-empty" style="min-height:150px"><div><strong>Factors appear after a run</strong><p>Run the configured scenario to inspect the response terms.</p></div></div>`;
  const factors = [["Light", point.lightFactor], ["Temperature", point.temperatureFactor], ["pH", point.pHFactor], ["Nutrient", point.nutrientFactor]];
  return `<div class="factor-list">${factors.map(([label, value]) => `<div class="factor-row"><span>${label}</span><span class="factor-track"><i style="width:${Math.round(Math.max(0, Math.min(1, value)) * 100)}%"></i></span><b>${formatNumber(value, 2)}</b></div>`).join("")}</div>`;
}

function playbackPoint() {
  const points = state.output?.timeSeries;
  if (!Array.isArray(points) || !points.length) return null;
  const index = Number.isInteger(state.playbackIndex) && state.playbackIndex >= 0
    ? Math.min(state.playbackIndex, points.length - 1)
    : points.length - 1;
  return { point: points[index], index, total: points.length };
}

function renderTelemetryPanel() {
  const metrics = getMetrics();
  const output = state.output;
  const organism = output?.organism?.label || profileLabel(state.form.organism);
  const playback = playbackPoint();
  const missingRunNotice = state.currentRun && !output
    ? `<div role="status" style="margin:0 0 14px;padding:10px;color:var(--sim-amber);background:rgba(226,177,109,.08);border:1px solid rgba(226,177,109,.22);border-radius:7px;font:10px/1.45 var(--sim-mono)">This saved run has no stored output. <button class="sim-link-button" type="button" data-action="recompute-current-run">Recompute from its input snapshot</button> (explicitly disclosed; the saved snapshot will not be changed).</div>`
    : "";
  return `<aside class="sim-panel telemetry-panel"><div class="telemetry-head"><div><h3>Run telemetry</h3><small>${escapeHtml(organism)} · ${output ? escapeHtml(output.scenario.label) : "No saved output selected"}</small></div><span class="live-dot" aria-label="Local model ready"></span></div>
    ${missingRunNotice}<div class="result-hero"><span class="result-label">Saved endpoint biomass</span><strong>${metrics ? formatNumber(metrics.finalBiomassG_L) : "—"}</strong><small>g/L · ${metrics ? `Δ ${formatNumber(metrics.deltaBiomassG_L)} g/L` : "no endpoint before a run"}</small></div>
    <dl class="result-list"><div><dt>Model state</dt><dd>${output ? (state.outputSource === "stored" ? "STORED OUTPUT" : "RECOMPUTED") : "DRAFT / NOT RUN"}</dd></div><div><dt>Integration</dt><dd>${output ? `${formatNumber(output.integration.durationHours, 0)} h / ${formatNumber(output.integration.stepHours, 2)} h` : "Not run"}</dd></div><div><dt>Steps</dt><dd>${metrics ? formatNumber(metrics.stepCount, 0) : "Not run"}</dd></div><div><dt>Relative change</dt><dd>${metrics ? formatPercent(metrics.relativeChangePercent) : "—"}</dd></div></dl>
    ${playback ? `<div style="margin:0 0 14px;padding:10px;background:rgba(115,216,211,.06);border:1px solid rgba(115,216,211,.18);border-radius:7px"><div class="field-label" style="margin-bottom:4px">Playback point <em>separate from saved endpoint</em></div><strong id="playbackBiomass">${formatNumber(playback.point.biomassG_L)} g/L</strong><small id="playbackTimeLabel" style="display:block;color:var(--sim-mute);font:10px var(--sim-mono)">t = ${formatNumber(playback.point.timeHours, 2)} h · step ${playback.point.step}</small></div>` : ""}
    <div><div class="field-label" style="margin-bottom:10px">Response factors <em>endpoint</em></div>${renderFactors(output)}</div>
    <div class="provenance-note"><strong>${output ? (state.outputSource === "stored" ? "Stored evidence" : "Explicitly recomputed evidence") : "Draft boundary"}</strong>${output ? "The displayed output is the saved run snapshot unless explicitly marked recomputed. It is synthetic computational data, not a sensor reading, calibration, species identification, CFD result, or actuator instruction." : "No endpoint or integration result is being inferred before a successful run."}</div>
  </aside>`;
}

function renderVisualPanel() {
  const output = state.output;
  const playback = playbackPoint();
  const biomass = playback?.point.biomassG_L ?? state.form.initialBiomassG_L;
  const geometry = state.form.geometry;
  const camera = state.cameraName;
  return `<section class="visual-panel sim-panel"><canvas id="labCanvas" tabindex="0" aria-label="Interactive procedural 3D synthetic reactor. Drag to orbit and use the camera controls to inspect the culture vessel."></canvas><div class="scene-kicker"><span class="sim-eyebrow">Procedural virtual reactor</span><strong>${escapeHtml(output?.organism?.label || profileLabel(state.form.organism))}</strong><small>${escapeHtml(geometry)} geometry · browser rendered</small></div><div class="scene-telemetry"><div class="telemetry-item"><span>${output ? "PLAYBACK BIOMASS" : "DRAFT BIOMASS"}</span><strong>${formatNumber(biomass)} g/L</strong></div><div class="telemetry-item"><span>${output ? "PLAYBACK TIME" : "STATUS"}</span><strong>${playback ? `${formatNumber(playback.point.timeHours, 2)} h` : (state.isRunning ? "RUNNING" : "DRAFT PREVIEW")}</strong></div><div class="telemetry-item"><span>MODE</span><strong>${output ? "STORED TRACE" : "SIMULATED DRAFT"}</strong></div></div>${playback ? `<label style="position:absolute;left:18px;right:18px;bottom:56px;z-index:3;color:var(--sim-ink-soft);font:9px var(--sim-mono)">Playback scrubber <input id="playbackScrubber" type="range" min="0" max="${playback.total - 1}" step="1" value="${playback.index}" aria-label="Playback time through stored simulation trace" style="width:100%;accent-color:var(--sim-leaf)"><span id="playbackTime" style="display:block;margin-top:3px;color:var(--sim-leaf)">${formatNumber(playback.point.timeHours, 2)} h of ${formatNumber(output.integration.durationHours, 2)} h</span></label>` : ""}<div class="scene-camera-control" role="group" aria-label="Virtual reactor camera"><button class="camera-button${camera === "overview" ? " is-active" : ""}" type="button" data-action="camera" data-camera="overview">Overview</button><button class="camera-button${camera === "vessel" ? " is-active" : ""}" type="button" data-action="camera" data-camera="vessel">Vessel</button><button class="camera-button${camera === "close" ? " is-active" : ""}" type="button" data-action="camera" data-camera="close">Close</button><button class="camera-button${camera === "top" ? " is-active" : ""}" type="button" data-action="camera" data-camera="top">Top</button></div><div class="scene-legend"><span class="legend-item"><i class="legend-dot green"></i>culture volume</span><span class="legend-item"><i class="legend-dot cyan"></i>flow markers</span><span class="legend-item"><i class="legend-dot amber"></i>synthetic state</span></div><div class="scene-status" id="sceneStatus">WebGL / Canvas projection · synthetic state linked</div><div class="scene-loading" id="sceneLoading"><span class="loader"></span><span>Loading procedural laboratory…</span></div></section>`;
}

function renderChartPanel() {
  const output = state.output;
  return `<section class="analysis-panel"><div class="panel-heading"><div><h2>Biomass trajectory</h2><p>Concentration across the fixed-step integration window.</p></div><span class="sim-provenance">${output ? (state.outputSource === "stored" ? "stored trace" : "recomputed trace") : "awaiting run"}</span></div><div class="chart-wrap"><canvas id="biomassChart" aria-label="Biomass trajectory chart"></canvas>${output ? "" : `<div class="chart-empty">Run the model to plot a trajectory</div>`}</div>${output ? `<div class="run-meta"><span class="meta-chip"><strong>Equation</strong> logistic dX/dt</span><span class="meta-chip"><strong>Engine</strong> ${ENGINE_VERSION}</span><span class="meta-chip"><strong>Origin</strong> synthetic</span></div>` : ""}</section>`;
}

function renderComparisonPanel() {
  const runs = projectRuns();
  const leftId = state.comparisonSelection?.leftRunId || "";
  const rightId = state.comparisonSelection?.rightRunId || "";
  const option = (run, selected) => `<option value="${escapeHtml(run.id)}"${run.id === selected ? " selected" : ""}>${escapeHtml(run.label || run.id)}</option>`;
  const leftOptions = runs.map((run) => option(run, leftId)).join("");
  const rightOptions = runs.map((run) => option(run, rightId)).join("");
  const comparison = state.comparison;
  return `<section class="analysis-panel"><div class="panel-heading"><div><h2>Compare scenarios</h2><p>Change one hypothesis, keep the stored traces attached to this project.</p></div><span class="sim-provenance">stored traces</span></div><div class="compare-box"><div class="compare-row"><label class="field-group"><span class="field-label">Reference run</span><select class="sim-select" id="compareLeft"><option value="">Choose a run</option>${leftOptions}</select></label><span>vs</span><label class="field-group"><span class="field-label">Variant run</span><select class="sim-select" id="compareRight"><option value="">Choose a run</option>${rightOptions}</select></label></div><button class="sim-button" type="button" data-action="compare-runs"${runs.length < 2 ? " disabled" : ""}>Compare stored runs</button>${comparison ? `<div class="compare-result"><div><span>Changed parameters</span><strong>${comparison.changedParametersCount}</strong></div><div><span>Endpoint difference</span><strong>${formatNumber(comparison.metrics.difference.finalBiomassG_L)} g/L</strong></div><div><span>Relative change difference</span><strong>${comparison.metrics.difference.relativeChange === null ? "—" : formatPercent(comparison.metrics.difference.relativeChange * 100)}</strong></div></div>` : ""}</div></section>`;
}

function renderLaboratory() {
  const draftStatus = state.draftDirty && state.output
    ? `<div role="status" style="margin:0 0 16px;padding:11px 13px;color:var(--sim-cyan);background:rgba(115,216,211,.06);border:1px solid rgba(115,216,211,.2);border-radius:8px;font:10px/1.5 var(--sim-mono)"><strong>EDITABLE DRAFT</strong> The controls differ from the saved result shown below. Run the draft to create a new immutable output; the existing saved run remains unchanged.</div>`
    : "";
  return `${renderPageHeading("Virtual Laboratory · simulation studio", "Run the next hypothesis.", "A transparent, local-first workspace for exploring an illustrative biomass model. Configure the culture, then inspect the trace in a procedural reactor.", `<div class="run-meta"><span class="meta-chip"><strong>MODEL</strong> logistic biomass</span><span class="meta-chip"><strong>ORIGIN</strong> synthetic only</span></div>`)}
    ${draftStatus}<div class="lab-title-bar"><div><p class="sim-eyebrow">Experiment / ${escapeHtml(state.form.scenarioLabel || "Unnamed draft")}</p><h2>${escapeHtml(state.form.projectName || "Unnamed project draft")}</h2></div><p>Every run stores its validated input snapshot, full output, model version, assumptions, and time series together.</p></div>
    <div class="lab-grid">${renderControlPanel()}${renderVisualPanel()}${renderTelemetryPanel()}</div>
    <div class="lab-analysis-grid">${renderChartPanel()}${renderComparisonPanel()}</div>
    <section class="assumptions-panel"><div><h3>Interpretation boundary</h3><p>Use this panel to compare parameterized scenarios, not to infer a validated cultivation recipe. The browser visualizes the same deterministic state that feeds the table and export.</p><div class="analysis-footer"><button class="sim-button" type="button" data-action="export-csv"${state.output ? "" : " disabled"}>↓ Export time series CSV</button><button class="sim-button" type="button" data-action="save-note"${state.output ? "" : " disabled"}>✎ Add run note</button></div></div><ol>${(state.output?.assumptions || ["X is biomass concentration in g/L; K is an illustrative carrying capacity.", "Integration uses fixed-step forward Euler with dt expressed in days.", "Response factors are optional and use bounded illustrative functions.", "Organism labels are references; parameters are not species measurements."]).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol></section>`;
}

function drawChart() {
  const canvas = document.querySelector("#biomassChart");
  const output = state.output;
  if (!canvas || !output) return;
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(300, rect.width);
  const height = Math.max(180, rect.height);
  canvas.width = Math.floor(width * ratio); canvas.height = Math.floor(height * ratio);
  const context = canvas.getContext("2d");
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, width, height);
  const points = output.timeSeries;
  const padding = { top: 12, right: 13, bottom: 28, left: 46 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;
  const max = Math.max(...points.map((point) => point.biomassG_L), output.modelConfigurationSnapshot.configuration.carryingCapacityG_L * .1, .001);
  const maxTime = Math.max(points.at(-1).timeHours, 1);
  const x = (time) => padding.left + (time / maxTime) * plotW;
  const y = (value) => padding.top + plotH - (value / max) * plotH;
  context.font = "9px IBM Plex Mono, monospace";
  context.strokeStyle = "rgba(163,225,170,.10)"; context.lineWidth = 1;
  for (let index = 0; index <= 4; index += 1) {
    const yy = padding.top + plotH * index / 4;
    context.beginPath(); context.moveTo(padding.left, yy); context.lineTo(width - padding.right, yy); context.stroke();
    context.fillStyle = "#71877a"; context.fillText(formatNumber(max * (1 - index / 4), 2), 3, yy + 3);
  }
  context.fillStyle = "#71877a"; context.fillText("0 h", padding.left, height - 7); context.fillText(`${formatNumber(maxTime, 0)} h`, width - padding.right - 32, height - 7);
  const fill = context.createLinearGradient(0, padding.top, 0, height - padding.bottom);
  fill.addColorStop(0, "rgba(145,228,156,.28)"); fill.addColorStop(1, "rgba(145,228,156,0)");
  context.beginPath(); points.forEach((point, index) => index ? context.lineTo(x(point.timeHours), y(point.biomassG_L)) : context.moveTo(x(point.timeHours), y(point.biomassG_L))); context.lineTo(x(maxTime), height - padding.bottom); context.lineTo(padding.left, height - padding.bottom); context.closePath(); context.fillStyle = fill; context.fill();
  context.beginPath(); points.forEach((point, index) => index ? context.lineTo(x(point.timeHours), y(point.biomassG_L)) : context.moveTo(x(point.timeHours), y(point.biomassG_L))); context.strokeStyle = "#91e49c"; context.lineWidth = 2; context.stroke();
  const last = points.at(-1); context.fillStyle = "#b5ffc0"; context.beginPath(); context.arc(x(last.timeHours), y(last.biomassG_L), 3.5, 0, Math.PI * 2); context.fill();
}

function renderSimulations() {
  const runs = projectRuns();
  const comparison = state.comparison;
  return `${renderPageHeading("Simulation archive · versioned traces", "Every run leaves a trail.", "Open a saved input snapshot, compare two scenarios, or export the exact time series that the model produced.", `<div class="toolbar-actions"><button class="sim-button primary" type="button" data-view="laboratory">＋ New simulation</button><button class="sim-button" type="button" data-action="export-state">↓ Export workspace JSON</button></div>`)}
    <div class="view-toolbar"><p><strong>${runs.length}</strong> saved run${runs.length === 1 ? "" : "s"} · browser-local records · synthetic provenance attached</p><div class="toolbar-actions"><button class="sim-button small" type="button" data-action="clear-comparison"${comparison ? "" : " disabled"}>Clear comparison</button></div></div>
    ${runs.length ? `<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Scenario</th><th>Profile</th><th>Duration</th><th>Endpoint</th><th>Change</th><th>Actions</th></tr></thead><tbody>${[...runs].reverse().map((run) => { const input = run.parameters?.inputSnapshot; const metrics = run.metrics || {}; return `<tr><td><strong>${escapeHtml(run.label || "Untitled run")}</strong><small>${escapeHtml(formatDate(run.createdAt))}</small></td><td>${escapeHtml(input?.organism?.label || "Illustrative culture")}<small>${escapeHtml(input?.organism?.classification || "synthetic")}</small></td><td class="number">${formatNumber(input?.integration?.durationHours, 0)} h</td><td class="number">${formatNumber(metrics.finalBiomassG_L)} g/L</td><td class="number">${formatPercent(metrics.relativeChangePercent)}</td><td><div class="table-actions"><button class="sim-button small" type="button" data-action="load-run" data-run-id="${escapeHtml(run.id)}">Open</button><button class="sim-button small" type="button" data-action="export-run-csv" data-run-id="${escapeHtml(run.id)}">CSV</button><button class="sim-button small danger" type="button" data-action="delete-run" data-run-id="${escapeHtml(run.id)}">Delete</button></div></td></tr>`; }).join("")}</tbody></table></div>` : `<div class="sim-empty"><div><strong>Your archive is empty</strong><p>Runs created in the Virtual Laboratory appear here with their model and provenance snapshots.</p><button class="sim-button primary" type="button" data-view="laboratory">Configure first run</button></div></div>`}
     <section class="analysis-panel" style="margin-top:13px"><div class="panel-heading"><div><h2>Compare saved scenarios</h2><p>Compare stored outputs from the active project without silently rerunning evidence.</p></div><span class="sim-provenance">reproducible</span></div><div class="compare-box"><div class="compare-row"><label class="field-group"><span class="field-label">Reference</span><select class="sim-select" id="compareLeft"><option value="">Choose a run</option>${runs.map((run) => `<option value="${escapeHtml(run.id)}"${run.id === (state.comparisonSelection?.leftRunId || "") ? " selected" : ""}>${escapeHtml(run.label || run.id)}</option>`).join("")}</select></label><span>vs</span><label class="field-group"><span class="field-label">Variant</span><select class="sim-select" id="compareRight"><option value="">Choose a run</option>${runs.map((run) => `<option value="${escapeHtml(run.id)}"${run.id === (state.comparisonSelection?.rightRunId || "") ? " selected" : ""}>${escapeHtml(run.label || run.id)}</option>`).join("")}</select></label></div><button class="sim-button" type="button" data-action="compare-runs"${runs.length < 2 ? " disabled" : ""}>Compare stored outputs</button>${comparison ? `<div class="compare-result"><div><span>Changed parameter paths</span><strong>${comparison.changedParameterPaths.length || "none"}</strong></div><div><span>Endpoint difference</span><strong>${formatNumber(comparison.metrics.difference.finalBiomassG_L)} g/L</strong></div><div><span>Growth-rate difference</span><strong>${formatNumber(comparison.metrics.difference.endpointGrowthRatePerDay, 4)} / day</strong></div></div>` : ""}</div></section>`;
}

function renderStrains() {
  const symbols = ["◌", "✣", "◍", "⌁", "✦", "◉"];
  return `${renderPageHeading("Reference profile explorer · illustrative", "Start with a label. Question the defaults.", "These profiles help organize experiments around familiar organism names. Their parameters are placeholders for interface exploration, not species measurements.")}
    <div class="view-toolbar"><p><strong>${profiles.length}</strong> reference labels · all marked reference / illustrative</p><div class="toolbar-actions"><span class="sim-provenance">no identification claim</span></div></div>
    <div class="catalog-grid">${profiles.map((profile, index) => `<article class="catalog-card"><div class="catalog-card-top"><div><h2>${escapeHtml(profile.label)}</h2><p class="latin">${escapeHtml(profile.scientificName)}</p></div><span class="strain-mark">${symbols[index % symbols.length]}</span></div><p>${escapeHtml(profile.parameterBasis)}. Use this card to seed a scenario, then adjust the environment explicitly.</p><div class="card-bottom"><small>${escapeHtml(profile.classification)}<br>${escapeHtml(profile.provenance.label)}</small><button type="button" data-action="select-profile" data-profile-id="${escapeHtml(profile.profileId)}">Use in laboratory →</button></div></article>`).join("")}</div>
    <section class="assumptions-panel" style="margin-top:14px"><div><h3>Why the label is not the measurement</h3><p>The engine preserves the selected label in every input and output snapshot so a reader can see what was explored. It intentionally does not turn a named organism into an evidence-backed calibration.</p></div><ol><li>Parameters remain editable in the Simulation Studio.</li><li>Every run stores its model configuration.</li><li>Exports retain assumptions and provenance.</li></ol></section>`;
}

function renderExperiments() {
  const experiments = [...projectExperiments()].reverse();
  return `${renderPageHeading("Experiment register · local records", "Questions with a place to live.", "An experiment links a hypothesis, protocol, parameter snapshot, and one or more saved simulation runs.", `<div class="toolbar-actions"><button class="sim-button primary" type="button" data-view="laboratory">＋ New experiment</button></div>`)}
    ${experiments.length ? `<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Experiment</th><th>Project</th><th>Status</th><th>Model</th><th>Created</th><th></th></tr></thead><tbody>${experiments.map((experiment) => { const project = state.db.getProject(experiment.projectId); return `<tr><td><strong>${escapeHtml(experiment.title)}</strong><small>${escapeHtml(experiment.hypothesis || "No hypothesis entered")}</small></td><td>${escapeHtml(project?.name || "Unlinked project")}</td><td><span class="status-pill ${experiment.status === "failed" ? "red" : ""}">${escapeHtml(experiment.status)}</span></td><td class="number">${escapeHtml(experiment.parameters?.modelVersion || MODEL_VERSION)}</td><td>${escapeHtml(formatDate(experiment.createdAt))}</td><td><button class="sim-button small" type="button" data-view="simulations">View runs</button></td></tr>`; }).join("")}</tbody></table></div>` : `<div class="sim-empty"><div><strong>No experiments registered</strong><p>Run a scenario and the lab will create a linked experiment record with its hypothesis and protocol boundary.</p><button class="sim-button primary" type="button" data-view="laboratory">Start an experiment</button></div></div>`}`;
}

function explainRun(question = "") {
  const output = state.output;
  if (!output) return { heading: "The assistant is ready", paragraphs: [question.trim() ? `I received: “${question.trim()}”. There is no completed trace to interpret yet.` : "There is no completed trace to interpret yet.", "Open the Virtual Laboratory, state a hypothesis, and run the model. Then return here to ask why the endpoint changed or which response factor mattered most."], bullets: ["Start with a short note in Notebook.", "Configure one scenario in Virtual Laboratory.", "Run it, then compare a duplicated scenario with one changed input."] };
  const metrics = output.derivedMetrics;
  const factors = output.timeSeries.at(-1);
  const ranked = [["light", factors.lightFactor], ["temperature", factors.temperatureFactor], ["pH", factors.pHFactor], ["nutrient", factors.nutrientFactor]].sort((left, right) => left[1] - right[1]);
  const weakest = ranked[0];
  const questionText = question.trim().toLowerCase();
  const focus = questionText.includes("why") || questionText.includes("factor") ? `The smallest endpoint response factor is ${weakest[0]} at ${formatNumber(weakest[1], 2)}. In this model, that term reduces the effective growth rate multiplicatively; it is not a diagnosis of a real culture.` : `The trace ends at ${formatNumber(metrics.finalBiomassG_L)} g/L after ${formatNumber(metrics.durationHours, 0)} hours, versus ${formatNumber(metrics.initialBiomassG_L)} g/L initially.`;
  return {
    heading: "Local model reading",
    paragraphs: [focus, `The endpoint net specific rate is ${formatNumber(metrics.endpointGrowthRatePerDay, 4)} per day and the relative change is ${formatPercent(metrics.relativeChangePercent)}. The result is fully determined by the stored input snapshot and ${output.engineVersion}.`],
    bullets: [`Light ${formatNumber(factors.lightFactor, 2)} · temperature ${formatNumber(factors.temperatureFactor, 2)} · pH ${formatNumber(factors.pHFactor, 2)} · nutrient ${formatNumber(factors.nutrientFactor, 2)}`, `Carrying capacity is ${formatNumber(output.modelConfigurationSnapshot.configuration.carryingCapacityG_L)} g/L in this illustrative configuration.`, "Try a duplicated scenario with one parameter changed, then compare the two traces."]
  };
}

function renderAssistant() {
  const answer = state.assistantAnswer || explainRun();
  return `${renderPageHeading("Assistant · local interpretation", "Ask the trace, not the model to pretend.", "This panel is a deterministic explanation layer over the local result. No remote AI provider is connected and no biological conclusion is generated.")}
    <div class="assistant-grid"><section class="assistant-panel"><h2>One question at a time</h2><p>Ask about the endpoint, the response factors, or what to compare next. The answer is generated from the current stored output only.</p><label class="field-group"><span class="field-label">Question <em>optional</em></span><textarea class="sim-textarea" id="assistantQuestion" placeholder="Why did the endpoint change?">${escapeHtml(state.assistantQuestion || "")}</textarea></label><button class="sim-button primary" type="button" data-action="assistant-run">Explain current trace</button><div class="assistant-disclaimer"><span>i</span><span>Local rule-based interpretation · synthetic computational data · not an AI conclusion or cultivation instruction.</span></div></section><section class="assistant-answer" aria-live="polite"><p class="sim-eyebrow">${state.output ? `Run / ${escapeHtml(state.output.scenario.label)}` : "No active run"}</p><h3>${escapeHtml(answer.heading)}</h3>${answer.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}${answer.bullets.length ? `<ul>${answer.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}</ul>` : ""}</section></div>`;
}

function renderNotebook() {
  const notes = [...projectNotes()].reverse();
  return `${renderPageHeading("Notebook · research notes", "Keep the reasoning beside the result.", `Notes for active project: ${state.project?.name || "current project"}. Notes are stored locally and can be linked to an experiment and run.`)}
    <div class="note-layout"><form class="note-editor" id="noteForm"><h2>New note</h2><label class="field-group"><span class="field-label">Title</span><input class="sim-input" name="noteTitle" type="text" maxlength="120" placeholder="Working hypothesis" value="${escapeHtml(state.noteDraft.title)}"></label><label class="field-group"><span class="field-label">Markdown note</span><textarea class="sim-textarea" name="noteContent" placeholder="What are you trying to learn?">${escapeHtml(state.noteDraft.content)}</textarea></label><button class="sim-button primary" type="submit" data-action="save-note">Save note locally</button></form><section class="note-list-panel"><div class="panel-heading"><div><h2>Saved entries</h2><p>${notes.length} local note${notes.length === 1 ? "" : "s"}</p></div><span class="sim-provenance">browser-local</span></div>${notes.length ? `<div class="note-list">${notes.map((note) => `<article class="note-card"><div class="note-card-head"><strong>${escapeHtml(note.title)}</strong><time>${escapeHtml(formatDate(note.createdAt))}</time></div><p>${escapeHtml(note.content || "Empty note")}</p><div class="analysis-footer"><span class="meta-chip">${note.runId ? "linked to run" : "project note"}</span><button class="sim-link-button" type="button" data-action="delete-note" data-note-id="${escapeHtml(note.id)}">Delete</button></div></article>`).join("")}</div>` : `<div class="sim-empty"><div><strong>No notes yet</strong><p>Write down the hypothesis before you turn a parameter into a conclusion.</p></div></div>`}</section></div>`;
}

function renderReports() {
  const output = state.output;
  if (!output) return `${renderPageHeading("Reports · exportable evidence", "A report starts with a run.", "Run a scenario first. The report will carry its versioned input, model assumptions, derived metrics, and time series.")}<div class="sim-empty"><div><strong>No completed run selected</strong><p>Reports are generated from actual local simulation outputs; nothing is fabricated to fill this page.</p><button class="sim-button primary" type="button" data-view="laboratory">Open laboratory</button></div></div>`;
  const metrics = output.derivedMetrics;
  const reportSnapshot = { format: output.format, scenario: output.scenario, organism: output.organism, modelVersion: output.modelVersion, engineVersion: output.engineVersion, derivedMetrics: metrics, assumptions: output.assumptions, integration: output.integration };
  return `${renderPageHeading("Reports · ${escapeHtml(output.scenario.label)}", "The result, with its boundary attached.", "Export a compact report for review or the full CSV time series for analysis.", `<div class="toolbar-actions"><button class="sim-button primary" type="button" data-action="export-report">↓ Export report JSON</button><button class="sim-button" type="button" data-action="export-csv">↓ Export CSV</button></div>`)}
     <section class="report-header"><div><p class="sim-eyebrow">${escapeHtml(output.organism.classification)}</p><h2>${escapeHtml(output.organism.label)} · ${escapeHtml(output.scenario.label)}</h2><p>Endpoint ${formatNumber(metrics.finalBiomassG_L)} g/L · relative change ${formatPercent(metrics.relativeChangePercent)} · ${formatNumber(metrics.durationHours, 0)} hour integration</p></div><span class="report-stamp">${state.outputSource === "stored" ? "STORED OUTPUT" : "RECOMPUTED / DISCLOSED"}<br>SYNTHETIC / COMPUTATIONAL</span></section>
    <div class="metric-strip">${renderMetricStrip(metrics).replace(/^<div class="metric-strip">|<\/div>$/g, "")}</div>
    <div class="report-sections"><section class="report-section"><h3>Snapshot</h3><pre>${escapeHtml(JSON.stringify(reportSnapshot, null, 2))}</pre></section><section class="report-section"><h3>Assumptions</h3><ol>${output.assumptions.map((assumption) => `<li style="margin:0 0 8px;color:var(--sim-mute);font-size:11px">${escapeHtml(assumption)}</li>`).join("")}</ol><div class="analysis-footer"><button class="sim-button" type="button" data-action="open-run-note">✎ Add a notebook interpretation</button><button class="sim-button" type="button" data-action="load-run" data-run-id="${escapeHtml(state.currentRun?.id || "")}"${state.currentRun ? "" : " disabled"}>Open in laboratory</button></div></section></div>`;
}

function renderSettings() {
  const backend = state.db.backendStatus();
  const storageLabel = state.db.storageKind === "localStorage" ? "localStorage" : "memory fallback";
  return `${renderPageHeading("Settings & data · explicit boundaries", "Own the record.", "The default workspace never contacts a server. Export or configure an optional endpoint only when you understand the storage boundary.")}
    <div class="settings-grid"><section class="settings-card"><h2>Local persistence</h2><p>Projects, experiments, runs, and notebook entries are namespaced to this browser profile. This is not an authenticated account.</p><div class="settings-stat"><span>Storage</span><strong>${escapeHtml(storageLabel)}</strong></div><div class="settings-stat"><span>Projects</span><strong>${state.db.count("projects")}</strong></div><div class="settings-stat"><span>Runs</span><strong>${state.db.count("runs")}</strong></div><div class="settings-stat"><span>Notes</span><strong>${state.db.count("notebookEntries")}</strong></div><div class="settings-actions"><button class="sim-button" type="button" data-action="export-state">↓ Export JSON</button><button class="sim-button" type="button" data-action="import-state">↑ Import JSON</button><input id="importStateFile" type="file" accept="application/json,.json" hidden></div></section><section class="settings-card"><h2>Optional development backend</h2><p>Only use an explicit HTTP(S) origin for the separately installed local Node persistence service. It has no authentication, authorization, or production deployment guarantee.</p><label class="field-group"><span class="field-label">API origin <em>optional</em></span><input class="sim-input" id="backendUrl" type="url" placeholder="http://127.0.0.1:8787" value="${escapeHtml(state.backendUrl)}"></label><div class="settings-stat"><span>Current mode</span><strong>${escapeHtml(backend.label || "local browser only")}</strong></div><div class="settings-stat"><span>Configured origin</span><strong>${escapeHtml(backend.baseUrl || "none")}</strong></div><div class="settings-actions"><button class="sim-button" type="button" data-action="configure-backend">Use this origin</button><button class="sim-button" type="button" data-action="sync-backend"${backend.configured ? "" : " disabled"}>Sync local state</button></div></section><section class="settings-card"><h2>Model contract</h2><p>The active engine keeps an explicit version snapshot with each result. This surface is for transparent exploration, not a validated digital twin.</p><div class="settings-stat"><span>Engine</span><strong>${ENGINE_VERSION}</strong></div><div class="settings-stat"><span>Model</span><strong>${MODEL_VERSION}</strong></div><div class="settings-stat"><span>Data origin</span><strong>synthetic-computational</strong></div></section><section class="settings-card"><h2>Reset local workspace</h2><p>Use export first if the records matter. Resetting removes this namespace from the current browser only.</p><div class="settings-actions"><button class="sim-button danger" type="button" data-action="reset-workspace">Reset records</button></div></section></div>`;
}

function render() {
  destroyRenderer();
  updateNavigation();
  document.querySelector("#projectChipText").textContent = state.project?.name || state.form?.projectName || "Untitled culture study";
  const selector = document.querySelector("#projectSelector");
  if (selector && state.db) {
    selector.innerHTML = state.db.listProjects().map((project) => `<option value="${escapeHtml(project.id)}"${project.id === state.project?.id ? " selected" : ""}>${escapeHtml(project.name)}</option>`).join("");
    selector.value = state.project?.id || "";
  }
  const views = { dashboard: renderDashboard, laboratory: renderLaboratory, simulations: renderSimulations, strains: renderStrains, experiments: renderExperiments, assistant: renderAssistant, notebook: renderNotebook, reports: renderReports, settings: renderSettings };
  viewRoot.innerHTML = `${renderPersistentWarning()}${(views[state.view] || renderLaboratory)()}`;
  if (state.view === "settings") {
    const backendCard = Array.from(viewRoot.querySelectorAll(".settings-card")).find((card) => card.querySelector("h2")?.textContent.trim() === "Optional development backend");
    if (backendCard) {
      const description = backendCard.querySelector("p");
      if (description) description.textContent = "Use an explicit HTTP(S) origin for the separately installed Node service. An optional X-API-Key stays in this browser session and is never exported with research data.";
      const urlInput = backendCard.querySelector("#backendUrl");
      if (urlInput && !backendCard.querySelector("#backendKey")) {
        urlInput.insertAdjacentHTML("afterend", `<label class="field-group"><span class="field-label">API key <em>session only</em></span><input class="sim-input" id="backendKey" type="password" autocomplete="off" placeholder="Only if the server requires one" value="${escapeHtml(state.backendKey)}"></label>`);
      }
      const settingsActions = backendCard.querySelector(".settings-actions");
      if (settingsActions && !settingsActions.querySelector('[data-action="backend-health"]')) {
        settingsActions.insertAdjacentHTML("beforeend", `<button class="sim-button" type="button" data-action="backend-health"${state.db.backendStatus().configured ? "" : " disabled"}>Check connection</button>`);
      }
    }
    const subtitle = viewRoot.querySelector(".sim-page-subtitle");
    if (subtitle) subtitle.textContent = "Local browser storage, project drafts, saved outputs, and workspace JSON are managed here. No backend or AI provider is connected on this route.";
  }
  document.querySelectorAll('[data-action="run"]').forEach((button) => { button.disabled = state.isRunning; });
  appRoot.dataset.simBoot = "ready";
  if (state.view === "laboratory") mountLaboratory();
  if (state.view === "reports" || state.view === "dashboard") window.requestAnimationFrame(drawChart);
}

function mountLaboratory() {
  const canvas = document.querySelector("#labCanvas");
  if (!canvas) return;
  state.renderer = new SimulationRenderer(canvas);
  state.renderer.setGeometry(state.form.geometry);
  state.renderer.setCamera(state.cameraName);
  const playback = playbackPoint();
  state.renderer.setState({ biomass: playback?.point.biomassG_L ?? state.form.initialBiomassG_L, carryingCapacity: Number(state.form.carryingCapacityG_L) || 2, running: state.isRunning });
  const loading = document.querySelector("#sceneLoading");
  loading?.classList.add("is-hidden");
  document.querySelector("#sceneStatus")?.classList.add("is-hidden");
  drawChart();
  const chart = document.querySelector("#biomassChart");
  if (chart && typeof ResizeObserver === "function") {
    state.chartResizeObserver = new ResizeObserver(drawChart);
    state.chartResizeObserver.observe(chart);
  }
}

function showValidation(error) {
  const target = document.querySelector("#validationMessage");
  if (!target) return;
  document.querySelectorAll("#simulationForm [aria-invalid]").forEach((field) => field.removeAttribute("aria-invalid"));
  const errors = error?.errors || [];
  const details = errors.slice(0, 8).map((entry) => `${entry.path}: ${entry.message}`).join(" · ") || error?.message || "Check the model inputs.";
  for (const entry of errors) {
    const fieldName = String(entry.path || "").replace(/^model\.environment\./, "").replace(/^initialConditions\./, "").replace(/^integration\./, "");
    const field = document.querySelector(`#simulationForm [name="${CSS.escape(fieldName)}"]`);
    field?.setAttribute("aria-invalid", "true");
  }
  target.textContent = details;
  target.classList.add("is-visible");
}

function clearValidation() {
  document.querySelector("#validationMessage")?.classList.remove("is-visible");
  document.querySelectorAll("#simulationForm [aria-invalid]").forEach((field) => field.removeAttribute("aria-invalid"));
}

function projectPatchFromForm() {
  syncFormFromDom();
  return { name: state.form.projectName, organism: profileLabel(state.form.organism), model: MODEL_VERSION, description: "A local-first synthetic microalgae growth investigation.", tags: ["synthetic", "computational"] };
}

function saveProject() {
  if (!persistProjectState({ showError: true })) return;
  showToast("Project, editable draft, and UI state saved locally.");
  render();
}

function nextFrame() {
  return new Promise((resolve) => {
    if (typeof window.requestAnimationFrame === "function") window.requestAnimationFrame(() => resolve());
    else window.setTimeout(resolve, 0);
  });
}

function commitCompletedRun(input, output, startedAt, endedAt) {
  assertValidSimulationOutput(output);
  const experimentId = recordId("experiment");
  const runId = recordId("run");
  commitAtomicSnapshot((snapshot) => {
    addOrUpdateSnapshotRecord(snapshot, "experiments", {
      id: experimentId,
      title: input.scenario.label,
      projectId: state.project.id,
      hypothesis: "How does this illustrative parameter set change the modeled biomass trace?",
      protocol: "Fixed-step Euler integration with explicit response factors; synthetic computational record.",
      parameters: { inputSnapshot: cloneJson(input), modelVersion: MODEL_VERSION, engineVersion: ENGINE_VERSION },
      status: "completed",
      tags: ["synthetic", input.organism.profileId],
      startedAt,
      endedAt,
    }, experimentId);
    addOrUpdateSnapshotRecord(snapshot, "runs", {
      id: runId,
      label: input.scenario.label,
      experimentId,
      status: "completed",
      parameters: { inputSnapshot: cloneJson(input), modelVersion: MODEL_VERSION, engineVersion: ENGINE_VERSION },
      summary: cloneJson(output.derivedMetrics),
      metrics: cloneJson(output.derivedMetrics),
      timeSeries: cloneJson(output.timeSeries),
      outputSnapshot: cloneJson(output),
      startedAt,
      endedAt,
    }, runId);
    const project = snapshot.collections.projects.find((entry) => entry.id === state.project.id);
    if (!project) throw new Error("The active project no longer exists in local records.");
    addOrUpdateSnapshotRecord(snapshot, "projects", { ...project, draft: cloneJson(state.form) }, project.id);
    upsertSettingsInSnapshot(snapshot, projectSettingsScope(project.id), {
      ...projectUiPayload(),
      currentRunId: runId,
      comparison: null,
      draftDirty: false,
      playbackIndex: output.timeSeries.length - 1,
      playbackTimeHours: output.timeSeries.at(-1).timeHours,
    });
    upsertSettingsInSnapshot(snapshot, "lab", { ...workspaceUiPayload(), activeProjectId: project.id });
  });
  const savedRun = state.db.getRun(runId);
  if (!savedRun?.outputSnapshot) throw new Error("The run commit completed without a stored output snapshot.");
  assertValidSimulationOutput(savedRun.outputSnapshot);
  return savedRun;
}

async function runCurrentSimulation() {
  if (state.isRunning) return;
  if (state.view !== "laboratory") setView("laboratory");
  await nextFrame();
  clearValidation();
  let input;
  try {
    input = inputFromForm();
  } catch (error) {
    showValidation(error);
    showToast(error.message || "The model inputs could not be validated.", "error");
    return;
  }
  const startedAt = nowIso();
  state.isRunning = true;
  state.input = cloneJson(input);
  render();
  await nextFrame();
  try {
    const output = runSimulation(input);
    assertValidSimulationOutput(output);
    const endedAt = nowIso();
    const savedRun = commitCompletedRun(input, output, startedAt, endedAt);
    state.input = input;
    state.output = cloneJson(savedRun.outputSnapshot);
    state.outputSource = "stored";
    state.currentRun = savedRun;
    state.form = formFromInput(input, String(state.form.projectName || "").trim(), state.form.geometry);
    state.draftDirty = false;
    state.playbackIndex = state.output.timeSeries.length - 1;
    state.playbackTimeHours = state.output.timeSeries.at(-1).timeHours;
    state.comparison = null;
    state.comparisonSelection = null;
    state.isRunning = false;
    showToast(`Run complete · ${formatNumber(state.output.derivedMetrics.finalBiomassG_L)} g/L endpoint`);
    render();
  } catch (error) {
    state.isRunning = false;
    state.output = null;
    state.outputSource = "none";
    markPersistenceFailure(error);
    render();
    showValidation(error);
    showToast(error.message || "The model could not be completed or saved.", "error");
  }
}

function resetForm() {
  state.form = createDefaultForm(state.form.organism || "arthrospira");
  state.form.projectName = state.project?.name || "Untitled culture study";
  state.draftDirty = Boolean(state.output);
  state.playbackIndex = state.output ? state.output.timeSeries.length - 1 : -1;
  state.playbackTimeHours = state.output?.timeSeries.at(-1)?.timeHours ?? null;
  persistProjectState({ showError: true });
  render(); showToast(state.output ? "Draft reset; the saved result was retained." : "Draft reset to the profile defaults.");
}

function switchProject(projectId) {
  if (!projectId || projectId === state.project?.id) return true;
  if (!persistProjectState({ showError: true })) return false;
  const project = state.db.getProject(projectId);
  if (!project) { showToast("That project is not available in this workspace.", "error"); return false; }
  restoreActiveProject(project);
  state.view = "laboratory";
  window.history.replaceState(null, "", "#laboratory");
  persistProjectState({ showError: true });
  render();
  showToast(`Opened project · ${project.name}`);
  return true;
}

function newProject() {
  try {
    if (!persistProjectState({ showError: true })) return;
    const count = state.db.count("projects") + 1;
    const projectId = recordId("project");
    const draft = createDefaultForm("arthrospira");
    commitAtomicSnapshot((snapshot) => {
      addOrUpdateSnapshotRecord(snapshot, "projects", { id: projectId, name: `Culture study ${count}`, description: "A local-first synthetic microalgae growth investigation.", organism: "Arthrospira", model: MODEL_VERSION, tags: ["synthetic", "computational"], draft }, projectId);
      upsertSettingsInSnapshot(snapshot, projectSettingsScope(projectId), { projectId, draft, currentRunId: null, comparison: null, cameraName: "overview", playbackIndex: -1, playbackTimeHours: null, draftDirty: false });
      upsertSettingsInSnapshot(snapshot, "lab", { activeProjectId: projectId, view: "laboratory" });
    });
    state.project = state.db.getProject(projectId);
    restoreActiveProject(state.project);
    state.view = "laboratory";
    window.history.replaceState(null, "", "#laboratory");
    render(); showToast("New local project created.");
  } catch (error) { showToast(`Project could not be created: ${error.message}`, "error"); }
}

function runOutputForUse(run, { allowRecompute = true } = {}) {
  if (run?.outputSnapshot !== undefined && run?.outputSnapshot !== null) {
    assertValidSimulationOutput(run.outputSnapshot);
    return { output: cloneJson(run.outputSnapshot), source: "stored" };
  }
  const snapshot = run?.parameters?.inputSnapshot;
  if (!snapshot) throw new Error("This run has no usable input snapshot.");
  if (!allowRecompute || !window.confirm("This older run has no stored output. Recompute it from the saved input snapshot? The original run remains unchanged and this will be labeled as recomputed.")) return null;
  const input = createSimulationInput(snapshot);
  const output = runSimulation(input);
  assertValidSimulationOutput(output);
  return { output, source: "recomputed" };
}

function loadRun(runId, { forceRecompute = false } = {}) {
  if (!runId) return;
  let run = state.db.getRun(runId);
  const ownerProjectId = runProjectId(run);
  if (!run || !ownerProjectId) { showToast("This run has no owning experiment or project.", "error"); return; }
  if (ownerProjectId !== state.project?.id && !switchProject(ownerProjectId)) return;
  run = state.db.getRun(runId);
  try {
    const snapshot = run?.parameters?.inputSnapshot;
    if (!snapshot) throw new Error("This run has no usable input snapshot.");
    state.input = createSimulationInput(snapshot);
    const resolved = runOutputForUse(run, { allowRecompute: forceRecompute || true });
    if (!resolved) return;
    state.output = resolved.output;
    state.outputSource = resolved.source;
    state.currentRun = run;
    state.form = formFromInput(state.input, state.project?.name || state.form.projectName, state.form.geometry);
    state.draftDirty = false;
    state.playbackIndex = state.output.timeSeries.length - 1;
    state.playbackTimeHours = state.output.timeSeries.at(-1).timeHours;
    state.view = "laboratory";
    window.history.replaceState(null, "", "#laboratory");
    persistProjectState({ showError: true });
    render(); showToast(resolved.source === "stored" ? "Saved run reopened from its stored output." : "Older run explicitly recomputed; the original saved run was not changed.");
  } catch (error) { showToast(`Run could not be reopened: ${error.message}`, "error"); }
}

function compareSavedRuns() {
  const leftId = document.querySelector("#compareLeft")?.value;
  const rightId = document.querySelector("#compareRight")?.value;
  const left = state.db.getRun(leftId);
  const right = state.db.getRun(rightId);
  if (!left || !right || runProjectId(left) !== state.project?.id || runProjectId(right) !== state.project?.id) { showToast("Choose two saved runs from the active project.", "error"); return; }
  try {
    const leftResolved = runOutputForUse(left);
    const rightResolved = runOutputForUse(right);
    if (!leftResolved || !rightResolved) return;
    state.comparison = compareScenarios(leftResolved.output, rightResolved.output);
    state.comparisonSelection = { leftRunId: left.id, rightRunId: right.id };
    persistProjectState({ showError: true });
    showToast(`Compared ${state.comparison.changedParametersCount} changed parameter path${state.comparison.changedParametersCount === 1 ? "" : "s"}.`);
    render();
  } catch (error) { showToast(`Comparison failed: ${error.message}`, "error"); }
}

function duplicateCurrentScenario() {
  try {
    const base = state.output?.inputSnapshot || inputFromForm();
    const next = duplicateScenario(base, { scenarioLabel: `${base.scenario.label} copy` });
    state.form = formFromInput(next, String(state.form.projectName || "").trim(), state.form.geometry);
    state.draftDirty = true;
    persistProjectState({ showError: true });
    render();
    showToast("Draft duplicate created; no new run was saved.");
  } catch (error) {
    showValidation(error);
    showToast(error.message || "The scenario could not be duplicated.", "error");
  }
}

function exportCurrentCsv() {
  if (!state.output) { showToast("Run a scenario before exporting a time series.", "error"); return; }
  downloadText(`${slug(state.output.scenario.label)}-time-series.csv`, exportTimeSeriesCsv(state.output), "text/csv;charset=utf-8");
  showToast("CSV time series downloaded.");
}

function exportCurrentReport() {
  if (!state.output) { showToast("Run a scenario before exporting a report.", "error"); return; }
  const report = { reportFormat: "orr-biologicals-algal-lab-report", reportVersion: 1, generatedAt: new Date().toISOString(), outputSource: state.outputSource, output: cloneJson(state.output) };
  downloadText(`${slug(state.output.scenario.label)}-report.json`, `${JSON.stringify(report, null, 2)}\n`, "application/json;charset=utf-8");
  showToast(state.outputSource === "stored" ? "Stored-output report downloaded." : "Recomputed-output report downloaded with disclosure.");
}

function exportRunCsv(runId) {
  const run = state.db.getRun(runId);
  if (!run) return;
  try {
    const resolved = runOutputForUse(run);
    if (!resolved) return;
    downloadText(`${slug(run.label || run.id)}-time-series.csv`, exportTimeSeriesCsv(resolved.output), "text/csv;charset=utf-8");
    showToast(resolved.source === "stored" ? "Stored run CSV downloaded." : "Recomputed run CSV downloaded with disclosure.");
  } catch (error) { showToast(`CSV export failed: ${error.message}`, "error"); }
}

function exportState() {
  downloadText("algal-digital-lab-workspace.json", state.db.exportJSON({ pretty: true }), "application/json;charset=utf-8");
  showToast("Workspace JSON downloaded.");
}

function validateWorkspaceSnapshot(snapshot) {
  const collections = snapshot?.collections;
  if (!collections || typeof collections !== "object") throw new Error("The workspace snapshot has no collections.");
  const projectIds = new Set(collections.projects.map((project) => project.id));
  const experimentIds = new Set(collections.experiments.map((experiment) => experiment.id));
  const runIds = new Set(collections.runs.map((run) => run.id));
  for (const experiment of collections.experiments) {
    if (experiment.projectId && !projectIds.has(experiment.projectId)) throw new Error(`Experiment ${experiment.id} points to a missing project.`);
    if (experiment.parameters?.inputSnapshot) createSimulationInput(experiment.parameters.inputSnapshot);
  }
  for (const run of collections.runs) {
    if (!run.experimentId || !experimentIds.has(run.experimentId)) throw new Error(`Run ${run.id} points to a missing experiment.`);
    if (run.parameters?.inputSnapshot) createSimulationInput(run.parameters.inputSnapshot);
    if (run.outputSnapshot !== undefined && run.outputSnapshot !== null) assertValidSimulationOutput(run.outputSnapshot);
  }
  for (const note of collections.notebookEntries) {
    if (note.projectId && !projectIds.has(note.projectId)) throw new Error(`Notebook entry ${note.id} points to a missing project.`);
    if (note.experimentId && !experimentIds.has(note.experimentId)) throw new Error(`Notebook entry ${note.id} points to a missing experiment.`);
    if (note.runId && !runIds.has(note.runId)) throw new Error(`Notebook entry ${note.id} points to a missing run.`);
  }
  for (const setting of collections.uiSettings) {
    const settings = setting.settings;
    if (!settings || typeof settings !== "object") throw new Error(`UI settings ${setting.scope} are not an object.`);
    if (settings.activeProjectId && !projectIds.has(settings.activeProjectId)) throw new Error(`UI settings ${setting.scope} point to a missing project.`);
    if (settings.currentRunId && !runIds.has(settings.currentRunId)) throw new Error(`UI settings ${setting.scope} point to a missing run.`);
    if (settings.comparison) {
      for (const id of [settings.comparison.leftRunId, settings.comparison.rightRunId]) if (id && !runIds.has(id)) throw new Error(`UI comparison in ${setting.scope} points to a missing run.`);
    }
  }
  return true;
}

function importStateFile(file) {
  if (!file) return;
  const maxBytes = 4 * 1024 * 1024;
  if (file.size > maxBytes) { showToast("Import rejected: workspace files are limited to 4 MiB.", "error"); return; }
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const raw = String(reader.result);
      if (new Blob([raw]).size > maxBytes) throw new Error("workspace files are limited to 4 MiB.");
      const temporary = createLabPersistence({ playerId: state.db.playerId, storage: createMemoryStorage() });
      temporary.importJSON(raw, { mode: "replace" });
      const imported = temporary.exportState();
      const current = state.db.exportState();
      const merged = { ...current, collections: {} };
      for (const type of ["projects", "experiments", "runs", "notebookEntries", "uiSettings"]) {
        const byId = new Map(current.collections[type].map((record) => [record.id, record]));
        for (const record of imported.collections[type]) byId.set(record.id, record);
        merged.collections[type] = Array.from(byId.values());
      }
      validateWorkspaceSnapshot(merged);
      state.db.importState(merged, { mode: "replace" });
      const activeSetting = getUiSettings("lab")?.settings;
      const active = state.db.getProject(activeSetting?.activeProjectId) || state.db.getProject(state.project?.id) || state.db.listProjects()[0];
      if (!active) throw new Error("The imported workspace contains no project.");
      restoreActiveProject(active);
      showToast("Workspace records imported and merged.");
      render();
    } catch (error) { showToast(`Import rejected: ${error.message}`, "error"); }
  });
  reader.readAsText(file);
}

function saveNoteFromForm() {
  const title = formValue("noteTitle", "").trim() || "Untitled research note";
  const content = formValue("noteContent", "").trim();
  if (!content) { showToast("Write a note before saving it.", "error"); return; }
  if (!state.project?.id) { showToast("Choose a project before saving a note.", "error"); return; }
  try {
    const noteId = recordId("notebook_entry");
    commitAtomicSnapshot((snapshot) => {
      if (state.currentRun && runProjectId(state.currentRun) !== state.project.id) throw new Error("The selected run does not belong to the active project.");
      addOrUpdateSnapshotRecord(snapshot, "notebookEntries", { id: noteId, title, content, projectId: state.project.id, experimentId: state.currentRun?.experimentId || null, runId: state.currentRun?.id || null, tags: ["synthetic", "local"] }, noteId);
    });
    state.noteDraft = { title: "", content: "" };
    showToast("Notebook entry saved locally.");
    render();
  } catch (error) { showToast(`Note could not be saved: ${error.message}`, "error"); }
}

function deleteNote(noteId) {
  if (!noteId) return;
  if (!window.confirm("Delete this notebook entry? This cannot be undone.")) return;
  try {
    if (!state.db.deleteNotebookEntry(noteId)) { showToast("Notebook entry was not found.", "error"); return; }
    showToast("Notebook entry deleted."); render();
  } catch (error) { markPersistenceFailure(error); showToast(`Notebook entry could not be deleted: ${error.message}`, "error"); }
}

function deleteRun(runId) {
  if (!runId) return;
  const run = state.db.getRun(runId);
  if (!run || runProjectId(run) !== state.project?.id) { showToast("That run is not in the active project.", "error"); return; }
  if (!window.confirm(`Delete saved run “${run.label || run.id}”? The immutable output will be removed.`)) return;
  try {
    commitAtomicSnapshot((snapshot) => {
      snapshot.collections.runs = snapshot.collections.runs.filter((entry) => entry.id !== runId);
      const project = snapshot.collections.projects.find((entry) => entry.id === state.project.id);
      if (project) addOrUpdateSnapshotRecord(snapshot, "projects", { ...project, draft: cloneJson(state.form) }, project.id);
      upsertSettingsInSnapshot(snapshot, projectSettingsScope(state.project.id), { ...projectUiPayload(), currentRunId: state.currentRun?.id === runId ? null : state.currentRun?.id, comparison: state.comparisonSelection && (state.comparisonSelection.leftRunId === runId || state.comparisonSelection.rightRunId === runId) ? null : state.comparisonSelection });
    });
    if (state.currentRun?.id === runId) { state.currentRun = null; state.output = null; state.input = null; state.outputSource = "none"; state.playbackIndex = -1; state.playbackTimeHours = null; }
    if (state.comparisonSelection?.leftRunId === runId || state.comparisonSelection?.rightRunId === runId) { state.comparison = null; state.comparisonSelection = null; }
    showToast("Run removed from this browser."); render();
  } catch (error) { markPersistenceFailure(error); showToast(`Run could not be deleted: ${error.message}`, "error"); }
}

function selectProfile(profileId) {
  if (!profileById.has(profileId)) return;
  syncFormFromDom();
  state.form = { ...state.form, organism: profileId };
  state.draftDirty = true;
  persistProjectState({ showError: true });
  setView("laboratory"); showToast(`${profileLabel(profileId)} selected; existing draft values were retained.`);
}

function runAssistant() {
  state.assistantQuestion = document.querySelector("#assistantQuestion")?.value || "";
  state.assistantAnswer = explainRun(state.assistantQuestion);
  render();
}

function configureBackend() {
  const value = document.querySelector("#backendUrl")?.value.trim() || "";
  const key = document.querySelector("#backendKey")?.value.trim() || "";
  try {
    if (value) sessionStorage.setItem(BACKEND_URL_STORAGE, value);
    else sessionStorage.removeItem(BACKEND_URL_STORAGE);
    if (key) sessionStorage.setItem(BACKEND_KEY_STORAGE, key);
    else sessionStorage.removeItem(BACKEND_KEY_STORAGE);
    state.db = createLabPersistence({ playerId: "digital-lab-local", ...backendOptions({ url: value, key }) });
    state.project = state.db.getProject(state.project?.id) || state.db.listProjects()[0] || state.db.createProject({ name: state.form.projectName || "Untitled culture study", description: "A local-first synthetic microalgae growth investigation.", organism: profileLabel(state.form.organism), model: MODEL_VERSION, tags: ["synthetic", "computational"] });
    state.backendUrl = value;
    state.backendKey = key;
    showToast(value ? "Backend configured. Check the connection before syncing." : "Backend cleared; local browser mode restored.");
    render();
  } catch (error) { showToast(`Backend origin rejected: ${error.message}`, "error"); }
}

async function checkBackend() {
  try {
    const result = await state.db.checkBackend();
    showToast(`Backend responded: ${result.service || "health check passed"}.`);
  } catch (error) {
    showToast(`Backend check failed: ${error.message}`, "error");
  }
}

async function syncBackend() {
  try { await state.db.syncToBackend(); showToast("Local workspace synced to the explicitly configured backend."); }
  catch (error) { showToast(`Backend sync failed: ${error.message}`, "error"); }
}

function resetWorkspace() {
  if (!window.confirm("Reset this entire local workspace? All projects, experiments, runs, comparisons, and notes will be permanently removed from this browser.")) return;
  try {
    const projectId = recordId("project");
    const draft = createDefaultForm("arthrospira");
    commitAtomicSnapshot((snapshot) => {
      for (const type of ["runs", "experiments", "notebookEntries", "uiSettings", "projects"]) snapshot.collections[type] = [];
      addOrUpdateSnapshotRecord(snapshot, "projects", { id: projectId, name: "Untitled culture study", description: "A local-first synthetic microalgae growth investigation.", organism: "Arthrospira", model: MODEL_VERSION, tags: ["synthetic", "computational"], draft }, projectId);
      upsertSettingsInSnapshot(snapshot, projectSettingsScope(projectId), { projectId, draft, currentRunId: null, comparison: null, cameraName: "overview", playbackIndex: -1, playbackTimeHours: null, draftDirty: false });
      upsertSettingsInSnapshot(snapshot, "lab", { activeProjectId: projectId, view: "laboratory" });
    });
    state.project = state.db.getProject(projectId);
    restoreActiveProject(state.project);
    state.view = "laboratory";
    window.history.replaceState(null, "", "#laboratory");
    state.output = null; state.input = null; state.currentRun = null; state.comparison = null;
    showToast("Local workspace reset."); render();
  } catch (error) { showToast(`Workspace could not be reset: ${error.message}`, "error"); }
}

function handleClick(event) {
  const target = event.target.closest("[data-action], [data-view]");
  if (!target) return;
  const { action, view } = target.dataset;
  if (view) { event.preventDefault(); setView(view); return; }
  if (!action) return;
  event.preventDefault();
  if (state.isRunning && action !== "camera") return;
  const actions = {
    run: runCurrentSimulation,
    "save-project": saveProject,
    "new-project": newProject,
    "reset-form": resetForm,
    "duplicate-scenario": duplicateCurrentScenario,
    "load-run": () => loadRun(target.dataset.runId),
    "recompute-current-run": () => loadRun(state.currentRun?.id, { forceRecompute: true }),
    "delete-run": () => deleteRun(target.dataset.runId),
    "export-csv": exportCurrentCsv,
    "export-report": exportCurrentReport,
    "export-run-csv": () => exportRunCsv(target.dataset.runId),
    "export-state": exportState,
    "import-state": () => document.querySelector("#importStateFile")?.click(),
    "save-note": () => { if (target.closest("#noteForm")) saveNoteFromForm(); else { state.noteDraft = { title: state.output ? `${state.output.scenario.label} interpretation` : "", content: "" }; setView("notebook"); } },
    "compare-runs": compareSavedRuns,
    "clear-comparison": () => { state.comparison = null; state.comparisonSelection = null; persistProjectState({ showError: true }); render(); },
    "select-profile": () => selectProfile(target.dataset.profileId),
    "delete-note": () => deleteNote(target.dataset.noteId),
    "assistant-run": runAssistant,
    "configure-backend": configureBackend,
    "backend-health": checkBackend,
    "sync-backend": syncBackend,
    "reset-workspace": resetWorkspace,
    "open-run-note": () => { state.noteDraft = { title: state.output ? `${state.output.scenario.label} interpretation` : "", content: "" }; setView("notebook"); },
    camera: () => { state.cameraName = target.dataset.camera; state.renderer?.setCamera(state.cameraName); document.querySelectorAll(".camera-button").forEach((button) => button.classList.toggle("is-active", button.dataset.camera === state.cameraName)); persistProjectState({ showError: false }); },
  };
  const callback = actions[action];
  if (callback) callback();
}

function handleChange(event) {
  const target = event.target;
  if (target.id === "importStateFile") { importStateFile(target.files?.[0]); return; }
  if (target.id === "projectSelector") { switchProject(target.value); return; }
  if (target.matches('[name="organism"]')) {
    const next = target.value;
    if (!profileById.has(next)) return;
    syncFormFromDom();
    state.form.organism = next;
    state.draftDirty = true;
    persistProjectState({ showError: true });
    render(); return;
  }
  if (target.matches('[name="geometry"]')) { state.form.geometry = target.value; state.draftDirty = true; state.renderer?.setGeometry(target.value); persistProjectState({ showError: true }); return; }
  if (target.matches("#compareLeft, #compareRight")) return;
  if (target.closest("#simulationForm")) { syncFormFromDom(); state.draftDirty = true; persistProjectState({ showError: false }); }
}

function handleInput(event) {
  if (event.target.id === "playbackScrubber") { updatePlayback(event.target.value); return; }
  if (event.target.matches('[name="noteTitle"], [name="noteContent"]')) state.noteDraft = { title: formValue("noteTitle", ""), content: formValue("noteContent", "") };
  if (event.target.closest("#simulationForm")) { syncFormFromDom(); state.draftDirty = true; persistProjectState({ showError: false }); }
}

function handleSubmit(event) {
  event.preventDefault();
  if (event.target.id === "simulationForm") runCurrentSimulation();
  if (event.target.id === "noteForm") saveNoteFromForm();
}

function init() {
  initializePersistence();
  document.addEventListener("click", handleClick);
  document.addEventListener("change", handleChange);
  document.addEventListener("input", handleInput);
  document.addEventListener("submit", handleSubmit);
  window.addEventListener("hashchange", () => { const next = readView(); if (next !== state.view) { state.view = next; render(); } });
  window.addEventListener("keydown", (event) => {
    const modifier = event.metaKey || event.ctrlKey;
    if (modifier && event.key.toLowerCase() === "s") { event.preventDefault(); saveProject(); }
    if (modifier && event.key === "Enter") { event.preventDefault(); runCurrentSimulation(); }
  });
  render();
}

init();
