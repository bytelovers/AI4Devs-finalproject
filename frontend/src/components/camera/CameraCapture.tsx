/**
 * CameraCapture — Camera capture orchestrator
 *
 * Manages the capture flow: live camera preview → capture → review → confirm/retry.
 * Uses the `useCamera` hook for stream lifecycle and `CameraViewfinder` for overlay.
 *
 * Adapted from the Cuadra project camera-capture component:
 *   - Removed next-themes dependency (uses CSS variables)
 *   - Extracted camera lifecycle into useCamera hook
 *   - Added CameraViewfinder overlay component
 *   - Native camera and upload fallbacks deferred (visible but disabled)
 */

import React, { useState, useRef, useCallback, useEffect } from 'react'
import {
  Camera,
  X,
  RefreshCw,
  Image as ImageIcon,
  SwitchCamera,
  AlertCircle,
  Loader2,
  Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useCamera } from '@/hooks/useCamera'
import { CameraViewfinder } from './CameraViewfinder'

export interface CameraCaptureProps {
  /** Called when the user confirms a captured image. */
  onCapture: (dataUrl: string) => void
  /** Called when the user cancels the camera flow. */
  onCancel: () => void
  /** Optional close handler overlay. */
  onClose?: () => void
}

type CaptureMode = 'live' | 'preview'

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const [mode, setMode] = useState<CaptureMode>('live')
  const [preview, setPreview] = useState<string | null>(null)
  const [errorDismissed, setErrorDismissed] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)

  const {
    startCamera,
    stopCamera,
    captureFrame,
    cameraReady,
    error,
    facingMode,
    switchFacingMode,
  } = useCamera()

  // Start camera on mount
  useEffect(() => {
    startCamera()
  }, [startCamera])

  // Reset error dismissed state when error changes
  useEffect(() => {
    if (error) setErrorDismissed(false)
  }, [error])

  const handleCapture = useCallback(() => {
    const dataUrl = captureFrame(videoRef)
    if (dataUrl) {
      stopCamera()
      setPreview(dataUrl)
      setMode('preview')
    }
  }, [captureFrame, stopCamera])

  const handleRetake = useCallback(() => {
    setPreview(null)
    setMode('live')
    startCamera(facingMode)
  }, [startCamera, facingMode])

  const handleConfirm = useCallback(() => {
    if (preview) onCapture(preview)
  }, [preview, onCapture])

  const handleCancel = useCallback(() => {
    stopCamera()
    onCancel()
  }, [stopCamera, onCancel])

  // ── Preview mode ──
  if (mode === 'preview' && preview) {
    return (
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleRetake}
            className="p-1.5 rounded-full hover:bg-accent"
            aria-label="Retake photo"
          >
            <X className="h-5 w-5" />
          </button>
          <h1 className="text-base font-semibold">Preview</h1>
          <div className="w-8" />
        </div>

        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden border-2 border-border bg-black">
            <img
              src={preview}
              alt="Captured receipt preview"
              className="w-full max-h-[60vh] object-contain"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRetake} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retake
            </Button>
            <Button onClick={handleConfirm} className="flex-1">
              <ImageIcon className="h-4 w-4 mr-2" />
              Use image
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ── Live camera mode ──
  return (
    <div className="px-4 pt-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handleCancel}
          className="p-1.5 rounded-full hover:bg-accent"
          aria-label="Cancel"
        >
          <X className="h-5 w-5" />
        </button>
        <h1 className="text-base font-semibold">Capture ticket</h1>
        <div className="w-8" />
      </div>

      {/* Error banner */}
      {error && !errorDismissed && (
        <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700 flex-1">{error}</p>
          <button
            onClick={() => setErrorDismissed(true)}
            className="text-amber-500 hover:text-amber-700 p-0.5"
            aria-label="Dismiss error"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="space-y-4">
        {/* Viewfinder */}
        <CameraViewfinder cameraReady={cameraReady}>
          <video
            ref={videoRef}
            className={cn(
              'w-full h-full object-cover transition-opacity',
              cameraReady ? 'opacity-100' : 'opacity-0'
            )}
            playsInline
            muted
          />
        </CameraViewfinder>

        {/* Facing mode toggle */}
        {cameraReady && (
          <button
            onClick={switchFacingMode}
            className="absolute top-16 right-8 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 z-10"
            aria-label="Switch camera"
          >
            <SwitchCamera className="h-5 w-5" />
          </button>
        )}

        {/* Capture button */}
        <Button
          onClick={handleCapture}
          disabled={!cameraReady}
          className="w-full"
          size="lg"
        >
          <Camera className="h-5 w-5 mr-2" />
          {cameraReady ? 'Take photo' : 'Starting camera…'}
        </Button>

        {/* Fallback options (deferred — visible but disabled) */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground px-2">or use</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            disabled
            className="opacity-50 cursor-not-allowed"
            title="Native camera — coming soon"
          >
            <Camera className="h-4 w-4 mr-2" />
            Native camera
          </Button>
          <Button
            variant="outline"
            disabled
            className="opacity-50 cursor-not-allowed"
            title="Upload image — coming soon"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload image
          </Button>
        </div>
      </div>
    </div>
  )
}
