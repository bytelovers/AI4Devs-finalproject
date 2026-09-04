import { PeopleGroupsManager } from '@/components/people/PeopleGroupsManager'

export function ParticipantPicker({
  selectedIds,
  onToggle,
  onAdd,
}: {
  selectedIds: string[]
  onToggle: (id: string) => void
  onAdd: (ids: string[]) => void
}) {
  return (
    <PeopleGroupsManager
      selectedIds={selectedIds}
      onTogglePerson={onToggle}
      onAddPeople={onAdd}
    />
  )
}