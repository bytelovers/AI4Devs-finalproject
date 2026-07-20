'use client'

import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppStore } from '@/lib/store'
import { PageHeader, EmptyState } from '@/components/ui/EmptyState'
import { Avatar, AvatarStack } from '@/components/ui/Avatar'
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  Folder,
  FolderPlus,
  Trash2,
  Users,
  ChevronRight,
  UserPlus,
  Check,
  Pencil,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function GroupsView() {
  const groups = useAppStore((s) => s.groups)
  const people = useAppStore((s) => s.people)
  const addGroup = useAppStore((s) => s.addGroup)
  const updateGroup = useAppStore((s) => s.updateGroup)
  const deleteGroup = useAppStore((s) => s.deleteGroup)
  const addMemberToGroup = useAppStore((s) => s.addMemberToGroup)
  const removeMemberFromGroup = useAppStore((s) => s.removeMemberFromGroup)
  const navigate = useNavigate()
  const [showAdd, setShowAdd] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const handleAdd = () => {
    const name = nameInput.trim()
    if (!name) return
    addGroup(name)
    setNameInput('')
    setShowAdd(false)
    toast.success('Grupo creado')
  }

  const handleSaveEdit = () => {
    if (!editingId) return
    const name = editName.trim()
    if (!name) return
    updateGroup(editingId, { name })
    setEditingId(null)
    toast.success('Grupo actualizado')
  }

  return (
    <div className="px-4 pt-6">
      <PageHeader
        title="Grupos"
        subtitle={`${groups.length} ${groups.length === 1 ? 'grupo' : 'grupos'}`}
        action={
          <Button
            size="sm"
            onClick={() => setShowAdd(true)}
            disabled={people.length === 0}
            className="shrink-0"
          >
            <FolderPlus className="h-4 w-4 mr-1" />
            Nuevo
          </Button>
        }
      />

      {people.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Añade contactos primero"
          description="Para crear un grupo necesitas tener al menos un contacto. Ve a la pestaña Contactos."
          className="py-8"
        />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={Folder}
          title="Sin grupos todavía"
          description="Crea grupos como 'Piso', 'Oficina' o 'Familia' para importarlos enteros en tus tickets."
          action={{
            label: 'Crear primer grupo',
            onClick: () => setShowAdd(true),
          }}
          className="py-8"
        />
      ) : (
        <div className="space-y-2">
          {groups.map((group) => {
            const members = group.memberIds
              .map((id) => people.find((p) => p.id === id))
              .filter(Boolean) as typeof people
            return (
              <Card key={group.id} className="p-3">
                {editingId === group.id ? (
                  <div className="flex gap-2">
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
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: group.color }}
                    >
                      <Folder className="h-5 w-5" />
                    </div>
                    <button
                      onClick={() => navigate(`/groups/${group.id}`)}
                      className="flex-1 text-left min-w-0"
                    >
                      <p className="font-semibold text-foreground truncate">
                        {group.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {members.length}{' '}
                        {members.length === 1 ? 'miembro' : 'miembros'}
                      </p>
                    </button>
                    {members.length > 0 && (
                      <AvatarStack people={members} max={3} size="xs" />
                    )}
                    <button
                      onClick={() => {
                        setEditingId(group.id)
                        setEditName(group.name)
                      }}
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
                            ¿Eliminar el grupo "{group.name}"?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Los miembros seguirán existiendo como contactos, pero
                            este grupo desaparecerá.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              deleteGroup(group.id)
                              toast.success('Grupo eliminado')
                            }}
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
            )
          })}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo grupo</DialogTitle>
          </DialogHeader>
          <Input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd()
            }}
            placeholder="Nombre del grupo (ej. Piso, Oficina…)"
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAdd} disabled={!nameInput.trim()}>
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function GroupDetailView() {
  const { groupId } = useParams<{ groupId: string }>()
  const group = useAppStore((s) => s.groups.find((g) => g.id === groupId))
  const people = useAppStore((s) => s.people)
  const addMemberToGroup = useAppStore((s) => s.addMemberToGroup)
  const removeMemberFromGroup = useAppStore((s) => s.removeMemberFromGroup)
  const navigate = useNavigate()
  const [sheetOpen, setSheetOpen] = useState(false)

  if (!group) {
    return (
      <div className="px-4 pt-6">
        <EmptyState
          icon={Folder}
          title="Grupo no encontrado"
          action={{ label: 'Volver', onClick: () => navigate('/groups') }}
        />
      </div>
    )
  }

  const members = group.memberIds
    .map((id) => people.find((p) => p.id === id))
    .filter(Boolean) as typeof people
  const nonMembers = people.filter((p) => !group.memberIds.includes(p.id))

  return (
    <div className="px-4 pt-6">
      <PageHeader
        title={group.name}
        subtitle={`${members.length} ${members.length === 1 ? 'miembro' : 'miembros'}`}
        back={() => navigate('/groups')}
        action={
          <Button
            size="sm"
            onClick={() => setSheetOpen(true)}
            disabled={nonMembers.length === 0}
            className="shrink-0"
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Añadir
          </Button>
        }
      />

      {members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Grupo vacío"
          description="Añade miembros a este grupo desde tus contactos."
          action={{
            label: 'Añadir miembros',
            onClick: () => setSheetOpen(true),
          }}
          className="py-8"
        />
      ) : (
        <div className="space-y-1.5">
          {members.map((person) => (
            <Card key={person.id} className="p-3 flex items-center gap-3">
              <Avatar person={person} size="md" />
              <span className="flex-1 font-medium text-foreground truncate">
                {person.name}
              </span>
              <button
                onClick={() => removeMemberFromGroup(group.id, person.id)}
                className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                aria-label="Quitar del grupo"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </Card>
          ))}
        </div>
      )}

      {/* Sheet para añadir miembros */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Añadir miembros a "{group.name}"</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6 space-y-1.5">
            {nonMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Todos tus contactos ya están en este grupo.
              </p>
            ) : (
              nonMembers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    addMemberToGroup(group.id, p.id)
                    toast.success(`${p.name} añadido a ${group.name}`)
                  }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-border bg-card hover:bg-accent/30"
                >
                  <Avatar person={p} size="md" />
                  <span className="flex-1 text-left font-medium text-foreground">
                    {p.name}
                  </span>
                  <div className="h-6 w-6 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center">
                    <UserPlus className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </button>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}