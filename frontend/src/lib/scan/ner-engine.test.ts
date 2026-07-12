import { describe, it, expect } from 'vitest'
import { NER_MODELS } from './ner-engine'
import type { NerModelType } from './ner-engine'

describe('NER_MODELS', () => {
  it('should have entries for all model types', () => {
    const types: NerModelType[] = ['general', 'receipt']
    for (const t of types) {
      expect(NER_MODELS[t]).toBeDefined()
    }
  })

  it('should have required fields for each model', () => {
    for (const [type, spec] of Object.entries(NER_MODELS)) {
      expect(spec.id).toBeTypeOf('string')
      expect(spec.type).toBe(type)
      expect(spec.modelId).toContain('onnx-community')
      expect(spec.label).toBeTypeOf('string')
      expect(spec.description).toBeTypeOf('string')
      expect(spec.sizeLabel).toMatch(/MB/)
    }
  })

  it('should define general model as multilingual NER', () => {
    const general = NER_MODELS['general']
    expect(general.id).toBe('ner-general')
    expect(general.modelId).toContain('bert-base-multilingual-cased-ner-hrl')
  })

  it('should define receipt model (same model for now)', () => {
    const receipt = NER_MODELS['receipt']
    expect(receipt.id).toBe('ner-receipt')
    expect(receipt.type).toBe('receipt')
  })

  it('should have size labels indicating ~110MB', () => {
    for (const spec of Object.values(NER_MODELS)) {
      expect(spec.sizeLabel).toContain('110MB')
    }
  })
})
