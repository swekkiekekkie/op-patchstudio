import { useMemo } from 'react';

import type { ReactNode } from 'react';

import type { AppMode } from '../types/navigation';

import { useDeviceCache } from '../cache/useDeviceCache';

import { useSyncCockpit } from '../hooks/useSyncCockpit';

import { useSetLibrary } from '../hooks/useSetLibrary';

import { useProjectLibrary } from '../hooks/useProjectLibrary';

import { useAppShell } from '../navigation/AppShellContext';

import { useNavigation } from '../navigation/useNavigation';

import { DataMode } from './data/DataMode';

import { ModeScreen } from '../ui';

import { ProjectsMode } from './projects/ProjectsMode';

import { PresetsMode } from './presets/PresetsMode';

import { SamplesMode } from './samples/SamplesMode';



type DeviceCache = ReturnType<typeof useDeviceCache>;

type SyncCockpit = ReturnType<typeof useSyncCockpit>;

type SetLibrary = ReturnType<typeof useSetLibrary>;

type ProjectLibrary = ReturnType<typeof useProjectLibrary>;



interface ShellModeInputs {

  cache: DeviceCache;

  sync: SyncCockpit;

  setLibrary: SetLibrary;

  projectLibrary: ProjectLibrary;

}



export function useShellModes({ cache, sync, setLibrary, projectLibrary }: ShellModeInputs): Record<AppMode, ReactNode> {

  const { state: shellState } = useAppShell();

  useNavigation();



  const {

    presets,

    standaloneSamples,

    dirtyPresets,

    busy,

    refresh,

  } = cache;



  const cacheReady = (sync.status?.presetCount ?? 0) > 0 || (sync.status?.sampleCount ?? 0) > 0;



  return useMemo(

    () => ({

      data: <DataMode sync={sync} library={setLibrary} />,

      projects: <ProjectsMode library={projectLibrary} />,

      presets: cacheReady ? (

        <PresetsMode

          presets={presets}

          dirtyPresets={dirtyPresets}

          busy={busy}

          onRenamed={refresh}

        />

      ) : (

        <ModeScreen>

          <p style={{ opacity: 0.45 }}>pull from device to browse presets.</p>

        </ModeScreen>

      ),

      samples: (

        <SamplesMode samples={standaloneSamples} busy={busy} onRefresh={refresh} />

      ),

    }),

    [

      sync,

      setLibrary,

      projectLibrary,

      refresh,

      cacheReady,

      presets,

      dirtyPresets,

      busy,

      standaloneSamples,

      shellState.projectFilename,

      shellState.sampleFilename,

      shellState.presetPath,

    ],

  );

}


