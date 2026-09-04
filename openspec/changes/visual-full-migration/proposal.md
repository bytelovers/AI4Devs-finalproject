# Proposal: Visual Full Migration

## Intent

Migrate the entire visual layer of the current frontend to match the source workspace (`~/Downloads/workspace-previo`) exactly — mobile-first, max-w-md constrained, framer-motion transitions, gradient headers, visual progress bars, bottom sheets, unified Avatar, PeopleGroupsManager wrapper, functional CameraCapture.

## Scope

### In Scope

- `AppShell.tsx` → adopt source: framer-motion AnimatePresence, max-w-md mx-auto, safe-top/safe-bottom, no desktop sidebar
- `NavigationBar.tsx` → adopt source exactly: center button h-11 w-11 rounded-full bg-primary scale-105 shadow-lg
- `Avatar.tsx` → create local component matching source (person prop with name/color/initials)
- `EmptyState.tsx` + `PageHeader.tsx` → already match, keep
- `AssignmentEditor.tsx` → migrate to source: local Avatar, PeopleGroupsManager wrapper, vaul Sheet, Label component, ModeBadge with specific icons/colors, group assignment chips
- `TicketSummary.tsx` → migrate to source: gradient header Card, visual progress bars (style={{width: pct%}}), share/delete actions, verification card, Download/RotateCcw/Trash2/Share2 icons
- `ParticipantPicker.tsx` → replace with `PeopleGroupsManager` wrapper (source pattern: 30-line wrapper)
- `CameraCapture.tsx` → upgrade to source: live/native/upload modes, compression, error handling
- Remove desktop sidebar code paths (AppShell mobile-only)
- Add `framer-motion` dependency
- Add `vaul` dependency for bottom sheets

### Out of Scope

- Store/logic changes (already migrated)
- OCR pipeline (already complete)
- Backend/API
- Routing changes

## Approach

**Complete Visual Replacement** — adopt source workspace components wholesale. The current components have different APIs and visual design; replacing entirely is cleaner than patching.

## Affected Areas

| Area | Impact |
|------|--------|
| `src/components/layout/AppShell.tsx` | Replace entirely |
| `src/components/layout/NavigationBar.tsx` | Replace entirely |
| `src/components/ui/Avatar.tsx` | Create new |
| `src/components/ticket/AssignmentEditor.tsx` | Replace entirely |
| `src/components/ticket/TicketSummary.tsx` | Replace entirely |
| `src/components/ticket/ParticipantPicker.tsx` | Replace with PeopleGroupsManager wrapper |
| `src/components/camera/CameraCapture.tsx` | Replace entirely |
| `package.json` | Add framer-motion, vaul |

## Risks

- AppShell layout shift breaks desktop (mitigation: source is mobile-only, accept)
- Avatar API change breaks other components (mitigation: update all consumers)
- framer-motion adds bundle size (~12kb gzipped)

## Rollback

`git checkout HEAD -- src/components/ src/package.json`

## Success Criteria

- [ ] Visual match with source workspace on all screens
- [ ] 6-step flow works end-to-end
- [ ] Build passes, tests pass
- [ ] Mobile viewport constrained to max-w-md
