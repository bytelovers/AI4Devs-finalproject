import { describe, it, expect } from 'vitest'
import { mergeMultiSectionOcrResults } from './multiSectionMerger'
import type { SectionOcrPayload, QualityAssessmentSummary } from './types'

describe('Multi-Section OCR Merger Engine (Phase 4)', () => {
  const sampleQualitySummary: QualityAssessmentSummary = {
    laplacianVariance: 180,
    brightnessScore: 120,
    contrastRatio: 45,
    status: 'optimal',
  }

  describe('Task 4.1: Section Ordering, Merchant Header & Totals Isolation', () => {
    it('returns empty result when no payloads are provided', () => {
      const result = mergeMultiSectionOcrResults([])
      expect(result.items).toEqual([])
      expect(result.rawTextCombined).toBe('')
      expect(result.confidence).toBe(0)
      expect(result.sectionCount).toBe(0)
    })

    it('sorts payloads by section order and isolates merchant header from Section 1 and total from trailing section', () => {
      const payloads: SectionOcrPayload[] = [
        {
          sectionId: 'sec_footer',
          order: 2,
          scanResult: {
            items: [{ name: 'Pan de Molde', quantity: 1, unitPrice: 2.5 }],
            merchant: 'Supermercado Ignorado',
            subtotal: 10.0,
            taxAmount: 2.1,
            total: 12.1,
            engine: 'tesseract-ner',
            confidence: 0.85,
            rawText: 'Total: 12.10',
          },
        },
        {
          sectionId: 'sec_header',
          order: 1,
          scanResult: {
            items: [{ name: 'Leche Desnatada', quantity: 2, unitPrice: 1.2 }],
            merchant: 'Mercadona S.A.',
            date: '2026-07-25',
            subtotal: 99.0, // should be overridden by footer section
            total: 99.0,
            engine: 'tesseract-ner',
            confidence: 0.95,
            rawText: 'Mercadona S.A. 25/07/2026',
          },
        },
      ]

      const result = mergeMultiSectionOcrResults(payloads, sampleQualitySummary)

      // Section order sort: header (order 1) first, footer (order 2) second
      expect(result.sectionCount).toBe(2)
      expect(result.merchant).toBe('Mercadona S.A.')
      expect(result.date).toBe('2026-07-25')

      // Trailing section total isolation
      expect(result.subtotal).toBe(10.0)
      expect(result.taxAmount).toBe(2.1)
      expect(result.total).toBe(12.1)

      // Average confidence calculation
      expect(result.confidence).toBeCloseTo(0.9, 2)
      expect(result.qualitySummary).toEqual(sampleQualitySummary)
    })
  })

  describe('Task 4.2: Duplicate Line Item Deduplication & Raw Text Combining', () => {
    it('deduplicates overlapping line items across section boundaries by normalized key match', () => {
      const payloads: SectionOcrPayload[] = [
        {
          sectionId: 'sec_1',
          order: 1,
          scanResult: {
            items: [
              { name: 'Manzanas Rallas', quantity: 1, unitPrice: 3.0 },
              { name: 'Aceite de Oliva', quantity: 1, unitPrice: 8.5 },
            ],
            engine: 'tesseract-ner',
            rawText: 'Manzanas Rallas\nAceite de Oliva',
          },
        },
        {
          sectionId: 'sec_2',
          order: 2,
          scanResult: {
            items: [
              // Overlapping duplicate from crop overlap
              { name: 'Aceite de Oliva ', quantity: 1, unitPrice: 8.5 },
              { name: 'Queso Manchego', quantity: 2, unitPrice: 4.0 },
            ],
            engine: 'tesseract-ner',
            rawText: 'Aceite de Oliva\nQueso Manchego',
          },
        },
      ]

      const result = mergeMultiSectionOcrResults(payloads)

      // Manzanas, Aceite de Oliva (deduplicated), Queso Manchego
      expect(result.items.length).toBe(3)
      expect(result.items[0].name).toBe('Manzanas Rallas')
      expect(result.items[1].name).toBe('Aceite de Oliva')
      expect(result.items[2].name).toBe('Queso Manchego')
      expect(result.rawTextCombined).toContain('Manzanas Rallas')
      expect(result.rawTextCombined).toContain('Queso Manchego')
    })
  })
})
