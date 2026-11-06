import type { ReactNode } from 'react'

export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <div role="status" className="flex items-center gap-3 py-8 text-adoquin">
      <span
        className="h-5 w-5 animate-spin rounded-full border-2 border-piedra border-t-rojo"
        aria-hidden="true"
      />
      {texto}
    </div>
  )
}

/** Bloques grises con la forma del contenido, para que la página no salte al cargar */
export function Esqueleto({ etiqueta, lineas = 3 }: { etiqueta: string; lineas?: number }) {
  return (
    <div role="status" aria-label={etiqueta} className="space-y-3">
      {Array.from({ length: lineas }, (_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-md bg-piedra/60" />
      ))}
    </div>
  )
}

export function EstadoError({ mensaje, onReintentar }: { mensaje: string; onReintentar?: () => void }) {
  return (
    <div role="alert" className="rounded-lg border-2 border-rojo bg-papel p-4">
      <p className="font-bold text-rojo">No pudimos cargar esto</p>
      <p className="mt-1">{mensaje}</p>
      {onReintentar && (
        <button type="button" onClick={onReintentar} className="boton-borde mt-3">
          Reintentar
        </button>
      )}
    </div>
  )
}

export function EstadoVacio({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="rounded-lg border-2 border-dashed border-junta p-6 text-center">
      <p className="text-lg font-bold">{titulo}</p>
      {children && <div className="mt-2">{children}</div>}
    </div>
  )
}
