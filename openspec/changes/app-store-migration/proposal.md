# Proposal: App Store Migration

## Intent

Replace the current minimal OCR-only Zustand store with the full-featured store from the external project at `../workspace-previo-import/`. The external store provides typed entities (people, groups, tickets, items, discounts), localStorage persistence, merge migration, and calculation utilities — all essential for the SplitEat app's core functionality. The current store only tracks OCR state (`imageSrc`, `ocrStatus`, `rawWords`) and has no persistence or domain types.

## Scope

### In Scope
- Migrate `types.ts` → `src/lib/types.ts` (Person, Group, Ticket, TicketItem, AppData, etc.)
- Migrate `calc.ts` → `src/lib/calc.ts` (genId, calcSubtotal, calcTaxAmount, calcTipAmount, rounding)
- Migrate `store.ts` → `src/lib/store.ts` (Zustand + persist with merge migration, all actions)
- Create `src/lib/index.ts` for clean barrel exports
- Remove old `src/store/useTicketStore.ts` and update affected imports
- Unit tests for `calc.ts` (pure functions, 100% coverage)
- Unit tests for `store.ts` (persist, merge migration, action dispatch)

### Out of Scope
- Integration with UI components (Phase 2)
- IndexedDB/Dexie integration (deferred)
- Backend sync layer (not in MVP)

## Capabilities

### New Capabilities
None — infrastructure layer only. No new user-facing behavior introduced.

### Modified Capabilities
None — no spec-level requirements change. Pure implementation migration.

## Approach

Copy and adapt the 3 source files from `../workspace-previo-import/src/lib/`. The external store uses Zustand + `persist` middleware with `createJSONStorage(() => localStorage)` — both are already in the project. Types use string IDs (`crypto.randomUUID()`) which map cleanly. Minimal adaptation needed for import paths and module boundaries. The old store file is removed and its exports re-pointed to the new `src/lib/` barrel.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/types.ts` | New | Central type definitions |
| `src/lib/calc.ts` | New | Pure calculation utilities |
| `src/lib/store.ts` | New | Zustand store with persist middleware |
| `src/lib/index.ts` | New | Barrel exports |
| `src/store/useTicketStore.ts` | Removed | Replaced by new store |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Old OCR components break on import rename | Low | Update imports in a single commit, verify build |
| ID generation mismatch (uuid vs crypto.randomUUID) | Low | Both produce strings; existing data not persisted yet |
| Old localStorage shape clashes on first load | Low | External store has merge migration; wipe if needed |

## Rollback Plan

`git revert` the migration commit(s), restore `src/store/useTicketStore.ts`, rebuild.

## Dependencies

Zustand persist middleware (already present in `package.json`).

## Success Criteria

- [ ] All types compile — `tsc --noEmit` passes
- [ ] Calc utility tests pass with 100% line coverage
- [ ] Store tests pass (persist load, merge migration, action dispatch)
- [ ] Build succeeds (`npm run build`) with no import errors
- [ ] Existing OCR components render after import path updates
