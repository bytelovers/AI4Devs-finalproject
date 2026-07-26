/**
 * Parser heurístico para texto de tickets españoles.
 * Extraído a archivo independiente para que todos los motores lo usen.
 *
 * Maneja:
 *   - Texto multi-línea (Tesseract)
 *   - Texto en una sola línea (Florence-2 <OCR>)
 *   - Descuentos, IVA, totales, fechas
 *   - Detección de merchant con filtrado de ruido
 */

import type { ScanResult } from './types'

export interface ParsedReceipt {
  items: Array<{
    name: string
    quantity: number
    unitPrice: number
  }>
  /** Descuentos detectados automáticamente del ticket. */
  discounts?: Array<{
    name: string
    mode: 'amount' | 'percentage'
    amount: number
    percentage?: number
  }>
  merchant?: string
  date?: string
  subtotal?: number
  taxRate?: number
  taxAmount?: number
  total?: number
}

export function parseReceiptText(text: string): ParsedReceipt {
  // Limpiar texto
  let cleanText = text
    .replace(/<\/?OCR[^>]*>/gi, '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')

  // Florence-2 <OCR> devuelve TODO en una sola línea. Dividir heurísticamente.
  const hasNewlines = /\r?\n/.test(cleanText)
  if (!hasNewlines && cleanText.length > 100) {
    cleanText = splitSingleLineText(cleanText)
  }

  const lines = cleanText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  const items: ParsedReceipt['items'] = []
  const discounts: ParsedReceipt['discounts'] = []
  let merchant: string | undefined
  let total: number | undefined
  let subtotal: number | undefined
  let taxAmount: number | undefined
  let taxRate: number | undefined
  let date: string | undefined

  const totalRegex = /(?:total|a pagar|importe\s+total|total\s+factura|\btal\b)\s*:?\s*(\d{1,4}(?:[.,]\d{3})*[.,]\d{1,2})/i
  const subtotalRegex = /(?:base\s+imponible|subtotal|sub[\s-]?total)\s*:?\s*(\d{1,4}(?:[.,]\d{3})*[.,]\d{1,2})/i
  const ivaRegex = /(?:i\.?\s*v\.?\s*a\.?|impuesto)\s*(\d{1,2})\s*%?\s*:?\s*(\d{1,4}(?:[.,]\d{3})*[.,]\d{1,2})/i
  const ivaRateOnlyRegex = /(?:i\.?\s*v\.?\s*a\.?|impuesto)\s*(\d{1,2})\s*%/i
  // Descuento: captura palabra clave + valor + si tiene %
  const discountRegex = /(?:descuento|dto\.?|oferta|promoci[oó]n|cup[oó]n|bono|vale|ahorro)\s*:?\s*-?(\d{1,4}(?:[.,]\d{3})*[.,]\d{1,2}|\d{1,2})\s*(%)?/i
  const dateRegex = /(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/

  const skipLineRegex = /^(total|a pagar|importe|base\s+imponible|subtotal|sub[\s-]?total|subtolal|iva|i\.?\s*v\.?\s*a\.?|impuesto|descuento|dto|oferta|promoci[oó]n|cup[oó]n|bono|vale|ahorro|tal\b|forma\s+de\s+pago|tarjeta|efectivo|ticket|factura|cif|nif|fecha|hora|gracias|tel|telf|direcci[oó]n|c\/|calle|cambio|entregado|pagado|visa|mastercard|amex|n[º°\.]\s*\d|terminal|camarero|mesa|comensales)/i

  const merchantNoiseRegex = /\b(descuento|dto|total|subtotal|iva|impuesto|base\s+imponible|a\s+pagar|importe|forma\s+de\s+pago|tarjeta|efectivo|cambio|entregado|pagado|gracias|ticket|factura|cif|nif|fecha|hora|tel|calle|c\/)\b/i

  // === Fase 1: Detectar merchant ===
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i]
    if (line.length < 2) continue
    if (dateRegex.test(line)) continue
    if (/^(cif|nif|c\/|calle|tel|fecha|hora)/i.test(line)) continue
    if (totalRegex.test(line)) continue
    if (subtotalRegex.test(line)) continue
    if (ivaRegex.test(line)) continue
    if (discountRegex.test(line)) continue
    const letterCount = (line.match(/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/g) || []).length
    const digitCount = (line.match(/\d/g) || []).length
    if (letterCount > digitCount && letterCount >= 3) {
      let cleanMerchant = line
        .replace(/\s+\d{1,4}[.,]\d{1,2}\s*(?:€|EUR)?\s*$/i, '')
        .replace(/\s+\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/g, '')
        .replace(/\s+(?:cif|nif)\s*:?\s*[A-Z]?\d+/gi, '')
        // Quitar caracteres especiales al inicio (|, -, :, etc.)
        .replace(/^[|\-:_·\.\s]+/, '')
        .trim()
      if (merchantNoiseRegex.test(cleanMerchant)) continue
      // Validar que tenga al menos una palabra de 3+ letras (no ruido como "Fr E e EE")
      const words = cleanMerchant.split(/\s+/)
      const longWords = words.filter((w) => w.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g, '').length >= 3)
      if (longWords.length === 0) continue
      // Rechazar si la mayoría de palabras son de 1-2 letras (ruido)
      if (words.length >= 3 && longWords.length < words.length / 2) continue
      if (cleanMerchant.length >= 3 && cleanMerchant.length <= 60) {
        merchant = cleanMerchant
        break
      }
    }
  }

  // === Fase 2: Detectar totales, IVA, descuentos, fecha ===
  for (const line of lines) {
    if (total === undefined) {
      const m = line.match(totalRegex)
      if (m) { total = parseSpanishAmount(m[1]); continue }
    }
    if (subtotal === undefined) {
      const m = line.match(subtotalRegex)
      if (m) { subtotal = parseSpanishAmount(m[1]); continue }
    }
    const ivaM = line.match(ivaRegex)
    if (ivaM) {
      taxRate = parseInt(ivaM[1]) / 100
      taxAmount = parseSpanishAmount(ivaM[2])
      continue
    }
    if (taxRate === undefined) {
      const ivaRateM = line.match(ivaRateOnlyRegex)
      if (ivaRateM) taxRate = parseInt(ivaRateM[1]) / 100
    }
    if (!date) {
      const dm = line.match(dateRegex)
      if (dm) {
        const day = dm[1].padStart(2, '0')
        const month = dm[2].padStart(2, '0')
        let year = dm[3]
        if (year.length === 2) year = '20' + year
        // Validar que la fecha sea real antes de usarla
        const dayNum = parseInt(day)
        const monthNum = parseInt(month)
        const yearNum = parseInt(year)
        if (
          dayNum >= 1 && dayNum <= 31 &&
          monthNum >= 1 && monthNum <= 12 &&
          yearNum >= 2000 && yearNum <= 2100
        ) {
          // Verificar que la fecha sea válida (ej. 31/02 no existe)
          const testDate = new Date(`${year}-${month}-${day}T00:00:00`)
          if (!isNaN(testDate.getTime())) {
            date = `${year}-${month}-${day}`
          }
        }
      }
    }
    // Descuento: extraer y guardar como amount o percentage
    const discM = line.match(discountRegex)
    if (discM) {
      const valueStr = discM[1]
      const hasPercent = discM[2] === '%'
      // Extraer nombre del descuento (la palabra clave que matcheó)
      const nameMatch = line.match(/(?:descuento|dto\.?|oferta|promoci[oó]n|cup[oó]n|bono|vale|ahorro)/i)
      const name = nameMatch ? nameMatch[0] : 'Descuento'
      if (hasPercent) {
        // Descuento porcentual
        const pct = parseFloat(valueStr.replace(',', '.'))
        if (pct > 0 && pct <= 100) {
          discounts.push({
            name: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(),
            mode: 'percentage',
            amount: 0,
            percentage: pct,
          })
        }
      } else {
        // Descuento por importe
        const amt = parseSpanishAmount(valueStr)
        if (amt > 0 && amt < 500) {
          discounts.push({
            name: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(),
            mode: 'amount',
            amount: amt,
          })
        }
      }
      continue
    }
  }

  // === Fase 3: Detectar items ===
  for (const line of lines) {
    if (totalRegex.test(line)) continue
    if (subtotalRegex.test(line)) continue
    if (ivaRegex.test(line)) continue
    if (discountRegex.test(line)) continue
    if (skipLineRegex.test(line)) continue

    // Buscar precios con decimales (formato típico: 10,65 o 10.65)
    // Ignorar precios "0,00" (columnas de descuento sin valor)
    const allPrices = [...line.matchAll(/(\d{1,4}(?:[.,]\d{3})*[.,]\d{1,2})/g)]
    const validPrices = allPrices.filter((m) => {
      const val = parseSpanishAmount(m[1])
      return val > 0 && val <= 500
    })
    if (validPrices.length === 0) continue

    let lineTotal: number
    let unitPrice: number
    let quantity = 1

    // Si la línea tiene 3 o más valores numéricos/precios (ej: "ENTRECOTTE 4,00 22,80 45,20" o "CERVEZA 500 2,00 5,68 11,30")
    if (validPrices.length >= 3) {
      // El último número con decimales es el Importe Total
      lineTotal = parseSpanishAmount(validPrices[validPrices.length - 1][1])
      // El penúltimo es el Precio Unitario
      unitPrice = parseSpanishAmount(validPrices[validPrices.length - 2][1])
      // El antepenúltimo representa la Cantidad (ej: 4,00 o 2,00)
      const qtyVal = parseSpanishAmount(validPrices[validPrices.length - 3][1])
      if (qtyVal > 0 && qtyVal <= 500) {
        quantity = Math.round(qtyVal)
      }
    } else if (validPrices.length === 2) {
      // Si hay 2 precios (ej: "2,00 11,30" -> cantidad o unitPrice + total)
      const p1 = parseSpanishAmount(validPrices[0][1])
      const p2 = parseSpanishAmount(validPrices[1][1])
      lineTotal = p2
      if (p1 > 0 && Math.abs(p1 * Math.round(p1) - p2) < 0.05) {
        // p1 es la cantidad entera
        quantity = Math.round(p1)
        unitPrice = p2 / quantity
      } else {
        unitPrice = p1
        quantity = p1 > 0 ? Math.round(p2 / p1) || 1 : 1
      }
    } else {
      // Un único precio (Importe Total)
      lineTotal = parseSpanishAmount(validPrices[0][1])
      
      // Detectar cantidad al inicio ANTES de limpiar (ej: "2x Cerveza", "2 x Cerveza")
      const qtyMatch = line.match(/^(\d+)\s*[xX]?\s+/)
      if (qtyMatch) {
        const parsedQty = parseInt(qtyMatch[1])
        if (parsedQty >= 1 && parsedQty <= 50) {
          quantity = parsedQty
        }
      }
      unitPrice = lineTotal / quantity
    }

    // Limpiar nombre: quitar TODOS los precios, símbolos y ruido del OCR
    let namePart = line
      // Quitar cantidad del inicio si existe
      .replace(/^\d+\s*[xX]?\s+/, '')
      // Quitar todos los números con decimales (precios)
      .replace(/\d{1,4}(?:[.,]\d{3})*[.,]\d{1,2}/g, ' ')
      // Quitar símbolos de euro y EUR
      .replace(/€|EUR/gi, ' ')
      // Quitar secuencias de números+letras mezcladas (ruido "10.65A", "245A")
      .replace(/\d+[.,]?\d*[A-Za-z]+/g, ' ')
      // Quitar letras sueltas que son ruido del OCR (A, B, C sueltas)
      .replace(/\b[A-Z]\b/g, ' ')
      // Quitar números sueltos restantes (códigos de producto sin decimales)
      .replace(/\b\d+\b/g, ' ')
      // Limpiar espacios múltiples
      .replace(/\s+/g, ' ')
      .trim()

    // Validaciones del nombre
    if (namePart.length < 2 || namePart.length > 100) continue
    const letterCount = (namePart.match(/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/g) || []).length
    if (letterCount < 2) continue
    // Saltar líneas que son claramente totales/IVA/descuentos
    if (/^(total|subtotal|sub[\s-]?total|subtolal|base|iva|impuesto|descuento|dto|propina|tal\b)/i.test(namePart)) continue

    items.push({ name: namePart, quantity, unitPrice: round2(unitPrice) })
  }

  // === Fase 4: Estrategia de pares ===
  // (nombre en una línea, precio en la siguiente)
  if (items.length === 0) {
    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i]
      const nextLine = lines[i + 1]
      if (skipLineRegex.test(line)) continue
      if (discountRegex.test(line)) continue
      if (totalRegex.test(line) || subtotalRegex.test(line) || ivaRegex.test(line)) continue
      // La línea actual no debe tener números (es solo el nombre)
      if (line.match(/\d/)) continue
      // La siguiente línea debe tener un precio válido
      const nextPrice = nextLine.match(/(\d{1,4}(?:[.,]\d{3})*[.,]\d{1,2})/)
      if (nextPrice) {
        const lineTotal = parseSpanishAmount(nextPrice[1])
        if (lineTotal <= 0 || lineTotal > 500) continue
        // Limpiar nombre igual que en Fase 3
        let namePart = line
          .replace(/€|EUR/gi, '')
          .replace(/\s+[A-Z]\s*$/g, '')
          .replace(/\s+/g, ' ')
          .trim()
        if (namePart.length < 2 || namePart.length > 100) continue
        const letterCount = (namePart.match(/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/g) || []).length
        if (letterCount < 2) continue
        items.push({ name: namePart, quantity: 1, unitPrice: round2(lineTotal) })
        i++
      }
    }
  }

  // === Fase 5: Inferir subtotal ===
  if (!subtotal && items.length > 0) {
    const itemsSum = items.reduce((s, it) => s + it.unitPrice * it.quantity, 0)
    subtotal = itemsSum
  }
  if (!total && subtotal) {
    total = subtotal + (taxAmount ?? 0)
  }

  return {
    items,
    discounts: discounts.length > 0 ? discounts : undefined,
    merchant,
    date,
    subtotal,
    taxRate,
    taxAmount,
    total,
  }
}

/**
 * Divide texto de Florence-2 <OCR> que viene todo en una línea.
 */
function splitSingleLineText(text: string): string {
  const result = text.replace(
    /(\d{1,4}(?:[.,]\d{3})*[.,]\d{1,2}|\d{1,4}[.,]\d{1,2})\s+/g,
    '$1\n'
  )
  const withKeyBreaks = result.replace(
    /\s+(total|subtotal|base\s+imponible|iva|i\.?\s*v\.?\s*a\.?|impuesto|descuento|dto\.?|oferta|promoci[oó]n|cup[oó]n|a\s+pagar|forma\s+de\s+pago|tarjeta|efectivo|gracias|cambio|fecha|hora|cif|nif)\b/gi,
    '\n$1 '
  )
  return withKeyBreaks
}

export function parseSpanishAmount(s: string): number {
  if (!s) return 0
  let cleaned = s.trim()
  if (cleaned.includes('.') && cleaned.includes(',')) {
    if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.')
    } else {
      cleaned = cleaned.replace(/,/g, '')
    }
  } else if (cleaned.includes(',')) {
    const parts = cleaned.split(',')
    if (parts.length === 2 && parts[1].length === 2) {
      cleaned = cleaned.replace(',', '.')
    } else {
      cleaned = cleaned.replace(/,/g, '')
    }
  } else if (cleaned.includes('.')) {
    const parts = cleaned.split('.')
    if (parts.length === 2 && parts[1].length === 2) {
      // decimal
    } else if (parts.length > 2) {
      cleaned = cleaned.replace(/\./g, '')
    }
    if (parts.length === 2 && parts[1].length === 3) {
      cleaned = cleaned.replace(/\./g, '')
    }
  }
  const result = parseFloat(cleaned)
  return isNaN(result) ? 0 : result
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}
