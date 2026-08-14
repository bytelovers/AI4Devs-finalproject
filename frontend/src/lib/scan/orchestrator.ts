/**
 * Orquestador del escaneo: elige el mejor motor disponible y maneja
 * la estrategia de fallback en cadena.
 *
 * Motores disponibles:
 *   1. Florence-2 (on-device, WebGPU) — máxima precisión, ~400MB
 *   2. Tesseract + NER (on-device, WASM) — precisión media-alta, ~115MB
 *   3. Tesseract solo (on-device, WASM) — precisión media, ~5MB
 *
 * NOTA: El motor server (server-engine.ts) ha sido excluido de la migración.
 * Cualquier referencia a 'server' en la configuración se resuelve como fallback
 * a 'tesseract-ner'.
 *
 * Lazy loading: solo un modelo pesado en RAM a la vez (gestionado por modelManager).
 * El mini-agente decide qué modelo NER usar (general vs receipt).
 */

import type { ScanInput, ScanResult, ScanEngineName, ProgressCallback } from './types'
import { detectCapabilities } from './capabilities'
import { scanWithFlorence } from './florence-engine'
import { scanWithTesseract } from './tesseract-engine'
import { scanWithTesseractNer } from './tesseract-ner-engine'
import { classifyIntent } from './mini-agent'
import type { NerModelType } from './ner-engine'

let florenceEnabled = false
let nerEnabled = false

/** Marca Florence-2 como activado. */
export function enableFlorenceEngine() {
  florenceEnabled = true
}

/** Verifica si Florence-2 está activado. */
export function isFlorenceEnabled(): boolean {
  return florenceEnabled
}

/** Marca Tesseract+NER como activado. */
export function enableNerEngine() {
  nerEnabled = true
}

/** Verifica si Tesseract+NER está activado. */
export function isNerEnabled(): boolean {
  return nerEnabled
}

export interface ScanOptions {
  /** Forzar uso de Tesseract solo. */
  forceTesseract?: boolean
  /** Forzar uso de Tesseract + NER. */
  forceTesseractNer?: boolean
  /** Tipo de modelo NER a usar (si forceTesseractNer). Default: 'general'. */
  nerModelType?: NerModelType
  /** Si el mini-agente debe decidir automáticamente el modelo NER. */
  useMiniAgent?: boolean
  /** Callback de progreso. */
  onProgress?: ProgressCallback
  /** No intentar fallback tras fallo del primer motor. */
  noFallback?: boolean
  /** Timeout por motor en ms. Default 60s (NER necesita más tiempo). */
  engineTimeoutMs?: number
  /** Logs detallados de diagnóstico en consola. Default: false. */
  verboseLogs?: boolean
}

/**
 * Ejecuta el escaneo de un ticket eligiendo el mejor motor disponible.
 */
export async function scanTicket(
  input: ScanInput,
  options: ScanOptions = {}
): Promise<ScanResult> {
  const {
    forceTesseract = false,
    forceTesseractNer = false,
    nerModelType = 'general',
    useMiniAgent = false,
    onProgress,
    noFallback = false,
    engineTimeoutMs = 60_000,
    verboseLogs = false,
  } = options

  // Forzar Tesseract solo
  if (forceTesseract) {
    return await scanWithTesseract(input.imageDataUrl, onProgress, verboseLogs)
  }

  // Forzar Tesseract + NER
  if (forceTesseractNer) {
    if (useMiniAgent) {
      return await scanWithMiniAgent(input.imageDataUrl, onProgress, nerModelType, verboseLogs)
    }
    return await scanWithTesseractNer(input.imageDataUrl, onProgress, nerModelType, undefined, verboseLogs)
  }

  // Determinar cadena de motores a probar
  const caps = detectCapabilities()
  const chain: ScanEngineName[] = []

  if (caps.hasWebGPU && isFlorenceEnabled()) {
    chain.push('florence2')
  }
  if (caps.hasWASM) {
    if (isNerEnabled()) chain.push('tesseract-ner')
    chain.push('tesseract')
  }

  if (chain.length === 0) {
    throw new Error(
      'Tu dispositivo no soporta ningún motor de escaneo. Activa WebGPU o usa un navegador moderno.'
    )
  }

  const enginesToTry = noFallback ? [chain[0]] : chain

  let lastError: Error | null = null
  for (let i = 0; i < enginesToTry.length; i++) {
    const engine = enginesToTry[i]
    const isLast = i === enginesToTry.length - 1
    try {
      onProgress?.({
        phase: 'loading-model',
        message: getEngineStartMessage(engine),
      })
      const result = await runEngineWithTimeout(
        engine,
        input.imageDataUrl,
        onProgress,
        engineTimeoutMs,
        verboseLogs
      )
      return result
    } catch (err) {
      console.warn(`[scan] Motor ${engine} falló:`, err)
      lastError = err instanceof Error ? err : new Error(String(err))
      if (!isLast) {
        onProgress?.({
          phase: 'loading-model',
          message: `${getEngineLabel(engine)} no disponible. Probando ${getEngineLabel(enginesToTry[i + 1])}…`,
        })
      }
    }
  }

  throw lastError ?? new Error('Todos los motores fallaron')
}

/**
 * Escaneo con mini-agente: ejecuta Tesseract, clasifica el ticket,
 * y usa el modelo NER recomendado.
 */
async function scanWithMiniAgent(
  imageDataUrl: string,
  onProgress?: ProgressCallback,
  fallbackModel: NerModelType = 'general',
  verboseLogs = false
): Promise<ScanResult> {
  // 1. Tesseract rápido para extraer texto
  const tesseractResult = await scanWithTesseract(imageDataUrl, onProgress, verboseLogs)
  const rawText = tesseractResult.rawText ?? ''

  if (!rawText.trim()) {
    return { ...tesseractResult, engine: 'tesseract-ner' }
  }

  // 2. Mini-agente clasifica
  const intent = classifyIntent(rawText)
  if (verboseLogs) {
    console.log('[mini-agent] Intent:', intent)
  }

  onProgress?.({
    phase: 'parsing',
    message: `Mini-agente: ticket ${intent.ticketType} → modelo ${intent.recommendedModel}`,
  })

  // 3. Si confianza baja, usar fallback
  const modelToUse = intent.confidence < 0.5 ? fallbackModel : intent.recommendedModel

  // 4. Ejecutar NER con el modelo seleccionado, reutilizando el Tesseract ya
  //    ejecutado en el paso 1 para no hacer doble OCR sobre el mismo recorte.
  return await scanWithTesseractNer(imageDataUrl, onProgress, modelToUse, tesseractResult, verboseLogs)
}

async function runEngineWithTimeout(
  engine: ScanEngineName,
  imageDataUrl: string,
  onProgress: ProgressCallback | undefined,
  timeoutMs: number,
  verboseLogs = false
): Promise<ScanResult> {
  return new Promise<ScanResult>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout: ${engine} tardó más de ${timeoutMs / 1000}s`))
    }, timeoutMs)

    runEngine(engine, imageDataUrl, onProgress, verboseLogs)
      .then((result) => {
        clearTimeout(timer)
        resolve(result)
      })
      .catch((err) => {
        clearTimeout(timer)
        reject(err)
      })
  })
}

async function runEngine(
  engine: ScanEngineName,
  imageDataUrl: string,
  onProgress?: ProgressCallback,
  verboseLogs = false
): Promise<ScanResult> {
  switch (engine) {
    case 'florence2':
      return await scanWithFlorence(imageDataUrl, onProgress, verboseLogs)
    case 'tesseract':
      return await scanWithTesseract(imageDataUrl, onProgress, verboseLogs)
    case 'tesseract-ner':
      return await scanWithTesseractNer(imageDataUrl, onProgress, undefined, undefined, verboseLogs)
    default:
      // 'server' is excluded from this build - fall through to error
      throw new Error(`Motor "${engine}" no está disponible en esta versión`)
  }
}

function getEngineStartMessage(engine: ScanEngineName): string {
  switch (engine) {
    case 'florence2':
      return 'Iniciando motor de IA en tu dispositivo…'
    case 'tesseract':
      return 'Iniciando OCR en tu dispositivo…'
    case 'tesseract-ner':
      return 'Iniciando OCR + IA (NER)…'
    default:
      return 'Iniciando motor…'
  }
}

function getEngineLabel(engine: ScanEngineName): string {
  switch (engine) {
    case 'florence2':
      return 'Florence-2'
    case 'tesseract':
      return 'Tesseract'
    case 'tesseract-ner':
      return 'Tesseract + NER'
    default:
      return 'Desconocido'
  }
}

/** Reexport para uso externo. */
export { detectCapabilities } from './capabilities'
export { getEngines, getRecommendedEngine, checkModelCached } from './capabilities'
export type { ScanResult, ScanProgress, ScanEngineName, EngineInfo } from './types'
