# Projects tab — UI/UX & functionality spec

**Status:** Arrange UI prototyped in [opxy-shell-prototype.html](./prototypes/opxy-shell-prototype.html); parsing not started  
**Parent docs:** [design-direction.md](./design-direction.md), [product-decisions.md](./product-decisions.md), [compact-ui-ux-principles.md](./compact-ui-ux-principles.md), [data-tab-spec.md](./data-tab-spec.md), [ui-ux-audit.md](./ui-ux-audit.md)  
**Reference:** [reference_material/xy-format/](../reference_material/xy-format/) — `.xy` reverse engineering  
**Last updated:** 2026-06-06

---

## Purpose

The **projects** tab is where the user opens `.xy` project files and understands **arrangement** — how preset configurations in track pattern slots are combined into **scenes**.

It answers:

- Which projects exist on the active set / device?
- For this project, what **pattern-config slots** exist per track (up to 9)?
- For the selected **scene**, which pattern is each track playing?
- What **preset / engine** does each pattern use on each track?

It also remains the hub for **sample reference integrity** (missing files, rename impact) — see [design-direction.md](./design-direction.md). Arrangement editing is the new primary focus described here.

### Scope (v1)

| In scope | Out of scope (later) |
|----------|----------------------|
| Pattern-config inventory per track (1–9) | **Song mode** — scene order, loop, 96-scene chains |
| Scene list + selected scene when decoded | Full mix snapshot editing (volume/mute/pan/sends) |
| Per-scene pattern assignment display when decoded | Live pattern copy/paste/new/clear (device parity) |
| Preset/engine label per pattern block | Sound link toggle (binary unknown) |
| Read-only arrange view first | Writing `.xy` scene/pattern assignments |

**Hierarchy (manual):** project → scenes → pattern-config picks per track. **Songs** sequence scenes; deferred.

Terminology rule: in this app, **pattern** means the OP-XY track/pattern slot and its stored preset configuration. It does not mean note authoring. Note counts may appear as metadata only.

---

## OP-XY arrange mode (manual model)

From the OP-XY user guide — what the hardware UI is doing:

### Patterns

- Up to **9 patterns per track**, numbered independently per track (T1 pattern 3 ≠ T2 pattern 3).
- **New** (M1): create pattern on selected track.
- **Copy / paste / clear** (M2–M4): duplicate or remove patterns; paste to another track copies engine + all parameters.
- Navigate patterns on a track with the **white encoder**.
- Each pattern can store its **own preset** on that track unless **sound link** is on (then all patterns share the current sound — flag not yet found in binary).

### Scenes

- Up to **99 scenes** per project.
- Each scene stores:
  - **Pattern arrangement** — which pattern (1–9) each track plays.
  - **Mix settings** — mutes, levels, etc. (persisted; partially probed in binary).
- Scene length = longest pattern in that scene.
- Selecting an empty scene duplicates the current scene (on-device behavior).

### Tracks

| Tracks | Role | UI color (device) |
|--------|------|-------------------|
| T1–T8 | Instrument | White |
| T9–T16 | Auxiliary (brain, punch-in, MIDI, CV, audio in, tape, FX I, FX II) | Red |

The on-device **arrange screen** (reference screenshot) shows:

- One **column per track** (8 visible in photo; 16 total in file).
- **Track icon** at top (engine / aux role).
- **Pattern blocks** in the column — grey cells; active/selected pattern highlighted (white).
- **Scene number** — large red indicator (e.g. `10`).
- Bottom soft keys: `clear` · `copy` · `paste` · `new`.

Our app should **echo this grid grammar** — not clone pixels, but the same mental model: **scene in the middle, tracks as columns, patterns as selectable cells, preset readable per cell**.

---

## What `xy-format` can parse today

Summary after inspecting `reference_material/xy-format/` (docs, `xy/`, `tools/`).

### High confidence — use now

| Capability | Source | Notes |
|------------|--------|-------|
| `.xy` container (header + 16 track blocks) | `xy/container.py` | Round-trip safe |
| **Logical patterns** per track | `extract_logical_entries()` in `xy/scaffold_writer.py` | `(track, pattern)` → preamble, body, engine |
| Pattern count per track (1–9) | Leader preamble `byte[1]` | `pattern_count` on first block of track |
| Pattern length (bars) | Preamble `byte[2]` | `bar_count = pre2 >> 4` |
| Engine ID per pattern block | `TrackBlock.engine_id` | Drum, Prism, EPiano, … |
| Note count per pattern | `xy/note_events.py`, `tools/inspect_xy.py` | Metadata only; no note editing UI |
| Tempo, groove, metronome | Header @ `0x18` | `inspect_xy.py` report |
| Multi-pattern topology | `docs/format/descriptor_encoding.md`, `multi_pattern_block_rotation.md` | Block rotation + T16 overflow |

Example logical entry (what we can build today):

```json
{
  "track": 3,
  "pattern": 2,
  "pattern_count": 4,
  "engine": { "id": "0x12", "name": "Prism" },
  "bars": 1,
  "noteCount": 1,
  "active": true
}
```

### Partial — needs extraction work

| Capability | Status |
|------------|--------|
| **Preset name** per pattern | Null-terminated ASCII in track body (`patch_name` region in `track_blocks.md`); no shared extractor yet — likely **one preset string per logical pattern body** |
| Instrument vs aux **role labels** | Documented (T9 brain … T16 FX II); not read from bytes |
| Preset **settings** diff across patterns | Manual says copy/paste copies full engine; clones often byte-identical except notes (`n110` finding) |

### Not decoded — blocks v1 scene UI from real files

| Capability | Status |
|------------|--------|
| **Scene → track → pattern index** table | **No parser.** Probe hints only: T16 tail @ `+0x0163` correlates with scene count (`scenes_songs.md`) |
| Scene mix snapshot (mute/volume/pan/sends) | Mute probes show pre-track + T9–T16 rewrites; schema unknown |
| **Sound link** flag | Manual-only hypothesis in `OP-XY_project_breakdown.txt` |
| **Song** loop + scene order | Per-song bytes in T16 tail (songs 1–3 probed); no serializer |

**Authoring guidance from xy-format:** do not synthesize scene/song bytes until normalized-branch rules are modeled (`scenes_songs.md`).

### Reuse plan for this app

1. **Phase A — pattern inventory:** Port or subprocess `extract_logical_entries()` + engine map + (new) `patch_name` scanner → `ProjectPatternIndex`.
2. **Phase B — scene matrix:** Dedicated RE or port probes → `ProjectSceneLayout` (16 × pattern index per scene).
3. **Phase C — write path:** Out of scope until decode is stable; UI read-only first.

Draft user JSON for scenes already exists: `xy-format/docs/engineering/json_project_spec_complete.md` (`scenes[].track_patterns[]`) — target contract, not implemented.

---

## Target data model (app)

```typescript
// Conceptual — align with future IPC

interface ProjectSummary {
  filename: string;           // "ambient sketch.xy"
  tempoBpm: number;
  sceneCount: number | null;  // null if undecoded
  patternSummary: string;     // "T1×4 · T3×2 · …" mono shorthand
  sampleRefCount: number;
  missingSampleCount: number;
}

interface TrackPattern {
  track: number;              // 1–16
  pattern: number;            // 1–9
  role: 'instrument' | 'aux';
  auxRole?: 'brain' | 'punch_in' | 'midi' | 'cv' | 'audio_in' | 'tape' | 'fx1' | 'fx2';
  engine: string;             // "Drum", "Prism", …
  presetName: string | null;  // from body patch string
  bars: number;
  noteCount: number;
  hasContent: boolean;        // type 0x07 vs empty 0x05
}

interface Scene {
  scene: number;              // 1–99
  trackPatterns: Array<{
    track: number;
    pattern: number;          // which pattern slot this track plays
  }>;
  // mixSnapshot: TBD read-only display
}

interface ProjectArrangement {
  filename: string;
  tracks: Array<{
    track: number;
    patternCount: number;     // 1–9
    patterns: TrackPattern[];
  }>;
  scenes: Scene[];
  selectedScene: number;
}
```

**Preset per pattern:** On device, each pattern slot on a track is its own block body → treat preset/engine as **per (track, pattern)**, not per track alone. Scene selection picks which pattern index is heard, not which preset — preset comes from that pattern’s stored data.

**Sound link (future):** If enabled, UI might show one linked preset for all patterns on a track; until binary is found, omit or show “?” on track header.

---

## UI design — arrange view

### Shell (projects mode)

Keep list + detail split from prototype, replace generic “sample refs only” detail with **arrange-first** layout when a project is open:

```text
┌─────────────────────────────────────────────────────────────┐
│ projects                                                    │
├──────────────────┬──────────────────────────────────────────┤
│ ambient sketch   │  scene  [ 10 ]     ← large scene picker   │
│ club tool 07     │  ┌──┬──┬──┬──┬──┬──┬──┬──┐  (+ aux …)  │
│ broken clouds    │  │T1│T2│T3│T4│T5│T6│T7│T8│  16 cols       │
│ …                │  │▓▓│░░│▓▓│░░│░░│▓▓▓│░░│▓▓│  pattern cells│
│                  │  └──┴──┴──┴──┴──┴──┴──┴──┘               │
│                  │  preset labels under active pattern      │
├──────────────────┴──────────────────────────────────────────┤
│ sample refs · 42 indexed · 1 missing          [expand]       │
└─────────────────────────────────────────────────────────────┘
│ sets │ projects │ presets │ library │
```

### Track columns (match device grammar)

| Element | Behavior |
|---------|----------|
| **Track header** | Icon or short label: drum, prism, `cv`, `midi`, tape, `fx1`, `fx2` |
| **Instrument vs aux** | White type for T1–T8, muted red tint for T9–T16 (TE convention) |
| **Pattern stack** | Up to 9 rows or a compact strip; **scene’s chosen pattern** highlighted |
| **Cell content** | Pattern number + mono preset name (`clean kit`, `pluck/beach bum`) |
| **Empty pattern** | Empty grey cell — pattern slot unused |
| **Multi-pattern track** | Tape track in reference image shows vertical stack 1–2–3 |

### Scene selection

- Large **scene number** (reference: red square `10`) — click or encoder-style prev/next.
- Scene strip or numpad for 1–99 deferred; start with prev/next + number display.
- Changing scene updates which pattern cell is lit per column — **no audio** in desktop app.

### Secondary panel — sample refs

Collapse below arrange grid (existing prototype intent):

- Click sample ref → jump to presets or samples mode.
- Keeps rename-impact workflow from [design-direction.md](./design-direction.md).

### Actions (later)

Device bottom row (`new` / `copy` / `paste` / `clear`) **not in v1**. When editing exists:

- Read-only inspect first.
- Edits require explicit write + xy-format safe writer — likely long after read UI.
- If scene data is not decoded, keep the arrange pane visible with `scene data unavailable` and show pattern inventory only.

---

## Visual rules (projects mode)

From global design system — projects background `#33383b`:

- Same 8px grid, square cells, no shadows.
- Arrange grid uses **flat rectangles** like device LCD blocks (grey idle, brighter active).
- Scene indicator: single accent (device uses red; we may use high-contrast white or muted red dot — TBD).
- Typography: grotesk labels, mono for pattern numbers and preset paths.
- No decorative sequencer chrome — this is arrangement metadata, not step editing.

---

## Implementation phases

### Phase 0 — Document + mock (now)

- [x] This spec
- [x] `opxy-shell-prototype.html` includes static arrange grid + mock scene/pattern/preset data

### Phase 1 — Read pattern inventory

- [ ] IPC: parse `.xy` from active set path → `ProjectArrangement` (patterns only, single synthetic “scene 1” = all pattern 1)
- [ ] Wire `extract_logical_entries()` (Python subprocess or TS port of logic)
- [ ] Add `patch_name` extraction per logical body
- [ ] Show real preset names in grid cells where parse succeeds

### Phase 2 — Read scenes

- [ ] RE closure on scene matrix (collaborate with xy-format probes)
- [ ] Populate `scenes[]` + scene selector
- [ ] Display scene count in project list row

### Phase 3 — Sample refs (existing backlog)

- [ ] Keep/refine sample ref list under arrange view
- [ ] Deep links to presets/samples modes

### Phase 4 — Edit (distant)

- [ ] Scene pattern assignment write
- [ ] Sound link, mix snapshot, song mode — only after binary encode is safe

---

## xy-format files to lean on

| Need | Path |
|------|------|
| Logical pattern list | `xy/scaffold_writer.py` → `extract_logical_entries()` |
| Inspector CLI | `tools/inspect_xy.py` |
| Engine names | `inspect_xy.py` `ENGINE_NAMES`, `TrackBlock.engine_id` |
| Multi-pattern rules | `docs/format/descriptor_encoding.md` |
| Scene/song probes | `docs/format/scenes_songs.md` |
| Limits (9 pat, 99 scenes) | `docs/reference/opxy_limits.md` |
| User capture checklist | [xy-format-probe-projects.md](./xy-format-probe-projects.md) |
| Target JSON shape | `docs/engineering/json_project_spec_complete.md` |
| Corpus test files | `reference_material/xy-format/src/` (unnamed *.xy) |

---

## Open questions

1. **16 columns vs 8+8** — show all 16 tracks scrolled horizontally, or 8 instrument + toggle aux row?
2. **Pattern display** — vertical stack (like tape in photo) vs single highlighted cell per column?
3. **Scene picker** — grid 1–99, scroll list, or only prev/next at first?
4. **Undecoded scenes visual treatment** — exact compact styling for `scene data unavailable` state.
5. **Preset name fallback** — engine default label when patch string missing?
6. **Project list sort** — filename, recent, missing-sample count?

---

## Related prototype state

The [opxy-shell-prototype.html](./prototypes/opxy-shell-prototype.html) **projects** screen includes:

- Project list (left) + arrange pane (right)
- Scene navigator with red badge (◀ **N** ▶)
- 16-track grid with **inst / aux / all** filter
- Pattern cells per track (1–9); **scene-active** cell highlighted
- Preset name for the active pattern per track
- Click pattern cell to change scene assignment (mock edit only; production starts read-only)
- Collapsible sample refs footer

Mock data only — no `.xy` parsing.

---

*Update this document when xy-format scene decoding advances or when the arrange prototype lands.*
