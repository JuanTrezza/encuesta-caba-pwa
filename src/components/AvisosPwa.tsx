import { useEffect, useState } from 'react'
import { aplicarActualizacion, iniciarPwa } from '../services/pwa'

const CLAVE_DESCARTADO = 'vp:instalar-descartado'

/** El evento todavía no está en los tipos del DOM */
interface EventoInstalacion extends Event {
  prompt: () => Promise<unknown>
}

function fueDescartado(): boolean {
  try {
    return localStorage.getItem(CLAVE_DESCARTADO) === '1'
  } catch {
    return false
  }
}

/** Aviso de versión nueva y banner propio para instalar la app */
export function AvisosPwa() {
  const [hayActualizacion, setHayActualizacion] = useState(false)
  const [actualizando, setActualizando] = useState(false)
  const [instalacion, setInstalacion] = useState<EventoInstalacion | null>(null)

  useEffect(() => {
    iniciarPwa(() => setHayActualizacion(true))

    function alPoderInstalar(evento: Event) {
      // Evita el aviso del navegador: la instalación se ofrece con el banner propio
      evento.preventDefault()
      if (!fueDescartado()) setInstalacion(evento as EventoInstalacion)
    }
    const alInstalar = () => setInstalacion(null)

    window.addEventListener('beforeinstallprompt', alPoderInstalar)
    window.addEventListener('appinstalled', alInstalar)
    return () => {
      window.removeEventListener('beforeinstallprompt', alPoderInstalar)
      window.removeEventListener('appinstalled', alInstalar)
    }
  }, [])

  async function instalar() {
    const evento = instalacion
    setInstalacion(null)
    await evento?.prompt()
  }

  function descartar() {
    setInstalacion(null)
    try {
      localStorage.setItem(CLAVE_DESCARTADO, '1')
    } catch {
      // Sin almacenamiento: el banner puede volver a aparecer
    }
  }

  async function actualizar() {
    setActualizando(true)
    await aplicarActualizacion()
  }

  // Fijos abajo: aparecen después de la carga y no tienen que empujar el contenido
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 shadow-[0_-4px_12px_rgba(43,38,34,0.25)]">
      <div role="status" aria-live="polite">
        {hayActualizacion && (
          <div className="border-t-2 border-verde bg-papel">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2">
              <p className="font-bold">Nueva versión disponible.</p>
              <button type="button" onClick={actualizar} aria-disabled={actualizando} className="boton-primario">
                {actualizando ? 'Actualizando…' : 'Actualizar'}
              </button>
            </div>
          </div>
        )}
      </div>

      {instalacion && (
        <section aria-label="Instalar la app" className="border-t-2 border-tinta bg-papel">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2">
            <p>
              <span className="font-bold">Instalá Voz Porteña.</span> Se abre como una app y funciona sin conexión.
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={instalar} className="boton-primario">
                Instalar app
              </button>
              <button type="button" onClick={descartar} className="boton-borde">
                Ahora no
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
