import { useAppStore } from '@/lib/store'
import { PageHeader } from '@/components/ui/EmptyState'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Mail,
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
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { formatEUR, calcTicketTotal } from '@/lib/calc'
import { ScanEngineSelector } from '@/components/scan/ScanEngineSelector'

export function SettingsView() {
  const profile = useAppStore((s) => s.profile)
  const settings = useAppStore((s) => s.settings)
  const updateProfile = useAppStore((s) => s.updateProfile)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const resetAll = useAppStore((s) => s.resetAll)
  const tickets = useAppStore((s) => s.tickets)
  const people = useAppStore((s) => s.people)
  const groups = useAppStore((s) => s.groups)
  const setView = useAppStore((s) => s.setView)
  const [nameInput, setNameInput] = useState(profile.name)
  const [emailInput, setEmailInput] = useState(profile.email ?? '')

  const handleSaveProfile = () => {
    updateProfile({
      name: nameInput.trim(),
      email: emailInput.trim() || undefined,
    })
    toast.success('Perfil guardado')
  }

  const handleReset = () => {
    resetAll()
    toast.success('Se han borrado todos los datos')
    setView('home')
  }

  const totalTickets = tickets.length
  const totalAmount = tickets.reduce((s, t) => s + calcTicketTotal(t), 0)

  return (
    <div className="px-4 pt-6 pb-4">
      <PageHeader title="Ajustes" subtitle="Tu perfil y preferencias" />

      {/* Stats */}
      <Card className="p-4 mb-5 bg-accent/30">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xl font-bold text-primary">{totalTickets}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">
              Tickets
            </p>
          </div>
          <div>
            <p className="text-xl font-bold text-primary">{people.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">
              Contactos
            </p>
          </div>
          <div>
            <p className="text-xl font-bold text-primary">{groups.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">
              Grupos
            </p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">Total dividido</p>
          <p className="text-lg font-bold text-foreground">
            {formatEUR(totalAmount)}
          </p>
        </div>
      </Card>

      {/* Perfil */}
      <SectionTitle icon={User} title="Perfil" />
      <Card className="p-4 mb-5 space-y-3">
        <div>
          <Label htmlFor="name">Nombre</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Tu nombre"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="email">Email (opcional)</Label>
          <div className="relative mt-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
              className="pl-9"
            />
          </div>
        </div>
        <Button onClick={handleSaveProfile} className="w-full">
          Guardar perfil
        </Button>
      </Card>

      {/* Cuenta (sincronización) */}
      <SectionTitle icon={ShieldCheck} title="Cuenta y sincronización" />
      <Card className="p-4 mb-5">
        {profile.hasAccount ? (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">
                Cuenta activa
              </p>
              <p className="text-xs text-muted-foreground">
                {profile.email}
              </p>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-start gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground mb-0.5">
                  Modo local
                </p>
                <p className="text-xs text-muted-foreground">
                  Tus datos se guardan solo en este dispositivo. Crea una cuenta
                  para sincronizar entre dispositivos y guardar historial en la
                  nube.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() =>
                toast.info('La sincronización en la nube estará disponible pronto')
              }
            >
              <ShieldCheck className="h-4 w-4 mr-2" />
              Crear cuenta (próximamente)
            </Button>
          </div>
        )}
      </Card>

      {/* Preferencias */}
      <SectionTitle icon={SettingsIcon} title="Preferencias" />
      <Card className="p-4 mb-5 space-y-4">
        <div>
          <Label>IVA por defecto</Label>
          <Select
            value={String(settings.defaultTaxRate)}
            onValueChange={(v) =>
              updateSettings({ defaultTaxRate: Number(v) })
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">0% (sin IVA)</SelectItem>
              <SelectItem value="0.04">4% (superreducido)</SelectItem>
              <SelectItem value="0.1">10% (reducido)</SelectItem>
              <SelectItem value="0.21">21% (general)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Se aplicará a los tickets nuevos por defecto.
          </p>
        </div>
        <div>
          <Label>Propina por defecto (%)</Label>
          <Input
            type="number"
            inputMode="numeric"
            min="0"
            max="100"
            value={settings.defaultTipPercentage}
            onChange={(e) =>
              updateSettings({
                defaultTipPercentage: parseInt(e.target.value) || 0,
              })
            }
            className="mt-1"
          />
        </div>
      </Card>

      {/* Motor de escaneo */}
      <SectionTitle icon={Zap} title="Motor de escaneo" />
      <p className="text-xs text-muted-foreground mb-3 px-1">
        Selecciona cómo quieres escanear los tickets. Ordenados de menor a mayor precisión.
      </p>
      <div className="mb-5">
        <ScanEngineSelector detailed />
      </div>

      {/* Datos */}
      <SectionTitle icon={Database} title="Datos" />
      <Card className="p-4 mb-5 space-y-3">
        <div className="flex items-center gap-3 text-sm">
          <Info className="h-4 w-4 text-muted-foreground shrink-0" />
          <p className="text-muted-foreground">
            Todos los datos se guardan localmente en tu navegador. Si borras la
            caché del navegador, perderás los tickets.
          </p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Borrar todos los datos
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                ¿Borrar todos los datos?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Se eliminarán todos tus tickets, contactos y grupos. Esta acción
                no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleReset}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Sí, borrar todo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>

      {/* Desarrollador */}
      <SectionTitle icon={Flag} title="Desarrollador" />
      <Card className="p-4 mb-5">
        <button
          onClick={() => setView('feature-flags')}
          className="w-full flex items-center gap-3 text-left hover:bg-accent/30 -m-1 p-1 rounded-lg transition-colors"
        >
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Flag className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              Feature Flags
            </p>
            <p className="text-xs text-muted-foreground">
              Configuración experimental y de desarrollador
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </Card>

      {/* Acerca de */}
      <Card className="p-4 bg-muted/30">
        <div className="flex items-center gap-2 mb-1">
          <Percent className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Cuadra v1.0</span>
        </div>
        <p className="text-xs text-muted-foreground">
          App para dividir tickets de restaurante entre contactos. Escanea con
          IA, asigna items a personas y verifica que todo cuadre al céntimo.
        </p>
      </Card>
    </div>
  )
}

function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: typeof User
  title: string
}) {
  return (
    <div className="flex items-center gap-1.5 mb-2 px-1">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {title}
      </h2>
    </div>
  )
}
