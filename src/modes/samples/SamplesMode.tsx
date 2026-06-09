import { useEffect, useMemo, useState } from 'react';
import type {
  CacheSampleEntry,
  SourceFolderEntry,
  SourcePresetEntry,
  SourcePresetCopyOptions,
  SourcePresetCopyResult,
  SourceSampleCopyOptions,
  SourceSampleCopyResult,
  SourceSampleEntry,
} from '../../types/opxy';
import { LibraryWorkspace, ModeScreen, ObjectDetailHead, SearchField, Segments } from '../../ui';
import { useAppShell } from '../../navigation/AppShellContext';
import { useNavigation } from '../../navigation/useNavigation';
import { CacheAudioPreview } from '../../components/device/CacheAudioPreview';
import { SetSamplesToolbar, SourceSamplesToolbar } from './SamplesToolbar';
import {
  buildSourcePresetHierarchy,
  buildSourcePresetHierarchyColumns,
  buildSourceHierarchy,
  buildSourceHierarchyColumns,
  findSourcePresetHierarchySelection,
  findSourceHierarchySelection,
} from '../../utils/sourceHierarchy';
import { buildSetSampleHierarchy, findSetSampleHierarchySelection } from '../../utils/setSampleHierarchy';

type SampleScope = 'set' | 'source';
type SourceAssetKind = 'samples' | 'presets';
type SampleFilter = 'all' | 'named' | 'unnamed';
type SourceFilter = 'all' | 'new' | 'in-set' | 'staged';

const SAMPLE_SCOPES: { id: SampleScope; label: string }[] = [
  { id: 'set', label: 'set' },
  { id: 'source', label: 'source' },
];

const SAMPLE_FILTERS: { id: SampleFilter; label: string }[] = [
  { id: 'all', label: 'all' },
  { id: 'named', label: 'named' },
  { id: 'unnamed', label: 'unnamed' },
];

const SOURCE_FILTERS: { id: SourceFilter; label: string }[] = [
  { id: 'all', label: 'all' },
  { id: 'new', label: 'new' },
  { id: 'in-set', label: 'in set' },
  { id: 'staged', label: 'staged' },
];

const SOURCE_ASSET_KINDS: { id: SourceAssetKind; label: string }[] = [
  { id: 'samples', label: 'samples' },
  { id: 'presets', label: 'presets' },
];

interface SamplesModeProps {
  samples: CacheSampleEntry[];
  sourceFolders: SourceFolderEntry[];
  sourceSamples: SourceSampleEntry[];
  sourcePresets: SourcePresetEntry[];
  busy: boolean;
  onRefresh: () => void;
  onAddSourceFolder: () => void;
  onRemoveSourceFolder: (folderId: string) => void;
  onScanSourceFolders: () => void;
  onCopySourceSamplesToSet: (
    sourcePaths: string[],
    options?: SourceSampleCopyOptions,
  ) => Promise<SourceSampleCopyResult | null>;
  onCopySourcePresetsToSet: (
    sourcePaths: string[],
    options?: SourcePresetCopyOptions,
  ) => Promise<SourcePresetCopyResult | null>;
}

export function SamplesMode({
  samples,
  sourceFolders,
  sourceSamples,
  sourcePresets,
  busy,
  onRefresh,
  onAddSourceFolder,
  onRemoveSourceFolder,
  onScanSourceFolders,
  onCopySourceSamplesToSet,
  onCopySourcePresetsToSet,
}: SamplesModeProps) {
  const { state } = useAppShell();
  const { goToSamples } = useNavigation();
  const [scope, setScope] = useState<SampleScope>('set');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<SampleFilter>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [sourceAssetKind, setSourceAssetKind] = useState<SourceAssetKind>('samples');
  const [stagedSourcePaths, setStagedSourcePaths] = useState<string[]>([]);
  const [selectedSourceRootId, setSelectedSourceRootId] = useState<string | null>(null);
  const [selectedSourceGroupId, setSelectedSourceGroupId] = useState<string | null>(null);
  const [selectedSourcePresetRootId, setSelectedSourcePresetRootId] = useState<string | null>(null);
  const [selectedSourcePresetGroupId, setSelectedSourcePresetGroupId] = useState<string | null>(null);
  const [selectedSourcePresetId, setSelectedSourcePresetId] = useState<string | null>(null);
  const [selectedSetFolderId, setSelectedSetFolderId] = useState<string | null>(null);
  const [selectedSetGroupId, setSelectedSetGroupId] = useState<string | null>(null);
  const [transferResult, setTransferResult] = useState<SourceSampleCopyResult | null>(null);
  const [presetTransferResult, setPresetTransferResult] = useState<SourcePresetCopyResult | null>(null);
  const stagedSourceSet = useMemo(() => new Set(stagedSourcePaths), [stagedSourcePaths]);

  const filtered = useMemo(() => {
    let list = samples;
    if (filter === 'unnamed') list = list.filter((s) => s.isUnnamed);
    if (filter === 'named') list = list.filter((s) => !s.isUnnamed);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (s) =>
          s.filename.toLowerCase().includes(q) ||
          s.base.toLowerCase().includes(q) ||
          s.note.toLowerCase().includes(q),
      );
    }
    return list;
  }, [samples, search, filter]);

  const filteredSourceSamples = useMemo(() => {
    let list = sourceSamples;
    if (sourceFilter === 'new') list = list.filter((sample) => !sample.alreadyInSet);
    if (sourceFilter === 'in-set') list = list.filter((sample) => sample.alreadyInSet);
    if (sourceFilter === 'staged') list = list.filter((sample) => stagedSourceSet.has(sample.absolutePath));
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (sample) =>
        sample.filename.toLowerCase().includes(q) ||
        sample.relativePath.toLowerCase().includes(q) ||
        sample.folderLabel.toLowerCase().includes(q) ||
        sample.extension.toLowerCase().includes(q),
    );
  }, [sourceSamples, sourceFilter, stagedSourceSet, search]);

  const filteredSourcePresets = useMemo(() => {
    let list = sourcePresets;
    if (sourceFilter === 'new') list = list.filter((preset) => !preset.alreadyInSet);
    if (sourceFilter === 'in-set') list = list.filter((preset) => preset.alreadyInSet);
    if (sourceFilter === 'staged') list = [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (preset) =>
        preset.name.toLowerCase().includes(q) ||
        preset.relativePath.toLowerCase().includes(q) ||
        preset.folderLabel.toLowerCase().includes(q) ||
        preset.type.toLowerCase().includes(q),
    );
  }, [sourcePresets, sourceFilter, search]);

  const sourceSearchActive = search.trim().length > 0;
  const setSearchActive = scope === 'set' && search.trim().length > 0;
  const setHierarchy = useMemo(() => buildSetSampleHierarchy(filtered), [filtered]);
  const selectedSetFolder = setHierarchy.folders.find((folder) => folder.id === selectedSetFolderId) ?? setHierarchy.folders[0] ?? null;
  const selectedSetGroup = selectedSetFolder?.groups.find((group) => group.id === selectedSetGroupId) ?? selectedSetFolder?.groups[0] ?? null;
  const visibleSetSamples = setSearchActive ? filtered : selectedSetGroup?.samples ?? [];
  const setGroupCount = useMemo(
    () => setHierarchy.folders.reduce((total, folder) => total + folder.groups.length, 0),
    [setHierarchy],
  );
  const sourceHierarchy = useMemo(() => buildSourceHierarchy(filteredSourceSamples), [filteredSourceSamples]);
  const sourcePresetHierarchy = useMemo(() => buildSourcePresetHierarchy(filteredSourcePresets), [filteredSourcePresets]);
  const selectedSourcePreset = useMemo(
    () => filteredSourcePresets.find((preset) => preset.id === selectedSourcePresetId) ?? filteredSourcePresets[0] ?? null,
    [filteredSourcePresets, selectedSourcePresetId],
  );

  useEffect(() => {
    const firstStagedPath = stagedSourcePaths[0] ?? null;
    const selection = findSourceHierarchySelection(sourceHierarchy, firstStagedPath);
    setSelectedSourceRootId(selection.rootId ?? sourceFolders[0]?.id ?? null);
    setSelectedSourceGroupId(selection.groupId);
  }, [sourceHierarchy, sourceFolders, stagedSourcePaths]);

  useEffect(() => {
    if (sourceAssetKind !== 'presets') return;
    const selection = findSourcePresetHierarchySelection(sourcePresetHierarchy, selectedSourcePresetId);
    setSelectedSourcePresetRootId(selection.rootId ?? sourceFolders[0]?.id ?? null);
    setSelectedSourcePresetGroupId(selection.groupId);
    if (selectedSourcePresetId && filteredSourcePresets.some((preset) => preset.id === selectedSourcePresetId)) return;
    setSelectedSourcePresetId(filteredSourcePresets[0]?.id ?? null);
  }, [filteredSourcePresets, selectedSourcePresetId, sourceAssetKind, sourceFolders, sourcePresetHierarchy]);

  const selected = useMemo(() => {
    if (scope === 'source') return null;
    if (!state.sampleFilename) return filtered[0] ?? null;
    return filtered.find((s) => s.filename === state.sampleFilename || s.relativePath.includes(state.sampleFilename)) ?? null;
  }, [filtered, scope, state.sampleFilename]);

  useEffect(() => {
    if (scope !== 'set') return;
    const selection = findSetSampleHierarchySelection(setHierarchy, selected?.relativePath ?? null);
    setSelectedSetFolderId(selection.folderId);
    setSelectedSetGroupId(selection.groupId);
  }, [scope, selected?.relativePath, setHierarchy]);

  const selectedIndex = selected ? visibleSetSamples.findIndex((s) => s.relativePath === selected.relativePath) : -1;
  const prevSample = selectedIndex > 0 ? visibleSetSamples[selectedIndex - 1] : null;
  const nextSample = selectedIndex >= 0 && selectedIndex < visibleSetSamples.length - 1 ? visibleSetSamples[selectedIndex + 1] : null;
  const unnamedCount = useMemo(() => samples.filter((s) => s.isUnnamed).length, [samples]);
  const sourceConflictCount = useMemo(() => sourceSamples.filter((sample) => sample.alreadyInSet).length, [sourceSamples]);
  const selectedSourceRoot = sourceHierarchy.roots.find((root) => root.id === selectedSourceRootId) ?? sourceHierarchy.roots[0] ?? null;
  const sourceHierarchyView = useMemo(
    () => buildSourceHierarchyColumns(selectedSourceRoot, selectedSourceGroupId),
    [selectedSourceRoot, selectedSourceGroupId],
  );
  const selectedSourceGroup = sourceHierarchyView.selectedGroup;
  const selectedSourcePresetRoot = sourcePresetHierarchy.roots.find((root) => root.id === selectedSourcePresetRootId) ?? sourcePresetHierarchy.roots[0] ?? null;
  const sourcePresetHierarchyView = useMemo(
    () => buildSourcePresetHierarchyColumns(selectedSourcePresetRoot, selectedSourcePresetGroupId),
    [selectedSourcePresetRoot, selectedSourcePresetGroupId],
  );
  const selectedSourcePresetGroup = sourcePresetHierarchyView.selectedGroup;
  const visibleSourceSamples = sourceSearchActive ? filteredSourceSamples : selectedSourceGroup?.samples ?? [];
  const visibleSourcePresets = sourceSearchActive ? filteredSourcePresets : selectedSourcePresetGroup?.presets ?? [];

  useEffect(() => {
    if (sourceAssetKind !== 'presets') return;
    if (selectedSourcePresetId && visibleSourcePresets.some((preset) => preset.id === selectedSourcePresetId)) return;
    setSelectedSourcePresetId(visibleSourcePresets[0]?.id ?? null);
  }, [selectedSourcePresetId, sourceAssetKind, visibleSourcePresets]);
  const visibleSourceConflictCount = visibleSourceSamples.filter((sample) => sample.alreadyInSet).length;
  const stageableVisibleSourcePaths = useMemo(
    () => visibleSourceSamples.filter((sample) => !sample.alreadyInSet).map((sample) => sample.absolutePath),
    [visibleSourceSamples],
  );
  const stagedCount = stagedSourcePaths.length;
  const sourcePresetConflictCount = useMemo(() => sourcePresets.filter((preset) => preset.alreadyInSet).length, [sourcePresets]);

  const toggleSourceStage = (absolutePath: string) => {
    setStagedSourcePaths((paths) =>
      paths.includes(absolutePath) ? paths.filter((path) => path !== absolutePath) : [...paths, absolutePath],
    );
  };

  const stageVisibleSourceSamples = () => {
    setStagedSourcePaths((paths) => {
      const next = new Set(paths);
      for (const sourcePath of stageableVisibleSourcePaths) next.add(sourcePath);
      return [...next];
    });
  };

  const handleCopyStaged = async (options?: SourceSampleCopyOptions) => {
    const result = await onCopySourceSamplesToSet(stagedSourcePaths, options);
    setTransferResult(result);
    setStagedSourcePaths([]);
  };

  const transferIssueCount = (transferResult?.conflicts.length ?? 0) + (transferResult?.skipped.length ?? 0);
  const transferConflictPaths = transferResult?.conflicts.map((item) => item.sourcePath) ?? [];

  const handleReplaceConflicts = async () => {
    const result = await onCopySourceSamplesToSet(transferConflictPaths, { conflict: 'replace' });
    setTransferResult(result);
  };

  const handleCopySourcePreset = async (preset: SourcePresetEntry, options?: SourcePresetCopyOptions) => {
    const result = await onCopySourcePresetsToSet([preset.absolutePath], options);
    setPresetTransferResult(result);
  };

  const handleReplacePresetConflict = async () => {
    const conflictPath = presetTransferResult?.conflicts[0]?.sourcePath;
    if (!conflictPath) return;
    const result = await onCopySourcePresetsToSet([conflictPath], { conflict: 'replace' });
    setPresetTransferResult(result);
  };

  const selectSetGroup = (groupId: string) => {
    setSelectedSetGroupId(groupId);
    const group = selectedSetFolder?.groups.find((item) => item.id === groupId);
    const firstSample = group?.samples[0];
    if (firstSample) goToSamples(firstSample.filename);
  };

  const selectSetFolder = (folderId: string) => {
    setSelectedSetFolderId(folderId);
    const folder = setHierarchy.folders.find((item) => item.id === folderId);
    const firstGroup = folder?.groups[0];
    setSelectedSetGroupId(firstGroup?.id ?? null);
    const firstSample = firstGroup?.samples[0];
    if (firstSample) goToSamples(firstSample.filename);
  };

  const renderSetSampleRow = (sample: CacheSampleEntry, i: number) => (
    <button
      key={sample.relativePath}
      type="button"
      className={`object-row sample-row${selected?.relativePath === sample.relativePath ? ' selected' : ''}${sample.isUnnamed ? ' needs-rename' : ''}`}
      onClick={() => goToSamples(sample.filename)}
    >
      <span className="idx">{String(i + 1).padStart(2, '0')}</span>
      <span className="name">
        <span>{sample.note || sample.base}</span>
        <span className="path mono">{sample.filename}</span>
      </span>
      <span className="meta">{sample.isUnnamed ? '? rename' : String(sample.idx)}</span>
    </button>
  );

  const setGroupStatus = selectedSetGroup
    ? `${selectedSetGroup.sampleCount} files · ${selectedSetGroup.unnamedCount} rename`
    : 'no group selected';

  const renderSourceSampleRow = (sample: SourceSampleEntry, i: number) => {
    const staged = stagedSourceSet.has(sample.absolutePath);
    return (
      <button
        key={sample.id}
        type="button"
        className={`object-row sample-row source-sample-row${staged ? ' selected' : ''}${sample.alreadyInSet ? ' changed' : ''}`}
        onClick={() => toggleSourceStage(sample.absolutePath)}
      >
        <span className="idx">{String(i + 1).padStart(2, '0')}</span>
        <span className="name">
          <span>{sample.filename.replace(/\.[^.]+$/, '')}</span>
          <span className="path mono">{sample.folderLabel} / {sample.relativePath}</span>
        </span>
        <span className="meta">{sample.alreadyInSet ? 'in set' : `${sample.extension} · stage`}</span>
      </button>
    );
  };

  const renderSourcePresetRow = (preset: SourcePresetEntry, i: number) => (
    <button
      key={preset.id}
      type="button"
      className={`object-row sample-row source-sample-row${selectedSourcePreset?.id === preset.id ? ' selected' : ''}${preset.alreadyInSet ? ' changed' : ''}`}
      onClick={() => setSelectedSourcePresetId(preset.id)}
    >
      <span className="idx">{String(i + 1).padStart(2, '0')}</span>
      <span className="name">
        <span>{preset.name}</span>
        <span className="path mono">{preset.folderLabel} / {preset.relativePath}</span>
      </span>
      <span className="meta">
        {preset.missingSampleRefs.length > 0
          ? `${preset.missingSampleRefs.length} missing`
          : preset.alreadyInSet ? 'in set' : `${preset.type} · ${preset.sampleRefs.length} refs`}
      </span>
    </button>
  );

  const renderSourcePresetInspector = (preset: SourcePresetEntry | null) => {
    if (!preset) {
      return <p className="mono source-transfer-hint">scan source folders to inspect preset folders</p>;
    }

    return (
      <section className="source-preset-inspector" aria-label="source preset inspector">
        <div className="source-preset-head">
          <div>
            <span className="mono">{preset.type}</span>
            <strong>{preset.name}</strong>
          </div>
          <span className="sample-status-pill">{preset.alreadyInSet ? 'in set' : 'source only'}</span>
        </div>
        <div className="sample-inspector-grid">
          <div className="sample-inspector-row">
            <span>folder</span>
            <span className="mono">{preset.folderLabel}</span>
          </div>
          <div className="sample-inspector-row">
            <span>path</span>
            <span className="mono">{preset.relativePath}</span>
          </div>
          <div className="sample-inspector-row">
            <span>refs</span>
            <span className="mono">{preset.availableSampleRefs.length}/{preset.sampleRefs.length} available</span>
          </div>
          <div className="sample-inspector-row">
            <span>missing</span>
            <span className="mono">{preset.missingSampleRefs.length}</span>
          </div>
          <div className="sample-inspector-row">
            <span>state</span>
            <span className="mono">{preset.flags.length > 0 ? preset.flags.join(' · ') : 'ready to review'}</span>
          </div>
        </div>
        <div className="source-preset-ref-list">
          <span className="mono">sample refs</span>
          {preset.sampleRefs.length > 0 ? (
            preset.sampleRefs.slice(0, 24).map((ref) => (
              <span key={ref} className={`mono${preset.missingSampleRefs.includes(ref) ? ' missing' : ''}`}>
                {ref}
              </span>
            ))
          ) : (
            <span className="mono">no sample refs in patch</span>
          )}
        </div>
        <div className="source-transfer-actions">
          <button
            type="button"
            className="inline-action"
            onClick={() => void handleCopySourcePreset(preset)}
            disabled={busy}
          >
            copy preset to set
          </button>
          {presetTransferResult?.conflicts.length ? (
            <button type="button" className="inline-action" onClick={() => void handleReplacePresetConflict()} disabled={busy}>
              replace conflict
            </button>
          ) : null}
          <span className="mono">
            {presetTransferResult
              ? `${presetTransferResult.copied.length} preset · ${presetTransferResult.sampleResult.copied.length + presetTransferResult.sampleResult.replaced.length} samples · ${presetTransferResult.conflicts.length + presetTransferResult.sampleResult.conflicts.length} conflict · ${presetTransferResult.missingSampleRefs.length} missing`
              : 'imports to presets/user'}
          </span>
        </div>
      </section>
    );
  };

  const folderMeta = (folder: SourceFolderEntry) => {
    if (folder.flags.length > 0) return folder.flags.join(' · ');
    return `${folder.sampleCount} samples · ${folder.presetCount} presets`;
  };

  return (
    <ModeScreen>
      <div className="library-toolbar">
        <Segments options={SAMPLE_SCOPES} value={scope} onChange={(v) => setScope(v as SampleScope)} />
        {scope === 'set' ? (
          <Segments options={SAMPLE_FILTERS} value={filter} onChange={(v) => setFilter(v as SampleFilter)} />
        ) : (
          <>
            <Segments options={SOURCE_ASSET_KINDS} value={sourceAssetKind} onChange={(v) => setSourceAssetKind(v as SourceAssetKind)} />
            <Segments options={SOURCE_FILTERS} value={sourceFilter} onChange={(v) => setSourceFilter(v as SourceFilter)} />
          </>
        )}
        <SearchField value={search} onChange={setSearch} placeholder={scope === 'set' ? 'search set samples' : `search source ${sourceAssetKind}`} />
      </div>

      <p className="screen-headline mono" aria-label="sample library summary">
        {scope === 'set'
          ? `${samples.length} set files · ${unnamedCount} unnamed`
          : `${sourceFolders.length} source dirs · ${sourceSamples.length} samples · ${sourcePresets.length} presets · ${stagedCount} staged`}
      </p>

      <LibraryWorkspace
        showDetail={scope === 'source' || !!selected}
        list={
          <>
            <div className="list-toolbar">
              <span className="mono">
                {scope === 'set'
                  ? setSearchActive ? `showing ${filtered.length}/${samples.length}` : `${setHierarchy.folders.length} folders · ${setGroupCount} groups`
                    : sourceAssetKind === 'samples'
                    ? `showing ${visibleSourceSamples.length}/${sourceSamples.length}`
                    : `showing ${visibleSourcePresets.length}/${sourcePresets.length}`}
              </span>
              <span className="mono">
                {scope === 'set'
                  ? setSearchActive ? `${unnamedCount} rename` : `${visibleSetSamples.length} files in group`
                  : sourceAssetKind === 'presets'
                    ? `${sourcePresetConflictCount} in set`
                    : sourceSearchActive ? 'search results' : `${visibleSourceConflictCount} in set`}
              </span>
            </div>
            <div className="library-list-scroll">
              {scope === 'set' ? (
                setSearchActive ? filtered.slice(0, 300).map(renderSetSampleRow) : (
                  <div className="hierarchy-browser set-sample-browser">
                    <div className="hierarchy-column" aria-label="set sample folders">
                      {setHierarchy.folders.map((folder) => (
                        <button
                          key={folder.id}
                          type="button"
                          className={`hierarchy-row${selectedSetFolder?.id === folder.id ? ' selected' : ''}${folder.unnamedCount > 0 ? ' needs-rename' : ''}`}
                          onClick={() => selectSetFolder(folder.id)}
                        >
                          <span>{folder.label}</span>
                          <span className="mono">{folder.sampleCount}</span>
                          <span className="mono hierarchy-breadcrumb">{folder.unnamedCount} rename</span>
                        </button>
                      ))}
                    </div>
                    <div className="hierarchy-column" aria-label="set sample groups">
                      {selectedSetFolder?.groups.map((group) => (
                        <button
                          key={group.id}
                          type="button"
                          className={`hierarchy-row${selectedSetGroup?.id === group.id ? ' selected' : ''}${group.unnamedCount > 0 ? ' needs-rename' : ''}`}
                          onClick={() => selectSetGroup(group.id)}
                        >
                          <span>{group.label}</span>
                          <span className="mono">{group.sampleCount}</span>
                          <span className="mono hierarchy-breadcrumb">{group.noteSummary}</span>
                        </button>
                      ))}
                    </div>
                    <div className="hierarchy-column hierarchy-column-wide" aria-label="set sample files">
                      {visibleSetSamples.slice(0, 300).map(renderSetSampleRow)}
                    </div>
                  </div>
                )
              ) : (
                  <>
                    {sourceFolders.length === 0 ? (
                      <div className="source-library-empty">
                        <div>
                          <span className="mono">pc folders</span>
                          <strong>no source folders indexed</strong>
                        </div>
                        <button type="button" className="inline-action" onClick={onAddSourceFolder} disabled={busy}>add</button>
                      </div>
                    ) : null}
                    {sourceAssetKind === 'presets' && sourceSearchActive ? (
                      filteredSourcePresets.slice(0, 300).map(renderSourcePresetRow)
                    ) : sourceAssetKind === 'presets' && sourceFolders.length > 0 ? (
                      <div className="hierarchy-browser source-hierarchy-browser">
                        <div className="hierarchy-column" aria-label="source folders">
                          {sourceFolders.map((folder) => (
                            <div key={folder.id} className={`source-root-row${selectedSourcePresetRootId === folder.id ? ' selected' : ''}`}>
                              <button
                                type="button"
                                className="hierarchy-row"
                                onClick={() => {
                                  const nextRoot = sourcePresetHierarchy.roots.find((root) => root.id === folder.id);
                                  setSelectedSourcePresetRootId(folder.id);
                                  setSelectedSourcePresetGroupId(nextRoot?.groups[0]?.id ?? null);
                                }}
                              >
                                <span>{folder.label}</span>
                                <span className="mono">{folder.presetCount}</span>
                              </button>
                              <button type="button" className="inline-action" onClick={() => onRemoveSourceFolder(folder.id)} disabled={busy}>
                                remove
                              </button>
                              <span className="mono source-root-path">{folderMeta(folder)}</span>
                            </div>
                          ))}
                        </div>
                        {sourcePresetHierarchyView.columns.map((column, columnIndex) => (
                          <div
                            key={column.id}
                            className="hierarchy-column"
                            aria-label={columnIndex === 0 ? 'source preset folders in selected root' : `source preset folders in ${column.label}`}
                          >
                            {column.groups.map((group) => (
                              <button
                                key={group.id}
                                type="button"
                                className={`hierarchy-row${column.selectedGroupId === group.id ? ' selected' : ''}${group.directPresetCount === 0 ? ' muted' : ''}`}
                                onClick={() => setSelectedSourcePresetGroupId(group.id)}
                              >
                                <span>{group.label}</span>
                                <span className="mono">
                                  {group.directPresetCount > 0
                                    ? `${group.directPresetCount}/${group.totalPresetCount}`
                                    : group.totalPresetCount}
                                </span>
                                {group.breadcrumb.includes('/') ? <span className="mono hierarchy-breadcrumb">{group.breadcrumb}</span> : null}
                              </button>
                            ))}
                          </div>
                        ))}
                        <div className="hierarchy-column hierarchy-column-wide" aria-label="source presets">
                          {visibleSourcePresets.slice(0, 300).map(renderSourcePresetRow)}
                        </div>
                      </div>
                    ) : sourceSearchActive ? (
                      filteredSourceSamples.slice(0, 300).map(renderSourceSampleRow)
                    ) : sourceFolders.length > 0 ? (
                      <div className="hierarchy-browser source-hierarchy-browser">
                        <div className="hierarchy-column" aria-label="source folders">
                          {sourceFolders.map((folder) => (
                            <div key={folder.id} className={`source-root-row${selectedSourceRootId === folder.id ? ' selected' : ''}`}>
                              <button
                                type="button"
                                className="hierarchy-row"
                                onClick={() => {
                                  const nextRoot = sourceHierarchy.roots.find((root) => root.id === folder.id);
                                  setSelectedSourceRootId(folder.id);
                                  setSelectedSourceGroupId(nextRoot?.groups[0]?.id ?? null);
                                }}
                              >
                                <span>{folder.label}</span>
                                <span className="mono">{sourceAssetKind === 'samples' ? folder.sampleCount : folder.presetCount}</span>
                              </button>
                              <button type="button" className="inline-action" onClick={() => onRemoveSourceFolder(folder.id)} disabled={busy}>
                                remove
                              </button>
                              <span className="mono source-root-path">{folderMeta(folder)}</span>
                            </div>
                          ))}
                        </div>
                        {sourceHierarchyView.columns.map((column, columnIndex) => (
                          <div
                            key={column.id}
                            className="hierarchy-column"
                            aria-label={columnIndex === 0 ? 'source folders in selected root' : `source folders in ${column.label}`}
                          >
                            {column.groups.map((group) => (
                              <button
                                key={group.id}
                                type="button"
                                className={`hierarchy-row${column.selectedGroupId === group.id ? ' selected' : ''}${group.directSampleCount === 0 ? ' muted' : ''}`}
                                onClick={() => setSelectedSourceGroupId(group.id)}
                              >
                                <span>{group.label}</span>
                                <span className="mono">
                                  {group.directSampleCount > 0
                                    ? `${group.directSampleCount}/${group.totalSampleCount}`
                                    : group.totalSampleCount}
                                </span>
                                {group.breadcrumb.includes('/') ? <span className="mono hierarchy-breadcrumb">{group.breadcrumb}</span> : null}
                              </button>
                            ))}
                          </div>
                        ))}
                        <div className="hierarchy-column hierarchy-column-wide" aria-label="source samples">
                          {visibleSourceSamples.slice(0, 300).map(renderSourceSampleRow)}
                        </div>
                      </div>
                    ) : null}
                    {sourceFolders.length > 0 && filteredSourceSamples.length === 0 && sourceAssetKind === 'samples' ? (
                      <p className="mono" style={{ padding: '12px 16px', opacity: 0.45 }}>scan source folders to index samples</p>
                    ) : null}
                    {sourceFolders.length > 0 && filteredSourcePresets.length === 0 && sourceAssetKind === 'presets' ? (
                      <p className="mono" style={{ padding: '12px 16px', opacity: 0.45 }}>scan source folders to index presets</p>
                    ) : null}
                  </>
                )}
              {scope === 'set' && filtered.length === 0 ? (
                <p className="mono" style={{ padding: '12px 16px', opacity: 0.45 }}>no samples match</p>
              ) : null}
            </div>
            {scope === 'set' ? (
              <SetSamplesToolbar busy={busy} unnamedCount={unnamedCount} onRefresh={onRefresh} />
            ) : (
              <SourceSamplesToolbar
                busy={busy}
                sourceFolderCount={sourceFolders.length}
                stagedCount={stagedCount}
                stageableCount={sourceAssetKind === 'samples' ? stageableVisibleSourcePaths.length : 0}
                onAddFolder={onAddSourceFolder}
                onScan={onScanSourceFolders}
                onStageVisible={sourceAssetKind === 'samples' ? stageVisibleSourceSamples : undefined}
                onClearStaged={() => setStagedSourcePaths([])}
                onCopyToSet={sourceAssetKind === 'samples' ? () => void handleCopyStaged() : undefined}
              />
            )}
          </>
        }
        detail={
          scope === 'source' ? (
            <div className="detail-body source-detail-body">
              {sourceAssetKind === 'presets' ? (
                renderSourcePresetInspector(selectedSourcePreset)
              ) : (
                <>
                  <div className="source-detail-summary mono">
                    <span>{stagedCount} staged</span>
                    <span>{sourceConflictCount} already in set</span>
                  </div>
                  {transferResult ? (
                    <section className="source-transfer-result" aria-label="last source transfer result">
                      <p className="mono source-transfer-summary">
                        {transferResult.copied.length} copied · {transferResult.replaced.length} replaced
                        {transferIssueCount > 0 ? ` · ${transferIssueCount} issue(s)` : ''}
                      </p>
                      {transferResult.conflicts.length > 0 ? (
                        <div className="source-transfer-actions">
                          <button type="button" className="inline-action" onClick={() => void handleReplaceConflicts()} disabled={busy}>
                            replace conflicts
                          </button>
                        </div>
                      ) : null}
                    </section>
                  ) : (
                    <p className="mono source-transfer-hint">stage samples, then copy to set</p>
                  )}
                </>
              )}
            </div>
          ) : selected ? (
            <>
              <ObjectDetailHead
                title={selected.base}
                meta={`${selectedSetFolder?.label ?? 'set'} · ${selected.note} · ${selected.idx}`}
                position={selectedIndex >= 0 ? `${selectedIndex + 1}/${visibleSetSamples.length}` : undefined}
                onPrev={() => prevSample && goToSamples(prevSample.filename)}
                onNext={() => nextSample && goToSamples(nextSample.filename)}
                prevDisabled={!prevSample}
                nextDisabled={!nextSample}
              />
              <div className="detail-body sample-detail-body">
                <section className="sample-context-slab" aria-label="sample group context">
                  <div>
                    <span className="mono">group</span>
                    <strong>{selectedSetGroup?.label ?? selected.base}</strong>
                  </div>
                  <div>
                    <span className="mono">variants</span>
                    <strong>{selectedSetGroup?.noteSummary ?? selected.note}</strong>
                  </div>
                  <div>
                    <span className="mono">state</span>
                    <strong>{setGroupStatus}</strong>
                  </div>
                </section>

                <section className="sample-preview-slab">
                  <CacheAudioPreview relativePath={selected.relativePath} />
                </section>

                <section className="sample-inspector-grid" aria-label="sample inspector">
                  <div className="sample-inspector-row">
                    <span>file</span>
                    <span className="mono">{selected.filename}</span>
                  </div>
                  <div className="sample-inspector-row">
                    <span>path</span>
                    <span className="mono">{selected.relativePath}</span>
                  </div>
                  <div className="sample-inspector-row">
                    <span>base</span>
                    <span className="mono">{selected.base}</span>
                  </div>
                  <div className="sample-inspector-row">
                    <span>suffix</span>
                    <span className="mono">{selected.note} · {selected.idx}</span>
                  </div>
                  <div className="sample-inspector-row">
                    <span>rename</span>
                    <span className="mono">{selected.isUnnamed ? 'candidate' : 'not needed'}</span>
                  </div>
                </section>
              </div>
            </>
          ) : null
        }
        empty={<span>—</span>}
      />
    </ModeScreen>
  );
}
