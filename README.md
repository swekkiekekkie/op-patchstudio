# OP-XY MTP Manager

Fork of [OP-PatchStudio](https://github.com/joseph-holland/op-patchstudio) — desktop app for managing OP-XY content over MTP: browse and backup presets/samples, preview audio, and rename unnamed samples in drum kits and multisample presets.

Upstream OP-PatchStudio remains the web preset creator; this fork adds an Electron shell and device-side workflows.

## Development

```bash
npm install
npm run dev
```

## Reference material

- `reference_material/xy-format/` — `.xy` project binary research (projects are out of scope for now)
- `docs/structure.md` — OP-XY MTP preset/sample format notes
- `docs/ui-ux-audit.md` — current UI/UX inventory (as-built)
- `docs/design-direction.md` — target four-mode redesign (data / projects / presets / samples)
- `docs/data-tab-spec.md` — data tab layout, sets model, and interaction spec (from prototype)
- `docs/projects-tab-spec.md` — projects tab, arrange/scenes UI, and xy-format parsing plan
- `docs/presets-tab-spec.md` — presets library, regions, edit submode (from prototype)
- `docs/samples-tab-spec.md` — samples inspector, rename queue, deep links (from prototype)

## License

MIT — see [LICENSE](LICENSE). Based on OP-PatchStudio by Joseph Holland.
