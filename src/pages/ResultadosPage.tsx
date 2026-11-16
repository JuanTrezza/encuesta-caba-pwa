import { lazy, Suspense, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Distribucion } from '../components/Distribucion'
import { EstadoError, EstadoVacio, Esqueleto } from '../components/Estados'
import { Estrellas, formatearPromedio } from '../components/Estrellas'
import { buscarCategoria, CATEGORIAS, type CategoriaId } from '../data/categorias'
import { useAsync } from '../hooks/useAsync'
import { useTitulo } from '../hooks/useTitulo'
import { obtenerBarrios, obtenerEvolucion, obtenerPanorama } from '../services/opiniones'
import { MINIMO_OPINIONES, type EstadisticaBarrio, type Panorama, type PuntoMensual } from '../services/types'

const GraficoTemas = lazy(() => import('../components/Graficos').then((m) => ({ default: m.GraficoTemas })))
const GraficoEvolucion = lazy(() => import('../components/Graficos').then((m) => ({ default: m.GraficoEvolucion })))

const FORMATO_MES = new Intl.DateTimeFormat('es-AR', { month: 'short', year: '2-digit' })
const FORMATO_MES_LARGO = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' })

function fechaDelMes(mes: string): Date {
  const [anio = '1970', numero = '1'] = mes.split('-')
  return new Date(Number(anio), Number(numero) - 1, 1)
}

const opiniones = (n: number) => `${n.toLocaleString('es-AR')} ${n === 1 ? 'opinión' : 'opiniones'}`

function Seccion({ id, titulo, children }: { id: string; titulo: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-10">
      <h2 id={id} className="font-display text-2xl">
        {titulo}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function TablaDatos({ resumen, children }: { resumen: string; children: ReactNode }) {
  return (
    <details className="mt-3">
      <summary className="enlace min-h-[44px] cursor-pointer py-2">{resumen}</summary>
      <div className="overflow-x-auto">
        <table className="mt-2 w-full text-left">{children}</table>
      </div>
    </details>
  )
}

function General({ panorama }: { panorama: Panorama }) {
  const { general } = panorama
  return (
    <div className="cartel grid gap-6 p-5 md:grid-cols-[auto_1fr] md:items-center md:gap-10">
      <div>
        <p className="font-display text-6xl leading-none">{formatearPromedio(general.promedio)}</p>
        <div className="mt-2">
          <Estrellas valor={general.promedio} />
        </div>
        <p className="mt-1 text-adoquin">{opiniones(general.total)}</p>
      </div>
      <Distribucion resumen={general} />
    </div>
  )
}

function PorTema({ panorama }: { panorama: Panorama }) {
  const filas = panorama.categorias.map((c) => ({ ...c, nombre: buscarCategoria(c.id)?.nombre ?? c.id }))
  return (
    <>
      <Suspense fallback={<Esqueleto etiqueta="Cargando el gráfico" lineas={3} />}>
        <GraficoTemas datos={filas.filter((f) => f.total > 0)} />
      </Suspense>
      <TablaDatos resumen="Ver los promedios por tema en una tabla">
        <caption className="sr-only">Promedio y cantidad de opiniones por tema</caption>
        <thead>
          <tr className="border-b-2 border-tinta">
            <th scope="col" className="py-2 pr-2">Tema</th>
            <th scope="col" className="py-2 pr-2">Promedio</th>
            <th scope="col" className="whitespace-nowrap py-2 pl-2 text-right">Opiniones</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.id} className="border-b border-piedra">
              <th scope="row" className="py-2 pr-2 font-normal">
                <Link to={`/categoria/${f.id}`} className="enlace">
                  {f.nombre}
                </Link>
              </th>
              <td className="py-2 pr-2">{f.total > 0 ? formatearPromedio(f.promedio) : 'Sin opiniones'}</td>
              <td className="py-2 text-right tabular-nums">{f.total.toLocaleString('es-AR')}</td>
            </tr>
          ))}
        </tbody>
      </TablaDatos>
    </>
  )
}

function Evolucion({ puntos }: { puntos: PuntoMensual[] }) {
  if (puntos.every((p) => p.total === 0)) {
    return <EstadoVacio titulo="No hubo opiniones en los últimos 12 meses" />
  }
  const datos = puntos.map((p) => ({ ...p, etiqueta: FORMATO_MES.format(fechaDelMes(p.mes)) }))
  return (
    <>
      <Suspense fallback={<Esqueleto etiqueta="Cargando el gráfico" lineas={3} />}>
        <GraficoEvolucion datos={datos} />
      </Suspense>
      <TablaDatos resumen="Ver la evolución mensual en una tabla">
        <caption className="sr-only">Promedio y cantidad de opiniones por mes</caption>
        <thead>
          <tr className="border-b-2 border-tinta">
            <th scope="col" className="py-2 pr-2">Mes</th>
            <th scope="col" className="py-2 pr-2">Promedio</th>
            <th scope="col" className="whitespace-nowrap py-2 pl-2 text-right">Opiniones</th>
          </tr>
        </thead>
        <tbody>
          {puntos.map((p) => (
            <tr key={p.mes} className="border-b border-piedra">
              <th scope="row" className="py-2 pr-2 font-normal">{FORMATO_MES_LARGO.format(fechaDelMes(p.mes))}</th>
              <td className="py-2 pr-2">{p.promedio === null ? 'Sin opiniones' : formatearPromedio(p.promedio)}</td>
              <td className="py-2 text-right tabular-nums">{p.total.toLocaleString('es-AR')}</td>
            </tr>
          ))}
        </tbody>
      </TablaDatos>
    </>
  )
}

function Ranking({ titulo, barrios }: { titulo: string; barrios: EstadisticaBarrio[] }) {
  return (
    <div className="cartel p-4">
      <h3 className="text-lg font-bold">{titulo}</h3>
      <ol className="mt-2 space-y-1">
        {barrios.map((b, i) => (
          <li key={b.barrio} className="flex items-baseline justify-between gap-2 border-b border-piedra py-1 last:border-0">
            <span>
              <span className="font-bold tabular-nums">{i + 1}.</span> {b.barrio}
            </span>
            <span className="whitespace-nowrap text-right">
              <span className="font-bold">{formatearPromedio(b.promedio)}</span>{' '}
              <span className="text-sm text-adoquin">({b.total.toLocaleString('es-AR')})</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function Barrios() {
  const [categoria, setCategoria] = useState<CategoriaId>(CATEGORIAS[0].id)
  const { datos, cargando, error, reintentar } = useAsync(`barrios:${categoria}`, () => obtenerBarrios(categoria))

  // Mismo criterio que el mapa: solo cuentan los barrios con suficientes opiniones
  const conDatos = (datos ?? []).filter((b) => b.total >= MINIMO_OPINIONES)
  const mejores = [...conDatos].sort((a, b) => b.promedio - a.promedio || b.total - a.total).slice(0, 5)
  const peores = [...conDatos]
    .filter((b) => !mejores.includes(b))
    .sort((a, b) => a.promedio - b.promedio || b.total - a.total)
    .slice(0, 5)

  return (
    <>
      <div className="max-w-xs">
        <label htmlFor="tema-barrios" className="font-bold">
          Tema
        </label>
        <select
          id="tema-barrios"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value as CategoriaId)}
          className="campo mt-1"
        >
          {CATEGORIAS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        {cargando && <Esqueleto etiqueta="Cargando los barrios" lineas={3} />}
        {error && <EstadoError mensaje={error.message} onReintentar={reintentar} />}
        {datos && mejores.length === 0 && (
          <EstadoVacio titulo={`Todavía ningún barrio tiene ${MINIMO_OPINIONES} opiniones o más en este tema`} />
        )}
        {datos && mejores.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            <Ranking titulo="Mejor puntuados" barrios={mejores} />
            {peores.length > 0 && <Ranking titulo="Peor puntuados" barrios={peores} />}
          </div>
        )}
        <p className="mt-3 text-sm text-adoquin">
          Promedio y, entre paréntesis, cantidad de opiniones. Solo entran los barrios con {MINIMO_OPINIONES} opiniones
          o más.{' '}
          <Link to={`/mapa?categoria=${categoria}`} className="enlace">
            Ver todos en el mapa
          </Link>
        </p>
      </div>
    </>
  )
}

export function ResultadosPage() {
  useTitulo('Resultados')
  const panorama = useAsync('panorama', obtenerPanorama)
  const evolucion = useAsync('evolucion', obtenerEvolucion)

  return (
    <div className="mx-auto max-w-4xl px-4 pt-8">
      <h1 className="font-display text-4xl leading-tight">Resultados</h1>
      <p className="mt-2 text-adoquin">
        Lo que opinó quien quiso participar. No es una encuesta representativa de la ciudad.
      </p>

      {panorama.cargando && (
        <div className="mt-8">
          <Esqueleto etiqueta="Cargando los resultados" lineas={4} />
        </div>
      )}
      {panorama.error && (
        <div className="mt-8">
          <EstadoError mensaje={panorama.error.message} onReintentar={panorama.reintentar} />
        </div>
      )}
      {panorama.datos && panorama.datos.general.total === 0 && (
        <div className="mt-8">
          <EstadoVacio titulo="Todavía no hay opiniones">
            <Link to="/opinar" className="enlace">
              Sé la primera persona en opinar
            </Link>
          </EstadoVacio>
        </div>
      )}

      {panorama.datos && panorama.datos.general.total > 0 && (
        <>
          <Seccion id="general" titulo="Promedio general">
            <General panorama={panorama.datos} />
          </Seccion>

          <Seccion id="por-tema" titulo="Promedio por tema">
            <PorTema panorama={panorama.datos} />
          </Seccion>

          <Seccion id="evolucion" titulo="Evolución mensual">
            {evolucion.cargando && <Esqueleto etiqueta="Cargando la evolución" lineas={3} />}
            {evolucion.error && <EstadoError mensaje={evolucion.error.message} onReintentar={evolucion.reintentar} />}
            {evolucion.datos && <Evolucion puntos={evolucion.datos} />}
          </Seccion>

          <Seccion id="barrios" titulo="Barrios mejor y peor puntuados">
            <Barrios />
          </Seccion>
        </>
      )}
    </div>
  )
}
