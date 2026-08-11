'use client'

import { useEffect, useRef, useState } from 'react'
import { UpdatePrompt } from './UpdatePrompt'

export function ServiceWorkerRegister() {
  const [needRefresh, setNeedRefresh] = useState(false)
  const [offlineReady, setOfflineReady] = useState(false)
  const needRefreshRef = useRef(false)

  // Mantener ref sincronizada para que el listener de controllerchange
  // siempre lea el valor actual sin re-suscribirse.
  needRefreshRef.current = needRefresh

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        })
        console.log('[SW] Registrado:', registration.scope)

        // Helper: notificar al usuario que hay una actualización lista.
        // NO recargamos automáticamente: el nuevo SW esperará a que el
        // usuario acepte (SKIP_WAITING) o cierre todas las pestañas.
        const showUpdatePrompt = () => setNeedRefresh(true)

        if (registration.waiting) {
          // Ya hay un SW esperando en el primer load
          showUpdatePrompt()
        }

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (!newWorker) return
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showUpdatePrompt()
            }
          })
        })
      } catch (error) {
        console.error('[SW] Error registrando:', error)
      }
    }

    // controllerchange: recarga SOLO si el usuario aceptó la actualización
    // (no recarga si el SW se activó porque se cerraron todas las pestañas,
    //  que es el caso natural sin intervención del usuario).
    const onControllerChange = () => {
      if (needRefreshRef.current) window.location.reload()
    }

    // OFFLINE_READY: el SW avisa cuando terminó el precache inicial.
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OFFLINE_READY') {
        setOfflineReady(true)
      }
    }

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)
    navigator.serviceWorker.addEventListener('message', onMessage)

    const timer = setTimeout(registerSW, 100)

    return () => {
      clearTimeout(timer)
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
      navigator.serviceWorker.removeEventListener('message', onMessage)
    }
  }, [])

  return <UpdatePrompt needRefresh={needRefresh} offlineReady={offlineReady} />
}
