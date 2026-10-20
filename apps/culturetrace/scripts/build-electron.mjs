import { build } from "vite";

process.env.CULTURETRACE_ELECTRON = "1";
await build();
