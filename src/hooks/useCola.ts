import { useEffect, useState } from 'react'
import { observarCola, type EstadoCola } from '../services/opiniones'

export function useCola(): EstadoCola {
  const [estado, setEstado] = useState<EstadoCola>({ pendientes: [], enviadas: 0 })
  useEffect(() => observarCola(setEstado), [])
  return estado
}
