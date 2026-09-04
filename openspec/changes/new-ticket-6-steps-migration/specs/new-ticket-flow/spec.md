# New Ticket Flow Specification

## Purpose

Define the complete 6-step new ticket creation flow: capture → review → participants → assign → summary, matching the source workspace (`~/Downloads/workspace-previo`) mobile-first UX.

## Requirements

### Requirement: Six-Step Flow Structure

The new ticket creation MUST flow through exactly six steps in order:

1. **capture** — Camera capture or image upload
2. **review** — Edit items, quantities, prices, tax
3. **participants** — Select which contacts/groups participate
4. **assign** — Assign each item to one or more participants
5. **summary** — Verify final split, save ticket

#### Scenario: Complete Flow Happy Path

- GIVEN user starts new ticket
- WHEN user captures image → reviews items → selects participants → assigns items → views summary
- THEN ticket is saved with correct splits
- AND user returns to home view

#### Scenario: Skip Capture (Manual Entry)

- GIVEN user starts new ticket
- WHEN user chooses "Crear ticket manualmente"
- THEN skips capture, goes directly to review with empty items
- AND user can add items manually

#### Scenario: Early Exit

- GIVEN user is at any step
- WHEN user presses back at first step (capture)
- THEN ticket draft is deleted if empty
- AND user returns to home

---

### Requirement: Step Validation Gates

Each step MUST enforce validation before allowing progression:

| Step | Validation Rule |
|------|-----------------|
| review | At least one item exists |
| participants | At least one participant selected |
| assign | Every item has at least one assignment |
| summary | All validations pass |

#### Scenario: Blocked Progression at Review

- GIVEN user at review step
- WHEN ticket has zero items
- THEN "Continuar" button is disabled
- AND helper text shows "Añade al menos un item para continuar"

#### Scenario: Blocked Progression at Participants

- GIVEN user at participants step
- WHEN no contacts selected
- THEN "Continuar" button is disabled
- AND helper text shows "Selecciona al menos una persona"

#### Scenario: Blocked Progression at Assign

- GIVEN user at assign step
- WHEN any item has zero assignments
- THEN "Ver resumen" button is disabled
- AND helper text shows "Asigna todos los items antes de continuar"

---

### Requirement: Visual Stepper Progress

The UI MUST display a horizontal stepper showing all 5 visible steps (capture, review, participants, assign, summary) with:

- Completed steps: filled primary color
- Current step: active primary color
- Future steps: muted with fixed width

#### Scenario: Stepper Reflects Current Position

- GIVEN user at assign step
- WHEN viewing stepper
- THEN capture, review, participants show filled
- AND assign shows active
- AND summary shows muted

---

### Requirement: Camera Capture Options

The capture step MUST provide three capture modes:

1. **Cámara en vivo** — Live preview with frame guide, switch cameras, capture button
2. **Cámara nativa** — Opens device native camera app via `capture="environment"`
3. **Subir imagen** — File picker for gallery images

#### Scenario: Live Camera Success

- GIVEN user grants camera permission
- WHEN user centers ticket in frame and presses capture
- THEN frame captured as JPEG (quality 0.92, max 1600px)
- AND preview shown with "Repetir"/"Usar imagen" options

#### Scenario: Camera Permission Denied

- GIVEN user denies camera permission
- WHEN user attempts live camera
- THEN error shown: "Permiso de cámara denegado..."
- AND auto-fallback to native camera offered

---

### Requirement: OCR Review (Optional)

When Tesseract+Ner engine selected and `showOcrReview` flag enabled, an intermediate step `ocr-review` MUST appear between capture and review:

#### Scenario: OCR Review Enabled

- GIVEN Tesseract+Ner engine selected
- WHEN scan completes OCR phase
- THEN user sees editable raw OCR text with image preview
- AND can choose "Procesar con IA (NER)" or "Sin NER (solo parser)"
- AND can go back to re-capture

---

### Requirement: Assignment Editor

At assign step, MUST render:

- Draggable item rows (showing name, price, quantity)
- For each item, selectable participant chips with color coding
- Visual progress bar showing split distribution per item
- Total per participant summary

#### Scenario: Assign Single Item to Multiple Participants

- GIVEN item "Botella vino" €15
- WHEN user assigns to María and Carlos
- THEN item shows both chips, split €7.50 each
- AND progress bar reflects 50/50

#### Scenario: Assign Item with Uneven Split

- GIVEN item "Postre" €6
- WHEN user adjusts split to 60/40 via quantity
- THEN amounts update: €3.60 / €2.40

---

### Requirement: Ticket Summary & Save

At summary step, MUST display:

- Ticket title (editable)
- Merchant, date, tax rate
- Per-participant totals with colored bars
- Unassigned items warning (if any)
- "Guardar ticket" action

#### Scenario: Save Valid Ticket

- GIVEN all items assigned, participants selected
- WHEN user presses "Guardar ticket"
- THEN ticket persisted with `status: 'completed'`
- AND toast shows "Ticket guardado correctamente"
- AND navigation returns to home

#### Scenario: Save with Unassigned Items

- GIVEN some items have no assignments
- WHEN user presses "Guardar ticket"
- THEN save still allowed (unassigned items tracked)
- AND ticket saved with `status: 'completed'`
- AND unassigned items appear in ticket detail

---

### Requirement: Error Handling

Scan failures MUST show contextual banner:

#### Scenario: Scan Error Recovery

- GIVEN scan fails (network, model load, etc.)
- WHEN error banner appears
- THEN user can "Reintentar" (back to capture) or "Entrada manual" (skip to review empty)

---

### Requirement: Persistence During Flow

Ticket draft MUST survive:

- Step navigation (back/forward)
- Screen rotation
- App backgrounding (short duration)

#### Scenario: Navigate Back Then Forward

- GIVEN user at assign step
- WHEN user goes back to participants, then forward to assign
- THEN all previous assignments preserved

---

### Requirement: Onboarding Integration

First-time users MUST see `ScanOnboarding` before first capture:

#### Scenario: First Launch Onboarding

- GIVEN `showOnboarding` flag true in settings
- WHEN user opens new ticket
- THEN `ScanOnboarding` modal appears before capture
- AND flag set to false after dismiss

---

## Non-Functional

### Visual Consistency

- All cards use `bg-card` / `border-border`
- Primary actions: `bg-primary text-primary-foreground`
- Secondary actions: `variant="outline"` or `variant="ghost"`
- Safe area insets respected (bottom nav, camera preview)

### Accessibility

- All buttons have `aria-label`
- Stepper uses `aria-current="step"` on active
- Focus visible outlines on interactive elements
- Color-blind safe palette (oklch-based from design tokens)

### Performance

- Camera stream stops when leaving capture step
- Heavy components (AssignmentEditor) lazy-loaded if possible
- OCR models loaded on demand