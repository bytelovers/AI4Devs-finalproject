import { describe, it, expect } from 'vitest'
import { parseReceiptText, parseSpanishAmount } from './receipt-parser'
import type { ParsedReceipt } from './receipt-parser'

function firstItem(text: string): ParsedReceipt['items'][number] | undefined {
  return parseReceiptText(text).items[0]
}

describe('parseSpanishAmount', () => {
  it('parses two decimal places with comma', () => {
    expect(parseSpanishAmount('10,65')).toBe(10.65)
    expect(parseSpanishAmount('5,00')).toBe(5)
  })

  it('parses two decimal places with dot', () => {
    expect(parseSpanishAmount('10.65')).toBe(10.65)
  })

  it('parses one decimal digit as decimals (2,5 -> 2.5, not 25)', () => {
    expect(parseSpanishAmount('2,5')).toBe(2.5)
    expect(parseSpanishAmount('1.2')).toBe(1.2)
  })

  it('parses thousands separators correctly', () => {
    expect(parseSpanishAmount('1.200,00')).toBe(1200)
    expect(parseSpanishAmount('2.000,00')).toBe(2000)
    expect(parseSpanishAmount('1.000.000,00')).toBe(1000000)
  })

  it('parses three-digit dot as thousands (1200.000 -> 1200000)', () => {
    expect(parseSpanishAmount('1200.000')).toBe(1200000)
  })

  it('returns 0 for empty or invalid input', () => {
    expect(parseSpanishAmount('')).toBe(0)
    expect(parseSpanishAmount('abc')).toBe(0)
  })
})

describe('parseReceiptText baseline', () => {
  it('parses a single item with one price', () => {
    const r = parseReceiptText('Cerveza 5,00')
    expect(r.items).toHaveLength(1)
    expect(r.items[0]).toMatchObject({ name: 'Cerveza', quantity: 1, unitPrice: 5 })
    expect(r.subtotal).toBe(5)
  })

  it('parses quantity at start (2 Cerveza 5,00)', () => {
    expect(firstItem('2 Cerveza 5,00')).toMatchObject({ name: 'Cerveza', quantity: 2, unitPrice: 2.5 })
  })

  it('parses [cant, unit, total] with 3 prices', () => {
    const r = parseReceiptText('ENTRECOTTE 4,00 22,80 45,20')
    expect(r.items[0]).toMatchObject({ name: 'ENTRECOTTE', quantity: 4, unitPrice: 22.8 })
  })

  it('parses integer quantity as first of 3 tokens', () => {
    // La cantidad explícita "4" al inicio se respeta (antes se infería 2 de 45,20/22,80)
    expect(firstItem('ENTRECOTTE 4 22,80 45,20')).toMatchObject({ quantity: 4, unitPrice: 22.8 })
  })

  it('parses unit price as first value when explicit quantity (La Maquinista format)', () => {
    // Ticket real: "1 Santa Monica 10.46 0.0000 10.80" = [cantidad, unitPrice, dto%, total]
    // Con cantidad explícita al inicio, el primer precio es el unitPrice del item.
    expect(firstItem('1 Santa Monica 10.46 0.0000 10.80')).toMatchObject({
      name: 'Santa Monica',
      quantity: 1,
      unitPrice: 10.46,
    })
  })

  it('parses unit price as first value with multi-qty (2 Pepsi Max 3.30 0.300 6.60)', () => {
    // "2 Pepsi Max Refill 3.30 0.300 6.60" = [cantidad=2, unitPrice=3.30, dto%, total=6.60]
    expect(firstItem('2 Pepsi Max Refill 3.30 0.300 6.60')).toMatchObject({
      name: 'Pepsi Max Refill',
      quantity: 2,
      unitPrice: 3.3,
    })
  })
})

describe('parseReceiptText quantity detection', () => {
  it('detects quantity in the middle as integer', () => {
    expect(firstItem('Cerveza 2 5,00')).toMatchObject({ name: 'Cerveza', quantity: 2, unitPrice: 2.5 })
  })

  it('detects quantity in the middle as decimal', () => {
    expect(firstItem('Cerveza 2,00 5,00')).toMatchObject({ name: 'Cerveza', quantity: 2, unitPrice: 2.5 })
  })

  it('detects unicode multiplier (2×Cerveza)', () => {
    expect(firstItem('2×Cerveza 5,00')).toMatchObject({ name: 'Cerveza', quantity: 2, unitPrice: 2.5 })
  })

  it('detects asterisk multiplier (2*Cerveza)', () => {
    expect(firstItem('2*Cerveza 5,00')).toMatchObject({ name: 'Cerveza', quantity: 2, unitPrice: 2.5 })
  })

  it('detects spaced x (2 x Cerveza)', () => {
    expect(firstItem('2 x Cerveza 5,00')).toMatchObject({ name: 'Cerveza', quantity: 2, unitPrice: 2.5 })
  })

  it('detects UDS units (Cerveza 2 UDS 5,00)', () => {
    expect(firstItem('Cerveza 2 UDS 5,00')).toMatchObject({ name: 'Cerveza', quantity: 2, unitPrice: 2.5 })
  })

  it('detects explicit unidades (Cerveza 2 unidades 5,00)', () => {
    expect(firstItem('Cerveza 2 unidades 5,00')).toMatchObject({ name: 'Cerveza', quantity: 2, unitPrice: 2.5 })
  })

  it('detects quantity after name without clear separator', () => {
    expect(firstItem('Cerveza 2 5,00')).toMatchObject({ name: 'Cerveza', quantity: 2, unitPrice: 2.5 })
  })
})

describe('parseReceiptText price edge cases', () => {
  it('parses one-decimal price (2,5 -> 2.5)', () => {
    expect(firstItem('Cerveza 2,5')).toMatchObject({ name: 'Cerveza', quantity: 1, unitPrice: 2.5 })
  })

  it('parses integer-only price (Cerveza 5)', () => {
    expect(firstItem('Cerveza 5')).toMatchObject({ name: 'Cerveza', quantity: 1, unitPrice: 5 })
  })

  it('parses price per kg (Manzanas 2,49 €/kg)', () => {
    const item = firstItem('Manzanas 2,49 €/kg')
    expect(item).toMatchObject({ name: 'Manzanas', quantity: 1, unitPrice: 2.49 })
  })

  it('parses variable weight (0,350 kg Manzanas 2,49)', () => {
    expect(firstItem('0,350 kg Manzanas 2,49')).toMatchObject({ name: 'Manzanas', quantity: 0.35, unitPrice: 2.49 })
  })

  it('parses full scale line (Manzanas 2,49 €/kg 0,350 kg 0,87)', () => {
    expect(firstItem('Manzanas 2,49 €/kg 0,350 kg 0,87')).toMatchObject({ name: 'Manzanas', quantity: 0.35, unitPrice: 2.49 })
  })

  it('parses negative price / return (ANULADO Cerveza -5,00)', () => {
    expect(firstItem('ANULADO Cerveza -5,00')).toMatchObject({ name: 'ANULADO Cerveza', quantity: 1, unitPrice: 5 })
  })

  it('parses 3x2 offer notation (Brioche 3x2 2,00)', () => {
    expect(firstItem('Brioche 3x2 2,00')).toMatchObject({ name: 'Brioche', quantity: 1, unitPrice: 2 })
  })

  it('parses inline discount (Cerveza DTO -1,00 5,00)', () => {
    expect(firstItem('Cerveza DTO -1,00 5,00')).toMatchObject({ name: 'Cerveza', quantity: 1, unitPrice: 5 })
  })

  it('keeps high prices up to 9999 (TV 1.200,00)', () => {
    expect(firstItem('TV 1.200,00')).toMatchObject({ name: 'TV', quantity: 1, unitPrice: 1200 })
  })

  it('rejects prices above 9999', () => {
    const r = parseReceiptText('TV 10000,00')
    expect(r.items).toHaveLength(0)
  })
})

describe('parseReceiptText name handling', () => {
  it('keeps digits inside names (AGUA 33CL 1,20)', () => {
    expect(firstItem('AGUA 33CL 1,20')).toMatchObject({ name: 'AGUA', quantity: 1, unitPrice: 1.2 })
  })

  it('removes leading EAN code from name (8424536789012 Manzana 1,20)', () => {
    expect(firstItem('8424536789012 Manzana 1,20')).toMatchObject({ name: 'Manzana', quantity: 1, unitPrice: 1.2 })
  })

  it('keeps model numbers in names (Leche 1L 1,10)', () => {
    expect(firstItem('Leche 1L 1,10')).toMatchObject({ name: 'Leche', quantity: 1, unitPrice: 1.1 })
  })

  it('rejects a line with no letter-based name (EAN only)', () => {
    const r = parseReceiptText('8424536789012 1,20')
    expect(r.items).toHaveLength(0)
  })

  it('rejects numeric-only lines', () => {
    expect(parseReceiptText('2,00 5,00').items).toHaveLength(0)
    expect(parseReceiptText('2,00 2,50').items).toHaveLength(0)
    expect(parseReceiptText('2,50 5,00').items).toHaveLength(0)
  })
})

describe('parseReceiptText OCR normalization', () => {
  it('fixes O instead of zero (5.OO -> 5.00)', () => {
    expect(firstItem('Cerveza 5.OO')).toMatchObject({ name: 'Cerveza', quantity: 1, unitPrice: 5 })
  })

  it('fixes O in decimal (1,2O -> 1.20)', () => {
    expect(firstItem('Cerveza 1,2O')).toMatchObject({ name: 'Cerveza', quantity: 1, unitPrice: 1.2 })
  })

  it('does not corrupt legitimate thousands separators (TV 1.200,00)', () => {
    expect(firstItem('TV 1.200,00')).toMatchObject({ name: 'TV', quantity: 1, unitPrice: 1200 })
  })

  it('handles tab separators', () => {
    expect(firstItem('Cerveza\t2\t5,00')).toMatchObject({ name: 'Cerveza', quantity: 2, unitPrice: 2.5 })
  })

  it('handles € glued to price (5,00€)', () => {
    expect(firstItem('Cerveza 5,00€')).toMatchObject({ name: 'Cerveza', quantity: 1, unitPrice: 5 })
  })

  it('handles EUR after price (5,00 EUR)', () => {
    expect(firstItem('Cerveza 5,00 EUR')).toMatchObject({ name: 'Cerveza', quantity: 1, unitPrice: 5 })
  })
})

describe('parseReceiptText real restaurant ticket (UDS DESCRIPCIÓN PVP IMPORTE)', () => {
  const ticket = [
    'JUAN Y ANDREA, S;t-',
    'VENDA DE SES SALINES, N:* 0- 173',
    '07860 FORMENTERA',
    'CIF: B-07574296',
    'TIQUET TOO1/48344 FECHA 06/08/2015',
    'NESA 132 17:47:38',
    'UDS - DESCRIPCIÓN pyP IMPORTE',
    '1 PAN Y ALI OLT 9,90 9:00',
    '1,45 PESCADO FRESCO FOR — 153,00 221,85',
    'HORNO',
    '1 CARABALLAS 50,00 50,00',
    '4 HELADO CASA 7,00 7,00',
    '$ ENSA MIXTA 19,00 19,00',
    '1 CAFE SOLO 4,90 4,00',
    '1 CAFE CON LECHE 4,50 4,50',
    '1 AGUA 8,00 8,00',
    '1 CAÑA 7,00 7,00',
    '1 TINTO VERANO 7,0 7,0',
    'BASE IMPONIBLE -— 305,36',
    'TAX/IVA — 10% 23,21',
    'TAK/IVA — 21% 2,78',
    'TAL 8,8',
  ].join('\n')

  it('does not include header lines as items', () => {
    const r = parseReceiptText(ticket)
    const names = r.items.map((i) => i.name)
    expect(names).not.toContain('VENDA DE SES SALINES')
    expect(names).not.toContain('NESA')
    expect(names).not.toContain('TIQUET')
  })

  it('detects merchant from header', () => {
    const r = parseReceiptText(ticket)
    expect(r.merchant).toBe('JUAN Y ANDREA, S;t-')
  })

  it('parses quantity + unitPrice + total columns correctly', () => {
    const r = parseReceiptText(ticket)
    expect(r.items).toContainEqual({ name: 'CARABALLAS', quantity: 1, unitPrice: 50 })
    expect(r.items).toContainEqual({ name: 'HELADO CASA', quantity: 4, unitPrice: 7 })
    expect(r.items).toContainEqual({ name: 'AGUA', quantity: 1, unitPrice: 8 })
    expect(r.items).toContainEqual({ name: 'CAÑA', quantity: 1, unitPrice: 7 })
    expect(r.items).toContainEqual({ name: 'TINTO VERANO', quantity: 1, unitPrice: 7 })
  })

  it('parses decimal quantity (weight) for 3-price lines', () => {
    const r = parseReceiptText(ticket)
    expect(r.items).toContainEqual({ name: 'PESCADO FRESCO FOR', quantity: 1.45, unitPrice: 153 })
  })

  it('captures IVA with TAX/IVA and TAK/IVA typos', () => {
    const r = parseReceiptText(ticket)
    expect(r.taxRate).toBe(0.21)
    expect(r.taxAmount).toBe(2.78)
  })

  it('does not include TAX/IVA lines as items', () => {
    const r = parseReceiptText(ticket)
    const names = r.items.map((i) => i.name)
    expect(names).not.toContain('TAX/IVA')
    expect(names).not.toContain('TAK/IVA')
  })

  it('extracts the total from TAL', () => {
    const r = parseReceiptText(ticket)
    expect(r.total).toBe(8.8)
  })
})

describe('parseReceiptText ambiguity reconciliation with global TOTAL', () => {
  it('resolves [cantidad, unitPrice] when TOTAL matches the unit interpretation', () => {
    const r = parseReceiptText(['2 Cerveza 2,50', 'TOTAL 5,00'].join('\n'))
    expect(r.items[0]).toMatchObject({ name: 'Cerveza', quantity: 2, unitPrice: 2.5 })
  })

  it('resolves [cantidad, total] when TOTAL matches the total interpretation', () => {
    const r = parseReceiptText(['2 Cerveza 5,00', 'TOTAL 5,00'].join('\n'))
    expect(r.items[0]).toMatchObject({ name: 'Cerveza', quantity: 2, unitPrice: 2.5 })
  })
})

describe('parseReceiptText real restaurant ticket (July 2021)', () => {
  const ticket = [
    'fecha 31/0//2021 Hora 20:39:08',
    'NA ORMA',
    'SALON Mesa 17',
    'HART, PU IMP',
    '8 COMENSALES 3.00 24,00',
    '1 ZUMO TOMATE 5:00',
    '13 PINTA CERVEZA 7,00 91,00',
    '6 COCA COLA 5/00 30,00',
    '4 3 AGUA LITRO CRISTAL 6,00 18,00',
    '2 EL TACO 18,00 38,00',
    '2 ELTACO CANGREJO 19:00 38,00',
    '1 ALITAS PADRE 23,00 -— 23,00',
    '1 ROLL SALMON FLANBEE 16/00 18/00',
    '1 ROLL PLAYA PADRE 24,00 24,00',
    '1 GUACAMOLE 16,00 16,00',
    '2 EXTRA TOTOPOS 3,00 6,00',
    '1 BURGUER WAGYU 28,00 28,00',
    '6 BURGUER WAGYU 28,00 168,00',
    '1 BURGUER WAGYU 28,00 28,00',
    '8 CHUP. TEQUILA 64,00',
    '8 -CHUP. DON JULIO BLA +',
    '1 COLA ZERO - 5,00 5,00',
    '2 MOET ICE 260,00 520,00',
    '3 CAFE SOLO 4,00 12,00',
    '1 CAFE CORTADO 4,00 4,00',
    '2 MOET ICE 260,00 520,00',
    '1 MAGNUM DOM PERIGNON 1.000,00 1.000;00',
    '8 CHUP. TEQUILA 64,00',
    '8 -CHUP. DON JULIO BLA *',
    '1 “CHIP. DON. JuLTO REP a',
    '=CHUP.,',
    '1 MAGNUM DOM PERTGNON 1.000,00 Tr',
    'ED EECCONTS TAL 372,00 312:00',
    '1 CHARGE SERVICE 372, “E',
    'TOTAL 4098,00 EUR',
    'R',
    'Precio/Persona 512,25 EUR',
    'Base Areco IVA 10% 372.55',
  ].join('\n')

  it('uses the explicit TOTAL, not the corrupt TAL total', () => {
    const r = parseReceiptText(ticket)
    expect(r.total).toBe(4098)
  })

  it('does not include the table number (SALON Mesa 17) as an item', () => {
    const r = parseReceiptText(ticket)
    const names = r.items.map((i) => i.name)
    expect(names).not.toContain('SALON Mesa 17')
  })

  it('does not include Precio/Persona as an item', () => {
    const r = parseReceiptText(ticket)
    const names = r.items.map((i) => i.name)
    expect(names).not.toContain('Precio Persona')
    expect(names).not.toContain('Precio/Persona')
  })

  it('does not corrupt a word containing X (EXTRA TOTOPOS)', () => {
    const r = parseReceiptText(ticket)
    const extra = r.items.find((i) => i.name === 'EXTRA TOTOPOS')
    expect(extra).toMatchObject({ quantity: 2, unitPrice: 3 })
  })

  it('captures IVA rate and amount', () => {
    const r = parseReceiptText(ticket)
    expect(r.taxRate).toBe(0.1)
    expect(r.taxAmount).toBe(372.55)
  })

  it('cleans semicolon OCR residue from names (MAGNUM DOM PERIGNON)', () => {
    const r = parseReceiptText(ticket)
    const names = r.items.map((i) => i.name)
    expect(names).toContain('MAGNUM DOM PERIGNON')
  })

  it('skips OCR-corrupted total lines as items (ED EECCONTS TAL)', () => {
    const r = parseReceiptText(ticket)
    const names = r.items.map((i) => i.name)
    expect(names).not.toContain('ED EECCONTS TAL')
    expect(names).not.toContain('EECCONTS TAL')
  })
})

describe('parseReceiptText ISO dates (year first)', () => {
  it('parses 2015-09-26 as year/month/day, not 15-09-26', () => {
    const r = parseReceiptText(['TIQUET FECHA 2015-09-26 HORA 12:24:24', 'TOTAL 5,00'].join('\n'))
    expect(r.date).toBe('2015-09-26')
  })

  it('still parses European day/month/year dates', () => {
    const r = parseReceiptText(['FECHA 26/09/2015', 'TOTAL 5,00'].join('\n'))
    expect(r.date).toBe('2015-09-26')
  })
})

describe('parseReceiptText OCR separator normalization (: and /)', () => {
  it('parses a price using ":" as decimal separator (1 ZUMO TOMATE 5:00)', () => {
    const r = parseReceiptText('1 ZUMO TOMATE 5:00')
    expect(r.items[0]).toMatchObject({ name: 'ZUMO TOMATE', quantity: 1, unitPrice: 5 })
  })

  it('parses prices using "/" as decimal separator (1 ROLL SALMON FLANBEE 16/00 18/00)', () => {
    const r = parseReceiptText('1 ROLL SALMON FLANBEE 16/00 18/00')
    expect(r.items[0]).toMatchObject({ name: 'ROLL SALMON FLANBEE', quantity: 1, unitPrice: 16 })
  })

  it('does not convert a full clock (20:39:08) into a price', () => {
    const r = parseReceiptText('HORA 20:39:08 ATENDIDO')
    expect(r.items.length).toBe(0)
  })

  it('does not convert a date with slashes (31/07/2021) into a price', () => {
    const r = parseReceiptText('FECHA 31/07/2021 COMPRA')
    expect(r.items.length).toBe(0)
  })
})

describe('parseReceiptText two leading integers (OCR column bleed)', () => {
  it('uses the second integer as quantity when total/unit confirms it (4 3 AGUA 6,00 18,00)', () => {
    const r = parseReceiptText('4 3 AGUA LITRO CRISTAL 6,00 18,00')
    expect(r.items[0]).toMatchObject({ name: 'AGUA LITRO CRISTAL', quantity: 3, unitPrice: 6 })
  })

  it('does not break a single leading integer (4 HELADO CASA 7,00 7,00)', () => {
    const r = parseReceiptText('4 HELADO CASA 7,00 7,00')
    expect(r.items[0]).toMatchObject({ name: 'HELADO CASA', quantity: 4, unitPrice: 7 })
  })

  it('does not break a quantity that is not confirmed by total/unit (2 EL TACO 18,00 38,00)', () => {
    const r = parseReceiptText('2 EL TACO 18,00 38,00')
    expect(r.items[0]).toMatchObject({ name: 'EL TACO', quantity: 2, unitPrice: 18 })
  })
})
