import type { ReactNode } from 'react'
import type { Comentario } from '../services/types'
import { Estrellas } from './Estrellas'

const FORMATO_FECHA = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })

interface Props {
  comentario: Comentario
  /** Etiqueta de estado, como "Pendiente de envío" */
  estado?: string
  /** Tema de la opinión, para las listas que mezclan varios (como "Mis opiniones") */
  tema?: ReactNode
  children?: ReactNode
}

export function ComentarioItem({ comentario, estado, tema, children }: Props) {
  return (
    <li className={`rounded-lg border-2 bg-papel p-4 ${estado ? 'border-dashed border-junta' : 'border-piedra'}`}>
      {estado && (
        <p className="mb-2 inline-block rounded bg-tinta px-2 py-0.5 text-sm font-bold text-crema">{estado}</p>
      )}
      {tema && <p className="mb-1 font-bold">{tema}</p>}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <Estrellas valor={comentario.calificacion} className="h-4 w-4" />
        <time dateTime={comentario.fecha} className="text-sm text-adoquin">
          {FORMATO_FECHA.format(new Date(comentario.fecha))}
        </time>
      </div>
      <p className="mt-2 whitespace-pre-line">{comentario.texto}</p>
      {comentario.barrio && <p className="mt-2 text-sm font-bold text-verde">{comentario.barrio}</p>}
      {children}
    </li>
  )
}
