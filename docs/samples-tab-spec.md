# Library tab — UI/UX & functionality spec

**Status:** Former samples tab; source/set split with folder registry, scan, and copy-to-set path scaffolded in app. Product direction now broadens this into a unified library for PC/source samples and `.preset` folders.  
**Parent docs:** [design-direction.md](./design-direction.md), [compact-ui-ux-principles.md](./compact-ui-ux-principles.md), [ui-ux-audit.md](./ui-ux-audit.md) (standalone samples on DevicePage)  
**Last updated:** 2026-06-06

---

## Purpose

The **library** tab is the source and asset-maintenance layer for both:

- **PC source library:** indexed Windows folders that contain candidate samples and `.preset` folders.
- **Active set assets:** deployable samples and presets already copied into the current set, including standalone `samples/user/` files plus preset-linked and project-referenced samples.

Answers:

- What sample files exist on this PC?
- What `.preset` folders exist on this PC?
- Which source samples should be copied into this set?
- Which source presets should be copied into this set?
- What WAV files already exist in the active set?
- What presets already exist in the active set?
- Which are unnamed, unused, or missing from disk?
- What presets/projects reference a file?
- How do I rename safely with impact preview?

---

## Design principles (vs PatchStudio)

| PatchStudio problem | Samples tab solution |
|---------------------|---------------------|
| Standalone samples buried in device tab scroll | Dedicated **library** mode with full-height split pane |
| PC sample/preset folders not represented | Source scope for folder indexing and staging into sets |
| List capped at 100 | Full index with counter `showing X of Y` (remove cap in product) |
| Rename + preview per tile in a long grid | List + inspector; rename inline in detail body |
| No batch rename UX | Rename queue bar + review panel before apply |
| Implicit actions | **No bottom “selected: …” bar** — play / show in folder in detail head |

---

## Layout (split pane)

Light `#e8e9e7` mode background; list pane slightly darker slab. **No command strip.**

```text
library
421 set files · 3 source dirs · 37 unnamed · 8 missing refs

[set][source]  [samples][presets]  [all][user][preset-linked][unused][missing]  [search……]

┌ list ──────────┬ inspector ────────────────────────────────┐
│ showing 120/421│ samples / kick clean c2 01.wav            │
│ kick …wav      │ [▶ play][show in folder]                  │
│ hat …wav       │ ░ waveform stub ░                         │
│ field …wav     │ location · duration · format · used in    │
│ …              │ [rename field] + apply                    │
│ ─────────────  │ references → preset / project links       │
│ rename queue   │ rename impact slab (on apply)             │
│ 37 unnamed     │                                           │
│ [gen][review]  │                                           │
└────────────────┴───────────────────────────────────────────┘
```

### Source scope

Purpose: manage broad on-PC sample and preset folders before deciding what belongs in a set.

| Element | Meaning |
|---------|---------|
| source folder list | Windows directories added by the user |
| remove source folder | Unregisters a folder from the app; source files on disk are not deleted |
| scan status | last scan, missing folder, failed scan |
| source sample rows | filename, folder, duration/format, already-in-set state |
| source preset rows | `.preset` folder name, type, referenced samples, already-in-set/conflict state |
| source filters | `all`, `new`, `in set`, `staged` |
| staging queue | selected source samples/presets to copy into active set; `stage visible` adds visible not-yet-in-set assets |
| transfer action | copy staged files into `samples/user/` or a chosen set folder |

Source scope must not mutate the OP-XY or active set until the user stages and applies a transfer.
The default source workflow is curation: scan broad PC folders, filter to candidates that are not already in the active set, stage a small working selection, then copy that selection into the set.

Preset import has an additional integrity step: a `.preset` folder may reference samples that are not staged. The transfer review must either stage the referenced samples, map them to existing set samples, or mark the preset as incomplete before copy.

### Hierarchy browser

The source scope should not flatten PC folders into one giant sample list. It uses the same compact hierarchy model as presets:

- Show a small number of adjacent vertical lists, OP-XY style: each column selection determines the next column.
- Cap visible depth to the available pane width. When filesystem depth exceeds the cap, collapse the middle path into a breadcrumb row instead of adding more columns.
- Files may exist at different depths. Treat files at the current node as a stable `samples here` group beside child folders rather than forcing a fake folder level.
- Preserve real folders first; inferred groupings such as author/prefix are optional secondary columns, never a substitute for the filesystem.
- The final column is always the actionable asset list with stage/play/copy affordances.

### Set scope list pane

| Filter | Meaning |
|--------|---------|
| all | Full active-set sample index |
| user | `samples/user/` only |
| preset-linked | Used in >=1 preset |
| unused | No preset or project refs |
| missing | Referenced but file absent |
| unnamed only | Toggle (PatchStudio `samplesUnnamedOnly`) |

**Transfer queue bar** (source scope): source old path -> set target path, with conflicts.

**Rename queue bar** (set scope): batch cleanup entry point — `generate names` · `review queue` · `apply all`. Opens a **slide-in review panel** listing proposed old -> new names before bulk apply.

### Inspector pane — inline actions (replaces command strip)

| Element | PatchStudio source |
|-------|-------------------|
| Detail-head actions | ▶ play · show in folder (was implicit / scattered) |
| Waveform row | Standalone tile preview (`readBytes`) — stub in prototype |
| Metadata grid | Parsed base/note/idx, duration, format |
| Rename inline | Base name input + apply → impact slab |
| Impact slab | `getRenameImpact()` confirm |
| References | Deep links to presets tab + projects tab |

---

## Rename queue flow (reimagined)

PatchStudio has no dedicated batch review UI. New flow:

1. **generate names** — auto-fill base names from heuristics (preset context, note, slot)
2. **review queue** — slide-in panel with old → new table; edit rows before apply
3. **apply all** — runs impact check per file or aggregated confirm; patches presets/projects where supported

Prototype: panel stub with 8 sample rows and apply/discard.

---

## PatchStudio features to wire (product)

| Feature | IPC / component |
|---------|-----------------|
| Add source folder | `addSourceFolder()` / `showOpenDialog({ properties: ['openDirectory'] })` |
| Remove source folder | `removeSourceFolder()`; registry-only, non-destructive |
| Scan source folders | `scanSourceFolders()` with persisted folder registry |
| Stage source sample | Source-scope list staging; no device write |
| Copy to active set | `copySourceSamplesToSet()` with skip/replace conflict review |
| List standalone | `listStandaloneSamples()` |
| Rename standalone | `renameStandaloneSample()` |
| Impact preview | `getRenameImpact()` |
| Project index | `buildProjectIndex()` for ref counts |
| Preview | `readBytes()` |
| Batch rename | New queue service over unnamed scan |

**Audit note:** Standalone list capped at 100 in current app — remove cap in redesign.

---

## Deep links

- Inspector ref row → presets or projects mode with target selected
- Projects tab missing ref → library tab with `missing` filter

---

## Open / TBD

- Real waveform + scrub playhead
- Full rename queue table with per-row edit + skip
- Rename/relocate source folders after adding them
- Rich source scanner metadata: duration, sample rate, channels, root note
- Source-to-set conflict review sheet with `copy as...` rename choices
- Extend adjacent-list hierarchy browser with richer metadata and inferred source groups
- `.xy` project patching on rename (still manual on device today)
- Merge preset-embedded samples into unified search index
- Show in folder → shell `showItemInFolder` IPC
