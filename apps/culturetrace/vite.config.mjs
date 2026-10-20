import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    outDir: process.env.CULTURETRACE_ELECTRON === "1" ? path.resolve(process.cwd(), "dist") : path.resolve(process.cwd(), "../../culturetrace"),
    emptyOutDir: true,
    sourcemap: false,
  },
});
