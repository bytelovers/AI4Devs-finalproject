# Tasks: visual-full-migration

Generated from specs in `specs/` and `design.md`.

## [x] T1 — Add dependencies (framer-motion, vaul)

Add to `package.json`:
- `framer-motion: ^11.11.0`
- `vaul: ^1.1.0`

Run `pnpm install`. Verify lockfile updates.

**Files**: `package.json`, `pnpm-lock.yaml`
**Test**: `pnpm build` passes with new deps resolved

## [x] T2 — Create Avatar component

Create `src/components/ui/Avatar.tsx` from source `~/Downloads/workspace-previo/src/components/cuadra/avatar.tsx`:
- Export `Avatar` (person, name, color, initials, size, className)
- Export `AvatarStack` (people, max=4, size)
- Sizes: xs=h-6 w-6, sm=h-8 w-8, md=h-10 w-10, lg=h-14 w-14
- `text-white`, `ring-2 ring-white/80`, `font-semibold`
- Default color `#10b981` (emerald-500)

**Files**: `src/components/ui/Avatar.tsx` (create)
**Test**: build passes — no consumers yet, dead code

## [x] T3 — Replace AppShell with source

Replace `src/components/layout/AppShell.tsx` with source `app-shell.tsx` (120 lines):
- Import `motion`, `AnimatePresence` from `framer-motion`
- Read `currentView`, `setView`, `activeTicketId`, `activeGroupId` from `useAppStore`
- `motionKey = currentView + activeTicketId + activeGroupId`
- Outer: `min-h-screen flex flex-col bg-background max-w-md mx-auto relative`
- Main: `flex-1 w-full overflow-x-hidden pb-24 safe-top`
- AnimatePresence `mode="wait"` with motion.div transition 0.18s ease-out
- Bottom nav inline (5-grid): center prominent button `h-11 w-11 rounded-full bg-primary scale-105 shadow-lg shadow-primary/30`
- Nav: `fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md ... safe-bottom`
- Mark `NavigationBar.tsx` as deprecated (add comment)

**Files**: `src/components/layout/AppShell.tsx`, `src/components/layout/NavigationBar.tsx` (comment only)
**Test**: `pnpm build` passes; dev server loads with bottom nav visible, transitions work on click

## [x] T4 — Replace AssignmentEditor

Replace `src/components/ticket/AssignmentEditor.tsx` with source `assignment-editor.tsx` body:
- Change imports: `@/components/ui/AvatarStack` → `@/components/ui/Avatar`
- Change imports: `@/components/ui/sheet` → kept as ui/sheet (Radix-based, supports `side="bottom"` + `rounded-t-2xl`)
- Add `PeopleGroupsManager` import from `@/components/people/PeopleGroupsManager`
- Add `Label` import (local component)
- Add `ModeBadge` with User/Divide/Scale icons + emerald/amber/rose colors
- Add group assignment chips with `Folder` icon colored by `style={{ color: group.color }}`

**Files**: `src/components/ticket/AssignmentEditor.tsx`
**Test**: build passes; 6-step assign step renders with bottom sheet, chips, and Avatars

## [x] T5 — Replace TicketSummary

Replace `src/components/ticket/TicketSummary.tsx` matching source `ticket-summary.tsx`:
- Gradient header Card: `bg-gradient-to-br from-primary to-emerald-600 text-primary-foreground`
- Total amount `text-2xl font-bold`
- Visual progress bars: `style={{ width: \`${pct}%\` }}` on `h-2 rounded-full bg-primary`
- Track: `h-2 w-full rounded-full bg-muted`
- Action buttons: Share2, Download, RotateCcw, Trash2 (variant="destructive"), with aria-labels
- Verification card: CheckCircle2 (emerald, text-emerald-600) or AlertTriangle (amber, text-amber-600)

**Files**: `src/components/ticket/TicketSummary.tsx`
**Test**: build passes; summary step renders gradient header, bars, actions, verification

## [x] T6 — Replace ParticipantPicker with PeopleGroupsManager wrapper

Replace `src/components/ticket/ParticipantPicker.tsx` (224 lines) with 30-line wrapper:
- Re-export `PeopleGroupsManager` from `@/components/people/PeopleGroupsManager`
- Match props surface: `value`, `onChange`, `groups`, `people`

**Files**: `src/components/ticket/ParticipantPicker.tsx` (and any imports)
**Test**: build passes; no broken imports

## [x] T7 — Replace CameraCapture

Replace `src/components/camera/CameraCapture.tsx` with functional version:
- Live mode: `navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })`, video element autoPlay playsInline, capture button draws to canvas
- Native mode: `<input type="file" accept="image/*" capture="environment">` + FileReader
- Upload mode: `<input type="file" accept="image/*">` (no capture)
- Compression: canvas maxWidth=1280, maxHeight=1280, image/jpeg quality=0.8
- Preview: image with Retake (RotateCcw) and Confirm (Check) buttons
- Error handling: permission denied, no device, unsupported — render fallback message + retries

**Files**: `src/components/camera/CameraCapture.tsx`
**Test**: build passes; camera step shows three model; preview/retake/confirm cycle works

## [x] T8 — Update AvatarStack consumers

Search for any remaining `@/components/ui/AvatarStack` imports and update to `@/components/ui/Avatar` (AvatarStack export):
- Use `grep -r "AvatarStack" src/ --include="*.tsx" --include="*.ts"`
- For each match: update import path and check prop compatibility
- Delete `src/components/ui/AvatarStack.tsx` if no remaining consumers

**Files**: `src/views/HomeView.tsx`, `src/views/GroupsView.tsx`, `src/views/ContactsView.tsx`, `src/components/people/PeopleGroupsManager.tsx`, `src/components/ui/AvatarStack.tsx` (delete)
**Test**: build passes, no broken imports

## [x] T9 — Final verification

- Run `pnpm build` — must pass with 0 TS errors
- Run `pnpm test` — existing 167/173 must remain stable (6 pre-existing failures in useTheme.test.ts are OK)
- Dev preview: navigate all 5 views (home, contacts, new-ticket, groups, settings), confirm 6-step flow works end-to-end
- Visual: viewport constrained to max-w-md center; transitions work; bottom nav center button prominent

**Test**: build green, tests stable, manual smoke pass