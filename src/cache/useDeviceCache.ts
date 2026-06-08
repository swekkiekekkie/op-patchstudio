import { useCallback, useEffect, useState } from 'react';
import type {
  BackupEntry,
  CachePresetEntry,
  CacheSampleEntry,
  DeviceStatus,
  ProjectListEntry,
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
    indexedSampleCount,
    projectIndexNote,
    busy,
    refresh,
    pull,
    push,
    backup,
    restoreBackup,
  };
}
