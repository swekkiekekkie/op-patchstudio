import { useEffect, useMemo, useState } from 'react';
import type { CachePresetEntry } from '../../types/opxy';
import { Segments, SearchField } from '../../ui';
import {
  filterPresets,
  groupPresetsByCategory,
  type PresetTypeFilter,
} from '../../utils/presetFilters';

const TYPE_FILTERS: { id: PresetTypeFilter; label: string }[] = [
  { id: 'all', label: 'all' },
  { id: 'drum', label: 'drum' },
  { id: 'synth', label: 'synth' },
  { id: 'sampler', label: 'smpl' },
  { id: 'multi', label: 'multi' },
];

interface PresetListProps {
  presets: CachePresetEntry[];
  dirtyPresets: string[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
}

export function PresetList({ presets, dirtyPresets, selectedPath, onSelect }: PresetListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [unnamedOnly, setUnnamedOnly] = useState(false);
  const [modifiedOnly, setModifiedOnly] = useState(false);
  const [typeFilter, setTypeFilter] = useState<PresetTypeFilter>('all');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const filtered = useMemo(
    () => filterPresets(presets, { searchQuery, unnamedOnly, modifiedOnly, typeFilter, selectedCategories: [] }, dirtyPresets),
    [presets, searchQuery, unnamedOnly, modifiedOnly, typeFilter, dirtyPresets],
  );

  const grouped = useMemo(() => groupPresetsByCategory(filtered), [filtered]);

  useEffect(() => {
    if (!selectedPath && filtered.length > 0) {
      onSelect(filtered[0]!.relativePath);
    }
  }, [filtered, selectedPath, onSelect]);

  const isCollapsed = (cat: string, count: number) => {
    if (collapsedCategories[cat] !== undefined) return collapsedCategories[cat]!;
    return count > 8;
  };

  const presetMeta = (p: CachePresetEntry) => {
    const bits = [p.type];
    if (p.sampleBased) bits.push(`${p.sampleCount} rgn`);
    if (p.unnamedCount) bits.push(`?${p.unnamedCount}`);
    if (dirtyPresets.includes(p.relativePath.replace(/\\/g, '/'))) bits.push('●');
    return bits.join(' · ');
  };

  return (
    <>
      <div className="library-toolbar">
        <Segments options={TYPE_FILTERS} value={typeFilter} onChange={(v) => setTypeFilter(v as PresetTypeFilter)} />
        <div className="filter-toggles">
          <button type="button" className={`filter-toggle${unnamedOnly ? ' active' : ''}`} onClick={() => setUnnamedOnly((v) => !v)} title="unnamed">?</button>
          <button type="button" className={`filter-toggle${modifiedOnly ? ' active' : ''}`} onClick={() => setModifiedOnly((v) => !v)} title="modified">●</button>
        </div>
        <SearchField value={searchQuery} onChange={setSearchQuery} placeholder="search" />
      </div>

      <div className="list-toolbar">
        <span className="mono">showing {filtered.length}/{presets.length}</span>
        <span>
          <button type="button" onClick={() => {
            const next: Record<string, boolean> = {};
            for (const [cat] of grouped) next[cat] = true;
            setCollapsedCategories(next);
          }}>collapse</button>
          {' · '}
          <button type="button" onClick={() => setCollapsedCategories({})}>expand</button>
        </span>
      </div>

      <div className="library-list-scroll">
        {[...grouped.entries()].map(([category, items]) => {
          const collapsed = isCollapsed(category, items.length);
          return (
            <div key={category}>
              <button
                type="button"
                className={`group-label collapsible${collapsed ? ' collapsed' : ''}`}
                onClick={() => setCollapsedCategories((p) => ({ ...p, [category]: !collapsed }))}
              >
                {category} · {items.length}
              </button>
              {!collapsed && items.map((p, i) => (
                <button
                  key={p.relativePath}
                  type="button"
                  className={`object-row${selectedPath === p.relativePath ? ' selected' : ''}`}
                  onClick={() => onSelect(p.relativePath)}
                >
                  <span className="idx">{String(i + 1).padStart(2, '0')}</span>
                  <span className="name">{p.name}</span>
                  <span className="meta">{presetMeta(p)}</span>
                </button>
              ))}
            </div>
          );
        })}
        {filtered.length === 0 && <p style={{ opacity: 0.45, padding: '1rem' }}>—</p>}
      </div>
    </>
  );
}
