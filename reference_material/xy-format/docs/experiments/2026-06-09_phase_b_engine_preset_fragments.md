# 2026-06-09 Phase B Engine Preset Fragments

## Capture Set

Source directory:

`../user_probes/2026-06-phase-b/`

Firmware: OP-XY `1.1.4`.

The corpus is an engine sweep on Track 1. The user selected the first available
preset for each engine, then filled one or more bars with a repeated base note.

| Engine index | Engine | Preset |
|--------------|--------|--------|
| 1 | Axis | `nt-accord` |
| 2 | Dissolve | `nt-cold brew` |
| 3 | Drum | `nt-aeroplane` |
| 4 | EPiano | `nt-crowded` |
| 5 | Hardsync | `nt-cabin pressure` |
| 6 | Multisampler | `bandpasser` |
| 7 | Organ | `nt-castle vania` |
| 8 | Prism | `nt-blip tips` |
| 9 | Sampler | `nt-106 bass` |
| 10 | Simple | `nt-dunce cap` |
| 11 | Wavetable | `nt-tall drink` |

Important caveat from capture notes: some mid-series files were produced by
removing bars from a longer project, and re-added bars can retain prior note
data. Treat bar-length/note deltas as noisy for engines 3-6. Engines 1-2 and
7-11 are more orderly for bar-growth comparisons.

## App-Relevant Finding

The existing app/project parser could identify the active Track 1 logical entry
and engine for most files, but only drum presets had a directly usable preset
name. Drum bodies expose repeated sample paths:

`/fat32/presets/drum/nt-aeroplane.preset/...wav`

Non-drum engines instead store selected preset identity as short path fragments
inside the active track body. These fragments are usually preceded by byte
`0xF7`, and can be split by NUL bytes inside a word.

Examples:

| File | Raw-ish fragment | Reconstructed preset |
|------|------------------|----------------------|
| `b1-t1eng1bar2.xy` | `wind/nt-acc\0ord` | `nt-accord` |
| `b1-t1eng2bar1.xy` | `pad/nt-cold brew` | `nt-cold brew` |
| `b1-t1eng4bar1.xy` | `bell\0s/nt-crowded` | `nt-crowded` |
| `b1-t1eng5bar1.xy` | `synth/nt-cabin press\0ure` | `nt-cabin pressure` |
| `b1-t1eng7bar1.xy` | `organ/nt-castle vania` | `nt-castle vania` |
| `b1-t1eng8bar1.xy` | `pad/nt-blip tips` | `nt-blip tips` |
| `b1-t1eng10bar1.xy` | `synth/nt-dunce cap` | `nt-dunce cap` |
| `b1-t1eng11bar1.xy` | `synth/nt-tall\0 drink` | `nt-tall drink` |

Sampler uses a related NUL-fragmented absolute-ish path:

`/fat32/presets/bass\0/nt-106 bass\0\0preset/241204-1 2-c3-2.wav`

Multisampler factory `bandpasser` appears via repeated fragmented sample/preset
strings such as:

`content/samples/bandpass\0er/1.wav`

and:

`pad/bandpass\0er`

## Parser Guidance

For read-only project inspection, preset identity can be inferred without note
payload decoding:

1. Split the project into logical track/pattern bodies.
2. For active bodies, first scan full sample paths such as
   `/fat32/presets/<category>/<preset>.preset/...`.
3. If no strong sample-path hit exists, scan for preset/path fragments:
   - path marker `0xF7` followed by printable/NUL-split text;
   - embedded `nt-...` strings;
   - embedded `bandpass\0er` for the observed multisampler factory preset.
4. Reconstruct NUL-split fragments by joining adjacent printable parts until a
   double-NUL or non-path metadata byte.
5. Treat these synth/sampler hits as medium confidence when observed more than
   once, because they identify the preset but do not yet prove full path
   category semantics.

This finding explains why project UI cells previously showed `?` for synth
presets: entry and engine parsing were mostly working, but the name scanner was
drum/sample-path biased.

## Open Questions

- Decode exact path-fragment structure around `0xF7` instead of treating it as
  a heuristic marker.
- Generalize preset category mapping. Current observed categories include
  `wind`, `pad`, `bells` (split as `bell\0s`), `synth`, `organ`, and `bass`.
- Separate reliable bar-length/note-event findings from noisy captures where
  bars were removed after longer note data existed.
- Add deliberate F/F# alternates when available to isolate note bytes across
  engines.
