const CACHE_NAME = "caba-encuesta-cache-v3";

const FILES_TO_CACHE = [
  "/",
  "/encuestas.html",
  "/style.css",
  "/app.js",
  "/db.js",
  "/componentes/rating.js",
  "/componentes/listaComentarios.js",
  "/manifest.json",
  "/sw.js",
  "/assets/icon.png",
  "/assets/logo.jpg",
  "/assets/categorias/limpieza.jpg",
  "/assets/categorias/transporte.jpg",
  "/assets/categorias/verdes.jpg",
  "/assets/categorias/eventos.jpg",
  "/assets/categorias/subte.jpg",
  "/assets/categorias/seguridad.jpg",
  "/assets/categorias/accesibilidad.jpg"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        return response;
      }
      // Si no está en cache, intenta fetch y maneja errores de red.
      return fetch(event.request).catch(err => {
        // Opcional: podés retornar una respuesta personalizada si querés.
        // Por ejemplo, una página offline:
        // return caches.match('/offline.html');
        // O simplemente:
        return new Response("Recurso no disponible.", {
          status: 404,
          statusText: "Not Found"
        });
      });
    })
  );
});

