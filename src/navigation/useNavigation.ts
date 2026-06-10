import type { PresetSubmode } from '../types/navigation';
import { useAppShell } from './AppShellContext';

export function useNavigation() {
  const { navigate } = useAppShell();

  return {
    navigate,
    goToData: () => navigate({ mode: 'data' }),
    goToProjects: (projectFilename?: string | null) =>
      navigate({ mode: 'projects', projectFilename }),
    goToPresets: (presetPath?: string | null, submode?: PresetSubmode) =>
      navigate({ mode: 'presets', presetPath, presetSearchQuery: null, presetSubmode: submode }),
    openPresetSearch: (query: string) =>
      navigate({ mode: 'presets', presetPath: null, presetSearchQuery: query }),
    goToSamples: (sampleFilename?: string | null) =>
      navigate({ mode: 'samples', sampleFilename }),
    openPresetRef: (presetPath: string) =>
      navigate({ mode: 'presets', presetPath }),
    openSampleRef: (filename: string) =>
      navigate({ mode: 'samples', sampleFilename: filename }),
    openProjectRef: (filename: string) =>
      navigate({ mode: 'projects', projectFilename: filename }),
  };
}
