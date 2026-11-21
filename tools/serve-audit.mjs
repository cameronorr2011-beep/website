process.env.HOST = "127.0.0.1";
process.env.PORT = process.env.AUDIT_PORT || "4173";
await import("./static-server.mjs");
