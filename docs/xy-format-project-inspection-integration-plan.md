# XY Project Inspection Integration Plan

This plan turns the 2026-06-08 xy-format probe result into app functionality
without waiting for full `.xy` note-pattern decoding.

## Goal

The app should inspect OP-XY project files and show which preset folder is used
by each track/pattern. It should not expose note events or imply note editing.

## Parser Contract

Add a read-only project inspection layer that returns:

```ts
type XyProjectInspection = {
  fileName: string;
  parseStatus: "ok" | "partial" | "unsupported" | "error";
  tracks: XyTrackInspection[];
  warnings: string[];
};

type XyTrackInspection = {
  trackNumber: number;
  engineId?: number;
  engineName?: string;
  patterns: XyPatternInspection[];
};

type XyPatternInspection = {
  patternNumber: number;
  active: boolean;
  bodyLength?: number;
  presetRefs: XyPresetFolderHit[];
};

type XyPresetFolderHit = {
  folder: string;
  kind: "drum" | "synth" | "multi" | "sample" | "unknown";
  hitCount: number;
  confidence: "strong" | "medium" | "weak";
};
```

Confidence rules for the first pass:

- `strong`: one unique `/fat32/presets/drum/<name>` seed appears 24 times in
  an active drum body.
- `medium`: one unique preset folder seed appears more than once.
- `weak`: a single preset folder seed appears once, or multiple conflicting
  seeds appear.

## Implementation Stages

1. Vendor or port the byte-safe `xy.container` reader.
   Keep it read-only and round-trip preserving. The app should never rewrite
   `.xy` files through this path.

2. Implement logical entry extraction.
   Mirror `tools/corpus_lab.py` enough to split the 16 track blocks and Track
   16 overflow packing into `track/pattern` entries.

3. Add preset-folder scanning.
   Scan each active body for `/fat32/presets/<kind>/<name>` seeds and group
   them by unique folder. Do not try to decode note events here.
   Align this contract with `xy-format`'s `xy.project_inspection` module:
   `presetRefs` is the primary app field. Older `inferredPresetFolders`
   payloads may be read during migration but should not be extended.

4. Expose an Electron IPC endpoint.
   Suggested API: `inspectProjectFile(path): Promise<XyProjectInspection>`.
   Keep errors structured so the UI can show partial support without crashing.

5. Update the projects tab.
   Show a compact track/pattern matrix. Each cell should display the inferred
   preset name/folder, confidence, and unsupported state. The UI should make it
   clear that note patterns are intentionally not inspected.

6. Connect preset library matching.
   Match `/fat32/presets/drum/<name>` against the local set/library preset
   index. Mark missing library presets, duplicate names, and set-only presets.

7. Add tests.
   Use the A1-A4 P9 captures as fixtures and assert:
   - T1/T2/T3/T4 have nine active patterns in their respective files;
   - P1-P9 infer `pp` through `xx`;
   - each inferred drum body has 24 hits;
   - unsupported/missing parse cases return structured warnings.

## UI Notes

- This belongs in the renamed `projects` tab, not the `presets` tab.
- The first useful view is an inspection matrix: tracks vertically, patterns
  horizontally, preset names inside cells.
- Selecting a cell should open a detail strip with the project path, track,
  pattern, engine, inferred preset folder, confidence, and library/set match.
- Avoid waveform, note grid, or sequencer UI. This feature answers "what setup
  is this project using?" rather than "what notes are played?"

## Deliberately Deferred

- Writing or replacing project pattern presets.
- Note-event decode and display.
- Full sample path decode inside `.preset/...wav` references.
- Support guarantees for T5-T8 until equivalent captures exist.
