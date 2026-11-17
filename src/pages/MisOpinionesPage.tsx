import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BorrarOpinion, descripcionOpinion } from '../components/BorrarOpinion'
import { ComentarioItem } from '../components/ComentarioItem'
import { EstadoError, EstadoVacio, Esqueleto } from '../components/Estados'
import { useAuth } from '../context/AuthContext'
import { buscarCategoria } from '../data/categorias'
import { useAsync } from '../hooks/useAsync'
import { useTitulo } from '../hooks/useTitulo'
import { obtenerMisOpiniones } from '../services/opiniones'
import { MAX_MIS_OPINIONES } from '../services/types'

/** Detrás de RequireAuth: cuando se dibuja, ya se sabe quién ingresó */
export function MisOpinionesPage() {
  useTitulo('Mis opiniones')
  const { usuario } = useAuth()
  const uid = usuario?.uid ?? ''
  const { datos, cargando, error, reintentar } = useAsync(`mias:${uid}`, () =>
    uid ? obtenerMisOpiniones(uid) : Promise.resolve([]),
  )
  const [borradas, setBorradas] = useState<ReadonlySet<string>>(new Set())
  const [aviso, setAviso] = useState('')
  const encabezado = useRef<HTMLHeadingElement>(null)

  const visibles = (datos ?? []).filter((opinion) => !borradas.has(opinion.id))

  function alBorrar(id: string) {
    setBorradas((anteriores) => new Set(anteriores).add(id))
    setAviso('Opinión borrada.')
    // El botón que tenía el foco desaparece con la opinión: el foco pasa al título de la lista
    encabezado.current?.focus()
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pt-8">
      <h1 className="font-display text-4xl leading-tight">Mis opiniones</h1>
      <p className="mt-2 text-adoquin">
        Las opiniones que publicaste con tu cuenta. No se pueden editar, pero podés borrarlas cuando quieras.
      </p>

      {/* Siempre montado: los lectores de pantalla solo anuncian cambios en una región que ya existe */}
      <div role="status" aria-live="polite">
        {/* La clave cambia con cada borrado: sin ella, el mismo texto dos veces seguidas no se vuelve a anunciar */}
        {aviso && (
          <p key={borradas.size} className="mt-4 font-bold text-verde">
            {aviso}
          </p>
        )}
      </div>

      <section aria-labelledby="lista" className="mt-6">
        <h2 id="lista" ref={encabezado} tabIndex={-1} className="font-display text-2xl">
          Opiniones publicadas
        </h2>

        <div className="mt-4">
          {cargando && <Esqueleto etiqueta="Cargando tus opiniones" />}
          {error && <EstadoError mensaje={error.message} onReintentar={reintentar} />}
          {datos && visibles.length === 0 && (
            <EstadoVacio titulo="Todavía no publicaste ninguna opinión">
              <Link to="/opinar" className="enlace">
                Dar mi opinión
              </Link>
            </EstadoVacio>
          )}
          {datos && visibles.length > 0 && (
            <>
              <p className="text-adoquin">
                {visibles.length === 1 ? 'Tenés 1 opinión publicada.' : `Tenés ${visibles.length} opiniones publicadas.`}
                {datos.length >= MAX_MIS_OPINIONES && ` Se muestran las ${MAX_MIS_OPINIONES} más nuevas.`}
              </p>
              <ul className="mt-3 space-y-3" aria-label="Tus opiniones publicadas">
                {visibles.map((opinion) => (
                  <ComentarioItem
                    key={opinion.id}
                    comentario={opinion}
                    tema={
                      <Link to={`/categoria/${opinion.categoria}`} className="enlace">
                        {buscarCategoria(opinion.categoria)?.nombre ?? opinion.categoria}
                      </Link>
                    }
                  >
                    <BorrarOpinion id={opinion.id} descripcion={descripcionOpinion(opinion.fecha)} onBorrada={alBorrar} />
                  </ComentarioItem>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
