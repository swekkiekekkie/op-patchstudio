# OP-XY MTP content structure (samples & presets)

Scope: **samples** and **presets** only. Projects (`.xy`) are handled separately.

## Reference material

| Repo | Scope | Use for this app |
|------|-------|------------------|
| **`reference_material/xy-format/`** | Reverse-engineers `.xy` project binaries | **Cross-links only** — engine IDs, sample-path strings inside projects, device limits. Not the MTP preset format itself. |
| **Device MTP scan** | Ground truth on connected unit | Actual `type` strings, filename patterns, folder layout |

This repo is a fork of [OP-PatchStudio](https://github.com/joseph-holland/op-patchstudio) (preset creation UI) extended with Electron + MTP device management.

See [Device vs OP-PatchStudio](#device-vs-op-patchstudio) and [xy-format cross-links](#xy-format-cross-links-projects).

---

## Device layout

```
OP-XY/
  samples/
    user/                         ← standalone recorded/imported samples
      {name}-{note}-{idx}.wav
  presets/
    {category}/                   ← organizational folder (drum, keys, snapshot, …)
      {name}.preset/              ← sample-based preset (folder)
        patch.json
        *.wav | *.aif
      {name}.json                 ← synth-only preset (single file; optional, not on all units)
```

From `how_to_import.txt` on the device:

- Only `presets/`, `projects/`, `samples/` at the root; subfolders allowed inside each.
- Allowed name chars: `a-z A-Z 0-9 space # - ( )` plus `.` for extensions.
- Samples: WAV and AIFF, mono or stereo.
- Sample-based presets are **folders** ending in `.preset`, containing `patch.json` + audio files.
- Standalone samples live in `samples/user/` when recorded on-device.

---

## MTP access notes (Windows)

- MTP has **no drive letter**. Access via Shell/WPD APIs.
- `$item.Size` is often **0** over MTP; use `$item.ExtendedProperty('System.Size')` instead.
- Copy-to-local-cache is reliable for parsing audio and JSON.

---

## Preset types (`patch.json` → `type` field)

Scanned 327 presets on a connected OP-XY:

| `type`     | Count | Has `regions` | Has audio | Notes |
|------------|------:|---------------|-----------|-------|
| `sampler`  | 231   | yes           | yes       | Multisample / snapshot presets on device |
| `drum`     | 44    | yes (24)      | yes       | Drum kits, kicks, snares, percussion, fx |
| `axis`     | 10    | no            | no        | Synth engine |
| `epiano`   | 10    | no            | no        | Synth engine |
| `organ`    | 9     | no            | no        | Synth engine |
| `prism`    | 8     | no            | no        | Synth engine |
| `dissolve` | 6     | no            | no        | Synth engine |
| `simple`   | 6     | no            | no        | Synth engine |
| `hardsync` | 2     | no            | no        | Synth engine |
| `wavetable`| 1     | no            | no        | Synth engine |

**Sample-management scope:** `drum` and `sampler` only. Synth-engine types have `regions: []`
and no audio files — parse for catalog/backup, but no sample renaming.

### Device vs OP-PatchStudio

| Aspect | On device | OP-PatchStudio generates |
|--------|-----------|--------------------------|
| Multisample type string | `"sampler"` | `"multisampler"` |
| Drum MIDI start | hikey 53 (F3) | hikey 53 (same) |
| Sample filenames | `{base}-{note}-{idx}.wav` | `{presetName}{sep}{KD1\|C3…}.wav` |
| `patch.json` formatting | minified single line | pretty-printed |

When parsing, treat `type === "sampler"` and `type === "multisampler"` as equivalent.

---

## `patch.json` top-level schema

All presets share this envelope (`version` is always `4` on observed device):

```jsonc
{
  "platform": "OP-XY",
  "version": 4,
  "type": "drum" | "sampler" | "axis" | …,
  "octave": number,
  "engine": { … },
  "envelope": { "amp": {…}, "filter": {…} },
  "fx": { "active": bool, "type": string, "params": number[8] },
  "lfo": { "active": bool, "type": string, "params": number[8] },
  "regions": [ … ]          // empty for synth-engine types
}
```

### `engine` (common fields)

```
bendrange, highpass, playmode, transpose, volume, width,
velocity.sensitivity, portamento.amount, portamento.type,
tuning.root, tuning.scale, params[8],
modulation.{aftertouch,modwheel,pitchbend,velocity}.{amount,target}
```

Internal values are 0–32767 (OP-PatchStudio converts to/from UI percentages).

---

## Sample-based regions

### Drum (`type: "drum"`)

- Exactly **24 regions** on observed kits (kicks/snares/drum categories use same layout).
- Each region maps one sample to one drum pad.

**Region fields (device):**

```
fade.in, fade.out, framecount, hikey, lokey, pan,
pitch.keycenter, playmode, reverse, sample, sample.end,
transpose, tune
```

Optional in OP-PatchStudio output but not seen on device presets:
`gain`, `sample.start`.

**Drum pad → MIDI mapping** (from OP-PatchStudio `DrumKeyboard.tsx`, verified on device):

| hikey | Note | Pad label | Keyboard |
|------:|------|-----------|----------|
| 53 | F3  | KD1 | A |
| 54 | F#3 | KD2 | W |
| 55 | G3  | SD1 | S |
| 56 | G#3 | SD2 | E |
| 57 | A3  | RIM | D |
| 58 | A#3 | CLP | R |
| 59 | B3  | TB  | F |
| 60 | C4  | SH  | G |
| 61 | C#4 | CH  | Y |
| 62 | D4  | CL1 | H |
| 63 | D#4 | OH  | U |
| 64 | E4  | CAB | J |
| 65 | F4  | LT1 | A (oct 1) |
| … | … | … | … |
| 76 | E5  | GUI | J (oct 1) |

On device presets: `hikey === lokey`, `pitch.keycenter === 60`, `framecount === sample.end === wav_frames`.

### Sampler / multisample (`type: "sampler"`)

Factory multisamples on device typically have **1 region**. Snapshots also use `sampler`.

**Region fields (device):**

```
framecount, hikey, lokey, pitch.keycenter, reverse, sample, sample.end, tune,
loop.start, loop.end, loop.onrelease, loop.crossfade
```

Snapshot presets may also include `gain` (observed: `gain: 1`).

OP-PatchStudio multisample regions additionally use:
`loop.enabled`, `sample.start`, and set last region `hikey: 127`.

**Key range semantics (multisample):**

- `pitch.keycenter` = root MIDI note of the sample.
- `lokey` / `hikey` = zone range (device single-sample presets: `lokey: 0`, `hikey: 60`).
- OP-PatchStudio builds multi-zone patches with ascending zones; last zone `hikey: 127`.

---

## Preset folder integrity rules

For every `.preset` folder with audio:

1. `patch.json` must exist.
2. Every `regions[].sample` filename must exist in the same folder.
3. No orphan WAVs observed (refs == files, always matched in samples checked).
4. **Renaming a sample** requires updating both the file and the `"sample"` field in `patch.json`.

---

## Audio file naming

### Inside `.preset` folders (device-native)

Pattern (regex):

```
^(?<base>.+)-(?<note>[a-g](?:#|b)?\d+)-(?<idx>\d+)\.(?<ext>wav|aif|aiff)$
```

Examples:

```
unnamed-f2-34.wav      base=unnamed  note=f2   idx=34
unnamed-c3-121.wav     base=unnamed  note=c3   idx=121
nt-bright piano-C3.wav  (OP-PatchStudio style — not seen on this device)
```

**Important:** The `note` in the filename is the **sample's recorded/root note**, not the drum
pad assignment. Drum pad assignment comes from `regions[].hikey`.

The `idx` suffix is a **device-assigned disambiguator** (not drum slot index). Values like
22, 23, 121, 150 appear — likely a global sample counter on the unit.

### Standalone samples (`samples/user/`)

Same parse pattern; `base` may contain spaces:

```
unnamed 1-g3-0.wav     base="unnamed 1"  note=g3   idx=0
wolterrr1-f3-0.wav     base=wolterrr1    note=f3   idx=0
```

`idx` distinguishes multiple takes of the same name+note (0, 1, …).

Renaming standalone samples only affects the file (no `patch.json`), but presets/projects
elsewhere may reference the old name if copied or linked internally.

---

## WAV / AIFF format (observed)

| Location | Sample rate | Bit depth | Channels |
|----------|------------|-----------|----------|
| Preset samples | 44100 Hz | 16-bit | mono or stereo |
| Standalone samples | 44100 Hz | 16-bit | mono or stereo |

- Standard RIFF/WAVE (`RIFF…WAVEfmt `).
- `framecount` in `patch.json` matches the WAV data chunk frame count when no trimming.
- OP-PatchStudio can embed SMPL loop metadata; device-recorded samples may or may not.

OP-PatchStudio reference for parsing/export: `reference_material/op-patchstudio/src/utils/audio.ts`,
`audioExport.ts`, `aifParser.ts`.

---

## Preset categories on device

Organizational only — does not affect parsing:

```
snapshot, 8faux8, bass, bells, brass, drum, fx, keys, kicks,
lead, organ, pad, percussion, pluck, snares, strings, synth, wind
```

`presets/snapshot/` holds saved snapshots (dated names like `2026-05-25 (1).preset`).

---

## Parsing strategy (recommended)

### 1. Enumerate

Walk `presets/` and `samples/` via MTP. Cache locally. Use extended size property.

### 2. Classify preset

```ts
function classifyPreset(patch: PatchJson): "sample-based" | "synth-engine" {
  return patch.regions?.length > 0 ? "sample-based" : "synth-engine";
}

function normalizeType(type: string): "drum" | "sampler" | "synth-engine" | string {
  if (type === "multisampler") return "sampler";
  if (type === "drum") return "drum";
  return type; // axis, prism, …
}
```

### 3. Parse sample-based preset

```ts
interface ParsedPreset {
  path: string;           // e.g. presets/drum/nt-classix.preset
  name: string;           // nt-classix
  category: string;       // drum
  type: "drum" | "sampler";
  patch: PatchJson;
  samples: ParsedSample[];
}

interface ParsedSample {
  filename: string;
  path: string;           // relative to preset folder
  parse: { base: string; note: string; idx: number; ext: string } | null;
  region: DrumRegion | SamplerRegion | null;  // matched by regions[].sample
  drumPad?: { hikey: number; label: string };  // drum only
}
```

Match regions to files by exact `sample` filename. For drum presets, attach pad label via
hikey → label table above.

### 4. Parse standalone sample

```ts
interface StandaloneSample {
  path: string;           // samples/user/…
  filename: string;
  parse: { base: string; note: string; idx: number };
}
```

### 5. Rename operation (atomic)

**Preset sample rename:**

1. Update `regions[].sample` in `patch.json` for affected region(s).
2. Rename WAV file in the same folder.
3. Optionally update `base` portion of filename while keeping `{note}-{idx}` or replacing
   with meaningful name (OP-PatchStudio style: `{presetName}-{KD1}.wav`).

**Standalone sample rename:**

1. Rename file only (preserve or intentionally change `{note}-{idx}` suffix).

---

## Reference files to reuse

### OP-PatchStudio

| File | Use |
|------|-----|
| `src/utils/patchGeneration.ts` | Region type definitions, drum/multisample generation logic |
| `src/components/drum/baseDrumJson.ts` | Default drum engine template |
| `src/components/multisample/baseMultisampleJson.ts` | Default sampler engine template |
| `src/components/drum/DrumKeyboard.tsx` | hikey 53–76 → pad label mapping |
| `src/utils/audio.ts` | `generateFilename()`, WAV metadata, sanitizeName |
| `src/utils/jsonImport.ts` | Engine settings merge/import |
| `src/utils/valueConversions.ts` | 0–32767 ↔ percentage |
| `src/utils/midi.ts` | Note name ↔ MIDI number |
| `how_to_import.txt` (on device) | Official folder rules and naming constraints |

### xy-format (project cross-links only)

| File | Use |
|------|-----|
| `docs/OP-XY_project_breakdown.txt` | High-level sample reference model in projects |
| `docs/reference/opxy_limits.md` | Device limits (24 drum slots, 20s max sample, etc.) |
| `xy/step_components.py` | Engine IDs (`0x03` drum, `0x1E` multisampler) |
| `xy/note_events.py` | Engine/preset taxonomy (separate from patch.json) |
| `docs/roadmap.md` | Open question: sample path encoding in `.xy` |

---

## xy-format cross-links (projects)

`xy-format` documents `.xy` binaries, not `patch.json`. Still relevant when renaming samples:

- **Sample paths in projects are plain ASCII strings** embedded in track block bodies
  (e.g. `content/samples/conga/lc boop.wav` — internal path prefix, not the MTP folder
  name you see in Explorer).
- **Paths may point into `presets/` as well as `samples/`** — not only `samples/user/`
  (`docs/OP-XY_project_breakdown.txt`, `xy-format` roadmap item #2 still open).
- **Drum tracks store a 24-entry sample path table** in the project binary; multisampler
  uses engine ID `0x1E`, drum uses `0x03` (`xy/step_components.py`).
- **Renaming a WAV inside a `.preset/` folder** is self-contained for `patch.json`, but
  may break any **project** that references that filename. Standalone `samples/user/` renames
  have the same project risk. Project parsing is out of scope here — see `xy-format`.

### Engine ID ↔ patch.json `type` (from xy-format)

| Engine | ID | Typical `patch.json` `type` |
|--------|---:|------------------------------|
| Drum | `0x03` | `drum` |
| EPiano | `0x07` | `epiano` |
| Prism | `0x12` | `prism` |
| Hardsync | `0x13` | `hardsync` |
| Dissolve | `0x14` | `dissolve` |
| Organ | (organ engine) | `organ` |
| Axis | `0x16` | `axis` |
| Multisampler | `0x1E` | `sampler` |
| Wavetable | (wavetable) | `wavetable` |

Note: `opxy_limits.md` lists drum slots as “MIDI 48–71”; **device `patch.json` and
OP-PatchStudio use hikey 53–76 (F3–E5)**. Trust the preset region data for pad mapping.

---

## Known gaps / open questions

- **`idx` suffix semantics:** Device counter, not pad index. Safe to preserve on rename.
- **Multi-zone sampler on device:** Factory presets are single-zone; OP-PatchStudio supports
  up to 24 zones — format is compatible but not yet observed multi-region on this unit.
- **Synth `.json` single-file presets:** Documented by TE, none found on this device.
- **Project cross-references:** Renaming preset/standalone samples is safe for `patch.json`
  integrity, but projects may embed the old filename as an ASCII path (xy-format, not yet fully decoded).
- **Internal vs MTP paths:** Project strings use prefixes like `content/samples/…`; MTP shows
  `samples/user/…`. Mapping between them is not fully documented.
