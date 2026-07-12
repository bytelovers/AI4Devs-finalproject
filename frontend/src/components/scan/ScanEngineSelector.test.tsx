import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ScanEngineSelector } from './ScanEngineSelector'
import { useAppStore } from '@/lib/store'

// ---------------------------------------------------------------------------
// Mock localStorage
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Mocks for browser APIs
// ---------------------------------------------------------------------------

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
  localStorageMock.clear()
})

describe('ScanEngineSelector', () => {
  it('renders all four engine options', () => {
    render(<ScanEngineSelector />)
    expect(screen.getByText('Escaneo básico')).toBeDefined()
    expect(screen.getByText('Escaneo con IA')).toBeDefined()
    expect(screen.getByText('Escaneo avanzado')).toBeDefined()
    expect(screen.getByText('IA en la nube')).toBeDefined()
  })

  it('shows default engine as selected (tesseract-ner)', () => {
    render(<ScanEngineSelector />)
    const selectedButtons = screen.getAllByText('Seleccionado')
    expect(selectedButtons.length).toBe(1)
  })

  it('selecting a different engine updates the store', async () => {
    render(<ScanEngineSelector />)

    const allSelectButtons = screen.getAllByText('Seleccionar')
    fireEvent.click(allSelectButtons[0])

    await waitFor(() => {
      expect(useAppStore.getState().settings.preferredEngine).toBe('tesseract')
    })
  })

  it('disables server engine when offline', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: false,
    })

    render(<ScanEngineSelector />)

    const selectButtons = screen.getAllByText('Seleccionar')
    const serverBtn = selectButtons[selectButtons.length - 1].closest('button')
    expect(serverBtn).toBeDisabled()
  })

  it('shows WebGPU requirement for Florence-2 when unavailable and detailed', () => {
    render(<ScanEngineSelector detailed />)

    expect(screen.getByText('Requiere WebGPU')).toBeDefined()
  })

  it('renders technical labels when technical={true}', () => {
    render(<ScanEngineSelector technical />)

    expect(screen.getByText('OCR en dispositivo (Tesseract)')).toBeDefined()
    expect(screen.getByText('OCR + IA (Tesseract + NER)')).toBeDefined()
    expect(screen.getByText('IA en dispositivo (Florence-2)')).toBeDefined()
    expect(screen.getByText('IA en el servidor (glm-4.5v)')).toBeDefined()
  })

  it('renders detailed info when detailed={true}', () => {
    render(<ScanEngineSelector detailed />)

    expect(screen.getByText('Sin descarga')).toBeDefined()
    expect(screen.getByText('~110MB')).toBeDefined()
    expect(screen.getByText('~400MB')).toBeDefined()
    expect(screen.getByText('0MB (en la nube)')).toBeDefined()
  })
})
