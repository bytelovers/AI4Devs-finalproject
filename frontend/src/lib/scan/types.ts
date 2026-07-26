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

/** Bounding box in normalized coordinates (0.0 to 1.0) relative to image dimensions */
export interface NormalizedCropRect {
  x: number      // left ratio (0..1)
  y: number      // top ratio (0..1)
  width: number  // width ratio (0..1)
  height: number // height ratio (0..1)
}

/** Individual crop section definition for multi-section receipts */
export interface CropSection {
  id: string
  label: string
  rect: NormalizedCropRect
  order: number
}

/** Preset resolution configurations */
export type ResolutionPreset = '1080p' | '1280px' | '1600px' | '2048px' | 'native' | 'auto'

/** Detailed resolution configuration options */
export interface ResolutionConfig {
  preset: ResolutionPreset
  customScale?: number // Manual multiplier (1.0 to 4.0)
  targetDpi?: number   // Target DPI override (default 300)
  minCharHeightPx?: number // Minimum font size in canvas pixels (default 32)
}

/** Detailed metric breakdown computed by the Image Quality Assessor */
export interface ImageQualityMetrics {
  laplacianVariance: number        // Blur metric: Higher means sharper (>= 100 sharp, < 100 blurry)
  gradientVariance: number         // Edge gradient sharpness score
  contrastRatio: number            // RMS contrast score (0 to 100)
  brightnessScore: number          // Average luminance score (0 to 255)
  estimatedCharHeightPx: number    // Estimated typography character height in pixels
  status: 'optimal' | 'warning_blur' | 'warning_dark' | 'warning_low_contrast' | 'critical'
  badgeText: string                // e.g. "✅ Calidad de imagen óptima para OCR"
  warningMessage?: string          // e.g. "⚠️ Imagen borrosa - Te recomendamos repetir la foto"
  recommendations: Array<'retake' | 'auto_adjust' | 'upscale' | 'proceed'>
  assessedAt: string
}

/** Persistent quality metadata summary stored inside draft ticket metadata (Hybrid Persistence) */
export interface QualityAssessmentSummary {
  laplacianVariance: number
  brightnessScore: number
  contrastRatio: number
  status: ImageQualityMetrics['status']
  userActionTaken?: 'accepted_optimal' | 'overridden_warning' | 'auto_fixed' | 'retaken'
}

/** Comprehensive image adjustment state */
export interface ImageAdjustmentOptions {
  sections: CropSection[]
  brightness: number       // -100 to +100 (default 0)
  contrast: number         // 0.5 to 2.5 (default 1.0)
  grayscale: boolean       // default false
  binarization: boolean    // default false
  binarizationThreshold?: number // 0 to 255 (adaptive auto if undefined)
  zoom: number             // 1.0 to 4.0
  rotation: number         // 0, 90, 180, 270 degrees
  resolution: ResolutionConfig
  qualityMetrics?: ImageQualityMetrics // Real-time quality evaluation result (transient session state)
}

/** Output resulting from processing a single crop section */
export interface PreprocessedSection {
  sectionId: string
  order: number
  dataUrl: string
  width: number
  height: number
  calculatedDpi: number
}

/** Output payload after running preprocessor pipeline */
export interface MultiSectionPreprocessResult {
  sections: PreprocessedSection[]
  originalWidth: number
  originalHeight: number
  processedAt: string
  qualitySummary?: QualityAssessmentSummary
}

/** Individual section OCR payload sent to merger engine */
export interface SectionOcrPayload {
  sectionId: string
  order: number
  scanResult: ScanResult
}

/** Merged multi-section OCR output */
export interface MergedTicketScanResult {
  merchant?: string
  date?: string
  items: Array<{ name: string; quantity: number; unitPrice: number }>
  subtotal?: number
  taxRate?: number
  taxAmount?: number
  total?: number
  rawTextCombined: string
  confidence: number
  sectionCount: number
  qualitySummary?: QualityAssessmentSummary
}

