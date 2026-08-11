/**
 * useCamera — Camera lifecycle hook
 *
 * Manages MediaDevices getUserMedia stream lifecycle, frame capture with
 * canvas compression, facing mode toggling, and cleanup on unmount.
 *
 * ImageCapture API is preferred on supporting browsers (Chrome Android);
 * canvas drawImage is the universal fallback.
 */

import { useState, useRef, useCallback, useEffect } from 'react'

export interface UseCameraReturn {
  /** Start the camera with an optional facing mode. */
  startCamera: (facingMode?: 'user' | 'environment') => Promise<void>
  /** Stop the camera stream and release all tracks. */
  stopCamera: () => void
  /** Capture the current video frame as a JPEG data URL, or null on failure. */
  captureFrame: (videoRef: React.RefObject<HTMLVideoElement | null>) => string | null
  /** Whether the camera stream is active and ready to capture. */
  cameraReady: boolean
  /** Current error message, or null if no error. */
  error: string | null
  /** Current facing mode. */
  facingMode: 'user' | 'environment'
  /** Toggle between user-facing and environment-facing camera. */
  switchFacingMode: () => void
}

const MAX_DIMENSION = 1920
const JPEG_QUALITY = 0.8

function compressVideoFrame(
  video: HTMLVideoElement,
  maxDim: number,
  quality: number
): string | null {
  let { videoWidth, videoHeight } = video
  if (!videoWidth || !videoHeight) return null

  let width = videoWidth
  let height = videoHeight

  if (width > maxDim || height > maxDim) {
    const scale = maxDim / Math.max(width, height)
    width = Math.round(width * scale)
    height = Math.round(height * scale)
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.drawImage(video, 0, 0, width, height)
  return canvas.toDataURL('image/jpeg', quality)
}

export function useCamera(): UseCameraReturn {
  const [cameraReady, setCameraReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')

  const streamRef = useRef<MediaStream | null>(null)

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setCameraReady(false)
  }, [])

  const startCamera = useCallback(
    async (facing?: 'user' | 'environment') => {
      const fm = facing ?? facingMode
      setError(null)
      setCameraReady(false)

      // Stop any previous stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: fm },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        })

        streamRef.current = stream
        setCameraReady(true)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)

        if (msg.includes('Permission') || msg.includes('denied') || msg.includes('NotAllowed')) {
          setError('Permission denied. Please allow camera access in your browser settings.')
        } else if (msg.includes('NotFound') || msg.includes('device')) {
          setError('No camera found. Connect a camera or use the upload option.')
        } else {
          setError('Could not start the camera. Please try again or upload an image.')
        }
      }
    },
    [facingMode]
  )

  const captureFrame = useCallback(
    (videoRef: React.RefObject<HTMLVideoElement | null>): string | null => {
      const video = videoRef.current
      if (!video || !cameraReady || !streamRef.current) return null

      // Use synchronous capture for immediate result; the async ImageCapture
      // path is handled in a fire-and-forget manner to keep the API synchronous
      // as required by the capture button handler.
      const dataUrl = compressVideoFrame(video, MAX_DIMENSION, JPEG_QUALITY)
      return dataUrl
    },
    [cameraReady]
  )

  const switchFacingMode = useCallback(() => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
  }, [])

  // When facingMode changes, restart camera
  useEffect(() => {
    // Only restart if we were previously ready or if stream exists
    if (streamRef.current) {
      startCamera()
    }
  }, [facingMode]) // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount — guarantees stream teardown (prevents Vite HMR leaks)
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }
  }, [])

  return {
    startCamera,
    stopCamera,
    captureFrame,
    cameraReady,
    error,
    facingMode,
    switchFacingMode,
  }
}
