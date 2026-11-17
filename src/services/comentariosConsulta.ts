// Lectura de `comentarios`, sin depender de la config de la app: los tests la corren contra el emulador.
import {
  average,
  count,
  getAggregateFromServer,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
  where,
  type CollectionReference,
  type DocumentData,
  type Query,
} from 'firebase/firestore'
import { BARRIOS } from '../data/barrios'
import { buscarCategoria, CATEGORIAS, type CategoriaId } from '../data/categorias'
import {
  MAX_MIS_OPINIONES,
  type Calificacion,
  type Comentario,
  type EstadisticaBarrio,
  type Panorama,
  type Promedio,
  type PuntoMensual,
  type ResumenCategoria,
} from './types'

type Coleccion = CollectionReference<DocumentData>

const ESTRELLAS: readonly Calificacion[] = [1, 2, 3, 4, 5]

/** Los documentos nuevos guardan un Timestamp y los viejos un string ISO. La app siempre recibe ISO. */
export function normalizarFecha(valor: unknown): string | null {
  const conversor = (valor as { toDate?: unknown } | null | undefined)?.toDate
  const fecha =
    typeof conversor === 'function'
      ? (valor as Timestamp).toDate()
      : typeof valor === 'string'
        ? new Date(valor)
        : null
  return fecha && !Number.isNaN(fecha.getTime()) ? fecha.toISOString() : null
}

function esCalificacion(valor: unknown): valor is Calificacion {
  return valor === 1 || valor === 2 || valor === 3 || valor === 4 || valor === 5
}

/** Los documentos viejos no tienen validación garantizada: se descarta lo que no se puede mostrar */
export function parsearComentario(id: string, datos: DocumentData): Comentario | null {
  const { texto, calificacion, categoria, barrio, uid } = datos
  const fecha = normalizarFecha(datos.fecha)
  const cat = buscarCategoria(typeof categoria === 'string' ? categoria : null)
  if (typeof texto !== 'string' || !esCalificacion(calificacion) || !fecha || !cat) return null
  return {
    id,
    texto,
    calificacion,
    fecha,
    categoria: cat.id,
    ...(typeof barrio === 'string' && barrio ? { barrio } : {}),
    ...(typeof uid === 'string' && uid ? { uid } : {}),
  }
}

/**
 * Las opiniones de una cuenta, de la más nueva a la más vieja. Usa el índice uid ASC + fecha DESC.
 * Solo las nuevas tienen uid, y las reglas obligan a que su fecha sea un Timestamp del servidor, así que
 * acá alcanza con un solo orderBy: no se mezclan los dos formatos de fecha de las opiniones viejas.
 */
export async function consultarMisOpiniones(
  coleccion: Coleccion,
  uid: string,
  cantidad = MAX_MIS_OPINIONES,
): Promise<Comentario[]> {
  const resultado = await getDocs(query(coleccion, where('uid', '==', uid), orderBy('fecha', 'desc'), limit(cantidad)))
  return resultado.docs.flatMap((d) => parsearComentario(d.id, d.data({ serverTimestamps: 'estimate' })) ?? [])
}

/**
 * Firestore ordena por tipo antes que por valor, y los strings van después de los Timestamp. Con un solo
 * orderBy('fecha', 'desc'), los documentos viejos taparían a los nuevos para siempre. Por eso se pide
 * cada formato por separado (un filtro de rango solo devuelve valores de su mismo tipo) y se mezclan acá.
 * Las dos consultas usan el índice categoria ASC + fecha DESC de firestore.indexes.json.
 */
export async function consultarRecientes(
  coleccion: Coleccion,
  categoria: CategoriaId,
  cantidad: number,
): Promise<Comentario[]> {
  const desde = [Timestamp.fromMillis(0), '']
  const resultados = await Promise.all(
    desde.map((inicio) =>
      getDocs(
        query(
          coleccion,
          where('categoria', '==', categoria),
          where('fecha', '>=', inicio),
          orderBy('fecha', 'desc'),
          limit(cantidad),
        ),
      ),
    ),
  )
  return resultados
    .flatMap((resultado) => resultado.docs)
    .flatMap((d) => parsearComentario(d.id, d.data({ serverTimestamps: 'estimate' })) ?? [])
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, cantidad)
}

// ---------- Agregados: los calcula el servidor, sin descargar los documentos ----------

async function contar(consulta: Query<DocumentData>): Promise<number> {
  return (await getCountFromServer(consulta)).data().count
}

/** Cantidad y promedio de estrellas en una sola consulta agregada */
async function promediar(consulta: Query<DocumentData>): Promise<Promedio> {
  const datos = (await getAggregateFromServer(consulta, { total: count(), promedio: average('calificacion') })).data()
  return { total: datos.total, promedio: datos.promedio ?? 0 }
}

function armarResumen(cantidades: number[]): ResumenCategoria {
  const [c1 = 0, c2 = 0, c3 = 0, c4 = 0, c5 = 0] = cantidades
  const total = c1 + c2 + c3 + c4 + c5
  const suma = c1 + c2 * 2 + c3 * 3 + c4 * 4 + c5 * 5
  return { total, promedio: total ? suma / total : 0, distribucion: { 1: c1, 2: c2, 3: c3, 4: c4, 5: c5 } }
}

/** 5 conteos con igualdades: Firestore combina los índices automáticos */
export async function consultarResumen(coleccion: Coleccion, categoria: CategoriaId): Promise<ResumenCategoria> {
  return armarResumen(
    await Promise.all(
      ESTRELLAS.map((n) => contar(query(coleccion, where('categoria', '==', categoria), where('calificacion', '==', n)))),
    ),
  )
}

/** Distribución general (5 conteos) y promedio por categoría (7 agregados, índice categoria + calificacion) */
export async function consultarPanorama(coleccion: Coleccion): Promise<Panorama> {
  const [cantidades, categorias] = await Promise.all([
    Promise.all(ESTRELLAS.map((n) => contar(query(coleccion, where('calificacion', '==', n))))),
    Promise.all(
      CATEGORIAS.map(async ({ id }) => ({
        id,
        ...(await promediar(query(coleccion, where('categoria', '==', id)))),
      })),
    ),
  ])
  return { general: armarResumen(cantidades), categorias }
}

export function mesesHasta(ahora: Date, cantidad: number): { mes: string; inicio: Date; fin: Date }[] {
  return Array.from({ length: cantidad }, (_, i) => {
    const inicio = new Date(ahora.getFullYear(), ahora.getMonth() - (cantidad - 1 - i), 1)
    const fin = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 1)
    return { mes: `${inicio.getFullYear()}-${String(inicio.getMonth() + 1).padStart(2, '0')}`, inicio, fin }
  })
}

/**
 * Un agregado por mes sobre las fechas Timestamp (índice fecha + calificacion). Los documentos viejos
 * guardan la fecha como string: solo si hay alguno dentro del período se suma un agregado más por mes.
 */
export async function consultarEvolucion(coleccion: Coleccion, cantidad = 12, ahora = new Date()): Promise<PuntoMensual[]> {
  const meses = mesesHasta(ahora, cantidad)
  const primero = meses[0]
  if (!primero) return []
  const hayViejos = (await contar(query(coleccion, where('fecha', '>=', primero.inicio.toISOString())))) > 0

  return Promise.all(
    meses.map(async ({ mes, inicio, fin }) => {
      const rangos: [Timestamp | string, Timestamp | string][] = [[Timestamp.fromDate(inicio), Timestamp.fromDate(fin)]]
      if (hayViejos) rangos.push([inicio.toISOString(), fin.toISOString()])
      const partes = await Promise.all(
        rangos.map(([desde, hasta]) =>
          promediar(query(coleccion, where('fecha', '>=', desde), where('fecha', '<', hasta))),
        ),
      )
      const total = partes.reduce((suma, parte) => suma + parte.total, 0)
      const estrellas = partes.reduce((suma, parte) => suma + parte.total * parte.promedio, 0)
      return { mes, total, promedio: total ? estrellas / total : null }
    }),
  )
}

/** Un agregado por barrio (48 por categoría; índice categoria + barrio + calificacion) */
export function consultarBarrios(coleccion: Coleccion, categoria: CategoriaId): Promise<EstadisticaBarrio[]> {
  return Promise.all(
    BARRIOS.map(async (barrio) => ({
      barrio,
      ...(await promediar(query(coleccion, where('categoria', '==', categoria), where('barrio', '==', barrio)))),
    })),
  )
}
