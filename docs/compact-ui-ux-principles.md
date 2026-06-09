# Compact UI/UX Principles

**Status:** Draft global interaction and layout rules  
**Parent:** [design-direction.md](./design-direction.md)  
**Companions:** [product-requirements-and-flows.md](./product-requirements-and-flows.md), [ux-flow-map-and-traceability.md](./ux-flow-map-and-traceability.md), [mvp-screen-slices.md](./mvp-screen-slices.md), [product-decisions.md](./product-decisions.md)  
**Baseline screens:** [data-tab-spec.md](./data-tab-spec.md), [projects-tab-spec.md](./projects-tab-spec.md)  
**Last updated:** 2026-06-08

---

## Premise

The app manages a large graph:

```text
source library -> sets -> presets/samples -> projects -> pattern slots -> scenes -> device
```

But the UI must feel small, precise, and calm. The OP-XY is not a sprawling DAW; this app should not become one either.

The **sets** and **projects** screens are the current north-star patterns:

- Sets works because it has one clear vertical operational flow: device, transfer, set.
- Projects works because it uses a dense split pane and a grid that mirrors the hardware mental model.

Presets and library should inherit that discipline.

---

## Global Screen Budget

Every screen has the same hard budget:

```text
status strip        fixed, one line
mode content        one primary workspace
mode tabs           fixed, bottom
```

Inside mode content, a screen may use **one** of these structures:

| Structure | Use for | Rule |
|-----------|---------|------|
| Vertical cockpit | Set transfer and set management | Top-to-bottom operational sequence only |
| Split pane | Projects, presets, library | List left, detail right; no nested cards |
| Dense grid | Arrange, drum pads, sample regions | Cells are the content, not decorative blocks |
| Modal/sheet | Destructive confirm, focused edit, picker | Temporary surface only |

Do not combine all of them in one view.

---

## Information Density Rules

### The UI Is Allowed To Be Dense

Dense is good when it is organized. Sparse is only good when it reduces decisions.

Use:

- 8px grid.
- 32-40px list rows.
- 48-64px compact inspector rows.
- 64-88px major hardware-like cells.
- Mono text for file paths, counts, notes, pattern numbers, timestamps.
- Lowercase labels.

Avoid:

- Marketing-like vertical whitespace.
- Large explanatory paragraphs inside the app.
- Cards inside cards.
- Repeated headings that say what the mode tab already says.
- Sticky footers competing with bottom mode tabs.

### Maximum Visible Decision Count

A user should never face more than:

| Surface | Max primary choices |
|---------|---------------------|
| Status strip | 2 state facts + active set |
| Mode header | 1 title, 1 compact summary, 1 search/filter row |
| List row | 1 object + 2 metadata facts + state marks |
| Detail head | 3-5 actions |
| Modal/sheet | 2 primary decisions, usually cancel/apply |

If a surface needs more, split it into a submode or disclosure panel.

---

## Navigation Rules

### Four Modes Are Fixed

```text
sets | projects | presets | library
```

These are object classes, not pages.

### Depth Budget

Maximum normal depth:

```text
mode -> object -> submode
```

Examples:

```text
presets -> clean kit -> regions
presets -> clean kit -> edit
projects -> ambient sketch -> arrange
samples -> unnamed-f2-34.wav -> refs
```

Avoid:

```text
mode -> object -> submode -> modal -> submodal -> warning
```

When a modal is open, it must be a short task with an obvious exit.

### Context Must Stay Visible

Always preserve:

- Active mode via bottom tab.
- Active set via status strip.
- Active object via detail head or breadcrumb.

The user should not wonder whether they are editing local set content or device content.

---

## Progressive Disclosure Rules

The app should reveal complexity by task stage, not by hiding everything behind menus.

### Good Disclosure

```text
list -> detail -> inline section -> focused sheet
```

Example:

```text
samples list
  sample detail
    refs section
    rename impact sheet
```

### Bad Disclosure

```text
button menu -> modal -> tabs inside modal -> advanced modal
```

This burns screen space and memory.

### Default Collapsed Areas

These should usually be collapsed or summarized:

- Long sample reference lists.
- Advanced synth/sampler parameters.
- Rename queue details after a clean proposal.
- Project sample refs below arrange grid.
- Aux tracks when the user is focused on instrument tracks.

These should not be collapsed:

- Active set identity.
- Missing reference warnings.
- Dirty state.
- Current selected object.
- Current scene/pattern choice.

---

## Visual Aesthetic Rules

### Material

The app should feel like an instrument-side operating panel:

- Flat slabs.
- Grid lines.
- Square cells.
- No shadows.
- No soft SaaS cards.
- No decorative gradients.
- No cute empty-state illustrations except the purposeful connect diagram.

### Palette

Stay mostly monochrome. Let each mode own a distinct material value:

| Mode | Material feel |
|------|---------------|
| Data | Dark operational base |
| Projects | Charcoal arrangement surface |
| Presets | Mid-grey library/edit surface |
| Samples | Light inspection surface |

Use accent color only for:

- Active selection.
- Destructive risk.
- Scene indicator, if following OP-XY red convention.
- Missing or conflict state.

### Typography

Text should do the heavy lifting.

| Text role | Style |
|-----------|-------|
| Object names | Grotesk, lowercase where user content allows |
| Data values | Mono |
| File paths | Mono, clipped with middle/left preservation depending context |
| Actions | Lowercase verb |
| Warnings | Short exact statement |

Avoid labels like:

```text
Here you can manage your samples...
```

Prefer:

```text
37 unnamed
3 missing refs
```

---

## Canonical Mode Layout Contracts

These are not pixel-perfect wireframes. They are contracts: a mode can evolve visually, but should preserve the relationship between areas.

### Sets Contract

```text
status strip
------------------------------------------------
op-xy pane
  storage/counts or connect state
------------------------------------------------
transfer row
  [pull] [push]
------------------------------------------------
set pane
  active set summary or history
------------------------------------------------
set toolbar
  select set                         set actions
------------------------------------------------
mode tabs
```

Screen-space rule:

- No left/right split.
- No object browser.
- Transfer remains the hinge between device and set.

### Projects Contract

```text
status strip
------------------------------------------------
projects header
------------------------------------------------
project list | arrange/detail pane
             |   scene control
             |   T1-T16 pattern config grid
             |   collapsible refs
------------------------------------------------
mode tabs
```

Screen-space rule:

- Arrangement grid is the main object.
- Sample refs are secondary.
- Scene data unknown state lives in the arrange pane, not in a modal.

### Presets Contract

```text
status strip
------------------------------------------------
presets header
  filters + search
------------------------------------------------
preset list | preset detail
            |   detail head actions
            |   overview | regions | edit
            |   submode body
------------------------------------------------
mode tabs
```

Screen-space rule:

- The list/detail split must survive as the primary shape.
- Drum/sampler editing is a submode of detail.
- Region review must remain accessible before deep editing.

### Library Contract

```text
status strip
------------------------------------------------
library header
  filters + search
------------------------------------------------
asset list | asset inspector
            |   detail head actions
            |   waveform strip
            |   metadata
            |   refs / rename impact
rename queue slab lives at bottom of list pane
------------------------------------------------
mode tabs
```

Screen-space rule:

- The library list is a maintenance index, not a gallery.
- Inspector owns preview, preset/sample metadata, staging, and rename.
- Rename queue is present but compact.

---

## Mode-Specific Compact Patterns

### Sets

Sets is an operational cockpit, not a dashboard.

Keep:

- Device pane.
- Transfer row.
- Set pane.
- Set toolbar.

Do not add:

- Project lists.
- Preset browser.
- Sample cleanup cards.
- Large onboarding text.

If data needs more, use a subview:

```text
data / change review
data / history
data / backups
```

### Projects

Projects is an arrange and reference surface.

Keep:

- Project list left.
- Arrange grid right.
- Scene/pattern grid as main object.
- Sample refs collapsed below.

Do not add:

- Note editor.
- Piano roll.
- Full song timeline until format support is ready.
- Huge per-project metadata table above the arrange grid.

Scene data unknown state:

```text
scene data unavailable
pattern inventory shown
```

That is better than pretending.

### Presets

Presets is the central creative library.

Recommended layout:

```text
list pane
detail pane
  overview | regions | edit
```

Compact rules:

- Type filters in one row.
- Search in same header zone.
- Detail actions in detail head.
- Regions table before editors.
- Drum/sampler editor embedded in edit submode.
- Synth catalog read-only unless edit support is real.

Avoid:

- Separate top-level drum/multisample tabs.
- Massive stacked control pages.
- Save/export panels floating at the bottom of the whole app.

### Library

Library is the PC/source asset layer plus active-set sample/preset maintenance.

Recommended layout:

```text
list pane
inspector pane
  waveform
  metadata
  refs
  rename impact
```

Compact rules:

- Rename queue is a list-pane slab, not a full mode.
- Show refs as linked rows, not cards.
- Keep waveform small unless opened.
- Filter chips must stay short.

Avoid:

- Tile grids for large libraries.
- Per-sample action clutter in every row.
- Long rename explanations.

---

## Interaction Rules

### Selection First

Most screens should follow:

```text
select object -> inspect detail -> act
```

Do not show every action on every row.

### Inline Before Modal

Use inline interaction when the user needs context:

- Rename sample.
- Select preset region.
- Inspect pattern slot.
- Preview sample refs.

Use modal/sheet when the user needs focus:

- Confirm destructive change.
- Edit precise trim/waveform.
- Review rename queue.
- Push preflight.

### No Hidden Device Mutation

Any edit outside data mode modifies the active set first.

Device writes happen only through:

```text
data -> push -> preflight -> confirm
```

This is both UX and safety.

---

## Responsive Rules

### Desktop / Wide

Use split panes:

```text
left list: 280-360px
right detail: remaining width
```

Keep bottom mode tabs visible.

### Narrow Desktop / Tablet

Use collapsible list/detail:

```text
list -> detail
detail has compact back breadcrumb
bottom mode tabs remain visible
```

Do not squeeze a full two-pane project arrange grid into unreadability.

### Small Height

Protect:

1. Status strip.
2. Active object / scene / set identity.
3. Primary grid/list.
4. Bottom mode tabs.

Collapse:

- Secondary refs.
- Advanced settings.
- Long summaries.
- History panels.

---

## Flow Hygiene Rules

### One Primary Verb Per Flow Stage

Examples:

```text
sets: pull / push
library: stage / rename
presets: edit / save
projects: inspect / arrange
```

Secondary verbs should be visually quieter.

### Every Flow Has A Home Mode

| Flow | Home mode |
|------|-----------|
| Pull/push set | Sets |
| Stage PC asset | Library |
| Rename sample | Library |
| Build drum kit | Presets |
| Build sampler preset | Presets |
| Inspect pattern config | Projects |
| Inspect scene arrangement | Projects |

Cross-links jump to another mode only when the user is following a reference.

### Cross-Link Return Context

When jumping across modes, preserve enough context to return.

Example:

```text
projects / ambient sketch / scene 10
  missing sample -> samples / missing / unnamed-f2-34.wav
  back -> projects / ambient sketch / scene 10
```

This can be implemented later, but the UX should assume it.

---

## Requirement Addendum

These compactness requirements extend the product requirements doc.

| ID | Requirement |
|----|-------------|
| UX-1 | Every mode must keep active set identity visible or inherited from the shell. |
| UX-2 | Every mode must use exactly one primary workspace pattern: cockpit, split pane, dense grid, or focused sheet. |
| UX-3 | Normal navigation depth must not exceed mode -> object -> submode. |
| UX-4 | Project pattern workflows must not expose note-editing controls. |
| UX-5 | Detail actions must live near the active object, not in a global sticky footer. |
| UX-6 | Long secondary information must be collapsible without hiding safety-critical state. |
| UX-7 | Device mutation must only happen through data push/pull flows. |
| UX-8 | Presets and library must prefer list/inspector layouts over tile/card grids. |
| UX-9 | Unsupported or undecoded OP-XY format areas must use honest read-only states. |
| UX-10 | Each screen must have a compact empty/offline/error state using one sentence or less. |

---

## Design Review Checklist

Use this before accepting any new screen:

- [ ] Is the active set visible?
- [ ] Is there one primary workspace pattern?
- [ ] Is the main object identifiable in under one second?
- [ ] Are secondary details collapsed or below the main task?
- [ ] Are there no cards inside cards?
- [ ] Are note-editing controls absent from project pattern flows?
- [ ] Is every risky mutation routed through impact preview or push preflight?
- [ ] Does the screen still work at reduced height?
- [ ] Is the copy short enough to feel like an instrument UI?
- [ ] Does it feel related to data/projects, not like a new app?
