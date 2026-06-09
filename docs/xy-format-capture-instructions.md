# OP-XY `.xy` Capture Instructions For App-Required RE

**Status:** User capture checklist  
**Purpose:** Exact projects to create on the OP-XY so we can inspect `.xy` files and contribute useful findings to `xy-format`.  
**Related:** [xy-format-app-re-roadmap.md](./xy-format-app-re-roadmap.md), [xy-format-probe-projects.md](./xy-format-probe-projects.md)  
**Last updated:** 2026-06-08

---

## Golden Rules

These rules matter more than musical usefulness.

1. Start every batch from a fresh empty project.
2. Keep tempo at 120 BPM.
3. Use only one short note unless the step says otherwise.
4. Put the note on step 1 / page 1 whenever possible.
5. Do not add automation, punch-in effects, step components, mutes, song mode, or scene changes unless the step says so.
6. After each listed edit, save/pull/export a new `.xy` file before making the next edit.
7. Keep a text note with the exact preset names you selected.

The notes are only anchors that force the OP-XY to serialize a pattern. We are not reverse engineering note editing for this app.

---

## Folder To Deliver

Put files here:

```text
reference_material/user_probes/2026-06-app-required/
```

Include:

```text
README.md
01_t1_p1.xy
02_t1_p2.xy
...
```

README template:

```text
device firmware:
capture date:

preset names used:
- preset A:
- preset B:
- preset C:
- drum preset:
- sampler preset:
- synth preset:

notes:
- Any deviations from the instructions.
```

---

## Preset Choices

Pick presets that are easy to recognize in a hex/string dump.

Best case:

- Make or use short custom preset names:
  - `aa`
  - `bb`
  - `cc`
  - `dd`

Good enough:

- Use factory presets with clearly different names.
- Write the exact names in `README.md`.

For Batch B, use:

- One synth preset.
- One drum preset.
- One sampler/multisampler preset.
- One “no preset” or initialized/default sound if the OP-XY makes that available.

---

## Batch A - Pattern Inventory Topology

This is the first batch to create. It tells us how track/pattern occupancy is encoded.

### A1 - Track 1 Pattern Growth

Start from a fresh empty project.

| File | Exact project state |
|------|---------------------|
| `a01_t1_p1.xy` | T1 pattern 1 only. Select preset A. Add one note on step 1. |
| `a02_t1_p2.xy` | Add T1 pattern 2. Select preset B on pattern 2. Add one note on step 1. |
| `a03_t1_p3.xy` | Add T1 pattern 3. Select preset C on pattern 3. Add one note on step 1. |
| `a04_t1_p9.xy` | Continue until T1 has patterns 1-9. Use any presets, but record if you change them. Each pattern gets one note on step 1. |

Do not touch T2-T16.

### A2 - Track 2 Pattern Growth

Fresh empty project.

| File | Exact project state |
|------|---------------------|
| `a05_t2_p1.xy` | T2 pattern 1 only. Preset A. One note on step 1. |
| `a06_t2_p2.xy` | Add T2 pattern 2. Preset B on pattern 2. One note on step 1. |
| `a07_t2_p9.xy` | Continue until T2 has patterns 1-9. One note on step 1 in each pattern. |

Do not touch T1 or T3-T16.

### A3 - Higher Track Pattern Growth

Fresh empty project.

| File | Exact project state |
|------|---------------------|
| `a08_t3_p2.xy` | T3 has patterns 1-2. One note on step 1 in each. |
| `a09_t8_p2.xy` | Starting from `a08` is OK only if you save first. Add T8 patterns 1-2. One note on step 1 in each. |
| `a10_t3_p3_t8_p2.xy` | Add T3 pattern 3. T8 still has patterns 1-2. |

If modifying from `a08` is confusing, use fresh projects for each file and note that in the README.

---

## Batch B - Preset Label Per Pattern

This is the most important batch for the app’s “pattern config” concept.

### B1 - Same Pattern, Only Preset Changes

Fresh empty project.

| File | Exact project state |
|------|---------------------|
| `b01_t1_p1_preset_a.xy` | T1 pattern 1. Preset A. One note on step 1. |
| `b02_t1_p1_preset_b.xy` | Same project as `b01`, change only T1 pattern 1 preset to preset B. Do not change the note. |
| `b03_t1_p1_preset_c.xy` | Same project, change only T1 pattern 1 preset to preset C. |

Goal: isolate where preset name/config changes live.

### B2 - Two Patterns, Different Presets

Fresh empty project.

| File | Exact project state |
|------|---------------------|
| `b04_t1_p1a_p2b.xy` | T1 pattern 1 uses preset A. T1 pattern 2 uses preset B. One note on step 1 in both. |
| `b05_t1_p1a_p2c.xy` | Same project as `b04`, change only T1 pattern 2 preset from B to C. |

Goal: prove whether preset config is per-pattern, not only per-track.

### B3 - Engine Families

Fresh empty project per file is fine.

| File | Exact project state |
|------|---------------------|
| `b06_synth_preset.xy` | T1 pattern 1 uses a synth preset. One note on step 1. |
| `b07_drum_preset.xy` | T1 pattern 1 uses a drum preset. One note/trigger on step 1. |
| `b08_sampler_preset.xy` | T1 pattern 1 uses a sampler or multisampler preset. One note on step 1. |
| `b09_no_preset.xy` | T1 pattern 1 uses no preset/default/init if available. One note on step 1. |

Record the exact preset/engine names.

---

## Batch C - Scene Assignment Matrix

This batch directly supports the app’s future scene grid.

### C1 - Scene Count Only

Fresh empty project.

| File | Exact project state |
|------|---------------------|
| `c01_one_scene.xy` | T1 pattern 1 only. One scene. |
| `c02_two_scenes_same.xy` | Add scene 2. Do not change any pattern choices. |
| `c03_three_scenes_same.xy` | Add scene 3. Do not change any pattern choices. |

Goal: isolate scene count/list bytes from assignment bytes.

### C2 - One Track Assignment Change

Fresh empty project.

Initial setup:

- T1 has patterns 1 and 2.
- T2 has patterns 1 and 2.
- Each pattern has one note on step 1.
- Scene 1 uses pattern 1 for both T1 and T2.

| File | Exact project state |
|------|---------------------|
| `c04_scene_setup.xy` | Setup above. Scene 1 uses T1 P1 and T2 P1. |
| `c05_scene2_t1p2.xy` | Add scene 2. Set only T1 to pattern 2. T2 stays pattern 1. |
| `c06_scene2_t2p2.xy` | From `c04` setup if possible. Add scene 2. Set only T2 to pattern 2. T1 stays pattern 1. |
| `c07_scene2_t1p2_t2p2.xy` | Scene 2 sets both T1 and T2 to pattern 2. |

If returning to `c04` setup is annoying on-device, create fresh projects for `c06` and `c07`, but note it.

---

## Batch D - Reference / Missing Asset Impact

This is for push preflight and library integrity.

### D1 - Project Uses Different Presets

Fresh empty project.

| File | Exact project state |
|------|---------------------|
| `d01_project_preset_a.xy` | T1 pattern 1 uses preset A. One note on step 1. |
| `d02_project_preset_b.xy` | Same project, change only T1 pattern 1 to preset B. |

### D2 - Sample-Based Preset

Fresh empty project.

| File | Exact project state |
|------|---------------------|
| `d03_drum_known_sample.xy` | T1 pattern 1 uses a drum preset with a sample name you can identify. One trigger on step 1. |
| `d04_sampler_known_sample.xy` | T1 pattern 1 uses a sampler/multisampler preset with a sample name you can identify. One note on step 1. |

Also include the `.preset` folder(s) for those presets if easy, because then we can compare project bytes against preset `patch.json`.

---

## Minimum Useful Delivery

If you only want to do one short session, create these first:

```text
a01_t1_p1.xy
a02_t1_p2.xy
a05_t2_p1.xy
a06_t2_p2.xy
b01_t1_p1_preset_a.xy
b02_t1_p1_preset_b.xy
b04_t1_p1a_p2b.xy
b05_t1_p1a_p2c.xy
c01_one_scene.xy
c02_two_scenes_same.xy
c04_scene_setup.xy
c05_scene2_t1p2.xy
README.md
```

This minimum set already helps with:

- pattern count/occupancy,
- preset config location,
- per-pattern preset identity,
- scene count,
- first scene assignment diff.

---

## What Not To Do Yet

Skip these for now:

- Complicated melodies.
- Step components.
- Parameter locks.
- Automation.
- Song mode timelines.
- Mutes.
- Aux send/mix changes.
- Many tracks at once.

Those are useful later, but they make the first app-required questions harder to answer.
