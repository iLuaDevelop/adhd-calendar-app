"use strict";

// electron/preload.ts
var import_electron = require("electron");
import_electron.contextBridge.exposeInMainWorld("electron", {
  ipcRenderer: {
    invoke: (channel, args) => import_electron.ipcRenderer.invoke(channel, ...args),
    on: (channel, func) => import_electron.ipcRenderer.on(channel, (event, ...args) => func(...args)),
    once: (channel, func) => import_electron.ipcRenderer.once(channel, (event, ...args) => func(...args)),
    removeListener: (channel, func) => import_electron.ipcRenderer.removeListener(channel, func)
  }
});
import_electron.contextBridge.exposeInMainWorld("electronAPI", {
  minimize: () => import_electron.ipcRenderer.invoke("window-minimize"),
  maximize: () => import_electron.ipcRenderer.invoke("window-maximize"),
  close: () => import_electron.ipcRenderer.invoke("window-close")
});
