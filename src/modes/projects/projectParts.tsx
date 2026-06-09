import { useEffect, useMemo, useState } from 'react';
import { DataButton } from '../data/dataParts';
import type { ProjectArrangeState } from '../../hooks/useProjectArrange';
import { formatPatternPresetLabel } from '../../utils/projectPatternLabel';
import type { CachePresetEntry } from '../../types/opxy';

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M5 7h14M5 12h14M5 17h14" />
      <path d="M9 5v14M15 5v14" />
    </svg>
  );
}

function RefsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M8 6h8M8 12h8M8 18h5" />
    </svg>
  );
}

function SceneIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <rect x="5" y="5" width="14" height="14" />
      <path d="M9 9h6M9 12h4M9 15h6" />
    </svg>
  );
}

function InspectIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="11" cy="11" r="5" />
      <path d="M15 15l4 4" />
    </svg>
  );
}

function DiscardIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M5 7h11a4 4 0 0 1 0 8H8" />
      <path d="M8 4 5 7l3 3" />
      <path d="M8 19h10" />
    </svg>
  );
}

function PresetIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <rect x="5" y="8" width="14" height="10" />
      <path d="M8 8V6h8v2" />
    </svg>
  );
}

function presetSort(a: CachePresetEntry, b: CachePresetEntry): number {
  return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
}

/** Read-only project toolbar: arrange editing waits for safe scene/song writing. */
export function ArrangeToolbar({
  arrange,
  presets = [],
  onOpenPreset,
}: {
  arrange: ProjectArrangeState;
  presets?: CachePresetEntry[];
  onOpenPreset?: (presetName: string) => void;
}) {
  const selectedTrack = arrange.selectedTrack ?? arrange.focusedPattern?.track ?? null;
  const selectedPattern =
    arrange.focusedPattern?.pattern ??
    (selectedTrack != null ? arrange.scene?.[selectedTrack] ?? 1 : null);
  const selectedCell =
    selectedTrack != null && selectedPattern != null
      ? arrange.arrangement?.tracks[selectedTrack]?.patterns[selectedPattern]
      : undefined;
  const selectedPreset = formatPatternPresetLabel(selectedCell);
  const refMeta = [selectedCell?.refKind, selectedCell?.confidence].filter(Boolean).join(' · ') || 'unresolved';
  const selectedPresetPath = selectedCell?.presetPath ?? '';
  const selectedPresetEntry = presets.find((preset) => preset.relativePath === selectedPresetPath);
  const categoryOptions = useMemo(
    () => [...new Set(presets.map((preset) => preset.category).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [presets],
  );
  const [categoryFilter, setCategoryFilter] = useState('all');
  const selectionKey = selectedTrack != null && selectedPattern != null ? `${selectedTrack}:${selectedPattern}` : 'none';

  useEffect(() => {
    if (selectedPresetEntry?.category) {
      setCategoryFilter(selectedPresetEntry.category);
      return;
    }
    if (categoryFilter !== 'all' && !categoryOptions.includes(categoryFilter)) {
      setCategoryFilter('all');
    }
  }, [categoryFilter, categoryOptions, selectedPresetEntry?.category, selectionKey]);

  const presetOptions = presets
    .filter((preset) => categoryFilter === 'all' || preset.category === categoryFilter)
    .slice()
    .sort(presetSort);
  const selectionLabel =
    selectedTrack != null && selectedPattern != null
      ? `t${selectedTrack} · p${selectedPattern}`
      : 'no selection';

  return (
    <div className="arrange-toolbar">
      <div className="arrange-toolbar-left">
        <DataButton label="grid" ariaLabel="pattern config inventory">
          <GridIcon />
        </DataButton>
        <DataButton label="refs" ariaLabel="sample references">
          <RefsIcon />
        </DataButton>
      </div>
      <div className="arrange-selection" aria-label="selected pattern config">
        <span className="mono arrange-selection__slot">{selectionLabel}</span>
        <span className="arrange-selection__preset">{selectedTrack == null ? 'select track' : selectedPreset}</span>
        <span className="mono arrange-selection__meta">{refMeta}</span>
      </div>
      <label className="arrange-compose" aria-label="assign instrument to selected pattern config">
        <span className="mono">instrument</span>
        <select
          className="arrange-compose__category"
          value={categoryFilter}
          disabled={selectedTrack == null || selectedPattern == null || categoryOptions.length === 0}
          onChange={(event) => setCategoryFilter(event.currentTarget.value)}
          aria-label="filter assignable presets by category"
        >
          <option value="all">all</option>
          {categoryOptions.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <select
          value={selectedPresetPath}
          disabled={selectedTrack == null || selectedPattern == null || presetOptions.length === 0}
          onChange={(event) => {
            if (selectedTrack == null || selectedPattern == null) return;
            const preset = presetOptions.find((item) => item.relativePath === event.currentTarget.value);
            if (!preset) return;
            arrange.assignPatternPreset(selectedTrack, selectedPattern, {
              name: preset.name,
              path: preset.relativePath,
              type: preset.type,
              category: preset.category,
            });
          }}
          aria-label="assign preset to selected pattern config"
        >
          <option value="">
            {presetOptions.length === 0 ? 'pull presets first' : 'choose preset'}
          </option>
          {presetOptions.map((preset) => (
            <option key={preset.relativePath} value={preset.relativePath}>
              {preset.category} / {preset.name}
            </option>
          ))}
        </select>
      </label>
      <div className="arrange-toolbar-right">
        <span className="mono arrange-write-status">
          {arrange.draftCount > 0
            ? arrange.canWriteProject ? `${arrange.draftCount} ready`
            : `${arrange.draftCount} draft · xy write blocked`
            : 'inspect mode'}
        </span>
        <DataButton label="scene" ariaLabel="scene data status" disabled>
          <SceneIcon />
        </DataButton>
        <DataButton
          label="discard"
          ariaLabel="discard local project drafts"
          disabled={arrange.draftCount === 0}
          onClick={arrange.discardDrafts}
        >
          <DiscardIcon />
        </DataButton>
        <DataButton label="inspect" ariaLabel={`inspect selected pattern config ${selectionLabel}`} disabled={selectedTrack == null}>
          <InspectIcon />
        </DataButton>
        <DataButton
          label="preset"
          ariaLabel={`open preset from selected pattern config ${selectedPreset}`}
          disabled={selectedTrack == null || selectedPreset === 'custom' || selectedPreset === 'empty'}
          onClick={() => onOpenPreset?.(selectedPreset)}
        >
          <PresetIcon />
        </DataButton>
      </div>
    </div>
  );
}
