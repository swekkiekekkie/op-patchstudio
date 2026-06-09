import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useProjectArrange } from '../../hooks/useProjectArrange';

describe('useProjectArrange', () => {
  it('assigns a pattern config to the current scene', async () => {
    const { result } = renderHook(() => useProjectArrange('ambient sketch.xy'));

    await waitFor(() => {
      expect(result.current.arrangement?.filename).toBe('ambient sketch.xy');
    });

    expect(result.current.scene?.[3]).toBe(1);

    act(() => {
      result.current.assignScenePattern(3, 2);
    });

    expect(result.current.focusedPattern).toEqual({ track: 3, pattern: 2 });
    expect(result.current.selectedTrack).toBe(3);
    expect(result.current.scene?.[3]).toBe(2);
    expect(result.current.draftCellCount).toBe(0);
    expect(result.current.draftSceneCount).toBe(1);
    expect(result.current.draftCount).toBe(1);
  });

  it('creates draft pattern configs when assigning empty valid slots to a scene', async () => {
    const { result } = renderHook(() => useProjectArrange('ambient sketch.xy'));

    await waitFor(() => {
      expect(result.current.arrangement?.filename).toBe('ambient sketch.xy');
    });

    act(() => {
      result.current.assignScenePattern(3, 9);
    });

    expect(result.current.focusedPattern).toEqual({ track: 3, pattern: 9 });
    expect(result.current.selectedTrack).toBe(3);
    expect(result.current.scene?.[3]).toBe(9);
    expect(result.current.draftCellCount).toBe(1);
    expect(result.current.draftSceneCount).toBe(1);
    expect(result.current.draftCount).toBe(2);
    expect(result.current.arrangement?.tracks[3]?.patterns[9]).toMatchObject({
      preset: '-',
      draft: true,
    });
  });

  it('ignores assignments outside available pattern config slots', async () => {
    const { result } = renderHook(() => useProjectArrange('ambient sketch.xy'));

    await waitFor(() => {
      expect(result.current.arrangement?.filename).toBe('ambient sketch.xy');
    });

    act(() => {
      result.current.assignScenePattern(3, 10);
    });

    expect(result.current.focusedPattern).toBeNull();
    expect(result.current.selectedTrack).toBeNull();
    expect(result.current.scene?.[3]).toBe(1);
  });

  it('selects a track by focusing its scene-active pattern', async () => {
    const { result } = renderHook(() => useProjectArrange('ambient sketch.xy'));

    await waitFor(() => {
      expect(result.current.arrangement?.filename).toBe('ambient sketch.xy');
    });

    act(() => {
      result.current.nextScene();
    });

    act(() => {
      result.current.selectTrack(3);
    });

    expect(result.current.selectedTrack).toBe(3);
    expect(result.current.focusedPattern).toEqual({ track: 3, pattern: 2 });
  });

  it('maps project inspection preset refs into arrange cells', async () => {
    const project = {
      id: 'probe.xy',
      name: 'probe.xy',
      relativePath: 'projects/probe.xy',
      sceneCount: 1,
      inspection: {
        parseStatus: 'ok' as const,
        warnings: [],
        tracks: [
          {
            trackNumber: 1,
            patterns: [
              {
                patternNumber: 1,
                active: true,
                engineId: 0x16,
                engineName: 'axis',
                bodyLength: 8665,
                presetRefs: [
                  {
                    folder: 'nt-accord',
                    kind: 'synth' as const,
                    hitCount: 2,
                    confidence: 'medium' as const,
                  },
                ],
              },
            ],
          },
        ],
      },
    };

    const { result } = renderHook(() => useProjectArrange('probe.xy', project));

    await waitFor(() => {
      expect(result.current.arrangement?.filename).toBe('probe.xy');
    });

    expect(result.current.arrangement?.tracks[1]?.patterns[1]).toMatchObject({
      preset: 'nt-accord',
      kind: 'custom',
      refKind: 'synth',
      confidence: 'medium',
    });
  });

  it('assigns a draft preset to a selected pattern config', async () => {
    const { result } = renderHook(() => useProjectArrange('ambient sketch.xy'));

    await waitFor(() => {
      expect(result.current.arrangement?.filename).toBe('ambient sketch.xy');
    });

    act(() => {
      result.current.assignPatternPreset(3, 2, {
        name: 'nt-cuckoo kicks',
        path: 'presets/kicks/nt-cuckoo kicks.preset',
        type: 'drum',
        category: 'kicks',
      });
    });

    expect(result.current.focusedPattern).toEqual({ track: 3, pattern: 2 });
    expect(result.current.selectedTrack).toBe(3);
    expect(result.current.draftCellCount).toBe(1);
    expect(result.current.draftSceneCount).toBe(0);
    expect(result.current.draftCount).toBe(1);
    expect(result.current.canWriteProject).toBe(false);
    expect(result.current.arrangement?.tracks[3]?.patterns[2]).toMatchObject({
      preset: 'nt-cuckoo kicks',
      presetPath: 'presets/kicks/nt-cuckoo kicks.preset',
      kind: 'named',
      refKind: 'drum',
      confidence: 'strong',
      draft: true,
    });
  });

  it('assigns a draft preset to an empty pattern config slot', async () => {
    const { result } = renderHook(() => useProjectArrange('ambient sketch.xy'));

    await waitFor(() => {
      expect(result.current.arrangement?.filename).toBe('ambient sketch.xy');
    });

    act(() => {
      result.current.assignPatternPreset(4, 9, {
        name: 'nt-tall drink',
        path: 'presets/lead/nt-tall drink.preset',
        type: 'wavetable',
        category: 'lead',
      });
    });

    expect(result.current.focusedPattern).toEqual({ track: 4, pattern: 9 });
    expect(result.current.selectedTrack).toBe(4);
    expect(result.current.arrangement?.tracks[4]?.patterns[9]).toMatchObject({
      preset: 'nt-tall drink',
      presetPath: 'presets/lead/nt-tall drink.preset',
      refKind: 'synth',
      draft: true,
    });
  });

  it('discards local project drafts back to the loaded arrangement', async () => {
    const { result } = renderHook(() => useProjectArrange('ambient sketch.xy'));

    await waitFor(() => {
      expect(result.current.arrangement?.filename).toBe('ambient sketch.xy');
    });

    act(() => {
      result.current.assignScenePattern(3, 9);
    });

    act(() => {
      result.current.assignPatternPreset(4, 9, {
        name: 'nt-tall drink',
        path: 'presets/lead/nt-tall drink.preset',
        type: 'wavetable',
        category: 'lead',
      });
    });

    expect(result.current.draftCount).toBeGreaterThan(0);

    act(() => {
      result.current.discardDrafts();
    });

    expect(result.current.draftCellCount).toBe(0);
    expect(result.current.draftSceneCount).toBe(0);
    expect(result.current.draftCount).toBe(0);
    expect(result.current.scene?.[3]).toBe(1);
    expect(result.current.arrangement?.tracks[4]?.patterns[9]).toBeUndefined();
    expect(result.current.selectedTrack).toBeNull();
    expect(result.current.focusedPattern).toBeNull();
  });

  it('duplicates the current scene as a local draft', async () => {
    const { result } = renderHook(() => useProjectArrange('ambient sketch.xy'));

    await waitFor(() => {
      expect(result.current.arrangement?.filename).toBe('ambient sketch.xy');
    });

    act(() => {
      result.current.assignScenePattern(3, 2);
    });

    act(() => {
      result.current.duplicateScene();
    });

    expect(result.current.sceneIndex).toBe(1);
    expect(result.current.arrangement?.sceneCount).toBe(5);
    expect(result.current.arrangement?.scenes).toHaveLength(5);
    expect(result.current.scene?.[3]).toBe(2);
    expect(result.current.draftSceneCount).toBe(2);
    expect(result.current.draftCount).toBe(2);
    expect(result.current.selectedTrack).toBeNull();
    expect(result.current.focusedPattern).toBeNull();
  });
});
