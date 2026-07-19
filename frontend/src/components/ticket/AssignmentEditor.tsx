'use client'

import { useAppStore } from '@/lib/store'
import { formatEUR, itemLineTotal } from '@/lib/calc'
import type { Ticket, TicketItem, ID, AssignmentMode } from '@/lib/types'
import { Avatar } from '@/components/ui/Avatar'
import { PeopleGroupsManager } from '@/components/people/PeopleGroupsManager'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useState } from 'react'
import {
  User,
  Users,
  Scale,
  ChevronRight,
  Plus,
  Minus,
  Check,
  Divide,
  Folder,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AssignmentEditorProps {
  ticket: Ticket
}

export function AssignmentEditor({ ticket }: AssignmentEditorProps) {
  const updateTicketItem = useAppStore((s) => s.updateTicketItem)
  const updateTicket = useAppStore((s) => s.updateTicket)
  const people = useAppStore((s) => s.people)
  const groups = useAppStore((s) => s.groups)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [showParticipants, setShowParticipants] = useState(false)

  const participants = ticket.participantIds
    .map((id) => people.find((p) => p.id === id))
    .filter(Boolean) as typeof people

  const editingItem = ticket.items.find((it) => it.id === editingItemId) ?? null

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Asigna cada item a una persona o compártelo entre varias. Al final, la
        app verifica que todo cuadre con el total del ticket.
      </p>

      {/* Lista de items con resumen de asignación */}
      <div className="space-y-2">
        {ticket.items.map((item) => (
          <ItemAssignmentRow
            key={item.id}
            item={item}
            participants={participants}
            onEdit={() => setEditingItemId(item.id)}
          />
        ))}
      </div>

      {/* Distribución de IVA y propina */}
      <Card className="p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">
          Distribución de IVA y propina
        </h3>
        {ticket.taxMode === 'added' && ticket.taxAmount > 0 && (
          <div>
            <Label>IVA ({formatEUR(ticket.taxAmount)})</Label>
            <Select
              value={ticket.taxDistribution}
              onValueChange={(v) =>
                updateTicket(ticket.id, {
                  taxDistribution: v as 'proportional' | 'equal',
                })
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="proportional">
                  Proporcional al consumo
                </SelectItem>
                <SelectItem value="equal">A partes iguales</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        {ticket.tipMode !== 'none' && ticket.tipAmount > 0 && (
          <div>
            <Label>Propina ({formatEUR(ticket.tipAmount)})</Label>
            <Select
              value={ticket.tipDistribution}
              onValueChange={(v) =>
                updateTicket(ticket.id, {
                  tipDistribution: v as 'proportional' | 'equal',
                })
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="proportional">
                  Proporcional al consumo
                </SelectItem>
                <SelectItem value="equal">A partes iguales</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        {ticket.taxMode !== 'added' && ticket.tipMode === 'none' && (
          <p className="text-xs text-muted-foreground">
            No hay IVA ni propina que distribuir.
          </p>
        )}
      </Card>

      {/* Gestión de participantes */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            Participantes ({participants.length})
          </h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowParticipants(true)}
            className="h-7 text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Gestionar
          </Button>
        </div>
        {participants.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            No hay participantes. Añade personas para poder asignar items.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {participants.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted text-xs font-medium"
              >
                <Avatar person={p} size="xs" />
                {p.name}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Sheet de edición de asignación para un item */}
      <Sheet
        open={editingItem !== null}
        onOpenChange={(open) => {
          if (!open) setEditingItemId(null)
        }}
      >
        <SheetContent
          side="bottom"
          className="max-h-[85vh] overflow-y-auto rounded-t-2xl"
        >
          {editingItem && (
            <SheetHeader className="pb-2">
              <SheetTitle className="text-left">
                Asignar: {editingItem.name || 'Item'}
              </SheetTitle>
              <p className="text-sm text-muted-foreground text-left">
                {editingItem.quantity} × {formatEUR(editingItem.unitPrice)} ={' '}
                <span className="font-semibold text-foreground">
                  {formatEUR(itemLineTotal(editingItem))}
                </span>
              </p>
            </SheetHeader>
          )}
          {editingItem && (
            <ItemAssignmentSheet
              item={editingItem}
              participants={participants}
              groups={groups}
              onChange={(patch) =>
                updateTicketItem(ticket.id, editingItem.id, patch)
              }
              onClose={() => setEditingItemId(null)}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Sheet de gestión de participantes */}
      <Sheet
        open={showParticipants}
        onOpenChange={setShowParticipants}
      >
        <SheetContent
          side="bottom"
          className="max-h-[85vh] overflow-y-auto rounded-t-2xl"
        >
          <SheetHeader className="pb-2">
            <SheetTitle className="text-left">
              Gestionar participantes
            </SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6">
            <PeopleGroupsManager
              selectedIds={ticket.participantIds}
              onTogglePerson={(id) => {
                const exists = ticket.participantIds.includes(id)
                updateTicket(ticket.id, {
                  participantIds: exists
                    ? ticket.participantIds.filter((p) => p !== id)
                    : [...ticket.participantIds, id],
                })
              }}
              onAddPeople={(ids) => {
                const merged = Array.from(
                  new Set([...ticket.participantIds, ...ids])
                )
                updateTicket(ticket.id, { participantIds: merged })
              }}
            />
            <Button
              onClick={() => setShowParticipants(false)}
              className="w-full mt-4"
            >
              Hecho
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-xs font-medium text-muted-foreground">
      {children}
    </label>
  )
}

function ItemAssignmentRow({
  item,
  participants,
  onEdit,
}: {
  item: TicketItem
  participants: { id: string; name: string; color: string; initials: string }[]
  onEdit: () => void
}) {
  const total = itemLineTotal(item)
  const assignedPeople = item.assignments
    .map((a) => participants.find((p) => p.id === a.personId))
    .filter(Boolean) as typeof participants

  const totalWeight = item.assignments.reduce((s, a) => s + a.weight, 0)
  const isFullyAssigned =
    item.assignments.length > 0 && Math.abs(totalWeight - 1) < 0.01

  return (
    <button
      onClick={onEdit}
      className="w-full text-left"
    >
      <Card
        className={cn(
          'p-3 transition-colors hover:bg-accent/30',
          item.assignments.length === 0
            ? 'border-warning-border bg-warning-bg/60'
            : isFullyAssigned
            ? 'border-primary/30 bg-accent/20'
            : 'border-warning-border bg-warning-bg/60'
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-foreground text-sm truncate">
                {item.name || 'Item sin nombre'}
              </h4>
              <span className="text-xs text-muted-foreground shrink-0">
                ×{item.quantity}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                {formatEUR(total)}
              </span>
              <ModeBadge mode={item.mode} />
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
        </div>

        {/* Asignación actual */}
        {assignedPeople.length > 0 ? (
          <div className="mt-2 pt-2 border-t border-border/60 space-y-1">
            {item.assignments.map((a) => {
              const p = participants.find((x) => x.id === a.personId)
              if (!p) return null
              const share =
                totalWeight > 0 ? total * (a.weight / totalWeight) : 0
              const pct = totalWeight > 0 ? (a.weight / totalWeight) * 100 : 0
              return (
                <div
                  key={a.personId}
                  className="flex items-center gap-2 text-xs"
                >
                  <Avatar person={p} size="xs" />
                  <span className="flex-1 text-foreground/80">{p.name}</span>
                  <span className="text-muted-foreground">
                    {pct.toFixed(0)}%
                  </span>
                  <span className="font-medium text-foreground w-16 text-right">
                    {formatEUR(share)}
                  </span>
                </div>
              )
            })}
            {!isFullyAssigned && (
              <p className="text-xs text-warning-foreground font-medium pt-0.5">
                ⚠ Pesos no suman 100% ({(totalWeight * 100).toFixed(0)}%)
              </p>
            )}
          </div>
        ) : (
          <div className="mt-2 pt-2 border-t border-border/60">
            <p className="text-xs text-warning-foreground font-medium flex items-center gap-1">
                <Plus className="h-3 w-3" />
                Toca para asignar
              </p>
          </div>
        )}
      </Card>
    </button>
  )
}

function ModeBadge({ mode }: { mode: AssignmentMode }) {
  const config = {
    single: { label: '1 persona', icon: User, color: 'text-primary' },
    shared: { label: 'Compartido', icon: Users, color: 'text-blue-600' },
    weighted: { label: 'Pesos', icon: Scale, color: 'text-purple-600' },
  }
  const c = config[mode]
  const Icon = c.icon
  return (
    <span className={cn('inline-flex items-center gap-1 text-[10px] font-medium', c.color)}>
      <Icon className="h-3 w-3" />
      {c.label}
    </span>
  )
}

/** Sheet de edición de asignación de un item concreto. */
function ItemAssignmentSheet({
  item,
  participants,
  groups,
  onChange,
  onClose,
}: {
  item: TicketItem
  participants: { id: string; name: string; color: string; initials: string }[]
  groups: { id: string; name: string; color: string; memberIds: string[] }[]
  onChange: (patch: Partial<TicketItem>) => void
  onClose: () => void
}) {
  const total = itemLineTotal(item)

  const setMode = (mode: AssignmentMode) => {
    if (mode === 'single') {
      // Si solo hay uno asignado, mantener; si no, vaciar
      const first = item.assignments[0]
      onChange({
        mode,
        assignments: first ? [{ personId: first.personId, weight: 1 }] : [],
      })
    } else if (mode === 'shared') {
      // Todos los actualmente asignados pasan a peso 1 (se reparten a partes iguales)
      const current = item.assignments.length > 0 ? item.assignments : []
      onChange({
        mode,
        assignments: current.map((a) => ({ ...a, weight: 1 })),
      })
    } else {
      onChange({ mode })
    }
  }

  const togglePerson = (personId: ID) => {
    const exists = item.assignments.find((a) => a.personId === personId)
    if (exists) {
      // Quitar
      const next = item.assignments.filter((a) => a.personId !== personId)
      onChange({ assignments: next })
    } else {
      // Añadir
      if (item.mode === 'single') {
        onChange({
          assignments: [{ personId, weight: 1 }],
        })
      } else {
        // shared / weighted: añadir con peso 1
        onChange({
          assignments: [...item.assignments, { personId, weight: 1 }],
        })
      }
    }
  }

  const setWeight = (personId: ID, weight: number) => {
    onChange({
      assignments: item.assignments.map((a) =>
        a.personId === personId ? { ...a, weight: Math.max(0, weight) } : a
      ),
    })
  }

  const distributeEqually = () => {
    if (item.assignments.length === 0) return
    const equal = 1 / item.assignments.length
    onChange({
      assignments: item.assignments.map((a) => ({
        ...a,
        weight: equal,
      })),
    })
  }

  const totalWeight = item.assignments.reduce((s, a) => s + a.weight, 0)

  return (
    <div className="px-4 pb-6 space-y-4">
      {/* Modo de asignación */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Modo de reparto
        </p>
        <div className="grid grid-cols-3 gap-2">
          <ModeButton
            active={item.mode === 'single'}
            onClick={() => setMode('single')}
            icon={User}
            label="1 persona"
          />
          <ModeButton
            active={item.mode === 'shared'}
            onClick={() => setMode('shared')}
            icon={Divide}
            label="Igual"
          />
          <ModeButton
            active={item.mode === 'weighted'}
            onClick={() => setMode('weighted')}
            icon={Scale}
            label="Pesos"
          />
        </div>
      </div>

      {/* Asignación rápida por grupo */}
      {groups.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Asignar por grupo
          </p>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {groups.map((g) => {
              // Solo mostrar grupos que tengan miembros que sean participantes
              const groupParticipants = g.memberIds.filter((id) =>
                participants.some((p) => p.id === id)
              )
              if (groupParticipants.length === 0) return null
              // Comprobar si todos los miembros del grupo ya están asignados
              const allAssigned = groupParticipants.every((pid) =>
                item.assignments.some((a) => a.personId === pid)
              )
              return (
                <button
                  key={g.id}
                  onClick={() => {
                    if (allAssigned) {
                      // Quitar todos los del grupo
                      const next = item.assignments.filter(
                        (a) => !groupParticipants.includes(a.personId)
                      )
                      onChange({ assignments: next })
                    } else {
                      // Añadir todos los del grupo que no estén ya
                      const existing = item.assignments.map((a) => a.personId)
                      const toAdd = groupParticipants
                        .filter((pid) => !existing.includes(pid))
                        .map((pid) => ({ personId: pid, weight: 1 }))
                      onChange({
                        assignments: [...item.assignments, ...toAdd],
                      })
                    }
                  }}
                  className={cn(
                    'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                    allAssigned
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-accent text-accent-foreground border-border hover:bg-accent/80'
                  )}
                >
                  {allAssigned ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Folder className="h-3 w-3" style={{ color: g.color }} />
                  )}
                  {g.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Participantes */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Personas
        </p>
        <div className="space-y-1.5">
          {participants.map((p) => {
            const assign = item.assignments.find((a) => a.personId === p.id)
            const selected = !!assign
            const share =
              selected && assign && totalWeight > 0
                ? total * (assign.weight / totalWeight)
                : 0
            const pct =
              selected && assign && totalWeight > 0
                ? (assign.weight / totalWeight) * 100
                : 0
            return (
              <div
                key={p.id}
                className={cn(
                  'flex items-center gap-3 p-2.5 rounded-xl border transition-colors',
                  selected
                    ? 'border-primary bg-accent/30'
                    : 'border-border bg-card'
                )}
              >
                <button
                  onClick={() => togglePerson(p.id)}
                  className="flex items-center gap-2 flex-1 min-w-0 text-left"
                >
                  <div
                    className={cn(
                      'h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0',
                      selected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted-foreground/30'
                    )}
                  >
                    {selected && <Check className="h-3.5 w-3.5" />}
                  </div>
                  <Avatar person={p} size="sm" />
                  <span className="font-medium text-foreground truncate">
                    {p.name}
                  </span>
                </button>
                {selected && (
                  <div className="flex items-center gap-2">
                    {item.mode === 'weighted' && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setWeight(p.id, (assign?.weight ?? 1) - 0.5)}
                          className="h-6 w-6 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="0.5"
                          min="0"
                          value={assign?.weight ?? 1}
                          onChange={(e) =>
                            setWeight(p.id, parseFloat(e.target.value) || 0)
                          }
                          className="w-14 h-7 text-center text-sm"
                        />
                        <button
                          onClick={() => setWeight(p.id, (assign?.weight ?? 1) + 0.5)}
                          className="h-6 w-6 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    <div className="text-right w-20 shrink-0">
                      <p className="text-sm font-semibold text-foreground">
                        {formatEUR(share)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {pct.toFixed(0)}%
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Acción: repartir igualmente */}
      {item.mode !== 'single' && item.assignments.length > 1 && (
        <Button
          variant="outline"
          onClick={distributeEqually}
          className="w-full"
        >
          <Divide className="h-4 w-4 mr-2" />
          Repartir igualmente ({item.assignments.length})
        </Button>
      )}

      {/* Resumen del item */}
      <Card className="p-3 bg-accent/30">
        <div className="flex justify-between items-baseline">
          <span className="text-sm text-muted-foreground">Total del item</span>
          <span className="text-lg font-bold text-foreground">
            {formatEUR(total)}
          </span>
        </div>
        <div className="flex justify-between items-baseline mt-1">
          <span className="text-xs text-muted-foreground">Asignado</span>
          <span
            className={cn(
              'text-sm font-semibold',
              Math.abs(totalWeight - 1) < 0.01
                ? 'text-primary'
                : 'text-warning-foreground'
            )}
          >
            {formatEUR(total * Math.min(totalWeight, 1))} ·{' '}
            {(totalWeight * 100).toFixed(0)}%
          </span>
        </div>
      </Card>

      <Button onClick={onClose} className="w-full">
        Hecho
      </Button>
    </div>
  )
}

function ModeButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: typeof User
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 text-xs font-medium transition-colors',
        active
          ? 'border-primary bg-accent/40 text-primary'
          : 'border-border bg-card text-muted-foreground hover:bg-accent/30'
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  )
}