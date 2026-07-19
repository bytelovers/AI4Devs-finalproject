'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import type { ParsedTicket } from '@/lib/types'
import { PageHeader } from '@/components/ui/EmptyState'
import { CameraCapture } from '@/components/camera/CameraCapture'
import {
  TicketItemsEditor,
  ScanningOverlay,
  ScanErrorBanner,
  ScanSuccessBanner,
} from '@/components/ticket/TicketItemsEditor'
import { ParticipantPicker } from '@/components/ticket/ParticipantPicker'
import { AssignmentEditor } from '@/components/ticket/AssignmentEditor'
import { TicketSummary } from '@/components/ticket/TicketSummary'
import { ScanOnboarding } from '@/components/onboarding/ScanOnboarding'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Check,
  Edit3,
  ListChecks,
  Users,
  Receipt,
  Sparkles,
  Cpu,
  Server,
  Image as ImageIcon,
  Wand2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { scanTicket } from '@/lib/scan/orchestrator'
import type { ScanProgress, ScanResult } from '@/lib/scan/types'

type Step =
  | 'capture'
  | 'scanning'
  | 'ocr-review'
  | 'review'
  | 'participants'
  | 'assign'
  | 'summary'

const STEP_ORDER: Step[] = [
  'capture',
  'review',
  'participants',
  'assign',
  'summary',
]

const STEP_META: Record<
  Exclude<Step, 'scanning' | 'ocr-review'>,
  { title: string; subtitle: string; icon: typeof Camera }
> = {
  capture: {
    title: 'Nuevo ticket',
    subtitle: 'Escanea o sube la imagen',
    icon: Camera,
  },
  review: {
    title: 'Revisar ticket',
    subtitle: 'Confirma los items y los impuestos',
    icon: Edit3,
  },
  participants: {
    title: 'Participantes',
    subtitle: '¿Quién participa en esta cuenta?',
    icon: Users,
  },
  assign: {
    title: 'Asignar items',
    subtitle: 'Reparte cada item entre las personas',
    icon: ListChecks,
  },
  summary: {
    title: 'Resumen y cuadre',
    subtitle: 'Verifica que todo cuadra',
    icon: Receipt,
  },
}

export function NewTicketView() {
  const addTicket = useAppStore((s) => s.addTicket)
  const updateTicket = useAppStore((s) => s.updateTicket)
  const setView = useAppStore((s) => s.setView)
  const tickets = useAppStore((s) => s.tickets)
  const recalcTicket = useAppStore((s) => s.recalcTicket)
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const featureFlags = useAppStore((s) => s.featureFlags)
  const startManual = useAppStore((s) => s._startManual)

  const [step, setStep] = useState<Step>('capture')
  const [ticketId, setTicketId] = useState<string | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | undefined>()
  const [scanError, setScanError] = useState<string | null>(null)
  const [scanSucceeded, setScanSucceeded] = useState(false)
  const [scanEngineUsed, setScanEngineUsed] = useState<string | null>(null)
  const [titleInput, setTitleInput] = useState('')
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  // Inicializar flags desde preferredEngine guardado
  const [forceServerNext, setForceServerNext] = useState(settings.preferredEngine === 'server')
  const [forceTesseractNext, setForceTesseractNext] = useState(settings.preferredEngine === 'tesseract')
  const [forceTesseractNerNext, setForceTesseractNerNext] = useState(settings.preferredEngine === 'tesseract-ner')
  // Estado para revisión OCR antes del NER
  const [ocrRawText, setOcrRawText] = useState<string>('')
  const [ocrPreprocessedImage, setOcrPreprocessedImage] = useState<string | undefined>()

  const ticket = tickets.find((t) => t.id === ticketId) ?? null
  const stepIndex = STEP_ORDER.indexOf(step)

  // Si viene del botón "Manual", crear ticket vacío y saltar a review
  useEffect(() => {
    if (startManual) {
      useAppStore.setState({ _startManual: false })
      const newTicket = addTicket({
        title: 'Ticket manual',
        items: [],
        status: 'draft',
      })
      setTicketId(newTicket.id)
      setTitleInput('Ticket manual')
      setStep('review')
    }
  }, [startManual, addTicket])

  // ----- Helpers -----
  // Función helper para aplicar el resultado del escaneo al ticket
  const applyScanResult = useCallback(
    (result: ScanResult, ticketId: string, imageDataUrl: string) => {
      updateTicket(ticketId, {
        title: result.merchant || 'Ticket escaneado',
        merchant: result.merchant,
        image: result.preprocessedImageDataUrl ?? imageDataUrl,
        items: result.items.map((it) => ({
          id: Math.random().toString(36).slice(2, 12),
          name: it.name,
          quantity: it.quantity || 1,
          unitPrice: it.unitPrice || 0,
          mode: 'single' as const,
          assignments: [],
        })),
        discounts: (result.discounts || []).map((d) => ({
          id: Math.random().toString(36).slice(2, 12),
          name: d.name,
          mode: d.mode,
          amount: d.amount,
          percentage: d.percentage,
        })),
        taxRate: result.taxRate ?? 0.1,
        taxAmount: result.taxAmount ?? 0,
        date: safeDateToISO(result.date) ?? new Date().toISOString(),
      })
      recalcTicket(ticketId)
      setTitleInput(result.merchant || 'Ticket escaneado')
      setScanSucceeded(true)
      setScanProgress(null)
      setStep('review')

      const engineLabel =
        result.engine === 'florence2'
          ? 'Escaneo avanzado'
          : result.engine === 'tesseract'
          ? 'Escaneo básico'
          : result.engine === 'tesseract-ner'
          ? 'Escaneo con IA'
          : 'IA en la nube'
      const itemsCount = result.items.length
      const discountsCount = (result.discounts || []).length
      toast.success(`Escaneado con ${engineLabel}`, {
        description: `${itemsCount} items${discountsCount > 0 ? ` · ${discountsCount} descuentos` : ''} detectados`,
      })
    },
    [updateTicket, recalcTicket]
  )

  // Función helper para procesar texto con NER
  const processWithNer = useCallback(
    async (
      text: string,
      preprocessedImage: string | undefined,
      _image: string,
      onProgress?: (p: ScanProgress) => void
    ): Promise<ScanResult> => {
      const { classifyWithNER } = await import('@/lib/scan/ner-engine')
      const { parseReceiptText } = await import('@/lib/scan/receipt-parser')
      const { classifyIntent } = await import('@/lib/scan/mini-agent')

      const intent = featureFlags.useMiniAgent
        ? classifyIntent(text)
        : { recommendedModel: 'general' as const, confidence: 1 }
      console.log('[mini-agent] Intent:', intent)

      let nerEntities: any[] = []
      try {
        const nerResult = await classifyWithNER(
          text,
          intent.recommendedModel,
          onProgress
        )
        nerEntities = nerResult.entities
      } catch (err) {
        console.warn('[ner] NER falló, usando solo parser:', err)
      }

      const parsed = parseReceiptText(text)

      let merchant = parsed.merchant
      if (nerEntities.length > 0) {
        const orgEntities = nerEntities
          .filter((e: any) => e.entity?.includes('ORG') && e.score > 0.7)
          .sort((a: any, b: any) => b.score - a.score)
        if (orgEntities.length > 0) {
          const merchantWords = orgEntities.map((e: any) =>
            e.word.startsWith('##') ? e.word.substring(2) : e.word
          )
          const nerMerchant = merchantWords.join(' ').trim()
          if (
            nerMerchant.length >= 3 &&
            nerMerchant.length <= 60 &&
            /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(nerMerchant)
          ) {
            merchant = nerMerchant
          }
        }
      }

      return {
        ...parsed,
        merchant,
        engine: 'tesseract-ner',
        preprocessedImageDataUrl: preprocessedImage,
        rawText: text,
      }
    },
    [featureFlags.useMiniAgent]
  )

  // ----- Handlers de captura -----
  const handleCapture = useCallback(
    async (imageDataUrl: string) => {
      setCapturedImage(imageDataUrl)
      setStep('scanning')
      setScanError(null)
      setScanProgress({
        phase: 'preprocessing',
        message: 'Preparando imagen…',
      })

      // Crear ticket inicial vacío con la imagen
      const newTicket = addTicket({
        title: 'Nuevo ticket',
        image: imageDataUrl,
        items: [],
        status: 'draft',
      })
      setTicketId(newTicket.id)

      try {
        // Si el motor es Tesseract+NER, dividir el pipeline:
        // 1. Ejecutar solo Tesseract
        // 2. Mostrar revisión OCR
        // 3. Después el usuario continúa y se ejecuta NER
        if (forceTesseractNerNext) {
          const { scanWithTesseract } = await import('@/lib/scan/tesseract-engine')
          const tesseractResult = await scanWithTesseract(imageDataUrl, (p) =>
            setScanProgress(p)
          )

          // Si el feature flag showOcrReview está activo, mostrar pantalla de revisión
          if (featureFlags.showOcrReview) {
            // Guardar texto OCR para revisión
            setOcrRawText(tesseractResult.rawText ?? '')
            setOcrPreprocessedImage(tesseractResult.preprocessedImageDataUrl)
            setScanProgress(null)
            setStep('ocr-review')
            return
          }

          // Si está desactivado, procesar directamente con NER
          const result = await processWithNer(
            tesseractResult.rawText ?? '',
            tesseractResult.preprocessedImageDataUrl,
            imageDataUrl,
            (p) => setScanProgress(p)
          )
          setScanEngineUsed('tesseract-ner')
          applyScanResult(result, newTicket.id, imageDataUrl)
          return
        }

        // Para otros motores, ejecutar normalmente
        const result: ScanResult = await scanTicket(
          { imageDataUrl, forceServer: forceServerNext },
          {
            forceServer: forceServerNext,
            forceTesseract: forceTesseractNext,
            forceTesseractNer: false, // Ya se manejó arriba
            onProgress: (p) => setScanProgress(p),
          }
        )

        setScanEngineUsed(result.engine)
        applyScanResult(result, newTicket.id, imageDataUrl)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error desconocido'
        setScanError(msg)
        setScanProgress(null)
        setTitleInput('Ticket manual')
        setStep('review')
      }
    },
    [addTicket, updateTicket, recalcTicket, forceServerNext, forceTesseractNext, forceTesseractNerNext, featureFlags.showOcrReview, processWithNer, applyScanResult]
  )

  // Handler: continuar desde revisión OCR → ejecutar NER
  const handleOcrReviewContinue = useCallback(async () => {
    if (!ticketId || !ocrRawText) {
      setStep('review')
      return
    }

    setStep('scanning')
    setScanProgress({
      phase: 'parsing',
      message: 'Procesando con IA (NER)…',
    })

    try {
      const result = await processWithNer(
        ocrRawText,
        ocrPreprocessedImage,
        capturedImage || '',
        (p) => setScanProgress(p)
      )

      setScanEngineUsed('tesseract-ner')
      applyScanResult(result, ticketId, capturedImage || '')
    } catch (err) {
      console.error('[ocr-review] Error procesando NER:', err)
      setScanError(err instanceof Error ? err.message : 'Error procesando NER')
      setScanProgress(null)
      setStep('review')
    }
  }, [ticketId, ocrRawText, ocrPreprocessedImage, capturedImage, applyScanResult, processWithNer])

  const handleSkipCapture = () => {
    // Crear ticket vacío sin imagen
    const newTicket = addTicket({
      title: 'Ticket manual',
      items: [],
      status: 'draft',
    })
    setTicketId(newTicket.id)
    setTitleInput('Ticket manual')
    setStep('review')
  }

  const handleRetryScan = () => {
    setTicketId(null)
    setCapturedImage(undefined)
    setScanError(null)
    setScanSucceeded(false)
    setStep('capture')
  }

  // ----- Navegación entre pasos -----
  const goNext = () => {
    const i = STEP_ORDER.indexOf(step)
    if (i < STEP_ORDER.length - 1) {
      setStep(STEP_ORDER[i + 1])
    }
  }

  const goBack = () => {
    const i = STEP_ORDER.indexOf(step)
    if (i > 0) {
      setStep(STEP_ORDER[i - 1])
    } else {
      // Cancelar
      if (ticketId) {
        // Si el ticket está vacío y en draft, lo borramos
        const t = tickets.find((x) => x.id === ticketId)
        if (t && t.items.length === 0 && t.participantIds.length === 0) {
          // Borrarlo
          useAppStore.getState().deleteTicket(ticketId)
        }
      }
      setView('home')
    }
  }

  // ----- Validaciones por paso -----
  const canProceed = (): boolean => {
    if (!ticket) return false
    switch (step) {
      case 'review':
        return ticket.items.length > 0
      case 'participants':
        return ticket.participantIds.length > 0
      case 'assign':
        // Todos los items deben tener al menos una asignación
        return ticket.items.every((it) => it.assignments.length > 0)
      default:
        return true
    }
  }

  const handleTitleChange = (val: string) => {
    setTitleInput(val)
    if (ticketId) updateTicket(ticketId, { title: val })
  }

  // ----- Render por paso -----
  if (step === 'capture') {
    // Etiqueta del motor seleccionado
    const engineLabel =
      settings.preferredEngine === 'server' ? 'IA en la nube' :
      settings.preferredEngine === 'tesseract' ? 'Escaneo básico' :
      settings.preferredEngine === 'tesseract-ner' ? 'Escaneo con IA' :
      settings.preferredEngine === 'florence2' ? 'Escaneo avanzado' :
      null
    const hasEngine = engineLabel !== null

    return (
      <div className="min-h-screen">
        <CameraCapture
          onCapture={handleCapture}
          onCancel={() => setView('home')}
        />
        <div className="px-4 pb-4 space-y-2">
          {/* Badge con motor activo o warning */}
          {hasEngine ? (
            <div className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full bg-accent text-xs text-accent-foreground font-medium">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Motor: {engineLabel}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full bg-warning-bg border border-warning-border text-xs text-warning-foreground font-medium">
              <span className="h-2 w-2 rounded-full bg-warning" />
              Sin motor seleccionado · Ve a Ajustes → Configuración
            </div>
          )}
          <Button
            variant="ghost"
            onClick={handleSkipCapture}
            className="w-full text-muted-foreground"
          >
            O crear ticket manualmente sin foto
          </Button>
        </div>
      </div>
    )
  }

  if (step === 'scanning') {
    return <ScanningProgressOverlay imageUrl={capturedImage} progress={scanProgress} />
  }

  if (step === 'ocr-review') {
    return (
      <OcrReviewView
        rawText={ocrRawText}
        imageUrl={capturedImage}
        onChange={setOcrRawText}
        onContinue={handleOcrReviewContinue}
        onSkip={() => {
          // Skip NER, usar solo el parser sobre el texto OCR
          if (ticketId && ocrRawText) {
            import('@/lib/scan/receipt-parser').then(({ parseReceiptText }) => {
              const parsed = parseReceiptText(ocrRawText)
              const result: ScanResult = {
                ...parsed,
                engine: 'tesseract',
                preprocessedImageDataUrl: ocrPreprocessedImage,
                rawText: ocrRawText,
              }
              setScanEngineUsed('tesseract')
              applyScanResult(result, ticketId, capturedImage || '')
            })
          } else {
            setStep('review')
          }
        }}
        onBack={() => {
          setStep('capture')
        }}
      />
    )
  }

  if (!ticket) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="text-muted-foreground">Algo salió mal. Vuelve a empezar.</p>
        <Button onClick={handleRetryScan} className="mt-4">
          Reintentar
        </Button>
      </div>
    )
  }

  const meta = STEP_META[step]
  const Icon = meta.icon

  return (
    <div className="px-4 pt-4">
      <PageHeader
        title={meta.title}
        subtitle={meta.subtitle}
        back={goBack}
      />

      {/* Stepper visual */}
      {step !== 'capture' && step !== 'scanning' && (
        <div className="flex items-center gap-1 mb-5">
          {STEP_ORDER.filter((s) => s !== 'capture').map((s, i) => {
            const realIndex = STEP_ORDER.indexOf(s)
            const isActive = realIndex === stepIndex
            const isDone = realIndex < stepIndex
            return (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    isActive
                      ? 'flex-1 bg-primary'
                      : isDone
                      ? 'flex-1 bg-primary'
                      : 'w-8 bg-muted-foreground/20'
                  )}
                  style={{
                    flex: isActive || isDone ? 1 : '0 0 32px',
                  }}
                />
                {i < STEP_ORDER.filter((s2) => s2 !== 'capture').length - 1 && (
                  <div className="w-1" />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Banner de éxito de escaneo */}
      {step === 'review' && scanSucceeded && (
        <div className="mb-4">
          <ScanSuccessBanner itemCount={ticket.items.length} />
        </div>
      )}

      {/* Banner de error de escaneo */}
      {step === 'review' && scanError && (
        <div className="mb-4">
          <ScanErrorBanner message={scanError} onRetry={handleRetryScan} />
        </div>
      )}

      {/* Imagen del ticket (preview colapsable) */}
      {ticket.image && (step === 'review' || step === 'participants' || step === 'assign') && (
        <details className="mb-4">
          <summary className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer">
            <Camera className="h-3.5 w-3.5" />
            Ver imagen del ticket
          </summary>
          <div className="mt-2 rounded-xl overflow-hidden border border-border">
            <img
              src={ticket.image}
              alt="Ticket"
              className="w-full max-h-64 object-contain bg-black/5"
            />
          </div>
        </details>
      )}

      {/* Step: Review */}
      {step === 'review' && (
        <div className="space-y-4">
          <Card className="p-3">
            <Input
              value={titleInput}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Título del ticket (ej. Cena cumpleaños)"
              className="border-0 px-0 focus-visible:ring-0 font-medium"
            />
          </Card>
          <TicketItemsEditor ticket={ticket} />
        </div>
      )}

      {/* Step: Participants */}
      {step === 'participants' && (
        <ParticipantPicker
          selectedIds={ticket.participantIds}
          onToggle={(id) => {
            const exists = ticket.participantIds.includes(id)
            updateTicket(ticket.id, {
              participantIds: exists
                ? ticket.participantIds.filter((p) => p !== id)
                : [...ticket.participantIds, id],
            })
          }}
          onAdd={(ids) => {
            const merged = Array.from(
              new Set([...ticket.participantIds, ...ids])
            )
            updateTicket(ticket.id, { participantIds: merged })
          }}
        />
      )}

      {/* Step: Assign */}
      {step === 'assign' && <AssignmentEditor ticket={ticket} />}

      {/* Step: Summary */}
      {step === 'summary' && (
        <TicketSummary
          ticket={ticket}
          onEdit={() => setStep('assign')}
          onClose={() => {
            toast.success('Ticket cerrado correctamente')
            setView('home')
          }}
        />
      )}

      {/* Botones de navegación inferiores */}
      {step !== 'summary' && (
        <div className="sticky bottom-20 left-0 right-0 mt-6 -mx-4 px-4 pt-3 pb-1 bg-gradient-to-t from-background via-background to-transparent">
          <Button
            onClick={goNext}
            disabled={!canProceed()}
            className="w-full"
            size="lg"
          >
            {step === 'assign' ? (
              <>
                Ver resumen
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            ) : (
              <>
                Continuar
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
          {!canProceed() && step === 'review' && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Añade al menos un item para continuar
            </p>
          )}
          {!canProceed() && step === 'participants' && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Selecciona al menos una persona
            </p>
          )}
          {!canProceed() && step === 'assign' && (
            <p className="text-xs text-warning-foreground text-center mt-2">
              Asigna todos los items antes de continuar
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ---------- Overlay de progreso de escaneo con fases detalladas ----------

function ScanningProgressOverlay({
  imageUrl,
  progress,
}: {
  imageUrl?: string
  progress: ScanProgress | null
}) {
  const phase = progress?.phase ?? 'preprocessing'
  const message = progress?.message ?? 'Procesando…'
  const percent = progress?.percent
  const download = progress?.download

  const phases: { key: ScanProgress['phase']; label: string; icon: typeof Camera }[] = [
    { key: 'preprocessing', label: 'Mejorar imagen', icon: ImageIcon },
    { key: 'loading-model', label: 'Cargar motor IA', icon: Cpu },
    { key: 'running-inference', label: 'Leer ticket', icon: Wand2 },
    { key: 'parsing', label: 'Estructurar datos', icon: ListChecks },
  ]
  const currentPhaseIdx = phases.findIndex((p) => p.key === phase)

  // Si la fase es loading-model y hay info de descarga, mostrar UX refinada
  const isDownloadingModel = phase === 'loading-model' && download && download.totalBytes > 0

  return (
    <div className="flex flex-col items-center justify-center px-6 py-8 text-center min-h-[80vh]">
      {imageUrl && (
        <div className="relative w-40 h-40 mb-6 rounded-2xl overflow-hidden border-2 border-primary/30">
          <img
            src={imageUrl}
            alt="Ticket escaneado"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-primary/10 animate-pulse" />
          <div
            className="absolute inset-x-0 h-0.5 bg-primary shadow-[0_0_8px_2px_var(--primary)]"
            style={{
              animation: 'scanline 1.6s ease-in-out infinite',
            }}
          />
        </div>
      )}

      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Sparkles className="h-6 w-6 text-primary animate-pulse" />
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-1">
        Escaneando ticket…
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-5">{message}</p>

      {/* Barra de progreso con info detallada si hay descarga */}
      {isDownloadingModel && (
        <div className="w-full max-w-xs mb-5">
          <Progress value={percent ?? 0} className="h-2" />
          <div className="flex items-center justify-between mt-1.5 text-xs">
            <span className="font-semibold text-foreground tabular-nums">
              {percent ?? 0}%
            </span>
            <span className="text-muted-foreground tabular-nums">
              {download!.sizeLabel}
            </span>
          </div>
          <div className="flex items-center justify-between mt-0.5 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="font-medium text-foreground tabular-nums">
                {download!.speedLabel}
              </span>
              ·
              <span className="tabular-nums">
                {download!.etaLabel ?? 'calculando…'}
              </span>
            </span>
            <span className="tabular-nums">
              {download!.filesCompleted}/{download!.filesTotal} archivos
            </span>
          </div>
        </div>
      )}

      {/* Barra de progreso simple si hay porcentaje pero no es descarga */}
      {!isDownloadingModel && percent !== undefined && (
        <div className="w-full max-w-xs mb-5">
          <Progress value={percent} className="h-2" />
          <p className="text-xs text-muted-foreground text-right mt-1">{percent}%</p>
        </div>
      )}

      {/* Fases */}
      <div className="w-full max-w-xs space-y-1.5">
        {phases.map((p, i) => {
          const Icon = p.icon
          const isDone = i < currentPhaseIdx
          const isActive = i === currentPhaseIdx
          return (
            <div
              key={p.key}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : isDone
                  ? 'text-muted-foreground'
                  : 'text-muted-foreground/40'
              )}
            >
              <div
                className={cn(
                  'h-6 w-6 rounded-full flex items-center justify-center shrink-0',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : isDone
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted'
                )}
              >
                {isDone ? (
                  <Check className="h-3.5 w-3.5" />
                ) : isActive ? (
                  <Icon className="h-3.5 w-3.5 animate-pulse" />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
              </div>
              <span className={cn('font-medium', isActive && 'text-foreground')}>
                {p.label}
              </span>
            </div>
          )
        })}
      </div>

      <style jsx>{`
        @keyframes scanline {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
      `}</style>
    </div>
  )
}

/**
 * Vista de revisión del texto OCR antes de pasarlo al modelo NER.
 * Permite al usuario ver y corregir el texto extraído por Tesseract.
 */
function OcrReviewView({
  rawText,
  imageUrl,
  onChange,
  onContinue,
  onSkip,
  onBack,
}: {
  rawText: string
  imageUrl?: string
  onChange: (text: string) => void
  onContinue: () => void
  onSkip: () => void
  onBack: () => void
}) {
  return (
    <div className="px-4 pt-4">
      <PageHeader
        title="Revisar texto OCR"
        subtitle="Corrige el texto antes de procesarlo con IA"
        back={onBack}
      />

      {/* Imagen del ticket colapsable */}
      {imageUrl && (
        <details className="mb-4">
          <summary className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer">
            <Camera className="h-3.5 w-3.5" />
            Ver imagen del ticket
          </summary>
          <div className="mt-2 rounded-xl overflow-hidden border border-border">
            <img
              src={imageUrl}
              alt="Ticket"
              className="w-full max-h-48 object-contain bg-black/5"
            />
          </div>
        </details>
      )}

      {/* Información */}
      <div className="mb-3 p-3 rounded-lg bg-accent/40 border border-border">
        <p className="text-xs text-muted-foreground">
          Este es el texto que el OCR ha extraído del ticket. Revísalo y
          corrige errores antes de que la IA (NER) lo procese. Si el texto es
          ilegible, puedes reescribirlo manualmente.
        </p>
      </div>

      {/* Textarea editable */}
      <textarea
        value={rawText}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-[40vh] p-3 rounded-xl border border-border bg-card text-sm font-mono text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
        placeholder="El texto del ticket aparecerá aquí…"
        spellCheck={false}
      />

      {/* Stats */}
      <div className="flex items-center justify-between mt-2 mb-4 text-xs text-muted-foreground">
        <span>{rawText.split(/\r?\n/).filter((l) => l.trim()).length} líneas</span>
        <span>{rawText.length} caracteres</span>
      </div>

      {/* Botones */}
      <div className="space-y-2">
        <Button onClick={onContinue} className="w-full" size="lg" disabled={!rawText.trim()}>
          <Wand2 className="h-5 w-5 mr-2" />
          Procesar con IA (NER)
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onSkip} className="flex-1">
            <Edit3 className="h-4 w-4 mr-2" />
            Sin NER (solo parser)
          </Button>
          <Button variant="ghost" onClick={onBack} className="flex-1 text-muted-foreground">
            Volver a capturar
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * Convierte una fecha a ISO de forma segura.
 * Devuelve null si la fecha es inválida (evita "Invalid time value").
 */
function safeDateToISO(dateStr?: string): string | null {
  if (!dateStr) return null
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return null
    return d.toISOString()
  } catch {
    return null
  }
}