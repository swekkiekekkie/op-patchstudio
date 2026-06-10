import { useEffect, useMemo, useState } from 'react';
import type { CachePresetEntry } from '../../types/opxy';
import { normalizePresetType } from '../../types/opxy';
import { Segments, SearchField } from '../../ui';
import {
  type PresetFilterState,
  type PresetTypeFilter,
} from '../../utils/presetFilters';
import { buildPresetHierarchy, findPresetHierarchySelection } from '../../utils/presetHierarchy';

const TYPE_FILTERS: { id: PresetTypeFilter; label: string }[] = [
  { id: 'all', label: 'all' },
  { id: 'drum', label: 'drum' },
  { id: 'synth', label: 'synth' },
  { id: 'sampler', label: 'smpl' },
  { id: 'multi', label: 'multi' },
];

interface PresetListProps {
  presets: CachePresetEntry[];
  filteredPresets: CachePresetEntry[];
  dirtyPresets: string[];
  filters: PresetFilterState;
  onFiltersChange: (filters: PresetFilterState) => void;
  selectedPath: string | null;
  onSelect: (path: string) => void;
}

interface PresetLibraryStats {
  sampleBased: number;
  synth: number;
  unnamed: number;
  modified: number;
}

function dirtyKey(preset: CachePresetEntry): string {
  return preset.relativePath.replace(/\\/g, '/');
}

function classifyPreset(preset: CachePresetEntry): string {
  if (!preset.sampleBased) return 'synth';
  const kind = normalizePresetType(preset.type);
  if (kind === 'sampler' && preset.sampleCount > 12) return 'multi';
  return String(kind);
}

export function PresetList({
  presets,
  filteredPresets,
  dirtyPresets,
  filters,
  onFiltersChange,
  selectedPath,
  onSelect,
}: PresetListProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const dirtySet = useMemo(() => new Set(dirtyPresets), [dirtyPresets]);

  const hierarchy = useMemo(() => buildPresetHierarchy(filteredPresets), [filteredPresets]);
  const searchActive = filters.searchQuery.trim().length > 0;

  const stats = useMemo<PresetLibraryStats>(() => ({
    sampleBased: presets.filter((p) => p.sampleBased).length,
    synth: presets.filter((p) => !p.sampleBased).length,
    unnamed: presets.reduce((sum, p) => sum + (p.unnamedCount ?? 0), 0),
    modified: presets.filter((p) => dirtySet.has(dirtyKey(p))).length,
  }), [presets, dirtySet]);

  useEffect(() => {
    if ((!selectedPath || !filteredPresets.some((p) => p.relativePath === selectedPath)) && filteredPresets.length > 0) {
      onSelect(filteredPresets[0]!.relativePath);
    }
  }, [filteredPresets, selectedPath, onSelect]);

  useEffect(() => {
    const selection = findPresetHierarchySelection(hierarchy, selectedPath);
    setSelectedCategoryId(selection.categoryId);
    setSelectedGroupId(selection.groupId);
  }, [hierarchy, selectedPath]);

  const presetMeta = (p: CachePresetEntry) => {
    const bits = [classifyPreset(p)];
    if (p.sampleBased) bits.push(`${p.sampleCount} rgn`);
    if (p.unnamedCount) bits.push(`?${p.unnamedCount}`);
    if (dirtySet.has(dirtyKey(p))) bits.push('changed');
    return bits.join(' · ');
  };

  const setFilter = <K extends keyof PresetFilterState>(key: K, value: PresetFilterState[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const selectedCategory = hierarchy.categories.find((category) => category.id === selectedCategoryId) ?? hierarchy.categories[0] ?? null;
  const selectedGroup = selectedCategory?.groups.find((group) => group.id === selectedGroupId) ?? selectedCategory?.groups[0] ?? null;

  const hierarchyPresetIndex = (preset: CachePresetEntry) => {
    const items = selectedGroup?.presets ?? filteredPresets;
    return items.findIndex((item) => item.relativePath === preset.relativePath);
  };

  const renderPresetRow = (p: CachePresetEntry, index: number) => (
    <button
      key={p.relativePath}
      type="button"
      className={`object-row preset-row${selectedPath === p.relativePath ? ' selected' : ''}${p.unnamedCount ? ' needs-rename' : ''}${dirtySet.has(dirtyKey(p)) ? ' changed' : ''}`}
      onClick={() => onSelect(p.relativePath)}
    >
      <span className="idx">{String(index + 1).padStart(2, '0')}</span>
      <span className="name">
        <span>{p.name}</span>
        <span className="path mono">{p.relativePath}</span>
      </span>
      <span className="meta">{presetMeta(p)}</span>
    </button>
  );

  const groupMeta = (items: CachePresetEntry[]) => {
    const changed = items.filter((preset) => dirtySet.has(dirtyKey(preset))).length;
    return changed > 0 ? `${items.length} · ${changed} changed` : String(items.length);
  };

  return (
    <>
      <div className="library-toolbar">
        <Segments options={TYPE_FILTERS} value={filters.typeFilter} onChange={(v) => setFilter('typeFilter', v as PresetTypeFilter)} />
        <div className="filter-toggles">
          <button type="button" className={`filter-toggle${filters.unnamedOnly ? ' active' : ''}`} onClick={() => setFilter('unnamedOnly', !filters.unnamedOnly)} title="unnamed">?</button>
          <button type="button" className={`filter-toggle${filters.modifiedOnly ? ' active' : ''}`} onClick={() => setFilter('modifiedOnly', !filters.modifiedOnly)} title="modified">●</button>
        </div>
        <SearchField value={filters.searchQuery} onChange={(value) => setFilter('searchQuery', value)} placeholder="search presets" />
      </div>

      <div className="preset-library-stats" aria-label="preset library summary">
        <span><strong>{presets.length}</strong> total</span>
        <span><strong>{stats.sampleBased}</strong> sample</span>
        <span><strong>{stats.synth}</strong> synth</span>
        <span><strong>{stats.unnamed}</strong> unnamed</span>
        <span><strong>{stats.modified}</strong> changed</span>
      </div>

      <div className="list-toolbar">
        <span className="mono">showing {filteredPresets.length}/{presets.length}</span>
        <span className="mono">{searchActive ? 'search results' : 'folder / group / preset'}</span>
      </div>

      <div className="library-list-scroll">
        {searchActive ? (
          filteredPresets.map((p, i) => renderPresetRow(p, i))
        ) : (
          <div className="hierarchy-browser preset-hierarchy-browser">
            <div className="hierarchy-column" aria-label="preset folders">
              {hierarchy.categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={`hierarchy-row${selectedCategory?.id === category.id ? ' selected' : ''}`}
                  onClick={() => {
                    setSelectedCategoryId(category.id);
                    setSelectedGroupId(category.groups[0]?.id ?? null);
                  }}
                >
                  <span>{category.label}</span>
                  <span className="mono">{category.presets.length}</span>
                </button>
              ))}
            </div>
            <div className="hierarchy-column" aria-label="preset groups">
              {selectedCategory?.groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  className={`hierarchy-row${selectedGroup?.id === group.id ? ' selected' : ''}${group.kind === 'loose' ? ' muted' : ''}`}
                  onClick={() => setSelectedGroupId(group.id)}
                >
                  <span>{group.label}</span>
                  <span className="mono">{groupMeta(group.presets)}</span>
                </button>
              ))}
            </div>
            <div className="hierarchy-column hierarchy-column-wide" aria-label="presets">
              {(selectedGroup?.presets ?? []).map((p) => renderPresetRow(p, Math.max(0, hierarchyPresetIndex(p))))}
            </div>
          </div>
        )}
        {filteredPresets.length === 0 && <p style={{ opacity: 0.45, padding: '1rem' }}>—</p>}
      </div>
    </>
  );
}
