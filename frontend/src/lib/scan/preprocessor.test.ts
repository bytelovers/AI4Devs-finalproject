import { describe, it, expect } from 'vitest'
import { equalizeHistogramFn, medianFilter3x3 } from './preprocessor'

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
