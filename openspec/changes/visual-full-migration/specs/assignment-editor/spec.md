# Spec Delta: assignment-editor

## MODIFIED Requirements

### Requirement: Local Avatar usage

The AssignmentEditor MUST use the local `Avatar` component (with person prop) instead of AvatarStack.

(Previously: imported from `@/components/ui/AvatarStack`)

#### Scenario: Participant rendering

- **WHEN** rendering participants
- **THEN** each participant MUST render via `<Avatar person={person} size="sm" />`
- **AND** NOT via AvatarStack

### Requirement: vaul Sheet for bottom sheets

The AssignmentEditor MUST use `vaul`'s Sheet component with `side="bottom"` and `rounded-t-2xl` styling.

(Previously: used `@/components/ui/sheet`)

#### Scenario: Bottom sheet open

- **WHEN** the editor opens a bottom sheet for participant or group selection
- **THEN** it MUST import `Sheet` from `vaul`
- **AND** the SheetContent MUST have `rounded-t-2xl` className
- **AND** side MUST be `bottom`

### Requirement: PeopleGroupsManager integration

The AssignmentEditor MUST delegate group/people management to `PeopleGroupsManager` (local wrapper component).

(Previously: inlined participant/group selection logic)

### Requirement: ModeBadge with specific icons

The AssignmentEditor MUST render a ModeBadge showing the current assignment mode with specific icons and colors:

#### Scenario: Equal mode

- **WHEN** mode is `equal`
- **THEN** the badge MUST use the `User` icon with emerald color

#### Scenario: Split mode

- **WHEN** mode is `split`
- **THEN** the badge MUST use the `Divide` icon with amber color

#### Scenario: Custom mode

- **WHEN** mode is `custom`
- **THEN** the badge MUST use the `Scale` icon with rose color

### Requirement: Group assignment chips

The AssignmentEditor MUST render group assignment chips with Folder icons colored by group.

#### Scenario: Group chip rendering

- **WHEN** a ticket is assigned to a group
- **THEN** a chip MUST render with `<Folder className="h-3.5 w-3.5" style={{ color: group.color }} />`
- **AND** the chip text MUST show `group.name`
- **AND** the chip background MUST be `bg-muted` with `rounded-full px-2 py-1 text-xs`
