import { useLayoutEffect, useRef, useState } from 'react';
import {
  INST_TRACK_COUNT,
  PATTERN_CONFIG_COUNT,
  laneGrey,
  stackOffsetFor,
  type ProjectArrangeState,
} from '../../hooks/useProjectArrange';
import { formatPatternPresetLabel } from '../../utils/projectPatternLabel';
import type { ProjectPatternCell } from '../../types/sync';
import { ArrangeToolbar } from './projectParts';
import { useNavigation } from '../../navigation/useNavigation';
import type { CachePresetEntry } from '../../types/opxy';

interface ArrangeGridProps {
  arrange: ProjectArrangeState;
}

function patternNumbers(trackData: { patterns: Record<number, ProjectPatternCell> } | undefined): number[] {
  const parsed = Object.keys(trackData?.patterns ?? {})
    .map(Number)
    .sort((a, b) => a - b);
  return [...new Set([...Array.from({ length: PATTERN_CONFIG_COUNT }, (_, index) => index + 1), ...parsed])]
    .sort((a, b) => a - b);
}

function presetMeta(cell: ProjectPatternCell | undefined): string {
  const bits = [cell?.refKind, cell?.confidence].filter(Boolean);
  return bits.length > 0 ? bits.join(' · ') : 'unresolved';
}

export function ArrangeGrid({ arrange }: ArrangeGridProps) {
  const { arrangement, scene, selectedTrack, focusedPattern } = arrange;
  const viewportRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [offsets, setOffsets] = useState<Record<number, number>>({});

  useLayoutEffect(() => {
    if (!arrangement || !scene) return;
    const next: Record<number, number> = {};
    for (let track = 1; track <= INST_TRACK_COUNT; track += 1) {
      const viewport = viewportRefs.current[track];
      if (!viewport) continue;
      const activePat = scene[track] || 1;
      next[track] = stackOffsetFor(viewport.clientHeight || 144, activePat);
    }
    setOffsets(next);
  }, [arrangement, scene, arrange.sceneIndex, selectedTrack]);

  if (!arrangement || !scene) return null;

  return (
    <div className="arrange-grid">
      {Array.from({ length: INST_TRACK_COUNT }, (_, index) => {
        const trackNum = index + 1;
        const trackData = arrangement.tracks[trackNum];
        const patterns = patternNumbers(trackData);
        const activePat = scene[trackNum] || 1;
        const selected = selectedTrack === trackNum;
        const activeCell = trackData?.patterns[activePat];
        const activePresetLabel = formatPatternPresetLabel(activeCell);

        return (
          <div
            key={trackNum}
            className={`arrange-col${selected ? ' selected' : ''}`}
            style={selected ? undefined : { ['--lane-bg' as string]: laneGrey(trackNum) }}
            onClick={() => arrange.selectTrack(trackNum)}
          >
            <div className="pattern-lane">
              <div
                className="pattern-stack-viewport"
                ref={(node) => {
                  viewportRefs.current[trackNum] = node;
                }}
              >
                <div
                  className="pattern-stack"
                  style={{ transform: `translateY(${offsets[trackNum] ?? 0}px)` }}
                >
                  {patterns.map((patternNum) => {
                    const focused =
                      focusedPattern?.track === trackNum && focusedPattern.pattern === patternNum;
                    const sceneActive = patternNum === activePat;
                    const cell = trackData?.patterns[patternNum];
                    const presetLabel = formatPatternPresetLabel(cell);
                    const presetScrolls = selected && sceneActive;
                    const confidence = cell?.confidence ?? 'none';
                    const refKind = cell?.refKind ?? 'unknown';

                    return (
                      <button
                        key={patternNum}
                        type="button"
                        className={`pattern-cell confidence-${confidence} kind-${refKind}${sceneActive ? ' scene-active' : ''}${focused ? ' focused' : ''}${cell?.draft ? ' draft' : ''}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          arrange.assignScenePattern(trackNum, patternNum);
                        }}
                        aria-label={`assign track ${trackNum} pattern config ${patternNum} to current scene; preset ${presetLabel}; ${presetMeta(cell)}`}
                        title={`${presetLabel} · ${presetMeta(cell)}`}
                      >
                        <span className="pattern-cell__idx">{patternNum}</span>
                        <span className={`pattern-cell__preset${presetScrolls ? ' scrolls' : ''}`}>
                          {presetLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <button
                type="button"
                className={`track-preset confidence-${activeCell?.confidence ?? 'none'} kind-${activeCell?.refKind ?? 'unknown'}`}
                onClick={(event) => {
                  event.stopPropagation();
                  arrange.selectTrack(trackNum);
                }}
                aria-label={`inspect track ${trackNum} active preset ${activePresetLabel}; ${presetMeta(activeCell)}`}
                title={`${activePresetLabel} · ${presetMeta(activeCell)}`}
              >
                {activePresetLabel}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface ScenePatternStripProps {
  arrange: ProjectArrangeState;
}

export function ScenePatternStrip({ arrange }: ScenePatternStripProps) {
  const { arrangement, scene, selectedTrack } = arrange;
  if (!arrangement || !scene) return null;

  return (
    <div className="scene-pattern-strip" aria-label="current scene pattern choices">
      {Array.from({ length: INST_TRACK_COUNT }, (_, index) => {
        const trackNum = index + 1;
        const patternNum = scene[trackNum] || 1;
        const cell = arrangement.tracks[trackNum]?.patterns[patternNum];
        const presetLabel = formatPatternPresetLabel(cell);
        const selected = selectedTrack === trackNum;

        return (
          <button
            key={trackNum}
            type="button"
            className={`scene-pattern-chip${selected ? ' selected' : ''}${cell?.draft ? ' draft' : ''}`}
            onClick={() => arrange.selectTrack(trackNum)}
            aria-label={`select track ${trackNum}; scene uses pattern config ${patternNum}; preset ${presetLabel}`}
            title={`t${trackNum} · p${patternNum} · ${presetLabel}`}
          >
            <span className="mono">t{trackNum}</span>
            <strong>p{patternNum}</strong>
            <span>{presetLabel}</span>
          </button>
        );
      })}
    </div>
  );
}

interface ArrangePaneProps {
  arrange: ProjectArrangeState;
  presets: CachePresetEntry[];
}

export function ArrangePane({ arrange, presets }: ArrangePaneProps) {
  const { arrangement, sceneIndex } = arrange;
  const { openPresetSearch } = useNavigation();

  if (!arrangement) return null;

  return (
    <div className="arrange-pane visible">
      <div className="arrange-head">
        <div>
          <span className="file-name">{arrangement.filename}</span>
          <span className="file-meta mono">
            {arrangement.tempo} bpm · {arrangement.sceneCount} scenes
            {arrange.draftCount > 0 ? ` · ${arrange.draftCount} draft` : ''}
            {arrange.draftSceneCount > 0 ? ` · ${arrange.draftSceneCount} scene` : ''}
          </span>
        </div>
        <div className="arrange-scene-nav">
          <button type="button" aria-label="previous scene" onClick={arrange.prevScene}>
            ◀
          </button>
          <button type="button" aria-label="duplicate current scene" onClick={arrange.duplicateScene}>
            +
          </button>
          <div className="scene-badge">
            <div className="scene-badge-inner">{sceneIndex + 1}</div>
          </div>
          <button type="button" aria-label="next scene" onClick={arrange.nextScene}>
            ▶
          </button>
          <span className="scene-count mono">
            {sceneIndex + 1} / {arrangement.sceneCount}
          </span>
        </div>
        <ScenePatternStrip arrange={arrange} />
      </div>

      <div className="arrange-grid-wrap">
        <ArrangeGrid arrange={arrange} />
      </div>

      <ArrangeToolbar arrange={arrange} presets={presets} onOpenPreset={openPresetSearch} />
    </div>
  );
}
