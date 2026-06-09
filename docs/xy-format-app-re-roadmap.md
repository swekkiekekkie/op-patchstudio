# App-Required `.xy` Reverse Engineering Roadmap

**Status:** Draft contribution plan  
**Purpose:** Identify the reverse-engineering work this app actually needs from `xy-format`, so probe projects and upstream contributions stay tied to product value.  
**Parent docs:** [product-requirements-and-flows.md](./product-requirements-and-flows.md), [projects-tab-spec.md](./projects-tab-spec.md), [xy-format-probe-projects.md](./xy-format-probe-projects.md)  
**Upstream reference:** [reference_material/xy-format/AGENTS.md](../reference_material/xy-format/AGENTS.md), [reference_material/xy-format/docs/roadmap.md](../reference_material/xy-format/docs/roadmap.md), [reference_material/xy-format/docs/format/track_blocks.md](../reference_material/xy-format/docs/format/track_blocks.md), [reference_material/xy-format/docs/format/scenes_songs.md](../reference_material/xy-format/docs/format/scenes_songs.md)  
**Last updated:** 2026-06-08

---

## Product Boundary

The app does **not** need note editing. It does need `.xy` project decoding far enough to:

1. Show which preset configuration each track/pattern slot uses.
2. Show which scenes choose which track/pattern slots.
3. Detect missing preset/sample references before set push.
4. Explain rename/import impact across projects.
5. Eventually write safe preset-config and scene assignment changes, without synthesizing note data.

Therefore, `xy-format` work should prioritize **project structure, pattern config metadata, scene assignment, and reference integrity** over piano-roll/event editing.

---

## Required Capability Ladder

| Level | App capability unlocked | `xy-format` capability needed | Write support? |
|-------|-------------------------|--------------------------------|----------------|
| R0 | Index projects and show basic project list | Container/header parse, no semantic decode beyond file validity | No |
| R1 | Pattern inventory grid: T1-T16 x P1-P9 occupancy | Reliable track/pattern descriptor parse for all tracks/topologies | No |
| R2 | Pattern config labels: engine + preset name per slot | Track-block engine ID and preset string extraction per `(track, pattern)` | No |
| R3 | Project reference index for preflight/rename | Project-level preset/sample reference extraction or stable bridge to preset indexes | No |
| R4 | Scene matrix: scene -> track -> pattern choice | Scene count/list and assignment decode | Read-only first |
| R5 | Safe preset-config replacement in a pattern slot | Scaffold-preserving writer for config metadata only; note bytes opaque | Yes, gated |
| R6 | Safe scene assignment editing | Branch-aware writer for scene assignment only; song/mute/loop bytes preserved | Yes, gated |

The app should ship read-only surfaces for R1-R4 as soon as decode confidence is good. R5-R6 should wait for corpus-backed tests and device validation.

---

## Priority 1 - Pattern Inventory For All Tracks

**App dependency:** Projects tab needs to show pattern slots as preset-configuration containers, not note patterns.

**Need from `xy-format`:**

- Parse active pattern count/occupancy for T1-T16.
- Distinguish empty, active, cloned, leader, and last pattern entries where known.
- Expose stable JSON/CLI output that the app can consume:

```ts
interface XYPatternSlotSummary {
  track: number;
  pattern: number;
  active: boolean;
  patternCount: number;
  engineId: number | null;
  typeByte: number | null;
  topologyStatus: 'known' | 'partial' | 'unsupported';
}
```

**Current upstream alignment:**

- `reference_material/xy-format/docs/roadmap.md` already prioritizes non-T1 multi-pattern topology hardening.
- Existing probe list items 01-04 are directly relevant.

**Contribution target:**

- Add or update `xy-format` tests using device-authored probe projects for T1/T2/T3+ topologies.
- Promote stable descriptor findings into `docs/format/descriptor_encoding.md` or related canonical docs.
- Add inspector/corpus output fields if missing.

**App behavior until complete:**

- Show partial pattern inventory with `unknown` slots.
- Do not allow pattern config writes.

---

## Priority 2 - Preset Config Label Per Pattern Slot

**App dependency:** Projects tab must answer “what sound/config is selected for this track pattern?”

**Need from `xy-format`:**

- Decode engine ID and preset string/path-ish label per active `(track, pattern)`.
- Confirm how labels differ between synth engines, drum, sampler, multisampler, MIDI, and “no preset”.
- Confirm whether copied patterns retain independent preset config regions or share/clone structures.

**Probe evidence needed:**

- Same project, same note, only preset changed.
- Same track with two patterns using different presets.
- Copied pattern followed by preset change on only the copy.
- Repeat across at least one synth, one drum kit, one sampler/multisampler, and one “no preset” case.

**Contribution target:**

- Extend `docs/format/track_blocks.md` preset string section from Track 1 examples to multi-track/multi-pattern evidence.
- Add fixture-backed parser tests that extract `(track, pattern, engine, preset_label)`.

**App behavior until complete:**

- Projects can show engine where known and `preset unknown` where not.
- Missing preset repair remains unavailable when label confidence is weak.

---

## Priority 3 - Project Reference Index For Push/Rename Safety

**App dependency:** Push preflight and rename impact need to know whether a project would break if a preset/sample is removed, renamed, or not included in a set.

**Need from `xy-format`:**

- Extract project references to preset names or preset/config labels robustly enough to match against active-set `.preset` folders.
- Determine whether sample filenames appear directly in `.xy` project bytes, or whether project sample impact should be inferred through selected presets only.
- Expose confidence with each reference:

```ts
interface XYReference {
  kind: 'preset' | 'sample';
  value: string;
  track?: number;
  pattern?: number;
  confidence: 'exact' | 'inferred' | 'unknown';
}
```

**Important product distinction:**

If `.xy` stores only preset/config labels and not sample filenames, sample rename impact should be computed through preset region indexes plus pattern/preset usage. That is acceptable, but it must be explicit.

**Contribution target:**

- Add a reference extraction report to `inspect_xy.py` or `corpus_lab.py`.
- Document direct-vs-inferred sample references in a canonical format doc.

**App behavior until complete:**

- Rename impact may list presets with confidence, while projects remain `pending index` or `inferred through presets`.

---

## Priority 4 - Scene Assignment Matrix

**App dependency:** Projects tab should show scenes as arrangements of pattern-config choices.

**Need from `xy-format`:**

- Decode scene count/list reliably.
- Decode scene -> track -> pattern assignment for T1-T16.
- Separate scene assignment from song loop/mute/timeline state.
- Preserve branch state and unknown bytes for round-trip safety.

**Current upstream status:**

- `docs/format/scenes_songs.md` identifies split storage in pre-track records and Track 16 control bytes.
- Scene count/list evidence exists, but full assignment schema remains open.

**Contribution target:**

- Add targeted scene assignment probes with one changed track at a time.
- Promote stable assignment offsets/schema into `docs/format/scenes_songs.md`.
- Add read-only parser output before any writer work.

**App behavior until complete:**

- Show `scene data unavailable` with pattern inventory.
- Never pretend to edit scenes from guessed bytes.

---

## Priority 5 - Config-Only Writers

**App dependency:** Later workflows may replace a preset config in a pattern slot or change scene pattern choices from the app.

**Need from `xy-format`:**

- Scaffold-preserving write paths that update only known config/assignment bytes.
- Round-trip unknown bytes unchanged.
- Device-validated fixtures for each supported topology.

**Non-goals for our app writer path:**

- Note insertion/deletion.
- Step component authoring.
- Full song timeline authoring.
- Free-form `.xy` synthesis without a device-authored scaffold.

**Contribution target:**

- Add strict writer APIs with explicit capability errors:

```py
set_pattern_preset(project, track, pattern, preset_label)
set_scene_track_pattern(project, scene, track, pattern)
```

- Add tests proving byte preservation outside the targeted known fields.
- Record device outcomes via `tools/corpus_lab.py record`.

**App behavior until complete:**

- UI remains read-only or `experimental` for writes.
- Any future write action must require preflight and backup.

---

## Probe Batch Priorities

The existing probe list is good but broad. For our app, capture in this order:

1. **Batch A: Pattern inventory topology**  
   Existing probes 01-04. Required for R1.

2. **Batch B: Preset label/config identity**  
   Existing probe 05, expanded across synth/drum/sampler/no-preset. Required for R2.

3. **Batch C: Scene assignment**  
   Existing probes 06-08. Required for R4.

4. **Batch D: Reference impact**  
   Existing probe 09 plus preset deletion/rename/set-missing cases. Required for R3.

5. **Batch E: Aux/mute/song guardrails**  
   Existing probe 10. Needed to avoid false scene conclusions.

---

## Contribution Hygiene

When adding to `xy-format`:

- Keep historical narrative in `docs/logs/*`.
- Promote stable rules to `docs/format/*`.
- Add fixture-backed tests for every parser/writer claim.
- Use `tools/corpus_lab.py record` for device pass/crash/untested outcomes.
- Keep unknown bytes opaque until decoded.
- Prefer read-only parser contribution before writer contribution.

---

## App Integration Contract

The app should consume `xy-format` through a narrow intermediate JSON shape, not raw parser internals:

```ts
interface XYProjectIndex {
  projectPath: string;
  parseStatus: 'ok' | 'partial' | 'unsupported' | 'error';
  patterns: XYPatternSlotSummary[];
  references: XYReference[];
  scenes: Array<{
    scene: number;
    label?: string;
    choices: Array<{ track: number; pattern: number | null; confidence: 'exact' | 'unknown' }>;
  }>;
  warnings: string[];
}
```

This lets the app display partial knowledge cleanly while `xy-format` continues to improve.
