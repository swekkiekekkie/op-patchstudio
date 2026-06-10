import { useEffect, useState } from 'react';
import { MOCK_PROJECT_ARRANGEMENTS } from '../data/mockProjects';
import type {
  ProjectArrangement,
  ProjectInspection,
  ProjectPresetFolderKind,
  ProjectListItem,
  ProjectPatternCell,
  ProjectTrackData,
} from '../types/sync';

export const INST_TRACK_COUNT = 8;
export const PATTERN_CONFIG_COUNT = 9;
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

function presetNameFromFolder(folder: string): string {
  return folder.replace(/\.preset$/i, '').split('/').filter(Boolean).pop() || folder;
}

function arrangementFromInspection(filename: string, inspection: ProjectInspection): ProjectArrangement {
  const tracks: Record<number, ProjectTrackData> = Object.fromEntries(
    Array.from({ length: INST_TRACK_COUNT }, (_, i) => {
      const trackNumber = i + 1;
      const inspected = inspection.tracks.find((track) => track.trackNumber === trackNumber);
      const sourcePatterns =
        inspected?.patterns.length
          ? inspected.patterns
          : [{ patternNumber: 1, active: false, inferredPresetFolders: [] }];
      const patterns: Record<number, ProjectPatternCell> = Object.fromEntries(
        sourcePatterns.map((pattern) => {
          const refs = pattern.presetRefs ?? pattern.inferredPresetFolders ?? [];
          const primary = refs[0];
          const kind: ProjectPatternCell['kind'] =
            primary?.confidence === 'strong' ? 'named' : primary ? 'custom' : undefined;
          return [
            pattern.patternNumber,
            {
              preset: primary ? presetNameFromFolder(primary.folder) : pattern.active ? '?' : '-',
              kind,
              refKind: primary?.kind,
              confidence: primary?.confidence,
            },
          ];
        }),
      );

      return [trackNumber, { patterns }];
    }),
  );

  return {
    filename,
    tempo: 120,
    sceneCount: 1,
    refs: { total: 0, missing: 0 },
    tracks,
    scenes: [Object.fromEntries(Array.from({ length: INST_TRACK_COUNT }, (_, i) => [i + 1, 1]))],
    sampleRefs: inspection.warnings.map((warning) => ({
      filename: warning,
      status: 'missing',
    })),
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

function countDraftCells(arrangement: ProjectArrangement | null): number {
  if (!arrangement) return 0;
  return Object.values(arrangement.tracks).reduce(
    (total, track) => total + Object.values(track.patterns).filter((cell) => cell.draft).length,
    0,
  );
}

function presetTypeToProjectKind(type: string | undefined, category?: string): ProjectPresetFolderKind {
  if (type === 'drum') return 'drum';
  if (type === 'sampler') return 'sampler';
  if (type === 'multisampler') return 'sample';
  if (type === 'multi') return 'multi';
  if (category === 'drum') return 'drum';
  if (category === 'sample' || category === 'sampler') return 'sampler';
  if (type) return 'synth';
  return 'unknown';
}

function isPatternConfigNumber(patternNum: number): boolean {
  return Number.isInteger(patternNum) && patternNum >= 1 && patternNum <= PATTERN_CONFIG_COUNT;
}

function emptyDraftPattern(): ProjectPatternCell {
  return {
    preset: '-',
    draft: true,
  };
}

export type ProjectArrangeState = ReturnType<typeof useProjectArrange>;

export function useProjectArrange(
  projectId: string | null | undefined,
  project?: ProjectListItem | null,
) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [selectedTrack, setSelectedTrack] = useState<number | null>(null);
  const [focusedPattern, setFocusedPattern] = useState<{ track: number; pattern: number } | null>(null);
  const [arrangement, setArrangement] = useState<ProjectArrangement | null>(null);
  const [cleanArrangement, setCleanArrangement] = useState<ProjectArrangement | null>(null);
  const [draftSceneIndexes, setDraftSceneIndexes] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    if (!projectId) {
      setArrangement(null);
      setCleanArrangement(null);
      setSceneIndex(0);
      setSelectedTrack(null);
      setFocusedPattern(null);
      setDraftSceneIndexes(new Set());
      return;
    }
    const base = project?.inspection
      ? arrangementFromInspection(project.name, project.inspection)
      : MOCK_PROJECT_ARRANGEMENTS[projectId] ?? fallbackArrangement(projectId);
    setCleanArrangement(cloneArrangement(base));
    setArrangement(cloneArrangement(base));
    setSceneIndex(0);
    setSelectedTrack(null);
    setFocusedPattern(null);
    setDraftSceneIndexes(new Set());
  }, [project, projectId]);

  const scene = arrangement?.scenes[sceneIndex] ?? null;

  const prevScene = () => {
    if (!arrangement) return;
    setSceneIndex((index) => Math.max(0, index - 1));
  };

  const nextScene = () => {
    if (!arrangement) return;
    setSceneIndex((index) => Math.min(arrangement.sceneCount - 1, index + 1));
  };

  const duplicateScene = () => {
    if (!arrangement || !scene) return;
    const insertIndex = sceneIndex + 1;
    const scenes = [
      ...arrangement.scenes.slice(0, insertIndex),
      { ...scene },
      ...arrangement.scenes.slice(insertIndex),
    ];
    setArrangement({
      ...arrangement,
      sceneCount: scenes.length,
      scenes,
    });
    setDraftSceneIndexes((indexes) => {
      const next = new Set<number>();
      for (const index of indexes) next.add(index >= insertIndex ? index + 1 : index);
      next.add(insertIndex);
      return next;
    });
    setSceneIndex(insertIndex);
    setSelectedTrack(null);
    setFocusedPattern(null);
  };

  const selectTrack = (trackNum: number) => {
    if (!arrangement) return;
    const patternNum = scene?.[trackNum] || 1;
    setSelectedTrack(trackNum);
    setFocusedPattern({ track: trackNum, pattern: patternNum });
  };

  const focusPattern = (trackNum: number, patternNum: number) => {
    if (!arrangement) return;
    if (!arrangement.tracks[trackNum]?.patterns[patternNum] && !isPatternConfigNumber(patternNum)) return;
    setSelectedTrack(trackNum);
    setFocusedPattern({ track: trackNum, pattern: patternNum });
  };

  const assignScenePattern = (trackNum: number, patternNum: number) => {
    if (!arrangement || !scene) return;
    if (!isPatternConfigNumber(patternNum)) return;
    const track = arrangement.tracks[trackNum] ?? { patterns: {} };
    const patterns = track.patterns[patternNum]
      ? track.patterns
      : { ...track.patterns, [patternNum]: emptyDraftPattern() };

    const scenes = arrangement.scenes.map((item, index) =>
      index === sceneIndex ? { ...item, [trackNum]: patternNum } : item,
    );
    if ((scene[trackNum] || 1) !== patternNum) {
      setDraftSceneIndexes((indexes) => new Set(indexes).add(sceneIndex));
    }
    setArrangement({
      ...arrangement,
      tracks: {
        ...arrangement.tracks,
        [trackNum]: {
          ...track,
          patterns,
        },
      },
      scenes,
    });
    setSelectedTrack(trackNum);
    setFocusedPattern({ track: trackNum, pattern: patternNum });
  };

  const assignPatternPreset = (trackNum: number, patternNum: number, preset: { name: string; path?: string; type?: string; category?: string }) => {
    if (!arrangement) return;
    if (!isPatternConfigNumber(patternNum)) return;
    const track = arrangement.tracks[trackNum] ?? { patterns: {} };
    const cell = track.patterns[patternNum] ?? emptyDraftPattern();

    setArrangement({
      ...arrangement,
      tracks: {
        ...arrangement.tracks,
        [trackNum]: {
          ...track,
          patterns: {
            ...track.patterns,
            [patternNum]: {
              ...cell,
              preset: preset.name,
              presetPath: preset.path,
              kind: 'named',
              refKind: presetTypeToProjectKind(preset.type, preset.category),
              confidence: 'strong',
              draft: true,
            },
          },
        },
      },
    });
    setSelectedTrack(trackNum);
    setFocusedPattern({ track: trackNum, pattern: patternNum });
  };

  const draftCellCount = countDraftCells(arrangement);
  const draftSceneCount = draftSceneIndexes.size;

  const discardDrafts = () => {
    if (!cleanArrangement) return;
    setArrangement(cloneArrangement(cleanArrangement));
    setDraftSceneIndexes(new Set());
    setSceneIndex((index) => Math.min(index, Math.max(0, cleanArrangement.sceneCount - 1)));
    setSelectedTrack(null);
    setFocusedPattern(null);
  };

  return {
    arrangement,
    scene,
    sceneIndex,
    selectedTrack,
    focusedPattern,
    draftCellCount,
    draftSceneCount,
    draftCount: draftCellCount + draftSceneCount,
    canWriteProject: false,
    prevScene,
    nextScene,
    duplicateScene,
    selectTrack,
    focusPattern,
    assignScenePattern,
    assignPatternPreset,
    discardDrafts,
  };
}
