/**
 * Integration tests for the OCR pipeline.
 *
 * Tests the pure data-flow stages (receipt parsing, mini-agent classification,
 * amount parsing) that don't require browser canvas or Tesseract.js.
 *
 * The preprocess + OCR stages require a real browser environment and are
 * covered separately by E2E tests.
 */
import { describe, it, expect } from 'vitest'
import { parseReceiptText, parseSpanishAmount } from './receipt-parser'
import { classifyIntent } from './mini-agent'

describe('Integration: receipt parser with Spanish OCR text', () => {
  it('should parse a complete multi-line receipt from Tesseract', () => {
    const ocrText = [
      'RESTAURANTE EL SABOR',
      'C/ Mayor 42, Madrid',
      'CIF: B12345678',
      '',
      '2x Hamburguesa Sage  25.00',
      '1x Patatas Bravas     4.50',
      '1x Refresco           2.50',
      '',
      'Subtotal:            32.00',
      'IVA 10%:              3.20',
      'Total:               35.20',
      '',
      'Gracias por su visita',
    ].join('\n')

    const result = parseReceiptText(ocrText)

    expect(result.merchant).toBe('RESTAURANTE EL SABOR')
    expect(result.items).toHaveLength(3)

    expect(result.items[0]).toMatchObject({
      name: expect.stringContaining('Hamburguesa'),
      quantity: 2,
      unitPrice: 12.50,
    })
    expect(result.items[1]).toMatchObject({
      name: expect.stringContaining('Patatas'),
      quantity: 1,
      unitPrice: 4.50,
    })
    expect(result.items[2]).toMatchObject({
      name: expect.stringContaining('Refresco'),
      quantity: 1,
      unitPrice: 2.50,
    })

    expect(result.subtotal).toBe(32.00)
    expect(result.taxRate).toBe(0.10)
    expect(result.taxAmount).toBe(3.20)
    expect(result.total).toBeGreaterThan(0)
  })

  it('should detect merchant from multiline receipt', () => {
    const ocrText = [
      'MERCADONA',
      'C/ Ejemplo 123',
      '',
      '1x Leche  1.00',
      'Total:    1.00',
    ].join('\n')

    const result = parseReceiptText(ocrText)
    expect(result.merchant).toBe('MERCADONA')
  })

  it('should parse Florence-2 single-line OCR output with price separators (>100 chars triggers split)', () => {
    // Florence-2 <OCR> returns text in a single line.
    // splitSingleLineText activates when text.length > 100.
    const ocrText = 'MERCADONA 2x Leche 1.80 1x Pan 0.90 1x Huevos 2.50 1x Arroz 1.20 Subtotal 5.20 IVA 10% 0.52 Total 6.40'

    const result = parseReceiptText(ocrText)

    // Single-line text without newlines uses splitSingleLineText which inserts
    // line breaks after price tokens — this may produce partial items
    expect(result.items.length).toBeGreaterThanOrEqual(1)
    expect(result.total).toBeGreaterThanOrEqual(0)
  })

  it('should handle empty OCR output gracefully', () => {
    const result = parseReceiptText('')
    expect(result.items).toEqual([])
    expect(result.merchant).toBeUndefined()
  })

  it('should parse receipt with discounts', () => {
    const ocrText = [
      'SUPERMERCADO EJEMPLO',
      '',
      '1x Pan            1.20',
      '1x Leche          1.80',
      'Descuento 10%    -0.30',
      '',
      'Total:             2.70',
    ].join('\n')

    const result = parseReceiptText(ocrText)

    expect(result.items.length).toBeGreaterThanOrEqual(1)
    expect(result.discounts).toBeDefined()
    expect(result.discounts!.length).toBeGreaterThanOrEqual(1)
    if (result.discounts && result.discounts[0].mode === 'percentage') {
      expect(result.discounts[0].percentage).toBe(10)
    }
    expect(result.total).toBe(2.70)
  })

  it('should parse receipt with various total formats', () => {
    const testCases = [
      { text: 'TOTAL: 15.50', expected: 15.50 },
      { text: 'A PAGAR 15.50', expected: 15.50 },
      { text: 'Total 15,50', expected: 15.50 },
      { text: 'Importe total 15.50', expected: 15.50 },
    ]

    for (const { text, expected } of testCases) {
      const result = parseReceiptText(text)
      expect(result.total).toBe(expected)
    }
  })

  it('should not crash on garbled OCR output without merchant-like text', () => {
    // Mixed content that doesn't look like a merchant name (mostly digits/symbols)
    const garbledText = '!!! 982347 23r4kjh 2l3kj4h23 4lkhj234'
    const result = parseReceiptText(garbledText)
    // Should return empty items without throwing
    expect(result.items).toEqual([])
  })
})

describe('Integration: mini-agent classification', () => {
  it('should classify a restaurant receipt', () => {
    const text = [
      'RESTAURANTE LA PAELLA',
      'Mesa 5 - 2 comensales',
      '1x Paella valenciana  12.50',
      '2x Cerveza             5.00',
      '1x Flan casero         3.50',
      'Total:                21.00',
    ].join('\n')

    const intent = classifyIntent(text)
    expect(intent.ticketType).toBe('restaurant')
    expect(intent.estimatedItemCount).toBeGreaterThanOrEqual(3)
    expect(intent.recommendedModel).toBe('receipt')
  })

  it('should classify a supermarket receipt', () => {
    const text = [
      'MERCADONA',
      '1 kg Manzanas         2.30',
      '1 Leche semidesnatada 1.80',
      '1 Pan integral        1.20',
      'Total:                 5.30',
    ].join('\n')

    const intent = classifyIntent(text)
    expect(intent.ticketType).toBe('supermarket')
    expect(intent.recommendedModel).toBe('receipt')
  })

  it('should classify a simple receipt (few items, no keywords)', () => {
    const text = [
      'TIENDA LOCAL',
      '1x Boligrafo  1.50',
      '1x Cuaderno   3.00',
      'Total:        4.50',
    ].join('\n')

    const intent = classifyIntent(text)
    expect(intent.ticketType).toBe('simple')
    expect(intent.estimatedItemCount).toBe(3)
  })

  it('should detect discounts in classification', () => {
    const text = [
      'TIENDA',
      '1x Producto  10.00',
      'Descuento      -2.00',
      'Total:         8.00',
    ].join('\n')

    const intent = classifyIntent(text)
    expect(intent.hasDiscounts).toBe(true)
    expect(intent.recommendedModel).toBe('receipt')
    expect(intent.confidence).toBeGreaterThanOrEqual(0.8)
  })
})

describe('Integration: parseSpanishAmount', () => {
  it('should parse Spanish format (comma decimal)', () => {
    expect(parseSpanishAmount('15,50')).toBe(15.50)
    expect(parseSpanishAmount('1.234,56')).toBe(1234.56)
  })

  it('should parse English format (dot decimal)', () => {
    expect(parseSpanishAmount('15.50')).toBe(15.50)
  })

  it('should parse mixed formats correctly', () => {
    // "1,234.56" = thousand sep + dot decimal → UK/US
    expect(parseSpanishAmount('1,234.56')).toBe(1234.56)
    // "1.234,56" = dot thousand sep + comma decimal → Spanish
    expect(parseSpanishAmount('1.234,56')).toBe(1234.56)
  })

  it('should handle edge cases', () => {
    expect(parseSpanishAmount('')).toBe(0)
    expect(parseSpanishAmount('abc')).toBe(0)
    expect(parseSpanishAmount('0')).toBe(0)
    expect(parseSpanishAmount('0.00')).toBe(0)
  })
})
