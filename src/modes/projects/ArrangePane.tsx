import { useLayoutEffect, useRef, useState } from 'react';
import {
  INST_TRACK_COUNT,
  laneGrey,
  stackOffsetFor,
  type ProjectArrangeState,
} from '../../hooks/useProjectArrange';
import { formatPatternPresetLabel } from '../../utils/projectPatternLabel';
import type { ProjectPatternCell } from '../../types/sync';
import { ArrangeToolbar } from './projectParts';

interface ArrangeGridProps {
  arrange: ProjectArrangeState;
}

function patternNumbers(trackData: { patterns: Record<number, ProjectPatternCell> } | undefined): number[] {
  if (!trackData) return [1];
  return Object.keys(trackData.patterns)
    .map(Number)
    .sort((a, b) => a - b);
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

        return (
          <div
            key={trackNum}
            className={`arrange-col${selected ? ' selected' : ''}`}
            style={selected ? undefined : { ['--lane-bg' as string]: laneGrey(trackNum) }}
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
                    const presetLabel = formatPatternPresetLabel(trackData?.patterns[patternNum]);
                    const presetScrolls = selected && sceneActive;

                    return (
                      <button
                        key={patternNum}
                        type="button"
                        className={`pattern-cell${sceneActive ? ' scene-active' : ''}${focused ? ' focused' : ''}`}
                        onClick={() => arrange.assignScenePattern(trackNum, patternNum)}
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
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface ArrangePaneProps {
  arrange: ProjectArrangeState;
}

export function ArrangePane({ arrange }: ArrangePaneProps) {
  const { arrangement, sceneIndex } = arrange;

  if (!arrangement) return null;

  return (
    <div className="arrange-pane visible">
      <div className="arrange-head">
        <div>
          <span className="file-name">{arrangement.filename}</span>
          <span className="file-meta mono">
            {arrangement.tempo} bpm · {arrangement.sceneCount} scenes
          </span>
        </div>
        <div className="arrange-scene-nav">
          <button type="button" aria-label="previous scene" onClick={arrange.prevScene}>
            ◀
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
      </div>

      <div className="arrange-grid-wrap">
        <ArrangeGrid arrange={arrange} />
      </div>

      <ArrangeToolbar />
    </div>
  );
}
