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
      return response || fetch(event.request);
    })
  );
});
