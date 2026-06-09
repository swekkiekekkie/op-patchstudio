import fs from 'node:fs';
import path from 'node:path';
import type {
  SourceFolderEntry,
  SourceLibraryScanResult,
  SourcePresetCopyOptions,
  SourcePresetCopyResult,
  SourcePresetEntry,
  SourceSampleCopyOptions,
  SourceSampleCopyResult,
  SourceSampleEntry,
} from '../../src/types/opxy';
import { listPresets, listStandaloneSamples } from './cache';

const AUDIO_RE = /\.(wav|aif|aiff|mp3|flac|ogg)$/i;

interface SourceLibraryRegistry {
  folders: SourceFolderEntry[];
}

function registryPath(userDataRoot: string): string {
  return path.join(userDataRoot, 'source-library.json');
}

function sourceFolderId(folderPath: string): string {
  return Buffer.from(path.resolve(folderPath).toLowerCase(), 'utf8').toString('base64url');
}

function defaultLabel(folderPath: string): string {
  return path.basename(folderPath) || folderPath;
}

function readRegistry(userDataRoot: string): SourceLibraryRegistry {
  const file = registryPath(userDataRoot);
  if (!fs.existsSync(file)) return { folders: [] };
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8')) as SourceLibraryRegistry;
    return { folders: Array.isArray(parsed.folders) ? parsed.folders : [] };
  } catch {
    return { folders: [] };
  }
}

function normalizeRegistryFolder(folder: SourceFolderEntry): SourceFolderEntry {
  return {
    ...folder,
    sampleCount: folder.sampleCount ?? 0,
    presetCount: folder.presetCount ?? 0,
    lastScannedAt: folder.lastScannedAt ?? null,
    flags: folder.flags ?? [],
  };
}

function writeRegistry(userDataRoot: string, registry: SourceLibraryRegistry): void {
  fs.mkdirSync(userDataRoot, { recursive: true });
  fs.writeFileSync(registryPath(userDataRoot), JSON.stringify(registry, null, 2));
}

function normalizeFolder(folderPath: string): string {
  return path.resolve(folderPath);
}

function isInsideFolder(filePath: string, folderPath: string): boolean {
  const folder = `${path.resolve(folderPath)}${path.sep}`;
  const file = path.resolve(filePath);
  return file === path.resolve(folderPath) || file.startsWith(folder);
}

function emptySourceSampleCopyResult(): SourceSampleCopyResult {
  return { ok: true, copied: [], replaced: [], skipped: [], conflicts: [] };
}

function patchSampleRefs(presetDir: string): string[] {
  const patchPath = path.join(presetDir, 'patch.json');
  if (!fs.existsSync(patchPath)) return [];
  try {
    const patch = JSON.parse(fs.readFileSync(patchPath, 'utf8')) as {
      regions?: Array<{ sample?: string }>;
    };
    return Array.from(new Set((patch.regions ?? []).map((region) => region.sample).filter((sample): sample is string => !!sample)));
  } catch {
    return [];
  }
}

function buildSourceSamplePathIndex(folders: SourceFolderEntry[]): Map<string, string> {
  const index = new Map<string, string>();
  for (const folder of folders.map(normalizeRegistryFolder)) {
    if (!fs.existsSync(folder.path) || !fs.statSync(folder.path).isDirectory()) continue;
    const stack = [folder.path];
    while (stack.length > 0) {
      const current = stack.pop()!;
      for (const name of fs.readdirSync(current)) {
        const full = path.join(current, name);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          if (!name.endsWith('.preset')) stack.push(full);
          continue;
        }
        if (!AUDIO_RE.test(name)) continue;
        const key = path.basename(name).toLowerCase();
        if (!index.has(key)) index.set(key, full);
      }
    }
  }
  return index;
}

function copySourceSampleFileToSet(
  sourcePath: string,
  cacheRoot: string,
  options: SourceSampleCopyOptions,
  result: SourceSampleCopyResult,
): void {
  const source = path.resolve(sourcePath);
  if (!fs.existsSync(source) || !fs.statSync(source).isFile()) {
    result.skipped.push({ sourcePath, reason: 'Source file not found' });
    return;
  }
  if (!AUDIO_RE.test(source)) {
    result.skipped.push({ sourcePath, reason: 'Unsupported audio extension' });
    return;
  }

  const targetRoot = path.join(cacheRoot, 'samples', 'user');
  fs.mkdirSync(targetRoot, { recursive: true });
  const targetRelativePath = `samples/user/${path.basename(source)}`;
  const target = path.join(targetRoot, path.basename(source));
  if (fs.existsSync(target)) {
    if (options.conflict === 'replace') {
      fs.copyFileSync(source, target);
      result.replaced.push({ sourcePath, targetRelativePath });
      return;
    }
    result.conflicts.push({ sourcePath, targetRelativePath });
    return;
  }

  fs.copyFileSync(source, target);
  result.copied.push({ sourcePath, targetRelativePath });
}

export function listSourceFolders(userDataRoot: string): SourceFolderEntry[] {
  return readRegistry(userDataRoot).folders.map(normalizeRegistryFolder);
}

export function addSourceFolder(userDataRoot: string, folderPath: string): { ok: boolean; folder?: SourceFolderEntry; error?: string } {
  try {
    const resolved = normalizeFolder(folderPath);
    if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
      return { ok: false, error: 'Folder not found' };
    }

    const registry = readRegistry(userDataRoot);
    const existing = registry.folders.find((folder) => path.resolve(folder.path).toLowerCase() === resolved.toLowerCase());
    if (existing) return { ok: true, folder: existing };

    const folder: SourceFolderEntry = {
      id: sourceFolderId(resolved),
      path: resolved,
      label: defaultLabel(resolved),
      sampleCount: 0,
      presetCount: 0,
      lastScannedAt: null,
      flags: [],
    };
    registry.folders.push(folder);
    writeRegistry(userDataRoot, registry);
    return { ok: true, folder };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export function removeSourceFolder(
  userDataRoot: string,
  folderId: string,
): { ok: boolean; folders?: SourceFolderEntry[]; error?: string } {
  try {
    const registry = readRegistry(userDataRoot);
    const folders = registry.folders.filter((folder) => folder.id !== folderId);
    if (folders.length === registry.folders.length) {
      return { ok: false, error: 'Source folder not found' };
    }
    writeRegistry(userDataRoot, { folders });
    return { ok: true, folders };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export function scanSourceFolders(userDataRoot: string, cacheRoot: string): SourceLibraryScanResult {
  const registry = readRegistry(userDataRoot);
  const setFilenames = new Set(listStandaloneSamples(cacheRoot).map((sample) => sample.filename.toLowerCase()));
  const setPresetNames = new Set(listPresets(cacheRoot).map((preset) => `${preset.name}.preset`.toLowerCase()));
  const scannedAt = Date.now();
  const samples: SourceSampleEntry[] = [];
  const presets: SourcePresetEntry[] = [];

  const folders = registry.folders.map((rawFolder) => {
    const folder = normalizeRegistryFolder(rawFolder);
    const updated: SourceFolderEntry = { ...folder, flags: [], sampleCount: 0, presetCount: 0, lastScannedAt: scannedAt };
    if (!fs.existsSync(folder.path) || !fs.statSync(folder.path).isDirectory()) {
      updated.flags = ['missing_folder'];
      return updated;
    }

    try {
      const stack = [folder.path];
      while (stack.length > 0) {
        const current = stack.pop()!;
        for (const name of fs.readdirSync(current)) {
          const full = path.join(current, name);
          const stat = fs.statSync(full);
          if (stat.isDirectory()) {
            if (name.endsWith('.preset')) {
              updated.presetCount += 1;
              const patchPath = path.join(full, 'patch.json');
              const flags: SourcePresetEntry['flags'] = [];
              let type = 'unknown';
              let sampleRefs: string[] = [];

              if (!fs.existsSync(patchPath)) {
                flags.push('missing_patch');
              } else {
                try {
                  const patch = JSON.parse(fs.readFileSync(patchPath, 'utf8')) as {
                    type?: string;
                    regions?: Array<{ sample?: string }>;
                  };
                  type = patch.type ?? 'unknown';
                  sampleRefs = Array.from(new Set((patch.regions ?? []).map((region) => region.sample).filter((sample): sample is string => !!sample)));
                } catch {
                  flags.push('malformed_patch');
                }
              }

              const alreadyInSet = setPresetNames.has(name.toLowerCase());
              if (alreadyInSet) flags.push('already_in_set');
              presets.push({
                id: Buffer.from(full, 'utf8').toString('base64url'),
                folderId: folder.id,
                folderLabel: folder.label,
                absolutePath: full,
                relativePath: path.relative(folder.path, full).replace(/\\/g, '/'),
                folderName: name,
                name: name.replace(/\.preset$/i, ''),
                type,
                sampleRefs,
                availableSampleRefs: [],
                missingSampleRefs: [],
                mtimeMs: stat.mtimeMs,
                alreadyInSet,
                flags,
              });
              continue;
            }
            stack.push(full);
            continue;
          }
          if (!AUDIO_RE.test(name)) continue;

          updated.sampleCount += 1;
          samples.push({
            id: Buffer.from(full, 'utf8').toString('base64url'),
            folderId: folder.id,
            folderLabel: folder.label,
            absolutePath: full,
            relativePath: path.relative(folder.path, full).replace(/\\/g, '/'),
            filename: name,
            extension: path.extname(name).replace(/^\./, '').toLowerCase(),
            sizeBytes: stat.size,
            mtimeMs: stat.mtimeMs,
            alreadyInSet: setFilenames.has(name.toLowerCase()),
          });
        }
      }
    } catch {
      updated.flags = ['scan_failed'];
    }

    return updated;
  });

  const availableSampleFilenames = new Set([
    ...Array.from(setFilenames),
    ...samples.map((sample) => sample.filename.toLowerCase()),
  ]);
  for (const preset of presets) {
    const availableSampleRefs = preset.sampleRefs.filter((ref) => availableSampleFilenames.has(path.basename(ref).toLowerCase()));
    const missingSampleRefs = preset.sampleRefs.filter((ref) => !availableSampleFilenames.has(path.basename(ref).toLowerCase()));
    preset.availableSampleRefs = availableSampleRefs;
    preset.missingSampleRefs = missingSampleRefs;
    if (missingSampleRefs.length > 0 && !preset.flags.includes('missing_refs')) {
      preset.flags.push('missing_refs');
    }
  }

  writeRegistry(userDataRoot, { folders });
  return {
    folders,
    samples: samples.sort((a, b) => a.relativePath.localeCompare(b.relativePath)),
    presets: presets.sort((a, b) => a.relativePath.localeCompare(b.relativePath)),
    scannedAt,
  };
}

export function copySourceSamplesToSet(
  userDataRoot: string,
  cacheRoot: string,
  sourcePaths: string[],
  options: SourceSampleCopyOptions = { conflict: 'skip' },
): SourceSampleCopyResult {
  const registry = readRegistry(userDataRoot);
  const targetRoot = path.join(cacheRoot, 'samples', 'user');
  const result: SourceSampleCopyResult = emptySourceSampleCopyResult();

  try {
    fs.mkdirSync(targetRoot, { recursive: true });

    for (const sourcePath of sourcePaths) {
      const source = path.resolve(sourcePath);
      const folder = registry.folders.find((entry) => isInsideFolder(source, entry.path));
      if (!folder) {
        result.skipped.push({ sourcePath, reason: 'Source is not in a registered folder' });
        continue;
      }
      if (!fs.existsSync(source) || !fs.statSync(source).isFile()) {
        result.skipped.push({ sourcePath, reason: 'Source file not found' });
        continue;
      }
      if (!AUDIO_RE.test(source)) {
        result.skipped.push({ sourcePath, reason: 'Unsupported audio extension' });
        continue;
      }

      copySourceSampleFileToSet(source, cacheRoot, options, result);
    }
  } catch (e) {
    result.ok = false;
    result.error = e instanceof Error ? e.message : String(e);
  }

  return result;
}

export function copySourcePresetsToSet(
  userDataRoot: string,
  cacheRoot: string,
  sourcePaths: string[],
  options: SourcePresetCopyOptions = { conflict: 'skip' },
): SourcePresetCopyResult {
  const registry = readRegistry(userDataRoot);
  const targetRoot = path.join(cacheRoot, 'presets', 'user');
  const result: SourcePresetCopyResult = {
    ok: true,
    copied: [],
    replaced: [],
    skipped: [],
    conflicts: [],
    sampleResult: emptySourceSampleCopyResult(),
    missingSampleRefs: [],
  };
  const samplePathIndex = options.includeSamples === false
    ? new Map<string, string>()
    : buildSourceSamplePathIndex(registry.folders);

  const copyRefs = (presetDir: string) => {
    if (options.includeSamples === false) return;
    for (const ref of patchSampleRefs(presetDir)) {
      const sourceSamplePath = samplePathIndex.get(path.basename(ref).toLowerCase());
      if (!sourceSamplePath) {
        result.missingSampleRefs.push({ sourcePath: presetDir, ref });
        continue;
      }
      copySourceSampleFileToSet(sourceSamplePath, cacheRoot, options, result.sampleResult);
    }
  };

  try {
    fs.mkdirSync(targetRoot, { recursive: true });

    for (const sourcePath of sourcePaths) {
      const source = path.resolve(sourcePath);
      const folder = registry.folders.find((entry) => isInsideFolder(source, entry.path));
      if (!folder) {
        result.skipped.push({ sourcePath, reason: 'Source preset is not in a registered folder' });
        continue;
      }
      if (!fs.existsSync(source) || !fs.statSync(source).isDirectory()) {
        result.skipped.push({ sourcePath, reason: 'Source preset folder not found' });
        continue;
      }
      if (!path.basename(source).toLowerCase().endsWith('.preset')) {
        result.skipped.push({ sourcePath, reason: 'Source folder is not a .preset folder' });
        continue;
      }

      const targetRelativePath = `presets/user/${path.basename(source)}`;
      const target = path.join(targetRoot, path.basename(source));
      if (fs.existsSync(target)) {
        if (options.conflict === 'replace') {
          fs.rmSync(target, { recursive: true, force: true });
          fs.cpSync(source, target, { recursive: true });
          result.replaced.push({ sourcePath, targetRelativePath });
          copyRefs(source);
          continue;
        }
        result.conflicts.push({ sourcePath, targetRelativePath });
        continue;
      }

      fs.cpSync(source, target, { recursive: true });
      result.copied.push({ sourcePath, targetRelativePath });
      copyRefs(source);
    }
  } catch (e) {
    result.ok = false;
    result.error = e instanceof Error ? e.message : String(e);
  }

  return result;
}
