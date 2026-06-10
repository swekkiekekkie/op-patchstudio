import { useCallback, useEffect, useState } from 'react';
import type {
  BackupEntry,
  CachePresetEntry,
  CacheSampleEntry,
  DeviceStatus,
  ProjectListEntry,
  SourceFolderEntry,
  SourcePresetCopyOptions,
  SourcePresetCopyResult,
  SourcePresetEntry,
  SourceSampleCopyOptions,
  SourceSampleCopyResult,
  SourceSampleEntry,
} from '../types/opxy';
import { useAppContext } from '../context/AppContext';
import { notify } from '../utils/notify';

export function useDeviceCache() {
  const { dispatch } = useAppContext();
  const [status, setStatus] = useState<DeviceStatus | null>(null);
  const [presets, setPresets] = useState<CachePresetEntry[]>([]);
  const [standaloneSamples, setStandaloneSamples] = useState<CacheSampleEntry[]>([]);
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [dirtyPresets, setDirtyPresets] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [projectIndexNote, setProjectIndexNote] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectListEntry[]>([]);
  const [indexedSampleCount, setIndexedSampleCount] = useState(0);
  const [sourceFolders, setSourceFolders] = useState<SourceFolderEntry[]>([]);
  const [sourceSamples, setSourceSamples] = useState<SourceSampleEntry[]>([]);
  const [sourcePresets, setSourcePresets] = useState<SourcePresetEntry[]>([]);

  const refresh = useCallback(async () => {
    if (!window.opxy) {
      const inBrowser = typeof navigator !== 'undefined' && !navigator.userAgent.includes('Electron');
      setStatus({
        connected: false,
        deviceName: null,
        cacheRoot: '',
        lastPullAt: null,
        error: inBrowser
          ? 'Opened in a browser — use the Electron window from npm run dev'
          : 'App bridge unavailable — quit and run npm run dev again',
      });
      return;
    }
    const s = await window.opxy.device.status();
    setStatus(s);
    if ((s.presetCount ?? 0) > 0 || (s.sampleCount ?? 0) > 0) {
      setPresets(await window.opxy.device.listPresets());
      setStandaloneSamples(await window.opxy.device.listStandaloneSamples());
    } else {
      setPresets([]);
      setStandaloneSamples([]);
    }
    setDirtyPresets(await window.opxy.device.listDirtyPresets());
    setBackups(await window.opxy.device.listBackups());
    if (window.opxy.device.listSourceFolders) {
      const folders = await window.opxy.device.listSourceFolders();
      setSourceFolders(folders);
      if (folders.length > 0 && window.opxy.device.scanSourceFolders) {
        const scanResult = await window.opxy.device.scanSourceFolders();
        setSourceFolders(scanResult.folders);
        setSourceSamples(scanResult.samples);
        setSourcePresets(scanResult.presets);
      }
    }

    if (window.opxy.device.buildProjectIndex) {
      const summary = await window.opxy.device.buildProjectIndex();
      setIndexedSampleCount(summary?.referencedFilenames ?? 0);
      setProjectIndexNote(
        summary
          ? `${summary.projectCount} projects · ${summary.referencedFilenames} sample names indexed`
          : 'Pull again to index projects/ for rename safety checks',
      );
    }
    if (window.opxy.device.listProjects) {
      setProjects(await window.opxy.device.listProjects());
    } else {
      setProjects([]);
    }
  }, []);

  const scanSourceFolders = useCallback(async () => {
    if (!window.opxy?.device.scanSourceFolders) return;
    setBusy(true);
    try {
      const result = await window.opxy.device.scanSourceFolders();
      setSourceFolders(result.folders);
      setSourceSamples(result.samples);
      setSourcePresets(result.presets);
      notify(dispatch, 'success', 'Source library scanned', `${result.samples.length + result.presets.length} asset(s) indexed`);
    } finally {
      setBusy(false);
    }
  }, [dispatch]);

  const addSourceFolder = useCallback(async () => {
    if (!window.opxy?.device.addSourceFolder) {
      notify(dispatch, 'error', 'Unavailable', 'add folder requires the desktop app');
      return;
    }
    try {
      const result = await window.opxy.device.addSourceFolder();
      if (result.cancelled) return;
      if (!result.ok) {
        notify(dispatch, 'error', 'Could not add folder', result.error ?? 'Unknown error');
        return;
      }
      setBusy(true);
      try {
        const scanResult = await window.opxy.device.scanSourceFolders();
        setSourceFolders(scanResult.folders);
        setSourceSamples(scanResult.samples);
        setSourcePresets(scanResult.presets);
        const label = result.folder?.label ?? 'folder';
        notify(
          dispatch,
          'success',
          'Source folder added',
          `${label} · ${scanResult.samples.length + scanResult.presets.length} asset(s) indexed`,
        );
      } finally {
        setBusy(false);
      }
    } catch (e) {
      notify(dispatch, 'error', 'Could not add folder', e instanceof Error ? e.message : 'Unknown error');
    }
  }, [dispatch]);

  const removeSourceFolder = useCallback(async (folderId: string) => {
    if (!window.opxy?.device.removeSourceFolder) return;
    setBusy(true);
    try {
      const result = await window.opxy.device.removeSourceFolder(folderId);
      if (!result.ok) {
        notify(dispatch, 'error', 'Could not remove folder', result.error ?? 'Unknown error');
        return;
      }
      setSourceFolders(result.folders ?? []);
      setSourceSamples((samples) => samples.filter((sample) => sample.folderId !== folderId));
      setSourcePresets((presets) => presets.filter((preset) => preset.folderId !== folderId));
      notify(dispatch, 'success', 'Source folder removed', 'Files on disk were not changed');
    } finally {
      setBusy(false);
    }
  }, [dispatch]);

  const copySourceSamplesToSet = useCallback(async (
    sourcePaths: string[],
    options?: SourceSampleCopyOptions,
  ): Promise<SourceSampleCopyResult | null> => {
    if (!window.opxy?.device.copySourceSamplesToSet || sourcePaths.length === 0) return null;
    setBusy(true);
    try {
      const result = await window.opxy.device.copySourceSamplesToSet(sourcePaths, options);
      if (!result.ok) {
        notify(dispatch, 'error', 'Transfer failed', result.error ?? 'Unknown error');
      } else {
        const conflictNote = result.conflicts.length > 0 ? ` · ${result.conflicts.length} conflict(s)` : '';
        const replacedNote = result.replaced.length > 0 ? ` · ${result.replaced.length} replaced` : '';
        notify(dispatch, 'success', 'Samples copied to set', `${result.copied.length} copied${replacedNote}${conflictNote}`);
      }
      await refresh();
      if (window.opxy.device.scanSourceFolders) {
        const scan = await window.opxy.device.scanSourceFolders();
        setSourceFolders(scan.folders);
        setSourceSamples(scan.samples);
        setSourcePresets(scan.presets);
      }
      return result;
    } finally {
      setBusy(false);
    }
  }, [dispatch, refresh]);

  const copySourcePresetsToSet = useCallback(async (
    sourcePaths: string[],
    options?: SourcePresetCopyOptions,
  ): Promise<SourcePresetCopyResult | null> => {
    if (!window.opxy?.device.copySourcePresetsToSet || sourcePaths.length === 0) return null;
    setBusy(true);
    try {
      const result = await window.opxy.device.copySourcePresetsToSet(sourcePaths, options);
      if (!result.ok) {
        notify(dispatch, 'error', 'Transfer failed', result.error ?? 'Unknown error');
      } else {
        const conflictNote = result.conflicts.length > 0 ? ` · ${result.conflicts.length} conflict(s)` : '';
        const replacedNote = result.replaced.length > 0 ? ` · ${result.replaced.length} replaced` : '';
        notify(dispatch, 'success', 'Presets copied to set', `${result.copied.length} copied${replacedNote}${conflictNote}`);
      }
      await refresh();
      if (window.opxy.device.scanSourceFolders) {
        const scan = await window.opxy.device.scanSourceFolders();
        setSourceFolders(scan.folders);
        setSourceSamples(scan.samples);
        setSourcePresets(scan.presets);
      }
      return result;
    } finally {
      setBusy(false);
    }
  }, [dispatch, refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const pull = useCallback(async () => {
    if (!window.opxy) return;
    setBusy(true);
    try {
      const result = await window.opxy.device.pull();
      if (!result.ok) {
        notify(dispatch, 'error', 'Pull failed', result.error ?? 'Unknown error');
      } else {
        notify(
          dispatch,
          'success',
          'Pull complete',
          `${result.presetCount ?? 0} presets, ${result.sampleCount ?? 0} samples (+ projects for rename index)`,
        );
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }, [dispatch, refresh]);

  const backup = useCallback(async () => {
    if (!window.opxy) return;
    setBusy(true);
    try {
      const result = await window.opxy.device.backup();
      if (!result.ok) {
        notify(dispatch, 'error', 'Backup failed', result.error ?? 'Unknown error');
      } else {
        notify(dispatch, 'success', 'Backup saved', `${result.presetCount ?? 0} presets → Documents/OP-XY Backups/`);
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }, [dispatch, refresh]);

  const push = useCallback(async () => {
    if (!window.opxy) return;
    setBusy(true);
    try {
      const backupResult = await window.opxy.device.backup();
      if (!backupResult.ok) {
        notify(dispatch, 'error', 'Push cancelled', backupResult.error ?? 'Pre-push backup failed');
        return;
      }
      const result = await window.opxy.device.push();
      if (!result.ok) {
        notify(dispatch, 'error', 'Push failed', result.error ?? 'Unknown error');
      } else {
        notify(dispatch, 'success', 'Push complete', 'Device updated from local cache');
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }, [dispatch, refresh]);

  const restoreBackup = useCallback(
    async (path: string) => {
      if (!window.opxy) return;
      setBusy(true);
      try {
        const result = await window.opxy.device.restoreBackup(path);
        if (!result.ok) {
          notify(dispatch, 'error', 'Restore failed', result.error ?? 'Unknown error');
        } else {
          const backup = backups.find((b) => b.path === path);
          notify(
            dispatch,
            'success',
            'Cache restored',
            backup ? new Date(backup.createdAt).toLocaleString() : path,
          );
        }
        await refresh();
      } finally {
        setBusy(false);
      }
    },
    [backups, dispatch, refresh],
  );

  return {
    status,
    presets,
    standaloneSamples,
    dirtyPresets,
    backups,
    projects,
    sourceFolders,
    sourceSamples,
    sourcePresets,
    indexedSampleCount,
    projectIndexNote,
    busy,
    refresh,
    pull,
    push,
    backup,
    restoreBackup,
    addSourceFolder,
    removeSourceFolder,
    scanSourceFolders,
    copySourceSamplesToSet,
    copySourcePresetsToSet,
  };
}
