import { useCallback, useEffect, useState } from 'react'

interface EstadoAsync<T> {
  datos: T | undefined
  cargando: boolean
  error: Error | undefined
}

/** Ejecuta una función de services. `clave` tiene que incluir los parámetros que cambian el resultado. */
export function useAsync<T>(clave: string, fn: () => Promise<T>): EstadoAsync<T> & { reintentar: () => void } {
  const [intento, setIntento] = useState(0)
  const [estado, setEstado] = useState<EstadoAsync<T>>({ datos: undefined, cargando: true, error: undefined })

  useEffect(() => {
    let cancelado = false
    setEstado({ datos: undefined, cargando: true, error: undefined })
    fn().then(
      (datos) => {
        if (!cancelado) setEstado({ datos, cargando: false, error: undefined })
      },
      (error: unknown) => {
        if (!cancelado) {
          setEstado({
            datos: undefined,
            cargando: false,
            error: error instanceof Error ? error : new Error(String(error)),
          })
        }
      },
    )
    return () => {
      cancelado = true
    }
    // fn cambia en cada render: la clave describe sus dependencias
  }, [clave, intento])

  const reintentar = useCallback(() => setIntento((n) => n + 1), [])
  return { ...estado, reintentar }
}
