# Tasks: Visual Full Migration

## Phase 1: Foundation

- [x] T1: Add dependencies — framer-motion ^11.11.0, vaul ^1.1.2 (vaul already present)
- [x] T2: Create unified Avatar + AvatarStack in `src/components/ui/Avatar.tsx` (omit 'use client' for Vite)

## Phase 2: AppShell & Navigation (T3)

- [x] T3: Replace `src/components/layout/AppShell.tsx` with source workspace pattern (~120 lines)
  - framer-motion AnimatePresence with motionKey (currentView + activeTicketId + activeGroupId)
  - Inline 5-grid bottom nav with center prominent button (h-11 w-11 rounded-full bg-primary scale-105 shadow-lg shadow-primary/30)
  - Remove SidebarProvider, Sidebar, useIsMobile imports
  - Keep NavigationBar.tsx but add deprecation comment

## Phase 3: Ticket Components (T4-T5)

- [x] T4: Replace `src/components/ticket/AssignmentEditor.tsx` (Avatar import swap, vaul sheet, ModeBadge, group chips)
- [x] T5: Replace `src/components/ticket/TicketSummary.tsx` (gradient header, progress bars, action buttons, verification card)

## Phase 4: People & Camera (T6-T8)

- [x] T6: Replace `src/components/ticket/ParticipantPicker.tsx` with PeopleGroupsManager wrapper (30 lines)
- [x] T7: Replace `src/components/camera/CameraCapture.tsx` (live/native/upload modes, canvas compression, preview/retake/confirm)
- [ ] T8: Update AvatarStack consumers (6 files: HomeView, GroupsView, ContactsView, PeopleGroupsManager, TicketSummary, AssignmentEditor) to import from @/components/ui/Avatar; delete AvatarStack.tsx if no remaining consumers

## Phase 5: PeopleGroupsManager Enhancements

- [ ] Add edit group button (Pencil icon) and delete group (Trash2 + AlertDialog confirmation)

## Phase 6: Final Verification (T9)

- [ ] T9: Final verification — `pnpm build` OK, `pnpm test` stable (167/173 baseline), manual smoke pass 6-step flow

---

**Source workspace reference**: `~/Downloads/workspace-previo/src/components/cuadra/`