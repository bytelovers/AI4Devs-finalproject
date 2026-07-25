'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Registrar el SW solo en producción (no en dev para evitar conflictos con HMR)
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
          })
          console.log('[SW] Registrado:', registration.scope)

          // Manejar actualizaciones
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[SW] Nueva versión disponible, recargando...')
                  window.location.reload()
                }
              })
            }
          })
        } catch (error) {
          console.error('[SW] Error registrando:', error)
        }
      }

      // Pequeño delay para no bloquear el render inicial
      const timer = setTimeout(registerSW, 100)
      return () => clearTimeout(timer)
    }
  }, [])

  return null
}