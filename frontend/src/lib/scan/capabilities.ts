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
 * Clave donde se persiste que el modelo Florence-2 está descargado.
 * El valor solo se mantiene cuando la verificación real de la cache lo confirma
 * (ver refreshFlorenceDownloadState).
 */
export const FLORENCE_CACHED_STORAGE_KEY = 'cuadra-florence-cached'

function readFlorenceStorage(): boolean {
  try {
    return localStorage.getItem(FLORENCE_CACHED_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

/** Lee el flag persistido de descarga de Florence-2 (puede estar obsoleto). */
export function isFlorenceDownloadPersisted(): boolean {
  return readFlorenceStorage()
}

/** Escribe (true) o limpia (false) el flag persistido de descarga. */
export function persistFlorenceDownloadState(downloaded: boolean): void {
  try {
    if (downloaded) {
      localStorage.setItem(FLORENCE_CACHED_STORAGE_KEY, '1')
    } else {
      localStorage.removeItem(FLORENCE_CACHED_STORAGE_KEY)
    }
  } catch {
    // localStorage puede no estar disponible (modo privado/SSR): ignorar.
  }
}

/**
 * Verifica la cache real del dispositivo y sincroniza el flag persistido.
 * Es la fuente de verdad: el flag solo se conserva si el modelo está realmente
 * descargado; si no, se limpia. Memoizada por sesión a través de checkModelCached.
 */
export async function refreshFlorenceDownloadState(): Promise<boolean> {
  const cached = await checkModelCached()
  persistFlorenceDownloadState(cached)
  return cached
}

/**
 * Verifica si el modelo Florence-2 está realmente cacheado en el dispositivo.
 *
 * Transformers.js v4 guarda los pesos en Cache Storage bajo la clave
 * 'transformers-cache' con las URLs del Hugging Face Hub. Para evitar falsos
 * positivos (metadata/tokenizers de otros modelos o descargas parciales), solo
 * se considera descargado cuando existen los pesos ONNX del modelo Florence-2.
 */
export async function checkModelCached(): Promise<boolean> {
  if (typeof caches === 'undefined') return false
  if (!modelCachedPromise) {
    modelCachedPromise = (async () => {
      try {
        const cache = await caches.open('transformers-cache')
        const reqs = await cache.keys()
        // El modelo solo está listo si hay pesos ONNX reales de Florence-2
        // (p. ej. .../onnx-community/Florence-2-base/resolve/main/onnx/*.onnx).
        return reqs.some((r) => {
          const url = r.url.toLowerCase()
          return url.includes('florence-2-base') && url.includes('.onnx')
        })
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
  // La bandera de sesión del orquestador (isFlorenceEnabled) es fiable tras una
  // descarga en esta sesión, pero se pierde al recargar. Para el arranque,
  // la fuente de verdad es la cache real del dispositivo: si el flag persistido
  // dice "descargado" (o simplemente aún no lo hemos comprobado), verificamos
  // el modelo en el dispositivo antes de marcarlo como disponible.
  let florenceReady = false
  let nerReady = false
  try {
    const { isFlorenceEnabled, isNerEnabled } = await import('./orchestrator')
    florenceReady = isFlorenceEnabled()
    nerReady = isNerEnabled()
  } catch {
    // Si no se puede importar (SSR), asumir false
  }

  if (caps.hasWebGPU && !florenceReady) {
    // Verificación real (memoizada por sesión) + sincronización del flag persistido.
    florenceReady = await refreshFlorenceDownloadState()
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
    requiresDownload: !florenceReady,
    precision: 'Alta',
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
    requiresDownload: !nerReady,
    precision: 'Media-Alta',
  })

  engines.push({
    name: 'tesseract',
    label: 'OCR en tu dispositivo',
    description: 'Funciona sin WebGPU. Precisión media. Sin descarga.',
    status: caps.hasWASM ? 'available' : 'unavailable',
    estimatedTime: '8-20s',
    accuracy: 'medium',
    sizeLabel: '~5MB',
    precision: 'Media',
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
    requiresConnection: true,
    precision: 'Alta',
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
