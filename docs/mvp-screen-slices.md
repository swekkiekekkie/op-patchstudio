# OP-XY MTP Manager - MVP Screen Slices

**Status:** Draft implementation brief  
**Parent docs:** [design-direction.md](./design-direction.md), [product-requirements-and-flows.md](./product-requirements-and-flows.md), [ux-flow-map-and-traceability.md](./ux-flow-map-and-traceability.md), [compact-ui-ux-principles.md](./compact-ui-ux-principles.md), [product-decisions.md](./product-decisions.md)  
**Reference:** [reference_material/xy-format/docs/reference/opxy_limits.md](../reference_material/xy-format/docs/reference/opxy_limits.md), [reference_material/xy-format/docs/format/scenes_songs.md](../reference_material/xy-format/docs/format/scenes_songs.md)  
**Last updated:** 2026-06-08

---

## Purpose

This document turns the product model into small UI slices that can be implemented without letting the app become visually noisy.

The key product tension is:

- The app should support many local swappable sets so the OP-XY stays uncluttered.
- The UI has very little useful screen space.
- Presets, samples, projects, and push safety are all connected, but they cannot all be visible at once.

The MVP should therefore behave like a clean library instrument: one active set, one focused object, short paths between related objects, and explicit preflight before anything touches the device. PC sample folders are the broad source library; active sets are the curated deployable output.

---

## Global Slice Rules

Every MVP slice must satisfy these before it is considered shippable:

| Rule | Requirement |
|------|-------------|
| One primary object | A screen may focus on one set, one preset, one sample, or one project view. |
| One secondary context | Related refs can appear, but only as a compact inspector/list, not a second full workflow. |
| No nested app tabs | Drum, sampler, regions, refs, rename, and preflight are submodes or slabs inside an object screen. |
| Active set always visible | The user must know which local set is being edited before any save/push action. |
| Push is separated | Editing the local set and writing the device remain distinct actions. |
| Unknown OP-XY data is honest | Undecoded project/scene data appears as unavailable metadata, not pretend controls. |

Screen budget:

- Top status strip: connection, active set, dirty/risk count.
- Main workspace: one list/detail, cockpit, grid, or focused sheet.
- Bottom mode keys: sets, projects, presets, library.
- No marketing headers, dashboards, oversized empty states, or explanatory cards.

---

## Slice 1 - Active Set Shell

Goal: make the local set the center of the application.

Primary screen:

```text
status strip
  connected/offline | active set | dirty/risk count
------------------------------------------------
mode workspace
------------------------------------------------
mode keys
```

What appears:

- Active set name.
- Source device/cache timestamp.
- Dirty state.
- Count summaries: projects, presets, samples.
- Compact set switcher.

What stays out:

- Full sample/preset/project browsers.
- Push preflight details.
- Device storage charts outside data mode.

Acceptance criteria:

- Changing modes never hides active set identity.
- A save action says whether it updates local set data or writes the device.
- Empty/offline states use one sentence or less.
- The shell still fits at reduced height without hiding mode keys.

Requirements: SET-1, SET-2, SET-7, SAFE-3, UX-1, UX-3, UX-10.

---

## Slice 2 - Data Mode: Set And Device Cockpit

Goal: make swapping sets and syncing device content understandable without exposing every library object.

Primary screen:

```text
status strip
------------------------------------------------
op-xy pane
  storage/counts/connect state
------------------------------------------------
transfer row
  pull from op-xy        push active set
------------------------------------------------
set pane
  active set summary/history
------------------------------------------------
set toolbar
```

What appears:

- Device connection state.
- Pull/push actions.
- Active set summary.
- Recent set snapshots.
- Push blocked/warn/ready state.

What stays out:

- Preset editor.
- Sample cleanup queue.
- Project arrange grid.
- Long change review content unless the user opens preflight.

Acceptance criteria:

- Pull and push are visually separate from local set switching.
- Push always opens preflight when there are dirty changes, risks, missing refs, or rename operations.
- The active set summary uses counts and risk states, not prose.
- Data mode can be understood in one glance before the user leaves it.

Requirements: SET-1 through SET-8, SAFE-1, SAFE-2, SAFE-3, UX-1, UX-2, UX-4.

---

## Slice 3 - Presets Mode: Library To Detail

Goal: make presets the central creative object without reviving top-level drum/multisample tabs.

Primary screen:

```text
status strip
------------------------------------------------
presets header
  search | type filter | dirty/missing filter
------------------------------------------------
preset list | preset detail
            | overview / regions / edit
------------------------------------------------
mode keys
```

List pane:

- Compact rows grouped by type: drum, sampler, synth.
- Row data: preset name, type, region/ref count, dirty/missing status.
- Filters collapse into a single row.

Detail pane:

- Header: preset name, type, save/duplicate/delete actions.
- Overview: refs, region summary, project usage.
- Regions: sample assignments and missing refs.
- Edit: drum grid or sampler zone keyboard embedded inside detail.

What stays out:

- Separate drum and multisample modes.
- Large tile grids for the preset catalog.
- Full sample browser inside edit mode.
- Note pattern editing.

Acceptance criteria:

- Selecting a preset never changes mode.
- Drum and sampler editors are reachable in one click from preset detail.
- Region review is available before deep editing.
- Missing sample refs link to samples mode without opening a modal.
- Synth presets can appear read-only if their schema is not editable yet.

Requirements: PRE-1 through PRE-8, SMP-5, PAT-3, SAFE-3, SAFE-4, UX-2, UX-5, UX-6, UX-8.

---

## Slice 4 - Samples Mode: Library Maintenance

Goal: make the PC source library and active-set sample library manageable without turning either into a gallery.

Primary screen:

```text
status strip
------------------------------------------------
library header
  set/source scope | search | folder/type/unnamed filters
------------------------------------------------
sample list | sample inspector
            | waveform strip
            | metadata
            | refs / rename impact
transfer or rename queue slab
------------------------------------------------
mode keys
```

List pane:

- Dense rows, not cards.
- Source scope lists indexed PC folders and candidate samples.
- Set scope lists deployable active-set samples.
- Row data: filename, duration/format, usage count, warning state.
- Filters for unnamed, unused, missing, referenced, dirty.

Inspector:

- Preview/playback.
- Metadata and path.
- Preset refs.
- Project refs when available.
- Rename action and impact preview.

Transfer / rename queue slab:

- Compact bottom slab in list pane.
- Source scope: staged source samples and name/path conflicts before copy-to-set.
- Set scope: rename candidates, conflicts, and apply/clear.
- Opens a focused review sheet only when needed.

What stays out:

- Big waveform-first layout.
- Per-sample cards.
- Full preset editor.
- Project arrangement controls.
- Automatic copying from source folders into sets.

Acceptance criteria:

- The user can identify unnamed or unused samples in one screen.
- The user can distinguish PC source samples from active-set samples.
- The user can stage source samples before copying them into the active set.
- Rename preview lists affected presets/projects before applying.
- A sample row can deep-link to the preset region using it.
- The rename queue remains visible but does not consume the main workspace.

Requirements: SMP-1 through SMP-7, SAFE-1, SAFE-4, UX-2, UX-6, UX-7, UX-8, UX-9.

---

## Slice 5 - Projects Mode: Pattern Config Inventory

Goal: inspect how presets are used in projects while keeping note patterns out of scope.

Primary screen:

```text
status strip
------------------------------------------------
project list | project detail
             | scene selector if decoded
             | T1-T16 pattern config grid
             | refs/risk slab
------------------------------------------------
mode keys
```

What appears:

- Project list.
- Track/pattern slots.
- Engine/preset labels when known.
- Missing preset/sample refs.
- Scene selector only when scene data is decoded.
- Clear unavailable state when scene data is not decoded.

What stays out:

- Piano roll.
- Step editor.
- Note event editing.
- Fake scene write controls before parser/writer confidence exists.

Acceptance criteria:

- Pattern means preset configuration assignment, not notes.
- Track/pattern cells can show unknown data without breaking layout.
- A missing or referenced object links to presets/samples.
- Scene controls are read-only until the write path is explicitly designed.

Requirements: PAT-1 through PAT-6, SCN-1 through SCN-5, SAFE-4, SAFE-5, UX-2, UX-6.

---

## Slice 6 - Push Preflight

Goal: make writing the active set to the OP-XY calm, explicit, and reversible where possible.

Primary surface:

```text
focused sheet
  summary row
  changes
  rename impact
  missing refs
  conflicts
  push action
```

What appears:

- Add/change/delete counts.
- Rename operations.
- Missing refs.
- Device overwrite risk.
- Last backup/snapshot state.
- Final push action.

What stays out:

- Editing controls.
- Full library browsers.
- Long educational prose.
- Ambiguous "sync" language.

Acceptance criteria:

- Push cannot proceed through blocking conflicts.
- Warnings identify the exact affected object type.
- The user can cancel without losing local edits.
- The preflight refers to active set by name.

Requirements: SET-4, SET-8, SAFE-1, SAFE-2, SAFE-3, SAFE-4, UX-4, UX-7.

---

## MVP Implementation Order

| Order | Slice | Why First |
|-------|-------|-----------|
| 1 | Active set shell | Every other workflow depends on set identity. |
| 2 | Data cockpit | Swappable sets and device writes need one reliable home. |
| 3 | Presets list/detail | Presets are the creative center and absorb drum/sampler editing. |
| 4 | Samples maintenance | Rename safety and sample refs make the library trustworthy. |
| 5 | Project pattern inventory | Project refs explain impact and prepare scene work. |
| 6 | Push preflight | Safe device writes depend on dirty/ref indexes from prior slices. |

The first usable MVP can ship with slices 1 through 4 if projects remain read-only placeholders and push is guarded by a basic preflight.

---

## Do Not Build Yet

These will make the app feel larger before it becomes clearer:

- A full song arranger.
- Note pattern editing.
- A global dashboard mixing projects, presets, and samples.
- Separate drum and multisample top-level screens.
- Large onboarding panels.
- Card grids for sample or preset libraries.
- Scene writing before the reference format is decoded and tested.
- Automatic device push after edits.

---

## Review Checklist

Before opening an implementation PR for any slice:

- [ ] Does the PR cite the relevant requirement IDs?
- [ ] Does the screen preserve active set visibility?
- [ ] Does it have one primary object and one secondary context?
- [ ] Does it avoid new top-level modes?
- [ ] Does it handle missing/unknown OP-XY data honestly?
- [ ] Does it still fit at reduced height?
- [ ] Does every destructive or device-writing action go through review?
