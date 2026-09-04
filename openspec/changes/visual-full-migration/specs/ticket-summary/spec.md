# Spec Delta: ticket-summary

## MODIFIED Requirements

### Requirement: Gradient header card

The TicketSummary MUST render a gradient header Card using `bg-gradient-to-br from-primary to-emerald-600 text-primary-foreground`.

(Previously: standard Card header with no gradient)

#### Scenario: Header content

- **WHEN** the summary header renders
- **THEN** it MUST show the total amount, participant count, and ticket title
- **AND** the Card MUST use `bg-gradient-to-br from-primary to-emerald-600 text-primary-foreground`
- **AND** typography MUST be `text-2xl font-bold` for the total

### Requirement: Visual progress bars

The TicketSummary MUST render visual progress bars for each participant showing their share percentage.

#### Scenario: Progress bar rendering

- **WHEN** rendering a participant row
- **THEN** a bar MUST render with `<div style={{ width: `${pct}%` }} className="h-2 rounded-full bg-primary transition-all" />`
- **AND** the background track MUST be `h-2 w-full rounded-full bg-muted`

### Requirement: Share and delete actions

The TicketSummary MUST provide share and delete action buttons using specific icons.

#### Scenario: Action buttons

- **WHEN** the actions section renders
- **THEN** it MUST include buttons with `Share2`, `Download`, `RotateCcw`, `Trash2` icons
- **AND** the delete button MUST be `variant="destructive"`
- **AND** each button MUST have `aria-label`

### Requirement: Verification card

The TicketSummary MUST render a verification card showing if the ticket has been verified.

#### Scenario: Verified state

- **WHEN** the ticket is verified
- **THEN** the card MUST render with `CheckCircle2` icon in emerald and `text-emerald-600`

#### Scenario: Unverified state

- **WHEN** the ticket is not verified
- **THEN** the card MUST render with `AlertTriangle` icon in amber and `text-amber-600`
