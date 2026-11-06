import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Cargando } from './Estados'

export function RequireAuth() {
  const { usuario, cargando } = useAuth()
  const { pathname, search } = useLocation()

  if (cargando) {
    return (
      <div className="mx-auto max-w-3xl px-4">
        <Cargando texto="Revisando tu sesión…" />
      </div>
    )
  }
  if (!usuario) return <Navigate to={`/ingresar?volver=${encodeURIComponent(pathname + search)}`} replace />
  return <Outlet />
}
