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

  let items: ParsedReceipt['items'] = []
  const discounts: ParsedReceipt['discounts'] = []
  let merchant: string | undefined
  let total: number | undefined
  let subtotal: number | undefined
  let taxAmount: number | undefined
  let taxRate: number | undefined
  let date: string | undefined

  const totalRegex = /(?:total|a pagar|importe\s+total|total\s+factura)\s*:?\s*(\d{1,4}(?:[.,]\d{3})*[.,]\d{1,2})/i
  // Fallback de total: "TAL 8,8" (OCR corrupto de TOTAL). Solo se usa si no hay TOTAL explícito.
  const totalTalRegex = /\btal\b\s*:?\s*(\d{1,4}(?:[.,]\d{3})*[.,]\d{1,2})/i
  const subtotalRegex = /(?:base\s+imponible|subtotal|sub[\s-]?total)\s*:?\s*(\d{1,4}(?:[.,]\d{3})*[.,]\d{1,2})/i
  // IVA: soporta "IVA 10% 23,21", "TAX/IVA — 10% 23,21", "TAK/IVA — 21% 2,78" (typos OCR de TAX)
  const ivaRegex = /(?:iva|i\.?\s*v\.?\s*a\.?|impuesto|t[aá]x(?:\s*\/\s*iva)?|tak(?:\s*\/\s*iva)?)\s*[—:\-/]*\s*(\d{1,2})\s*%\s*[—:]*\s*(\d{1,4}(?:[.,]\d{3})*[.,]\d{1,2})/i
  const ivaRateOnlyRegex = /(?:iva|i\.?\s*v\.?\s*a\.?|impuesto|t[aá]x(?:\s*\/\s*iva)?|tak(?:\s*\/\s*iva)?)\s*[—:\-/]*\s*(\d{1,2})\s*%/i
  // Descuento: captura palabra clave + valor + si tiene %
  const discountRegex = /(?:descuento|dto\.?|oferta|promoci[oó]n|cup[oó]n|bono|vale|ahorro)\s*:?\s*-?(\d{1,4}(?:[.,]\d{3})*[.,]\d{1,2}|\d{1,2})\s*(%)?/i
  const dateRegex = /(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/
  const isoDateRegex = /(\d{4})[/-](\d{1,2})[/-](\d{1,2})/

  const skipLineRegex = /^(total|a pagar|importe|base\s+imponible|subtotal|sub[\s-]?total|subtolal|iva|i\.?\s*v\.?\s*a\.?|impuesto|tax|tak|descuento|dto|oferta|promoci[oó]n|cup[oó]n|bono|vale|ahorro|tal\b|forma\s+de\s+pago|tarjeta|efectivo|ticket|tiquet|factura|cif|nif|fecha|hora|gracias|tel|telf|direcci[oó]n|c\/|calle|cambio|entregado|pagado|visa|mastercard|amex|n[º°\.]\s*\d|terminal|camarero|mesa|nesa|comensales|uds|descripci[oó]n)/i

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
  // El TOTAL explícito tiene prioridad: recorrer todas las líneas buscando "TOTAL 4098,00 EUR".
  // Solo si no aparece ningún TOTAL explícito, usar el fallback "TAL 8,8" (OCR corrupto).
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
      // Fecha: soportar ISO (año primero, "2015-09-26") y europea (día/mes/año, "31/07/2021")
      const isoDm = line.match(isoDateRegex)
      const euroDm = line.match(dateRegex)
      const dm = isoDm
        ? { day: isoDm[3], month: isoDm[2], year: isoDm[1] }
        : euroDm
          ? { day: euroDm[1], month: euroDm[2], year: euroDm[3] }
          : null
      if (dm) {
        const day = dm.day.padStart(2, '0')
        const month = dm.month.padStart(2, '0')
        let year = dm.year
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

  // Fallback de total: solo si no se encontró ningún TOTAL explícito (OCR corrupto "TAL 8,8")
  if (total === undefined) {
    for (const line of lines) {
      const m = line.match(totalTalRegex)
      if (m) { total = parseSpanishAmount(m[1]); break }
    }
  }

  // === Fase 3: Detectar items ===
  // Algunas líneas son ambiguas (cantidad + 1 precio: ¿el precio es total o unitario?).
  // Guardamos la interpretación alternativa y la reconciliamos contra el TOTAL global en Fase 5.
  const ambiguousItems: Array<{ index: number; altQuantity: number; altUnitPrice: number }> = []

  for (const line of lines) {
    if (totalRegex.test(line)) continue
    if (totalTalRegex.test(line)) continue
    if (subtotalRegex.test(line)) continue
    if (ivaRegex.test(line)) continue
    if (skipLineRegex.test(line)) continue

    // Normalizar errores OCR comunes en precios: "5.OO" -> "5.00", "1,2O" -> "1.20"
    // Solo cuando hay al menos un carácter ambiguo real (O, l, I); no tocar ceros/dígitos legítimos
    let normLine = line.replace(/(\d)(?:[.,])([0OoIl]*[OoIl][0OoIl]*)(?!\w)/g, (_m, d: string, s: string) => {
      const fixed = s.replace(/[Oo]/g, '0').replace(/[Il]/g, '1')
      return `${d}.${fixed}`
    })

    // Normalizar separadores decimales OCR corruptos: ":" o "/" por "," en precios
    //   "1 ZUMO TOMATE 5:00"      -> "5,00"
    //   "1 ROLL SALMON 16/00 18/00" -> "16,00 18,00"
    // Guardas:
    //   - No tocar relojes completos "20:39:08" (se protegen primero)
    //   - Solo al final de línea o ante espacio (no tocar fechas "31/07/2021")
    normLine = normLine
      .replace(/(\d{1,2}):(\d{2}):(\d{2})/g, (m) => m)
      .replace(/(\d{1,2}):(\d{2})(?=\s|$)/g, '$1,$2')
      .replace(/(\d{1,2})\/(\d{2})(?=\s|$)/g, '$1,$2')

    // Descuento inline en la misma línea que un producto: "Cerveza DTO -1,00 5,00".
    // Extraer el descuento (ya registrado en Fase 2) y procesar el resto como item.
    const lineForParsing = normLine.replace(
      /(?:descuento|dto\.?|oferta|promoci[oó]n|cup[oó]n|bono|vale|ahorro)\s*:?\s*-?\s*\d{1,4}(?:[.,]\d{3})*[.,]\d{1,2}\s*(?:%|€|eur)?/gi,
      ' '
    ).trim()

    // Detección de peso variable (frutería/carnicería): "0,350 kg Manzanas 2,49"
    // o "Manzanas 2,49 €/kg 0,350 kg 0,87"
    const kgMatch = normLine.match(/(\d{1,2})[.,](\d{3})\s*kg\b/i)
    if (kgMatch) {
      const weight = parseFloat(`${kgMatch[1]}.${kgMatch[2]}`)
      if (weight > 0 && weight < 100) {
        // Excluir el token de peso (p.ej. "0,350") del listado de precios
        const withoutWeight = normLine.replace(kgMatch[0], ' ')
        const kgPrices = [...withoutWeight.matchAll(/(\d{1,4}(?:[.,]\d{3})*[.,]\d{1,2})/g)]
          .map((m) => parseSpanishAmount(m[1]))
          .filter((v) => v > 0 && v <= 9999)
        if (kgPrices.length >= 1) {
          const unitPriceKg = kgPrices[0]
          const namePartKg = normLine
            .replace(/\d{1,2}[.,]\d{3}\s*kg\b/gi, ' ')
            .replace(/\d{1,4}(?:[.,]\d{3})*[.,]\d{1,2}/g, ' ')
            .replace(/€|EUR|kg\b|\//gi, ' ')
            .replace(/\s+/g, ' ')
            .trim()
          const letterCountKg = (namePartKg.match(/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/g) || []).length
          if (namePartKg.length >= 2 && letterCountKg >= 2) {
            items.push({ name: namePartKg, quantity: round2(weight), unitPrice: round2(unitPriceKg) })
            continue
          }
        }
      }
    }

    // Buscar precios con decimales (formato típico: 10,65 o 10.65)
    // Ignorar precios "0,00" (columnas de descuento sin valor)
    const allPrices = [...lineForParsing.matchAll(/(\d{1,4}(?:[.,]\d{3})*[.,]\d{1,2})/g)]
    const validPrices = allPrices.filter((m) => {
      const val = parseSpanishAmount(m[1])
      return val > 0 && val <= 9999
    })
    if (validPrices.length === 0) {
      // Precio entero sin decimales al final de la línea (OCR sin céntimos): "Cerveza 5"
      // MUY restrictivo para no capturar cabeceras (dirección, fecha, hora, nº ticket):
      // el nombre previo debe ser solo letras/espacios, sin puntuación, sin dígitos,
      // y la línea no puede contener horas (17:47:38) ni fechas (06/08/2015).
      const hasClock = /(\d{1,2}):(\d{2})/.test(lineForParsing)
      const hasDate = dateRegex.test(lineForParsing)
      const intPriceMatch = [...lineForParsing.matchAll(/\b(\d{1,4})\s*$/g)][0]
      if (intPriceMatch && !hasClock && !hasDate) {
        const nameCheck = lineForParsing.slice(0, intPriceMatch.index).trim()
        const letters = (nameCheck.match(/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/g) || []).length
        const digitsInName = (nameCheck.match(/\d/g) || []).length
        const hasPunct = /[:,;*\/—–\-()]/.test(nameCheck)
        const intVal = parseInt(intPriceMatch[1], 10)
        if (letters >= 2 && digitsInName === 0 && !hasPunct && intVal > 0 && intVal <= 9999) {
          validPrices.push(intPriceMatch)
        }
      }
      if (validPrices.length === 0) continue
    }

    let lineTotal: number
    let unitPrice: number
    let quantity = 1
    let ambiguity: { altQuantity: number; altUnitPrice: number } | null = null

    // Detectar cantidad explícita en cualquier posición/formas (aplica a TODOS los branches):
    //   Inicio:    "1 CARABALLAS", "2 Cerveza", "2x Cerveza", "2× Cerveza", "2*Cerveza"
    //   Medio:     "Cerveza 2 "
    //   Unidades:  "2 UDS", "2 uds.", "2 unidades"
    const qtyPatterns = [
      /^(\d+)\s*[xX×*]?\s+/,                 // inicio: "1 CARABALLAS", "2 Cerveza", "2x Cerveza"
      /^(\d+)\s*[xX×*](?=\D)/,               // "2×Cerveza", "2*Cerveza"
      /\s(\d+)\s+[xX×*]?\s*/,                // medio: "Cerveza 2 "
      /(\d+)\s*(?:uds\.?|unidades?)/i,       // "2 UDS", "2 unidades"
      /\b(\d{1,2})\s*[xX×*]\b/i,             // "Cerveza 2x"
    ]
    let parsedQty: number | null = null
    for (const pattern of qtyPatterns) {
      const qtyMatch = lineForParsing.match(pattern)
      if (qtyMatch) {
        const q = parseInt(qtyMatch[1], 10)
        if (q >= 1 && q <= 50) {
          parsedQty = q
          break
        }
      }
    }

    // Si la línea tiene 3 o más valores numéricos/precios (ej: "ENTRECOTTE 4,00 22,80 45,20" o "CERVEZA 500 2,00 5,68 11,30")
    if (validPrices.length >= 3) {
      // El último número con decimales es el Importe Total
      lineTotal = parseSpanishAmount(validPrices[validPrices.length - 1][1])
      // El penúltimo es el Precio Unitario
      unitPrice = parseSpanishAmount(validPrices[validPrices.length - 2][1])
      // El antepenúltimo representa la Cantidad (ej: 4,00 o 2,00); puede ser decimal (peso: 1,45)
      const qtyVal = parseSpanishAmount(validPrices[validPrices.length - 3][1])
      if (qtyVal > 0 && qtyVal <= 500) {
        quantity = Math.abs(qtyVal - Math.round(qtyVal)) < 0.05 ? Math.round(qtyVal) : round2(qtyVal)
      }
    } else if (validPrices.length === 2) {
      const p1 = parseSpanishAmount(validPrices[0][1])
      const p2 = parseSpanishAmount(validPrices[1][1])

      // Formato típico de ticket: "UDS DESCRIPCIÓN PVP IMPORTE".
      // Si hay cantidad explícita, los 2 precios son [unitPrice, total]:
      //   "1 CARABALLAS 50,00 50,00" -> 1×50 (antes: 50×1)
      //   "4 HELADO CASA 7,00 7,00"  -> 4×7  (antes: 7×1)
      if (parsedQty !== null) {
        quantity = parsedQty
        unitPrice = p1
        lineTotal = p2
        // OCR: sangría de columna "4 3 AGUA LITRO CRISTAL 6,00 18,00".
        // Dos enteros consecutivos al inicio: el segundo es la cantidad real
        // (el primero es resto de columna UDS). Solo si total/unit lo confirma.
        const leadingDup = lineForParsing.match(/^(\d+)\s+(\d+)\s+/)
        if (leadingDup && p1 > 0) {
          const qtyFromTotal = p2 / p1
          const secondInt = parseInt(leadingDup[2], 10)
          if (qtyFromTotal >= 1 && qtyFromTotal <= 50 && qtyFromTotal === secondInt) {
            quantity = secondInt
          }
        }
      } else if (Math.abs(p1 - p2) < 0.005) {
        // Precios casi iguales sin cantidad explícita: un solo artículo
        //   "$ ENSA MIXTA 19,00 19,00" -> 1×19 (antes: 19×1)
        lineTotal = p2
        unitPrice = p1
        quantity = 1
      } else {
        // Si no hay cantidad explícita, hay 3 interpretaciones plausibles:
        //   [cantidad, unitPrice] -> total = p1 * p2
        //   [cantidad, total]     -> unitPrice = p2 / p1
        //   [unitPrice, total]    -> quantity = p2 / p1 (si es entero)
        const p1IsInt = p1 >= 1 && p1 <= 50 && Math.abs(p1 - Math.round(p1)) < 0.05
        const p2DivP1 = p2 / p1
        const p2IsIntMultiple = p1 > 0 && p2DivP1 >= 1 && p2DivP1 <= 50 && Math.abs(p2DivP1 - Math.round(p2DivP1)) < 0.05

        if (p1IsInt) {
          const qty = Math.round(p1)
          const unitIfTotal = p2 / qty
          const totalIfUnit = p2 * qty
          const inPlausibleRange = (v: number) => v >= 0.1 && v <= 500
          const isRounder = (a: number, b: number) => {
            const centsA = Math.round(a * 100) % 100
            const centsB = Math.round(b * 100) % 100
            const roundScore = (cents: number) => (cents % 10 === 0 ? 2 : cents % 5 === 0 ? 1 : 0)
            return roundScore(centsA) > roundScore(centsB)
          }
          // Caso 1: [cantidad, unitPrice] si el unitPrice es plausible y su total es redondo
          if (inPlausibleRange(p2) && isRounder(totalIfUnit, p2)) {
            lineTotal = totalIfUnit
            unitPrice = p2
            quantity = qty
            ambiguity = { altQuantity: qty, altUnitPrice: unitIfTotal }
          } else {
            // Caso 2: [cantidad, total]
            lineTotal = p2
            unitPrice = unitIfTotal
            quantity = qty
            ambiguity = { altQuantity: qty, altUnitPrice: p2 }
          }
        } else if (p2IsIntMultiple) {
          // [unitPrice, total]
          lineTotal = p2
          unitPrice = p1
          quantity = Math.round(p2DivP1)
        } else {
          // Fallback: p1 unitPrice, p2 total, cantidad 1
          lineTotal = p2
          unitPrice = p1
          quantity = 1
        }
      }
    } else {
      // Un único precio. Si hay cantidad, el precio puede ser el total (unit = precio/qty)
      // o el unitPrice (total = precio*qty). Guardamos la alternativa para Fase 5.
      lineTotal = parseSpanishAmount(validPrices[0][1])
      if (parsedQty !== null) {
        quantity = parsedQty
        // El precio como unitPrice es la alternativa; como total es la interpretación por defecto
        ambiguity = { altQuantity: parsedQty, altUnitPrice: lineTotal }
      }
      unitPrice = lineTotal / quantity
    }

    // Limpiar nombre: quitar TODOS los precios, símbolos y ruido del OCR
    let namePart = lineForParsing
      // Quitar cantidad del inicio si existe (con ×, *, x)
      .replace(/^\d+\s*[xX×*]?\s+/, '')
      // Quitar multiplicadores sueltos (2×Cerveza -> Cerveza)
      .replace(/^\d+[xX×*]/i, '')
      // Quitar todos los números con decimales (precios)
      .replace(/\d{1,4}(?:[.,]\d{3})*[.,]\d{1,2}/g, ' ')
      // Quitar símbolos de euro y EUR, y el separador de dos puntos de horas/tickets (9:00 -> ruido)
      .replace(/€|EUR|kg\b|\//gi, ' ')
      .replace(/\d{1,2}:\d{2}(?::\d{2})?/g, ' ')
      // Quitar unidades de peso y cantidad residuales
      .replace(/\d+\s*(?:uds\.?|unidades?)/gi, ' ')
      // Quitar multiplicadores residuales tipo "2x3" o "3x2" (oferta 3x2), no tocar X dentro de palabras (EXTRA)
      .replace(/\d+[xX×*]\d*|^[xX×*]\s*\d*\.?\d*/g, ' ')
      // Quitar secuencias de números+letras mezcladas (ruido "10.65A", "245A")
      .replace(/\d+[.,]?\d*[A-Za-z]+/g, ' ')
      // Quitar letras sueltas que son ruido del OCR (A, B, C sueltas).
      // Usar lookarounds en lugar de \b: \b no reconoce acentos/Ñ como palabra
      // (en "CAÑA" la A aparecía como letra suelta y se borraba).
      .replace(/(?<![a-zA-ZáéíóúÁÉÍÓÚñÑ])[a-zA-ZáéíóúÁÉÍÓÚñÑ](?![a-zA-ZáéíóúÁÉÍÓÚñÑ])/g, ' ')
      // Quitar signo negativo residual de devoluciones ("ANULADO -5,00")
      .replace(/-\s*/g, ' ')
      // Quitar números sueltos restantes (códigos de producto sin decimales)
      .replace(/\b\d+\b/g, ' ')
      // Quitar puntuación residual de horas/fechas/OCR (:, —, ;) que quedó suelta
      .replace(/[—:;]/g, ' ')
      // Limpiar espacios múltiples
      .replace(/\s+/g, ' ')
      .trim()

    // Validaciones del nombre
    if (namePart.length < 2 || namePart.length > 100) continue
    const letterCount = (namePart.match(/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/g) || []).length
    if (letterCount < 2) continue
    // Saltar líneas que son claramente totales/IVA/descuentos
    if (/^(total|subtotal|sub[\s-]?total|subtolal|base|iva|impuesto|descuento|dto|propina|tal\b)/i.test(namePart)) continue
    // Saltar nº de mesa / salón ("SALON Mesa 17") y resúmenes de precio por persona
    if (/\bmesa\s+\d+/i.test(lineForParsing)) continue
    if (/\bprecio\s*\/?\s*persona\b/i.test(lineForParsing)) continue

    const itemIndex = items.length
    items.push({ name: namePart, quantity, unitPrice: round2(unitPrice) })
    if (ambiguity) {
      ambiguousItems.push({ index: itemIndex, altQuantity: ambiguity.altQuantity, altUnitPrice: ambiguity.altUnitPrice })
    }
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
        if (lineTotal <= 0 || lineTotal > 9999) continue
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
  // Primero: reconciliar interpretaciones ambiguas contra el TOTAL global del ticket.
  // Si un item ambiguo tiene una alternativa que hace que la suma cuadre con el total,
  // preferimos esa alternativa (resuelve [cantidad, unitPrice] vs [cantidad, total]).
  if (total !== undefined && ambiguousItems.length > 0) {
    const sumWith = (itemsArr: typeof items) => itemsArr.reduce((s, it) => s + it.unitPrice * it.quantity, 0)
    const currentSum = sumWith(items)
    const target = total - (taxAmount ?? 0)
    let bestSum = currentSum
    let bestItems = [...items]
    for (const amb of ambiguousItems) {
      const candidate = items.map((it, idx) =>
        idx === amb.index ? { ...it, quantity: amb.altQuantity, unitPrice: amb.altUnitPrice } : it
      )
      const candidateSum = sumWith(candidate)
      const currentDiff = Math.abs(bestSum - target)
      const candidateDiff = Math.abs(candidateSum - target)
      if (candidateDiff < currentDiff) {
        bestSum = candidateSum
        bestItems = candidate
      }
    }
    items = bestItems
  }

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
    if (parts.length === 2 && (parts[1].length === 1 || parts[1].length === 2)) {
      cleaned = cleaned.replace(',', '.')
    } else {
      cleaned = cleaned.replace(/,/g, '')
    }
  } else if (cleaned.includes('.')) {
    const parts = cleaned.split('.')
    if (parts.length === 2 && (parts[1].length === 1 || parts[1].length === 2)) {
      // decimal (1 o 2 dígitos)
    } else if (parts.length > 2) {
      cleaned = cleaned.replace(/\./g, '')
    } else if (parts.length === 2 && parts[1].length === 3) {
      cleaned = cleaned.replace(/\./g, '')
    }
  }
  const result = parseFloat(cleaned)
  return isNaN(result) ? 0 : result
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}
