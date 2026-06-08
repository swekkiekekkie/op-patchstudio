import { useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { useDeviceCache } from '../cache/useDeviceCache';
import { useSyncCockpit } from '../hooks/useSyncCockpit';
import { useSetLibrary } from '../hooks/useSetLibrary';
import { useProjectLibrary } from '../hooks/useProjectLibrary';
import { AppShellProvider, useAppShell } from '../navigation/AppShellContext';
import { useNavigation } from '../navigation/useNavigation';
import { DrumTool } from '../components/drum/DrumTool';
import { MultisampleTool } from '../components/multisample/MultisampleTool';
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

  const editorTab =
    appState.cacheSource &&
    (appState.currentTab === 'drum' || appState.currentTab === 'multisample')
      ? appState.currentTab
      : null;

  useEffect(() => {
    if (
      !appState.cacheSource &&
      (appState.currentTab === 'drum' || appState.currentTab === 'multisample')
    ) {
      dispatch({ type: 'SET_TAB', payload: 'device' });
    }
  }, [appState.cacheSource, appState.currentTab, dispatch]);

  useEffect(() => {
    document.body.classList.toggle('shell-active', editorTab === null);
    return () => document.body.classList.remove('shell-active');
  }, [editorTab]);

  if (editorTab === 'drum') {
    return (
      <div className="editor-overlay">
        <DrumTool />
      </div>
    );
  }

  if (editorTab === 'multisample') {
    return (
      <div className="editor-overlay">
        <MultisampleTool />
      </div>
    );
  }

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
