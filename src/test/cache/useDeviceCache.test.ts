// @vitest-environment jsdom
import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useDeviceCache } from '../../cache/useDeviceCache';
import { useAppContext } from '../../context/AppContext';
import type { CachePresetEntry, DeviceStatus } from '../../types/opxy';

vi.mock('../../context/AppContext');

describe('useDeviceCache', () => {
  const mockDispatch = vi.fn();
  const mockPresets: CachePresetEntry[] = [
    {
      relativePath: 'presets/drum/kit1.preset',
      category: 'drum',
      name: 'kit1',
      type: 'drum',
      sampleBased: true,
      sampleCount: 0,
    },
  ];
  const mockStatus: DeviceStatus = {
    connected: true,
    deviceName: 'OP-XY',
    cacheRoot: '/cache',
    lastPullAt: Date.now(),
    presetCount: 1,
    sampleCount: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAppContext as ReturnType<typeof vi.fn>).mockReturnValue({ dispatch: mockDispatch });

    window.opxy = {
      device: {
        status: vi.fn().mockResolvedValue(mockStatus),
        listPresets: vi.fn().mockResolvedValue(mockPresets),
        listStandaloneSamples: vi.fn().mockResolvedValue([]),
        listDirtyPresets: vi.fn().mockResolvedValue([]),
        listBackups: vi.fn().mockResolvedValue([]),
        buildProjectIndex: vi.fn().mockResolvedValue(null),
        listProjects: vi.fn().mockResolvedValue([]),
      },
    } as unknown as typeof window.opxy;
  });

  afterEach(() => {
    delete window.opxy;
  });

  it('refresh populates presets when bridge returns data', async () => {
    const { result } = renderHook(() => useDeviceCache());

    await waitFor(() => {
      expect(result.current.presets).toEqual(mockPresets);
    });

    expect(result.current.status).toEqual(mockStatus);
    expect(window.opxy?.device.status).toHaveBeenCalled();
    expect(window.opxy?.device.listPresets).toHaveBeenCalled();

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.presets).toEqual(mockPresets);
  });
});
