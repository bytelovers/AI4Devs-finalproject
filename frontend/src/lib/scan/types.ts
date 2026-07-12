// Tipos compartidos del módulo de escaneo on-device

export interface ScanInput {
  /** Imagen original en data URL (jpeg/png). */
  imageDataUrl: string
  /** Si debe forzarse el uso del servidor (si el usuario lo pide). */
  forceServer?: boolean
}

export interface ScanResult {
  /** Items detectados en el ticket. */
  items: Array<{
    name: string
    quantity: number
    unitPrice: number
  }>
  /** Descuentos detectados en el ticket. */
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
  /** Motor utilizado para el escaneo. */
  engine: ScanEngineName
  /** Confianza estimada 0-1 (si está disponible). */
  confidence?: number
  /** Imagen preprocesada (data URL) tras OpenCV. */
  preprocessedImageDataUrl?: string
  /** Texto crudo extraído (para depuración). */
  rawText?: string
}

export type ScanEngineName =
  | 'florence2' // On-device VLM (WebGPU)
  | 'tesseract' // On-device OCR (WASM)
  | 'tesseract-ner' // On-device OCR + NER (WASM)
  | 'server' // Server VLM (z-ai glm-4.5v)

export interface ScanProgress {
  phase:
    | 'preprocessing'
    | 'loading-model'
    | 'running-inference'
    | 'parsing'
    | 'done'
    | 'error'
  message: string
  /** Progreso 0-100 (si está disponible). */
  percent?: number
  /** Información detallada de descarga (solo durante loading-model). */
  download?: import('./download-tracker').DownloadSummary
}

export type ProgressCallback = (progress: ScanProgress) => void

export interface ScanCapabilities {
  /** WebGPU disponible (necesario para Florence-2). */
  hasWebGPU: boolean
  /** WASM disponible (necesario para Tesseract.js). */
  hasWASM: boolean
  /** Si la app puede llamar al servidor (online). */
  isOnline: boolean
  /** Si el modelo Florence-2 ya está cacheado en el dispositivo. */
  florenceModelCached: boolean
}

export type ScanEngineStatus =
  | 'available'
  | 'needs-download'
  | 'unavailable'

export interface EngineInfo {
  name: ScanEngineName
  label: string
  description: string
  status: ScanEngineStatus
  estimatedTime: string
  accuracy: 'high' | 'medium' | 'high-but-server'
  sizeLabel?: string
}
