import fs from 'node:fs';
import path from 'node:path';

export interface ProjectReference {
  projectRelPath: string;
  projectName: string;
}

export interface ProjectIndexEntry {
  filename: string;
  projects: ProjectReference[];
}

export interface ProjectIndexSummary {
  projectCount: number;
  scannedFiles: number;
  referencedFilenames: number;
  builtAt: number;
}

const AUDIO_EXT = /\.(wav|aif|aiff)$/i;
const STRING_RE = /[\x20-\x7E]{4,200}\.(?:wav|aif|aiff)/gi;
const XY_MAGIC = Buffer.from([0xdd, 0xcc, 0xbb, 0xaa]);
const TRACK_SIGNATURE_HEAD = Buffer.from([0x00, 0x00, 0x01]);
const TRACK_SIGNATURE_TAIL = Buffer.from([0xff, 0x00, 0xfc, 0x00]);
const PRESET_FOLDER_RE = /\/fat32\/presets\/([a-z0-9 #\-()]+)\/[ -~]{1,120}/g;
const PRESET_PATH_MARKER = 0xf7;

const ENGINE_NAMES = new Map<number, string>([
  [0x02, 'sampler'],
  [0x03, 'drum'],
  [0x06, 'organ'],
  [0x07, 'epiano'],
  [0x12, 'prism'],
  [0x13, 'hardsync'],
  [0x14, 'dissolve'],
  [0x16, 'axis'],
  [0x1d, 'midi'],
  [0x1e, 'multisampler'],
  [0x1f, 'wavetable'],
  [0x20, 'simple'],
]);

let cachedIndex: Map<string, ProjectReference[]> | null = null;
let cachedSummary: ProjectIndexSummary | null = null;
let cachedRoot: string | null = null;

export type ProjectParseStatus = 'ok' | 'partial' | 'unsupported' | 'error';
export type ProjectPresetFolderKind = 'drum' | 'synth' | 'multi' | 'sample' | 'sampler' | 'unknown';

export interface ProjectPresetFolderHit {
  folder: string;
  kind: ProjectPresetFolderKind;
  hitCount: number;
  confidence: 'strong' | 'medium' | 'weak';
}

export interface ProjectPatternInspection {
  patternNumber: number;
  active: boolean;
  engineId?: number;
  engineName?: string;
  bodyLength?: number;
  presetRefs: ProjectPresetFolderHit[];
  /** @deprecated use presetRefs; kept for compatibility with earlier app builds. */
  inferredPresetFolders?: ProjectPresetFolderHit[];
}

export interface ProjectTrackInspection {
  trackNumber: number;
  patterns: ProjectPatternInspection[];
}

export interface ProjectInspection {
  parseStatus: ProjectParseStatus;
  tracks: ProjectTrackInspection[];
  warnings: string[];
}

interface TrackBlock {
  preamble: Buffer;
  body: Buffer;
}

interface LogicalEntry {
  track: number;
  pattern: number;
  body: Buffer;
  typeByte: number;
  engineId: number;
  active: boolean;
}

function walkFiles(dir: string, root: string, out: string[]): void {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walkFiles(full, root, out);
    } else {
      out.push(path.relative(root, full).replace(/\\/g, '/'));
    }
  }
}

function extractAudioStrings(buf: Buffer): string[] {
  const text = buf.toString('latin1');
  const found = new Set<string>();
  for (const m of text.matchAll(STRING_RE)) {
    const raw = m[0];
    const basename = path.basename(raw.replace(/\0/g, '').trim());
    if (AUDIO_EXT.test(basename)) found.add(basename);
  }
  return [...found];
}

/** Also match bare filenames anywhere in the project binary. */
function findBareFilename(buf: Buffer, filename: string): boolean {
  if (filename.length < 4) return false;
  return buf.indexOf(filename) !== -1 || buf.indexOf(`${filename}\0`) !== -1;
}

export function buildProjectIndex(cacheRoot: string): { index: Map<string, ProjectReference[]>; summary: ProjectIndexSummary } {
  const projectsRoot = path.join(cacheRoot, 'projects');
  const index = new Map<string, ProjectReference[]>();
  const projectFiles: string[] = [];
  walkFiles(projectsRoot, cacheRoot, projectFiles);

  const projectPaths = projectFiles.filter(
    (f) => f.startsWith('projects/') && (f.endsWith('.xy') || /\.xy\//.test(f) || f.includes('/projects/')),
  );

  let scanned = 0;
  for (const rel of projectFiles) {
    if (!rel.startsWith('projects/')) continue;
    const full = path.join(cacheRoot, rel);
    let buf: Buffer;
    try {
      buf = fs.readFileSync(full);
    } catch {
      continue;
    }
    if (buf.length === 0 || buf.length > 50 * 1024 * 1024) continue;
    scanned++;

    const names = extractAudioStrings(buf);
    const projectName = path.basename(rel).replace(/\.xy$/, '') || rel;
    const ref: ProjectReference = { projectRelPath: rel, projectName };

    for (const filename of names) {
      const list = index.get(filename) ?? [];
      if (!list.some((r) => r.projectRelPath === rel)) list.push(ref);
      index.set(filename, list);
    }
  }

  const summary: ProjectIndexSummary = {
    projectCount: projectPaths.length,
    scannedFiles: scanned,
    referencedFilenames: index.size,
    builtAt: Date.now(),
  };

  cachedIndex = index;
  cachedSummary = summary;
  cachedRoot = cacheRoot;
  return { index, summary };
}

function ensureIndex(cacheRoot: string): Map<string, ProjectReference[]> {
  if (cachedIndex && cachedRoot === cacheRoot) return cachedIndex;
  return buildProjectIndex(cacheRoot).index;
}

export function getProjectIndexSummary(cacheRoot: string): ProjectIndexSummary | null {
  if (cachedSummary && cachedRoot === cacheRoot) return cachedSummary;
  if (!fs.existsSync(path.join(cacheRoot, 'projects'))) return null;
  return buildProjectIndex(cacheRoot).summary;
}

export function findProjectReferences(cacheRoot: string, filename: string): ProjectReference[] {
  const base = path.basename(filename);
  const index = ensureIndex(cacheRoot);
  const fromStrings = index.get(base) ?? [];

  const extra: ProjectReference[] = [];
  const projectsRoot = path.join(cacheRoot, 'projects');
  if (fs.existsSync(projectsRoot)) {
    const files: string[] = [];
    walkFiles(projectsRoot, cacheRoot, files);
    for (const rel of files) {
      if (!rel.startsWith('projects/')) continue;
      try {
        const buf = fs.readFileSync(path.join(cacheRoot, rel));
        if (findBareFilename(buf, base) && !fromStrings.some((r) => r.projectRelPath === rel)) {
          extra.push({
            projectRelPath: rel,
            projectName: path.basename(rel).replace(/\.xy$/, '') || rel,
          });
        }
      } catch {
        // skip
      }
    }
  }

  const merged = [...fromStrings];
  for (const e of extra) {
    if (!merged.some((m) => m.projectRelPath === e.projectRelPath)) merged.push(e);
  }
  return merged;
}

export function findPresetReferences(cacheRoot: string, filename: string): string[] {
  const base = path.basename(filename);
  const presetsRoot = path.join(cacheRoot, 'presets');
  if (!fs.existsSync(presetsRoot)) return [];

  const hits: string[] = [];
  function scanPresets(dir: string): void {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory()) {
        if (name.endsWith('.preset')) {
          const patchPath = path.join(full, 'patch.json');
          if (fs.existsSync(patchPath)) {
            try {
              const patch = JSON.parse(fs.readFileSync(patchPath, 'utf8')) as {
                regions?: Array<{ sample?: string }>;
              };
              if (patch.regions?.some((r) => r.sample === base)) {
                hits.push(path.relative(cacheRoot, full).replace(/\\/g, '/'));
              }
            } catch {
              // skip
            }
          }
        } else {
          scanPresets(full);
        }
      }
    }
  }
  scanPresets(presetsRoot);
  return hits;
}

export interface RenameImpact {
  oldFilename: string;
  newFilename: string;
  presetRefs: string[];
  projectRefs: ProjectReference[];
}

export function getRenameImpact(
  cacheRoot: string,
  oldFilename: string,
  newBase: string,
): RenameImpact {
  const parsed = parseSampleFilename(oldFilename);
  const cleanBase = newBase.replace(/[^a-zA-Z0-9 #\-()]+/g, '').trim() || 'unnamed';
  const newFilename =
    parsed != null
      ? `${cleanBase}-${parsed.note}-${parsed.idx}.${parsed.ext}`
      : oldFilename;

  return {
    oldFilename,
    newFilename,
    presetRefs: findPresetReferences(cacheRoot, oldFilename),
    projectRefs: findProjectReferences(cacheRoot, oldFilename),
  };
}

function parseSampleFilename(filename: string): { note: string; idx: number; ext: string } | null {
  const m = filename.match(/^.+-(?<note>[a-g](?:#|b)?\d+)-(?<idx>\d+)\.(?<ext>wav|aif|aiff)$/i);
  if (!m?.groups) return null;
  return {
    note: m.groups.note.toLowerCase(),
    idx: parseInt(m.groups.idx, 10),
    ext: m.groups.ext.toLowerCase(),
  };
}

function isProbableTrackStart(buf: Buffer, signatureOffset: number): boolean {
  if (signatureOffset < 4) return false;
  if (signatureOffset + 8 > buf.length) return false;
  if (!buf.subarray(signatureOffset, signatureOffset + 3).equals(TRACK_SIGNATURE_HEAD)) return false;
  if (!buf.subarray(signatureOffset + 4, signatureOffset + 8).equals(TRACK_SIGNATURE_TAIL)) return false;

  const pointerWord = buf.readUInt32LE(signatureOffset - 4);
  if ((pointerWord >>> 24) !== 0xf0) return false;
  return (pointerWord & 0x0000ffff) !== 0;
}

function findTrackBlocks(buf: Buffer): number[] {
  const offsets: number[] = [];
  let start = 0;

  while (start < buf.length - TRACK_SIGNATURE_HEAD.length - TRACK_SIGNATURE_TAIL.length) {
    const idx = buf.indexOf(TRACK_SIGNATURE_HEAD, start);
    if (idx === -1 || idx + 8 > buf.length) break;

    if (!isProbableTrackStart(buf, idx)) {
      start = idx + 1;
      continue;
    }

    offsets.push(idx);
    if (offsets.length === 16) break;
    start = idx + 8;
  }

  return offsets;
}

function splitProjectTracks(buf: Buffer): TrackBlock[] {
  const sigOffsets = findTrackBlocks(buf);
  if (sigOffsets.length !== 16) {
    throw new Error(`expected 16 track blocks, found ${sigOffsets.length}`);
  }

  return sigOffsets.map((sigOffset, index) => {
    const start = sigOffset - 4;
    const end = index + 1 < sigOffsets.length ? sigOffsets[index + 1]! - 4 : buf.length;
    return {
      preamble: buf.subarray(start, start + 4),
      body: buf.subarray(start + 4, end),
    };
  });
}

function findTrackSigsInBody(buf: Buffer): number[] {
  const offsets: number[] = [];
  let start = 0;

  while (start < buf.length - 8) {
    const idx = buf.indexOf(TRACK_SIGNATURE_HEAD, start);
    if (idx === -1) break;
    if (idx + 8 <= buf.length && buf.subarray(idx + 4, idx + 8).equals(TRACK_SIGNATURE_TAIL)) {
      offsets.push(idx);
      start = idx + 4;
    } else {
      start = idx + 1;
    }
  }

  return offsets;
}

function splitOverflow(track16: TrackBlock): TrackBlock[] {
  const sigs = findTrackSigsInBody(track16.body);
  if (sigs.length === 0) return [track16];

  return sigs.map((sigOffset, index) => {
    const end = index + 1 < sigs.length ? sigs[index + 1]! - 4 : track16.body.length;
    return {
      preamble: index === 0 ? track16.preamble : track16.body.subarray(sigOffset - 4, sigOffset),
      body: track16.body.subarray(sigOffset, end),
    };
  });
}

function extractLogicalEntries(tracks: TrackBlock[]): LogicalEntry[] {
  const raw = [...tracks.slice(0, 15), ...splitOverflow(tracks[15]!)];
  const entries: LogicalEntry[] = [];
  let ordinal = 0;

  for (let track = 1; track <= 16; track += 1) {
    if (ordinal >= raw.length) throw new Error(`ran out of raw entries before track ${track}`);
    const patternCount = raw[ordinal]!.preamble[1] || 1;

    for (let pattern = 1; pattern <= patternCount; pattern += 1) {
      if (ordinal >= raw.length) {
        throw new Error(`ran out of raw entries at track ${track} pattern ${pattern}`);
      }

      const block = raw[ordinal]!;
      const typeByte = block.body[9] ?? -1;
      const engineId = typeByte === 0x05 ? block.body[0x0d] ?? -1 : block.body[0x0b] ?? -1;
      entries.push({
        track,
        pattern,
        body: block.body,
        typeByte,
        engineId,
        active: typeByte === 0x07,
      });
      ordinal += 1;
    }
  }

  if (ordinal !== raw.length) {
    throw new Error(`logical mapping consumed ${ordinal}/${raw.length} raw entries`);
  }

  return entries;
}

function cleanPresetFolder(raw: string): string {
  const presetIndex = raw.indexOf('.preset');
  if (presetIndex >= 0) return raw.slice(0, presetIndex + '.preset'.length);
  return raw.replace(/[/.][A-Za-z0-9 #\-()_]+-(?:[a-g](?:#|b)?\d+)-\d+.*$/i, '');
}

function normalizePresetKind(kind: string | undefined, engineName?: string): ProjectPresetFolderKind {
  const clean = kind?.trim().toLowerCase();
  if (clean === 'drum' || clean === 'synth' || clean === 'multi' || clean === 'sample') return clean;
  if (clean === 'bass' || engineName === 'sampler') return 'sampler';
  if (engineName === 'multisampler') return 'multi';
  if (
    engineName === 'axis' ||
    engineName === 'dissolve' ||
    engineName === 'epiano' ||
    engineName === 'hardsync' ||
    engineName === 'organ' ||
    engineName === 'prism' ||
    engineName === 'simple' ||
    engineName === 'wavetable'
  ) {
    return 'synth';
  }
  return 'unknown';
}

function isPrintablePathByte(byte: number | undefined): boolean {
  if (byte == null) return false;
  return byte >= 0x20 && byte <= 0x7e;
}

function readFragmentedPath(buf: Buffer, start: number): string {
  const parts: string[] = [];
  let current = '';
  let zeroCount = 0;

  for (let i = start; i < Math.min(buf.length, start + 140); i += 1) {
    const byte = buf[i];
    if (isPrintablePathByte(byte)) {
      current += String.fromCharCode(byte!);
      zeroCount = 0;
      continue;
    }

    if (byte === 0x00) {
      if (current) {
        parts.push(current);
        current = '';
      }
      zeroCount += 1;
      if (zeroCount >= 2) break;
      continue;
    }

    break;
  }

  if (current) parts.push(current);
  return parts.join('');
}

function cleanFragmentedPresetPath(raw: string): string | null {
  const match = raw.match(/(?:^|\/)(?<name>nt-[a-z0-9 #\-()]+|bandpasser)(?:\.preset)?/i);
  const name = match?.groups?.name?.trim().replace(/\s+/g, ' ');
  if (!name) return null;
  return name;
}

function scanFragmentedPresetNames(body: Buffer, engineName?: string): ProjectPresetFolderHit[] {
  const hits = new Map<string, { kind: ProjectPresetFolderKind; count: number }>();

  for (let i = 0; i < body.length; i += 1) {
    if (body[i] !== PRESET_PATH_MARKER) continue;
    const raw = readFragmentedPath(body, i + 1);
    const name = cleanFragmentedPresetPath(raw);
    if (!name) continue;
    const slash = raw.indexOf('/');
    const kind = normalizePresetKind(slash > 0 ? raw.slice(0, slash) : undefined, engineName);
    const current = hits.get(name) ?? { kind, count: 0 };
    current.count += 1;
    hits.set(name, current);
  }

  for (const needle of ['nt-', 'bandpass']) {
    let start = 0;
    while (start < body.length) {
      const idx = body.indexOf(needle, start, 'latin1');
      if (idx < 0) break;
      const raw = readFragmentedPath(body, idx);
      const name = cleanFragmentedPresetPath(raw);
      if (name) {
        const current = hits.get(name) ?? { kind: normalizePresetKind(undefined, engineName), count: 0 };
        current.count += 1;
        hits.set(name, current);
      }
      start = idx + needle.length;
    }
  }

  return [...hits.entries()].map(([folder, { kind, count }]) => ({
    folder,
    kind,
    hitCount: count,
    confidence: count > 1 ? 'medium' : 'weak',
  }));
}

function scanPresetFolders(body: Buffer, engineName?: string): ProjectPresetFolderHit[] {
  const text = body.toString('latin1');
  const counts = new Map<string, { kind: ProjectPresetFolderKind; count: number }>();

  for (const match of text.matchAll(PRESET_FOLDER_RE)) {
    const kind = normalizePresetKind(match[1], engineName);
    const folder = cleanPresetFolder(match[0]);
    const current = counts.get(folder) ?? { kind, count: 0 };
    current.count += 1;
    counts.set(folder, current);
  }

  const folderHits = [...counts.entries()]
    .map(([folder, { kind, count }]) => ({
      folder,
      kind,
      hitCount: count,
      confidence: count >= 24 && kind === 'drum' ? 'strong' : count > 1 ? 'medium' : 'weak',
    }) satisfies ProjectPresetFolderHit)
    .sort((a, b) => b.hitCount - a.hitCount || a.folder.localeCompare(b.folder));

  const fragmentedHits = scanFragmentedPresetNames(body, engineName).filter(
    (hit) =>
      !folderHits.some(
        (folderHit) =>
          folderHit.folder === hit.folder ||
          folderHit.folder.replace(/\.preset$/i, '').endsWith(`/${hit.folder}`),
      ),
  );

  return [...folderHits, ...fragmentedHits].sort(
    (a, b) => b.hitCount - a.hitCount || a.folder.localeCompare(b.folder),
  );
}

export function inspectProjectBuffer(buf: Buffer): ProjectInspection {
  const warnings: string[] = [];
  if (buf.length < 0x80 || !buf.subarray(0, 4).equals(XY_MAGIC)) {
    return {
      parseStatus: 'unsupported',
      tracks: [],
      warnings: ['not an OP-XY .xy project container'],
    };
  }

  try {
    const entries = extractLogicalEntries(splitProjectTracks(buf));
    const grouped = new Map<number, ProjectPatternInspection[]>();

    for (const entry of entries) {
      const patterns = grouped.get(entry.track) ?? [];
      const presetRefs = entry.active ? scanPresetFolders(entry.body, ENGINE_NAMES.get(entry.engineId)) : [];
      patterns.push({
        patternNumber: entry.pattern,
        active: entry.active,
        engineId: entry.engineId >= 0 ? entry.engineId : undefined,
        engineName: ENGINE_NAMES.get(entry.engineId),
        bodyLength: entry.body.length,
        presetRefs,
        inferredPresetFolders: presetRefs,
      });
      grouped.set(entry.track, patterns);
    }

    const tracks = [...grouped.entries()].map(([trackNumber, patterns]) => ({
      trackNumber,
      patterns,
    }));

    for (const track of tracks) {
      for (const pattern of track.patterns) {
        if (pattern.active && pattern.presetRefs.length === 0) {
          warnings.push(`T${track.trackNumber} P${pattern.patternNumber}: no preset folder seed found`);
        }
      }
    }

    return {
      parseStatus: warnings.length > 0 ? 'partial' : 'ok',
      tracks,
      warnings,
    };
  } catch (error) {
    return {
      parseStatus: 'error',
      tracks: [],
      warnings: [error instanceof Error ? error.message : String(error)],
    };
  }
}

function inspectProjectFile(fullPath: string): ProjectInspection | undefined {
  try {
    const buf = fs.readFileSync(fullPath);
    if (buf.length === 0 || buf.length > 50 * 1024 * 1024) return undefined;
    const inspection = inspectProjectBuffer(buf);
    return inspection.parseStatus === 'unsupported' ? undefined : inspection;
  } catch {
    return undefined;
  }
}

export interface ProjectListEntry {
  relativePath: string;
  name: string;
  referencedSamples: string[];
  inspection?: ProjectInspection;
}

export function listProjects(cacheRoot: string): ProjectListEntry[] {
  const projectsRoot = path.join(cacheRoot, 'projects');
  if (!fs.existsSync(projectsRoot)) return [];

  const index = ensureIndex(cacheRoot);
  const projectSamples = new Map<string, Set<string>>();
  for (const [filename, refs] of index) {
    for (const ref of refs) {
      const set = projectSamples.get(ref.projectRelPath) ?? new Set<string>();
      set.add(filename);
      projectSamples.set(ref.projectRelPath, set);
    }
  }

  const files: string[] = [];
  walkFiles(projectsRoot, cacheRoot, files);

  const entries: ProjectListEntry[] = [];
  for (const rel of files) {
    if (!rel.startsWith('projects/')) continue;
    const name = path.basename(rel).replace(/\.xy$/i, '') || rel;
    entries.push({
      relativePath: rel,
      name,
      referencedSamples: [...(projectSamples.get(rel) ?? [])].sort((a, b) => a.localeCompare(b)),
      inspection: inspectProjectFile(path.join(cacheRoot, rel)),
    });
  }

  return entries.sort((a, b) => a.name.localeCompare(b.name));
}

export function invalidateProjectIndex(): void {
  cachedIndex = null;
  cachedSummary = null;
  cachedRoot = null;
}
