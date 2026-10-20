import { spawnSync } from "node:child_process";

const python = process.platform === "win32" ? "py" : "python3";
const pythonArgs = process.platform === "win32" ? ["-3.12"] : [];
const pythonResult = spawnSync(python, [...pythonArgs, "-m", "unittest", "discover", "-s", "tools", "-p", "test_*.py"], { stdio: "inherit" });
if (pythonResult.error || pythonResult.status !== 0) {
  console.error(`Python 3.12+ test suite failed using ${python}:`, pythonResult.error?.message || `exit ${pythonResult.status}`);
  process.exit(pythonResult.status || 1);
}
process.exit(0);
