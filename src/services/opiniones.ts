// Fachada que usan las páginas: lecturas con caché de agregados, y envío con cola.
import type { CategoriaId } from '../data/categorias'
import { abrirBase, type AgregadoGuardado } from './base'
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

/** Dato agregado más el momento en que lo respondió el servidor */
export interface ConFecha<T> {
  valor: T
  actualizado: number
}

const VIGENCIA_MS = 30 * 60_000
const memoria = new Map<string, Promise<ConFecha<unknown>>>()
/** Lo guardado antes de este momento se vuelve a pedir, aunque no haya vencido */
let frescoDesde = 0

const vigente = (momento: number) => momento >= frescoDesde && Date.now() - momento < VIGENCIA_MS

async function leerGuardado(clave: string): Promise<AgregadoGuardado | undefined> {
  try {
    return await (await abrirBase()).get('agregados', clave)
  } catch {
    // Sin IndexedDB (por ejemplo, en modo privado de algunos navegadores) se sigue sin caché
    return undefined
  }
}

async function guardar(agregado: AgregadoGuardado): Promise<void> {
  try {
    await (await abrirBase()).put('agregados', agregado)
  } catch {
    // Sin IndexedDB no se guarda
  }
}

/**
 * Los agregados solo los responde el servidor, nunca la caché de Firestore, y una página puede necesitar
 * decenas. Por eso el último resultado se guarda en memoria y en IndexedDB, y vale 30 minutos: una recarga
 * no repite las consultas. Sin conexión se muestra lo guardado aunque esté vencido.
 */
async function conCache<T>(clave: string, pedir: () => Promise<T>): Promise<ConFecha<T>> {
  const enMemoria = await memoria.get(clave)?.catch(() => undefined)
  if (enMemoria && vigente(enMemoria.actualizado)) return enMemoria as ConFecha<T>

  const promesa = (async (): Promise<ConFecha<T>> => {
    const guardado = await leerGuardado(clave)
    if (guardado && vigente(guardado.momento)) return { valor: guardado.valor as T, actualizado: guardado.momento }
    try {
      const valor = await pedir()
      const actualizado = Date.now()
      void guardar({ clave, valor, momento: actualizado })
      return { valor, actualizado }
    } catch (error) {
      if (guardado && esErrorDeRed(error)) return { valor: guardado.valor as T, actualizado: guardado.momento }
      throw error
    }
  })()
  memoria.set(clave, promesa)
  promesa.catch(() => memoria.delete(clave))
  return promesa
}

/** Hace que la próxima lectura vaya al servidor. Lo guardado queda como respaldo para cuando no hay conexión. */
export function pedirDatosNuevos(): void {
  frescoDesde = Date.now()
  memoria.clear()
}

// Limpieza del respaldo que la versión anterior dejaba en localStorage
try {
  Object.keys(localStorage)
    .filter((clave) => clave.startsWith('vp:respaldo:'))
    .forEach((clave) => localStorage.removeItem(clave))
} catch {
  // Almacenamiento bloqueado: no hay nada que limpiar
}

export function obtenerResumen(categoria: CategoriaId): Promise<ConFecha<ResumenCategoria>> {
  return conCache(`resumen:${categoria}`, async () => (await api()).obtenerResumen(categoria))
}

/** No pasa por esta caché: sin conexión, Firestore responde con la suya */
export async function obtenerRecientes(categoria: CategoriaId): Promise<Comentario[]> {
  return (await api()).obtenerRecientes(categoria)
}

/** No pasa por la caché de agregados: es una lista propia y tiene que estar al día. Sin conexión, la caché de Firestore. */
export async function obtenerMisOpiniones(uid: string): Promise<Comentario[]> {
  return (await api()).obtenerMisOpiniones(uid)
}

/** Borra una opinión propia. Los promedios y conteos guardados dejan de valer, así que se vuelven a pedir. */
export async function borrarOpinion(id: string): Promise<void> {
  await (await api()).borrarComentario(id)
  pedirDatosNuevos()
}

export function obtenerPanorama(): Promise<ConFecha<Panorama>> {
  return conCache('panorama', async () => (await api()).obtenerPanorama())
}

export function obtenerEvolucion(): Promise<ConFecha<PuntoMensual[]>> {
  return conCache('evolucion', async () => (await api()).obtenerEvolucion())
}

export function obtenerBarrios(categoria: CategoriaId): Promise<ConFecha<EstadisticaBarrio[]>> {
  return conCache(`barrios:${categoria}`, async () => (await api()).obtenerBarrios(categoria))
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
      pedirDatosNuevos()
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
        pedirDatosNuevos()
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
