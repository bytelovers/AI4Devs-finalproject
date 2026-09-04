import type { ImageQualityMetrics } from './types'

export interface QualityAssessorConfig {
  blurThreshold?: number          // Default: 100.0 (Laplacian variance)
  minBrightness?: number         // Default: 60.0 (0-255 scale)
  maxBrightness?: number         // Default: 220.0 (0-255 scale)
  minContrast?: number           // Default: 25.0 (RMS contrast)
  minCharHeightPx?: number       // Default: 32.0 (pixels)
}

/**
 * Computes Laplacian variance for a single-channel grayscale buffer.
 * High scores (>= 100.0) indicate sharp edge detail. Low scores (< 100.0) indicate blur.
 */
export function computeLaplacianVariance(
  gray: Uint8ClampedArray,
  width: number,
  height: number
): number {
  if (width < 3 || height < 3) return 0.0

  const innerW = width - 2
  const innerH = height - 2
  const totalInner = innerW * innerH
  if (totalInner <= 0) return 0.0

  // 1. First pass: compute Laplacian response L(x, y) and sum
  let sumL = 0
  const responses = new Float32Array(totalInner)
  let idx = 0

  for (let y = 1; y < height - 1; y++) {
    const rowOffset = y * width
    for (let x = 1; x < width - 1; x++) {
      const center = rowOffset + x
      const val =
        gray[center - width] +
        gray[center + width] +
        gray[center - 1] +
        gray[center + 1] -
        4 * gray[center]

      responses[idx++] = val
      sumL += val
    }
  }

  const meanL = sumL / totalInner

  // 2. Second pass: compute variance sum
  let sumSquareDiff = 0
  for (let i = 0; i < totalInner; i++) {
    const diff = responses[i] - meanL
    sumSquareDiff += diff * diff
  }

  return sumSquareDiff / totalInner
}

/**
 * Computes RMS contrast ratio for a single-channel grayscale buffer.
 */
export function computeRmsContrast(
  gray: Uint8ClampedArray,
  meanLuminance: number
): number {
  if (gray.length === 0) return 0.0

  let sumSquareDiff = 0
  for (let i = 0; i < gray.length; i++) {
    const diff = gray[i] - meanLuminance
    sumSquareDiff += diff * diff
  }

  return Math.sqrt(sumSquareDiff / gray.length)
}

/**
 * Estimates character typography height (in pixels) using vertical luminance profile analysis.
 */
export function estimateCharacterHeight(
  gray: Uint8ClampedArray,
  width: number,
  height: number
): number {
  if (width === 0 || height === 0) return 32

  const startX = Math.floor(width * 0.25)
  const endX = Math.ceil(width * 0.75)
  const sampleWidth = Math.max(1, endX - startX)

  const runLengths: number[] = []

  for (let x = startX; x < endX; x += Math.max(1, Math.floor(sampleWidth / 10))) {
    let currentRun = 0
    let inStroke = false

    for (let y = 0; y < height; y++) {
      const val = gray[y * width + x]
      // Consider dark pixels (< 128) as text strokes
      if (val < 128) {
        currentRun++
        inStroke = true
      } else {
        if (inStroke) {
          if (currentRun >= 4 && currentRun <= 120) {
            runLengths.push(currentRun)
          }
          currentRun = 0
          inStroke = false
        }
      }
    }
    if (inStroke && currentRun >= 4 && currentRun <= 120) {
      runLengths.push(currentRun)
    }
  }

  if (runLengths.length === 0) {
    return Math.max(8, Math.round(height * 0.015))
  }

  // Median run length
  runLengths.sort((a, b) => a - b)
  const median = runLengths[Math.floor(runLengths.length / 2)]
  return Math.max(8, median)
}

/**
 * High-level Image Quality Assessor Engine.
 * Evaluates ImageData for blur, contrast, brightness, and character height metrics,
 * returning structured ImageQualityMetrics with status flags and UI banner recommendations.
 */
export function assessImageQuality(
  imageData: ImageData,
  config: QualityAssessorConfig = {}
): ImageQualityMetrics {
  const {
    blurThreshold = 100.0,
    minBrightness = 60.0,
    minContrast = 25.0,
  } = config

  const { data, width, height } = imageData
  const totalPixels = width * height

  // 1. Convert RGBA to Grayscale and compute mean luminance
  const gray = new Uint8ClampedArray(totalPixels)
  let sumY = 0

  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    const y = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
    gray[j] = y
    sumY += y
  }

  const meanLuminance = totalPixels > 0 ? sumY / totalPixels : 0

  // 2. Compute metrics
  const laplacianVar = computeLaplacianVariance(gray, width, height)
  const rmsContrast = computeRmsContrast(gray, meanLuminance)
  const estCharHeight = estimateCharacterHeight(gray, width, height)

  // 3. Evaluate Quality Status & Messages
  let status: ImageQualityMetrics['status'] = 'optimal'
  let badgeText = '✅ Calidad de imagen óptima para OCR'
  let warningMessage: string | undefined
  const recommendations: ImageQualityMetrics['recommendations'] = ['proceed']

  if (laplacianVar < blurThreshold) {
    status = 'warning_blur'
    warningMessage = '⚠️ Imagen borrosa - Te recomendamos repetir la foto'
    recommendations.unshift('retake')
  } else if (meanLuminance < minBrightness) {
    status = 'warning_dark'
    warningMessage = '⚠️ Imagen muy oscura / bajo contraste - Ajusta el brillo o repite la foto'
    recommendations.unshift('auto_adjust', 'retake')
  } else if (rmsContrast < minContrast) {
    status = 'warning_low_contrast'
    warningMessage = '⚠️ Bajo contraste detectado - Se recomienda activar Binarización'
    recommendations.unshift('auto_adjust')
  }

  return {
    laplacianVariance: Number(laplacianVar.toFixed(1)),
    gradientVariance: Number((laplacianVar * 0.85).toFixed(1)),
    contrastRatio: Number(rmsContrast.toFixed(1)),
    brightnessScore: Number(meanLuminance.toFixed(1)),
    estimatedCharHeightPx: estCharHeight,
    status,
    badgeText,
    warningMessage,
    recommendations,
    assessedAt: new Date().toISOString(),
  }
}
