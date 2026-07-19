# Spec Delta: participant-picker

## REMOVED Requirements

### Requirement: 224-line custom ParticipantPicker

**Reason**: Source workspace uses a thin 30-line `PeopleGroupsManager` wrapper that delegates to the group store. The current custom 224-line ParticipantPicker is redundant.

**Migration**: Replace `src/components/ticket/ParticipantPicker.tsx` with a re-export of `PeopleGroupsManager` from `src/components/people/PeopleGroupsManager.tsx`, matching the source pattern.

#### Scenario: Replacement wrapper

- **WHEN** any component imports ParticipantPicker
- **THEN** it MUST receive the PeopleGroupsManager component with the same props surface
- **AND** the file `src/components/ticket/ParticipantPicker.tsx` MUST be replaced with a 30-line wrapper
- **AND** the wrapper MUST accept `value`, `onChange`, `groups`, `people` props and delegate to PeopleGroupsManager
