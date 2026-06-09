# OP-XY `.xy` Probe Project Request List

**Status:** Draft capture checklist  
**Purpose:** Create targeted OP-XY projects that can be pulled into this repo and compared to advance `.xy` project, pattern-config, and scene decoding.  
**Parent docs:** [projects-tab-spec.md](./projects-tab-spec.md), [product-decisions.md](./product-decisions.md), [product-requirements-and-flows.md](./product-requirements-and-flows.md)  
**Reference:** [reference_material/xy-format/docs/reference/opxy_limits.md](../reference_material/xy-format/docs/reference/opxy_limits.md), [reference_material/xy-format/docs/format/descriptor_encoding.md](../reference_material/xy-format/docs/format/descriptor_encoding.md), [reference_material/xy-format/docs/format/scenes_songs.md](../reference_material/xy-format/docs/format/scenes_songs.md)  
**Practical capture checklist:** [xy-format-capture-instructions.md](./xy-format-capture-instructions.md)  
**Last updated:** 2026-06-08

---

## Capture Rules

Use short, stable project filenames. Export or pull each `.xy` file after every listed step.

Recommended naming:

```text
probe_01_base.xy
probe_01_t1_p2.xy
probe_01_t1_p3.xy
```

General rules:

- Start each probe from a fresh empty project.
- Use only instrument tracks T1-T8 unless the probe says otherwise.
- Put one simple note on used patterns so the OP-XY saves the pattern, but do not vary note content unless requested.
- Keep tempo constant at 120 bpm unless the probe says otherwise.
- Use clearly different preset names where possible.
- After each edit, save/pull a new file before making the next edit.
- Do not use song mode unless the probe explicitly asks for it.

The app goal is not note editing. Notes are only save anchors for binary comparison.

---

## Probe 01 - Single Track Pattern Growth

Question: how does one track's pattern count and descriptor data change from 1 to 9 patterns?

Create:

| File | Action |
|------|--------|
| `probe_01_base.xy` | Empty-ish project. T1 has pattern 1 with one note and preset A. |
| `probe_01_t1_p2.xy` | Add T1 pattern 2. Use preset B. |
| `probe_01_t1_p3.xy` | Add T1 pattern 3. Use preset C. |
| `probe_01_t1_p4.xy` | Add T1 pattern 4. |
| `probe_01_t1_p9.xy` | Continue until T1 has 9 patterns. |

Why it matters:

- Confirms pattern-count bytes for T1.
- Exercises 9-pattern limit.
- Gives baseline data before multi-track complexity.

---

## Probe 02 - T2 Growth

Question: does T2 follow the same descriptor behavior as T1?

Create:

| File | Action |
|------|--------|
| `probe_02_base.xy` | T2 pattern 1 only, one note, preset A. |
| `probe_02_t2_p2.xy` | Add T2 pattern 2, preset B. |
| `probe_02_t2_p4.xy` | Continue until T2 has 4 patterns. |
| `probe_02_t2_p9.xy` | Continue until T2 has 9 patterns. |

Why it matters:

- `descriptor_encoding.md` treats T1/T2 specially.
- Confirms whether v56/v57 behavior differs by track.

---

## Probe 03 - T3+ Descriptor Body

Question: how are T3-T8 pattern counts encoded without T1/T2 involved?

Create:

| File | Action |
|------|--------|
| `probe_03_t3_p2.xy` | T3 has 2 patterns. |
| `probe_03_t4_p2.xy` | T4 has 2 patterns. |
| `probe_03_t8_p2.xy` | T8 has 2 patterns. |
| `probe_03_t3_t7_p2.xy` | T3 and T7 both have 2 patterns. |
| `probe_03_t3_p3_t7_p2.xy` | T3 has 3 patterns, T7 has 2 patterns. |

Why it matters:

- Confirms gap/maxslot body encoding.
- Tests mixed counts on T3+ tracks.

---

## Probe 04 - Mixed T1/T2/T3+ Topologies

Question: when T1 or T2 is active, how does the descriptor body change for higher tracks?

Create:

| File | Action |
|------|--------|
| `probe_04_t1_t3_p2.xy` | T1 and T3 each have 2 patterns. |
| `probe_04_t2_t3_p2.xy` | T2 and T3 each have 2 patterns. |
| `probe_04_t1_t2_t3_p2.xy` | T1, T2, T3 each have 2 patterns. |
| `probe_04_t1_p4_t3_p2.xy` | T1 has 4 patterns, T3 has 2. |
| `probe_04_t1_p2_t8_p4.xy` | T1 has 2 patterns, T8 has 4. |

Why it matters:

- Targets the collapsed branches already noted in the reference docs.
- Needed before any writer can safely create multi-pattern projects.

---

## Probe 05 - Preset Name Per Pattern

Question: can we reliably extract preset names per `(track, pattern)` body?

Create:

| File | Action |
|------|--------|
| `probe_05_preset_a.xy` | T1 pattern 1 uses preset `alpha` or a clearly identifiable factory preset. |
| `probe_05_preset_b.xy` | Same project, change only T1 pattern 1 preset to `bravo`. |
| `probe_05_t1_p2_different_preset.xy` | T1 pattern 1 uses preset A; T1 pattern 2 uses preset B. |
| `probe_05_copy_pattern.xy` | Copy T1 pattern 1 to pattern 2, then change only pattern 2 preset. |

Why it matters:

- Project UI needs preset label per pattern config.
- Helps locate and validate `patch_name` strings.

---

## Probe 06 - Scene Count Minimal

Question: where does scene count/list data change before we try decoding assignments?

Create:

| File | Action |
|------|--------|
| `probe_06_one_scene.xy` | One scene only. T1 pattern 1. |
| `probe_06_two_scenes_same.xy` | Add scene 2 without changing pattern choices. |
| `probe_06_three_scenes_same.xy` | Add scene 3 without changing pattern choices. |

Why it matters:

- Isolates scene count/list changes from pattern assignment changes.
- Builds on `scenes_songs.md` Track 16 findings.

---

## Probe 07 - Scene Pattern Assignment

Question: where is scene → track → pattern index stored?

Create:

| File | Action |
|------|--------|
| `probe_07_setup.xy` | T1 has patterns 1 and 2. T2 has patterns 1 and 2. Scene 1 uses all pattern 1. |
| `probe_07_scene2_t1p2.xy` | Add scene 2. Set only T1 to pattern 2. |
| `probe_07_scene2_t2p2.xy` | Same as previous, but set only T2 to pattern 2. |
| `probe_07_scene2_t1p2_t2p2.xy` | Scene 2 sets both T1 and T2 to pattern 2. |

Why it matters:

- Direct target for Projects tab scene matrix.
- Keeps note content and preset content constant.

---

## Probe 08 - Scene Assignment On Higher Tracks

Question: do higher tracks encode scene pattern assignment differently?

Create:

| File | Action |
|------|--------|
| `probe_08_setup.xy` | T7 and T8 each have patterns 1 and 2. Scene 1 uses pattern 1. |
| `probe_08_scene2_t7p2.xy` | Scene 2 sets T7 to pattern 2. |
| `probe_08_scene2_t8p2.xy` | Scene 2 sets T8 to pattern 2. |
| `probe_08_scene2_t7p2_t8p2.xy` | Scene 2 sets both T7 and T8 to pattern 2. |

Why it matters:

- Tests whether assignment storage is track-indexed uniformly.
- Helps distinguish scene bytes from descriptor bytes.

---

## Probe 09 - Missing/Changed Sample Reference

Question: how much of sample reference usage can be inferred from project bytes versus preset bytes?

Create:

| File | Action |
|------|--------|
| `probe_09_sample_a.xy` | Use a drum/sampler preset with a known sample filename. |
| `probe_09_sample_b.xy` | Same project, change preset/sample to a clearly different filename. |

Why it matters:

- Helps decide whether Projects can report sample refs directly or should rely on preset-region indexes.
- Useful for rename impact work.

---

## Probe 10 - Aux Tracks Read-Only Baseline

Question: what changes in T9-T16 when scenes are added but aux behavior is otherwise untouched?

Create:

| File | Action |
|------|--------|
| `probe_10_base.xy` | Simple T1 pattern, one scene. No intentional aux edits. |
| `probe_10_scene2.xy` | Add a second scene only. |
| `probe_10_mute_track.xy` | Toggle one track mute in scene if easy. |

Why it matters:

- `scenes_songs.md` notes Track 16 tail and T9-T16 rewrites.
- Lets us separate scene count from mute/mix state.

---

## Delivery Format

Put captured files in a folder like:

```text
reference_material/user_probes/2026-06-project-scenes/
```

Include a short `README.md` next to them:

```text
device firmware:
capture date:
probe files:
- probe_01_base.xy: T1 p1 only, preset A
- probe_01_t1_p2.xy: added T1 p2, preset B
notes:
```

The cleaner the capture notes, the faster we can diff and promote findings into `reference_material/xy-format/docs/format/`.
