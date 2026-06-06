import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { countCacheEntries } from './mtp';

export interface BackupManifest {
  version: 1;
  createdAt: string;
  sourceCacheRoot: string;
  lastPullAt: number | null;
  presetCount: number;
  sampleCount: number;
}

export interface BackupResult {
  ok: boolean;
  path?: string;
  presetCount?: number;
  sampleCount?: number;
  error?: string;
}

export interface BackupEntry {
  id: string;
  path: string;
  createdAt: string;
  presetCount: number;
  sampleCount: number;
}

export function backupsRoot(): string {
  return path.join(app.getPath('documents'), 'OP-XY Backups');
}

function formatBackupId(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-') + `_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
}

function copyTree(src: string, dest: string): void {
  if (!fs.existsSync(src)) return;
  fs.cpSync(src, dest, { recursive: true, force: false, errorOnExist: false });
}

export function createBackup(
  cacheRoot: string,
  lastPullAt: number | null,
): BackupResult {
  if (!fs.existsSync(cacheRoot)) {
    return { ok: false, error: 'No device cache — pull from the OP-XY first' };
  }

  const counts = countCacheEntries(cacheRoot);
  if (counts.presetCount === 0 && counts.sampleCount === 0) {
    return { ok: false, error: 'Cache is empty — pull from the OP-XY first' };
  }

  const createdAt = new Date();
  const id = formatBackupId(createdAt);
  const dest = path.join(backupsRoot(), id);

  try {
    fs.mkdirSync(dest, { recursive: true });

    const presetsSrc = path.join(cacheRoot, 'presets');
    const samplesSrc = path.join(cacheRoot, 'samples');
    if (fs.existsSync(presetsSrc)) copyTree(presetsSrc, path.join(dest, 'presets'));
    if (fs.existsSync(samplesSrc)) copyTree(samplesSrc, path.join(dest, 'samples'));

    const manifest: BackupManifest = {
      version: 1,
      createdAt: createdAt.toISOString(),
      sourceCacheRoot: cacheRoot,
      lastPullAt,
      presetCount: counts.presetCount,
      sampleCount: counts.sampleCount,
    };
    fs.writeFileSync(path.join(dest, 'backup-manifest.json'), JSON.stringify(manifest, null, 2));

    return { ok: true, path: dest, ...counts };
  } catch (e) {
    try {
      fs.rmSync(dest, { recursive: true, force: true });
    } catch {
      // ignore cleanup failure
    }
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export function listBackups(): BackupEntry[] {
  const root = backupsRoot();
  if (!fs.existsSync(root)) return [];

  const entries: BackupEntry[] = [];
  for (const name of fs.readdirSync(root)) {
    const dir = path.join(root, name);
    if (!fs.statSync(dir).isDirectory()) continue;

    const manifestPath = path.join(dir, 'backup-manifest.json');
    if (fs.existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as BackupManifest;
        entries.push({
          id: name,
          path: dir,
          createdAt: manifest.createdAt,
          presetCount: manifest.presetCount,
          sampleCount: manifest.sampleCount,
        });
        continue;
      } catch {
        // fall through to count from disk
      }
    }

    const counts = countCacheEntries(dir);
    entries.push({
      id: name,
      path: dir,
      createdAt: fs.statSync(dir).mtime.toISOString(),
      presetCount: counts.presetCount,
      sampleCount: counts.sampleCount,
    });
  }

  return entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
