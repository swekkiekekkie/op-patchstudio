# Samples tab — UI/UX & functionality spec

**Status:** Split-pane prototype in [opxy-shell-prototype.html](./prototypes/opxy-shell-prototype.html)  
**Parent docs:** [design-direction.md](./design-direction.md), [ui-ux-audit.md](./ui-ux-audit.md) (standalone samples on DevicePage)  
**Last updated:** 2026-06-06

---

## Purpose

The **samples** tab is the atomic file layer — standalone `samples/user/` files plus visibility into preset-linked and project-referenced samples.

Answers:

- What WAV files exist?
- Which are unnamed, unused, or missing from disk?
- What presets/projects reference a file?
- How do I rename safely with impact preview?

---

## Design principles (vs PatchStudio)

| PatchStudio problem | Samples tab solution |
|---------------------|---------------------|
| Standalone samples buried in device tab scroll | Dedicated **samples** mode with full-height split pane |
| List capped at 100 | Full index with counter `showing X of Y` (remove cap in product) |
| Rename + preview per tile in a long grid | List + inspector; rename inline in detail body |
| No batch rename UX | Rename queue bar + review panel before apply |
| Implicit actions | **No bottom “selected: …” bar** — play / show in folder in detail head |

---

## Layout (split pane)

Light `#e8e9e7` mode background; list pane slightly darker slab. **No command strip.**

```text
samples
421 total · 37 unnamed · 8 missing refs

[all][user][preset-linked][unused][missing]  [unnamed only]  [search……]

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

### List pane

| Filter | Meaning |
|--------|---------|
| all | Full set sample index |
| user | `samples/user/` only |
| preset-linked | Used in ≥1 preset |
| unused | No preset or project refs |
| missing | Referenced but file absent |
| unnamed only | Toggle (PatchStudio `samplesUnnamedOnly`) |

**Rename queue bar** (bottom of list): batch cleanup entry point — `generate names` · `review queue` · `apply all`. Opens a **slide-in review panel** listing proposed old → new names before bulk apply.

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
- Projects tab missing ref → samples tab with `missing` filter

---

## Open / TBD

- Real waveform + scrub playhead
- Full rename queue table with per-row edit + skip
- `.xy` project patching on rename (still manual on device today)
- Merge preset-embedded samples into unified search index
- Show in folder → shell `showItemInFolder` IPC
