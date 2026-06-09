import type { SetLibrary } from '../../hooks/useSetLibrary';
import type { SyncCockpit } from '../../hooks/useSyncCockpit';
import { DevicePane } from './DevicePane';
import { SetsPane, TransferRow } from './SetsPane';

interface DataModeProps {
  sync: SyncCockpit;
  library: SetLibrary;
}

export function DataMode({ sync, library }: DataModeProps) {
  const handlePush = async () => {
    await sync.push();
  };

  return (
    <section className="screen screen-data">
      <div className="data-stack">
        <DevicePane sync={sync} />
        <TransferRow sync={sync} library={library} onConfirmPush={() => void handlePush()} />
        <SetsPane sync={sync} library={library} />
      </div>
    </section>
  );
}
