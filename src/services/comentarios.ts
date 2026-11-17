// Acceso a Firestore. Las páginas no importan este módulo: usan services/opiniones.ts.
import { getAuth } from 'firebase/auth'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  type CollectionReference,
  type DocumentData,
} from 'firebase/firestore'
import type { CategoriaId } from '../data/categorias'
import {
  consultarBarrios,
  consultarEvolucion,
  consultarMisOpiniones,
  consultarPanorama,
  consultarRecientes,
  consultarResumen,
} from './comentariosConsulta'
import { obtenerApp } from './firebase'
import { obtenerDb } from './firestore'
import {
  ErrorServicio,
  type Comentario,
  type EstadisticaBarrio,
  type NuevoComentario,
  type Panorama,
  type PuntoMensual,
  type ResumenCategoria,
} from './types'

const MENSAJES: Record<string, string> = {
  'permission-denied': 'No tenés permiso para hacer esto. Probá volver a ingresar.',
  unauthenticated: 'Tu sesión venció. Volvé a ingresar.',
  unavailable: 'No pudimos conectarnos. Revisá tu internet y volvé a intentar.',
  'resource-exhausted': 'Estamos recibiendo muchas consultas. Probá en un rato.',
}

function traducir(error: unknown): ErrorServicio {
  if (error instanceof ErrorServicio) return error
  const codigo = (error as { code?: string } | null)?.code ?? 'desconocido'
  // Por ejemplo, un índice faltante: el SDK deja en el mensaje el link para crearlo
  if (!MENSAJES[codigo]) console.error(error)
  return new ErrorServicio(MENSAJES[codigo] ?? 'Algo salió mal. Volvé a intentar.', codigo)
}

function coleccion(): CollectionReference<DocumentData> {
  return collection(obtenerDb(), 'comentarios')
}

async function pedir<T>(consulta: (col: CollectionReference<DocumentData>) => Promise<T>): Promise<T> {
  try {
    return await consulta(coleccion())
  } catch (error) {
    throw traducir(error)
  }
}

export function obtenerResumen(categoria: CategoriaId): Promise<ResumenCategoria> {
  return pedir((col) => consultarResumen(col, categoria))
}

/** Sin conexión responde con lo que haya en la caché local de Firestore */
export function obtenerRecientes(categoria: CategoriaId, cantidad = 10): Promise<Comentario[]> {
  return pedir((col) => consultarRecientes(col, categoria, cantidad))
}

export function obtenerPanorama(): Promise<Panorama> {
  return pedir(consultarPanorama)
}

export function obtenerEvolucion(): Promise<PuntoMensual[]> {
  return pedir((col) => consultarEvolucion(col))
}

export function obtenerBarrios(categoria: CategoriaId): Promise<EstadisticaBarrio[]> {
  return pedir((col) => consultarBarrios(col, categoria))
}

/** Las opiniones de una cuenta. Sin conexión responde con lo que haya en la caché local de Firestore. */
export function obtenerMisOpiniones(uid: string): Promise<Comentario[]> {
  return pedir((col) => consultarMisOpiniones(col, uid))
}

/**
 * Borra una opinión. Las reglas solo lo permiten a quien la escribió, y no a las viejas, que no tienen uid.
 * Un borrado hecho sin conexión no se encola: quedaría esperando al servidor sin que la persona lo sepa.
 */
export async function borrarComentario(id: string): Promise<void> {
  if (!navigator.onLine) throw new ErrorServicio('Estás sin conexión. No pudimos borrar tu opinión.', 'sin-conexion')
  try {
    await deleteDoc(doc(coleccion(), id))
  } catch (error) {
    const traducido = traducir(error)
    // También responde esto una opinión que ya no existe (por ejemplo, borrada desde otra pestaña)
    if (traducido.codigo === 'permission-denied') {
      throw new ErrorServicio('No pudimos borrar esta opinión. Puede que ya no exista o que no sea tuya.', 'permission-denied')
    }
    throw traducido
  }
}

/**
 * Guarda solo el uid: el nombre y el mail del usuario no van en el documento, que es de lectura pública.
 * La fecha la pone el servidor en el momento del envío.
 */
export async function publicarComentario({ texto, calificacion, categoria, barrio }: NuevoComentario): Promise<void> {
  // Sin conexión, addDoc queda esperando: la cola de services/opiniones.ts evita llegar acá en ese caso
  if (!navigator.onLine) throw new ErrorServicio('Estás sin conexión. Tu opinión no se envió.', 'sin-conexion')
  try {
    const uid = getAuth(obtenerApp()).currentUser?.uid
    if (!uid) throw new ErrorServicio('Tu sesión venció. Volvé a ingresar.', 'unauthenticated')
    await addDoc(coleccion(), {
      uid,
      fecha: serverTimestamp(),
      texto,
      calificacion,
      categoria,
      ...(barrio ? { barrio } : {}),
    })
  } catch (error) {
    throw traducir(error)
  }
}
