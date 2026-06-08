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
}

export type ProjectPatternPresetKind = 'named' | 'custom' | 'tweaked';

export interface ProjectPatternCell {
  preset: string;
  kind?: ProjectPatternPresetKind;
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
