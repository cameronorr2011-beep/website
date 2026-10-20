const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("cultureTrace", Object.freeze({
  platform: "desktop",
  openDataset: () => ipcRenderer.invoke("dataset:open"),
  loadState: () => ipcRenderer.invoke("state:load"),
  saveState: (state) => ipcRenderer.invoke("state:save", state),
  saveExport: (payload) => ipcRenderer.invoke("export:save", payload),
  loadAiSettings: () => ipcRenderer.invoke("ai:settings"),
  saveAiKey: (key) => ipcRenderer.invoke("ai:key", key),
  explain: (request) => ipcRenderer.invoke("ai:explain", request),
  openExternal: (url) => ipcRenderer.invoke("external:open", url),
}));
