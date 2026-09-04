# Proposal: UI Primitives Migration

## Intent

Port ~48 shadcn/ui Radix components from the external Next.js project into the current Vite PWA (SplitEat) as a 1:1 migration — no new development.

## Scope

### In Scope
- Copy all `.tsx` files to `src/components/ui/`, preserving props, variants, and Radix integration
- Create `src/lib/utils.ts` with the `cn()` helper (clsx + tailwind-merge)
- Adapt import paths to current `@/` alias structure
- `npm run build` must pass with zero type errors

### Out of Scope
- Feature components (`cuadra/`), Atomic Design refactoring, unit/E2E tests, theme provider changes, CSS var or Tailwind config modifications

## Capabilities

### New Capabilities
None — pure infrastructure migration, no spec-level behavior changes.

### Modified Capabilities
None — existing specs (`split-eat-visuals`, `manual-theme-selector`) unaffected.

## Approach

1. Create `src/lib/utils.ts` — standard `cn()` from `clsx` + `tailwind-merge`
2. Copy each `.tsx` from `~/Downloads/workspace-previo/src/components/ui/` in batches
3. Replace external-specific imports (`next/navigation`, `next-themes`) with project equivalents
4. Run `tsc` then `npm run build`, fix errors iteratively
5. Verify rendering with current CSS variables

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/components/ui/*.tsx` | New | ~48 shadcn/ui components |
| `src/lib/utils.ts` | New | `cn()` helper required by all shadcn components |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Tailwind v3 vs v4 class mismatch | Low | Shadcn/nova preset (`@import "shadcn/tailwind.css"`) already configured |
| Radix version API drift | Low | Both projects on same major Radix versions |
| `next-themes` imports in source | Med | Replace with current project's `useTheme` hook |

## Rollback Plan

Each component is a standalone file. Revert per batch:

```bash
git revert <commit-hash>  # per batch
# or full rollback:
git checkout HEAD~N -- src/components/ui/ src/lib/utils.ts
```

## Dependencies

- `~/Downloads/workspace-previo/src/components/ui/` — source files
- Radix packages (27), `clsx`, `tailwind-merge`, `class-variance-authority` — all already installed

## Success Criteria

- [ ] `npm run build` passes with zero TypeScript errors
- [ ] All ~48 component files present in `src/components/ui/`
- [ ] Components render without runtime errors in a smoke test page
- [ ] Each component preserves original props interface and variants
