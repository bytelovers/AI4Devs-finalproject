# Tasks: App Store Migration

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~500-650 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR (tightly coupled) |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Foundation (types, calc, store, barrel) + import updates | PR 1 | `npm run build` | `npm run dev` + open DemoOCR page | `git revert` + restore `src/store/useTicketStore.ts` |
| 2 | Unit tests for calc + store | PR 1 (same) | `npx vitest run src/lib/` | `N/A` — pure unit tests | Tests don't affect runtime; revert separately if needed |

## Phase 1: Foundation — Types & Utilities

- [ ] 1.1 Create `src/lib/types.ts` — port Person, Group, Ticket, TicketItem, AppData, Discount types from external project; adapt import paths if needed
- [ ] 1.2 Create `src/lib/calc.ts` — port genId(), calcSubtotal(), calcTaxAmount(), calcTipAmount(), rounding helpers as pure functions

## Phase 2: Core — Store & Barrel

- [ ] 2.1 Create `src/lib/store.ts` — port Zustand store with `persist` middleware + `createJSONStorage(() => localStorage)` + merge migration; wire all typed actions
- [ ] 2.2 Create `src/lib/index.ts` — barrel file re-exporting all public symbols from types, calc, and store

## Phase 3: Cleanup — Remove Old Store & Update Imports

- [ ] 3.1 Delete `src/store/useTicketStore.ts` — old OCR-only store (replaced by new typed store)
- [ ] 3.2 Update import in `src/components/DemoOCR.tsx` — change `'../store/useTicketStore'` to `'../lib'`
- [ ] 3.3 Verify `tsc --noEmit` passes with no unresolved imports
- [ ] 3.4 Verify `npm run build` succeeds

## Phase 4: Testing — Calc & Store Unit Tests

- [ ] 4.1 Create `src/lib/calc.test.ts` — test genId returns unique strings, calcSubtotal sums correctly, calcTaxAmount/calcTipAmount compute percentages, rounding edge cases (100% line coverage)
- [ ] 4.2 Create `src/lib/store.test.ts` — test each action dispatches correct state transition, localStorage persistence round-trip (mock storage), merge migration loads and patches legacy shape
- [ ] 4.3 Delete `src/store/useTicketStore.test.ts` — old store test superseded by new store tests
- [ ] 4.4 Run full test suite: `npx vitest run` — all new and existing tests pass
