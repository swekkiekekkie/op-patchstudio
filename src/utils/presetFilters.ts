import { useMemo } from 'react';
import type { CachePresetEntry } from '../types/opxy';
import { normalizePresetType } from '../types/opxy';

export type PresetTypeFilter = 'all' | 'drum' | 'sampler' | 'synth' | 'multi';

export interface PresetFilterState {
  searchQuery: string;
  unnamedOnly: boolean;
  modifiedOnly: boolean;
  typeFilter: PresetTypeFilter;
  selectedCategories: string[];
}

function isSynthPreset(p: CachePresetEntry): boolean {
  return !p.sampleBased;
}

function isMultiPreset(p: CachePresetEntry): boolean {
  return p.sampleBased && normalizePresetType(p.type) === 'sampler' && p.sampleCount > 12;
}

export function filterPresets(
  presets: CachePresetEntry[],
  filters: PresetFilterState,
  dirtyPresets: string[],
): CachePresetEntry[] {
  let list = presets;

  if (filters.typeFilter === 'drum') {
    list = list.filter((p) => p.sampleBased && normalizePresetType(p.type) === 'drum');
  } else if (filters.typeFilter === 'sampler') {
    list = list.filter((p) => p.sampleBased && normalizePresetType(p.type) === 'sampler' && !isMultiPreset(p));
  } else if (filters.typeFilter === 'multi') {
    list = list.filter((p) => isMultiPreset(p));
  } else if (filters.typeFilter === 'synth') {
    list = list.filter((p) => isSynthPreset(p));
  } else {
    list = list.filter((p) => p.sampleBased || isSynthPreset(p));
  }

  if (filters.unnamedOnly) list = list.filter((p) => (p.unnamedCount ?? 0) > 0);
  if (filters.modifiedOnly) {
    list = list.filter((p) => dirtyPresets.includes(p.relativePath.replace(/\\/g, '/')));
  }

  if (filters.selectedCategories.length > 0) {
    list = list.filter((p) => filters.selectedCategories.includes(p.category));
  }

  const q = filters.searchQuery.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q),
    );
  }

  return list.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

export function groupPresetsByCategory(presets: CachePresetEntry[]): Map<string, CachePresetEntry[]> {
  const map = new Map<string, CachePresetEntry[]>();
  for (const p of presets) {
    const list = map.get(p.category) ?? [];
    list.push(p);
    map.set(p.category, list);
  }
  return new Map([...map.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

export function categoryStats(allPresets: CachePresetEntry[]): Array<{ category: string; count: number; unnamed: number }> {
  const map = new Map<string, { count: number; unnamed: number }>();
  for (const p of allPresets.filter((x) => x.sampleBased)) {
    const cur = map.get(p.category) ?? { count: 0, unnamed: 0 };
    cur.count++;
    cur.unnamed += p.unnamedCount ?? 0;
    map.set(p.category, cur);
  }
  return [...map.entries()]
    .map(([category, v]) => ({ category, count: v.count, unnamed: v.unnamed }))
    .sort((a, b) => a.category.localeCompare(b.category));
}

export function usePresetNavigation(
  filteredPresets: CachePresetEntry[],
  selectedPath: string | null,
): {
  selected: CachePresetEntry | null;
  selectedIndex: number;
  prev: CachePresetEntry | null;
  next: CachePresetEntry | null;
} {
  return useMemo(() => {
    const selectedIndex = filteredPresets.findIndex((p) => p.relativePath === selectedPath);
    const selected = selectedIndex >= 0 ? filteredPresets[selectedIndex]! : null;
    return {
      selected,
      selectedIndex,
      prev: selectedIndex > 0 ? filteredPresets[selectedIndex - 1]! : null,
      next: selectedIndex >= 0 && selectedIndex < filteredPresets.length - 1
        ? filteredPresets[selectedIndex + 1]!
        : null,
    };
  }, [filteredPresets, selectedPath]);
}

export function presetsInCategory(
  allPresets: CachePresetEntry[],
  category: string,
  editorKind: 'drum' | 'sampler',
): CachePresetEntry[] {
  return allPresets
    .filter((p) => p.sampleBased && p.category === category && normalizePresetType(p.type) === editorKind)
    .sort((a, b) => a.name.localeCompare(b.name));
}
