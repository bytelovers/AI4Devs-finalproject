'use client'

import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/lib/store'
import { ParticipantPicker } from '@/components/ticket/ParticipantPicker'
import { PageHeader } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/button'
import { ChevronRight } from 'lucide-react'

export function NewTicketParticipantsView() {
  const draftTicketId = useAppStore((s) => s.draftTicketId)
  const tickets = useAppStore((s) => s.tickets)
  const updateTicket = useAppStore((s) => s.updateTicket)
  const navigate = useNavigate()

  const ticket = draftTicketId ? (tickets.find((t) => t.id === draftTicketId) ?? null) : null

  if (!ticket) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="text-muted-foreground">Algo salió mal. Vuelve a empezar.</p>
        <Button onClick={() => navigate('/tickets/new/review')} className="mt-4">
          Volver a revisión
        </Button>
      </div>
    )
  }

  const handleToggle = (id: string) => {
    const exists = ticket.participantIds.includes(id)
    updateTicket(ticket.id, {
      participantIds: exists
        ? ticket.participantIds.filter((p) => p !== id)
        : [...ticket.participantIds, id],
    })
  }

  const handleAdd = (ids: string[]) => {
    const merged = Array.from(new Set([...ticket.participantIds, ...ids]))
    updateTicket(ticket.id, { participantIds: merged })
  }

  return (
    <div className="px-4 pt-4">
      <PageHeader
        title="Participantes"
        subtitle="¿Quién participa en esta cuenta?"
        back={() => navigate('/tickets/new/review')}
      />

      <ParticipantPicker
        selectedIds={ticket.participantIds}
        onToggle={handleToggle}
        onAdd={handleAdd}
      />

      <div className="sticky bottom-20 left-0 right-0 mt-6 -mx-4 px-4 pt-3 pb-1 bg-gradient-to-t from-background via-background to-transparent">
        <Button
          onClick={() => navigate('/tickets/new/assign')}
          disabled={ticket.participantIds.length === 0}
          className="w-full"
          size="lg"
        >
          Continuar <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
        {ticket.participantIds.length === 0 && (
          <p className="text-xs text-muted-foreground text-center mt-2">Selecciona al menos una persona</p>
        )}
      </div>
    </div>
  )
}