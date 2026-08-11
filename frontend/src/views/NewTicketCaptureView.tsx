'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import * as Comlink from 'comlink'
import { useAppStore } from '@/lib/store'
import { genId } from '@/lib/calc'
import { PageHeader } from '@/components/ui/EmptyState'
import { CameraCapture } from '@/components/camera/CameraCapture'
import { TicketImageAdjuster } from '@/components/camera/TicketImageAdjuster'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { preprocessMultiSectionReceipt } from '@/lib/scan/preprocessor'
import { mergeMultiSectionOcrResults } from '@/lib/scan/multiSectionMerger'
import type { OCRWorkerType } from '@/workers/ocr.worker'
import type { ImageAdjustmentOptions, SectionOcrPayload } from '@/lib/scan/types'
import type { ScanMetadata } from '@/lib/types'
import { Loader2, AlertCircle, RefreshCw, Upload, Sparkles, CheckCircle } from 'lucide-react'

// Singleton Comlink worker proxy using Vite's ?worker import
import OCRWorker from '../workers/ocr.worker.ts?worker'

let workerInstance: Comlink.Remote<OCRWorkerType> | null = null
function getWorker(): Comlink.Remote<OCRWorkerType> {
  if (!workerInstance) {
    const w = new OCRWorker()
    workerInstance = Comlink.wrap<OCRWorkerType>(w)
  }
  return workerInstance
}

export type CapturePhase = 'capture' | 'adjust' | 'scanning' | 'complete' | 'error'

export function NewTicketCaptureView() {
  const draftTicketId = useAppStore((s) => s.draftTicketId)
  const tickets = useAppStore((s) => s.tickets)
  const deleteTicket = useAppStore((s) => s.deleteTicket)
  const clearDraftTicketId = useAppStore((s) => s.clearDraftTicketId)
  const updateTicket = useAppStore((s) => s.updateTicket)
  const recalcTicket = useAppStore((s) => s.recalcTicket)
  const addTicketItem = useAppStore((s) => s.addTicketItem)
  const preferredEngine = useAppStore((s) => s.settings.preferredEngine)
  const navigate = useNavigate()

  const [phase, setPhase] = useState<CapturePhase>('capture')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanMessage, setScanMessage] = useState('')
  const [scanError, setScanError] = useState<string | null>(null)

  const abortRef = useRef(false)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current = true
    }
  }, [])

  // The capture loader has already ensured draftTicketId + ticket exist.
  const draft = draftTicketId ? tickets.find((t) => t.id === draftTicketId) : null

  // FR-009: Back from capture with empty draft → delete draft + navigate home.
  const handleBack = useCallback(() => {
    if (draft && draft.items.length === 0 && !draft.image) {
      deleteTicket(draft.id)
      clearDraftTicketId()
    }
    navigate('/')
  }, [draft, deleteTicket, clearDraftTicketId, navigate])

  // Initial Photo Capture -> Transitions to 'adjust' phase
  const handlePhotoCaptured = useCallback((imageDataUrl: string) => {
    setCapturedImage(imageDataUrl)
    setPhase('adjust')
  }, [])

  // Confirm adjustments & initiate OCR scanning pipeline
  const handleConfirmAdjust = useCallback(
    async (imageDataUrl: string, options: ImageAdjustmentOptions) => {
      setPhase('scanning')
      setScanProgress(0)
      setScanMessage('Preprocesando imagen y recortes…')
      setScanError(null)
      abortRef.current = false

      try {
        // Step 1: Save captured image to draft
        if (draftTicketId) {
          updateTicket(draftTicketId, { image: imageDataUrl })
        }

        // Step 2: Multi-section canvas preprocessing pipeline
        const preprocessResult = await preprocessMultiSectionReceipt(imageDataUrl, options)

        if (abortRef.current) return
        setScanProgress(20)
        setScanMessage('Iniciando OCR por secciones…')

        // Step 3: Off-main-thread batch section processing via Comlink Worker
        const worker = getWorker()
        let payloads: SectionOcrPayload[] = []

        if (typeof worker.processSections === 'function') {
          payloads = await worker.processSections(
            preprocessResult.sections,
            {
              preferredEngine: preferredEngine as any,
              useMiniAgent: true,
              verboseLogs: false,
            },
            Comlink.proxy((p: any) => {
              if (abortRef.current) return
              setScanMessage(p.message || 'Escaneando ticket…')
              if (p.percent !== undefined) {
                setScanProgress(Math.max(20, p.percent))
              }
            })
          )
        } else {
          // Fallback single-image worker processing
          const singleRes = await worker.processImage(
            preprocessResult.sections[0]?.dataUrl || imageDataUrl,
            {
              preferredEngine: preferredEngine as any,
              useMiniAgent: true,
              verboseLogs: false,
            },
            Comlink.proxy((p: any) => {
              if (abortRef.current) return
              setScanMessage(p.message || 'Escaneando ticket…')
              if (p.percent !== undefined) {
                setScanProgress(Math.max(20, p.percent))
              }
            })
          )
          payloads = [
            {
              sectionId: 'sec_1',
              order: 1,
              scanResult: singleRes,
            },
          ]
        }

        if (abortRef.current) return

        setScanProgress(90)
        setScanMessage('Sintetizando resultados de secciones…')

        // Step 4: Multi-section synthesis & deduplication engine
        const mergedResult = mergeMultiSectionOcrResults(
          payloads,
          preprocessResult.qualitySummary
        )

        setScanProgress(100)
        setScanMessage('Escaneo completado')

        // Step 5: Persist merged results & hybrid quality metadata to store
        if (draftTicketId) {
          const itemSum = (mergedResult.items || []).reduce(
            (sum, item) => sum + item.unitPrice * item.quantity,
            0
          )

          const scanMetadata: ScanMetadata = {
            engine: (payloads[0]?.scanResult?.engine as any) || preferredEngine || 'tesseract-ner',
            rawText: mergedResult.rawTextCombined ?? '',
            confidence: mergedResult.confidence,
            preprocessedImageDataUrl: preprocessResult.sections[0]?.dataUrl,
            processedAt: new Date().toISOString(),
            qualitySummary: mergedResult.qualitySummary,
            sectionCount: mergedResult.sectionCount,
            adjustmentsSummary: {
              brightness: options.brightness,
              contrast: options.contrast,
              binarizationUsed: options.binarization,
              resolutionPreset: options.resolution.preset,
            },
          }

          const defaultTaxRate = useAppStore.getState().settings.defaultTaxRate

          updateTicket(draftTicketId, {
            title: mergedResult.merchant
              ? `Ticket - ${mergedResult.merchant}`
              : 'Ticket escaneado',
            merchant: mergedResult.merchant,
            date: mergedResult.date || new Date().toISOString(),
            image: imageDataUrl,
            items: (mergedResult.items || []).map((item) => ({
              id: genId(),
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              mode: 'single' as const,
              assignments: [],
            })),
            subtotal: mergedResult.subtotal ?? itemSum,
            taxRate: mergedResult.taxRate ?? defaultTaxRate,
            taxAmount: mergedResult.taxAmount,
            scan: scanMetadata,
          })

          recalcTicket(draftTicketId)
        }

        setPhase('complete')
      } catch (err: unknown) {
        if (abortRef.current) return
        const message =
          err instanceof Error ? err.message : 'Error desconocido durante el escaneo'
        console.error('[NewTicketCapture] Scan failed:', err)
        setScanError(message)
        setPhase('error')
      }
    },
    [draftTicketId, updateTicket, recalcTicket, preferredEngine]
  )

  const handleRetakeAdjust = useCallback(() => {
    setCapturedImage(null)
    setPhase('capture')
  }, [])

  const handleManualEntry = () => {
    if (draftTicketId) {
      updateTicket(draftTicketId, { title: 'Ticket manual' })
      // Add an empty placeholder item so review allows entry
      addTicketItem(draftTicketId, { name: '', quantity: 1, unitPrice: 0 })
    }
    navigate('/tickets/new/review')
  }

  const handleRetryScan = useCallback(() => {
    if (capturedImage) {
      setPhase('adjust')
      setScanError(null)
      setScanProgress(0)
    } else {
      setPhase('capture')
    }
  }, [capturedImage])


  if (!draft) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="text-muted-foreground">Iniciando wizard…</p>
      </div>
    )
  }

  // ── Adjust Phase ──
  if (phase === 'adjust' && capturedImage) {
    return (
      <TicketImageAdjuster
        imageDataUrl={capturedImage}
        onConfirm={handleConfirmAdjust}
        onCancel={handleRetakeAdjust}
        onRetake={handleRetakeAdjust}
      />
    )
  }

  // ── Scanning phase ──
  if (phase === 'scanning') {
    return (
      <div className="px-4 pt-20">
        <div className="flex flex-col items-center justify-center gap-6">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="w-full max-w-xs bg-border rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300 ease-out bg-primary"
              style={{ width: `${Math.min(100, scanProgress)}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            {scanMessage || `Escaneando… ${scanProgress}%`}
          </p>
        </div>
      </div>
    )
  }

  // ── Complete phase ──
  if (phase === 'complete') {
    return (
      <div className="px-4 pt-20">
        <div className="flex flex-col items-center justify-center gap-4">
          <CheckCircle className="h-16 w-16 text-green-500" />
          <h2 className="text-lg font-semibold">Ticket escaneado</h2>
          <p className="text-sm text-muted-foreground text-center">
            Los items se han extraído automáticamente. Puedes revisarlos y ajustarlos.
          </p>
          <div className="flex gap-2 mt-4">
            <Button
              onClick={() =>
                navigate('/tickets/new/review')
              }
            >
              Revisar ticket
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ── Error phase ──
  if (phase === 'error') {
    return (
      <div className="px-4 pt-4">
        <PageHeader
          title="Error de escaneo"
          subtitle="No se pudo procesar la imagen"
          back={() => {
            setCapturedImage(null)
            setPhase('capture')
            setScanError(null)
          }}
        />
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            {scanError || 'No se pudo escanear la imagen. Intenta de nuevo.'}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setCapturedImage(null)
                setPhase('capture')
                setScanError(null)
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Rehacer foto
            </Button>
            <Button onClick={handleRetryScan}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Si el error persiste, prueba con entrada manual
          </p>
          <Button variant="ghost" onClick={handleManualEntry}>
            Entrada manual
          </Button>
        </div>
      </div>
    )
  }

  // ── Capture phase (default) ──
  return (
    <div className="px-4 pt-4">
      <PageHeader
        title="Nuevo ticket"
        subtitle="Escanea o sube la imagen del ticket"
        back={handleBack}
      />

      <CameraCapture
        onCapture={handlePhotoCaptured}
        onCancel={handleBack}
      />

      <div className="mt-6 space-y-3">
        <Button
          variant="outline"
          onClick={handleManualEntry}
          className="w-full gap-2"
        >
          <Upload className="h-5 w-5" />
          Entrada manual (sin foto)
        </Button>

        <Card className="p-4 border-dashed bg-accent/30">
          <p className="text-sm text-muted-foreground text-center">
            <Sparkles className="h-4 w-4 mx-auto mb-2 text-primary" />
            El OCR detectará automáticamente items, precios e impuestos.
          </p>
        </Card>
      </div>
    </div>
  )
}
