import { useEffect, useMemo, useState } from 'react';
import { Button, Search, Tag, Toggle } from '@carbon/react';
import type { CachePresetEntry } from '../../types/opxy';
import { PresetInspector } from './PresetInspector';
import {
  categoryStats,
  filterPresets,
  groupPresetsByCategory,
  usePresetNavigation,
  type PresetTypeFilter,
} from '../../utils/presetFilters';

interface PresetBrowserProps {
  presets: CachePresetEntry[];
  dirtyPresets: string[];
  busy: boolean;
  onRenamed: () => void;
}

export function PresetBrowser({ presets, dirtyPresets, busy, onRenamed }: PresetBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [unnamedOnly, setUnnamedOnly] = useState(false);
  const [modifiedOnly, setModifiedOnly] = useState(false);
  const [typeFilter, setTypeFilter] = useState<PresetTypeFilter>('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const samplePresets = useMemo(
    () => presets.filter((p) => p.sampleBased),
    [presets],
  );

  const categories = useMemo(() => categoryStats(samplePresets), [samplePresets]);

  const filtered = useMemo(
    () =>
      filterPresets(presets, {
        searchQuery,
        unnamedOnly,
        modifiedOnly,
        typeFilter,
        selectedCategories,
      }, dirtyPresets),
    [presets, searchQuery, unnamedOnly, modifiedOnly, typeFilter, selectedCategories, dirtyPresets],
  );

  const grouped = useMemo(() => groupPresetsByCategory(filtered), [filtered]);
  const { selected, selectedIndex, prev, next } = usePresetNavigation(filtered, selectedPath);

  useEffect(() => {
    if (selectedPath && !filtered.some((p) => p.relativePath === selectedPath)) {
      setSelectedPath(filtered[0]?.relativePath ?? null);
    }
  }, [filtered, selectedPath]);

  useEffect(() => {
    if (!selectedPath && filtered.length > 0) {
      setSelectedPath(filtered[0]!.relativePath);
    }
  }, [filtered, selectedPath]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };

  const isCategoryCollapsed = (cat: string, count: number) => {
    if (selected?.category === cat) return false;
    if (collapsedCategories[cat] !== undefined) return collapsedCategories[cat]!;
    return count > 8;
  };

  const toggleCollapsed = (cat: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [cat]: !isCategoryCollapsed(cat, grouped.get(cat)?.length ?? 0) }));
  };

  const collapseAll = () => {
    const next: Record<string, boolean> = {};
    for (const [cat] of grouped) next[cat] = true;
    setCollapsedCategories(next);
  };

  const expandAll = () => setCollapsedCategories({});

  if (samplePresets.length === 0) {
    return (
      <p style={{ color: 'var(--color-text-secondary)' }}>
        No sample-based presets in cache.
      </p>
    );
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
        }}
      >
        <div style={{ flex: '1 1 200px', maxWidth: 320 }}>
          <Search
            id="preset-browser-search"
            labelText="search"
            placeholder="Name, category, type…"
            size="sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Toggle id="unnamed-filter" labelText="unnamed" toggled={unnamedOnly} onToggle={setUnnamedOnly} size="sm" />
        <Toggle id="modified-filter" labelText="modified" toggled={modifiedOnly} onToggle={setModifiedOnly} size="sm" />
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          {(['all', 'drum', 'sampler'] as const).map((t) => (
            <Button
              key={t}
              kind={typeFilter === t ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setTypeFilter(t)}
            >
              {t}
            </Button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.35rem' }}>
          categories ({categories.length}) — click to filter
        </div>
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          <Tag
            type={selectedCategories.length === 0 ? 'blue' : 'gray'}
            style={{ cursor: 'pointer' }}
            onClick={() => setSelectedCategories([])}
          >
            all ({samplePresets.length})
          </Tag>
          {categories.map((c) => (
            <Tag
              key={c.category}
              type={selectedCategories.includes(c.category) ? 'blue' : 'gray'}
              style={{ cursor: 'pointer' }}
              onClick={() => toggleCategory(c.category)}
            >
              {c.category} ({c.count}{c.unnamed > 0 ? ` · ${c.unnamed} un` : ''})
            </Tag>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <Button kind="ghost" size="sm" onClick={collapseAll}>collapse all</Button>
        <Button kind="ghost" size="sm" onClick={expandAll}>expand all</Button>
        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', alignSelf: 'center' }}>
          showing {filtered.length} of {samplePresets.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p style={{ color: 'var(--color-text-secondary)' }}>No presets match filters.</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(260px, 36%) minmax(0, 1fr)',
            gap: '1rem',
            alignItems: 'start',
          }}
        >
          <div
            style={{
              maxHeight: 'min(72vh, 720px)',
              overflowY: 'auto',
              border: '1px solid var(--color-border-light)',
              borderRadius: '10px',
              background: 'var(--color-bg-primary)',
            }}
          >
            {[...grouped.entries()].map(([category, items]) => {
              const collapsed = isCategoryCollapsed(category, items.length);
              return (
                <div key={category} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <button
                    type="button"
                    onClick={() => toggleCollapsed(category)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.5rem 0.75rem',
                      border: 'none',
                      background: 'var(--color-bg-secondary)',
                      cursor: 'pointer',
                      fontWeight: 500,
                      fontSize: '0.85rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>{category}</span>
                    <span style={{ color: 'var(--color-text-secondary)' }}>
                      {collapsed ? '▸' : '▾'} {items.length}
                    </span>
                  </button>
                  {!collapsed &&
                    items.map((p) => {
                      const isSelected = selectedPath === p.relativePath;
                      const isDirty = dirtyPresets.includes(p.relativePath.replace(/\\/g, '/'));
                      return (
                        <button
                          key={p.relativePath}
                          type="button"
                          onClick={() => setSelectedPath(p.relativePath)}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '0.45rem 0.75rem 0.45rem 1rem',
                            border: 'none',
                            borderLeft: isSelected
                              ? '3px solid var(--color-interactive-focus)'
                              : '3px solid transparent',
                            background: isSelected ? 'var(--color-bg-secondary)' : 'transparent',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                          }}
                        >
                          <div style={{ fontWeight: isSelected ? 600 : 400 }}>{p.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                            {p.type}
                            {(p.unnamedCount ?? 0) > 0 && ` · ${p.unnamedCount} unnamed`}
                            {isDirty && ' · modified'}
                          </div>
                        </button>
                      );
                    })}
                </div>
              );
            })}
          </div>

          <div
            style={{
              maxHeight: 'min(72vh, 720px)',
              overflowY: 'auto',
              position: 'sticky',
              top: 0,
            }}
          >
            {selected ? (
              <PresetInspector
                preset={selected}
                isDirty={dirtyPresets.includes(selected.relativePath.replace(/\\/g, '/'))}
                onClose={() => setSelectedPath(null)}
                onRenamed={onRenamed}
                prevPreset={prev}
                nextPreset={next}
                positionLabel={selectedIndex >= 0 ? `${selectedIndex + 1} / ${filtered.length}` : undefined}
                onNavigate={(p) => setSelectedPath(p.relativePath)}
                busy={busy}
              />
            ) : (
              <div
                style={{
                  padding: '2rem',
                  textAlign: 'center',
                  color: 'var(--color-text-secondary)',
                  border: '1px dashed var(--color-border-medium)',
                  borderRadius: '10px',
                }}
              >
                Select a preset from the list
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
