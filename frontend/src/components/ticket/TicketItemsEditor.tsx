import { useAppStore } from '@/lib/store'
import {
  formatEUR,
  itemLineTotal,
  calcItemsTotal,
  calcDiscountsTotal,
} from '@/lib/calc'
import type { Ticket, TicketItem, TicketDiscount } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  Trash2,
  GripVertical,
  Camera,
  Loader2,
  Sparkles,
  AlertCircle,
  Tag,
  Minus,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface TicketItemsEditorProps {
  ticket: Ticket
}

export function TicketItemsEditor({ ticket }: TicketItemsEditorProps) {
  const updateTicketItem = useAppStore((s) => s.updateTicketItem)
  const addTicketItem = useAppStore((s) => s.addTicketItem)
  const deleteTicketItem = useAppStore((s) => s.deleteTicketItem)
  const addTicketDiscount = useAppStore((s) => s.addTicketDiscount)
  const updateTicketDiscount = useAppStore((s) => s.updateTicketDiscount)
  const deleteTicketDiscount = useAppStore((s) => s.deleteTicketDiscount)
  const recalcTicket = useAppStore((s) => s.recalcTicket)
  const updateTicket = useAppStore((s) => s.updateTicket)

  const handleItemChange = (itemId: string, patch: Partial<TicketItem>) => {
    updateTicketItem(ticket.id, itemId, patch)
    recalcTicket(ticket.id)
  }

  const handleAddItem = () => {
    addTicketItem(ticket.id, {
      name: '',
      quantity: 1,
      unitPrice: 0,
      mode: 'single',
      assignments: [],
    })
  }

  const handleDeleteItem = (itemId: string) => {
    deleteTicketItem(ticket.id, itemId)
    recalcTicket(ticket.id)
  }

  const handleTaxModeChange = (included: boolean) => {
    updateTicket(ticket.id, {
      taxMode: included ? 'included' : 'added',
    })
    recalcTicket(ticket.id)
  }

  const handleTaxRateChange = (rate: number) => {
    updateTicket(ticket.id, { taxRate: rate })
    recalcTicket(ticket.id)
  }

  const handleTipModeChange = (mode: 'none' | 'fixed' | 'percentage') => {
    updateTicket(ticket.id, { tipMode: mode })
    recalcTicket(ticket.id)
  }

  const handleTipValueChange = (value: number) => {
    if (ticket.tipMode === 'percentage') {
      updateTicket(ticket.id, { tipPercentage: value })
    } else if (ticket.tipMode === 'fixed') {
      updateTicket(ticket.id, { tipAmount: value })
    }
    recalcTicket(ticket.id)
  }

  const handleAddDiscount = () => {
    addTicketDiscount(ticket.id, {
      name: 'Descuento',
      mode: 'amount',
      amount: 0,
    })
  }

  const handleDiscountChange = (discountId: string, patch: Partial<TicketDiscount>) => {
    updateTicketDiscount(ticket.id, discountId, patch)
    recalcTicket(ticket.id)
  }

  const handleDeleteDiscount = (discountId: string) => {
    deleteTicketDiscount(ticket.id, discountId)
    recalcTicket(ticket.id)
  }

  const itemsTotal = calcItemsTotal(ticket.items)
  const discountsTotal = calcDiscountsTotal(ticket)
  const subtotal = ticket.subtotal
  const tipValue =
    ticket.tipMode === 'percentage'
      ? ticket.tipPercentage ?? 0
      : ticket.tipAmount

  return (
    <div className="space-y-4">
      {/* Items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-foreground">
            Items del ticket
          </h3>
          <span className="text-xs text-muted-foreground">
            {ticket.items.length}{' '}
            {ticket.items.length === 1 ? 'línea' : 'líneas'}
          </span>
        </div>

        {ticket.items.length === 0 ? (
          <Card className="p-6 border-dashed border-2 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              No hay items todavía. Añade las líneas del ticket manualmente.
            </p>
            <Button size="sm" variant="outline" onClick={handleAddItem}>
              <Plus className="h-4 w-4 mr-1.5" />
              Añadir item
            </Button>
          </Card>
        ) : (
          <div className="space-y-2">
            {ticket.items.map((item, idx) => (
              <ItemRow
                key={item.id}
                item={item}
                index={idx}
                onChange={(patch) => handleItemChange(item.id, patch)}
                onDelete={() => handleDeleteItem(item.id)}
              />
            ))}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleAddItem}
              className="w-full border border-dashed border-border"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Añadir item
            </Button>
          </div>
        )}
      </div>

      {/* IVA */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">IVA</Label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Incluido</span>
            <Switch
              checked={ticket.taxMode === 'included'}
              onCheckedChange={handleTaxModeChange}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Tasa</Label>
            <Select
              value={String(ticket.taxRate)}
              onValueChange={(v) => handleTaxRateChange(Number(v))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0% (sin IVA)</SelectItem>
                <SelectItem value="0.04">4% (superreducido)</SelectItem>
                <SelectItem value="0.1">10% (reducido)</SelectItem>
                <SelectItem value="0.21">21% (general)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">
              Importe IVA
            </Label>
            <div className="mt-1 px-3 py-2 rounded-md bg-muted text-sm font-medium">
              {formatEUR(ticket.taxAmount)}
            </div>
          </div>
        </div>
      </Card>

      {/* Propina */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Propina</Label>
          <Select
            value={ticket.tipMode}
            onValueChange={(v) =>
              handleTipModeChange(v as 'none' | 'fixed' | 'percentage')
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin propina</SelectItem>
              <SelectItem value="percentage">Porcentaje</SelectItem>
              <SelectItem value="fixed">Importe fijo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {ticket.tipMode !== 'none' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">
                {ticket.tipMode === 'percentage' ? 'Porcentaje (%)' : 'Importe (€)'}
              </Label>
              <Input
                type="number"
                inputMode="decimal"
                step={ticket.tipMode === 'percentage' ? '1' : '0.5'}
                min="0"
                value={tipValue}
                onChange={(e) =>
                  handleTipValueChange(parseFloat(e.target.value) || 0)
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                Importe propina
              </Label>
              <div className="mt-1 px-3 py-2 rounded-md bg-muted text-sm font-medium">
                {formatEUR(ticket.tipAmount)}
              </div>
            </div>
          </div>
        )}
        {ticket.tipMode === 'percentage' && (
          <div className="flex gap-2 flex-wrap">
            {[0, 5, 10, 15].map((p) => (
              <Button
                key={p}
                size="sm"
                variant={tipValue === p ? 'default' : 'outline'}
                onClick={() => handleTipValueChange(p)}
                className="h-7 px-2.5 text-xs"
              >
                {p}%
              </Button>
            ))}
          </div>
        )}
      </Card>

      {/* Descuentos */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold flex items-center gap-1.5">
            <Tag className="h-4 w-4 text-primary" />
            Descuentos
          </Label>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleAddDiscount}
            className="h-7 text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Añadir
          </Button>
        </div>
        {(!ticket.discounts || ticket.discounts.length === 0) ? (
          <p className="text-xs text-muted-foreground italic">
            Sin descuentos. Añade cupones, ofertas o promociones del ticket.
          </p>
        ) : (
          <div className="space-y-2">
            {ticket.discounts.map((discount) => {
              const isPercentage = discount.mode === 'percentage'
              const effectiveAmount = isPercentage
                ? itemsTotal * ((discount.percentage || 0) / 100)
                : discount.amount
              return (
                <div
                  key={discount.id}
                  className="p-2.5 rounded-md bg-emerald-50/40 border border-emerald-200/50 space-y-2"
                >
                  <div className="flex gap-2 items-center">
                    <Minus className="h-4 w-4 text-emerald-600 shrink-0" />
                    <Input
                      value={discount.name}
                      onChange={(e) =>
                        handleDiscountChange(discount.id, { name: e.target.value })
                      }
                      placeholder="Descuento (ej. Cupón 10%)"
                      className="border-0 px-0 h-7 focus-visible:ring-0 text-sm flex-1"
                    />
                    <div className="flex items-center gap-1 p-0.5 bg-background rounded-md border border-border">
                      <button
                        onClick={() =>
                          handleDiscountChange(discount.id, { mode: 'amount' })
                        }
                        className={cn(
                          'px-2 py-0.5 rounded text-xs font-medium transition-colors',
                          !isPercentage
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground'
                        )}
                      >
                        €
                      </button>
                      <button
                        onClick={() =>
                          handleDiscountChange(discount.id, { mode: 'percentage' })
                        }
                        className={cn(
                          'px-2 py-0.5 rounded text-xs font-medium transition-colors',
                          isPercentage
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground'
                        )}
                      >
                        %
                      </button>
                    </div>
                    <div className="relative w-24">
                      <Input
                        type="number"
                        inputMode="decimal"
                        step={isPercentage ? '1' : '0.5'}
                        min="0"
                        value={
                          isPercentage
                            ? discount.percentage ?? 0
                            : discount.amount
                        }
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0
                          if (isPercentage) {
                            handleDiscountChange(discount.id, { percentage: val })
                          } else {
                            handleDiscountChange(discount.id, { amount: val })
                          }
                        }}
                        className="pr-7 h-8 text-sm text-right"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                        {isPercentage ? '%' : '€'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteDiscount(discount.id)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      aria-label="Eliminar descuento"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {isPercentage && (
                    <div className="flex justify-between text-xs pl-6">
                      <span className="text-muted-foreground">
                        Equivale a
                      </span>
                      <span className="font-medium text-emerald-600">
                        −{formatEUR(effectiveAmount)}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
        {discountsTotal > 0 && (
          <div className="flex justify-between text-sm pt-1 border-t border-border">
            <span className="text-emerald-600 font-medium">
              Total descuentos
            </span>
            <span className="font-semibold text-emerald-600">
              −{formatEUR(discountsTotal)}
            </span>
          </div>
        )}
      </Card>

      {/* Resumen */}
      <Card className="p-4 bg-accent/30 border-primary/20">
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Items</span>
            <span className="font-medium text-foreground">
              {formatEUR(itemsTotal)}
            </span>
          </div>
          {discountsTotal > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Descuentos</span>
              <span className="font-medium">
                −{formatEUR(discountsTotal)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-muted-foreground border-t border-border pt-1.5">
            <span>Subtotal</span>
            <span className="font-medium text-foreground">
              {formatEUR(subtotal)}
            </span>
          </div>
          {ticket.taxMode === 'added' && (
            <div className="flex justify-between text-muted-foreground">
              <span>
                IVA ({Math.round(ticket.taxRate * 100)}%)
              </span>
              <span className="font-medium text-foreground">
                {formatEUR(ticket.taxAmount)}
              </span>
            </div>
          )}
          {ticket.tipMode !== 'none' && ticket.tipAmount > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Propina</span>
              <span className="font-medium text-foreground">
                {formatEUR(ticket.tipAmount)}
              </span>
            </div>
          )}
          <div className="border-t border-border pt-1.5 mt-1.5 flex justify-between items-baseline">
            <span className="font-semibold text-foreground">Total</span>
            <span className="text-xl font-bold text-primary">
              {formatEUR(
                subtotal +
                  (ticket.taxMode === 'added' ? ticket.taxAmount : 0) +
                  ticket.tipAmount
              )}
            </span>
          </div>
        </div>
      </Card>
    </div>
  )
}

function ItemRow({
  item,
  index,
  onChange,
  onDelete,
}: {
  item: TicketItem
  index: number
  onChange: (patch: Partial<TicketItem>) => void
  onDelete: () => void
}) {
  return (
    <Card className="p-3">
      <div className="flex gap-2 items-start">
        <div className="pt-2 text-muted-foreground/50">
          <GripVertical className="h-4 w-4" />
        </div>
        <div className="flex-1 space-y-2">
          <Input
            value={item.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder={`Item ${index + 1}`}
            className="border-0 px-0 h-7 focus-visible:ring-0 font-medium text-sm"
          />
          <div className="flex gap-2 items-center">
            <div className="flex items-center gap-1">
              <Input
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                value={item.quantity}
                onChange={(e) =>
                  onChange({ quantity: parseInt(e.target.value) || 1 })
                }
                className="w-14 h-8 text-center text-sm"
              />
              <span className="text-xs text-muted-foreground">×</span>
            </div>
            <div className="flex-1 relative">
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={item.unitPrice}
                onChange={(e) =>
                  onChange({ unitPrice: parseFloat(e.target.value) || 0 })
                }
                className="pr-7 h-8 text-sm text-right"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                €
              </span>
            </div>
            <div className="text-right w-20">
              <p className="text-sm font-semibold">
                {formatEUR(itemLineTotal(item))}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          aria-label="Eliminar item"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </Card>
  )
}

export function ScanningOverlay({ imageUrl }: { imageUrl?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center min-h-[60vh]">
      {imageUrl && (
        <div className="relative w-40 h-40 mb-6 rounded-2xl overflow-hidden border-2 border-primary/30">
          <img
            src={imageUrl}
            alt="Ticket escaneado"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-primary/10 animate-pulse" />
          <div
            className="absolute inset-x-0 h-0.5 bg-primary shadow-[0_0_8px_2px_var(--primary)]"
            style={{
              animation: 'scanline 1.6s ease-in-out infinite',
            }}
          />
        </div>
      )}
      <style>{`
        @keyframes scanline {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
      `}</style>
      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">
        Escaneando ticket…
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        La IA está leyendo los items, precios e impuestos. Esto puede tardar
        unos segundos.
      </p>
    </div>
  )
}

export function ScanErrorBanner({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <Card className="p-4 border-amber-300 bg-amber-50">
      <div className="flex gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-900 mb-1">
            No se pudo escanear el ticket
          </p>
          <p className="text-xs text-amber-700 mb-2">{message}</p>
          <Button size="sm" variant="outline" onClick={onRetry}>
            <Camera className="h-4 w-4 mr-1.5" />
            Reintentar
          </Button>
        </div>
      </div>
    </Card>
  )
}

export function ScanSuccessBanner({ itemCount }: { itemCount: number }) {
  return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 text-primary text-sm font-medium">
      <Sparkles className="h-4 w-4" />
      <span>
        Se detectaron {itemCount} {itemCount === 1 ? 'item' : 'items'} del
        ticket. Revisa y ajusta si es necesario.
      </span>
    </div>
  )
}
