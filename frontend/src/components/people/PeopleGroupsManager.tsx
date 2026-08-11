import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import type { ID } from '@/lib/types'
import { Avatar } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Users,
  Folder,
  Check,
  UserPlus,
  X,
  FolderPlus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface PeopleGroupsManagerProps {
  /** IDs de personas seleccionadas */
  selectedIds: ID[]
  /** Callback al toggle una persona */
  onTogglePerson: (id: ID) => void
  /** Callback al añadir personas (desde grupo o nuevas) */
  onAddPeople: (ids: ID[]) => void
}

/**
 * Componente reutilizable para seleccionar personas y gestionar grupos.
 * Se usa en:
 *   - ParticipantPicker (nuevo ticket, paso participantes)
 *   - TicketDetailView (pestaña Personas)
 *
 * Permite:
 *   - Añadir personas nuevas
 *   - Seleccionar/deseleccionar personas
 *   - Importar grupos existentes
 *   - Crear grupos nuevos desde aquí
 *   - Añadir personas existentes a grupos
 */
export function PeopleGroupsManager({
  selectedIds,
  onTogglePerson,
  onAddPeople,
}: PeopleGroupsManagerProps) {
  const people = useAppStore((s) => s.people)
  const groups = useAppStore((s) => s.groups)
  const addPerson = useAppStore((s) => s.addPerson)
  const addGroup = useAppStore((s) => s.addGroup)
  const [newName, setNewName] = useState('')
  const [showGroups, setShowGroups] = useState(false)
  const [showNewGroup, setShowNewGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupMembers, setNewGroupMembers] = useState<ID[]>([])

  const handleAddNew = () => {
    const name = newName.trim()
    if (!name) return
    const person = addPerson(name)
    onAddPeople([person.id])
    setNewName('')
  }

  /** Toggle todas las personas de un grupo: si todas están seleccionadas, las quita; si no, las añade */
  const handleToggleGroup = (memberIds: ID[]) => {
    const allSelected = memberIds.every((id) => selectedIds.includes(id))
    if (allSelected) {
      // Quitar todas (toggle individualmente)
      memberIds.forEach((id) => {
        if (selectedIds.includes(id)) onTogglePerson(id)
      })
    } else {
      // Añadir las que faltan
      onAddPeople(memberIds)
    }
  }

  /** Comprueba si todos los miembros de un grupo están seleccionados */
  const isGroupFullySelected = (memberIds: ID[]) =>
    memberIds.length > 0 && memberIds.every((id) => selectedIds.includes(id))

  /** Comprueba si algunos miembros de un grupo están seleccionados */
  const isGroupPartiallySelected = (memberIds: ID[]) =>
    memberIds.some((id) => selectedIds.includes(id)) && !isGroupFullySelected(memberIds)

  const handleCreateGroup = () => {
    const name = newGroupName.trim()
    if (!name) return
    addGroup(name, newGroupMembers)
    toast.success(`Grupo "${name}" creado`)
    setNewGroupName('')
    setNewGroupMembers([])
    setShowNewGroup(false)
  }

  const toggleGroupMember = (personId: ID) => {
    setNewGroupMembers((prev) =>
      prev.includes(personId)
        ? prev.filter((id) => id !== personId)
        : [...prev, personId]
    )
  }

  return (
    <div className="space-y-4">
      {/* Añadir nueva persona */}
      <Card className="p-3">
        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddNew()
            }}
            placeholder="Añadir persona nueva…"
            className="border-0 px-0 focus-visible:ring-0"
          />
          <Button
            size="sm"
            onClick={handleAddNew}
            disabled={!newName.trim()}
            className="shrink-0"
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Añadir
          </Button>
        </div>
      </Card>

      {/* Sección de grupos */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <button
            onClick={() => setShowGroups(!showGroups)}
            className="flex items-center gap-1.5 text-sm font-medium text-primary"
          >
            <Folder className="h-4 w-4" />
            Grupos {groups.length > 0 && `(${groups.length})`}
          </button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowNewGroup(true)}
            className="h-7 text-xs"
          >
            <FolderPlus className="h-3.5 w-3.5 mr-1" />
            Nuevo grupo
          </Button>
        </div>

        {showGroups && (
          <div className="space-y-2">
            {groups.length === 0 ? (
              <p className="text-xs text-muted-foreground italic px-1">
                No tienes grupos. Crea uno para añadir varias personas a la vez.
              </p>
            ) : (
              groups.map((g) => {
                const groupPeople = g.memberIds
                  .map((id) => people.find((p) => p.id === id))
                  .filter(Boolean) as typeof people
                const fullySelected = isGroupFullySelected(g.memberIds)
                const partiallySelected = isGroupPartiallySelected(g.memberIds)
                return (
                  <Card
                    key={g.id}
                    className={cn(
                      'p-2.5 cursor-pointer transition-all',
                      fullySelected
                        ? 'border-2 border-primary bg-accent/30'
                        : partiallySelected
                        ? 'border-2 border-primary/40 bg-accent/10'
                        : 'border-border'
                    )}
                    onClick={() => handleToggleGroup(g.memberIds)}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'h-8 w-8 rounded-lg flex items-center justify-center shrink-0',
                          fullySelected ? 'bg-primary/15' : ''
                        )}
                        style={{ backgroundColor: fullySelected ? undefined : g.color + '20' }}
                      >
                        {fullySelected ? (
                          <Check className="h-4 w-4 text-primary" />
                        ) : (
                          <Folder className="h-4 w-4" style={{ color: g.color }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {g.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {g.memberIds.length}{' '}
                          {g.memberIds.length === 1 ? 'miembro' : 'miembros'}
                          {fullySelected && ' · Seleccionado'}
                          {partiallySelected && ' · Parcial'}
                        </p>
                      </div>
                      <div
                        className={cn(
                          'h-6 w-6 rounded-full flex items-center justify-center border-2 transition-colors shrink-0',
                          fullySelected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : partiallySelected
                            ? 'border-primary/40 bg-primary/10'
                            : 'border-muted-foreground/30'
                        )}
                      >
                        {fullySelected && <Check className="h-4 w-4" />}
                      </div>
                    </div>
                    {groupPeople.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2 pl-10">
                        {groupPeople.map((p) => {
                          const isSel = selectedIds.includes(p.id)
                          return (
                            <div
                              key={p.id}
                              className={cn(
                                'flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium',
                                isSel
                                  ? 'bg-primary/15 text-primary'
                                  : 'bg-muted text-muted-foreground'
                              )}
                            >
                              <Avatar person={p} size="xs" />
                              {p.name}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </Card>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* Lista de contactos */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1 flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          Contactos ({people.length})
        </h3>
        {people.length === 0 ? (
          <Card className="p-4 text-center border-dashed border-2">
            <p className="text-sm text-muted-foreground">
              No tienes contactos todavía. Añade el primero arriba.
            </p>
          </Card>
        ) : (
          <div className="space-y-1.5">
            {people.map((person) => {
              const selected = selectedIds.includes(person.id)
              return (
                <button
                  key={person.id}
                  onClick={() => onTogglePerson(person.id)}
                  className={cn(
                    'w-full flex items-center gap-3 p-2.5 rounded-xl border transition-colors',
                    selected
                      ? 'border-primary bg-accent/50'
                      : 'border-border bg-card hover:bg-accent/30'
                  )}
                >
                  <Avatar person={person} size="md" />
                  <span className="flex-1 text-left font-medium text-foreground">
                    {person.name}
                  </span>
                  <div
                    className={cn(
                      'h-6 w-6 rounded-full flex items-center justify-center border-2 transition-colors',
                      selected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted-foreground/30'
                    )}
                  >
                    {selected && <Check className="h-4 w-4" />}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Resumen seleccionados */}
      {selectedIds.length > 0 && (
        <Card className="p-3 bg-accent/30 border-primary/20">
          <p className="text-xs text-muted-foreground mb-1">
            Personas seleccionadas ({selectedIds.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {selectedIds.map((id) => {
              const p = people.find((x) => x.id === id)
              if (!p) return null
              return (
                <div
                  key={id}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-background border border-border text-xs font-medium"
                >
                  <Avatar person={p} size="xs" />
                  {p.name}
                  <button
                    onClick={() => onTogglePerson(id)}
                    className="ml-0.5 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Diálogo: Crear nuevo grupo */}
      <Dialog open={showNewGroup} onOpenChange={setShowNewGroup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear nuevo grupo</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Nombre del grupo (ej. Piso, Oficina…)"
              autoFocus
            />
            {people.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Selecciona los miembros:
                </p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {people.map((p) => {
                    const selected = newGroupMembers.includes(p.id)
                    return (
                      <button
                        key={p.id}
                        onClick={() => toggleGroupMember(p.id)}
                        className={cn(
                          'w-full flex items-center gap-2 p-2 rounded-lg border transition-colors',
                          selected
                            ? 'border-primary bg-accent/30'
                            : 'border-border'
                        )}
                      >
                        <Avatar person={p} size="sm" />
                        <span className="flex-1 text-left text-sm">
                          {p.name}
                        </span>
                        {selected && <Check className="h-4 w-4 text-primary" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewGroup(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateGroup}
              disabled={!newGroupName.trim()}
            >
              Crear grupo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
