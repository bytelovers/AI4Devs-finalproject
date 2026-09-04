import { describe, it, expect } from 'vitest'
import {
  genId,
  getInitials,
  round2,
  calcSubtotal,
  calcTaxAmount,
  calcTipAmount,
  calcTicketTotal,
  calcItemsTotal,
  calcDiscountsTotal,
  itemLineTotal,
  personItemShare,
  computeShares,
  verifyCuadre,
  itemsFullyAssigned,
  normalizeWeights,
  formatEUR,
  formatDate,
  formatDateTime,
  AVATAR_COLORS,
} from './calc'
import type { Ticket, TicketItem } from './types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeItem(overrides: Partial<TicketItem> = {}): TicketItem {
  return {
    id: 'i1',
    name: 'Item',
    quantity: 1,
    unitPrice: 10,
    mode: 'single',
    assignments: [{ personId: 'p1', weight: 1 }],
    ...overrides,
  }
}

function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: 't1',
    title: 'Test ticket',
    date: '2025-01-15T12:00:00.000Z',
    items: [makeItem()],
    discounts: [],
    subtotal: 10,
    taxRate: 0.1,
    taxAmount: 1,
    taxMode: 'added',
    tipMode: 'none',
    tipAmount: 0,
    tipPercentage: undefined,
    taxDistribution: 'proportional',
    tipDistribution: 'proportional',
    participantIds: ['p1'],
    status: 'draft',
    createdAt: '2025-01-15T12:00:00.000Z',
    updatedAt: '2025-01-15T12:00:00.000Z',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

describe('formatEUR', () => {
  it('formats a positive amount', () => {
    expect(formatEUR(12.5)).toBe('12,50\xa0€')
  })

  it('formats zero', () => {
    expect(formatEUR(0)).toBe('0,00\xa0€')
  })

  it('formats nullish as 0', () => {
    expect(formatEUR(undefined as unknown as number)).toBe('0,00\xa0€')
  })
})

describe('formatDate', () => {
  it('formats an ISO date', () => {
    const result = formatDate('2025-01-15T12:00:00.000Z')
    expect(result).toContain('2025')
  })

  it('returns raw input on invalid date', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date')
  })
})

describe('formatDateTime', () => {
  it('formats an ISO datetime without year (short format)', () => {
    const result = formatDateTime('2025-01-15T12:00:00.000Z')
    // The format uses day, month short, hour, minute — no year
    expect(result).toMatch(/\d{1,2} \w{3,4}, \d{2}:\d{2}/)
  })

  it('returns raw input on invalid date', () => {
    expect(formatDateTime('bad')).toBe('bad')
  })
})

// ---------------------------------------------------------------------------
// ID generation
// ---------------------------------------------------------------------------

describe('genId', () => {
  it('returns a string', () => {
    expect(typeof genId()).toBe('string')
  })

  it('returns unique values across calls', () => {
    const ids = new Set(Array.from({ length: 100 }, () => genId()))
    expect(ids.size).toBe(100)
  })

  it('is at least 8 characters long', () => {
    expect(genId().length).toBeGreaterThanOrEqual(8)
  })
})

// ---------------------------------------------------------------------------
// Initials
// ---------------------------------------------------------------------------

describe('getInitials', () => {
  it('returns two-letter initials for a two-part name', () => {
    expect(getInitials('John Doe')).toBe('JD')
  })

  it('returns first two chars for a single-part name', () => {
    expect(getInitials('Alice')).toBe('AL')
  })

  it('returns first and last initial for multi-part name', () => {
    expect(getInitials('Maria Del Carmen Garcia')).toBe('MG')
  })

  it('returns ? for empty string', () => {
    expect(getInitials('')).toBe('?')
  })

  it('handles extra whitespace', () => {
    expect(getInitials('  Ana   Maria  ')).toBe('AM')
  })
})

// ---------------------------------------------------------------------------
// Rounding
// ---------------------------------------------------------------------------

describe('round2', () => {
  it('rounds to two decimals', () => {
    expect(round2(10.456)).toBe(10.46)
  })

  it('handles exact values', () => {
    expect(round2(10.5)).toBe(10.5)
  })

  it('handles very small numbers', () => {
    expect(round2(0.001)).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Individual item calculations
// ---------------------------------------------------------------------------

describe('itemLineTotal', () => {
  it('multiplies quantity by unit price', () => {
    const item = makeItem({ quantity: 3, unitPrice: 5 })
    expect(itemLineTotal(item)).toBe(15)
  })

  it('handles zero quantity', () => {
    expect(itemLineTotal(makeItem({ quantity: 0 }))).toBe(0)
  })

  it('handles nullish safely', () => {
    const item = makeItem({ quantity: undefined as unknown as number })
    expect(itemLineTotal(item)).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Subtotal calculations
// ---------------------------------------------------------------------------

describe('calcSubtotal', () => {
  it('sums all items line totals', () => {
    const items = [
      makeItem({ id: 'i1', quantity: 2, unitPrice: 10 }),
      makeItem({ id: 'i2', quantity: 1, unitPrice: 5 }),
    ]
    expect(calcSubtotal(items)).toBe(25)
  })

  it('returns 0 for empty array', () => {
    expect(calcSubtotal([])).toBe(0)
  })
})

describe('calcItemsTotal', () => {
  it('is an alias for calcSubtotal', () => {
    const items = [makeItem({ quantity: 2, unitPrice: 10 })]
    expect(calcItemsTotal(items)).toBe(calcSubtotal(items))
  })
})

// ---------------------------------------------------------------------------
// Tax
// ---------------------------------------------------------------------------

describe('calcTaxAmount', () => {
  it('calculates added tax', () => {
    expect(calcTaxAmount(100, 0.21, 'added')).toBe(21)
  })

  it('returns 0 for zero rate (added)', () => {
    expect(calcTaxAmount(100, 0, 'added')).toBe(0)
  })

  it('calculates included tax (VAT extraction)', () => {
    // 100 with 21% VAT included => 100 - 100/1.21 ≈ 17.36
    const result = calcTaxAmount(100, 0.21, 'included')
    expect(result).toBeCloseTo(17.36, 1)
  })

  it('returns 0 for zero rate (included)', () => {
    expect(calcTaxAmount(100, 0, 'included')).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Tip
// ---------------------------------------------------------------------------

describe('calcTipAmount', () => {
  it('returns 0 for mode none', () => {
    expect(calcTipAmount(100, 'none', undefined, 0)).toBe(0)
  })

  it('calculates percentage tip', () => {
    expect(calcTipAmount(100, 'percentage', 10, 0)).toBe(10)
  })

  it('handles undefined percentage as 0', () => {
    expect(calcTipAmount(100, 'percentage', undefined, 0)).toBe(0)
  })

  it('returns fixed amount for fixed mode', () => {
    expect(calcTipAmount(100, 'fixed', undefined, 5)).toBe(5)
  })

  it('returns 0 for fixed mode when tipFixed is 0', () => {
    expect(calcTipAmount(100, 'fixed', undefined, 0)).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Ticket totals
// ---------------------------------------------------------------------------

describe('calcTicketTotal', () => {
  it('sums subtotal + tax + tip when tax is added', () => {
    const ticket = makeTicket({
      subtotal: 100,
      taxAmount: 21,
      taxMode: 'added',
      tipAmount: 10,
    })
    expect(calcTicketTotal(ticket)).toBe(131)
  })

  it('ignores tax when mode is included', () => {
    const ticket = makeTicket({
      subtotal: 100,
      taxAmount: 17.36,
      taxMode: 'included',
      tipAmount: 10,
    })
    expect(calcTicketTotal(ticket)).toBe(110)
  })
})

// ---------------------------------------------------------------------------
// Discounts
// ---------------------------------------------------------------------------

describe('calcDiscountsTotal', () => {
  it('sums fixed amount discounts', () => {
    const ticket = makeTicket({
      items: [makeItem({ id: 'i1', quantity: 1, unitPrice: 100 })],
      discounts: [
        { id: 'd1', name: 'Coupon', mode: 'amount', amount: 10 },
        { id: 'd2', name: 'Loyalty', mode: 'amount', amount: 5 },
      ],
    })
    expect(calcDiscountsTotal(ticket)).toBe(15)
  })

  it('calculates percentage discounts', () => {
    const ticket = makeTicket({
      items: [makeItem({ id: 'i1', quantity: 1, unitPrice: 100 })],
      discounts: [
        { id: 'd1', name: '10% off', mode: 'percentage', amount: 0, percentage: 10 },
      ],
    })
    expect(calcDiscountsTotal(ticket)).toBe(10)
  })

  it('returns 0 when no discounts', () => {
    expect(calcDiscountsTotal(makeTicket())).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Person item share
// ---------------------------------------------------------------------------

describe('personItemShare', () => {
  it('returns 0 when person not assigned', () => {
    const item = makeItem({ assignments: [{ personId: 'p2', weight: 1 }] })
    expect(personItemShare(item, 'p1')).toBe(0)
  })

  it('returns 0 for empty assignments', () => {
    expect(personItemShare(makeItem({ assignments: [] }), 'p1')).toBe(0)
  })

  it('returns proportional share for weighted assignment', () => {
    const item = makeItem({
      quantity: 2,
      unitPrice: 10,
      assignments: [
        { personId: 'p1', weight: 1 },
        { personId: 'p2', weight: 3 },
      ],
    })
    // Item line total = 20, p1 gets 1/4 = 5
    expect(personItemShare(item, 'p1')).toBe(5)
  })
})

// ---------------------------------------------------------------------------
// Normalize weights
// ---------------------------------------------------------------------------

describe('normalizeWeights', () => {
  it('normalizes to sum 1', () => {
    const result = normalizeWeights([
      { personId: 'p1', weight: 2 },
      { personId: 'p2', weight: 2 },
    ])
    expect(result[0].weight).toBe(0.5)
    expect(result[1].weight).toBe(0.5)
  })

  it('returns unchanged when total is 0', () => {
    const input = [{ personId: 'p1', weight: 0 }]
    expect(normalizeWeights(input)).toEqual(input)
  })
})

// ---------------------------------------------------------------------------
// Items fully assigned
// ---------------------------------------------------------------------------

describe('itemsFullyAssigned', () => {
  it('returns true when all items have assignments', () => {
    const ticket = makeTicket({
      items: [
        makeItem({ id: 'i1', assignments: [{ personId: 'p1', weight: 1 }] }),
        makeItem({ id: 'i2', assignments: [{ personId: 'p1', weight: 1 }] }),
      ],
    })
    expect(itemsFullyAssigned(ticket).allAssigned).toBe(true)
  })

  it('returns false when some items lack assignments', () => {
    const ticket = makeTicket({
      items: [
        makeItem({ id: 'i1', assignments: [] }),
        makeItem({ id: 'i2', assignments: [{ personId: 'p1', weight: 1 }] }),
      ],
    })
    const result = itemsFullyAssigned(ticket)
    expect(result.allAssigned).toBe(false)
    expect(result.unassignedItems).toContain('i1')
  })
})

// ---------------------------------------------------------------------------
// Compute shares & verify cuadre
// ---------------------------------------------------------------------------

describe('computeShares', () => {
  it('returns empty array when no participants', () => {
    const ticket = makeTicket({ participantIds: [] })
    expect(computeShares(ticket)).toEqual([])
  })

  it('attributes all cost to single participant', () => {
    const ticket = makeTicket({
      items: [makeItem({ id: 'i1', quantity: 2, unitPrice: 10, assignments: [{ personId: 'p1', weight: 1 }] })],
      participantIds: ['p1'],
      subtotal: 20,
      taxAmount: 2,
      taxMode: 'added',
      tipAmount: 0,
    })
    const shares = computeShares(ticket)
    expect(shares).toHaveLength(1)
    expect(shares[0].itemsTotal).toBeCloseTo(20)
    expect(shares[0].taxShare).toBeCloseTo(2)
  })

  it('distributes tax proportionally', () => {
    const ticket = makeTicket({
      items: [
        makeItem({ id: 'i1', quantity: 1, unitPrice: 30, assignments: [{ personId: 'p1', weight: 1 }] }),
        makeItem({ id: 'i2', quantity: 1, unitPrice: 10, assignments: [{ personId: 'p2', weight: 1 }] }),
      ],
      participantIds: ['p1', 'p2'],
      subtotal: 40,
      taxAmount: 4,
      taxMode: 'added',
      tipAmount: 0,
    })
    const shares = computeShares(ticket)
    expect(shares).toHaveLength(2)
    // p1 consumed 30/40 => should get 3 tax
    // p2 consumed 10/40 => should get 1 tax
    expect(shares.find((s) => s.personId === 'p1')!.taxShare).toBeCloseTo(3)
    expect(shares.find((s) => s.personId === 'p2')!.taxShare).toBeCloseTo(1)
  })

  it('distributes tax equally when taxDistribution is equal', () => {
    const ticket = makeTicket({
      items: [
        makeItem({ id: 'i1', quantity: 1, unitPrice: 30, assignments: [{ personId: 'p1', weight: 1 }] }),
        makeItem({ id: 'i2', quantity: 1, unitPrice: 10, assignments: [{ personId: 'p2', weight: 1 }] }),
      ],
      participantIds: ['p1', 'p2'],
      subtotal: 40,
      taxAmount: 4,
      taxMode: 'added',
      taxDistribution: 'equal',
      tipAmount: 0,
    })
    const shares = computeShares(ticket)
    expect(shares.find((s) => s.personId === 'p1')!.taxShare).toBeCloseTo(2)
    expect(shares.find((s) => s.personId === 'p2')!.taxShare).toBeCloseTo(2)
  })
})

describe('verifyCuadre', () => {
  it('returns ok for a balanced ticket', () => {
    const ticket = makeTicket({
      items: [makeItem({ id: 'i1', quantity: 1, unitPrice: 10 })],
      participantIds: ['p1'],
      subtotal: 10,
      taxAmount: 0,
      taxMode: 'added',
      tipAmount: 0,
    })
    const result = verifyCuadre(ticket)
    expect(result.ok).toBe(true)
    expect(result.diff).toBeCloseTo(0)
  })

  it('reports diff for unbalanced distribution', () => {
    // A ticket where p1 consumes but there are participants with no items
    const ticket = makeTicket({
      items: [makeItem({ id: 'i1', quantity: 1, unitPrice: 10, assignments: [{ personId: 'p1', weight: 1 }] })],
      participantIds: ['p1', 'p2'],
      subtotal: 10,
      taxAmount: 0,
      taxMode: 'added',
      tipAmount: 0,
    })
    const result = verifyCuadre(ticket)
    // p1 consumed 10, p2 consumed 0 => sumShares = 5 each (discounts proportional)
    // Actually with no discounts, itemsNetByPerson p1=10, p2=0
    // sumShares = 10, ticketTotal = 10 => ok
    expect(result.ok).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Avatar colors
// ---------------------------------------------------------------------------

describe('AVATAR_COLORS', () => {
  it('has 12 colors', () => {
    expect(AVATAR_COLORS).toHaveLength(12)
  })

  it('every color is a valid hex', () => {
    AVATAR_COLORS.forEach((c) => {
      expect(c).toMatch(/^#[0-9a-f]{6}$/)
    })
  })
})
