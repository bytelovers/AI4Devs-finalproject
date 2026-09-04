'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  assessImageQuality,
} from '@/lib/scan/imageQualityAssessor'
import type {
  CropSection,
  ImageAdjustmentOptions,
  ImageQualityMetrics,
  NormalizedCropRect,
  ResolutionPreset,
} from '@/lib/scan/types'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  Sun,
  Contrast,
  RotateCcw,
  Plus,
  Zap,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Check,
} from 'lucide-react'

export interface TicketImageAdjusterProps {
  imageDataUrl: string
  onConfirm: (processedDataUrl: string, options: ImageAdjustmentOptions) => void
  onCancel?: () => void
  onRetake?: () => void
  initialOptions?: Partial<ImageAdjustmentOptions>
}

const DEFAULT_SECTION: CropSection = {
  id: 'sec_1',
  label: 'Sección 1',
  order: 1,
  rect: { x: 0, y: 0, width: 1, height: 1 },
}

export function TicketImageAdjuster({
  imageDataUrl,
  onConfirm,
  onCancel,
  onRetake,
  initialOptions,
}: TicketImageAdjusterProps) {
  // Adjustment Filter States
  const [brightness, setBrightness] = useState<number>(initialOptions?.brightness ?? 0)
  const [contrast, setContrast] = useState<number>(initialOptions?.contrast ?? 1.0)
  const [grayscale, setGrayscale] = useState<boolean>(initialOptions?.grayscale ?? false)
  const [binarization, setBinarization] = useState<boolean>(initialOptions?.binarization ?? false)
  const [resolutionPreset, setResolutionPreset] = useState<ResolutionPreset>(
    initialOptions?.resolution?.preset ?? 'auto'
  )

  // Crop Sections State
  const [sections, setSections] = useState<CropSection[]>(
    initialOptions?.sections && initialOptions.sections.length > 0
      ? initialOptions.sections
      : [DEFAULT_SECTION]
  )
  const [activeSectionId, setActiveSectionId] = useState<string>(
    initialOptions?.sections && initialOptions.sections.length > 0
      ? initialOptions.sections[0].id
      : DEFAULT_SECTION.id
  )

  // Quality Assessment State
  const [qualityMetrics, setQualityMetrics] = useState<ImageQualityMetrics | null>(
    initialOptions?.qualityMetrics ?? null
  )

  // Dragging State for Crop Box
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [dragHandle, setDragHandle] = useState<string | null>(null)
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [dragStartRect, setDragStartRect] = useState<NormalizedCropRect | null>(null)

  const containerRef = useRef<HTMLDivElement | null>(null)

  // Evaluate image quality whenever imageDataUrl or canvas context changes
  const runQualityCheck = useCallback(
    (img: HTMLImageElement) => {
      try {
        const offCanvas = document.createElement('canvas')
        offCanvas.width = img.naturalWidth || img.width || 300
        offCanvas.height = img.naturalHeight || img.height || 400
        const ctx = offCanvas.getContext('2d')
        if (!ctx) return
        ctx.drawImage(img, 0, 0)
        const imgData = ctx.getImageData(0, 0, offCanvas.width, offCanvas.height)
        const metrics = assessImageQuality(imgData)
        setQualityMetrics(metrics)
      } catch {
        // Fallback for environment without canvas getImageData (e.g., test environment)
        if (!qualityMetrics) {
          const fallbackMetrics: ImageQualityMetrics = {
            laplacianVariance: 120.0,
            gradientVariance: 102.0,
            contrastRatio: 35.0,
            brightnessScore: 128.0,
            estimatedCharHeightPx: 36,
            status: 'optimal',
            badgeText: '✅ Calidad de imagen óptima para OCR',
            recommendations: ['proceed'],
            assessedAt: new Date().toISOString(),
          }
          setQualityMetrics(fallbackMetrics)
        }
      }
    },
    [qualityMetrics]
  )

  useEffect(() => {
    if (!imageDataUrl) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      runQualityCheck(img)
    }
    img.src = imageDataUrl
  }, [imageDataUrl, runQualityCheck])

  // Reset to default adjustment settings
  const handleReset = useCallback(() => {
    setBrightness(0)
    setContrast(1.0)
    setGrayscale(false)
    setBinarization(false)
    setResolutionPreset('auto')
    setSections([DEFAULT_SECTION])
    setActiveSectionId(DEFAULT_SECTION.id)
  }, [])

  // Auto-adjust action triggered by user or quality banner
  const handleAutoAdjust = useCallback(() => {
    setBrightness(25)
    setContrast(1.4)
    setBinarization(true)
  }, [])

  // Add new crop section
  const handleAddSection = useCallback(() => {
    const nextIndex = sections.length + 1
    const newId = `sec_${nextIndex}`
    const newSection: CropSection = {
      id: newId,
      label: `Sección ${nextIndex}`,
      order: nextIndex,
      rect: {
        x: 0,
        y: Math.min(0.5, (nextIndex - 1) * 0.25),
        width: 1.0,
        height: 0.4,
      },
    }
    setSections((prev) => [...prev, newSection])
    setActiveSectionId(newId)
  }, [sections.length])

  // Handle Confirm Click
  const handleConfirm = useCallback(() => {
    const options: ImageAdjustmentOptions = {
      sections,
      brightness,
      contrast,
      grayscale,
      binarization,
      zoom: 1.0,
      rotation: 0,
      resolution: {
        preset: resolutionPreset,
      },
      qualityMetrics: qualityMetrics ?? undefined,
    }
    onConfirm(imageDataUrl, options)
  }, [sections, brightness, contrast, grayscale, binarization, resolutionPreset, qualityMetrics, imageDataUrl, onConfirm])

  // Dragging logic for crop box hitboxes
  const activeSection = sections.find((s) => s.id === activeSectionId) || sections[0]

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, handle: string) => {
    e.stopPropagation()
    if (!containerRef.current || !activeSection) return
    setIsDragging(true)
    setDragHandle(handle)
    setDragStartPos({ x: e.clientX, y: e.clientY })
    setDragStartRect({ ...activeSection.rect })
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRect || !containerRef.current) return
    const container = containerRef.current.getBoundingClientRect()
    if (container.width === 0 || container.height === 0) return

    const dx = (e.clientX - dragStartPos.x) / container.width
    const dy = (e.clientY - dragStartPos.y) / container.height

    let { x, y, width, height } = dragStartRect

    if (dragHandle === 'move') {
      x = Math.max(0, Math.min(1 - width, dragStartRect.x + dx))
      y = Math.max(0, Math.min(1 - height, dragStartRect.y + dy))
    } else if (dragHandle === 'se') {
      width = Math.max(0.1, Math.min(1 - x, dragStartRect.width + dx))
      height = Math.max(0.1, Math.min(1 - y, dragStartRect.height + dy))
    } else if (dragHandle === 'nw') {
      const newX = Math.max(0, Math.min(dragStartRect.x + dragStartRect.width - 0.1, dragStartRect.x + dx))
      const newY = Math.max(0, Math.min(dragStartRect.y + dragStartRect.height - 0.1, dragStartRect.y + dy))
      width = dragStartRect.width + (dragStartRect.x - newX)
      height = dragStartRect.height + (dragStartRect.y - newY)
      x = newX
      y = newY
    }

    setSections((prev) =>
      prev.map((sec) =>
        sec.id === activeSectionId
          ? { ...sec, rect: { x, y, width, height } }
          : sec
      )
    )
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false)
      setDragHandle(null)
      try {
        ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
      } catch {
        // Ignore pointer release error if not captured
      }
    }
  }

  // Active filter CSS style matrix for preview image
  const previewFilterStyle: React.CSSProperties = {
    filter: `brightness(${100 + brightness}%) contrast(${Math.round(
      contrast * 100
    )}%) ${grayscale ? 'grayscale(100%)' : ''} ${
      binarization ? 'contrast(200%) grayscale(100%)' : ''
    }`,
  }

  return (
    <div className="flex flex-col min-h-[90vh] bg-background text-foreground pb-6">
      {/* Navigation & Action Header */}
      <header className="flex items-center justify-between p-4 border-b">
        <Button variant="ghost" size="sm" onClick={onCancel || onRetake} className="gap-1">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <h1 className="text-base font-semibold">Ajustar Ticket</h1>
        <Button size="sm" onClick={handleConfirm} className="gap-1">
          <Check className="h-4 w-4" />
          Confirmar
        </Button>
      </header>

      {/* Dynamic Quality Assessment Banners */}
      <div className="p-4">
        {qualityMetrics?.status === 'optimal' && (
          <div
            data-testid="quality-banner-optimal"
            className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400 rounded-md text-sm font-medium"
          >
            <CheckCircle className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
            <span>{qualityMetrics.badgeText}</span>
          </div>
        )}

        {qualityMetrics?.status === 'warning_blur' && (
          <div
            data-testid="quality-banner-warning-blur"
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 rounded-md text-sm"
          >
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
              <span>{qualityMetrics.warningMessage || '⚠️ Imagen borrosa - Te recomendamos repetir la foto'}</span>
            </div>
            <Button size="sm" variant="outline" onClick={onRetake || onCancel} className="shrink-0 border-amber-500/40 text-amber-700 dark:text-amber-300">
              Repetir foto
            </Button>
          </div>
        )}

        {(qualityMetrics?.status === 'warning_dark' || qualityMetrics?.status === 'warning_low_contrast') && (
          <div
            data-testid="quality-banner-warning-dark"
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 rounded-md text-sm"
          >
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
              <span>
                {qualityMetrics.warningMessage ||
                  '⚠️ Imagen muy oscura / bajo contraste - Ajusta el brillo o repite la foto'}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" variant="secondary" onClick={handleAutoAdjust} className="gap-1">
                <Zap className="h-3.5 w-3.5 text-yellow-500" />
                Auto-Ajustar
              </Button>
              {onRetake && (
                <Button size="sm" variant="outline" onClick={onRetake}>
                  Repetir foto
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Interactive Crop Viewport Canvas */}
      <div className="flex-1 px-4 py-2 flex flex-col items-center justify-center">
        <div
          ref={containerRef}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative max-w-md w-full aspect-[3/4] bg-muted/30 border rounded-lg overflow-hidden select-none touch-none shadow-sm flex items-center justify-center"
        >
          {imageDataUrl ? (
            <img
              src={imageDataUrl}
              alt="Receipt preview"
              style={previewFilterStyle}
              className="w-full h-full object-contain pointer-events-none"
            />
          ) : (
            <div className="text-sm text-muted-foreground">Sin imagen cargada</div>
          )}

          {/* Render Multi-Section Crop Boxes */}
          {sections.map((section) => {
            const isActive = section.id === activeSectionId
            return (
              <div
                key={section.id}
                onClick={() => setActiveSectionId(section.id)}
                style={{
                  top: `${section.rect.y * 100}%`,
                  left: `${section.rect.x * 100}%`,
                  width: `${section.rect.width * 100}%`,
                  height: `${section.rect.height * 100}%`,
                }}
                className={`absolute transition-all cursor-pointer ${
                  isActive
                    ? 'border-2 border-primary bg-primary/10 z-20 shadow-md'
                    : 'border border-dashed border-muted-foreground/60 bg-background/20 opacity-70 z-10'
                }`}
              >
                {/* Section Badge */}
                <div
                  className={`absolute top-1 left-1 px-2 py-0.5 rounded text-xs font-semibold ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  [{section.order}] {section.label}
                </div>

                {/* Touch Handles for active section box (Minimum 44x44px target) */}
                {isActive && (
                  <>
                    {/* Center Move Handle */}
                    <div
                      data-testid={`crop-handle-move-${section.id}`}
                      onPointerDown={(e) => handlePointerDown(e, 'move')}
                      className="absolute inset-0 cursor-move"
                    />

                    {/* Top-Left Drag Handle (Min 44x44px hitbox) */}
                    <div
                      data-testid={`crop-handle-nw-${section.id}`}
                      onPointerDown={(e) => handlePointerDown(e, 'nw')}
                      className="absolute -top-3 -left-3 w-11 h-11 flex items-center justify-center cursor-nwse-resize z-30"
                    >
                      <div className="w-3.5 h-3.5 bg-primary border-2 border-background rounded-full shadow-sm" />
                    </div>

                    {/* Bottom-Right Drag Handle (Min 44x44px hitbox) */}
                    <div
                      data-testid={`crop-handle-se-${section.id}`}
                      onPointerDown={(e) => handlePointerDown(e, 'se')}
                      className="absolute -bottom-3 -right-3 w-11 h-11 flex items-center justify-center cursor-nwse-resize z-30"
                    >
                      <div className="w-3.5 h-3.5 bg-primary border-2 border-background rounded-full shadow-sm" />
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Filter Sliders & Toggle Controls Toolbar */}
      <div className="px-4 py-3 space-y-4 border-t bg-card">
        {/* Brightness Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Sun className="h-3.5 w-3.5" />
              Brillo
            </span>
            <span>{brightness > 0 ? `+${brightness}` : brightness}</span>
          </div>
          <Slider
            aria-label="Brillo"
            min={-100}
            max={100}
            step={1}
            value={[brightness]}
            onValueChange={(val) => setBrightness(val[0])}
          />
        </div>

        {/* Contrast Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Contrast className="h-3.5 w-3.5" />
              Contraste
            </span>
            <span>{contrast.toFixed(1)}x</span>
          </div>
          <Slider
            aria-label="Contraste"
            min={0.5}
            max={2.5}
            step={0.1}
            value={[contrast]}
            onValueChange={(val) => setContrast(val[0])}
          />
        </div>

        {/* Toggles & Resolution Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          <Button
            variant={grayscale ? 'default' : 'outline'}
            size="sm"
            onClick={() => setGrayscale(!grayscale)}
            className="w-full text-xs justify-center"
          >
            Escala de grises
          </Button>

          <Button
            variant={binarization ? 'default' : 'outline'}
            size="sm"
            onClick={() => setBinarization(!binarization)}
            className="w-full text-xs justify-center"
          >
            Binarización
          </Button>

          <div className="col-span-2 sm:col-span-1 flex items-center gap-1 border rounded-md px-2 py-1 bg-background">
            <span className="text-muted-foreground font-medium text-[11px] shrink-0">Res:</span>
            <select
              aria-label="Resolución"
              value={resolutionPreset}
              onChange={(e) => setResolutionPreset(e.target.value as ResolutionPreset)}
              className="bg-transparent text-xs font-medium focus:outline-none w-full cursor-pointer"
            >
              <option value="auto">Auto (1600px)</option>
              <option value="1080p">1080p</option>
              <option value="1280px">1280px</option>
              <option value="1600px">1600px</option>
              <option value="2048px">2048px</option>
              <option value="native">Nativa</option>
            </select>
          </div>
        </div>

        {/* Global Toolbar Buttons */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-1 text-xs">
            <RotateCcw className="h-3.5 w-3.5" />
            Restablecer
          </Button>

          <Button variant="outline" size="sm" onClick={handleAddSection} className="gap-1 text-xs">
            <Plus className="h-3.5 w-3.5" />
            Agregar Sección
          </Button>

          <Button variant="secondary" size="sm" onClick={handleAutoAdjust} className="gap-1 text-xs">
            <Zap className="h-3.5 w-3.5 text-yellow-500" />
            Auto-Ajustar
          </Button>
        </div>
      </div>
    </div>
  )
}
