// Fachada que usan las páginas: lecturas con respaldo para cuando no hay conexión, y envío con cola.
import type { CategoriaId } from '../data/categorias'
import { agregarPendiente, listarPendientes, marcarError, migrarColaAnterior, quitarPendiente } from './cola'
import {
  esErrorDeRed,
  type Comentario,
  type EstadisticaBarrio,
  type NuevoComentario,
  type OpinionPendiente,
  type Panorama,
  type PuntoMensual,
  type ResumenCategoria,
} from './types'

// Firestore se descarga recién cuando una página pide datos o hay algo para enviar: el indicador
// de conexión usa este módulo desde el inicio, y no tiene que arrastrar el SDK.
const api = () => import('./comentarios')

// ---------- Lecturas ----------

const VIGENCIA_MS = 5 * 60_000
const PREFIJO = 'vp:respaldo:'
const memoria = new Map<string, { momento: number; promesa: Promise<unknown> }>()

function leerRespaldo<T>(clave: string): T | undefined {
  try {
    const guardado = localStorage.getItem(PREFIJO + clave)
    return guardado ? (JSON.parse(guardado) as T) : undefined
  } catch {
    return undefined
  }
}

function guardarRespaldo(clave: string, datos: unknown): void {
  try {
    localStorage.setItem(PREFIJO + clave, JSON.stringify(datos))
  } catch {
    // Sin lugar o con el almacenamiento bloqueado: se sigue sin respaldo
  }
}

/**
 * Los agregados solo los responde el servidor, nunca la caché de Firestore. Por eso se guardan acá:
 * en memoria unos minutos, para no repetir decenas de consultas al volver a una página, y en
 * localStorage, para mostrar el último valor conocido cuando no hay conexión.
 */
function conRespaldo<T>(clave: string, pedir: () => Promise<T>): Promise<T> {
  const enMemoria = memoria.get(clave)
  if (enMemoria && Date.now() - enMemoria.momento < VIGENCIA_MS) return enMemoria.promesa as Promise<T>

  const promesa = pedir().then(
    (datos) => {
      guardarRespaldo(clave, datos)
      return datos
    },
    (error: unknown) => {
      memoria.delete(clave)
      if (esErrorDeRed(error)) {
        const respaldo = leerRespaldo<T>(clave)
        if (respaldo !== undefined) return respaldo
      }
      throw error
    },
  )
  memoria.set(clave, { momento: Date.now(), promesa })
  return promesa
}

export function obtenerResumen(categoria: CategoriaId): Promise<ResumenCategoria> {
  return conRespaldo(`resumen:${categoria}`, async () => (await api()).obtenerResumen(categoria))
}

/** No pasa por el respaldo: sin conexión, Firestore responde con su propia caché */
export async function obtenerRecientes(categoria: CategoriaId): Promise<Comentario[]> {
  return (await api()).obtenerRecientes(categoria)
}

export function obtenerPanorama(): Promise<Panorama> {
  return conRespaldo('panorama', async () => (await api()).obtenerPanorama())
}

export function obtenerEvolucion(): Promise<PuntoMensual[]> {
  return conRespaldo('evolucion', async () => (await api()).obtenerEvolucion())
}

export function obtenerBarrios(categoria: CategoriaId): Promise<EstadisticaBarrio[]> {
  return conRespaldo(`barrios:${categoria}`, async () => (await api()).obtenerBarrios(categoria))
}

// ---------- Envío y cola ----------

export interface EstadoCola {
  pendientes: OpinionPendiente[]
  /** Cuántas opiniones pendientes se enviaron desde que se abrió la app */
  enviadas: number
}

type Oyente = (estado: EstadoCola) => void

const oyentes = new Set<Oyente>()
let enviadas = 0
let sincronizando = false

async function avisar(): Promise<void> {
  const estado = { pendientes: await listarPendientes(), enviadas }
  oyentes.forEach((oyente) => oyente(estado))
}

export function observarCola(oyente: Oyente): () => void {
  oyentes.add(oyente)
  void listarPendientes().then((pendientes) => {
    if (oyentes.has(oyente)) oyente({ pendientes, enviadas })
  })
  return () => oyentes.delete(oyente)
}

/** Envía la opinión. Sin conexión la deja en la cola y devuelve 'pendiente'. */
export async function enviarOpinion(nuevo: NuevoComentario, uid: string): Promise<'enviada' | 'pendiente'> {
  if (navigator.onLine) {
    try {
      await (await api()).publicarComentario(nuevo)
      memoria.clear()
      return 'enviada'
    } catch (error) {
      if (!esErrorDeRed(error)) throw error
    }
  }
  await agregarPendiente({ ...nuevo, uid, creado: new Date().toISOString() })
  await avisar()
  return 'pendiente'
}

/** Envía las opiniones pendientes de esta cuenta. La llama la app al ingresar y al volver la conexión. */
export async function sincronizarCola(uid: string): Promise<void> {
  if (sincronizando) return
  sincronizando = true
  try {
    await migrarColaAnterior(uid)
    for (const pendiente of await listarPendientes()) {
      if (pendiente.uid !== uid || pendiente.error) continue
      if (!navigator.onLine) break
      try {
        const { texto, calificacion, categoria, barrio } = pendiente
        await (await api()).publicarComentario({ texto, calificacion, categoria, ...(barrio ? { barrio } : {}) })
        await quitarPendiente(pendiente.id)
        enviadas += 1
        memoria.clear()
      } catch (error) {
        if (esErrorDeRed(error)) break
        // Rechazo definitivo (por ejemplo, de las reglas): queda a la vista para descartarla
        await marcarError(pendiente, error instanceof Error ? error.message : 'No se pudo enviar.')
      }
    }
  } finally {
    sincronizando = false
    await avisar()
  }
}

export async function descartarPendiente(id: number): Promise<void> {
  await quitarPendiente(id)
  await avisar()
}
