import { useEffect, useState } from 'react'

const FORMATO = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })

export function haceCuanto(momento: number, ahora = Date.now()): string {
  const minutos = Math.floor((ahora - momento) / 60_000)
  if (minutos < 1) return 'hace menos de 1 min'
  if (minutos < 60) return `hace ${minutos} min`
  if (minutos < 24 * 60) return `hace ${Math.floor(minutos / 60)} h`
  return `el ${FORMATO.format(momento)}`
}

/** Antigüedad de los datos que se están mostrando, con la opción de volver a pedirlos */
export function Actualizado({ momento, onActualizar }: { momento: number; onActualizar: () => void }) {
  const [, setTic] = useState(0)

  useEffect(() => {
    const reloj = setInterval(() => setTic((n) => n + 1), 30_000)
    return () => clearInterval(reloj)
  }, [])

  return (
    <p className="flex flex-wrap items-center gap-x-3 text-sm text-adoquin">
      <span>Actualizado {haceCuanto(momento)}.</span>
      <button type="button" onClick={onActualizar} className="enlace min-h-[44px]">
        Actualizar
      </button>
    </p>
  )
}
