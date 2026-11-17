// Cola de opiniones escritas sin conexión. Vive en IndexedDB, así sobrevive a cerrar la app.
import { deleteDB, openDB } from 'idb'
import { BARRIOS } from '../data/barrios'
import { buscarCategoria } from '../data/categorias'
import { abrirBase as abrir } from './base'
import { MAX_COMENTARIO, type Calificacion, type OpinionPendiente } from './types'

const BASE_ANTERIOR = 'EncuestasCABA'

export async function agregarPendiente(opinion: Omit<OpinionPendiente, 'id'>): Promise<void> {
  // El id lo asigna IndexedDB
  await (await abrir()).add('pendientes', opinion as OpinionPendiente)
}

export async function listarPendientes(): Promise<OpinionPendiente[]> {
  return (await abrir()).getAll('pendientes')
}

export async function quitarPendiente(id: number): Promise<void> {
  await (await abrir()).delete('pendientes', id)
}

export async function marcarError(pendiente: OpinionPendiente, error: string): Promise<void> {
  await (await abrir()).put('pendientes', { ...pendiente, error })
}

/**
 * El sitio anterior guardaba sus pendientes en otra base, sin uid. Se pasan una sola vez a la cola nueva,
 * a nombre de quien ingresa en este dispositivo, y la base anterior se borra.
 */
export async function migrarColaAnterior(uid: string): Promise<void> {
  if (typeof indexedDB.databases !== 'function') return
  if (!(await indexedDB.databases()).some((b) => b.name === BASE_ANTERIOR)) return

  const anterior = await openDB(BASE_ANTERIOR)
  try {
    if (anterior.objectStoreNames.contains('pendientes')) {
      for (const dato of (await anterior.getAll('pendientes')) as Record<string, unknown>[]) {
        const texto = typeof dato.texto === 'string' ? dato.texto.trim() : ''
        const categoria = buscarCategoria(typeof dato.categoria === 'string' ? dato.categoria : null)
        const calificacion = dato.calificacion
        if (!texto || texto.length > MAX_COMENTARIO || !categoria) continue
        if (typeof calificacion !== 'number' || ![1, 2, 3, 4, 5].includes(calificacion)) continue
        const barrio = BARRIOS.find((b) => b === dato.barrio)
        await agregarPendiente({
          uid,
          texto,
          calificacion: calificacion as Calificacion,
          categoria: categoria.id,
          creado: typeof dato.fecha === 'string' ? dato.fecha : new Date().toISOString(),
          ...(barrio ? { barrio } : {}),
        })
      }
    }
  } finally {
    anterior.close()
  }
  await deleteDB(BASE_ANTERIOR)
}
