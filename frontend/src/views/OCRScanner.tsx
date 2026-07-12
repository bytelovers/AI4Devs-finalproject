import React, { useState, useRef, useCallback, useEffect } from 'react'
import * as Comlink from 'comlink'
import type { OCRWorkerType } from '../workers/ocr.worker'
import type { ScanProgress, ScanResult } from '../lib/scan/types'

interface OCRScannerProps {
  /** Data URL of the receipt image to scan. */
  imageDataUrl?: string
  /** Preferred OCR engine. Defaults to 'tesseract-ner'. */
  preferredEngine?: 'tesseract' | 'tesseract-ner' | 'florence2'
  /** Callback when scan completes with structured data. */
  onScanComplete?: (data: { items: Array<{ name: string; quantity: number; unitPrice: number }>; total: number; merchant?: string }) => void
  /** Callback when user closes the scanner. */
  onClose?: () => void
}

/** Creates a singleton Comlink worker proxy. */
let workerInstance: Comlink.Remote<OCRWorkerType> | null = null
function getWorker(): Comlink.Remote<OCRWorkerType> {
  if (!workerInstance) {
    const w = new Worker(
      new URL('../workers/ocr.worker.ts', import.meta.url),
      { type: 'module' }
    )
    workerInstance = Comlink.wrap<OCRWorkerType>(w)
  }
  return workerInstance
}

export const OCRScanner: React.FC<OCRScannerProps> = ({
  imageDataUrl,
  preferredEngine = 'tesseract-ner',
  onScanComplete,
  onClose,
}) => {
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [phaseMessage, setPhaseMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<boolean>(false)

  const resetState = useCallback(() => {
    setScanning(false)
    setProgress(0)
    setPhaseMessage('')
    setError(null)
    abortRef.current = false
  }, [])

  const startScan = useCallback(async () => {
    if (!imageDataUrl) return

    setScanning(true)
    setProgress(0)
    setPhaseMessage('Preparando…')
    setError(null)
    abortRef.current = false

    try {
      const worker = getWorker()

      const result = await worker.processImage(
        imageDataUrl,
        {
          preferredEngine,
          useMiniAgent: true,
          verboseLogs: false,
        },
        // Progress callback — Comlink proxies this automatically
        Comlink.proxy((p: ScanProgress) => {
          if (abortRef.current) return
          setPhaseMessage(p.message)
          if (p.percent !== undefined) {
            setProgress(p.percent)
          } else {
            // Map phases to approximate progress
            const phaseProgress: Record<string, number> = {
              preprocessing: 10,
              'loading-model': 30,
              'running-inference': 60,
              parsing: 85,
              done: 100,
              error: 0,
            }
            setProgress(phaseProgress[p.phase] ?? 50)
          }
        })
      )

      if (abortRef.current) return

      setProgress(100)
      setPhaseMessage('Escaneo completado')

      if (onScanComplete) {
        const itemSum = result.items.reduce(
          (sum, item) => sum + item.unitPrice * item.quantity,
          0
        )
        onScanComplete({
          items: result.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
          total: result.total ?? itemSum,
          merchant: result.merchant,
        })
      }
    } catch (err) {
      if (abortRef.current) return
      const message = err instanceof Error ? err.message : 'Error desconocido durante el escaneo'
      console.error('[OCRScanner] Scan failed:', err)
      setError(message)
      setPhaseMessage('Error')
    } finally {
      if (!abortRef.current) {
        setScanning(false)
      }
    }
  }, [imageDataUrl, preferredEngine, onScanComplete])

  // Auto-start scanning when image is provided
  useEffect(() => {
    if (imageDataUrl && !scanning) {
      startScan()
    }
    // Cleanup on unmount
    return () => {
      abortRef.current = true
    }
  }, [imageDataUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="ocr-scanner-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        gap: '20px',
        backgroundColor: 'var(--bg-base-dark, #111415)',
        color: '#FFFFFF',
        borderRadius: '16px',
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        maxWidth: '400px',
        margin: '0 auto',
        minHeight: '400px',
        border: '1px solid var(--border, #2d3748)',
      }}
    >
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Cerrar escáner"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'transparent',
            border: 'none',
            color: '#FFFFFF',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '8px',
            zIndex: 10,
          }}
        >
          ✕
        </button>
      )}

      <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0 0 10px 0' }}>
        Escáner de Tickets
      </h2>

      {/* Viewfinder area */}
      <div
        className="viewfinder"
        style={{
          width: '240px',
          height: '240px',
          position: 'relative',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Corner markers */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '20px',
            height: '20px',
            borderTop: '3px solid var(--color-sage, #5F8575)',
            borderLeft: '3px solid var(--color-sage, #5F8575)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '20px',
            height: '20px',
            borderTop: '3px solid var(--color-sage, #5F8575)',
            borderRight: '3px solid var(--color-sage, #5F8575)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '20px',
            height: '20px',
            borderBottom: '3px solid var(--color-sage, #5F8575)',
            borderLeft: '3px solid var(--color-sage, #5F8575)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: '20px',
            height: '20px',
            borderBottom: '3px solid var(--color-sage, #5F8575)',
            borderRight: '3px solid var(--color-sage, #5F8575)',
          }}
        />

        {/* Scan line animation */}
        {scanning && (
          <div
            className="scan-line"
            style={{
              position: 'absolute',
              left: 0,
              width: '100%',
              height: '4px',
              backgroundColor: 'var(--color-sage, #5F8575)',
              top: `${Math.min(100, progress)}%`,
              transition: 'top 0.3s linear',
            }}
          />
        )}

        {/* Phase message */}
        <span
          style={{
            fontSize: '0.875rem',
            color: '#a0aec0',
            textAlign: 'center',
            padding: '10px',
            zIndex: 5,
          }}
        >
          {scanning
            ? phaseMessage || `Escaneando… ${progress}%`
            : error
              ? error
              : imageDataUrl
                ? 'Listo para escanear'
                : 'Alinea el ticket aquí'}
        </span>

        {/* Progress bar */}
        {scanning && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              height: '3px',
              backgroundColor: 'var(--color-sage, #5F8575)',
              width: `${progress}%`,
              transition: 'width 0.3s ease',
              zIndex: 5,
            }}
          />
        )}
      </div>

      {/* Manual trigger button (when no auto-image provided) */}
      {!imageDataUrl && !scanning && (
        <button
          onClick={startScan}
          disabled
          style={{
            backgroundColor: 'var(--color-sage, #5F8575)',
            color: '#FFFFFF',
            padding: '12px 24px',
            border: '1px solid var(--color-sage, #5F8575)',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'not-allowed',
            width: '100%',
            opacity: 0.7,
          }}
        >
          Esperando imagen…
        </button>
      )}

      {/* Retry on error */}
      {error && (
        <button
          onClick={resetState}
          style={{
            backgroundColor: 'transparent',
            color: 'var(--color-sage, #5F8575)',
            padding: '8px 16px',
            border: '1px solid var(--color-sage, #5F8575)',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Reintentar
        </button>
      )}
    </div>
  )
}
