import { app, BrowserWindow, dialog, ipcMain, shell, type IpcMainInvokeEvent } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { createBackup, listBackups } from './backup';
import { countCacheEntries, mtpPull, mtpPush, mtpStatus } from './mtp';
import {
  getPresetDetail,
  listCategories,
  listPresets,
  listStandaloneSamples,
  readBytes,
  readText,
  renameSampleInPreset,
  renameStandaloneSample,
  restoreCacheFromBackup,
  writePresetFolder,
} from './cache';
import {
  clearAllDirty,
  clearPresetDirty,
  listDirtyPresets,
  markPresetDirty,
} from './cacheSession';
import {
  buildProjectIndex,
  getProjectIndexSummary,
  getRenameImpact,
  invalidateProjectIndex,
  listProjects,
} from './projectIndex';
import {
  addSourceFolder,
  copySourcePresetsToSet,
  copySourceSamplesToSet,
  listSourceFolders,
  removeSourceFolder,
  scanSourceFolders,
} from './sourceLibrary';

let lastPullAt: number | null = null;
let lastBackupAt: number | null = null;
let mainWindow: BrowserWindow | null = null;

function cacheRoot(): string {
  return path.join(app.getPath('userData'), 'device-cache');
}

function preloadPath(): string {
  const candidates = [
    path.join(__dirname, '../preload/index.cjs'),
    path.join(__dirname, '../preload/index.js'),
    path.join(__dirname, '../preload/index.mjs'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return candidates[0];
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 820,
    webPreferences: {
      preload: preloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

type IpcHandler = (event: IpcMainInvokeEvent, ...args: never[]) => unknown;

function reg(channel: string, handler: IpcHandler): void {
  ipcMain.removeHandler(channel);
  ipcMain.handle(channel, handler);
}

function registerIpcHandlers(): void {
  reg('device:status', () => {
    const mtp = mtpStatus();
    const root = cacheRoot();
    const counts = fs.existsSync(root) ? countCacheEntries(root) : { presetCount: 0, sampleCount: 0 };
    return {
      connected: mtp.connected,
      deviceName: mtp.deviceName ?? null,
      cacheRoot: root,
      lastPullAt,
      lastBackupAt,
      presetCount: counts.presetCount,
      sampleCount: counts.sampleCount,
      dirtyPresetCount: listDirtyPresets().length,
      error: mtp.error ?? null,
    };
  });

  reg('device:pull', () => {
    const root = cacheRoot();
    const result = mtpPull(root);
    if (result.ok) {
      lastPullAt = Date.now();
      clearAllDirty();
      invalidateProjectIndex();
      buildProjectIndex(root);
    }
    const counts = countCacheEntries(root);
    return { ...result, ...counts };
  });

  reg('device:push', () => {
    const result = mtpPush(cacheRoot());
    if (result.ok) clearAllDirty();
    return result;
  });

  reg('cache:root', () => cacheRoot());

  reg('cache:listPresets', () => listPresets(cacheRoot()));

  reg('cache:listStandaloneSamples', () => listStandaloneSamples(cacheRoot()));

  reg('source:listFolders', () => listSourceFolders(app.getPath('userData')));

  reg('source:addFolder', async () => {
    const dialogOptions = {
      properties: ['openDirectory'] as Array<'openDirectory'>,
      title: 'add sample source folder',
    };
    const selection = mainWindow
      ? await dialog.showOpenDialog(mainWindow, dialogOptions)
      : await dialog.showOpenDialog(dialogOptions);
    if (selection.canceled || selection.filePaths.length === 0) {
      return { ok: false, cancelled: true };
    }
    return addSourceFolder(app.getPath('userData'), selection.filePaths[0]!);
  });

  reg('source:removeFolder', (_e, folderId: string) =>
    removeSourceFolder(app.getPath('userData'), folderId),
  );

  reg('source:scanFolders', () => scanSourceFolders(app.getPath('userData'), cacheRoot()));

  reg('source:copySamplesToSet', (_e, sourcePaths: string[], options?: { conflict: 'skip' | 'replace' }) => {
    const result = copySourceSamplesToSet(app.getPath('userData'), cacheRoot(), sourcePaths, options);
    if (result.copied.length > 0 || result.replaced.length > 0) invalidateProjectIndex();
    return result;
  });

  reg('source:copyPresetsToSet', (_e, sourcePaths: string[], options?: { conflict: 'skip' | 'replace' }) => {
    const result = copySourcePresetsToSet(app.getPath('userData'), cacheRoot(), sourcePaths, options);
    if (result.copied.length > 0 || result.replaced.length > 0) invalidateProjectIndex();
    return result;
  });

  reg('cache:listCategories', () => listCategories(cacheRoot()));

  reg('cache:getPresetDetail', (_e, rel: string) => getPresetDetail(cacheRoot(), rel));

  reg('cache:renameSampleInPreset', (_e, presetPath: string, oldFilename: string, newBase: string) => {
    const result = renameSampleInPreset(cacheRoot(), presetPath, oldFilename, newBase);
    if (result.ok) {
      markPresetDirty(presetPath);
      invalidateProjectIndex();
    }
    return result;
  });

  reg('cache:renameStandaloneSample', (_e, rel: string, newBase: string) => {
    const result = renameStandaloneSample(cacheRoot(), rel, newBase);
    if (result.ok) invalidateProjectIndex();
    return result;
  });

  reg(
    'cache:writePreset',
    (_e, category: string, presetName: string, patchJson: string, files: Array<{ name: string; data: number[] }>) => {
      const buffers = files.map((f) => ({ name: f.name, data: Buffer.from(f.data) }));
      const result = writePresetFolder(cacheRoot(), category, presetName, patchJson, buffers);
      if (result.ok && result.relativePath) markPresetDirty(result.relativePath);
      return result;
    },
  );

  reg('cache:restoreBackup', (_e, backupPath: string) => {
    const result = restoreCacheFromBackup(cacheRoot(), backupPath);
    if (result.ok) clearAllDirty();
    return result;
  });

  reg('cache:listDirtyPresets', () => listDirtyPresets());

  reg('cache:clearDirtyPreset', (_e, rel: string) => {
    clearPresetDirty(rel);
  });

  reg('cache:getRenameImpact', (_e, oldFilename: string, newBase: string) =>
    getRenameImpact(cacheRoot(), oldFilename, newBase),
  );

  reg('cache:buildProjectIndex', () => {
    const root = cacheRoot();
    if (!fs.existsSync(path.join(root, 'projects'))) return null;
    return buildProjectIndex(root).summary;
  });

  reg('cache:projectIndexSummary', () => getProjectIndexSummary(cacheRoot()));

  reg('cache:listProjects', () => {
    const root = cacheRoot();
    if (!fs.existsSync(path.join(root, 'projects'))) return [];
    return listProjects(root);
  });

  reg('cache:readText', (_e, rel: string) => readText(cacheRoot(), rel));

  reg('cache:readBytes', (_e, rel: string) => {
    const buf = readBytes(cacheRoot(), rel);
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  });

  reg('cache:exportPresetZip', (_e, presetName: string, zipBase64: string) => {
    try {
      const outDir = path.join(app.getPath('documents'), 'OP-XY Exports');
      fs.mkdirSync(outDir, { recursive: true });
      const safe = presetName.replace(/[^a-zA-Z0-9 #\-().]/g, '').trim() || 'preset';
      const outPath = path.join(outDir, `${safe}.preset.zip`);
      fs.writeFileSync(outPath, Buffer.from(zipBase64, 'base64'));
      return { ok: true, path: outPath };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  });

  reg('device:backup', () => {
    const root = cacheRoot();
    const result = createBackup(root, lastPullAt);
    if (result.ok) lastBackupAt = Date.now();
    return result;
  });

  reg('device:listBackups', () => listBackups());

  reg('device:showBackup', (_e, backupPath: string) => {
    shell.showItemInFolder(backupPath);
  });
}

registerIpcHandlers();

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
