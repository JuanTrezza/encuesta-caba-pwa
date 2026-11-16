import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { formatearErrores, validarFirebaseEnv } from './src/services/firebaseEnv.mjs'

const BASE = '/encuesta-caba-pwa/'

// Firebase y React en chunks propios: cambian poco, así el navegador los reusa de caché entre deploys.
// Leaflet y Recharts quedan en los chunks de sus páginas, que se cargan recién al entrar.
function manualChunks(id: string): string | undefined {
  if (!id.includes('node_modules')) return undefined
  if (/node_modules[\\/](@firebase[\\/]firestore|firebase[\\/]firestore)/.test(id)) return 'firestore'
  if (/node_modules[\\/](@firebase|firebase)[\\/]/.test(id)) return 'firebase'
  if (/node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) return 'react'
  return undefined
}

/**
 * Las tipografías se sirven desde el sitio. Sin precarga, el navegador las descubre recién al leer el CSS
 * y el texto salta al cambiar de fuente. Se precargan solo las tres que usa la primera pantalla.
 */
function precargarFuentes(): Plugin {
  const criticas = /(rozha-one-latin-400|atkinson-hyperlegible-latin-(400|700))-normal-[\w-]+\.woff2$/
  return {
    name: 'precargar-fuentes',
    transformIndexHtml: {
      order: 'post',
      handler: (_html, contexto) =>
        Object.keys(contexto.bundle ?? {})
          .filter((archivo) => criticas.test(archivo))
          .map((archivo) => ({
            tag: 'link',
            attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href: BASE + archivo, crossorigin: '' },
            injectTo: 'head' as const,
          })),
    },
  }
}

const mocks = fileURLToPath(new URL('./tests/mocks/', import.meta.url)).replace(/\\/g, '/')

// GitHub Pages sirve el sitio en https://juantrezza.github.io/encuesta-caba-pwa/
export default defineConfig(({ command, mode }) => {
  // Un build real no puede salir con la config rota. El modo e2e no usa Firebase, y en dev
  // la app sigue navegable y muestra el error en pantalla.
  if (command === 'build' && mode !== 'e2e') {
    const errores = validarFirebaseEnv(loadEnv(mode, process.cwd(), 'VITE_FIREBASE_'))
    if (errores.length > 0) throw new Error(formatearErrores(errores))
  }

  return {
    base: BASE,
    plugins: [
      react(),
      precargarFuentes(),
      VitePWA({
        // Service worker propio (src/sw.ts): precache con Workbox más el relevo del service worker anterior
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        registerType: 'prompt',
        injectRegister: false,
        injectManifest: { globPatterns: ['**/*.{js,css,html,svg,png,woff2,geojson}'] },
        manifest: {
          name: 'Voz Porteña',
          short_name: 'Voz Porteña',
          description: 'Puntuá y comentá cómo funciona la vida cotidiana en los 48 barrios de Buenos Aires.',
          lang: 'es-AR',
          start_url: BASE,
          scope: BASE,
          display: 'standalone',
          theme_color: '#A92C1C',
          background_color: '#F8F1E4',
          icons: [
            { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
      }),
    ],
    resolve: {
      // Con --mode e2e los servicios que hablan con Firebase se reemplazan por mocks en memoria, y el
      // registro del service worker por uno controlable. En un build normal los mocks quedan afuera.
      alias:
        mode === 'e2e'
          ? [{ find: /^(?:.*\/services\/|\.\/)(auth|comentarios|pwa)$/, replacement: `${mocks}$1.ts` }]
          : [],
    },
    build: {
      rollupOptions: { output: { manualChunks } },
    },
    server: {
      // El sitio viejo vive en legacy/ y no forma parte de la app
      watch: { ignored: ['**/legacy/**'] },
    },
  }
})
