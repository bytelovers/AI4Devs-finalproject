# SDD Tasks — Phase 3: Domain Views Migration

## Executive Summary

Migrate 9 domain views/components from the external workspace into SplitEat.
The original plan called for 6 views, but 3 prerequisite components (`TicketItemsEditor`,
`AssignmentEditor`, `ScanEngineSelector`) from Phase 2 are missing on the target branch
and must be included to avoid compilation failures.

**Change**: `phase3-domain-views-migration`
**Strategy**: `single-pr` (size:exception pre-approved)
**Base**: `feature/feature-entrega2-ADLC`
**Branch**: `feature/entrega2/phase3-domain-views-migration`

## Review Workload Guard

- **Decision needed before apply**: No — pre-approved via `size:exception`
- **Chained PRs recommended**: No
- **400-line budget risk**: **High** (exception pre-approved)
  - Source lines migrated: ~3,337 total across 9 files
  - Tests: ~250 lines (3 test files)
  - Wiring: ~40 lines (main.tsx + PlaceholderViews.tsx)
  - **Total additions forecast**: ~3,600+ lines

## Pre-existing Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| `NewTicketView` imported in `main.tsx` but file missing | `tsc` error pre-dates this phase | Ignore — Phase 2 gap, not in scope |
| `<style jsx>` in `ticket-items-editor.tsx` (Next.js feature) | Won't compile in Vite | Convert to regular `<style>` tag (keyframes are global) |
| UI may need light polish (spacing, Tailwind config differences) | Cosmetic variance from source | Accept as-is, no UX redesign |

---

## Task T001 — Migrate ContactsView

**File**: `contacts-view.tsx` (247 lines) → `src/views/ContactsView.tsx`

### Import Re-routes
| Old | New |
|-----|-----|
| `import { PageHeader, EmptyState } from './empty-state'` | `import { PageHeader, EmptyState } from '@/components/ui/EmptyState'` |
| `import { Avatar } from './avatar'` | `import { Avatar } from '@/components/ui/AvatarStack'` |
| `'use client'` | **Remove** (not needed in Vite SPA) |

### Store API Contract
- `useAppStore.people`, `.addPerson`, `.updatePerson`, `.deletePerson`
- `useAppStore.tickets`, `.groups`, `.setView`

### Acceptance
- [ ] Contacts list renders with correct CRUD (add via dialog, edit inline, delete with confirmation)
- [ ] Groups quick-section renders below contacts list
- [ ] Empty state shows when no contacts
- [ ] Edit/Cancel/Delete flow works without errors
- [ ] `Avatar` shows correct initials and color per person
- [ ] All `@/components/ui/` imports resolve

### Estimated lines: +247

---

## Task T002 — Migrate GroupsView (including GroupDetailView)

**File**: `groups-view.tsx` (348 lines) → `src/views/GroupsView.tsx`

### Import Re-routes
| Old | New |
|-----|-----|
| `import { PageHeader, EmptyState } from './empty-state'` | `import { PageHeader, EmptyState } from '@/components/ui/EmptyState'` |
| `import { Avatar, AvatarStack } from './avatar'` | `import { Avatar, AvatarStack } from '@/components/ui/AvatarStack'` |
| `'use client'` | **Remove** |

### Structural Notes
- File exports TWO components: `GroupsView` and `GroupDetailView`
- `GroupDetailView` is a separate view (navigation target `group-detail`)
- Both must be exported from the file

### Store API Contract
- `useAppStore.groups`, `.people`, `.addGroup`, `.updateGroup`, `.deleteGroup`
- `useAppStore.addMemberToGroup`, `.removeMemberFromGroup`, `.openGroup`, `.setView`

### Acceptance
- [ ] Groups list renders with create/edit/delete
- [ ] GroupDetailView accessible (shows member list, add/remove members)
- [ ] Sheet for adding members works with non-member list
- [ ] Empty state shown when no contacts (prevents group creation)
- [ ] AvatarStack shows member previews

### Estimated lines: +348

---

## Task T003 — Migrate PeopleGroupsManager

**File**: `people-groups-manager.tsx` (406 lines) → `src/components/people/PeopleGroupsManager.tsx`

### Import Re-routes
| Old | New |
|-----|-----|
| `import { Avatar } from './avatar'` | `import { Avatar } from '@/components/ui/AvatarStack'` |
| `'use client'` | **Remove** |

**Note**: `import type { ID } from '@/lib/types'` — already correct, no change needed.

### Store API Contract
- `useAppStore.people`, `.groups`, `.addPerson`, `.addGroup`, `.addMemberToGroup`

### Props Interface
```typescript
interface PeopleGroupsManagerProps {
  selectedIds: ID[]
  onTogglePerson: (id: ID) => void
  onAddPeople: (ids: ID[]) => void
}
```

### Acceptance
- [ ] Person search/add, group import, group creation all work
- [ ] Selection check marks toggle correctly (full, partial, none per group)
- [ ] Selected people summary card renders at bottom
- [ ] Dialog for creating new group from within the component works

### Estimated lines: +406

---

## Task T004 — Migrate TicketItemsEditor

**File**: `ticket-items-editor.tsx` (623 lines) → `src/components/ticket/TicketItemsEditor.tsx`

### Import Re-routes
| Old | New |
|-----|-----|
| `'use client'` | **Remove** |
| `<style jsx>{…}</style>` | Convert to `<style>{…}</style>` (Vite-compatible) |

All other imports already use `@/lib/` or `@/components/ui/` paths — no changes needed.

### Structural Notes
- File exports THREE components: `TicketItemsEditor` (default), `ScanningOverlay`, `ScanErrorBanner`, `ScanSuccessBanner`
- `ScanningOverlay` uses `<style jsx>` for the scanline keyframe animation → convert to plain `<style>` (keyframes are global by nature so scoping is not needed)

### Store API Contract
- `useAppStore.updateTicketItem`, `.addTicketItem`, `.deleteTicketItem`
- `useAppStore.addTicketDiscount`, `.updateTicketDiscount`, `.deleteTicketDiscount`
- `useAppStore.recalcTicket`, `.updateTicket`

### Acceptance
- [ ] Item list renders with quantity/price editing
- [ ] Add/delete items works
- [ ] IVA section with mode toggle (included/added), rate selector, amount display
- [ ] Tip section with mode (none/percentage/fixed), value presets
- [ ] Discounts section with add/edit/delete, amount/percentage toggle
- [ ] Summary card shows items → discounts → subtotal → IVA → tip → total
- [ ] ScanningOverlay, ScanErrorBanner, ScanSuccessBanner export correctly

### Estimated lines: +623

---

## Task T005 — Migrate AssignmentEditor

**File**: `assignment-editor.tsx` (696 lines) → `src/components/ticket/AssignmentEditor.tsx`

### Import Re-routes
| Old | New |
|-----|-----|
| `import { Avatar } from './avatar'` | `import { Avatar } from '@/components/ui/AvatarStack'` |
| `import { PeopleGroupsManager } from './people-groups-manager'` | `import { PeopleGroupsManager } from '@/components/people/PeopleGroupsManager'` |
| `'use client'` | **Remove** |

### Store API Contract
- `useAppStore.updateTicketItem`, `.updateTicket`, `.people`, `.groups`

### Acceptance
- [ ] Item assignment list renders with assignment status per item
- [ ] Per-item assignment sheet opens with mode selector (single/shared/weighted)
- [ ] Assign by group quick-buttons work
- [ ] Weight editing works (stepper + manual input for weighted mode)
- [ ] IVA/tip distribution selectors work
- [ ] Participant management (add via PeopleGroupsManager sheet)
- [ ] Summary card shows item total, assigned amount, coverage %

### Estimated lines: +696

---

## Task T006 — Migrate ScanEngineSelector

**File**: `scan-engine-selector.tsx` (225 lines) → `src/components/scan/ScanEngineSelector.tsx`

### Import Re-routes
| Old | New |
|-----|-----|
| `'use client'` | **Remove** |

All imports already use `@/lib/` or `@/components/ui/` paths — no changes needed.

### Store API Contract
- `useAppStore.settings.preferredEngine`, `.updateSettings`

### Acceptance
- [ ] All 4 engine options render with correct icons/precision/weight
- [ ] Engine selection saves to store
- [ ] Offline state disables server engine with warning toast
- [ ] WebGPU detection disables florence2 if unavailable
- [ ] Selected state shows ring/highlight + button says "Seleccionado"

### Estimated lines: +225

---

## Task T007 — Migrate TicketSummary

**File**: `ticket-summary.tsx` (310 lines) → `src/components/ticket/TicketSummary.tsx`

### Import Re-routes
| Old | New |
|-----|-----|
| `import { Avatar } from './avatar'` | `import { Avatar } from '@/components/ui/AvatarStack'` |
| `'use client'` | **Remove** |

All calc imports (`formatEUR`, `formatDate`, `computeShares`, `verifyCuadre`, `calcTicketTotal`, `itemsFullyAssigned`) already use `@/lib/calc` — no changes.

### Store API Contract
- `useAppStore.people`, `.deleteTicket`, `.updateTicket`, `.setView`

### Acceptance
- [ ] Ticket header card renders with merchant, date, item count, total
- [ ] Cuadre status card shows ✓ or warning with detailed diff
- [ ] Per-person breakdown renders sorted by amount, with visual bar, item/IVA/tip detail
- [ ] Verification card shows sum-of-shares vs ticket-total with diff
- [ ] Action buttons: Confirm & close (if cuadrado) / Volver a asignar (if not) / Share / Delete
- [ ] Share uses Web Share API with fallback to clipboard

### Estimated lines: +310

---

## Task T008 — Migrate TicketDetailView

**File**: `ticket-detail-view.tsx` (143 lines) → `src/views/TicketDetailView.tsx`

### Import Re-routes
| Old | New |
|-----|-----|
| `import { TicketSummary } from './ticket-summary'` | `import { TicketSummary } from '@/components/ticket/TicketSummary'` |
| `import { TicketItemsEditor } from './ticket-items-editor'` | `import { TicketItemsEditor } from '@/components/ticket/TicketItemsEditor'` |
| `import { AssignmentEditor } from './assignment-editor'` | `import { AssignmentEditor } from '@/components/ticket/AssignmentEditor'` |
| `import { PeopleGroupsManager } from './people-groups-manager'` | `import { PeopleGroupsManager } from '@/components/people/PeopleGroupsManager'` |
| `import { PageHeader, EmptyState } from './empty-state'` | `import { PageHeader, EmptyState } from '@/components/ui/EmptyState'` |
| `'use client'` | **Remove** |

### Store API Contract
- `useAppStore.activeTicketId`, `.tickets`, `.updateTicket`, `.setView`

### Acceptance
- [ ] 4 tabs render: Resumen / Items / Personas / Asignar
- [ ] Tab switching works with active state styling
- [ ] Summary tab renders TicketSummary component
- [ ] Items tab renders TicketItemsEditor component
- [ ] Participants tab renders PeopleGroupsManager with ticket participant state
- [ ] Assign tab renders AssignmentEditor component
- [ ] Title editing works (inline input + save/cancel)
- [ ] Empty state renders when no ticket found (with back-to-home action)

### Estimated lines: +143

---

## Task T009 — Migrate SettingsView

**File**: `settings-view.tsx` (339 lines) → `src/views/SettingsView.tsx`

### Import Re-routes
| Old | New |
|-----|-----|
| `import { PageHeader } from './empty-state'` | `import { PageHeader } from '@/components/ui/EmptyState'` |
| `import { ScanEngineSelector } from './scan-engine-selector'` | `import { ScanEngineSelector } from '@/components/scan/ScanEngineSelector'` |
| `'use client'` | **Remove** |

### Structural Notes
- Contains internal `SectionTitle` helper component (keep as co-located private component)

### Store API Contract
- `useAppStore.profile`, `.settings`, `.tickets`, `.people`, `.groups`
- `useAppStore.updateProfile`, `.updateSettings`, `.resetAll`, `.setView`
- `calcTicketTotal` from `@/lib/calc`

### Acceptance
- [ ] Stats card renders tickets/contacts/groups counts + total divided
- [ ] Profile section: name + email inputs with save
- [ ] Account section: shows local mode or active account state
- [ ] Preferences: IVA rate selector, default tip % input
- [ ] Scan engine section renders ScanEngineSelector with `detailed` prop
- [ ] Data section: info text + destructive reset-all confirmation dialog
- [ ] Developer section: feature flags link
- [ ] About section: version + description

### Estimated lines: +339

---

## Task T010 — Wiring (main.tsx + PlaceholderViews)

**File**: `src/main.tsx` and `src/views/PlaceholderViews.tsx`

### main.tsx Changes

**Imports**: Replace placeholder imports with real view imports:
```diff
- import {
-   ContactsPlaceholder,
-   GroupsPlaceholder,
-   TicketDetailPlaceholder,
-   SettingsPlaceholder,
-   FeatureFlagsPlaceholder,
-   GroupDetailPlaceholder,
- } from '@/views/PlaceholderViews';
+ import { ContactsView } from '@/views/ContactsView';
+ import { GroupsView, GroupDetailView } from '@/views/GroupsView';
+ import { TicketDetailView } from '@/views/TicketDetailView';
+ import { SettingsView } from '@/views/SettingsView';
+ import { FeatureFlagsPlaceholder } from '@/views/PlaceholderViews';
```

**JSX routing**: Replace placeholder components with real views:
```diff
- {currentView === 'contacts' && <ContactsPlaceholder />}
+ {currentView === 'contacts' && <ContactsView />}
- {currentView === 'groups' && <GroupsPlaceholder />}
+ {currentView === 'groups' && <GroupsView />}
- {currentView === 'ticket-detail' && <TicketDetailPlaceholder />}
+ {currentView === 'ticket-detail' && <TicketDetailView />}
- {currentView === 'settings' && <SettingsPlaceholder />}
+ {currentView === 'settings' && <SettingsView />}
- {currentView === 'group-detail' && <GroupDetailPlaceholder />}
+ {currentView === 'group-detail' && <GroupDetailView />}
```

### PlaceholderViews.tsx Changes

**Remove these exports** (no longer needed):
- `ContactsPlaceholder`
- `GroupsPlaceholder`
- `TicketDetailPlaceholder`
- `SettingsPlaceholder`
- `GroupDetailPlaceholder`

**Keep these exports** (not in migration scope):
- `NewTicketPlaceholder` (may be used by other views)
- `FeatureFlagsPlaceholder` (still active)

### Estimated lines: ~20 changed in main.tsx, ~40 removed from PlaceholderViews.tsx

---

## Task T011 — TypeScript Verification

```bash
npx tsc --noEmit
```

### Acceptance
- [ ] No type errors from new view files or import re-routes
- [ ] All `@/components/people/`, `@/components/ticket/`, `@/components/scan/` imports resolve
- [ ] `tsc --noEmit` exit 0 (except pre-existing errors unrelated to this phase)

**Note**: Pre-existing `NewTicketView` import in main.tsx will still fail until Phase 2 is merged. This is out of scope.

---

## Task T012 — Unit Tests

**Test infrastructure**: Vitest + @testing-library/react with jsdom environment.
Setup already exists at `src/setupTests.ts`. Tests should go in `src/__tests__/`.

### Test files to create

#### T012a — `src/__tests__/ContactsView.test.tsx`
- Renders empty state when no people
- Renders person list with people in store
- Opens add dialog and creates a person
- Edits a person inline
- Delete opens confirmation and removes person
- Groups section renders when groups exist

#### T012b — `src/__tests__/SettingsView.test.tsx`
- Renders stats card with correct counts
- Profile name input and save works
- IVA rate selector changes settings
- Reset all data confirmation dialog
- Scan engine selector renders
- About section renders version text

#### T012c — `src/__tests__/TicketSummary.test.tsx`
- Renders ticket header with merchant/title/date
- Shows cuadre status (ok or warning)
- Shows per-person breakdown with avatars
- Verification card shows sum-shares vs ticket-total
- Share button invokes Web Share API

### Key testing patterns
- Use `renderWithStore` helper that wraps in a populated Zustand store provider
- `import { render, screen, fireEvent } from '@testing-library/react'`
- `import userEvent from '@testing-library/user-event'`
- Mock `navigator.share` / `navigator.clipboard` for share test

### Estimated lines: ~250 total

---

## Task T013 — Build Verification

```bash
npm run build
```

### Acceptance
- [ ] `npm run build` succeeds (exit 0) — ignoring pre-existing Phase 2 gaps
- [ ] All new view components bundled correctly
- [ ] Chunks split without duplication

---

## Task Dependency Graph

```
T001 ──┐
T002 ──┤
T003 ──┤
T004 ──┤
T005 ──┤
T006 ──┤
T007 ──┤
T008 ──┤ (depends on T003, T004, T005, T007)
T009 ──┤ (depends on T006)
        ├──→ T010 (depends on T001, T002, T008, T009)
        ├──→ T011 (depends on T001–T010)
        ├──→ T012 (can start after T001, T009, T007)
        └──→ T013 (depends on T011)
```

**Recommended sequential execution order**: T001 → T002 → T003 → T004 → T005 → T006 → T007 → T008 → T009 → T010 → T011 → T012 → T013
