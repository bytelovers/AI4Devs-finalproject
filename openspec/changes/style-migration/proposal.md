# Proposal: Style Migration — SplitEat to Emerald Palette

## Intent

Migrate the visual identity from Sage/Amber HSL to Emerald oklch palette matching the previous workspace design, with zero component code changes. All 90+ inline `var(--)` references keep working via backward-compatible aliases.

## Scope

### In Scope
- Replace HSL/hex values in `variables.css` with oklch Emerald palette from prev workspace
- Add `--color-emerald` primary var; keep `--color-sage` as alias for backward compat
- Update `global.css` `@theme` block to match new oklch palette
- Add `tw-animate-css` dependency (package.json + global.css import)
- Add Geist Mono font to `index.html` alongside Inter
- Align radius: `--radius: 0.875rem` base with derived sm/md/lg/xl
- Remove `@media (prefers-color-scheme: dark)` overrides (use `.dark` class only)
- Keep two-file structure (variables.css + global.css)

### Out of Scope
- No component code changes (inline `var(--)` refs work via aliases)
- No merge into single globals.css (deferred)
- No removal of `variables.css`
- No replacing Outfit font (keep as-is, only add Geist Mono)
- No change to dark mode class logic (`html.dark` stays)

## Capabilities

### New Capabilities
None — pure visual migration, no new capability introduced.

### Modified Capabilities
- `split-eat-visuals`: Color values change from Sage/Amber HSL to Emerald oklch. Delta spec needed for updated palette values. Dark mode behavior unchanged.

## Approach

**Palette Swap (Approach 1)**: Replace values in place, keep two-file CSS structure, add backward-compatible aliases so all 90+ inline `var(--)` references work without changes. 50 shadcn/ui components auto-inherit via `@theme` — zero component rewrites.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/styles/variables.css` | Modified | Full palette: HSL→oklch, remove `@media` dark block, new radius |
| `src/styles/global.css` | Modified | `@theme` block colors, add `tw-animate-css` import |
| `src/index.html` | Modified | Add Geist Mono font link |
| `package.json` | Modified | Add `tw-animate-css` dependency |
| `openspec/specs/split-eat-visuals/` | Modified | Delta spec for new color values |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `--color-sage` alias = emerald value (naming mismatch) | Med | Add `--color-emerald` alias; document in code comments |
| Dark mode regression from removing `@media` block | Low | `.dark` class already applied by JS — no functional change |
| `tw-animate-css` incompatible with `@tailwindcss/vite` | Low | Test in dev; fallback to custom `@keyframes` if needed |

## Rollback Plan

Revert CSS and config to previous commit: `git checkout HEAD -- src/styles/variables.css src/styles/global.css src/index.html package.json`

## Dependencies

- `tw-animate-css` npm package (compatibility with `@tailwindcss/vite` TBD)
- Geist Mono availability on Google Fonts

## Success Criteria

- [ ] `variables.css` uses oklch emerald palette — no HSL remaining
- [ ] All 8 affected views render in emerald palette without component changes
- [ ] Light and Dark modes both show correct emerald styling
- [ ] Build passes with `tw-animate-css` added
