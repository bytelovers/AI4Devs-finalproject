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
  ViewName,
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
  // Navegación SPA
  currentView: ViewName
  activeTicketId?: ID
  activeGroupId?: ID
  // Acciones de navegación
  setView: (v: ViewName) => void
  openTicket: (id: ID) => void
  openGroup: (id: ID) => void
  // Acciones de personas
  addPerson: (name: string) => Person
  updatePerson: (id: ID, patch: Partial<Person>) => void
  deletePerson: (id: ID) => void
  // Acciones de grupos
  addGroup: (name: string, memberIds?: ID[]) => Group
  updateGroup: (id: ID, patch: Partial<Group>) => void
  deleteGroup: (id: ID) => void
  addMemberToGroup: (groupId: ID, personId: ID) => void
  removeMemberFromGroup: (groupId: ID, personId: ID) => void
  // Acciones de tickets
  addTicket: (partial: Partial<Ticket>) => Ticket
  updateTicket: (id: ID, patch: Partial<Ticket>) => void
  deleteTicket: (id: ID) => void
  // Items del ticket
  updateTicketItem: (ticketId: ID, itemId: ID, patch: Partial<TicketItem>) => void
  addTicketItem: (ticketId: ID, item?: Partial<TicketItem>) => void
  deleteTicketItem: (ticketId: ID, itemId: ID) => void
  // Descuentos del ticket
  addTicketDiscount: (ticketId: ID, discount?: Partial<TicketDiscount>) => void
  updateTicketDiscount: (ticketId: ID, discountId: ID, patch: Partial<TicketDiscount>) => void
  deleteTicketDiscount: (ticketId: ID, discountId: ID) => void
  // Recalcular totales
  recalcTicket: (ticketId: ID) => void
  // Perfil y ajustes
  updateProfile: (patch: Partial<AppData['profile']>) => void
  updateSettings: (patch: Partial<AppData['settings']>) => void
  updateFeatureFlags: (patch: Partial<AppData['featureFlags']>) => void
  // Reset total
  resetAll: () => void
  // Flag temporal para modo manual
  _startManual: boolean
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

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_DATA,
      currentView: 'home',
      // Flag temporal: si es true, NewTicketView empieza en modo manual (sin cámara)
      _startManual: false,

      // ---------- Navegación ----------
      setView: (v) => set({ currentView: v }),
      openTicket: (id) =>
        set({ currentView: 'ticket-detail', activeTicketId: id }),
      openGroup: (id) =>
        set({ currentView: 'group-detail', activeGroupId: id }),

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
          currentView:
            s.activeTicketId === id ? 'home' : s.currentView,
          activeTicketId:
            s.activeTicketId === id ? undefined : s.activeTicketId,
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
          currentView: 'home',
        }),
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
        // NO persistir _startManual (es temporal)
      }),
      // Migración: asegura que tickets antiguos tengan el campo discounts
      // y que cada descuento tenga mode (amount/percentage)
      merge: (persistedState: any, currentState: AppState) => {
        const merged = { ...currentState, ...(persistedState || {}) }
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
