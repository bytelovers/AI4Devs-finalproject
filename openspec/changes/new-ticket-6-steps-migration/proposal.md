# Proposal: New Ticket 6-Step Migration

## Intent

Extend NewTicketView from 3 steps (`capture` → `review` → `participants`) to the complete 6-step flow (`capture` → `review` → `participants` → `assign` → `summary`) by integrating existing `AssignmentEditor` and `TicketSummary` components. This matches the source workspace flow.

## Scope

### In Scope

- Update `STEP_ORDER` in `NewTicketView.tsx` to include `assign`, `summary`
- Import and render `AssignmentEditor` at `assign` step
- Import and render `TicketSummary` at `summary` step
- Update `canProceed()` validation for `assign` step (all items must have assignments)
- Update stepper visual for 5 visible steps
- Update bottom navigation buttons per step
- Add ticket image preview to `assign` step (from source)

### Out of Scope

- CameraCapture native/upload improvements (defer to follow-up)
- ScanOnboarding changes (already matching)
- AssignmentEditor/TicketSummary logic changes (use as-is)
- OCR review / scanning pipeline (already complete)

## Capabilities

### New Capabilities
None — pure integration of existing components.

### Modified Capabilities

- `new-ticket-flow`: Step flow extended from 3 to 5 visible steps, validation updated, UI stepper updated

## Approach

**Incremental Integration** — Minimal changes to existing working scan pipeline. The `AssignmentEditor` (694 lines) and `TicketSummary` (307 lines) already exist in the current frontend with ~99% parity to source. Just need to:

1. Add `assign`, `summary` to `STEP_ORDER`
2. Add `STEP_META` entries for both steps
3. Import and render components conditionally
4. Update `canProceed()` for `assign` validation
5. Update stepper UI for 5 steps
6. Update bottom button text/actions per step

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/views/NewTicketView.tsx` | Modified | Add steps, imports, validation, rendering, stepper, buttons |
| `src/components/ticket/AssignmentEditor.tsx` | Verify | Confirm imports work (`AvatarStack`, `PeopleGroupsManager`) |
| `src/components/ticket/TicketSummary.tsx` | Verify | Confirm imports work |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Import path mismatches in AssignmentEditor | Medium | Verify `AvatarStack` from `@/components/ui/AvatarStack`, `PeopleGroupsManager` from `@/components/people/PeopleGroupsManager` before applying |
| Stepper breaks with 5 items | Low | Test rendering |
| Bottom button logic for new steps | Low | Follow source pattern exactly |

## Rollback Plan

```bash
git checkout HEAD -- src/views/NewTicketView.tsx
```

## Dependencies

- Existing `AssignmentEditor` and `TicketSummary` components must be importable and functional
- `PeopleGroupsManager` component must exist (used by AssignmentEditor)

## Success Criteria

- [ ] 6-step flow works end-to-end: capture → review → participants → assign → summary
- [ ] AssignmentEditor renders and allows assigning items to participants
- [ ] TicketSummary shows final split, calculates correctly, saves ticket
- [ ] Build passes (`pnpm build`)
- [ ] Existing tests pass (`pnpm test`)