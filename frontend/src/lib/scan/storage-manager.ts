/**
 * Gestión de almacenamiento del navegador.
 * Detecta cuota, limpia caché antigua y maneja errores de quota excedida.
 */

const SCANNABLE_CACHE_KEYS = [
  'transformers-cache',
  'onnx-community',
  'huggingface',
  'ort-cache',
]

/**
 * Verifica si hay suficiente espacio disponible para descargar el modelo.
 * Devuelve info sobre el almacenamiento.
 */
export async function getStorageInfo(): Promise<{
  usage: number
  quota: number
  percentUsed: number
  available: number
}> {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) {
    return { usage: 0, quota: 0, percentUsed: 0, available: 0 }
  }
  const estimate = await navigator.storage.estimate()
  const usage = estimate.usage ?? 0
  const quota = estimate.quota ?? 0
  const percentUsed = quota > 0 ? (usage / quota) * 100 : 0
  const available = quota > usage ? quota - usage : 0
  return { usage, quota, percentUsed, available }
}

/**
 * Limpia cachés relacionados con modelos de IA descargados previamente.
 * Útil cuando el navegador reporta quota excedida.
 * No toca los datos de la app (localStorage 'cuadra-app-v1').
 */
export async function clearModelCaches(): Promise<{
  cleared: boolean
  bytesFreed: number
  message: string
}> {
  if (typeof caches === 'undefined') {
    return {
      cleared: false,
      bytesFreed: 0,
      message: 'Cache API no disponible',
    }
  }

  let bytesFreed = 0
  let clearedAny = false

  try {
    const keys = await caches.keys()
    for (const key of keys) {
      // Solo limpiar cachés relacionados con modelos de IA
      const isModelCache =
        SCANNABLE_CACHE_KEYS.some((s) => key.toLowerCase().includes(s)) ||
        key.toLowerCase().includes('transformer') ||
        key.toLowerCase().includes('onnx') ||
        key.toLowerCase().includes('huggingface') ||
        key.toLowerCase().includes('ort')

      if (isModelCache) {
        const cache = await caches.open(key)
        const reqs = await cache.keys()
        for (const req of reqs) {
          // Estimar tamaño (aproximado)
          const response = await cache.match(req)
          if (response) {
            const blob = await response.blob()
            bytesFreed += blob.size
          }
        }
        await caches.delete(key)
        clearedAny = true
      }
    }

    // También limpiar IndexedDB si hay bases de datos de modelos
    if (typeof indexedDB !== 'undefined' && indexedDB.databases) {
      try {
        const dbs = await indexedDB.databases()
        for (const db of dbs) {
          if (db.name && db.name.toLowerCase().includes('transformer')) {
            indexedDB.deleteDatabase(db.name)
            clearedAny = true
          }
        }
      } catch {
        // Algunos navegadores no soportan databases()
      }
    }

    return {
      cleared: clearedAny,
      bytesFreed,
      message: clearedAny
        ? `Se liberaron ${formatBytes(bytesFreed)} de caché`
        : 'No había caché de modelos para limpiar',
    }
  } catch (err) {
    return {
      cleared: false,
      bytesFreed: 0,
      message: `Error limpiando caché: ${err instanceof Error ? err.message : 'desconocido'}`,
    }
  }
}

/**
 * Verifica si hay espacio suficiente para descargar el modelo Florence-2 (~400MB).
 * Si no hay, sugiere limpiar caché.
 */
export async function checkStorageForModel(): Promise<{
  ok: boolean
  available: number
  required: number
  message: string
}> {
  const REQUIRED = 500 * 1024 * 1024 // 500MB (margen sobre los 400MB del modelo)
  const info = await getStorageInfo()

  if (info.quota === 0) {
    // No se pudo estimar, asumir OK
    return {
      ok: true,
      available: 0,
      required: REQUIRED,
      message: 'No se pudo verificar el almacenamiento. Procede con precaución.',
    }
  }

  if (info.available >= REQUIRED) {
    return {
      ok: true,
      available: info.available,
      required: REQUIRED,
      message: `Espacio suficiente: ${formatBytes(info.available)} disponibles`,
    }
  }

  return {
    ok: false,
    available: info.available,
    required: REQUIRED,
    message: `Espacio insuficiente. Necesitas ~${formatBytes(REQUIRED)} pero solo tienes ${formatBytes(info.available)} disponibles. Libera espacio borrando caché o datos de navegación.`,
  }
}

/** Formatea bytes a unidad legible. */
export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let v = bytes
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  if (i === 0) return `${Math.round(v)} ${units[i]}`
  return `${v.toFixed(i === 1 ? 0 : 1)} ${units[i]}`
}
