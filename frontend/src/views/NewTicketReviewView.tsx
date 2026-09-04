'use client'

import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/lib/store'
import { PageHeader } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { TicketItemsEditor } from '@/components/ticket/TicketItemsEditor'
import { ScanSuccessBanner } from '@/components/ticket/TicketItemsEditor'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function NewTicketReviewView() {
  const draftTicketId = useAppStore((s) => s.draftTicketId)
  const tickets = useAppStore((s) => s.tickets)
  const updateTicket = useAppStore((s) => s.updateTicket)
  const navigate = useNavigate()

  const ticket = draftTicketId ? (tickets.find((t) => t.id === draftTicketId) ?? null) : null

  const handleTitleChange = (val: string) => {
    if (draftTicketId) updateTicket(draftTicketId, { title: val })
  }

  const handleContinue = () => {
    if (!ticket || ticket.items.length === 0) return
    navigate('/tickets/new/participants')
  }

  if (!ticket) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="text-muted-foreground">Algo salió mal. Vuelve a empezar.</p>
        <Button onClick={() => navigate('/tickets/new/capture')} className="mt-4">
          Volver a captura
        </Button>
      </div>
    )
  }

  return (
    <div className="px-4 pt-4 pb-28">
      <PageHeader
        title="Revisar ticket"
        subtitle="Confirma los items y los impuestos"
        back={() => navigate('/tickets/new/capture')}
      />

      {/* Scan success banner */}
      {ticket.items.length > 0 && (
        <div className="mb-4">
          <ScanSuccessBanner itemCount={ticket.items.length} />
        </div>
      )}

      {/* Ticket image preview */}
      {ticket.image && (
        <details className="mb-4">
          <summary className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer">
            <ChevronLeft className="h-3.5 w-3.5" />
            Ver imagen del ticket
          </summary>
          <div className="mt-2 rounded-xl overflow-hidden border border-border">
            <img
              src={ticket.image}
              alt="Ticket"
              className="w-full max-h-64 object-contain bg-black/5"
            />
          </div>
        </details>
      )}

      {/* Title input */}
      <Card className="p-3 mb-4">
        <Input
          aria-label="Título del ticket"
          defaultValue={ticket.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Título del ticket (ej. Cena cumpleaños)"
          className="border-0 px-0 focus-visible:ring-0 font-medium"
        />
      </Card>

      {/* Items editor */}
      <TicketItemsEditor ticket={ticket} />

      {/* Continue button */}
      <div className="sticky bottom-20 left-0 right-0 mt-6 -mx-4 px-4 pt-3 pb-1 bg-gradient-to-t from-background via-background to-transparent">
        <Button
          onClick={handleContinue}
          disabled={ticket.items.length === 0}
          className="w-full"
          size="lg"
        >
          Continuar <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
        {ticket.items.length === 0 && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Añade al menos un item para continuar
          </p>
        )}
      </div>
    </div>
  )
}