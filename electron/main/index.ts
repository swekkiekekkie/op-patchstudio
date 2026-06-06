import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { createBackup, listBackups } from './backup';
import { countCacheEntries, mtpPull, mtpStatus } from './mtp';
import { listPresets, readBytes, readText } from './cache';

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
      error: mtp.error ?? null,
    };
  });

  ipcMain.handle('device:pull', () => {
    const root = cacheRoot();
    const result = mtpPull(root);
    if (result.ok) lastPullAt = Date.now();
    const counts = countCacheEntries(root);
    return { ...result, ...counts };
  });

  ipcMain.handle('cache:root', () => cacheRoot());

  ipcMain.handle('cache:listPresets', () => listPresets(cacheRoot()));

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
