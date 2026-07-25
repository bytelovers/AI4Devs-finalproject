/**
 * Wizard Loaders & Actions — New Ticket flow
 *
 * Implements the spec contracts from the SDD spec:
 *   - Parent loader: ensures a draft ticket exists; redirects to /capture
 *   - Step loaders: validate preconditions; redirect to earlier step if unmet
 *   - Step actions: advance to the next step URL via redirect()
 *
 * All loaders/actions use the `useAppStore` Zustand store as the data source
 * (this app does not have a separate API layer; data lives in localStorage).
 */

import { redirect } from 'react-router-dom'
import type { Ticket } from '@/lib/types'
import { useAppStore } from '@/lib/store'

/** All wizard steps in display order. */
export type WizardStep = 'capture' | 'review' | 'participants' | 'assign' | 'summary'

/** Transient steps — NOT deep-linkable. Refresh forces redirect. */
export type TransientStep = 'scanning' | 'ocr-review'

/** Persisted wizard draft state — the Zustand draftTicketId. */
export interface WizardLoaderData {
  draftId: string
  draft: Ticket
  step: WizardStep
}

/** Get the draft ticket for the current route or throw a redirect. */
function resolveDraft(): Ticket {
  const { draftTicketId, tickets } = useAppStore.getState()
  if (!draftTicketId) {
    throw redirect('/tickets/new')
  }
  const draft = tickets.find((t) => t.id === draftTicketId)
  if (!draft) {
    // Draft was deleted externally; clear pointer and trigger parent loader
    useAppStore.getState().clearDraftTicketId()
    throw redirect('/tickets/new')
  }
  return draft
}

/**
 * Parent route loader for `/tickets/new`.
 * Ensures a draft ticket exists; creates one if needed.
 * Always redirects into a step (so this URL never renders content directly).
 */
export function newTicketParentLoader(): Response {
  const { draftTicketId, tickets, addTicket } = useAppStore.getState()
  if (!draftTicketId) {
    const draft = addTicket({ title: 'Nuevo ticket', items: [], status: 'draft' })
    useAppStore.getState().setDraftTicketId(draft.id)
    throw redirect('/tickets/new/capture')
  }
  const draft = tickets.find((t) => t.id === draftTicketId)
  if (!draft) {
    // Pointer stale — recreate and redirect
    useAppStore.getState().clearDraftTicketId()
    throw redirect('/tickets/new/capture')
  }
  // If user lands bare on /tickets/new (no step), send them to capture
  throw redirect('/tickets/new/capture')
}

/**
 * Step loader for `/tickets/new/capture`.
 * No precondition — every wizard starts here.
 */
export function captureLoader(): WizardLoaderData {
  const draft = resolveDraft()
  return { draftId: draft.id, draft, step: 'capture' }
}

/**
 * Step loader for `/tickets/new/review`.
 * Requires a draft with at least one item; otherwise redirect to `/capture`.
 */
export function reviewLoader(): WizardLoaderData {
  const draft = resolveDraft()
  if (!draft.items || draft.items.length === 0) {
    throw redirect('/tickets/new/capture')
  }
  return { draftId: draft.id, draft, step: 'review' }
}

/**
 * Step loader for `/tickets/new/participants`.
 * Requires items; otherwise redirect to `/review`.
 */
export function participantsLoader(): WizardLoaderData {
  const draft = resolveDraft()
  if (!draft.items || draft.items.length === 0) {
    throw redirect('/tickets/new/review')
  }
  return { draftId: draft.id, draft, step: 'participants' }
}

/**
 * Step loader for `/tickets/new/assign`.
 * Requires items + at least one participant; otherwise redirect.
 */
export function assignLoader(): WizardLoaderData {
  const draft = resolveDraft()
  if (!draft.items || draft.items.length === 0) {
    throw redirect('/tickets/new/review')
  }
  if (!draft.participantIds || draft.participantIds.length === 0) {
    throw redirect('/tickets/new/participants')
  }
  return { draftId: draft.id, draft, step: 'assign' }
}

/**
 * Step loader for `/tickets/new/summary`.
 * Requires items + participants + all items assigned; otherwise redirect.
 */
export function summaryLoader(): WizardLoaderData {
  const draft = resolveDraft()
  if (!draft.items || draft.items.length === 0) {
    throw redirect('/tickets/new/review')
  }
  if (!draft.participantIds || draft.participantIds.length === 0) {
    throw redirect('/tickets/new/participants')
  }
  const allAssigned = draft.items.every((it) => it.assignments.length > 0)
  if (!allAssigned) {
    throw redirect('/tickets/new/assign')
  }
  return { draftId: draft.id, draft, step: 'summary' }
}

/** Transient step guards — never directly renderable, always redirect to /capture. */
export function scanningLoader(): never {
  throw redirect('/tickets/new/capture')
}
export function ocrReviewLoader(): never {
  throw redirect('/tickets/new/capture')
}

/** URL for the next step in the wizard, given the current step. */
export function nextStepUrl(current: WizardStep): string {
  const order: WizardStep[] = ['capture', 'review', 'participants', 'assign', 'summary']
  const i = order.indexOf(current)
  if (i < 0 || i >= order.length - 1) return `/tickets/new/${current}`
  return `/tickets/new/${order[i + 1]}`
}

/** URL for the previous step in the wizard, given the current step. */
export function prevStepUrl(current: WizardStep): string {
  const order: WizardStep[] = ['capture', 'review', 'participants', 'assign', 'summary']
  const i = order.indexOf(current)
  if (i <= 0) return '/'
  return `/tickets/new/${order[i - 1]}`
}

/** All step URL helpers indexed by step. */
export const STEP_URL: Record<WizardStep, string> = {
  capture: '/tickets/new/capture',
  review: '/tickets/new/review',
  participants: '/tickets/new/participants',
  assign: '/tickets/new/assign',
  summary: '/tickets/new/summary',
}

/**
 * Draft blocker condition helpers — used with `useBlocker` to detect
 * unsaved changes per the spec's useBlocker Config table.
 *
 * Each function receives the current draft ticket and returns true when
 * the user has unsaved work that would be lost on navigation away.
 */
export const hasUnsavedCaptureData = (draft: Ticket): boolean =>
  Boolean(draft.image) || (draft.items?.length ?? 0) > 0

export const hasUnsavedEdits = (draft: Ticket): boolean =>
  (draft.items?.length ?? 0) > 0

export const hasUnsavedParticipants = (draft: Ticket): boolean =>
  (draft.participantIds?.length ?? 0) > 0

export const hasUnsavedAssignments = (draft: Ticket): boolean =>
  draft.items?.some((it) => it.assignments.length > 0) ?? false

export const hasUnsavedSummary = (_draft: Ticket): boolean => true

/** Map of step → blocker check function. */
export const BLOCKER_CHECKS = {
  capture: hasUnsavedCaptureData,
  review: hasUnsavedEdits,
  participants: hasUnsavedParticipants,
  assign: hasUnsavedAssignments,
  summary: hasUnsavedSummary,
} as const

/** User-facing blocker messages per step. */
export const BLOCKER_MESSAGES = {
  capture: '¿Descartar los items escaneados?',
  review: '¿Descartar los cambios en los items?',
  participants: '¿Descartar la selección de participantes?',
  assign: '¿Descartar las asignaciones realizadas?',
  summary: '¿Descartar y volver al inicio?',
} as const