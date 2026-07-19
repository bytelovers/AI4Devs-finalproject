# Spec Delta: navigation

## MODIFIED Requirements

### Requirement: Bottom navigation structure

The bottom navigation MUST render as a 5-item grid with a center prominent button styled as h-11 w-11 rounded-full bg-primary scale-105 shadow-lg shadow-primary/30.

#### Scenario: Center prominent button

- **WHEN** the bottom nav renders
- **THEN** the center (Nuevo) button MUST be `h-11 w-11 rounded-full bg-primary`
- **AND** the button MUST have `scale-105` and `shadow-lg shadow-primary/30`
- **AND** the button MUST render the Plus icon in `text-primary-foreground`
- **AND** the button MUST be elevated with `-translate-y-3 ring-4 ring-background`

(Previously: flat grid of 5 equal items without prominent center button)

#### Scenario: Nav item styling

- **WHEN** each nav item renders
- **THEN** non-center items MUST be `flex flex-col items-center gap-1 py-2 text-xs`
- **AND** active items MUST use `text-primary`
- **AND** inactive items MUST use `text-muted-foreground`
- **AND** each item MUST have `transition-colors hover:text-foreground`

#### Scenario: Bottom nav container

- **WHEN** the nav container renders
- **THEN** it MUST be `fixed bottom-0 inset-x-0 z-50 border-t border-border bg-background/80 backdrop-blur-safe-bottom`
- **AND** the inner container MUST be `mx-auto max-w-md px-4`
- **AND** the grid MUST be `grid grid-cols-5 gap-1`
