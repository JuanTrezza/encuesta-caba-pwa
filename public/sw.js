// El sitio viejo registraba este service worker con estrategia cache-first y sin limpieza: quien ya
// lo visitó seguiría viendo la versión anterior para siempre. Este reemplazo borra solo su caché
// (el origen juantrezza.github.io se comparte con otros proyectos), se da de baja y recarga las pestañas.
self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const nombres = await caches.keys()
      await Promise.all(nombres.filter((n) => n.startsWith('caba-encuesta-cache')).map((n) => caches.delete(n)))
      await self.registration.unregister()
      const pestanas = await self.clients.matchAll({ type: 'window' })
      pestanas.forEach((pestana) => pestana.navigate(pestana.url))
    })(),
  )
})
