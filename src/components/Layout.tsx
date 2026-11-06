import { Suspense, useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { cerrarSesion } from '../services/auth'
import { Adoquines, Franjas } from './Adornos'
import { ErrorBoundary } from './ErrorBoundary'
import { Cargando } from './Estados'
import { LogoMarca } from './Logo'

function Sesion() {
  const { usuario, cargando } = useAuth()
  const [saliendo, setSaliendo] = useState(false)

  if (cargando) return <span className="w-[4.5rem]" aria-hidden="true" />
  if (!usuario) {
    return (
      <Link to="/ingresar" className="boton-primario px-3 md:px-5">
        Ingresar
      </Link>
    )
  }

  async function salir() {
    setSaliendo(true)
    try {
      await cerrarSesion()
    } finally {
      setSaliendo(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <span className="hidden max-w-[16rem] truncate text-sm text-adoquin lg:inline">
        {usuario.nombre ?? usuario.email}
      </span>
      <button type="button" onClick={salir} disabled={saliendo} className="boton-borde px-3 md:px-5">
        Salir
      </button>
    </div>
  )
}

export function Layout() {
  const { pathname, search } = useLocation()
  const principal = useRef<HTMLElement>(null)
  const rutaAnterior = useRef(pathname + search)

  // En una SPA el foco no se mueve solo al navegar: se lleva al contenido para teclado y lectores
  useEffect(() => {
    if (rutaAnterior.current === pathname + search) return
    rutaAnterior.current = pathname + search
    window.scrollTo(0, 0)
    principal.current?.focus({ preventScroll: true })
  }, [pathname, search])

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#contenido"
        onClick={(e) => {
          // El hash lo usa el router: el salto se resuelve moviendo el foco
          e.preventDefault()
          principal.current?.focus()
        }}
        className="boton-primario sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-10"
      >
        Saltar al contenido
      </a>

      <header className="bg-papel">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3">
          <Link to="/" className="flex min-h-[44px] items-center gap-2 no-underline" aria-label="Voz Porteña, inicio">
            <LogoMarca className="h-10 w-10 shrink-0" />
            <span className="whitespace-nowrap font-display text-xl leading-none sm:text-2xl">Voz Porteña</span>
          </Link>
          <nav aria-label="Principal" className="flex items-center gap-2 md:gap-5">
            <NavLink
              to="/sobre"
              className={({ isActive }) =>
                `flex min-h-[44px] items-center px-1 font-bold underline-offset-4 hover:underline ${isActive ? 'underline decoration-2' : ''}`
              }
            >
              <span className="md:hidden">Sobre</span>
              <span className="hidden md:inline">Sobre el proyecto</span>
            </NavLink>
            <Sesion />
          </nav>
        </div>
        <Franjas />
      </header>

      <main id="contenido" ref={principal} tabIndex={-1} className="flex-1 focus:outline-none">
        <ErrorBoundary>
          <Suspense fallback={<div className="mx-auto max-w-3xl px-4"><Cargando /></div>}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>

      <footer className="sobre-oscuro mt-12 bg-tinta text-crema">
        <Adoquines />
        <div className="mx-auto max-w-6xl space-y-2 px-4 py-6 text-sm">
          <p className="font-bold">Proyecto independiente, sin relación con el Gobierno de la Ciudad de Buenos Aires.</p>
          <p>
            Código abierto.{' '}
            <Link to="/sobre" className="underline underline-offset-2">
              Conocé el proyecto
            </Link>
          </p>
        </div>
      </footer>
    </div>
  )
}
