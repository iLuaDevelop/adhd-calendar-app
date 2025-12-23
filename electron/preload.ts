import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel: string, args: any[]) =>
      ipcRenderer.invoke(channel, ...args),
    on: (channel: string, func: Function) =>
      ipcRenderer.on(channel, (event, ...args) => func(...args)),
    once: (channel: string, func: Function) =>
      ipcRenderer.once(channel, (event, ...args) => func(...args)),
    removeListener: (channel: string, func: Function) =>
      ipcRenderer.removeListener(channel, func as any),
  },
});
