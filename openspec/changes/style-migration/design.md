# Design: Style Migration — SplitEat to Emerald Palette

## Technical Approach

**Palette Swap**: Replace all HSL/hex values in `variables.css` with oklch from prev workspace, keep two-file CSS structure, add `--color-emerald` alias while preserving `--color-sage` for backward compat. All 90+ inline `var(--)` references keep working. ~50 shadcn/ui components auto-inherit via `@theme` — zero component rewrites.

## Architecture Decisions

| Decision | Options | Tradeoff | Choice |
|----------|---------|----------|--------|
| CSS file structure | (a) Single globals.css (b) Two files | (a) Cleaner but riskier; (b) Atomic diffs, revert-safe | (b) Keep variables.css + global.css |
| Backward compat | (a) None (b) Aliases | (a) Breaks 90+ var(--) refs; (b) Zero component changes | (b) Add --color-emerald, keep --color-sage |
| Dark mode strategy | (a) Keep @media (b) Remove @media | @media block is redundant — JS already sets `.dark` class | (b) Remove @media, keep only html.dark |
| Color space | (a) HSL (b) oklch | oklch is perceptually uniform, matches prev workspace | (b) oklch |
| Radius scale | (a) Static px (b) --radius + calc() | calc() is single-source-of-truth, matches prev workspace | (b) --radius: 0.875rem + derived |
| Animation | (a) Custom keyframes (b) tw-animate-css | tw-animate-css matches prev workspace pattern | (b) @import "tw-animate-css" |
| Fonts | (a) Keep Inter+Outfit (b) +Geist Mono | Geist Mono needed for code/monospace | (b) Add Geist Mono |

## CSS Variable Mapping

### Light (:root)

| Variable | Current (HSL/hex) | Target (oklch) |
|----------|-------------------|----------------|
| `--color-sage` | `#5F8575` | `oklch(0.62 0.15 162)` |
| `--color-emerald` | — NEW | `oklch(0.62 0.15 162)` |
| `--color-amber` | `#C88A36` | `oklch(0.75 0.16 80)` |
| `--bg-base-dark` | `#111415` | `oklch(0.15 0.005 240)` |
| `--bg-base-light` | `#FFFFFF` | `oklch(0.99 0.002 240)` |
| `--bg-card-light` | `#F4F6F5` | `oklch(1 0 0)` |
| `--primary` | `hsl(238,83%,62%)` | `oklch(0.62 0.15 162)` |
| `--primary-hover` | `hsl(238,83%,56%)` | `oklch(0.58 0.15 162)` |
| `--primary-active` | `hsl(238,83%,50%)` | `oklch(0.54 0.15 162)` |
| `--primary-light` | `hsl(238,83%,95%)` | `oklch(0.95 0.04 162)` |
| `--primary-glow` | `hsla(...,0.15)` | **REMOVED** |
| `--secondary` | `hsl(162,76%,41%)` | `oklch(0.7 0.13 200)` |
| `--secondary-hover` | `hsl(162,76%,35%)` | `oklch(0.65 0.13 200)` |
| `--secondary-glow` | `hsla(...,0.15)` | **REMOVED** |
| `--accent` | `hsl(292,84%,61%)` | `oklch(0.75 0.16 80)` |
| `--accent-hover` | `hsl(292,84%,55%)` | `oklch(0.7 0.16 80)` |
| `--accent-glow` | `hsla(...,0.15)` | **REMOVED** |
| `--accent-foreground` | — NEW | `oklch(0.35 0.12 162)` |
| `--accent-tint` | — NEW | `oklch(0.95 0.04 162)` |
| `--warning` | `hsl(38,92%,50%)` | `oklch(0.75 0.16 80)` |
| `--danger` | `hsl(354,76%,55%)` | `oklch(0.577 0.245 27.325)` |
| `--bg-primary` | `hsl(220,20%,98%)` | `oklch(0.99 0.002 240)` |
| `--bg-secondary` | `hsl(0,0%,100%)` | `oklch(1 0 0)` |
| `--bg-tertiary` | `hsl(220,14%,93%)` | `oklch(0.965 0.004 240)` |
| `--border` | `hsl(220,13%,90%)` | `oklch(0.92 0.005 240)` |
| `--border-focus` | `var(--primary)` | `oklch(0.62 0.15 162)` |
| `--text-primary` | `hsl(222,47%,11%)` | `oklch(0.18 0.01 240)` |
| `--text-secondary` | `hsl(220,12%,40%)` | `oklch(0.5 0.01 240)` |
| `--text-tertiary` | `hsl(220,9%,60%)` | `oklch(0.6 0.008 240)` |
| `--text-white` | `hsl(0,0%,100%)` | `oklch(0.99 0.002 240)` |

### Dark (`html.dark`)

| Variable | Current (HSL) | Target (oklch) |
|----------|---------------|----------------|
| `--bg-primary` | `hsl(222,47%,7%)` | `oklch(0.15 0.005 240)` |
| `--bg-secondary` | `hsl(222,47%,11%)` | `oklch(0.2 0.006 240)` |
| `--bg-tertiary` | `hsl(222,35%,15%)` | `oklch(0.26 0.008 240)` |
| `--border` | `hsl(222,28%,18%)` | `oklch(1 0 0 / 10%)` |
| `--border-focus` | `hsl(...,65%)` | `oklch(0.72 0.16 162)` |
| `--text-primary` | `hsl(210,40%,98%)` | `oklch(0.97 0.003 240)` |
| `--text-secondary` | `hsl(215,20%,75%)` | `oklch(0.7 0.008 240)` |
| `--text-tertiary` | `hsl(215,15%,55%)` | `oklch(0.6 0.008 240)` |
| `--text-white` | `hsl(0,0%,100%)` | `oklch(0.15 0.005 240)` |
| `--primary` | (computed from HSL) | `oklch(0.72 0.16 162)` |
| `--primary-hover` | (computed) | `oklch(0.68 0.16 162)` |
| `--primary-active` | (computed) | `oklch(0.64 0.16 162)` |
| `--primary-light` | `hsl(var(--primary-h),40%,18%)` | `oklch(0.3 0.05 162)` |
| `--secondary` | `hsl(162,76%,41%)` | `oklch(0.7 0.13 200)` |
| `--secondary-hover` | `hsl(162,76%,35%)` | `oklch(0.65 0.13 200)` |
| `--accent` | `hsl(292,84%,61%)` | `oklch(0.75 0.16 80)` |
| `--accent-hover` | `hsl(292,84%,55%)` | `oklch(0.7 0.16 80)` |
| `--accent-foreground` | — NEW | `oklch(0.9 0.05 162)` |
| `--accent-tint` | — NEW | `oklch(0.3 0.05 162)` |
| `--warning` | `hsl(38,92%,50%)` | `oklch(0.75 0.16 80)` |
| `--danger` | `hsl(354,76%,55%)` | `oklch(0.704 0.191 22.216)` |
| `--primary-h`, `-s`, `-l` | three separate vars | **REMOVED** (no HSL decomposition) |

**Shadows and glass properties**: KEEP current values — no change in depth/shadow semantics.

## Radius Scale

```css
--radius: 0.875rem;                              /* 14px — new base */
--radius-xs: 4px;                                /* kept from current */
--radius-sm: calc(var(--radius) - 4px);          /* 10px */
--radius-md: calc(var(--radius) - 2px);          /* 12px */
--radius-lg: var(--radius);                      /* 14px */
--radius-xl: calc(var(--radius) + 4px);          /* 18px */
--radius-full: 9999px;                           /* kept from current */
```

## Key Structural Changes

1. **Remove** `@media (prefers-color-scheme: dark)` block entirely (lines 106-132 of current variables.css). `.dark` class already covers this via FOUC script.
2. **Add** `--font-mono: 'Geist Mono', 'Inter', monospace` to fonts section.
3. **Remove** all `--*-glow` variables (no neon/glow per spec).
4. **Remove** `--primary-h`, `--primary-s`, `--primary-l` — no longer needed without HSL calc().
5. **Add** `--accent-foreground` and `--accent-tint` for proper accent color role.

## @theme Block Changes (global.css)

| Line | Change |
|------|--------|
| Top | Add `@import "tw-animate-css"` after `@import "tailwindcss"` |
| `--font-sans` | Already correct (`var(--font-body)`) |
| `--font-heading` | Already correct (`var(--font-heading)`) |
| **New** | `--font-mono: var(--font-mono)` |
| `--color-accent` | Change from `var(--bg-tertiary)` to `var(--accent-tint)` |
| **New** | `--color-accent-foreground: var(--accent-foreground)` |
| All others | **No change** — already reference the correct variables |

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/styles/variables.css` | Modify | Full HSL→oklch palette swap, remove @media dark block, new radius, add emerald alias + accent vars, remove glow vars, remove HSL decomposition vars |
| `src/styles/global.css` | Modify | Add `@import "tw-animate-css"`, fix --color-accent mapping, add --font-mono mapping |
| `src/index.html` | Modify | Add Geist Mono font link (`https://fonts.googleapis.com/css2?family=Geist+Mono&family=Inter:...&family=Outfit:...`) |
| `package.json` | Modify | Add `"tw-animate-css": "^2.0.0"` to dependencies |

## Testing Strategy

| Layer | What | How |
|-------|------|-----|
| Build | Dependencies resolve | `pnpm install && pnpm build` |
| Visual (light) | Colors render correctly | Load app, verify emerald palette on all views |
| Visual (dark) | `.dark` class renders correct palette | Toggle dark mode, verify dark oklch values |
| Regression | All 90+ var(--) refs resolve | No missing-variable artifacts in browser console |
| Regression | shadcn/ui components | Buttons, cards, dialogs, drawers render without broken styles |
| Animation | tw-animate-css available | CSS `animate-*` classes work |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No data migration. Feature-flag not applicable — CSS-only change is atomic.

Rollback: `git checkout HEAD -- src/styles/variables.css src/styles/global.css src/index.html package.json`

## Open Questions

- [ ] Does `tw-animate-css` v2+ work with `@tailwindcss/vite` v4.3? Needs `pnpm add tw-animate-css` and dev test.
- [ ] Do any components visually depend on `--primary-glow` being non-zero? Scan for `var(--primary-glow)`, `var(--secondary-glow)`, `var(--accent-glow)` — remove only if they produce no visible gap.
