# Proposal: Phase 3 — Domain Views Migration

## Intent

Migrate the remaining 6 domain views from workspace-previo into the new SplitEat codebase. These are the views users interact with daily: contacts, groups, ticket detail with split summary, and settings. Without them, the app has stubs/placeholders and no way to manage people, review ticket splits, or configure preferences.

## Scope

### In Scope
- **Feature A — Contacts & Groups**: `contacts-view.tsx`, `groups-view.tsx`, `people-groups-manager.tsx` → `src/views/ContactsView.tsx`, `src/views/GroupsView.tsx`, `src/components/people/PeopleGroupsManager.tsx` (+ `GroupDetailView` embedded)
- **Feature B — Ticket Detail**: `ticket-detail-view.tsx`, `ticket-summary.tsx` → `src/views/TicketDetailView.tsx`, `src/components/ticket/TicketSummary.tsx`
- **Feature C — Settings**: `settings-view.tsx` → `src/views/SettingsView.tsx`
- **Imports**: Re-route old-format imports (`./empty-state`, `./avatar`, `./scan-engine-selector`) to existing target components (`@/components/ui/EmptyState`, `@/components/ui/AvatarStack`)
- **Router**: Replace all 6 placeholder views in `src/main.tsx` with real implementations
- **Tests**: Unit + coverage for each new view/component

### Out of Scope
- `TicketItemsEditor`, `AssignmentEditor`, `ScanEngineSelector` — expected to exist from Phase 2 new-ticket-flow migration
- New features or UX changes — pure migration, same behavior
- Backend/sync, auth, cloud features

## Capabilities

### New Capabilities
- `contacts-and-groups`: List/manage contacts and groups, CRUD people, assign group members
- `ticket-detail-summary`: View single ticket with items breakdown, split calculations per person, cuadre verification
- `settings-preferences`: App settings (IVA rate, tip %, rounding, scan engine, theme), profile, data management

### Modified Capabilities
- None — being introduced for the first time

## Approach

Map each external file to its target location using the already-existing store (`useAppStore`) and calc utilities. Adapt imports to the target's component structure (`@/components/ui/` for EmptyState/PageHeader/AvatarStack). Keep component logic identical — no refactoring. Wire into the existing SPA router in `main.tsx` by replacing placeholder imports with real view components.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/views/ContactsView.tsx` | **New** | Full contact list with CRUD + inline groups section |
| `src/views/GroupsView.tsx` | **New** | Group list + `GroupDetailView` (member management) |
| `src/components/people/PeopleGroupsManager.tsx` | **New** | Shared person/group selector used by ticket-detail + new-ticket |
| `src/views/TicketDetailView.tsx` | **New** | 4-tab ticket detail (summary, items, participants, assign) |
| `src/components/ticket/TicketSummary.tsx` | **New** | Split breakdown per person with cuadre verification |
| `src/views/SettingsView.tsx` | **New** | Profile, preferences, engine selector, data management |
| `src/main.tsx` | **Modified** | Replace placeholder imports with real views |
| `src/views/PlaceholderViews.tsx` | **Modified** | Remove migrated placeholder exports |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `TicketItemsEditor`/`AssignmentEditor`/`ScanEngineSelector` not available from Phase 2 branch state | Med | Detect at task time; if missing, add stubs or small migration tasks for those 3 components |
| Import path differences between old `@/lib/store` vs new target | Low | All imports already point to `@/lib/store` and `@/lib/calc` — same as target |
| Old `avatar.tsx` + `empty-state.tsx` combined exports vs target's split files | Low | Re-route `PageHeader`/`EmptyState` to `@/components/ui/EmptyState`; `Avatar`/`AvatarStack` to `@/components/ui/AvatarStack` |

## Rollback Plan

Revert `src/main.tsx` to use placeholders, delete the 6 new view files. All store and calc changes are already merged — no data migration to undo.

## Dependencies

- Store (`src/lib/store.ts`) + calc (`src/lib/calc.ts`) — merged in Phase 1
- UI primitives (all shadcn/ui components) — merged in Phase 1
- Phase 2 components (`TicketItemsEditor`, `ScanEngineSelector`) — expected to exist on the base branch

## Success Criteria

- [ ] All 6 placeholder views replaced with functioning implementations
- [ ] Contacts CRUD works (add/edit/delete people, group management)
- [ ] Ticket detail shows split summary with correct cuadre
- [ ] Settings persist and load correctly (tax, tip, engine, theme)
- [ ] `npm run test -- --coverage` passes with no regressions
- [ ] `npm run typecheck && npm run lint` clean
