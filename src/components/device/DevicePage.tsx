import { useMemo, useState } from 'react';
import { Button, InlineLoading, Search, Tag, TextInput, Tile, Toggle } from '@carbon/react';
import type { BackupEntry, CacheSampleEntry, RenameImpact } from '../../types/opxy';
import { ALLOWED_NAME_CHARS, parseDeviceSampleFilename } from '../../types/opxy';
import { PresetBrowser } from './PresetBrowser';
import { ProjectsBrowser } from './ProjectsBrowser';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { CacheAudioPreview } from './CacheAudioPreview';
import { useAppContext } from '../../context/AppContext';
import { useDeviceCache } from '../../cache/useDeviceCache';
import { notify } from '../../utils/notify';
import { ErrorDisplay } from '../common/ErrorDisplay';

const sectionHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between' as const,
  alignItems: 'baseline' as const,
  marginBottom: '0.75rem',
  paddingBottom: '0.5rem',
  borderBottom: '1px solid var(--color-border-light)',
};

export function DevicePage() {
  const { dispatch } = useAppContext();
  const {
    status,
    presets,
    standaloneSamples,
    dirtyPresets,
    backups,
    projects,
    indexedSampleCount,
    projectIndexNote,
    busy,
    refresh,
    pull,
    push,
    backup,
    restoreBackup,
  } = useDeviceCache();
  const [confirmAction, setConfirmAction] = useState<'push' | 'restore' | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<BackupEntry | null>(null);
  const [sampleRenames, setSampleRenames] = useState<Record<string, string>>({});
  const [sampleSearch, setSampleSearch] = useState('');
  const [samplesUnnamedOnly, setSamplesUnnamedOnly] = useState(false);
  const [expandedSample, setExpandedSample] = useState<string | null>(null);
  const [pendingStandaloneRename, setPendingStandaloneRename] = useState<{
    sample: CacheSampleEntry;
    impact: RenameImpact;
    newBase: string;
  } | null>(null);
  const [renameBusy, setRenameBusy] = useState(false);
  const isBusy = busy || renameBusy;

  const handlePush = async () => {
    await push();
    setConfirmAction(null);
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    await restoreBackup(restoreTarget.path);
    setConfirmAction(null);
    setRestoreTarget(null);
  };

  const performStandaloneRename = async (sample: CacheSampleEntry, newBase: string) => {
    if (!window.opxy) return;
    setRenameBusy(true);
    try {
      const result = await window.opxy.device.renameStandaloneSample(sample.relativePath, newBase);
      if (!result.ok) {
        notify(dispatch, 'error', 'Rename failed', result.error ?? 'Unknown error');
      } else {
        notify(dispatch, 'success', 'Sample renamed', result.newFilename ?? newBase);
        await refresh();
      }
    } finally {
      setRenameBusy(false);
      setPendingStandaloneRename(null);
    }
  };

  const handleRenameStandalone = async (sample: CacheSampleEntry) => {
    if (!window.opxy) return;
    const newBase = sampleRenames[sample.relativePath]?.trim();
    if (!newBase || !ALLOWED_NAME_CHARS.test(newBase)) {
      notify(dispatch, 'error', 'Invalid name', 'Use a-z, 0-9, space, # - ( ) only');
      return;
    }
    if (window.opxy.device.getRenameImpact) {
      const impact = await window.opxy.device.getRenameImpact(sample.filename, newBase);
      if (impact.projectRefs.length > 0) {
        setPendingStandaloneRename({ sample, impact, newBase });
        return;
      }
    }
    await performStandaloneRename(sample, newBase);
  };

  const filteredStandalone = useMemo(() => {
    let list = standaloneSamples;
    if (samplesUnnamedOnly) list = list.filter((s) => s.isUnnamed);
    const q = sampleSearch.trim().toLowerCase();
    if (q) list = list.filter((s) => s.filename.toLowerCase().includes(q));
    return list;
  }, [standaloneSamples, samplesUnnamedOnly, sampleSearch]);

  const cacheReady = (status?.presetCount ?? 0) > 0 || (status?.sampleCount ?? 0) > 0;
  const hasDirty = dirtyPresets.length > 0;
  const pushMessage = hasDirty
    ? `Push ${dirtyPresets.length} modified preset(s)? Backup first, then overwrites device.`
    : 'No local edits detected. Push anyway? Backup first, then overwrites device.';

  return (
    <div style={{ padding: '1.5rem 2rem' }}>
      <div style={sectionHeaderStyle}>
        <h3 style={{ margin: 0, fontWeight: 300, fontSize: '1.25rem' }}>device connection</h3>
      </div>

      <Tile style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Tag type={status?.connected ? 'green' : 'gray'}>
            {status?.connected ? 'connected' : 'not connected'}
          </Tag>
          {status?.deviceName && <span style={{ fontSize: '0.9rem' }}>{status.deviceName}</span>}
          {cacheReady && (
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              {status?.presetCount ?? 0} presets · {status?.sampleCount ?? 0} samples
            </span>
          )}
          {hasDirty && <Tag type="red">{dirtyPresets.length} modified</Tag>}
        </div>

        {!status?.connected && (
          <p style={{ margin: '0.75rem 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
            Connect OP-XY via USB, unlock, then refresh.
          </p>
        )}
        {status?.error && !status.connected && <ErrorDisplay message={status.error} style={{ marginTop: '0.75rem' }} />}

        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button onClick={pull} disabled={isBusy || !status?.connected}>pull from device</Button>
          <Button onClick={backup} disabled={isBusy || !cacheReady} kind="secondary">backup cache</Button>
          <Button onClick={() => setConfirmAction('push')} disabled={isBusy || !cacheReady || !status?.connected} kind="danger">
            push to device
          </Button>
          <Button kind="tertiary" onClick={refresh} disabled={isBusy}>refresh</Button>
        </div>

        {isBusy && <InlineLoading description="Working…" style={{ marginTop: '1rem' }} />}
        {projectIndexNote && (
          <p style={{ margin: '0.75rem 0 0', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            Projects: {projectIndexNote}
          </p>
        )}
      </Tile>

      {backups.length > 0 && (
        <>
          <div style={sectionHeaderStyle}><h3 style={{ margin: 0, fontWeight: 300, fontSize: '1.25rem' }}>backups</h3></div>
          <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {backups.slice(0, 5).map((b) => (
              <Tile key={b.id} style={{ padding: '0.75rem 1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div>
                    <strong>{new Date(b.createdAt).toLocaleString()}</strong>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      {b.presetCount} presets · {b.sampleCount} samples
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button kind="ghost" size="sm" onClick={() => window.opxy?.device.showBackup(b.path)}>show folder</Button>
                    <Button kind="danger--tertiary" size="sm" disabled={isBusy} onClick={() => { setRestoreTarget(b); setConfirmAction('restore'); }}>
                      restore cache
                    </Button>
                  </div>
                </div>
              </Tile>
            ))}
          </div>
        </>
      )}

      <div style={sectionHeaderStyle}>
        <h3 style={{ margin: 0, fontWeight: 300, fontSize: '1.25rem' }}>presets</h3>
      </div>

      {!cacheReady ? (
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>Pull from device to browse presets.</p>
      ) : (
        <div style={{ marginBottom: '1.5rem' }}>
          <PresetBrowser presets={presets} dirtyPresets={dirtyPresets} busy={isBusy} onRenamed={refresh} />
        </div>
      )}

      <div style={sectionHeaderStyle}>
        <h3 style={{ margin: 0, fontWeight: 300, fontSize: '1.25rem' }}>projects ({projects.length})</h3>
      </div>

      <ProjectsBrowser projects={projects} indexedSampleCount={indexedSampleCount} />

      <div style={sectionHeaderStyle}>
        <h3 style={{ margin: 0, fontWeight: 300, fontSize: '1.25rem' }}>standalone samples ({filteredStandalone.length})</h3>
      </div>

      {cacheReady && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 200px', maxWidth: 320 }}>
            <Search id="sample-search" labelText="search samples" size="sm" value={sampleSearch} onChange={(e) => setSampleSearch(e.target.value)} />
          </div>
          <Toggle id="sample-unnamed" labelText="unnamed only" toggled={samplesUnnamedOnly} onToggle={setSamplesUnnamedOnly} size="sm" />
        </div>
      )}

      {filteredStandalone.length === 0 ? (
        <p style={{ color: 'var(--color-text-secondary)' }}>No standalone samples.</p>
      ) : (
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {filteredStandalone.slice(0, 100).map((s) => {
            const parsed = parseDeviceSampleFilename(s.filename);
            const isOpen = expandedSample === s.relativePath;
            const draft = sampleRenames[s.relativePath] ?? s.base;
            const invalid = draft.length > 0 && !ALLOWED_NAME_CHARS.test(draft);
            return (
              <Tile key={s.relativePath} style={{ padding: '0.75rem 1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <strong style={{ fontSize: '0.9rem' }}>{s.filename}</strong>
                    {s.isUnnamed && <Tag type="magenta" style={{ marginLeft: '0.5rem' }}>unnamed</Tag>}
                    {parsed && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                        base “{parsed.base}” · {parsed.note} · idx {parsed.idx}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <TextInput id={`s-${s.relativePath}`} labelText="base name" size="sm" value={draft}
                      onChange={(e) => setSampleRenames((p) => ({ ...p, [s.relativePath]: e.target.value }))}
                      invalid={invalid} invalidText="Invalid characters" />
                    <Button size="sm" disabled={isBusy || invalid} onClick={() => handleRenameStandalone(s)}>rename</Button>
                    <Button kind="ghost" size="sm" onClick={() => setExpandedSample(isOpen ? null : s.relativePath)}>
                      {isOpen ? 'hide' : 'preview'}
                    </Button>
                  </div>
                </div>
                {isOpen && <div style={{ marginTop: '0.75rem' }}><CacheAudioPreview relativePath={s.relativePath} /></div>}
              </Tile>
            );
          })}
        </div>
      )}

      <ConfirmationModal isOpen={confirmAction === 'push'} message={pushMessage} onConfirm={handlePush} onCancel={() => setConfirmAction(null)} />
      <ConfirmationModal
        isOpen={confirmAction === 'restore' && restoreTarget !== null}
        message={`Restore from ${restoreTarget ? new Date(restoreTarget.createdAt).toLocaleString() : ''}? Local edits lost.`}
        onConfirm={handleRestore}
        onCancel={() => { setConfirmAction(null); setRestoreTarget(null); }}
      />
      <ConfirmationModal
        isOpen={pendingStandaloneRename !== null}
        message={
          pendingStandaloneRename
            ? `${pendingStandaloneRename.impact.projectRefs.length} project(s) use "${pendingStandaloneRename.sample.filename}". Project file patching is not automatic yet. Continue rename?`
            : ''
        }
        onConfirm={() => pendingStandaloneRename && performStandaloneRename(pendingStandaloneRename.sample, pendingStandaloneRename.newBase)}
        onCancel={() => setPendingStandaloneRename(null)}
      />
    </div>
  );
}
