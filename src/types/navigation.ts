export type AppMode = 'data' | 'projects' | 'presets' | 'samples';

export type PresetSubmode = 'edit' | 'regions';

export interface NavigationState {
  mode: AppMode;
  presetPath?: string | null;
  projectFilename?: string | null;
  sampleFilename?: string | null;
  presetSubmode?: PresetSubmode;
}

export interface NavigateOptions {
  mode: AppMode;
  presetPath?: string | null;
  projectFilename?: string | null;
  sampleFilename?: string | null;
  presetSubmode?: PresetSubmode;
}

export const MODE_ORDER: readonly AppMode[] = [
  'data',
  'projects',
  'presets',
  'samples',
];

export const MODE_TAB_LABELS: Record<AppMode, string> = {
  data: 'data',
  projects: 'proj',
  presets: 'pre',
  samples: 'smp',
};
