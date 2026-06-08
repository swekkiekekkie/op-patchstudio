import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, InlineLoading, Tag, TextInput, Tile } from '@carbon/react';
import type { CachePresetEntry, PresetDetail, PresetRegionEntry } from '../../types/opxy';
import { ALLOWED_NAME_CHARS, drumPadLabel, normalizePresetType, parseDeviceSampleFilename } from '../../types/opxy';
import { loadPresetIntoEditor } from '../../utils/cacheLoader';
import { useAppContext } from '../../context/AppContext';
import { CacheAudioPreview } from './CacheAudioPreview';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { notify } from '../../utils/notify';
import type { RenameImpact } from '../../types/opxy';

function ParsedFilename({ filename }: { filename: string }) {
  const parsed = parseDeviceSampleFilename(filename);
  if (!parsed) {
    return <code style={{ fontSize: '0.85rem' }}>{filename}</code>;
  }
  return (
    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
      <Tag type={parsed.base.match(/^unnamed/i) ? 'magenta' : 'gray'} size="sm">
        base: {parsed.base}
      </Tag>
      <Tag type="gray" size="sm">note: {parsed.note}</Tag>
      <Tag type="gray" size="sm">idx: {parsed.idx}</Tag>
      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{filename}</span>
    </div>
  );
}

interface RegionRowProps {
  presetPath: string;
  region: PresetRegionEntry;
  renameDraft: string;
  onRenameDraftChange: (value: string) => void;
  onRename: () => void;
  busy: boolean;
}

function RegionRow({ presetPath, region, renameDraft, onRenameDraftChange, onRename, busy }: RegionRowProps) {
  const [expanded, setExpanded] = useState(region.isUnnamed);
  const invalidName = renameDraft.length > 0 && !ALLOWED_NAME_CHARS.test(renameDraft);
  const rel = `${presetPath.replace(/\\/g, '/')}/${region.sample}`;

  return (
    <Tile style={{ padding: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <ParsedFilename filename={region.sample} />
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.35rem' }}>
            {region.hikey !== undefined && region.lokey !== undefined && (
              <span>
                {drumPadLabel(region.hikey) ?? `MIDI ${region.hikey}`}
                {region.hikey !== region.lokey ? ` (${region.lokey}–${region.hikey})` : ''}
                {' · '}
              </span>
            )}
            root pitch {region.rootNote ?? '—'}
            {!region.hasAudio && ' · missing audio file'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <TextInput
            id={`rename-${region.sample}`}
            labelText="sample base name"
            size="sm"
            value={renameDraft}
            onChange={(e) => onRenameDraftChange(e.target.value)}
            invalid={invalidName}
            invalidText="Use a-z, 0-9, space, # - ( ) only"
          />
          <Button size="sm" onClick={onRename} disabled={busy || invalidName || !renameDraft.trim()}>
            rename
          </Button>
          <Button kind="ghost" size="sm" onClick={() => setExpanded((v) => !v)}>
            {expanded ? 'hide preview' : 'preview'}
          </Button>
        </div>
      </div>
      {expanded && region.hasAudio && (
        <div style={{ marginTop: '0.75rem' }}>
          <CacheAudioPreview relativePath={rel} />
        </div>
      )}
    </Tile>
  );
}

interface PresetInspectorProps {
  preset: CachePresetEntry;
  isDirty: boolean;
  onClose: () => void;
  onRenamed: () => void;
  prevPreset?: CachePresetEntry | null;
  nextPreset?: CachePresetEntry | null;
  positionLabel?: string;
  onNavigate?: (preset: CachePresetEntry) => void;
  busy?: boolean;
}

export function PresetInspector({
  preset,
  isDirty,
  onClose,
  onRenamed,
  prevPreset,
  nextPreset,
  positionLabel,
  onNavigate,
  busy: externalBusy,
}: PresetInspectorProps) {
  const { state, dispatch } = useAppContext();
  const [detail, setDetail] = useState<PresetDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [renameDrafts, setRenameDrafts] = useState<Record<string, string>>({});
  const [bulkBase, setBulkBase] = useState(preset.name);
  const [pendingRename, setPendingRename] = useState<{ oldFilename: string; impact: RenameImpact } | null>(null);

  const isBusy = busy || externalBusy;

  const refresh = useCallback(async () => {
    if (!window.opxy) return;
    const d = await window.opxy.device.getPresetDetail(preset.relativePath);
    setDetail(d);
    const drafts: Record<string, string> = {};
    for (const r of d.regions) {
      drafts[r.sample] = r.base;
    }
    setRenameDrafts(drafts);
    setBulkBase(preset.name);
  }, [preset.relativePath, preset.name]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const unnamedRegions = useMemo(
    () => detail?.regions.filter((r) => r.isUnnamed) ?? [],
    [detail],
  );

  const performRename = async (oldFilename: string, newBase: string) => {
    if (!window.opxy) return;
    setBusy(true);
    try {
      const result = await window.opxy.device.renameSampleInPreset(preset.relativePath, oldFilename, newBase);
      if (!result.ok) {
        notify(dispatch, 'error', 'Rename failed', result.error ?? 'Unknown error');
      } else {
        const msg = result.newFilename ?? newBase;
        notify(dispatch, 'success', 'Sample renamed', msg);
        await refresh();
        onRenamed();
      }
    } finally {
      setBusy(false);
      setPendingRename(null);
    }
  };

  const handleRename = async (oldFilename: string) => {
    if (!window.opxy) return;
    const newBase = renameDrafts[oldFilename]?.trim();
    if (!newBase || !ALLOWED_NAME_CHARS.test(newBase)) return;

    if (window.opxy.device.getRenameImpact) {
      const impact = await window.opxy.device.getRenameImpact(oldFilename, newBase);
      if (impact.projectRefs.length > 0) {
        setPendingRename({ oldFilename, impact });
        return;
      }
    }
    await performRename(oldFilename, newBase);
  };

  const handleBulkRenameUnnamed = async () => {
    if (!window.opxy || unnamedRegions.length === 0) return;
    const base = bulkBase.trim();
    if (!base || !ALLOWED_NAME_CHARS.test(base)) {
      notify(dispatch, 'error', 'Invalid name', 'Use a-z, 0-9, space, # - ( ) only');
      return;
    }
    setBusy(true);
    try {
      let renamed = 0;
      for (const region of unnamedRegions) {
        const result = await window.opxy.device.renameSampleInPreset(
          preset.relativePath,
          region.sample,
          base,
        );
        if (result.ok) renamed++;
      }
      notify(dispatch, 'success', 'Bulk rename complete', `${renamed} of ${unnamedRegions.length} samples renamed`);
      await refresh();
      onRenamed();
    } finally {
      setBusy(false);
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
      notify(dispatch, 'info', 'Opened in editor', `${preset.name} — switch siblings from the bar above`);
    } catch (e) {
      notify(dispatch, 'error', 'Open failed', e instanceof Error ? e.message : 'Failed to open preset');
    } finally {
      setBusy(false);
    }
  };

  const editorKind = detail ? normalizePresetType(detail.type) : null;

  return (
    <div
      style={{
        marginTop: '0.5rem',
        padding: '1rem',
        borderRadius: '10px',
        border: '1px solid var(--color-interactive-focus)',
        background: 'var(--color-bg-secondary)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <h4 style={{ margin: 0, fontWeight: 500 }}>{preset.name}</h4>
            {isDirty && <Tag type="red">modified locally</Tag>}
            {(preset.unnamedCount ?? 0) > 0 && (
              <Tag type="magenta">{preset.unnamedCount} unnamed</Tag>
            )}
          </div>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
            {preset.category} · {preset.type} · {preset.sampleCount} regions
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {onNavigate && prevPreset && (
            <Button kind="ghost" size="sm" disabled={isBusy} onClick={() => onNavigate(prevPreset)}>
              ←
            </Button>
          )}
          {positionLabel && (
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{positionLabel}</span>
          )}
          {onNavigate && nextPreset && (
            <Button kind="ghost" size="sm" disabled={isBusy} onClick={() => onNavigate(nextPreset)}>
              →
            </Button>
          )}
          {(editorKind === 'drum' || editorKind === 'sampler') && (
            <Button size="sm" onClick={handleOpenEditor} disabled={isBusy}>
              open in {editorKind === 'drum' ? 'drum' : 'multisample'} editor
            </Button>
          )}
          <Button kind="ghost" size="sm" onClick={onClose}>
            close
          </Button>
        </div>
      </div>

      {unnamedRegions.length > 0 && (
        <div
          style={{
            marginTop: '1rem',
            padding: '0.75rem',
            borderRadius: '8px',
            border: '1px solid var(--color-border-medium)',
            background: 'var(--color-bg-primary)',
            display: 'flex',
            gap: '0.75rem',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
          }}
        >
          <TextInput
            id="bulk-rename-base"
            labelText={`rename all ${unnamedRegions.length} unnamed samples to base`}
            size="sm"
            value={bulkBase}
            onChange={(e) => setBulkBase(e.target.value)}
          />
          <Button size="sm" disabled={isBusy} onClick={handleBulkRenameUnnamed}>
            bulk rename unnamed
          </Button>
        </div>
      )}

      {isBusy && <InlineLoading description="Working…" style={{ marginTop: '1rem' }} />}

      {detail && (
        <div style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
          {detail.regions.map((region) => (
            <RegionRow
              key={region.sample}
              presetPath={preset.relativePath}
              region={region}
              renameDraft={renameDrafts[region.sample] ?? region.base}
              onRenameDraftChange={(value) =>
                setRenameDrafts((prev) => ({ ...prev, [region.sample]: value }))
              }
              onRename={() => handleRename(region.sample)}
              busy={isBusy}
            />
          ))}
        </div>
      )}

      <ConfirmationModal
        isOpen={pendingRename !== null}
        message={
          pendingRename
            ? `${pendingRename.impact.projectRefs.length} project(s) reference "${pendingRename.oldFilename}". Renaming to "${pendingRename.impact.newFilename}" may break those projects until project files are updated (planned). Continue?`
            : ''
        }
        onConfirm={() => {
          if (pendingRename) {
            const base = renameDrafts[pendingRename.oldFilename]?.trim();
            if (base) performRename(pendingRename.oldFilename, base);
          }
        }}
        onCancel={() => setPendingRename(null)}
      />
    </div>
  );
}
