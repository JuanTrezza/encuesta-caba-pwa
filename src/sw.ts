/// <reference lib="webworker" />
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute, type PrecacheEntry } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: (PrecacheEntry | string)[] }

// Caché del service worker del sitio anterior (cache-first y sin limpieza)
const CACHE_ANTERIOR = 'caba-encuesta-cache'

async function cachesAnteriores(): Promise<string[]> {
  return (await caches.keys()).filter((nombre) => nombre.startsWith(CACHE_ANTERIOR))
}

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')))

// Una actualización normal espera a que la persona toque "Actualizar". La excepción es quien todavía
// tiene el service worker anterior: ese sirve el sitio viejo desde su caché para siempre, así que
// este toma el control enseguida, borra esa caché y recarga las pestañas.
self.addEventListener('install', (evento) => {
  evento.waitUntil(
    (async () => {
      // Sin await: skipWaiting recién se resuelve al activarse, y la activación espera a que termine la instalación
      if ((await cachesAnteriores()).length > 0) void self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    (async () => {
      const anteriores = await cachesAnteriores()
      if (anteriores.length === 0) return
      await Promise.all(anteriores.map((nombre) => caches.delete(nombre)))
      await self.clients.claim()
      const pestanas = await self.clients.matchAll({ type: 'window' })
      // Sin await: la recarga la atiende este mismo service worker, que no responde hasta terminar de activarse
      pestanas.forEach((pestana) => void pestana.navigate(pestana.url).catch(() => undefined))
    })(),
  )
})

self.addEventListener('message', (evento) => {
  if ((evento.data as { type?: string } | null)?.type === 'SKIP_WAITING') void self.skipWaiting()
})
