/**
 * OP-XY device content types — device MTP scan + reference material.
 */

export type DevicePresetType =
  | 'drum'
  | 'sampler'
  | 'axis'
  | 'dissolve'
  | 'epiano'
  | 'hardsync'
  | 'organ'
  | 'prism'
  | 'simple'
  | 'wavetable';

export type SamplePresetType = 'drum' | 'sampler';

export type SynthEngineType = Exclude<DevicePresetType, SamplePresetType>;

export type AppTab = 'device' | 'drum' | 'multisample';

export function normalizePresetType(type: string): DevicePresetType | string {
  if (type === 'multisampler') return 'sampler';
  return type;
}

export function isSampleBasedPreset(type: string, regions: unknown[]): type is SamplePresetType {
  const t = normalizePresetType(type);
  return (t === 'drum' || t === 'sampler') && regions.length > 0;
}

export const ALLOWED_NAME_CHARS = /^[a-zA-Z0-9 #\-()]+$/;

export const DEVICE_SAMPLE_FILENAME =
  /^(?<base>.+)-(?<note>[a-g](?:#|b)?\d+)-(?<idx>\d+)\.(?<ext>wav|aif|aiff)$/i;

export interface ParsedSampleName {
  base: string;
  note: string;
  idx: number;
  ext: string;
}

export function parseDeviceSampleFilename(filename: string): ParsedSampleName | null {
  const m = filename.match(DEVICE_SAMPLE_FILENAME);
  if (!m?.groups) return null;
  return {
    base: m.groups.base,
    note: m.groups.note.toLowerCase(),
    idx: parseInt(m.groups.idx, 10),
    ext: m.groups.ext.toLowerCase(),
  };
}

export const DRUM_PAD_LABELS = [
  'KD1', 'KD2', 'SD1', 'SD2', 'RIM', 'CLP', 'TB', 'SH', 'CH', 'CL1', 'OH', 'CAB',
  'LT1', 'RC', 'MT', 'CC', 'HT', 'COW', 'TRI', 'LT2', 'LC', 'WS', 'HC', 'GUI',
] as const;

export const DRUM_MIDI_START = 53;

export function drumPadLabel(hikey: number): string | undefined {
  return DRUM_PAD_LABELS[hikey - DRUM_MIDI_START];
}

export interface ModulationTarget {
  amount: number;
  target: number;
}

export interface PatchEngine {
  bendrange: number;
  highpass: number;
  playmode: string;
  transpose: number;
  volume: number;
  width: number;
  'velocity.sensitivity': number;
  'portamento.amount': number;
  'portamento.type': number;
  'tuning.root': number;
  'tuning.scale': number;
  params: number[];
  modulation: {
    aftertouch: ModulationTarget;
    modwheel: ModulationTarget;
    pitchbend: ModulationTarget;
    velocity: ModulationTarget;
  };
}

export interface PatchEnvelope {
  amp: { attack: number; decay: number; release: number; sustain: number };
  filter: { attack: number; decay: number; release: number; sustain: number };
}

export interface PatchFx {
  active: boolean;
  type: string;
  params: number[];
}

export interface PatchLfo {
  active: boolean;
  type: string;
  params: number[];
}

export interface DrumRegion {
  'fade.in': number;
  'fade.out': number;
  framecount: number;
  hikey: number;
  lokey: number;
  pan: number;
  'pitch.keycenter': number;
  playmode: string;
  reverse: boolean;
  sample: string;
  'sample.end': number;
  transpose: number;
  tune: number;
  gain?: number;
  'sample.start'?: number;
}

export interface SamplerRegion {
  framecount: number;
  hikey: number;
  lokey: number;
  'pitch.keycenter': number;
  reverse: boolean;
  sample: string;
  'sample.end': number;
  tune: number;
  'loop.start': number;
  'loop.end': number;
  'loop.onrelease': boolean;
  'loop.crossfade': number;
  gain?: number;
  'loop.enabled'?: boolean;
  'sample.start'?: number;
}

export interface PatchJson {
  platform: 'OP-XY';
  version: number;
  type: DevicePresetType | string;
  octave: number;
  name?: string;
  engine: PatchEngine;
  envelope: PatchEnvelope;
  fx: PatchFx;
  lfo: PatchLfo;
  regions: DrumRegion[] | SamplerRegion[];
}

export interface CachePresetEntry {
  relativePath: string;
  category: string;
  name: string;
  type: string;
  sampleBased: boolean;
  sampleCount: number;
  unnamedCount?: number;
}

export interface CacheSampleEntry {
  relativePath: string;
  filename: string;
  base: string;
  note: string;
  idx: number;
  isUnnamed: boolean;
}

export interface SourceFolderEntry {
  id: string;
  path: string;
  label: string;
  sampleCount: number;
  presetCount: number;
  lastScannedAt: number | null;
  flags: Array<'missing_folder' | 'scan_failed'>;
}

export interface SourceSampleEntry {
  id: string;
  folderId: string;
  folderLabel: string;
  absolutePath: string;
  relativePath: string;
  filename: string;
  extension: string;
  sizeBytes: number;
  mtimeMs: number;
  alreadyInSet: boolean;
}

export interface SourcePresetEntry {
  id: string;
  folderId: string;
  folderLabel: string;
  absolutePath: string;
  relativePath: string;
  folderName: string;
  name: string;
  type: string;
  sampleRefs: string[];
  availableSampleRefs: string[];
  missingSampleRefs: string[];
  mtimeMs: number;
  alreadyInSet: boolean;
  flags: Array<'missing_patch' | 'malformed_patch' | 'missing_refs' | 'already_in_set'>;
}

export interface SourceLibraryScanResult {
  folders: SourceFolderEntry[];
  samples: SourceSampleEntry[];
  presets: SourcePresetEntry[];
  scannedAt: number;
}

export interface SourceSampleCopyResult {
  ok: boolean;
  copied: Array<{ sourcePath: string; targetRelativePath: string }>;
  replaced: Array<{ sourcePath: string; targetRelativePath: string }>;
  skipped: Array<{ sourcePath: string; reason: string }>;
  conflicts: Array<{ sourcePath: string; targetRelativePath: string }>;
  error?: string;
}

export interface SourceSampleCopyOptions {
  conflict: 'skip' | 'replace';
}

export interface SourcePresetCopyResult {
  ok: boolean;
  copied: Array<{ sourcePath: string; targetRelativePath: string }>;
  replaced: Array<{ sourcePath: string; targetRelativePath: string }>;
  skipped: Array<{ sourcePath: string; reason: string }>;
  conflicts: Array<{ sourcePath: string; targetRelativePath: string }>;
  sampleResult: SourceSampleCopyResult;
  missingSampleRefs: Array<{ sourcePath: string; ref: string }>;
  error?: string;
}

export interface SourcePresetCopyOptions {
  conflict: 'skip' | 'replace';
  includeSamples?: boolean;
}

export interface PresetRegionEntry {
  index: number;
  sample: string;
  hikey?: number;
  lokey?: number;
  rootNote?: number;
  base: string;
  note: string;
  idx: number;
  isUnnamed: boolean;
  hasAudio: boolean;
}

export interface PresetDetail {
  relativePath: string;
  name: string;
  category: string;
  type: string;
  patchJson: string;
  regions: PresetRegionEntry[];
}

export interface PresetWritePayload {
  category: string;
  presetName: string;
  patchJson: string;
  files: Array<{ name: string; data: number[] }>;
}

export function generateDeviceSampleFilename(
  base: string,
  rootNote: number,
  idx: number,
  ext: string = 'wav',
): string {
  const cleanBase = base.replace(/[^a-zA-Z0-9 #\-()]+/g, '').trim() || 'unnamed';
  const noteNames = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'];
  const octave = Math.floor(rootNote / 12) - 1;
  const note = `${noteNames[rootNote % 12]}${octave}`;
  return `${cleanBase}-${note}-${idx}.${ext.toLowerCase()}`;
}

export function isUnnamedBase(base: string): boolean {
  return /^unnamed(\s+\d+)?$/i.test(base.trim());
}

export interface DeviceStatus {
  connected: boolean;
  deviceName: string | null;
  cacheRoot: string;
  lastPullAt: number | null;
  lastBackupAt?: number | null;
  presetCount?: number;
  sampleCount?: number;
  dirtyPresetCount?: number;
  error?: string | null;
}

export interface BackupEntry {
  id: string;
  path: string;
  createdAt: string;
  presetCount: number;
  sampleCount: number;
}

export interface ProjectReference {
  projectRelPath: string;
  projectName: string;
}

export interface RenameImpact {
  oldFilename: string;
  newFilename: string;
  presetRefs: string[];
  projectRefs: ProjectReference[];
}

export interface ProjectListEntry {
  relativePath: string;
  name: string;
  referencedSamples: string[];
  inspection?: import('./sync').ProjectInspection;
}

export interface ProjectIndexSummary {
  projectCount: number;
  scannedFiles: number;
  referencedFilenames: number;
  builtAt: number;
}

export interface OpxyApi {
  device: {
    status(): Promise<DeviceStatus>;
    pull(): Promise<{ ok: boolean; error?: string; presetCount?: number; sampleCount?: number }>;
    push(): Promise<{ ok: boolean; error?: string; deviceName?: string }>;
    backup(): Promise<{ ok: boolean; path?: string; presetCount?: number; sampleCount?: number; error?: string }>;
    restoreBackup(backupPath: string): Promise<{ ok: boolean; error?: string }>;
    listBackups(): Promise<BackupEntry[]>;
    showBackup(backupPath: string): Promise<void>;
    cacheRoot(): Promise<string>;
    listPresets(): Promise<CachePresetEntry[]>;
    listStandaloneSamples(): Promise<CacheSampleEntry[]>;
    listSourceFolders(): Promise<SourceFolderEntry[]>;
    addSourceFolder(): Promise<{ ok: boolean; folder?: SourceFolderEntry; error?: string; cancelled?: boolean }>;
    removeSourceFolder(folderId: string): Promise<{ ok: boolean; folders?: SourceFolderEntry[]; error?: string }>;
    scanSourceFolders(): Promise<SourceLibraryScanResult>;
    copySourceSamplesToSet(sourcePaths: string[], options?: SourceSampleCopyOptions): Promise<SourceSampleCopyResult>;
    copySourcePresetsToSet(sourcePaths: string[], options?: SourcePresetCopyOptions): Promise<SourcePresetCopyResult>;
    listCategories(): Promise<string[]>;
    getPresetDetail(relativePath: string): Promise<PresetDetail>;
    renameSampleInPreset(
      presetPath: string,
      oldFilename: string,
      newBase: string,
    ): Promise<{ ok: boolean; newFilename?: string; error?: string }>;
    renameStandaloneSample(
      relativePath: string,
      newBase: string,
    ): Promise<{ ok: boolean; newFilename?: string; relativePath?: string; error?: string }>;
    writePreset(payload: PresetWritePayload): Promise<{ ok: boolean; relativePath?: string; error?: string }>;
    listDirtyPresets(): Promise<string[]>;
    clearDirtyPreset(relativePath: string): Promise<void>;
    readText(relativePath: string): Promise<string>;
    readBytes(relativePath: string): Promise<ArrayBuffer>;
    exportPresetZip(presetName: string, zipBase64: string): Promise<{ ok: boolean; path?: string; error?: string }>;
    buildProjectIndex(): Promise<ProjectIndexSummary | null>;
    listProjects(): Promise<ProjectListEntry[]>;
    getRenameImpact(oldFilename: string, newBase: string): Promise<RenameImpact>;
  };
}

declare global {
  interface Window {
    opxy?: OpxyApi;
  }
}

export {};
