import { useEffect, useMemo, useState } from 'react';
import type { CachePresetEntry } from '../../types/opxy';
import { LibraryWorkspace, ModeScreen } from '../../ui';
import { useAppShell } from '../../navigation/AppShellContext';
import { filterPresets } from '../../utils/presetFilters';
import { PresetList } from './PresetList';
import { PresetDetailPane } from './PresetDetailPane';

interface PresetsModeProps {
  presets: CachePresetEntry[];
  dirtyPresets: string[];
  busy: boolean;
  onRenamed: () => void;
}

export function PresetsMode({ presets, dirtyPresets, busy, onRenamed }: PresetsModeProps) {
  const { state, navigate } = useAppShell();
  const [selectedPath, setSelectedPath] = useState<string | null>(state.presetPath ?? null);

  useEffect(() => {
    if (state.presetPath) setSelectedPath(state.presetPath);
  }, [state.presetPath]);

  const filtered = useMemo(
    () => filterPresets(presets, { searchQuery: '', unnamedOnly: false, modifiedOnly: false, typeFilter: 'all', selectedCategories: [] }, dirtyPresets),
    [presets, dirtyPresets],
  );

  const selected = filtered.find((p) => p.relativePath === selectedPath) ?? null;

  const selectPreset = (path: string) => {
    setSelectedPath(path);
    navigate({ mode: 'presets', presetPath: path });
  };

  return (
    <ModeScreen>
      <LibraryWorkspace
        showDetail={!!selected}
        list={
          <PresetList
            presets={presets}
            dirtyPresets={dirtyPresets}
            selectedPath={selectedPath}
            onSelect={selectPreset}
          />
        }
        detail={
          selected ? (
            <PresetDetailPane
              preset={selected}
              filteredPresets={filtered}
              isDirty={dirtyPresets.includes(selected.relativePath.replace(/\\/g, '/'))}
              busy={busy}
              onRenamed={onRenamed}
              onNavigate={selectPreset}
            />
          ) : null
        }
        empty={<span>—</span>}
      />
    </ModeScreen>
  );
}
