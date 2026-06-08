import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CachePresetEntry, PresetDetail } from '../../types/opxy';
import { drumPadLabel, normalizePresetType } from '../../types/opxy';
import { ObjectDetailHead, Segments } from '../../ui';
import { FieldKeyboard } from '../../ui/field-keyboard/FieldKeyboard';
import { PAD_LABELS } from '../../ui/field-keyboard/layout';
import { loadPresetIntoEditor } from '../../utils/cacheLoader';
import { useAppContext } from '../../context/AppContext';
import { useAppShell } from '../../navigation/AppShellContext';
import type { PresetSubmode } from '../../types/navigation';
import { notify } from '../../utils/notify';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import type { RenameImpact } from '../../types/opxy';
import { usePresetNavigation } from '../../utils/presetFilters';

interface PresetDetailPaneProps {
  preset: CachePresetEntry;
  filteredPresets: CachePresetEntry[];
  isDirty: boolean;
  busy?: boolean;
  onRenamed: () => void;
  onNavigate: (path: string) => void;
}

function presetMetaLine(p: CachePresetEntry, isDirty: boolean): string {
  const bits = [p.category, p.type];
  if (p.sampleBased) bits.push(`${p.sampleCount} samples`);
  if (isDirty) bits.push('●');
  if (p.unnamedCount) bits.push(`?${p.unnamedCount}`);
  return bits.join(' · ');
}

export function PresetDetailPane({
  preset,
  filteredPresets,
  isDirty,
  busy: externalBusy,
  onRenamed,
  onNavigate,
}: PresetDetailPaneProps) {
  const { state, dispatch } = useAppContext();
  const { state: shellState, setPresetSubmode } = useAppShell();
  const submode = shellState.presetSubmode ?? 'regions';
  const { prev, next, selectedIndex } = usePresetNavigation(filteredPresets, preset.relativePath);

  const [detail, setDetail] = useState<PresetDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [renameDrafts, setRenameDrafts] = useState<Record<string, string>>({});
  const [bulkBase, setBulkBase] = useState(preset.name);
  const [pendingRename, setPendingRename] = useState<{ oldFilename: string; impact: RenameImpact } | null>(null);

  const isBusy = busy || externalBusy;
  const editorKind = detail ? normalizePresetType(detail.type) : null;
  const isSampleBased = preset.sampleBased;

  const refresh = useCallback(async () => {
    if (!window.opxy) return;
    const d = await window.opxy.device.getPresetDetail(preset.relativePath);
    setDetail(d);
    const drafts: Record<string, string> = {};
    for (const r of d.regions) drafts[r.sample] = r.base;
    setRenameDrafts(drafts);
    setBulkBase(preset.name);
  }, [preset.relativePath, preset.name]);

  useEffect(() => { refresh(); }, [refresh]);

  const unnamedRegions = useMemo(() => detail?.regions.filter((r) => r.isUnnamed) ?? [], [detail]);

  const performRename = async (oldFilename: string, newBase: string) => {
    if (!window.opxy) return;
    setBusy(true);
    try {
      const result = await window.opxy.device.renameSampleInPreset(preset.relativePath, oldFilename, newBase);
      if (!result.ok) notify(dispatch, 'error', 'Rename failed', result.error ?? 'Unknown error');
      else {
        notify(dispatch, 'success', 'Sample renamed', result.newFilename ?? newBase);
        await refresh();
        onRenamed();
      }
    } finally {
      setBusy(false);
      setPendingRename(null);
    }
  };

  const handleOpenEditor = async () => {
    if (!detail) return;
    setBusy(true);
    try {
      const kind = normalizePresetType(detail.type);
      if (kind !== 'drum' && kind !== 'sampler') {
        notify(dispatch, 'error', 'Cannot open', 'Only drum and sampler presets open in the editor');
        return;
      }
      await loadPresetIntoEditor(preset, dispatch, state.midiNoteMapping, state.multisampleFiles.length);
    } catch (e) {
      notify(dispatch, 'error', 'Open failed', e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const regionCount = detail?.regions.length ?? preset.sampleCount;

  return (
    <>
      <ObjectDetailHead
        title={preset.name}
        meta={presetMetaLine(preset, isDirty)}
        position={selectedIndex >= 0 ? `${selectedIndex + 1}/${filteredPresets.length}` : undefined}
        onPrev={() => prev && onNavigate(prev.relativePath)}
        onNext={() => next && onNavigate(next.relativePath)}
        prevDisabled={!prev}
        nextDisabled={!next}
        actions={
          <>
            {isSampleBased && editorKind !== 'drum' && editorKind !== 'sampler' ? null : (
              <button type="button" className="inline-action" onClick={handleOpenEditor} disabled={isBusy || !isSampleBased}>
                edit
              </button>
            )}
            {unnamedRegions.length > 0 && (
              <button type="button" className="inline-action" title="unnamed">?{unnamedRegions.length}</button>
            )}
          </>
        }
      />

      <div className="detail-body">
        {!isSampleBased ? (
          <p style={{ opacity: 0.55 }}>catalog · read only</p>
        ) : (
          <>
            <Segments
              className="detail-submodes"
              options={[
                { id: 'regions', label: 'list' },
                { id: 'edit', label: 'edit' },
              ]}
              value={submode}
              onChange={(v) => setPresetSubmode(v as PresetSubmode)}
            />

            {submode === 'regions' && detail && (
              <div className="sub-pane region-table">
                <FieldKeyboard
                  compact
                  captureKeys
                  getKeyState={(oct, semi, pad) => {
                    const loaded = pad < regionCount;
                    return {
                      loaded,
                      empty: !loaded,
                      tag: editorKind === 'drum' ? (PAD_LABELS[pad] ?? '') : '',
                    };
                  }}
                  onPress={({ pad }) => {
                    const region = detail.regions[pad];
                    if (!region) return;
                    // play stub — region exists
                  }}
                />
                {unnamedRegions.length > 0 && (
                  <div className="bulk-rename-row">
                    <input type="text" value={bulkBase} onChange={(e) => setBulkBase(e.target.value)} placeholder="base name" />
                    <button type="button" className="inline-action primary" disabled={isBusy} onClick={async () => {
                      if (!window.opxy || !bulkBase.trim()) return;
                      setBusy(true);
                      try {
                        for (const region of unnamedRegions) {
                          await window.opxy.device.renameSampleInPreset(preset.relativePath, region.sample, bulkBase.trim());
                        }
                        await refresh();
                        onRenamed();
                      } finally {
                        setBusy(false);
                      }
                    }}>fix all</button>
                  </div>
                )}
                {detail.regions.map((r, i) => (
                  <div key={r.sample} className={`region-row${r.isUnnamed ? ' unnamed' : ''}`}>
                    <span className="mono">{String(i + 1).padStart(2, '0')}</span>
                    <span className="slot">{r.hikey !== undefined ? (drumPadLabel(r.hikey) ?? '—') : '—'}</span>
                    <input
                      className="rename-input"
                      value={renameDrafts[r.sample] ?? r.base}
                      onChange={(e) => setRenameDrafts((p) => ({ ...p, [r.sample]: e.target.value }))}
                    />
                    <span className="meta-col">{r.rootNote ?? '—'}</span>
                    <span className="meta-col">{r.hasAudio ? '●' : '!'}</span>
                    <button
                      type="button"
                      className="inline-action icon"
                      disabled={isBusy}
                      onClick={() => {
                        const newBase = renameDrafts[r.sample]?.trim();
                        if (newBase) performRename(r.sample, newBase);
                      }}
                    >▶</button>
                  </div>
                ))}
              </div>
            )}

            {submode === 'edit' && (
              <div className="sub-pane edit-workspace">
                {editorKind === 'drum' || editorKind === 'sampler' ? (
                  <div className="edit-open-bar">
                    <button type="button" className="inline-action primary" onClick={handleOpenEditor} disabled={isBusy}>
                      open in editor
                    </button>
                    <span className="mono" style={{ opacity: 0.45, fontSize: 10 }}>full drum / zone editor</span>
                  </div>
                ) : (
                  <p style={{ opacity: 0.5 }}>no sample editor for this preset type</p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmationModal
        isOpen={pendingRename !== null}
        message={pendingRename ? `${pendingRename.impact.projectRefs.length} project refs affected. Proceed?` : ''}
        onConfirm={() => pendingRename && performRename(pendingRename.oldFilename, renameDrafts[pendingRename.oldFilename] ?? '')}
        onCancel={() => setPendingRename(null)}
      />
    </>
  );
}
