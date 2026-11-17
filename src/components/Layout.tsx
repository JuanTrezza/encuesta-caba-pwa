import { Suspense, useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Adoquines, Franjas } from './Adornos'
import { AvisosPwa } from './AvisosPwa'
import { ErrorBoundary } from './ErrorBoundary'
import { Cargando } from './Estados'
import { EstadoConexion } from './EstadoConexion'
import { LogoMarca } from './Logo'

const ENLACES = [
  { to: '/mapa', texto: 'Mapa' },
  { to: '/resultados', texto: 'Resultados' },
  { to: '/sobre', texto: 'Sobre el proyecto' },
]

function useSalir() {
  const [saliendo, setSaliendo] = useState(false)

  async function salir() {
    if (saliendo) return
    setSaliendo(true)
    try {
      await (await import('../services/auth')).cerrarSesion()
    } finally {
      setSaliendo(false)
    }
  }

  return { salir, saliendo }
}

const IR_A_INGRESAR = 'boton-primario whitespace-nowrap'

/**
 * Menú de la cuenta en la barra de escritorio: un botón que abre un panel con "Mis opiniones" y "Salir".
 * Se cierra con Escape, al tocar afuera, al llevar el foco afuera con Tab o al cambiar de página.
 */
function MenuCuenta({ nombre }: { nombre: string }) {
  const [abierto, setAbierto] = useState(false)
  const contenedor = useRef<HTMLDivElement>(null)
  const boton = useRef<HTMLButtonElement>(null)
  const { pathname, search } = useLocation()
  const { salir, saliendo } = useSalir()

  useEffect(() => setAbierto(false), [pathname, search])

  useEffect(() => {
    if (!abierto) return
    function alEstarAfuera(evento: Event) {
      if (!contenedor.current?.contains(evento.target as Node)) setAbierto(false)
    }
    // No se usa onBlur: en Safari tocar un botón no le da el foco y el menú se cerraría antes del clic
    document.addEventListener('pointerdown', alEstarAfuera)
    document.addEventListener('focusin', alEstarAfuera)
    return () => {
      document.removeEventListener('pointerdown', alEstarAfuera)
      document.removeEventListener('focusin', alEstarAfuera)
    }
  }, [abierto])

  return (
    <div
      ref={contenedor}
      className="relative"
      onKeyDown={(evento) => {
        if (evento.key === 'Escape' && abierto) {
          setAbierto(false)
          boton.current?.focus()
        }
      }}
    >
      <button
        ref={boton}
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-controls="menu-cuenta"
        className="boton-borde whitespace-nowrap"
      >
        Mi cuenta
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {abierto && (
        <div id="menu-cuenta" className="absolute right-0 top-full z-20 mt-2 w-64 rounded-md border-2 border-tinta bg-papel p-3 shadow-lg">
          <p className="truncate text-sm text-adoquin">{nombre}</p>
          <Link to="/mis-opiniones" className="mt-1 flex min-h-[44px] items-center font-bold underline-offset-4 hover:underline">
            Mis opiniones
          </Link>
          <button type="button" onClick={salir} aria-disabled={saliendo} className="boton-borde mt-1 w-full">
            Salir
          </button>
        </div>
      )}
    </div>
  )
}

function Sesion() {
  const { usuario } = useAuth()
  // Mientras no se sabe si hay sesión se muestra "Ingresar": es el caso más común y evita un hueco
  if (!usuario) {
    return (
      <Link to="/ingresar" className={IR_A_INGRESAR}>
        Ingresar
      </Link>
    )
  }
  return <MenuCuenta nombre={usuario.nombre ?? usuario.email ?? ''} />
}

/** La misma sesión, dentro del panel de pantallas angostas */
function SesionEnPanel() {
  const { usuario } = useAuth()
  const { salir, saliendo } = useSalir()

  if (!usuario) {
    return (
      <Link to="/ingresar" className={`${IR_A_INGRESAR} w-full`}>
        Ingresar
      </Link>
    )
  }
  return (
    <div className="space-y-3">
      <p className="truncate text-sm text-adoquin">{usuario.nombre ?? usuario.email}</p>
      <button type="button" onClick={salir} aria-disabled={saliendo} className="boton-borde w-full whitespace-nowrap">
        Salir
      </button>
    </div>
  )
}

/** En pantallas angostas la navegación va en un panel deslizable: foco atrapado y cierre con Escape */
function MenuMovil() {
  const [abierto, setAbierto] = useState(false)
  const boton = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const { pathname, search } = useLocation()
  const { usuario } = useAuth()
  const enlaces = [
    { to: '/', texto: 'Inicio' },
    ...ENLACES,
    ...(usuario ? [{ to: '/mis-opiniones', texto: 'Mis opiniones' }] : []),
  ]

  useEffect(() => setAbierto(false), [pathname, search])

  useEffect(() => {
    if (!abierto) return
    const desborde = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panel.current?.querySelector<HTMLElement>('a[href], button')?.focus()

    function alPresionar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') {
        setAbierto(false)
        boton.current?.focus()
        return
      }
      if (evento.key !== 'Tab' || !panel.current) return
      const enfocables = [...panel.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')]
      const primero = enfocables[0]
      const ultimo = enfocables[enfocables.length - 1]
      if (!primero || !ultimo) return
      const actual = document.activeElement
      if (evento.shiftKey && actual === primero) {
        evento.preventDefault()
        ultimo.focus()
      } else if (!evento.shiftKey && actual === ultimo) {
        evento.preventDefault()
        primero.focus()
      } else if (!panel.current.contains(actual)) {
        evento.preventDefault()
        primero.focus()
      }
    }

    document.addEventListener('keydown', alPresionar)
    return () => {
      document.body.style.overflow = desborde
      document.removeEventListener('keydown', alPresionar)
    }
  }, [abierto])

  function cerrar() {
    setAbierto(false)
    boton.current?.focus()
  }

  return (
    <div className="md:hidden">
      <button
        ref={boton}
        type="button"
        onClick={() => setAbierto(true)}
        aria-expanded={abierto}
        aria-controls="menu-movil"
        className="flex h-11 w-11 items-center justify-center rounded-md border-2 border-tinta"
      >
        <span className="sr-only">Abrir el menú</span>
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" focusable="false">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      {abierto && (
        <div className="fixed inset-0 z-30">
          <div className="absolute inset-0 bg-tinta/60" onClick={cerrar} aria-hidden="true" />
          <div
            ref={panel}
            id="menu-movil"
            role="dialog"
            aria-modal="true"
            aria-label="Menú"
            className="absolute inset-y-0 right-0 flex w-[min(20rem,88vw)] animate-entrar flex-col overflow-y-auto bg-papel p-4 shadow-xl"
          >
            <button
              type="button"
              onClick={cerrar}
              className="flex h-11 w-11 items-center justify-center self-end rounded-md border-2 border-tinta"
            >
              <span className="sr-only">Cerrar el menú</span>
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" focusable="false">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
            <nav aria-label="Principal" className="mt-2 flex flex-col">
              {enlaces.map(({ to, texto }) => (
                <NavLink
                  key={to}
                  to={to}
                  end
                  className={({ isActive }) =>
                    `flex min-h-[48px] items-center border-b border-piedra text-lg font-bold ${isActive ? 'text-rojo' : ''}`
                  }
                >
                  {texto}
                </NavLink>
              ))}
            </nav>
            <div className="mt-6">
              <SesionEnPanel />
            </div>
          </div>
        </div>
      )}
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
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-3 sm:px-4">
          <Link to="/" className="flex min-h-[44px] items-center gap-2 no-underline" aria-label="Voz Porteña, inicio">
            <LogoMarca className="h-9 w-9 shrink-0 sm:h-10 sm:w-10" />
            <span className="whitespace-nowrap font-display text-lg leading-none min-[400px]:text-xl sm:text-2xl">
              Voz Porteña
            </span>
          </Link>
          <nav aria-label="Principal" className="hidden items-center gap-5 md:flex">
            {ENLACES.map(({ to, texto }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex min-h-[44px] items-center whitespace-nowrap px-1 font-bold underline-offset-4 hover:underline ${isActive ? 'underline decoration-2' : ''}`
                }
              >
                {texto}
              </NavLink>
            ))}
            <Sesion />
          </nav>
          <MenuMovil />
        </div>
        <Franjas />
      </header>

      <EstadoConexion />
      <AvisosPwa />

      {/* Alto mínimo de una pantalla: mientras una página carga, el pie no aparece y después salta */}
      <main id="contenido" ref={principal} tabIndex={-1} className="min-h-screen flex-1 focus:outline-none">
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
