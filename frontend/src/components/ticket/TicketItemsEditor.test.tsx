import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TicketItemsEditor } from './TicketItemsEditor'
import { useAppStore } from '@/lib/store'
import type { Ticket } from '@/lib/types'

// ---------------------------------------------------------------------------
// Mock localStorage
// ---------------------------------------------------------------------------

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
    get length() { return Object.keys(store).length },
    key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
  }
})()

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

beforeEach(() => {
  Object.defineProperty(globalThis, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })

  useAppStore.getState().resetAll()
  localStorageMock.clear()
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function genId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

function createTicketWithItems(): Ticket {
  const store = useAppStore.getState()
  const ticket = store.addTicket({
    title: 'Test ticket',
    items: [
      { id: genId(), name: 'Paella', quantity: 2, unitPrice: 12.5, mode: 'single' as const, assignments: [] },
      { id: genId(), name: 'Cerveza', quantity: 3, unitPrice: 3.5, mode: 'shared' as const, assignments: [] },
      { id: genId(), name: 'Postre', quantity: 1, unitPrice: 6.0, mode: 'single' as const, assignments: [] },
    ],
    discounts: [],
    status: 'draft' as const,
  })
  store.recalcTicket(ticket.id)
  return useAppStore.getState().tickets.find((t) => t.id === ticket.id)!
}

function renderEditor(ticket: Ticket) {
  return render(<TicketItemsEditor ticket={ticket} />)
}

describe('TicketItemsEditor', () => {
  it('renders all items', () => {
    const ticket = createTicketWithItems()
    renderEditor(ticket)

    expect(screen.getByDisplayValue('Paella')).toBeDefined()
    expect(screen.getByDisplayValue('Cerveza')).toBeDefined()
    expect(screen.getByDisplayValue('Postre')).toBeDefined()
  })

  it('shows correct item count', () => {
    const ticket = createTicketWithItems()
    renderEditor(ticket)

    expect(screen.getByText('3 líneas')).toBeDefined()
  })

  it('adds a new item when clicking "Añadir item" button', async () => {
    const ticket = createTicketWithItems()
    renderEditor(ticket)

    const addButtons = screen.getAllByText('Añadir item')
    fireEvent.click(addButtons[addButtons.length - 1])

    await waitFor(() => {
      const updatedTicket = useAppStore.getState().tickets.find((t) => t.id === ticket.id)!
      expect(updatedTicket.items.length).toBe(4)
    })
  })

  it('deletes an item when clicking delete button', async () => {
    const ticket = createTicketWithItems()
    renderEditor(ticket)

    const deleteButtons = screen.getAllByLabelText('Eliminar item')
    fireEvent.click(deleteButtons[0])

    await waitFor(() => {
      const updatedTicket = useAppStore.getState().tickets.find((t) => t.id === ticket.id)!
      expect(updatedTicket.items.length).toBe(2)
      expect(updatedTicket.items.find((it) => it.name === 'Paella')).toBeUndefined()
    })
  })

  it('edits item name', async () => {
    const ticket = createTicketWithItems()
    renderEditor(ticket)

    const nameInput = screen.getByDisplayValue('Paella')
    fireEvent.change(nameInput, { target: { value: 'Paella valenciana' } })

    await waitFor(() => {
      const updatedTicket = useAppStore.getState().tickets.find((t) => t.id === ticket.id)!
      expect(updatedTicket.items.find((it) => it.name === 'Paella valenciana')).toBeDefined()
    })
  })

  it('edits item quantity', async () => {
    const ticket = createTicketWithItems()
    renderEditor(ticket)

    const qtyInputs = document.querySelectorAll('input[type="number"]')

    fireEvent.change(qtyInputs[0], { target: { value: '5' } })

    await waitFor(() => {
      const updatedTicket = useAppStore.getState().tickets.find((t) => t.id === ticket.id)!
      const paellaItem = updatedTicket.items.find((it) => it.name === 'Paella')
      expect(paellaItem?.quantity).toBe(5)
    })
  })

  it('edits item unit price', async () => {
    const ticket = createTicketWithItems()
    renderEditor(ticket)

    const priceInputs = document.querySelectorAll('input[inputmode="decimal"]')

    fireEvent.change(priceInputs[0], { target: { value: '15' } })

    await waitFor(() => {
      const updatedTicket = useAppStore.getState().tickets.find((t) => t.id === ticket.id)!
      const paellaItem = updatedTicket.items.find((it) => it.name === 'Paella')
      expect(paellaItem?.unitPrice).toBe(15)
    })
  })

  it('toggles IVA mode between included and added', async () => {
    const ticket = createTicketWithItems()
    renderEditor(ticket)

    const switchInput = document.querySelector('[role="switch"]')
    expect(switchInput).toBeDefined()

    fireEvent.click(switchInput!)

    await waitFor(() => {
      const updatedTicket = useAppStore.getState().tickets.find((t) => t.id === ticket.id)!
      expect(updatedTicket.taxMode).toBe('included')
    })
  })

  it('shows summary with correct totals', () => {
    const ticket = createTicketWithItems()
    renderEditor(ticket)

    // Items total = 2×12.50 + 3×3.50 + 1×6.00 = 25 + 10.50 + 6 = 41.50
    // Appears both in items section and summary section
    const totalMatches = screen.getAllByText((content) => content.includes('41,50'))
    expect(totalMatches.length).toBeGreaterThanOrEqual(1)
  })

  it('shows empty state when no items', () => {
    const store = useAppStore.getState()
    const ticket = store.addTicket({ title: 'Empty ticket', items: [], status: 'draft' })
    store.recalcTicket(ticket.id)
    const emptyTicket = useAppStore.getState().tickets.find((t) => t.id === ticket.id)!

    renderEditor(emptyTicket)
    expect(screen.getByText('No hay items todavía. Añade las líneas del ticket manualmente.')).toBeDefined()
  })

  it('manages IVA rate via store directly (radix select workaround)', async () => {
    const ticket = createTicketWithItems()
    renderEditor(ticket)

    // Use store directly since Radix Select portals are tricky in jsdom
    const store = useAppStore.getState()
    store.updateTicket(ticket.id, { taxRate: 0.21 })
    store.recalcTicket(ticket.id)

    await waitFor(() => {
      const updatedTicket = useAppStore.getState().tickets.find((t) => t.id === ticket.id)!
      expect(updatedTicket.taxRate).toBe(0.21)
    })
  })

  it('changes tip mode via store directly (radix select workaround)', async () => {
    const ticket = createTicketWithItems()
    renderEditor(ticket)

    const store = useAppStore.getState()
    store.updateTicket(ticket.id, { tipMode: 'percentage', tipPercentage: 10 })
    store.recalcTicket(ticket.id)

    await waitFor(() => {
      const updatedTicket = useAppStore.getState().tickets.find((t) => t.id === ticket.id)!
      expect(updatedTicket.tipMode).toBe('percentage')
      expect(updatedTicket.tipAmount).toBeGreaterThan(0)
    })
  })

  it('adds a discount and displays it', async () => {
    const ticket = createTicketWithItems()
    renderEditor(ticket)

    const addDiscountBtns = screen.getAllByText('Añadir')
    fireEvent.click(addDiscountBtns[addDiscountBtns.length - 1])

    await waitFor(() => {
      const updatedTicket = useAppStore.getState().tickets.find((t) => t.id === ticket.id)!
      expect(updatedTicket.discounts.length).toBe(1)
      expect(updatedTicket.discounts[0].name).toBe('Descuento')
    })
  })

  it('shows discount total when discounts exist', () => {
    const ticket = createTicketWithItems()
    const store = useAppStore.getState()
    store.addTicketDiscount(ticket.id, { name: 'Cupón 10%', mode: 'amount', amount: 5 })
    store.recalcTicket(ticket.id)
    const updatedTicket = useAppStore.getState().tickets.find((t) => t.id === ticket.id)!

    renderEditor(updatedTicket)

    // Discount text appears both in the individual discount row and total line
    const discountTotalElements = screen.getAllByText((content) => content.includes('5,00'))
    expect(discountTotalElements.length).toBeGreaterThanOrEqual(1)
  })
})
