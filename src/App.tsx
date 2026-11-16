import { lazy } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { RequireAuth } from './components/RequireAuth'
import { AuthProvider } from './context/AuthContext'
import { HomePage } from './pages/HomePage'
import { IngresarPage } from './pages/IngresarPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { SobrePage } from './pages/SobrePage'

// Las páginas que usan Firestore, Leaflet o Recharts se descargan recién cuando hacen falta
const CategoriaPage = lazy(() => import('./pages/CategoriaPage').then((m) => ({ default: m.CategoriaPage })))
const OpinarPage = lazy(() => import('./pages/OpinarPage').then((m) => ({ default: m.OpinarPage })))
const MapaPage = lazy(() => import('./pages/MapaPage').then((m) => ({ default: m.MapaPage })))
const ResultadosPage = lazy(() => import('./pages/ResultadosPage').then((m) => ({ default: m.ResultadosPage })))

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
            <Route path="mapa" element={<MapaPage />} />
            <Route path="resultados" element={<ResultadosPage />} />
            <Route path="ingresar" element={<IngresarPage />} />
            <Route path="sobre" element={<SobrePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  )
}
