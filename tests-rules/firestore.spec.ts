import { readFileSync } from 'node:fs'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestContext,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { expect, test } from '@playwright/test'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  type CollectionReference,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore'
import { BARRIOS } from '../src/data/barrios'
import { CATEGORIAS } from '../src/data/categorias'
import {
  consultarBarrios,
  consultarEvolucion,
  consultarMisOpiniones,
  consultarPanorama,
  consultarRecientes,
  consultarResumen,
  normalizarFecha,
  parsearComentario,
} from '../src/services/comentariosConsulta'

const UID = 'vecina'

let entorno: RulesTestEnvironment

const base = (db: Firestore): CollectionReference<DocumentData> => collection(db, 'comentarios')
const contexto = (ctx: RulesTestContext) => ctx.firestore() as unknown as Firestore
const logueado = (uid = UID) => contexto(entorno.authenticatedContext(uid))
const anonimo = () => contexto(entorno.unauthenticatedContext())

function opinion(cambios: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    uid: UID,
    fecha: serverTimestamp(),
    texto: 'Faltan rampas en la esquina.',
    calificacion: 4,
    categoria: 'accesibilidad',
    barrio: 'Boedo',
    ...cambios,
  }
}

function sin(campo: string): Record<string, unknown> {
  const { [campo]: _quitado, ...resto } = opinion()
  return resto
}

/** Carga un documento sin pasar por las reglas, como los que ya existen en producción */
async function sembrar(id: string, datos: Record<string, unknown>): Promise<void> {
  await entorno.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(contexto(ctx), 'comentarios', id), datos)
  })
}

const VIEJO = {
  texto: 'Comentario de la app anterior',
  calificacion: 3,
  categoria: 'subte',
  fecha: '2025-07-17T12:00:00.000Z',
}

test.beforeAll(async () => {
  entorno = await initializeTestEnvironment({
    projectId: 'demo-voz-portena',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  })
})

test.afterAll(async () => {
  await entorno.cleanup()
})

test.beforeEach(async () => {
  await entorno.clearFirestore()
})

test.describe('crear', () => {
  test('anónimo no puede escribir', async () => {
    await assertFails(addDoc(base(anonimo()), opinion()))
  })

  test('logueado escribe con su uid', async () => {
    await assertSucceeds(addDoc(base(logueado()), opinion()))
  })

  test('el barrio es opcional', async () => {
    await assertSucceeds(addDoc(base(logueado()), sin('barrio')))
  })

  test('no puede escribir con el uid de otro', async () => {
    await assertFails(addDoc(base(logueado()), opinion({ uid: 'otra-persona' })))
  })

  for (const campo of ['uid', 'fecha', 'texto', 'calificacion', 'categoria']) {
    test(`rechaza si falta ${campo}`, async () => {
      await assertFails(addDoc(base(logueado()), sin(campo)))
    })
  }

  test('no puede mandar una fecha falsa', async () => {
    const col = base(logueado())
    await assertFails(addDoc(col, opinion({ fecha: Timestamp.fromMillis(Date.now()) })))
    await assertFails(addDoc(col, opinion({ fecha: Timestamp.fromDate(new Date('2020-01-01')) })))
    await assertFails(addDoc(col, opinion({ fecha: new Date().toISOString() })))
  })

  for (const calificacion of [0, 6, 3.5, '4']) {
    test(`rechaza la calificación ${JSON.stringify(calificacion)}`, async () => {
      await assertFails(addDoc(base(logueado()), opinion({ calificacion })))
    })
  }

  test('acepta las calificaciones de 1 a 5', async () => {
    for (const calificacion of [1, 2, 3, 4, 5]) {
      await assertSucceeds(addDoc(base(logueado()), opinion({ calificacion })))
    }
  })

  test('categoría inválida rechazada', async () => {
    await assertFails(addDoc(base(logueado()), opinion({ categoria: 'inventada' })))
  })

  test('barrio inválido rechazado', async () => {
    const col = base(logueado())
    await assertFails(addDoc(col, opinion({ barrio: 'Gotham' })))
    await assertFails(addDoc(col, opinion({ barrio: '' })))
    await assertFails(addDoc(col, opinion({ barrio: 'boedo' })))
  })

  test('las reglas aceptan todas las categorías y barrios de la app', async () => {
    test.setTimeout(60_000)
    expect(CATEGORIAS).toHaveLength(7)
    expect(BARRIOS).toHaveLength(48)
    const col = base(logueado())
    for (const { id } of CATEGORIAS) await assertSucceeds(addDoc(col, opinion({ categoria: id })))
    for (const barrio of BARRIOS) await assertSucceeds(addDoc(col, opinion({ barrio })))
  })

  test('texto de 1 a 500 caracteres', async () => {
    const col = base(logueado())
    await assertFails(addDoc(col, opinion({ texto: '' })))
    await assertSucceeds(addDoc(col, opinion({ texto: 'x' })))
    await assertSucceeds(addDoc(col, opinion({ texto: 'x'.repeat(500) })))
    await assertFails(addDoc(col, opinion({ texto: 'x'.repeat(501) })))
    await assertFails(addDoc(col, opinion({ texto: 123 })))
  })

  test('el texto necesita al menos un carácter que no sea espacio', async () => {
    const col = base(logueado())
    await assertFails(addDoc(col, opinion({ texto: ' ' })))
    await assertFails(addDoc(col, opinion({ texto: '     ' })))
    await assertFails(addDoc(col, opinion({ texto: ' \n\t ' })))
    await assertSucceeds(addDoc(col, opinion({ texto: '  x  ' })))
  })

  test('campo extra rechazado', async () => {
    const col = base(logueado())
    await assertFails(addDoc(col, opinion({ email: 'vecina@example.com' })))
    await assertFails(addDoc(col, opinion({ id: 1 })))
  })

  test('el formato viejo ya no se puede escribir', async () => {
    await assertFails(addDoc(base(logueado()), VIEJO))
  })
})

test.describe('editar y borrar', () => {
  test.beforeEach(async () => {
    await sembrar('propia', { ...VIEJO, uid: UID, fecha: Timestamp.now() })
  })

  test('nadie puede editar, tampoco quien la escribió', async () => {
    await assertFails(updateDoc(doc(logueado(), 'comentarios/propia'), { texto: 'cambiado' }))
    await assertFails(updateDoc(doc(logueado('otra-persona'), 'comentarios/propia'), { texto: 'cambiado' }))
    await assertFails(updateDoc(doc(anonimo(), 'comentarios/propia'), { texto: 'cambiado' }))
  })

  const existe = async () => (await getDoc(doc(anonimo(), 'comentarios/propia'))).exists()

  test('quien la escribió puede borrarla', async () => {
    await assertSucceeds(deleteDoc(doc(logueado(), 'comentarios/propia')))
    expect(await existe()).toBe(false)
  })

  test('otra cuenta no puede borrarla', async () => {
    await assertFails(deleteDoc(doc(logueado('otra-persona'), 'comentarios/propia')))
    expect(await existe()).toBe(true)
  })

  test('un anónimo no puede borrarla', async () => {
    await assertFails(deleteDoc(doc(anonimo(), 'comentarios/propia')))
    expect(await existe()).toBe(true)
  })

  test('las opiniones viejas, sin uid, no las puede borrar nadie', async () => {
    await sembrar('vieja', VIEJO)
    for (const db of [anonimo(), logueado(), logueado('otra-persona')]) {
      await assertFails(deleteDoc(doc(db, 'comentarios/vieja')))
    }
    expect((await getDoc(doc(anonimo(), 'comentarios/vieja'))).exists()).toBe(true)
  })

  test('quien la borró no puede volver a editarla ni borrarla', async () => {
    await assertSucceeds(deleteDoc(doc(logueado(), 'comentarios/propia')))
    await assertFails(updateDoc(doc(logueado(), 'comentarios/propia'), { texto: 'otra vez' }))
  })
})

test.describe('leer', () => {
  test('lectura pública OK', async () => {
    await sembrar('uno', VIEJO)
    await assertSucceeds(getDoc(doc(anonimo(), 'comentarios/uno')))
    await assertSucceeds(getDocs(base(anonimo())))
  })

  test('cualquier otra colección está cerrada', async () => {
    for (const db of [anonimo(), logueado()]) {
      await assertFails(getDoc(doc(db, 'usuarios/uno')))
      await assertFails(setDoc(doc(db, 'usuarios/uno'), { a: 1 }))
      await assertFails(deleteDoc(doc(db, 'usuarios/uno')))
      await assertFails(deleteDoc(doc(db, 'comentarios/propia/respuestas/dos')))
      await assertFails(setDoc(doc(db, 'comentarios/uno/respuestas/dos'), { a: 1 }))
    }
  })
})

test.describe('compatibilidad con documentos viejos', () => {
  test('normaliza los dos formatos de fecha', () => {
    const iso = '2025-07-17T12:00:00.000Z'
    expect(normalizarFecha(iso)).toBe(iso)
    expect(normalizarFecha(Timestamp.fromDate(new Date(iso)))).toBe(iso)
    expect(normalizarFecha('no es una fecha')).toBeNull()
    expect(normalizarFecha(undefined)).toBeNull()
    expect(normalizarFecha(null)).toBeNull()
  })

  test('el comentario normalizado conserva el uid de las nuevas y no inventa uno en las viejas', () => {
    // La interfaz lo compara con el de la sesión para decidir si muestra "Borrar"
    expect(parsearComentario('a', { ...VIEJO, uid: UID, fecha: Timestamp.now() })).toMatchObject({ uid: UID })
    expect(parsearComentario('b', VIEJO)).not.toHaveProperty('uid')
    expect(parsearComentario('c', { ...VIEJO, uid: '' })).not.toHaveProperty('uid')
    expect(parsearComentario('d', { ...VIEJO, uid: 42 })).not.toHaveProperty('uid')
  })

  test('descarta lo que no se puede mostrar, sin romper', () => {
    expect(parsearComentario('a', { ...VIEJO, fecha: 123 })).toBeNull()
    expect(parsearComentario('a', { ...VIEJO, calificacion: 9 })).toBeNull()
    expect(parsearComentario('a', {})).toBeNull()
  })

  test('los comentarios nuevos no quedan tapados por los viejos', async () => {
    // 12 viejos, más que el límite: con un solo orderBy, los strings ocuparían todos los lugares
    for (let dia = 10; dia < 22; dia++) {
      await sembrar(`viejo-${dia}`, { ...VIEJO, fecha: `2025-07-${dia}T12:00:00.000Z` })
    }
    await sembrar('nuevo-1', { ...VIEJO, uid: UID, fecha: Timestamp.fromDate(new Date('2026-10-01T12:00:00Z')) })
    await sembrar('nuevo-2', { ...VIEJO, uid: UID, fecha: Timestamp.fromDate(new Date('2026-10-02T12:00:00Z')) })
    await sembrar('otra-categoria', { ...VIEJO, categoria: 'limpieza' })

    const recientes = await consultarRecientes(base(anonimo()), 'subte', 10)

    expect(recientes.map((c) => c.id).slice(0, 4)).toEqual(['nuevo-2', 'nuevo-1', 'viejo-21', 'viejo-20'])
    expect(recientes).toHaveLength(10)
    expect(recientes.every((c) => c.categoria === 'subte')).toBe(true)
    expect(recientes[0]?.fecha).toBe('2026-10-02T12:00:00.000Z')
  })

  test('un viejo más reciente que uno nuevo queda en su lugar', async () => {
    await sembrar('nuevo', { ...VIEJO, uid: UID, fecha: Timestamp.fromDate(new Date('2025-01-01T12:00:00Z')) })
    await sembrar('viejo', VIEJO)
    const recientes = await consultarRecientes(base(anonimo()), 'subte', 10)
    expect(recientes.map((c) => c.id)).toEqual(['viejo', 'nuevo'])
  })
})

test.describe('agregados del mapa y de los resultados', () => {
  // Fechas en hora local, igual que los límites de mes que calcula la app
  const el = (mes: number, dia: number) => new Date(2026, mes - 1, dia, 12)

  test.beforeEach(async () => {
    const nueva = (categoria: string, barrio: string, calificacion: number, fecha: Date) => ({
      uid: UID,
      texto: 'x',
      categoria,
      barrio,
      calificacion,
      fecha: Timestamp.fromDate(fecha),
    })
    // Documento del sitio anterior: fecha como string y sin barrio
    await sembrar('vieja', { texto: 'x', categoria: 'subte', calificacion: 3, fecha: el(9, 10).toISOString() })
    await sembrar('a', nueva('subte', 'Boedo', 5, el(10, 5)))
    await sembrar('b', nueva('subte', 'Boedo', 4, el(10, 20)))
    await sembrar('c', nueva('subte', 'Almagro', 1, el(11, 2)))
    await sembrar('d', nueva('limpieza', 'Boedo', 2, el(11, 3)))
  })

  test('panorama: distribución general y promedio por tema', async () => {
    const panorama = await consultarPanorama(base(anonimo()))
    expect(panorama.general).toEqual({ total: 5, promedio: 3, distribucion: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 } })
    expect(panorama.categorias).toHaveLength(7)
    expect(panorama.categorias.find((c) => c.id === 'subte')).toEqual({ id: 'subte', total: 4, promedio: 3.25 })
    expect(panorama.categorias.find((c) => c.id === 'limpieza')).toEqual({ id: 'limpieza', total: 1, promedio: 2 })
    expect(panorama.categorias.find((c) => c.id === 'verdes')).toEqual({ id: 'verdes', total: 0, promedio: 0 })
  })

  test('el resumen de una categoría coincide con el panorama', async () => {
    const resumen = await consultarResumen(base(anonimo()), 'subte')
    expect(resumen).toEqual({ total: 4, promedio: 3.25, distribucion: { 1: 1, 2: 0, 3: 1, 4: 1, 5: 1 } })
  })

  test('evolución mensual: suma los dos formatos de fecha', async () => {
    const puntos = await consultarEvolucion(base(anonimo()), 4, el(11, 15))
    expect(puntos).toEqual([
      { mes: '2026-08', total: 0, promedio: null },
      { mes: '2026-09', total: 1, promedio: 3 },
      { mes: '2026-10', total: 2, promedio: 4.5 },
      { mes: '2026-11', total: 2, promedio: 1.5 },
    ])
  })

  test('evolución mensual: sin documentos viejos en el período', async () => {
    const puntos = await consultarEvolucion(base(anonimo()), 2, el(11, 15))
    expect(puntos).toEqual([
      { mes: '2026-10', total: 2, promedio: 4.5 },
      { mes: '2026-11', total: 2, promedio: 1.5 },
    ])
  })

  test('barrios: promedio y cantidad por barrio dentro de un tema', async () => {
    const barrios = await consultarBarrios(base(anonimo()), 'subte')
    expect(barrios).toHaveLength(48)
    expect(barrios.find((b) => b.barrio === 'Boedo')).toEqual({ barrio: 'Boedo', total: 2, promedio: 4.5 })
    expect(barrios.find((b) => b.barrio === 'Almagro')).toEqual({ barrio: 'Almagro', total: 1, promedio: 1 })
    expect(barrios.filter((b) => b.total > 0)).toHaveLength(2)
  })
})

test.describe('mis opiniones', () => {
  const nueva = (uid: string, calificacion: number, fecha: Date, categoria = 'subte') => ({
    uid,
    texto: `Opinión de ${uid}`,
    categoria,
    calificacion,
    fecha: Timestamp.fromDate(fecha),
  })

  test.beforeEach(async () => {
    // Una opinión vieja, sin uid, y tres de la cuenta, en meses y temas distintos
    await sembrar('vieja', { ...VIEJO, fecha: new Date(2025, 6, 17, 12).toISOString() })
    await sembrar('a', nueva(UID, 5, new Date(2026, 9, 5, 12)))
    await sembrar('b', nueva(UID, 3, new Date(2026, 7, 20, 12), 'limpieza'))
    await sembrar('c', nueva(UID, 1, new Date(2026, 10, 2, 12), 'verdes'))
    await sembrar('ajena', nueva('otra-persona', 4, new Date(2026, 10, 3, 12)))
  })

  test('trae solo las de la cuenta, de la más nueva a la más vieja', async () => {
    const mias = await consultarMisOpiniones(base(logueado()), UID)
    expect(mias.map((o) => o.id)).toEqual(['c', 'a', 'b'])
    expect(mias.every((o) => o.uid === UID)).toBe(true)
    expect(mias[0]).toMatchObject({ categoria: 'verdes', calificacion: 1, fecha: new Date(2026, 10, 2, 12).toISOString() })
  })

  test('respeta el límite', async () => {
    const mias = await consultarMisOpiniones(base(logueado()), UID, 2)
    expect(mias.map((o) => o.id)).toEqual(['c', 'a'])
  })

  test('una cuenta sin opiniones recibe una lista vacía', async () => {
    expect(await consultarMisOpiniones(base(logueado('nueva')), 'nueva')).toEqual([])
  })

  test('la opinión borrada desaparece de la lista', async () => {
    await assertSucceeds(deleteDoc(doc(logueado(), 'comentarios/a')))
    const mias = await consultarMisOpiniones(base(logueado()), UID)
    expect(mias.map((o) => o.id)).toEqual(['c', 'b'])
  })

  test('no se puede borrar una que figura en la lista de otra cuenta', async () => {
    await assertFails(deleteDoc(doc(logueado(UID), 'comentarios/ajena')))
    expect((await getDoc(doc(anonimo(), 'comentarios/ajena'))).exists()).toBe(true)
  })
})
