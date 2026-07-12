import { PageHeader } from '@/components/ui/EmptyState'
import { EmptyState } from '@/components/ui/EmptyState'
import { Users, Folder, Plus, FileText, Settings, FlaskConical, UserPlus } from 'lucide-react'

export function ContactsPlaceholder() {
  return (
    <div className="px-4 pt-6">
      <PageHeader title="Contactos" />
      <EmptyState
        icon={Users}
        title="Contactos"
        description="Gestiona tus contactos para dividir tickets. Proximamente."
      />
    </div>
  )
}

export function GroupsPlaceholder() {
  return (
    <div className="px-4 pt-6">
      <PageHeader title="Grupos" />
      <EmptyState
        icon={Folder}
        title="Grupos"
        description="Crea grupos para dividir tickets rapidamente. Proximamente."
      />
    </div>
  )
}

export function NewTicketPlaceholder() {
  return (
    <div className="px-4 pt-6">
      <PageHeader title="Nuevo ticket" />
      <EmptyState
        icon={Plus}
        title="Nuevo ticket"
        description="Escanea un ticket o crealo manualmente. Proximamente."
      />
    </div>
  )
}

export function TicketDetailPlaceholder() {
  return (
    <div className="px-4 pt-6">
      <PageHeader title="Detalle del ticket" back={() => {}} />
      <EmptyState
        icon={FileText}
        title="Detalle del ticket"
        description="Revisa y divide los items del ticket. Proximamente."
      />
    </div>
  )
}

export function SettingsPlaceholder() {
  return (
    <div className="px-4 pt-6">
      <PageHeader title="Ajustes" />
      <EmptyState
        icon={Settings}
        title="Ajustes"
        description="Configura tu experiencia en SplitEat. Proximamente."
      />
    </div>
  )
}

export function FeatureFlagsPlaceholder() {
  return (
    <div className="px-4 pt-6">
      <PageHeader title="Feature Flags" />
      <EmptyState
        icon={FlaskConical}
        title="Feature Flags"
        description="Funciones experimentales para desarrolladores. Proximamente."
      />
    </div>
  )
}

export function GroupDetailPlaceholder() {
  return (
    <div className="px-4 pt-6">
      <PageHeader title="Detalle del grupo" back={() => {}} />
      <EmptyState
        icon={UserPlus}
        title="Detalle del grupo"
        description="Gestiona los miembros de este grupo. Proximamente."
      />
    </div>
  )
}
