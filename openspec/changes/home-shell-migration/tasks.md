# SDD Tasks — Home Shell Migration

> **Change**: `home-shell-migration`
> **Base branch**: `feature/feature-entrega2-ADLC`
> **Delivery**: `single-pr` (size:exception pre-approved)
> **Language**: English (artifacts), Spanish (UI strings where existing project convention)

---

## Overview

Migrate the app shell layout, navigation structure, home view, and supporting UI primitives from the external Next.js project (`workspace-previo-import`) into the Vite SPA. The routing model stays store-based (`useAppStore.currentView`).

### External Source Files

| Source | Target |
|--------|--------|
| `workspace-previo-import/src/components/cuadra/app-shell.tsx` | `src/components/layout/AppShell.tsx` |
| `workspace-previo-import/src/components/cuadra/home-view.tsx` | `src/views/HomeView.tsx` |
| `workspace-previo-import/src/components/cuadra/empty-state.tsx` | `src/components/ui/EmptyState.tsx` |
| `workspace-previo-import/src/components/cuadra/avatar.tsx` | `src/components/ui/AvatarStack.tsx` |

### Key Adaptation Points (all tasks)

- **Remove `framer-motion`**: No `AnimatePresence`, no `motion.div`. Replace with CSS transitions (`transition-all`, `animate-pulse`) or omit animations entirely.
- **Responsive shell**: Mobile gets fixed bottom nav; desktop (`>=768px`) gets shadcn `Sidebar` inside `<SidebarProvider>`.
- **Import paths**: External files use `@/` aliases (already match the project convention). Verify the `@/` alias is configured in both `vite.config.ts` (`resolve.alias`) and `tsconfig.app.json` (`compilerOptions.paths`) — if missing, add it as a prerequisite.
- **No Next.js patterns**: No `'use client'` directive (keep it in the SPA, it's harmless, or strip it), no `next/` imports, no file-system routing.

---

## Tasks

### T001 — Create `AppShell.tsx` (responsive layout shell)

- **File**: `src/components/layout/AppShell.tsx` (create directory `src/components/layout/`)
- **Dependencies**: `SidebarProvider` from shadcn/ui, `useIsMobile` hook, `useAppStore`
- **Source**: `workspace-previo-import/.../app-shell.tsx`

**Implementation**:

1. Create `AppShell` component wrapping children with responsive layout:
   - **Mobile** (`useIsMobile()` returns `true`): renders children (the active view) with `pb-24` padding for bottom nav clearance. No sidebar.
   - **Desktop** (`useIsMobile()` returns `false`): wrap content in `<SidebarProvider>` and render shadcn `<Sidebar>` with `<SidebarHeader>`, `<SidebarContent>`, `<SidebarFooter>`. Sidebar content mirrors the 5 nav items (Home, New Ticket, Contacts, Groups, Settings).
2. Replace the external `AnimatePresence`/`motion.div` wrapper with a plain `<div>` or a CSS-based fade transition class.
3. Remove the `max-w-md mx-auto` constraint from the outer container — let the shell be full-width on desktop. Keep it as a constraint only on mobile if desired.
4. Import `NAV_ITEMS` array or define it locally (same items as external source: `home`, `contacts`, `new-ticket`, `groups`, `settings`).
5. Render `<NavigationBar />` on mobile only (see T002).
6. Add `safe-top` and `safe-bottom` CSS utility classes to `global.css` if not added separately (see T005 note).

**Acceptance Criteria**:
- [ ] Mobile (`<768px`): bottom navigation bar is visible, content area has bottom padding clearance
- [ ] Desktop (`>=768px`): sidebar renders with nav items, no bottom nav
- [ ] Sidebar toggle (hamburger / `Cmd+B`) collapses/expands the sidebar
- [ ] No `framer-motion` imports or runtime errors
- [ ] `useIsMobile` correctly toggles layout between mobile and desktop

---

### T002 — Create `NavigationBar.tsx` (bottom navigation)

- **File**: `src/components/layout/NavigationBar.tsx`
- **Dependencies**: `useAppStore`, `lucide-react` icons

**Implementation**:

1. Extract (or define inline) the 5-item `NAV_ITEMS` array from the external `app-shell.tsx`.
2. Render a fixed `nav` element at the bottom of the viewport with 5-column grid.
3. Each item is a `<button>` with icon + label; active state shows `text-primary` / inactive shows `text-muted-foreground`.
4. The "New Ticket" (center) item is a circular FAB-style button.
5. On `click`, call `useAppStore.setView(item.view)`.
6. Mark active items with `aria-current="page"`.

**Acceptance Criteria**:
- [ ] 5 nav items render: Inicio, Contactos, Nuevo, Grupos, Ajustes
- [ ] Active item has `text-primary` color and `aria-current="page"`
- [ ] Center "Nuevo" button is circular, primary-colored, and distinct from others
- [ ] Clicking an item calls `setView()` on the store

---

### T003 — Create `EmptyState.tsx` + `PageHeader` (shared UI primitives)

- **File**: `src/components/ui/EmptyState.tsx`
- **Source**: `workspace-previo-import/.../empty-state.tsx`

**Implementation**:

1. Migrate `EmptyState` component 1:1:
   - Props: `icon: LucideIcon`, `title: string`, `description?: string`, `action?: { label, onClick }`, `className?`
   - Renders centered layout with icon in rounded circle, title, optional description, optional action button.
2. Migrate `PageHeader` component 1:1:
   - Props: `title: string`, `subtitle?: string`, `back?: () => void`, `action?: React.ReactNode`
   - Renders h1 with optional back arrow, optional subtitle, optional action slot.
3. Fix import paths: `@/lib/utils` for `cn`, `@/components/ui/button` for Button.

**Acceptance Criteria**:
- [ ] `EmptyState` renders icon, title, description, action button correctly
- [ ] `PageHeader` renders title with optional back arrow and action area
- [ ] Both components use `cn()` for className merging
- [ ] No external dependencies beyond existing shadcn/ui primitives

---

### T004 — Create `AvatarStack.tsx` (person avatar display)

- **File**: `src/components/ui/AvatarStack.tsx`
- **Source**: `workspace-previo-import/.../avatar.tsx`

**Implementation**:

1. Migrate `Avatar` component:
   - Props: `person?: Person`, `name?: string`, `color?: string`, `initials?: string`, `size?: 'xs' | 'sm' | 'md' | 'lg'`
   - Renders a circular `<div>` with background color from `person.color`, shows `initials` text.
   - Use `ring-2 ring-white/80` for the avatar ring (existing Tailwind utilities).
   - Size mapping: xs=`h-6 w-6`, sm=`h-8 w-8`, md=`h-10 w-10`, lg=`h-14 w-14`.
2. Migrate `AvatarStack` component:
   - Props: `people: Person[]`, `max?: number` (default 4), `size?`
   - Renders overlapping avatars using `-space-x-2`.
   - Shows `+N` overflow badge when `people.length > max`.
3. Note: This uses a **custom** Avatar implementation (div-based, not the shadcn/ui `Avatar` primitive) because it needs inline `style.backgroundColor` for dynamic person colors. The shadcn/ui `Avatar` is still used elsewhere — no conflict.

**Acceptance Criteria**:
- [ ] Single `Avatar` renders with person initials and background color
- [ ] `AvatarStack` renders overlapping avatars up to `max` count
- [ ] Overflow count `+N` appears when people exceed max
- [ ] Sizes render correctly across all size variants

---

### T005 — Create `HomeView.tsx` (full home screen)

- **File**: `src/views/HomeView.tsx`
- **Dependencies**: `useAppStore`, `formatEUR`/`formatDate`/`computeShares`/`calcTicketTotal` from `@/lib/calc`, `EmptyState`/`PageHeader` from T003, `AvatarStack` from T004
- **Source**: `workspace-previo-import/.../home-view.tsx`

**Implementation**:

1. Migrate the full HomeView component:
   - **Hero CTA card**: gradient card with "Escanea y divide" heading, two buttons (Scan + Manual). Scan sets `_startManual = false` and navigates to `new-ticket`; Manual sets `_startManual = true` and navigates to `new-ticket`.
   - **Stats row**: 2-column grid — "Este mes" (total spent this month + ticket count) and "Total" (total ticket count).
   - **Recent tickets**: List of up to 5 tickets, each as a clickable card showing title, date, item count, total, participant avatar stack, and visual share bar (colored segments per person).
   - **Empty state**: When no tickets exist, render `<EmptyState>` with Receipt icon and "Crear primer ticket" action.
   - **Tip card**: When both people and tickets are empty, render a tip card (strip the emoji, use text only).
2. Fix import paths:
   - `./empty-state` → `@/components/ui/EmptyState` (import both `EmptyState` and `PageHeader`)
   - `./avatar` → `@/components/ui/AvatarStack` (import `AvatarStack`)
3. The `cuadrado` (balanced) check and participant filtering logic carry over as-is.
4. Remove any `framer-motion` wrappers.

**Acceptance Criteria**:
- [ ] Hero card renders with scan and manual buttons
- [ ] Stats row shows monthly total and total ticket count
- [ ] Recent tickets list renders when tickets exist
- [ ] Empty state renders when no tickets exist
- [ ] Each ticket card shows title, date, participants via AvatarStack, and share bar
- [ ] "Ver todo" link is visible when tickets exist
- [ ] Clicking "Crear primer ticket" navigates to new-ticket view

---

### T006 — Update `main.tsx` with AppShell and view routing

- **File**: `src/main.tsx`
- **Dependencies**: `AppShell` (T001), `HomeView` (T005), placeholder views (T007)

**Implementation**:

1. Replace the welcome page content with:
   ```tsx
   <AppShell>
     {currentView === 'home' && <HomeView />}
     {currentView === 'contacts' && <ContactsView />}
     {currentView === 'groups' && <GroupsView />}
     {currentView === 'new-ticket' && <NewTicketView />}
     {currentView === 'ticket-detail' && <TicketDetailView />}
     {currentView === 'settings' && <SettingsView />}
     {currentView === 'feature-flags' && <FeatureFlagsView />}
     {currentView === 'group-detail' && <GroupDetailView />}
   </AppShell>
   ```
2. Remove all placeholder welcome page markup (`.app-container`, `.app-header`, `.welcome-card`, `.status-badge`).
3. Keep `React.StrictMode` wrapper.
4. Keep CSS imports (`variables.css`, `global.css`).
5. **Pre-requisite**: Ensure `@/` path alias is configured:
   - `vite.config.ts`: add `resolve: { alias: { '@': '/src' } }` (or use `path.resolve`)
   - `tsconfig.app.json`: add `compilerOptions.paths: { "@/*": ["./src/*"] }`

**CSS additions** (add to `src/styles/global.css`):
```css
/* Safe area utilities for mobile bottom nav and status bar */
.safe-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.safe-top {
  padding-top: env(safe-area-inset-top, 0px);
}
/* Hide scrollbar utility */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
```

**Acceptance Criteria**:
- [ ] Welcome page content is replaced by AppShell rendering
- [ ] Each `ViewName` maps to the correct view component
- [ ] `currentView = 'home'` renders HomeView by default
- [ ] CSS safe-area classes are present in global styles
- [ ] `@/` path alias resolves correctly in both Vite build and TypeScript

---

### T007 — Create placeholder views for unimplemented routes

- **Directory**: `src/views/placeholders/` (or inline in the view router)
- **Components**:
  - `ContactsPlaceholder` (for `contacts`)
  - `GroupsPlaceholder` (for `groups`)
  - `NewTicketPlaceholder` (for `new-ticket`)
  - `TicketDetailPlaceholder` (for `ticket-detail`)
  - `SettingsPlaceholder` (for `settings`)
  - `FeatureFlagsPlaceholder` (for `feature-flags`)
  - `GroupDetailPlaceholder` (for `group-detail`)

**Implementation**:

1. Create a single file `src/views/PlaceholderViews.tsx` exporting all 7 placeholders.
2. Each placeholder is a simple component showing:
   - A `<PageHeader>` with the view name as title
   - An `<EmptyState>` with a relevant icon and "Próximamente" description
   - A back-to-home button or note that the view is under construction
3. Alternatively, define the placeholders inline in `main.tsx` if they are trivial enough (recommended: keep a separate file for clarity).

**Acceptance Criteria**:
- [ ] Each placeholder renders without errors
- [ ] Placeholder shows view name and "coming soon" message
- [ ] No crash when navigating to any registered view via store

---

### T008 — Build verification

- **Command**: `tsc --noEmit && pnpm build`

**Implementation**:

1. Run `pnpm tsc --noEmit` from the `frontend/` directory.
2. Fix any TypeScript errors (import paths, type mismatches, missing exports).
3. Run `pnpm build` to verify the Vite production build succeeds.
4. Run `pnpm dev` and manually verify:
   - AppShell renders with correct responsive layout
   - HomeView loads with empty state (no tickets in localStorage)
   - Bottom nav navigates between views
   - Desktop sidebar renders when viewport >=768px

**Acceptance Criteria**:
- [ ] `tsc --noEmit` exits with code 0
- [ ] `pnpm build` produces a production bundle without errors
- [ ] App loads in browser without console errors
- [ ] Responsive layout works on mobile and desktop viewports

---

## Dependency Graph

```
T002 (NavigationBar) ─┐
                       ├──> T001 (AppShell) ──┐
T004 (AvatarStack) ───┘                       │
                                              ├──> T006 (main.tsx + routing)
T003 (EmptyState) ───┐                        │
                      ├──> T005 (HomeView) ───┘
T004 (AvatarStack) ───┘
                                              └──> T008 (verification)
T007 (Placeholders) ──────────────────────────┘
```

Implementation order: T003 → T004 → T002 → T001 → T005 → T007 → T006 → T008.

---

## Delivery Forecast

| Metric | Value |
|--------|-------|
| Estimated authored additions | ~650-800 lines |
| Estimated authored deletions | ~25 lines (welcome page) |
| **400-line budget risk** | **High** (but size:exception pre-approved) |
| Chained PRs recommended | No (single PR per user request) |
| Decision needed before apply | No (exception pre-approved) |
