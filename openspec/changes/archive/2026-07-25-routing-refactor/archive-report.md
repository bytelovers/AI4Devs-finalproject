# Archive Report: Routing Refactor

**Change:** routing-refactor
**Status:** COMPLETED
**Archive Date:** 2026-07-25
**Worktree:** `frontend-routing`
**Branch:** `refactor/routing`
**Base Commit:** `fc54af0` (+1664/-1265 across 28 files)

---

## Summary

Migration from Zustand-based `currentView` routing to react-router-dom v7 URL-based routing. Two phases: top-level routes (Phase 1) and wizard nested routes (Phase 2). All 193 tests pass, TypeScript builds clean, and Judgment Day is APPROVED.

---

## What Was Implemented

### Phase 1 — Top-Level Routes
- Added `react-router-dom@^7` dependency
- Created route tree in `main.tsx` with `<BrowserRouter><Routes>` wrapping all top-level paths
- Created `renderWithRouter` test helper in `setupTests.ts` using `createMemoryRouter`
- Converted `AppShell` to use `<Outlet />` and `NavLink` for bottom navigation with active-state highlighting
- Created `TicketsListView` for `/tickets` showing all tickets (no slice)
- Updated `store.ts`: added `useRouterNavigate()` hook with `useNavigate()` wrappers; removed `activeTicketId`/`activeGroupId` from Zustand state
- Updated all views to use `useParams()` instead of Zustand params (`GroupDetailView`, `TicketDetailView`, etc.)
- Updated `HomeView` "Ver todo" button → `navigate('/tickets')`
- Added route rendering integration tests

### Phase 2 — Wizard Nested Routes
- Split monolithic `NewTicketView` into `NewTicketLayout` (parent route) + 5 step components (`CaptureStep`, `ReviewStep`, `ParticipantsStep`, `AssignStep`, `SummaryStep`)
- Defined child routes under `/tickets/new/*` with `index` redirecting to `/tickets/new/capture`
- Implemented parent loader creating draft ticket if none exists
- Implemented child loaders with precondition guards (deep-link protection)
- Implemented child actions for form submission → advance to next step
- Implemented `useBlocker` per step for dirty-form protection and back-button draft cleanup
- Handled transient steps (`scanning`, `ocr-review`) as internal state, not routes
- Added wizard integration tests

### Fixes Applied (Judgment Day — 6 corrections)
1. **AppShell.tsx**: Evaluated NavLink `isActive` locally before passing to Icon props
2. **useBlocker.ts**: Changed dependency array to depend on `blocker.state` instead of stable `blocker` object
3. **NewTicketCaptureView.tsx**: Added placeholder item before navigating to review (prevents infinite loop)
4. **store.ts**: Added `draftTicketId: null` to `resetAll()`
5. **TicketDetailView.tsx**: Added `useEffect` to sync `titleDraft` on ticket change
6. **main.tsx**: Removed dead `scanning`/`ocr-review` routes

---

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| react-router-dom v7 over wouter/@tanstack/router | Best balance of bundle size (~12KB gz), type safety, nested route support, `useBlocker`, and PWA compatibility |
| Code-based routes over file-based | Simpler migration path; no build-tool changes needed |
| SPA mode only (no SSR) | Current architecture is client-only; SSR out of scope |
| Two-phase delivery | Phase 1 (top-level routes) was safe, low-risk; Phase 2 (wizard nested routes) was higher complexity with loaders/blockers |
| Rollback via feature flag `useReactRouter` | Toggle off → Zustand `currentView` fallback; no data migration needed |
| `activeTicketId`/`activeGroupId` removed from Zustand | URL is now source of truth for active resource IDs via `useParams()` |
| Transient steps as internal state | `/scanning` and `/ocr-review` are not deep-linkable; redirect to parent route |
| 2 chained PRs (stacked-to-main) | Exceeded 400-line review budget; Phase 1 and Phase 2 as independent merges |

---

## Engram Observation Traceability

| Artifact | Observation ID |
|----------|---------------|
| SDD Exploration | #283 (`sdd/routing-refactor/exploration`) |
| SDD Proposal | #284 (`sdd/routing-refactor/proposal`) |
| SDD Spec | #285 (`sdd/routing-refactor/spec`) |
| SDD Design | #286 (`sdd/routing-refactor/design`) |
| SDD Tasks | #291 (`sdd/routing-refactor/tasks`) |
| Judgment Day Report | #292 (`sdd/routing-refactor/judgment-day`) |
| Archive Report (this) | `sdd/routing-refactor/archive-report` |

---

## Stale Checkbox Reconciliation Note

The `tasks.md` file in the archived change contains unchecked `- [ ]` checkboxes for all 16 tasks. This is a mechanical artifact of the task template — the orchestrator confirmed (via implementation status, commit `fc54af0`, 193/193 passing tests, clean TypeScript build, and APPROVED Judgment Day verdict) that all implementation tasks are complete. The archive proceeded with exceptional stale-checkbox reconciliation based on apply-progress and verify-report evidence provided by the orchestrator.

---

## Test Status

| Metric | Result |
|--------|--------|
| Total tests | 193/193 ✅ |
| TypeScript (`tsc --noEmit`) | Clean ✅ |
| Bundle size | Within budget (≤ 15KB gz) ✅ |
| Judgment Day | APPROVED ✅ |
| Lighthouse PWA | ≥ 90 offline ✅ |

---

## Open Items

None. All Phase 1 and Phase 2 requirements are implemented and verified.

---

## Next Steps for the Project

1. **Merge `refactor/routing` branch** into `main` via the chained PR strategy
2. **Monitor PWA offline behavior** post-merge since routing changes affect Service Worker navigation handling
3. **Consider Playwright E2E tests** for critical user flows as a stretch goal
4. **Clean up Zustand navigation remnants** — `ViewName` type and any remaining `setView()` references can be removed in a follow-up

---

## Archive Contents

| Artifact | Status |
|----------|--------|
| tasks.md | ✅ (16 tasks complete) |
| judgment-day-report.md | ✅ (APPROVED) |
| archive-report.md | ✅ (this file) |

**Source of Truth:** Engram observations (`sdd/routing-refactor/*`) + archived change folder
