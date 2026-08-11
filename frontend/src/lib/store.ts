'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  AppData,
  Person,
  Group,
  Ticket,
  TicketItem,
  TicketDiscount,
  ID,
} from './types'
import {
  AVATAR_COLORS,
  getInitials,
  genId,
  calcSubtotal,
  calcTaxAmount,
  calcTipAmount,
} from './calc'

interface AppState extends AppData {
  /**
   * ID of the active draft ticket used by the New-Ticket wizard.
   * Persisted so refresh on a wizard step restores the same draft.
   * Cleared when the wizard completes or the draft is discarded.
   */
  draftTicketId: ID | null
  /**
   * Set the active draft ticket ID (wizard entry).
   */
  setDraftTicketId: (id: ID) => void
  /**
   * Clear the active draft ticket ID (wizard exit).
   */
  clearDraftTicketId: () => void

  // ---------- Personas ----------
  addPerson: (name: string) => Person
  updatePerson: (id: ID, patch: Partial<Person>) => void
  deletePerson: (id: ID) => void

  // ---------- Grupos ----------
  addGroup: (name: string, memberIds?: ID[]) => Group
  updateGroup: (id: ID, patch: Partial<Group>) => void
  deleteGroup: (id: ID) => void
  addMemberToGroup: (groupId: ID, personId: ID) => void
  removeMemberFromGroup: (groupId: ID, personId: ID) => void

  // ---------- Tickets ----------
  addTicket: (partial: Partial<Ticket>) => Ticket
  updateTicket: (id: ID, patch: Partial<Ticket>) => void
  deleteTicket: (id: ID) => void

  // ---------- Items ----------
  addTicketItem: (ticketId: ID, item?: Partial<TicketItem>) => void
  updateTicketItem: (ticketId: ID, itemId: ID, patch: Partial<TicketItem>) => void
  deleteTicketItem: (ticketId: ID, itemId: ID) => void

  // ---------- Descuentos ----------
  addTicketDiscount: (ticketId: ID, discount?: Partial<TicketDiscount>) => void
  updateTicketDiscount: (ticketId: ID, discountId: ID, patch: Partial<TicketDiscount>) => void
  deleteTicketDiscount: (ticketId: ID, discountId: ID) => void

  // ---------- Recalc ----------
  recalcTicket: (ticketId: ID) => void

  // ---------- Perfil / ajustes ----------
  updateProfile: (patch: Partial<AppData['profile']>) => void
  updateSettings: (patch: Partial<AppData['settings']>) => void
  updateFeatureFlags: (patch: Partial<AppData['featureFlags']>) => void
  resetAll: () => void

  // ---------- Backup ----------
  exportData: () => string
  importData: (json: string) => boolean
}

const DEFAULT_DATA: AppData = {
  people: [],
  groups: [],
  tickets: [],
  profile: {
    name: '',
    hasAccount: false,
  },
  settings: {
    defaultTaxRate: 0.1, // 10% IVA
    defaultTipPercentage: 0,
    roundingMode: 'cents',
    preferredEngine: 'tesseract-ner',
  },
  featureFlags: {
    showOcrReview: true,
    verboseLogs: false,
    useMiniAgent: true,
  },
  version: 1,
}

function pickColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length]
}

/**
 * Minimal structural guard for backup payloads. Rejects non-objects and
 * payloads missing the core AppData shape (arrays people/groups/tickets,
 * objects profile/settings/featureFlags, number version). No zod — v1
 * contract keeps zero new dependencies.
 */
function isValidAppData(data: unknown): data is AppData {
  if (typeof data !== 'object' || data === null) return false
  const d = data as Record<string, unknown>
  return (
    Array.isArray(d.people) &&
    Array.isArray(d.groups) &&
    Array.isArray(d.tickets) &&
    typeof d.profile === 'object' &&
    d.profile !== null &&
    typeof d.settings === 'object' &&
    d.settings !== null &&
    typeof d.featureFlags === 'object' &&
    d.featureFlags !== null &&
    typeof d.version === 'number'
  )
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_DATA,
      draftTicketId: null,
      setDraftTicketId: (id) => set({ draftTicketId: id }),
      clearDraftTicketId: () => set({ draftTicketId: null }),

      // ---------- Personas ----------
      addPerson: (name) => {
        const idx = get().people.length
        const person: Person = {
          id: genId(),
          name: name.trim(),
          color: pickColor(idx),
          initials: getInitials(name),
          createdAt: new Date().toISOString(),
        }
        set((s) => ({ people: [...s.people, person] }))
        return person
      },
      updatePerson: (id, patch) =>
        set((s) => ({
          people: s.people.map((p) =>
            p.id === id
              ? {
                  ...p,
                  ...patch,
                  initials: patch.name ? getInitials(patch.name) : p.initials,
                }
              : p
          ),
        })),
      deletePerson: (id) =>
        set((s) => ({
          people: s.people.filter((p) => p.id !== id),
          groups: s.groups.map((g) => ({
            ...g,
            memberIds: g.memberIds.filter((mid) => mid !== id),
          })),
          tickets: s.tickets.map((t) => ({
            ...t,
            participantIds: t.participantIds.filter((pid) => pid !== id),
            items: t.items.map((it) => ({
              ...it,
              assignments: it.assignments.filter((a) => a.personId !== id),
            })),
            paidBy: t.paidBy === id ? undefined : t.paidBy,
          })),
        })),

      // ---------- Grupos ----------
      addGroup: (name, memberIds = []) => {
        const idx = get().groups.length
        const group: Group = {
          id: genId(),
          name: name.trim(),
          color: pickColor(idx + 5),
          memberIds,
          createdAt: new Date().toISOString(),
        }
        set((s) => ({ groups: [...s.groups, group] }))
        return group
      },
      updateGroup: (id, patch) =>
        set((s) => ({
          groups: s.groups.map((g) => (g.id === id ? { ...g, ...patch } : g)),
        })),
      deleteGroup: (id) =>
        set((s) => ({ groups: s.groups.filter((g) => g.id !== id) })),
      addMemberToGroup: (groupId, personId) =>
        set((s) => ({
          groups: s.groups.map((g) =>
            g.id === groupId && !g.memberIds.includes(personId)
              ? { ...g, memberIds: [...g.memberIds, personId] }
              : g
          ),
        })),
      removeMemberFromGroup: (groupId, personId) =>
        set((s) => ({
          groups: s.groups.map((g) =>
            g.id === groupId
              ? { ...g, memberIds: g.memberIds.filter((m) => m !== personId) }
              : g
          ),
        })),

      // ---------- Tickets ----------
      addTicket: (partial) => {
        const now = new Date().toISOString()
        const settings = get().settings
        const items = partial.items ?? []
        const discounts = partial.discounts ?? []
        // Calcular subtotal real: items - descuentos
        const itemsSubtotal = calcSubtotal(items)
        const discountsTotal = discounts.reduce((s, d) => {
          if (d.mode === 'percentage') {
            return s + itemsSubtotal * ((d.percentage || 0) / 100)
          }
          return s + (d.amount || 0)
        }, 0)
        const subtotal = partial.subtotal ?? Math.max(0, itemsSubtotal - discountsTotal)
        const taxRate = partial.taxRate ?? settings.defaultTaxRate
        const taxMode = partial.taxMode ?? 'added'
        const taxAmount =
          partial.taxAmount ?? calcTaxAmount(subtotal, taxRate, taxMode)
        const tipMode = partial.tipMode ?? 'none'
        const tipPercentage = partial.tipPercentage ?? settings.defaultTipPercentage
        const tipAmount =
          partial.tipAmount ??
          calcTipAmount(subtotal, tipMode, tipPercentage, 0)
        const ticket: Ticket = {
          id: genId(),
          title: partial.title ?? 'Nuevo ticket',
          date: partial.date ?? now,
          merchant: partial.merchant,
          image: partial.image,
          items,
          discounts,
          subtotal,
          taxRate,
          taxAmount,
          taxMode,
          tipMode,
          tipPercentage,
          tipAmount,
          tipDistribution: partial.tipDistribution ?? 'proportional',
          taxDistribution: partial.taxDistribution ?? 'proportional',
          participantIds: partial.participantIds ?? [],
          paidBy: partial.paidBy,
          status: partial.status ?? 'draft',
          createdAt: now,
          updatedAt: now,
        }
        set((s) => ({ tickets: [ticket, ...s.tickets] }))
        return ticket
      },
      updateTicket: (id, patch) =>
        set((s) => ({
          tickets: s.tickets.map((t) =>
            t.id === id
              ? { ...t, ...patch, updatedAt: new Date().toISOString() }
              : t
          ),
        })),
      deleteTicket: (id) =>
        set((s) => ({
          tickets: s.tickets.filter((t) => t.id !== id),
        })),

      // ---------- Items ----------
      updateTicketItem: (ticketId, itemId, patch) =>
        set((s) => ({
          tickets: s.tickets.map((t) =>
            t.id === ticketId
              ? {
                  ...t,
                  items: t.items.map((it) =>
                    it.id === itemId ? { ...it, ...patch } : it
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : t
          ),
        })),
      addTicketItem: (ticketId, item) => {
        const newItem: TicketItem = {
          id: genId(),
          name: item?.name ?? 'Nuevo item',
          quantity: item?.quantity ?? 1,
          unitPrice: item?.unitPrice ?? 0,
          mode: item?.mode ?? 'single',
          assignments: item?.assignments ?? [],
        }
        set((s) => ({
          tickets: s.tickets.map((t) =>
            t.id === ticketId
              ? {
                  ...t,
                  items: [...t.items, newItem],
                  updatedAt: new Date().toISOString(),
                }
              : t
          ),
        }))
        return
      },
      deleteTicketItem: (ticketId, itemId) =>
        set((s) => ({
          tickets: s.tickets.map((t) =>
            t.id === ticketId
              ? {
                  ...t,
                  items: t.items.filter((it) => it.id !== itemId),
                  updatedAt: new Date().toISOString(),
                }
              : t
          ),
        })),

      // ---------- Descuentos ----------
      addTicketDiscount: (ticketId, discount) => {
        const newDiscount: TicketDiscount = {
          id: genId(),
          name: discount?.name ?? 'Descuento',
          mode: discount?.mode ?? 'amount',
          amount: discount?.amount ?? 0,
          percentage: discount?.percentage,
        }
        set((s) => ({
          tickets: s.tickets.map((t) =>
            t.id === ticketId
              ? {
                  ...t,
                  discounts: [...(t.discounts || []), newDiscount],
                  updatedAt: new Date().toISOString(),
                }
              : t
          ),
        }))
      },
      updateTicketDiscount: (ticketId, discountId, patch) =>
        set((s) => ({
          tickets: s.tickets.map((t) =>
            t.id === ticketId
              ? {
                  ...t,
                  discounts: (t.discounts || []).map((d) =>
                    d.id === discountId ? { ...d, ...patch } : d
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : t
          ),
        })),
      deleteTicketDiscount: (ticketId, discountId) =>
        set((s) => ({
          tickets: s.tickets.map((t) =>
            t.id === ticketId
              ? {
                  ...t,
                  discounts: (t.discounts || []).filter((d) => d.id !== discountId),
                  updatedAt: new Date().toISOString(),
                }
              : t
          ),
        })),

      // ---------- Recalc ----------
      recalcTicket: (ticketId) => {
        const state = get()
        const ticket = state.tickets.find((t) => t.id === ticketId)
        if (!ticket) return
        const itemsSubtotal = calcSubtotal(ticket.items)
        // Calcular descuentos: porcentaje sobre items, importe directo
        const discountsTotal = (ticket.discounts || []).reduce((s, d) => {
          if (d.mode === 'percentage') {
            return s + itemsSubtotal * ((d.percentage || 0) / 100)
          }
          return s + (d.amount || 0)
        }, 0)
        const subtotal = Math.max(0, itemsSubtotal - discountsTotal)
        const taxAmount = calcTaxAmount(subtotal, ticket.taxRate, ticket.taxMode)
        let tipAmount = ticket.tipAmount
        if (ticket.tipMode === 'percentage') {
          tipAmount = calcTipAmount(
            subtotal,
            ticket.tipMode,
            ticket.tipPercentage,
            0
          )
        } else if (ticket.tipMode === 'none') {
          tipAmount = 0
        }
        set((s) => ({
          tickets: s.tickets.map((t) =>
            t.id === ticketId
              ? {
                  ...t,
                  subtotal,
                  taxAmount,
                  tipAmount,
                  updatedAt: new Date().toISOString(),
                }
              : t
          ),
        }))
      },

      // ---------- Perfil / ajustes ----------
      updateProfile: (patch) =>
        set((s) => ({ profile: { ...s.profile, ...patch } })),
      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),
      updateFeatureFlags: (patch) =>
        set((s) => ({ featureFlags: { ...s.featureFlags, ...patch } })),
      resetAll: () =>
        set({
          ...DEFAULT_DATA,
          draftTicketId: null,
        }),

      // ---------- Backup ----------
      exportData: () =>
        JSON.stringify({
          people: get().people,
          groups: get().groups,
          tickets: get().tickets,
          profile: get().profile,
          settings: get().settings,
          featureFlags: get().featureFlags,
          version: get().version,
        }),
      importData: (json) => {
        try {
          const parsed: unknown = JSON.parse(json)
          if (!isValidAppData(parsed)) return false
          set({
            people: parsed.people,
            groups: parsed.groups,
            tickets: parsed.tickets,
            profile: { ...DEFAULT_DATA.profile, ...parsed.profile },
            settings: { ...DEFAULT_DATA.settings, ...parsed.settings },
            featureFlags: { ...DEFAULT_DATA.featureFlags, ...parsed.featureFlags },
            version: parsed.version,
            draftTicketId: null,
          })
          return true
        } catch {
          return false
        }
      },
    }),
    {
      name: 'spliteat-app-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        people: state.people,
        groups: state.groups,
        tickets: state.tickets,
        profile: state.profile,
        settings: state.settings,
        featureFlags: state.featureFlags,
        version: state.version,
        // Persistir draftTicketId para que refresh en wizard restaure el draft
        draftTicketId: state.draftTicketId,
      }),
      // Migración: asegura que tickets antiguos tengan el campo discounts
      // y que cada descuento tenga mode (amount/percentage)
      merge: (persistedState: any, currentState: AppState) => {
        const merged = { ...currentState, ...(persistedState || {}) }
        // Asegurar draftTicketId tiene forma correcta (null si undefined en persistencia)
        if (merged.draftTicketId === undefined) {
          merged.draftTicketId = null
        }
        if (Array.isArray(merged.tickets)) {
          merged.tickets = merged.tickets.map((t: any) => ({
            ...t,
            discounts: Array.isArray(t.discounts)
              ? t.discounts.map((d: any) => ({
                  ...d,
                  mode: d.mode ?? 'amount',
                  percentage: d.percentage,
                }))
              : [],
          }))
        }
        // Migrar settings: añadir preferredEngine si no existe
        // Default: tesseract-ner (OCR + IA) para que el usuario tenga algo
        // funcional desde el principio
        if (merged.settings && !merged.settings.preferredEngine) {
          merged.settings = {
            ...merged.settings,
            preferredEngine: 'tesseract-ner',
          }
        }
        // Migrar featureFlags: añadir si no existe
        if (!merged.featureFlags) {
          merged.featureFlags = {
            showOcrReview: true,
            verboseLogs: false,
            useMiniAgent: true,
          }
        }
        return merged
      },
    }
  )
)

/** Hook de conveniencia para obtener una persona por id. */
export function usePerson(id?: ID): Person | undefined {
  return useAppStore((s) => s.people.find((p) => p.id === id))
}

/** Hook de conveniencia para obtener un ticket por id. */
export function useTicket(id?: ID): Ticket | undefined {
  return useAppStore((s) => s.tickets.find((t) => t.id === id))
}

/** Hook de conveniencia para obtener un grupo por id. */
export function useGroup(id?: ID): Group | undefined {
  return useAppStore((s) => s.groups.find((g) => g.id === id))
}
