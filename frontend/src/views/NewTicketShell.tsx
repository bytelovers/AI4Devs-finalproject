'use client'

import { Outlet } from 'react-router-dom'

/**
 * Wrapper for the nested ticket creation routes.
 * The AppShell layout is provided by the parent route (/) already.
 * This just acts as a simple Outlet for the ticket creation step views.
 */
export function NewTicketShell() {
  return <Outlet />
}