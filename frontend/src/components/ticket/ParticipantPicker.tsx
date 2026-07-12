import { useAppStore } from '@/lib/store'
import type { ID } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Users, Plus, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ParticipantPickerProps {
  selectedIds: ID[]
  onToggle: (id: ID) => void
  onAdd: (ids: ID[]) => void
}

export function ParticipantPicker({
  selectedIds,
  onToggle,
  onAdd,
}: ParticipantPickerProps) {
  const people = useAppStore((s) => s.people)
  const groups = useAppStore((s) => s.groups)

  const selectedSet = new Set(selectedIds)

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Selecciona las personas que participan en esta cuenta. Puedes elegir
        contactos sueltos o importar un grupo entero.
      </p>

      {people.length === 0 && groups.length === 0 && (
        <Card className="p-6 border-dashed border-2 text-center">
          <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-1">
            No hay contactos ni grupos todavía
          </p>
          <p className="text-xs text-muted-foreground">
            Añade contactos desde la sección Contactos para poder asignarlos a
            los tickets.
          </p>
        </Card>
      )}

      {/* Grupos */}
      {groups.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Grupos
          </h3>
          <div className="space-y-1.5">
            {groups.map((group) => {
              const allSelected = group.memberIds.every((mid) =>
                selectedSet.has(mid)
              )
              const someSelected = group.memberIds.some((mid) =>
                selectedSet.has(mid)
              )

              return (
                <Card
                  key={group.id}
                  className={cn(
                    'p-3 flex items-center gap-3',
                    allSelected && 'border-primary/30 bg-accent/30'
                  )}
                >
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: group.color + '20' }}
                  >
                    <Users
                      className="h-4 w-4"
                      style={{ color: group.color }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {group.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {group.memberIds.length}{' '}
                      {group.memberIds.length === 1
                        ? 'persona'
                        : 'personas'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={allSelected ? 'default' : someSelected ? 'secondary' : 'outline'}
                    onClick={() => {
                      if (allSelected) {
                        // Deseleccionar todo el grupo
                        onToggle('__clear_group__')
                        group.memberIds.forEach((mid) => {
                          if (selectedSet.has(mid)) {
                            // HACK: use onToggle to deselect each
                            // This is a workaround since onToggle is designed for single toggles
                          }
                        })
                        // Use onAdd with empty to deselect all from this group
                        const remaining = selectedIds.filter(
                          (id) => !group.memberIds.includes(id)
                        )
                        // Since onToggle is boolean, we need a different approach:
                        // Toggle each member individually
                        group.memberIds.forEach((mid) => {
                          if (selectedSet.has(mid)) {
                            onToggle(mid)
                          }
                        })
                      } else {
                        // Seleccionar todo el grupo
                        const toAdd = group.memberIds.filter(
                          (mid) => !selectedSet.has(mid)
                        )
                        onAdd(toAdd)
                      }
                    }}
                  >
                    {allSelected
                      ? 'Seleccionado'
                      : someSelected
                      ? 'Parcial'
                      : 'Añadir grupo'}
                  </Button>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Personas */}
      {people.length > 0 && (
        <div>
          {groups.length > 0 && (
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-4">
              Personas
            </h3>
          )}
          <div className="space-y-1.5">
            {people.map((person) => {
              const isSelected = selectedSet.has(person.id)
              return (
                <button
                  key={person.id}
                  onClick={() => onToggle(person.id)}
                  className="w-full text-left"
                >
                  <Card
                    className={cn(
                      'p-3 flex items-center gap-3 transition-colors hover:bg-accent/40',
                      isSelected && 'border-primary/30 bg-accent/30'
                    )}
                  >
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
                      style={{ backgroundColor: person.color }}
                    >
                      {person.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {person.name}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3.5 w-3.5 text-primary-foreground" />
                      </div>
                    )}
                  </Card>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Resumen de selección */}
      {selectedIds.length > 0 && (
        <Card className="p-3 bg-accent/30 border-primary/20">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {selectedIds.length}{' '}
              {selectedIds.length === 1
                ? 'persona seleccionada'
                : 'personas seleccionadas'}
            </span>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {selectedIds.map((id) => {
              const person = people.find((p) => p.id === id)
              if (!person) return null
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: person.color + '20',
                    color: person.color,
                  }}
                >
                  {person.name}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggle(id)
                    }}
                    className="ml-0.5 hover:opacity-70"
                    aria-label={`Quitar a ${person.name}`}
                  >
                    ×
                  </button>
                </span>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
