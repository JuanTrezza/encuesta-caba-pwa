import type { FeatureCollection } from 'geojson'
import { lazy, Suspense, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Actualizado } from '../components/Actualizado'
import { EstadoError, Esqueleto } from '../components/Estados'
import { formatearPromedio } from '../components/Estrellas'
import { buscarCategoria, CATEGORIAS } from '../data/categorias'
import { COLOR_SIN_DATOS, colorPorPromedio, ESCALA } from '../data/escala'
import { useAsync } from '../hooks/useAsync'
import { useTitulo } from '../hooks/useTitulo'
import { obtenerBarrios, pedirDatosNuevos } from '../services/opiniones'
import { ErrorServicio, MINIMO_OPINIONES, type EstadisticaBarrio } from '../services/types'

const MapaBarrios = lazy(() => import('../components/MapaBarrios'))

async function cargarGeo(): Promise<FeatureCollection> {
  try {
    const respuesta = await fetch(`${import.meta.env.BASE_URL}barrios.geojson`)
    if (!respuesta.ok) throw new Error(String(respuesta.status))
    return (await respuesta.json()) as FeatureCollection
  } catch {
    throw new ErrorServicio('No pudimos cargar el mapa. Los datos están en la tabla de abajo.', 'mapa')
  }
}

function Muestra({ color, punteado = false }: { color: string; punteado?: boolean }) {
  return (
    <span
      className={`inline-block h-4 w-4 shrink-0 rounded-sm border border-tinta ${punteado ? 'border-dashed' : ''}`}
      style={{ backgroundColor: color }}
      aria-hidden="true"
    />
  )
}

function Leyenda() {
  return (
    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm" aria-label="Referencias del mapa: promedio de estrellas">
      {ESCALA.map((tramo) => (
        <li key={tramo.texto} className="flex items-center gap-1.5">
          <Muestra color={tramo.color} />
          {tramo.texto}
        </li>
      ))}
      <li className="flex items-center gap-1.5">
        <Muestra color={COLOR_SIN_DATOS} punteado />
        Sin datos
      </li>
    </ul>
  )
}

function Tabla({ datos, tema }: { datos: EstadisticaBarrio[]; tema: string }) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-left">
        <caption className="sr-only">Promedio y cantidad de opiniones sobre {tema} en cada barrio</caption>
        <thead>
          <tr className="border-b-2 border-tinta">
            <th scope="col" className="py-2 pr-2">Barrio</th>
            <th scope="col" className="py-2 pr-2">Promedio</th>
            <th scope="col" className="whitespace-nowrap py-2 pl-2 text-right">Opiniones</th>
          </tr>
        </thead>
        <tbody>
          {datos.map((d) => {
            const conDatos = d.total >= MINIMO_OPINIONES
            return (
              <tr key={d.barrio} className="border-b border-piedra">
                <th scope="row" className="py-2 pr-2 font-normal">{d.barrio}</th>
                <td className="py-2 pr-2">
                  <span className="flex items-center gap-2">
                    <Muestra color={conDatos ? colorPorPromedio(d.promedio) : COLOR_SIN_DATOS} punteado={!conDatos} />
                    {conDatos ? formatearPromedio(d.promedio) : 'Sin datos'}
                  </span>
                </td>
                <td className="py-2 text-right tabular-nums">{d.total.toLocaleString('es-AR')}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function MapaPage() {
  useTitulo('Mapa de barrios')
  const [params, setParams] = useSearchParams()
  const categoria = buscarCategoria(params.get('categoria')) ?? CATEGORIAS[0]
  const [version, setVersion] = useState(0)
  const barrios = useAsync(`barrios:${categoria.id}:${version}`, () => obtenerBarrios(categoria.id))
  const datos = barrios.datos?.valor

  function actualizar() {
    pedirDatosNuevos()
    setVersion((v) => v + 1)
  }
  const geo = useAsync('geo', cargarGeo)

  return (
    <div className="mx-auto max-w-4xl px-4 pt-8">
      <h1 className="font-display text-4xl leading-tight">Mapa de barrios</h1>
      <p className="mt-2 text-adoquin">
        Promedio de estrellas por barrio, según las opiniones que indicaron de dónde son. Un barrio con menos de{' '}
        {MINIMO_OPINIONES} opiniones figura sin datos.
      </p>

      <div className="mt-5 max-w-xs">
        <label htmlFor="tema-mapa" className="font-bold">
          Tema
        </label>
        <select
          id="tema-mapa"
          value={categoria.id}
          onChange={(e) => setParams({ categoria: e.target.value }, { replace: true })}
          className="campo mt-1"
        >
          {CATEGORIAS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Alto reservado: cuando llega la fecha, el resto de la página no se mueve */}
      <div className="mt-2 min-h-[44px]">
        {barrios.datos && <Actualizado momento={barrios.datos.actualizado} onActualizar={actualizar} />}
      </div>

      {barrios.cargando && (
        <div className="mt-2">
          <Esqueleto etiqueta="Cargando los datos de los barrios" lineas={4} />
        </div>
      )}
      {barrios.error && (
        <div className="mt-2">
          <EstadoError mensaje={barrios.error.message} onReintentar={barrios.reintentar} />
        </div>
      )}

      {datos && (
        <>
          <section aria-labelledby="titulo-mapa" className="mt-2">
            <h2 id="titulo-mapa" className="font-display text-2xl">
              {categoria.nombre} en el mapa
            </h2>
            <p className="mt-1 text-sm text-adoquin">
              Tocá o pasá el cursor por un barrio para ver sus datos. La tabla de abajo tiene la misma información.
            </p>
            {/* isolate: las capas de Leaflet no tapan el menú ni los avisos */}
            <div className="relative isolate mt-3">
              {geo.error ? (
                <EstadoError mensaje={geo.error.message} onReintentar={geo.reintentar} />
              ) : geo.datos ? (
                <Suspense fallback={<Esqueleto etiqueta="Cargando el mapa" lineas={4} />}>
                  <MapaBarrios geo={geo.datos} datos={datos} clave={`${categoria.id}:${version}`} />
                </Suspense>
              ) : (
                <Esqueleto etiqueta="Cargando el mapa" lineas={4} />
              )}
            </div>
            <Leyenda />
          </section>

          <section aria-labelledby="titulo-tabla" className="mt-8">
            <h2 id="titulo-tabla" className="font-display text-2xl">
              {categoria.nombre} barrio por barrio
            </h2>
            <Tabla datos={datos} tema={categoria.nombre} />
          </section>
        </>
      )}
    </div>
  )
}
