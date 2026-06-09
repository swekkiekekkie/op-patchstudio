import { useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { useDeviceCache } from '../cache/useDeviceCache';
import { useSyncCockpit } from '../hooks/useSyncCockpit';
import { useSetLibrary } from '../hooks/useSetLibrary';
import { useProjectLibrary } from '../hooks/useProjectLibrary';
import { AppShellProvider, useAppShell } from '../navigation/AppShellContext';
import { useNavigation } from '../navigation/useNavigation';
import { NotificationSystem } from '../components/common/NotificationSystem';
import { useShellModes } from '../modes/ShellContent';
import { AppShell } from './AppShell';

function ShellAppInner() {
  const { state: appState, dispatch } = useAppContext();
  const cache = useDeviceCache();
  const sync = useSyncCockpit(cache);
  const setLibrary = useSetLibrary(sync);
  const projectLibrary = useProjectLibrary(cache.projects);
  const { state: shellState } = useAppShell();
  const { goToData, goToProjects, goToPresets, goToSamples } = useNavigation();
  const modes = useShellModes({ cache, sync, setLibrary, projectLibrary });

  const meta = useMemo(() => {
    const parts: string[] = [setLibrary.activeSetName];
    if (sync.lastPullAt) {
      parts.push(`sync ${new Date(sync.lastPullAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    }
    if (sync.dirtyCount > 0) {
      parts.push(`${sync.dirtyCount} dirty`);
    }
    return parts.join(' · ');
  }, [setLibrary.activeSetName, sync.lastPullAt, sync.dirtyCount]);

  const onModeChange = (mode: typeof shellState.mode) => {
    switch (mode) {
      case 'data':
        goToData();
        break;
      case 'projects':
        goToProjects();
        break;
      case 'presets':
        goToPresets();
        break;
      case 'samples':
        goToSamples();
        break;
    }
  };

  useEffect(() => {
    document.body.classList.add('shell-active');
    return () => document.body.classList.remove('shell-active');
  }, []);

  return (
    <>
      <AppShell
        connected={sync.connected}
        meta={meta}
        mode={shellState.mode}
        onModeChange={onModeChange}
        modes={modes}
      />
      <NotificationSystem
        notifications={appState.notifications}
        onDismiss={(id) => dispatch({ type: 'REMOVE_NOTIFICATION', payload: id })}
      />
    </>
  );
}

export function ShellApp() {
  return (
    <AppShellProvider>
      <ShellAppInner />
    </AppShellProvider>
  );
}
