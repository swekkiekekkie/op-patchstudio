import { useEffect, useState } from 'react';
import { MOCK_PROJECT_ARRANGEMENTS } from '../data/mockProjects';
import type { ProjectArrangement } from '../../types/sync';

export const INST_TRACK_COUNT = 8;
export const PATTERN_CELL_H = 36;

export function laneGrey(trackNum: number): string {
  const tones = [0.32, 0.4, 0.48, 0.56, 0.64, 0.72, 0.8, 0.88];
  const t = tones[trackNum - 1] ?? 0.5;
  const g = Math.round(t * 255);
  return `rgb(${g},${g},${g})`;
}

export function stackOffsetFor(viewportH: number, activePat: number): number {
  const activeIdx = activePat - 1;
  return viewportH / 2 - PATTERN_CELL_H / 2 - activeIdx * PATTERN_CELL_H;
}

function fallbackArrangement(filename: string): ProjectArrangement {
  return {
    filename,
    tempo: 120,
    sceneCount: 1,
    refs: { total: 0, missing: 0 },
    tracks: Object.fromEntries(
      Array.from({ length: INST_TRACK_COUNT }, (_, i) => [
        i + 1,
        { patterns: { 1: { preset: '—' } } },
      ]),
    ),
    scenes: [Object.fromEntries(Array.from({ length: INST_TRACK_COUNT }, (_, i) => [i + 1, 1]))],
    sampleRefs: [],
  };
}

function cloneArrangement(source: ProjectArrangement): ProjectArrangement {
  return {
    ...source,
    tracks: Object.fromEntries(
      Object.entries(source.tracks).map(([track, data]) => [
        Number(track),
        { patterns: { ...data.patterns } },
      ]),
    ),
    scenes: source.scenes.map((scene) => ({ ...scene })),
    sampleRefs: [...source.sampleRefs],
  };
}

export type ProjectArrangeState = ReturnType<typeof useProjectArrange>;

export function useProjectArrange(projectId: string | null | undefined) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [selectedTrack, setSelectedTrack] = useState<number | null>(null);
  const [focusedPattern, setFocusedPattern] = useState<{ track: number; pattern: number } | null>(null);
  const [arrangement, setArrangement] = useState<ProjectArrangement | null>(null);

  useEffect(() => {
    if (!projectId) {
      setArrangement(null);
      setSceneIndex(0);
      setSelectedTrack(null);
      setFocusedPattern(null);
      return;
    }
    const base = MOCK_PROJECT_ARRANGEMENTS[projectId] ?? fallbackArrangement(projectId);
    setArrangement(cloneArrangement(base));
    setSceneIndex(0);
    setSelectedTrack(null);
    setFocusedPattern(null);
  }, [projectId]);

  const scene = arrangement?.scenes[sceneIndex] ?? null;

  const prevScene = () => {
    if (!arrangement) return;
    setSceneIndex((index) => Math.max(0, index - 1));
  };

  const nextScene = () => {
    if (!arrangement) return;
    setSceneIndex((index) => Math.min(arrangement.sceneCount - 1, index + 1));
  };

  const selectTrack = (trackNum: number) => {
    setSelectedTrack(trackNum);
  };

  const assignScenePattern = (trackNum: number, patternNum: number) => {
    if (!arrangement || !scene) return;
    if (!arrangement.tracks[trackNum]?.patterns[patternNum]) return;
    scene[trackNum] = patternNum;
    setArrangement({ ...arrangement, scenes: [...arrangement.scenes] });
    setSelectedTrack(trackNum);
    setFocusedPattern({ track: trackNum, pattern: patternNum });
  };

  return {
    arrangement,
    scene,
    sceneIndex,
    selectedTrack,
    focusedPattern,
    prevScene,
    nextScene,
    selectTrack,
    assignScenePattern,
  };
}
