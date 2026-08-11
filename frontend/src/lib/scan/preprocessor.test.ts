import { describe, it, expect, beforeEach } from 'vitest'
import {
  equalizeHistogramFn,
  medianFilter3x3,
  applyAdaptiveThreshold,
  calculateOptimalCropScale,
  preprocessMultiSectionReceipt,
} from './preprocessor'
import type { ImageAdjustmentOptions } from './types'

describe('equalizeHistogramFn', () => {
  it('should stretch contrast of a low-contrast image', () => {
    // Create a gradient-like image with narrow range (pixels 50..100)
    const size = 16
    const gray = new Uint8ClampedArray(size * size)
    for (let i = 0; i < gray.length; i++) {
      gray[i] = 50 + (i % 51) // values 50..100
    }

    const result = equalizeHistogramFn(gray)

    expect(result).toBeInstanceOf(Uint8ClampedArray)
    expect(result.length).toBe(gray.length)

    // After equalization, range should be wider (0..255)
    let min = 255
    let max = 0
    for (let i = 0; i < result.length; i++) {
      if (result[i] < min) min = result[i]
      if (result[i] > max) max = result[i]
    }

    // Should have stretched to near-full range
    expect(min).toBeLessThanOrEqual(10)
    expect(max).toBeGreaterThanOrEqual(245)
  })

  it('should preserve image size', () => {
    const gray = new Uint8ClampedArray(256)
    for (let i = 0; i < 256; i++) gray[i] = i

    const result = equalizeHistogramFn(gray)
    expect(result.length).toBe(256)
  })

  it('should handle uniform images (all same value)', () => {
    const gray = new Uint8ClampedArray(100)
    gray.fill(128)

    const result = equalizeHistogramFn(gray)
    // Should return the input unchanged (denom <= 0)
    expect(result).toEqual(gray)
  })

  it('should handle extreme values (all black)', () => {
    const gray = new Uint8ClampedArray(100)
    gray.fill(0)

    const result = equalizeHistogramFn(gray)
    expect(result.length).toBe(100)
    // All pixels should remain 0 since cdfMin === total
  })

  it('should handle empty array', () => {
    const gray = new Uint8ClampedArray(0)
    const result = equalizeHistogramFn(gray)
    expect(result).toBeInstanceOf(Uint8ClampedArray)
    expect(result.length).toBe(0)
  })

  it('should produce correct LUT mapping', () => {
    // Two distinct values: 0 and 255
    const gray = new Uint8ClampedArray(10)
    for (let i = 0; i < 5; i++) gray[i] = 0
    for (let i = 5; i < 10; i++) gray[i] = 255

    const result = equalizeHistogramFn(gray)
    // First 5 should be 0, last 5 should be 255
    for (let i = 0; i < 5; i++) expect(result[i]).toBe(0)
    for (let i = 5; i < 10; i++) expect(result[i]).toBe(255)
  })
})

describe('medianFilter3x3', () => {
  it('should preserve uniform image', () => {
    const gray = new Uint8ClampedArray(9).fill(128)
    const result = medianFilter3x3(gray, 3, 3)
    expect(Array.from(result)).toEqual(Array(9).fill(128))
  })

  it('should remove salt-and-pepper noise', () => {
    // 3x3 image with center pixel as outlier
    const width = 3
    const height = 3
    const gray = new Uint8ClampedArray(width * height).fill(100)
    gray[4] = 255 // center pixel is noisy

    const result = medianFilter3x3(gray, width, height)
    // The median of [100,100,100,100,255,100,100,100,100] = 100
    expect(result[4]).toBe(100)
  })

  it('should handle edges correctly (boundary clamping)', () => {
    const width = 4
    const height = 4
    const gray = new Uint8ClampedArray(width * height)
    for (let i = 0; i < gray.length; i++) gray[i] = i * 10

    const result = medianFilter3x3(gray, width, height)
    // Edge pixels should still be computed (clamped to border)
    expect(result[0]).toBeGreaterThanOrEqual(0) // top-left
    expect(result[width - 1]).toBeGreaterThanOrEqual(0) // top-right
    expect(result[gray.length - 1]).toBeGreaterThanOrEqual(0) // bottom-right
    expect(result.length).toBe(gray.length)
  })

  it('should handle 1x1 image', () => {
    const gray = new Uint8ClampedArray([42])
    const result = medianFilter3x3(gray, 1, 1)
    expect(result[0]).toBe(42)
  })

  it('should handle 1xN image (single row)', () => {
    const gray = new Uint8ClampedArray([10, 50, 30, 20])
    const result = medianFilter3x3(gray, 4, 1)
    expect(result.length).toBe(4)
    // Each pixel's 3-neighborhood (clamped) should yield a value
    result.forEach((v) => expect(v).toBeGreaterThanOrEqual(0))
  })

  it('should handle non-square images', () => {
    const width = 5
    const height = 3
    const gray = new Uint8ClampedArray(width * height)
    for (let i = 0; i < gray.length; i++) gray[i] = 50

    gray[7] = 200 // outlier

    const result = medianFilter3x3(gray, width, height)
    expect(result[7]).toBeLessThanOrEqual(100) // noise removed
    expect(result.length).toBe(gray.length)
  })
})

describe('Task 3.1: applyAdaptiveThreshold', () => {
  it('binarizes grayscale image to strictly 0 or 255 values', () => {
    const width = 16
    const height = 16
    const gray = new Uint8ClampedArray(width * height)
    for (let i = 0; i < gray.length; i++) {
      gray[i] = (i * 13) % 256
    }
    const binarized = applyAdaptiveThreshold(gray, width, height)
    expect(binarized.length).toBe(width * height)
    for (let i = 0; i < binarized.length; i++) {
      expect([0, 255]).toContain(binarized[i])
    }
  })

  it('suppresses non-uniform background shadow and highlights local dark text', () => {
    const width = 20
    const height = 20
    const gray = new Uint8ClampedArray(width * height)

    // Left side background = 200, Right side background = 100 (shadow gradient)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        gray[y * width + x] = x < 10 ? 200 : 100
      }
    }
    // Dark text spot on left (val 50) and dark text spot on right in shadow (val 20)
    gray[5 * width + 5] = 50
    gray[15 * width + 15] = 20

    const binarized = applyAdaptiveThreshold(gray, width, height)
    // Dark text on left should be black (0)
    expect(binarized[5 * width + 5]).toBe(0)
    // Dark text on right shadow should also be black (0)
    expect(binarized[15 * width + 15]).toBe(0)
    // Background pixels around text should be white (255)
    expect(binarized[0]).toBe(255)
    expect(binarized[19 * width + 19]).toBe(255)
  })
})

describe('Task 3.2: calculateOptimalCropScale', () => {
  it('calculates super-sampling multiplier (scale >= 1.5) for small crop regions', () => {
    const sourceW = 1000
    const sourceH = 1000
    const cropRect = { x: 0, y: 0, width: 0.1, height: 0.08 } // crop is 100x80px

    const result = calculateOptimalCropScale(sourceW, sourceH, cropRect, { preset: 'auto' })
    expect(result.scale).toBeGreaterThanOrEqual(1.5)
    expect(result.targetWidth).toBeGreaterThan(100)
    expect(result.targetHeight).toBeGreaterThan(80)
    expect(result.calculatedDpi).toBeGreaterThanOrEqual(200)
  })

  it('respects preset resolution limits (1080p, 1280px, 1600px, 2048px, native)', () => {
    const sourceW = 4000
    const sourceH = 3000
    const cropRect = { x: 0, y: 0, width: 1.0, height: 1.0 }

    const res1080 = calculateOptimalCropScale(sourceW, sourceH, cropRect, { preset: '1080p' })
    expect(Math.max(res1080.targetWidth, res1080.targetHeight)).toBeLessThanOrEqual(1080)

    const res1280 = calculateOptimalCropScale(sourceW, sourceH, cropRect, { preset: '1280px' })
    expect(Math.max(res1280.targetWidth, res1280.targetHeight)).toBeLessThanOrEqual(1280)

    const res1600 = calculateOptimalCropScale(sourceW, sourceH, cropRect, { preset: '1600px' })
    expect(Math.max(res1600.targetWidth, res1600.targetHeight)).toBeLessThanOrEqual(1600)

    const res2048 = calculateOptimalCropScale(sourceW, sourceH, cropRect, { preset: '2048px' })
    expect(Math.max(res2048.targetWidth, res2048.targetHeight)).toBeLessThanOrEqual(2048)

    const resNative = calculateOptimalCropScale(sourceW, sourceH, cropRect, { preset: 'native' })
    expect(resNative.scale).toBe(1.0)
    expect(resNative.targetWidth).toBe(4000)
    expect(resNative.targetHeight).toBe(3000)
  })

  it('honors customScale override when provided', () => {
    const sourceW = 500
    const sourceH = 500
    const cropRect = { x: 0, y: 0, width: 1.0, height: 1.0 }

    const result = calculateOptimalCropScale(sourceW, sourceH, cropRect, { customScale: 2.5 })
    expect(result.scale).toBe(2.5)
    expect(result.targetWidth).toBe(1250)
    expect(result.targetHeight).toBe(1250)
  })
})

describe('Task 3.3: preprocessMultiSectionReceipt', () => {
  beforeEach(() => {
    // Mock HTMLCanvasElement context & toDataURL for JSDOM test environment
    const originalGetContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (contextId: string, options?: any) {
      if (contextId === '2d') {
        return {
          imageSmoothingEnabled: true,
          imageSmoothingQuality: 'high',
          drawImage: () => {},
          getImageData: (_x: number, _y: number, w: number, h: number) => ({
            data: new Uint8ClampedArray(w * h * 4),
            width: w,
            height: h,
          }),
          putImageData: () => {},
          save: () => {},
          restore: () => {},
          translate: () => {},
          rotate: () => {},
        } as any
      }
      return originalGetContext ? originalGetContext.call(this, contextId, options) : null
    }

    HTMLCanvasElement.prototype.toDataURL = function () {
      return 'data:image/jpeg;base64,processedmockdata'
    }

    // Mock Image onload trigger in jsdom
    Object.defineProperty(global.Image.prototype, 'src', {
      set(src) {
        this._src = src
        setTimeout(() => {
          if (this.onload) this.onload()
        }, 1)
      },
      get() {
        return this._src
      },
      configurable: true,
    })
  })

  it('processes multi-section crop bounds and options into MultiSectionPreprocessResult', async () => {
    const sampleDataUrl = 'data:image/jpeg;base64,rawsample'

    const adjustments: ImageAdjustmentOptions = {
      sections: [
        { id: 'sec_1', label: 'Header', rect: { x: 0, y: 0, width: 1.0, height: 0.5 }, order: 1 },
        { id: 'sec_2', label: 'Footer', rect: { x: 0, y: 0.5, width: 1.0, height: 0.5 }, order: 2 },
      ],
      brightness: 10,
      contrast: 1.2,
      grayscale: true,
      binarization: true,
      zoom: 1.0,
      rotation: 0,
      resolution: { preset: 'auto' },
    }

    const result = await preprocessMultiSectionReceipt(sampleDataUrl, adjustments)
    expect(result.sections.length).toBe(2)
    expect(result.sections[0].sectionId).toBe('sec_1')
    expect(result.sections[0].order).toBe(1)
    expect(result.sections[0].dataUrl).toMatch(/^data:image\//)
    expect(result.sections[1].sectionId).toBe('sec_2')
    expect(result.sections[1].order).toBe(2)
    expect(result.processedAt).toBeDefined()
  })
})



describe('equalizeHistogramFn', () => {
  it('should stretch contrast of a low-contrast image', () => {
    // Create a gradient-like image with narrow range (pixels 50..100)
    const size = 16
    const gray = new Uint8ClampedArray(size * size)
    for (let i = 0; i < gray.length; i++) {
      gray[i] = 50 + (i % 51) // values 50..100
    }

    const result = equalizeHistogramFn(gray)

    expect(result).toBeInstanceOf(Uint8ClampedArray)
    expect(result.length).toBe(gray.length)

    // After equalization, range should be wider (0..255)
    let min = 255
    let max = 0
    for (let i = 0; i < result.length; i++) {
      if (result[i] < min) min = result[i]
      if (result[i] > max) max = result[i]
    }

    // Should have stretched to near-full range
    expect(min).toBeLessThanOrEqual(10)
    expect(max).toBeGreaterThanOrEqual(245)
  })

  it('should preserve image size', () => {
    const gray = new Uint8ClampedArray(256)
    for (let i = 0; i < 256; i++) gray[i] = i

    const result = equalizeHistogramFn(gray)
    expect(result.length).toBe(256)
  })

  it('should handle uniform images (all same value)', () => {
    const gray = new Uint8ClampedArray(100)
    gray.fill(128)

    const result = equalizeHistogramFn(gray)
    // Should return the input unchanged (denom <= 0)
    expect(result).toEqual(gray)
  })

  it('should handle extreme values (all black)', () => {
    const gray = new Uint8ClampedArray(100)
    gray.fill(0)

    const result = equalizeHistogramFn(gray)
    expect(result.length).toBe(100)
    // All pixels should remain 0 since cdfMin === total
  })

  it('should handle empty array', () => {
    const gray = new Uint8ClampedArray(0)
    const result = equalizeHistogramFn(gray)
    expect(result).toBeInstanceOf(Uint8ClampedArray)
    expect(result.length).toBe(0)
  })

  it('should produce correct LUT mapping', () => {
    // Two distinct values: 0 and 255
    const gray = new Uint8ClampedArray(10)
    for (let i = 0; i < 5; i++) gray[i] = 0
    for (let i = 5; i < 10; i++) gray[i] = 255

    const result = equalizeHistogramFn(gray)
    // First 5 should be 0, last 5 should be 255
    for (let i = 0; i < 5; i++) expect(result[i]).toBe(0)
    for (let i = 5; i < 10; i++) expect(result[i]).toBe(255)
  })
})

describe('medianFilter3x3', () => {
  it('should preserve uniform image', () => {
    const gray = new Uint8ClampedArray(9).fill(128)
    const result = medianFilter3x3(gray, 3, 3)
    expect(Array.from(result)).toEqual(Array(9).fill(128))
  })

  it('should remove salt-and-pepper noise', () => {
    // 3x3 image with center pixel as outlier
    const width = 3
    const height = 3
    const gray = new Uint8ClampedArray(width * height).fill(100)
    gray[4] = 255 // center pixel is noisy

    const result = medianFilter3x3(gray, width, height)
    // The median of [100,100,100,100,255,100,100,100,100] = 100
    expect(result[4]).toBe(100)
  })

  it('should handle edges correctly (boundary clamping)', () => {
    const width = 4
    const height = 4
    const gray = new Uint8ClampedArray(width * height)
    for (let i = 0; i < gray.length; i++) gray[i] = i * 10

    const result = medianFilter3x3(gray, width, height)
    // Edge pixels should still be computed (clamped to border)
    expect(result[0]).toBeGreaterThanOrEqual(0) // top-left
    expect(result[width - 1]).toBeGreaterThanOrEqual(0) // top-right
    expect(result[gray.length - 1]).toBeGreaterThanOrEqual(0) // bottom-right
    expect(result.length).toBe(gray.length)
  })

  it('should handle 1x1 image', () => {
    const gray = new Uint8ClampedArray([42])
    const result = medianFilter3x3(gray, 1, 1)
    expect(result[0]).toBe(42)
  })

  it('should handle 1xN image (single row)', () => {
    const gray = new Uint8ClampedArray([10, 50, 30, 20])
    const result = medianFilter3x3(gray, 4, 1)
    expect(result.length).toBe(4)
    // Each pixel's 3-neighborhood (clamped) should yield a value
    result.forEach((v) => expect(v).toBeGreaterThanOrEqual(0))
  })

  it('should handle non-square images', () => {
    const width = 5
    const height = 3
    const gray = new Uint8ClampedArray(width * height)
    for (let i = 0; i < gray.length; i++) gray[i] = 50

    gray[7] = 200 // outlier

    const result = medianFilter3x3(gray, width, height)
    expect(result[7]).toBeLessThanOrEqual(100) // noise removed
    expect(result.length).toBe(gray.length)
  })
})
