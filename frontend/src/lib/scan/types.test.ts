import { describe, it, expect } from 'vitest'
import type {
  NormalizedCropRect,
  CropSection,
  ResolutionPreset,
  ResolutionConfig,
  ImageQualityMetrics,
  QualityAssessmentSummary,
  ImageAdjustmentOptions,
  PreprocessedSection,
  MultiSectionPreprocessResult,
  SectionOcrPayload,
  MergedTicketScanResult,
} from './types'
import type { ScanMetadata } from '../types'

describe('Image Adjuster & Quality Assessor Types (Task 1.1)', () => {
  it('validates NormalizedCropRect structure', () => {
    const rect: NormalizedCropRect = { x: 0.1, y: 0.2, width: 0.8, height: 0.6 }
    expect(rect.x).toBe(0.1)
    expect(rect.y).toBe(0.2)
    expect(rect.width).toBe(0.8)
    expect(rect.height).toBe(0.6)
  })

  it('validates CropSection structure', () => {
    const section: CropSection = {
      id: 'sec_1',
      label: 'Header Section',
      rect: { x: 0, y: 0, width: 1, height: 0.5 },
      order: 1,
    }
    expect(section.id).toBe('sec_1')
    expect(section.order).toBe(1)
  })

  it('validates ResolutionConfig and ResolutionPreset types', () => {
    const presets: ResolutionPreset[] = ['1080p', '1280px', '1600px', '2048px', 'native', 'auto']
    expect(presets).toHaveLength(6)

    const config: ResolutionConfig = {
      preset: 'auto',
      customScale: 2.0,
      targetDpi: 300,
      minCharHeightPx: 32,
    }
    expect(config.preset).toBe('auto')
  })

  it('validates ImageQualityMetrics and QualityAssessmentSummary', () => {
    const metrics: ImageQualityMetrics = {
      laplacianVariance: 145.2,
      gradientVariance: 123.4,
      contrastRatio: 45.0,
      brightnessScore: 128.0,
      estimatedCharHeightPx: 36,
      status: 'optimal',
      badgeText: '✅ Calidad de imagen óptima para OCR',
      recommendations: ['proceed'],
      assessedAt: '2026-07-26T15:00:00.000Z',
    }
    expect(metrics.status).toBe('optimal')

    const summary: QualityAssessmentSummary = {
      laplacianVariance: metrics.laplacianVariance,
      brightnessScore: metrics.brightnessScore,
      contrastRatio: metrics.contrastRatio,
      status: metrics.status,
      userActionTaken: 'accepted_optimal',
    }
    expect(summary.userActionTaken).toBe('accepted_optimal')
  })

  it('validates ImageAdjustmentOptions structure', () => {
    const options: ImageAdjustmentOptions = {
      sections: [
        {
          id: 'sec_1',
          label: 'Section 1',
          rect: { x: 0, y: 0, width: 1, height: 1 },
          order: 1,
        },
      ],
      brightness: 15,
      contrast: 1.2,
      grayscale: true,
      binarization: false,
      zoom: 1.0,
      rotation: 0,
      resolution: { preset: 'auto' },
    }
    expect(options.brightness).toBe(15)
  })

  it('validates PreprocessedSection and MultiSectionPreprocessResult', () => {
    const preprocessedSec: PreprocessedSection = {
      sectionId: 'sec_1',
      order: 1,
      dataUrl: 'data:image/png;base64,abc',
      width: 800,
      height: 600,
      calculatedDpi: 300,
    }
    const result: MultiSectionPreprocessResult = {
      sections: [preprocessedSec],
      originalWidth: 1600,
      originalHeight: 1200,
      processedAt: '2026-07-26T15:00:00.000Z',
    }
    expect(result.sections).toHaveLength(1)
  })

  it('validates SectionOcrPayload and MergedTicketScanResult', () => {
    const payload: SectionOcrPayload = {
      sectionId: 'sec_1',
      order: 1,
      scanResult: {
        items: [{ name: 'Burger', quantity: 1, unitPrice: 12.5 }],
        engine: 'tesseract-ner',
      },
    }
    const merged: MergedTicketScanResult = {
      merchant: 'La Cuisine',
      date: '2026-07-26',
      items: [{ name: 'Burger', quantity: 1, unitPrice: 12.5 }],
      subtotal: 12.5,
      total: 12.5,
      rawTextCombined: 'Burger 12.50',
      confidence: 0.95,
      sectionCount: 1,
    }
    expect(merged.merchant).toBe('La Cuisine')
    expect(payload.scanResult.engine).toBe('tesseract-ner')
  })

  it('validates ScanMetadata extension in src/lib/types.ts', () => {
    const meta: ScanMetadata = {
      engine: 'tesseract-ner',
      rawText: 'Burger 12.50',
      processedAt: '2026-07-26T15:00:00.000Z',
      sectionCount: 2,
      qualitySummary: {
        laplacianVariance: 150.0,
        brightnessScore: 120.0,
        contrastRatio: 40.0,
        status: 'optimal',
      },
      adjustmentsSummary: {
        brightness: 10,
        contrast: 1.2,
        binarizationUsed: true,
        resolutionPreset: 'auto',
      },
    }
    expect(meta.sectionCount).toBe(2)
    expect(meta.qualitySummary?.status).toBe('optimal')
  })
})
