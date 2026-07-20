'use client'

import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/lib/store'
import { formatEUR, formatDate, computeShares, calcTicketTotal } from '@/lib/calc'
import { EmptyState, PageHeader } from '@/components/ui/EmptyState'
import { Avatar, AvatarStack } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Receipt, ScanLine, TrendingUp, ChevronRight, CheckCircle2 } from 'lucide-react'

export function HomeView() {
  const tickets = useAppStore((s) => s.tickets)
  const people = useAppStore((s) => s.people)
  const navigate = useNavigate()

  /**
   * Spec FR-007: User starts new ticket at `/tickets/new`.
   * Navigate to the parent route; the parent loader ensures a draft exists
   * and redirects to the appropriate step.
   */
  const handleNewTicket = () => {
    navigate('/tickets/new')
  }

  const handleOpenTicket = (id: string) => {
    navigate(`/tickets/${id}`)
  }

  const recentTickets = tickets.slice(0, 5)

  // Stats
  const totalThisMonth = tickets
    .filter((t) => {
      const d = new Date(t.date)
      const now = new Date()
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    .reduce((s, t) => s + calcTicketTotal(t), 0)

  return (
    <div className="px-4 pt-6">
      <PageHeader title="Cuadra" subtitle="Tus tickets y cuentas compartidas" />

      {/* Hero / CTA */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary to-emerald-600 text-primary-foreground p-5 mb-5 shadow-lg shadow-primary/20">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
        <div className="absolute -right-12 -bottom-12 h-40 w-40 rounded-full bg-white/5" />
        <div className="relative">
          <p className="text-sm text-primary-foreground/80 font-medium mb-1">
            Escanea y divide
          </p>
          <h2 className="text-xl font-bold mb-3 leading-tight">
            ¿Vais a repartir la cuenta?
          </h2>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleNewTicket}
              className="bg-white text-primary hover:bg-white/90 font-semibold"
            >
              <ScanLine className="h-4 w-4 mr-1.5" />
              Escanear ticket
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleNewTicket}
              className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Manual
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Este mes
            </span>
          </div>
          <p className="text-xl font-bold text-foreground">
            {formatEUR(totalThisMonth)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {tickets.filter((t) => {
              const d = new Date(t.date)
              const now = new Date()
              return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
            }).length}{' '}
            tickets
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Receipt className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total
            </span>
          </div>
          <p className="text-xl font-bold text-foreground">
            {tickets.length}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            tickets guardados
          </p>
        </Card>
      </div>

      {/* Recent tickets */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-foreground">
          Tickets recientes
        </h2>
        {tickets.length > 0 && (
          <button
            onClick={() => navigate('/tickets')}
            className="text-xs font-medium text-primary"
          >
            Ver todo
          </button>
        )}
      </div>

      {recentTickets.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Aún no tienes tickets"
          description="Escanea tu primer ticket de restaurante para empezar a dividirlo entre tus contactos."
          action={{
            label: 'Crear primer ticket',
            onClick: handleNewTicket,
          }}
          className="py-8"
        />
      ) : (
        <div className="space-y-2.5">
          {recentTickets.map((ticket) => {
            const total = calcTicketTotal(ticket)
            const participants = ticket.participantIds
              .map((id) => people.find((p) => p.id === id))
              .filter(Boolean) as typeof people
            const shares = computeShares(ticket)
            const maxShare = shares.reduce(
              (max, s) => (s.total > max ? s.total : max),
              0
            )
            const cuadrado = Math.abs(
              shares.reduce((sum, s) => sum + s.total, 0) - total
            ) < 0.01 && ticket.items.length > 0

            return (
              <button
                key={ticket.id}
                onClick={() => handleOpenTicket(ticket.id)}
                className="w-full text-left"
              >
                <Card className="p-4 hover:bg-accent/40 transition-colors active:scale-[0.99]">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground truncate">
                          {ticket.title || ticket.merchant || 'Ticket'}
                        </h3>
                        {cuadrado && (
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(ticket.date)} · {ticket.items.length} items
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-foreground">
                        {formatEUR(total)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    {participants.length > 0 ? (
                      <>
                        <AvatarStack people={participants} max={4} size="xs" />
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span>{participants.length} personas</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        Sin asignar
                      </p>
                    )}
                  </div>
                  {/* Barra visual del reparto */}
                  {participants.length > 0 && maxShare > 0 && (
                    <div className="flex h-1.5 w-full rounded-full overflow-hidden mt-3 bg-muted">
                      {shares.map((share) => {
                        const person = people.find((p) => p.id === share.personId)
                        return (
                          <div
                            key={share.personId}
                            style={{
                              backgroundColor: person?.color ?? '#94a3b8',
                              width: `${(share.total / total) * 100}%`,
                            }}
                          />
                        )
                      })}
                    </div>
                  )}
                </Card>
              </button>
            )
          })}
        </div>
      )}

      {people.length === 0 && tickets.length === 0 && (
        <Card className="mt-6 p-4 border-dashed border-2 border-border bg-accent/30">
          <p className="text-sm text-muted-foreground text-center">
            Consejo: añade tus contactos desde la pestaña{' '}
            <strong className="text-foreground">Contactos</strong> para dividir
            tickets mas rápido.
          </p>
        </Card>
      )}
    </div>
  )
}