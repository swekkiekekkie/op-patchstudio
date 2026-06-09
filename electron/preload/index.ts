import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('opxy', {
  device: {
    status: () => ipcRenderer.invoke('device:status'),
    pull: () => ipcRenderer.invoke('device:pull'),
    push: () => ipcRenderer.invoke('device:push'),
    cacheRoot: () => ipcRenderer.invoke('cache:root'),
    listPresets: () => ipcRenderer.invoke('cache:listPresets'),
    listStandaloneSamples: () => ipcRenderer.invoke('cache:listStandaloneSamples'),
    listSourceFolders: () => ipcRenderer.invoke('source:listFolders'),
    addSourceFolder: () => ipcRenderer.invoke('source:addFolder'),
    removeSourceFolder: (folderId: string) => ipcRenderer.invoke('source:removeFolder', folderId),
    scanSourceFolders: () => ipcRenderer.invoke('source:scanFolders'),
    copySourceSamplesToSet: (sourcePaths: string[], options?: { conflict: 'skip' | 'replace' }) =>
      ipcRenderer.invoke('source:copySamplesToSet', sourcePaths, options),
    copySourcePresetsToSet: (sourcePaths: string[], options?: { conflict: 'skip' | 'replace' }) =>
      ipcRenderer.invoke('source:copyPresetsToSet', sourcePaths, options),
    listCategories: () => ipcRenderer.invoke('cache:listCategories'),
    getPresetDetail: (relativePath: string) => ipcRenderer.invoke('cache:getPresetDetail', relativePath),
    renameSampleInPreset: (presetPath: string, oldFilename: string, newBase: string) =>
      ipcRenderer.invoke('cache:renameSampleInPreset', presetPath, oldFilename, newBase),
    renameStandaloneSample: (relativePath: string, newBase: string) =>
      ipcRenderer.invoke('cache:renameStandaloneSample', relativePath, newBase),
    writePreset: (payload: {
      category: string;
      presetName: string;
      patchJson: string;
      files: Array<{ name: string; data: number[] }>;
    }) => ipcRenderer.invoke('cache:writePreset', payload.category, payload.presetName, payload.patchJson, payload.files),
    restoreBackup: (backupPath: string) => ipcRenderer.invoke('cache:restoreBackup', backupPath),
    listDirtyPresets: () => ipcRenderer.invoke('cache:listDirtyPresets'),
    clearDirtyPreset: (relativePath: string) => ipcRenderer.invoke('cache:clearDirtyPreset', relativePath),
    readText: (relativePath: string) => ipcRenderer.invoke('cache:readText', relativePath),
    readBytes: (relativePath: string) => ipcRenderer.invoke('cache:readBytes', relativePath),
    exportPresetZip: (presetName: string, zipBase64: string) =>
      ipcRenderer.invoke('cache:exportPresetZip', presetName, zipBase64),
    backup: () => ipcRenderer.invoke('device:backup'),
    listBackups: () => ipcRenderer.invoke('device:listBackups'),
    showBackup: (backupPath: string) => ipcRenderer.invoke('device:showBackup', backupPath),
    buildProjectIndex: () => ipcRenderer.invoke('cache:buildProjectIndex'),
    listProjects: () => ipcRenderer.invoke('cache:listProjects'),
    getRenameImpact: (oldFilename: string, newBase: string) =>
      ipcRenderer.invoke('cache:getRenameImpact', oldFilename, newBase),
  },
});
