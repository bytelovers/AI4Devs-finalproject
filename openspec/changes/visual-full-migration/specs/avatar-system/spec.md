# Spec Full: avatar-system

## Requirements

### Requirement: Avatar component with person prop

The system MUST provide an Avatar component that renders a circular avatar from a person object with name, color, and optional initials.

#### Scenario: Render with initials from name

- **WHEN** Avatar is rendered with `person={{ id, name: "Juan Pérez", color: "oklch(0.7 0.15 150)" }}`
- **AND** no `initials` prop is provided
- **THEN** the Avatar MUST derive initials from `name` (first letter of first word + first letter of last word, uppercase)
- **AND** the avatar MUST render as a `rounded-full flex items-center justify-center font-medium text-primary-foreground`
- **AND** the background MUST be `style={{ backgroundColor: person.color }}`

#### Scenario: Render with explicit initials

- **WHEN** Avatar is rendered with `person={{ id, name, color, initials: "JP" }}`
- **THEN** it MUST use the provided initials instead of deriving them

#### Scenario: Size variants

- **WHEN** the `size` prop is `"xs"` (default)
- **THEN** the avatar MUST be `h-6 w-6 text-[10px]`
- **WHEN** size is `"sm"`
- **THEN** the avatar MUST be `h-7 w-7 text-xs`
- **WHEN** size is `"md"`
- **THEN** the avatar MUST be `h-8 w-8 text-sm`
- **WHEN** size is `"lg"`
- **THEN** the avatar MUST be `h-10 w-10 text-base`

#### Scenario: Optional className override

- **WHEN** className is provided
- **THEN** it MUST be merged with the size classes (className wins conflicts)

#### Scenario: Used by downstream components

- **WHEN** AssignmentEditor renders participants
- **AND** **WHEN** TicketSummary renders participant lists
- **AND** **WHEN** PeopleGroupsManager renders group members
- **THEN** all MUST use this local Avatar component (NOT AvatarStack)
