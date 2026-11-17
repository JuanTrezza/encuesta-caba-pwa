import { useEffect, useId, useRef, useState } from 'react'
import { borrarOpinion } from '../services/opiniones'

const FORMATO_FECHA = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })

/** Dice de cuál opinión se trata, para que "Borrar" no sea ambiguo con una lista de varias */
export function descripcionOpinion(fechaIso: string): string {
  return `del ${FORMATO_FECHA.format(new Date(fechaIso))}`
}

interface Props {
  id: string
  /** Texto para lectores de pantalla, de `descripcionOpinion` */
  descripcion: string
  /** La opinión ya se borró: quien llama la saca de la lista y se ocupa del foco */
  onBorrada: (id: string) => void
}

/**
 * Botón "Borrar" con confirmación en el mismo lugar. No usa window.confirm: bloquea la página y no se puede
 * dar estilo ni probar. Al pedir confirmación el foco va a "Cancelar", y Escape cancela.
 */
export function BorrarOpinion({ id, descripcion, onBorrada }: Props) {
  const [estado, setEstado] = useState<'inactivo' | 'confirmando' | 'borrando'>('inactivo')
  const [error, setError] = useState('')
  const boton = useRef<HTMLButtonElement>(null)
  const cancelar = useRef<HTMLButtonElement>(null)
  const idMensaje = useId()

  useEffect(() => {
    if (estado === 'confirmando') cancelar.current?.focus()
  }, [estado])

  function pedirConfirmacion() {
    setError('')
    setEstado('confirmando')
  }

  function cancelarBorrado() {
    if (estado === 'borrando') return
    setEstado('inactivo')
    // El botón "Borrar" se vuelve a dibujar en este render: el foco vuelve a él en el siguiente
    requestAnimationFrame(() => boton.current?.focus())
  }

  async function confirmar() {
    if (estado === 'borrando') return
    setEstado('borrando')
    try {
      await borrarOpinion(id)
      onBorrada(id)
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No pudimos borrar tu opinión.')
      setEstado('inactivo')
      requestAnimationFrame(() => boton.current?.focus())
    }
  }

  return (
    <div className="mt-3 border-t border-piedra pt-3">
      {estado === 'inactivo' ? (
        <button ref={boton} type="button" onClick={pedirConfirmacion} className="boton-borde px-3 py-1 text-sm">
          Borrar
          <span className="sr-only"> mi opinión {descripcion}</span>
        </button>
      ) : (
        <div
          role="group"
          aria-labelledby={idMensaje}
          onKeyDown={(evento) => {
            if (evento.key === 'Escape') cancelarBorrado()
          }}
        >
          <p id={idMensaje} className="font-bold">
            ¿Borrar esta opinión? No se puede deshacer.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={confirmar} aria-disabled={estado === 'borrando'} className="boton-primario px-3 py-1 text-sm">
              {estado === 'borrando' ? 'Borrando…' : 'Sí, borrar'}
            </button>
            <button ref={cancelar} type="button" onClick={cancelarBorrado} aria-disabled={estado === 'borrando'} className="boton-borde px-3 py-1 text-sm">
              Cancelar
            </button>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-2 font-bold text-rojo">
          {error}
        </p>
      )}
    </div>
  )
}
