import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { ScanEngineSelector } from './ScanEngineSelector'
import { useAppStore } from '@/lib/store'
import { getEngines } from '@/lib/scan/capabilities'
import { toast } from 'sonner'
import type { EngineInfo } from '@/lib/scan/types'

vi.mock('sonner', () => ({
  toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/lib/scan/capabilities', () => ({
  getEngines: vi.fn(),
}))

// Evita cargar los motores pesados (transformers, tesseract) en jsdom.
vi.mock('@/lib/scan/orchestrator', () => ({
  isFlorenceEnabled: vi.fn(() => false),
  isNerEnabled: vi.fn(() => false),
}))

const baseEngines: EngineInfo[] = [
  {
    name: 'tesseract',
    label: 'OCR en tu dispositivo',
    description: 'OCR sin WebGPU',
    status: 'available',
    estimatedTime: '8-20s',
    accuracy: 'medium',
  },
  {
    name: 'tesseract-ner',
    label: 'OCR + IA (Tesseract + NER)',
    description: 'Tesseract + BERT español',
    status: 'available',
    estimatedTime: '15-40s',
    accuracy: 'high',
  },
  {
    name: 'florence2',
    label: 'IA en tu dispositivo (Florence-2)',
    description: 'Modelo Florence-2',
    status: 'available',
    estimatedTime: '5-15s',
    accuracy: 'high',
  },
  {
    name: 'server',
    label: 'IA en el servidor',
    description: 'glm-4.5v',
    status: 'available',
    estimatedTime: '3-5s',
    accuracy: 'high-but-server',
  },
]

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

  vi.mocked(getEngines).mockResolvedValue(baseEngines)

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

  it('habilita IA en dispositivo cuando el modelo falta (needs-download)', async () => {
    vi.mocked(getEngines).mockResolvedValueOnce(
      baseEngines.map((e) =>
        e.name === 'florence2' ? { ...e, status: 'needs-download' as const } : e
      )
    )
    render(<ScanEngineSelector />)
    await waitFor(() => {
      const btn = screen.getByTestId('select-florence2')
      expect(btn).not.toBeDisabled()
      expect(btn).toHaveTextContent('Seleccionar')
    })
  })

  it('permite seleccionar IA en dispositivo sin modelo descargado', async () => {
    vi.mocked(getEngines).mockResolvedValueOnce(
      baseEngines.map((e) =>
        e.name === 'florence2' ? { ...e, status: 'needs-download' as const } : e
      )
    )
    render(<ScanEngineSelector />)
    await waitFor(() => {
      expect(screen.getByTestId('select-florence2')).not.toBeDisabled()
    })
    fireEvent.click(screen.getByTestId('select-florence2'))
    await waitFor(() => {
      expect(useAppStore.getState().settings.preferredEngine).toBe('florence2')
      expect(screen.getByTestId('select-florence2')).toHaveTextContent('Seleccionado')
    })
    expect(toast.info).toHaveBeenCalled()
  })

  it('sin WebGPU bloquea solo IA en dispositivo, el resto sigue operativo', async () => {
    vi.mocked(getEngines).mockResolvedValueOnce(
      baseEngines.map((e) =>
        e.name === 'florence2' ? { ...e, status: 'unavailable' as const } : e
      )
    )
    render(<ScanEngineSelector />)
    await waitFor(() => {
      const florenceBtn = screen.getByTestId('select-florence2')
      expect(florenceBtn).toBeDisabled()
      expect(florenceBtn).toHaveTextContent('No disponible')
      expect(screen.getByTestId('select-tesseract')).not.toBeDisabled()
      expect(screen.getByTestId('select-server')).not.toBeDisabled()
    })
  })
})
