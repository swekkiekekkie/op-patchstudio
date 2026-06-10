import { buildStorageBar } from '../../data/storageBar';
import type { SetStats, StorageUsage } from '../../types/sync';
import { DEVICE_CAPACITY_GB } from '../../types/sync';

interface StorageBlockProps {
  usage: StorageUsage;
  stats: SetStats;
  capacityGb?: number;
}

export function StorageBlock({ usage, stats, capacityGb = DEVICE_CAPACITY_GB }: StorageBlockProps) {
  const bar = buildStorageBar(usage, capacityGb);

  return (
    <>
      <div className="storage-block">
        <div className="storage-head">
          <span className="label">{capacityGb} gb</span>
          <span className="storage-total mono">
            {bar.usedGb.toFixed(1)} gb · {bar.freeGb.toFixed(1)} free
          </span>
        </div>
        <div className="stacked-bar">
          {bar.segments
            .filter((segment) => segment.key !== 'free' || segment.widthPct > 0.5)
            .map((segment) => (
              <div
                key={segment.key}
                className={`stack-seg ${segment.key}`}
                style={segment.key === 'free' ? undefined : { width: `${segment.widthPct}%` }}
              />
            ))}
        </div>
        <div className="storage-legend">
          <span className="l-presets">presets · {usage.presets} gb</span>
          <span className="l-samples">samples · {usage.samples} gb</span>
          <span className="l-projects">projects · {usage.projects} gb</span>
          <span className="l-other">other · {usage.other} gb</span>
          <span className="l-free">free · {bar.freeGb.toFixed(1)} gb</span>
        </div>
      </div>
      <div className="pane-stats">
        {stats.presets} presets<br />
        {stats.samples} samples<br />
        {stats.projects} projects
      </div>
    </>
  );
}

interface InventoryPanelProps {
  label: string;
  stats: SetStats;
  rows: Array<[label: string, value: string]>;
}

export function InventoryPanel({ label, stats, rows }: InventoryPanelProps) {
  return (
    <div className="inventory-panel" aria-label={label}>
      <div className="inventory-counts">
        <div>
          <span className="inventory-count mono">{stats.presets}</span>
          <span>presets</span>
        </div>
        <div>
          <span className="inventory-count mono">{stats.samples}</span>
          <span>samples</span>
        </div>
        <div>
          <span className="inventory-count mono">{stats.projects}</span>
          <span>projects</span>
        </div>
      </div>
      <div className="inventory-facts">
        {rows.map(([rowLabel, value]) => (
          <div key={rowLabel} className="inventory-fact">
            <span>{rowLabel}</span>
            <span className="mono">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export {
  ActionButton as DataButton,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '../../ui/ActionButton';

export function PullIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M12 5v12" />
      <path d="M8 13l4 4 4-4" />
    </svg>
  );
}

export function PushIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M12 19V7" />
      <path d="M8 11l4-4 4 4" />
    </svg>
  );
}

export function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M5 7h14M5 12h14M5 17h14" />
    </svg>
  );
}

export function CommitIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M12 3v12" />
      <path d="M8 11l4 4 4-4" />
      <path d="M5 21h14" />
    </svg>
  );
}

export function HistoryIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </svg>
  );
}

export function NewSetIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <rect x="5" y="5" width="14" height="14" />
      <path d="M12 9v6M9 12h6" />
    </svg>
  );
}

export function SaveAsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <rect x="5" y="5" width="14" height="14" />
      <path d="M9 5v5h6V5" />
      <path d="M12 14v4" />
    </svg>
  );
}
