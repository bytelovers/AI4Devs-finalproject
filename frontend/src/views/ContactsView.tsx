'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { PageHeader, EmptyState } from '@/components/ui/EmptyState'
import { Avatar } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Users, UserPlus, Pencil, Trash2, FolderPlus } from 'lucide-react'
import { toast } from 'sonner'

export function ContactsView() {
  const people = useAppStore((s) => s.people)
  const addPerson = useAppStore((s) => s.addPerson)
  const updatePerson = useAppStore((s) => s.updatePerson)
  const deletePerson = useAppStore((s) => s.deletePerson)
  const tickets = useAppStore((s) => s.tickets)
  const groups = useAppStore((s) => s.groups)
  const setView = useAppStore((s) => s.setView)
  const [showAdd, setShowAdd] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const handleAdd = () => {
    const name = nameInput.trim()
    if (!name) return
    addPerson(name)
    setNameInput('')
    setShowAdd(false)
    toast.success('Contacto añadido')
  }

  const handleStartEdit = (id: string, currentName: string) => {
    setEditingId(id)
    setEditName(currentName)
  }

  const handleSaveEdit = () => {
    if (!editingId) return
    const name = editName.trim()
    if (!name) return
    updatePerson(editingId, { name })
    setEditingId(null)
    toast.success('Contacto actualizado')
  }

  const handleDelete = (id: string, name: string) => {
    deletePerson(id)
    toast.success(`Se eliminó a ${name}`)
  }

  const getTicketsCount = (personId: string) =>
    tickets.filter((t) => t.participantIds.includes(personId)).length

  return (
    <div className="px-4 pt-6">
      <PageHeader
        title="Contactos"
        subtitle={`${people.length} ${people.length === 1 ? 'persona' : 'personas'}${groups.length > 0 ? ` · ${groups.length} ${groups.length === 1 ? 'grupo' : 'grupos'}` : ''}`}
        action={
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setView('groups')}
              className="shrink-0"
            >
              <FolderPlus className="h-4 w-4 mr-1" />
              Grupo
            </Button>
            <Button
              size="sm"
              onClick={() => setShowAdd(true)}
              className="shrink-0"
            >
              <UserPlus className="h-4 w-4 mr-1" />
              Nuevo
            </Button>
          </div>
        }
      />

      {people.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Sin contactos todavía"
          description="Añade las personas con las que sueles compartir cuentas para dividir tickets más rápido."
          action={{
            label: 'Añadir primer contacto',
            onClick: () => setShowAdd(true),
          }}
          className="py-8"
        />
      ) : (
        <div className="space-y-1.5">
          {people.map((person) => (
            <Card key={person.id} className="p-3">
              {editingId === person.id ? (
                <div className="flex gap-2 items-center">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit()
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    autoFocus
                    className="flex-1"
                  />
                  <Button size="sm" onClick={handleSaveEdit}>
                    Guardar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingId(null)}
                  >
                    Cancelar
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Avatar person={person} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">
                      {person.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getTicketsCount(person.id)}{' '}
                      {getTicketsCount(person.id) === 1
                        ? 'ticket'
                        : 'tickets'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleStartEdit(person.id, person.name)}
                    className="p-2 rounded-full text-muted-foreground hover:bg-accent"
                    aria-label="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          ¿Eliminar a {person.name}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Se eliminará de tus contactos y de cualquier grupo.
                          Los tickets anteriores conservarán las asignaciones
                          pero esta persona ya no aparecerá nombrada.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(person.id, person.name)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Sección de grupos rápidos */}
      {groups.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
            Grupos
          </h2>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => setView('groups')}
                className="shrink-0 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-medium border border-border hover:bg-accent/80"
              >
                {g.name} ({g.memberIds.length})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Diálogo añadir */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo contacto</DialogTitle>
          </DialogHeader>
          <Input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd()
            }}
            placeholder="Nombre (ej. María, Carlos…)"
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAdd} disabled={!nameInput.trim()}>
              Añadir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}