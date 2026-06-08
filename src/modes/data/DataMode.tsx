import type { SetLibrary } from '../../hooks/useSetLibrary';
import type { SyncCockpit } from '../../hooks/useSyncCockpit';
import { DEVICE_USAGE } from '../../data/mockSets';
import { DevicePane } from './DevicePane';
import { SetsPane, TransferRow } from './SetsPane';

interface DataModeProps {
  sync: SyncCockpit;
  library: SetLibrary;
}

export function DataMode({ sync, library }: DataModeProps) {
  const deviceUsage = sync.connected ? DEVICE_USAGE : null;

  const handlePush = async () => {
    await sync.push();
  };

  return (
    <section className="screen screen-data">
      <div className="data-stack">
        <DevicePane sync={sync} deviceUsage={deviceUsage} />
        <TransferRow sync={sync} library={library} onConfirmPush={() => void handlePush()} />
        <SetsPane sync={sync} library={library} />
      </div>
    </section>
  );
}
