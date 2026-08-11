'use client'

import { useAppStore } from '@/lib/store'
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Server,
  Cpu,
  Sparkles,
  ShieldCheck,
  Flag,
  ChevronRight,
  Zap,
  Wifi,
  Download,
  CheckCircle2,
  AlertCircle,
  Gauge,
  HardDrive,
  Clock,
  FileCheck,
} from 'lucide-react'
import { getEngines } from '@/lib/scan/capabilities'
import type { EngineInfo } from '@/lib/scan/types'
import { toast } from 'sonner'

export function ScanEngineSelector({
  detailed = false,
  onDownloadModel,
}: { detailed?: boolean; onDownloadModel?: () => void }) {
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const featureFlags = useAppStore((s) => s.featureFlags)
  const updateFeatureFlags = useAppStore((s) => s.updateFeatureFlags)

  const [engines, setEngines] = useState<EngineInfo[]>([])
  const [isFlorenceCached, setIsFlorenceCached] = useState(false)

  useEffect(() => {
    loadEngines()
  }, [])

  const loadEngines = async () => {
    const e = await getEngines()
    setEngines(e)
    // isFlorenceEnabled se usa en orchestrator para determinar si Florence está habilitado
    const { isFlorenceEnabled } = await import('@/lib/scan/orchestrator')
    setIsFlorenceCached(isFlorenceEnabled())
  }

  const handleSelect = async (engine: EngineInfo) => {
    if (engine.status === 'unavailable') return
    // Florence-2 sin modelo descargado: si hay callback de descarga lo usamos,
    // si no, permitimos seleccionarlo igualmente (la descarga ocurre en el
    // primer escaneo porque ocr.worker activa Florence según preferredEngine).
    if (engine.name === 'florence2' && engine.status === 'needs-download' && onDownloadModel) {
      onDownloadModel()
      return
    }
    updateSettings({ preferredEngine: engine.name })
    if (engine.name === 'florence2' && engine.status === 'needs-download') {
      toast.info(
        'IA en dispositivo seleccionada. El modelo Florence-2 se descargará en el primer escaneo'
      )
    }
  }

  const isSelected = (engineName: string) => settings.preferredEngine === engineName
  // Operativa: solo se deshabilita cuando la plataforma no está soportada.
  // Para Florence-2 eso es NO tener WebGPU (status 'unavailable'). El modelo
  // sin descargar ('needs-download') NO deshabilita el botón.
  const isDisabled = (engine: EngineInfo) => engine.status === 'unavailable'

  const isFlorenceUnavailable = engines.some(
    (e) => e.name === 'florence2' && e.status === 'unavailable'
  )

  return (
    <div className="space-y-3">
      {engines.map((engine) => {
        const Icon =
          engine.name === 'server'
            ? Server
            : engine.name === 'florence2'
            ? Cpu
            : engine.name === 'tesseract-ner'
            ? Sparkles
            : Cpu

        const selected = isSelected(engine.name)
        const disabled = isDisabled(engine)

        return (
          <Card
            key={engine.name}
            className={
              selected
                ? 'p-3 border-2 border-primary bg-accent/30 ring-2 ring-primary/20'
                : disabled
                ? 'p-3 opacity-50'
                : 'p-3 border-border'
            }
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0">
                {isSelected ? (
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                ) : (
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-foreground">
                    {engine.name === 'server'
                      ? 'IA en el servidor'
                      : engine.name === 'florence2'
                      ? 'IA en tu dispositivo'
                      : engine.name === 'tesseract-ner'
                      ? 'OCR + IA (NER)'
                      : 'OCR sin descarga'}
                  </p>
                  {selected && (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  )}
                  {engine.name === 'florence2' && engine.status === 'available' && !isFlorenceUnavailable && (
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      RECOMENDADO
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  {engine.name === 'server'
                    ? 'glm-4.5v · Precisión alta · Requiere conexión'
                    : engine.name === 'florence2'
                    ? 'Modelo Florence-2 · Precisión alta · 5-15s por ticket'
                    : engine.name === 'tesseract-ner'
                    ? 'Tesseract + BERT español · Precisión media-alta'
                    : 'Tesseract · Precisión media · Sin WebGPU requerido'}
                </p>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground mt-1">
                  {engine.requiresConnection && (
                    <span className="flex items-center gap-1">
                      <Wifi className="h-3 w-3" />
                      Online
                    </span>
                  )}
                  {engine.requiresDownload && engine.name === 'florence2' && (
                    <>
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
                    </>
                  )}
                  {engine.requiresDownload && engine.name === 'tesseract-ner' && (
                    <span className="flex items-center gap-1">
                      <Download className="h-3.5 w-3.5" />
                      ~110 MB
                    </span>
                  )}
                  {isFlorenceUnavailable && (
                    <span className="text-warning-foreground">Requiere WebGPU</span>
                  )}
                </div>

                {detailed && (
                  <>
                    <div className="mt-2 text-[10px] text-muted-foreground/70">
                      {engine.precision && (
                        <span className={engine.precision === 'Alta' ? 'text-primary' : engine.precision === 'Media-Alta' ? 'text-primary/70' : engine.precision === 'Media' ? 'text-warning-foreground' : 'text-muted-foreground'}>
                          Precisión {engine.precision}
                        </span>
                      )}
                      {engine.requiresConnection && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-0.5">
                            <Wifi className="h-3 w-3" />
                            Online
                          </span>
                        </>
                      )}
                      {isFlorenceUnavailable && (
                        <span className="text-warning-foreground">Requiere WebGPU</span>
                      )}
                    </div>
                  </>
                )}
              </div>

              <Button
                size="sm"
                variant={selected ? 'default' : 'outline'}
                disabled={disabled}
                data-testid={`select-${engine.name}`}
                onClick={() => handleSelect(engine)}
              >
                {selected ? (
                  <><CheckCircle2 className="h-4 w-4 mr-1" />Seleccionado</>
                ) : disabled ? (
                  'No disponible'
                ) : engine.name === 'florence2' &&
                  engine.status === 'needs-download' &&
                  onDownloadModel ? (
                  'Descargar modelo'
                ) : (
                  'Seleccionar'
                )}
              </Button>
            </div>
          </Card>
        )
      })}
    </div>
  )
}