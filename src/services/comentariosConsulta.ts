// Lectura de `comentarios`, sin depender de la config de la app: los tests la corren contra el emulador.
import {
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
  where,
  type CollectionReference,
  type DocumentData,
} from 'firebase/firestore'
import { buscarCategoria, type CategoriaId } from '../data/categorias'
import type { Calificacion, Comentario } from './types'

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
  const { texto, calificacion, categoria, barrio } = datos
  const fecha = normalizarFecha(datos.fecha)
  const cat = buscarCategoria(typeof categoria === 'string' ? categoria : null)
  if (typeof texto !== 'string' || !esCalificacion(calificacion) || !fecha || !cat) return null
  // `uid` queda afuera a propósito: la interfaz no lo necesita
  return {
    id,
    texto,
    calificacion,
    fecha,
    categoria: cat.id,
    ...(typeof barrio === 'string' && barrio ? { barrio } : {}),
  }
}

/**
 * Firestore ordena por tipo antes que por valor, y los strings van después de los Timestamp. Con un solo
 * orderBy('fecha', 'desc'), los documentos viejos taparían a los nuevos para siempre. Por eso se pide
 * cada formato por separado (un filtro de rango solo devuelve valores de su mismo tipo) y se mezclan acá.
 * Las dos consultas usan el índice categoria ASC + fecha DESC de firestore.indexes.json.
 */
export async function consultarRecientes(
  coleccion: CollectionReference<DocumentData>,
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
