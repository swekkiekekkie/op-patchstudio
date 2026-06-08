import { useCallback, useEffect, useMemo, useState } from 'react';
import { CACHE_BACKED_SET_INDEX, MOCK_SETS } from '../data/mockSets';
import type { SetSummary } from '../types/sync';
import type { SyncCockpit } from './useSyncCockpit';

const DEVICE_USAGE = { presets: 2.1, samples: 3.2, projects: 0.4, other: 1.7 };

export type SetLibrary = ReturnType<typeof useSetLibrary>;

export function useSetLibrary(sync: SyncCockpit) {
  const [setIndex, setSetIndex] = useState(CACHE_BACKED_SET_INDEX);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pushSlabOpen, setPushSlabOpen] = useState(false);
  const [sets, setSets] = useState<SetSummary[]>(() => MOCK_SETS.map((set) => ({ ...set })));

  useEffect(() => {
    if (!sync.cacheReady) return;
    setSets((prev) =>
      prev.map((set, index) =>
        index === CACHE_BACKED_SET_INDEX
          ? {
              ...set,
              stats: {
                presets: sync.presetCount,
                samples: sync.sampleCount,
                projects: sync.projectCount,
              },
            }
          : set,
      ),
    );
  }, [sync.cacheReady, sync.presetCount, sync.sampleCount, sync.projectCount]);

  const activeSet = sets[setIndex] ?? sets[0]!;

  const selectSet = useCallback((index: number) => {
    setSetIndex((index + sets.length) % sets.length);
    setPickerOpen(false);
  }, [sets.length]);

  const prevSet = useCallback(() => {
    setSetIndex((index) => (index - 1 + sets.length) % sets.length);
  }, [sets.length]);

  const nextSet = useCallback(() => {
    setSetIndex((index) => (index + 1) % sets.length);
  }, [sets.length]);

  const commit = useCallback(() => {
    setSets((prev) =>
      prev.map((set, index) => {
        if (index !== setIndex) return set;
        const commits = [...set.commits.filter((label) => label !== 'current'), 'checkpoint', 'current'];
        return { ...set, commits };
      }),
    );
  }, [setIndex]);

  const saveAs = useCallback(() => {
    const source = sets[setIndex]!;
    const copy: SetSummary = {
      ...source,
      id: `${source.id}-copy-${Date.now()}`,
      name: `${source.name} copy`,
      commits: ['save as', 'current'],
      lastPushedToDevice: false,
    };
    setSets((prev) => [...prev, copy]);
    setSetIndex(sets.length);
  }, [setIndex, sets]);

  return {
    sets,
    setIndex,
    activeSet,
    activeSetName: activeSet.name,
    historyOpen,
    pickerOpen,
    pushSlabOpen,
    selectSet,
    prevSet,
    nextSet,
    setHistoryOpen,
    setPickerOpen,
    setPushSlabOpen,
    commit,
    saveAs,
  };
}
