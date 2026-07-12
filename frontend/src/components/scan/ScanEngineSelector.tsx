import { useAppStore } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Cpu,
  Sparkles,
  Cloud,
  CheckCircle2,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'

type EngineKey = 'tesseract' | 'tesseract-ner' | 'florence2' | 'server'

interface EngineOption {
  key: EngineKey
  userLabel: string
  techLabel: string
  userDescription: string
  techDescription: string
  precision: 'Baja' | 'Media' | 'Media-Alta' | 'Alta'
  weight: string
  requiresConnection: boolean
  icon: typeof Cpu
  iconColor: string
}

const ENGINE_OPTIONS: EngineOption[] = [
  {
    key: 'tesseract',
    userLabel: 'Escaneo básico',
    techLabel: 'OCR en dispositivo (Tesseract)',
    userDescription: 'Escaneo rápido sin descarga. Funciona en cualquier dispositivo.',
    techDescription: 'Tesseract · Precisión media · Sin WebGPU requerido · ~5MB',
    precision: 'Baja',
    weight: 'Sin descarga',
    requiresConnection: false,
    icon: Cpu,
    iconColor: 'text-muted-foreground',
  },
  {
    key: 'tesseract-ner',
    userLabel: 'Escaneo con IA',
    techLabel: 'OCR + IA (Tesseract + NER)',
    userDescription: 'Escaneo mejorado con inteligencia artificial. Detecta mejor los productos y nombres.',
    techDescription: 'Tesseract + BERT español · Precisión media-alta · ~110MB · Mini-agente incluido',
    precision: 'Media-Alta',
    weight: '~110MB',
    requiresConnection: false,
    icon: Sparkles,
    iconColor: 'text-primary',
  },
  {
    key: 'florence2',
    userLabel: 'Escaneo avanzado',
    techLabel: 'IA en dispositivo (Florence-2)',
    userDescription: 'Máxima precisión sin conexión. Requiere un dispositivo moderno con WebGPU.',
    techDescription: 'Florence-2 · Precisión alta · Requiere WebGPU · ~400MB',
    precision: 'Alta',
    weight: '~400MB',
    requiresConnection: false,
    icon: Cpu,
    iconColor: 'text-primary',
  },
  {
    key: 'server',
    userLabel: 'IA en la nube',
    techLabel: 'IA en el servidor (glm-4.5v)',
    userDescription: 'Máxima precisión usando inteligencia artificial en la nube. Requiere conexión a internet.',
    techDescription: 'glm-4.5v · Precisión alta · Requiere conexión · 0MB local',
    precision: 'Alta',
    weight: '0MB (en la nube)',
    requiresConnection: true,
    icon: Cloud,
    iconColor: 'text-blue-500',
  },
]

interface ScanEngineSelectorProps {
  technical?: boolean
  detailed?: boolean
}

export function ScanEngineSelector({ technical = false, detailed = false }: ScanEngineSelectorProps) {
  const preferredEngine = useAppStore((s) => s.settings.preferredEngine)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const updateOnline = () => setIsOnline(navigator.onLine)
    window.addEventListener('online', updateOnline)
    window.addEventListener('offline', updateOnline)
    return () => {
      window.removeEventListener('online', updateOnline)
      window.removeEventListener('offline', updateOnline)
    }
  }, [])

  const handleSelect = (engine: EngineOption) => {
    if (engine.requiresConnection && !isOnline) {
      toast.warning('Necesitas conexión a internet para usar este motor')
      return
    }
    updateSettings({ preferredEngine: engine.key })
    toast.info(`Motor seleccionado: ${technical ? engine.techLabel : engine.userLabel}`)
  }

  return (
    <div className="space-y-2">
      {ENGINE_OPTIONS.map((engine) => {
        const Icon = engine.icon
        const isSelected = preferredEngine === engine.key
        const isDisabled = engine.requiresConnection && !isOnline
        const hasWebGPU = typeof navigator !== 'undefined' && 'gpu' in navigator && !!navigator.gpu
        const isFlorenceUnavailable = engine.key === 'florence2' && !hasWebGPU

        return (
          <Card
            key={engine.key}
            className={cn(
              'p-3 transition-all',
              isSelected && !isDisabled
                ? 'border-2 border-primary bg-accent/30 ring-2 ring-primary/20'
                : 'border-border',
              isDisabled && 'opacity-50',
              isFlorenceUnavailable && 'opacity-60'
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                'h-9 w-9 rounded-lg flex items-center justify-center shrink-0',
                isSelected ? 'bg-primary/15' : 'bg-muted'
              )}>
                <Icon className={cn('h-4 w-4', isSelected ? 'text-primary' : engine.iconColor)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {technical ? engine.techLabel : engine.userLabel}
                  </p>
                  {isDisabled && (
                    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      <WifiOff className="h-3 w-3" />
                      Sin conexión
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {technical ? engine.techDescription : engine.userDescription}
                </p>
                {detailed && (
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground/70">
                      {engine.weight}
                    </span>
                    <span className="text-[10px] text-muted-foreground/70">·</span>
                    <span className={cn(
                      'text-[10px] font-medium',
                      engine.precision === 'Alta' ? 'text-primary' :
                      engine.precision === 'Media-Alta' ? 'text-primary/70' :
                      engine.precision === 'Media' ? 'text-amber-600' :
                      'text-muted-foreground'
                    )}>
                      Precisión {engine.precision}
                    </span>
                    {engine.requiresConnection && (
                      <>
                        <span className="text-[10px] text-muted-foreground/70">·</span>
                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground/70">
                          <Wifi className="h-3 w-3" />
                          Online
                        </span>
                      </>
                    )}
                    {isFlorenceUnavailable && (
                      <span className="text-[10px] text-amber-600">
                        Requiere WebGPU
                      </span>
                    )}
                  </div>
                )}
              </div>
              <Button
                size="sm"
                variant={isSelected ? 'default' : 'outline'}
                disabled={isDisabled || isFlorenceUnavailable}
                onClick={() => handleSelect(engine)}
              >
                {isSelected ? (
                  <><CheckCircle2 className="h-4 w-4 mr-1" />Seleccionado</>
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
