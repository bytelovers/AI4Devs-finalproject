# Tasks: Style Migration — SplitEat to Emerald Palette

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~135 (68 additions + 67 deletions) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | single PR |
| Delivery strategy | auto-chain |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Full palette swap + deps | PR 1 | `pnpm install && pnpm build` | Load app, verify light/dark emerald palette on all views | `git checkout HEAD -- src/styles/variables.css src/styles/global.css frontend/index.html frontend/package.json` |

## Phase 1: Dependencies & Config

- [x] 1.1 Add `"tw-animate-css": "^1.4.0"` to `frontend/package.json` dependencies (v2 not available; used latest v1.4.0)
- [x] 1.2 Add Geist Mono font link to `frontend/index.html` alongside Inter/Outfit

## Phase 2: CSS Tokens (variables.css)

- [x] 2.1 Add `--color-emerald` alias, keep `--color-sage` as backward-compat
- [x] 2.2 Replace light theme HSL/hex values with oklch from design mapping (--primary, --secondary, --accent, --bg-*, --text-*, --border, --warning, --danger)
- [x] 2.3 Remove `--primary-glow`, `--secondary-glow`, `--accent-glow` variables
- [x] 2.4 Remove `--primary-h`, `--primary-s`, `--primary-l` HSL decomposition vars
- [x] 2.5 Add `--accent-foreground` and `--accent-tint` vars with oklch values
- [x] 2.6 Add `--font-mono: 'Geist Mono', 'Inter', monospace` to fonts section
- [x] 2.7 Update radius scale: `--radius: 0.875rem` base with calc()-derived sm/md/lg/xl
- [x] 2.8 Replace `@media (prefers-color-scheme: dark)` block with `.dark`-only overrides using oklch values from design mapping
- [x] 2.9 Update shadow values in both `:root` and `.dark` blocks
- [x] 2.10 Remove `@media (prefers-color-scheme: dark)` block entirely (now redundant)

## Phase 3: Theme Mapping (global.css)

- [x] 3.1 Add `@import "tw-animate-css"` after `@import "tailwindcss"` at top
- [x] 3.2 Change `--color-accent` from `var(--bg-tertiary)` to `var(--accent-tint)`
- [x] 3.3 Add `--color-accent-foreground: var(--accent-foreground)` to `@theme` block
- [x] 3.4 Add `--font-mono: var(--font-mono)` to `@theme` block

## Phase 4: Verification

- [x] 4.1 Run `pnpm install` — deps resolve without errors
- [x] 4.2 Run `pnpm build` — TypeScript + Vite build passes
- [x] 4.3 Run `pnpm dev` — dev server starts without errors
- [ ] 4.4 Load app in browser — light mode renders Emerald palette, no HSL artifacts in console *(manual check needed)*
- [ ] 4.5 Toggle dark mode — `.dark` class renders correct oklch values *(manual check needed)*
- [ ] 4.6 Verify all views render without broken styles (buttons, cards, drawers, dialogs) *(manual check needed)*
