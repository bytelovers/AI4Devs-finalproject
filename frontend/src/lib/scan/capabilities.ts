import type { ScanCapabilities, EngineInfo } from './types'

/**
 * Detecta las capacidades del dispositivo para elegir motor de escaneo.
 * Solo se puede llamar desde el cliente.
 */
export function detectCapabilities(): ScanCapabilities {
  const hasWebGPU =
    typeof navigator !== 'undefined' && 'gpu' in navigator && !!navigator.gpu
  const hasWASM =
    typeof WebAssembly !== 'undefined' &&
    typeof WebAssembly.instantiate === 'function'
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true

  // Florence-2 model cache detection es asíncrono; lo dejamos como false
  // y se verifica explícitamente con checkModelCached().
  return {
    hasWebGPU,
    hasWASM,
    isOnline,
    florenceModelCached: false,
  }
}

let modelCachedPromise: Promise<boolean> | null = null

/**
 * Verifica si el modelo Florence-2 ya está cacheado en el dispositivo.
 * Usa Cache API (Transformers.js cachea los pesos en HTTP cache + Cache Storage).
 */
export async function checkModelCached(): Promise<boolean> {
  if (typeof caches === 'undefined') return false
  if (!modelCachedPromise) {
    modelCachedPromise = (async () => {
      try {
        // Transformers.js guarda los modelos en el Cache Storage bajo la clave
        // 'transformers-cache' o similar. Verificamos varias claves posibles.
        const keys = await caches.keys()
        const cacheKeys = keys.filter(
          (k) =>
            k.toLowerCase().includes('transformer') ||
            k.toLowerCase().includes('onnx') ||
            k.toLowerCase().includes('huggingface')
        )
        if (cacheKeys.length === 0) return false
        // Verificar que haya realmente archivos del modelo
        for (const key of cacheKeys) {
          const cache = await caches.open(key)
          const reqs = await cache.keys()
          // Si hay URLs que contengan 'florence2' o 'model.onnx', está cacheado
          const hasModel = reqs.some((r) =>
            r.url.toLowerCase().includes('florence')
          )
          if (hasModel) return true
        }
        return false
      } catch {
        return false
      }
    })()
  }
  return modelCachedPromise
}

/** Resetea el cache de detección (para tests o tras descarga). */
export function resetModelCacheDetection() {
  modelCachedPromise = null
}

/**
 * Devuelve la lista de motores disponibles ordenados por preferencia.
 */
export async function getEngines(): Promise<EngineInfo[]> {
  const caps = detectCapabilities()
  // No usamos checkModelCached() porque da falsos positivos.
  // El estado real lo determina el flag isFlorenceEnabled() del orquestador.
  // Para evitar dependencia circular, lo importamos dinámicamente.
  let florenceReady = false
  let nerReady = false
  try {
    const { isFlorenceEnabled, isNerEnabled } = await import('./orchestrator')
    florenceReady = isFlorenceEnabled()
    nerReady = isNerEnabled()
  } catch {
    // Si no se puede importar (SSR), asumir false
  }

  const engines: EngineInfo[] = []

  engines.push({
    name: 'florence2',
    label: 'IA en tu dispositivo (Florence-2)',
    description: florenceReady
      ? 'Modelo Florence-2 ya descargado. Funciona offline.'
      : 'Mejor precisión. Requiere WebGPU y descarga inicial de ~400MB.',
    status: caps.hasWebGPU
      ? florenceReady
        ? 'available'
        : 'needs-download'
      : 'unavailable',
    estimatedTime: '5-15s',
    accuracy: 'high',
    sizeLabel: florenceReady ? 'Cacheado' : '~400MB',
  })

  engines.push({
    name: 'tesseract-ner',
    label: 'OCR + IA (Tesseract + NER)',
    description: nerReady
      ? 'Tesseract + modelo NER cargado. Mejor detección de merchant.'
      : 'Tesseract + BERT español. Precisión media-alta. Descarga ~110MB.',
    status: caps.hasWASM ? 'available' : 'unavailable',
    estimatedTime: '15-40s',
    accuracy: 'high',
    sizeLabel: nerReady ? 'Cacheado' : '~110MB',
  })

  engines.push({
    name: 'tesseract',
    label: 'OCR en tu dispositivo',
    description: 'Funciona sin WebGPU. Precisión media. Sin descarga.',
    status: caps.hasWASM ? 'available' : 'unavailable',
    estimatedTime: '8-20s',
    accuracy: 'medium',
    sizeLabel: '~5MB',
  })

  engines.push({
    name: 'server',
    label: 'IA en el servidor',
    description: caps.isOnline
      ? 'Usa el modelo en la nube. Precisión alta, requiere conexión.'
      : 'No disponible sin conexión.',
    status: caps.isOnline ? 'available' : 'unavailable',
    estimatedTime: '3-5s',
    accuracy: 'high-but-server',
    sizeLabel: '0MB',
  })

  return engines
}

/**
 * Devuelve el motor recomendado automáticamente.
 */
export async function getRecommendedEngine(): Promise<EngineInfo> {
  const engines = await getEngines()
  const florenceEngine = engines.find((e) => e.name === 'florence2')
  const tesseractNerEngine = engines.find((e) => e.name === 'tesseract-ner')
  const tesseractEngine = engines.find((e) => e.name === 'tesseract')
  const serverEngine = engines.find((e) => e.name === 'server')

  // Si Florence está disponible (cacheado y WebGPU), es el mejor
  if (florenceEngine?.status === 'available') {
    return florenceEngine
  }
  // Si Tesseract+NER está disponible, es el siguiente mejor
  if (tesseractNerEngine?.status === 'available') {
    return tesseractNerEngine
  }
  // Si no está cacheado pero WebGPU disponible, recomendar descargar Florence
  if (florenceEngine?.status === 'needs-download') {
    return florenceEngine
  }
  // Si no WebGPU pero hay Tesseract, usarlo
  if (tesseractEngine?.status === 'available') {
    return tesseractEngine
  }
  // Último recurso: servidor
  if (serverEngine?.status === 'available') {
    return serverEngine
  }
  // Nada disponible
  return engines[0]
}
