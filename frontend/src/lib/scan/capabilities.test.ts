import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getEngines,
  checkModelCached,
  refreshFlorenceDownloadState,
  isFlorenceDownloadPersisted,
  persistFlorenceDownloadState,
  resetModelCacheDetection,
  FLORENCE_CACHED_STORAGE_KEY,
} from './capabilities'

vi.mock('@/lib/scan/orchestrator', () => ({
  isFlorenceEnabled: vi.fn(() => false),
  isNerEnabled: vi.fn(() => false),
}))

// --- Mocks de Cache Storage (jsdom no lo implementa) ---
const cacheContents = new Map<string, Array<{ url: string }>>()

const mockCache = {
  keys: vi.fn(async () => (cacheContents.get('transformers-cache') ?? []) as Request[]),
}

const cachesMock = {
  open: vi.fn(async (name: string) => {
    if (name !== 'transformers-cache') throw new Error(`Unexpected cache: ${name}`)
    return mockCache
  }),
  keys: vi.fn(async () => Array.from(cacheContents.keys())),
}

Object.defineProperty(globalThis, 'caches', { value: cachesMock, configurable: true })

// --- Mock de localStorage ---
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

const FLORENCE_ONNX_URL =
  'https://huggingface.co/onnx-community/Florence-2-base/resolve/main/onnx/encoder_model.onnx'
const OTHER_MODEL_ONNX_URL =
  'https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2/resolve/main/onnx/model.onnx'
const FLORENCE_METADATA_URL =
  'https://huggingface.co/onnx-community/Florence-2-base/resolve/main/config.json'

beforeEach(() => {
  cacheContents.clear()
  localStorageMock.clear()
  vi.clearAllMocks()
  resetModelCacheDetection()

  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    configurable: true,
    value: true,
  })
  Object.defineProperty(navigator, 'gpu', {
    writable: true,
    configurable: true,
    value: {},
  })
})

describe('checkModelCached', () => {
  it('detects florence-2 when ONNX weights are cached', async () => {
    cacheContents.set('transformers-cache', [{ url: FLORENCE_ONNX_URL }])
    expect(await checkModelCached()).toBe(true)
  })

  it('returns false when only another model (NER) is cached', async () => {
    cacheContents.set('transformers-cache', [{ url: OTHER_MODEL_ONNX_URL }])
    expect(await checkModelCached()).toBe(false)
  })

  it('returns false when only florence metadata is cached (no ONNX weights)', async () => {
    cacheContents.set('transformers-cache', [{ url: FLORENCE_METADATA_URL }])
    expect(await checkModelCached()).toBe(false)
  })

  it('returns false when cache is empty', async () => {
    expect(await checkModelCached()).toBe(false)
  })
})

describe('persistencia de descarga', () => {
  it('refreshFlorenceDownloadState persiste true solo si la cache lo confirma', async () => {
    cacheContents.set('transformers-cache', [{ url: FLORENCE_ONNX_URL }])
    expect(await refreshFlorenceDownloadState()).toBe(true)
    expect(isFlorenceDownloadPersisted()).toBe(true)
  })

  it('refreshFlorenceDownloadState limpia el flag obsoleto cuando la cache ya no existe', async () => {
    persistFlorenceDownloadState(true)
    expect(isFlorenceDownloadPersisted()).toBe(true)

    resetModelCacheDetection()
    expect(await refreshFlorenceDownloadState()).toBe(false)
    expect(isFlorenceDownloadPersisted()).toBe(false)
    expect(localStorageMock.getItem(FLORENCE_CACHED_STORAGE_KEY)).toBeNull()
  })
})

describe('getEngines', () => {
  it('marca florence2 como available cuando el modelo está verificado en el dispositivo', async () => {
    cacheContents.set('transformers-cache', [{ url: FLORENCE_ONNX_URL }])
    const engines = await getEngines()
    const florence = engines.find((e) => e.name === 'florence2')
    expect(florence?.status).toBe('available')
    expect(florence?.sizeLabel).toBe('Cacheado')
  })

  it('marca florence2 como needs-download sin modelo en el dispositivo (aunque el flag diga lo contrario)', async () => {
    persistFlorenceDownloadState(true)
    cacheContents.clear()
    resetModelCacheDetection()

    const engines = await getEngines()
    const florence = engines.find((e) => e.name === 'florence2')
    expect(florence?.status).toBe('needs-download')
    expect(isFlorenceDownloadPersisted()).toBe(false)
  })

  it('marca florence2 como unavailable sin WebGPU, sin verificar la cache', async () => {
    Object.defineProperty(navigator, 'gpu', {
      writable: true,
      configurable: true,
      value: undefined,
    })
    cacheContents.set('transformers-cache', [{ url: FLORENCE_ONNX_URL }])

    const engines = await getEngines()
    const florence = engines.find((e) => e.name === 'florence2')
    expect(florence?.status).toBe('unavailable')
    expect(mockCache.keys).not.toHaveBeenCalled()
  })
})
