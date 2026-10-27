import { parseState, serializeState } from "./lab-engine.js";

const KEY = "orr-biologicals-lab-v1";

export function storageAvailable() {
  try {
    const probe = "__orr_lab_probe__";
    localStorage.setItem(probe, "1");
    localStorage.removeItem(probe);
    return true;
  } catch { return false; }
}

export function loadState() {
  if (!storageAvailable()) return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? parseState(raw) : null;
  } catch { return null; }
}

export function saveState(state) {
  if (!storageAvailable()) return false;
  try {
    state.savedAt = new Date().toISOString();
    localStorage.setItem(KEY, serializeState(state));
    return true;
  } catch { return false; }
}

export function clearState() {
  try { localStorage.removeItem(KEY); } catch {}
}

export function downloadText(filename, text, type = "application/json") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadState(state) {
  downloadText(`orr-lab-${state.seed.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`, serializeState(state));
}
