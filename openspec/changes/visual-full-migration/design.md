# Design: visual-full-migration

## Architecture

The migration adopts source workspace's mobile-first architecture wholesale. The current dual desktop/mobile layout is replaced with a single mobile viewport constrained to `max-w-md mx-auto`.

### Key Architectural Decisions

1. **AppShell replaces NavigationBar**: The source `app-shell.tsx` (120 lines) inlines the bottom navigation directly rather than delegating to a separate `NavigationBar` component. We follow this pattern — `NavigationBar.tsx` becomes dead code (retained for backward compat but unused).

2. **framer-motion route transitions**: `AnimatePresence mode="wait"` wraps the children with a motion.div keyed by `currentView + activeTicketId + activeGroupId`. Transition is `opacity: 0→1, y: 8→0` over 0.18s ease-out.

3. **Avatar unification**: A new `Avatar.tsx` in `src/components/ui/` exposes two exports: `Avatar` (single, person/name/color/initials props) and `AvatarStack` (array of people). The old `AvatarStack.tsx` is replaced — all consumers updated.

4. **vaul for bottom sheets**: Replace `@/components/ui/sheet` (Radix Dialog based) with `vaul`'s Sheet which has native bottom-sheet physics, rounded-t-2xl, and drag-to-dismiss.

5. **Store viewmodel**: The source AppShell reads `currentView`, `setView`, `activeTicketId`, `activeGroupId` from the store (Zustand) — NOT from React Router. The current frontend already has this same store, so AppShell can use it directly without router changes.

## Component Mapping

| Target File | Source File | Strategy |
|-------------|-------------|----------|
| `src/components/layout/AppShell.tsx` | source `app-shell.tsx` | Replace entirely (120 → ~120 lines) |
| `src/components/layout/NavigationBar.tsx` | (inlined in AppShell) | Mark deprecated; leave file intact |
| `src/components/ui/Avatar.tsx` | source `avatar.tsx` | Create (76 lines) with both Avatar + AvatarStack exports |
| `src/components/ticket/AssignmentEditor.tsx` | source `assignment-editor.tsx` | Replace entirely with local imports |
| `src/components/ticket/TicketSummary.tsx` | source `ticket-summary.tsx` | Replace entirely |
| `src/components/ticket/ParticipantPicker.tsx` | source `people-groups-manager.tsx` pattern | Replace with 30-line wrapper |
| `src/components/camera/CameraCapture.tsx` | source `camera-capture.tsx` | Replace entirely |

## Dependencies

### Add to package.json
- `framer-motion: ^11.x` — page transitions
- `vaul: ^1.x` — bottom sheets

### Existing (verified present)
- `lucide-react` — all icons used (Home, Plus, Users, Folder, Settings, Download, RotateCcw, Trash2, Share2, CheckCircle2, AlertTriangle, User, Divide, Scale)

## Data Flow

### AppShell state
```
useAppStore → currentView, setView, activeTicketId, activeGroupId
            ↓
  motionKey = currentView + activeTicketId + activeGroupId
            ↓
  AnimatePresence mode="wait"
            ↓
  motion.div key={motionKey} transition 0.18s
            ↓
  children
```

### Navigation layout
```
5-column grid (NAV_ITEMS)
- home, contacts, new-ticket (center), groups, settings
- center: h-11 w-11 rounded-full bg-primary scale-105 shadow-lg shadow-primary/30
- others: h-5 w-5 icon + text-[10px] label below
- active: text-primary strokeWidth 2.5
- inactive: text-muted-foreground strokeWidth 2
- detail views (ticket-detail, group-detail) highlight "home" pill
```

### Safe areas
- Outer wrapper: `min-h-screen flex flex-col bg-background max-w-md mx-auto relative`
- Main: `flex-1 w-full overflow-x-hidden pb-24 safe-top`
- Nav: `fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md ... safe-bottom`

## Risk Mitigations

| Risk | Mitigation |
|------|------------|
| framer-motion bundle size | ~12kb gzipped is acceptable for mobile-first app |
| Avatar API breaks consumers | Update all consumers in same PR (AssignmentEditor, TicketSummary, PeopleGroupsManager) |
| Desktop users see narrow layout | Accept — source is mobile-only, this is intentional |
| vaul adds new dep | vaul is the canonical React bottom-sheet lib, well maintained |

## Testing Strategy

- AppShell, NavigationBar, Avatar: structural/CSS-only changes → skip TDD cycle (no testable logic)
- AssignmentEditor, TicketSummary: pure render components with derived props → snapshot tests if behavior concerns surface; otherwise skip
- CameraCapture: logic-bearing (compression, FileReader, canvas) → keep existing tests; if source has tests, port them
- Build: `pnpm build` must pass with 0 TS errors
- Tests: existing 167/173 must remain stable

## Migration Order (Apply Phase)

1. **Add dependencies** (`framer-motion`, `vaul`) to package.json + install
2. **Avatar.tsx** — create, no consumers broken yet (old AvatarStack still exists)
3. **AppShell.tsx** — replace, verify build
4. **AssignmentEditor.tsx** — replace with local imports (Avatar, PeopleGroupsManager, vaul, Label)
5. **TicketSummary.tsx** — replace with gradient header + actions
6. **ParticipantPicker.tsx** — replace with PeopleGroupsManager wrapper
7. **CameraCapture.tsx** — replace with live/native/upload
8. **Verify consumers** — update any remaining AvatarStack imports
9. **Remove old AvatarStack.tsx** if no consumers remain
10. **Build + test** — `pnpm build && pnpm test`
