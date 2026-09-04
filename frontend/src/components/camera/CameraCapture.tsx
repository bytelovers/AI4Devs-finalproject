import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Camera,
  Upload,
  X,
  RefreshCw,
  Image as ImageIcon,
  Loader2,
  SwitchCamera,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { extractExifFromFile } from '@/utils/exifHelper'
import type { CapturedImage, ExifNamespace } from '@/lib/types'

interface CameraCaptureProps {
  onCapture: (img: CapturedImage) => void
  onCancel: () => void
}

type CaptureMode = 'live' | 'native' | 'upload' | 'preview'

/** Namespace EXIF vacío: cámara en vivo (sin File) o fallback de extracción. */
const EMPTY_NAMESPACE: ExifNamespace = {
  gps: null,
  timestamp: null,
  device: null,
  orientation: null,
}

/**
 * Componente para capturar imagen de un ticket.
 *
 * Modos de captura:
 * 1. **Cámara en vivo** (preferido en móvil): vista previa con getUserMedia,
 *    botón de captura, switch cámara frontal/trasera.
 * 2. **Cámara nativa** (fallback): input capture="environment" que abre la
 *    app de cámara nativa del dispositivo.
 * 3. **Subir archivo**: input file normal para elegir imagen de la galería.
 */
export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const [mode, setMode] = useState<CaptureMode>('live')
  const [preview, setPreview] = useState<string | null>(null)
  const [exif, setExif] = useState<ExifNamespace>(EMPTY_NAMESPACE)
  const [error, setError] = useState<string | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Iniciar cámara en vivo
  const startCamera = useCallback(async () => {
    setError(null)
    setCameraReady(false)
    try {
      // Parar stream anterior si existe
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
          setCameraReady(true)
        }
      }
    } catch (err) {
      console.warn('[camera] getUserMedia falló:', err)
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      if (msg.includes('Permission') || msg.includes('denied')) {
        setError('Permiso de cámara denegado. Permite el acceso o usa la cámara nativa.')
      } else if (msg.includes('NotFound') || msg.includes('device')) {
        setError('No se encontró cámara. Usa la cámara nativa o sube una imagen.')
      } else {
        setError('No se pudo iniciar la cámara. Usa la cámara nativa o sube una imagen.')
      }
      // Auto-fallback a cámara nativa
      setMode('native')
    }
  }, [facingMode])

  // Detener cámara
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setCameraReady(false)
  }, [])

  // Capturar frame del video
  const captureFrame = useCallback(() => {
    if (!videoRef.current || !cameraReady) return
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
    stopCamera()
    // Cámara en vivo: no hay File → EXIF es namespace nulo (REQ-EXIF-07).
    setExif(EMPTY_NAMESPACE)
    setPreview(dataUrl)
    setMode('preview')
  }, [cameraReady, stopCamera])

  // Switch cámara
  const switchCamera = useCallback(() => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
  }, [])

  // Efecto: iniciar/detener cámara según modo
  useEffect(() => {
    if (mode === 'live') {
      void startCamera()
    } else {
      stopCamera()
    }
    return () => stopCamera()
  }, [mode, facingMode, startCamera, stopCamera])

  // Limpiar al desmontar
  useEffect(() => {
    return () => stopCamera()
  }, [stopCamera])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      setError(null)
      if (file.size > 10 * 1024 * 1024) {
        setError('La imagen es demasiado grande (máx 10MB).')
        return
      }
      if (!file.type.startsWith('image/')) {
        setError('El archivo debe ser una imagen.')
        return
      }
      // REQ-EXIF-01 (D2): extraer EXIF del File ORIGINAL antes de comprimir —
      // compressImage re-dibuja en canvas y los navegadores descartan EXIF.
      void extractExifFromFile(file).then(setExif)
      compressImage(file, 1600, 0.85)
        .then((dataUrl) => {
          setPreview(dataUrl)
          setMode('preview')
        })
        .catch(() => setError('No se pudo procesar la imagen.'))
      e.target.value = ''
    },
    []
  )

  const handleConfirm = () => {
    // Transporte {dataUrl, exif} (REQ-EXIF-06); la persistencia lo descarta.
    if (preview) onCapture({ dataUrl: preview, exif })
  }

  const handleRetake = () => {
    setPreview(null)
    setMode('live')
  }

  // === Modo preview ===
  if (mode === 'preview' && preview) {
    return (
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleRetake}
            className="p-1.5 rounded-full hover:bg-accent"
            aria-label="Cancelar"
          >
            <X className="h-5 w-5" />
          </button>
          <h1 className="text-base font-semibold">Vista previa</h1>
          <div className="w-8" />
        </div>

        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden border-2 border-border bg-black">
            <img
              src={preview}
              alt="Vista previa del ticket"
              className="w-full max-h-[60vh] object-contain"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRetake} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Repetir
            </Button>
            <Button onClick={handleConfirm} className="flex-1">
              <ImageIcon className="h-4 w-4 mr-2" />
              Usar imagen
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // === Modo cámara en vivo ===
  return (
    <div className="px-4 pt-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onCancel}
          className="p-1.5 rounded-full hover:bg-accent"
          aria-label="Cancelar"
        >
          <X className="h-5 w-5" />
        </button>
        <h1 className="text-base font-semibold">Capturar ticket</h1>
        <div className="w-8" />
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-warning-bg border border-warning-border flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
          <p className="text-sm text-warning-foreground">{error}</p>
        </div>
      )}

      {/* Vista previa de cámara en vivo */}
      {mode === 'live' && (
        <div className="space-y-4">
          <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-black">
            <video
              ref={videoRef}
              className={cn(
                'w-full h-full object-cover transition-opacity',
                cameraReady ? 'opacity-100' : 'opacity-0'
              )}
              playsInline
              muted
            />
            {!cameraReady && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <p className="text-sm">Iniciando cámara…</p>
              </div>
            )}
            {/* Marco guía */}
            {cameraReady && (
              <div className="absolute inset-8 pointer-events-none">
                <div className="w-full h-full border-2 border-white/40 rounded-lg" />
                <p className="absolute -bottom-8 left-0 right-0 text-center text-xs text-white/80">
                  Centra el ticket en el marco
                </p>
              </div>
            )}
            {/* Switch cámara */}
            {cameraReady && (
              <button
                onClick={switchCamera}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
                aria-label="Cambiar cámara"
              >
                <SwitchCamera className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Botón capturar */}
          <Button
            onClick={captureFrame}
            disabled={!cameraReady}
            className="w-full"
            size="lg"
          >
            <Camera className="h-5 w-5 mr-2" />
            {cameraReady ? 'Hacer foto' : 'Iniciando cámara…'}
          </Button>

          {/* Opciones alternativas */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground px-2">o usa</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => {
                stopCamera()
                setMode('native')
                setTimeout(() => cameraInputRef.current?.click(), 100)
              }}
            >
              <Camera className="h-4 w-4 mr-2" />
              Cámara nativa
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                stopCamera()
                setMode('upload')
                setTimeout(() => fileInputRef.current?.click(), 100)
              }}
            >
              <Upload className="h-4 w-4 mr-2" />
              Subir imagen
            </Button>
          </div>
        </div>
      )}

      {/* Vista para modo native/upload con placeholder */}
      {mode !== 'live' && !preview && (
        <div className="space-y-4">
          <div
            className="aspect-[3/4] w-full rounded-2xl border-2 border-dashed border-border bg-accent/30 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => cameraInputRef.current?.click()}
          >
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Camera className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center px-6">
              <p className="font-semibold text-foreground mb-1">
                Toca para hacer la foto
              </p>
              <p className="text-xs text-muted-foreground">
                Centra el ticket en la foto. Asegúrate de que se lean bien los
                precios.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground px-2">o</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setMode('live')
              }}
            >
              <Camera className="h-4 w-4 mr-2" />
              Cámara en vivo
            </Button>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Subir imagen
            </Button>
          </div>
        </div>
      )}

      {/* Inputs ocultos */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}

/** Comprime una imagen y la devuelve como data URL JPEG. */
async function compressImage(
  file: File,
  maxDimension: number,
  quality: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height * maxDimension) / width
            width = maxDimension
          } else {
            width = (width * maxDimension) / height
            height = maxDimension
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('No canvas context'))
          return
        }
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = () => reject(new Error('No se pudo cargar la imagen'))
      img.src = reader.result as string
    }
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'))
    reader.readAsDataURL(file)
  })
}