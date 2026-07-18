# Proposal: New Ticket Flow Migration

## Intent

Port the complete new-ticket creation flow from the external project — onboarding → camera capture → OCR scanning → OCR review → items editor → participant assignment → save — into the SplitEat Vite PWA. This is the main feature of Phase 2 and the primary user workflow.

## Scope

### In Scope
- Migrate `scan-onboarding.tsx` → `src/components/onboarding/ScanOnboarding.tsx` (dialog for engine download, selection)
- Migrate `scan-engine-selector.tsx` → `src/components/scan/ScanEngineSelector.tsx` (engine picker: Tesseract / NER / Florence-2 / server)
- Migrate `ticket-items-editor.tsx` → `src/components/ticket/TicketItemsEditor.tsx` (editable item rows, discounts, tax, tip, summary)
- Migrate `participant-picker.tsx` → `src/components/ticket/ParticipantPicker.tsx` (multi-select from contacts/groups)
- Migrate `new-ticket-view.tsx` → `src/views/NewTicketView.tsx` (step orchestrator with OcrReviewView, ScanningProgressOverlay)
- Add `@dnd-kit/core` + `@dnd-kit/sortable` for drag-drop reorder in items editor
- Unit tests for ticket-items-editor and scan-engine-selector
- E2E test for full new-ticket flow

### Out of Scope
- Contacts/groups management views (Phase 3: `contacts-groups-migration`)
- AssignmentEditor and TicketSummary sub-views (Phase 3: `ticket-detail-migration`)
- PeopleGroupsManager — ParticipantPicker wraps this, will use inline simplified version
- Settings view and feature-flags view (Phase 3: `settings-migration`)
- Server-engine OCR support (no backend available)

## Capabilities

### New Capabilities
None — this change implements an existing capability (new-ticket flow) in the target app.

### Modified Capabilities
None — no existing spec is changing behavior. Pure implementation migration.

## Approach

1. Copy and adapt the 5 component files, replacing Next.js `'use client'` directives and `@/` aliases with Vite SPA equivalents.
2. NewTicketView uses a `step` state machine (not routes) — keep as-is. No HashRouter needed for steps.
3. ParticipantPicker inlines a minimal person selector instead of depending on Phase 3's PeopleGroupsManager.
4. ScanningOverlay uses `<style>` tag instead of `styled-jsx` (`css` prop or inline styles).
5. Import `CameraCapture` from `../camera/` (provided by `camera-capture-migration`).
6. Import `scanTicket` and `ScanProgress` from `@/lib/scan/` (provided by `ocr-pipeline-rewrite`).
7. Use `useAppStore` actions directly for ticket creation/manipulation.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/views/NewTicketView.tsx` | New | Multi-step orchestrator + OcrReviewView + ScanningProgress |
| `src/components/onboarding/ScanOnboarding.tsx` | New | Engine download/selection dialog |
| `src/components/scan/ScanEngineSelector.tsx` | New | Reusable engine picker |
| `src/components/ticket/TicketItemsEditor.tsx` | New | Editable items table with reorder |
| `src/components/ticket/ParticipantPicker.tsx` | New | Multi-select person picker |
| `package.json` | Modified | Adds `@dnd-kit/core`, `@dnd-kit/sortable` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `styled-jsx` in source (Next.js only) | High | Replace with CSS modules or inline styles |
| ParticipantPicker depends on PeopleGroupsManager (P3) | Med | Inline a simplified picker that uses `useAppStore` directly |
| CameraCapture not yet merged | Med | Import path defined but component stubbed until dependency merged |

## Rollback Plan

`git revert` the change commits. All 5 component files and package.json changes are fully reversible.

## Dependencies

- `app-store` ✅ (Zustand store with types, actions)
- `ocr-pipeline` ✅ (scan modules, worker, orchestrator)
- `ui-primitives` ✅ (shadcn/ui components)
- `camera-capture` (must be merged first for CameraCapture component)
- `home-shell` (must be merged first for routing, AppShell integration)

## Success Criteria

- [ ] All 5 component files compile with zero TypeScript errors (`tsc --noEmit`)
- [ ] NewTicketView renders all steps: capture → scanning → review → participants → assign → summary
- [ ] TicketItemsEditor supports add/delete/edit items, drag-drop reorder, discounts, tax, tip
- [ ] ScanEngineSelector updates `settings.preferredEngine` in store
- [ ] `npm run build` succeeds
- [ ] Unit tests pass for TicketItemsEditor, ScanEngineSelector
- [ ] E2E test passes for full new-ticket flow
