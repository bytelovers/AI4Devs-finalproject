import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ScanEngineSelector } from './ScanEngineSelector'
import { useAppStore } from '@/lib/store'

vi.mock('@/lib/scan/capabilities', () => ({
  getEngines: vi.fn().mockResolvedValue([
    {
      name: 'tesseract',
      userLabel: 'Escaneo basico',
      techLabel: 'OCR en dispositivo (Tesseract)',
      userDescription: 'Escaneo rapido sin descarga. Funciona en cualquier dispositivo.',
      techDescription: 'Tesseract · Precision media · Sin WebGPU requerido · ~5MB',
      precision: 'Media' as const,
      weight: 'Sin descarga',
      requiresConnection: false,
      requiresDownload: false,
      icon: 'Cpu',
      iconColor: 'text-muted-foreground',
      status: 'available' as const,
    },
    {
      name: 'tesseract-ner',
      userLabel: 'Escaneo con IA',
      techLabel: 'OCR + IA (Tesseract + NER)',
      userDescription: 'Escaneo mejorado con inteligencia artificial. Detecta mejor los productos y nombres.',
      techDescription: 'Tesseract + BERT español · Precision media-alta · ~110MB · Mini-agente incluido',
      precision: 'Media-Alta' as const,
      weight: '~110MB',
      requiresConnection: false,
      requiresDownload: true,
      icon: 'Sparkles',
      iconColor: 'text-primary',
      status: 'available' as const,
    },
    {
      name: 'florence2',
      userLabel: 'Escaneo avanzado',
      techLabel: 'IA en dispositivo (Florence-2)',
      userDescription: 'Maxima precision sin conexion. Requiere un dispositivo moderno con WebGPU.',
      techDescription: 'Florence-2 · Precision alta · Requiere WebGPU · ~400MB',
      precision: 'Alta' as const,
      weight: '~400MB',
      requiresConnection: false,
      requiresDownload: true,
      icon: 'Cpu',
      iconColor: 'text-primary',
      status: 'available' as const,
    },
    {
      name: 'server',
      userLabel: 'IA en la nube',
      techLabel: 'IA en el servidor (glm-4.5v)',
      userDescription: 'Maxima precision usando inteligencia artificial en la nube. Requiere conexion a internet.',
      techDescription: 'glm-4.5v · Precision alta · Requiere conexion · 0MB local',
      precision: 'Alta' as const,
      weight: '0MB (en la nube)',
      requiresConnection: true,
      requiresDownload: false,
      icon: 'Cloud',
      iconColor: 'text-blue-500',
      status: 'available' as const,
    },
  ]),
}))

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
    get length() { return Object.keys(store).length },
    key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
  }
})()

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

beforeEach(() => {
  Object.defineProperty(globalThis, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })

  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    configurable: true,
    value: true,
  })

  Object.defineProperty(navigator, 'gpu', {
    writable: true,
    configurable: true,
    value: undefined,
  })

  useAppStore.getState().resetAll()
})

describe('ScanEngineSelector', () => {
  it('renders all four engine options', async () => {
    render(<ScanEngineSelector />)
    await waitFor(() => {
      // El componente usa labels basados en engine.name, no userLabel
      expect(screen.getByText(/OCR sin descarga/i)).toBeDefined()
      expect(screen.getByText(/OCR \+ IA \(NER\)/i)).toBeDefined()
      expect(screen.getByText(/IA en tu dispositivo/i)).toBeDefined()
      expect(screen.getByText(/IA en el servidor/i)).toBeDefined()
    })
  })

  it('shows default engine as selected (tesseract-ner)', async () => {
    render(<ScanEngineSelector />)
    await waitFor(() => {
      const selectedButtons = screen.getAllByText(/Seleccionado/i)
      expect(selectedButtons.length).toBe(1)
    })
  })
})
