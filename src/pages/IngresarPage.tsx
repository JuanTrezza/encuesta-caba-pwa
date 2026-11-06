import { useState, type FormEvent } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { Cargando } from '../components/Estados'
import { useAuth } from '../context/AuthContext'
import { useTitulo } from '../hooks/useTitulo'
import { ingresarConEmail, ingresarConGoogle, registrarConEmail } from '../services/auth'
import { CODIGO_CANCELADO, ErrorServicio } from '../services/types'

/** Solo rutas internas de la app */
function destinoSeguro(volver: string | null): string {
  return volver && volver.startsWith('/') && !volver.startsWith('//') ? volver : '/'
}

export function IngresarPage() {
  const { usuario, cargando } = useAuth()
  const [params] = useSearchParams()
  const [modo, setModo] = useState<'ingresar' | 'registro'>('ingresar')
  const [email, setEmail] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const registro = modo === 'registro'
  useTitulo(registro ? 'Crear cuenta' : 'Ingresar')

  if (usuario) return <Navigate to={destinoSeguro(params.get('volver'))} replace />
  if (cargando) {
    return (
      <div className="mx-auto max-w-md px-4">
        <Cargando texto="Revisando tu sesión…" />
      </div>
    )
  }

  async function ejecutar(accion: () => Promise<void>) {
    if (enviando) return
    setEnviando(true)
    setMensaje(registro ? 'Creando tu cuenta…' : 'Ingresando…')
    try {
      await accion()
      setMensaje('')
    } catch (error) {
      if (error instanceof ErrorServicio && error.codigo === CODIGO_CANCELADO) setMensaje('')
      else setMensaje(error instanceof Error ? error.message : 'No pudimos completar el ingreso.')
    } finally {
      setEnviando(false)
    }
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    void ejecutar(() =>
      registro ? registrarConEmail(email.trim(), contrasena) : ingresarConEmail(email.trim(), contrasena),
    )
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-8">
      <h1 className="font-display text-4xl leading-tight">{registro ? 'Crear cuenta' : 'Ingresar'}</h1>
      <p className="mt-2 text-adoquin">Necesitás una cuenta para opinar. Para leer, no.</p>

      <div className="cartel mt-6 p-5">
        <button type="button" onClick={() => void ejecutar(ingresarConGoogle)} className="boton-borde w-full">
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" focusable="false">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continuar con Google
        </button>

        <div className="my-5 flex items-center gap-3 text-adoquin" aria-hidden="true">
          <span className="h-px flex-1 bg-junta" />o con tu mail
          <span className="h-px flex-1 bg-junta" />
        </div>

        <form onSubmit={enviar} className="space-y-4">
          <div>
            <label htmlFor="email" className="font-bold">
              Mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="campo mt-1"
            />
          </div>
          <div>
            <label htmlFor="contrasena" className="font-bold">
              Contraseña
            </label>
            <input
              id="contrasena"
              type="password"
              autoComplete={registro ? 'new-password' : 'current-password'}
              required
              minLength={registro ? 6 : undefined}
              aria-describedby={registro ? 'contrasena-ayuda' : undefined}
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              className="campo mt-1"
            />
            {registro && (
              <p id="contrasena-ayuda" className="mt-1 text-sm text-adoquin">
                Al menos 6 caracteres.
              </p>
            )}
          </div>
          <button type="submit" aria-disabled={enviando} className="boton-primario w-full">
            {registro ? 'Crear cuenta' : 'Ingresar'}
          </button>
        </form>

        {/* Siempre montado: los lectores de pantalla solo anuncian cambios en una región que ya existe */}
        <div role="status" aria-live="polite">
          {mensaje && <p className="mt-4 font-bold">{mensaje}</p>}
        </div>
      </div>

      <p className="mt-4 text-center">
        {registro ? '¿Ya tenés cuenta?' : '¿No tenés cuenta?'}{' '}
        <button
          type="button"
          className="enlace min-h-[44px]"
          onClick={() => {
            setModo(registro ? 'ingresar' : 'registro')
            setMensaje('')
          }}
        >
          {registro ? 'Ingresá' : 'Registrate'}
        </button>
      </p>
    </div>
  )
}
