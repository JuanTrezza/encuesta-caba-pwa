import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { formatearErrores, validarFirebaseEnv } from './src/services/firebaseEnv.mjs'

// Firebase y React en chunks propios: cambian poco, así el navegador los reusa de caché entre deploys.
function manualChunks(id: string): string | undefined {
  if (!id.includes('node_modules')) return undefined
  if (/node_modules[\\/](@firebase[\\/]firestore|firebase[\\/]firestore)/.test(id)) return 'firestore'
  if (/node_modules[\\/](@firebase|firebase)[\\/]/.test(id)) return 'firebase'
  if (/node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) return 'react'
  return undefined
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
    base: '/encuesta-caba-pwa/',
    plugins: [react()],
    resolve: {
      // Con --mode e2e los servicios se reemplazan por mocks en memoria: el bundle de tests no incluye
      // Firebase. En un build normal esta sustitución no existe y los mocks quedan afuera.
      alias:
        mode === 'e2e'
          ? [{ find: /^.*\/services\/(auth|comentarios)$/, replacement: `${mocks}$1.ts` }]
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
