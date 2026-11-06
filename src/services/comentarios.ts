import { getAuth } from 'firebase/auth'
import {
  addDoc,
  collection,
  getCountFromServer,
  getFirestore,
  query,
  serverTimestamp,
  where,
  type CollectionReference,
  type DocumentData,
} from 'firebase/firestore'
import type { CategoriaId } from '../data/categorias'
import { consultarRecientes } from './comentariosConsulta'
import { obtenerApp } from './firebase'
import { ErrorServicio, type Calificacion, type Comentario, type NuevoComentario, type ResumenCategoria } from './types'

const ESTRELLAS: readonly Calificacion[] = [1, 2, 3, 4, 5]

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
  return collection(getFirestore(obtenerApp()), 'comentarios')
}

/**
 * Cuenta por estrellas con agregaciones del servidor: no descarga los documentos.
 * Son solo igualdades, así que Firestore combina los índices automáticos y no pide uno compuesto.
 */
export async function obtenerResumen(categoria: CategoriaId): Promise<ResumenCategoria> {
  try {
    const col = coleccion()
    const cantidades = await Promise.all(
      ESTRELLAS.map(async (estrellas) => {
        const q = query(col, where('categoria', '==', categoria), where('calificacion', '==', estrellas))
        return (await getCountFromServer(q)).data().count
      }),
    )
    const [c1 = 0, c2 = 0, c3 = 0, c4 = 0, c5 = 0] = cantidades
    const total = c1 + c2 + c3 + c4 + c5
    const suma = c1 + c2 * 2 + c3 * 3 + c4 * 4 + c5 * 5
    return { total, promedio: total ? suma / total : 0, distribucion: { 1: c1, 2: c2, 3: c3, 4: c4, 5: c5 } }
  } catch (error) {
    throw traducir(error)
  }
}

export async function obtenerRecientes(categoria: CategoriaId, cantidad = 10): Promise<Comentario[]> {
  try {
    return await consultarRecientes(coleccion(), categoria, cantidad)
  } catch (error) {
    throw traducir(error)
  }
}

/** Guarda solo el uid: el nombre y el mail del usuario no van en el documento, que es de lectura pública */
export async function publicarComentario({ texto, calificacion, categoria, barrio }: NuevoComentario): Promise<void> {
  // Sin conexión, addDoc queda esperando para siempre. La cola offline llega en una etapa posterior.
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
