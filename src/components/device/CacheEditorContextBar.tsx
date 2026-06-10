import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, InlineLoading } from '@carbon/react';
import { useAppContext } from '../../context/AppContext';
import { loadPresetIntoEditor } from '../../utils/cacheLoader';
import { categoryFromPresetPath } from '../../utils/presetPath';
import { normalizePresetType, type CachePresetEntry } from '../../types/opxy';
import { presetsInCategory } from '../../utils/presetFilters';
import { notify } from '../../utils/notify';

export function CacheEditorContextBar() {
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
  }, [source?.relativePath]);

  const editorKind = source ? normalizePresetType(source.type) : null;

  const resolvedCategory = useMemo(() => {
    if (!source) return '';
    const normPath = source.relativePath.replace(/\\/g, '/');
    const match = presets.find((p) => p.relativePath.replace(/\\/g, '/') === normPath);
    return match?.category || source.category || categoryFromPresetPath(source.relativePath);
  }, [presets, source]);

  const siblings = useMemo(() => {
    if (!source || (editorKind !== 'drum' && editorKind !== 'sampler')) return [];
    const inCategory = presetsInCategory(presets, resolvedCategory, editorKind);
    if (inCategory.length > 0) return inCategory;
    return presets
      .filter((p) => p.sampleBased && normalizePresetType(p.type) === editorKind)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [presets, source, editorKind, resolvedCategory]);

  const normSourcePath = source?.relativePath.replace(/\\/g, '/');
  const currentIndex = siblings.findIndex((p) => p.relativePath.replace(/\\/g, '/') === normSourcePath);
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

  if (!source) return null;

  const showSwitcher = editorKind === 'drum' || editorKind === 'sampler';

  return (
    <div
      style={{
        margin: '0 2rem 1rem',
        borderRadius: '8px',
        border: '1px solid var(--color-border-medium)',
        background: 'var(--color-bg-secondary)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '0.75rem 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ fontSize: '0.9rem' }}>
          <strong>from device cache:</strong> {source.name}
          <span style={{ color: 'var(--color-text-secondary)', marginLeft: '0.5rem' }}>
            ({resolvedCategory} · {source.type})
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button kind="ghost" size="sm" onClick={() => dispatch({ type: 'SET_TAB', payload: 'device' })}>
            back to device
          </Button>
          <Button kind="ghost" size="sm" onClick={() => dispatch({ type: 'SET_CACHE_SOURCE', payload: null })}>
            clear link
          </Button>
        </div>
      </div>

      {showSwitcher && (
        <div
          style={{
            padding: '0.6rem 1rem',
            borderTop: '1px solid var(--color-border-light)',
            background: 'var(--color-bg-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          {loading ? (
            <InlineLoading description="Loading presets in category…" />
          ) : siblings.length > 0 ? (
            <>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                {resolvedCategory} · {currentIndex >= 0 ? currentIndex + 1 : '?'}/{siblings.length}
              </span>
              <Button kind="ghost" size="sm" disabled={!prev || switching} onClick={() => prev && switchTo(prev)}>
                ← prev
              </Button>
              <select
                value={normSourcePath}
                onChange={(e) => {
                  const p = siblings.find((s) => s.relativePath.replace(/\\/g, '/') === e.target.value);
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
                  <option key={p.relativePath} value={p.relativePath.replace(/\\/g, '/')}>
                    {p.name}
                    {(p.unnamedCount ?? 0) > 0 ? ` (${p.unnamedCount} unnamed)` : ''}
                  </option>
                ))}
              </select>
              <Button kind="ghost" size="sm" disabled={!next || switching} onClick={() => next && switchTo(next)}>
                next →
              </Button>
            </>
          ) : (
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              No other {editorKind} presets found in cache.
            </span>
          )}
          {switching && <InlineLoading description="Loading…" />}
        </div>
      )}
    </div>
  );
}
