import { app, BrowserWindow, ipcMain, shell } from 'electron';
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

let lastPullAt: number | null = null;
let lastBackupAt: number | null = null;

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
  const win = new BrowserWindow({
    width: 1100,
    height: 820,
    webPreferences: {
      preload: preloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL);
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  ipcMain.handle('device:status', () => {
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

  ipcMain.handle('device:pull', () => {
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

  ipcMain.handle('device:push', () => {
    const result = mtpPush(cacheRoot());
    if (result.ok) clearAllDirty();
    return result;
  });

  ipcMain.handle('cache:root', () => cacheRoot());

  ipcMain.handle('cache:listPresets', () => listPresets(cacheRoot()));

  ipcMain.handle('cache:listStandaloneSamples', () => listStandaloneSamples(cacheRoot()));

  ipcMain.handle('cache:listCategories', () => listCategories(cacheRoot()));

  ipcMain.handle('cache:getPresetDetail', (_e, rel: string) => getPresetDetail(cacheRoot(), rel));

  ipcMain.handle('cache:renameSampleInPreset', (_e, presetPath: string, oldFilename: string, newBase: string) => {
    const result = renameSampleInPreset(cacheRoot(), presetPath, oldFilename, newBase);
    if (result.ok) {
      markPresetDirty(presetPath);
      invalidateProjectIndex();
    }
    return result;
  });

  ipcMain.handle('cache:renameStandaloneSample', (_e, rel: string, newBase: string) => {
    const result = renameStandaloneSample(cacheRoot(), rel, newBase);
    if (result.ok) invalidateProjectIndex();
    return result;
  });

  ipcMain.handle(
    'cache:writePreset',
    (_e, category: string, presetName: string, patchJson: string, files: Array<{ name: string; data: number[] }>) => {
      const buffers = files.map((f) => ({ name: f.name, data: Buffer.from(f.data) }));
      const result = writePresetFolder(cacheRoot(), category, presetName, patchJson, buffers);
      if (result.ok && result.relativePath) markPresetDirty(result.relativePath);
      return result;
    },
  );

  ipcMain.handle('cache:restoreBackup', (_e, backupPath: string) => {
    const result = restoreCacheFromBackup(cacheRoot(), backupPath);
    if (result.ok) clearAllDirty();
    return result;
  });

  ipcMain.handle('cache:listDirtyPresets', () => listDirtyPresets());

  ipcMain.handle('cache:clearDirtyPreset', (_e, rel: string) => {
    clearPresetDirty(rel);
  });

  ipcMain.handle('cache:getRenameImpact', (_e, oldFilename: string, newBase: string) =>
    getRenameImpact(cacheRoot(), oldFilename, newBase),
  );

  ipcMain.handle('cache:buildProjectIndex', () => {
    const root = cacheRoot();
    if (!fs.existsSync(path.join(root, 'projects'))) return null;
    return buildProjectIndex(root).summary;
  });

  ipcMain.handle('cache:projectIndexSummary', () => getProjectIndexSummary(cacheRoot()));

  ipcMain.handle('cache:listProjects', () => {
    const root = cacheRoot();
    if (!fs.existsSync(path.join(root, 'projects'))) return [];
    return listProjects(root);
  });

  ipcMain.handle('cache:readText', (_e, rel: string) => readText(cacheRoot(), rel));

  ipcMain.handle('cache:readBytes', (_e, rel: string) => {
    const buf = readBytes(cacheRoot(), rel);
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  });

  ipcMain.handle('cache:exportPresetZip', (_e, presetName: string, zipBase64: string) => {
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

  ipcMain.handle('device:backup', () => {
    const root = cacheRoot();
    const result = createBackup(root, lastPullAt);
    if (result.ok) lastBackupAt = Date.now();
    return result;
  });

  ipcMain.handle('device:listBackups', () => listBackups());

  ipcMain.handle('device:showBackup', (_e, backupPath: string) => {
    shell.showItemInFolder(backupPath);
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
