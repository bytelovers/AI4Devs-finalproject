/**
 * Service Worker para Cuadra — soporte offline-first.
 *
 * Estrategia:
 * 1. En instalación: precachear la página principal (NO skipWaiting: espera al usuario).
 * 2. En activate: limpiar cachés antiguas, notificar OFFLINE_READY y hacer backfill.
 *    clients.claim() SOLO se llama si el usuario solicitó la actualización (SKIP_WAITING).
 * 3. En fetch:
 *    - Navegación: cache-first (si no hay, network y cachear)
 *    - Recursos estáticos: stale-while-revalidate
 *    - Tesseract/HuggingFace: no interceptar (tienen su propio caché)
 *    - API/WS: no interceptar
 *
 * Clave: cacheamos TODAS las respuestas GET exitosas para que
 * en el siguiente refresco (incluso offline) todo esté disponible.
 */

const CACHE_NAME = 'cuadra-app-v3'

// Flag: indica que el SW fue activado por solicitud del usuario (no automático).
// Cuando es true, en activate hacemos clients.claim() para que las pestañas
// abiertas pasen al SW nuevo y disparen controllerchange (que recarga la app).
let userRequestedUpdate = false

// URLs a precachear en instalación
const PRECACHE_URLS = [
  '/',
  '/manifest.webmanifest',
  '/icon.svg',
  '/offline.html',
]

// Instalación: precachear recursos básicos.
// NO llamamos skipWaiting() aquí: el SW nuevo esperará a que el usuario
// acepte la actualización o cierre todas las pestañas. Solo así evitamos
// el bucle "updatefound → reload → register → updatefound → reload".
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[sw] Error precacheando:', err)
      })
    })
  )
})

// Activación: limpiar cachés antiguas y notificar que estamos listos offline.
// NO llamamos clients.claim() aquí: el SW nuevo solo toma el control de las
// pestañas que se recarguen después de que el usuario acepta la actualización.
// Eso evita interrumpir al usuario mid-flow.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) =>
            name !== CACHE_NAME &&
            !name.includes('transformer') &&
            !name.includes('onnx') &&
            !name.includes('huggingface') &&
            !name.includes('tesseract')
          )
          .map((name) => caches.delete(name))
      )
    }).then(() => {
      // Avisar a los clientes que el SW está listo para uso offline.
      // (No interrumpe la sesión: solo dispara el toast en UpdatePrompt si
      //  offlineReady está montado.)
      return self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    }).then((clients) => {
      for (const client of clients) {
        client.postMessage({ type: 'OFFLINE_READY' })
      }
      // Si el usuario solicitó la actualización, reclamar el control ahora.
      // Si no, este SW esperará a que se cierren todas las pestañas (o se
      // recarguen naturalmente) antes de tomar control.
      if (userRequestedUpdate) {
        return self.clients.claim()
      }
    }).then(() => {
      // BACKFILL: cachear los recursos de la página actual que se cargaron
      // ANTES de que el SW estuviera activo. Esto es CRÍTICO para que
      // el refresco en modo avión funcione.
      return caches.open(CACHE_NAME).then((cache) => {
        return self.clients.matchAll({ type: 'window' }).then((clients) => {
          const promises = []
          for (const client of clients) {
            // 1. Cachear el HTML de la página actual
            promises.push(
              fetch(client.url, { mode: 'same-origin' })
                .then((response) => {
                  if (response && response.status === 200) {
                    // Guardar el HTML
                    const htmlClone = response.clone()
                    cache.put(client.url, htmlClone)
                    // 2. Extraer recursos del HTML (scripts, css, fonts)
                    return response.text()
                  }
                  return null
                })
                .then((html) => {
                  if (!html) return
                  // Buscar todas las URLs de recursos en el HTML
                  const resourceUrls = new Set()
                  // Scripts: src="..."
                  const scriptMatches = html.matchAll(/<script[^>]+src="([^"]+)"/g)
                  for (const m of scriptMatches) resourceUrls.add(m[1])
                  // CSS: href="..."
                  const linkMatches = html.matchAll(/<link[^>]+href="([^"]+)"/g)
                  for (const m of linkMatches) {
                    if (m[0].includes('stylesheet') || m[0].includes('preload') || m[0].includes('icon')) {
                      resourceUrls.add(m[1])
                    }
                  }
                  // Cachear cada recurso
                  for (const url of resourceUrls) {
                    const fullUrl = url.startsWith('/') 
                      ? new URL(url, self.location.origin).href 
                      : url
                    if (fullUrl.startsWith(self.location.origin)) {
                      promises.push(
                        fetch(fullUrl, { mode: 'same-origin' })
                          .then((res) => {
                            if (res && res.status === 200) {
                              return cache.put(fullUrl, res)
                            }
                          })
                          .catch(() => {})
                      )
                    }
                  }
                })
                .catch(() => {})
            )
          }
          return Promise.all(promises)
        })
      })
    })
  )
})

// Fetch: interceptar todas las peticiones
self.addEventListener('fetch', (event) => {
  const { request } = event

  // Solo interceptar GET
  if (request.method !== 'GET') return

  // No interceptar requests de Tesseract (tiene su propio caché)
  if (request.url.includes('tessdata') || request.url.includes('projectnaptha')) {
    return
  }

  // No interceptar requests de modelos de HuggingFace/Transformers.js
  if (request.url.includes('huggingface.co') || request.url.includes('cdn-lfs')) {
    return
  }

  // No interceptar API
  if (request.url.includes('/api/')) {
    return
  }

  // No interceptar WebSocket
  if (request.url.startsWith('ws://') || request.url.startsWith('wss://')) {
    return
  }

  // Para todo lo demás: stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // Función para cachear una respuesta válida
      const cacheResponse = (response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone)
          })
        }
        return response
      }

      // Función para manejar el fallo de red
      const handleNetworkError = () => {
        // Para navegación: priorizar el shell SPA cacheado (offline-first).
        // El SPA en "/" maneja TODAS las rutas vía React Router, así que
        // offline.html solo se muestra si NUNCA se ha cargado la app.
        if (request.mode === 'navigate') {
          return caches.match('/').then((cachedShell) => {
            if (cachedShell) return cachedShell
            // Sin SPA cacheado: última opción, página offline temática
            return caches.match('/offline.html').then((offlinePage) => {
              if (offlinePage) return offlinePage
              // Emergencia: HTML inline
              return new Response(
                '<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:2rem"><h1>Sin conexión</h1><p>Esta página no está disponible offline. Conéctate a internet e inténtalo de nuevo.</p></body></html>',
                { headers: { 'Content-Type': 'text/html' } }
              )
            })
          })
        }
        // Para otros recursos, devolver undefined (dejar que el navegador maneje el error)
        return undefined
      }

      if (cachedResponse) {
        // Hay caché: devolverla inmediatamente.
        // NO hacer background fetch si estamos offline (evita reintentos del navegador)
        // que causan refreshes no deseados.
        if (navigator.onLine) {
          fetch(request)
            .then(cacheResponse)
            .catch(() => {})
        }
        return cachedResponse
      }

      // No hay caché: intentar red
      return fetch(request)
        .then(cacheResponse)
        .catch(handleNetworkError)
    })
  )
})

// Flag: indica que el SW fue activado por solicitud del usuario (no automático).
// Cuando es true, en activate hacemos clients.claim() para que las pestañas
// abiertas pasen al SW nuevo y disparen controllerchange (que recarga la app).

// Mensajes desde la página
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING' || event.data?.type === 'SKIP_WAITING') {
    userRequestedUpdate = true
    self.skipWaiting()
  }
})
