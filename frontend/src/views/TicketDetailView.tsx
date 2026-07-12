import { useAppStore } from '@/lib/store'
import { TicketSummary } from '@/components/ticket/TicketSummary'
import { TicketItemsEditor } from '@/components/ticket/TicketItemsEditor'
import { AssignmentEditor } from '@/components/ticket/AssignmentEditor'
import { PeopleGroupsManager } from '@/components/people/PeopleGroupsManager'
import { PageHeader, EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { Receipt, Pencil, ListChecks, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

type DetailTab = 'summary' | 'items' | 'participants' | 'assign'

export function TicketDetailView() {
  const ticketId = useAppStore((s) => s.activeTicketId)
  const ticket = useAppStore((s) =>
    s.tickets.find((t) => t.id === ticketId)
  )
  const updateTicket = useAppStore((s) => s.updateTicket)
  const setView = useAppStore((s) => s.setView)
  const [tab, setTab] = useState<DetailTab>('summary')
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(ticket?.title ?? '')

  if (!ticket) {
    return (
      <div className="px-4 pt-6">
        <EmptyState
          icon={Receipt}
          title="Ticket no encontrado"
          description="Puede que se haya eliminado."
          action={{ label: 'Volver al inicio', onClick: () => setView('home') }}
        />
      </div>
    )
  }

  const TABS: { id: DetailTab; label: string; icon: typeof Receipt }[] = [
    { id: 'summary', label: 'Resumen', icon: Receipt },
    { id: 'items', label: 'Items', icon: Pencil },
    { id: 'participants', label: 'Personas', icon: Users },
    { id: 'assign', label: 'Asignar', icon: ListChecks },
  ]

  const saveTitle = () => {
    updateTicket(ticket.id, { title: titleDraft.trim() || 'Ticket' })
    setEditingTitle(false)
  }

  return (
    <div className="px-4 pt-4">
      <PageHeader
        title={editingTitle ? '' : ticket.title || 'Ticket'}
        subtitle=""
        back={() => setView('home')}
        action={
          !editingTitle ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setTitleDraft(ticket.title)
                setEditingTitle(true)
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          ) : null
        }
      />

      {editingTitle && (
        <div className="flex gap-2 mb-4">
          <input
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            autoFocus
            className="flex-1 px-3 py-2 rounded-md border border-border bg-background text-foreground"
            placeholder="Título del ticket"
          />
          <Button size="sm" onClick={saveTitle}>
            Guardar
          </Button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 p-1 bg-muted rounded-lg">
        {TABS.map((t) => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex-1 flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-md text-[11px] font-medium transition-colors',
                active
                  ? 'bg-background text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Contenido del tab */}
      {tab === 'summary' && (
        <TicketSummary
          ticket={ticket}
          onEdit={() => setTab('assign')}
          showActions
        />
      )}
      {tab === 'items' && <TicketItemsEditor ticket={ticket} />}
      {tab === 'participants' && (
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
      )}
      {tab === 'assign' && <AssignmentEditor ticket={ticket} />}
    </div>
  )
}
