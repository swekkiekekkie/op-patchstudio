# xy-format Collaboration Model

## Why this app depends on xy-format

This application should not become a private fork of OP-XY format knowledge.
The long-term product goal is a focused library manager: keep large preset and
sample libraries on the computer, sync smaller themed sets to the OP-XY, and
inspect projects well enough to understand which presets and samples they use.

That requires `.xy` project inspection, but it does not require this app to own
the full reverse-engineering effort. The healthier split is:

- `xy-format` is the shared reverse-engineering and tooling home for the OP-XY
  project format.
- `opxy_mtp_manager` is a product that consumes those findings and generates
  focused probe projects when product needs expose missing format knowledge.

In practice, `xy-format` is the closest thing to a community SDK layer for
OP-XY project files. When we learn reusable facts, we should try to move them
there first instead of letting them live only inside the app.

## What should flow upstream

Send discoveries to `xy-format` when they are format-level facts rather than
app-specific UI behavior:

- track/pattern logical entry mapping;
- active pattern detection;
- engine IDs and event/preset type behavior;
- preset folder or path references inside project bodies;
- sample path/reference encoding;
- tested capture procedures and fixture corpora;
- conservative read-only parsers and inspector output.

Keep app-only behavior in this repository:

- set/library UX;
- local database/cache decisions;
- visual design;
- MTP sync workflows;
- matching project references against our local preset/sample library;
- confidence presentation and product language.

## Probe workflow

1. Start with an app question, for example: "Can we show which preset is assigned
   to each project track/pattern?"
2. Design small OP-XY probe projects that isolate one variable at a time.
3. Store the raw working captures under `reference_material/user_probes/`.
4. Analyze locally in the app repo if needed, but mark heuristics clearly.
5. Promote stable, reusable parser logic and a minimal fixture subset to a clean
   `xy-format` contribution.
6. Port or consume the upstreamed shape in this app so the implementations do
   not drift.

## Current relationship

The current app parser can inspect active project track/pattern entries and
infer selected preset folders/names for the app-required A/B probe sets. That
logic should be treated as provisional until the equivalent Python
implementation and fixture tests are accepted or intentionally rejected by
`xy-format`.

As of 2026-06-09, a clean upstream-shaped contribution exists locally at:

- repo: `C:\Users\Smon\Documents\Programmerings\xy-format-contribution`
- branch: `codex/app-pattern-preset-growth`
- commit: `e2a1eac Add project preset inspection`
- patch: `C:\Users\Smon\Documents\Programmerings\xy-format-project-preset-inspection.patch`
- PR body: `C:\Users\Smon\Documents\Programmerings\xy-format-project-preset-inspection-pr-body.md`

The app-side TypeScript parser should be kept aligned with that contribution's
model. In app code, `presetRefs` is the preferred field name for inferred
project preset references; `inferredPresetFolders` is legacy migration language.

If upstream accepts the contribution, future app work should align its data
contract to the upstream model:

- project -> tracks -> patterns;
- pattern active state;
- engine ID/name;
- inferred preset references;
- reference kind;
- hit count;
- confidence.

## AI disclosure

Some reverse-engineering analysis and contribution preparation in this project
is AI-assisted. Contributions upstream should disclose that plainly, including
which parts were AI-generated or AI-assisted and which evidence backs the
claims. The important bar is not authorship style; it is reproducibility,
fixture-backed tests, and clearly stated uncertainty.
