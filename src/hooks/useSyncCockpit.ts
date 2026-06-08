import type { useDeviceCache } from '../cache/useDeviceCache';

export type SyncCockpit = ReturnType<typeof useSyncCockpit>;

export function useSyncCockpit(cache: ReturnType<typeof useDeviceCache>) {
  const presetCount = cache.status?.presetCount ?? 0;
  const sampleCount = cache.status?.sampleCount ?? 0;
  const projectCount = cache.projects.length;
  const cacheReady = presetCount > 0 || sampleCount > 0;

  return {
    status: cache.status,
    connected: cache.status?.connected ?? false,
    busy: cache.busy,
    dirtyPresets: cache.dirtyPresets,
    dirtyCount: cache.dirtyPresets.length,
    presetCount,
    sampleCount,
    projectCount,
    cacheReady,
    deviceName: cache.status?.deviceName ?? null,
    lastPullAt: cache.status?.lastPullAt ?? null,
    pull: cache.pull,
    push: cache.push,
    refresh: cache.refresh,
  };
}
