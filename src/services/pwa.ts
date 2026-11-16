import { registerSW } from 'virtual:pwa-register'

const ESPERA_MS = 3000

let iniciada = false
let actualizar: ((recargar?: boolean) => Promise<void>) | undefined

/** Registra el service worker. Avisa cuando hay una versión nueva esperando. */
export function iniciarPwa(alHaberActualizacion: () => void): void {
  if (iniciada) return
  iniciada = true
  // Al instalarse, el service worker descarga todo el sitio. Se registra un rato después de la carga,
  // para que esa descarga no compita con la primera pantalla.
  const registrar = () => {
    actualizar = registerSW({ immediate: true, onNeedRefresh: alHaberActualizacion })
  }
  const programar = () => setTimeout(registrar, ESPERA_MS)
  if (document.readyState === 'complete') programar()
  else window.addEventListener('load', programar, { once: true })
}

/** Activa la versión nueva y recarga la página */
export function aplicarActualizacion(): Promise<void> {
  return actualizar ? actualizar(true) : Promise.resolve()
}
