import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { AssignmentEditor } from './AssignmentEditor'
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

function createTicketWithAssignments(): Ticket {
  const store = useAppStore.getState()

  // Create people using string names
  const person1 = store.addPerson('Ana')
  const person2 = store.addPerson('Beto')
  const person3 = store.addPerson('Carlos')

  // Create a group with those people
  store.addGroup('Amigos', [person1.id, person2.id, person3.id])

  // Create ticket with items that have assignments
  const ticket = store.addTicket({
    title: 'Test ticket',
    items: [
      { id: genId(), name: 'Paella', quantity: 2, unitPrice: 12.5, mode: 'single', assignments: [{ personId: person1.id, weight: 1 }] },
      { id: genId(), name: 'Cerveza', quantity: 3, unitPrice: 3.5, mode: 'shared', assignments: [{ personId: person1.id, weight: 1 }, { personId: person2.id, weight: 1 }] },
      { id: genId(), name: 'Postre', quantity: 1, unitPrice: 6.0, mode: 'weighted', assignments: [{ personId: person1.id, weight: 0.5 }, { personId: person2.id, weight: 0.3 }, { personId: person3.id, weight: 0.2 }] },
    ],
    discounts: [],
    participantIds: [person1.id, person2.id, person3.id],
    status: 'draft' as const,
  })
  store.recalcTicket(ticket.id)
  return useAppStore.getState().tickets.find((t) => t.id === ticket.id)!
}

function renderEditor(ticket: Ticket) {
  return render(<AssignmentEditor ticket={ticket} />)
}

/** Re-render with a fresh ticket snapshot from the store so the component sees updated data. */
function rerenderWithUpdatedTicket(
  rerender: (ui: React.ReactElement) => void,
  ticketId: string,
) {
  const fresh = useAppStore.getState().tickets.find((t) => t.id === ticketId)!
  rerender(<AssignmentEditor ticket={fresh} />)
}

// ---------------------------------------------------------------------------

describe('AssignmentEditor', () => {
  it('opens Sheet when clicking an item row', async () => {
    const ticket = createTicketWithAssignments()
    renderEditor(ticket)

    // Click the first item row (Paella)
    const paellaRow = screen.getByText('Paella')
    fireEvent.click(paellaRow)

    // Sheet should open with title "Asignar: Paella"
    await waitFor(() => {
      expect(screen.getByText('Asignar: Paella')).toBeDefined()
    })
  })

  it('mode single keeps first person / empties if none', async () => {
    const ticket = createTicketWithAssignments()
    renderEditor(ticket)

    // Click Paella row (currently single with Ana)
    const paellaRow = screen.getByText('Paella')
    fireEvent.click(paellaRow)

    await waitFor(() => {
      expect(screen.getByText('Asignar: Paella')).toBeDefined()
    })

    // Find the "1 persona" mode button INSIDE the Sheet and click it
    const sheet = screen.getByText('Asignar: Paella').closest('[role="dialog"]')
    const singleBtn = within(sheet!).getAllByText('1 persona').find(
      (el) => el.tagName === 'BUTTON' || el.closest('button')
    )!
    fireEvent.click(singleBtn)

    // Store should have updated: single mode keeps first person (Ana) with weight 1
    await waitFor(() => {
      const updatedTicket = useAppStore.getState().tickets.find((t) => t.id === ticket.id)!
      const paellaItem = updatedTicket.items.find((it) => it.name === 'Paella')!
      expect(paellaItem.mode).toBe('single')
      expect(paellaItem.assignments).toHaveLength(1)
      expect(paellaItem.assignments[0].personId).toBe(ticket.participantIds[0]) // Ana
      expect(paellaItem.assignments[0].weight).toBe(1)
    })
  })

  it('mode shared normalizes all weights to 1', async () => {
    const ticket = createTicketWithAssignments()
    renderEditor(ticket)

    // Click Cerveza row (currently shared with Ana, Beto)
    const cervezaRow = screen.getByText('Cerveza')
    fireEvent.click(cervezaRow)

    await waitFor(() => {
      expect(screen.getByText('Asignar: Cerveza')).toBeDefined()
    })

    // Click "Igual" mode button
    const sharedBtn = screen.getByText('Igual')
    fireEvent.click(sharedBtn)

    // Store should have updated: shared mode, all weights = 1
    await waitFor(() => {
      const updatedTicket = useAppStore.getState().tickets.find((t) => t.id === ticket.id)!
      const cervezaItem = updatedTicket.items.find((it) => it.name === 'Cerveza')!
      expect(cervezaItem.mode).toBe('shared')
      expect(cervezaItem.assignments).toHaveLength(2)
      cervezaItem.assignments.forEach((a) => expect(a.weight).toBe(1))
    })
  })

  it('togglePerson adds then removes a person in shared mode', async () => {
    const ticket = createTicketWithAssignments()
    const { rerender } = renderEditor(ticket)

    // Click Cerveza row (shared mode with Ana + two people)
    const cervezaRow = screen.getByText('Cerveza')
    fireEvent.click(cervezaRow)

    await waitFor(() => {
      expect(screen.getByText('Asignar: Cerveza')).toBeDefined()
    })

    // Initially Cerveza has 2 assignments (Ana, Beto)
    // Click Carlos's person chip to add him
    const sheet = screen.getByText('Asignar: Cerveza').closest('[role="dialog"]')
    const carlosChip = within(sheet!).getByText('Carlos')
    fireEvent.click(carlosChip)

    await waitFor(() => {
      const updatedTicket = useAppStore.getState().tickets.find((t) => t.id === ticket.id)!
      const cervezaItem = updatedTicket.items.find((it) => it.name === 'Cerveza')!
      expect(cervezaItem.assignments).toHaveLength(3)
      expect(cervezaItem.assignments.map((a) => a.personId)).toContain(ticket.participantIds[2]) // Carlos
    })

    // Re-render with updated ticket so ItemAssignmentSheet sees the latest assignments
    rerenderWithUpdatedTicket(rerender, ticket.id)

    // Click Carlos's chip again to remove (re-query after re-render)
    const updatedSheet = screen.getByText('Asignar: Cerveza').closest('[role="dialog"]')
    const carlosChipAgain = within(updatedSheet!).getByText('Carlos')
    fireEvent.click(carlosChipAgain)

    await waitFor(() => {
      const updatedTicket = useAppStore.getState().tickets.find((t) => t.id === ticket.id)!
      const cervezaItem = updatedTicket.items.find((it) => it.name === 'Cerveza')!
      expect(cervezaItem.assignments).toHaveLength(2)
      expect(cervezaItem.assignments.map((a) => a.personId)).not.toContain(ticket.participantIds[2])
    })
  })

  it('weighted mode number-step +0.5 updates store', async () => {
    const ticket = createTicketWithAssignments()
    renderEditor(ticket)

    // Click Postre row (weighted mode)
    const postreRow = screen.getByText('Postre')
    fireEvent.click(postreRow)

    await waitFor(() => {
      expect(screen.getByText('Asignar: Postre')).toBeDefined()
    })

    // In weighted mode, there should be number inputs for each person
    // Find the input for Ana (first person)
    const numberInputs = document.querySelectorAll('input[type="number"]')
    expect(numberInputs.length).toBeGreaterThan(0)

    // Get initial weight for Ana (should be 0.5)
    const anaInput = numberInputs[0] as HTMLInputElement
    const initialWeight = parseFloat(anaInput.value)
    expect(initialWeight).toBe(0.5)

    // Find the + button (next to the input) - it's the button after the input
    const plusButton = anaInput.nextElementSibling as HTMLButtonElement
    expect(plusButton).toBeDefined()
    fireEvent.click(plusButton)

    await waitFor(() => {
      const updatedTicket = useAppStore.getState().tickets.find((t) => t.id === ticket.id)!
      const postreItem = updatedTicket.items.find((it) => it.name === 'Postre')!
      const anaAssignment = postreItem.assignments.find((a) => a.personId === ticket.participantIds[0])!
      expect(anaAssignment.weight).toBe(1.0) // 0.5 + 0.5 = 1.0
    })
  })

  it('distributeEqually normalizes weights to 1/N', async () => {
    const ticket = createTicketWithAssignments()
    renderEditor(ticket)

    // Click Postre row (has 3 people assigned)
    const postreRow = screen.getByText('Postre')
    fireEvent.click(postreRow)

    await waitFor(() => {
      expect(screen.getByText('Asignar: Postre')).toBeDefined()
    })

    // Click "Repartir igualmente (3)" button
    const distributeBtn = screen.getByText(/Repartir igualmente \(3\)/)
    fireEvent.click(distributeBtn)

    await waitFor(() => {
      const updatedTicket = useAppStore.getState().tickets.find((t) => t.id === ticket.id)!
      const postreItem = updatedTicket.items.find((it) => it.name === 'Postre')!
      // distributeEqually keeps the current mode ('weighted' for Postre) but normalizes weights
      expect(postreItem.mode).toBe('weighted')
      // All 3 should have weight 1/3
      const expectedWeight = 1 / 3
      postreItem.assignments.forEach((a) => {
        expect(a.weight).toBeCloseTo(expectedWeight, 5)
      })
    })
  })
})