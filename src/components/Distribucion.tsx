import type { Calificacion, ResumenCategoria } from '../services/types'

const ORDEN: readonly Calificacion[] = [5, 4, 3, 2, 1]

/** Una sola serie: cada fila lleva cantidad y porcentaje escritos, la barra solo refuerza. */
export function Distribucion({ resumen }: { resumen: ResumenCategoria }) {
  return (
    <ul className="space-y-2" aria-label="Distribución de estrellas">
      {ORDEN.map((estrellas) => {
        const cantidad = resumen.distribucion[estrellas]
        const porcentaje = resumen.total ? Math.round((cantidad / resumen.total) * 100) : 0
        return (
          <li key={estrellas} className="grid grid-cols-[4.75rem_1fr_5.5rem] items-center gap-2 text-sm">
            <span>
              {estrellas} {estrellas === 1 ? 'estrella' : 'estrellas'}
            </span>
            <span className="h-2.5 overflow-hidden rounded-full bg-piedra" aria-hidden="true">
              <span
                className="block h-full rounded-full bg-ocre"
                style={{ width: `${porcentaje}%`, minWidth: cantidad > 0 ? '4px' : undefined }}
              />
            </span>
            <span className="text-right tabular-nums text-adoquin">
              {cantidad.toLocaleString('es-AR')} ({porcentaje}%)
            </span>
          </li>
        )
      })}
    </ul>
  )
}
