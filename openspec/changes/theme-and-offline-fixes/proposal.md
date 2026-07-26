# Proposal: theme-and-offline-fixes

## Intent

Three user-reported issues collide on one CSS root cause plus two orthogonal cleanup items. Users report "black-on-black" text on warning chips and the assignment modal step. That, plus an `act()` warning that traces to `useCamera.test.ts`, all funnel through **inverted warning tokens** in `src/styles/global.css`. Separately, the `Avatar.tsx` / `avatar.tsx` case-collision is a latent CI hazard (HFS+ resolves both, Linux does not), and the SW offline fallback returns a bare inline HTML string with no `<title>`, charset, or theming. This change fixes the contrast, eliminates the duplicate, and polishes the offline page.

## Scope

### In Scope
- Swap `--warning-foreground` / `--warning-bg` light/dark values so warning text reads ≥ 4.5:1.
- Precache `/offline.html` from `public/sw.js`; prefer the cached page on navigation failure over the inline string.
- Add `public/offline.html` with viewport, charset, `<title>`, retry, and `prefers-color-scheme` theming.
- Remove `src/components/ui/avatar.tsx` (lowercase duplicate of `Avatar.tsx`, identical content).
- Add `src/components/ticket/AssignmentEditor.test.tsx` covering row-click → Sheet opens, mode transitions (single/shared/weighted), toggle person, weighted stepper, `distributeEqually` normalization, and participants Sheet open.

### Out of Scope
- Auditing other theme tokens (track as future change).
- Rethinking caching strategy (still stale-while-revalidate; only the precache list grows).
- Migrating to `vite-plugin-pwa`.
- Touching the pre-existing `act()` warning in `useCamera.test.ts`.

## Capabilities

### New Capabilities
- `offline-fallback-page`: dedicated, themed static fallback page served by the SW on navigation failure.

### Modified Capabilities
- `theme-tokens`: warning foreground/background pair redefined to clear WCAG AA contrast in both light and dark modes.
- `service-worker-precache`: precache list extended with `offline.html`; navigation fallback path prefers the cached page.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/styles/global.css` | Modified | Swap light halves 67-68 and dark halves 107-108 to restore foreground/background contrast. |
| `public/sw.js` | Modified | Add `/offline.html` to precache; on `fetch` navigation failure, `caches.match('/offline.html')` wins over the inline HTML. |
| `public/offline.html` | New | Minimal styled page: charset, viewport, `<title>`, retry button, light/dark via `prefers-color-scheme`. |
| `src/components/ui/Avatar.tsx` | Unchanged | Canonical; remains the sole export after duplicate removal. |
| `src/components/ui/avatar.tsx` | Removed | Lowercase duplicate; identical md5 to `Avatar.tsx`. |
| `src/components/ticket/AssignmentEditor.test.tsx` | New | Vitest suite mirroring `TicketItemsEditor.test.tsx` setup (~6 tests). |
| 21 call sites using `text-warning-foreground` / `bg-warning-bg` | Unchanged | Auto-become legible once tokens are fixed (no code edits). |

## Approach

1. **Tokens**: read both halves, exchange values so light mode text = dark amber on light amber, dark mode text = bright amber on dark amber. Limit edits to the `--warning-*` block; leave surface/global tokens alone.
2. **Avatar**: `grep` for `@/components/ui/avatar` (lowercase) imports across `src/`; normalize any hit to `@/components/ui/Avatar`; delete the lowercase file.
3. **Offline page**: hand-author a small HTML file using system fonts and CSS variables that read `prefers-color-scheme`. Wire into SW: bump `STATIC_ASSETS` to include `/offline.html`; in `handleFetch`, network-error path returns the cache hit first, falls back to inline HTML only if the cache miss occurred.
4. **Tests**: clone the setup (imports, mocks, describe blocks, RTL render patterns) from `TicketItemsEditor.test.tsx` to keep the harness identical.

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Visual weight shifts elsewhere on the page after warning token change | Low | Edit only `--warning-foreground` / `--warning-bg` halves; surface tokens untouched. Manual reload in both themes during verification. |
| Removing `avatar.tsx` breaks a lowercase import path | Low | `grep -r "components/ui/avatar"` before delete; normalize hits to PascalCase first. |
| New test file fails baseline if setup diverges from sibling | Low | Copy `TicketItemsEditor.test.tsx` setup verbatim; only diverge in test cases. |
| SW precache bump changes install timing on existing clients | Low | New precache entry only — no removal; activate-on-claim flow unchanged. |

## Rollback Plan

Revert commit `theme-and-offline-fixes`. Tokens, files, and SW precache return to baseline in one revert. No data migrations, no schema changes.

## Dependencies

None. Pure CSS + static asset + test additions; no platform or library bumps.

## Success Criteria

- [ ] `pnpm test` passes (168 prior + ≥6 new AssignmentEditor tests).
- [ ] `pnpm build` exits 0.
- [ ] In light mode, "Toca para asignar" chip and "Pesos no suman 100%" alert in `AssignmentEditor` are legible (verified visually).
- [ ] In dark mode, same elements are legible.
- [ ] DevTools → Network: Offline + hard reload on a non-`/` route renders the new themed offline page (not the Chrome dinosaur or bare inline HTML).
- [ ] `grep -r "components/ui/avatar"` returns zero lowercase hits after deletion.
