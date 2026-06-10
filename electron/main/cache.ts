import fs from 'node:fs';
import path from 'node:path';
import type { CachePresetEntry, CacheSampleEntry, PresetDetail, PresetRegionEntry } from '../../src/types/opxy';

export function categoryFromPresetPath(presetRelPath: string): string {
  const parts = presetRelPath.replace(/\\/g, '/').split('/');
  const presetsIdx = parts.indexOf('presets');
  if (presetsIdx >= 0 && parts.length > presetsIdx + 2) {
    return parts[presetsIdx + 1]!;
  }
  return parts[1] ?? 'user';
}

export function safePath(root: string, relative: string): string {
  const normalized = path.normalize(relative).replace(/^([/\\])+/, '');
  const full = path.resolve(root, normalized);
  if (!full.startsWith(path.resolve(root))) {
    throw new Error('Path escapes cache root');
  }
  return full;
}

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
      let unnamedCount = 0;
      try {
        const patch = JSON.parse(fs.readFileSync(patchPath, 'utf8')) as {
          type?: string;
          regions?: Array<{ sample?: string }>;
        };
        type = patch.type ?? 'unknown';
        const regions = patch.regions ?? [];
        sampleBased = (type === 'drum' || type === 'sampler' || type === 'multisampler') && regions.length > 0;
        sampleCount = sampleBased ? regions.length : 0;
        unnamedCount = regions.filter((r) => isUnnamedSample(r.sample)).length;
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
        unnamedCount,
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

/** macOS AppleDouble resource forks (._*) and other dotfiles are metadata, not audio. */
export function isJunkFilename(name: string): boolean {
  return name.startsWith('.');
}

export function listStandaloneSamples(cacheRoot: string): CacheSampleEntry[] {
  const samplesRoot = path.join(cacheRoot, 'samples', 'user');
  if (!fs.existsSync(samplesRoot)) return [];

  return fs
    .readdirSync(samplesRoot)
    .filter((f) => !isJunkFilename(f) && /\.(wav|aif|aiff)$/i.test(f))
    .map((filename) => {
      const parsed = parseDeviceSampleFilename(filename);
      return {
        relativePath: `samples/user/${filename}`,
        filename,
        base: parsed?.base ?? filename.replace(/\.[^.]+$/, ''),
        note: parsed?.note ?? '',
        idx: parsed?.idx ?? 0,
        isUnnamed: isUnnamedBase(parsed?.base ?? filename),
      };
    })
    .sort((a, b) => a.filename.localeCompare(b.filename));
}

export function getPresetDetail(cacheRoot: string, presetRelPath: string): PresetDetail {
  const presetDir = safePath(cacheRoot, presetRelPath);
  const patchPath = path.join(presetDir, 'patch.json');
  if (!fs.existsSync(patchPath)) throw new Error('patch.json not found');

  const patch = JSON.parse(fs.readFileSync(patchPath, 'utf8')) as {
    type?: string;
    name?: string;
    regions?: Array<Record<string, unknown>>;
  };

  const regions: PresetRegionEntry[] = (patch.regions ?? []).map((r, index) => {
    const sample = String(r.sample ?? '');
    const parsed = parseDeviceSampleFilename(sample);
    const samplePath = path.join(presetDir, sample);
    return {
      index,
      sample,
      hikey: typeof r.hikey === 'number' ? r.hikey : undefined,
      lokey: typeof r.lokey === 'number' ? r.lokey : undefined,
      rootNote: typeof r['pitch.keycenter'] === 'number' ? (r['pitch.keycenter'] as number) : undefined,
      base: parsed?.base ?? sample.replace(/\.[^.]+$/, ''),
      note: parsed?.note ?? '',
      idx: parsed?.idx ?? 0,
      isUnnamed: isUnnamedSample(sample),
      hasAudio: fs.existsSync(samplePath),
    };
  });

  return {
    relativePath: presetRelPath.replace(/\\/g, '/'),
    name: path.basename(presetDir).replace(/\.preset$/, ''),
    category: categoryFromPresetPath(presetRelPath),
    type: patch.type ?? 'unknown',
    patchJson: fs.readFileSync(patchPath, 'utf8'),
    regions,
  };
}

export function renameSampleInPreset(
  cacheRoot: string,
  presetRelPath: string,
  oldFilename: string,
  newBase: string,
): { ok: boolean; newFilename?: string; error?: string } {
  try {
    const presetDir = safePath(cacheRoot, presetRelPath);
    const parsed = parseDeviceSampleFilename(oldFilename);
    if (!parsed) return { ok: false, error: 'Sample filename is not in device format' };

    const cleanBase = sanitizeDeviceBase(newBase);
    const newFilename = `${cleanBase}-${parsed.note}-${parsed.idx}.${parsed.ext}`;
    if (newFilename === oldFilename) return { ok: true, newFilename };

    const oldPath = path.join(presetDir, oldFilename);
    const newPath = path.join(presetDir, newFilename);
    if (!fs.existsSync(oldPath)) return { ok: false, error: `Sample file not found: ${oldFilename}` };
    if (fs.existsSync(newPath)) return { ok: false, error: `Target already exists: ${newFilename}` };

    const patchPath = path.join(presetDir, 'patch.json');
    const patch = JSON.parse(fs.readFileSync(patchPath, 'utf8')) as {
      regions?: Array<{ sample?: string }>;
    };

    let updated = false;
    for (const region of patch.regions ?? []) {
      if (region.sample === oldFilename) {
        region.sample = newFilename;
        updated = true;
      }
    }
    if (!updated) return { ok: false, error: 'Sample not referenced in patch.json' };

    fs.renameSync(oldPath, newPath);
    fs.writeFileSync(patchPath, JSON.stringify(patch));
    return { ok: true, newFilename };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export function renameStandaloneSample(
  cacheRoot: string,
  relativePath: string,
  newBase: string,
): { ok: boolean; newFilename?: string; error?: string } {
  try {
    const oldPath = safePath(cacheRoot, relativePath);
    const oldFilename = path.basename(oldPath);
    const parsed = parseDeviceSampleFilename(oldFilename);
    if (!parsed) return { ok: false, error: 'Sample filename is not in device format' };

    const cleanBase = sanitizeDeviceBase(newBase);
    const newFilename = `${cleanBase}-${parsed.note}-${parsed.idx}.${parsed.ext}`;
    const newPath = path.join(path.dirname(oldPath), newFilename);
    if (newFilename === oldFilename) return { ok: true, newFilename };
    if (fs.existsSync(newPath)) return { ok: false, error: `Target already exists: ${newFilename}` };

    fs.renameSync(oldPath, newPath);
    return { ok: true, newFilename, relativePath: path.relative(cacheRoot, newPath).replace(/\\/g, '/') };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export interface PresetWriteFile {
  name: string;
  data: Buffer;
}

export function writePresetFolder(
  cacheRoot: string,
  category: string,
  presetName: string,
  patchJson: string,
  files: PresetWriteFile[],
): { ok: boolean; relativePath?: string; error?: string } {
  try {
    const safeCategory = sanitizeDeviceBase(category) || 'user';
    const safeName = sanitizeDeviceBase(presetName) || 'preset';
    const presetDir = path.join(cacheRoot, 'presets', safeCategory, `${safeName}.preset`);
    fs.mkdirSync(presetDir, { recursive: true });

    for (const file of files) {
      const dest = path.join(presetDir, path.basename(file.name));
      fs.writeFileSync(dest, file.data);
    }
    fs.writeFileSync(path.join(presetDir, 'patch.json'), patchJson);

    const relativePath = path.relative(cacheRoot, presetDir).replace(/\\/g, '/');
    return { ok: true, relativePath };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export function restoreCacheFromBackup(cacheRoot: string, backupPath: string): { ok: boolean; error?: string } {
  try {
    if (!fs.existsSync(backupPath)) return { ok: false, error: 'Backup folder not found' };

    if (fs.existsSync(cacheRoot)) fs.rmSync(cacheRoot, { recursive: true, force: true });
    fs.mkdirSync(cacheRoot, { recursive: true });

    const presetsSrc = path.join(backupPath, 'presets');
    const samplesSrc = path.join(backupPath, 'samples');
    if (fs.existsSync(presetsSrc)) fs.cpSync(presetsSrc, path.join(cacheRoot, 'presets'), { recursive: true });
    if (fs.existsSync(samplesSrc)) fs.cpSync(samplesSrc, path.join(cacheRoot, 'samples'), { recursive: true });

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export function readText(cacheRoot: string, relativePath: string): string {
  return fs.readFileSync(safePath(cacheRoot, relativePath), 'utf8');
}

export function readBytes(cacheRoot: string, relativePath: string): Buffer {
  return fs.readFileSync(safePath(cacheRoot, relativePath));
}

export function listCategories(cacheRoot: string): string[] {
  const presetsRoot = path.join(cacheRoot, 'presets');
  if (!fs.existsSync(presetsRoot)) return ['user'];
  const cats = fs.readdirSync(presetsRoot).filter((n) => fs.statSync(path.join(presetsRoot, n)).isDirectory());
  return cats.length > 0 ? cats.sort() : ['user'];
}

const DEVICE_SAMPLE_RE =
  /^(?<base>.+)-(?<note>[a-g](?:#|b)?\d+)-(?<idx>\d+)\.(?<ext>wav|aif|aiff)$/i;

function parseDeviceSampleFilename(filename: string): {
  base: string;
  note: string;
  idx: number;
  ext: string;
} | null {
  const m = filename.match(DEVICE_SAMPLE_RE);
  if (!m?.groups) return null;
  return {
    base: m.groups.base,
    note: m.groups.note.toLowerCase(),
    idx: parseInt(m.groups.idx, 10),
    ext: m.groups.ext.toLowerCase(),
  };
}

function isUnnamedBase(base: string): boolean {
  return /^unnamed(\s+\d+)?$/i.test(base.trim());
}

function isUnnamedSample(sample: string | undefined): boolean {
  if (!sample) return false;
  const parsed = parseDeviceSampleFilename(sample);
  return parsed ? isUnnamedBase(parsed.base) : /^unnamed/i.test(sample);
}

function sanitizeDeviceBase(name: string): string {
  return name.replace(/[^a-zA-Z0-9 #\-()]+/g, '').trim();
}
