# OP-XY MTP Manager — Design Direction

**Status:** Approved direction (principles locked; detailed screens TBD)  
**Supersedes:** Three-tab shell (`device` / `drum` / `multisample`) as primary navigation  
**Companion doc:** [ui-ux-audit.md](./ui-ux-audit.md) — current-state inventory  
**Last updated:** 2026-06-06

---

## Executive summary

The app is **not** a prettier PatchStudio fork. It is a **four-mode OP-XY companion** — a small operating system for the local device cache — with object-first information architecture, monochrome hardware-inspired visuals, and rename safety as a first-class system feature.

**Do not:** polish rounded cards, keep Carbon on one tab and custom styling on another, or treat drum/multisample as peer top-level modes.

**Do:** flatten navigation into four physical mode keys, unify presets (including synth catalog), deep-link projects ↔ samples ↔ presets, and embed editors inside preset detail — not as separate app tabs.

---

## Ten principles (commit before pixel work)

| # | Principle |
|---|-----------|
| 1 | Four object modes only: **data**, **projects**, **presets**, **samples** |
| 2 | No separate drum / multisample top-level tabs |
| 3 | **Presets** are the central creative object |
| 4 | **Projects** exist to explain references and rename impact |
| 5 | **Samples** are the atomic cleanup / inspection layer |
| 6 | Bottom tabs are physical mode keys, not app navigation pills |
| 7 | One monochrome design system — no Carbon / custom hybrid |
| 8 | Batch rename + impact preview are core UX, not bolt-on warnings |
| 9 | Typography does half the work: grotesk for UI, mono for data |
| 10 | UI feels like a small OS for the OP-XY cache, not a desktop utility |

---

## Information architecture

### Mode hierarchy

```
data  →  projects  →  presets  →  samples
```

Operational flow: sync & inspect storage → understand project refs → work on presets → fix atomic samples.

### Mode map (logical routes)

Even without URL routing initially, think in these paths:

```
/data
  sync              — pull, push, connection
  cache             — counts, storage map
  backups           — list, restore
  change-review     — preflight before push

/projects
  list              — searchable index
  detail            — sample refs for one .xy
  ref → navigate    — jump to preset or sample

/presets
  list              — all preset types including synth
  detail            — overview | regions | edit
  editor            — drum grid / zone keyboard / synth catalog

/samples
  list              — user + preset-linked views
  detail            — metadata, refs, preview
  rename-queue      — batch unnamed cleanup
```

### What disappears from top level

| Current | Future |
|---------|--------|
| `device` tab (long mixed page) | **`data`** mode — operational only |
| `drum` tab | Preset detail → **edit** submode (drum grid) |
| `multisample` tab | Preset detail → **edit** submode (zone keyboard) |
| Projects section under device | **`projects`** mode |
| Standalone samples section under device | **`samples`** mode |
| PresetBrowser + inline PresetInspector | **`presets`** list + dedicated detail surface |

Opening a preset **does not switch top-level mode**. Breadcrumb stays in presets:

```text
presets / drum / clean kit
presets / drum / clean kit / edit
```

---

## Global shell

### Layout

```text
┌───────────────────────────────┐
│ op–xy mtp                     │
│ connected · cache 14:32       │  ← compact status strip (not marketing header)
├───────────────────────────────┤
│                               │
│ active mode content           │
│ dense grid / list / inspector │
│                               │
├───────┬───────┬───────┬───────┤
│ data  │ proj  │ pre   │ smp   │  ← bottom mode keys, 25% width each
└───────┴───────┴───────┴───────┘
```

- Remove large title + subtitle block.
- Status strip: connection, dirty count, last cache sync time (mono).
- Bottom tabs **always visible** (including inside preset detail / edit).
- Active tab color = **entire screen background**, flush to tab — tab is the material source.

### Bottom mode keys

| Mode | Label | Background | Text |
|------|-------|------------|------|
| data | `data` | `#151719` | off-white |
| projects | `proj` | `#33383b` | off-white |
| presets | `pre` | `#8a9092` | black |
| samples | `smp` | `#e8e9e7` | black |

Each mode has its own contrast rules. Do not brighten all tabs equally.

**Tab chrome rules:**
- Bottom-mounted, square, no outlines, no rounded pills
- No icon-first mobile cliché
- Each tab = physical plate
- Width: 25% each (square-ish when viewport allows)

### Visual system rules

| Rule | Value |
|------|-------|
| Grid unit | 8px |
| Major cell height | 64px or 88px |
| Borders | 1px, current text @ 12–18% opacity |
| Border radius | 0 (max 2px input focus) |
| Shadows | none |
| Cards | **only** for removable/modal surfaces — not default layout |
| Icons | almost none — labels and glyph-like marks |
| Animation | material transitions 120–180ms, no theatrics |
| Status color | monochrome first; tiny red dot for rare destructive/ error |
| Empty states | terse, device-like |

**Replace:** soft containers → flat slabs, grid lines, short labels, precise density.

Reference: OP-XY hardware grammar — black anodized base, four grayscale encoders (black → white ombré), tactile grid, small dense displays, nearly monochrome UI.

---

## Typography

| Role | Faces (preference order) |
|------|--------------------------|
| UI labels | **Inter** or **Geist Sans** (open-source); aspirational: Neue Haas Grotesk, Suisse Int'l, ABC Diatype |
| Data values | **Geist Mono**, IBM Plex Mono, Roberto Mono, Berkeley Mono |

**Rules:**
- Interface labels: lowercase grotesk, tight, calm
- File paths, counts, timestamps, note ranges, file sizes: **mono**
- Actions: lowercase, no title case
- No decorative headings

Example:

```text
presets
275 total · 44 modified · 91 unnamed

filter
[ all ] [ drum ] [ sampler ] [ synth ] [ unnamed ]
```

Copy tone: device-like, not SaaS.

```text
no cache

connect op–xy over usb
then pull device data

[pull]
```

Not: "Connect your OP-XY via USB, unlock, then refresh."

---

## Component system (target)

Replace mixed Carbon + PatchStudio with a small internal kit:

```text
AppShell
ModeTabs
StatusStrip
ObjectList
ObjectInspector
CommandStrip
MetricCell
SegmentControl
MonoInput
RefList
WaveformCell
ConfirmSheet
ToastLine
```

Build shell + list/inspector/command patterns **first**. Do not restyle every domain widget before the system exists.

---

## Mode 1: data

**Job:** What is connected? What is local? What is dirty? What can I safely do?

Not a homepage. Operational cockpit.

### Status grid (top)

Four metric cells:

```text
device        connected
cache         275 presets · 421 samples
projects      12 indexed · 340 refs
changes       44 modified
```

### Action grid

Four square hardware-key buttons:

```text
[pull] [push] [backup] [restore]
```

### Push UX (replace scary modal)

Preflight panel, not blocking modal every time:

```text
push to op–xy
44 changed presets
3 renamed samples used in projects
backup will be created first

[review changes] [push]
```

Honest about full-cache overwrite and session-only dirty state (see audit). `review changes` opens change-review subview.

### Cache map (OP-XY display style)

Vertical bars or block matrix — not colorful dashboard:

```text
cache map
presets  █████████████░░
samples  █████████░░░░░░
projects ███░░░░░░░░░░░░
dirty    ██░░░░░░░░░░░░░
```

### Subviews

- **sync** — pull/push, connection detail
- **cache** — map, paths, counts
- **backups** — list, restore
- **change-review** — diff summary before push (future: per-preset list)

---

## Mode 2: projects

First-class mode. Determines rename safety. Not buried under data.

### List

```text
projects
12 files · 340 sample refs

[ search projects / sample refs ]

01  ambient sketch.xy       42 refs
02  club tool 07.xy         18 refs
03  broken clouds.xy        31 refs
```

### Detail inspector

```text
ambient sketch.xy

sample refs
kick clean c2 01.wav      found · preset: drums/clean kit
hat noise f#3 04.wav      missing
texture long a2.wav       found · samples/user
```

**Critical:** every ref is **actionable** — click → jump to sample or preset. Fixes audit gap: projects currently informational only.

Visual: reference index. Not complex. No cards.

---

## Mode 3: presets

Central library + creative mode. **All preset types** visible including synth (axis, prism, …) — fixes audit gap where synth presets are invisible.

### List

```text
presets
275 total · 91 unnamed · 44 modified

[ all ] [ drum ] [ synth ] [ sampler ] [ multisampler ]
[ search presets......................]

drum
  001 clean kit        24 regions · modified
  002 tape kit         18 regions · unnamed 04

sampler
  041 glass key        12 regions
```

Grouped by category folder. Segment filters include **synth**.

### Detail (dedicated surface — not cramped inline inspector)

Breadcrumb: `presets / drum / clean kit`

Three submodes (segment control):

```text
[overview] [regions] [edit]
```

**Overview:**

```text
clean kit
drum preset
24 regions · 0 missing · 4 project refs
modified 14:32

[open editor] [rename] [duplicate] [export]
```

**Regions:**

```text
01  kd1   kick clean c2 01.wav    C2   00:01.2
02  sd1   snare room d2 02.wav    D2   00:00.8
03  ch1   unnamed f#2 03.wav      F#2  00:00.4
```

**Edit** (type-specific):
- Drum → pad grid (reuse DrumKeyboard logic)
- Sampler / multisampler → zone keyboard
- Synth → catalog + metadata; edit only when supported

### Selection + command strip

```text
selected: clean kit

[preview] [edit] [rename] [duplicate] [delete]
```

In regions submode, selection is a **region/sample row**:

```text
selected: unnamed f#2 03.wav

[play] [rename] [show refs]
```

### Editor embedding

`edit` submode replaces top-level drum/multisample tabs. Same underlying patch generation + cache write, new navigation context.

Remove: `CacheEditorContextBar`, "back to device", tab switch on open.

Keep: sibling preset switching via breadcrumb or list overlay, not a separate product tab.

---

## Mode 4: samples

Atomic file layer. Independent of presets.

### List

```text
samples
421 total · 37 unnamed · 8 missing refs

[ all ] [ user ] [ preset-linked ] [ unused ] [ missing ]
[ search ]

kick clean c2 01.wav      used 4x
hat short f#3 03.wav      used 1x
field noise a2.wav        user
```

### Detail

```text
field noise a2.wav

location      samples/user
duration      00:04.281
format        wav · 16 bit · 44.1k
used in       3 projects · 1 preset
status        clean

[preview] [rename] [locate refs]
```

### Rename queue (batch cleanup)

System-level, not per-preset bulk rename:

```text
rename queue
37 unnamed samples found

[generate names] [review queue] [apply]
```

---

## Rename safety (system feature)

Any rename shows impact preview:

```text
rename sample

old
unnamed f#2 03.wav

new
hat closed f#2 03.wav

affected
2 presets
3 projects
0 missing refs

[apply rename]
```

Batch:

```text
rename queue

37 changes
12 project refs affected
1 conflict

[review conflicts] [apply all]
```

This is core product value — compact, exact, no fluff. Warnings become structured previews.

Backend already has partial support (`getRenameImpact`, project index). UI should unify across presets, samples, and queue.

---

## Interaction model

**Selection + command strip** everywhere (OP-XY-like):

1. User selects object in list or grid
2. Command strip shows valid operations for selection + mode
3. No scattered one-off action buttons

Navigation:

- Bottom modes = object class
- Breadcrumb = depth within mode
- No huge "back" buttons

---

## Migration from current app

| Current artifact | Disposition |
|------------------|-------------|
| `DevicePage` | Split → `data` + list data feeds other modes |
| `PresetBrowser` / `PresetInspector` | → `presets` list + detail panes |
| `ProjectsBrowser` | → `projects` mode (enhance deep links) |
| Standalone sample tiles on device page | → `samples` mode |
| `DrumTool` / `MultisampleTool` | → preset detail `edit` submode (reuse logic) |
| `MainTabs` / `TabNavigation` | → `ModeTabs` bottom shell |
| `AppHeader` | → `StatusStrip` |
| Carbon components on device tab | Remove |
| `CacheEditorContextBar` | Remove (breadcrumb + presets context) |
| `GeneratePresetSection` | → command strip action in preset edit |
| `Footer` | Optional minimal line in status area or omit |

### Phased implementation (suggested)

**Phase A — Shell**  
AppShell, ModeTabs, StatusStrip, theme tokens, typography, remove Carbon from new surfaces.

**Phase B — data mode**  
Status grid, action grid, cache map, push preflight (UI only; wire existing IPC).

**Phase C — presets mode**  
Unified list (include synth), detail with overview/regions; command strip; breadcrumb.

**Phase D — projects + samples modes**  
First-class tabs, deep links (IPC: resolve ref → preset/sample path).

**Phase E — preset edit**  
Embed DrumTool/MultisampleTool into presets/edit; remove old top-level tabs.

**Phase F — rename system**  
Impact preview component, rename queue, batch apply.

**Phase G — change review + polish**  
Push review panel, dirty persistence, empty states, motion.

---

## Text mocks (reference)

### Presets list (active mode)

```text
┌─────────────────────────────────────────────┐
│ op–xy mtp             connected · 44 dirty  │
├─────────────────────────────────────────────┤
│ presets                                     │
│ 275 total · 91 unnamed · 44 modified        │
│                                             │
│ [all] [drum] [synth] [sampler] [multi]      │
│ [search presets......................]      │
│                                             │
│ drum                                        │
│ 01  clean kit          24 rgn · modified    │
│ 02  tape kit           18 rgn · unnamed 04  │
│ 03  room kit           24 rgn               │
│                                             │
│ sampler                                     │
│ 41  glass key          12 rgn               │
│ 42  low choir          08 rgn · refs 03     │
│                                             │
├──────────┬──────────┬──────────┬──────────┤
│ data     │ projects │ presets  │ samples  │
└──────────┴──────────┴──────────┴──────────┘
```

### Preset detail (regions submode)

```text
┌─────────────────────────────────────────────┐
│ presets / drum / clean kit                  │
├─────────────────────────────────────────────┤
│ clean kit                                   │
│ drum · 24 regions · 4 project refs          │
│                                             │
│ [overview] [regions] [edit]                 │
│                                             │
│ 01 kd1  kick clean c2 01.wav    C2  1.2s    │
│ 02 sd1  snare room d2 02.wav    D2  0.8s    │
│ 03 ch1  unnamed f#2 03.wav      F#2 0.4s    │
│                                             │
│ selected: unnamed f#2 03.wav                │
│ [play] [rename] [show refs]                 │
├──────────┬──────────┬──────────┬──────────┤
│ data     │ projects │ presets  │ samples  │
└──────────┴──────────┴──────────┴──────────┘
```

---

## Open decisions (resolve during detailed screens)

1. **Default landing mode** — `data` on first launch vs last-used mode?
2. **Synth presets in list** — read-only catalog forever, or roadmap edit?
3. **URL routing** — hash routes (`#/presets/drum/clean-kit`) for deep links?
4. **Push review** — list changed presets only, or also binary size delta?
5. **samples tab brightness** — enforce black grid lines so `#e8e9e7` never feels SaaS-clean?
6. **Font licensing** — ship Inter + Geist Mono via npm, or system stack fallback?
7. **PatchStudio export path** — keep browser ZIP mode at all, or Electron-only?

---

## Success criteria

Redesign is successful when:

- [ ] User never thinks "which tab is the librarian vs the editor"
- [ ] Synth presets appear in preset list with honest capability labels
- [ ] Project sample ref click lands on preset or sample in one action
- [ ] Rename always shows affected presets/projects before apply
- [ ] Push feels routine (preflight) not alarming (modal guilt)
- [ ] Visual language reads as one instrument panel, not two apps
- [ ] Active mode background shift is obvious and consistent

---

## References

- [ui-ux-audit.md](./ui-ux-audit.md) — as-built inventory and friction list
- [structure.md](./structure.md) — device file formats
- OP-XY hardware visual language (grayscale encoders, anodized black) — e.g. [Sound on Sound OP-XY review](https://www.soundonsound.com/reviews/teenage-engineering-op-xy)

---

*Next step: detailed screens per mode (wireframes or implemented shell Phase A). Do not pixel-polish current three-tab UI.*

**Interactive prototype:** [opxy-shell-prototype.html](./prototypes/opxy-shell-prototype.html) — open in a browser; bottom tabs switch modes and background color.

**Product requirements & flows:** [product-requirements-and-flows.md](./product-requirements-and-flows.md) — sets, sample library stewardship, preset configs, pattern slots, and scene arrangement scope. Companion: [ux-flow-map-and-traceability.md](./ux-flow-map-and-traceability.md).

**Compact UI/UX principles:** [compact-ui-ux-principles.md](./compact-ui-ux-principles.md) — screen-space budget, density rules, flow hygiene, and aesthetic constraints for the four-mode app.

**MVP screen slices:** [mvp-screen-slices.md](./mvp-screen-slices.md) — build order, compact acceptance criteria, and what each first-pass screen must keep out.

**Product decisions:** [product-decisions.md](./product-decisions.md) — stable IA, set, sync, preset, sample, project, scene, and preflight decisions.

**Data tab (detailed spec):** [data-tab-spec.md](./data-tab-spec.md) — layout, sets model, commit/history, offline states, and TBD items. Supersedes the brief notes below.

**Projects tab (arrange / scenes):** [projects-tab-spec.md](./projects-tab-spec.md) — pattern inventory, scene matrix UI, xy-format parsing status, phased plan.

**Presets tab:** [presets-tab-spec.md](./presets-tab-spec.md) — split library + overview/regions/edit, PatchStudio mapping.

**Samples tab:** [samples-tab-spec.md](./samples-tab-spec.md) — sample inspector, rename queue, impact preview, deep links.

### Data mode (summary)

Vertical sync cockpit: **OP-XY** (top) → **pull/push** → **sets** (bottom) → sets toolbar. See [data-tab-spec.md](./data-tab-spec.md) for full detail.
