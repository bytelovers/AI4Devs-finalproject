'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { RefreshCw, Wifi } from 'lucide-react'

interface UpdatePromptProps {
  needRefresh: boolean
  offlineReady: boolean
}

/**
 * Muestra toasts cuando:
 * - needRefresh: hay una nueva versión del SW esperando; el usuario decide cuándo aplicar.
 * - offlineReady: la app ya está cacheada y funciona sin red.
 *
 * El SW hace skipWaiting() SOLO cuando recibe un mensaje 'SKIP_WAITING' del cliente.
 * Mientras tanto, el SW viejo sigue controlando y la app sigue funcionando normal.
 */
export function UpdatePrompt({ needRefresh, offlineReady }: UpdatePromptProps) {
  useEffect(() => {
    if (needRefresh) {
      toast('Nueva versión disponible', {
        description: 'Hay una actualización lista para instalar.',
        duration: Infinity,
        icon: <RefreshCw className="h-4 w-4" />,
        action: {
          label: 'Actualizar',
          onClick: () => {
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.getRegistration().then((registration) => {
                if (!registration) return
                // Si ya hay un SW esperando, le pedimos que active ya
                if (registration.waiting) {
                  registration.waiting.postMessage({ type: 'SKIP_WAITING' })
                }
                // Si está instalándose, esperamos al statechange (controllerchange recarga)
                registration.addEventListener('updatefound', () => {
                  const newWorker = registration.installing
                  newWorker?.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                      newWorker.postMessage({ type: 'SKIP_WAITING' })
                    }
                  })
                })
              })
            }
          },
        },
        cancel: {
          label: 'Más tarde',
          onClick: () => {
            // No hacer nada; el SW esperará hasta cerrar todas las pestañas
          },
        },
      })
    }
  }, [needRefresh])

  useEffect(() => {
    if (offlineReady) {
      toast('Listo para usar sin conexión', {
        description: 'Cuadra funcionará aunque pierdas la conexión.',
        duration: 5000,
        icon: <Wifi className="h-4 w-4" />,
      })
    }
  }, [offlineReady])

  return null
}
