'use client'

import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useAppStore } from '@/lib/store'

/**
 * Wrapper for the nested ticket creation routes.
 * Creates a draft ticket on mount if one doesn't exist yet,
 * then renders the active step via <Outlet />.
 */
export function NewTicketShell() {
  const draftTicketId = useAppStore((s) => s.draftTicketId)
  const addTicket = useAppStore((s) => s.addTicket)
  const setDraftTicketId = useAppStore((s) => s.setDraftTicketId)

  // Create draft ticket if none exists
  useEffect(() => {
    if (!draftTicketId) {
      const draft = addTicket({ title: 'Nuevo ticket', items: [], status: 'draft' })
      setDraftTicketId(draft.id)
    }
  }, [draftTicketId, addTicket, setDraftTicketId])

  return <Outlet />
}