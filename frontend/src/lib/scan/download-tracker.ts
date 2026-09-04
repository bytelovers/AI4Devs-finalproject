/**
 * Tracker de descarga para Transformers.js.
 *
 * Transformers.js descarga MÚLTIPLES archivos (encoder, decoder, processor,
 * tokenizer, vocab, weights, etc.) y reporta el progreso de cada uno por
 * separado. Si mostramos el porcentaje individual de cada archivo como
 * progreso global, el usuario verá saltos extraños (50%, 80%, 30%, 95%…).
 *
 * Este tracker agrega el progreso de todos los archivos y calcula:
 * - Bytes totales descargados / bytes totales
 * - Velocidad de descarga (MB/s)
 * - ETA (tiempo restante estimado)
 * - Archivo actual descargándose
 */

export interface DownloadFileState {
  name: string
  loaded: number
  total: number
  done: boolean
}

export interface DownloadSummary {
  /** Bytes totales de todos los archivos. */
  totalBytes: number
  /** Bytes descargados hasta el momento. */
  loadedBytes: number
  /** Porcentaje global 0-100 (puede ser undefined si no se conoce el total). */
  percent: number | undefined
  /** Velocidad en bytes/segundo. */
  bytesPerSecond: number
  /** Velocidad formateada legible (ej. "2.4 MB/s"). */
  speedLabel: string
  /** ETA en segundos. */
  etaSeconds: number | undefined
  /** ETA formateado legible (ej. "1m 30s"). */
  etaLabel: string | undefined
  /** Lista de archivos being tracked. */
  files: DownloadFileState[]
  /** Archivo descargándose ahora mismo. */
  currentFile: string | undefined
  /** Número de archivos completados. */
  filesCompleted: number
  /** Número total de archivos conocidos. */
  filesTotal: number
  /** MB descargados / MB totales (formateado). */
  sizeLabel: string
}

const SPEED_WINDOW_MS = 3000 // ventana para promedio móvil de velocidad

export class DownloadTracker {
  private files = new Map<string, DownloadFileState>()
  private samples: Array<{ t: number; loaded: number }> = []
  private startTime = 0

  /** Procesa un evento de Transformers.js. */
  update(info: any): DownloadSummary {
    if (!info || !info.file) return this.getSummary()

    if (this.startTime === 0) {
      this.startTime = Date.now()
    }

    const name = info.file
    const status = info.status

    if (status === 'initiate' || status === 'download') {
      // Inicio o en progreso
      const existing = this.files.get(name)
      const total =
        info.total ??
        existing?.total ??
        0
      const loaded = info.loaded ?? existing?.loaded ?? 0
      this.files.set(name, {
        name,
        loaded,
        total,
        done: false,
      })
    } else if (status === 'progress') {
      const loaded = info.loaded ?? 0
      const total = info.total ?? 0
      this.files.set(name, {
        name,
        loaded,
        total,
        done: false,
      })
      // Añadir muestra para cálculo de velocidad
      const totalLoaded = this.getTotalLoaded()
      const now = Date.now()
      this.samples.push({ t: now, loaded: totalLoaded })
      // Limpiar muestras viejas
      const cutoff = now - SPEED_WINDOW_MS
      while (this.samples.length > 0 && this.samples[0].t < cutoff) {
        this.samples.shift()
      }
    } else if (status === 'done') {
      const existing = this.files.get(name)
      if (existing) {
        this.files.set(name, {
          ...existing,
          done: true,
          loaded: existing.total || existing.loaded,
        })
      } else {
        this.files.set(name, {
          name,
          loaded: info.total ?? 0,
          total: info.total ?? 0,
          done: true,
        })
      }
    }

    return this.getSummary()
  }

  private getTotalLoaded(): number {
    let sum = 0
    for (const f of this.files.values()) {
      sum += f.loaded
    }
    return sum
  }

  private getTotalBytes(): number {
    let sum = 0
    for (const f of this.files.values()) {
      sum += f.total
    }
    return sum
  }

  private getSpeedBytesPerSecond(): number {
    if (this.samples.length < 2) return 0
    const first = this.samples[0]
    const last = this.samples[this.samples.length - 1]
    const dt = (last.t - first.t) / 1000
    if (dt <= 0) return 0
    const dLoaded = last.loaded - first.loaded
    return Math.max(0, dLoaded / dt)
  }

  private getSummary(): DownloadSummary {
    const totalBytes = this.getTotalBytes()
    const loadedBytes = this.getTotalLoaded()
    // El porcentaje global puede ser engañoso cuando solo se ha descubierto
    // 1 archivo de los 9+ totales del modelo Florence-2. Para que el usuario
    // no vea "100%" cuando en realidad falta mucho, suavizamos el porcentaje
    // asumiendo que el modelo Florence-2 base pesa ~1GB en total.
    const ESTIMATED_TOTAL = 1_000_000_000 // 1GB estimado para Florence-2 base
    const effectiveTotal = Math.max(totalBytes, ESTIMATED_TOTAL)
    const percent =
      totalBytes > 0
        ? Math.min(99, Math.round((loadedBytes / effectiveTotal) * 100))
        : undefined
    const speed = this.getSpeedBytesPerSecond()
    const etaSeconds =
      speed > 0 && effectiveTotal > loadedBytes
        ? Math.ceil((effectiveTotal - loadedBytes) / speed)
        : undefined

    // Archivo actual: el que no está done y tiene mayor loaded
    let currentFile: string | undefined
    let currentMax = -1
    let filesCompleted = 0
    for (const f of this.files.values()) {
      if (f.done) {
        filesCompleted++
      } else if (f.loaded > currentMax) {
        currentMax = f.loaded
        currentFile = f.name
      }
    }

    return {
      totalBytes,
      loadedBytes,
      percent,
      bytesPerSecond: speed,
      speedLabel: formatSpeed(speed),
      etaSeconds,
      etaLabel: etaSeconds !== undefined ? formatETA(etaSeconds) : undefined,
      files: Array.from(this.files.values()),
      currentFile,
      filesCompleted,
      filesTotal: this.files.size,
      // sizeLabel muestra lo descargado / lo conocido (no lo estimado)
      sizeLabel: totalBytes > 0
        ? `${formatBytes(loadedBytes)} / ${formatBytes(totalBytes)}`
        : formatBytes(loadedBytes),
    }
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

/** Formatea velocidad. */
export function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond <= 0) return '—'
  return `${formatBytes(bytesPerSecond)}/s`
}

/** Formatea ETA. */
export function formatETA(seconds: number): string {
  if (seconds < 0) return '—'
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m < 60) return `${m}m ${s.toString().padStart(2, '0')}s`
  const h = Math.floor(m / 60)
  const mm = m % 60
  return `${h}h ${mm.toString().padStart(2, '0')}m`
}
