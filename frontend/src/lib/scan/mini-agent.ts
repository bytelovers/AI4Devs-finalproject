/**
 * Mini-agente: clasifica la intencionalidad del escaneo y recomienda
 * qué modelo NER usar.
 *
 * Estrategia:
 *   1. Ejecutar Tesseract rápido (ya hecho) para extraer texto crudo
 *   2. Analizar heurísticamente el texto:
 *      - ¿Tiene descuentos? → modelo 'receipt'
 *      - ¿Es un restaurante (palabras como "paella", "café", "menú")? → 'receipt'
 *      - ¿Es un supermercado (muchos items, palabras como "kg", "lata")? → 'general'
 *      - ¿Ticket simple (pocos items, sin descuentos)? → 'general' (más ligero)
 *   3. Devolver recomendación + confianza
 *
 * No usa ML: es puramente heurístico (rápido, <10ms, 0MB RAM).
 * En el futuro se puede sustituir por un modelo MobileBERT (~5MB).
 */

import type { NerModelType } from './ner-engine'

export interface IntentClassification {
  /** Modelo NER recomendado. */
  recommendedModel: NerModelType
  /** Confianza 0-1. */
  confidence: number
  /** Tipo de ticket detectado. */
  ticketType: 'restaurant' | 'supermarket' | 'pharmacy' | 'generic' | 'simple'
  /** Si el ticket tiene descuentos. */
  hasDiscounts: boolean
  /** Número aproximado de items. */
  estimatedItemCount: number
  /** Razón de la recomendación (para debug). */
  reason: string
}

// Palabras clave por tipo de establecimiento
const RESTAURANT_KEYWORDS = [
  'paella', 'café', 'cafe', 'menú', 'menu', 'plato', 'ración', 'racion',
  'tapas', 'tapa', 'cerveza', 'vino', 'postre', 'entrante', 'ensalada',
  'burger', 'hamburguesa', 'pizza', 'pasta', 'sopa', 'flan', 'arroz',
  'camarero', 'mesa', 'comensales', 'bar', 'restaurante', 'tapeo',
  'aperitivo', 'digestivo', 'copa', 'cubata', 'gin', 'tonic',
]

const SUPERMARKET_KEYWORDS = [
  'kg', 'lata', 'botella', 'pack', 'unidad', 'ud', 'gramos', 'gr',
  'mercadona', 'carrefour', 'dia', 'lidl', 'alcampo', 'eroski',
  'yogur', 'leche', 'pan', 'huevos', 'aceite', 'azúcar', 'azucar',
  'detergente', 'papel', 'higiénico', 'higienico', 'gel', 'champú',
  'congelado', 'fresco', 'charcutería', 'charcuteria', 'pescadería',
]

const PHARMACY_KEYWORDS = [
  'paracetamol', 'ibuprofeno', 'aspirina', 'farmacia', 'medicamento',
  'receta', 'jarabe', 'pastilla', 'comprimido', 'pomada', 'crema',
  'vitamina', 'suplemento', 'termómetro', 'termometro',
]

const DISCOUNT_KEYWORDS = [
  'descuento', 'dto', 'oferta', 'promoción', 'promocion', 'cupón', 'cupon',
  'bono', 'vale', 'ahorro', '2x1', '3x2', 'rebaja',
]

/**
 * Clasifica el texto del ticket y recomienda qué modelo NER usar.
 * Es heurístico puro: <10ms, 0MB RAM extra.
 */
export function classifyIntent(rawText: string): IntentClassification {
  const textLower = rawText.toLowerCase()

  // Contar items aproximado (líneas con precios)
  const lines = rawText.split(/\r?\n/).filter((l) => l.trim().length > 0)
  const priceLines = lines.filter((l) => /\d{1,4}[.,]\d{1,2}/.test(l))
  const estimatedItemCount = priceLines.length

  // Detectar descuentos
  const hasDiscounts = DISCOUNT_KEYWORDS.some((kw) => textLower.includes(kw))

  // Detectar tipo de establecimiento
  const restaurantScore = RESTAURANT_KEYWORDS.filter((kw) =>
    textLower.includes(kw)
  ).length
  const supermarketScore = SUPERMARKET_KEYWORDS.filter((kw) =>
    textLower.includes(kw)
  ).length
  const pharmacyScore = PHARMACY_KEYWORDS.filter((kw) =>
    textLower.includes(kw)
  ).length

  let ticketType: IntentClassification['ticketType']
  let reason: string

  if (pharmacyScore >= 2) {
    ticketType = 'pharmacy'
    reason = `Detectadas ${pharmacyScore} palabras de farmacia`
  } else if (restaurantScore >= 2) {
    ticketType = 'restaurant'
    reason = `Detectadas ${restaurantScore} palabras de restaurante`
  } else if (supermarketScore >= 2) {
    ticketType = 'supermarket'
    reason = `Detectadas ${supermarketScore} palabras de supermercado`
  } else if (estimatedItemCount <= 3 && !hasDiscounts) {
    ticketType = 'simple'
    reason = `Ticket simple (${estimatedItemCount} items, sin descuentos)`
  } else {
    ticketType = 'generic'
    reason = 'Tipo genérico, sin palabras clave claras'
  }

  // Recomendar modelo
  let recommendedModel: NerModelType
  let confidence: number

  if (ticketType === 'restaurant' || ticketType === 'supermarket' || hasDiscounts) {
    // Tickets complejos → modelo receipt (especializado)
    recommendedModel = 'receipt'
    confidence = hasDiscounts ? 0.85 : 0.7
    if (hasDiscounts) reason += ' + descuentos detectados → modelo especializado'
  } else {
    // Tickets simples o farmacia → modelo general (suficiente)
    recommendedModel = 'general'
    confidence = ticketType === 'simple' ? 0.8 : 0.6
  }

  return {
    recommendedModel,
    confidence,
    ticketType,
    hasDiscounts,
    estimatedItemCount,
    reason,
  }
}
