import { useAppStore } from '@/lib/store'
import type { ViewName } from '@/lib/types'
import { Home, Plus, Users, Folder, Settings } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar'
import { NavigationBar } from '@/components/layout/NavigationBar'

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
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col bg-background max-w-md mx-auto relative">
        <main className="flex-1 w-full overflow-x-hidden pb-24 safe-top">
          {children}
        </main>
        <NavigationBar />
      </div>
    )
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar variant="sidebar" collapsible="icon">
          <SidebarHeader className="px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                S
              </div>
              <span className="font-semibold text-base truncate">SplitEat</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {NAV_ITEMS.map((item) => {
                    const Icon = item.icon
                    const isActive = currentView === item.view
                    return (
                      <SidebarMenuItem key={item.view}>
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={() => setView(item.view)}
                          tooltip={item.label}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="px-4 py-3">
            <p className="text-xs text-muted-foreground">SplitEat v0.1</p>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="flex items-center gap-2 border-b border-border px-4 h-12">
            <SidebarTrigger />
            <span className="text-sm font-medium text-muted-foreground">
              {NAV_ITEMS.find((i) => i.view === currentView)?.label ?? ''}
            </span>
          </header>
          <main className="flex-1 w-full overflow-x-auto safe-top">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
