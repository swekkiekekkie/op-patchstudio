import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { countCacheEntries, mtpPull, mtpStatus } from './mtp';
import { listPresets, readBytes, readText } from './cache';

let lastPullAt: number | null = null;

function cacheRoot(): string {
  return path.join(app.getPath('userData'), 'device-cache');
}

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1100,
    height: 820,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
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
  ipcMain.handle('device:status', () => ({
    ...mtpStatus(),
    cacheRoot: cacheRoot(),
    lastPullAt,
  }));

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

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
