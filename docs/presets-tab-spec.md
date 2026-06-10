# Presets tab — UI/UX & functionality spec

**Status:** Split-pane prototype in [opxy-shell-prototype.html](./prototypes/opxy-shell-prototype.html)  
**Parent docs:** [design-direction.md](./design-direction.md), [compact-ui-ux-principles.md](./compact-ui-ux-principles.md), [ui-ux-audit.md](./ui-ux-audit.md) (PresetBrowser / PresetInspector / DrumTool / MultisampleTool)  
**Last updated:** 2026-06-06

---

## Purpose

The **presets** tab is the central library for all preset types — drum, sampler, multisampler, **and synth catalog**. It replaces PatchStudio’s device-tab PresetBrowser plus the separate drum/multisample top-level tabs.

Answers:

- What presets exist in the active set?
- What samples/regions does each preset use?
- Which are modified / unnamed?
- How do I rename, preview, or edit without leaving the mode?

---

## Design principles (vs PatchStudio)

| PatchStudio problem | Presets tab solution |
|---------------------|-------------------|
| PresetBrowser + DrumTool + MultisampleTool are three separate tabs | One mode; **edit** submode embeds drum/multisample tooling inline |
| `CacheEditorContextBar` + “back to device” disorients | Breadcrumb + ◀ ▶ navigation within filtered list; no cache-link chrome |
| Command strip / sticky footer steals vertical space | **No bottom “selected: …” bar** — actions live in detail head + inline rows |
| Synth presets hidden from browser | Synth type filter + honest catalog read-only in overview |
| Card-stack scroll on drum tab | Scrollable detail body; optional pin for pad grid / keyboard |
| Category list grows unbounded | Collapsible categories; >8 presets collapse by default |

---

## Layout (split pane)

Same grammar as **projects**: list left, inspector right. Bottom mode keys stay visible. **No command strip.**

```text
presets
275 total · 91 unnamed · 44 modified

[all][drum][synth][sampler][multi]  [unnamed][modified]  [search……]

┌ list ──────────┬ detail ────────────────────────────────┐
│ showing 42/275 │ presets / drum / clean kit    ◀ 1/8 ▶│
│ collapse expand│ [open edit][export][duplicate]…        │
│ ▾ drum · 12    │ clean kit                               │
│ 01 clean kit ● │ [overview][edit]                         │
│ 02 tape kit    │ (sub-pane content)                      │
│ ▸ keys · 48    │ save bar at bottom of edit submode      │
└────────────────┴─────────────────────────────────────────┘
```

### List pane

| Element | Maps from PatchStudio |
|---------|----------------------|
| Type segments | `PresetBrowser` type chips (+ synth, multisampler) |
| Unnamed / modified toggles | `unnamedOnly`, `modifiedOnly` + dirty list |
| Search | `searchQuery` filter |
| Counter + collapse/expand | `showing X of Y`, `collapse all` / `expand all` |
| Collapsible group headers | `groupPresetsByCategory`; >8 presets start collapsed |
| Row meta | Type, sample count where useful, modified state |

**Fixes audit gap:** synth presets visible with honest `catalog` / engine label.

### Hierarchy browser

The preset browser should move from collapsible group headers toward OP-XY-style adjacent lists:

- First hierarchy source is the actual set path, e.g. preset folders/categories.
- Second hierarchy source can be inferred from stable filename prefixes, e.g. `nt-cuckoo fx` and `nt-cuckoo kicks` share `nt-cuckoo`.
- Prefix inference is advisory. It should create navigable clusters only when at least two presets in the filtered library share the prefix; the visible preset list still stays scoped to the selected folder.
- The UI should cap visible columns to the pane width, then preserve context with a breadcrumb/compressed middle column rather than adding horizontal clutter.
- Search flattens results temporarily, but clearing search should restore the current hierarchy selection.

### Detail pane — inline actions (replaces command strip)

Actions appear in **detail-head** (`presetDetailActions`), not a sticky footer:

| Context | Inline actions |
|---------|------------------|
| Sample-based preset | edit samples · export · duplicate |
| Synth catalog | export · duplicate only |
| Edit submode | reset · update preset (save bar) |

---

## Submodes

| Submode | PatchStudio source | Prototype / product scope |
|---------|-------------------|---------------------------|
| **overview** | PresetInspector summary + patch JSON | Type-aware surface. Synth presets show engine values, ADSR envelopes, params, FX/LFO status. Drum/sampler presets show compact sample map and one clear editor entry point. |
| **edit** | DrumTool + MultisampleTool (embedded) | See below |

**Navigation:** ◀ ▶ walks filtered list (replaces PresetInspector prev/next + separate editor tab).

**Removed:** `CacheEditorContextBar`, “back to device”, global command strip, tab switch on open editor.
**Also removed:** separate `regions` submode. Region/sample work belongs in **edit**, where the samples are visible, playable, and eventually waveform-editable.

---

## Edit submode — PatchStudio feature map

### Drum / sampler (`editDrumSampler`)

| PatchStudio (DrumTool) | Presets tab UX |
|------------------------|----------------|
| 24-pad keyboard | Pad grid with computer-key hints; click to play |
| Organize mode | Toggle in controls row; drag-reorder in sample table (product) |
| MIDI input + channel | Toggle + channel selector (product) |
| Pin keyboard | `pin pads` toggle — sticky pad row while scrolling |
| Sample table | Pad key, filename, waveform, play / settings / delete |
| Per-sample settings modal | Gear on row → trim, reverse, pan, gain (modal in product) |
| Record / browse / clear all | Footer actions on sample table |
| Bulk edit modal | `bulk edit` button |
| Preset settings | playmode, transpose, velocity, volume, width |
| Audio processing | sample rate, bit depth, normalize, zero-cross |
| Generate / update cache | Preset name, patch size, update preset CTA |
| Dirty state | Save bar: modified label + reset + update |

### Multisampler (`editMultisample`)

| PatchStudio (MultisampleTool) | Presets tab UX |
|-------------------------------|----------------|
| Virtual MIDI keyboard | Zone keyboard stub + pin toggle |
| Zone table | Root note, sample, waveform, play / delete |
| Preset settings | playmode, transpose, portamento, tuning root, highpass, width |
| Advanced settings | ADSR, loop mode, LFO (collapsed section in product if needed) |
| Audio processing | gain, cut at loop end |
| Generate / update | Same save bar pattern as drum |

### Synth (`editSynth`)

Read-only note: catalog metadata only; axis/prism engines not editable in v1.

---

## Rename & impact flows

| Flow | PatchStudio | Presets tab |
|------|-------------|-------------|
| Single region rename | Region input + rename + project confirm | Edit sample table row, with playback/waveform context |
| Bulk rename unnamed | PresetInspector bulk block | Edit submode command: generate names from preset + slot labels, then review before apply |
| Preview | `CacheAudioPreview` inline expand | ▶ on editor sample row / pad |

---

## PatchStudio features to wire (product)

| Feature | IPC / component |
|---------|-----------------|
| List presets | `listPresets()` |
| Preset detail | `getPresetDetail()` |
| Rename sample in preset | `renameSampleInPreset()` |
| Bulk rename unnamed | PresetInspector bulk loop |
| Load editor state | `loadPresetIntoEditor()` → edit submode |
| Save back | `writePreset()` + dirty flag |
| Preview audio | `readBytes()` + CacheAudioPreview |
| Export | `exportPresetZip()` |
| Drum generate | `devicePatchExport.ts` + cache write |
| Multisample generate | Same pipeline, multisample JSON base |

---

## Deep links

- **Projects** sample ref → `selectPreset(name)` + slide to pre tab
- **Samples** ref → preset row in list
- **Projects** arrange preset picker → same catalog, stays on proj tab (inline picker)

---

## Open / TBD

- Real waveforms + zoom modal on sample table rows
- Organize-mode drag between pads
- Recording modal (20s cap)
- OP-1 drum import (hidden in PatchStudio today)
- Duplicate / export confirmation flows
- Dirty persistence across app restart
- Hierarchical browser for folders + inferred author/prefix groups; use the same model as samples source folders
