import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { NavigateOptions, NavigationState, PresetSubmode } from '../types/navigation';

interface AppShellContextValue {
  state: NavigationState;
  navigate: (opts: NavigateOptions) => void;
  setPresetSubmode: (sub: PresetSubmode) => void;
}

const AppShellContext = createContext<AppShellContextValue | null>(null);

const initialState: NavigationState = { mode: 'data' };

function mergeModeSelection<T>(
  optsValue: T | null | undefined,
  targetMode: boolean,
  previous: T | null | undefined,
): T | null | undefined {
  if (optsValue !== undefined) {
    return optsValue;
  }
  if (targetMode) {
    return previous;
  }
  return previous;
}

export function AppShellProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<NavigationState>(initialState);

  const navigate = useCallback((opts: NavigateOptions) => {
    setState((prev) => {
      const next: NavigationState = { mode: opts.mode };

      next.presetPath = mergeModeSelection(
        opts.presetPath,
        opts.mode === 'presets',
        prev.presetPath,
      );
      next.presetSearchQuery = mergeModeSelection(
        opts.presetSearchQuery,
        opts.mode === 'presets',
        prev.presetSearchQuery,
      );
      next.projectFilename = mergeModeSelection(
        opts.projectFilename,
        opts.mode === 'projects',
        prev.projectFilename,
      );
      next.sampleFilename = mergeModeSelection(
        opts.sampleFilename,
        opts.mode === 'samples',
        prev.sampleFilename,
      );

      if (opts.mode !== 'presets') {
        next.presetSubmode = undefined;
      } else if (opts.presetSubmode !== undefined) {
        next.presetSubmode = opts.presetSubmode;
      } else {
        next.presetSubmode = prev.presetSubmode;
      }

      return next;
    });
  }, []);

  const setPresetSubmode = useCallback((sub: PresetSubmode) => {
    setState((prev) => ({ ...prev, presetSubmode: sub }));
  }, []);

  const value = useMemo(
    () => ({ state, navigate, setPresetSubmode }),
    [state, navigate, setPresetSubmode],
  );

  return (
    <AppShellContext.Provider value={value}>
      {children}
    </AppShellContext.Provider>
  );
}

export function useAppShell() {
  const context = useContext(AppShellContext);
  if (!context) {
    throw new Error('useAppShell must be used within AppShellProvider');
  }
  return context;
}
