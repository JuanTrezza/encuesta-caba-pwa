import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Usuario } from '../services/types'

interface EstadoAuth {
  usuario: Usuario | null
  /** true hasta saber si hay sesión: evita redirigir antes de tiempo */
  cargando: boolean
}

interface ContextoAuth extends EstadoAuth {
  iniciar: () => void
}

const ESPERA_MS = 1500
const AuthContext = createContext<ContextoAuth>({ usuario: null, cargando: true, iniciar: () => {} })

/**
 * Firebase Auth pesa y no hace falta para dibujar la página. Se descarga cuando la página ya cargó,
 * o antes si la persona hace algo o entra a una página que necesita saber si hay sesión.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoAuth>({ usuario: null, cargando: true })
  const iniciada = useRef(false)

  const iniciar = useCallback(() => {
    if (iniciada.current) return
    iniciada.current = true
    import('../services/auth').then(
      // La suscripción dura lo que dura la app: no hace falta darla de baja
      ({ observarUsuario }) => void observarUsuario((usuario) => setEstado({ usuario, cargando: false })),
      // Sin conexión y sin la app guardada: se sigue como visitante
      () => setEstado({ usuario: null, cargando: false }),
    )
  }, [])

  useEffect(() => {
    let reloj: number | undefined
    const programar = () => {
      reloj = window.setTimeout(iniciar, ESPERA_MS)
    }
    if (document.readyState === 'complete') programar()
    else window.addEventListener('load', programar, { once: true })
    window.addEventListener('pointerdown', iniciar, { once: true })
    window.addEventListener('keydown', iniciar, { once: true })
    return () => {
      window.clearTimeout(reloj)
      window.removeEventListener('load', programar)
      window.removeEventListener('pointerdown', iniciar)
      window.removeEventListener('keydown', iniciar)
    }
  }, [iniciar])

  return <AuthContext.Provider value={{ ...estado, iniciar }}>{children}</AuthContext.Provider>
}

/** Con `urgente`, la sesión se averigua enseguida en lugar de esperar a que la página termine de cargar */
export function useAuth({ urgente = false } = {}): EstadoAuth {
  const { usuario, cargando, iniciar } = useContext(AuthContext)
  useEffect(() => {
    if (urgente) iniciar()
  }, [urgente, iniciar])
  return { usuario, cargando }
}
