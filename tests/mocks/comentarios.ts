// Reemplaza a src/services/comentarios.ts en el build --mode e2e. `contrato` hace que tsc falle si se desalinean.
import type { CategoriaId } from '../../src/data/categorias'
import type * as Real from '../../src/services/comentarios'
import { ErrorServicio, type Comentario, type NuevoComentario, type ResumenCategoria } from '../../src/services/types'
import { escenario, esperar } from './escenario'

async function preparar(): Promise<void> {
  const e = escenario()
  await esperar(e.datos === 'lento' ? 60_000 : 30)
  if (e.errorUnaVez) throw new ErrorServicio('No pudimos conectarnos. Revisá tu internet y volvé a intentar.', 'unavailable')
  if (e.datos === 'error') throw new ErrorServicio('No pudimos conectarnos. Revisá tu internet y volvé a intentar.', 'unavailable')
}

export async function obtenerResumen(_categoria: CategoriaId): Promise<ResumenCategoria> {
  await preparar()
  if (escenario().datos === 'vacio') return { total: 0, promedio: 0, distribucion: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } }
  const distribucion = { 1: 3, 2: 5, 3: 12, 4: 40, 5: 68 }
  return { total: 128, promedio: (3 + 10 + 36 + 160 + 340) / 128, distribucion }
}

export async function obtenerRecientes(categoria: CategoriaId): Promise<Comentario[]> {
  await preparar()
  if (escenario().datos === 'vacio') return []
  return [
    {
      id: 'nuevo',
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
}

export async function publicarComentario(nuevo: NuevoComentario): Promise<void> {
  const e = escenario()
  await esperar()
  if (e.envio === 'error') throw new ErrorServicio('No tenés permiso para hacer esto. Probá volver a ingresar.', 'permission-denied')
  ;(e.publicados ??= []).push(nuevo)
}

export const contrato = {
  obtenerResumen,
  obtenerRecientes,
  publicarComentario,
} satisfies typeof Real
