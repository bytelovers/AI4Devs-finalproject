import { PageHeader } from '@/components/ui/EmptyState'
import { EmptyState } from '@/components/ui/EmptyState'
import { Plus } from 'lucide-react'

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
