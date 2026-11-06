// Reemplaza al service worker de notificaciones del sitio viejo, que usaba el mismo scope que sw.js.
// El push vuelve en una etapa posterior. Ver el comentario de sw.js.
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
