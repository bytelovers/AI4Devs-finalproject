import { describe, it, expect, vi, beforeEach } from 'vitest'
import { scanWithTesseractNer, stringSimilarity } from './tesseract-ner-engine'
import { scanWithTesseract } from './tesseract-engine'
import { classifyWithNER } from './ner-engine'

vi.mock('./tesseract-engine', () => ({
  scanWithTesseract: vi.fn(),
  resetTesseractWorker: vi.fn(),
}))

vi.mock('./ner-engine', () => ({
  classifyWithNER: vi.fn(),
  NER_MODELS: {
    general: {
      id: 'ner-general',
      type: 'general',
      modelId: 'mock-model',
      label: 'Mock NER',
      description: '',
      sizeLabel: '~1MB',
    },
    receipt: {
      id: 'ner-receipt',
      type: 'receipt',
      modelId: 'mock-model-receipt',
      label: 'Mock NER Receipts',
      description: '',
      sizeLabel: '~1MB',
    },
  },
}))

const mockScanWithTesseract = vi.mocked(scanWithTesseract)
const mockClassifyWithNER = vi.mocked(classifyWithNER)

beforeEach(() => {
  mockScanWithTesseract.mockReset()
  mockClassifyWithNER.mockReset()
  mockClassifyWithNER.mockResolvedValue({ entities: [], modelType: 'general' })
})

describe('scanWithTesseractNer', () => {
  it('runs Tesseract once when no precomputed result is provided', async () => {
    mockScanWithTesseract.mockResolvedValue({
      engine: 'tesseract',
      rawText: 'CAFETERIA 1x Cafe 2,50 Total 2,50',
      items: [],
      merchant: undefined,
    } as any)

    await scanWithTesseractNer('data:image/png;base64,abc')

    expect(mockScanWithTesseract).toHaveBeenCalledTimes(1)
  })

  it('does NOT re-run Tesseract when a precomputed result is provided', async () => {
    mockScanWithTesseract.mockResolvedValue({
      engine: 'tesseract',
      rawText: 'CAFETERIA 1x Cafe 2,50 Total 2,50',
      items: [],
      merchant: undefined,
    } as any)

    const precomputed = {
      engine: 'tesseract',
      rawText: 'CAFETERIA 1x Cafe 2,50 Total 2,50',
      items: [{ name: 'Cafe', quantity: 1, unitPrice: 2.5, mode: 'single', assignments: [] }],
      merchant: 'CAFETERIA',
    } as any

    const result = await scanWithTesseractNer('data:image/png;base64,abc', undefined, 'general', precomputed)

    expect(mockScanWithTesseract).not.toHaveBeenCalled()
    expect(result.rawText).toBe('CAFETERIA 1x Cafe 2,50 Total 2,50')
    expect(mockClassifyWithNER).toHaveBeenCalledTimes(1)
  })
})

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
