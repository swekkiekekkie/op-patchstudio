import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, InlineLoading } from '@carbon/react';
import { useAppContext } from '../../context/AppContext';
import { loadPresetIntoEditor } from '../../utils/cacheLoader';
import { normalizePresetType, type CachePresetEntry } from '../../types/opxy';
import { presetsInCategory } from '../../utils/presetFilters';
import { notify } from '../../utils/notify';

export function CachePresetSwitcher() {
  const { state, dispatch } = useAppContext();
  const source = state.cacheSource;
  const [presets, setPresets] = useState<CachePresetEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    if (!source || !window.opxy) return;
    setLoading(true);
    window.opxy.device
      .listPresets()
      .then(setPresets)
      .finally(() => setLoading(false));
  }, [source?.relativePath, source?.category]);

  const editorKind = source ? normalizePresetType(source.type) : null;
  const siblings = useMemo(() => {
    if (!source || (editorKind !== 'drum' && editorKind !== 'sampler')) return [];
    return presetsInCategory(presets, source.category, editorKind);
  }, [presets, source, editorKind]);

  const currentIndex = siblings.findIndex((p) => p.relativePath === source?.relativePath);
  const prev = currentIndex > 0 ? siblings[currentIndex - 1]! : null;
  const next = currentIndex >= 0 && currentIndex < siblings.length - 1 ? siblings[currentIndex + 1]! : null;

  const switchTo = useCallback(
    async (preset: CachePresetEntry) => {
      if (!window.opxy || switching) return;
      setSwitching(true);
      try {
        await loadPresetIntoEditor(preset, dispatch, state.midiNoteMapping, state.multisampleFiles.length);
        notify(dispatch, 'info', 'Switched preset', preset.name);
      } catch (e) {
        notify(dispatch, 'error', 'Switch failed', e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setSwitching(false);
      }
    },
    [dispatch, state.midiNoteMapping, state.multisampleFiles.length, switching],
  );

  if (!source || siblings.length <= 1) return null;
  if (loading) return null;

  return (
    <div
      style={{
        margin: '0 2rem 0.75rem',
        padding: '0.6rem 0.85rem',
        borderRadius: '8px',
        border: '1px solid var(--color-border-light)',
        background: 'var(--color-bg-primary)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        flexWrap: 'wrap',
      }}
    >
      <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
        {source.category} · {currentIndex + 1}/{siblings.length}
      </span>
      <Button kind="ghost" size="sm" disabled={!prev || switching} onClick={() => prev && switchTo(prev)}>
        ← prev
      </Button>
      <select
        value={source.relativePath}
        onChange={(e) => {
          const p = siblings.find((s) => s.relativePath === e.target.value);
          if (p) switchTo(p);
        }}
        disabled={switching}
        style={{
          flex: '1 1 180px',
          minWidth: 140,
          maxWidth: 360,
          padding: '0.35rem 0.5rem',
          fontSize: '0.85rem',
          borderRadius: '4px',
          border: '1px solid var(--color-border-medium)',
        }}
      >
        {siblings.map((p) => (
          <option key={p.relativePath} value={p.relativePath}>
            {p.name}{(p.unnamedCount ?? 0) > 0 ? ` (${p.unnamedCount} unnamed)` : ''}
          </option>
        ))}
      </select>
      <Button kind="ghost" size="sm" disabled={!next || switching} onClick={() => next && switchTo(next)}>
        next →
      </Button>
      {switching && <InlineLoading description="Loading…" />}
    </div>
  );
}
