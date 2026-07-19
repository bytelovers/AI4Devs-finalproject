# Design: New Ticket 6-Step Migration

## Technical Approach

Migrate the current 3-step NewTicketView (capture → review → participants) to the 6-step flow from the source workspace (`~/Downloads/workspace-previo`): capture → review → participants → assign → summary. The source already implements the exact UX with AssignmentEditor and TicketSummary components that exist in the current project and are compatible. Changes are additive: extend STEP_ORDER, STEP_META, canProceed(), render blocks, stepper filter, bottom buttons, and add ticket image preview in assign step. ScanOnboarding integration per spec (first-launch modal before capture).

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Step state management | Keep `useState<Step>` in NewTicketView | Simple, no new deps, matches source pattern |
| Stepper component | Inline in NewTicketView (5 visible steps) | Source does inline; no separate component needed |
| AssignmentEditor integration | Import existing, pass `ticket` + rely on store `updateTicketItem` | Existing component already has correct API (ticket prop + store hooks) |
| TicketSummary integration | Import existing, pass `ticket`, `onEdit`, `onClose` | Existing component already has correct props |
| ScanOnboarding | Use existing `src/components/onboarding/ScanOnboarding.tsx` | Already compatible; just wire `showOnboarding` state + settings flag |
| Step validation | Extend existing `canProceed()` switch | Matches source pattern exactly |
| Bottom buttons | Conditional render per step (assign → "Ver resumen", summary → no buttons) | Matches source UX exactly |

## Data Flow

```
User Action → NewTicketView (state + store) → Component per step
     │
     ├─ capture → CameraCapture → handleCapture → scanning → applyScanResult → review
     ├─ review → TicketItemsEditor → goNext → participants
     ├─ participants → ParticipantPicker → goNext → assign
     ├─ assign → AssignmentEditor (ticket + updateTicketItem via store) → goNext → summary
     └─ summary → TicketSummary (ticket + onEdit→assign, onClose→home) → save → home
          │
          └─ Ticket image preview shown in review, participants, assign (collapsible)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/views/NewTicketView.tsx` | Modify | Core migration: STEP_ORDER +2 steps, STEP_META +2 entries, add imports (AssignmentEditor, TicketSummary, ListChecks, Receipt), extend canProceed with assign case, add assign/summary render blocks, extend stepper filter, conditional bottom buttons (no buttons at summary), add ticket.image preview in assign step |
| `src/components/ticket/AssignmentEditor.tsx` | Verify | Imports: `AvatarStack` from `@/components/ui/AvatarStack` ✓, `PeopleGroupsManager` from `@/components/people/PeopleGroupsManager` ✓ — both exist |
| `src/components/ticket/TicketSummary.tsx` | Verify | Imports: `AvatarStack`, `formatEUR`, `computeShares`, `calcTicketTotal`, `CheckCircle2`, `AlertTriangle`, `RotateCcw`, `Share2`, `Trash2` — verify all resolve |
| `src/components/onboarding/ScanOnboarding.tsx` | Verify | Already compatible; wire `showOnboarding` from settings flag in NewTicketView |

## Interfaces / Contracts

```tsx
// NewTicketView Step type extension
type Step =
  | 'capture' | 'scanning' | 'ocr-review'
  | 'review' | 'participants' | 'assign' | 'summary';

// STEP_META additions
assign: { title: 'Asignar items', subtitle: 'Reparte cada item entre las personas', icon: ListChecks }
summary: { title: 'Resumen y cuadre', subtitle: 'Verifica que todo cuadra', icon: Receipt }

// canProceed() new case
case 'assign':
  return ticket.items.every(it => it.assignments.length > 0)

// Bottom button labels
step === 'assign' ? 'Ver resumen' : step === 'summary' ? (none, TicketSummary handles) : 'Continuar'
```

## Testing Strategy

| Layer | What | How |
|-------|------|-----|
| Unit | `canProceed()` logic per step (review, participants, assign) | Vitest unit tests with mocked ticket store |
| Integration | Full 6-step flow: capture → review → participants → assign → summary → save | Playwright E2E or manual QA script |
| Visual | Stepper renders 5 visible steps (capture hidden), correct active/filled states | Manual browser check at each step |
| Regression | Existing 3-step flow still works (capture→review→participants→save) | Existing tests pass; manual smoke test |
| Onboarding | ScanOnboarding modal appears on first launch when setting flag true | Toggle flag, reload, verify modal |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary affected.

## Migration / Rollout

No migration needed — additive changes only. Existing tickets unaffected. Rollback: `git checkout HEAD -- frontend/src/views/NewTicketView.tsx`

## Open Questions

- [ ] Confirm `TicketSummary` imports resolve (CheckCircle2, AlertTriangle, RotateCcw, Share2, Trash2 from lucide-react)
- [ ] Confirm `AvatarStack` import path in AssignmentEditor (`@/components/ui/AvatarStack` vs `@/components/ui/avatar-stack`)
- [ ] Verify `showOnboarding` setting key exists in store (`settings.showOnboarding` or `featureFlags.showOnboarding`)
- [ ] Decide: lazy-load AssignmentEditor/TicketSummary with `React.lazy`? (Source doesn't; keep simple for now)