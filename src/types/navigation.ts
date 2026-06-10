export type AppMode = 'data' | 'projects' | 'presets' | 'samples';

export type PresetSubmode = 'overview' | 'regions' | 'edit';

export interface NavigationState {
  mode: AppMode;
  presetPath?: string | null;
  presetSearchQuery?: string | null;
  projectFilename?: string | null;
  sampleFilename?: string | null;
  presetSubmode?: PresetSubmode;
}

export interface NavigateOptions {
  mode: AppMode;
  presetPath?: string | null;
  presetSearchQuery?: string | null;
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
  data: 'sets',
  projects: 'projects',
  presets: 'presets',
  samples: 'library',
};
