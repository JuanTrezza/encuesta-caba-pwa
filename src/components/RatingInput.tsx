import { useId, useState } from 'react'
import type { Calificacion } from '../services/types'
import { IconoEstrella } from './Estrellas'

const OPCIONES: readonly { valor: Calificacion; texto: string }[] = [
  { valor: 1, texto: 'Muy mal' },
  { valor: 2, texto: 'Mal' },
  { valor: 3, texto: 'Regular' },
  { valor: 4, texto: 'Bien' },
  { valor: 5, texto: 'Muy bien' },
]

interface Props {
  valor: Calificacion | null
  onChange: (valor: Calificacion) => void
  error?: string
}

/**
 * Radios nativos, visualmente ocultos: el navegador resuelve Tab, flechas y Espacio, y el lector
 * de pantalla anuncia "3 estrellas: Regular, 3 de 5". El foco se dibuja sobre la estrella activa.
 */
export function RatingInput({ valor, onChange, error }: Props) {
  const nombre = useId()
  const [previa, setPrevia] = useState<Calificacion | null>(null)
  const mostrado = previa ?? valor
  const textoActual = OPCIONES.find((o) => o.valor === mostrado)?.texto
  const errorId = `${nombre}-error`

  return (
    <fieldset aria-describedby={error ? errorId : undefined}>
      <legend className="font-bold">
        Tu puntuación <span className="font-normal text-adoquin">(obligatoria)</span>
      </legend>
      <div className="mt-2 flex flex-wrap items-center gap-x-3" onMouseLeave={() => setPrevia(null)}>
        <div className="flex">
          {OPCIONES.map(({ valor: v, texto }) => (
            <label key={v} className="group relative cursor-pointer p-1" onMouseEnter={() => setPrevia(v)}>
              <input
                type="radio"
                name={nombre}
                value={v}
                checked={valor === v}
                onChange={() => onChange(v)}
                required
                aria-invalid={error ? true : undefined}
                className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
              <span className="sr-only">
                {v} {v === 1 ? 'estrella' : 'estrellas'}: {texto}
              </span>
              <span className="block rounded peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-1 peer-focus-visible:outline-verde">
                <IconoEstrella llena={mostrado !== null && v <= mostrado} className="h-10 w-10" />
              </span>
            </label>
          ))}
        </div>
        <span className="min-h-[1.5rem] font-bold text-adoquin" aria-hidden="true">
          {textoActual ?? ''}
        </span>
      </div>
      {error && (
        <p id={errorId} className="mt-1 font-bold text-rojo">
          {error}
        </p>
      )}
    </fieldset>
  )
}
