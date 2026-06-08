// @vitest-environment jsdom

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import type { ReactNode } from 'react';
import { AppShellProvider, useAppShell } from '../../navigation/AppShellContext';

function wrapper({ children }: { children: ReactNode }) {
  return <AppShellProvider>{children}</AppShellProvider>;
}

describe('AppShellContext', () => {
  it('default mode is data', () => {
    const { result } = renderHook(() => useAppShell(), { wrapper });

    expect(result.current.state.mode).toBe('data');
    expect(result.current.state.presetPath).toBeUndefined();
    expect(result.current.state.sampleFilename).toBeUndefined();
    expect(result.current.state.projectFilename).toBeUndefined();
  });

  it('navigate changes mode', () => {
    const { result } = renderHook(() => useAppShell(), { wrapper });

    act(() => {
      result.current.navigate({ mode: 'projects' });
    });
    expect(result.current.state.mode).toBe('projects');

    act(() => {
      result.current.navigate({ mode: 'samples' });
    });
    expect(result.current.state.mode).toBe('samples');
  });

  it('navigate to presets with path sets presetPath', () => {
    const { result } = renderHook(() => useAppShell(), { wrapper });

    act(() => {
      result.current.navigate({ mode: 'presets', presetPath: 'drums/kick.preset' });
    });

    expect(result.current.state.mode).toBe('presets');
    expect(result.current.state.presetPath).toBe('drums/kick.preset');
  });

  it('cross-mode navigation preserves mode-specific selection', () => {
    const { result } = renderHook(() => useAppShell(), { wrapper });

    act(() => {
      result.current.navigate({ mode: 'presets', presetPath: 'bass/synth.preset' });
    });
    act(() => {
      result.current.navigate({ mode: 'samples', sampleFilename: 'lead.wav' });
    });
    act(() => {
      result.current.navigate({ mode: 'projects', projectFilename: 'jam.opxy' });
    });
    act(() => {
      result.current.navigate({ mode: 'data' });
    });

    expect(result.current.state.presetPath).toBe('bass/synth.preset');
    expect(result.current.state.sampleFilename).toBe('lead.wav');
    expect(result.current.state.projectFilename).toBe('jam.opxy');

    act(() => {
      result.current.navigate({ mode: 'presets' });
    });
    expect(result.current.state.mode).toBe('presets');
    expect(result.current.state.presetPath).toBe('bass/synth.preset');

    act(() => {
      result.current.navigate({ mode: 'samples' });
    });
    expect(result.current.state.sampleFilename).toBe('lead.wav');
  });
});
