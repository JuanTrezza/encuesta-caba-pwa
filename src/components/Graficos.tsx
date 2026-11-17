// Gráficos SVG propios, sin librerías. Se dibujan al ancho real del contenedor, así el texto
// nunca se achica. Las animaciones están en index.css y solo corren sin "reducir movimiento".
import { useId, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react'

const TINTA = '#2B2622'
const ADOQUIN = '#5E564E'
const PIEDRA = '#DDD3C3'
const PAPEL = '#FFFBF3'

function useAncho(): [RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement>(null)
  const [ancho, setAncho] = useState(0)

  useLayoutEffect(() => {
    const elemento = ref.current
    if (!elemento) return
    setAncho(elemento.clientWidth)
    const observador = new ResizeObserver(([entrada]) => {
      // Un ancho 0 pasajero (por ejemplo, al ocultarse la página) no tiene que desmontar el gráfico
      const nuevo = entrada ? Math.round(entrada.contentRect.width) : 0
      if (nuevo > 0) setAncho(nuevo)
    })
    observador.observe(elemento)
    return () => observador.disconnect()
  }, [])

  return [ref, ancho]
}

/** Cartelito que sigue al cursor o al dedo. Decorativo: los mismos datos están en la tabla. */
function Cartelito({ x, y, ancho, children }: { x: number; y: number; ancho: number; children: ReactNode }) {
  const izquierda = Math.min(Math.max(x, 80), Math.max(ancho - 80, 80))
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute z-10 w-max max-w-[11rem] -translate-x-1/2 -translate-y-full rounded-md border-2 border-tinta bg-papel px-2 py-1 text-center text-sm shadow-md"
      style={{ left: izquierda, top: y - 6 }}
    >
      {children}
    </div>
  )
}

/** Gráfico más su tabla alternativa, que se muestra con el botón "Ver datos" */
export function Figura({ children, tabla, titulo }: { children: ReactNode; tabla: ReactNode; titulo: string }) {
  const id = useId()
  const [verDatos, setVerDatos] = useState(false)
  return (
    <figure>
      {children}
      <button
        type="button"
        onClick={() => setVerDatos((v) => !v)}
        aria-expanded={verDatos}
        aria-controls={id}
        // El nombre accesible dice de qué gráfico son los datos; empieza con el texto visible
        aria-label={`${verDatos ? 'Ocultar datos' : 'Ver datos'}: ${titulo}`}
        className="boton-borde mt-3 px-3 py-1 text-sm"
      >
        {verDatos ? 'Ocultar datos' : 'Ver datos'}
      </button>
      <div id={id} hidden={!verDatos} className="overflow-x-auto">
        <table className="mt-2 w-full text-left">{tabla}</table>
      </div>
    </figure>
  )
}

export interface FilaBarra {
  nombre: string
  valor: number
  /** Texto que va al final de la barra */
  rotulo: string
  /** Texto del cartelito */
  detalle: string
}

interface PropsBarras {
  filas: FilaBarra[]
  /** Resumen para lectores de pantalla */
  resumen: string
  maximo: number
  /** Marcas del eje. Sin marcas, no se dibuja el eje. */
  marcas?: number[]
  color: string
  /** Lugar reservado para el rótulo más largo */
  anchoRotulo?: number
}

const ALTO_FILA = 34
const ALTO_BARRA = 18

export function GraficoBarras({ filas, resumen, maximo, marcas = [], color, anchoRotulo = 40 }: PropsBarras) {
  const [ref, ancho] = useAncho()
  const [activa, setActiva] = useState<number | null>(null)
  const columna = Math.min(132, Math.round(ancho * 0.4))
  const util = Math.max(ancho - columna - anchoRotulo, 10)
  const altoEje = marcas.length > 0 ? 22 : 0
  const alto = filas.length * ALTO_FILA + altoEje
  const escala = (valor: number) => (Math.min(Math.max(valor, 0), maximo) / maximo) * util
  const filaActiva = activa === null ? undefined : filas[activa]

  return (
    <div ref={ref} className="relative" style={{ height: alto }} onPointerLeave={() => setActiva(null)}>
      {ancho > 0 && (
        <svg width={ancho} height={alto} role="img" aria-label={resumen} className="block">
          {marcas.map((marca) => (
            <g key={marca}>
              <line x1={columna + escala(marca)} x2={columna + escala(marca)} y1={0} y2={alto - altoEje} stroke={PIEDRA} />
              <text x={columna + escala(marca)} y={alto - 6} textAnchor="middle" fontSize="12" fill={ADOQUIN}>
                {marca}
              </text>
            </g>
          ))}
          {filas.map((fila, i) => {
            const y = i * ALTO_FILA
            const largo = Math.max(escala(fila.valor), fila.valor > 0 ? 3 : 0)
            return (
              <g key={fila.nombre} onPointerEnter={() => setActiva(i)} onPointerDown={() => setActiva(i)}>
                <rect x={0} y={y} width={ancho} height={ALTO_FILA} fill={activa === i ? PIEDRA : 'transparent'} opacity="0.45" />
                <text x={columna - 8} y={y + ALTO_FILA / 2} textAnchor="end" dominantBaseline="central" fontSize="13" fill={TINTA}>
                  {fila.nombre}
                </text>
                <rect
                  data-barra=""
                  className="grafico-barra"
                  style={{ animationDelay: `${i * 50}ms` }}
                  x={columna}
                  y={y + (ALTO_FILA - ALTO_BARRA) / 2}
                  width={largo}
                  height={ALTO_BARRA}
                  rx="4"
                  fill={color}
                />
                <text x={columna + largo + 6} y={y + ALTO_FILA / 2} dominantBaseline="central" fontSize="13" fill={TINTA}>
                  {fila.rotulo}
                </text>
              </g>
            )
          })}
        </svg>
      )}
      {filaActiva && activa !== null && (
        <Cartelito x={columna + escala(filaActiva.valor) / 2} y={activa * ALTO_FILA + 6} ancho={ancho}>
          {filaActiva.detalle}
        </Cartelito>
      )}
    </div>
  )
}

export interface PuntoLinea {
  etiqueta: string
  /** null: sin datos, la línea se corta */
  valor: number | null
  rotulo: string
  detalle: string
}

const ALTO_LINEA = 240
const MARGEN = { arriba: 16, derecha: 34, abajo: 28, izquierda: 26 }

export function GraficoLinea({ puntos, resumen, minimo, maximo }: { puntos: PuntoLinea[]; resumen: string; minimo: number; maximo: number }) {
  const [ref, ancho] = useAncho()
  const [activo, setActivo] = useState<number | null>(null)
  const util = Math.max(ancho - MARGEN.izquierda - MARGEN.derecha, 10)
  const altoUtil = ALTO_LINEA - MARGEN.arriba - MARGEN.abajo
  const paso = puntos.length > 1 ? util / (puntos.length - 1) : 0
  const x = (i: number) => MARGEN.izquierda + i * paso
  const y = (valor: number) => MARGEN.arriba + (1 - (valor - minimo) / (maximo - minimo)) * altoUtil

  // Tramos de meses seguidos con datos: donde falta un mes, la línea se corta
  const tramos: string[] = []
  let tramo: string[] = []
  puntos.forEach((punto, i) => {
    if (punto.valor === null) {
      if (tramo.length > 1) tramos.push(tramo.join(' '))
      tramo = []
    } else {
      tramo.push(`${tramo.length === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(punto.valor).toFixed(1)}`)
    }
  })
  if (tramo.length > 1) tramos.push(tramo.join(' '))

  const cadaCuantos = Math.max(1, Math.ceil(58 / Math.max(paso, 1)))
  const ultimo = puntos.reduce((indice, punto, i) => (punto.valor === null ? indice : i), -1)
  const marcas = Array.from({ length: maximo - minimo + 1 }, (_, i) => minimo + i)
  const puntoActivo = activo === null ? undefined : puntos[activo]

  function alMover(clienteX: number) {
    const caja = ref.current?.getBoundingClientRect()
    if (!caja || paso === 0) return
    const indice = Math.round((clienteX - caja.left - MARGEN.izquierda) / paso)
    setActivo(Math.min(Math.max(indice, 0), puntos.length - 1))
  }

  return (
    <div
      ref={ref}
      className="relative"
      style={{ height: ALTO_LINEA }}
      onPointerMove={(e) => alMover(e.clientX)}
      onPointerDown={(e) => alMover(e.clientX)}
      onPointerLeave={() => setActivo(null)}
    >
      {ancho > 0 && (
        <svg width={ancho} height={ALTO_LINEA} role="img" aria-label={resumen} className="block">
          {marcas.map((marca) => (
            <g key={marca}>
              <line x1={MARGEN.izquierda} x2={ancho - MARGEN.derecha} y1={y(marca)} y2={y(marca)} stroke={PIEDRA} />
              <text x={MARGEN.izquierda - 8} y={y(marca)} textAnchor="end" dominantBaseline="central" fontSize="12" fill={ADOQUIN}>
                {marca}
              </text>
            </g>
          ))}
          {puntos.map((punto, i) =>
            (puntos.length - 1 - i) % cadaCuantos === 0 ? (
              <text key={punto.etiqueta} x={x(i)} y={ALTO_LINEA - 8} textAnchor="middle" fontSize="12" fill={ADOQUIN}>
                {punto.etiqueta}
              </text>
            ) : null,
          )}
          {activo !== null && (
            <line x1={x(activo)} x2={x(activo)} y1={MARGEN.arriba} y2={ALTO_LINEA - MARGEN.abajo} stroke={ADOQUIN} strokeDasharray="3 3" />
          )}
          {tramos.map((d, i) => (
            // La clave no depende del ancho: al girar el teléfono la línea no se vuelve a animar
            <path key={i} data-tramo="" className="grafico-linea" d={d} pathLength="1" fill="none" stroke="#A92C1C" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          ))}
          {puntos.map((punto, i) =>
            punto.valor === null ? null : (
              <circle
                key={punto.etiqueta}
                data-punto=""
                className="grafico-punto"
                cx={x(i)}
                cy={y(punto.valor)}
                r={activo === i ? 6 : 4}
                fill="#A92C1C"
                stroke={PAPEL}
                strokeWidth="2"
              />
            ),
          )}
          {ultimo >= 0 && puntos[ultimo]?.valor != null && (
            <text x={x(ultimo) + 8} y={y(puntos[ultimo].valor)} dominantBaseline="central" fontSize="13" fontWeight="700" fill={TINTA}>
              {puntos[ultimo].rotulo}
            </text>
          )}
        </svg>
      )}
      {puntoActivo && activo !== null && (
        <Cartelito x={x(activo)} y={puntoActivo.valor === null ? MARGEN.arriba + 30 : y(puntoActivo.valor)} ancho={ancho}>
          <strong className="block">{puntoActivo.etiqueta}</strong>
          {puntoActivo.detalle}
        </Cartelito>
      )}
    </div>
  )
}
