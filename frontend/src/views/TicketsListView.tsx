'use client'

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/lib/store'
import { formatEUR, formatDate, computeShares, calcTicketTotal } from '@/lib/calc'
import { EmptyState, PageHeader } from '@/components/ui/EmptyState'
import { AvatarStack } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Receipt, TrendingUp, ChevronRight, CheckCircle2, Search, Filter, X } from 'lucide-react'

export function TicketsListView() {
  const tickets = useAppStore((s) => s.tickets)
  const people = useAppStore((s) => s.people)
  const navigate = useNavigate()

  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState<'all' | 'month' | 'year'>('all')

  /**
   * Per spec FR-007: navigate to `/tickets/new` parent route.
   * The parent loader creates a draft ticket if needed and redirects to /capture.
   */
  const handleNewTicket = () => {
    navigate('/tickets/new')
  }

  const handleOpenTicket = (id: string) => {
    navigate(`/tickets/${id}`)
  }

  const filteredTickets = useMemo(() => {
    let result = [...tickets].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter((ticket) =>
        (ticket.title?.toLowerCase().includes(query) ?? false) ||
        (ticket.merchant?.toLowerCase().includes(query) ?? false) ||
        ticket.items.some((item) => item.name.toLowerCase().includes(query))
      )
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date()
      result = result.filter((ticket) => {
        const d = new Date(ticket.date)
        if (dateFilter === 'month') {
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
        }
        if (dateFilter === 'year') {
          return d.getFullYear() === now.getFullYear()
        }
        return true
      })
    }

    return result
  }, [tickets, searchQuery, dateFilter])

  const totalThisMonth = tickets
    .filter((t) => {
      const d = new Date(t.date)
      const now = new Date()
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    .reduce((s, t) => s + calcTicketTotal(t), 0)

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="flex items-center justify-between mb-4">
        <PageHeader title="Tickets" subtitle={`${filteredTickets.length} de ${tickets.length} tickets`} />
        <Button
          size="sm"
          variant="secondary"
          onClick={handleNewTicket}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Nuevo
        </Button>
      </div>

      {/* Search and filter bar */}
      <div className="space-y-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, comercio o items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as 'all' | 'month' | 'year')}
            className="flex-1 px-3 py-2 bg-background border border-input rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">Todos</option>
            <option value="month">Este mes</option>
            <option value="year">Este año</option>
          </select>
        </div>
      </div>

      {/* Stats row (only show when not filtered) */}
      {!searchQuery && dateFilter === 'all' && (
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
      )}

      {/* Tickets list */}
      {filteredTickets.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={searchQuery || dateFilter !== 'all' ? 'No se encontraron tickets' : 'Aún no tienes tickets'}
          description={
            searchQuery || dateFilter !== 'all'
              ? 'Prueba a cambiar los filtros o la búsqueda.'
              : 'Escanea tu primer ticket de restaurante para empezar a dividirlo entre tus contactos.'
          }
          action={
            searchQuery || dateFilter !== 'all'
              ? undefined
              : {
                  label: 'Crear primer ticket',
                  onClick: handleNewTicket,
                }
          }
          className="py-12"
        />
      ) : (
        <div className="space-y-2.5">
          {filteredTickets.map((ticket) => {
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
    </div>
  )
}