// @vitest-environment jsdom

import { renderHook, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';
import { AppShellProvider, useAppShell } from '../../navigation/AppShellContext';
import { useNavigation } from '../../navigation/useNavigation';

function wrapper({ children }: { children: ReactNode }) {
  return <AppShellProvider>{children}</AppShellProvider>;
}

function useNavigationProbe() {
  return {
    shell: useAppShell(),
    nav: useNavigation(),
  };
}

describe('useNavigation', () => {
  it('opens a project-driven preset search', () => {
    const { result } = renderHook(() => useNavigationProbe(), { wrapper });

    act(() => {
      result.current.nav.openPresetSearch('low choir');
    });

    expect(result.current.shell.state.mode).toBe('presets');
    expect(result.current.shell.state.presetPath).toBeNull();
    expect(result.current.shell.state.presetSearchQuery).toBe('low choir');
  });

  it('clears project-driven preset search on normal presets tab entry', () => {
    const { result } = renderHook(() => useNavigationProbe(), { wrapper });

    act(() => {
      result.current.nav.openPresetSearch('low choir');
    });
    act(() => {
      result.current.nav.goToProjects();
    });
    act(() => {
      result.current.nav.goToPresets();
    });

    expect(result.current.shell.state.mode).toBe('presets');
    expect(result.current.shell.state.presetSearchQuery).toBeNull();
  });
});
