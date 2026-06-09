# Data tab — UI/UX & functionality spec

**Status:** Design locked for layout and interaction patterns; content details and empty states TBD  
**Prototype:** [opxy-shell-prototype.html](./prototypes/opxy-shell-prototype.html) (data screen)  
**Parent docs:** [design-direction.md](./design-direction.md) (global shell), [compact-ui-ux-principles.md](./compact-ui-ux-principles.md) (screen-space rules), [ui-ux-audit.md](./ui-ux-audit.md) (as-built app)  
**Last updated:** 2026-06-06

---

## Purpose

The **data** tab is the sync cockpit. It answers:

- Is the OP-XY connected?
- What is on the device right now?
- What local **sets** exist on the PC?
- How do I move data between them safely?

It is **not** a homepage, preset browser, or project list. Those live in the other three modes. Data mode is operational only.

---

## Core concepts

### Sets (replaces “cache”)

A **set** is a full local library on disk — a named working copy of OP-XY content (presets, samples, projects, etc.). Users may maintain several sets for different scenarios (e.g. techno liveset, dnb session, studio master).

| Term (old) | Term (new) |
|------------|------------|
| cache | set |
| backup / restore | commit / history (see below) |
| single `%AppData%/device-cache` | multi-set storage with carousel |

Sets are editable offline. The app should remain useful without hardware connected.

### Device vs set

| Object | Meaning |
|--------|---------|
| **OP-XY (device)** | Live state on connected hardware via MTP |
| **Set** | Local mirror on PC; target of pull, source of push |

**Pull** copies device → active set.  
**Push** copies active set → device (with preflight review when there are pending changes — UI TBD in product).

### Linear set history

Each set has a **single linear commit history** (no branching). Branching is achieved only via **Save as**, which creates a new set.

| Action | Meaning | TE precedent |
|--------|---------|--------------|
| **Commit** | Add a checkpoint to the active set’s history | “Commit” on KO II scenes |
| **History** | View / scrub linear revision list; restore a prior revision on PC | OP-XY project autosave / checkpoint browsing on device |
| **Save as** | Duplicate set → new name → fresh linear history starting at that point | — |

Implementation concept: incremental history on disk (e.g. git-backed). UI shows a minimal scrubber today; full history UX still TBD.

---

## Screen layout

Vertical **sync cockpit** — top/bottom, not left/right.

```text
┌─────────────────────────────────────────────┐
│ op–xy mtp          [connected|offline]  meta │  ← status strip
├─────────────────────────────────────────────┤
│ op–xy                                       │
│   (device content or connect illustration)    │  ← upper half (flex 1)
├─────────────────────────────────────────────┤
│              [pull]  [push]                   │  ← transfer row (fixed)
├─────────────────────────────────────────────┤
│ sets · techno liveset                       │
│   (set content — storage + counts)            │  ← lower half (flex 1)
│   [history panel when open]                   │
├─────────────────────────────────────────────┤
│ ◀ ··· ▶ [list]     [commit][history][save as]│  ← sets toolbar (fixed)
└─────────────────────────────────────────────┘
│ sets │ projects │ presets │ library │         ← bottom mode keys
```

### Equal content areas

**OP-XY pane** and **sets content** (above the toolbar divider) receive **equal vertical space**. The sets action toolbar is **outside** that split — fixed height below the divider — so device and set storage blocks align visually and neither pane feels taller.

Both panes share:

- Same padding (`24px` / 3× grid)
- Same `.pane-head` row (title only on device; `sets · {name}` on sets)
- Content top-aligned under the title (not bottom-floated)

### Status strip (header)

| Element | Role |
|---------|------|
| App title | `op–xy mtp` |
| Connection toggle | `connected` / `offline` — lives in header so it never shifts pane layout |
| Meta | Active set name (mono, low contrast) |

Connection state must not cause layout jump in the panes below.

---

## OP-XY pane

### Connected

Shows what we know about the device **without** requiring a full pull:

- **Counts:** presets, samples, projects
- **Trust facts:** connection/source, size availability, last pull

Storage breakdown is not the default device content. OP-XY often reports **0 bytes** for file sizes over MTP, so byte distribution would look precise while being untrustworthy.

Without pulling, the device pane cannot show much more than summary stats — that is acceptable.

### Disconnected (offline)

Do **not** grey out the previous device view. Replace the content area with:

1. **Connect illustration** centered ([connect_pc.html](./prototypes/connect_pc.html) — OP-XY ↔ PC ↔ USB)
2. **Hint below:** `connect op–xy over usb`

Pull, push, and device-dependent actions are disabled. Sets remain fully usable.

---

## Transfer row

Two square icon buttons between the panes:

| Button | Direction | Action |
|--------|-----------|--------|
| **pull** | ↓ | Device → active set |
| **push** | ↑ | Active set → device (opens preflight when needed) |

Disabled when offline.

All data-tab action buttons share one size and style: **76×76 px** squares, icon + lowercase label, no rounded corners.

---

## Sets pane

### Header

```text
sets · {active set name}
```

- Set name inline after `sets`, separated by `·`
- Small dot after name when this set was **last pushed** to device (on-device indicator)
- Name updates when carousel selection changes

### Content (carousel)

Horizontal carousel of sets. One slide visible at full content width; inactive slides dimmed. No overlay ◀ ▶ on the content — navigation is only in the toolbar.

Each slide mirrors the device pane layout:

- Counts for presets, samples, projects
- Set facts such as local/device marker, history/checkpoints, and storage availability

Local sets can compute file sizes after pull, but size should remain optional detail. The main job of the panel is to explain what set is selected and whether it is safe/meaningful to push or pull.

### History panel

Toggled by **History** in the toolbar. Appears **above** the toolbar divider, inside the sets content zone. Linear list of commits; current revision marked. Collapsing history returns space to the carousel.

---

## Sets toolbar

Single row below a divider. Two groups:

### Left — selection (compact, float left)

| Control | Role |
|---------|------|
| ◀ | Previous set |
| `· · ·` dots | One dot per set; active set highlighted |
| ▶ | Next set |
| **list** (hamburger) | Pick set from dropdown list |

This group must **not** stretch across the row. Only takes natural width.

### Right — actions (float right)

| Button | Role |
|--------|------|
| **commit** | Add checkpoint to active set history |
| **history** | Toggle history panel |
| **save as** | Fork set → new set with new linear history |

Same 76×76 square buttons as pull/push.

### On connect

Auto-select the set that best matches the device (last-pushed memory + content fingerprint). No verbose “matches device X%” badge — rejected as clutter. On-device state = dot on set name only.

---

## Visual & copy rules (sets tab)

Inherited from [design-direction.md](./design-direction.md):

- Monochrome TE-inspired UI; 8px grid; no cards/shadows
- Lowercase labels; mono for data values
- Minimal text — no dev hints, concept footers, or explanatory paragraphs in the UI
- No “match percentage” or “does not match device” badges

Rejected patterns:

- Left/right split of device vs sets
- Checkpoint button on device row (commit lives on set toolbar)
- Carousel arrows inside content area
- Grey-out-only offline state
- Branching history UI within one set (use Save as instead)

---

## Empty & first-run states

When the user has **no sets yet**:

| Option | When | UX sketch |
|--------|------|-----------|
| **Pull to create first set** | OP-XY **connected** | Empty sets pane + pull as primary path; copy: `pull to create first set` |
| **Create empty set** | Always, especially **offline** | Secondary path for offline-first work; copy: `create empty set` |

Rules:

- Pull-to-create requires connection — not offered offline
- Create-empty-set supports offline-first workflows
- Both actions live in the sets pane, not in a global onboarding screen.
- The device pane still shows connection state; the sets pane owns set creation.

When OP-XY is offline and no sets exist, device pane shows connect state and the sets pane offers `create empty set`. If the device connects later, `pull to create first set` appears as the preferred import path.

---

## Panel content model

The OP-XY and selected-set panels are the two objects being reconciled by **pull** and **push**. Their layout is final, but their content should stay modular.

Current content contract:

| Metric | Device pane | Set pane |
|--------|-------------|----------|
| Preset / sample / project **counts** | Yes (MTP) | Yes (local index) |
| Trust/provenance facts | Yes: connection, MTP size caveat, last pull | Yes: local/device marker, history, local-only status |
| Per-category **GB** distribution | No by default; MTP often reports 0 B | Optional future detail when useful |
| 8 GB total framing | Avoid as primary framing | Avoid as primary framing |

Decision: counts and trust facts are the reliable primary metrics. Storage distribution is secondary and should not be the default body because OP-XY MTP sizes are unreliable and set usefulness is not defined by fitting inside 8 GB.

Content hierarchy:

1. Connection and active set identity.
2. Preset/sample/project counts.
3. Push readiness and dirty state.
4. Storage size only when trustworthy and useful.

The set pane can show richer local storage information after pull because local file sizes are reliable.

---

## Push preflight

Prototype includes a hidden **push** slab (review + confirm). Product behavior:

- Not a scary modal by default.
- Opens as a focused review sheet when there are dirty changes, rename operations, missing refs, conflicts, or overwrite risk.
- Summarizes what will overwrite on device.
- Ties to dirty-state tracking across presets/samples/projects.
- Names the active set before the final push action.
- Blocks push on unresolved missing refs or name/path conflicts.

Data mode hosts the entry point via **push**. The detailed review content follows [mvp-screen-slices.md](./mvp-screen-slices.md) Slice 6 and [product-decisions.md](./product-decisions.md) D-7.

---

## Backend mapping (implementation notes)

| UI concept | Likely implementation |
|------------|----------------------|
| Set | Directory under user data root; index manifest |
| Pull | Existing device cache read → write into active set |
| Push | Existing atomic push from active set path |
| Commit | Git commit (or equivalent) in set directory |
| History | Git log / checkout |
| Save as | Copy directory + init new history |
| On-device dot | `lastPushedSetId` + fingerprint match in app state |
| Connect art | Static asset from TE-style illustration |

Current app still uses single `device-cache` path — multi-set + git history is **not** implemented yet.

---

## Prototype fidelity checklist

The interactive prototype implements:

- [x] Vertical device / transfer / sets layout
- [x] Equal flex split excluding sets toolbar
- [x] Header connection toggle
- [x] Offline connect illustration + hint
- [x] Unified 76px square buttons
- [x] Sets carousel + toolbar (selection left, actions right)
- [x] `sets · {name}` header with on-device dot
- [x] Commit / history / save as (mock data)
- [x] Linear history list
- [x] First-run empty states specified
- [ ] Real MTP counts / sizes
- [x] Push preflight product behavior specified
- [ ] Push preflight wired to dirty state
- [ ] Git-backed commit/history

---

## Open questions

1. **Default landing** — sets tab on first launch vs last mode?
2. **Device storage bar visual treatment** — exact muted style when sizes are all zero.
3. **History UX** — dots + list enough, or OP-XY-style timeline scrubber?
4. **Set naming** — inline rename in header, or only via list / save as?
5. **Delete set** — where does it live (list menu, long-press, command strip)?
6. **Multiple devices** — one day: device identity in header meta?

---

## Related files

| File | Role |
|------|------|
| [prototypes/opxy-shell-prototype.html](./prototypes/opxy-shell-prototype.html) | Interactive mock — data screen |
| [prototypes/connect_pc.html](./prototypes/connect_pc.html) | Offline connect SVG |
| [design-direction.md](./design-direction.md) | Global four-mode redesign |
| [ui-ux-audit.md](./ui-ux-audit.md) | Current Electron UI inventory |

---

*This document is the source of truth for sets tab layout and behavior. Update it when the prototype or product diverges.*
