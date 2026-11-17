// Reemplaza a src/services/comentarios.ts en el build --mode e2e. `contrato` hace que tsc falle si se desalinean.
import { BARRIOS } from '../../src/data/barrios'
import { CATEGORIAS, type CategoriaId } from '../../src/data/categorias'
import type * as Real from '../../src/services/comentarios'
import {
  ErrorServicio,
  type Comentario,
  type EstadisticaBarrio,
  type NuevoComentario,
  type Panorama,
  type PuntoMensual,
  type ResumenCategoria,
} from '../../src/services/types'
import { escenario, esperar } from './escenario'

const SIN_RED = 'No pudimos conectarnos. Revisá tu internet y volvé a intentar.'
const DISTRIBUCION = { 1: 3, 2: 5, 3: 12, 4: 40, 5: 68 }
const RESUMEN: ResumenCategoria = { total: 128, promedio: (3 + 10 + 36 + 160 + 340) / 128, distribucion: DISTRIBUCION }
const VACIO: ResumenCategoria = { total: 0, promedio: 0, distribucion: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } }

async function preparar(): Promise<void> {
  const e = escenario()
  await esperar(e.datos === 'lento' ? 60_000 : 30)
  if (e.errorUnaVez || e.datos === 'error') throw new ErrorServicio(SIN_RED, 'unavailable')
}

/** Igual que en Firestore: los agregados solo los responde el servidor */
async function prepararAgregado(): Promise<void> {
  // Sobrevive a una recarga: los tests lo usan para saber si se volvió a consultar
  sessionStorage.setItem('vp-consultas', String(Number(sessionStorage.getItem('vp-consultas') ?? 0) + 1))
  await preparar()
  if (!navigator.onLine) throw new ErrorServicio(SIN_RED, 'unavailable')
}

export async function obtenerResumen(_categoria: CategoriaId): Promise<ResumenCategoria> {
  await prepararAgregado()
  return escenario().datos === 'vacio' ? VACIO : RESUMEN
}

/** La cuenta de prueba de los tests (USUARIO en app.spec.ts) */
const UID_PROPIO = 'u1'

/** Opiniones que ya tenía esa cuenta antes de la sesión de prueba */
const MIAS: Comentario[] = [
  {
    id: 'mia-1',
    uid: UID_PROPIO,
    texto: 'La escalera mecánica de la estación Pasco hace meses que no anda.',
    calificacion: 2,
    fecha: '2026-10-28T13:00:00.000Z',
    categoria: 'subte',
    barrio: 'Balvanera',
  },
  {
    id: 'mia-2',
    uid: UID_PROPIO,
    texto: 'Faltan tachos de basura en la plaza.',
    calificacion: 3,
    fecha: '2026-09-02T10:00:00.000Z',
    categoria: 'limpieza',
  },
]

const estaBorrada = (id: string) => (escenario().borrados ?? []).includes(id)

/** Lo que se publicó durante la sesión de prueba, con el uid de quien estaba ingresado */
function publicadas(): Comentario[] {
  const uid = escenario().usuario?.uid ?? UID_PROPIO
  return ((escenario().publicados ?? []) as NuevoComentario[]).map((p, i) => ({
    ...p,
    uid,
    id: `publicado-${i}`,
    fecha: '2026-11-01T12:00:00.000Z',
  }))
}

/** Igual que en Firestore con caché persistente: sin conexión devuelve lo que ya tenía */
export async function obtenerRecientes(categoria: CategoriaId): Promise<Comentario[]> {
  await preparar()
  if (escenario().datos === 'vacio') return []
  const publicados = publicadas().filter((p) => p.categoria === categoria)
  const lista: Comentario[] = [
    ...publicados,
    {
      // Una opinión de la cuenta de prueba: la única de la lista que puede borrar
      id: 'nuevo',
      uid: UID_PROPIO,
      texto: 'Pasan seguido, pero a la hora pico no se puede ni subir.',
      calificacion: 4,
      fecha: '2026-10-20T15:30:00.000Z',
      categoria,
      barrio: 'Villa General Mitre',
    },
    {
      // Documento viejo: sin barrio
      id: 'legacy',
      texto: 'Comentario guardado por la app anterior.',
      calificacion: 2,
      fecha: '2025-07-17T12:00:00.000Z',
      categoria,
    },
    {
      id: 'html',
      texto: '<img src=x onerror="window.__xss=1"> Unapalabramuylargaqueseguramenterompeelanchodelatarjetasinoestamanejadacomocorrespondeenunapantallachica',
      calificacion: 1,
      fecha: '2025-07-02T12:00:00.000Z',
      categoria,
    },
  ]
  return lista.filter((comentario) => !estaBorrada(comentario.id))
}

/** Lo mismo que hace la consulta real: solo las de esa cuenta, de la más nueva a la más vieja */
export async function obtenerMisOpiniones(uid: string): Promise<Comentario[]> {
  await preparar()
  if (escenario().datos === 'vacio') return []
  return [...publicadas(), ...MIAS]
    .filter((opinion) => opinion.uid === uid && !estaBorrada(opinion.id))
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
}

export async function borrarComentario(id: string): Promise<void> {
  const e = escenario()
  await esperar()
  if (!navigator.onLine) throw new ErrorServicio('Estás sin conexión. No pudimos borrar tu opinión.', 'sin-conexion')
  if (e.borrado === 'error') {
    throw new ErrorServicio('No pudimos borrar esta opinión. Puede que ya no exista o que no sea tuya.', 'permission-denied')
  }
  ;(e.borrados ??= []).push(id)
}

export async function obtenerPanorama(): Promise<Panorama> {
  await prepararAgregado()
  if (escenario().datos === 'vacio') return { general: VACIO, categorias: CATEGORIAS.map(({ id }) => ({ id, total: 0, promedio: 0 })) }
  return {
    general: RESUMEN,
    // "eventos" queda sin opiniones para probar ese caso
    categorias: CATEGORIAS.map(({ id }, i) => (id === 'eventos' ? { id, total: 0, promedio: 0 } : { id, total: 10 + i * 4, promedio: 2.4 + i * 0.4 })),
  }
}

export async function obtenerEvolucion(): Promise<PuntoMensual[]> {
  await prepararAgregado()
  return Array.from({ length: 12 }, (_, i) => {
    const mes = `${i < 1 ? 2025 : 2026}-${String(((i + 11) % 12) + 1).padStart(2, '0')}`
    // Dos meses sin opiniones: la línea tiene que cortarse ahí
    return i === 3 || i === 4 ? { mes, total: 0, promedio: null } : { mes, total: 4 + i * 2, promedio: 3 + ((i * 7) % 15) / 10 }
  })
}

export async function obtenerBarrios(_categoria: CategoriaId): Promise<EstadisticaBarrio[]> {
  await prepararAgregado()
  // Cubre los cinco tramos de la escala y deja varios barrios sin datos suficientes
  return BARRIOS.map((barrio, i) =>
    i % 6 === 0 ? { barrio, total: i % 12 === 0 ? 0 : 2, promedio: i % 12 === 0 ? 0 : 5 } : { barrio, total: 3 + i, promedio: 1 + ((i * 37) % 41) / 10 },
  )
}

export async function publicarComentario(nuevo: NuevoComentario): Promise<void> {
  const e = escenario()
  await esperar()
  if (!navigator.onLine) throw new ErrorServicio('Estás sin conexión. Tu opinión no se envió.', 'sin-conexion')
  if (e.envio === 'error') throw new ErrorServicio('No tenés permiso para hacer esto. Probá volver a ingresar.', 'permission-denied')
  ;(e.publicados ??= []).push(nuevo)
}

export const contrato = {
  obtenerResumen,
  obtenerRecientes,
  obtenerPanorama,
  obtenerEvolucion,
  obtenerBarrios,
  obtenerMisOpiniones,
  borrarComentario,
  publicarComentario,
} satisfies typeof Real
