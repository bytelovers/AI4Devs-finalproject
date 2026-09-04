# Tasks: New Ticket Flow Migration

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~2,800 |
| 400-line budget risk | High |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | All 5 components + orchestrator + deps | Single PR | `tsc --noEmit && npm run build` | `npm run dev` — manual E2E walkthrough of all steps | `git revert` of merge commit |

## Phase 1 — Foundation

- [ ] 1.1 Run `pnpm add @dnd-kit/core @dnd-kit/sortable`
- [ ] 1.2 Create directories: `src/components/scan/`, `src/components/onboarding/`, `src/components/ticket/`

## Phase 2 — Scan Engine Selector

- [ ] 2.1 Migrate `scan-engine-selector.tsx` → `src/components/scan/ScanEngineSelector.tsx` — remove `'use client'`, fix `@/` imports, adapt to existing `useAppStore` and `ScanEngineName` types, preserve `ENGINE_OPTIONS` config and engine selection with offline/WebGPU guards

## Phase 3 — Scan Onboarding

- [ ] 3.1 Migrate `scan-onboarding.tsx` → `src/components/onboarding/ScanOnboarding.tsx` — replace `styled-jsx` with `<style>` tag, fix imports (use existing scan lib barrel `@/lib/scan`), adapt `ScanOnboarding` dialog with engine cards, `DownloadProgressCard`, Florence-2 download flow, Tesseract+NER selection

## Phase 4 — Items Editor

- [ ] 4.1 Create `src/components/ticket/EditableItemRow.tsx` — single row: name, qty, unit-price with `€` suffix, line total, delete button, `GripVertical` drag handle, mode toggle (single/shared/weighted)
- [ ] 4.2 Migrate `ticket-items-editor.tsx` → `src/components/ticket/TicketItemsEditor.tsx` — editable items list with `@dnd-kit` drag-drop reorder, add/delete items, IVA section (included/added switch + rate select), tip section (none/percentage/fixed + quick presets), discounts section (amount/percentage toggle per discount), summary card (items→descuentos→subtotal→IVA→propina→total)

## Phase 5 — Participant Picker

- [ ] 5.1 Create `src/components/ticket/ParticipantPicker.tsx` — inline multi-select component reading people + groups from `useAppStore`, toggle individual selection, quick-add entire group, no dependency on external `PeopleGroupsManager`

## Phase 6 — NewTicketView Orchestrator

- [ ] 6.1 Migrate `new-ticket-view.tsx` → `src/views/NewTicketView.tsx` — multi-step state machine (`capture`→`scanning`→`ocr-review`→`review`→`participants`→`assign`→`summary`), integrate `CameraCapture`, `ScanEngineSelector`, `TicketItemsEditor`, `ParticipantPicker`, `ScanningProgressOverlay`, `OcrReviewView`, scan pipeline (`scanTicket`, `scanWithTesseract`, `classifyWithNER`), save via `useAppStore.addTicket`, navigation on save
- [ ] 6.2 Wire `NewTicketView` in `src/main.tsx` replacing `NewTicketPlaceholder` import and render

## Phase 7 — Unit Tests

- [ ] 7.1 Write `src/components/scan/ScanEngineSelector.test.tsx` — render all engine options, select triggers `updateSettings`, offline disables server engine, WebGPU check for Florence-2
- [ ] 7.2 Write `src/components/ticket/TicketItemsEditor.test.tsx` — add/delete/edit items, toggle IVA mode, change tip mode/discounts, verify summary totals update

## Phase 8 — Verification

- [ ] 8.1 `tsc --noEmit` — fix all TypeScript errors across changed files
- [ ] 8.2 `npm run build` — verify production build succeeds
