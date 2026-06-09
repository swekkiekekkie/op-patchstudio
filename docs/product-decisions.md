# OP-XY MTP Manager - Product Decisions

**Status:** Draft decision record  
**Parent docs:** [product-requirements-and-flows.md](./product-requirements-and-flows.md), [mvp-screen-slices.md](./mvp-screen-slices.md), [compact-ui-ux-principles.md](./compact-ui-ux-principles.md)  
**Reference:** [reference_material/xy-format/docs/reference/opxy_limits.md](../reference_material/xy-format/docs/reference/opxy_limits.md), [reference_material/xy-format/docs/format/descriptor_encoding.md](../reference_material/xy-format/docs/format/descriptor_encoding.md), [reference_material/xy-format/docs/format/scenes_songs.md](../reference_material/xy-format/docs/format/scenes_songs.md)  
**Last updated:** 2026-06-08

---

## Purpose

This record captures product choices that should stay stable while the UI is still being shaped.

The app is currently an idea becoming a product. These decisions exist so implementation does not accidentally drift into a bigger, noisier desktop utility.

---

## Decision Summary

| ID | Decision | Product Impact |
|----|----------|----------------|
| D-1 | Local sets are the main workspace unit. | Device clutter is solved by swapping coherent local libraries, not by showing every possible file on the OP-XY. |
| D-2 | The OP-XY device is a push/pull target, not the live editing surface. | Editing happens locally first; device writes stay explicit and reviewable. |
| D-3 | Presets are the central creative object. | Drum kits and multisampler presets live inside presets mode, not as top-level tabs. |
| D-4 | Samples are the maintenance layer. | Samples mode is for inspection, cleanup, refs, and rename safety, not beat or kit design. |
| D-5 | Projects explain preset-config usage. | Projects mode shows which preset configs sit in track pattern slots; it does not edit notes. |
| D-6 | Scenes are arrangement choices over pattern configs. | Scenes can be inspected when decoded, but scene/song writing waits for stronger format confidence. |
| D-7 | Push preflight is a product surface. | Warnings, missing refs, rename impact, and overwrite risk are shown before device mutation. |
| D-8 | Compact layout beats completeness on one screen. | Related objects are reachable by deep link; they are not all shown together. |

---

## D-1 - Local Sets Are The Workspace Unit

Decision: A set is a named local OP-XY content library. The user can keep multiple sets and push one active set to the device.

Why:

- The core problem is avoiding on-device clutter while preserving a larger creative library on the computer.
- Sets let the user keep separate contexts, for example live, studio, genre, or experiment libraries.
- A set is easier to reason about than a global library plus ad hoc device sync state.

UX consequences:

- Active set identity appears in the shell.
- Data mode owns set switching, pull, push, commit/history, save-as, and first-run creation.
- Presets, samples, and projects are always scoped to the active set.
- Save-as creates a new set; it is the product's branching mechanism.

Do not:

- Treat the device cache as the only source of truth.
- Let every mode implement its own set picker.
- Show cross-set search in the MVP.

---

## D-2 - Device Writes Are Explicit

Decision: Edits change the active local set first. The OP-XY changes only through data mode pull/push flows.

Why:

- MTP writes are higher risk than local edits.
- The user needs confidence before overwriting a performance device.
- This keeps the mental model clean: local work now, hardware sync when ready.

UX consequences:

- Push action opens preflight when there are dirty changes, rename operations, missing refs, conflicts, or overwrite risk.
- Pull action is separate from set creation but can create the first set.
- Copy should avoid vague "sync" language when direction matters.

Do not:

- Auto-push after preset/sample edits.
- Use one bidirectional sync button.
- Hide destructive impact inside a toast or small warning badge.

---

## D-3 - Presets Are The Creative Center

Decision: Drum kits, multisampler presets, and read-only synth presets belong under presets mode.

Why:

- OP-XY work is organized around playable configurations.
- Sample cleanup supports preset construction; it is not the main creative object.
- Removing drum/multisample as top-level tabs keeps the app smaller and more coherent.

UX consequences:

- Presets mode uses list/detail as its main shape.
- Detail submodes are overview, regions, and edit.
- Drum grid and sampler zone keyboard are embedded edit states, not separate destinations.
- Region review remains available before the user enters deep editing.

Do not:

- Recreate separate drum and multisample top-level screens.
- Put the full sample library inside the preset editor.
- Design note patterns, piano roll, or sequence editing here.

---

## D-4 - Samples Are The Maintenance Layer

Decision: Samples mode is for library stewardship: inspect, preview, find unused/unnamed/missing files, and safely rename.

Why:

- A clean sample library makes presets and projects trustworthy.
- The user needs to inspect impact before changing filenames or paths.
- Samples are atomic assets, not the place where kits/presets are assembled.

UX consequences:

- Samples mode uses dense list plus inspector.
- Rename queue is compact and persistent.
- Sample refs link back to preset regions and projects.
- Waveform is useful but secondary to metadata, refs, and cleanup state.

Do not:

- Use sample cards or gallery layouts.
- Let rename happen without impact preview.
- Turn samples mode into a kit builder.

---

## D-5 - Projects Explain Pattern Config Usage

Decision: In this app, a project pattern is treated as a preset configuration assigned to a track/pattern slot.

Why:

- The user explicitly does not care about note patterns in this product.
- The OP-XY supports 8 instrument tracks and up to 9 patterns per track, which is enough structure to explain preset usage without becoming a sequencer.
- The descriptor reference shows multi-pattern topology is a real format concern, so inspection should distinguish track/pattern slots carefully.

UX consequences:

- Projects mode shows T1-T8 pattern-config cells as the primary inspection object.
- A pattern cell may show engine, preset label, missing ref, and unknown status.
- Note count can exist as metadata, but note editing controls are out of scope.
- Missing refs deep-link to presets or samples.

Do not:

- Use piano-roll language.
- Add step editing, note painting, quantize, or sequence tools.
- Hide unknown parser states behind blank cells.

---

## D-6 - Scenes Are Arrangement Choices Over Pattern Configs

Decision: Scenes represent arrangements of pattern-config choices, not authored note content.

Why:

- The OP-XY has up to 99 scenes and scene/song data is stored across pre-track and Track 16 control areas.
- The current reference notes scene/song serialization is only partially decoded.
- The UI can still help users understand arrangement without pretending write safety exists.

UX consequences:

- Scene selector appears only when scene data is available.
- Scene cells are read-only until writer confidence is explicitly established.
- Unknown scene data lives in the projects detail pane as a normal state.
- Scene work should be inspect-first, edit-later.

Do not:

- Ship scene/song write controls without parser/writer tests.
- Show fake scene editing in production UI.
- Collapse scenes and patterns into one ambiguous "arrangement" control.

---

## D-7 - Push Preflight Is A First-Class Surface

Decision: Push preflight is a focused review surface, not a warning message.

Why:

- Set swapping creates powerful flows, but also overwrite risk.
- Rename safety requires showing affected presets/projects before device write.
- A trusted app should make device writes boring and explicit.

UX consequences:

- Preflight summarizes adds, changes, deletes, renames, missing refs, and conflicts.
- Blocking issues stop push.
- Non-blocking warnings identify exact object types.
- The active set name appears in preflight.

Do not:

- Put preflight details only in data mode's main screen.
- Use vague risk copy.
- Allow push to proceed through unresolved missing refs or name conflicts.

---

## D-8 - Compact Layout Beats Completeness On One Screen

Decision: The app should prefer focused screens and deep links over showing every related object at once.

Why:

- The available screen space is limited.
- Data and projects work because they have strong primary shapes.
- Presets and samples will become noisy unless they inherit the same discipline.

UX consequences:

- Every screen gets one primary object and one secondary context.
- Related objects use compact refs and deep links.
- Full workflows stay in their owning modes.
- Detail panes can use submodes, but depth should stay shallow.

Do not:

- Add dashboards that mix projects, presets, and samples.
- Put cards inside cards.
- Use explanatory panels to compensate for unclear IA.

---

## Open Decisions

| ID | Decision Needed | Current Lean |
|----|-----------------|--------------|
| O-1 | First-run default when no device and no set exists. | Offer create-empty-set as the offline path, with pull-to-create when connected. |
| O-2 | Device storage display when MTP reports zero-byte file sizes. | Show counts as reliable; de-emphasize GB segments until local pull data exists. |
| O-3 | Whether scene assignment editing can be local-only before device writes. | No for MVP; inspect-only until writer confidence is stronger. |
| O-4 | Cross-set sample reuse model. | Defer; active-set-only library keeps push semantics clean. |
| O-5 | Exact history backend. | Git-like linear history or equivalent; UI contract matters more than implementation. |

---

## Implementation Guardrails

- A PR should cite the decision IDs it depends on when changing IA, sync, project, scene, or rename behavior.
- If a feature violates a decision here, update this doc first and explain the product tradeoff.
- If OP-XY reference decoding improves, revise D-5 or D-6 before exposing new project/scene write controls.
