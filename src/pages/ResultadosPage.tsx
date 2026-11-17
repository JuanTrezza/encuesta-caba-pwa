import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Actualizado } from '../components/Actualizado'
import { EstadoError, EstadoVacio, Esqueleto } from '../components/Estados'
import { Estrellas, formatearPromedio } from '../components/Estrellas'
import { Figura, GraficoBarras, GraficoLinea } from '../components/Graficos'
import { buscarCategoria, CATEGORIAS, type CategoriaId } from '../data/categorias'
import { useAsync } from '../hooks/useAsync'
import { useTitulo } from '../hooks/useTitulo'
import { obtenerBarrios, obtenerEvolucion, obtenerPanorama, pedirDatosNuevos } from '../services/opiniones'
import {
  MINIMO_OPINIONES,
  type Calificacion,
  type EstadisticaBarrio,
  type Panorama,
  type PuntoMensual,
} from '../services/types'

const FORMATO_MES = new Intl.DateTimeFormat('es-AR', { month: 'short', year: '2-digit' })
const FORMATO_MES_LARGO = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' })
const ESTRELLAS: readonly Calificacion[] = [5, 4, 3, 2, 1]

function fechaDelMes(mes: string): Date {
  const [anio = '1970', numero = '1'] = mes.split('-')
  return new Date(Number(anio), Number(numero) - 1, 1)
}

const opiniones = (n: number) => `${n.toLocaleString('es-AR')} ${n === 1 ? 'opinión' : 'opiniones'}`
const estrellas = (n: number) => `${n} ${n === 1 ? 'estrella' : 'estrellas'}`

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

function Encabezado({ columnas }: { columnas: [string, string, string] }) {
  return (
    <thead>
      <tr className="border-b-2 border-tinta">
        <th scope="col" className="py-2 pr-2">{columnas[0]}</th>
        <th scope="col" className="py-2 pr-2">{columnas[1]}</th>
        <th scope="col" className="whitespace-nowrap py-2 pl-2 text-right">{columnas[2]}</th>
      </tr>
    </thead>
  )
}

function General({ panorama }: { panorama: Panorama }) {
  const { general } = panorama
  const filas = ESTRELLAS.map((n) => {
    const cantidad = general.distribucion[n]
    const porcentaje = general.total ? Math.round((cantidad / general.total) * 100) : 0
    return { n, cantidad, porcentaje }
  })
  const resumen = `Distribución de estrellas sobre ${opiniones(general.total)}: ${filas
    .map((f) => `${estrellas(f.n)}, ${f.porcentaje}%`)
    .join('; ')}.`

  return (
    <div className="cartel grid gap-6 p-5 md:grid-cols-[auto_1fr] md:items-start md:gap-10">
      <div>
        <p className="font-display text-6xl leading-none">{formatearPromedio(general.promedio)}</p>
        <div className="mt-2">
          <Estrellas valor={general.promedio} />
        </div>
        <p className="mt-1 text-adoquin">{opiniones(general.total)}</p>
      </div>
      <Figura
        titulo="distribución de estrellas"
        tabla={
          <>
            <caption className="sr-only">Cantidad de opiniones por puntuación</caption>
            <Encabezado columnas={['Puntuación', 'Opiniones', 'Porcentaje']} />
            <tbody>
              {filas.map((f) => (
                <tr key={f.n} className="border-b border-piedra">
                  <th scope="row" className="py-2 pr-2 font-normal">{estrellas(f.n)}</th>
                  <td className="py-2 pr-2 tabular-nums">{f.cantidad.toLocaleString('es-AR')}</td>
                  <td className="py-2 text-right tabular-nums">{f.porcentaje}%</td>
                </tr>
              ))}
            </tbody>
          </>
        }
      >
        <GraficoBarras
          resumen={resumen}
          maximo={Math.max(...filas.map((f) => f.cantidad), 1)}
          color="#B26B00"
          anchoRotulo={78}
          filas={filas.map((f) => ({
            nombre: estrellas(f.n),
            valor: f.cantidad,
            rotulo: `${f.cantidad.toLocaleString('es-AR')} (${f.porcentaje}%)`,
            detalle: `${opiniones(f.cantidad)} con ${estrellas(f.n)}`,
          }))}
        />
      </Figura>
    </div>
  )
}

function PorTema({ panorama }: { panorama: Panorama }) {
  const filas = panorama.categorias.map((c) => ({ ...c, nombre: buscarCategoria(c.id)?.nombre ?? c.id }))
  const conDatos = filas.filter((f) => f.total > 0)
  const ordenadas = [...conDatos].sort((a, b) => b.promedio - a.promedio)
  const mejor = ordenadas[0]
  const peor = ordenadas[ordenadas.length - 1]
  const resumen =
    mejor && peor
      ? `Promedio de estrellas por tema. El más alto es ${mejor.nombre}, con ${formatearPromedio(mejor.promedio)}. El más bajo es ${peor.nombre}, con ${formatearPromedio(peor.promedio)}.`
      : 'Promedio de estrellas por tema.'

  return (
    <Figura
      titulo="promedio por tema"
      tabla={
        <>
          <caption className="sr-only">Promedio y cantidad de opiniones por tema</caption>
          <Encabezado columnas={['Tema', 'Promedio', 'Opiniones']} />
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
        </>
      }
    >
      <GraficoBarras
        resumen={resumen}
        maximo={5}
        marcas={[0, 1, 2, 3, 4, 5]}
        color="#17594A"
        filas={conDatos.map((f) => ({
          nombre: f.nombre,
          valor: f.promedio,
          rotulo: formatearPromedio(f.promedio),
          detalle: `Promedio ${formatearPromedio(f.promedio)} · ${opiniones(f.total)}`,
        }))}
      />
    </Figura>
  )
}

function Evolucion({ puntos }: { puntos: PuntoMensual[] }) {
  const conDatos = puntos.filter((p): p is PuntoMensual & { promedio: number } => p.promedio !== null)
  const primero = puntos[0]
  const ultimo = puntos[puntos.length - 1]
  const reciente = conDatos[conDatos.length - 1]
  if (!primero || !ultimo || !reciente) {
    return <EstadoVacio titulo="No hubo opiniones en los últimos 12 meses" />
  }
  const largo = (mes: string) => FORMATO_MES_LARGO.format(fechaDelMes(mes))
  const maximo = conDatos.reduce((a, b) => (b.promedio > a.promedio ? b : a))
  const minimo = conDatos.reduce((a, b) => (b.promedio < a.promedio ? b : a))
  const resumen = `Promedio de estrellas por mes, de ${largo(primero.mes)} a ${largo(ultimo.mes)}. Último mes con opiniones: ${largo(reciente.mes)}, con ${formatearPromedio(reciente.promedio)}. El más alto fue ${largo(maximo.mes)}, con ${formatearPromedio(maximo.promedio)}, y el más bajo ${largo(minimo.mes)}, con ${formatearPromedio(minimo.promedio)}.`

  return (
    <Figura
      titulo="evolución mensual"
      tabla={
        <>
          <caption className="sr-only">Promedio y cantidad de opiniones por mes</caption>
          <Encabezado columnas={['Mes', 'Promedio', 'Opiniones']} />
          <tbody>
            {puntos.map((p) => (
              <tr key={p.mes} className="border-b border-piedra">
                <th scope="row" className="py-2 pr-2 font-normal">{largo(p.mes)}</th>
                <td className="py-2 pr-2">{p.promedio === null ? 'Sin opiniones' : formatearPromedio(p.promedio)}</td>
                <td className="py-2 text-right tabular-nums">{p.total.toLocaleString('es-AR')}</td>
              </tr>
            ))}
          </tbody>
        </>
      }
    >
      <GraficoLinea
        resumen={resumen}
        minimo={1}
        maximo={5}
        puntos={puntos.map((p) => ({
          etiqueta: FORMATO_MES.format(fechaDelMes(p.mes)),
          valor: p.promedio,
          rotulo: p.promedio === null ? '' : formatearPromedio(p.promedio),
          detalle: p.promedio === null ? 'Sin opiniones' : `Promedio ${formatearPromedio(p.promedio)} · ${opiniones(p.total)}`,
        }))}
      />
    </Figura>
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

function Barrios({ version }: { version: number }) {
  const [categoria, setCategoria] = useState<CategoriaId>(CATEGORIAS[0].id)
  const { datos, cargando, error, reintentar } = useAsync(`barrios:${categoria}:${version}`, () => obtenerBarrios(categoria))

  // Mismo criterio que el mapa: solo cuentan los barrios con suficientes opiniones
  const conDatos = (datos?.valor ?? []).filter((b) => b.total >= MINIMO_OPINIONES)
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
  // Al tocar "Actualizar" cambia la versión y todas las secciones vuelven a pedir sus datos
  const [version, setVersion] = useState(0)
  const panorama = useAsync(`panorama:${version}`, obtenerPanorama)
  const evolucion = useAsync(`evolucion:${version}`, obtenerEvolucion)
  const datos = panorama.datos?.valor

  function actualizar() {
    pedirDatosNuevos()
    setVersion((v) => v + 1)
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pt-8">
      <h1 className="font-display text-4xl leading-tight">Resultados</h1>
      <p className="mt-2 text-adoquin">
        Lo que opinó quien quiso participar. No es una encuesta representativa de la ciudad.
      </p>
      {/* Alto reservado: cuando llega la fecha, el resto de la página no se mueve */}
      <div className="min-h-[44px]">
        {panorama.datos && <Actualizado momento={panorama.datos.actualizado} onActualizar={actualizar} />}
      </div>

      {panorama.cargando && (
        <div className="mt-4">
          <Esqueleto etiqueta="Cargando los resultados" lineas={4} />
        </div>
      )}
      {panorama.error && (
        <div className="mt-4">
          <EstadoError mensaje={panorama.error.message} onReintentar={panorama.reintentar} />
        </div>
      )}
      {datos && datos.general.total === 0 && (
        <div className="mt-4">
          <EstadoVacio titulo="Todavía no hay opiniones">
            <Link to="/opinar" className="enlace">
              Sé la primera persona en opinar
            </Link>
          </EstadoVacio>
        </div>
      )}

      {datos && datos.general.total > 0 && (
        <>
          <section aria-labelledby="general" className="mt-4">
            <h2 id="general" className="font-display text-2xl">
              Promedio general
            </h2>
            <div className="mt-4">
              <General panorama={datos} />
            </div>
          </section>

          <Seccion id="por-tema" titulo="Promedio por tema">
            <PorTema panorama={datos} />
          </Seccion>

          <Seccion id="evolucion" titulo="Evolución mensual">
            {evolucion.cargando && <Esqueleto etiqueta="Cargando la evolución" lineas={3} />}
            {evolucion.error && <EstadoError mensaje={evolucion.error.message} onReintentar={evolucion.reintentar} />}
            {evolucion.datos && <Evolucion puntos={evolucion.datos.valor} />}
          </Seccion>

          <Seccion id="barrios" titulo="Barrios mejor y peor puntuados">
            <Barrios version={version} />
          </Seccion>
        </>
      )}
    </div>
  )
}
