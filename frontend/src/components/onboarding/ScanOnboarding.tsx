'use client'

import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Download,
  Wifi,
  Sparkles,
  Server,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Cpu,
  HardDrive,
  Zap,
  Clock,
  FileCheck,
  Gauge,
} from 'lucide-react'
import {
  getEngines,
} from '@/lib/scan/capabilities'
import type { EngineInfo } from '@/lib/scan/types'
import type { DownloadSummary } from '@/lib/scan/download-tracker'
import { formatBytes } from '@/lib/scan/download-tracker'

// El estado de "modelo descargado" lo determina getEngines(): verifica la cache
// real del dispositivo (pesos ONNX de Florence-2) y respeta el flag persistido.

interface ScanOnboardingProps {
  open: boolean
  onClose: () => void
  onUseServer?: () => void
  onUseTesseract?: () => void
  onUseTesseractNer?: () => void
}

type DownloadStage = 'idle' | 'downloading' | 'verifying' | 'done' | 'error'

/**
 * Pantalla de onboarding para explicar y gestionar la descarga del modelo
 * Florence-2 (~400MB) la primera vez que el usuario quiere escanear on-device.
 */
export function ScanOnboarding({ open, onClose, onUseServer, onUseTesseract, onUseTesseractNer }: ScanOnboardingProps) {
  const [engines, setEngines] = useState<EngineInfo[]>([])
  const [isCached, setIsCached] = useState(false)
  const [stage, setStage] = useState<DownloadStage>('idle')
  const [download, setDownload] = useState<DownloadSummary | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const startedRef = useRef(false)
  // Leer preferredEngine del store para highlight visual
  const preferredEngine = useAppStore((s) => s.settings.preferredEngine)

  useEffect(() => {
    if (open) {
      loadEngines()
      // Reset al abrir
      setStage('idle')
      setDownload(null)
      setErrorMessage('')
      startedRef.current = false
    }
  }, [open])

  const loadEngines = async () => {
    const e = await getEngines()
    setEngines(e)
    setIsCached(e.find((x) => x.name === 'florence2')?.status === 'available')
  }

  const handleDownload = async () => {
    if (stage === 'downloading' || stage === 'verifying') return
    setStage('downloading')
    setErrorMessage('')
    setDownload(null)

    try {
      const { prewarmFlorenceModel } = await import('@/lib/scan/florence-engine')

      // Nota: NO usar info.percent === 100 como señal de fin, porque
      // el porcentaje global puede llegar a 100% cuando un solo archivo
      // termina (si los demás aún no se han iniciado). Solo confiar en
      // la resolución de la promesa como señal de fin real.
      await prewarmFlorenceModel((info) => {
        if (info.phase === 'loading-model') {
          if (info.download) {
            setDownload(info.download)
          }
        }
      })

      // La promesa se resolvió: el modelo está descargado y cargado.
      setStage('verifying')
      // Activar Florence-2 para futuros escaneos sin necesidad de
      // volver a verificar caché.
      const { enableFlorenceEngine } = await import('@/lib/scan/orchestrator')
      enableFlorenceEngine()
      // Verificar la cache real (reseteando la detección memoizada de la sesión)
      // y persistir el estado de descarga para futuras sesiones.
      const { resetModelCacheDetection, refreshFlorenceDownloadState } = await import(
        '@/lib/scan/capabilities'
      )
      resetModelCacheDetection()
      await refreshFlorenceDownloadState()
      // Pequeña espera para que el "verificando" se vea
      await new Promise((r) => setTimeout(r, 800))
      setStage('done')
      setIsCached(true)
      await loadEngines()
      setTimeout(() => {
        onClose()
      }, 1200)
    } catch (err) {
      console.error('[onboarding] descarga falló:', err)
      setErrorMessage(
        err instanceof Error ? err.message : 'Error desconocido en la descarga'
      )
      setStage('error')
    }
  }

  const florenceEngine = engines.find((e) => e.name === 'florence2')
  const serverEngine = engines.find((e) => e.name === 'server')
  const tesseractEngine = engines.find((e) => e.name === 'tesseract')
  const tesseractNerEngine = engines.find((e) => e.name === 'tesseract-ner')

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Escaneo con IA en tu dispositivo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Estado: cacheado */}
          {isCached && stage !== 'downloading' && stage !== 'verifying' && (
            <Card className="p-4 border-primary/30 bg-accent/30">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">
                    Motor de IA listo
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    El modelo Florence-2 ya está descargado. Puedes escanear
                    tickets sin conexión.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Estado: descargando (UX refinada) */}
          {(stage === 'downloading' || stage === 'verifying') && download && (
            <DownloadProgressCard
              download={download}
              stage={stage}
            />
          )}

          {/* Estado: descargando pero sin info de progreso aún */}
          {(stage === 'downloading' || stage === 'verifying') && !download && (
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
                <p className="font-medium text-foreground">
                  Conectando con el servidor del modelo…
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Esto puede tardar unos segundos.
              </p>
            </Card>
          )}

          {/* Estado: error */}
          {stage === 'error' && (
            <Card className="p-4 border-destructive/30 bg-destructive/5">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-destructive shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-destructive">
                    No se pudo descargar el modelo
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5 mb-3">
                    {errorMessage}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handleDownload}>
                      Reintentar
                    </Button>
                    {serverEngine?.status === 'available' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          onClose()
                          onUseServer?.()
                        }}
                      >
                        Usar servidor
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Estado: completado */}
          {stage === 'done' && (
            <Card className="p-4 border-primary/30 bg-accent/30">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">
                    ¡Modelo descargado!
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Ya puedes escanear tickets sin conexión.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Mostrar info de motores solo si no está descargando */}
          {stage !== 'downloading' && stage !== 'verifying' && (
            <>
              {/* Tarjeta Florence-2 */}
              {florenceEngine && (
                <Card
                  className={
                    florenceEngine.status === 'unavailable'
                      ? 'p-4 opacity-50'
                      : preferredEngine === 'florence2'
                      ? 'p-4 border-2 border-primary bg-accent/30 ring-2 ring-primary/20'
                      : 'p-4 border-border'
                  }
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Cpu className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-semibold text-foreground">
                          IA en tu dispositivo
                        </p>
                        {florenceEngine.status !== 'unavailable' && (
                          <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                            RECOMENDADO
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Modelo Florence-2 · Precisión alta · 5-15s por ticket
                      </p>
                    </div>
                  </div>

                  {florenceEngine.status === 'unavailable' ? (
                    <div className="flex items-center gap-2 text-xs text-warning-foreground">
                      <AlertCircle className="h-4 w-4" />
                      <span>
                        Tu navegador no soporta WebGPU. Usa Chrome/Edge Android
                        o Safari 18+.
                      </span>
                    </div>
                  ) : florenceEngine.status === 'needs-download' ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <HardDrive className="h-3.5 w-3.5" />
                          ~400 MB
                        </span>
                        <span className="flex items-center gap-1">
                          <Wifi className="h-3.5 w-3.5" />
                          WiFi recomendado
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap className="h-3.5 w-3.5" />
                          Una sola vez
                        </span>
                      </div>
                      <Button
                        onClick={handleDownload}
                        className="w-full"
                        size="sm"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar modelo
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-primary font-medium">
                      <CheckCircle2 className="h-4 w-4" />
                      Listo para usar
                    </div>
                  )}
                </Card>
              )}

              {/* Tesseract + NER */}
              {tesseractNerEngine && tesseractNerEngine.status === 'available' && (
                <Card className={
                  preferredEngine === 'tesseract-ner'
                    ? 'p-3 border-2 border-primary bg-accent/30 ring-2 ring-primary/20'
                    : 'p-3 border-border'
                }>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        OCR + IA (NER)
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Tesseract + BERT español · Precisión media-alta
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={preferredEngine === 'tesseract-ner' ? 'default' : 'outline'}
                      onClick={() => {
                        onClose()
                        onUseTesseractNer?.()
                      }}
                    >
                      {preferredEngine === 'tesseract-ner' ? (
                        <><CheckCircle2 className="h-4 w-4 mr-1" />Seleccionado</>
                      ) : (
                        'Usar'
                      )}
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2 pl-11">
                    Descarga modelo BERT la primera vez (110MB). El mini-agente
                    elige entre modelo general y especializado según el ticket.
                  </p>
                </Card>
              )}

              {/* Tesseract fallback */}
              {tesseractEngine && tesseractEngine.status === 'available' && (
                <Card className={
                  preferredEngine === 'tesseract'
                    ? 'p-3 border-2 border-primary bg-accent/30 ring-2 ring-primary/20'
                    : 'p-3 border-border'
                }>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Cpu className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        OCR sin descarga
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Tesseract · Precisión media · Sin WebGPU requerido
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={preferredEngine === 'tesseract' ? 'default' : 'outline'}
                      onClick={() => {
                        onClose()
                        onUseTesseract?.()
                      }}
                    >
                      {preferredEngine === 'tesseract' ? (
                        <><CheckCircle2 className="h-4 w-4 mr-1" />Seleccionado</>
                      ) : (
                        'Usar'
                      )}
                    </Button>
                  </div>
                </Card>
              )}

              {/* Servidor */}
              {serverEngine && serverEngine.status === 'available' && (
                <Card className={
                  preferredEngine === 'server'
                    ? 'p-3 border-2 border-primary bg-accent/30 ring-2 ring-primary/20'
                    : 'p-3 border-border'
                }>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Server className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        IA en el servidor
                      </p>
                      <p className="text-xs text-muted-foreground">
                        glm-4.5v · Precisión alta · Requiere conexión
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={preferredEngine === 'server' ? 'default' : 'outline'}
                      onClick={() => {
                        onClose()
                        onUseServer?.()
                      }}
                    >
                      {preferredEngine === 'server' ? (
                        <><CheckCircle2 className="h-4 w-4 mr-1" />Seleccionado</>
                      ) : (
                        'Usar'
                      )}
                    </Button>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {isCached && stage !== 'downloading' ? 'Cerrar' : 'Más tarde'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Tarjeta de progreso de descarga con información detallada y veraz.
 */
function DownloadProgressCard({
  download,
  stage,
}: {
  download: DownloadSummary
  stage: DownloadStage
}) {
  const percent = download.percent ?? 0
  const isVerifying = stage === 'verifying'

  return (
    <Card className="p-4 space-y-3">
      {/* Cabecera */}
      <div className="flex items-center gap-2">
        {isVerifying ? (
          <CheckCircle2 className="h-5 w-5 text-primary" />
        ) : (
          <Loader2 className="h-5 w-5 text-primary animate-spin" />
        )}
        <p className="font-medium text-foreground">
          {isVerifying
            ? 'Verificando modelo…'
            : `Descargando ${download.filesCompleted + 1}/${download.filesTotal || '?'} · ${truncateFilename(download.currentFile ?? '')}`}
        </p>
      </div>

      {/* Barra de progreso */}
      <div>
        <Progress value={isVerifying ? 100 : percent} className="h-2" />
        <div className="flex items-center justify-between mt-1.5 text-xs">
          <span className="font-semibold text-foreground tabular-nums">
            {isVerifying ? '100%' : `${percent}%`}
          </span>
          <span className="text-muted-foreground tabular-nums">
            {download.sizeLabel}
          </span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground flex items-center gap-1">
            <Gauge className="h-3 w-3" />
            Velocidad
          </span>
          <span className="font-medium text-foreground tabular-nums">
            {isVerifying ? '—' : download.speedLabel}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Restante
          </span>
          <span className="font-medium text-foreground tabular-nums">
            {isVerifying ? '—' : download.etaLabel ?? 'Calculando…'}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground flex items-center gap-1">
            <FileCheck className="h-3 w-3" />
            Archivos
          </span>
          <span className="font-medium text-foreground tabular-nums">
            {download.filesCompleted}/{download.filesTotal || '?'}
          </span>
        </div>
      </div>

      {/* Lista de archivos (los últimos 4) */}
      {download.files.length > 0 && !isVerifying && (
        <div className="space-y-1 pt-2 border-t border-border">
          {download.files.slice(-4).map((f) => (
            <div
              key={f.name}
              className="flex items-center gap-2 text-xs"
            >
              {f.done ? (
                <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
              ) : (
                <Loader2 className="h-3 w-3 text-primary animate-spin shrink-0" />
              )}
              <span
                className={
                  f.done
                    ? 'text-muted-foreground truncate flex-1'
                    : 'text-foreground truncate flex-1 font-medium'
                }
              >
                {truncateFilename(f.name)}
              </span>
              <span className="text-muted-foreground tabular-nums shrink-0">
                {formatBytes(f.loaded)}
                {f.total > 0 && ` / ${formatBytes(f.total)}`}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Aviso de paciencia */}
      {!isVerifying && percent < 100 && (
        <p className="text-xs text-muted-foreground text-center pt-1">
          Esta descarga solo ocurre una vez. Después funcionará sin conexión.
        </p>
      )}
    </Card>
  )
}

function truncateFilename(name: string): string {
  if (!name) return 'archivo'
  const parts = name.split('/')
  const short = parts[parts.length - 1]
  if (short.length > 30) return short.substring(0, 27) + '…'
  return short
}