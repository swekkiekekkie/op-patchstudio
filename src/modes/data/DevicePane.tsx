import type { SyncCockpit } from '../../hooks/useSyncCockpit';
import { ConnectPcArt } from './ConnectPcArt';
import { InventoryPanel } from './dataParts';

interface DevicePaneProps {
  sync: SyncCockpit;
}

export function DevicePane({ sync }: DevicePaneProps) {
  const offline = !sync.connected;
  const showLive = sync.connected;

  return (
    <div className={`solid-block device-pane${offline ? ' offline' : ''}`}>
      <div className="solid-block__head pane-head">
        <span className="title">op–xy</span>
      </div>
      <div className="solid-block__body device-body">
        {showLive ? (
          <div className="device-live-inner">
            <InventoryPanel
              label="device inventory"
              stats={{
                presets: sync.presetCount,
                samples: sync.sampleCount,
                projects: sync.projectCount,
              }}
              rows={[
                ['source', sync.deviceName ?? 'op-xy over mtp'],
                ['sizes', 'unavailable over mtp'],
                ['last pull', sync.lastPullAt ?? 'not pulled this session'],
              ]}
            />
          </div>
        ) : null}
        <div className="device-offline-state" aria-hidden={!offline}>
          <ConnectPcArt />
          <p className="device-offline-hint">connect op–xy over usb</p>
          {sync.status?.error && offline ? (
            <p className="device-offline-hint" style={{ opacity: 0.35 }}>{sync.status.error}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
