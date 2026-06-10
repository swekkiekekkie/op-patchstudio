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

    sourceFolders,

    sourceSamples,

    sourcePresets,

    dirtyPresets,

    busy,

    refresh,

    addSourceFolder,

    removeSourceFolder,

    scanSourceFolders,

    copySourceSamplesToSet,

    copySourcePresetsToSet,

  } = cache;



  const cacheReady = (sync.status?.presetCount ?? 0) > 0 || (sync.status?.sampleCount ?? 0) > 0;



  return useMemo(

    () => ({

      data: <DataMode sync={sync} library={setLibrary} />,

      projects: <ProjectsMode library={projectLibrary} presets={presets} />,

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

        <SamplesMode
          samples={standaloneSamples}
          sourceFolders={sourceFolders}
          sourceSamples={sourceSamples}
          sourcePresets={sourcePresets}
          busy={busy}
          onRefresh={refresh}
          onAddSourceFolder={addSourceFolder}
          onRemoveSourceFolder={removeSourceFolder}
          onScanSourceFolders={scanSourceFolders}
          onCopySourceSamplesToSet={copySourceSamplesToSet}
          onCopySourcePresetsToSet={copySourcePresetsToSet}
        />

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

      sourceFolders,

      sourceSamples,

      sourcePresets,

      addSourceFolder,

      removeSourceFolder,

      scanSourceFolders,

      copySourceSamplesToSet,

      copySourcePresetsToSet,

      shellState.projectFilename,

      shellState.sampleFilename,

      shellState.presetPath,

      shellState.presetSearchQuery,

    ],

  );

}


