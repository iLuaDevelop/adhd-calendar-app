import { contextBridge, ipcRenderer } from 'electron';

console.log('[Preload] Preload script loading...');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel: string, args: any[]) => {
      console.log('[Preload] IPC invoke called:', channel, args);
      return ipcRenderer.invoke(channel, ...args);
    },
    on: (channel: string, func: Function) =>
      ipcRenderer.on(channel, (event, ...args) => func(...args)),
    once: (channel: string, func: Function) =>
      ipcRenderer.once(channel, (event, ...args) => func(...args)),
    removeListener: (channel: string, func: Function) =>
      ipcRenderer.removeListener(channel, func as any),
  },
});

console.log('[Preload] Preload script loaded successfully. window.electron:', typeof window.electron);

