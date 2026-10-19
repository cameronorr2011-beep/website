import { spawnSync } from "node:child_process";

const python = process.platform === "win32" ? "python" : "python3";
const pythonResult = spawnSync(python, ["-m", "unittest", "discover", "-s", "tools", "-p", "test_*.py"], { stdio: "inherit" });
if (pythonResult.error || pythonResult.status !== 0) {
  console.error(`Python test suite failed using ${python}:`, pythonResult.error?.message || `exit ${pythonResult.status}`);
  process.exit(pythonResult.status || 1);
}
const engineResult = spawnSync(process.execPath, ["tools/test_biorealm_engine.mjs"], { stdio: "inherit" });
if (engineResult.error || engineResult.status !== 0) {
  console.error("BioRealm engine test failed:", engineResult.error?.message || `exit ${engineResult.status}`);
  process.exit(engineResult.status || 1);
}

for (const test of [
  "tools/test_papertrail_literature.mjs",
  "tools/test_papertrail_groq.mjs",
  "tools/test_papertrail_orchestrator.mjs",
  "tools/test_papertrail_api.mjs",
]) {
  const result = spawnSync(process.execPath, [test], { stdio: "inherit" });
  if (result.error || result.status !== 0) {
    console.error(`PaperTrail test failed (${test}):`, result.error?.message || `exit ${result.status}`);
    process.exit(result.status || 1);
  }
}

process.exit(0);
