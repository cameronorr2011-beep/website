import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  buildAiRequest,
  exportFindingsCsv,
  exportObservationsCsv,
  exportReportHtml,
  exportReportMarkdown,
  reportBundle,
  runAnalysis,
  suggestMapping,
  parseCsv,
  validateAiResponse,
} from "./core/index.mjs";
import { DEMO_CSV, DEMO_MAPPING } from "./demoData.js";

const NAV = [
  ["home", "Home", "Overview"],
  ["experiments", "Experiments", "Projects and runs"],
  ["datasets", "Datasets", "Import and map"],
  ["analyses", "Analyses", "Findings and charts"],
  ["reports", "Reports", "Exportable evidence"],
  ["settings", "Settings", "Privacy and AI"],
  ["help", "Help & Methods", "How to interpret results"],
];

const isDesktop = () => Boolean(window.cultureTrace?.platform === "desktop");

function formatNumber(value, digits = 3) {
  return value === null || value === undefined || !Number.isFinite(Number(value)) ? "—" : Number(value).toFixed(digits);
}

function StatusPill({ children, tone = "neutral" }) { return <span className={`status-pill status-${tone}`}>{children}</span>; }
function SectionHeading({ eyebrow, title, children }) { return <div className="section-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1></div>{children}</div>; }
function EmptyState({ title, body, action }) { return <div className="empty-state"><span className="empty-mark">＋</span><h2>{title}</h2><p>{body}</p>{action}</div>; }

function StageTimeline({ stages = [] }) {
  return <div className="stage-timeline" aria-label="Analysis workflow stages">{stages.map((stage) => <div className="stage" key={stage.id}><span className={`stage-dot ${stage.status}`} aria-hidden="true">{stage.status === "completed" ? "✓" : stage.status === "failed" ? "!" : "·"}</span><div><strong>{stage.name}</strong><p>{stage.reason}</p></div><StatusPill tone={stage.status === "completed" ? "good" : stage.status === "failed" ? "error" : "neutral"}>{stage.status}</StatusPill></div>)}</div>;
}

function MetricCard({ label, value, detail, tone = "neutral" }) {
  return <article className={`metric-card metric-${tone}`}><p>{label}</p><strong>{value}</strong><span>{detail}</span></article>;
}

function Chart({ report }) {
  const observations = new Map((report?.observations ?? []).map((item) => [item.id, item]));
  const chartSeries = (report?.series ?? []).map((series) => ({ series, points: series.pointsUsed.map((id) => observations.get(id)).filter(Boolean).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)) })).filter((item) => item.points.length > 1);
  if (!chartSeries.length) return <div className="chart-empty">Not enough timestamped measurements for a chart.</div>;
  const allPoints = chartSeries.flatMap(({ points, series }) => points.map((point) => ({ x: new Date(point.timestamp).getTime(), y: point.measurements[series.measure] }))).filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
  const minX = Math.min(...allPoints.map((point) => point.x)); const maxX = Math.max(...allPoints.map((point) => point.x));
  const minY = Math.min(...allPoints.map((point) => point.y)); const maxY = Math.max(...allPoints.map((point) => point.y));
  const xScale = (value) => 42 + (value - minX) / Math.max(1, maxX - minX) * 686;
  const yScale = (value) => 218 - (value - minY) / Math.max(1e-9, maxY - minY) * 172;
  const palette = ["#247c68", "#d08b47", "#6389a8", "#8b6d9c", "#b05c52"];
  return <div className="chart-wrap"><svg viewBox="0 0 760 270" role="img" aria-label={`Time series chart of ${report.dataset?.primaryMeasure ?? "measurements"}`}><line x1="42" y1="218" x2="728" y2="218" className="axis"/><line x1="42" y1="46" x2="42" y2="218" className="axis"/><text x="44" y="238" className="axis-label">{new Date(minX).toLocaleDateString()}</text><text x="650" y="238" className="axis-label">{new Date(maxX).toLocaleDateString()}</text><text x="8" y="52" className="axis-label">{formatNumber(maxY, 1)}</text><text x="14" y="218" className="axis-label">{formatNumber(minY, 1)}</text>{chartSeries.map(({ series, points }, index) => <g key={series.seriesId}><polyline fill="none" stroke={palette[index % palette.length]} strokeWidth="3" points={points.map((point) => `${xScale(new Date(point.timestamp).getTime())},${yScale(point.measurements[series.measure])}`).join(" ")} />{points.map((point) => <circle key={point.id} cx={xScale(new Date(point.timestamp).getTime())} cy={yScale(point.measurements[series.measure])} r="4.5" fill={palette[index % palette.length]}><title>{`${point.id}: ${formatNumber(point.measurements[series.measure])} ${series.unit}`}</title></circle>)}</g>)}</svg><div className="chart-legend">{chartSeries.map(({ series }, index) => <span key={series.seriesId}><i style={{ background: palette[index % palette.length] }} />{series.seriesId}</span>)}</div><p className="chart-note">Raw observations only. Missing values are not interpolated; flagged observations remain visible.</p></div>;
}

function FindingList({ findings, selectedId, onSelect }) {
  return <div className="finding-list">{findings.map((finding) => <button className={`finding-row ${selectedId === finding.id ? "selected" : ""}`} key={finding.id} type="button" onClick={() => onSelect(finding.id)}><span className={`severity-dot severity-${finding.severity}`} aria-label={finding.severity} /><span className="finding-copy"><strong>{finding.title}</strong><small>{finding.description}</small></span><StatusPill tone={finding.severity === "error" ? "error" : finding.severity === "warning" ? "warn" : finding.severity === "info" ? "good" : "neutral"}>{finding.severity}</StatusPill></button>)}</div>;
}

export default function App() {
  const [page, setPage] = useState(() => window.location.hash.slice(1) || "home");
  const [report, setReport] = useState(null);
  const [csvText, setCsvText] = useState("");
  const [filename, setFilename] = useState("demo-culturetrace.csv");
  const [table, setTable] = useState(null);
  const [mapping, setMapping] = useState(DEMO_MAPPING);
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [notice, setNotice] = useState({ tone: "info", text: "" });
  const [busy, setBusy] = useState(false);
  const [aiSettings, setAiSettings] = useState({ provider: "Groq", model: "openai/gpt-oss-20b", configured: false });
  const [aiKey, setAiKey] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const fileInput = useRef(null);

  const goto = (next) => { setPage(next); window.history.replaceState(null, "", `#${next}`); };
  const saveState = async (nextReport) => {
    const state = { projects: [{ id: "current-project", name: "CultureTrace workspace", filename, savedAt: new Date().toISOString(), report: nextReport }], settings: { model: aiSettings.model, aiEnabled: aiSettings.configured } };
    if (isDesktop()) await window.cultureTrace.saveState(state);
    else localStorage.setItem("culturetrace.state.v1", JSON.stringify(state));
  };
  const analyze = async (text, name, requestedMapping = null) => {
    setBusy(true); setNotice({ tone: "info", text: "Importing and running deterministic checks…" });
    try {
      const parsed = parseCsv(text, { filename: name, sourceId: `source-${Date.now()}` });
      const suggested = requestedMapping ?? suggestMapping(parsed);
      setCsvText(text); setFilename(name); setTable(parsed); setMapping(suggested);
      const next = runAnalysis({ csv: text, source: { filename: name, sourceId: parsed.source.sourceId }, mapping: suggested });
      setReport(next); setSelectedFinding(next.findings?.[0]?.id ?? null); await saveState(next);
      setNotice({ tone: next.status === "completed" ? "success" : "warn", text: next.status === "completed" ? `Analysis complete: ${next.findings.length} evidence-linked findings.` : "Mapping is ready for review before analysis." });
      goto(next.status === "completed" ? "analyses" : "datasets");
    } catch (error) { setNotice({ tone: "error", text: error?.message || "The dataset could not be imported." }); }
    finally { setBusy(false); }
  };
  const runMappedAnalysis = async () => { if (csvText) await analyze(csvText, filename, mapping); };
  const openDemo = () => analyze(DEMO_CSV, "culturetrace-demonstration.csv", DEMO_MAPPING);
  const importFile = async (file) => { if (!file) return; await analyze(await file.text(), file.name); };
  const openDataset = async () => {
    if (isDesktop()) { try { const result = await window.cultureTrace.openDataset(); if (!result?.canceled) await analyze(result.text, result.filename); } catch (error) { setNotice({ tone: "error", text: error.message }); } }
    else fileInput.current?.click();
  };
  const exportFile = async (format) => {
    if (!report) return;
    const bundle = reportBundle(report);
    const content = format === "json" ? bundle.json : format === "markdown" ? bundle.markdown : format === "html" ? bundle.html : format === "findings-csv" ? bundle.findingsCsv : bundle.observationsCsv;
    if (isDesktop()) { const result = await window.cultureTrace.saveExport({ format, content, defaultName: `culturetrace-${format}.${format === "findings-csv" || format === "observations-csv" ? "csv" : format}` }); if (!result?.canceled) setNotice({ tone: "success", text: `Saved ${result.path}.` }); }
    else { const blob = new Blob([content], { type: format === "html" ? "text/html" : "text/plain" }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `culturetrace-${format}.${format === "findings-csv" || format === "observations-csv" ? "csv" : format}`; link.click(); URL.revokeObjectURL(link.href); setNotice({ tone: "success", text: "Export downloaded by the browser." }); }
  };
  const requestAi = async () => {
    if (!report || !isDesktop()) { setAiMessage("Cloud explanations are available in the desktop app after you configure your own Groq key."); return; }
    setAiBusy(true); setAiMessage("Sending only the minimized analysis summary…");
    try { const result = await window.cultureTrace.explain(buildAiRequest(report)); if (result.status !== "completed") throw new Error(result.message || "Groq explanation was unavailable."); const validated = validateAiResponse(result.payload, report); const next = { ...report, ai: { status: "completed", ...validated } }; setReport(next); await saveState(next); setAiMessage(`${validated.suggestions.length} AI suggestions validated against existing evidence.`); } catch (error) { setAiMessage(error.message); }
    finally { setAiBusy(false); }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const stored = isDesktop() ? await window.cultureTrace.loadState() : JSON.parse(localStorage.getItem("culturetrace.state.v1") || "null");
        const savedReport = stored?.projects?.[0]?.report;
        if (savedReport) { setReport(savedReport); setSelectedFinding(savedReport.findings?.[0]?.id ?? null); setNotice({ tone: "success", text: "Restored the last local analysis." }); }
        else await analyze(DEMO_CSV, "culturetrace-demonstration.csv", DEMO_MAPPING);
        if (isDesktop()) setAiSettings(await window.cultureTrace.loadAiSettings());
      } catch { await analyze(DEMO_CSV, "culturetrace-demonstration.csv", DEMO_MAPPING); }
    };
    load();
  }, []); // The first-run restore intentionally happens once.

  const selected = report?.findings?.find((finding) => finding.id === selectedFinding);
  const selectedEvidence = selected ? report.evidence.filter((item) => selected.evidenceIds.includes(item.id)) : [];
  const summary = useMemo(() => {
    const findings = report?.findings ?? [];
    return { errors: findings.filter((item) => item.severity === "error").length, review: findings.filter((item) => item.severity === "review" || item.severity === "warning").length, series: report?.series?.length ?? 0, rows: report?.dataset?.rows ?? 0 };
  }, [report]);

  return <div className="ct-shell">
    <input ref={fileInput} className="visually-hidden" type="file" accept=".csv,.tsv,.txt,text/csv" onChange={(event) => importFile(event.target.files?.[0])} />
    <aside className="ct-sidebar">
      <a className="ct-brand" href="#home" onClick={(event) => { event.preventDefault(); goto("home"); }}><span className="brand-symbol" aria-hidden="true">⌁</span><span><strong>CultureTrace</strong><small>ORR BIOLOGICALS</small></span></a>
      <div className="sidebar-rule" />
      <nav aria-label="CultureTrace workspace">{NAV.map(([id, label, detail]) => <button className={`nav-item ${page === id ? "active" : ""}`} type="button" key={id} onClick={() => goto(id)}><span className="nav-glyph" aria-hidden="true">{id === "home" ? "⌂" : id === "experiments" ? "◌" : id === "datasets" ? "▤" : id === "analyses" ? "⌁" : id === "reports" ? "▱" : id === "settings" ? "⚙" : "?"}</span><span><strong>{label}</strong><small>{detail}</small></span></button>)}</nav>
      <div className="sidebar-bottom"><div className="privacy-chip"><span className="lock-mark">▣</span><span><strong>Local-first</strong><small>Cloud AI is opt-in</small></span></div><p>Core analysis works offline. v0.1.0</p></div>
    </aside>
    <main className="ct-main">
      <header className="ct-topbar"><div><p className="top-kicker">SCIENTIFIC WORKSPACE <span>·</span> {isDesktop() ? "DESKTOP MODE" : "BROWSER MODE"}</p><p className="top-path">{NAV.find(([id]) => id === page)?.[1] ?? "Home"}</p></div><div className="top-actions"><button className="button button-quiet" type="button" onClick={() => goto("help")}>Methods</button><button className="button button-primary" type="button" onClick={openDataset}>Import CSV</button></div></header>
      {notice.text && <div className={`notice notice-${notice.tone}`} role="status"><span>{notice.tone === "error" ? "!" : notice.tone === "success" ? "✓" : "i"}</span>{notice.text}<button type="button" aria-label="Dismiss notification" onClick={() => setNotice({ tone: "info", text: "" })}>×</button></div>}
      <div className="ct-content">
        {page === "home" && <HomePage report={report} summary={summary} busy={busy} onDemo={openDemo} onImport={openDataset} onNavigate={goto} />}
        {page === "experiments" && <ExperimentsPage report={report} onDemo={openDemo} onNavigate={goto} />}
        {page === "datasets" && <DatasetsPage report={report} table={table} mapping={mapping} setMapping={setMapping} busy={busy} onImport={openDataset} onRun={runMappedAnalysis} onDemo={openDemo} />}
        {page === "analyses" && <AnalysesPage report={report} summary={summary} selected={selected} selectedEvidence={selectedEvidence} selectedId={selectedFinding} onSelect={setSelectedFinding} onNavigate={goto} onAi={requestAi} aiBusy={aiBusy} aiMessage={aiMessage} />}
        {page === "reports" && <ReportsPage report={report} onExport={exportFile} onNavigate={goto} />}
        {page === "settings" && <SettingsPage settings={aiSettings} aiKey={aiKey} setAiKey={setAiKey} onSaveKey={async () => { const result = isDesktop() ? await window.cultureTrace.saveAiKey(aiKey) : { configured: false, reason: "browser-mode" }; setAiSettings((current) => ({ ...current, configured: result.configured })); setAiKey(""); setNotice({ tone: result.configured ? "success" : "warn", text: result.configured ? "The key is stored using the operating system secure-storage facility." : (result.reason === "browser-mode" ? "Browser mode never accepts or stores provider keys." : "Secure OS storage is unavailable; the key was not stored." ) }); }} />}
        {page === "help" && <HelpPage />}
      </div>
      <footer className="ct-footer"><span>CultureTrace core {report?.engineVersion ?? "culturetrace-core-0.1.0"}</span><span>Findings are evidence-linked, not diagnoses.</span><button type="button" onClick={() => goto("settings")}>Privacy &amp; AI settings</button></footer>
    </main>
  </div>;
}

function HomePage({ report, summary, busy, onDemo, onImport, onNavigate }) {
  return <div className="page page-home">
    <section className="hero-panel"><div className="hero-copy"><p className="eyebrow">EVIDENCE BEFORE EXPLANATION</p><h1>See what your experiment actually shows.</h1><p className="hero-lede">CultureTrace turns a CSV of culture measurements into a traceable analysis: the checks are deterministic, the uncertainty is visible, and every finding can lead back to an observation.</p><div className="hero-actions"><button className="button button-primary button-large" type="button" onClick={onImport}>Import your dataset <span>→</span></button><button className="button button-outline button-large" type="button" onClick={onDemo}>Open demonstration</button></div><p className="hero-note"><span className="signal-dot" /> Demonstration data is synthetic and runs entirely offline.</p></div><div className="hero-visual"><div className="trace-orbit orbit-one" /><div className="trace-orbit orbit-two" /><div className="trace-core"><span>CT</span><small>TRACE<br />INDEX</small></div><div className="trace-path path-a" /><div className="trace-path path-b" /><div className="trace-tag tag-top">OBSERVATION <b>→</b> EVIDENCE</div><div className="trace-tag tag-bottom">LOCAL ANALYSIS · {report ? "READY" : "WAITING"}</div></div></section>
    <section className="section-block"><SectionHeading eyebrow="CURRENT WORKSPACE" title="A calm place to investigate the data."><button className="text-button" type="button" onClick={() => onNavigate("help")}>Read the methods <span>→</span></button></SectionHeading><div className="metric-grid"><MetricCard label="Observations" value={busy ? "…" : summary.rows || "—"} detail="Rows retained from source" tone="accent" /><MetricCard label="Series" value={summary.series || "—"} detail="Independent groups analyzed" /><MetricCard label="Needs review" value={summary.review} detail="Warnings and statistical flags" tone={summary.review ? "warn" : "good"} /><MetricCard label="Blocking errors" value={summary.errors} detail="Issues that need correction" tone={summary.errors ? "error" : "good"} /></div></section>
    <section className="split-intro"><div><p className="eyebrow">THE INVESTIGATION LOOP</p><h2>From raw measurement to defensible report.</h2></div><p>Start with an observation, not an explanation. CultureTrace preserves the source rows, applies explicit checks, and keeps optional AI narrative separate from the numbers that support it.</p></section>
    <section className="loop-grid">{[["01", "Import", "Bring in a CSV. Original values stay unchanged and local."], ["02", "Validate", "Find missingness, duplicates, time gaps, invalid values, and unusual readings."], ["03", "Trace", "Open a finding and inspect the exact evidence and calculation behind it."], ["04", "Report", "Export a reproducible report even when no AI provider is configured."]].map(([number, title, body]) => <article className="loop-card" key={number}><span>{number}</span><h3>{title}</h3><p>{body}</p></article>)}</section>
    <section className="release-strip"><div><p className="eyebrow">DESKTOP RELEASE</p><h2>CultureTrace 0.1.0 is an installable Windows build in development.</h2><p>The Electron shell, local project storage, secure preload boundary, and Windows packaging path are implemented. A public download will appear only after a signed release is published.</p></div><div className="release-actions"><StatusPill tone="warn">PUBLIC RELEASE PENDING</StatusPill><button className="text-button" type="button" onClick={() => onNavigate("help")}>Read methods and limitations →</button></div></section>
  </div>;
}

function ExperimentsPage({ report, onDemo, onNavigate }) {
  return <div className="page"><SectionHeading eyebrow="PROJECTS" title="Experiments"><button className="button button-primary" type="button" onClick={onDemo}>Open demonstration</button></SectionHeading><section className="experiment-card"><div className="experiment-status"><span className="status-pulse" /><StatusPill tone="good">ACTIVE WORKSPACE</StatusPill></div><div className="experiment-main"><div><h2>{report?.source?.filename ? report.source.filename.replace(/\.(csv|txt|tsv)$/i, "") : "No experiment loaded"}</h2><p>{report ? "A local analysis project with the latest dataset version and deterministic findings." : "Import a dataset or open the demonstration to create your first local project."}</p></div><button className="text-button" type="button" onClick={() => onNavigate(report ? "analyses" : "datasets")}>{report ? "Open analysis →" : "Start project →"}</button></div><div className="experiment-meta"><span><b>Source</b>{report?.source?.filename ?? "Waiting for import"}</span><span><b>Dataset version</b>{report ? report.source.digest : "—"}</span><span><b>Last status</b>{report?.status ?? "Not started"}</span></div></section><div className="two-column-note"><article className="info-card"><p className="eyebrow">LOCAL PROJECTS</p><h2>Nothing leaves this workspace by default.</h2><p>Projects are stored under the application data directory in desktop mode. Browser mode uses this browser profile only. Cloud AI is a separate, opt-in action.</p><button className="text-button" type="button" onClick={() => onNavigate("settings")}>Review privacy controls →</button></article><article className="info-card info-card-dark"><p className="eyebrow">REPRODUCIBILITY</p><h2>Every run carries its method.</h2><p>Dataset digest, mapping, policy thresholds, engine version, workflow stages, and evidence records travel with the report.</p><button className="text-button light" type="button" onClick={() => onNavigate("reports")}>Inspect report structure →</button></article></div></div>;
}

function DatasetsPage({ report, table, mapping, setMapping, busy, onImport, onRun, onDemo }) {
  const columns = table?.headers ?? [];
  const selectColumn = (field, value) => setMapping((current) => ({ ...current, [field]: value || null }));
  const measurementOptions = Object.entries(mapping?.measurements ?? {});
  return <div className="page"><SectionHeading eyebrow="DATASET INTAKE" title="Import and map"><div className="heading-actions"><button className="button button-outline" type="button" onClick={onDemo}>Use demo data</button><button className="button button-primary" type="button" onClick={onImport}>Import CSV</button></div></SectionHeading><section className="dataset-status"><div><span className="status-icon">{table ? "✓" : "＋"}</span><div><strong>{table ? table.source.filename : "No dataset loaded"}</strong><p>{table ? `${table.rows.length} rows · ${table.headers.length} columns · ${table.delimiter === "tab" ? "tab" : "comma"} delimiter` : "CSV, TSV, or semicolon-delimited text up to 50 MB."}</p></div></div>{table && <StatusPill tone={report?.status === "completed" ? "good" : "warn"}>{report?.status === "completed" ? "Analyzed" : "Mapping review"}</StatusPill>}</section>{!table ? <EmptyState title="Start with a dataset" body="CultureTrace will show a preview, suggest conservative column roles, and preserve the original source values." action={<button className="button button-primary" type="button" onClick={onImport}>Choose CSV file</button>} /> : <><section className="mapping-panel"><div className="panel-header"><div><p className="eyebrow">EXPLICIT MAPPING</p><h2>Tell CultureTrace what each column means.</h2></div><p className="panel-help">Suggestions are only suggestions. Confirm units before interpreting measurements.</p></div><div className="mapping-grid"><MappingSelect label="Culture / experiment ID" value={mapping.cultureId} columns={columns} onChange={(value) => selectColumn("cultureId", value)} required /><MappingSelect label="Timestamp" value={mapping.timestamp} columns={columns} onChange={(value) => selectColumn("timestamp", value)} /><MappingSelect label="Condition / treatment" value={mapping.condition} columns={columns} onChange={(value) => selectColumn("condition", value)} /><MappingSelect label="Replicate" value={mapping.replicate} columns={columns} onChange={(value) => selectColumn("replicate", value)} />{measurementOptions.map(([key, config]) => <div className="mapping-field" key={key}><label>{key === "od600" ? "Optical density (OD600)" : key}<select value={config.column} onChange={(event) => setMapping((current) => ({ ...current, measurements: { ...current.measurements, [key]: { ...config, column: event.target.value } } }))}>{columns.map((column) => <option value={column.name} key={column.name}>{column.name}</option>)}</select><small>Unit: {config.unit} · retained as a source mapping</small></label></div>)}</div><div className="mapping-actions"><span>{Object.keys(mapping.measurements ?? {}).length} measurement roles detected</span><button className="button button-primary" type="button" disabled={busy} onClick={onRun}>{busy ? "Running checks…" : "Run deterministic analysis →"}</button></div></section><section className="preview-panel"><div className="panel-header"><div><p className="eyebrow">SOURCE PREVIEW</p><h2>First {Math.min(8, table.rows.length)} rows · original text retained</h2></div><span className="muted-label">Warnings: {table.diagnostics.length}</span></div><div className="table-scroll"><table><thead><tr>{table.headers.map((header) => <th key={header.name}>{header.name}</th>)}</tr></thead><tbody>{table.rows.slice(0, 8).map((row) => <tr key={row.rowNumber}>{table.headers.map((header) => <td key={header.name}>{row.raw[header.name]}</td>)}</tr>)}</tbody></table></div></section></>}</div>;
}

function MappingSelect({ label, value, columns, onChange, required }) { return <div className="mapping-field"><label>{label}{required && <em> required</em>}<select value={value ?? ""} onChange={(event) => onChange(event.target.value)}><option value="">Not mapped</option>{columns.map((column) => <option value={column.name} key={column.name}>{column.name}</option>)}</select></label></div>; }

function AnalysesPage({ report, summary, selected, selectedEvidence, selectedId, onSelect, onNavigate, onAi, aiBusy, aiMessage }) {
  if (!report) return <div className="page"><EmptyState title="No analysis yet" body="Import a CSV or open the demonstration dataset to create an evidence-linked analysis." action={<button className="button button-primary" type="button" onClick={() => onNavigate("datasets")}>Go to datasets</button>} /></div>;
  return <div className="page"><SectionHeading eyebrow="DETERMINISTIC ANALYSIS" title="Findings and evidence"><div className="heading-actions"><button className="button button-outline" type="button" onClick={() => onNavigate("reports")}>Open report</button><button className="button button-primary" type="button" onClick={onAi} disabled={aiBusy}>{aiBusy ? "Explaining…" : "Ask Groq to explain"}</button></div></SectionHeading>{aiMessage && <div className="ai-message"><span>AI ASSIST</span>{aiMessage}</div>}<div className="analysis-summary"><div><p className="eyebrow">ANALYSIS ID</p><strong>{report.analysisId}</strong><p>{report.dataset.rows} source rows · {summary.series} independent series · {report.engineVersion}</p></div><div className="summary-stats"><span><b>{report.findings.length}</b> findings</span><span><b>{report.evidence.length}</b> evidence records</span><span><b>{report.diagnostics.length}</b> diagnostics</span></div></div><section className="analysis-grid"><div className="analysis-main"><div className="panel-header"><div><p className="eyebrow">OBSERVATION PLOT</p><h2>{report.dataset.primaryMeasure} across time</h2></div><span className="muted-label">No interpolation</span></div><Chart report={report} /><div className="panel-header findings-heading"><div><p className="eyebrow">EVIDENCE-LINKED FINDINGS</p><h2>What deserves a closer look?</h2></div><span className="muted-label">Select a row to inspect evidence</span></div><FindingList findings={report.findings} selectedId={selectedId} onSelect={onSelect} /></div><aside className="evidence-panel"><p className="eyebrow">INSPECTOR</p>{selected ? <><StatusPill tone={selected.severity === "error" ? "error" : selected.severity === "warning" ? "warn" : selected.severity === "info" ? "good" : "neutral"}>{selected.severity} · {selected.status}</StatusPill><h2>{selected.title}</h2><p>{selected.description}</p><div className="inspector-rule" /><h3>Evidence references</h3>{selectedEvidence.map((item) => <div className="evidence-item" key={item.id}><span>{item.kind}</span><strong>{item.label}</strong><code>{item.id}</code><small>{item.source?.algorithm || item.source?.rule || item.source?.origin}</small></div>)}<div className="limitation-box"><strong>Interpret carefully</strong><p>{selected.limitations?.[0] ?? "This finding is bounded by the available measurements and configured methods."}</p></div></> : <div className="inspector-empty"><span>⌁</span><h2>Select a finding</h2><p>The inspector will show its calculation, source rows, and limitations.</p></div>}</aside></section><section className="workflow-panel"><div className="panel-header"><div><p className="eyebrow">TRACEABLE WORKFLOW</p><h2>How this run was assembled</h2></div><p className="panel-help">AI is an optional final layer. It cannot change these completed deterministic stages.</p></div><StageTimeline stages={report.stages} /></section></div>;
}

function ReportsPage({ report, onExport, onNavigate }) {
  if (!report) return <div className="page"><EmptyState title="No report to export" body="Run an analysis first. Reports remain useful when AI is not configured." action={<button className="button button-primary" type="button" onClick={() => onNavigate("datasets")}>Prepare a dataset</button>} /></div>;
  return <div className="page"><SectionHeading eyebrow="REPRODUCIBLE OUTPUT" title="Reports"><div className="heading-actions"><button className="button button-outline" type="button" onClick={() => onExport("json")}>Export JSON</button><button className="button button-primary" type="button" onClick={() => onExport("pdf")}>Export PDF</button></div></SectionHeading><section className="report-hero"><div><StatusPill tone="good">DETERMINISTIC REPORT READY</StatusPill><h2>{report.source.filename}</h2><p>Report {report.analysisId} contains the source digest, mapping, methods, workflow status, findings, evidence, and limitations.</p></div><div className="report-digest"><span>Source digest</span><code>{report.source.digest}</code><span>AI layer</span><strong>{report.ai?.status === "completed" ? "Validated suggestions present" : "Not requested · core report complete"}</strong></div></section><section className="export-grid"><ExportCard title="Human-readable" detail="A clean Markdown report with methods, findings, and evidence index." action="Download Markdown" onClick={() => onExport("markdown")} /><ExportCard title="Web report" detail="A self-contained HTML report suitable for review or archiving." action="Download HTML" onClick={() => onExport("html")} /><ExportCard title="Analysis JSON" detail="Versioned machine-readable output for reproducibility and later inspection." action="Download JSON" onClick={() => onExport("json")} /><ExportCard title="Findings CSV" detail="Spreadsheet-friendly finding rows with formula-like text protected." action="Download findings CSV" onClick={() => onExport("findings-csv")} /><ExportCard title="Observations CSV" detail="Normalized observations with source-linked identifiers." action="Download observations CSV" onClick={() => onExport("observations-csv")} /><ExportCard title="PDF" detail={isDesktop() ? "Native save dialog and print-to-PDF export." : "PDF export is available from the installed desktop application."} action={isDesktop() ? "Export PDF" : "Desktop only"} onClick={() => isDesktop() && onExport("pdf")} disabled={!isDesktop()} /></section><section className="report-preview"><div className="panel-header"><div><p className="eyebrow">REPORT CONTENTS</p><h2>Nothing important is hidden behind AI.</h2></div><span className="muted-label">{report.findings.length} findings · {report.evidence.length} evidence records</span></div><div className="report-columns"><ul>{["Dataset identity and provenance", "Mapping and unit declarations", "Import warnings and diagnostics", "Executed workflow stages", "Series statistics and growth eligibility", "Findings with evidence IDs"].map((item) => <li key={item}><span>✓</span>{item}</li>)}</ul><ul>{["Charts with raw observations", "AI narrative, clearly labeled", "Limitations and uncertainty", "Suggested next checks", "Application and engine versions", "Reproducibility identifier"].map((item) => <li key={item}><span>✓</span>{item}</li>)}</ul></div></section></div>;
}

function ExportCard({ title, detail, action, onClick, disabled }) { return <article className={`export-card ${disabled ? "disabled" : ""}`}><span className="export-icon">↗</span><h3>{title}</h3><p>{detail}</p><button className="text-button" type="button" onClick={onClick} disabled={disabled}>{action} <span>→</span></button></article>; }

function SettingsPage({ settings, aiKey, setAiKey, onSaveKey }) {
  return <div className="page"><SectionHeading eyebrow="CONFIGURATION" title="Settings"><StatusPill tone={settings.configured ? "good" : "neutral"}>{settings.configured ? "AI configured" : "AI not configured"}</StatusPill></SectionHeading><div className="settings-layout"><section className="settings-card"><p className="eyebrow">GENERAL</p><h2>Workspace defaults</h2><div className="setting-row"><div><strong>Storage</strong><p>Projects are saved locally in the application data directory in desktop mode.</p></div><StatusPill tone="good">LOCAL</StatusPill></div><div className="setting-row"><div><strong>Core analysis</strong><p>CSV parsing, validation, statistics, charts, and reports work without a network connection.</p></div><StatusPill tone="good">OFFLINE READY</StatusPill></div><div className="setting-row"><div><strong>Outlier screen</strong><p>Median absolute deviation, threshold 3.5. Outliers are flagged, never deleted.</p></div><span className="setting-value">MAD · 3.5</span></div></section><section className="settings-card"><p className="eyebrow">OPTIONAL CLOUD AI</p><h2>Groq explanation service</h2><p className="settings-lede">AI can summarize verified findings and suggest questions. It does not calculate the authoritative numbers. A minimized analysis summary is sent only after you request an explanation.</p><div className="setting-row"><div><strong>Provider</strong><p>Groq OpenAI-compatible Chat Completions endpoint</p></div><span className="setting-value">{settings.provider}</span></div><div className="setting-row"><div><strong>Model</strong><p>Centralized default; availability depends on your Groq account.</p></div><code>{settings.model}</code></div><label className="key-field"><span>Your own Groq API key</span><input type="password" value={aiKey} onChange={(event) => setAiKey(event.target.value)} placeholder={isDesktop() ? "Stored only via secure OS storage" : "Unavailable in browser mode"} disabled={!isDesktop()} autoComplete="off" /><small>{isDesktop() ? "The renderer never receives the saved key. If secure OS storage is unavailable, the key is not stored." : "Browser mode never accepts a provider key. Use the installed desktop app."}</small></label><button className="button button-primary" type="button" onClick={onSaveKey} disabled={!isDesktop() || !aiKey.trim()}>Save key securely</button></section><section className="settings-card"><p className="eyebrow">PRIVACY</p><h2>What leaves this device?</h2><ul className="privacy-list"><li><span>01</span><div><strong>By default, nothing.</strong><p>Imported files, projects, and reports stay in local storage.</p></div></li><li><span>02</span><div><strong>On request, a minimized summary.</strong><p>Column descriptions, aggregate statistics, verified findings, evidence IDs, and limitations — not the raw CSV.</p></div></li><li><span>03</span><div><strong>Your provider account applies.</strong><p>Groq requests are subject to the model, account, rate, and cost limits configured by the provider.</p></div></li></ul></section><section className="settings-card about-card"><p className="eyebrow">ABOUT</p><h2>CultureTrace 0.1.0</h2><p>Evidence-first experiment analysis by Orr Biologicals. Built as a local-first desktop application with a browser-compatible preview.</p><p className="small-print">This tool is not a biosafety system, species identifier, contamination detector, or substitute for experimental judgment. Review the methods and limitations before acting on a result.</p></section></div></div>;
}

function HelpPage() {
  return <div className="page"><SectionHeading eyebrow="DOCUMENTATION" title="Help & Methods"><a className="button button-outline" href="https://github.com/cameronorr2011-beep/website" target="_blank" rel="noreferrer">Source repository ↗</a></SectionHeading><div className="methods-grid"><article className="method-card method-wide"><p className="eyebrow">START HERE</p><h2>What CultureTrace can and cannot establish.</h2><p>CultureTrace identifies structural quality issues and calculates descriptive summaries from the values you provide. It can highlight a missing measurement, an irregular time interval, a constant series, or a statistically unusual observation. It cannot decide whether a culture is contaminated, identify an organism, prove causation, or make a missing measurement true.</p><div className="guardrail-row"><span><b>Observed</b> values in the source</span><span><b>Derived</b> deterministic calculations</span><span><b>Unresolved</b> insufficient evidence</span><span><b>AI-suggested</b> optional hypotheses</span></div></article><article className="method-card"><p className="eyebrow">SUPPORTED INPUT</p><h2>CSV first.</h2><p>UTF-8 CSV, TSV, and semicolon-delimited files with quoted fields, escaped quotes, empty cells, and headers. A 50 MB default limit protects desktop responsiveness.</p><h3>Common roles</h3><p>Culture ID, condition, replicate, timestamp, elapsed hours, biomass, OD600, pH, temperature, dissolved oxygen, and light.</p></article><article className="method-card"><p className="eyebrow">STATISTICS</p><h2>Transparent by default.</h2><p>Descriptive statistics use finite values only. Growth estimates use ordinary least squares on ln(positive measurements) over days. Doubling time is shown only for a positive rate.</p><h3>Important limits</h3><p>No p-values or causal claims are produced. OD600 remains an optical measurement unless you supply a calibration outside this first release.</p></article><article className="method-card method-wide"><p className="eyebrow">WORKFLOW</p><h2>Five bounded stages.</h2><div className="method-steps">{["Parse", "Map", "Validate", "Summarize", "Trace findings"].map((step, index) => <div key={step}><span>0{index + 1}</span><strong>{step}</strong></div>)}</div><p className="small-print">Optional AI is a separate final action. It receives a minimized report summary, must reference existing evidence IDs, and cannot edit the deterministic report.</p></article></div></div>;
}
