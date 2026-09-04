import type { Ticket, PersonShare, TicketItem, ItemAssignment } from './types'

/** Formatea un importe en euros. */
export function formatEUR(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0)
}

/** Formatea una fecha corta. */
export function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

/** Formatea fecha y hora. */
export function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

/** Devuelve la cantidad de un item (quantity × unitPrice). */
export function itemLineTotal(item: TicketItem): number {
  return (item.quantity || 0) * (item.unitPrice || 0)
}

/** Calcula el subtotal de un ticket sumando items. */
export function calcSubtotal(items: TicketItem[]): number {
  return items.reduce((sum, it) => sum + itemLineTotal(it), 0)
}

/** Calcula el importe de IVA. */
export function calcTaxAmount(subtotal: number, taxRate: number, taxMode: 'included' | 'added'): number {
  if (taxMode === 'included') {
    // El IVA ya está dentro del subtotal. Importe = subtotal - subtotal/(1+rate)
    if (taxRate <= 0) return 0
    return subtotal - subtotal / (1 + taxRate)
  }
  // Añadido: importe = subtotal * rate
  return subtotal * (taxRate || 0)
}

/** Calcula el importe de propina. */
export function calcTipAmount(
  subtotal: number,
  tipMode: 'fixed' | 'percentage' | 'none',
  tipPercentage: number | undefined,
  tipFixed: number
): number {
  if (tipMode === 'none') return 0
  if (tipMode === 'percentage') return subtotal * ((tipPercentage || 0) / 100)
  return tipFixed || 0
}

/** Calcula el total del ticket (lo que se debe pagar en caja). */
export function calcTicketTotal(ticket: Ticket): number {
  const subtotal = ticket.subtotal
  const tax = ticket.taxMode === 'included' ? 0 : ticket.taxAmount
  return subtotal + tax + ticket.tipAmount
}

/** Calcula la suma de items (sin descuentos). */
export function calcItemsTotal(items: TicketItem[]): number {
  return items.reduce((sum, it) => sum + itemLineTotal(it), 0)
}

/** Calcula el total de descuentos del ticket. */
export function calcDiscountsTotal(ticket: Ticket): number {
  const itemsTotal = calcItemsTotal(ticket.items)
  return (ticket.discounts || []).reduce((s, d) => {
    if (d.mode === 'percentage') {
      return s + itemsTotal * ((d.percentage || 0) / 100)
    }
    return s + (d.amount || 0)
  }, 0)
}

/** Calcula el importe que asume una persona por un item concreto. */
export function personItemShare(item: TicketItem, personId: string): number {
  if (item.assignments.length === 0) return 0
  const personAssign = item.assignments.find((a) => a.personId === personId)
  if (!personAssign) return 0
  const totalWeight = item.assignments.reduce((s, a) => s + a.weight, 0)
  if (totalWeight <= 0) return 0
  return itemLineTotal(item) * (personAssign.weight / totalWeight)
}

/**
 * Calcula el reparto completo de un ticket entre las personas participantes.
 * Devuelve un array con la parte de cada persona (items + IVA + propina).
 */
export function computeShares(ticket: Ticket): PersonShare[] {
  const participants = ticket.participantIds
  if (participants.length === 0) return []

  // 1) Parte bruta de items por persona (sin descuentos)
  const itemsByPerson = new Map<string, number>()
  for (const pid of participants) itemsByPerson.set(pid, 0)
  for (const item of ticket.items) {
    for (const pid of participants) {
      const share = personItemShare(item, pid)
      itemsByPerson.set(pid, (itemsByPerson.get(pid) || 0) + share)
    }
  }

  // 2) Distribuir descuentos proporcionalmente al consumo
  const itemsTotal = calcItemsTotal(ticket.items)
  const discountsTotal = calcDiscountsTotal(ticket)
  const itemsNetByPerson = new Map<string, number>()
  for (const pid of participants) {
    const bruto = itemsByPerson.get(pid) || 0
    const discountShare =
      itemsTotal > 0 ? discountsTotal * (bruto / itemsTotal) : 0
    itemsNetByPerson.set(pid, Math.max(0, bruto - discountShare))
  }

  // 3) Distribución del IVA (sobre el subtotal neto)
  const taxByPerson = new Map<string, number>()
  if (ticket.taxDistribution === 'equal') {
    const per = ticket.taxAmount / participants.length
    for (const pid of participants) taxByPerson.set(pid, per)
  } else {
    const totalNet = Array.from(itemsNetByPerson.values()).reduce((a, b) => a + b, 0) || 1
    for (const pid of participants) {
      taxByPerson.set(pid, ticket.taxAmount * ((itemsNetByPerson.get(pid) || 0) / totalNet))
    }
  }

  // 4) Distribución de propina
  const tipByPerson = new Map<string, number>()
  if (ticket.tipDistribution === 'equal') {
    const per = ticket.tipAmount / participants.length
    for (const pid of participants) tipByPerson.set(pid, per)
  } else {
    const totalNet = Array.from(itemsNetByPerson.values()).reduce((a, b) => a + b, 0) || 1
    for (const pid of participants) {
      tipByPerson.set(pid, ticket.tipAmount * ((itemsNetByPerson.get(pid) || 0) / totalNet))
    }
  }

  return participants.map((pid) => {
    const itemsTotal = itemsNetByPerson.get(pid) || 0
    const taxShare = taxByPerson.get(pid) || 0
    const tipShare = tipByPerson.get(pid) || 0
    // En modo "included", el IVA ya está dentro de los items, NO se suma
    const total =
      ticket.taxMode === 'included'
        ? itemsTotal + tipShare
        : itemsTotal + taxShare + tipShare
    return {
      personId: pid,
      itemsTotal,
      taxShare,
      tipShare,
      total,
    }
  })
}

/**
 * Verifica el cuadre: la suma de partes de las personas debe ser igual al total del ticket.
 * Devuelve { ok, sumShares, ticketTotal, diff }.
 */
export function verifyCuadre(ticket: Ticket): {
  ok: boolean
  sumShares: number
  ticketTotal: number
  diff: number
} {
  const shares = computeShares(ticket)
  const sumShares = shares.reduce((s, x) => s + x.total, 0)
  const ticketTotal = calcTicketTotal(ticket)
  const diff = sumShares - ticketTotal
  return {
    ok: Math.abs(diff) < 0.01,
    sumShares,
    ticketTotal,
    diff,
  }
}

/** Verifica que todos los items tengan asignación completa. */
export function itemsFullyAssigned(ticket: Ticket): {
  allAssigned: boolean
  unassignedItems: string[]
} {
  const unassignedItems: string[] = []
  for (const item of ticket.items) {
    if (item.assignments.length === 0) {
      unassignedItems.push(item.id)
    }
  }
  return {
    allAssigned: unassignedItems.length === 0,
    unassignedItems,
  }
}

/** Normaliza pesos para que sumen 1 (manteniendo proporciones). */
export function normalizeWeights(assignments: ItemAssignment[]): ItemAssignment[] {
  const total = assignments.reduce((s, a) => s + a.weight, 0)
  if (total <= 0) return assignments
  return assignments.map((a) => ({ ...a, weight: a.weight / total }))
}

/** Redondea a 2 decimales. */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

/** Paleta de colores para avatares. */
export const AVATAR_COLORS = [
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
  '#6366f1', // indigo (used sparingly)
  '#14b8a6', // teal
  '#a855f7', // purple
  '#22c55e', // green
]

/** Calcula iniciales a partir de un nombre. */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Genera un ID corto. */
export function genId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}
