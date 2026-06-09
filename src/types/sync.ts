export interface StorageUsage {
  presets: number;
  samples: number;
  projects: number;
  other: number;
}

export interface SetStats {
  presets: number;
  samples: number;
  projects: number;
}

export interface SetSummary {
  id: string;
  name: string;
  usage: StorageUsage;
  stats: SetStats;
  commits: string[];
  lastPushedToDevice: boolean;
}

export interface StorageBarSegment {
  key: keyof StorageUsage | 'free';
  widthPct: number;
}

export interface StorageBarModel {
  usedGb: number;
  freeGb: number;
  segments: StorageBarSegment[];
}

export const DEVICE_CAPACITY_GB = 8;

export interface ProjectListItem {
  id: string;
  name: string;
  relativePath: string;
  sceneCount: number;
  inspection?: ProjectInspection;
}

export type ProjectPatternPresetKind = 'named' | 'custom' | 'tweaked';

export interface ProjectPatternCell {
  preset: string;
  kind?: ProjectPatternPresetKind;
  refKind?: ProjectPresetFolderKind;
  confidence?: ProjectPresetFolderHit['confidence'];
  presetPath?: string;
  draft?: boolean;
}

export interface ProjectTrackData {
  patterns: Record<number, ProjectPatternCell>;
}

export interface ProjectSampleRef {
  filename: string;
  status: 'found' | 'missing';
  linkLabel?: string;
  goto?: 'presets' | 'samples' | 'projects';
  target?: string;
}

export interface ProjectArrangement {
  filename: string;
  tempo: number;
  sceneCount: number;
  refs: { total: number; missing: number };
  tracks: Record<number, ProjectTrackData>;
  scenes: Array<Record<number, number>>;
  sampleRefs: ProjectSampleRef[];
}

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
  /** @deprecated use presetRefs; kept while app code migrates from the first TS parser spike. */
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
