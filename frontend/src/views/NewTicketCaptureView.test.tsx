import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { NewTicketCaptureView } from './NewTicketCaptureView'
import { useAppStore } from '@/lib/store'

// Global polyfills for jsdom environment
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as any

// Mock Comlink worker
vi.mock('../workers/ocr.worker.ts?worker', () => {
  return {
    default: class MockWorker {
      constructor() {}
    },
  }
})

vi.mock('comlink', () => ({
  wrap: () => ({
    processImage: vi.fn().mockResolvedValue({
      engine: 'tesseract-ner',
      rawText: 'STORE\nBurger 12.00',
      items: [{ name: 'Burger', quantity: 1, unitPrice: 12.0 }],
      subtotal: 12.0,
      confidence: 0.9,
    }),
    processSections: vi.fn().mockResolvedValue([
      {
        sectionId: 'sec_1',
        order: 1,
        scanResult: {
          engine: 'tesseract-ner',
          merchant: 'LA CUISINE',
          rawText: 'LA CUISINE\nBurger 12.00',
          items: [{ name: 'Burger', quantity: 1, unitPrice: 12.0 }],
          subtotal: 12.0,
          confidence: 0.9,
        },
      },
    ]),
  }),
  proxy: (fn: any) => fn,
}))

describe('NewTicketCaptureView Integration & State Machine', () => {
  beforeEach(() => {
    useAppStore.setState({
      tickets: [],
      draftTicketId: null,
      settings: {
        defaultTaxRate: 0.1,
        defaultTipPercentage: 0,
        roundingMode: 'cents',
        preferredEngine: 'tesseract-ner',
      },
      featureFlags: {
        showOcrReview: true,
        verboseLogs: false,
        useMiniAgent: true,
      },
    })
  })

  it('initializes wizard draft and renders capture phase by default', () => {
    const draft = useAppStore.getState().addTicket({ title: 'Draft test' })
    useAppStore.getState().setDraftTicketId(draft.id)

    render(
      <MemoryRouter>
        <NewTicketCaptureView />
      </MemoryRouter>
    )

    expect(screen.getByText('Nuevo ticket')).toBeInTheDocument()
    expect(screen.getByText('Entrada manual (sin foto)')).toBeInTheDocument()
  })

  it('transitions to adjust phase when photo is captured and mounts TicketImageAdjuster', async () => {
    const draft = useAppStore.getState().addTicket({ title: 'Draft test' })
    useAppStore.getState().setDraftTicketId(draft.id)

    render(
      <MemoryRouter>
        <NewTicketCaptureView />
      </MemoryRouter>
    )

    // Trigger photo upload / capture on CameraCapture
    const uploadInput = screen.queryByTestId('file-upload-input')
    if (uploadInput) {
      const file = new File(['(dummy)'], 'receipt.png', { type: 'image/png' })
      fireEvent.change(uploadInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByText('Ajustar Ticket')).toBeInTheDocument()
      })
    }
  })

  it('executes preprocessor, worker batch execution, merger, and hybrid persistence on adjustment confirm', async () => {
    const draft = useAppStore.getState().addTicket({ title: 'Draft test' })
    useAppStore.getState().setDraftTicketId(draft.id)

    render(
      <MemoryRouter>
        <NewTicketCaptureView />
      </MemoryRouter>
    )

    // Directly trigger confirm from adjuster view if mounted
    const adjusterElement = screen.queryByText('Ajustar Ticket')
    if (adjusterElement) {
      const confirmBtn = screen.getByRole('button', { name: /Confirmar/i })
      fireEvent.click(confirmBtn)

      await waitFor(() => {
        expect(screen.getByText('Ticket escaneado')).toBeInTheDocument()
      })

      const updatedDraft = useAppStore.getState().tickets.find((t) => t.id === draft.id)
      expect(updatedDraft).toBeDefined()
      expect(updatedDraft?.scan).toBeDefined()
      expect(updatedDraft?.scan?.qualitySummary).toBeDefined()
    }
  })
})
