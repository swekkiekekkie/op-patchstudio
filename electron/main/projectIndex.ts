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

let cachedIndex: Map<string, ProjectReference[]> | null = null;
let cachedSummary: ProjectIndexSummary | null = null;
let cachedRoot: string | null = null;

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

export interface ProjectListEntry {
  relativePath: string;
  name: string;
  referencedSamples: string[];
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
    });
  }

  return entries.sort((a, b) => a.name.localeCompare(b.name));
}

export function invalidateProjectIndex(): void {
  cachedIndex = null;
  cachedSummary = null;
  cachedRoot = null;
}
