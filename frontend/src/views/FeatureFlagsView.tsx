import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/lib/store'
import { PageHeader } from '@/components/ui/EmptyState'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { ScanEngineSelector } from '@/components/scan/ScanEngineSelector'
import {
  Eye,
  Terminal,
  Brain,
  Flag,
  Info,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'

export function FeatureFlagsView() {
  const featureFlags = useAppStore((s) => s.featureFlags)
  const updateFeatureFlags = useAppStore((s) => s.updateFeatureFlags)
  const navigate = useNavigate()

  const flags = [
    {
      key: 'showOcrReview' as const,
      label: 'Pantalla de revisión OCR',
      description:
        'Muestra el texto extraído por el OCR antes de procesarlo con el modelo NER. Si se desactiva, el escaneo con NER va directamente del OCR al resultado sin paso intermedio.',
      icon: Eye,
      defaultValue: true,
    },
    {
      key: 'useMiniAgent' as const,
      label: 'Mini-agente para NER',
      description:
        'Usa el mini-agente heurístico para decidir qué modelo NER cargar (general vs receipt) según el tipo de ticket. Si se desactiva, siempre usa el modelo general.',
      icon: Brain,
      defaultValue: true,
    },
    {
      key: 'verboseLogs' as const,
      label: 'Logs detallados en consola',
      description:
        'Muestra información de debug en la consola del navegador (texto OCR, entidades NER, decisiones del mini-agente, etc.). Útil para diagnosticar problemas.',
      icon: Terminal,
      defaultValue: false,
    },
  ]

  return (
    <div className="px-4 pt-6 pb-4">
      <PageHeader
        title="Configuración avanzada"
        subtitle="Motor de escaneo y opciones de desarrollador"
        back={() => navigate('/settings')}
      />

      {/* === Sección: Motor de escaneo (modo técnico) === */}
      <div className="flex items-center gap-1.5 mb-2 px-1">
        <Zap className="h-3.5 w-3.5 text-primary" />
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Motor de escaneo (vista técnica)
        </h2>
      </div>

      <ScanEngineSelector technical detailed />

      {/* === Sección: Feature flags === */}
      <div className="flex items-center gap-1.5 mb-2 mt-6 px-1">
        <Flag className="h-3.5 w-3.5 text-muted-foreground" />
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Opciones experimentales
        </h2>
      </div>

      <Card className="p-4 mb-3 bg-amber-50/60 border-amber-200">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              Configuración experimental
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Estas opciones controlan funcionalidades en desarrollo. Los cambios
              se guardan automáticamente.
            </p>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        {flags.map((flag) => {
          const Icon = flag.icon
          const value = featureFlags[flag.key]
          return (
            <Card key={flag.key} className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-foreground text-sm">
                      {flag.label}
                    </h3>
                    <Switch
                      checked={value}
                      onCheckedChange={(checked) => {
                        updateFeatureFlags({ [flag.key]: checked })
                        toast.info(
                          `${flag.label}: ${checked ? 'Activado' : 'Desactivado'}`
                        )
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {flag.description}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                    Default: {flag.defaultValue ? 'Activado' : 'Desactivado'}
                  </p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Footer */}
      <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground/60">
        <Flag className="h-3.5 w-3.5" />
        <span>Cuadra v1.0</span>
      </div>
    </div>
  )
}
