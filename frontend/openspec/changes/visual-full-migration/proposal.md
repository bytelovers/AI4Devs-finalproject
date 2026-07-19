# Proposal: Visual Full Migration

## Intent

Full visual/structural migration from source workspace (~/Downloads/workspace-previo) to current frontend. Current codebase diverges significantly in core layout (AppShell), avatar system, participant picker, and camera capture. Goal: exact visual/structural parity with source workspace on all screens.

## Scope

### In Scope
- Replace AppShell (mobile-first, framer-motion, max-w-md, safe areas)
- Replace NavigationBar (unified mobile nav with framer-motion transitions)
- Create unified Avatar + AvatarStack components (replace dual implementations)
- Replace ParticipantPicker with PeopleGroupsManager wrapper (30 lines vs 224)
- Add PeopleGroupsManager edit/delete group features (Pencil, Trash2, AlertDialog)
- Replace CameraCapture with functional native camera + file upload + compression
- Add framer-motion + vaul to package.json
- Update all consumers of Avatar/AvatarStack/ParticipantPicker/CameraCapture
- Constrain mobile viewport to max-w-md

### Out of Scope
- Home, Groups, Contacts, Settings, TicketDetail, TicketItemsEditor, NewTicketView (already match)
- UI primitives (Button, Card, Drawer, Sheet, ScanOnboarding, ScanEngineSelector, FeatureFlagsView)
- Backend/API changes
- Backend architecture changes

## Capabilities

### New Capabilities
- `avatar-system`: Unified Avatar + AvatarStack components replacing dual implementations
- `camera-capture-native`: Functional native camera capture with file upload + compression

### Modified Capabilities
- `app-shell`: Replace Radix Sidebar + separate NavigationBar with single mobile-first AppShell + NavigationBar (framer-motion transitions, safe areas, max-w-md)
- `participant-picker`: Replace 224-line custom implementation with 30-line PeopleGroupsManager wrapper
- `people-groups-manager`: Add edit/delete group features (edit button, delete with AlertDialog)

## Approach

Full replacement strategy for 4 divergent components (AppShell, NavigationBar, AvatarStack, ParticipantPicker, CameraCapture) + additive features for PeopleGroupsManager. All other views remain untouched (verified identical). Source workspace is reference implementation — copy components directly, update imports/consumers.

Dependencies: framer-motion (~12kb gzipped), vaul (drawer primitive, ~3kb).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/components/layout/AppShell.tsx` | Replaced | Mobile-first shell with framer-motion, safe areas, max-w-md |
| `src/components/layout/NavigationBar.tsx` | Replaced | Unified mobile nav with framer-motion transitions |
| `src/components/ui/Avatar.tsx` | New | Unified Avatar component |
| `src/components/ui/AvatarStack.tsx` | New | Unified AvatarStack component |
| `src/components/ticket/AssignmentEditor.tsx` | Modified | Update Avatar imports |
| `src/components/ticket/TicketSummary.tsx` | Modified | Update Avatar imports, remove unused Download icon |
| `src/components/ticket/ParticipantPicker.tsx` | Replaced | 30-line PeopleGroupsManager wrapper |
| `src/components/people/PeopleGroupsManager.tsx` | Modified | Add edit/delete group features |
| `src/components/camera/CameraCapture.tsx` | Replaced | Native camera + file upload + compression |
| `package.json` | Modified | Add framer-motion, vaul |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| AppShell layout shift breaks desktop | High | Source is mobile-only; accept desktop not supported |
| Avatar API change breaks consumers | Medium | Update all consumers in same PR (AssignmentEditor, TicketSummary) |
| framer-motion adds ~12kb gzipped | Medium | Acceptable for mobile-first app; tree-shaking helps |
| CameraCapture native API differences | Low | Source implementation tested; copy directly |

## Rollback Plan

```bash
git checkout HEAD -- src/components/ package.json
```

## Dependencies

- framer-motion@^11.x
- vaul@^1.x

## Success Criteria

- [ ] Visual match with source workspace on all screens (Home, Groups, Contacts, Settings, TicketDetail, NewTicket, TicketItems)
- [ ] 6-step flow works end-to-end (Home → Groups → Contacts → NewTicket → TicketItems → TicketDetail)
- [ ] Build passes (`npm run build`), tests pass (`npm test`)
- [ ] Mobile viewport constrained to max-w-md on desktop
- [ ] No TypeScript errors, no unused imports