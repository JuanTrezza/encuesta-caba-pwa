import type { Comentario } from '../services/types'
import { Estrellas } from './Estrellas'

const FORMATO_FECHA = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })

export function ComentarioItem({ comentario }: { comentario: Comentario }) {
  return (
    <li className="rounded-lg border-2 border-piedra bg-papel p-4">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <Estrellas valor={comentario.calificacion} className="h-4 w-4" />
        <time dateTime={comentario.fecha} className="text-sm text-adoquin">
          {FORMATO_FECHA.format(new Date(comentario.fecha))}
        </time>
      </div>
      <p className="mt-2 whitespace-pre-line">{comentario.texto}</p>
      {comentario.barrio && <p className="mt-2 text-sm font-bold text-verde">{comentario.barrio}</p>}
    </li>
  )
}
