'use client'

import { useAppStore } from '@/lib/store'
import { PageHeader } from '@/components/ui/EmptyState'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  User,
  Settings as SettingsIcon,
  Percent,
  Database,
  Trash2,
  Info,
  ShieldCheck,
  Sparkles,
  Flag,
  ChevronRight,
  Zap,
  Upload,
  Download,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { formatEUR, calcTicketTotal } from '@/lib/calc'
import { ScanEngineSelector } from '@/components/scan/ScanEngineSelector'

export function SettingsView() {
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const featureFlags = useAppStore((s) => s.featureFlags)
  const updateFeatureFlags = useAppStore((s) => s.updateFeatureFlags)
  const tickets = useAppStore((s) => s.tickets)
  const people = useAppStore((s) => s.people)
  const groups = useAppStore((s) => s.groups)
  const exportData = useAppStore((s) => s.exportData)
  const importData = useAppStore((s) => s.importData)
  const resetAll = useAppStore((s) => s.resetAll)

  const totalExpenses = tickets.reduce((sum, t) => sum + calcTicketTotal(t), 0)

  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')

  return (
    <div className="px-4 pt-6">
      <PageHeader title="Ajustes" subtitle="Configura la app a tu gusto" />

      {/* Motor de escaneo */}
      <Card className="p-4 space-y-4 mb-6">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold text-foreground">Motor de escaneo</h3>
            <p className="text-xs text-muted-foreground">
              Elige cómo se procesan los tickets
            </p>
          </div>
        </div>
        <ScanEngineSelector detailed />
      </Card>

      {/* Flags experimentales */}
      <Card className="p-4 space-y-4 mb-6">
        <div className="flex items-center gap-3">
          <Flag className="h-5 w-5 text-amber-500" />
          <div>
            <h3 className="font-semibold text-foreground">Funciones experimentales</h3>
            <p className="text-xs text-muted-foreground">
              Activa features en desarrollo
            </p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">Mini-agente</span>
            </div>
            <Switch
              checked={featureFlags.useMiniAgent}
              onCheckedChange={(v) => updateFeatureFlags({ useMiniAgent: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium">Revisión OCR</span>
            </div>
            <Switch
              checked={featureFlags.showOcrReview}
              onCheckedChange={(v) => updateFeatureFlags({ showOcrReview: v })}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            La revisión OCR permite corregir el texto antes de pasarlo al modelo NER
          </p>
        </div>
      </Card>

      {/* IVA y propina por defecto */}
      <Card className="p-4 space-y-4 mb-6">
        <div className="flex items-center gap-3">
          <Percent className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold text-foreground">Valores por defecto</h3>
            <p className="text-xs text-muted-foreground">
              Se aplican a tickets nuevos sin datos
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="defaultTax">IVA por defecto (%)</Label>
            <Input
              id="defaultTax"
              type="number"
              step="0.5"
              min="0"
              max="100"
              value={settings.defaultTaxRate * 100}
              onChange={(e) =>
                updateSettings({ defaultTaxRate: parseFloat(e.target.value) / 100 })
              }
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="defaultTip">Propina por defecto (%)</Label>
            <Input
              id="defaultTip"
              type="number"
              step="0.5"
              min="0"
              max="100"
              value={settings.defaultTipPercentage * 100}
              onChange={(e) =>
                updateSettings({ defaultTipPercentage: parseFloat(e.target.value) / 100 })
              }
              className="mt-1"
            />
          </div>
        </div>
      </Card>

      {/* Datos */}
      <Card className="p-4 space-y-4 mb-6">
        <div className="flex items-center gap-3">
          <Database className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold text-foreground">Datos y respaldo</h3>
            <p className="text-xs text-muted-foreground">
              {tickets.length} tickets · {people.length} contactos · {groups.length} grupos
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const blob = new Blob([JSON.stringify(exportData(), null, 2)], {
                type: 'application/json',
              })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `cuadra-backup-${new Date().toISOString().slice(0, 10)}.json`
              a.click()
              URL.revokeObjectURL(url)
              toast.success('Backup descargado')
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar backup (JSON)
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowImport(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Importar backup
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <Trash2 className="h-4 w-4 mr-2" />
                Borrar todos los datos
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar todo?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se borrarán todos los tickets, contactos, grupos y ajustes. No se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    resetAll()
                    toast.success('Todos los datos eliminados')
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Eliminar todo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {showImport && (
          <div className="mt-4 space-y-2">
            <Label htmlFor="importData">Pega el JSON del backup</Label>
            <textarea
              id="importData"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={6}
              className="w-full p-3 rounded-md border border-border bg-background text-foreground text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder='{"tickets":[],"people":[],"groups":[],"settings":{...}}'
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowImport(false)
                  setImportText('')
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  try {
                    importData(JSON.parse(importText))
                    toast.success('Datos importados correctamente')
                    setShowImport(false)
                    setImportText('')
                  } catch (e) {
                    toast.error('JSON inválido: ' + (e as Error).message)
                  }
                }}
              >
                Importar
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Estadísticas rápidas */}
      <Card className="p-4 space-y-3 mb-6">
        <h3 className="font-semibold text-foreground">Resumen</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Total gastado</p>
            <p className="font-bold text-foreground">{formatEUR(totalExpenses)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Tickets</p>
            <p className="font-bold text-foreground">{tickets.length}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Contactos</p>
            <p className="font-bold text-foreground">{people.length}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Grupos</p>
            <p className="font-bold text-foreground">{groups.length}</p>
          </div>
        </div>
      </Card>

      {/* Info app */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <Info className="h-5 w-5 text-muted-foreground" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Cuadra — Divide la cuenta sin dramas</p>
            <p>Datos guardados localmente en tu navegador (IndexedDB)</p>
            <p>No hay servidor, no hay tracking, no hay cuentas</p>
          </div>
        </div>
      </Card>
    </div>
  )
}