'use client'

import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import type { ViewName } from '@/lib/types'
import { Home, Plus, Users, Folder, Settings } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const NAV_ITEMS: {
  view: ViewName
  label: string
  icon: typeof Home
}[] = [
  { view: 'home', label: 'Inicio', icon: Home },
  { view: 'contacts', label: 'Contactos', icon: Users },
  { view: 'new-ticket', label: 'Nuevo', icon: Plus },
  { view: 'groups', label: 'Grupos', icon: Folder },
  { view: 'settings', label: 'Ajustes', icon: Settings },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const currentView = useAppStore((s) => s.currentView)
  const setView = useAppStore((s) => s.setView)
  const activeTicketId = useAppStore((s) => s.activeTicketId)
  const activeGroupId = useAppStore((s) => s.activeGroupId)

  const isDetail =
    currentView === 'ticket-detail' || currentView === 'group-detail'

  const motionKey = currentView + (activeTicketId ?? '') + (activeGroupId ?? '')

  return (
    <div className="min-h-screen flex flex-col bg-background max-w-md mx-auto relative">
      <main
        className={cn(
          'flex-1 w-full overflow-x-hidden pb-24 safe-top',
          isDetail ? '' : ''
        )}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={motionKey}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="min-h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom navigation */}
      <nav
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md border-t border-border bg-background/95 backdrop-blur-md z-40 safe-bottom"
        aria-label="Navegación principal"
      >
        <div className="grid grid-cols-5 h-16">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive =
              currentView === item.view ||
              (item.view === 'home' && isDetail)
            const isCenter = item.view === 'new-ticket'

            if (isCenter) {
              return (
                <button
                  key={item.view}
                  onClick={() => setView(item.view)}
                  className="flex flex-col items-center justify-center gap-0.5"
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div
                    className={cn(
                      'h-11 w-11 rounded-full flex items-center justify-center transition-all',
                      isActive
                        ? 'bg-primary text-primary-foreground scale-105 shadow-lg shadow-primary/30'
                        : 'bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:scale-105'
                    )}
                  >
                    <Icon className="h-6 w-6" strokeWidth={2.5} />
                  </div>
                </button>
              )
            }

            return (
              <button
                key={item.view}
                onClick={() => setView(item.view)}
                className="flex flex-col items-center justify-center gap-0.5 active:bg-accent/40 transition-colors"
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span
                  className={cn(
                    'text-[10px] font-medium transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}