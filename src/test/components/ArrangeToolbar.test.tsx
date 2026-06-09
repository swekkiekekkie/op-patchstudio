import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ArrangeToolbar } from '../../modes/projects/projectParts';
import type { ProjectArrangeState } from '../../hooks/useProjectArrange';

function arrangeState(overrides: Partial<ProjectArrangeState> = {}): ProjectArrangeState {
  const base = {
    arrangement: {
      filename: 'probe.xy',
      tempo: 120,
      sceneCount: 1,
      refs: { total: 0, missing: 0 },
      tracks: {
        1: {
          patterns: {
            1: {
              preset: 'nt-accord',
              kind: 'custom' as const,
              refKind: 'synth' as const,
              confidence: 'medium' as const,
            },
          },
        },
      },
      scenes: [{ 1: 1 }],
      sampleRefs: [],
    },
    scene: { 1: 1 },
    sceneIndex: 0,
    selectedTrack: 1,
    focusedPattern: { track: 1, pattern: 1 },
    draftCellCount: 0,
    draftSceneCount: 0,
    draftCount: 0,
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

describe('ArrangeToolbar', () => {
  it('summarizes the selected pattern config', () => {
    render(<ArrangeToolbar arrange={arrangeState()} />);

    expect(screen.getByLabelText('selected pattern config')).toHaveTextContent('t1 · p1');
    expect(screen.getByLabelText('selected pattern config')).toHaveTextContent('nt-accord');
    expect(screen.getByLabelText('selected pattern config')).toHaveTextContent('synth · medium');
    expect(screen.getByRole('button', { name: 'open preset from selected pattern config nt-accord' })).toBeEnabled();
  });

  it('shows an empty selection state', () => {
    render(<ArrangeToolbar arrange={arrangeState({ selectedTrack: null, focusedPattern: null })} />);

    expect(screen.getByLabelText('selected pattern config')).toHaveTextContent('no selection');
    expect(screen.getByLabelText('selected pattern config')).toHaveTextContent('select track');
    expect(screen.getByRole('button', { name: 'inspect selected pattern config no selection' })).toBeDisabled();
  });

  it('does not open the preset library for an empty draft slot', () => {
    render(
      <ArrangeToolbar
        arrange={arrangeState({
          arrangement: {
            ...arrangeState().arrangement!,
            tracks: {
              1: {
                patterns: {
                  9: { preset: '-', draft: true },
                },
              },
            },
          },
          scene: { 1: 9 },
          selectedTrack: 1,
          focusedPattern: { track: 1, pattern: 9 },
        })}
      />,
    );

    expect(screen.getByLabelText('selected pattern config')).toHaveTextContent('empty');
    expect(screen.getByRole('button', { name: 'open preset from selected pattern config empty' })).toBeDisabled();
  });

  it('requests preset library search for the selected preset', () => {
    const onOpenPreset = vi.fn();

    render(<ArrangeToolbar arrange={arrangeState()} onOpenPreset={onOpenPreset} />);
    fireEvent.click(screen.getByRole('button', { name: 'open preset from selected pattern config nt-accord' }));

    expect(onOpenPreset).toHaveBeenCalledWith('nt-accord');
  });

  it('assigns a preset option to the selected pattern config as a draft', () => {
    const assignPatternPreset = vi.fn();

    render(
      <ArrangeToolbar
        arrange={arrangeState({ assignPatternPreset })}
        presets={[
          {
            relativePath: 'presets/kicks/nt-cuckoo kicks.preset',
            category: 'kicks',
            name: 'nt-cuckoo kicks',
            type: 'drum',
            sampleBased: true,
            sampleCount: 24,
          },
        ]}
      />,
    );

    fireEvent.change(screen.getByRole('combobox', { name: 'assign preset to selected pattern config' }), {
      target: { value: 'presets/kicks/nt-cuckoo kicks.preset' },
    });

    expect(assignPatternPreset).toHaveBeenCalledWith(1, 1, {
      name: 'nt-cuckoo kicks',
      path: 'presets/kicks/nt-cuckoo kicks.preset',
      type: 'drum',
      category: 'kicks',
    });
  });

  it('filters assignable presets by category', () => {
    render(
      <ArrangeToolbar
        arrange={arrangeState()}
        presets={[
          {
            relativePath: 'presets/kicks/nt-cuckoo kicks.preset',
            category: 'kicks',
            name: 'nt-cuckoo kicks',
            type: 'drum',
            sampleBased: true,
            sampleCount: 24,
          },
          {
            relativePath: 'presets/bass/nt-accord.preset',
            category: 'bass',
            name: 'nt-accord',
            type: 'axis',
            sampleBased: false,
            sampleCount: 0,
          },
        ]}
      />,
    );

    fireEvent.change(screen.getByRole('combobox', { name: 'filter assignable presets by category' }), {
      target: { value: 'kicks' },
    });

    const presetSelect = screen.getByRole('combobox', { name: 'assign preset to selected pattern config' });
    expect(presetSelect).toHaveTextContent('kicks / nt-cuckoo kicks');
    expect(presetSelect).not.toHaveTextContent('bass / nt-accord');
  });

  it('shows project write status when composition drafts exist', () => {
    render(<ArrangeToolbar arrange={arrangeState({ draftCellCount: 1, draftSceneCount: 1, draftCount: 2, canWriteProject: false })} />);

    expect(screen.getByText('2 draft · xy write blocked')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'discard local project drafts' })).toBeEnabled();
  });

  it('shows project write status for scene-only drafts', () => {
    render(<ArrangeToolbar arrange={arrangeState({ draftSceneCount: 1, draftCount: 1, canWriteProject: false })} />);

    expect(screen.getByText('1 draft · xy write blocked')).toBeInTheDocument();
  });

  it('disables discarding when there are no local project drafts', () => {
    render(<ArrangeToolbar arrange={arrangeState()} />);

    expect(screen.getByRole('button', { name: 'discard local project drafts' })).toBeDisabled();
  });
});
