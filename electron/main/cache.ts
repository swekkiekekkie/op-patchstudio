import fs from 'node:fs';
import path from 'node:path';
import type { CachePresetEntry } from '../../src/types/opxy';

export function listPresets(cacheRoot: string): CachePresetEntry[] {
  const presetsRoot = path.join(cacheRoot, 'presets');
  if (!fs.existsSync(presetsRoot)) return [];

  const entries: CachePresetEntry[] = [];

  function scanDir(dir: string, category: string): void {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const stat = fs.statSync(full);
      if (!stat.isDirectory() || !name.endsWith('.preset')) continue;

      const patchPath = path.join(full, 'patch.json');
      if (!fs.existsSync(patchPath)) continue;

      let type = 'unknown';
      let sampleBased = false;
      let sampleCount = 0;
      try {
        const patch = JSON.parse(fs.readFileSync(patchPath, 'utf8')) as { type?: string; regions?: unknown[] };
        type = patch.type ?? 'unknown';
        const regions = patch.regions ?? [];
        sampleBased = (type === 'drum' || type === 'sampler' || type === 'multisampler') && regions.length > 0;
        sampleCount = sampleBased ? regions.length : 0;
      } catch {
        // skip malformed
      }

      const rel = path.relative(cacheRoot, full).replace(/\\/g, '/');
      entries.push({
        relativePath: rel,
        category,
        name: name.replace(/\.preset$/, ''),
        type,
        sampleBased,
        sampleCount,
      });
    }

    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory() && !name.endsWith('.preset')) {
        scanDir(full, name);
      }
    }
  }

  for (const cat of fs.readdirSync(presetsRoot)) {
    const full = path.join(presetsRoot, cat);
    if (fs.statSync(full).isDirectory()) scanDir(full, cat);
  }

  return entries.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

export function readText(cacheRoot: string, relativePath: string): string {
  const full = safePath(cacheRoot, relativePath);
  return fs.readFileSync(full, 'utf8');
}

export function readBytes(cacheRoot: string, relativePath: string): Buffer {
  const full = safePath(cacheRoot, relativePath);
  return fs.readFileSync(full);
}

export function writeBytes(cacheRoot: string, relativePath: string, data: Buffer): void {
  const full = safePath(cacheRoot, relativePath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, data);
}

function safePath(root: string, relative: string): string {
  const normalized = path.normalize(relative).replace(/^([/\\])+/, '');
  const full = path.resolve(root, normalized);
  if (!full.startsWith(path.resolve(root))) {
    throw new Error('Path escapes cache root');
  }
  return full;
}
