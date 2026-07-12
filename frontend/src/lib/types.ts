// Tipos centrales de la app SplitEat

export type ID = string

/** Una persona (contacto). Puede pertenecer a uno o varios grupos. */
export interface Person {
  id: ID
  name: string
  /** Color de avatar (hex). Se asigna automáticamente. */
  color: string
  /** Iniciales calculadas a partir del nombre. */
  initials: string
  createdAt: string
}

/** Grupo persistente de personas (ej. "Piso", "Oficina"). */
export interface Group {
  id: ID
  name: string
  /** Color del icono del grupo. */
  color: string
  /** IDs de personas que pertenecen al grupo. */
  memberIds: ID[]
  createdAt: string
}

/** Modo de asignación de un item a personas. */
export type AssignmentMode =
  | 'single' // Una sola persona
  | 'shared' // Varias personas a partes iguales
  | 'weighted' // Varias personas con pesos personalizados

/** Una asignación individual dentro de un item. */
export interface ItemAssignment {
  personId: ID
  /** Peso relativo (0-1). Para 'shared' todos valen lo mismo. Para 'single' vale 1. */
  weight: number
}

/** Línea de un ticket (un producto/servicio). */
export interface TicketItem {
  id: ID
  name: string
  quantity: number
  /** Precio unitario en euros. */
  unitPrice: number
  mode: AssignmentMode
  assignments: ItemAssignment[]
}

/** Descuento aplicado al ticket. */
export interface TicketDiscount {
  id: ID
  name: string
  /** Modo del descuento: importe fijo o porcentaje. */
  mode: 'amount' | 'percentage'
  /** Importe descontado en euros (siempre positivo, cuando mode = 'amount'). */
  amount: number
  /** Porcentaje de descuento (0-100, cuando mode = 'percentage'). */
  percentage?: number
}

export type TaxMode = 'included' | 'added'
export type TipMode = 'fixed' | 'percentage' | 'none'
export type ExtraDistributionMode = 'proportional' | 'equal'

/** Estado del ticket. */
export type TicketStatus = 'draft' | 'balanced' | 'closed'

/** Ticket completo. */
export interface Ticket {
  id: ID
  title: string
  /** Fecha de la factura (ISO). */
  date: string
  /** Nombre del comercio/restaurante. */
  merchant?: string
  /** Imagen del ticket en base64 (data URL). */
  image?: string
  /** Items del ticket. */
  items: TicketItem[]
  /** Descuentos aplicados al ticket. */
  discounts: TicketDiscount[]
  /** Subtotal (suma de items - descuentos) en euros. */
  subtotal: number
  /** Porcentaje de IVA (ej. 0.10 = 10%). */
  taxRate: number
  /** Importe del IVA. */
  taxAmount: number
  /** Si el IVA ya está incluido en los precios de items o se añade al subtotal. */
  taxMode: TaxMode
  /** Modo de propina. */
  tipMode: TipMode
  /** Importe de propina. */
  tipAmount: number
  /** Porcentaje de propina (cuando tipMode = 'percentage'). */
  tipPercentage?: number
  /** Cómo se distribuye el IVA entre las personas. */
  taxDistribution: ExtraDistributionMode
  /** Cómo se distribuye la propina entre las personas. */
  tipDistribution: ExtraDistributionMode
  /** IDs de personas participantes en el ticket. */
  participantIds: ID[]
  /** ID de quien pagó el ticket (opcional, para mostrar quién adelantó). */
  paidBy?: ID
  status: TicketStatus
  createdAt: string
  updatedAt: string
}

/** Estado global persistido en localStorage. */
export interface AppData {
  people: Person[]
  groups: Group[]
  tickets: Ticket[]
  /** Perfil local (en modo guest). */
  profile: {
    name: string
    email?: string
    hasAccount: boolean
  }
  /** Ajustes. */
  settings: {
    defaultTaxRate: number
    defaultTipPercentage: number
    roundingMode: 'cents' | 'fifty' | 'unit'
    /** Motor de escaneo preferido. Default: 'tesseract-ner'. */
    preferredEngine: 'server' | 'tesseract' | 'tesseract-ner' | 'florence2'
  }
  /** Feature flags de desarrollador. */
  featureFlags: {
    /** Mostrar pantalla de revisión OCR antes del NER. Default: true. */
    showOcrReview: boolean
    /** Mostrar logs detallados en consola. Default: false. */
    verboseLogs: boolean
    /** Usar mini-agente para elegir modelo NER. Default: true. */
    useMiniAgent: boolean
  }
  version: number
}

/** Resultado del escaneo VLM. */
export interface ParsedTicket {
  merchant?: string
  date?: string
  items: Array<{
    name: string
    quantity: number
    unitPrice: number
  }>
  subtotal?: number
  taxRate?: number
  taxAmount?: number
  total?: number
  currency?: string
}

/** Vista activa de la SPA. */
export type ViewName =
  | 'home'
  | 'new-ticket'
  | 'ticket-detail'
  | 'contacts'
  | 'groups'
  | 'settings'
  | 'feature-flags'
  | 'group-detail'

/** Resultado del reparto para una persona. */
export interface PersonShare {
  personId: ID
  itemsTotal: number
  taxShare: number
  tipShare: number
  total: number
}
