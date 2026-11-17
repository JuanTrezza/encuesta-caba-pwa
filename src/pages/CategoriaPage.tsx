import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Actualizado } from '../components/Actualizado'
import { BorrarOpinion, descripcionOpinion } from '../components/BorrarOpinion'
import { CategoriaIcono } from '../components/CategoriaIcono'
import { ComentarioItem } from '../components/ComentarioItem'
import { Distribucion } from '../components/Distribucion'
import { EstadoError, EstadoVacio, Esqueleto } from '../components/Estados'
import { Estrellas, formatearPromedio } from '../components/Estrellas'
import { useAuth } from '../context/AuthContext'
import { buscarCategoria, type Categoria } from '../data/categorias'
import { useAsync } from '../hooks/useAsync'
import { useCola } from '../hooks/useCola'
import { useTitulo } from '../hooks/useTitulo'
import { descartarPendiente, obtenerRecientes, obtenerResumen, pedirDatosNuevos } from '../services/opiniones'
import type { OpinionPendiente } from '../services/types'
import { NotFoundPage } from './NotFoundPage'

function Resumen({ categoria, version, onActualizar }: { categoria: Categoria; version: number; onActualizar: () => void }) {
  const consulta = useAsync(`resumen:${categoria.id}:${version}`, () => obtenerResumen(categoria.id))
  const { cargando, error, reintentar } = consulta
  const datos = consulta.datos?.valor

  if (cargando) return <Esqueleto etiqueta="Cargando el resumen" lineas={2} />
  if (error) return <EstadoError mensaje={error.message} onReintentar={reintentar} />
  if (!datos || datos.total === 0) {
    return <p className="text-adoquin">Todavía no hay puntuaciones en este tema.</p>
  }
  return (
    <>
    <div className="grid gap-6 md:grid-cols-[auto_1fr] md:items-center md:gap-10">
      <div>
        <p className="font-display text-6xl leading-none">{formatearPromedio(datos.promedio)}</p>
        <div className="mt-2">
          <Estrellas valor={datos.promedio} />
        </div>
        <p className="mt-1 text-adoquin">
          {datos.total.toLocaleString('es-AR')} {datos.total === 1 ? 'opinión' : 'opiniones'}
        </p>
      </div>
      <Distribucion resumen={datos} />
    </div>
    {consulta.datos && (
      <div className="mt-3 border-t border-piedra pt-1">
        <Actualizado momento={consulta.datos.actualizado} onActualizar={onActualizar} />
      </div>
    )}
    </>
  )
}

function Pendientes({ pendientes }: { pendientes: OpinionPendiente[] }) {
  if (pendientes.length === 0) return null
  return (
    <ul className="mb-3 space-y-3" aria-label="Tus opiniones sin enviar">
      {pendientes.map((p) => (
        <ComentarioItem
          key={p.id}
          comentario={{ ...p, id: `pendiente-${p.id}`, fecha: p.creado }}
          estado={p.error ? 'No se pudo enviar' : 'Pendiente de envío'}
        >
          {p.error && (
            <div className="mt-2">
              <p className="font-bold text-rojo">{p.error}</p>
              <button type="button" onClick={() => void descartarPendiente(p.id)} className="boton-borde mt-2">
                Descartar
              </button>
            </div>
          )}
        </ComentarioItem>
      ))}
    </ul>
  )
}

interface PropsRecientes {
  categoria: Categoria
  opinar: string
  version: number
  hayPendientes: boolean
  /** Opiniones que se borraron en esta página: se sacan de la lista sin volver a pedirla */
  borradas: ReadonlySet<string>
  onBorrada: (id: string) => void
}

function Recientes({ categoria, opinar, version, hayPendientes, borradas, onBorrada }: PropsRecientes) {
  const { usuario } = useAuth()
  const consulta = useAsync(`recientes:${categoria.id}:${version}`, () => obtenerRecientes(categoria.id))
  const { cargando, error, reintentar } = consulta
  const datos = consulta.datos?.filter((comentario) => !borradas.has(comentario.id))

  if (cargando) return <Esqueleto etiqueta="Cargando los comentarios" />
  if (error) return <EstadoError mensaje={error.message} onReintentar={reintentar} />
  if (!datos || datos.length === 0) {
    if (hayPendientes) return null
    return (
      <EstadoVacio titulo="Todavía nadie opinó sobre este tema">
        <Link to={opinar} className="enlace">
          Sé la primera persona en hacerlo
        </Link>
      </EstadoVacio>
    )
  }
  return (
    <ul className="space-y-3">
      {datos.map((comentario) => (
        <ComentarioItem key={comentario.id} comentario={comentario}>
          {/* Solo las propias. Las viejas no tienen uid y no se pueden borrar desde la app. */}
          {usuario && comentario.uid === usuario.uid && (
            <BorrarOpinion id={comentario.id} descripcion={descripcionOpinion(comentario.fecha)} onBorrada={onBorrada} />
          )}
        </ComentarioItem>
      ))}
    </ul>
  )
}

export function CategoriaPage() {
  const { id } = useParams()
  const categoria = buscarCategoria(id)
  // Cuando la cola envía algo, `enviadas` cambia y los datos se vuelven a pedir
  const { pendientes, enviadas } = useCola()
  const [pedidas, setPedidas] = useState(0)
  const version = enviadas + pedidas
  const [borradas, setBorradas] = useState<ReadonlySet<string>>(new Set())
  const [borrados, setBorrados] = useState(0)
  const [aviso, setAviso] = useState('')
  const encabezadoRecientes = useRef<HTMLHeadingElement>(null)

  function actualizar() {
    pedirDatosNuevos()
    setPedidas((n) => n + 1)
  }

  function alBorrar(id: string) {
    setBorradas((anteriores) => new Set(anteriores).add(id))
    setAviso('Opinión borrada.')
    // Borrar cambia el total y el promedio: el resumen se vuelve a pedir. La lista solo se filtra.
    setBorrados((n) => n + 1)
    // El botón que tenía el foco desaparece con la opinión: el foco pasa al título de la lista
    encabezadoRecientes.current?.focus()
  }
  useTitulo(categoria?.nombre ?? 'Página no encontrada')

  if (!categoria) return <NotFoundPage />
  const opinar = `/opinar?categoria=${categoria.id}`
  const propios = pendientes.filter((p) => p.categoria === categoria.id)

  return (
    <div className="mx-auto max-w-3xl px-4 pt-8">
      <Link to="/" className="enlace">
        ← Todos los temas
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border-2 border-tinta bg-papel text-rojo">
            <CategoriaIcono id={categoria.id} className="h-8 w-8" />
          </span>
          <div>
            <h1 className="font-display text-4xl leading-tight">{categoria.nombre}</h1>
            <p className="text-adoquin">{categoria.descripcion}</p>
          </div>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <Link to={`/mapa?categoria=${categoria.id}`} className="boton-borde flex-1 sm:flex-none">
            Ver mapa
          </Link>
          <Link to={opinar} className="boton-primario flex-1 sm:flex-none">
            Opinar
          </Link>
        </div>
      </div>

      <section aria-labelledby="resumen" className="cartel mt-6 p-5">
        <h2 id="resumen" className="sr-only">
          Resumen de opiniones
        </h2>
        <Resumen categoria={categoria} version={version + borrados} onActualizar={actualizar} />
      </section>

      <section aria-labelledby="recientes" className="mt-8">
        <h2 id="recientes" ref={encabezadoRecientes} tabIndex={-1} className="font-display text-2xl">
          Comentarios recientes
        </h2>
        {/* Siempre montado: los lectores de pantalla solo anuncian cambios en una región que ya existe */}
        <div role="status" aria-live="polite">
          {/* La clave cambia con cada borrado: sin ella, el mismo texto dos veces seguidas no se vuelve a anunciar */}
          {aviso && (
            <p key={borradas.size} className="mt-3 font-bold text-verde">
              {aviso}
            </p>
          )}
        </div>
        <div className="mt-4">
          <Pendientes pendientes={propios} />
          <Recientes
            categoria={categoria}
            opinar={opinar}
            version={version}
            hayPendientes={propios.length > 0}
            borradas={borradas}
            onBorrada={alBorrar}
          />
        </div>
      </section>
    </div>
  )
}
