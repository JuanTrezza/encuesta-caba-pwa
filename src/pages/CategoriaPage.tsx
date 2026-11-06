import { Link, useParams } from 'react-router-dom'
import { CategoriaIcono } from '../components/CategoriaIcono'
import { ComentarioItem } from '../components/ComentarioItem'
import { Distribucion } from '../components/Distribucion'
import { EstadoError, EstadoVacio, Esqueleto } from '../components/Estados'
import { Estrellas, formatearPromedio } from '../components/Estrellas'
import { buscarCategoria, type Categoria } from '../data/categorias'
import { useAsync } from '../hooks/useAsync'
import { useTitulo } from '../hooks/useTitulo'
import { obtenerRecientes, obtenerResumen } from '../services/comentarios'
import { NotFoundPage } from './NotFoundPage'

function Resumen({ categoria }: { categoria: Categoria }) {
  const { datos, cargando, error, reintentar } = useAsync(`resumen:${categoria.id}`, () => obtenerResumen(categoria.id))

  if (cargando) return <Esqueleto etiqueta="Cargando el resumen" lineas={2} />
  if (error) return <EstadoError mensaje={error.message} onReintentar={reintentar} />
  if (!datos || datos.total === 0) {
    return <p className="text-adoquin">Todavía no hay puntuaciones en este tema.</p>
  }
  return (
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
  )
}

function Recientes({ categoria, opinar }: { categoria: Categoria; opinar: string }) {
  const { datos, cargando, error, reintentar } = useAsync(`recientes:${categoria.id}`, () =>
    obtenerRecientes(categoria.id),
  )

  if (cargando) return <Esqueleto etiqueta="Cargando los comentarios" />
  if (error) return <EstadoError mensaje={error.message} onReintentar={reintentar} />
  if (!datos || datos.length === 0) {
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
        <ComentarioItem key={comentario.id} comentario={comentario} />
      ))}
    </ul>
  )
}

export function CategoriaPage() {
  const { id } = useParams()
  const categoria = buscarCategoria(id)
  useTitulo(categoria?.nombre ?? 'Página no encontrada')

  if (!categoria) return <NotFoundPage />
  const opinar = `/opinar?categoria=${categoria.id}`

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
        <Link to={opinar} className="boton-primario w-full sm:w-auto">
          Opinar
        </Link>
      </div>

      <section aria-labelledby="resumen" className="cartel mt-6 p-5">
        <h2 id="resumen" className="sr-only">
          Resumen de opiniones
        </h2>
        <Resumen categoria={categoria} />
      </section>

      <section aria-labelledby="recientes" className="mt-8">
        <h2 id="recientes" className="font-display text-2xl">
          Comentarios recientes
        </h2>
        <div className="mt-4">
          <Recientes categoria={categoria} opinar={opinar} />
        </div>
      </section>
    </div>
  )
}
