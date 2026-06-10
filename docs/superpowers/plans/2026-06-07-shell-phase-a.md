# Shell Phase A — Four-Mode AppShell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the three-tab Carbon shell with the prototype's four bottom-mode AppShell (data / projects / presets / samples), wiring existing device components into mode pages without rewriting editors.

**Architecture:** New `src/app/` shell + `src/navigation/` state + `src/ui/` primitives. Existing `DevicePage` logic splits across modes via thin wrappers. `AppContext` keeps editor state; `AppShellContext` owns mode + selection navigation.

**Tech Stack:** React 19, TypeScript, Sass modules, Vitest, existing Electron IPC unchanged.

---

## Wave 1 — Parallel (disjoint files)

### Task 1: Navigation layer
**Files:** `src/types/navigation.ts`, `src/navigation/AppShellContext.tsx`, `src/navigation/useNavigation.ts`

### Task 2: UI kit
**Files:** `src/ui/LibraryWorkspace.tsx`, `Segments.tsx`, `SearchField.tsx`, `ObjectDetailHead.tsx`, `ui-kit.scss`

### Task 3: Shell + theme
**Files:** `src/app/AppShell.tsx`, `StatusStrip.tsx`, `ModeTabs.tsx`, `ModeViewport.tsx`, `src/theme/shell.scss`

## Wave 2 — Parallel (after Wave 1)

### Task 4: Cache hooks
**Files:** `src/cache/useDeviceCache.ts`

### Task 5: Mode pages
**Files:** `src/modes/data/DataMode.tsx`, `projects/ProjectsMode.tsx`, `presets/PresetsMode.tsx`, `samples/SamplesMode.tsx`

## Wave 3 — Integration

### Task 6: Wire App.tsx, tests, verify build
**Files:** `src/App.tsx`, `src/test/components/AppShell.test.tsx`, update stale tests if needed

---

## Deferred to Phase B+
- Embed DrumTool/MultisampleTool in presets edit (remove top-level editor tabs)
- FieldKeyboard extraction
- Multi-set carousel / git history
- Carbon removal from PresetBrowser (restyle incrementally)
