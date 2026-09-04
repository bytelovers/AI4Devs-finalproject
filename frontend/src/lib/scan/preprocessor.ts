/**
 * Preprocesador de imagen para mejorar la precisión del OCR/VLM.
 * Implementado 100% con Canvas API (sin OpenCV.js ni dependencias externas).
 *
 * Pipeline:
 * 1. Reescalado a resolución óptima para el modelo (preservando aspect ratio)
 * 2. Conversión a escala de grises (luminancia ponderada)
 * 3. Equalización de histograma (similar a CLAHE pero más simple y rápido)
 * 4. Aumento de contraste adaptativo
 * 5. Filtro de mediana para reducir ruido (opcional, solo si la imagen es ruidosa)
 *
 * Todo se ejecuta en el main thread pero con imágenes ya reescaladas el coste
 * es <200ms en móvil. No hay downloads externos, no hay WASM que inicializar.
 */

import type {
  NormalizedCropRect,
  ResolutionConfig,
  ImageAdjustmentOptions,
  MultiSectionPreprocessResult,
  PreprocessedSection,
  QualityAssessmentSummary,
} from './types'

interface PreprocessOptions {
  /** Ancho máximo de salida. Default 1280. */
  maxWidth?: number
  /** Si aplicar equalización de histograma. Default true. */
  equalizeHistogram?: boolean
  /** Factor de contraste adicional (1.0 = sin cambio). Default 1.2. */
  contrast?: number
  /** Si aplicar filtro de mediana 3x3. Default false (es caro). */
  denoise?: boolean
}

/**
 * Preprocesa una imagen de ticket para mejorar el OCR.
 * Devuelve data URL JPEG de la imagen procesada.
 */
export async function preprocessReceiptImage(
  imageDataUrl: string,
  options: PreprocessOptions = {}
): Promise<string> {
  const {
    maxWidth = 1280,
    equalizeHistogram = true,
    contrast = 1.2,
    denoise = false,
  } = options

  try {
    const img = await loadImageElement(imageDataUrl)

    // 1. Reescalar manteniendo aspect ratio
    const scale = Math.min(1, maxWidth / img.width)
    const targetW = Math.round(img.width * scale)
    const targetH = Math.round(img.height * scale)

    const canvas = createCanvas(targetW, targetH)
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) {
      // Sin contexto 2D, devolver original
      return imageDataUrl
    }

    // Usar imageSmoothingQuality alta para el reescalado
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, 0, 0, targetW, targetH)

    const imageData = ctx.getImageData(0, 0, targetW, targetH)
    const data = imageData.data

    // 2. Escala de grises (luminancia ponderada BT.601)
    const gray = new Uint8ClampedArray(targetW * targetH)
    for (let i = 0, j = 0; i < data.length; i += 4, j++) {
      gray[j] = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) | 0
    }

    // 3. Equalización de histograma (estira el rango dinámico)
    let working: Uint8ClampedArray = gray
    if (equalizeHistogram) {
      working = equalizeHistogramFn(gray)
    }

    // 4. Aumento de contraste lineal
    if (contrast !== 1.0) {
      const intercept = 128 * (1 - contrast)
      for (let i = 0; i < working.length; i++) {
        working[i] = Math.max(0, Math.min(255, contrast * working[i] + intercept))
      }
    }

    // 5. Filtro de mediana 3x3 (opcional, reduce ruido sal/pimienta)
    if (denoise) {
      working = medianFilter3x3(working, targetW, targetH)
    }

    // 6. Escribir de vuelta al ImageData como grayscale RGB
    for (let i = 0, j = 0; i < data.length; i += 4, j++) {
      const v = working[j]
      data[i] = v
      data[i + 1] = v
      data[i + 2] = v
      data[i + 3] = 255
    }

    ctx.putImageData(imageData, 0, 0)
    return await canvasToDataUrl(canvas)
  } catch (err) {
    console.warn('[preprocess] error, devolviendo original:', err)
    return imageDataUrl
  }
}

/** Crea un canvas (OffscreenCanvas en Web Worker, HTMLCanvasElement en main thread). */
function createCanvas(
  width: number,
  height: number
): HTMLCanvasElement | OffscreenCanvas {
  if (typeof document !== 'undefined' && typeof HTMLCanvasElement !== 'undefined') {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    return canvas
  }
  return new OffscreenCanvas(width, height)
}

/** Serializa un canvas a data URL JPEG (worker-safe). */
async function canvasToDataUrl(
  canvas: HTMLCanvasElement | OffscreenCanvas
): Promise<string> {
  if ('toDataURL' in canvas) {
    return canvas.toDataURL('image/jpeg', 0.92)
  }
  // OffscreenCanvas: convertToBlob + FileReader (patrón de tesseract-engine).
  const blob = await (canvas as OffscreenCanvas).convertToBlob({
    type: 'image/jpeg',
    quality: 0.92,
  })
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('No se pudo convertir el canvas'))
    reader.readAsDataURL(blob)
  })
}

/**
 * Equalización de histograma simple.
 * Calcula el histograma de la imagen, la CDF y mapea cada pixel
 * al valor equalizado. Mejora el contraste en imágenes con iluminación irregular.
 */
export function equalizeHistogramFn(
  gray: Uint8ClampedArray
): Uint8ClampedArray {
  const hist = new Uint32Array(256)
  for (let i = 0; i < gray.length; i++) {
    hist[gray[i]]++
  }

  // CDF (cumulative distribution function)
  const cdf = new Uint32Array(256)
  let sum = 0
  for (let i = 0; i < 256; i++) {
    sum += hist[i]
    cdf[i] = sum
  }

  // Encontrar cdf min no-cero
  let cdfMin = 0
  for (let i = 0; i < 256; i++) {
    if (cdf[i] > 0) {
      cdfMin = cdf[i]
      break
    }
  }

  const total = gray.length
  const lut = new Uint8ClampedArray(256)
  const denom = total - cdfMin
  if (denom <= 0) {
    // Imagen uniforme, no equalizar
    return gray
  }
  for (let i = 0; i < 256; i++) {
    lut[i] = Math.round(((cdf[i] - cdfMin) / denom) * 255)
  }

  const result = new Uint8ClampedArray(gray.length)
  for (let i = 0; i < gray.length; i++) {
    result[i] = lut[gray[i]]
  }
  return result
}

/**
 * Filtro de mediana 3x3 para reducir ruido sal/pimienta.
 * Más lento que un promedio pero preserva bordes.
 */
export function medianFilter3x3(
  src: Uint8ClampedArray,
  width: number,
  height: number
): Uint8ClampedArray {
  const dst = new Uint8ClampedArray(src.length)
  const window = new Uint8ClampedArray(9)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let k = 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const sx = Math.min(width - 1, Math.max(0, x + dx))
          const sy = Math.min(height - 1, Math.max(0, y + dy))
          window[k++] = src[sy * width + sx]
        }
      }
      // Insertion sort (solo 9 elementos)
      for (let i = 1; i < 9; i++) {
        const v = window[i]
        let j = i - 1
        while (j >= 0 && window[j] > v) {
          window[j + 1] = window[j]
          j--
        }
        window[j + 1] = v
      }
      dst[y * width + x] = window[4] // mediana
    }
  }
  return dst
}

/**
 * Adaptive integral image binarization (Bradley-Roth algorithm).
 * O(N) execution time using Uint32Array integral image prefix sums.
 */
export function applyAdaptiveThreshold(
  gray: Uint8ClampedArray,
  width: number,
  height: number,
  windowSizeRatio = 0.125,
  thresholdOffset = 15
): Uint8ClampedArray {
  const size = width * height
  if (size === 0) return new Uint8ClampedArray(0)

  const output = new Uint8ClampedArray(size)
  const integral = new Uint32Array(size)

  for (let y = 0; y < height; y++) {
    let sum = 0
    const rowOffset = y * width
    for (let x = 0; x < width; x++) {
      sum += gray[rowOffset + x]
      if (y === 0) {
        integral[rowOffset + x] = sum
      } else {
        integral[rowOffset + x] = integral[(y - 1) * width + x] + sum
      }
    }
  }

  const s = Math.max(3, Math.round(width * windowSizeRatio))
  const s2 = Math.floor(s / 2)

  for (let y = 0; y < height; y++) {
    const y1 = Math.max(0, y - s2)
    const y2 = Math.min(height - 1, y + s2)

    for (let x = 0; x < width; x++) {
      const x1 = Math.max(0, x - s2)
      const x2 = Math.min(width - 1, x + s2)

      const count = (x2 - x1 + 1) * (y2 - y1 + 1)

      const sum =
        integral[y2 * width + x2] -
        (x1 > 0 ? integral[y2 * width + (x1 - 1)] : 0) -
        (y1 > 0 ? integral[(y1 - 1) * width + x2] : 0) +
        (x1 > 0 && y1 > 0 ? integral[(y1 - 1) * width + (x1 - 1)] : 0)

      const idx = y * width + x
      if (gray[idx] * count < sum * (1 - thresholdOffset / 100)) {
        output[idx] = 0
      } else {
        output[idx] = 255
      }
    }
  }

  return output
}

export interface OptimalCropScaleResult {
  scale: number
  targetWidth: number
  targetHeight: number
  calculatedDpi: number
}

/**
 * Calculates optimal scale factor, output bounds, and effective DPI for a crop region.
 */
export function calculateOptimalCropScale(
  sourceWidth: number,
  sourceHeight: number,
  cropRect: NormalizedCropRect,
  config?: Partial<ResolutionConfig>
): OptimalCropScaleResult {
  const cropW = Math.max(1, Math.round(sourceWidth * cropRect.width))
  const cropH = Math.max(1, Math.round(sourceHeight * cropRect.height))

  const preset = config?.preset ?? 'auto'
  const customScale = config?.customScale
  const minCharHeightPx = config?.minCharHeightPx ?? 32
  const baseDpi = config?.targetDpi ?? 300

  let scale = 1.0

  if (customScale && customScale > 0) {
    scale = customScale
  } else if (preset === 'native') {
    scale = 1.0
  } else if (preset === '1080p') {
    const longEdge = Math.max(cropW, cropH)
    scale = Math.min(1.0, 1080 / longEdge)
  } else if (preset === '1280px') {
    const longEdge = Math.max(cropW, cropH)
    scale = Math.min(1.0, 1280 / longEdge)
  } else if (preset === '1600px') {
    const longEdge = Math.max(cropW, cropH)
    scale = Math.min(1.0, 1600 / longEdge)
  } else if (preset === '2048px') {
    const longEdge = Math.max(cropW, cropH)
    scale = Math.min(1.0, 2048 / longEdge)
  } else {
    // 'auto' preset
    if (cropH < 100 || cropW < 100) {
      const estimatedCurrentCharHeight = Math.max(8, cropH * 0.1)
      scale = Math.max(1.5, Math.round((minCharHeightPx / estimatedCurrentCharHeight) * 10) / 10)
    } else {
      const longEdge = Math.max(cropW, cropH)
      if (longEdge > 2048) {
        scale = 2048 / longEdge
      } else {
        scale = 1.0
      }
    }
  }

  const targetWidth = Math.max(1, Math.round(cropW * scale))
  const targetHeight = Math.max(1, Math.round(cropH * scale))
  const calculatedDpi = Math.round(baseDpi * scale)

  return {
    scale,
    targetWidth,
    targetHeight,
    calculatedDpi,
  }
}

/**
 * Preprocesses a multi-section ticket image using canvas slice operations,
 * color transformations, adaptive binarization, and scaling.
 */
export async function preprocessMultiSectionReceipt(
  imageDataUrl: string,
  adjustments: ImageAdjustmentOptions
): Promise<MultiSectionPreprocessResult> {
  const img = await loadImageElement(imageDataUrl)
  const sections =
    adjustments.sections && adjustments.sections.length > 0
      ? adjustments.sections
      : [
          {
            id: 'sec_full',
            label: 'Full Receipt',
            rect: { x: 0, y: 0, width: 1, height: 1 },
            order: 1,
          },
        ]

  const processedSections: PreprocessedSection[] = []

  for (const section of sections) {
    const scaleRes = calculateOptimalCropScale(
      img.width,
      img.height,
      section.rect,
      adjustments.resolution
    )

    const cropX = Math.round(img.width * section.rect.x)
    const cropY = Math.round(img.height * section.rect.y)
    const cropW = Math.max(1, Math.round(img.width * section.rect.width))
    const cropH = Math.max(1, Math.round(img.height * section.rect.height))

    const canvas = document.createElement('canvas')
    canvas.width = scaleRes.targetWidth
    canvas.height = scaleRes.targetHeight
    const ctx = canvas.getContext('2d', { willReadFrequently: true })

    if (ctx) {
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      if (adjustments.rotation && adjustments.rotation !== 0) {
        ctx.save()
        ctx.translate(canvas.width / 2, canvas.height / 2)
        ctx.rotate((adjustments.rotation * Math.PI) / 180)
        ctx.drawImage(
          img,
          cropX,
          cropY,
          cropW,
          cropH,
          -canvas.width / 2,
          -canvas.height / 2,
          canvas.width,
          canvas.height
        )
        ctx.restore()
      } else {
        ctx.drawImage(
          img,
          cropX,
          cropY,
          cropW,
          cropH,
          0,
          0,
          scaleRes.targetWidth,
          scaleRes.targetHeight
        )
      }

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      const brightness = adjustments.brightness || 0
      const contrast = adjustments.contrast ?? 1.0
      const applyGray = adjustments.grayscale || adjustments.binarization

      const gray = new Uint8ClampedArray(canvas.width * canvas.height)

      for (let i = 0, j = 0; i < data.length; i += 4, j++) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]

        let lum = 0.299 * r + 0.587 * g + 0.114 * b

        if (contrast !== 1.0) {
          lum = contrast * (lum - 128) + 128
        }
        if (brightness !== 0) {
          lum += brightness
        }
        gray[j] = Math.max(0, Math.min(255, lum))
      }

      let finalGray: Uint8ClampedArray = gray
      if (adjustments.binarization) {
        finalGray = applyAdaptiveThreshold(gray, canvas.width, canvas.height)
      }

      for (let i = 0, j = 0; i < data.length; i += 4, j++) {
        const val = applyGray ? finalGray[j] : gray[j]
        data[i] = val
        data[i + 1] = val
        data[i + 2] = val
        data[i + 3] = 255
      }
      ctx.putImageData(imageData, 0, 0)
    }

    let dataUrl = ''
    try {
      dataUrl = canvas.toDataURL('image/jpeg', 0.92)
    } catch {
      dataUrl = imageDataUrl
    }

    processedSections.push({
      sectionId: section.id,
      order: section.order,
      dataUrl,
      width: scaleRes.targetWidth,
      height: scaleRes.targetHeight,
      calculatedDpi: scaleRes.calculatedDpi,
    })
  }

  let qualitySummary: QualityAssessmentSummary | undefined
  if (adjustments.qualityMetrics) {
    qualitySummary = {
      laplacianVariance: adjustments.qualityMetrics.laplacianVariance,
      brightnessScore: adjustments.qualityMetrics.brightnessScore,
      contrastRatio: adjustments.qualityMetrics.contrastRatio,
      status: adjustments.qualityMetrics.status,
    }
  }

  return {
    sections: processedSections,
    originalWidth: img.width,
    originalHeight: img.height,
    processedAt: new Date().toISOString(),
    qualitySummary,
  }
}

async function loadImageElement(src: string): Promise<HTMLImageElement | ImageBitmap> {
  // En Web Worker no existe HTMLImageElement (Image) ni document: usar
  // createImageBitmap + OffscreenCanvas (API disponible en workers).
  if (typeof Image === 'undefined' || typeof document === 'undefined') {
    const res = await fetch(src)
    const blob = await res.blob()
    return createImageBitmap(blob)
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('No se pudo cargar la imagen'))
    img.src = src
  })
}

