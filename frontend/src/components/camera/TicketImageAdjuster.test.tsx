import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TicketImageAdjuster } from './TicketImageAdjuster'
import type { ImageAdjustmentOptions, ImageQualityMetrics } from '@/lib/scan/types'

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as any

describe('TicketImageAdjuster UI Component', () => {
  const dummyDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  const mockOnConfirm = vi.fn()
  const mockOnCancel = vi.fn()
  const mockOnRetake = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders filter controls, resolution selector, and preview viewport', () => {
    render(
      <TicketImageAdjuster
        imageDataUrl={dummyDataUrl}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        onRetake={mockOnRetake}
      />
    )

    expect(screen.getByText('Ajustar Ticket')).toBeInTheDocument()
    expect(screen.getByLabelText('Brillo')).toBeInTheDocument()
    expect(screen.getByLabelText('Contraste')).toBeInTheDocument()
    expect(screen.getByText('Escala de grises')).toBeInTheDocument()
    expect(screen.getByText('Binarización')).toBeInTheDocument()
    expect(screen.getByLabelText('Resolución')).toBeInTheDocument()
    expect(screen.getByText(/\[1\] Sección 1/)).toBeInTheDocument()
  })

  it('displays optimal quality banner for clear image', () => {
    const optimalMetrics: ImageQualityMetrics = {
      laplacianVariance: 150.0,
      gradientVariance: 120.0,
      contrastRatio: 40.0,
      brightnessScore: 120.0,
      estimatedCharHeightPx: 36,
      status: 'optimal',
      badgeText: '✅ Calidad de imagen óptima para OCR',
      recommendations: ['proceed'],
      assessedAt: new Date().toISOString(),
    }

    render(
      <TicketImageAdjuster
        imageDataUrl={dummyDataUrl}
        onConfirm={mockOnConfirm}
        initialOptions={{ qualityMetrics: optimalMetrics }}
      />
    )

    expect(screen.getByTestId('quality-banner-optimal')).toBeInTheDocument()
    expect(screen.getByText('✅ Calidad de imagen óptima para OCR')).toBeInTheDocument()
  })

  it('displays blurry warning banner with "Repetir foto" action', () => {
    const blurMetrics: ImageQualityMetrics = {
      laplacianVariance: 45.0,
      gradientVariance: 30.0,
      contrastRatio: 30.0,
      brightnessScore: 110.0,
      estimatedCharHeightPx: 36,
      status: 'warning_blur',
      badgeText: '⚠️ Imagen borrosa',
      warningMessage: '⚠️ Imagen borrosa - Te recomendamos repetir la foto',
      recommendations: ['retake'],
      assessedAt: new Date().toISOString(),
    }

    render(
      <TicketImageAdjuster
        imageDataUrl={dummyDataUrl}
        onConfirm={mockOnConfirm}
        onRetake={mockOnRetake}
        initialOptions={{ qualityMetrics: blurMetrics }}
      />
    )

    expect(screen.getByTestId('quality-banner-warning-blur')).toBeInTheDocument()
    expect(screen.getByText('⚠️ Imagen borrosa - Te recomendamos repetir la foto')).toBeInTheDocument()
    
    const retakeBtn = screen.getByRole('button', { name: /Repetir foto/i })
    fireEvent.click(retakeBtn)
    expect(mockOnRetake).toHaveBeenCalledTimes(1)
  })

  it('displays dark image warning banner and applies Auto-Ajustar on button click', () => {
    const darkMetrics: ImageQualityMetrics = {
      laplacianVariance: 120.0,
      gradientVariance: 100.0,
      contrastRatio: 15.0,
      brightnessScore: 35.0,
      estimatedCharHeightPx: 36,
      status: 'warning_dark',
      badgeText: '⚠️ Imagen muy oscura',
      warningMessage: '⚠️ Imagen muy oscura / bajo contraste - Ajusta el brillo o repite la foto',
      recommendations: ['auto_adjust', 'retake'],
      assessedAt: new Date().toISOString(),
    }

    render(
      <TicketImageAdjuster
        imageDataUrl={dummyDataUrl}
        onConfirm={mockOnConfirm}
        initialOptions={{ qualityMetrics: darkMetrics }}
      />
    )

    expect(screen.getByTestId('quality-banner-warning-dark')).toBeInTheDocument()
    
    const autoAdjustBtns = screen.getAllByRole('button', { name: /Auto-Ajustar/i })
    fireEvent.click(autoAdjustBtns[0])

    const confirmBtn = screen.getByRole('button', { name: /Confirmar/i })
    fireEvent.click(confirmBtn)

    expect(mockOnConfirm).toHaveBeenCalledWith(
      dummyDataUrl,
      expect.objectContaining({
        brightness: 25,
        contrast: 1.4,
        binarization: true,
      })
    )
  })

  it('adds a second crop section when tapping "Agregar Sección"', () => {
    render(
      <TicketImageAdjuster
        imageDataUrl={dummyDataUrl}
        onConfirm={mockOnConfirm}
      />
    )

    expect(screen.getByText(/\[1\] Sección 1/)).toBeInTheDocument()
    expect(screen.queryByText(/\[2\] Sección 2/)).not.toBeInTheDocument()

    const addSectionBtn = screen.getByRole('button', { name: /Agregar Sección/i })
    fireEvent.click(addSectionBtn)

    expect(screen.getByText(/\[2\] Sección 2/)).toBeInTheDocument()
  })

  it('resets all filters and crop sections on tapping "Restablecer"', () => {
    render(
      <TicketImageAdjuster
        imageDataUrl={dummyDataUrl}
        onConfirm={mockOnConfirm}
        initialOptions={{
          brightness: 50,
          contrast: 2.0,
          grayscale: true,
          binarization: true,
        }}
      />
    )

    const resetBtn = screen.getByRole('button', { name: /Restablecer/i })
    fireEvent.click(resetBtn)

    const confirmBtn = screen.getByRole('button', { name: /Confirmar/i })
    fireEvent.click(confirmBtn)

    expect(mockOnConfirm).toHaveBeenCalledWith(
      dummyDataUrl,
      expect.objectContaining({
        brightness: 0,
        contrast: 1.0,
        grayscale: false,
        binarization: false,
        resolution: { preset: 'auto' },
        sections: [
          expect.objectContaining({
            id: 'sec_1',
            order: 1,
          }),
        ],
      })
    )
  })
})
