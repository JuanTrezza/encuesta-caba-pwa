import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { observarUsuario } from '../services/auth'
import type { Usuario } from '../services/types'

interface EstadoAuth {
  usuario: Usuario | null
  /** true hasta saber si hay sesión: evita redirigir antes de tiempo */
  cargando: boolean
}

const AuthContext = createContext<EstadoAuth>({ usuario: null, cargando: true })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoAuth>({ usuario: null, cargando: true })

  useEffect(() => observarUsuario((usuario) => setEstado({ usuario, cargando: false })), [])

  return <AuthContext.Provider value={estado}>{children}</AuthContext.Provider>
}

export function useAuth(): EstadoAuth {
  return useContext(AuthContext)
}
