## Exploration: new-ticket-6-steps-migration

### Current State

The current frontend (`AI4Devs-finalproject/frontend`) has a **3-step NewTicketView** at `src/views/NewTicketView.tsx`:
1. **capture** — Camera capture with engine selection
2. **review** — Edit ticket items, taxes, title
3. **participants** — Select who participates in the bill

After participants, it saves and goes home. Missing: **assign** (item assignment) and **summary** (final verification + close).

The source workspace (`~/Downloads/workspace-previo`) has a **6-step flow** in `src/components/cuadra/new-ticket-view.tsx`:
1. **capture** — Camera capture with full engine selection UI
2. **scanning** — Transient (processing image)
3. **ocr-review** — Transient (review OCR text before NER)
4. **review** — Edit ticket items, taxes, title
5. **participants** — Select who participates
6. **assign** — Assign items to participants (AssignmentEditor)
7. **summary** — Final verification with TicketSummary (cuadre check, share, close)

### Affected Areas

| File | Why Affected |
|------|--------------|
| `frontend/src/views/NewTicketView.tsx` | Main orchestrator — needs 2 new steps, updated STEP_ORDER, validation, navigation, stepper UI, bottom buttons |
| `frontend/src/components/ticket/AssignmentEditor.tsx` | Already exists (694 lines) — needs integration at `assign` step |
| `frontend/src/components/ticket/TicketSummary.tsx` | Already exists (307 lines) — needs integration at `summary` step |
| `frontend/src/components/camera/CameraCapture.tsx` | Simplified vs source (no native/upload fallbacks, English labels) — may need parity |
| `frontend/src/components/ui/EmptyState.tsx` | PageHeader exists; EmptyState is different API vs source — need to verify compatibility |
| `frontend/src/components/onboarding/ScanOnboarding.tsx` | Already exists and nearly identical to source — OK |
| `frontend/src/components/ticket/TicketItemsEditor.tsx` | Used in `review` step — imports ScanningOverlay, ScanErrorBanner, ScanSuccessBanner (not in source) |

### Component Comparison

| Component | Source (6-step) | Current (3-step) | Gap |
|-----------|-----------------|------------------|-----|
| **NewTicketView** | 924 lines, 7 steps (incl. transient) | 845 lines, 5 steps | Missing `assign`, `summary` steps; simpler `goNext`/`goBack`; missing OCR-review integration; stepper has 3 not 5 visible steps |
| **AssignmentEditor** | 696 lines at `cuadra/assignment-editor.tsx` | 694 lines at `ticket/AssignmentEditor.tsx` | **Nearly identical** — just import path differences (`./avatar` vs `@/components/ui/AvatarStack`, `./people-groups-manager` vs `@/components/people/PeopleGroupsManager`) |
| **TicketSummary** | 307 lines at `cuadra/ticket-summary.tsx` | 307 lines at `ticket/TicketSummary.tsx` | **Nearly identical** — minor diffs: source has `Download` icon (unused), current uses `RotateCcw` for edit |
| **CameraCapture** | 421 lines, full native/upload fallbacks, Spanish labels | 227 lines, disabled fallbacks, English labels | Source has working "Cámara nativa" + "Subir imagen"; current shows disabled buttons |
| **EmptyState / PageHeader** | 95 lines, combined in `empty-state.tsx` | 93 lines, combined in `ui/EmptyState.tsx` | **API compatible** — same props for PageHeader; EmptyState differs (source: icon/title/description/action; current: icon/title/description/action — same) |
| **ScanOnboarding** | 565 lines | 527 lines | **Nearly identical** — current drops `filesCompleted` vs `files.total` (minor) |

### Key Differences to Document

| Feature | Source (6 steps) | Current (3 steps) | Gap |
|---------|------------------|-------------------|-----|
| **Steps** | capture, review, participants, assign, summary | capture, review, participants | Missing: assign, summary |
| **AssignmentEditor** | Full component with assignment logic | Exists but not used | Need to integrate at `assign` step |
| **TicketSummary** | Final review + save/close/share | Goes to home after participants | Need to integrate at `summary` step |
| **Validation** | Per-step: assign requires all items assigned | Simplified (no assign validation) | Update `canProceed` for assign step |
| **Stepper UI** | Full 5-step visual (excludes capture/scanning) | 3-step visual | Update stepper for 5 steps |
| **Bottom buttons** | Continue / Save / Edit (summary) | Continue / Save | Add summary actions |
| **Ticket image preview** | Shows in review, participants, assign | Shows in review, participants | Add to assign step |
| **Engine selection** | Full UI with badges, onboarding | Simplified badge only | Consider parity |
| **OCR Review** | Transient step between scanning/review | Same (exists in both) | Already present |

### Approaches

1. **Incremental Migration (Recommended)**
   - Add `assign` and `summary` to `STEP_ORDER` in current NewTicketView
   - Import and render `AssignmentEditor` and `TicketSummary` at those steps
   - Update `canProceed` validation for `assign` step
   - Update stepper visual to show 5 steps
   - Update bottom buttons: "Continuar" → "Ver resumen" at assign, "Confirmar y cerrar" at summary
   - Add ticket image preview to assign step
   - **Effort: Low** — components already exist, mostly wiring

2. **Full Parity with Source**
   - Also migrate CameraCapture to match source (native camera, upload, Spanish labels)
   - Add ScanOnboarding integration on first scan
   - Match engine selection UI exactly
   - **Effort: Medium** — more UI work, but current CameraCapture works

3. **Replace Current with Source**
   - Copy source `new-ticket-view.tsx` wholesale, adapt imports to current project structure
   - **Effort: High** — risk of breaking existing integrations (store, hooks, types)

### Recommendation

**Approach 1 (Incremental Migration)** — The AssignmentEditor and TicketSummary components already exist and are nearly identical to the source. The current NewTicketView has all the scanning/OCR logic (scanning, ocr-review, handleCapture, processWithNer, etc.) that matches the source. The gap is purely wiring the two missing steps.

**Rationale:**
- Components are already ported and tested
- Current NewTicketView has sophisticated scan pipeline (Tesseract+NER, OCR review, multiple engines)
- Minimal diff reduces regression risk
- Can be done in a single focused PR

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| AssignmentEditor import path mismatches | Medium | Build fails | Verify imports: `AvatarStack`, `PeopleGroupsManager`, `useAppStore` selectors |
| TicketSummary `onClose`/`onEdit` callback signature mismatch | Low | Runtime error | Check props interface matches usage in NewTicketView |
| Stepper visual breaks with 5 steps | Low | UI glitch | Test stepper rendering with 5 items |
| `canProceed` validation for assign step needs ticket.items access | Low | Can't proceed | Ensure ticket is non-null at assign step (guaranteed by flow) |
| CameraCapture UX regression (native/upload) | Low | User confusion | Defer to follow-up; current capture works |

### Ready for Proposal

**Yes.** The exploration is complete. The orchestrator should proceed to the Proposal phase with the Incremental Migration approach.