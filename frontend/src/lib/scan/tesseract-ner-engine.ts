/**
 * Motor de escaneo: Tesseract (OCR) + NER (clasificación de entidades).
 *
 * Pipeline:
 *   1. Tesseract extrae texto de la imagen
 *   2. Mini-agente decide qué modelo NER usar (general vs receipt)
 *   3. NER clasifica entidades
 *   4. Heurísticas estructuran el resultado
 *
 * Lazy loading: solo el modelo NER seleccionado está en RAM.
 * El modelo Tesseract (~5MB) siempre está disponible.
 */

import type { ScanResult, ProgressCallback } from './types'
import { scanWithTesseract } from './tesseract-engine'
import { parseReceiptText } from './receipt-parser'
import {
  classifyWithNER,
  type NerEntity,
  type NerModelType,
} from './ner-engine'

/**
 * Ejecuta Tesseract + NER sobre la imagen.
 * El parámetro nerModelType decide qué modelo NER cargar.
 *
 * `precomputedTesseract` permite reutilizar un resultado de Tesseract ya
 * calculado (p.ej. por el mini-agente) y evitar ejecutar el OCR dos veces
 * sobre el mismo recorte.
 */
export async function scanWithTesseractNer(
  imageDataUrl: string,
  onProgress?: ProgressCallback,
  nerModelType: NerModelType = 'general',
  precomputedTesseract?: ScanResult
): Promise<ScanResult> {
  // 1. Ejecutar Tesseract para extraer texto crudo (o reutilizar el del mini-agente)
  const tesseractResult = precomputedTesseract ?? (await scanWithTesseract(imageDataUrl, onProgress))
  const rawText = tesseractResult.rawText ?? ''

  if (!rawText.trim()) {
    return {
      ...tesseractResult,
      engine: 'tesseract-ner',
    }
  }

  // 2. Ejecutar NER
  try {
    onProgress?.({
      phase: 'parsing',
      message: 'Clasificando texto con NER…',
    })

    const nerResult = await classifyWithNER(rawText, nerModelType, onProgress)

    // 3. Combinar: usar NER para refinar el merchant y filtrar items
    const refined = refineWithNER(rawText, nerResult.entities)

    return {
      ...refined,
      engine: 'tesseract-ner',
      preprocessedImageDataUrl: tesseractResult.preprocessedImageDataUrl,
      rawText,
    }
  } catch (err) {
    console.warn('[tesseract-ner] NER falló, usando solo Tesseract:', err)
    return {
      ...tesseractResult,
      engine: 'tesseract-ner',
    }
  }
}

/**
 * Refina el resultado del parser heurístico usando las entidades del NER.
 * El NER detecta ORG (organizaciones) que usamos como merchant,
 * y ayuda a filtrar líneas que no son items.
 */
function refineWithNER(
  rawText: string,
  entities: NerEntity[]
): Omit<ScanResult, 'engine' | 'preprocessedImageDataUrl' | 'rawText'> {
  const parsed = parseReceiptText(rawText)

  // Si el NER detectó una ORG con confianza alta, usarla como merchant
  const orgEntities = entities
    .filter((e) => e.entity.includes('ORG') && e.score > 0.7)
    .sort((a, b) => b.score - a.score)

  if (orgEntities.length > 0) {
    const merchantWords: string[] = []
    for (const e of orgEntities) {
      const word = e.word.startsWith('##') ? e.word.substring(2) : e.word
      merchantWords.push(word)
    }
    const nerMerchant = merchantWords.join(' ').trim()
    if (
      nerMerchant.length >= 3 &&
      nerMerchant.length <= 60 &&
      /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(nerMerchant)
    ) {
      parsed.merchant = nerMerchant
    }
  }

  // Filtrar items que el NER detectó como parte de organizaciones
  if (parsed.items.length > 0 && orgEntities.length > 0) {
    const orgText = orgEntities
      .map((e) => e.word.replace(/^##/, ''))
      .join(' ')
      .toLowerCase()
    parsed.items = parsed.items.filter((item) => {
      const itemLower = item.name.toLowerCase()
      const similarity = stringSimilarity(itemLower, orgText)
      return similarity < 0.6
    })
  }

  return parsed
}

/**
 * Calcula similitud entre dos strings (0-1) usando Jaccard sobre palabras.
 */
export function stringSimilarity(a: string, b: string): number {
  if (!a || !b) return 0
  const wordsA = new Set(a.split(/\s+/).filter((w) => w.length > 2))
  const wordsB = new Set(b.split(/\s+/).filter((w) => w.length > 2))
  if (wordsA.size === 0 || wordsB.size === 0) return 0
  const intersection = new Set([...wordsA].filter((x) => wordsB.has(x)))
  const union = new Set([...wordsA, ...wordsB])
  return intersection.size / union.size
}
