# Data tab — UI/UX & functionality spec

**Status:** Design locked for layout and interaction patterns; content details and empty states TBD  
**Prototype:** [opxy-shell-prototype.html](./prototypes/opxy-shell-prototype.html) (data screen)  
**Parent docs:** [design-direction.md](./design-direction.md) (global shell), [ui-ux-audit.md](./ui-ux-audit.md) (as-built app)  
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
│ data │ proj │ pre │ smp │                     ← bottom mode keys
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

- **8 GB** stacked storage bar (presets / samples / projects / other / free)
- **Counts:** presets, samples, projects (mono, right column)

**Content TBD:** Storage breakdown may be of limited value on device. OP-XY often reports **0 bytes** for file sizes over MTP, so segment sizes may be **set-only** (computed after pull). **Counts** are still viable on device and should remain the reliable metric.

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

- 8 GB stacked bar + legend
- Counts column (presets, samples, projects)

**Content TBD:** Same storage caveats as device. Sets can compute sizes accurately from local files. Richer set summary (dirty edits, last sync, etc.) may replace or supplement the bar later.

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

## Visual & copy rules (data tab)

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

## Empty & first-run states (TBD)

When the user has **no sets yet**:

| Option | When | UX sketch |
|--------|------|-----------|
| **Pull to create first set** | OP-XY **connected** | Empty sets pane + pull as primary path; copy like `pull to create your first set` |
| **Create empty set** | Always (especially **offline**) | Action to spawn an empty local set — work without hardware, prepare content before a gig |

Rules:

- Pull-to-create requires connection — not offered offline
- Create-empty-set supports offline-first workflows
- Exact layout and copy TBD; both paths should exist

When OP-XY is offline and no sets exist, device pane shows connect illustration; sets pane shows empty-set / create-empty affordance (TBD).

---

## Storage & metrics (TBD)

| Metric | Device pane | Set pane |
|--------|-------------|----------|
| Preset / sample / project **counts** | Yes (MTP) | Yes (local index) |
| Per-category **GB** on stacked bar | Unreliable (often 0 B from device) | Reliable after pull |
| 8 GB total framing | Yes — iPhone-style stacked bar | Yes — same visual grammar |

Open question: hide or de-emphasize GB segments on device when sizes are unknown; show counts only until first pull populates local size data.

Broader content review TBD — the bar + counts may be replaced with more actionable summaries (e.g. modified since last commit, push readiness).

---

## Push preflight (TBD)

Prototype includes a hidden **push** slab (review + confirm). Product behavior:

- Not a scary modal by default
- Summarize what will overwrite on device
- Tie to dirty-state tracking across presets/samples

Detailed spec belongs in a future change-review section; data tab only hosts the entry point via **push**.

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
- [ ] First-run empty states
- [ ] Real MTP counts / sizes
- [ ] Push preflight wired to dirty state
- [ ] Git-backed commit/history

---

## Open questions

1. **Default landing** — data tab on first launch vs last mode?
2. **Device storage bar** — show when sizes are all zero, or counts-only mode?
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

*This document is the source of truth for data tab layout and behavior. Update it when the prototype or product diverges.*
