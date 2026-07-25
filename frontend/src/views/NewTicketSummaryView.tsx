'use client'

import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/lib/store'
import { TicketSummary } from '@/components/ticket/TicketSummary'
import { PageHeader } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function NewTicketSummaryView() {
  const draftTicketId = useAppStore((s) => s.draftTicketId)
  const tickets = useAppStore((s) => s.tickets)
  const updateTicket = useAppStore((s) => s.updateTicket)
  const clearDraftTicketId = useAppStore((s) => s.clearDraftTicketId)
  const navigate = useNavigate()

  const ticket = draftTicketId ? (tickets.find((t) => t.id === draftTicketId) ?? null) : null

  if (!ticket) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="text-muted-foreground">Algo salió mal. Vuelve a empezar.</p>
        <Button onClick={() => navigate('/tickets/new/assign')} className="mt-4">
          Volver a asignación
        </Button>
      </div>
    )
  }

  const handleClose = () => {
    updateTicket(ticket.id, { status: 'closed' })
    clearDraftTicketId()
    toast.success('Ticket cerrado correctamente')
    navigate('/')
  }

  const handleEdit = () => {
    navigate('/tickets/new/assign')
  }

  return (
    <div className="px-4 pt-4 pb-24">
      <PageHeader
        title="Resumen y cuadre"
        subtitle="Verifica que todo cuadra"
        back={() => navigate('/tickets/new/assign')}
      />

      <TicketSummary
        ticket={ticket}
        onEdit={handleEdit}
        onClose={handleClose}
        showActions={true}
      />
    </div>
  )
}