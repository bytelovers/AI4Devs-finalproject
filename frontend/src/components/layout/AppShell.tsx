'use client'

import { cn } from '@/lib/utils'
import { useLocation, NavLink, Outlet } from 'react-router-dom'
import { Home, Plus, Users, Folder, Settings } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const NAV_ITEMS = [
  { path: '/', label: 'Inicio', icon: Home },
  { path: '/contacts', label: 'Contactos', icon: Users },
  { path: '/groups', label: 'Grupos', icon: Folder },
  { path: '/tickets/new', label: 'Nuevo', icon: Plus },
  { path: '/settings', label: 'Ajustes', icon: Settings },
] as const

export function AppShell() {
  const location = useLocation()

  // Key for Framer Motion transitions based on pathname
  const motionKey = location.pathname

  return (
    <div className="min-h-screen flex flex-col bg-background max-w-md mx-auto relative">
      <main className="flex-1 w-full overflow-x-hidden pb-24 safe-top">
        <AnimatePresence mode="wait">
          <motion.div
            key={motionKey}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="min-h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom navigation with NavLink */}
      <nav
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md border-t border-border bg-background/95 backdrop-blur-md z-40 safe-bottom"
        aria-label="Navegación principal"
      >
        <div className="grid grid-cols-5 h-16">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-0.5 transition-colors',
                  item.path === '/tickets/new'
                    ? 'bg-primary text-primary-foreground'
                    : isActive
                    ? 'text-primary'
                    : 'text-muted-foreground active:bg-accent/40'
                )
              }
              aria-label={item.label}
              aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
            >
              {item.path === '/tickets/new' ? (
                <div className="h-11 w-11 rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
                  <item.icon className="h-6 w-6" strokeWidth={2.5} />
                </div>
              ) : (
                <>
                  <item.icon
                    className={cn(
                      'h-5 w-5 transition-colors',
                      ({ isActive }) => (isActive ? 'text-primary' : 'text-muted-foreground')
                    )}
                    strokeWidth={({ isActive }) => (isActive ? 2.5 : 2)}
                  />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}