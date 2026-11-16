import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useCola } from '../hooks/useCola'
import { useConexion } from '../hooks/useConexion'
import { sincronizarCola } from '../services/opiniones'

const plural = (n: number) => (n === 1 ? '1 opinión pendiente' : `${n} opiniones pendientes`)

/** Indicador global de conexión y de la cola. También dispara el envío al ingresar y al volver la conexión. */
export function EstadoConexion() {
  const enLinea = useConexion()
  const { usuario } = useAuth()
  const { pendientes, enviadas } = useCola()
  const [recienEnviadas, setRecienEnviadas] = useState(0)
  const enviadasAntes = useRef(0)
  const uid = usuario?.uid

  useEffect(() => {
    if (uid && enLinea) void sincronizarCola(uid)
  }, [uid, enLinea])

  useEffect(() => {
    const nuevas = enviadas - enviadasAntes.current
    enviadasAntes.current = enviadas
    if (nuevas <= 0) return
    setRecienEnviadas(nuevas)
    const reloj = setTimeout(() => setRecienEnviadas(0), 8000)
    return () => clearTimeout(reloj)
  }, [enviadas])

  const enEspera = pendientes.filter((p) => !p.error).length
  const mensajes: string[] = []
  if (!enLinea) mensajes.push('Sin conexión. Podés ver lo que ya cargaste y opinar: se envía cuando vuelva la conexión.')
  if (enEspera > 0) mensajes.push(`${plural(enEspera)} de envío.${enLinea && !usuario ? ' Ingresá para enviarlas.' : ''}`)
  if (recienEnviadas > 0) {
    mensajes.push(recienEnviadas === 1 ? 'Se envió 1 opinión pendiente.' : `Se enviaron ${recienEnviadas} opiniones pendientes.`)
  }

  // Siempre montado: los lectores de pantalla solo anuncian cambios en una región que ya existe
  return (
    <div role="status" aria-live="polite" className={enLinea ? 'bg-crema' : 'sobre-oscuro bg-tinta text-crema'}>
      {mensajes.length > 0 && (
        <p className="mx-auto max-w-6xl px-4 py-2 text-sm font-bold">{mensajes.join(' ')}</p>
      )}
    </div>
  )
}
