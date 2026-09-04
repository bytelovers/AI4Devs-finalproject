/**
 * Wizard Loaders — Integration tests
 *
 * Exercises the loader contracts from the SDD spec:
 *   FR-007: Wizard steps sync with URL
 *   FR-008: Refresh in wizard step restores OR redirects
 *   FR-009: Empty draft deletion on back
 *   FR-010: Deep-link guards prevent invalid step access
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from '@/lib/store'
import {
  newTicketParentLoader,
  captureLoader,
  reviewLoader,
  participantsLoader,
  assignLoader,
  summaryLoader,
  scanningLoader,
  ocrReviewLoader,
  hasUnsavedCaptureData,
  hasUnsavedEdits,
  hasUnsavedParticipants,
  hasUnsavedAssignments,
  hasUnsavedSummary,
} from '@/lib/wizard-loaders'

// Helper: read the redirect payload from a thrown Response
function expectRedirect(fn: () => any, expectedPath: string) {
  let thrown: any
  try {
    fn()
  } catch (err) {
    thrown = err
  }
  expect(thrown).toBeDefined()
  expect(thrown).toBeInstanceOf(Response)
  expect(thrown.status).toBe(302)
  expect(thrown.headers.get('Location')).toBe(expectedPath)
}

describe('Wizard Loaders — parent loader', () => {
  beforeEach(() => {
    useAppStore.getState().resetAll()
  })

  it('FR-008: /tickets/new with no draft creates one and redirects to /capture', () => {
    expect(useAppStore.getState().draftTicketId).toBeNull()
    expectRedirect(newTicketParentLoader, '/tickets/new/capture')
    expect(useAppStore.getState().draftTicketId).not.toBeNull()
    // A new draft ticket is created
    const draft = useAppStore.getState().tickets.find(
      (t) => t.id === useAppStore.getState().draftTicketId
    )
    expect(draft).toBeDefined()
    expect(draft!.items).toEqual([])
    expect(draft!.status).toBe('draft')
  })

  it('FR-007: /tickets/new with existing draft redirects to /capture', () => {
    const draft = useAppStore.getState().addTicket({
      title: 'Existing',
      items: [],
      status: 'draft',
    })
    useAppStore.getState().setDraftTicketId(draft.id)
    expectRedirect(newTicketParentLoader, '/tickets/new/capture')
  })
})

describe('Wizard Loaders — step loaders', () => {
  let draftId: string

  beforeEach(() => {
    useAppStore.getState().resetAll()
    const t = useAppStore.getState().addTicket({
      title: 'Test',
      items: [],
      status: 'draft',
    })
    useAppStore.getState().setDraftTicketId(t.id)
    draftId = t.id
  })

  // ---------------------------------------------------------------
  // capture
  // ---------------------------------------------------------------
  describe('capture loader', () => {
    it('returns draft with empty items', () => {
      const result = captureLoader()
      expect(result.step).toBe('capture')
      expect(result.draftId).toBe(draftId)
      expect(result.draft.items.length).toBe(0)
    })

    it('FR-008: redirects to /tickets/new when no draft pointer', () => {
      useAppStore.getState().clearDraftTicketId()
      expectRedirect(captureLoader, '/tickets/new')
    })

    it('FR-008: redirects to /tickets/new when draft was deleted externally', () => {
      useAppStore.setState({ draftTicketId: 'nonexistent-id' })
      expectRedirect(captureLoader, '/tickets/new')
      // Pointer cleared so next call doesn't loop
      expect(useAppStore.getState().draftTicketId).toBeNull()
    })
  })

  // ---------------------------------------------------------------
  // review
  // ---------------------------------------------------------------
  describe('review loader', () => {
    it('returns draft when it has items', () => {
      useAppStore.getState().addTicketItem(draftId, {
        name: 'Coffee',
        unitPrice: 2,
        quantity: 1,
      })
      const result = reviewLoader()
      expect(result.step).toBe('review')
      expect(result.draft.items.length).toBe(1)
    })

    it('FR-010: deep-link /review without items redirects to /capture', () => {
      // draft exists, no items
      expectRedirect(reviewLoader, '/tickets/new/capture')
    })

    it('FR-008: refresh /review with no draft pointer redirects to /tickets/new', () => {
      useAppStore.getState().clearDraftTicketId()
      expectRedirect(reviewLoader, '/tickets/new')
    })
  })

  // ---------------------------------------------------------------
  // participants
  // ---------------------------------------------------------------
  describe('participants loader', () => {
    it('returns draft when items exist', () => {
      useAppStore.getState().addTicketItem(draftId, { name: 'X', unitPrice: 1, quantity: 1 })
      const result = participantsLoader()
      expect(result.step).toBe('participants')
    })

    it('FR-010: deep-link /participants without items redirects to /review', () => {
      // No items yet
      expectRedirect(participantsLoader, '/tickets/new/review')
    })
  })

  // ---------------------------------------------------------------
  // assign
  // ---------------------------------------------------------------
  describe('assign loader', () => {
    it('returns draft when items + participants exist', () => {
      useAppStore.getState().addTicketItem(draftId, { name: 'X', unitPrice: 1, quantity: 1 })
      useAppStore.getState().updateTicket(draftId, { participantIds: ['p1', 'p2'] })
      const result = assignLoader()
      expect(result.step).toBe('assign')
    })

    it('FR-010: deep-link /assign without items redirects to /review', () => {
      // no items, no participants
      expectRedirect(assignLoader, '/tickets/new/review')
    })

    it('FR-010: deep-link /assign without participants redirects to /participants', () => {
      useAppStore.getState().addTicketItem(draftId, { name: 'X', unitPrice: 1, quantity: 1 })
      // no participants
      expectRedirect(assignLoader, '/tickets/new/participants')
    })
  })

  // ---------------------------------------------------------------
  // summary
  // ---------------------------------------------------------------
  describe('summary loader', () => {
    function setupFullDraft() {
      useAppStore.getState().addTicketItem(draftId, {
        name: 'Coffee',
        unitPrice: 2,
        quantity: 1,
      })
      // Find the item we just added
      const draft = useAppStore.getState().tickets.find((t) => t.id === draftId)!
      const itemId = draft.items[0].id
      useAppStore.getState().updateTicket(draftId, { participantIds: ['p1'] })
      useAppStore.getState().updateTicketItem(draftId, itemId, {
        assignments: [{ personId: 'p1', weight: 1 }],
      })
    }

    it('returns draft when fully assigned', () => {
      setupFullDraft()
      const result = summaryLoader()
      expect(result.step).toBe('summary')
    })

    it('FR-010: deep-link /summary without items redirects to /review', () => {
      expectRedirect(summaryLoader, '/tickets/new/review')
    })

    it('FR-010: deep-link /summary without participants redirects to /participants', () => {
      useAppStore.getState().addTicketItem(draftId, { name: 'X', unitPrice: 1, quantity: 1 })
      // no participants
      expectRedirect(summaryLoader, '/tickets/new/participants')
    })

    it('FR-010: deep-link /summary with unassigned items redirects to /assign', () => {
      useAppStore.getState().addTicketItem(draftId, { name: 'X', unitPrice: 1, quantity: 1 })
      useAppStore.getState().updateTicket(draftId, { participantIds: ['p1'] })
      // item has no assignments
      expectRedirect(summaryLoader, '/tickets/new/assign')
    })
  })

  // ---------------------------------------------------------------
  // transient steps
  // ---------------------------------------------------------------
  describe('transient step guards', () => {
    beforeEach(() => {
      // Ensure a draft so resolveDraft does not redirect first
    })

    it('FR-008: /scanning always redirects to /capture', () => {
      expectRedirect(scanningLoader, '/tickets/new/capture')
    })

    it('FR-008: /ocr-review always redirects to /capture', () => {
      expectRedirect(ocrReviewLoader, '/tickets/new/capture')
    })
  })
})

// -------------------------------------------------------------------
// Blocker condition helpers (FR-009 / FR-007 / FR-002)
// -------------------------------------------------------------------
describe('Blocker condition helpers', () => {
  function mkDraft(over: Partial<any> = {}) {
    return {
      id: 'd1',
      title: 't',
      items: [] as any[],
      participantIds: [] as string[],
      image: undefined,
      ...over,
    } as any
  }

  it('hasUnsavedCaptureData: image counts as dirty', () => {
    expect(hasUnsavedCaptureData(mkDraft({ image: 'data:image/png;base64,…' }))).toBe(true)
  })
  it('hasUnsavedCaptureData: items count as dirty', () => {
    expect(hasUnsavedCaptureData(mkDraft({ items: [{ name: 'a', unitPrice: 1, quantity: 1, assignments: [] as any[] }] }))).toBe(true)
  })
  it('hasUnsavedCaptureData: empty draft is not dirty', () => {
    expect(hasUnsavedCaptureData(mkDraft())).toBe(false)
  })

  it('hasUnsavedEdits: items make it dirty', () => {
    expect(hasUnsavedEdits(mkDraft({ items: [{ name: 'a', unitPrice: 1, quantity: 1, assignments: [] as any[] }] }))).toBe(true)
  })

  it('hasUnsavedParticipants: participantIds make it dirty', () => {
    expect(hasUnsavedParticipants(mkDraft({ participantIds: ['p1'] }))).toBe(true)
  })
  it('hasUnsavedParticipants: empty participants is not dirty', () => {
    expect(hasUnsavedParticipants(mkDraft())).toBe(false)
  })

  it('hasUnsavedAssignments: any assigned item is dirty', () => {
    const d = mkDraft({
      items: [
        { name: 'a', unitPrice: 1, quantity: 1, assignments: [{ personId: 'p1' } as any] },
        { name: 'b', unitPrice: 1, quantity: 1, assignments: [] as any[] },
      ],
    })
    expect(hasUnsavedAssignments(d)).toBe(true)
  })
  it('hasUnsavedAssignments: all unassigned is clean', () => {
    const d = mkDraft({
      items: [{ name: 'a', unitPrice: 1, quantity: 1, assignments: [] as any[] }],
    })
    expect(hasUnsavedAssignments(d)).toBe(false)
  })

  it('hasUnsavedSummary: always true (per spec)', () => {
    expect(hasUnsavedSummary(mkDraft())).toBe(true)
  })
})
