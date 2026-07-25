'use client'

import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/lib/store'
import {
  formatEUR,
  formatDate,
  computeShares,
  verifyCuadre,
  calcTicketTotal,
  itemsFullyAssigned,
  calcTaxAmount,
} from '@/lib/calc'
import type { Ticket } from '@/lib/types'
import { Avatar } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  CheckCircle2,
  AlertTriangle,
  Share2,
  Download,
  RotateCcw,
  Trash2,
  Receipt,
  Calculator,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TicketSummaryProps {
  ticket: Ticket
  onEdit?: () => void
  onClose?: () => void
  showActions?: boolean
}

export function TicketSummary({
  ticket,
  onEdit,
  onClose,
  showActions = true,
}: TicketSummaryProps) {
  const people = useAppStore((s) => s.people)
  const deleteTicket = useAppStore((s) => s.deleteTicket)
  const updateTicket = useAppStore((s) => s.updateTicket)
  const navigate = useNavigate()

  const shares = computeShares(ticket)
  const cuadre = verifyCuadre(ticket)
  const itemsStatus = itemsFullyAssigned(ticket)
  const total = calcTicketTotal(ticket)
  const taxIncluded = ticket.taxMode === 'included'
  const baseImponible = taxIncluded ? total - ticket.taxAmount - ticket.tipAmount : total - ticket.taxAmount - ticket.tipAmount

  const handleClose = () => {
    updateTicket(ticket.id, { status: 'closed' })
    onClose?.()
    navigate('/')
  }

  const handleDelete = () => {
    deleteTicket(ticket.id)
    navigate('/')
  }

  const handleShare = async () => {
    const lines: string[] = []
    lines.push(`*${ticket.title || ticket.merchant || 'Ticket'}*`)
    lines.push(`${formatDate(ticket.date)} · ${ticket.items.length} items`)
    lines.push(`Total: ${formatEUR(total)}`)
    lines.push('')
    lines.push('*Reparto:*')
    for (const share of shares) {
      const p = people.find((x) => x.id === share.personId)
      if (!p) continue
      lines.push(`• ${p.name}: ${formatEUR(share.total)}`)
    }
    const text = lines.join('\n')
    if (navigator.share) {
      try {
        await navigator.share({ text })
      } catch {
        // cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(text)
        alert('Reparto copiado al portapapeles')
      } catch {
        // ignore
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <Card className="p-5 bg-gradient-to-br from-primary to-emerald-600 text-primary-foreground border-0">
        <div className="flex items-center gap-2 mb-1">
          <Receipt className="h-4 w-4" />
          <span className="text-xs font-medium text-primary-foreground/80 uppercase tracking-wide">
            {ticket.merchant ?? 'Ticket'}
          </span>
        </div>
        <h2 className="text-xl font-bold mb-2">
          {ticket.title || 'Ticket sin título'}
        </h2>
        <p className="text-xs text-primary-foreground/70 mb-3">
          {formatDate(ticket.date)} · {ticket.items.length} items ·{' '}
          {shares.length} personas
        </p>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold">{formatEUR(total)}</span>
          <span className="text-sm text-primary-foreground/80 ml-1">total</span>
        </div>
      </Card>

      {/* Estado del cuadre */}
      <Card
        className={cn(
          'p-4 border-2',
          cuadre.ok && itemsStatus.allAssigned
            ? 'border-primary/40 bg-accent/30'
            : 'border-warning-border bg-warning-bg/60'
        )}
      >
        <div className="flex items-start gap-3">
          {cuadre.ok && itemsStatus.allAssigned ? (
            <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
          ) : (
            <AlertTriangle className="h-6 w-6 text-warning shrink-0" />
          )}
          <div className="flex-1">
            {cuadre.ok && itemsStatus.allAssigned ? (
              <>
                <p className="font-semibold text-foreground">
                  ✓ Ticket cuadrado
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  La suma de las partes de cada persona coincide con el total
                  del ticket.
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold text-warning-foreground">
                  El ticket no cuadra todavía
                </p>
                <ul className="text-xs text-warning-foreground/80 mt-1 space-y-0.5 list-disc list-inside">
                  {!itemsStatus.allAssigned && (
                    <li>
                      Hay {itemsStatus.unassignedItems.length}{' '}
                      {itemsStatus.unassignedItems.length === 1
                        ? 'item sin asignar'
                        : 'items sin asignar'}
                    </li>
                  )}
                  {!cuadre.ok && (
                    <li>
                      Diferencia de {formatEUR(Math.abs(cuadre.diff))} entre la
                      suma de partes y el total
                    </li>
                  )}
                </ul>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Desglose por persona */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-2 px-1">
          Reparto entre {shares.length}{' '}
          {shares.length === 1 ? 'persona' : 'personas'}
        </h3>
        <div className="space-y-2">
          {shares
            .sort((a, b) => b.total - a.total)
            .map((share) => {
              const person = people.find((p) => p.id === share.personId)
              if (!person) return null
              const pct = total > 0 ? (share.total / total) * 100 : 0
              return (
                <Card key={share.personId} className="p-3.5">
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar person={person} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {person.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {pct.toFixed(1)}% del total
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">
                        {formatEUR(share.total)}
                      </p>
                    </div>
                  </div>
                  {/* Barra visual */}
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        backgroundColor: person.color,
                        width: `${pct}%`,
                      }}
                    />
                  </div>
                  {/* Desglose detallado */}
                  <div className="mt-2 pt-2 border-t border-border/60 text-xs space-y-0.5">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Items</span>
                      <span className="font-medium text-foreground">
                        {formatEUR(share.itemsTotal)}
                      </span>
                    </div>
                    {share.taxShare > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>IVA</span>
                        <span className="font-medium text-foreground">
                          {formatEUR(share.taxShare)}
                        </span>
                      </div>
                    )}
                    {share.tipShare > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Propina</span>
                        <span className="font-medium text-foreground">
                          {formatEUR(share.tipShare)}
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
        </div>
      </div>

      {/* Verificación matemática */}
      <Card className="p-4 bg-muted/50">
        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Suma de partes</span>
            <span className="font-medium text-foreground">
              {formatEUR(cuadre.sumShares)}
            </span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Total del ticket</span>
            <span className="font-medium text-foreground">
              {formatEUR(cuadre.ticketTotal)}
            </span>
          </div>
          <div className="flex justify-between border-t border-border pt-1 mt-1">
            <span className="font-semibold text-foreground">Diferencia</span>
            <span
              className={cn(
                'font-bold',
                Math.abs(cuadre.diff) < 0.01
                  ? 'text-primary'
                  : 'text-warning-foreground'
              )}
            >
              {formatEUR(cuadre.diff)}
            </span>
          </div>
        </div>
      </Card>

      {/* Base imponible (cuando IVA incluido) */}
      {taxIncluded && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" />
              <span className="font-semibold text-foreground">Base imponible</span>
            </div>
            <span className="text-lg font-bold text-primary">{formatEUR(baseImponible)}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Importe sin IVA ni propina. IVA ({ticket.taxRate * 100}%) ya incluido en el total.
          </p>
        </Card>
      )}

      {/* Acciones */}
      {showActions && (
        <div className="space-y-2 pt-2">
          {cuadre.ok && itemsStatus.allAssigned ? (
            <Button
              onClick={handleClose}
              className="w-full"
              size="lg"
            >
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Confirmar y cerrar ticket
            </Button>
          ) : (
            <Button
              onClick={onEdit}
              variant="default"
              className="w-full"
              size="lg"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Volver a asignar
            </Button>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Compartir
            </Button>
            <Button
              variant="outline"
              onClick={handleDelete}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}