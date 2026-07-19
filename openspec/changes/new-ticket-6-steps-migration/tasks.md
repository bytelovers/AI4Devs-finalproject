# Tasks: New Ticket 6-Step Migration

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 250-350 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | 6-step flow: capture → review → participants → assign → summary | PR 1 | `pnpm test -- src/views/NewTicketView.test.tsx` | `pnpm dev` → new ticket flow | `git checkout HEAD -- frontend/src/views/NewTicketView.tsx` |

## Phase 1: Foundation / Imports & Types

- [x] 1.1 Add `AssignmentEditor` import from `@/components/ticket/AssignmentEditor` in `src/views/NewTicketView.tsx`
- [x] 1.2 Add `TicketSummary` import from `@/components/ticket/TicketSummary` in `src/views/NewTicketView.tsx`
- [x] 1.3 Add `assign` and `summary` to `STEP_ORDER` array in `src/views/NewTicketView.tsx`
- [x] 1.4 Add `STEP_META` entries for `assign` and `summary` steps in `src/views/NewTicketView.tsx`

## Phase 2: Core Implementation

- [x] 2.1 Update `canProceed()` function to validate `assign` step (all items have assignments) in `src/views/NewTicketView.tsx`
- [x] 2.2 Add conditional rendering for `assign` step → `<AssignmentEditor />` in `src/views/NewTicketView.tsx`
- [x] 2.3 Add conditional rendering for `summary` step → `<TicketSummary />` in `src/views/NewTicketView.tsx`
- [x] 2.4 Update stepper UI to render 5 visible steps (capture, review, participants, assign, summary) in `src/views/NewTicketView.tsx`
- [x] 2.5 Update bottom navigation buttons per step (text, action, disabled state) in `src/views/NewTicketView.tsx`
- [x] 2.6 Add ticket image preview to `assign` step (from captured image state) in `src/views/NewTicketView.tsx`

## Phase 3: Verification & Fixes

- [x] 3.1 Verify `AvatarStack` import path in `AssignmentEditor.tsx` (`@/components/ui/AvatarStack`) and fix if needed
- [x] 3.2 Verify `PeopleGroupsManager` import path in `AssignmentEditor.tsx` (`@/components/people/PeopleGroupsManager`) and fix if needed
- [x] 3.3 Verify `TicketSummary` imports (CheckCircle2, AlertTriangle, RotateCcw, Share2, Trash2 from lucide-react)
- [x] 3.4 Run `pnpm build` in frontend directory — verify no TypeScript errors
- [x] 3.5 Run `pnpm test` in frontend directory — verify all tests pass (baseline: 167/173, 6 pre-existing failures)
- [ ] 3.6 Manual QA: run `pnpm dev`, test full 6-step flow end-to-end (capture → review → participants → assign → summary → save)

## Phase 4: Cleanup / Documentation

- [x] 4.1 Update any inline comments in `NewTicketView.tsx` to reflect 6-step flow
- [x] 4.2 Remove any dead code or commented sections from `NewTicketView.tsx` after migration
- [x] 4.3 Verify `ScanOnboarding` flag key exists in settings store — OUT OF SCOPE (not wired in source or target)