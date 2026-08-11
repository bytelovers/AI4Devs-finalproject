import { describe, it, expect } from 'vitest'
import {
  assessImageQuality,
  computeLaplacianVariance,
  computeRmsContrast,
  estimateCharacterHeight,
} from './imageQualityAssessor'

/** Helper to create synthetic ImageData for testing */
function createMockImageData(
  width: number,
  height: number,
  pixelGenerator: (x: number, y: number) => [number, number, number, number]
): ImageData {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const [r, g, b, a] = pixelGenerator(x, y)
      data[idx] = r
      data[idx + 1] = g
      data[idx + 2] = b
      data[idx + 3] = a
    }
  }
  return {
    data,
    width,
    height,
    colorSpace: 'srgb',
  } as ImageData
}

describe('Image Quality Assessor Engine (Phase 2)', () => {
  describe('Task 2.1: computeLaplacianVariance', () => {
    it('returns a high Laplacian variance (>= 200.0) for a high-contrast sharp edge matrix', () => {
      const width = 10
      const height = 10
      const gray = new Uint8ClampedArray(width * height)
      // Alternating black and white pixels (checkerboard pattern)
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          gray[y * width + x] = (x + y) % 2 === 0 ? 0 : 255
        }
      }
      const score = computeLaplacianVariance(gray, width, height)
      expect(score).toBeGreaterThanOrEqual(200.0)
    })

    it('returns a low Laplacian variance (< 50.0) for a uniform or smooth image matrix', () => {
      const width = 10
      const height = 10
      const gray = new Uint8ClampedArray(width * height)
      // Uniform gray level
      for (let i = 0; i < gray.length; i++) {
        gray[i] = 128
      }
      const score = computeLaplacianVariance(gray, width, height)
      expect(score).toBeLessThan(50.0)
    })
  })

  describe('Task 2.2: computeRmsContrast and estimateCharacterHeight', () => {
    it('computes RMS contrast ratio accurately', () => {
      const gray = new Uint8ClampedArray([0, 255, 0, 255])
      const meanLuminance = 127.5
      const rms = computeRmsContrast(gray, meanLuminance)
      // RMS = sqrt( ( (0-127.5)^2 * 2 + (255-127.5)^2 * 2 ) / 4 ) = 127.5
      expect(rms).toBeCloseTo(127.5, 1)
    })

    it('estimates character height for typography sample', () => {
      const width = 20
      const height = 100
      const gray = new Uint8ClampedArray(width * height).fill(255)
      // Draw horizontal dark bands representing text lines of height 20px
      for (let y = 20; y < 40; y++) {
        for (let x = 5; x < 15; x++) {
          gray[y * width + x] = 0
        }
      }
      const charHeight = estimateCharacterHeight(gray, width, height)
      expect(charHeight).toBeGreaterThan(0)
    })
  })

  describe('Task 2.3: assessImageQuality High-Level Engine', () => {
    it('returns optimal status and badge for clear, sharp, well-lit image', () => {
      const imageData = createMockImageData(100, 100, (x, y) => {
        // High contrast grid with mean brightness around 128
        const val = (Math.floor(x / 5) + Math.floor(y / 5)) % 2 === 0 ? 30 : 220
        return [val, val, val, 255]
      })

      const metrics = assessImageQuality(imageData)
      expect(metrics.status).toBe('optimal')
      expect(metrics.badgeText).toBe('✅ Calidad de imagen óptima para OCR')
      expect(metrics.warningMessage).toBeUndefined()
      expect(metrics.laplacianVariance).toBeGreaterThanOrEqual(100.0)
      expect(metrics.brightnessScore).toBeGreaterThanOrEqual(60)
      expect(metrics.brightnessScore).toBeLessThanOrEqual(220)
      expect(metrics.contrastRatio).toBeGreaterThanOrEqual(25.0)
    })

    it('returns warning_blur status and warning banner for blurry image', () => {
      const imageData = createMockImageData(100, 100, (x) => {
        // Smooth gradient, low edge sharpness
        const val = 128 + Math.round(5 * Math.sin(x / 10))
        return [val, val, val, 255]
      })

      const metrics = assessImageQuality(imageData)
      expect(metrics.status).toBe('warning_blur')
      expect(metrics.warningMessage).toBe('⚠️ Imagen borrosa - Te recomendamos repetir la foto')
      expect(metrics.recommendations).toContain('retake')
    })

    it('returns warning_dark status and warning banner for underexposed image', () => {
      const imageData = createMockImageData(100, 100, (x, y) => {
        // Dark uniform image with small sharp detail
        const isEdge = x % 2 === 0 && y % 2 === 0
        const val = isEdge ? 50 : 20 // Mean luminance < 60
        return [val, val, val, 255]
      })

      const metrics = assessImageQuality(imageData)
      expect(metrics.status).toBe('warning_dark')
      expect(metrics.warningMessage).toBe('⚠️ Imagen muy oscura / bajo contraste - Ajusta el brillo o repite la foto')
      expect(metrics.recommendations).toContain('auto_adjust')
    })

    it('returns warning_low_contrast status for low contrast image with normal brightness', () => {
      const imageData = createMockImageData(100, 100, (x, y) => {
        // Mean brightness 120, but contrast very narrow (118 to 122)
        const val = 118 + ((x + y) % 5)
        return [val, val, val, 255]
      })

      const metrics = assessImageQuality(imageData, { blurThreshold: 0 }) // ignore blur threshold for low contrast check
      expect(metrics.status).toBe('warning_low_contrast')
      expect(metrics.warningMessage).toBe('⚠️ Bajo contraste detectado - Se recomienda activar Binarización')
    })
  })
})
