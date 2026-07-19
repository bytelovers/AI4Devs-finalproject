# Proposal: Home Shell Migration

## Intent

Establish the app shell layout, navigation structure, and home screen for SplitEat by migrating from the external Next.js project. The current app has no navigation — only a welcome page (`main.tsx`). This change gives users a responsive shell (mobile bottom nav / desktop sidebar) and a home view with ticket list, stats, empty state, and FAB actions.

## Scope

### In Scope
- `app-shell.tsx` → `src/components/layout/AppShell.tsx` — responsive shell with bottom nav (mobile) and sidebar (desktop), view routing via `currentView` store
- `home-view.tsx` → `src/views/HomeView.tsx` — ticket list, monthly stats, hero CTA card, empty state
- `empty-state.tsx` (+ `PageHeader`) → `src/components/ui/EmptyState.tsx` — reusable empty state and page header
- `avatar.tsx` (`Avatar`, `AvatarStack`) → `src/components/ui/AvatarStack.tsx` — app-specific person avatars needed by HomeView
- `main.tsx` — replace welcome page with `<AppShell><HomeView/></AppShell>`
- Routing: store-based `currentView` navigation (no router dependency); add `wouter` HashRouter for URL sync if needed
- CSS: add PWA safe-area utilities and `no-scrollbar` from external `globals.css`

### Out of Scope
- Ticket detail, new ticket, contacts, groups, settings views (Phase 3)
- PWA manifest / service worker (can be added later)
- `framer-motion` animations (remove dependency; use CSS transitions)

## Capabilities

### New Capabilities
- `app-shell`: Responsive layout (mobile bottom nav, desktop sidebar via shadcn `Sidebar`), view routing integration with `useAppStore`
- `home-view`: Ticket list with monthly stats, hero CTA (scan/manual), empty state, per-ticket sharing visual bar
- `avatar-stack`: Person avatar display by ID and overlapping avatar stack, used by HomeView

### Modified Capabilities
None — no existing spec-level behavior changes.

## Approach

Copy and adapt 4 component files from `workspace-previo-import/src/components/cuadra/`, adapting from Next.js patterns to Vite SPA:

1. **AppShell** — replace `framer-motion` AnimatePresence with CSS `animate-pulse`/transition. On mobile: fixed bottom nav (5 tabs). On desktop (`md:`): render shadcn `Sidebar` with `<SidebarProvider>`. Read `currentView` from store, conditionally render the active view as children.
2. **HomeView** — full migration with hero card, stats grid, ticket list, and empty state. Use `AvatarStack` for participant display. Adapt `@/` imports to existing path aliases.
3. **EmptyState** + **PageHeader** — clean 1:1 migration. No adaptations needed beyond import paths.
4. **AvatarStack** — create from external `avatar.tsx`. Uses shadcn/ui `Avatar` primitive already migrated. Displays person initials/color with overlapping stack layout.
5. **main.tsx** — simplify to `<AppShell><HomeView/></AppShell>`. Strip welcome page. Views render conditionally via store `currentView` inside AppShell.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/components/layout/AppShell.tsx` | New | Responsive shell with nav |
| `src/views/HomeView.tsx` | Modified | Replace placeholder with full home |
| `src/components/ui/EmptyState.tsx` | New | Empty state + PageHeader |
| `src/components/ui/AvatarStack.tsx` | New | Person avatar display |
| `src/main.tsx` | Modified | Wire AppShell + views |
| `src/styles/global.css` | Modified | Add safe-area + no-scrollbar |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| AvatarStack missing shadcn/ui avatar export | Low | `avatar.tsx` already in `src/components/ui/` |
| Store `currentView` approach conflicts with routing | Low | Pure store-based nav; wouter optional overlay |
| Bottom nav overlap on devices with no safe-area | Low | Add `safe-bottom` from external globals.css |

## Rollback Plan

`git revert` the migration commits. `main.tsx` returns to the welcome page. The old `HomeView.tsx` (if it existed) is restored.

## Dependencies

Zustand store (Phase 1), shadcn/ui `avatar`, `card`, `button`, `sidebar`, `sheet`, `separator`, `tooltip` (all in Phase 1).

## Success Criteria

- [ ] AppShell renders: bottom nav on mobile, sidebar on desktop (`>=768px`)
- [ ] Bottom nav tabs navigate between views via store `currentView`
- [ ] HomeView shows empty state when no tickets exist
- [ ] HomeView shows ticket list and stats when tickets exist
- [ ] AvatarStack renders person initials and colors correctly
- [ ] Build passes (`tsc --noEmit && pnpm build`)
- [ ] No `framer-motion` runtime errors (removed dependency)
