import { lazy } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { RequireAuth } from './components/RequireAuth'
import { AuthProvider } from './context/AuthContext'
import { HomePage } from './pages/HomePage'
import { IngresarPage } from './pages/IngresarPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { SobrePage } from './pages/SobrePage'

// Estas dos son las únicas que usan Firestore: así el SDK se descarga recién cuando hace falta
const CategoriaPage = lazy(() => import('./pages/CategoriaPage').then((m) => ({ default: m.CategoriaPage })))
const OpinarPage = lazy(() => import('./pages/OpinarPage').then((m) => ({ default: m.OpinarPage })))

export function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="categoria/:id" element={<CategoriaPage />} />
            <Route element={<RequireAuth />}>
              <Route path="opinar" element={<OpinarPage />} />
            </Route>
            <Route path="ingresar" element={<IngresarPage />} />
            <Route path="sobre" element={<SobrePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  )
}
