# OP-XY MTP Manager - Product Requirements and Application Flows

**Status:** Draft product requirements  
**Parent docs:** [design-direction.md](./design-direction.md), [data-tab-spec.md](./data-tab-spec.md), [projects-tab-spec.md](./projects-tab-spec.md), [presets-tab-spec.md](./presets-tab-spec.md), [samples-tab-spec.md](./samples-tab-spec.md)  
**Companions:** [ux-flow-map-and-traceability.md](./ux-flow-map-and-traceability.md), [compact-ui-ux-principles.md](./compact-ui-ux-principles.md), [mvp-screen-slices.md](./mvp-screen-slices.md), [product-decisions.md](./product-decisions.md)  
**Reference:** [reference_material/xy-format/docs/reference/opxy_limits.md](../reference_material/xy-format/docs/reference/opxy_limits.md), [reference_material/xy-format/docs/format/scenes_songs.md](../reference_material/xy-format/docs/format/scenes_songs.md), [structure.md](./structure.md)  
**Last updated:** 2026-06-08

---

## Product Thesis

The app is a **library operating system for OP-XY content**, not a note sequencer and not only a preset generator.

It should help the user:

1. Keep a clean, inspectable **PC source library** of samples and `.preset` folders.
2. Stage selected source samples and source presets into local swappable **sets**.
3. Assemble set samples into drum kits and sampler presets.
4. Curate multiple local sets so the device stays uncluttered.
5. Choose which preset configurations belong on instrument track pattern slots.
6. Arrange those pattern configurations into scenes.
7. Push only the active set to the OP-XY when the user is ready.

The key value is **reducing device clutter without losing creative continuity**. The app becomes the place where the user can maintain many possible libraries, then load one coherent set onto the hardware.

---

## Non-Goals

These are deliberately out of scope unless a later product decision changes them:

- Editing note events inside patterns.
- Piano-roll or step-sequencer note authoring.
- Full OP-XY song authoring before scene/song bytes are safely decoded.
- Replacing the OP-XY as a live performance surface.
- Treating synth-engine internals as editable before their patch schemas are understood.

Important wording: **patterns means preset configurations assigned to pattern slots**, not note patterns.

---

## Domain Model

### Core Objects

| Object | Meaning | User question it answers |
|--------|---------|--------------------------|
| Device | The connected OP-XY over MTP | What is currently on the hardware? |
| Source Library | One or more indexed PC folders containing candidate samples and `.preset` folders | What sounds and preset configs do I own on this computer, before they belong to a set? |
| Set | A complete local working library: presets, samples, projects, metadata, history | Which curated world am I working in? |
| Sample | A WAV/AIFF/MP3/etc. source or device-ready audio file | What is this sound, where is it used, and is it named cleanly? |
| Preset | A `.preset` folder containing a drum, sampler, multisampler, or synth config | What playable sound/config does this track use? |
| Region | A sample placement inside a sample-based preset | Which sample is mapped to which pad/key range? |
| Project | An `.xy` file with tracks, pattern slots, and scene/song state | How is this set used in actual OP-XY projects? |
| Track | OP-XY track T1-T16 | Which lane is using which pattern config? |
| Pattern Slot | A per-track slot, 1-9, that stores engine/preset configuration and note content | Which preset config is selected for this slot? |
| Scene | A project-level arrangement choosing pattern slots per track | Which preset configs play together? |

### OP-XY Limits To Respect

From the local OP-XY reference:

| Area | Limit |
|------|-------|
| Instrument tracks | 8 |
| Auxiliary tracks | 8 |
| Patterns per track | 9 |
| Scenes per project | 99 |
| Scenes per song | 96 |
| Drum sampler slots | 24 |
| Max sample length | 20 seconds |

The UI should make these limits visible as constraints, not hidden validation failures.

---

## Product Requirements

### Set Management

| ID | Requirement |
|----|-------------|
| SET-1 | The app must support multiple named local sets. |
| SET-2 | A set must be editable without the OP-XY connected. |
| SET-3 | Pull copies device content into the active set. |
| SET-4 | Push copies the active set onto the device after a preflight review. |
| SET-5 | Save as creates a new set instead of branching history inside one set. |
| SET-6 | Commit/history must preserve linear checkpoints for each set. |
| SET-7 | The UI must clearly distinguish device state from active-set state. |
| SET-8 | The user must be able to compare set contents at summary level before pushing. |

### Source Library

| ID | Requirement |
|----|-------------|
| LIB-1 | The app must support one or more indexed PC source folders. |
| LIB-2 | The source library must index both audio files and `.preset` folders. |
| LIB-3 | The app must list source-library assets separately from active-set assets. |
| LIB-4 | The user must be able to stage/copy selected source samples and source presets into the active set. |
| LIB-5 | Source preset import must preserve folder structure and sample references or surface conflicts before copy. |
| LIB-6 | The library tab must support sample-focused and preset-focused scopes without becoming two separate top-level tabs. |

### Set Samples

| ID | Requirement |
|----|-------------|
| SMP-1 | The app must list all samples in the active set, including standalone samples and preset-linked samples. |
| SMP-2 | Each sample must show format, duration, note/root parse, location, and usage count where known. |
| SMP-3 | The app must flag unnamed, duplicate, missing, orphaned, oversized, incompatible, or already-in-set samples. |
| SMP-4 | Sample rename must show affected presets and projects before apply. |
| SMP-5 | Batch rename must operate through a review queue, not immediate mutation. |
| SMP-6 | The user must be able to filter samples by source folder, set location, preset-linked, unused, missing, unnamed, and incompatible. |
| SMP-7 | Sample preview and waveform inspection must be available from both source-library and set/preset contexts. |

### Presets And Kits

| ID | Requirement |
|----|-------------|
| PRE-1 | The presets mode must include drum, sampler/multisampler, and synth preset categories. |
| PRE-2 | Sample-based presets must show every region and whether its referenced sample exists. |
| PRE-3 | Drum presets must expose the 24-pad region model. |
| PRE-4 | Sampler/multisampler presets must expose key zones, root notes, loop settings, and region sample files. |
| PRE-5 | Synth presets may be read-only catalog entries until edit support is known. |
| PRE-6 | Preset edit must live inside the presets mode, not as separate top-level drum/multisample tabs. |
| PRE-7 | Creating or editing a preset must update the active set first; pushing to device is a separate action. |
| PRE-8 | Preset duplication must preserve region/sample integrity and produce a clear rename opportunity. |
| PRE-9 | Active-set presets must be distinguishable from source-library presets that are available on the PC but not deployed to the set. |

### Project Pattern Configs

| ID | Requirement |
|----|-------------|
| PAT-1 | The projects mode must index per-track pattern slots 1-9. |
| PAT-2 | A pattern slot should show track number, pattern number, engine, preset label when available, bars, and content status. |
| PAT-3 | The app must treat pattern slots as **preset configuration containers**, not note-editing targets. |
| PAT-4 | The UI may display note count as metadata, but must not offer note editing. |
| PAT-5 | The user must be able to assign or inspect the preset config associated with a pattern slot when format support allows. |
| PAT-6 | If a pattern slot references a missing preset/sample, the UI must make the reference actionable. |

### Scenes

| ID | Requirement |
|----|-------------|
| SCN-1 | The projects mode must represent scenes as arrangements of track pattern choices. |
| SCN-2 | A scene view must show T1-T16 and the pattern slot selected for each track. |
| SCN-3 | Scene editing must start read-only until `.xy` scene mapping is verified. |
| SCN-4 | Scene/song loop, mute, and timeline authoring must remain gated behind format confidence. |
| SCN-5 | The app must distinguish scene arrangement from song sequencing. |

### Safety And Integrity

| ID | Requirement |
|----|-------------|
| SAFE-1 | Any operation that can break project or preset references must show impact before apply. |
| SAFE-2 | Push must include a summary of changed presets, changed samples, project-reference risks, and backup/commit status. |
| SAFE-3 | The app must never silently mutate device content while the user believes they are editing a local set. |
| SAFE-4 | Missing reference repair must be navigable from projects, presets, and samples. |
| SAFE-5 | Format-unknown areas must be shown as read-only or experimental, not hidden behind confident labels. |

---

## Application Flows

### Flow 1: Pull Device Into A Clean Set

```text
sets
  connect OP-XY
  pull device -> active set
  index presets / samples / projects
  show summary:
    presets count
    samples count
    projects count
    unnamed count
    missing refs
```

Success state:

- Active set mirrors device.
- Device and set panes agree on counts where measurable.
- User can continue offline.

### Flow 2: Add PC Source Folders

```text
library
  source scope
  add folder
  scan audio files and .preset folders
  index filename / format / duration / root-note hints / preset metadata
  filter/search source library
  select candidates
  stage to active set
```

Key UX requirement:

The PC source library is not the same thing as the active set. Source folders are broad and messy by nature; sets are curated, deployable subsets. Library scope must cover both raw samples and reusable preset folders, because both are assets the user may keep on the PC without loading onto the device.

### Flow 3: Curate Active-Set Samples And Presets

```text
library
  set scope
  filter: unnamed / unused / missing / incompatible
  inspect sample detail
  inspect preset folder metadata
  preview audio
  locate usage
  add to rename queue
  review impact
  apply rename to set
```

Key UX requirement:

The library tab is not only storage. It is a maintenance surface that helps the user understand sound identity, preset identity, usage, and risk.

### Flow 4: Build Or Repair A Drum Kit

```text
presets
  choose drum preset or create new
  open edit
  assign samples to 24 pads
  trim / gain / pan / reverse
  review regions
  save preset into active set
```

The user should always know:

- Which pad is selected.
- Which sample file backs that pad.
- Whether the sample is unique, reused, missing, unnamed, or too long.
- Whether saving changes the active set only or is ready to push.

### Flow 5: Build Or Repair A Sampler Preset

```text
presets
  choose sampler preset or create new
  open edit
  drop samples
  assign root notes / zones
  configure loop and envelope
  review regions
  save preset into active set
```

The flow should optimize for fast inspection and cleanup, not deep synthesis.

### Flow 6: Pick Preset Configs For Pattern Slots

```text
projects
  open project
  select track
  inspect pattern slots 1-9
  select pattern slot
  view engine + preset config
  choose replacement preset from active set (future write path)
  mark project dirty (future write path)
```

Out of scope:

- Editing notes inside the pattern.
- Drawing automation.
- Changing step components.

Allowed:

- Inspecting the slot.
- Showing note count as metadata.
- Selecting or repairing the preset/config reference once supported.

### Flow 7: Arrange Pattern Configs Into Scenes

```text
projects
  open project
  enter arrange view
  select scene
  view T1-T16 grid
  each track shows selected pattern slot
  each pattern slot shows preset/engine label
  edit only after scene mapping is format-safe
```

The scene matrix should help the user answer:

- What sound/config is playing on each track in this scene?
- Which scene uses an old or missing preset?
- Which tracks are empty, muted, auxiliary, or unknown?

### Flow 8: Push A Curated Set To OP-XY

```text
sets
  select set
  push
  preflight:
    changed presets
    changed samples
    changed projects
    missing refs
    destructive overwrite warning
    latest commit/backup
  confirm
  write set -> device
```

The push UX should feel routine and exact, not scary. The user should trust the active set as the source of truth.

---

## UX Architecture Implications

### Four User-Facing Modes

The shell should use full, task-oriented labels:

```text
sets -> projects -> presets -> library
```

Internal route names may lag behind this wording while the app is being refactored, but the product language should not.

But the conceptual center shifts:

```text
sets contain libraries
source libraries feed sets
sets contain samples and presets
projects consume presets and samples
scenes arrange project pattern configs
device receives one selected set
```

### Mode Responsibilities

| Mode | Responsibility |
|------|----------------|
| Sets | Device sync, active set selection, set history, push/pull preflight |
| Projects | Active-set project inspection, pattern config inventory, scene arrangement when decoded |
| Presets | Active-set preset inspection/editing, drum kit and sampler mapping |
| Library | PC/source asset library plus active-set asset maintenance for samples and `.preset` folders |

### Sets Are A Design Challenge

Sets must not become hidden folders. They need visible product affordances:

- Active set name always in the status strip.
- Sets mode shows device versus set as two different bodies.
- Every edit surface says whether changes are local-only.
- Presets/projects/library modes are scoped to the active set.
- Push preflight confirms that this set will replace or update the device library.

### Pattern Configs Need New Language

Avoid ambiguous labels like "edit pattern" because users will assume note editing.

Preferred labels:

- `pattern slot`
- `pattern config`
- `track pattern`
- `slot preset`
- `scene pattern choice`

Avoid:

- `note pattern editor`
- `piano roll`
- `sequence editor`

---

## Data Contracts To Design Toward

These are conceptual contracts for IPC/app state. They do not require implementation in this doc.

```ts
interface SetSummary {
  id: string;
  name: string;
  counts: {
    presets: number;
    samples: number;
    projects: number;
    missingRefs: number;
    unnamed: number;
  };
  dirty: boolean;
  lastPulledAt: string | null;
  lastPushedAt: string | null;
}

interface SampleSummary {
  path: string;
  filename: string;
  origin: 'source_folder' | 'active_set';
  location: 'source' | 'standalone' | 'preset';
  format: string;
  durationSeconds: number;
  rootNote: string | null;
  usageCount: number;
  flags: Array<'unnamed' | 'missing' | 'orphan' | 'duplicate' | 'incompatible' | 'too_long' | 'already_in_set'>;
}

interface SourceFolderSummary {
  id: string;
  path: string;
  label: string;
  sampleCount: number;
  presetCount: number;
  lastScannedAt: string | null;
  flags: Array<'missing_folder' | 'scan_failed'>;
}

interface SampleStageItem {
  sourcePath: string;
  targetRelativePath: string;
  action: 'copy_to_set' | 'skip' | 'replace_existing';
  flags: Array<'name_conflict' | 'incompatible' | 'too_long'>;
}

interface SourcePresetSummary {
  path: string;
  folderName: string;
  type: 'drum' | 'sampler' | 'multisampler' | 'synth' | 'unknown';
  origin: 'source_folder' | 'active_set';
  sampleRefs: string[];
  flags: Array<'missing_refs' | 'already_in_set' | 'name_conflict' | 'unsupported' | 'read_only'>;
}

interface PresetStageItem {
  sourcePath: string;
  targetRelativePath: string;
  referencedSamples: string[];
  action: 'copy_to_set' | 'skip' | 'replace_existing';
  flags: Array<'name_conflict' | 'missing_refs' | 'sample_conflicts' | 'unsupported'>;
}

interface PresetSummary {
  path: string;
  name: string;
  type: 'drum' | 'sampler' | 'multisampler' | 'synth';
  category: string;
  regionCount: number;
  sampleCount: number;
  flags: Array<'modified' | 'unnamed' | 'missing_refs' | 'read_only'>;
}

interface ProjectPatternConfig {
  projectPath: string;
  track: number;
  pattern: number;
  engine: string;
  presetName: string | null;
  presetPath: string | null;
  bars: number;
  noteCount: number;
  status: 'ok' | 'missing_preset' | 'unknown' | 'unsupported';
}

interface ScenePatternChoice {
  projectPath: string;
  scene: number;
  track: number;
  pattern: number;
  patternConfig: ProjectPatternConfig | null;
}
```

---

## Open Requirements Questions

1. Should a set include all projects, or can projects be shared across sets?
2. Should pushing a set replace the full OP-XY content tree or only changed files?
3. Does the user need a "staging set" that previews changes before committing?
4. Should sample rename preserve device-style `{note}-{idx}` suffixes by default?
5. What exact UI state should replace scene controls when scene data is undecoded?
6. What parser/writer evidence is required before pattern config assignment or scene editing becomes writable?
7. What is the minimum viable project index: pattern inventory only, or sample reference index too?
8. How should conflicts be resolved when two sets contain different versions of the same preset path?
9. Should source-library folder indexes be stored globally, per set, or both?
10. Should copying a source sample into a set preserve the original folder structure or flatten into `samples/user/`?
11. Should source samples be converted on transfer, or only flagged until used in a preset?
12. Should source preset folders be copied into the same relative category path, or staged into a user/imports area first?
13. Should a source preset import optionally copy its referenced samples, or require all referenced samples to be staged separately?

---

## Acceptance Criteria For The Product Direction

- [ ] User can explain the difference between device and active set after 30 seconds.
- [ ] User can explain the difference between PC source library and active set after 30 seconds.
- [ ] User can add a PC sample folder and stage selected samples into the active set.
- [ ] User can add a PC preset folder and stage selected `.preset` folders into the active set.
- [ ] User can find an unnamed sample and see every place it is used.
- [ ] User can assemble a drum kit or sampler preset without switching top-level modes.
- [ ] User can inspect a project and understand which preset config each track pattern slot uses.
- [ ] User can inspect a scene as a track-to-pattern-config matrix.
- [ ] User never sees note editing controls in project pattern workflows.
- [ ] User can push a curated set to the device with a clear preflight summary.
- [ ] Risky operations show impact before mutation.
