import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ArrangePane, ScenePatternStrip } from '../../modes/projects/ArrangePane';
import type { ProjectArrangeState } from '../../hooks/useProjectArrange';
import { AppShellProvider } from '../../navigation/AppShellContext';

function arrangeState(overrides: Partial<ProjectArrangeState> = {}): ProjectArrangeState {
  const base = {
    arrangement: {
      filename: 'probe.xy',
      tempo: 120,
      sceneCount: 1,
      refs: { total: 0, missing: 0 },
      tracks: Object.fromEntries(
        Array.from({ length: 8 }, (_, index) => [
          index + 1,
          {
            patterns: {
              1: { preset: `track-${index + 1}` },
              2: { preset: `alt-${index + 1}`, draft: index === 2 },
            },
          },
        ]),
      ),
      scenes: [{ 1: 1, 2: 1, 3: 2, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1 }],
      sampleRefs: [],
    },
    scene: { 1: 1, 2: 1, 3: 2, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1 },
    sceneIndex: 0,
    selectedTrack: 3,
    focusedPattern: { track: 3, pattern: 2 },
    draftCellCount: 1,
    draftSceneCount: 0,
    draftCount: 1,
    canWriteProject: false,
    prevScene: () => undefined,
    nextScene: () => undefined,
    duplicateScene: () => undefined,
    selectTrack: () => undefined,
    focusPattern: () => undefined,
    assignScenePattern: () => undefined,
    assignPatternPreset: () => undefined,
    discardDrafts: () => undefined,
  } satisfies ProjectArrangeState;

  return { ...base, ...overrides };
}

describe('ScenePatternStrip', () => {
  it('summarizes the current scene pattern choices and selects tracks', () => {
    const selectTrack = vi.fn();

    render(<ScenePatternStrip arrange={arrangeState({ selectTrack })} />);

    expect(screen.getByLabelText('current scene pattern choices')).toHaveTextContent('t3');
    expect(screen.getByLabelText('current scene pattern choices')).toHaveTextContent('p2');
    expect(screen.getByLabelText('current scene pattern choices')).toHaveTextContent('alt-3');

    fireEvent.click(screen.getByRole('button', { name: 'select track 3; scene uses pattern config 2; preset alt-3' }));

    expect(selectTrack).toHaveBeenCalledWith(3);
  });
});

describe('ArrangePane', () => {
  it('exposes scene duplication from the scene header', () => {
    const duplicateScene = vi.fn();

    render(
      <AppShellProvider>
        <ArrangePane arrange={arrangeState({ duplicateScene })} presets={[]} />
      </AppShellProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'duplicate current scene' }));

    expect(duplicateScene).toHaveBeenCalledOnce();
  });
});
