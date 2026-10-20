import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import path from "node:path";

const files = [];
function visit(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) visit(full);
    else if (/\.(mjs|js|cjs)$/.test(entry.name)) files.push(full);
  }
}
visit(path.resolve(process.cwd(), "src"));
visit(path.resolve(process.cwd(), "electron"));
for (const file of files) {
  const mode = file.endsWith(".cjs") ? "--check" : "--check";
  execFileSync(process.execPath, [mode, file], { stdio: "inherit" });
}
console.log(`CultureTrace syntax lint: ${files.length} files checked`);
