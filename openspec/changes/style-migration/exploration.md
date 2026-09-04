## Exploration: Style Migration — SplitEat Frontend → Previous Workspace Design

### Current State

The frontend at `/frontend` is a Vite + React 18 app with a **Sage & Amber** design palette that is visually distinct from the previous workspace (Next.js + React 19 with an **Emerald**-based emerald/slate design).

**Current CSS architecture (Vite/SplitEat):**
- Two files: `variables.css` (design tokens in HSL) + `global.css` (Tailwind v4 theme mapping + component styles)
- Palette: Sage (`--color-sage: #5F8575`) and Amber (`--color-amber: #C88A36`)
- Color space: HSL with hex fallbacks in `var(--..., #fallback)` inline styles
- Dark mode: `html.dark` class + `@media (prefers-color-scheme: dark)` override block
- Fonts: Inter (body) + Outfit (headings)
- Radius: Custom `--radius-*` scale (4px-24px)
- Animations: Custom `@keyframes` in global.css
- Tailwind v4 via `@tailwindcss/vite` plugin

**Previous workspace CSS architecture (Next.js/Cuadra):**
- Single `globals.css` with `@import "tailwindcss"` + `@import "tw-animate-css"`
- Palette: Emerald-based oklch values
- Color space: oklch throughout with no HSL
- Dark mode: `.dark` class (no media query block)
- Fonts: Inter (sans) + Geist Mono (mono) via Next.js font loader
- Radius: Single `--radius: 0.875rem` with derived sm/md/lg/xl
- Tailwind v4 via `@tailwindcss/postcss`
- Uses `tw-animate-css` for Tailwind v4 animations

### Affected Areas

| Area | What's affected | Migration effort |
|------|----------------|-----------------|
| `src/styles/variables.css` (158 lines) | Full palette replacement, dark mode values, radius, shadows | High — needs complete rewrite |
| `src/styles/global.css` (472 lines) | `@theme` block references, base styles reference colors, drawer/component classes reference sage/amber | Medium — update token references |
| `src/index.html` | Font loading (Outfit replaced by Geist Mono addition) | Low |
| `src/hooks/useTheme.ts` (114 lines) | Dark mode class logic should stay as-is (works with `.dark`) | None |
| `src/views/Allocation.tsx` (252 lines) | Heavy `var(--color-sage)`, `var(--color-amber)`, `var(--bg-*)` inline styles (24 occurrences) | Medium |
| `src/views/BillingHUD.tsx` (147 lines) | 14 inline `var(--color-sage)`/`var(--color-amber)`/`var(--bg-*)` references | Medium |
| `src/views/PayerWheel.tsx` (185 lines) | 11 inline `var(--color-sage)`/`var(--color-amber)`/`var(--bg-*)` refs | Medium |
| `src/views/OCRScanner.tsx` (335 lines) | 15 inline `var(--color-sage)`/`var(--bg-*)` references | Medium |
| `src/components/camera/CameraScanFlow.tsx` | 2 inline sage references | Low |
| `src/components/camera/CameraViewfinder.tsx` | 8 sage border references | Low |
| `src/components/Drawer.tsx` | References `var(--color-sage)` in component classes | Low (via global.css) |
| `src/components/ThemeSelector.tsx` | References `var(--color-sage)` in component classes | Low (via global.css) |
| `src/components/ui/` (50 files) | shadcn/ui uses Tailwind semantic tokens (bg-background, text-foreground, etc.) — these will automatically inherit from the `@theme` mapping | Low (auto) |
| `package.json` | Need to add `tw-animate-css` dependency | Low |
| `tailwind.config.ts` | Minimal — only maps `sage` and `amber` colors. May become unnecessary or need updating. | Low |
| `src/lib/utils.ts` | `cn()` utility with `clsx` + `tailwind-merge` — no change needed | None |

### CSS Variable Usage Breakdown

**90 total `var(--` references across the codebase:**

| Variable | Count | Files |
|----------|-------|-------|
| `--color-sage` | ~32 | Allocation, BillingHUD, PayerWheel, OCRScanner, CameraScanFlow, CameraViewfinder, global.css (drawer classes) |
| `--color-amber` | ~6 | BillingHUD, PayerWheel |
| `--bg-base-light` | ~4 | Allocation, BillingHUD, PayerWheel |
| `--bg-base-dark` | ~1 | OCRScanner |
| `--bg-card-light` | ~6 | Allocation, BillingHUD, PayerWheel |
| `--text-primary` | ~10 | Allocation, BillingHUD, PayerWheel |
| `--text-secondary` | ~8 | Allocation, BillingHUD, PayerWheel, OCRScanner |
| `--border` | ~15 | Allocation, BillingHUD, PayerWheel, OCRScanner, sonner.tsx |

**Tailwind semantic tokens used across views** (`bg-background`, `text-foreground`, `bg-primary`, `text-primary`, `text-muted-foreground`, `bg-card`, `border-border`, etc.):
- AppShell, NavigationBar, HomeView, NewTicketView, ContactsView, GroupsView, SettingsView, TicketDetailView, FeatureFlagsView, all 50 shadcn/ui components

### Approaches

1. **Palette swap (keep structure, change values)** — Effort: Medium
   - Keep two-file CSS structure
   - Replace Sage/Amber HSL values in `variables.css` with Emerald oklch values from prev workspace
   - Add `--color-emerald` var mapped to primary; keep `--color-sage` pointing to same value for backward compat
   - Update global.css `@theme` mapping for new palette
   - Add `tw-animate-css` package
   - Add Geist Mono font (keep Inter + Outfit, or switch to Inter + Geist Mono)
   - Pros: Minimal file changes, no component rewrites needed, fallback `var(--color-sage)` references still work
   - Cons: Still has Sage-named CSS vars that point to emerald values (naming mismatch), two-file complexity remains

2. **Full restructure (match prev workspace)** — Effort: High
   - Merge into single `globals.css` with `@theme inline` + `:root` + `.dark` blocks (matching prev pattern)
   - Remove `variables.css` entirely
   - Convert all HSL values to oklch
   - Add `--color-sage: oklch(...)` alias to keep old inline references working
   - Add `tw-animate-css`
   - Switch fonts: Inter + Geist Mono (remove Outfit)
   - Pros: Exact visual match to prev design, clean architecture
   - Cons: More changes, legacy inline `var(--color-sage)` references still need aliases, `variables.css` removal could surprise

3. **Bridge approach (incremental)** — Effort: Medium (recommended)
   - Update `variables.css` with oklch emerald values from prev workspace
   - Map `--color-sage` → emerald primary value, `--color-amber` → emerald accent or chart color
   - Keep `--bg-base-*` / `--bg-card-*` pointing to new background/foreground tokens
   - Add `--color-emerald` as new primary, keep `--color-sage` as alias for backward compat
   - Add `tw-animate-css`
   - Add Geist Mono font alongside Inter (keep Outfit or replace)
   - Update the `@theme` block in `global.css` to use emerald values
   - Pros: Backward compatible with all existing inline `var(--)` references, incremental, safe
   - Cons: Slightly more complex var mapping, CSS var naming stays Sage/Amber internally

### Recommendation

**Approach 1 (Palette Swap)** is the most pragmatic for this migration. The two-file structure works fine for Vite — it doesn't need to match the Next.js single-file approach. The key visual changes are:

1. Replace all HSL/hex values in `variables.css` with oklch values matching the prev workspace (emerald palette)
2. Keep `--color-sage` as an alias pointing to the new emerald primary so existing inline `var(--color-sage)` references continue working without changes
3. Add `--color-amber` mapped to a complementary emerald variant or just keep it as an accent
4. Update global.css `@theme` block colors to match new oklch palette
5. Add `tw-animate-css` to global.css imports and `package.json`
6. Add Geist Mono font to `index.html` (keep Inter, replace or supplement Outfit)
7. Align radius with prev workspace: `--radius: 0.875rem` base
8. Update `useTheme.ts` if needed to support `.dark` class only (remove `@media prefers-color-scheme: dark` overrides)

This gives the exact visual result with zero component code changes and minimal risk.

### Risks

- **Naming mismatch risk**: `--color-sage` will reference an emerald color. Engineering teams may find this confusing later. Mitigation: add a `--color-emerald` primary variable and document that `--color-sage` is an alias.
- **Dark mode regression**: The prev workspace uses `.dark` class only, while current uses `html.dark` + `@media` query. Both currently apply the same values, but the media query block in `variables.css` must be removed or aligned to avoid conflicts.
- **Font availability**: Geist Mono via Google Fonts may not be available — need to confirm. Alternately, use system monospace as fallback.
- **Inline style spread**: 90+ `var(--)` references across 8 files mean any naming change requires widespread updates. The alias approach avoids this.
- **tw-animate-css compatibility**: Need to verify `tw-animate-css` works with `@tailwindcss/vite` plugin (prev uses `@tailwindcss/postcss`).

### Ready for Proposal

Yes. The exploration is complete and ready for the sdd-propose phase. Tell the orchestrator to launch **sdd-propose** with:
- **change-name**: `style-migration`
- **recommended approach**: Approach 1 (Palette Swap) with aliases
- **key deliverable**: Updated `variables.css`, `global.css`, `index.html`, `package.json` — no component code changes needed
