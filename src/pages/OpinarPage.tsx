import { useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { RatingInput } from '../components/RatingInput'
import { BARRIOS } from '../data/barrios'
import { buscarCategoria, CATEGORIAS, type CategoriaId } from '../data/categorias'
import { useTitulo } from '../hooks/useTitulo'
import { publicarComentario } from '../services/comentarios'
import { MAX_COMENTARIO, type Calificacion } from '../services/types'

interface Errores {
  categoria?: string
  calificacion?: string
  texto?: string
}

type Envio =
  | { estado: 'inactivo' }
  | { estado: 'enviando' }
  | { estado: 'ok'; categoria: CategoriaId }
  | { estado: 'error'; mensaje: string }

export function OpinarPage() {
  useTitulo('Opinar')
  const [params] = useSearchParams()
  const [categoria, setCategoria] = useState<CategoriaId | ''>(buscarCategoria(params.get('categoria'))?.id ?? '')
  const [calificacion, setCalificacion] = useState<Calificacion | null>(null)
  const [texto, setTexto] = useState('')
  const [barrio, setBarrio] = useState('')
  const [errores, setErrores] = useState<Errores>({})
  const [envio, setEnvio] = useState<Envio>({ estado: 'inactivo' })
  const formulario = useRef<HTMLFormElement>(null)

  const enviando = envio.estado === 'enviando'
  const nombreCategoria = envio.estado === 'ok' ? buscarCategoria(envio.categoria)?.nombre : undefined

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (enviando) return

    const limpio = texto.trim()
    const nuevos: Errores = {
      ...(categoria ? {} : { categoria: 'Elegí un tema.' }),
      ...(calificacion ? {} : { calificacion: 'Elegí de 1 a 5 estrellas.' }),
      ...(limpio ? {} : { texto: 'Escribí un comentario.' }),
    }
    setErrores(nuevos)

    if (!categoria || !calificacion || !limpio) {
      setEnvio({ estado: 'error', mensaje: 'Revisá los campos marcados.' })
      // Lleva el foco al primer campo con error
      requestAnimationFrame(() => formulario.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
      return
    }

    setEnvio({ estado: 'enviando' })
    try {
      await publicarComentario({ texto: limpio, calificacion, categoria, barrio: barrio || undefined })
      setEnvio({ estado: 'ok', categoria })
      setCalificacion(null)
      setTexto('')
      setBarrio('')
    } catch (error) {
      setEnvio({
        estado: 'error',
        mensaje: error instanceof Error ? error.message : 'No pudimos enviar tu opinión.',
      })
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pt-8">
      <h1 className="font-display text-4xl leading-tight">Dar mi opinión</h1>
      <p className="mt-2 text-adoquin">
        Tu comentario se publica sin tu nombre y no se puede editar después. Evitá poner datos personales.
      </p>

      <form ref={formulario} onSubmit={enviar} noValidate className="cartel mt-6 space-y-6 p-5">
        <div>
          <label htmlFor="categoria" className="font-bold">
            Tema <span className="font-normal text-adoquin">(obligatorio)</span>
          </label>
          <select
            id="categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as CategoriaId | '')}
            required
            aria-invalid={errores.categoria ? true : undefined}
            aria-describedby={errores.categoria ? 'categoria-error' : undefined}
            className="campo mt-1"
          >
            <option value="">Elegí un tema</option>
            {CATEGORIAS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          {errores.categoria && (
            <p id="categoria-error" className="mt-1 font-bold text-rojo">
              {errores.categoria}
            </p>
          )}
        </div>

        <RatingInput valor={calificacion} onChange={setCalificacion} error={errores.calificacion} />

        <div>
          <label htmlFor="comentario" className="font-bold">
            Tu comentario <span className="font-normal text-adoquin">(obligatorio)</span>
          </label>
          <textarea
            id="comentario"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            maxLength={MAX_COMENTARIO}
            rows={5}
            required
            aria-invalid={errores.texto ? true : undefined}
            aria-describedby={`comentario-contador${errores.texto ? ' comentario-error' : ''}`}
            className="campo mt-1"
          />
          <p id="comentario-contador" className="mt-1 text-right text-sm tabular-nums text-adoquin">
            {texto.length} de {MAX_COMENTARIO} caracteres
          </p>
          {errores.texto && (
            <p id="comentario-error" className="font-bold text-rojo">
              {errores.texto}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="barrio" className="font-bold">
            Barrio <span className="font-normal text-adoquin">(opcional)</span>
          </label>
          <select id="barrio" value={barrio} onChange={(e) => setBarrio(e.target.value)} className="campo mt-1">
            <option value="">Prefiero no decirlo</option>
            {BARRIOS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div>
          <button type="submit" aria-disabled={enviando} className="boton-primario w-full sm:w-auto">
            {enviando ? 'Enviando…' : 'Enviar opinión'}
          </button>

          {/* Siempre montado: los lectores de pantalla solo anuncian cambios en una región que ya existe */}
          <div role="status" aria-live="polite" className="[&>*]:mt-4">
            {envio.estado === 'enviando' && <p>Enviando tu opinión…</p>}
            {envio.estado === 'error' && <p className="font-bold text-rojo">{envio.mensaje}</p>}
            {envio.estado === 'ok' && (
              <div className="rounded-md border-2 border-verde bg-crema p-4">
                <p className="font-bold text-verde">¡Gracias! Tu opinión ya está publicada.</p>
                <Link to={`/categoria/${envio.categoria}`} className="enlace mt-1 inline-block">
                  Ver opiniones de {nombreCategoria}
                </Link>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
