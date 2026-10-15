import { spawnSync } from "node:child_process";

const python = process.platform === "win32" ? "python" : "python3";
const pythonResult = spawnSync(python, ["-m", "unittest", "discover", "-s", "tools", "-p", "test_*.py"], { stdio: "inherit" });
if (pythonResult.error || pythonResult.status !== 0) {
  console.error(`Python test suite failed using ${python}:`, pythonResult.error?.message || `exit ${pythonResult.status}`);
  process.exit(pythonResult.status || 1);
}
const engineResult = spawnSync(process.execPath, ["tools/test_biorealm_engine.mjs"], { stdio: "inherit" });
process.exit(engineResult.status || 0);
