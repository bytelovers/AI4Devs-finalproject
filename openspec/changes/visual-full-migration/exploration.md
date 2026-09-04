# Exploration: visual-full-migration

## Topic
Compare current frontend (`frontend/`) with source workspace (`~/Downloads/workspace-previo/`) to identify ALL visual/structural differences that need migration to match the source workspace design exactly.

---

## Current State

### Project Structure Differences

| Aspect | Source (workspace-previo) | Current (frontend) |
|--------|---------------------------|-------------------|
| Component org | Flat: `src/components/cuadra/` | Domain-based: `src/components/{camera,layout,onboarding,people,scan,ticket,ui}/` + `src/views/` |
| App shell | Single `app-shell.tsx` with framer-motion | Split: `AppShell.tsx` (Sidebar) + `NavigationBar.tsx` (mobile bottom nav) |
| Routing | Next.js App Router (`src/app/`) | Vite + React Router (implied by structure) |

---

## Component-by-Component Diff Table

### 1. AppShell / Layout — **MAJOR ARCHITECTURAL DIFFERENCE**

| File | Source | Current | Key Differences |
|------|--------|---------|-----------------|
| AppShell | `src/components/cuadra/app-shell.tsx` | `src/components/layout/AppShell.tsx` + `src/components/layout/NavigationBar.tsx` | **Source**: Single component, `framer-motion` page transitions (`AnimatePresence` + `motion.div`), `max-w-md mx-auto`, `safe-top`/`safe-bottom` classes, centered mobile layout, bottom nav with center FAB.<br>**Current**: Desktop Sidebar (Radix UI) + separate mobile `NavigationBar`. No framer-motion. No `max-w-md` constraint. No safe-area insets. Different breakpoint strategy. |

**Source AppShell features missing in Current:**
- `framer-motion` page transitions (fade + slide)
- `max-w-md mx-auto` centered container
- `safe-top` / `safe-bottom` Tailwind classes
- Single unified component handling both mobile + desktop (via `isDetail` flag)

**Current AppShell features not in Source:**
- Radix UI Sidebar with collapsible icon mode
- Persistent sidebar header with logo
- Desktop-first responsive design

---

### 2. NavigationBar / Bottom Nav — **STRUCTURAL DIFFERENCE**

| File | Source | Current | Key Differences |
|------|--------|---------|-----------------|
| Bottom Nav | Embedded in `app-shell.tsx` (lines 54-117) | `src/components/layout/NavigationBar.tsx` | **Source**: Part of AppShell, uses same `NAV_ITEMS`, center FAB for "Nuevo", framer-motion ready.<br>**Current**: Extracted duplicate, no framer-motion, identical visual structure but separate file. |

**Missing from Current NavigationBar:**
- No framer-motion integration (source had it in parent AppShell)
- `safe-bottom` class missing (source has it on nav container)

---

### 3. Avatar System — **COMPLETELY DIFFERENT API**

| File | Source | Current | Key Differences |
|------|--------|---------|-----------------|
| Avatar | `src/components/cuadra/avatar.tsx` (lines 1-45) | `src/components/ui/avatar.tsx` | **Source**: Custom div-based Avatar with `person`, `name`, `color`, `initials`, `size` (xs/sm/md/lg). Uses `cn`, inline `style={{backgroundColor}}`.<br>**Current**: Radix UI `AvatarPrimitive` wrapper (Root, Image, Fallback). Different props. No `person` prop. Uses `data-slot`. |
| AvatarStack | Same file `avatar.tsx` (lines 47-75) | `src/components/ui/AvatarStack.tsx` | **Source**: Exports from same file, uses local `Avatar`.<br>**Current**: Separate file, imports custom `Avatar` from same file (but current `avatar.tsx` is Radix-based, so `AvatarStack` has its own local `Avatar` copy!). **DUPLICATION**: Current has two Avatar implementations. |

**Impact**: Any component using `Avatar` from `@/components/ui/AvatarStack` gets the custom one. Components using `@/components/ui/avatar` get Radix. Source uses single consistent custom Avatar everywhere.

---

### 4. EmptyState & PageHeader — **NEARLY IDENTICAL**

| File | Source | Current | Differences |
|------|--------|---------|-------------|
| EmptyState/PageHeader | `src/components/cuadra/empty-state.tsx` | `src/components/ui/EmptyState.tsx` | Only difference: Source has `'use client'` directive. Current doesn't (in `components/ui/` it may not need it). Code is byte-for-byte identical otherwise. |

---

### 5. ParticipantPicker — **MAJOR IMPLEMENTATION DIFFERENCE**

| File | Source | Current | Key Differences |
|------|--------|---------|-----------------|
| ParticipantPicker | `src/components/cuadra/participant-picker.tsx` (30 lines) | `src/components/ticket/ParticipantPicker.tsx` (224 lines) | **Source**: Tiny wrapper that just renders `<PeopleGroupsManager selectedIds={...} onTogglePerson={...} onAddPeople={...} />`.<br>**Current**: Full custom implementation with:<br>- Direct person list with edit/delete per contact<br>- Selected persons chips with remove buttons<br>- Group quick links (horizontal scroll)<br>- Dialog for adding new contacts<br>- **Does NOT use PeopleGroupsManager** |

**Missing in Current ParticipantPicker:**
- Group management (create/edit/delete groups)
- Import entire groups
- Add existing people to groups
- All the rich group UX from PeopleGroupsManager

---

### 6. PeopleGroupsManager — **MODERATE FEATURE GAP**

| File | Source | Current | Missing in Current |
|------|--------|---------|-------------------|
| PeopleGroupsManager | `src/components/cuadra/people-groups-manager.tsx` (406 lines) | `src/components/people/PeopleGroupsManager.tsx` (401 lines) | **Source has additional:**<br>- `Pencil`, `Trash2`, `ChevronRight` icons imported<br>- **Edit group name** (inline editing with save/cancel)<br>- **Delete group** (AlertDialog confirmation)<br>- `addMemberToGroup` store action used<br>- Group cards show member avatars inline (Current shows them too but differently)<br>**Current lacks:** Edit/Delete group functionality entirely |

---

### 7. TicketSummary — **MINOR MISSING FEATURES**

| File | Source | Current | Missing in Current |
|------|--------|---------|-------------------|
| TicketSummary | `src/components/cuadra/ticket-summary.tsx` (310 lines) | `src/components/ticket/TicketSummary.tsx` (307 lines) | **Source imports:** `Download`, `RotateCcw`, `Trash2`, `Share2`<br>**Current imports:** `RotateCcw`, `Trash2`, `Share2` (NO `Download`)<br>**Usage:** Source has `Download` imported but **not used in JSX**. `RotateCcw` used in "Volver a asignar" button. Both have Share/Delete actions. |

**Verdict**: Nearly identical. Current missing unused `Download` import.

---

### 8. AssignmentEditor — **MINOR IMPORT/STYLING DIFFERENCES**

| File | Source | Current | Differences |
|------|--------|---------|-------------|
| AssignmentEditor | `src/components/cuadra/assignment-editor.tsx` (696 lines) | `src/components/ticket/AssignmentEditor.tsx` (694 lines) | **Imports:**<br>- Source: `Sheet` from `@/components/ui/sheet`<br>- Current: `Sheet` from `@/components/ui/sheet` (same)<br>- Source: Local `Label` component (lines 251-257)<br>- Current: Imports `Label` from `@/components/ui/label`<br>- **Icons**: Both use `Folder`, `Plus`, `Minus`, `Check`, `Divide`, `User`, `Users`, `Scale`<br>**Logic**: Nearly identical. Current uses `@/ui/AvatarStack` Avatar (custom), Source uses local `Avatar`. |

---

### 9. CameraCapture — **SIGNIFICANT FEATURE GAP**

| File | Source | Current | Missing in Current |
|------|--------|---------|-------------------|
| CameraCapture | `src/components/cuadra/camera-capture.tsx` (421 lines) | `src/components/camera/CameraCapture.tsx` (227 lines) + `CameraViewfinder.tsx` + `useCamera` hook | **Source has fully functional:**<br>- Native camera mode (`capture="environment"` input)<br>- File upload mode (`type="file"` input)<br>- Image compression utility (`compressImage` function, 1600px max, 0.85 quality)<br>- Multiple capture modes: `live` \| `native` \| `upload` \| `preview`<br>- Manual stream management (getUserMedia, track stopping)<br>**Current:**<br>- Uses `useCamera` hook + `CameraViewfinder` component<br>- Native/Upload buttons **disabled** (visible but `disabled`, `opacity-50`, `cursor-not-allowed`)<br>- No image compression<br>- Simpler mode system: `live` \| `preview` only |

---

### 10. ScanOnboarding — **IDENTICAL**

| File | Source | Current | Differences |
|------|--------|---------|-------------|
| ScanOnboarding | `src/components/cuadra/scan-onboarding.tsx` (565 lines) | `src/components/onboarding/ScanOnboarding.tsx` (527 lines) | Only import path differences (relative vs `@/`). Logic 100% identical. |

---

### 11. ScanEngineSelector — **IDENTICAL**

| File | Source | Current | Differences |
|------|--------|---------|-------------|
| ScanEngineSelector | `src/components/cuadra/scan-engine-selector.tsx` (205 lines) | `src/components/scan/ScanEngineSelector.tsx` (205 lines) | Only import paths and `'use client'` directive. Logic identical. |

---

### 12. FeatureFlagsView — **IDENTICAL**

| File | Source | Current | Differences |
|------|--------|---------|-------------|
| FeatureFlagsView | `src/components/cuadra/feature-flags-view.tsx` | `src/views/FeatureFlagsView.tsx` | Only import paths. Logic identical. |

---

### 13. Views (HomeView, GroupsView, ContactsView, SettingsView, TicketDetailView, TicketItemsEditor, NewTicketView) — **NEARLY IDENTICAL**

All view components have **identical logic and UI**. Differences are only:
- Import paths (`./` vs `@/`)
- `'use client'` directive presence
- Minor formatting

---

### 14. UI Primitives (Button, Card, Drawer, Sheet, etc.) — **IDENTICAL**

All shadcn/ui components are byte-for-byte identical between source and current.

---

## Missing Imports / Components in Current

| Component | Source Location | Current Status |
|-----------|-----------------|----------------|
| `Download` icon in TicketSummary | `lucide-react` import | ❌ Missing import (unused in source anyway) |
| `RotateCcw` in TicketSummary | Used in "Volver a asignar" | ✅ Present |
| `Share2`, `Trash2` in TicketSummary | Used in actions | ✅ Present |
| `Pencil`, `Trash2`, `ChevronRight` in PeopleGroupsManager | Used for edit/delete groups | ❌ Missing imports + functionality |
| `FolderPlus` in ContactsView | Used in PageHeader action | ✅ Present in Current |
| Native camera / upload in CameraCapture | Functional inputs | ❌ Disabled placeholders only |
| `compressImage` utility | In camera-capture.tsx | ❌ Missing |

---

## Structural Differences (AppShell/Layout)

### Source Architecture (Mobile-First, Centered)
```
AppShell (single component)
├── framer-motion AnimatePresence
├── max-w-md mx-auto centered container
├── safe-top / safe-bottom insets
├── Main content area
└── Fixed bottom nav (5 tabs + center FAB)
```

### Current Architecture (Desktop-First, Sidebar)
```
AppShell
├── SidebarProvider (Radix)
├── Sidebar (collapsible, persistent)
│   ├── Header (logo + title)
│   ├── Navigation menu
│   └── Footer (version)
├── SidebarInset
│   ├── Header (SidebarTrigger + title)
│   └── Main content
└── Mobile: NavigationBar (separate component)
    └── Bottom nav (5 tabs + center FAB)
```

---

## Styling Differences

| Aspect | Source | Current |
|--------|--------|---------|
| Container width | `max-w-md mx-auto` (mobile centered) | Full width on desktop, `max-w-md` only in mobile NavBar |
| Safe areas | `safe-top`, `safe-bottom` classes | Missing (only `safe-bottom` in NavBar) |
| Page transitions | framer-motion (fade + slide Y) | None (instant swap) |
| Shadows | `shadow-lg shadow-primary/30` on FAB | Same |
| Border radius | `rounded-full` on FAB, `rounded-xl` on cards | Same |
| Gradients | `bg-gradient-to-br from-primary to-emerald-600` | Same |

---

## Recommended Approach

### Phase 1: Layout Unification (Highest Impact)
**Goal**: Make Current match Source's mobile-first centered layout with framer-motion transitions.

**Approach A — Migrate Current to Source Architecture (Recommended)**
1. Replace `AppShell.tsx` + `NavigationBar.tsx` with single `AppShell.tsx` from source
2. Add `framer-motion` dependency
3. Add `safe-top`/`safe-bottom` Tailwind utilities (or use `env-safe` polyfill)
4. Remove Radix Sidebar components
5. Update all views to work within `max-w-md` centered container

**Approach B — Enhance Current to Match Source Visuals**
1. Keep Radix Sidebar for desktop
2. Add framer-motion to mobile NavigationBar
3. Add `max-w-md mx-auto` to mobile main content
4. Add safe-area insets
4. Center mobile layout like source

**Recommendation**: **Approach A** — Source architecture is cleaner, mobile-first, and matches the design spec exactly. Current desktop sidebar adds complexity without clear benefit for a mobile-first app.

---

### Phase 2: Avatar System Unification
1. Delete `src/components/ui/avatar.tsx` (Radix version)
2. Move source `avatar.tsx` to `src/components/ui/avatar.tsx` (or `src/components/shared/avatar.tsx`)
3. Update `AvatarStack.tsx` to import from unified location
4. Update all imports across codebase (`@/components/ui/avatar` → new path)
5. Verify `ParticipantPicker`, `PeopleGroupsManager`, `TicketSummary`, `HomeView`, etc. all work

---

### Phase 3: ParticipantPicker → PeopleGroupsManager
1. Replace current `ParticipantPicker.tsx` (224 lines) with source version (30 lines wrapper)
2. Ensure `PeopleGroupsManager` has edit/delete group features (Phase 4)
3. Update `NewTicketView` and `TicketDetailView` imports

---

### Phase 4: PeopleGroupsManager Feature Parity
Add to current `PeopleGroupsManager`:
- Group inline editing (Pencil icon, save/cancel)
- Group deletion (Trash2 + AlertDialog)
- `addMemberToGroup` store action integration

---

### Phase 5: CameraCapture Feature Parity
1. Add native camera mode (`<input capture="environment">`)
2. Add file upload mode (`<input type="file">`)
3. Add `compressImage` utility
4. Enable the currently disabled buttons
5. Consider whether to keep `useCamera` hook or use source's inline implementation

---

### Phase 6: Minor Cleanup
- Add missing `Download` import to TicketSummary (even if unused)
- Verify all `'use client'` directives are correct
- Standardize import paths (`@/` aliases)

---

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|------------|
| Layout change breaks desktop UX | High | Test thoroughly; Source is mobile-first but works on desktop (centered column) |
| Avatar API change breaks many components | High | Audit all Avatar usages; create codemod if needed |
| ParticipantPicker replacement loses custom features | Medium | Source PeopleGroupsManager is more feature-rich; verify all use cases covered |
| framer-motion adds bundle size | Low | ~12kb gzipped; acceptable for smooth transitions |
| CameraCapture rewrite loses useCamera hook benefits | Low | Source implementation is self-contained and tested |

---

## Ready for Proposal

**Yes** — Exploration complete. Clear migration path identified with 6 phases. Biggest architectural decision is Phase 1 (Layout). Recommend Approach A (adopt source AppShell) for design fidelity.

**Next SDD Phase**: `sdd-propose` with change name `visual-full-migration`