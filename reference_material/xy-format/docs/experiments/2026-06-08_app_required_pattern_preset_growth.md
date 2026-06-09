# 2026-06-08 App-Required Pattern Preset Growth

## Capture Set

Source directory:

`../user_probes/2026-06-app-required/projects/`

The app probe corpus contains 36 device-authored `.xy` files:

- `a1-t1-p1.xy` ... `a1-t1-p9.xy`
- `a2-t2-p1.xy` ... `a2-t2-p9.xy`
- `a3-t3-p1.xy` ... `a3-t3-p9.xy`
- `a4-t4-p1.xy` ... `a4-t4-p9.xy`

User procedure:

- Created identical drum presets `pp`, `qq`, `rr`, `ss`, `tt`, `uu`, `vv`,
  `ww`, `xx`.
- For each family `aN-tN`, added one step-1 note on patterns P1 through P9.
- Pattern P1 uses preset `pp`, P2 uses `qq`, and so on through P9 using `xx`.
- Families isolate the target track: A1/T1, A2/T2, A3/T3, A4/T4.

These files target app requirements: inspect which preset folders are assigned
to each project track/pattern without needing note-pattern editing.

## Corpus Index

Command:

```sh
python tools/corpus_lab.py index --append --glob "../user_probes/2026-06-app-required/projects/*.xy"
```

Result:

- `files: 229`
- `entries: 4271`
- `parse ok: 229`
- `parse errors: 0`

The corpus extractor maps all app probe files without parse failures.

## Size and Logical Entry Growth

Each family starts at 16 logical entries in P1 and reaches 24 logical entries
at P9. The added entries are the target track's extra pattern bodies.

| Family | P1 size | P9 size | P1 entries | P9 entries | P9 active entries |
|--------|---------|---------|------------|------------|-------------------|
| A1/T1 | 10027 | 27904 | 16 | 24 | T1 P1-P9 |
| A2/T2 | 10455 | 28333 | 16 | 24 | T2 P1-P9 |
| A3/T3 | 11828 | 29708 | 16 | 24 | T3 P1-P9 |
| A4/T4 | 11758 | 29638 | 16 | 24 | T4 P1-P9 |

After P2, each added pattern increases file size by 2234 bytes in all four
families. P1-to-P2 also includes descriptor/pre-track growth:

| Family | P1 -> P2 size delta | P1 -> P2 pre-track delta |
|--------|----------------------|--------------------------|
| A1/T1 | +2239 | +5 |
| A2/T2 | +2240 | +6 |
| A3/T3 | +2242 | +8 |
| A4/T4 | +2242 | +8 |

## Logical Entry Mapping

At P9, the active 9-pattern track is cleanly isolated by family:

```sql
SELECT f.name,e.track,COUNT(*) AS entries,MIN(e.pattern),MAX(e.pattern),
       MIN(e.pattern_count),MAX(e.pattern_count),SUM(e.active)
FROM files f JOIN entries e ON e.file_id=f.id
WHERE f.name LIKE 'a_-t_%-p9.xy'
GROUP BY f.name,e.track
HAVING entries>1 OR SUM(e.active)>0
ORDER BY f.name,e.track;
```

Result:

| File | Track | Entries | Pattern range | Pattern count | Active entries |
|------|-------|---------|---------------|---------------|----------------|
| `a1-t1-p9.xy` | T1 | 9 | P1-P9 | 9 | 9 |
| `a2-t2-p9.xy` | T2 | 9 | P1-P9 | 9 | 9 |
| `a3-t3-p9.xy` | T3 | 9 | P1-P9 | 9 | 9 |
| `a4-t4-p9.xy` | T4 | 9 | P1-P9 | 9 | 9 |

All active entries are drum engine entries (`engine_id=0x03`) with
`type_byte=0x07`. P1-P8 bodies are 2230 bytes; P9 is 2231 bytes.

Adjacent same-family diffs show:

- Adding each new pattern creates one new logical entry for the target track.
- Existing target-track entries update `pattern_count` to the new count.
- The previous last pattern body usually shrinks from 2231 to 2230 when a new
  last pattern is appended.
- Subsequent baseline track ordinals shift by one.

## Preset Folder References

The selected drum preset folder is recoverable from each active pattern body
without decoding note payloads. Each active pattern body contains 24 repeated
references to the selected preset folder, one per drum region/sample slot.

Extractor used for this observation:

```python
folder_seed = re.compile(rb"/fat32/presets/(?:drum|synth|multi|sample)/[\x20-\x7e]{1,80}")
```

For P9 captures:

| Pattern | Folder seed | Hits per active body |
|---------|-------------|----------------------|
| P1 | `/fat32/presets/drum/pp` | 24 |
| P2 | `/fat32/presets/drum/qq` | 24 |
| P3 | `/fat32/presets/drum/rr` | 24 |
| P4 | `/fat32/presets/drum/ss` | 24 |
| P5 | `/fat32/presets/drum/tt` | 24 |
| P6 | `/fat32/presets/drum/uu` | 24 |
| P7 | `/fat32/presets/drum/vv` | 24 |
| P8 | `/fat32/presets/drum/ww` | 24 |
| P9 | `/fat32/presets/drum/xx` | 24 |

This holds for all four families: T1, T2, T3, and T4.

Full contiguous sample paths are not yet emitted by `corpus_lab`: in these
captures the printable runs split around the `.preset/...wav` boundary when
viewed naively. For app-level inspection, the stable folder seed is already
enough to display "Track N / Pattern M uses preset folder X" for drum presets.

## App-Relevant Conclusions

1. Track/pattern preset assignment is visible at the project-entry level.
   The app does not need note-pattern decode to inspect the preset used by a
   track pattern.
2. The existing container and corpus logical-entry extraction are sufficient
   to enumerate active track/pattern bodies for T1-T4 up to nine patterns.
3. Drum preset folder inference can be implemented as a conservative scanner
   over active body bytes:
   - search for `/fat32/presets/<kind>/<name>` folder seeds;
   - group repeated hits by unique seed;
   - treat 24 matching hits as strong drum-preset evidence;
   - preserve raw hit counts/confidence in parser output.
4. Exact note payload decode remains useful for xy-format completeness, but it
   is not a blocker for the app's planned project/preset inspection workflow.

## Open Format Questions

- The exact separator around `.preset/...wav` should be decoded so the parser
  can emit full sample paths instead of folder seeds.
- Synth/multi/sample preset captures still need equivalent folder-reference
  checks before generalizing beyond drum presets.
- This corpus covers tracks T1-T4 only. App parser output should mark T5-T8
  support as unverified until analogous captures exist.
