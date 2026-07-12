import { describe, it, expect } from 'vitest'
import { stringSimilarity } from './tesseract-ner-engine'

describe('stringSimilarity', () => {
  it('should return 1 for identical strings', () => {
    expect(stringSimilarity('hello world', 'hello world')).toBe(1)
  })

  it('should return 0 for completely different strings', () => {
    expect(stringSimilarity('abc', 'xyz')).toBe(0)
  })

  it('should return correct Jaccard similarity', () => {
    // Words: {hello, world} ∩ {hello, there} = {hello}
    // Union: {hello, world, there} = 3
    // Jaccard: 1/3 ≈ 0.333
    const result = stringSimilarity('hello world', 'hello there')
    expect(result).toBeCloseTo(1 / 3, 5)
  })

  it('should filter out short words (< 3 chars)', () => {
    // 'a' and 'an' are filtered out
    // {hello} ∩ {hello} = {hello}
    // Union: {hello} = 1
    expect(stringSimilarity('a hello', 'an hello')).toBe(1)
  })

  it('should handle empty strings', () => {
    expect(stringSimilarity('', 'hello')).toBe(0)
    expect(stringSimilarity('hello', '')).toBe(0)
    expect(stringSimilarity('', '')).toBe(0)
  })

  it('should handle single-word strings', () => {
    expect(stringSimilarity('hello', 'hello')).toBe(1)
    expect(stringSimilarity('hello', 'world')).toBe(0)
  })

  it('should be case-sensitive', () => {
    expect(stringSimilarity('Hello', 'hello')).toBe(0)
  })
})
