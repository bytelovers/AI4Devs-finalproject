import type {
  SectionOcrPayload,
  MergedTicketScanResult,
  QualityAssessmentSummary,
} from './types'

/**
 * Multi-Section OCR Merger Engine.
 * Synthesizes OCR output from multiple section crops.
 *
 * Capabilities:
 * - Sequential ordering by section `order` field
 * - Header isolation (merchant and date from Section 1 / leading sections)
 * - Trailing totals isolation (subtotal, tax rate/amount, total from trailing Section N)
 * - Overlapping duplicate item deduplication by normalized key (${name.toLowerCase().trim()}_${unitPrice})
 * - Confidence averaging across sections
 * - Raw text aggregation
 * - Quality assessment summary attachment
 */
export function mergeMultiSectionOcrResults(
  payloads: SectionOcrPayload[],
  qualitySummary?: QualityAssessmentSummary
): MergedTicketScanResult {
  if (!payloads || payloads.length === 0) {
    return {
      items: [],
      rawTextCombined: '',
      confidence: 0,
      sectionCount: 0,
      qualitySummary,
    }
  }

  // 1. Sort payloads sequentially by section order
  const sortedPayloads = [...payloads].sort((a, b) => a.order - b.order)

  // 2. Isolate merchant header & date from Section 1 (or earliest available)
  let merchant: string | undefined
  let date: string | undefined

  for (const payload of sortedPayloads) {
    if (!merchant && payload.scanResult.merchant) {
      merchant = payload.scanResult.merchant
    }
    if (!date && payload.scanResult.date) {
      date = payload.scanResult.date
    }
    if (merchant && date) break
  }

  // 3. Isolate totals (subtotal, taxRate, taxAmount, total) from trailing section (or latest available)
  let subtotal: number | undefined
  let taxRate: number | undefined
  let taxAmount: number | undefined
  let total: number | undefined

  for (let i = sortedPayloads.length - 1; i >= 0; i--) {
    const res = sortedPayloads[i].scanResult
    if (total === undefined && res.total !== undefined) {
      total = res.total
    }
    if (subtotal === undefined && res.subtotal !== undefined) {
      subtotal = res.subtotal
    }
    if (taxRate === undefined && res.taxRate !== undefined) {
      taxRate = res.taxRate
    }
    if (taxAmount === undefined && res.taxAmount !== undefined) {
      taxAmount = res.taxAmount
    }
  }

  // 4. Item collection and deduplication across section overlaps
  const itemMap = new Map<
    string,
    { name: string; quantity: number; unitPrice: number }
  >()
  const items: Array<{ name: string; quantity: number; unitPrice: number }> = []

  for (const payload of sortedPayloads) {
    for (const item of payload.scanResult.items || []) {
      const cleanName = item.name.trim()
      const key = `${cleanName.toLowerCase()}_${item.unitPrice}`

      if (itemMap.has(key)) {
        const existing = itemMap.get(key)!
        existing.quantity = Math.max(existing.quantity, item.quantity)
      } else {
        const newItem = {
          name: cleanName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        }
        itemMap.set(key, newItem)
        items.push(newItem)
      }
    }
  }

  // 5. Confidence calculation (average of non-null confidence values)
  const confidences = sortedPayloads
    .map((p) => p.scanResult.confidence)
    .filter((c): c is number => typeof c === 'number')

  const averageConfidence =
    confidences.length > 0
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length
      : 0

  // 6. Raw text aggregation
  const rawTextCombined = sortedPayloads
    .map((p) => p.scanResult.rawText || '')
    .filter((txt) => txt.length > 0)
    .join('\n\n')

  return {
    merchant,
    date,
    items,
    subtotal,
    taxRate,
    taxAmount,
    total,
    rawTextCombined,
    confidence: Number(averageConfidence.toFixed(2)),
    sectionCount: sortedPayloads.length,
    qualitySummary,
  }
}
