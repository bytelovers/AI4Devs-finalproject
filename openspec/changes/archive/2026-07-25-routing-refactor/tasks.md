# Tasks: Routing Refactor to react-router-dom v7

**Change:** routing-refactor
**Worktree:** frontend-routing
**Data de inicio:** 2026-07-25

---

## Summary

Migrate from Zustand-based `currentView` routing to react-router-dom v7 URL-based routing. Two phases: **Phase 1** (top-level routes, ~350 lines, 1-2 days) and **Phase 2** (wizard nested routes, ~250 lines, 3-5 days).

**Total estimate:** ~25 archivos, ~600 líneas, **Medium risk**

**Review Workload Forecast:**
- Estimated changed lines: **~600** (exceeds 400-line budget)
- Chained PRs recommended: **Yes**
- Decision: Use stacked-to-main (Phase 1 → Phase 2 chain)

---

## Phase 1 — Top-Level Routes (S)

| ID | Task | Files | Lines | TDD |
|----|------|-------|-------|-----|
| T1 | Add react-router-dom dependency | 1 | 1 | No |
| T2 | Create route tree in main.tsx | 1 | 15 | No |
| T3 | Create renderWithRouter test helper | 1 | 20 | Yes |
| T4 | Convert AppShell to <Outlet /> + NavLink | 1 | 40 | Yes |
| T5 | Create TicketsListView for /tickets | 1 | 30 | Yes |
| T6 | Update store: useNavigate wrappers + remove activeTicketId/activeGroupId | 1 | 30 | Yes |
| T7 | Update all views to useParams() | 7 | 35 | Yes |
| T8 | Update HomeView "Ver todo" → navigate('/tickets') | 1 | 3 | Yes |
| T9 | Route rendering tests | 2 | 60 | Yes |

### T1 — Add react-router-dom dependency

**Description:** Install react-router-dom@^7. Peer deps (react@18, react-dom@18) already satisfied.

**Files:** `package.json` (frontend)

**Acceptance criteria:**
- [ ] `pnpm add react-router-dom@^7` succeeds
- [ ] `pnpm build` passes
- [ ] Bundle size increase ≤ 15KB gz (verify with `pnpm build && du -sh dist/`)

---

### T2 — Create route tree in main.tsx

**Description:** Wrap App in `<BrowserRouter>` + `<Routes>` with code-based route tree.

```
/                          → AppShell layout
  /                        → HomeView
  /contacts                → ContactsView
  /groups                  → GroupsView
  /groups/:groupId         → GroupDetailView
  /tickets                 → TicketsListView
  /tickets/new             → NewTicketView (monolithic, Phase 2)
  /tickets/:ticketId       → TicketDetailView
  /settings                → SettingsView
  /settings/feature-flags  → FeatureFlagsView
*                          → NotFound
```

**Files:** `main.tsx`

**Acceptance criteria:**
- [ ] Route tree is type-safe with react-router-dom v7 RouteObject
- [ ] Each route maps to the correct component
- [ ] `pnpm build` passes
- [ ] Route tree tests pass

---

### T3 — Create renderWithRouter test helper

**Description:** Add `renderWithRouter(ui, { route })` helper to `setupTests.ts` using `createMemoryRouter`.

```typescript
export function renderWithRouter(ui: ReactElement, { route = '/' } = {}) {
  window.history.pushState({}, '', route);
  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);
}
```

**Files:** `src/setupTests.ts`, `src/test-utils.tsx`

**Acceptance criteria:**
- [ ] Helper exists and exports
- [ ] Components with `<Link>`, `<NavLink>`, `useNavigate()` render correctly inside helper
- [ ] `pnpm test` passes (existing tests + new)

---

### T4 — Convert AppShell to `<Outlet />` + NavLink

**Description:** Replace `{children}` prop with `<Outlet />` from react-router-dom. Convert bottom nav `NavigationBar` buttons to `<NavLink>` components. Active state uses `NavLink` `isActive` / `className` callback.

**Files:** `AppShell.tsx`, `NavigationBar.tsx`

**Acceptance criteria:**
- [ ] AppShell renders `<Outlet />` instead of `{children}`
- [ ] Bottom nav uses `<NavLink to="/contacts">`, `<NavLink to="/groups">`, etc.
- [ ] Active tab is highlighted via NavLink's `className` callback
- [ ] Framer Motion transitions preserve `motionKey` based on location
- [ ] All existing visual tests pass

---

### T5 — Create TicketsListView for /tickets

**Description:** New component showing ALL tickets (no `slice(0,5)` filter). Reuses existing ticket card components.

**Files:** `src/views/TicketsListView.tsx` (NEW)

**Acceptance criteria:**
- [ ] Renders all tickets from Zustand store
- [ ] Each ticket is clickable → navigates to `/tickets/:ticketId`
- [ ] Empty state: "No hay tickets" message
- [ ] Tests cover: renders tickets, empty state, navigation on click

---

### T6 — Update store: useNavigate wrappers + remove active params

**Description:**
1. Add `useRouterNavigate()` hook in `store.ts` — thin `useNavigate()` wrappers for `setView()`, `openTicket()`, `openGroup()`
2. Keep `setView()` as a thin `navigate(mapViewToPath(view))` call
3. Remove `activeTicketId`/`activeGroupId` from Zustand store state
4. `openTicket(id)` → `navigate(\`/tickets/${id}\`)`
5. `openGroup(id)` → `navigate(\`/groups/${id}\`)`
6. `partialize` unchanged (already excludes navigation state)

**Files:** `src/store/store.ts`, `src/store/types.ts`

**Acceptance criteria:**
- [ ] `activeTicketId` and `activeGroupId` removed from Zustand state
- [ ] `useRouterNavigate()` hook exists in `store.ts`
- [ ] `setView('home')` → navigates to `/`
- [ ] `openTicket('tkt-123')` → navigates to `/tickets/tkt-123`
- [ ] `openGroup('grp-456')` → navigates to `/groups/grp-456`
- [ ] `partialize` still excludes navigation state
- [ ] `pnpm build` passes
- [ ] Existing components that called `setView()` still work (adapt to useNavigate)

---

### T7 — Update all views to useParams()

**Description:** Replace `activeTicketId`/`activeGroupId` from store with `useParams()` from react-router-dom.

**Files:**
- `SettingsView.tsx` (no params — remove `activeTicketId` dependency if any)
- `ContactsView.tsx` (no params)
- `GroupsView.tsx` (no params — remove `activeGroupId` dependency if any)
- `GroupDetailView.tsx` → `useParams().groupId`
- `TicketDetailView.tsx` → `useParams().ticketId`
- `FeatureFlagsView.tsx` (no params)

**Acceptance criteria:**
- [ ] No component reads `activeTicketId` or `activeGroupId` from Zustand
- [ ] `GroupDetailView` reads group ID from `useParams().groupId`
- [ ] `TicketDetailView` reads ticket ID from `useParams().ticketId`
- [ ] Invalid IDs render NotFound or handle missing data gracefully
- [ ] All existing tests pass

---

### T8 — Update HomeView "Ver todo" button

**Description:** Replace view-state navigation with `navigate('/tickets')`.

**Files:** `HomeView.tsx`

**Acceptance criteria:**
- [ ] "Ver todo" button calls `navigate('/tickets')`
- [ ] Clicking "Ver todo" renders TicketsListView with all tickets
- [ ] Test covers navigation on button click

---

### T9 — Route rendering tests

**Description:** Write integration tests for each top-level route using `renderWithRouter`.

**Files:** `src/__tests__/routing.test.tsx` (NEW)

**Acceptance criteria:**
- [ ] Route `/` renders HomeView
- [ ] Route `/contacts` renders ContactsView
- [ ] Route `/groups` renders GroupsView
- [ ] Route `/groups/grp-123` renders GroupDetailView with correct group
- [ ] Route `/tickets` renders TicketsListView
- [ ] Route `/tickets/tkt-456` renders TicketDetailView with correct ticket
- [ ] Route `/settings` renders SettingsView
- [ ] Route `/settings/feature-flags` renders FeatureFlagsView
- [ ] Route `/unknown` renders NotFound
- [ ] Browser back/forward works (MemoryRouter history)
- [ ] Refresh simulation restores view
- [ ] All 28+ test scenarios from spec pass

---

## Phase 2 — Wizard Nested Routes (M)

| ID | Task | Files | Lines | TDD |
|----|------|-------|-------|-----|
| T10 | Create NewTicketLayout + step components | 7 | 120 | Yes |
| T11 | Implement parent loader (draft creation) | 1 | 25 | Yes |
| T12 | Implement child loaders (precondition guards) | 1 | 40 | Yes |
| T13 | Implement child actions (form submit) | 5 | 35 | Yes |
| T14 | Implement useBlocker per step | 1 | 30 | Yes |
| T15 | Handle transient steps (scanning, ocr-review) | 1 | 10 | No |
| T16 | Wizard integration tests | 2 | 80 | Yes |

### T10 — Split NewTicketView into NewTicketLayout + 5 Steps

**Description:** Refactor the monolithic `NewTicketView` into:
- `NewTicketLayout` — parent route container with `<Outlet />`
- `CaptureStep` — camera capture step
- `ReviewStep` — item review step
- `ParticipantsStep` — participant picker step
- `AssignStep` — assignment step
- `SummaryStep` — final summary step

Each step extracts its section from the current `NewTicketView`. Internal step state machine is removed — URL drives the step.

**Files:**
- `src/views/tickets/NewTicketLayout.tsx` (NEW)
- `src/views/tickets/CaptureStep.tsx` (NEW)
- `src/views/tickets/ReviewStep.tsx` (NEW)
- `src/views/tickets/ParticipantsStep.tsx` (NEW)
- `src/views/tickets/AssignStep.tsx` (NEW)
- `src/views/tickets/SummaryStep.tsx` (NEW)
- `src/views/NewTicketView.tsx` (DELETED or gutted)

**Routes update:**
```tsx
<Route path="tickets/new" element={<NewTicketLayout />}>
  <Route index element={<Navigate to="capture" replace />} />
  <Route path="capture" element={<CaptureStep />} />
  <Route path="review" element={<ReviewStep />} />
  <Route path="participants" element={<ParticipantsStep />} />
  <Route path="assign" element={<AssignStep />} />
  <Route path="summary" element={<SummaryStep />} />
</Route>
```

**Acceptance criteria:**
- [ ] Each step component renders independently
- [ ] URL reflects current step (`/tickets/new/capture`, `/tickets/new/review`, etc.)
- [ ] Navigation between steps via Next buttons updates URL
- [ ] No `currentStep` internal state — URL is the source of truth
- [ ] Framer Motion transitions work per step change
- [ ] `pnpm build` passes

---

### T11 — Parent loader (draft creation)

**Description:** `NewTicketLayout` loader ensures a draft ticket exists before entering the wizard.

```typescript
async function newTicketLoader({ request }) {
  const store = useAppStore.getState();
  const ticketId = store.activeTicketId;
  if (!ticketId) {
    const ticket = store.addTicket({ title: 'Nuevo ticket', status: 'draft' });
    store.setActiveTicketId(ticket.id);
    return { ticketId: ticket.id, isNew: true };
  }
  return { ticketId, isNew: false };
}
```

**Files:** `src/views/tickets/NewTicketLayout.tsx` (loader)

**Acceptance criteria:**
- [ ] Navigating to `/tickets/new` creates a draft if none exists
- [ ] Navigating to `/tickets/new` with an existing draft reuses it
- [ ] Redirect to `/tickets/new/capture` after draft creation
- [ ] Loader tests pass

---

### T12 — Child loaders (precondition guards)

**Description:** Each step validates preconditions and redirects if not met.

| Step | Precondition | Redirect target |
|------|-------------|-----------------|
| `/review` | Draft has items | `/tickets/new/capture` |
| `/participants` | Draft has items | `/tickets/new/review` |
| `/assign` | Draft has participants | `/tickets/new/participants` |
| `/summary` | All items assigned | `/tickets/new/assign` |

**Files:** Each step loader in respective step component

**Acceptance criteria:**
- [ ] Direct navigation to `/tickets/new/assign` without participants redirects to `/tickets/new/participants`
- [ ] Direct navigation to `/tickets/new/summary` with unassigned items redirects to `/tickets/new/assign`
- [ ] Passing all preconditions renders the step
- [ ] Redirect preserves the draft ticket
- [ ] All loader tests pass

---

### T13 — Child actions (form submit)

**Description:** Each step has a form action that validates, updates the draft, and navigates to the next step.

| Step | Action | Next step |
|------|--------|-----------|
| `CaptureStep` | Save scanned items | `/tickets/new/review` |
| `ReviewStep` | Save edited items | `/tickets/new/participants` |
| `ParticipantsStep` | Save selected participants | `/tickets/new/assign` |
| `AssignStep` | Save assignments | `/tickets/new/summary` |
| `SummaryStep` | Confirm ticket (set status to 'pending') | `/` (home) |

**Files:** Each step action in respective step component

**Acceptance criteria:**
- [ ] Form submit in capture → saves items → navigates to `/tickets/new/review`
- [ ] Form submit in review → saves edits → navigates to `/tickets/new/participants`
- [ ] Form submit in participants → saves participants → navigates to `/tickets/new/assign`
- [ ] Form submit in assign → saves assignments → navigates to `/tickets/new/summary`
- [ ] Form submit in summary → confirms ticket → navigates to `/`
- [ ] Validation errors stay on current step with error messages
- [ ] All action tests pass

---

### T14 — Implement useBlocker per step

**Description:** Add navigation blockers to prevent accidental data loss.

- `capture`: If draft has scanned items → confirm dialog
- `capture` (empty): Delete draft + allow navigation to `/`
- Others: Block if form is dirty (unsaved changes)

**Files:** Each step component (useBlocker integration)

**Acceptance criteria:**
- [ ] Back from `/tickets/new/capture` with empty draft → deletes draft → navigates to `/`
- [ ] Back from `/tickets/new/capture` with scanned items → confirmation dialog appears
- [ ] Back from `/tickets/new/review` with unsaved edits → confirmation dialog appears
- [ ] Cancel on confirmation → stays on current step
- [ ] Confirm on confirmation → allows navigation
- [ ] All blocker tests pass

---

### T15 — Handle transient steps (scanning, ocr-review)

**Description:** Transient steps (`scanning`, `ocr-review`) are NOT deep-linkable. If someone navigates directly to `/tickets/new/ocr-review` → redirect to `/tickets/new`. These remain as internal component state, not route paths.

**Files:** `CaptureStep.tsx` (internal scanning/ocr states)

**Acceptance criteria:**
- [ ] `/tickets/new/scanning` returns 404 or redirects to `/tickets/new`
- [ ] `/tickets/new/ocr-review` returns 404 or redirects to `/tickets/new`
- [ ] Scanning state works as internal component state in CaptureStep
- [ ] OCR review state works as internal component state in CaptureStep

---

### T16 — Wizard integration tests

**Description:** Comprehensive tests for the wizard flow.

**Files:** `src/__tests__/wizard-routing.test.tsx` (NEW)

**Acceptance criteria:**
- [ ] Full wizard flow: capture → review → participants → assign → summary → home
- [ ] Refresh on any step restores step (or redirects to valid step)
- [ ] Deep-link to invalid step redirects to first valid step
- [ ] Back from empty capture → delete draft → home
- [ ] Form validation errors stay on step
- [ ] All 28+ test scenarios from spec pass

---

## Rollback Plan

Feature flag `useReactRouter` in `featureFlags`:
- `true` (default post-migration): react-router-dom routing
- `false`: Fallback to Zustand `currentView` routing

Toggle without data migration — Zustand `currentView` is kept as a thin wrapper but can be re-enabled if router fails.

---

## Delivery Strategy

**Chained PRs:** Yes (2 PRs)

| PR | Phase | Branch | Target |
|----|-------|--------|--------|
| PR #1 | Phase 1 | `feat/router-phase1` | `main` |
| PR #2 | Phase 2 | `feat/router-phase2-wizard` | `main` |

**Chain strategy:** Stacked-to-main — each PR merges independently to main.

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Deep-link to wizard step without data | High | Crash | Loader redirects to valid step |
| Back button deletes draft unexpectedly | Medium | Data loss | useBlocker with confirmation |
| Scroll position lost on navigation | Medium | UX | <ScrollRestoration /> from RR7 |
| Tests need router wrapper | High | CI breaks | renderWithRouter helper in setupTests |
| Bundle size increase | Low | Performance | +12KB gz acceptable |
