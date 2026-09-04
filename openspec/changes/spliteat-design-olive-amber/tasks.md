# Tasks: spliteat-design-olive-amber — Sage & Amber Visual Redesign

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 250–350 lines |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Foundation & Style Tokens (Phase 1 + Phase 2) | PR 1 | Base = `feature/spliteat-design-olive-amber` tracker branch |
| 2 | Screen Implementations (Phase 3) | PR 2 | Base = PR 1 branch |
| 3 | Testing & Verification (Phase 4) | PR 3 | Base = PR 2 branch; tracker merges to main |

---

## Phase 1: Foundation & Docs

- [x] 1.1 Create `docs/user-stories/epic-2-advanced/US-15.md` — US-15 Gherkin spec and traceability table.
- [x] 1.2 Update `docs/user_stories_traceability.md` — add US-15 row under Epic 2 after US-09.
- [x] 1.3 Create `frontend/src/hooks/useTheme.ts` — `Theme = 'light'|'dark'|'system'`; reads/writes `localStorage`; listens to `prefers-color-scheme`; applies `.dark`/`.light` class to `<html>`.
- [x] 1.4 Create `frontend/src/components/ThemeSelector.tsx` — dropdown with Light/Dark/System options; calls `setTheme`; includes `aria-label` and keyboard navigation.
- [x] 1.5 Modify `frontend/src/components/Drawer.tsx` — import and render `<ThemeSelector />` in drawer footer section.
- [x] 1.6 Modify `frontend/index.html` — inject inline `<script>` in `<head>` that reads `localStorage.theme` and `prefers-color-scheme`, then adds `.dark` or `.light` to `<html>` before first paint.

## Phase 2: Style Refactoring

- [x] 2.1 Modify `frontend/src/styles/variables.css` — add `--color-sage: #5F8575`, `--color-amber: #C88A36`, `--bg-base-dark: #111415`, `--bg-base-light: #FFFFFF`, `--bg-card-light: #F4F6F5`; remove all `--neon-*` variables.
- [x] 2.2 Modify `frontend/tailwind.config.ts` — map `sage` and `amber` keys to the new CSS variables.
- [x] 2.3 Modify `frontend/src/styles/global.css` — remove neon glow `@keyframes` and shadow definitions; add `@keyframes winner-bounce { 0%,100%{transform:scale(1)} 50%{transform:scale(1.2)} }` with `cubic-bezier(0.175, 0.885, 0.32, 1.275)`.

## Phase 3: Screen Implementations

- [x] 3.1 Modify `frontend/src/views/OCRScanner.tsx` — replace neon border/glow classes on viewfinder corners and scan-line with `border-sage` flat solid; verify no `shadow-neon` references remain.
- [x] 3.2 Modify `frontend/src/views/Allocation.tsx` — apply Sage tint to active row highlights; convert progress orbs and selection chips to flat slate badges; remove glow classes.
- [x] 3.3 Modify `frontend/src/views/BillingHUD.tsx` — apply Amber to totals; add `.dark .qr-container { filter: invert(1) hue-rotate(180deg); }` for QR modal; mute active-card borders to flat Sage Green; remove glow classes.
- [x] 3.4 Modify `frontend/src/views/PayerWheel.tsx` — apply flat segment colors (slate/dark-olive dark, pastel light); set pointer to Amber; apply `winner-bounce` animation class to winner avatar element; remove all glow/neon classes.

## Phase 4: Testing & Verification

- [x] 4.1 Create `frontend/src/hooks/useTheme.test.ts` (Vitest) — test cases: (a) sets `light` and updates localStorage + class; (b) sets `dark`; (c) `system` follows `matchMedia` mock; (d) initial load reads persisted value; mock `window.matchMedia` and `localStorage`.
- [x] 4.2 A11y contrast audit — verify Sage Green `#5F8575` on `#FFFFFF` meets WCAG AA (4.5:1 for normal text); verify Amber `#C88A36` on `#111415` meets AA; document results.
- [x] 4.3 E2E smoke check — manually (or Playwright): load app → select Dark → reload → confirm dark class present → select System → toggle OS preference → confirm reactive update; assert no FOUC on reload.
