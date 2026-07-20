'use client'

import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/lib/store'
import { AssignmentEditor } from '@/components/ticket/AssignmentEditor'
import { PageHeader } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/button'
import { ChevronRight } from 'lucide-react'
import { useBlocker } from '@/hooks/useBlocker'
import { BLOCKER_CHECKS, BLOCKER_MESSAGES } from '@/lib/wizard-loaders'

export function NewTicketAssignView() {
  const draftTicketId = useAppStore((s) => s.draftTicketId)
  const tickets = useAppStore((s) => s.tickets)
  const navigate = useNavigate()

  const ticket = draftTicketId ? (tickets.find((t) => t.id === draftTicketId) ?? null) : null

  // Blocker: dirty assignments protection
  useBlocker(ticket ? BLOCKER_CHECKS.assign(ticket) : false, BLOCKER_MESSAGES.assign)

  if (!ticket) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="text-muted-foreground">Algo salió mal. Vuelve a empezar.</p>
        <Button onClick={() => navigate('/tickets/new/participants')} className="mt-4">
          Volver a participantes
        </Button>
      </div>
    )
  }

  // Check if all items are assigned
  const allAssigned = ticket.items.every((it) => it.assignments.length > 0)

  return (
    <div className="px-4 pt-4">
      <PageHeader
        title="Asignar items"
        subtitle="Reparte cada item entre las personas"
        back={() => navigate('/tickets/new/participants')}
      />

      <AssignmentEditor ticket={ticket} />

      <div className="sticky bottom-20 left-0 right-0 mt-6 -mx-4 px-4 pt-3 pb-1 bg-gradient-to-t from-background via-background to-transparent">
        <Button
          onClick={() => navigate('/tickets/new/summary')}
          disabled={!allAssigned}
          className="w-full"
          size="lg"
        >
          Ver resumen <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
        {!allAssigned && (
          <p className="text-xs text-warning-foreground text-center mt-2">Asigna todos los items antes de continuar</p>
        )}
      </div>
    </div>
  )
}