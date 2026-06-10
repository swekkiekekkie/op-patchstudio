import type { StorageBarModel, StorageUsage } from '../types/sync';
import { DEVICE_CAPACITY_GB } from '../types/sync';

export function buildStorageBar(usage: StorageUsage, capacityGb = DEVICE_CAPACITY_GB): StorageBarModel {
  const usedGb = usage.presets + usage.samples + usage.projects + usage.other;
  const freeGb = Math.max(0, capacityGb - usedGb);
  const pct = (value: number) => (value / capacityGb) * 100;

  return {
    usedGb,
    freeGb,
    segments: [
      { key: 'presets', widthPct: pct(usage.presets) },
      { key: 'samples', widthPct: pct(usage.samples) },
      { key: 'projects', widthPct: pct(usage.projects) },
      { key: 'other', widthPct: pct(usage.other) },
      { key: 'free', widthPct: pct(freeGb) },
    ],
  };
}
