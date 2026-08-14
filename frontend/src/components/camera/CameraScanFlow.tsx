/**
 * CameraScanFlow — Capture → OCR → Ticket store orchestrator
 *
 * Manages the end-to-end flow:
 *   1. CameraCapture captures a receipt image
 *   2. Image is preprocessed for OCR
 *   3. OCR worker processes the image via Comlink
 *   4. Scan result is stored as a draft ticket via useAppStore
 *
 * Reuses the singleton Comlink worker pattern for the OCR pipeline.
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import * as Comlink from 'comlink'
import { useNavigate } from 'react-router-dom'
import { Loader2, AlertCircle, RefreshCw, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CameraCapture } from './CameraCapture'
import { preprocessReceiptImage } from '@/lib/scan'
import { genId } from '@/lib/calc'
import type { OCRWorkerType } from '@/workers/ocr.worker'
import type { ScanResult, ScanProgress } from '@/lib/scan/types'
import { useAppStore } from '@/lib/store'

type ScanPhase = 'capture' | 'scanning' | 'complete' | 'error'

export interface CameraScanFlowProps {
  /** Called when the flow is cancelled before completing. */
  onClose?: () => void
  /** Called after a ticket is created from the scan result. */
  onTicketCreated?: (ticketId: string) => void
}

// Singleton Comlink worker proxy
let workerInstance: Comlink.Remote<OCRWorkerType> | null = null
function getWorker(): Comlink.Remote<OCRWorkerType> {
  if (!workerInstance) {
    const w = new Worker(
      new URL('../../workers/ocr.worker.ts', import.meta.url),
      { type: 'module' }
    )
    workerInstance = Comlink.wrap<OCRWorkerType>(w)
  }
  return workerInstance
}

export function CameraScanFlow({ onClose, onTicketCreated }: CameraScanFlowProps) {
  const [phase, setPhase] = useState<ScanPhase>('capture')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanMessage, setScanMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [createdTicketId, setCreatedTicketId] = useState<string | null>(null)

  const abortRef = useRef(false)
  const navigate = useNavigate()

  // Cleanup worker refs on unmount
  useEffect(() => {
    return () => {
      abortRef.current = true
    }
  }, [])

  const addTicket = useAppStore((s) => s.addTicket)
  const preferredEngine = useAppStore((s) => s.settings.preferredEngine)
  const verboseLogs = useAppStore((s) => s.featureFlags.verboseLogs)

  const handleCapture = useCallback(
    async (dataUrl: string) => {
      setCapturedImage(dataUrl)
      setPhase('scanning')
      setScanProgress(0)
      setScanMessage('Preparing image…')
      setErrorMessage(null)
      abortRef.current = false

      try {
        // Step 1: Preprocess for OCR
        const processed = await preprocessReceiptImage(dataUrl, {
          maxWidth: 1280,
          equalizeHistogram: true,
          contrast: 1.2,
        })

        setScanProgress(15)
        setScanMessage('Running OCR…')

        // Step 2: Process via OCR worker
        const worker = getWorker()
        const result: ScanResult = await worker.processImage(
          processed,
          {
            preferredEngine: preferredEngine as 'tesseract' | 'tesseract-ner' | 'florence2',
            useMiniAgent: true,
            verboseLogs,
          },
          Comlink.proxy((p: ScanProgress) => {
            if (abortRef.current) return
            setScanMessage(p.message)
            if (p.percent !== undefined) {
              setScanProgress(Math.max(15, p.percent))
            }
          })
        )

        if (abortRef.current) return

        setScanProgress(100)
        setScanMessage('Scan complete')

        // Step 3: Store as draft ticket
        const itemSum = (result.items || []).reduce(
          (sum, item) => sum + item.unitPrice * item.quantity,
          0
        )

        const ticket = addTicket({
          title: result.merchant
            ? `Ticket - ${result.merchant}`
            : 'Scanned ticket',
          merchant: result.merchant ?? undefined,
          image: capturedImage ?? undefined,
          items: (result.items || []).map((item) => ({
            id: genId(),
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            mode: 'single' as const,
            assignments: [],
          })),
          subtotal: result.subtotal ?? itemSum,
          taxRate: result.taxRate,
          taxAmount: result.taxAmount,
          status: 'draft',
        })

        if (abortRef.current) return

        setCreatedTicketId(ticket.id)
        setPhase('complete')

        // Navigate to ticket
        navigate(`/tickets/${ticket.id}`)
        if (onTicketCreated) onTicketCreated(ticket.id)
      } catch (err: unknown) {
        if (abortRef.current) return
        const message =
          err instanceof Error ? err.message : 'Unknown error during scan'
        console.error('[CameraScanFlow] Scan failed:', err)
        setErrorMessage(message)
        setPhase('error')
      }
    },
    [addTicket, preferredEngine, capturedImage, onTicketCreated, navigate]
  )

  const handleRetry = useCallback(() => {
    if (capturedImage) {
      setPhase('scanning')
      setErrorMessage(null)
      setScanProgress(0)
      setScanMessage('Preparing image…')
      // Re-trigger the scan
      handleCapture(capturedImage)
    } else {
      setPhase('capture')
    }
  }, [capturedImage, handleCapture])

  const handleBackToCapture = useCallback(() => {
    setCapturedImage(null)
    setPhase('capture')
    setErrorMessage(null)
    setScanProgress(0)
    setScanMessage('')
  }, [])

  // ── Scanning phase ──
  if (phase === 'scanning') {
    return (
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-base font-semibold">Scanning ticket…</h1>
        </div>

        <div className="flex flex-col items-center justify-center py-16 gap-6">
          <Loader2 className="h-12 w-12 animate-spin text-[var(--color-sage)]" />
          <div className="w-full max-w-xs bg-border rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${Math.min(100, scanProgress)}%`,
                backgroundColor: 'var(--color-sage, #5F8575)',
              }}
            />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            {scanMessage || `Scanning… ${scanProgress}%`}
          </p>
        </div>
      </div>
    )
  }

  // ── Complete phase ──
  if (phase === 'complete') {
    return (
      <div className="px-4 pt-4">
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <CheckCircle className="h-16 w-16 text-green-500" />
          <h2 className="text-lg font-semibold">Ticket scanned!</h2>
          <p className="text-sm text-muted-foreground text-center">
            The ticket has been created. You can review and adjust the items.
          </p>
          {createdTicketId && (
            <p className="text-xs text-muted-foreground">
              Ticket ID: {createdTicketId.slice(0, 8)}…
            </p>
          )}
        </div>
      </div>
    )
  }

  // ── Error phase ──
  if (phase === 'error') {
    return (
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleBackToCapture}
            className="p-1.5 rounded-full hover:bg-accent"
            aria-label="Back to camera"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
          <h1 className="text-base font-semibold">Scan failed</h1>
          <div className="w-8" />
        </div>

        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            {errorMessage || 'Could not scan the receipt. Please try again.'}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleBackToCapture}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retake photo
            </Button>
            <Button onClick={handleRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry scan
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ── Capture phase (default) ──
  return (
    <CameraCapture
      onCapture={handleCapture}
      onCancel={() => {
        if (onClose) onClose()
      }}
    />
  )
}
