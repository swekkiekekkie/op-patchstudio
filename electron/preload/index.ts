import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('opxy', {
  device: {
    status: () => ipcRenderer.invoke('device:status'),
    pull: () => ipcRenderer.invoke('device:pull'),
    cacheRoot: () => ipcRenderer.invoke('cache:root'),
    listPresets: () => ipcRenderer.invoke('cache:listPresets'),
    readText: (relativePath: string) => ipcRenderer.invoke('cache:readText', relativePath),
    readBytes: (relativePath: string) => ipcRenderer.invoke('cache:readBytes', relativePath),
    exportPresetZip: (presetName: string, zipBase64: string) =>
      ipcRenderer.invoke('cache:exportPresetZip', presetName, zipBase64),
  },
});
